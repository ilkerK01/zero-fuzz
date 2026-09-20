"use client";

import { useState } from "react";
import { useLang } from "@/components/lang";
import { connectWallet, signChallenge } from "@/lib/wallet";
import { useWallet } from "@/components/wallet";

type Phase = "idle" | "connecting" | "verifying" | "error";

export function WalletConnect() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const { address, verified, connect: remember, markVerified, disconnect } = useWallet();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "";

  const connect = async () => {
    setError(null);
    setPhase("connecting");
    try {
      const addr = await connectWallet();
      remember(addr);
      setPhase("idle");
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") {
        setPhase("idle");
        return;
      }
      setError(tr ? "Cüzdan bağlanamadı" : "Could not connect wallet");
      setPhase("error");
    }
  };

  const verify = async () => {
    if (!address) return;
    setError(null);
    setPhase("verifying");
    try {
      const res = await fetch(`/api/anchor/challenge?account=${address}`);
      const data = (await res.json()) as {
        transaction: string;
        networkPassphrase: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error);
      const signed = await signChallenge(data.transaction, address, data.networkPassphrase);
      const verifyRes = await fetch("/api/anchor/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transaction: signed }),
      });
      const out = (await verifyRes.json()) as { token?: string; verified?: boolean; error?: string };
      if (!verifyRes.ok || !out.verified || !out.token) throw new Error(out.error);
      markVerified(out.token);
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : tr ? "Doğrulama başarısız" : "Verification failed");
      setPhase("error");
    }
  };

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={phase === "connecting"}
        className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-fg transition hover:border-agent hover:text-agent disabled:opacity-50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-fg-3" />
        {phase === "connecting"
          ? tr ? "Bağlanıyor…" : "Connecting…"
          : tr ? "Cüzdan bağla" : "Connect wallet"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="mono inline-flex items-center gap-2 rounded-full border border-line-strong bg-inset px-3 py-1.5 text-xs text-fg">
        <span className={`h-1.5 w-1.5 rounded-full ${verified ? "bg-ok" : "bg-agent"}`} />
        {short}
      </span>
      {verified ? (
        <span className="rounded-full border border-ok/50 bg-ok/10 px-3 py-1.5 text-xs font-medium text-ok">
          {tr ? "SEP-10 doğrulandı" : "SEP-10 verified"}
        </span>
      ) : (
        <button
          onClick={verify}
          disabled={phase === "verifying"}
          className="rounded-full bg-gradient-to-r from-agent to-[#8AF0FF] px-3.5 py-1.5 text-xs font-medium text-inset transition hover:brightness-105 disabled:opacity-50"
        >
          {phase === "verifying"
            ? tr ? "İmzalanıyor…" : "Signing…"
            : tr ? "Anchor ile doğrula" : "Verify with anchor"}
        </button>
      )}
      <button
        onClick={() => {
          disconnect();
          setPhase("idle");
          setError(null);
        }}
        className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-fg-3 transition hover:border-danger hover:text-danger"
      >
        {tr ? "Ayır" : "Disconnect"}
      </button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
