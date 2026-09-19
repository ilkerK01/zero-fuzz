# skills.stellar.org files used

The hackathon handbook requires each submission to state which `skills.stellar.org` skill
files were used. This file is kept honest: it separates what actually shaped the code in
this repository from what is scoped for the integrations that are not yet implemented.

## Consulted for the current build

| Skill file | How it was used |
|---|---|
| `agentic-payments/SKILL.md` | x402 metering model — per-cycle billing units, budget exhaustion behaviour, and the `Budget Exceeded` halt. Shaped the budget meter and the pricing table. |
| Anchors / SEP flows | SEP-6 deposit and SEP-10 authentication flow shape. Drove the deposit screen: amount bounds, the simulated bank transfer step, and TRY to TRYC conversion display. |
| Integration Finder | Used to select eligible integration partners and to confirm Blend v2 and Soroswap as the composability targets. Drove the coverage table. |

## Scoped for the integrations not yet implemented

| Skill file | Planned use |
|---|---|
| `agentic-payments/SKILL.md` | The actual x402 middleware: deducting from the TRYC balance per agent cycle and per sandbox run. |
| Anchors / SEP flows | The real SEP-10 session and SEP-6 deposit against `tr-mock-anchor`, including `simulate-bank-transfer`. |
| SEPs / CAPs reference | SEP-41 token interface and the asset trustline path for the credit balance. |
| Soroban SDK docs | The registry contract, its tests, and the testnet deployment. |

## Note on accuracy

Nothing in the first table is claimed to be running on chain. It describes documentation
that shaped design decisions in code that exists. The second table is forward-looking and
is not a claim of implementation. See the status table in the README.
