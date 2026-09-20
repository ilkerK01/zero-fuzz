import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const CONFIRM_TRIES = 12;
const CONFIRM_DELAY = 1500;

export type AuditRecord = {
  txHash: string;
  wasmHash: string;
  resultHash: string;
  passed: boolean;
  lanes: number;
};

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function bytes32(buf: Buffer): xdr.ScVal {
  if (buf.length !== 32) throw new Error("expected a 32 byte value");
  return xdr.ScVal.scvBytes(buf);
}

async function contractId(): Promise<string | null> {
  const configured = process.env.ZF_REGISTRY_CONTRACT;
  if (configured) return configured;
  try {
    const raw = await readFile(path.join(process.cwd(), "contracts", "deployments.json"), "utf8");
    const parsed = JSON.parse(raw) as { testnet?: { registry?: { contractId?: string } } };
    return parsed.testnet?.registry?.contractId ?? null;
  } catch {
    return null;
  }
}

export async function targetHash(): Promise<Buffer> {
  try {
    const source = await readFile(
      path.join(process.cwd(), "sandbox", "harness", "src", "lib.rs"),
      "utf8",
    );
    return sha256(source);
  } catch {
    return sha256("zf-harness-unavailable");
  }
}

export async function record(
  resultSource: string,
  passed: boolean,
  lanes: number,
): Promise<AuditRecord | null> {
  const secret = process.env.ZF_ACCOUNT_SECRET;
  const id = await contractId();
  if (!secret || !id) return null;

  const keypair = Keypair.fromSecret(secret);
  const server = new rpc.Server(RPC_URL);
  const wasmHash = await targetHash();
  const resultHash = sha256(resultSource);

  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(id);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "record",
        bytes32(wasmHash),
        bytes32(resultHash),
        nativeToScVal(passed, { type: "bool" }),
        nativeToScVal(lanes, { type: "u32" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);
  prepared.sign(keypair);

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new Error(`Soroban rejected the audit record: ${JSON.stringify(sent.errorResult)}`);
  }

  for (let i = 0; i < CONFIRM_TRIES; i++) {
    await new Promise((r) => setTimeout(r, CONFIRM_DELAY));
    const got = await server.getTransaction(sent.hash);
    if (got.status === "SUCCESS") {
      return {
        txHash: sent.hash,
        wasmHash: wasmHash.toString("hex"),
        resultHash: resultHash.toString("hex"),
        passed,
        lanes,
      };
    }
    if (got.status === "FAILED") {
      throw new Error("the audit record transaction failed on chain");
    }
  }

  throw new Error("the audit record transaction did not confirm in time");
}
