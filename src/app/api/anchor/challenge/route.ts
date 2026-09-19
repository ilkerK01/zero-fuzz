import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AnchorError, challengeFor, tokenFrom } from "@/lib/server/anchor";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  const status = error instanceof AnchorError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const account = req.nextUrl.searchParams.get("account");
    if (!account || !account.startsWith("G") || account.length !== 56) {
      throw new AnchorError("A valid Stellar account is required", 400);
    }
    return NextResponse.json(await challengeFor(account));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { transaction?: unknown };
    if (typeof body.transaction !== "string") {
      throw new AnchorError("Signed transaction is required", 400);
    }
    const token = await tokenFrom(body.transaction);
    return NextResponse.json({ token, verified: true });
  } catch (error) {
    return fail(error);
  }
}
