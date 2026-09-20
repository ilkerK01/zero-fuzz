import "server-only";
import { Asset, Horizon, Keypair, Memo, Networks, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";

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

export type BalanceView = {
  address: string;
  code: string;
  balance: string;
  funded: boolean;
  trustline: boolean;
};

export async function balance(): Promise<string> {
  const { address } = config();
  return (await balanceOf(address)).balance;
}

export async function balanceOf(account: string): Promise<BalanceView> {
  const { code, issuer } = config();
  if (!StrKey.isValidEd25519PublicKey(account)) {
    throw new AnchorError("That is not a valid Stellar public key", 400);
  }
  try {
    const loaded = await horizon.loadAccount(account);
    const row = loaded.balances.find(
      (b) => "asset_code" in b && b.asset_code === code && b.asset_issuer === issuer,
    );
    return {
      address: account,
      code,
      balance: row ? row.balance : "0",
      funded: true,
      trustline: Boolean(row),
    };
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return { address: account, code, balance: "0", funded: false, trustline: false };
    }
    throw new AnchorError("Could not read that account from Horizon");
  }
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

export async function startDeposit(amount: string, token: string, account?: string): Promise<DepositStarted> {
  const { anchor, address: defaultAddress, code } = config();
  const url = new URL(`${anchor}/sep6/deposit`);
  url.searchParams.set("asset_code", code);
  url.searchParams.set("account", account ?? defaultAddress);
  url.searchParams.set("type", "bank_account");
  url.searchParams.set("amount", amount);
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) {
    throw new AnchorError("Your anchor session expired. Verify the wallet again.", 401);
  }
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
  if (res.status === 401 || res.status === 403) {
    throw new AnchorError("Your anchor session expired. Verify the wallet again.", 401);
  }
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
  if (res.status === 401 || res.status === 403) {
    throw new AnchorError("Your anchor session expired. Verify the wallet again.", 401);
  }
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

export async function settle(id: string, token: string, tries = 45): Promise<AnchorTx> {
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

export type WithdrawQuote = {
  id: string;
  destination: string;
  memo: string;
  memoType: string;
  iban: string;
  rate: string | null;
  feePercent: number;
};

export async function startWithdraw(amount: string, token: string, account?: string): Promise<WithdrawQuote> {
  const { anchor, address: defaultAddress, code } = config();
  const url = new URL(`${anchor}/sep6/withdraw`);
  url.searchParams.set("asset_code", code);
  url.searchParams.set("account", account ?? defaultAddress);
  url.searchParams.set("type", "bank_account");
  url.searchParams.set("amount", amount);
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) {
    throw new AnchorError("Your anchor session expired. Verify the wallet again.", 401);
  }
  const text = await res.text();
  if (!res.ok) throw new AnchorError(`SEP-6 withdraw failed (${res.status}): ${text.slice(0, 160)}`);
  const data = JSON.parse(text) as {
    id: string;
    account_id?: string;
    memo?: string;
    memo_type?: string;
    fee_percent?: number;
    extra_info?: { message?: string };
  };
  if (!data.account_id || !data.memo || !data.memo_type) {
    throw new AnchorError("Anchor did not return payment instructions for the withdrawal");
  }
  const message = data.extra_info?.message ?? "";
  const rate = message.match(/Rate ([\d.]+) TRY\/USDC/)?.[1] ?? null;
  const iban = message.match(/\b(TR\d{24})\b/)?.[1] ?? "";
  return {
    id: data.id,
    destination: data.account_id,
    memo: data.memo,
    memoType: data.memo_type,
    iban,
    rate,
    feePercent: data.fee_percent ?? 0,
  };
}

export function memoFor(quote: WithdrawQuote): Memo {
  if (quote.memoType === "id") return Memo.id(String(quote.memo));
  if (quote.memoType === "text") return Memo.text(String(quote.memo));
  if (quote.memoType === "hash") return Memo.hash(Buffer.from(quote.memo, "base64"));
  throw new AnchorError(`Anchor asked for an unsupported memo type: ${quote.memoType}`);
}

export function submitError(error: unknown): AnchorError {
  const extras = (error as { response?: { data?: { extras?: Record<string, unknown> } } })?.response?.data?.extras;
  const codes = extras?.result_codes as { transaction?: string; operations?: string[] } | undefined;
  if (codes) {
    const detail = [codes.transaction, ...(codes.operations ?? [])].filter(Boolean).join(", ");
    if (detail.includes("op_underfunded")) {
      return new AnchorError("Not enough USDC on the account for this withdrawal", 400);
    }
    return new AnchorError(`Stellar rejected the payment: ${detail}`);
  }
  return new AnchorError(error instanceof Error ? error.message : "Payment submission failed");
}

export async function payAnchor(quote: WithdrawQuote, amount: string): Promise<string> {
  const { secret, address, code, issuer } = config();
  const keypair = Keypair.fromSecret(secret);
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, { fee: "10000", networkPassphrase: Networks.TESTNET })
    .addOperation(
      Operation.payment({
        destination: quote.destination,
        asset: new Asset(code, issuer),
        amount,
      }),
    )
    .addMemo(memoFor(quote))
    .setTimeout(90)
    .build();
  tx.sign(keypair);
  try {
    const sent = await horizon.submitTransaction(tx);
    return sent.hash;
  } catch (error) {
    throw submitError(error);
  }
}

export async function buildTrustlineXdr(address: string): Promise<string> {
  const { code, issuer } = config();
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, { fee: "10000", networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: new Asset(code, issuer) }))
    .setTimeout(300)
    .build();
  return tx.toXDR();
}

export async function buildWithdrawPaymentXdr(
  address: string,
  quote: WithdrawQuote,
  amount: string,
): Promise<string> {
  const { code, issuer } = config();
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, { fee: "10000", networkPassphrase: Networks.TESTNET })
    .addOperation(
      Operation.payment({
        destination: quote.destination,
        asset: new Asset(code, issuer),
        amount,
      }),
    )
    .addMemo(memoFor(quote))
    .setTimeout(180)
    .build();
  return tx.toXDR();
}

export async function submitSigned(xdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
  try {
    const sent = await horizon.submitTransaction(tx);
    return sent.hash;
  } catch (error) {
    throw submitError(error);
  }
}
