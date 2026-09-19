# Z-FUZZ — Autonomous threat hunting for Soroban

**Let our agents break your contract before mainnet does.**

Z-FUZZ is an autonomous security auditor for Stellar/Soroban smart contracts. A developer
signs in with a passkey, funds a scan with Turkish Lira through a real SEP-6 anchor, and an
agent hunts the bug classes that EVM tooling structurally cannot reach. Every finding is a
**runnable Rust test that actually makes the contract fail** inside a sealed sandbox — not a
warning, a proof — followed by the patch that fixes it.

Rise In x Stellar Pro Hackathon, Istanbul · **Genesis track**

![Z-FUZZ landing](docs/screens/01-hero.png)

**Watch the demo:** [`docs/demo/zero-fuzz-demo.mp4`](docs/demo/zero-fuzz-demo.mp4) — 1:26, narrated
and subtitled. A wallet is connected, the SEP-10 challenge is signed in Freighter, a scan runs,
and the contract actually fails inside the sandbox.

---

## Try it

```
npm install
npm run setup      # creates a testnet account, funds it, opens the USDC trustline
npm run dev        # http://localhost:3100
```

`npm run setup` writes `.env.local` (git-ignored). To also drive the agent and sandbox, add
a `GEMINI_API_KEY` and make sure Docker is running.

---

## Why this exists

Soroban has a state model the EVM never had. Entries carry a **time-to-live**. When it
lapses the entry is **archived** — unreadable, but not gone. It can later be **restored**,
and a contract that reads it without checking liveness gets a value that looks fine and is
months stale.

Foundry, Echidna and Medusa cannot model any of this. Not because they are weak, but
because on the EVM there is nothing to model: no TTL, no archival, no resurrection, no
choice between instance, persistent and temporary storage. Every Soroban-specific failure
mode falls outside what the mature tooling can even express.

And the expensive failures are not in one contract. They appear when a correct-looking
contract is **composed** with a live protocol:

> On 22 February 2026 a YieldBlox community pool built on Blend V2 read a stale oracle
> value. A single transaction moved the price from \$1 to \$107 and drained **\$10.2M**.
> The contract was not wrong in isolation. It was wrong in company.

Manual audits catch these. They also cost upwards of \$8,000 and take weeks — which is why
most contracts reach mainnet having had neither.

---

## How the hackathon requirements are met

The Genesis and Scale tracks are judged on the same three requirements. Here is exactly how
Z-FUZZ satisfies each, and where the evidence is.

| Requirement | How Z-FUZZ meets it | Status |
|---|---|---|
| **Integration** — build on an eligible Stellar protocol | The composability lane fuzzes the target contract **against a live Blend v2 lending pool and Soroswap price** (the headline finding cannot be reproduced without Blend v2), and users connect their own wallet through **Stellar Wallets Kit** (Freighter, xBull, Albedo, Hana) to sign SEP-10 themselves. | Load-bearing by design |
| **Anchor / Local Payments** — a real fiat rail | SEP-10 auth + SEP-6 deposit against the TR mock anchor. A developer deposits **TRY** and receives **USDC** on Stellar testnet, on chain. | **Live, verified on chain** |
| **Core Feature** — the integration carries the product | Removing Blend v2 removes the headline vulnerability. The scan is the product; the integration is where the bug lives. | Load-bearing by design |

### Anchor evidence (real testnet transactions)

The anchor leg is not a mock. A deposit authenticates over SEP-10, opens a SEP-6 deposit,
settles, and USDC arrives on chain.

