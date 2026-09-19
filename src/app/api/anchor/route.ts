import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AnchorError,
  balance,
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

export async function GET() {
  try {
    const { address, code } = config();
    return NextResponse.json({ address, code, balance: await balance() });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { amount?: unknown };
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 50 || amount > 3000) {
      throw new AnchorError("Amount must be between 50 and 3000 TRY", 400);
    }
    const value = String(Math.round(amount));
    const token = await sep10Token();
    const deposit = await startDeposit(value, token);
    await simulateTransfer(deposit.id, value, token);
    const tx = await settle(deposit.id, token);
    return NextResponse.json({
      deposit,
      status: tx.status,
      amountOut: tx.amountOut,
      stellarTxId: tx.stellarTxId,
      balance: await balance(),
    });
  } catch (error) {
    return fail(error);
  }
}
