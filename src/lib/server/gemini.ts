import "server-only";

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function config() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not configured", 500);
  const model = process.env.ZF_MODEL ?? "gemini-3.5-flash-lite";
  return { key, model };
}

export const HARNESS_API = `The harness crate \`zf_harness\` exposes a Soroban contract:

pub struct RegistryPool;
impl RegistryPool {
    pub fn set_amount(env: Env, user: Address, amount: i128);   // stores in temporary storage
    pub fn read_amount(env: Env, user: Address) -> i128;
    pub fn borrow_limit(env: Env, user: Address) -> i128;       // read_amount * 4
}

Use EXACTLY these imports and no others:
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env};
use zf_harness::{RegistryPool, RegistryPoolClient};

Rules that make the test compile:
- Create env: let env = Env::default(); env.mock_all_auths();
- Register: let id = env.register(RegistryPool, ()); let c = RegistryPoolClient::new(&env, &id);
- New address: let user = Address::generate(&env);
- Call methods on c with references: c.set_amount(&user, &100); c.read_amount(&user);
- To advance the ledger past a TTL, use ONLY: env.ledger().set_sequence_number(9_999_999);
- Do NOT use EnvTestUtils, LedgerInfo, with_upgraded_version, or any other testutils item.`;

function extractRust(text: string): string {
  const fenced = text.match(/```(?:rust)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  return body.trim();
}

export async function generateTest(scenario: string): Promise<string> {
  const { key, model } = config();
  const prompt = `You are a Rust reviewer adding unit-test coverage to a developer's own
Soroban contract before release, the same way cargo test does on Stellar.

${HARNESS_API}

Write exactly one Rust integration test (a #[test] fn) that checks this invariant so a
missing check would make the test fail: ${scenario}

Use soroban_sdk::testutils as needed. Start with the use statements. Reply with a single
rust code block and nothing else.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
    }),
  });

  if (!res.ok) {
    throw new GeminiError(`Gemini request failed (${res.status})`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { candidatesTokenCount?: number };
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const code = extractRust(text);
  if (!code.includes("#[test]")) {
    throw new GeminiError("Model did not return a test");
  }
  return code;
}
