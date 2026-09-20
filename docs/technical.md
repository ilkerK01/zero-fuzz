# Technical notes

The handbook asks that a project be technically understandable through the README, and it
is: architecture, components, Stellar integrations, design decisions, trade-offs and
challenges all live in [`../README.md`](../README.md). This file is an appendix for the two
things that did not fit there — the agent's prompt discipline and the sandbox threat model.

If anything here disagrees with the README, the README is correct.

## The agent is a test generator, not an auditor

The model is never asked to "find bugs". It is given one invariant in plain language and
asked for a single `#[test]` that violates it, compiled against the harness crate. The
output is constrained to a test block; prose is rejected rather than parsed.

The scenario the agent works from today:

> after `set_amount` stores a value in temporary storage and the ledger advances far past
> its TTL, `read_amount` must return 0 rather than a stale value

The harness (`sandbox/harness/src/lib.rs`) deliberately mirrors the same value into
persistent storage and falls back to it, so a naive read survives TTL expiry. The generated
test advances the ledger sequence and asserts the value is gone. It fails, because the
harness is wrong on purpose — that failure is the finding.

This is the whole design principle: **a finding is a failing test or it is not a finding.**
There is no confidence score, no severity heuristic, no "this might be exploitable". Either
the sandbox produced a red `cargo test` or the lane reports clean.

Cost of one scan: roughly 120 input and 200 output tokens against
`gemini-3.5-flash-lite`, which is why the metered price per cycle is measured in fractions
of a lira.

## Sandbox threat model

The sandbox executes model-generated Rust against a contract we did not write. Both are
untrusted.

| Control | Why |
|---|---|
| `network=none` | Generated code must not reach the anchor, the chain, the model API or the host network. This is also why real Blend v2 calls cannot simply be added — see the roadmap. |
| Read-only mount of the generated test | The test cannot rewrite the harness to make itself pass. |
| 30-second timeout | A generated test can trivially loop forever; the ledger-advance pattern makes it likely. |
| Container destroyed after every run | No state survives between scans, so one scan cannot poison the next. |
| Base image with deps pre-compiled | `sandbox/Dockerfile` pre-builds `soroban-sdk` so a scan is ~6s rather than a cold Rust build. |

What this does **not** defend against: a malicious contract that exhausts host disk through
the build cache, and resource limits are not set per container. Both are fine for a
single-tenant demo and would need `--memory`, `--cpus` and a disk quota before this ran for
anyone but us.

## Why contract tests run in a container too

Soroban test targets build as `cdylib`, which does not link on every host toolchain, while
`stellar contract build` targets wasm and does. Rather than ship a platform caveat, the repo
standardises on running every Rust test in `rust:1-slim`, so the result is the same on any
machine with Docker:

```bash
docker run --rm -v "$PWD/contracts/registry:/w" -w /w rust:1-slim \
  sh -c "rustup target add wasm32v1-none && cargo test"
```

The four registry tests (`records_and_reads_back`, `rescan_overwrites_previous_result`,
`failing_scan_is_not_audited`, `unknown_contract_is_not_audited`) pass there, and their
snapshots are committed under `contracts/registry/test_snapshots/`.
