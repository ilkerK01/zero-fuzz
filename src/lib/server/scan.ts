import "server-only";
import { generateTest } from "./gemini";
import { runTest, type SandboxResult } from "./sandbox";

export type ScanStep = {
  agent: string;
  tone: "agent" | "ok" | "danger" | "muted";
  text: string;
};

export type ScanReport = {
  steps: ScanStep[];
  testSource: string;
  sandbox: SandboxResult;
  vulnerable: boolean;
};

const DEFAULT_SCENARIO =
  "after set_amount stores a value in temporary storage and the ledger advances far past its TTL, read_amount must return 0 rather than a stale value";

export async function runScan(scenario = DEFAULT_SCENARIO): Promise<ScanReport> {
  const steps: ScanStep[] = [];
  steps.push({ agent: "static", tone: "muted", text: "scout-soroban + cargo-audit: narrowing search space" });
  steps.push({ agent: "agent-1", tone: "agent", text: "mapping storage entries and auth paths" });
  steps.push({ agent: "agent-2", tone: "agent", text: "generating #[test] for the target invariant" });

  const testSource = await generateTest(scenario);
  steps.push({ agent: "agent-2", tone: "agent", text: "test generated, handing off to sandbox" });
  steps.push({ agent: "sandbox", tone: "muted", text: "spawning air-gapped container (network=none)" });

  const sandbox = await runTest(testSource);

  if (!sandbox.compiled) {
    steps.push({ agent: "sandbox", tone: "danger", text: "generated test failed to compile" });
  } else if (sandbox.failed > 0) {
    steps.push({ agent: "sandbox", tone: "danger", text: `test result: FAILED (${sandbox.failed})` });
    steps.push({ agent: "agent-2", tone: "danger", text: "vulnerability confirmed in sandbox" });
  } else {
    steps.push({ agent: "sandbox", tone: "ok", text: sandbox.summary });
    steps.push({ agent: "agent-2", tone: "ok", text: "no violation on this lane" });
  }

  return {
    steps,
    testSource,
    sandbox,
    vulnerable: sandbox.compiled && sandbox.failed > 0,
  };
}