| TRY in | USDC out | Transaction |
|---|---|---|
| 1,000 | 20.3960908 | [`7f1672a9…c287`](https://stellar.expert/explorer/testnet/tx/7f1672a94d5de65d205bb69e89fb807b7401ec332f517a8f3e2e1c505be5c287) |
| 500 | 10.1980454 | [`b0d04ff5…4749`](https://stellar.expert/explorer/testnet/tx/b0d04ff5cfb6417fe982594e68d64dfb143dbb7a0d2ef84ef299ac1ade2a4749) |
| 200 | 4.0792181 | [`fac32138…da4f`](https://stellar.expert/explorer/testnet/tx/fac32138ea93d230a8c22ed91e043103b51f5a0bbbcb9e332876f5c607f7da4f) |

Account: [`GDCASV6Z…56DI`](https://stellar.expert/explorer/testnet/account/GDCASV6ZLIMNVIAHPXMXSS7UGS3ONPOC37TODIZKI5F3CMWBHQ7O56DI)

### Soroban contract, deployed and verified on testnet

The audit registry writes each scan result on chain, which is what the Z-FUZZ Audited stamp
resolves to. Source: [`contracts/registry`](contracts/registry) · 4 unit tests, soroban-sdk 28.

| Item | Value |
|---|---|
| Contract | [`CANPTYOSSNRLY65FHFK5M4XFDZKSNRF36FMRSB3LGCHTV5F25K7JI6DZ`](https://stellar.expert/explorer/testnet/contract/CANPTYOSSNRLY65FHFK5M4XFDZKSNRF36FMRSB3LGCHTV5F25K7JI6DZ) |
| Wasm hash | `830ceac9398cfa94814090625d905e8faa26ee6be905e82465876aead15b1427` |
| Deploy tx | [`fdb63979…bb55`](https://stellar.expert/explorer/testnet/tx/fdb63979e331a349c52c7c4af1bf2ff7ef40099f2c9b63421bc9b8294afabb55) |
| First audit written | [`9bfb6d2a…f059e`](https://stellar.expert/explorer/testnet/tx/9bfb6d2a5e494083519ad230450adb66ab81e49edfa5addb76ddc554a62f059e) |

```
record(wasm_hash, result_hash, passed, lanes) -> Audit   // writes + emits an `audit` event
get(wasm_hash) -> Option<Audit>
is_audited(wasm_hash) -> bool                            // returns true on chain today
```

### skills.stellar.org files used

The handbook requires each submission to state which skill files were used.

| Skill file | How it shaped the build |
|---|---|
| Anchors / SEP flows | SEP-10 session and SEP-6 deposit shape — the deposit screen, TRY→USDC settlement and the `simulate-bank-transfer` step. |
| `agentic-payments/SKILL.md` | The x402 metering model: per-cycle billing, budget exhaustion and the `Budget Exceeded` halt shown in the terminal. |
| Integration Finder | Selecting Blend v2 and Soroswap as the composability targets from the eligible partner list. |

---

## What makes Z-FUZZ different

### It runs the exploit instead of describing it

Static analysers and LLM triage produce findings that *might* be real. Z-FUZZ composes the
contract, drives its state machine into the dangerous configuration and runs `cargo test`
in a sealed container. A finding exists only when a test actually failed.

![Live agent terminal](docs/screens/02-terminal.png)

The sandbox is real: an ephemeral container, `network=none`, a 30-second timeout, destroyed
after every run. Verified output from a genuine run:

```
test detects_the_bug ... FAILED
thread 'detects_the_bug' panicked at tests/gen.rs:13:5:
assertion `left == right` failed: over-borrow: stale collateral accepted
  left: 100
 right: 0
test result: FAILED. 0 passed; 1 failed
```

### It hunts Soroban's own bug classes

| Lane | What it drives the contract into |
|---|---|
| State lifecycle | TTL expiry, archival, resurrection, storage-class misuse |
| Composability | Live Blend v2 lending and Soroswap price interaction |
| Authorization | `require_auth` coverage, missing signer checks |
| Arithmetic | `i128` overflow, rounding drift, precision loss |
| Storage misuse | instance vs persistent vs temporary chosen wrong |
| Upgrade paths | unprotected updates, admin takeover, layout drift |

### Free tools first, paid agent second

`scout-soroban`, `cargo-audit` and `clippy` run before the agent and narrow the search
space, so the metered agent only works where something is already suspicious. A full scan
costs roughly 7.4 TRYC instead of an audit invoice.

### It ends with a fix, not a scare

Every finding ships a proposed patch and, once the contract passes, an on-chain
Z-FUZZ Audited stamp whose result hash anyone can verify.

![Proposed patch](docs/screens/03-patch.png)

![Audit certificate](docs/screens/04-certificate.png)

### No passwords, no seed phrase

Sign-in is a passkey (WebAuthn). The device signs a challenge with Face ID, Touch ID or a
security key, and the private key never leaves it.

---

## Architecture

```
Browser (Next.js)
   passkey sign-in, SEP-6 deposit, scan config, live log stream
        |
        v
Orchestrator (Node.js)
   SEP-10 + SEP-6 anchor client, x402 metering, stream fan-out
        |
        v
Agent (Gemini 3.5 Flash-Lite)
   static triage -> AST map -> Soroban scenario -> #[test]
        |
        v
Sandbox (ephemeral Docker container, network=none)
   cargo test, target composed with Blend v2 / Soroswap, destroyed after 30s
```

Full reasoning and tradeoffs: [`docs/technical.md`](docs/technical.md).

---

## What actually works today

Z-FUZZ is honest about its state. Nothing below is claimed that does not run.

| Component | Status |
|---|---|
| Frontend, 8 screens, EN/TR | Working |
| Passkey sign-in (WebAuthn) | Working |
| Wallet connect (Stellar Wallets Kit) + client-signed SEP-10 | Working |
| SEP-10 authentication | Working, live on testnet |
| SEP-6 anchor deposit, TRY → USDC | Working, settles on chain |
| Docker sandbox, `cargo test` offline | Working (soroban-sdk 28, `network=none`) |
| Gemini agent, generates Rust tests | Working (`gemini-3.5-flash-lite`) |
| Agent → sandbox full loop | Wired next |
| x402 metering with real deduction | Balance is real; deduction wired next |
| Soroban registry contract on testnet | **Deployed, 4 tests, writes audits on chain** |

The scan screens currently play a scripted fixture so the demo path is deterministic; the
sandbox, agent and anchor underneath are real and independently runnable.

---

## How a scan runs

1. **Sign in** with a passkey.
2. **Fund** — TRY through the SEP-6 anchor arrives as USDC scan credit.
3. **Upload** a contract and choose lanes.
4. **Triage** — static tools narrow the search space.
5. **Hunt** — the agent writes and runs tests in the sandbox; each cycle bills your credit.
6. **Prove** — a failing test and the transaction, then a patch.
7. **Certify** — a passing contract gets an on-chain Z-FUZZ Audited stamp.

![Add scan credit](docs/screens/05-deposit.png)

## Screens

| Route | Screen |
|---|---|
| `/` | Landing |
| `/dashboard` | Dashboard, passkey-gated |
| `/deposit` | Add scan credit through the anchor |
| `/scan/new` | Upload contract, select lanes |
| `/scan/[id]` | Live agent terminal, then the vulnerability result |
| `/scan/[id]/patch` | Proposed patch, diff view |
| `/scan/[id]/certificate` | Audit certificate |

## API reference

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/anchor` | Account address and live USDC balance |
| `POST` | `/api/anchor` | SEP-10 auth, SEP-6 deposit, settle, return the Stellar transaction |
| `GET` | `/api/anchor/challenge` | SEP-10 challenge for a connected wallet address |
| `POST` | `/api/anchor/challenge` | Submit the wallet-signed challenge, return the token |
| `GET` | `/api/passkey` | Current session and whether a passkey is registered |
| `POST` | `/api/passkey` | `register-options`, `register`, `auth-options`, `auth` |
| `DELETE` | `/api/passkey` | Sign out |

## Project structure

```
src/
  app/
    page.tsx              landing
    dashboard/            passkey-gated dashboard
    deposit/              SEP-6 credit top-up
    scan/                 upload, live terminal, result, patch, certificate
    api/anchor/           SEP-10 + SEP-6 anchor flow
    api/passkey/          WebAuthn registration and authentication
  components/             marketing sections, scan story, terminal, passkey, ui
  lib/
    server/anchor.ts      SEP-10 + SEP-6 client
    server/passkeys.ts    WebAuthn ceremony and sessions
    server/sandbox.ts     ephemeral cargo-test runner
sandbox/
  Dockerfile             soroban-sdk 28 base image, deps pre-compiled
  harness/               Soroban contract scaffold the tests run against
scripts/
  setup.mjs              testnet account + trustline
  anchor.mjs             SEP-10 + SEP-6 deposit from the CLI
  agent.mjs              Gemini test-generation check
```

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, SimpleWebAuthn 13,
Stellar Wallets Kit, `@stellar/stellar-sdk`. Interface type is Geist; monospace is reserved for machine output —
terminal lines, test names, transaction hashes and contract addresses.

Chain and agent: Soroban (Rust, soroban-sdk 28), Blend v2 and Soroswap, SEP-6 and SEP-10
through a TRY anchor, x402 metering, Gemini for test generation, Docker for the sandbox.

## Scripts

```
npm run dev
npm run build
npm run lint
npm run typecheck
npm run setup
```

---

## Deploying to Vercel

The frontend, the passkey flow and the whole anchor leg run fine on Vercel. **The sandbox
does not**: serverless functions cannot start containers, so `cargo test` has no host to run
on. A scan on the hosted build still authenticates, still calls the model and still returns
the generated Rust test — it just reports that the test was not executed, instead of
pretending it was.

Set these environment variables in the Vercel project (values come from `.env.local` after
running `npm run setup`):

```
ZF_ACCOUNT_SECRET   ZF_ACCOUNT_PUBLIC   ZF_ANCHOR_URL
ZF_ASSET_CODE       ZF_ASSET_ISSUER
GEMINI_API_KEY      ZF_MODEL
```

Two things to know about the hosted build:

- **Passkeys are bound to the domain.** A passkey registered on `localhost` will not work on
  the Vercel URL, and vice versa. Register a new one on the deployed domain.
- **Passkey credentials live in memory**, so they do not survive across serverless instances.
  Fine for a demo, not for production; a real deployment needs a store.

To demo the full scan, run it locally with Docker running.

## Remaining work

- Join the agent and sandbox into one live loop, replacing the scripted scan fixture
- Deploy the Soroban registry contract to testnet and publish its address
- Wire x402 to deduct from the real USDC balance per cycle

### Owner tasks

- Record the three-minute demo video
- Publish the deck from the official template and submit on the portal
