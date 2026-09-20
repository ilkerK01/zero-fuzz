import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { StrKey } from "@stellar/stellar-sdk";
import {
  AnchorError,
  balance,
  balanceOf,
  config,
  sep10Token,
  settle,
  simulateTransfer,
  startDeposit,
} from "@/lib/server/anchor";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  const status = error instanceof AnchorError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const asked = req.nextUrl.searchParams.get("address");
    if (asked) {
      const view = await balanceOf(asked);
      return NextResponse.json({ ...view, connected: true });
    }
    const { address, code } = config();
    return NextResponse.json({
      address,
      code,
      balance: await balance(),
      funded: true,
      trustline: true,
      connected: false,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { amount?: unknown; address?: unknown; token?: unknown };
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 50 || amount > 3000) {
      throw new AnchorError("Amount must be between 50 and 3000 TRY", 400);
    }
    const value = String(Math.round(amount));

    const walletAddress = typeof body.address === "string" && StrKey.isValidEd25519PublicKey(body.address)
      ? body.address
      : null;
    const walletToken = typeof body.token === "string" && body.token.length > 0 ? body.token : null;

    if (walletAddress && walletToken) {
      const deposit = await startDeposit(value, walletToken, walletAddress);
      await simulateTransfer(deposit.id, value, walletToken);
      const tx = await settle(deposit.id, walletToken);
      return NextResponse.json({
        deposit,
        status: tx.status,
        amountOut: tx.amountOut,
        stellarTxId: tx.stellarTxId,
        balance: (await balanceOf(walletAddress)).balance,
        account: walletAddress,
        mode: "wallet",
      });
    }

    const token = await sep10Token();
    const deposit = await startDeposit(value, token);
    await simulateTransfer(deposit.id, value, token);
    const tx = await settle(deposit.id, token);
    const { address } = config();
    return NextResponse.json({
      deposit,
      status: tx.status,
      amountOut: tx.amountOut,
      stellarTxId: tx.stellarTxId,
      balance: await balance(),
      account: address,
      mode: "demo",
    });
  } catch (error) {
    return fail(error);
  }
}
