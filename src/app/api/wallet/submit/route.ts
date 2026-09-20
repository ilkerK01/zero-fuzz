import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { AnchorError, submitSigned } from "@/lib/server/anchor";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  const status = error instanceof AnchorError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { xdr?: unknown };
    if (typeof body.xdr !== "string") {
      throw new AnchorError("A signed transaction is required", 400);
    }

    let tx;
    try {
      tx = TransactionBuilder.fromXDR(body.xdr, Networks.TESTNET);
    } catch {
      throw new AnchorError("That transaction could not be parsed", 400);
    }

    if (!("operations" in tx) || tx.operations.length !== 1 || tx.operations[0].type !== "changeTrust") {
      throw new AnchorError("Expected a single changeTrust operation", 400);
    }

    const hash = await submitSigned(body.xdr);
    return NextResponse.json({ hash });
  } catch (error) {
    return fail(error);
  }
}
