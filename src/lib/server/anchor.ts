import "server-only";
import { Horizon, Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";

export class AnchorError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new AnchorError(`${name} is not configured. Run: npm run setup`, 500);
  return value;
}

export function config() {
  return {
    anchor: required("ZF_ANCHOR_URL"),
    secret: required("ZF_ACCOUNT_SECRET"),
    address: required("ZF_ACCOUNT_PUBLIC"),
    code: required("ZF_ASSET_CODE"),
    issuer: required("ZF_ASSET_ISSUER"),
  };
}

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

export async function balance(): Promise<string> {
  const { address, code, issuer } = config();
  const account = await horizon.loadAccount(address);
  const row = account.balances.find(
    (b) => "asset_code" in b && b.asset_code === code && b.asset_issuer === issuer,
  );
  return row ? row.balance : "0";
}

export async function sep10Token(): Promise<string> {
  const { anchor, secret, address } = config();
  const keypair = Keypair.fromSecret(secret);
  const res = await fetch(`${anchor}/auth?account=${address}`);
  if (!res.ok) throw new AnchorError(`SEP-10 challenge failed (${res.status})`);
  const { transaction, network_passphrase } = (await res.json()) as {
    transaction: string;
    network_passphrase?: string;
  };
  const tx = TransactionBuilder.fromXDR(transaction, network_passphrase ?? Networks.TESTNET);
  tx.sign(keypair);
  const verify = await fetch(`${anchor}/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transaction: tx.toXDR() }),
  });
  if (!verify.ok) throw new AnchorError(`SEP-10 verification failed (${verify.status})`);
  const { token } = (await verify.json()) as { token: string };
  return token;
}

export async function challengeFor(account: string): Promise<{ transaction: string; networkPassphrase: string }> {
  const { anchor } = config();
  const res = await fetch(`${anchor}/auth?account=${account}`);
  if (!res.ok) throw new AnchorError(`SEP-10 challenge failed (${res.status})`);
  const data = (await res.json()) as { transaction: string; network_passphrase?: string };
  return { transaction: data.transaction, networkPassphrase: data.network_passphrase ?? Networks.TESTNET };
}

export async function tokenFrom(signedXdr: string): Promise<string> {
  const { anchor } = config();
  const res = await fetch(`${anchor}/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transaction: signedXdr }),
  });
  if (!res.ok) throw new AnchorError(`SEP-10 verification failed (${res.status})`);
  const { token } = (await res.json()) as { token: string };
  return token;
}

export type DepositStarted = {
  id: string;
  iban: string;
  memo: string;
  bank: string;
  feePercent: number;
};

export async function startDeposit(amount: string, token: string): Promise<DepositStarted> {
  const { anchor, address, code } = config();
  const url = new URL(`${anchor}/sep6/deposit`);
  url.searchParams.set("asset_code", code);
  url.searchParams.set("account", address);
  url.searchParams.set("type", "bank_account");
  url.searchParams.set("amount", amount);
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new AnchorError(`SEP-6 deposit failed (${res.status})`);
  const data = (await res.json()) as {
    id: string;
    fee_percent?: number;
    instructions?: Record<string, { value: string }>;
  };
  return {
    id: data.id,
    iban: data.instructions?.bank_account_number?.value ?? "",
    memo: data.instructions?.external_transfer_memo?.value ?? "",
    bank: data.instructions?.bank_name?.value ?? "",
    feePercent: data.fee_percent ?? 0,
  };
}

export async function simulateTransfer(id: string, amount: string, token: string) {
  const { anchor } = config();
  const res = await fetch(`${anchor}/sep6/tx/${id}/simulate-bank-transfer`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new AnchorError(`Bank transfer simulation failed (${res.status})`);
}

export type AnchorTx = {
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
};

export async function transaction(id: string, token: string): Promise<AnchorTx> {
  const { anchor } = config();
  const res = await fetch(`${anchor}/sep6/transaction?id=${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new AnchorError(`SEP-6 transaction lookup failed (${res.status})`);
  const data = (await res.json()) as {
    transaction?: Record<string, unknown>;
  } & Record<string, unknown>;
  const tx = (data.transaction ?? data) as Record<string, unknown>;
  return {
    status: String(tx.status ?? "unknown"),
    amountOut: tx.amount_out ? String(tx.amount_out) : null,
    stellarTxId: tx.stellar_transaction_id ? String(tx.stellar_transaction_id) : null,
  };
}

export async function settle(id: string, token: string, tries = 20): Promise<AnchorTx> {
  let last: AnchorTx = { status: "pending_anchor", amountOut: null, stellarTxId: null };
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    last = await transaction(id, token);
    if (last.status === "completed") return last;
    if (last.status === "error" || last.status === "refunded") {
      throw new AnchorError(`Anchor returned status ${last.status}`);
    }
  }
  return last;
}
