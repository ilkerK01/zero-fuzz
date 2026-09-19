import { existsSync, readFileSync } from "node:fs";
import { Horizon, Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";

const ENV_PATH = ".env.local";
if (!existsSync(ENV_PATH)) throw new Error("Run: npm run setup");

const env = {};
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const ANCHOR = env.ZF_ANCHOR_URL;
const keypair = Keypair.fromSecret(env.ZF_ACCOUNT_SECRET);
const server = new Horizon.Server("https://horizon-testnet.stellar.org");
const amount = process.argv[2] ?? "1000";

async function sep10() {
  const res = await fetch(`${ANCHOR}/auth?account=${keypair.publicKey()}`);
  if (!res.ok) throw new Error(`challenge ${res.status}: ${await res.text()}`);
  const { transaction, network_passphrase } = await res.json();
  const tx = TransactionBuilder.fromXDR(transaction, network_passphrase ?? Networks.TESTNET);
  tx.sign(keypair);
  const verify = await fetch(`${ANCHOR}/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transaction: tx.toXDR() }),
  });
  if (!verify.ok) throw new Error(`token ${verify.status}: ${await verify.text()}`);
  const { token } = await verify.json();
  return token;
}

async function deposit(token) {
  const url = new URL(`${ANCHOR}/sep6/deposit`);
  url.searchParams.set("asset_code", env.ZF_ASSET_CODE);
  url.searchParams.set("account", keypair.publicKey());
  url.searchParams.set("type", "bank_account");
  url.searchParams.set("amount", amount);
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`deposit ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function balance() {
  const account = await server.loadAccount(keypair.publicKey());
  const row = account.balances.find((b) => b.asset_code === env.ZF_ASSET_CODE);
  return row ? row.balance : "0";
}

console.log("account", keypair.publicKey());
console.log("balance before", await balance());

const token = await sep10();
console.log("sep10 token ok, length", token.length);

const dep = await deposit(token);
console.log("deposit id", dep.id);
console.log("iban", dep.instructions?.bank_account_number?.value);
console.log("memo", dep.instructions?.external_transfer_memo?.value);

const sim = await fetch(`${ANCHOR}/sep6/tx/${dep.id}/simulate-bank-transfer`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
  body: JSON.stringify({ amount }),
});
console.log("simulate", sim.status, (await sim.text()).slice(0, 200));

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const res = await fetch(`${ANCHOR}/sep6/transaction?id=${dep.id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const tx = data.transaction ?? data;
  console.log(`poll ${i} status=${tx.status} amount_out=${tx.amount_out ?? "-"}`);
  if (tx.status === "completed") {
    console.log("stellar tx", tx.stellar_transaction_id);
    break;
  }
}

console.log("balance after", await balance());
