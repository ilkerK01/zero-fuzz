import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const IMAGE = "zf-sandbox:base";
const TIMEOUT_MS = 30_000;

export type SandboxResult = {
  passed: boolean;
  failed: number;
  compiled: boolean;
  summary: string;
  log: string[];
};

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

export async function dockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("docker", ["version", "--format", "{{.Server.Version}}"], { timeout: 4000, windowsHide: true }, (err) =>
      resolve(!err),
    );
  });
}

export async function runTest(testSource: string): Promise<SandboxResult> {
  const dir = await mkdtemp(join(tmpdir(), "zf-sbx-"));
  const file = join(dir, "gen.rs");
  await writeFile(file, testSource, "utf8");

  const args = [
    "run",
    "--rm",
    "--network",
    "none",
    "--cpus",
    "1",
    "--memory",
    "1g",
    "-v",
    `${file}:/work/tests/gen.rs:ro`,
    IMAGE,
  ];

  try {
    const output = await new Promise<string>((resolve) => {
      execFile(
        "docker",
        args,
        { timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
        (_err, stdout, stderr) => resolve(stripAnsi(`${stdout}\n${stderr}`)),
      );
    });

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
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
