import "server-only";
import { randomBytes } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";

export type Site = { origin: string; rpID: string };

type Credential = {
  id: string;
  publicKey: Uint8Array<ArrayBuffer>;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  label: string;
  createdAt: number;
};

type Session = { credentialId: string; label: string; createdAt: number };

const credentials = new Map<string, Credential>();
const challenges = new Map<string, { challenge: string; expires: number }>();
const sessions = new Map<string, Session>();

const RP_NAME = "Z-FUZZ";
const CHALLENGE_TTL = 5 * 60 * 1000;

export class PasskeyError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function siteFrom(req: Request): Site {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) throw new PasskeyError("Cannot determine the site for passkeys", 500);
  const hostname = host.split(":")[0];
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const proto = req.headers.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: hostname };
}

function putChallenge(key: string, challenge: string) {
  challenges.set(key, { challenge, expires: Date.now() + CHALLENGE_TTL });
}

function takeChallenge(key: string): string {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry || entry.expires < Date.now()) {
    throw new PasskeyError("Challenge expired, start again");
  }
  return entry.challenge;
}

export async function registrationOptions(label: string, site: Site) {
  const userID = new Uint8Array(randomBytes(16));
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: site.rpID,
    userName: label,
    userDisplayName: label,
    userID,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: [...credentials.values()].map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
  });
  putChallenge(`reg:${label}`, options.challenge);
  return options;
}

export async function register(
  label: string,
  response: RegistrationResponseJSON,
  site: Site,
): Promise<string> {
  const expectedChallenge = takeChallenge(`reg:${label}`);
  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: site.origin,
    expectedRPID: site.rpID,
  });
  if (!result.verified || !result.registrationInfo) {
    throw new PasskeyError("Passkey registration could not be verified");
  }
  const cred = result.registrationInfo.credential;
  credentials.set(cred.id, {
    id: cred.id,
    publicKey: cred.publicKey,
    counter: cred.counter,
    transports: cred.transports,
    label,
    createdAt: Date.now(),
  });
  return openSession(cred.id, label);
}

export async function authenticationOptions(site: Site) {
  if (credentials.size === 0) {
    throw new PasskeyError("No passkey registered on this server yet", 404);
  }
  const options = await generateAuthenticationOptions({
    rpID: site.rpID,
    userVerification: "preferred",
    allowCredentials: [...credentials.values()].map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
  });
  putChallenge("auth", options.challenge);
  return options;
}

export async function authenticate(
  response: AuthenticationResponseJSON,
  site: Site,
): Promise<string> {
  const expectedChallenge = takeChallenge("auth");
  const stored = credentials.get(response.id);
  if (!stored) throw new PasskeyError("Unknown passkey", 404);
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: site.origin,
    expectedRPID: site.rpID,
    credential: {
      id: stored.id,
      publicKey: stored.publicKey,
      counter: stored.counter,
      transports: stored.transports,
    },
  });
  if (!result.verified) throw new PasskeyError("Passkey could not be verified");
  stored.counter = result.authenticationInfo.newCounter;
  return openSession(stored.id, stored.label);
}

function openSession(credentialId: string, label: string): string {
  const token = randomBytes(24).toString("base64url");
  sessions.set(token, { credentialId, label, createdAt: Date.now() });
  return token;
}

export function readSession(token: string | undefined) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return { label: session.label, credentialId: session.credentialId };
}

export function closeSession(token: string | undefined) {
  if (token) sessions.delete(token);
}

export function hasPasskey() {
  return credentials.size > 0;
}
