# skills.stellar.org files used

The Tracks Handbook asks each team to cite which specific skill file(s) they used, **by
path**. This file does that. It is deliberately split into skills that shaped code which
exists and runs in this repository, and skills that were read but did not produce code.

Nothing here claims more than the [status table](../README.md#what-actually-works-today)
in the README.

## Used — shaped code that exists and runs

### `SKILL.md` — Anchors
[`CheesecakeLabs/stellar-anchor-skill/SKILL.md`](https://github.com/CheesecakeLabs/stellar-anchor-skill/blob/main/SKILL.md)

The direct reference for the anchor leg. It drove the SEP-10 challenge/response handshake
and the SEP-6 `/deposit` → `simulate-bank-transfer` → on-chain settlement sequence.

Landed in `src/lib/server/anchor.ts`, `src/app/api/anchor/route.ts`,
`src/app/api/anchor/challenge/route.ts` and `scripts/anchor.mjs`. Three TRY deposits
settled on testnet; the transaction hashes are in the README.

### `skills/standards/SKILL.md` — SEPs, CAPs & Ecosystem
[`stellar/stellar-dev-skill/skills/standards/SKILL.md`](https://github.com/stellar/stellar-dev-skill/blob/main/skills/standards/SKILL.md)

Used to pick the right SEP per feature rather than guessing: SEP-10 for wallet
authentication, SEP-6 for the programmatic deposit (SEP-24 was rejected because it needs
an interactive popup we did not want in the scan flow), and the trustline path for the
credit asset.

Landed in `scripts/setup.mjs` (trustline creation) and the SEP selection recorded under
[Design decisions](../README.md#design-decisions-and-trade-offs).

### `skills/stellar-integration-finder/SKILL.md` — Stellar Integration Finder
[`lumenloop/lumenloop-skills/skills/stellar-integration-finder/SKILL.md`](https://github.com/lumenloop/lumenloop-skills/blob/main/skills/stellar-integration-finder/SKILL.md)

Used to choose the integration target from the Eligible Integration Partners list. It is
why the wallet layer is **Stellar Wallets Kit** rather than a hand-rolled Freighter call,
and why Blend v2 and Soroswap are the named next targets for the composability lane.

Landed in `src/lib/wallet.ts` and `src/components/wallet-connect.tsx`.

## Read, but produced no code

| Skill file | Why it is not in the table above |
|---|---|
| [`defindex-sdk-skill.md`](https://github.com/paltalabs/defindex-sdk/blob/main/defindex-sdk-skill.md) | DeFindex is a coverage target on the roadmap. No SDK call exists in this repo. |
| [`soroswap-sdk-skill.md`](https://github.com/soroswap/sdk/blob/main/soroswap-sdk-skill.md) | Same — Soroswap is listed as a next target, not an implemented one. |
| [`skills/scf-submission-radar/SKILL.md`](https://github.com/lumenloop/lumenloop-skills/blob/main/skills/scf-submission-radar/SKILL.md) | Relevant to the post-event SCF path, not to the MVP. |

## Non-skill Stellar resources that shaped the build

These are handbook resources rather than skill files, listed for completeness:

- [Agentic payments / x402](https://developers.stellar.org/docs/build/agentic-payments/x402) —
  the metering model: per-cycle billing units, budget exhaustion, and the `Budget Exceeded`
  halt. Implemented in `src/lib/server/scan.ts` (`UNIT_PRICE`, `bill()`).
- [Smart wallet / passkey docs](https://developers.stellar.org/docs/build/apps/smart-wallets) —
  the passkey sign-in. The handbook treats passkeys as a bonus, not a requirement.
- [Stellar.Expert](https://stellar.expert/) — verifying every transaction cited in the README.
