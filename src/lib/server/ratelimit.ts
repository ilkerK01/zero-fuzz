import "server-only";

const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX_REQUESTS = 4;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_MAX_REQUESTS = 40;
const MAX_TRACKED_IPS = 2000;

const ipTimestamps = new Map<string, number[]>();
const globalTimestamps: number[] = [];

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((ts) => now - ts < windowMs);
}

function retryAfterFor(timestamps: number[], windowMs: number, now: number): number {
  const oldest = timestamps[0];
  const elapsed = now - oldest;
  const remainingMs = windowMs - elapsed;
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

function enforceMapCap(): void {
  while (ipTimestamps.size > MAX_TRACKED_IPS) {
    const oldestKey = ipTimestamps.keys().next().value;
    if (oldestKey === undefined) break;
    ipTimestamps.delete(oldestKey);
  }
}

export function takeScanSlot(ip: string): { ok: true } | { ok: false; retryAfterSeconds: number; scope: "ip" | "global" } {
  const now = Date.now();

  const prunedGlobal = prune(globalTimestamps, GLOBAL_WINDOW_MS, now);
  globalTimestamps.length = 0;
  globalTimestamps.push(...prunedGlobal);

  const existingIpTimestamps = ipTimestamps.get(ip) ?? [];
  const prunedIp = prune(existingIpTimestamps, IP_WINDOW_MS, now);

  if (prunedIp.length >= IP_MAX_REQUESTS) {
    ipTimestamps.set(ip, prunedIp);
    return { ok: false, retryAfterSeconds: retryAfterFor(prunedIp, IP_WINDOW_MS, now), scope: "ip" };
  }

  if (globalTimestamps.length >= GLOBAL_MAX_REQUESTS) {
    ipTimestamps.set(ip, prunedIp);
    return { ok: false, retryAfterSeconds: retryAfterFor(globalTimestamps, GLOBAL_WINDOW_MS, now), scope: "global" };
  }

  prunedIp.push(now);
  ipTimestamps.set(ip, prunedIp);
  enforceMapCap();
  globalTimestamps.push(now);

  return { ok: true };
}
