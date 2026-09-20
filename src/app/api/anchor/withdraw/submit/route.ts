import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Networks, StrKey, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { AnchorError, balanceOf, settle, submitSigned } from "@/lib/server/anchor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      xdr?: unknown;
      id?: unknown;
      token?: unknown;
      address?: unknown;
    };
    if (typeof body.xdr !== "string") {
      throw new AnchorError("A signed transaction is required", 400);
    }
    if (typeof body.id !== "string" || !body.id) {
      throw new AnchorError("A transaction id is required", 400);
    }
    if (typeof body.token !== "string" || !body.token) {
      throw new AnchorError("An anchor token is required", 400);
    }
    if (typeof body.address !== "string" || !StrKey.isValidEd25519PublicKey(body.address)) {
      throw new AnchorError("A valid Stellar public key is required", 400);
    }
    const { id, token, address } = body;

    let tx;
    try {
      tx = TransactionBuilder.fromXDR(body.xdr, Networks.TESTNET);
    } catch {
      throw new AnchorError("That transaction could not be parsed", 400);
    }

    if (
      !(tx instanceof Transaction) ||
      tx.operations.length !== 1 ||
      tx.operations[0].type !== "payment" ||
      tx.source !== address
    ) {
      throw new AnchorError("Expected a single payment operation from your account", 400);
    }

    const stellarTxId = await submitSigned(body.xdr);

    try {
      const result = await settle(id, token, 20);
      return NextResponse.json({
        status: result.status,
        amountOut: result.amountOut,
        stellarTxId,
        balance: (await balanceOf(address)).balance,
      });
    } catch (error) {
      return NextResponse.json({
        status: "pending_anchor",
        amountOut: null,
        stellarTxId,
        balance: (await balanceOf(address)).balance,
        error: error instanceof Error ? error.message : "Settlement did not complete",
      });
    }
  } catch (error) {
    const status = error instanceof AnchorError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Withdrawal submission failed";
    return NextResponse.json({ error: message }, { status });
  }
}
