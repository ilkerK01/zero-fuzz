import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AnchorError,
  balance,
  payAnchor,
  sep10Token,
  settle,
  startWithdraw,
} from "@/lib/server/anchor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_USDC = 0.1;

export async function POST(req: NextRequest) {
  let stellarTxId: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { amount?: unknown };
    const requested = Number(body.amount);
    if (!Number.isFinite(requested) || requested < MIN_USDC) {
      throw new AnchorError(`Amount must be at least ${MIN_USDC} USDC`, 400);
    }

    const available = Number(await balance());
    if (requested > available) {
      throw new AnchorError(
        `Not enough credit: ${available.toFixed(7)} USDC available`,
        400,
      );
    }

    const amount = requested.toFixed(7);
    const token = await sep10Token();
    const quote = await startWithdraw(amount, token);

    stellarTxId = await payAnchor(quote, amount);

    const tx = await settle(quote.id, token, 20);

    return NextResponse.json({
      withdraw: {
        id: quote.id,
        iban: quote.iban,
        rate: quote.rate,
        feePercent: quote.feePercent,
        memo: quote.memo,
      },
      amountIn: amount,
      status: tx.status,
      amountOut: tx.amountOut,
      stellarTxId,
      balance: await balance(),
    });
  } catch (error) {
    const status = error instanceof AnchorError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Withdrawal failed";
    return NextResponse.json({ error: message, stellarTxId }, { status });
  }
}
