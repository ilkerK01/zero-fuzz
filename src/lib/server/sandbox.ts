import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const IMAGE = "zf-sandbox:base";
const TIMEOUT_MS = 120_000;

export type SandboxResult = {
  passed: boolean;
  failed: number;
  compiled: boolean;
  summary: string;
  log: string[];
  errors: string;
};

export type SandboxMode = "remote" | "docker" | "none";

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function remoteConfig() {
  const url = process.env.ZF_SANDBOX_URL;
  const key = process.env.ZF_SANDBOX_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

function extractErrors(output: string): string {
  const lines = output.split("\n");
  const start = lines.findIndex((l) => /error/i.test(l));
  if (start === -1) return "";
  const excerpt = lines
    .slice(start, start + 60)
    .join("\n")
    .trim();
  return excerpt.slice(0, 4000);
}

function parse(raw: string): SandboxResult {
  const output = stripAnsi(raw);
  const compiled = !/error\[|could not compile/.test(output);
  let failed = 0;
  let okCount = 0;
  for (const m of output.matchAll(/test result: (ok|FAILED)\. (\d+) passed; (\d+) failed/g)) {
    okCount += Number(m[2]);
    failed += Number(m[3]);
  }

  const log = output
    .split("\n")
    .map((l) => l.trim())
    .filter((l) =>
      /test .* \.\.\.|test result:|panicked at|assertion|left:|right:|Compiling|error\[/.test(l),
    )
    .slice(0, 40);

  return {
    passed: compiled && failed === 0 && okCount > 0,
    failed,
    compiled,
    summary: !compiled
      ? "compile error"
      : failed > 0
        ? `${failed} test(s) failed`
        : `${okCount} test(s) passed`,
    log,
    errors: compiled ? "" : extractErrors(output),
  };
}

async function dockerPresent(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("docker", ["version", "--format", "{{.Server.Version}}"], { timeout: 4000, windowsHide: true }, (err) =>
      resolve(!err),
    );
  });
}

export async function sandboxMode(): Promise<SandboxMode> {
  if (remoteConfig()) return "remote";
  if (await dockerPresent()) return "docker";
  return "none";
}

export async function warmRemote(): Promise<boolean> {
  const remote = remoteConfig();
  if (!remote) return false;
  try {
    const res = await fetch(`${remote.url}/health`, { signal: AbortSignal.timeout(90_000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function runRemote(testSource: string, contractSource?: string): Promise<SandboxResult> {
  const remote = remoteConfig();
  if (!remote) throw new Error("remote sandbox is not configured");
  const res = await fetch(`${remote.url}/run`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-zf-key": remote.key },
    body: JSON.stringify({ test: testSource, contract: contractSource }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => ({}))) as { output?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `sandbox service returned ${res.status}`);
  }
  return parse(data.output ?? "");
}

async function runDocker(testSource: string, contractSource?: string): Promise<SandboxResult> {
  const dir = await mkdtemp(join(tmpdir(), "zf-sbx-"));
  const testFile = join(dir, "gen.rs");
  await writeFile(testFile, testSource, "utf8");

  const mounts = ["-v", `${testFile}:/work/tests/gen.rs:ro`];
  if (contractSource) {
    const contractFile = join(dir, "lib.rs");
    await writeFile(contractFile, contractSource, "utf8");
    mounts.push("-v", `${contractFile}:/work/src/lib.rs:ro`);
  }

  const args = [
    "run",
    "--rm",
    "--network",
    "none",
    "--cpus",
    "1",
    "--memory",
    "2g",
    ...mounts,
    IMAGE,
    "timeout",
    "90",
    "cargo",
    "test",
    "--offline",
    "--color",
    "never",
  ];

  try {
    const output = await new Promise<string>((resolve) => {
      execFile(
        "docker",
        args,
        { timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
        (_err, stdout, stderr) => resolve(`${stdout}\n${stderr}`),
      );
    });
    return parse(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function runTest(testSource: string, contractSource?: string): Promise<SandboxResult> {
  const mode = await sandboxMode();
  if (mode === "remote") return runRemote(testSource, contractSource);
  if (mode === "docker") return runDocker(testSource, contractSource);
  throw new Error("no sandbox available");
}
