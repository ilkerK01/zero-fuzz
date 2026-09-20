import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runScan } from "@/lib/server/scan";
import { takeScanSlot } from "@/lib/server/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_CONTRACT_BYTES = 256 * 1024;
const MAX_NAME_LENGTH = 80;
const DEFAULT_NAME = "contract.rs";

function sanitizeName(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_NAME;
  const base = raw.replace(/^.*[\\/]/, "").trim();
  if (!base) return DEFAULT_NAME;
  return base.slice(0, MAX_NAME_LENGTH);
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { contract?: unknown; name?: unknown };

    let scanParams: { contract: string; name: string } | undefined;

    if (body.contract === undefined || body.contract === "") {
      scanParams = undefined;
    } else {
      if (typeof body.contract !== "string") {
        return NextResponse.json({ error: "contract must be a string" }, { status: 400 });
      }

      const contract = body.contract;
      const byteLength = Buffer.byteLength(contract, "utf8");
      if (byteLength > MAX_CONTRACT_BYTES) {
        return NextResponse.json({ error: "contract exceeds the 256KB limit" }, { status: 400 });
      }
      if (!contract.includes("soroban_sdk") || !contract.includes("#[contract]")) {
        return NextResponse.json(
          { error: "contract does not look like a Soroban contract (missing soroban_sdk or #[contract])" },
          { status: 400 },
        );
      }

      const name = sanitizeName(body.name);
      scanParams = { contract, name };
    }

    const ip = getClientIp(req);
    const slot = takeScanSlot(ip);
    if (!slot.ok) {
      const message =
        slot.scope === "ip"
          ? `Too many scans from this address. Try again in ${slot.retryAfterSeconds} seconds.`
          : `The scanner is busy right now. Try again in ${slot.retryAfterSeconds} seconds.`;
      return NextResponse.json(
        { error: message, retryAfterSeconds: slot.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(slot.retryAfterSeconds) } },
      );
    }

    const report = scanParams ? await runScan(scanParams) : await runScan();
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
