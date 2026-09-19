# Technical documentation

## Architecture

Z-FUZZ is designed as four layers with strict isolation between the untrusted contract
under test and everything else.

```
Browser (Next.js)
  |  wallet connect, SEP-6 deposit, scan config, WebSocket log stream
  v
Orchestrator (Node.js + BullMQ + Redis)
  |  x402 metering, job queue, anchor client, stream fan-out
  v
Agent (hosted model API)
  |  atomic prompt chain: AST map -> auth paths -> scenario -> #[test]
  v
Sandbox (ephemeral container, network=none)
     cargo test against the target composed with Blend v2 / Soroswap
```

### Layer 1 — Frontend

Next.js App Router, React 19, Tailwind 4. All screens are client components because the
product surface is driven by live state (streaming logs, scan progress, budget depletion).
Language state is shared through a context backed by `useSyncExternalStore` so a stored
preference does not cause a hydration mismatch.

### Layer 2 — Orchestrator (planned)

Node.js with BullMQ over Redis. One scan is one job; each agent cycle and each sandbox run
is a billable unit. An x402 middleware deducts from the user's TRYC balance per unit and
halts the job when the budget is exhausted.

### Layer 3 — Agent (planned)

A hosted model API drives an **atomic prompt chain** rather than a single "find bugs" call:

1. Map the AST, classify every storage entry as instance / persistent / temporary.
2. Isolate `Address::require_auth()` paths and state read/write points.
3. Generate a Soroban-specific scenario: expired TTL read, archived-entry access,
   resurrection with stale data, wrong storage class.
4. Generate a composability scenario that binds the target to a Blend v2 pool interface.

Output is constrained to a `#[test]` block, never free prose.

### Layer 4 — Sandbox (planned)

Ephemeral container, `network=none`, target plus protocol interfaces mounted, `cargo test`
run with a 30 second timeout, stdout/stderr captured, container destroyed.

---

## Design decisions and tradeoffs

### Static triage before the paid agent

Free, local, Soroban-aware tools run first: **Scout (`scout-soroban`)**, `cargo-audit`,
`clippy`. They narrow the search space so the metered agent only runs where something is
suspicious.

*Tradeoff:* adds a step and a dependency, but cuts cost per scan substantially and makes
the x402 pricing story defensible.

### Hosted model, not a local one

A local uncensored model was considered and rejected. A hosted API needs no GPU, no model
download and no VRAM budget, gives better code generation, and removes the single largest
setup risk. The task itself — writing a failing test that proves a bug in *the user's own
contract* — is ordinary defensive auditing and needs no special model.

*Tradeoff:* contract source leaves the machine. Acceptable for the hackathon; an on-prem
local model is the enterprise tier on the roadmap.

### Integration is load-bearing, not decorative

The headline finding is reproducible **only** when the target is composed with a Blend v2
pool. A contract that looks correct in isolation over-borrows against collateral read from
an archived entry. Removing Blend v2 removes the finding, which is the point.

### Mock data before real integrations

The product surface was built first so the end-to-end story is verifiable and the demo path
is fixed before any credential exists. Every mock is labelled in the README status table.

*Tradeoff:* nothing on chain yet. Mitigated by keeping the mock shapes identical to the
planned API responses, so wiring is substitution rather than rewrite.

### Seed corpus as demo insurance

A hand-written corpus of property tests and one known-class composability scenario exists
independently of model generation, so a live demo does not depend on a model call
succeeding. Live generation is additive.

### Typography as a semantic rule

Monospace is reserved for machine output — terminal lines, code, test names, transaction
hashes, contract addresses. Everything a human wrote is set in the interface typeface. The
rule makes "this came from the machine" readable at a glance.

### No gradients, glassmorphism or rounded friendly shapes

The surface is an inspection tool. Angular panels, flat fills, hard rim light, and a
restricted palette keyed to the product: cyan for agent activity, red for a confirmed
vulnerability, green for a passing contract.

---

## Known limitations

- Backend, agent and sandbox are specified but not implemented.
- The anchor deposit and x402 meter are interface only.
- No Soroban contract is deployed; no testnet address is published.
- Scan results are fixtures, not the output of a real run.
