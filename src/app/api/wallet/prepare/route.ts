import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Networks, StrKey } from "@stellar/stellar-sdk";
import { AnchorError, balanceOf, buildTrustlineXdr } from "@/lib/server/anchor";

export const dynamic = "force-dynamic";

function fail(error: unknown) {
  const status = error instanceof AnchorError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

async function fund(address: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${address}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new AnchorError("Friendbot could not fund that account", 502);
  } catch (error) {
    if (error instanceof AnchorError) throw error;
    throw new AnchorError("Friendbot could not fund that account", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { address?: unknown };
    if (typeof body.address !== "string" || !StrKey.isValidEd25519PublicKey(body.address)) {
      throw new AnchorError("A valid Stellar public key is required", 400);
    }
    const address = body.address;

    let view = await balanceOf(address);
    if (!view.funded) {
      await fund(address);
      view = await balanceOf(address);
    }

    if (!view.trustline) {
      const xdr = await buildTrustlineXdr(address);
      return NextResponse.json({
        ready: false,
        funded: view.funded,
        xdr,
        networkPassphrase: Networks.TESTNET,
      });
    }

    return NextResponse.json({ ready: true, funded: view.funded });
  } catch (error) {
    return fail(error);
  }
}
