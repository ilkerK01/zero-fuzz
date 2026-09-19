import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const HORIZON = "https://horizon-testnet.stellar.org";
const ANCHOR = "https://tr-mock-anchor.fly.dev";
const ENV_PATH = ".env.local";

const server = new Horizon.Server(HORIZON);

function readEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const out = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function writeEnv(env) {
  const body = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(ENV_PATH, `${body}\n`);
}

async function anchorAsset() {
  const toml = await fetch(`${ANCHOR}/.well-known/stellar.toml`).then((r) => r.text());
  const code = toml.match(/code="([^"]+)"/)?.[1];
  const issuer = toml.match(/issuer="([^"]+)"/)?.[1];
  if (!code || !issuer) throw new Error("Anchor asset not found in stellar.toml");
  return new Asset(code, issuer);
}

async function fund(address) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!res.ok && res.status !== 400) throw new Error(`Friendbot failed: ${res.status}`);
}

async function hasTrustline(address, asset) {
  const account = await server.loadAccount(address);
  return account.balances.some(
    (b) => b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
  );
}

async function addTrustline(keypair, asset) {
  const account = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();
  tx.sign(keypair);
  await server.submitTransaction(tx);
}

const env = readEnv();
const asset = await anchorAsset();

let keypair;
if (env.ZF_ACCOUNT_SECRET) {
  keypair = Keypair.fromSecret(env.ZF_ACCOUNT_SECRET);
  console.log("existing account", keypair.publicKey());
} else {
  keypair = Keypair.random();
  console.log("new account", keypair.publicKey());
}

await fund(keypair.publicKey());
try {
  await server.loadAccount(keypair.publicKey());
} catch {
  throw new Error("Account was not funded by friendbot");
}
console.log("funded");

if (await hasTrustline(keypair.publicKey(), asset)) {
  console.log("trustline already present");
} else {
  await addTrustline(keypair, asset);
  console.log("trustline added", `${asset.getCode()}:${asset.getIssuer()}`);
}

writeEnv({
  ...env,
  ZF_ACCOUNT_SECRET: keypair.secret(),
  ZF_ACCOUNT_PUBLIC: keypair.publicKey(),
  ZF_ANCHOR_URL: ANCHOR,
  ZF_ASSET_CODE: asset.getCode(),
  ZF_ASSET_ISSUER: asset.getIssuer(),
});

const account = await server.loadAccount(keypair.publicKey());
for (const b of account.balances) {
  console.log("balance", b.asset_code ?? "XLM", b.balance);
}
console.log("wrote", ENV_PATH);
