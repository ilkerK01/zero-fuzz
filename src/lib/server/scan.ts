import "server-only";
import { generateTest, invariantOf, GeminiError } from "./gemini";
import { runTest, sandboxMode, warmRemote, type SandboxResult } from "./sandbox";
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

const MODEL_CALL_PRICE = 1.1;
const SANDBOX_RUN_PRICE = 0.3;

const BUDGET = 20;

const LANES = 1;

function bill(steps: ScanStep[], durationMs: number): Billing {
  let spent = 0;
  let cycles = 0;
  for (const step of steps) {
    if (!step.cost) continue;
    spent += step.cost;
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
  target: string;
  uploaded: boolean;
  invariant: string | null;
};

const DEFAULT_SCENARIO =
  "after set_amount stores a value in temporary storage and the ledger advances far past its TTL, read_amount must return 0 rather than a stale value";

const EMPTY_SANDBOX: SandboxResult = {
  passed: false,
  failed: 0,
  compiled: false,
  summary: "scan stopped before the sandbox",
  log: [],
  errors: "",
};

function pushInvariant(steps: ScanStep[], testSource: string): string | null {
  const invariant = invariantOf(testSource);
  if (invariant) {
    steps.push({ agent: "agent", tone: "muted", text: `invariant: ${invariant}` });
  }
  return invariant;
}

async function attempt(testSource: string, contract?: string): Promise<SandboxResult | string> {
  try {
    return await runTest(testSource, contract);
  } catch (error) {
    return error instanceof Error ? error.message : "sandbox did not respond";
  }
}

const NOT_RUN: SandboxResult = {
  passed: false,
  failed: 0,
  compiled: false,
  summary: "sandbox did not respond, test not executed",
  log: [],
  errors: "",
};

export async function runScan(input?: { contract?: string; name?: string }): Promise<ScanReport> {
  const startedAt = Date.now();
  const steps: ScanStep[] = [];
  const contract = input?.contract;
  const uploaded = typeof contract === "string" && contract.length > 0;
  const target = uploaded ? (input?.name ?? "contract.rs") : "zf_harness (bundled example)";

  steps.push(
    uploaded
      ? { agent: "target", tone: "muted", text: `target: ${target} (uploaded)` }
      : { agent: "target", tone: "muted", text: "target: bundled example contract zf_harness" },
  );

  const modelStep: ScanStep = {
    agent: "agent",
    tone: "agent",
    text: "asking the model for a #[test] on the invariant",
  };
  steps.push(modelStep);

  let testSource: string;
  try {
    testSource = uploaded ? await generateTest({ contract }) : await generateTest({ scenario: DEFAULT_SCENARIO });
  } catch (error) {
    const reason = error instanceof GeminiError ? error.message : "model could not be reached, no test generated";
    steps.push({ agent: "agent", tone: "danger", text: reason });
    return {
      steps,
      testSource: "",
      sandbox: EMPTY_SANDBOX,
      vulnerable: false,
      sandboxAvailable: false,
      billing: bill(steps, Date.now() - startedAt),
      audit: null,
      auditError: null,
      modelAvailable: false,
      modelError: reason,
      target,
      uploaded,
      invariant: null,
    };
  }
  modelStep.cost = MODEL_CALL_PRICE;
  steps.push({ agent: "agent", tone: "agent", text: "test generated, handing off to sandbox" });

  let invariant = pushInvariant(steps, testSource);

  const mode = await sandboxMode();
  if (mode === "remote") {
    steps.push({ agent: "sandbox", tone: "muted", text: "waking the sandbox service" });
    await warmRemote();
  }

  if (mode === "none") {
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
        errors: "",
      },
      vulnerable: false,
      sandboxAvailable: false,
      billing: bill(steps, Date.now() - startedAt),
      audit: null,
      auditError: null,
      modelAvailable: true,
      modelError: null,
      target,
      uploaded,
      invariant,
    };
  }

  const runStep: ScanStep = {
    agent: "sandbox",
    tone: "muted",
    text: mode === "remote" ? "running the test in the sandbox service" : "spawning air-gapped container (network=none)",
  };
  steps.push(runStep);

  const first = await attempt(testSource, contract);
  if (typeof first === "string") {
    steps.push({ agent: "sandbox", tone: "danger", text: `sandbox did not respond, test not executed: ${first}` });
    return {
      steps,
      testSource,
      sandbox: NOT_RUN,
      vulnerable: false,
      sandboxAvailable: false,
      billing: bill(steps, Date.now() - startedAt),
      audit: null,
      auditError: null,
      modelAvailable: true,
      modelError: null,
      target,
      uploaded,
      invariant,
    };
  }
  let sandbox = first;
  runStep.cost = SANDBOX_RUN_PRICE;

  if (!sandbox.compiled) {
    steps.push({ agent: "sandbox", tone: "danger", text: "generated test did not compile, asking the model to fix it" });

    const retryStep: ScanStep = {
      agent: "agent",
      tone: "agent",
      text: "asking the model to fix the compile error",
    };
    steps.push(retryStep);

    let fixedTestSource: string;
    try {
      fixedTestSource = uploaded
        ? await generateTest({ contract, previousTest: testSource, compileErrors: sandbox.errors })
        : await generateTest({
            scenario: DEFAULT_SCENARIO,
            previousTest: testSource,
            compileErrors: sandbox.errors,
          });
    } catch (error) {
      const reason = error instanceof GeminiError ? error.message : "model could not be reached, no test generated";
      steps.push({ agent: "agent", tone: "danger", text: reason });
      steps.push({ agent: "agent", tone: "danger", text: "no verdict reached, the test did not compile" });
      return {
        steps,
        testSource,
        sandbox,
        vulnerable: false,
        sandboxAvailable: true,
        billing: bill(steps, Date.now() - startedAt),
        audit: null,
        auditError: null,
        modelAvailable: false,
        modelError: reason,
        target,
        uploaded,
        invariant,
      };
    }
    retryStep.cost = MODEL_CALL_PRICE;
    testSource = fixedTestSource;
    invariant = pushInvariant(steps, testSource);

    const retryRunStep: ScanStep = {
      agent: "sandbox",
      tone: "muted",
      text:
        mode === "remote"
          ? "running the fixed test in the sandbox service"
          : "spawning air-gapped container (network=none)",
    };
    steps.push(retryRunStep);

    const second = await attempt(testSource, contract);
    if (typeof second === "string") {
      steps.push({ agent: "sandbox", tone: "danger", text: `sandbox did not respond, test not executed: ${second}` });
      return {
        steps,
        testSource,
        sandbox: NOT_RUN,
        vulnerable: false,
        sandboxAvailable: false,
        billing: bill(steps, Date.now() - startedAt),
        audit: null,
        auditError: null,
        modelAvailable: true,
        modelError: null,
        target,
        uploaded,
        invariant,
      };
    }
    sandbox = second;
    retryRunStep.cost = SANDBOX_RUN_PRICE;

    if (!sandbox.compiled) {
      steps.push({ agent: "sandbox", tone: "danger", text: "generated test still did not compile" });
      steps.push({ agent: "agent", tone: "danger", text: "no verdict reached, the test did not compile" });
      return {
        steps,
        testSource,
        sandbox,
        vulnerable: false,
        sandboxAvailable: true,
        billing: bill(steps, Date.now() - startedAt),
        audit: null,
        auditError: null,
        modelAvailable: true,
        modelError: null,
        target,
        uploaded,
        invariant,
      };
    }
  }

  if (sandbox.failed > 0) {
    steps.push({ agent: "sandbox", tone: "danger", text: `test result: FAILED (${sandbox.failed})` });
    steps.push({ agent: "agent", tone: "danger", text: "vulnerability confirmed in sandbox" });
  } else {
    steps.push({ agent: "sandbox", tone: "ok", text: sandbox.summary });
    steps.push({ agent: "agent", tone: "ok", text: "no violation on this lane" });
  }

  const vulnerable = sandbox.compiled && sandbox.failed > 0;

  let audit: AuditRecord | null = null;
  let auditError: string | null = null;
  try {
    audit = await record(
      `${testSource}
${sandbox.summary}`,
      !vulnerable,
      LANES,
      uploaded ? contract : undefined,
    );
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
    target,
    uploaded,
    invariant,
  };
}
