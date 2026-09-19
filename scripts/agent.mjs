import { existsSync, readFileSync } from "node:fs";

const ENV_PATH = ".env.local";
if (!existsSync(ENV_PATH)) throw new Error("Run: npm run setup");

const env = {};
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const KEY = env.GEMINI_API_KEY;
if (!KEY) throw new Error("GEMINI_API_KEY missing in .env.local");
const MODEL = process.argv[2] ?? "gemini-2.5-flash-lite";

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

const prompt = `You are a Rust code reviewer helping a developer add unit-test coverage to
their own Soroban smart contract before release. Below is a function they wrote.
Write one Rust #[test] that asserts the intended invariant so a missing liveness
check on a temporary storage entry would make the test fail. Reply with a single
rust code block only.

fn read_amount(env: &Env, user: &Address) -> i128 {
    env.storage().temporary().get(&Key::Amount(user.clone())).unwrap_or(0)
}`;

const body = {
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
};

const started = Date.now();
const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const ms = Date.now() - started;

if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  console.error((await res.text()).slice(0, 400));
  process.exit(1);
}

const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
const usage = data.usageMetadata ?? {};

console.log(`model: ${MODEL}`);
console.log(`latency: ${ms} ms`);
console.log(`tokens: in=${usage.promptTokenCount ?? "?"} out=${usage.candidatesTokenCount ?? "?"}`);
console.log(`has rust block: ${text.includes("#[test]") || text.includes("```rust")}`);
console.log("----- output -----");
console.log(text.trim().slice(0, 900));
