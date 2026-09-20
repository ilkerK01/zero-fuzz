export type LogLine = {
  agent: string;
  tone: "agent" | "ok" | "danger" | "muted";
  text: string;
  cost?: number;
};

export const scanLog: LogLine[] = [
  { agent: "static", tone: "muted", text: "scout-soroban: 3 findings, 1 high — narrowing search space" },
  { agent: "static", tone: "muted", text: "cargo-audit: 0 advisories in dependency tree" },
  { agent: "agent-1", tone: "agent", text: "mapping AST + storage: instance=2 persistent=5 temporary=1", cost: 0.4 },
  { agent: "agent-1", tone: "agent", text: "isolating require_auth paths: 4 entrypoints", cost: 0.3 },
  { agent: "agent-1", tone: "agent", text: "storage lane: temporary entry `collateral` has no liveness guard", cost: 0.6 },
  { agent: "agent-2", tone: "agent", text: "generating #[test] for TTL expiry on `collateral`", cost: 1.1 },
  { agent: "sandbox", tone: "muted", text: "spawning air-gapped container rust:1.86 (network=none)", cost: 0.2 },
  { agent: "sandbox", tone: "muted", text: "cargo test --color always ... 2 passed" },
  { agent: "agent-2", tone: "agent", text: "binding target to local pool harness (zf_harness::RegistryPool)", cost: 1.4 },
  { agent: "agent-2", tone: "agent", text: "archiving `collateral` entry, advancing ledger past TTL", cost: 0.7 },
  { agent: "sandbox", tone: "muted", text: "cargo test test_resurrection_drain --color always", cost: 0.3 },
  { agent: "sandbox", tone: "danger", text: "test_resurrection_drain ... FAILED" },
  { agent: "agent-2", tone: "danger", text: "panic: over-borrow accepted on stale collateral (+412%)" },
  { agent: "agent-2", tone: "danger", text: "vulnerability confirmed — over-borrow reproduced in sandbox" },
];

export const finding = {
  name: "test_resurrection_drain",
  severity: "CRITICAL",
  cycles: 9,
  spent: 7.4,
  budget: 20,
  contract: "CCYUR433PJPGL2WQTANVFQCPUDG4GR55D2OKATMFTRITBJCUO4PMQ2U4",
  resultHash: "3f9a2c7e5b1d84a06f2e9c1b7d4a5e8c",
};

export const patch = {
  before: [
    "let collateral: i128 = env.storage()",
    "    .temporary()",
    "    .get(&Key::Collateral(user.clone()))",
    "    .unwrap_or(0);",
    "",
    "pool.borrow(&env, &user, collateral * 4);",
  ],
  after: [
    "let key = Key::Collateral(user.clone());",
    "if !env.storage().temporary().has(&key) {",
    "    panic_with_error!(&env, Error::CollateralArchived);",
    "}",
    "env.storage().temporary().extend_ttl(&key, 100, 100);",
    "let collateral: i128 = env.storage().temporary().get(&key).unwrap();",
    "pool.borrow(&env, &user, collateral * 4);",
  ],
};

export function estimateCredit(tryAmount: number) {
  return Math.round(tryAmount * 0.0204 * 100) / 100;
}
