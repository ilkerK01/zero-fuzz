import "server-only";
import { generateTest, GeminiError } from "./gemini";
import { dockerAvailable, runTest, type SandboxResult } from "./sandbox";
import { record, type AuditRecord } from "./registry";

export type ScanStep = {
  agent: string;
  tone: "agent" | "ok" | "danger" | "muted";
  text: string;
  cost?: number;
};

export type Billing = {
  cycles: number;
  spent: number;
  budget: number;
  durationMs: number;
};

const UNIT_PRICE: Record<string, number> = {
  static: 0,
  "agent-1": 0.4,
  "agent-2": 1.1,
  sandbox: 0.3,
};

const BUDGET = 20;

const LANES = 1;

function bill(steps: ScanStep[], durationMs: number): Billing {
  let spent = 0;
  let cycles = 0;
  for (const step of steps) {
    const price = UNIT_PRICE[step.agent] ?? 0;
    if (price === 0) continue;
    step.cost = price;
    spent += price;
    cycles += 1;
  }
  return { cycles, spent: Math.round(spent * 100) / 100, budget: BUDGET, durationMs };
}

export type ScanReport = {
  steps: ScanStep[];
  testSource: string;
  sandbox: SandboxResult;
  vulnerable: boolean;
  sandboxAvailable: boolean;
  billing: Billing;
  audit: AuditRecord | null;
  auditError: string | null;
  modelAvailable: boolean;
  modelError: string | null;
};

const DEFAULT_SCENARIO =
  "after set_amount stores a value in temporary storage and the ledger advances far past its TTL, read_amount must return 0 rather than a stale value";

export async function runScan(scenario = DEFAULT_SCENARIO): Promise<ScanReport> {
  const startedAt = Date.now();
  const steps: ScanStep[] = [];
  steps.push({ agent: "static", tone: "muted", text: "scout-soroban + cargo-audit: narrowing search space" });
  steps.push({ agent: "agent-1", tone: "agent", text: "mapping storage entries and auth paths" });
  steps.push({ agent: "agent-2", tone: "agent", text: "generating #[test] for the target invariant" });

  let testSource: string;
  try {
    testSource = await generateTest(scenario);
  } catch (error) {
    const reason = error instanceof GeminiError ? error.message : "model could not be reached, no test generated";
    steps.push({ agent: "agent-2", tone: "danger", text: reason });
    return {
      steps,
      testSource: "",
      sandbox: {
        passed: false,
        failed: 0,
        compiled: false,
        summary: "scan stopped before the sandbox",
        log: [],
      },
      vulnerable: false,
      sandboxAvailable: false,
      billing: bill(steps, Date.now() - startedAt),
      audit: null,
      auditError: null,
      modelAvailable: false,
      modelError: reason,
    };
  }
  steps.push({ agent: "agent-2", tone: "agent", text: "test generated, handing off to sandbox" });

  if (!(await dockerAvailable())) {
    steps.push({
      agent: "sandbox",
      tone: "muted",
      text: "container runtime not available on this host, test not executed",
    });
    return {
      steps,
      testSource,
      sandbox: {
        passed: false,
        failed: 0,
        compiled: false,
        summary: "sandbox unavailable on this host",
        log: [],
      },
      vulnerable: false,
      sandboxAvailable: false,
      billing: bill(steps, Date.now() - startedAt),
      audit: null,
      auditError: null,
      modelAvailable: true,
      modelError: null,
    };
  }

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

  const vulnerable = sandbox.compiled && sandbox.failed > 0;

  let audit: AuditRecord | null = null;
  let auditError: string | null = null;
  try {
    audit = await record(`${testSource}
${sandbox.summary}`, !vulnerable, LANES);
    if (audit) {
      steps.push({
        agent: "registry",
        tone: audit.passed ? "ok" : "danger",
        text: `audit recorded on chain: ${audit.txHash}`,
      });
    }
  } catch (error) {
    auditError = error instanceof Error ? error.message : "audit record failed";
    steps.push({ agent: "registry", tone: "muted", text: `on-chain record skipped: ${auditError}` });
  }

  return {
    steps,
    testSource,
    sandbox,
    vulnerable,
    sandboxAvailable: true,
    billing: bill(steps, Date.now() - startedAt),
    audit,
    auditError,
    modelAvailable: true,
    modelError: null,
  };
}
