import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import {
  authenticate,
  authenticationOptions,
  closeSession,
  hasPasskey,
  PasskeyError,
  readSession,
  register,
  registrationOptions,
  siteFrom,
} from "@/lib/server/passkeys";

export const dynamic = "force-dynamic";

const COOKIE = "zf-session";

function fail(error: unknown) {
  const status = error instanceof PasskeyError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const store = await cookies();
  const session = readSession(store.get(COOKIE)?.value);
  return NextResponse.json({ session, registered: hasPasskey() });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: string;
      label?: string;
      response?: unknown;
    };
    const site = siteFrom(req);
    const action = body.action;

    if (action === "register-options") {
      const label = (body.label ?? "").trim();
      if (!label) throw new PasskeyError("A name is required");
      return NextResponse.json({ options: await registrationOptions(label, site) });
    }

    if (action === "register") {
      const label = (body.label ?? "").trim();
      if (!label) throw new PasskeyError("A name is required");
      if (!body.response) throw new PasskeyError("Passkey response is required");
      const token = await register(label, body.response as RegistrationResponseJSON, site);
      const res = NextResponse.json({ session: { label } });
      res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }

    if (action === "auth-options") {
      return NextResponse.json({ options: await authenticationOptions(site) });
    }

    if (action === "auth") {
      if (!body.response) throw new PasskeyError("Passkey response is required");
      const token = await authenticate(body.response as AuthenticationResponseJSON, site);
      const session = readSession(token);
      const res = NextResponse.json({ session });
      res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
      return res;
    }

    throw new PasskeyError("Unknown action");
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  const store = await cookies();
  closeSession(store.get(COOKIE)?.value);
  const res = NextResponse.json({ session: null });
  res.cookies.delete(COOKIE);
  return res;
}
