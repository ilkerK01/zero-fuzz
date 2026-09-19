"use client";

import { useEffect, useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { AmountDisplay, Kicker, StatusPill, TxLink } from "@/components/ui";
import { useLang } from "@/components/lang";

const amounts = [500, 1000, 2000, 3000];

type Result = {
  deposit: { id: string; iban: string; memo: string; bank: string; feePercent: number };
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
  balance: string;
};

export default function DepositPage() {
  const { t, lang } = useLang();
  const tr = lang === "tr";
  const [amount, setAmount] = useState(1000);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/anchor");
        const data = (await res.json()) as { balance?: string };
        if (!cancelled && res.ok) setBalance(data.balance ?? "0");
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/anchor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Deposit failed");
      setResult(data);
      setBalance(data.balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
        <Kicker>{t("dep.title")}</Kicker>
        <h1 className="font-display mt-3 text-2xl text-fg">{t("dep.title")}</h1>
        <p className="mt-3 max-w-xl text-fg-2">{t("dep.body")}</p>

        <div className="mt-8 border border-line bg-surface p-6">
          <div className="flex items-center justify-between text-[11px] text-fg-3">
            <span>{t("dep.method")}</span>
            <StatusPill tone="agent">SEP-6 · testnet</StatusPill>
          </div>

          <label className="mt-6 block text-[11px] text-fg-2">{t("dep.amount")}</label>
          <div className="mt-3 flex items-center border border-line-strong bg-inset">
            <input
              type="number"
              value={amount}
              min={50}
              max={3000}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="mono w-full bg-transparent px-4 py-3 text-2xl tabular-nums text-fg outline-none"
            />
            <span className="px-4 text-sm text-fg-3">TRY</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {amounts.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`mono border px-3 py-1.5 text-[12px] tabular-nums transition ${
                  amount === a
                    ? "border-agent text-agent"
                    : "border-line-strong text-fg-2 hover:border-agent"
                }`}
              >
                {a.toLocaleString("en-US")}
              </button>
            ))}
          </div>

          {balance !== null ? (
            <div className="mt-6 flex items-center justify-between border-t border-line pt-6">
              <span className="text-[11px] text-fg-3">{t("dep.balance")}</span>
              <AmountDisplay value={Number(balance).toFixed(2)} unit="USDC" tone="ok" size="lg" />
            </div>
          ) : null}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-6 w-full bg-agent px-5 py-3 text-sm font-medium text-inset transition hover:brightness-110 disabled:opacity-50"
          >
            {busy
              ? tr
                ? "Anchor ile konuşuluyor ..."
                : "Talking to the anchor ..."
              : t("dep.submit")}
          </button>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>

        {result ? (
          <div className="glow-ok mt-6 bg-surface p-6">
            <StatusPill tone="ok">{result.status}</StatusPill>
            <h2 className="font-display mt-4 text-xl text-fg">
              {tr ? "Para zincire düştü." : "The money landed on chain."}
            </h2>
            <dl className="mono mt-5 space-y-px bg-line text-[12px]">
              <div className="flex items-center justify-between bg-surface px-4 py-3">
                <dt className="text-fg-3">{tr ? "Yatırılan" : "Deposited"}</dt>
                <dd className="text-fg">{amount.toLocaleString("en-US")} TRY</dd>
              </div>
              <div className="flex items-center justify-between bg-surface px-4 py-3">
                <dt className="text-fg-3">{tr ? "Alınan" : "Received"}</dt>
                <dd className="text-ok">{result.amountOut ?? "-"} USDC</dd>
              </div>
              <div className="flex items-center justify-between bg-surface px-4 py-3">
                <dt className="text-fg-3">IBAN</dt>
                <dd className="text-fg-2">{result.deposit.iban}</dd>
              </div>
              <div className="flex items-center justify-between bg-surface px-4 py-3">
                <dt className="text-fg-3">{tr ? "Açıklama" : "Reference"}</dt>
                <dd className="text-fg-2">{result.deposit.memo}</dd>
              </div>
              {result.stellarTxId ? (
                <div className="flex items-center justify-between bg-surface px-4 py-3">
                  <dt className="text-fg-3">{tr ? "Zincir işlemi" : "Stellar tx"}</dt>
                  <dd>
                    <TxLink
                      hash={result.stellarTxId}
                      href={`https://stellar.expert/explorer/testnet/tx/${result.stellarTxId}`}
                    />
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
