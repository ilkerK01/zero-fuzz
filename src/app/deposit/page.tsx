"use client";

import { useEffect, useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { AmountDisplay, Kicker, StatusPill, TxLink } from "@/components/ui";
import { useLang } from "@/components/lang";
import { useWallet } from "@/components/wallet";

const amounts = [500, 1000, 2000, 3000];
const usdcAmounts = [1, 5, 10];

type Result = {
  deposit: { id: string; iban: string; memo: string; bank: string; feePercent: number };
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
  balance: string;
};

type WithdrawResult = {
  withdraw: { id: string; iban: string; rate: string | null; feePercent: number; memo: string };
  amountIn: string;
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
  balance: string;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-surface px-4 py-3">
      <dt className="text-fg-3">{label}</dt>
      <dd className="text-fg-2">{children}</dd>
    </div>
  );
}

export default function DepositPage() {
  const { t, lang } = useLang();
  const { address: wallet } = useWallet();
  const tr = lang === "tr";
  const [tab, setTab] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState(1000);
  const [usdc, setUsdc] = useState(1);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [withdrawn, setWithdrawn] = useState<WithdrawResult | null>(null);
  const [source, setSource] = useState<{ connected: boolean; funded: boolean; trustline: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = wallet ? `/api/anchor?address=${wallet}` : "/api/anchor";
        const res = await fetch(url);
        const data = (await res.json()) as {
          balance?: string;
          connected?: boolean;
          funded?: boolean;
          trustline?: boolean;
        };
        if (!cancelled && res.ok) {
          setBalance(data.balance ?? "0");
          setSource({
            connected: Boolean(data.connected),
            funded: data.funded !== false,
            trustline: data.trustline !== false,
          });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const refreshBalance = async () => {
    try {
      const res = await fetch("/api/anchor");
      const data = (await res.json()) as { balance?: string };
      if (res.ok) setBalance(data.balance ?? "0");
    } catch {}
  };

  const switchTab = (next: "in" | "out") => {
    setTab(next);
    setError(null);
    setResult(null);
    setWithdrawn(null);
  };

  const submitDeposit = async () => {
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

  const submitWithdraw = async () => {
    setBusy(true);
    setError(null);
    setWithdrawn(null);
    try {
      const res = await fetch("/api/anchor/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: usdc }),
      });
      const data = (await res.json()) as WithdrawResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      setWithdrawn(data);
      setBalance(data.balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
      void refreshBalance();
    } finally {
      setBusy(false);
    }
  };

  const available = balance === null ? 0 : Number(balance);

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
        <Kicker>{tab === "in" ? t("dep.title") : t("wd.title")}</Kicker>
        <h1 className="font-display mt-3 text-2xl text-fg">
          {tab === "in" ? t("dep.title") : t("wd.title")}
        </h1>
        <p className="mt-3 max-w-xl text-fg-2">{tab === "in" ? t("dep.body") : t("wd.body")}</p>

        <div className="mt-8 flex border border-line-strong bg-inset">
          {(["in", "out"] as const).map((key) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              disabled={busy}
              className={`flex-1 px-5 py-3 text-sm transition disabled:opacity-50 ${
                tab === key ? "bg-agent text-inset" : "text-fg-2 hover:text-fg"
              }`}
            >
              {key === "in" ? t("dep.tab.in") : t("dep.tab.out")}
            </button>
          ))}
        </div>

        <div className="border border-t-0 border-line bg-surface p-6">
          <div className="flex items-center justify-between text-[11px] text-fg-3">
            <span>{tab === "in" ? t("dep.method") : t("wd.method")}</span>
            <StatusPill tone="agent">SEP-6 · testnet</StatusPill>
          </div>

          {tab === "in" ? (
            <>
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
            </>
          ) : (
            <>
              <label className="mt-6 block text-[11px] text-fg-2">{t("wd.amount")}</label>
              <div className="mt-3 flex items-center border border-line-strong bg-inset">
                <input
                  type="number"
                  value={usdc}
                  min={0.1}
                  step={0.1}
                  max={available}
                  onChange={(e) => setUsdc(Number(e.target.value) || 0)}
                  className="mono w-full bg-transparent px-4 py-3 text-2xl tabular-nums text-fg outline-none"
                />
                <span className="px-4 text-sm text-fg-3">USDC</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {usdcAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setUsdc(a)}
                    disabled={a > available}
                    className={`mono border px-3 py-1.5 text-[12px] tabular-nums transition disabled:opacity-40 ${
                      usdc === a
                        ? "border-agent text-agent"
                        : "border-line-strong text-fg-2 hover:border-agent"
                    }`}
                  >
                    {a}
                  </button>
                ))}
                <button
                  onClick={() => setUsdc(Number(available.toFixed(2)))}
                  className="mono border border-line-strong px-3 py-1.5 text-[12px] text-fg-2 transition hover:border-agent"
                >
                  {t("wd.max")}
                </button>
              </div>
            </>
          )}

          {balance !== null ? (
            <div className="mt-6 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-fg-3">
                  {tab === "in" ? t("dep.balance") : t("wd.available")}
                </span>
                <AmountDisplay value={Number(balance).toFixed(2)} unit="USDC" tone="ok" size="lg" />
              </div>
              <div className="mono mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className={source?.connected ? "text-ok" : "text-fg-3"}>
                  {source?.connected ? t("bal.connected") : t("bal.app")}
                </span>
                {wallet ? (
                  <span className="text-fg-3">
                    {wallet.slice(0, 4)}…{wallet.slice(-4)}
                  </span>
                ) : null}
              </div>
              {source?.connected && !source.funded ? (
                <p className="mt-2 text-[11px] text-danger">{t("bal.unfunded")}</p>
              ) : null}
              {source?.connected && source.funded && !source.trustline ? (
                <p className="mt-2 text-[11px] text-danger">{t("bal.notrust")}</p>
              ) : null}
              {!source?.connected ? (
                <p className="mt-2 text-[11px] text-fg-3">{t("bal.hint")}</p>
              ) : null}
            </div>
          ) : null}

          <button
            onClick={tab === "in" ? submitDeposit : submitWithdraw}
            disabled={busy || (tab === "out" && (usdc <= 0 || usdc > available))}
            className="mt-6 w-full bg-agent px-5 py-3 text-sm font-medium text-inset transition hover:brightness-110 disabled:opacity-50"
          >
            {busy
              ? tab === "in"
                ? tr
                  ? "Anchor ile konuşuluyor ..."
                  : "Talking to the anchor ..."
                : t("wd.busy")
              : tab === "in"
                ? t("dep.submit")
                : t("wd.submit")}
          </button>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        </div>

        {result ? (
          <div
            className={`mt-6 bg-surface p-6 ${result.status === "completed" ? "glow-ok" : "border border-line-strong"}`}
          >
            <StatusPill tone={result.status === "completed" ? "ok" : "agent"}>
              {result.status}
            </StatusPill>
            <h2 className="font-display mt-4 text-xl text-fg">
              {result.status === "completed"
                ? tr
                  ? "Para zincire düştü."
                  : "The money landed on chain."
                : tr
                  ? "Anchor işlemi sürüyor."
                  : "The anchor is still settling."}
            </h2>
            <dl className="mono mt-5 space-y-px bg-line text-[12px]">
              <Row label={tr ? "Yatırılan" : "Deposited"}>
                <span className="text-fg">{amount.toLocaleString("en-US")} TRY</span>
              </Row>
              <Row label={tr ? "Alınan" : "Received"}>
                <span className="text-ok">{result.amountOut ?? "-"} USDC</span>
              </Row>
              <Row label="IBAN">{result.deposit.iban}</Row>
              <Row label={tr ? "Açıklama" : "Reference"}>{result.deposit.memo}</Row>
              {result.stellarTxId ? (
                <Row label={tr ? "Zincir işlemi" : "Stellar tx"}>
                  <TxLink
                    hash={result.stellarTxId}
                    href={`https://stellar.expert/explorer/testnet/tx/${result.stellarTxId}`}
                  />
                </Row>
              ) : null}
            </dl>
          </div>
        ) : null}

        {withdrawn ? (
          <div
            className={`mt-6 bg-surface p-6 ${withdrawn.status === "completed" ? "glow-ok" : "border border-line-strong"}`}
          >
            <StatusPill tone={withdrawn.status === "completed" ? "ok" : "agent"}>
              {withdrawn.status}
            </StatusPill>
            <h2 className="font-display mt-4 text-xl text-fg">
              {withdrawn.status === "completed" ? t("wd.done") : t("wd.pending")}
            </h2>
            <dl className="mono mt-5 space-y-px bg-line text-[12px]">
              <Row label={t("wd.sent")}>
                <span className="text-fg">{withdrawn.amountIn} USDC</span>
              </Row>
              <Row label={t("wd.paid")}>
                <span className="text-ok">{withdrawn.amountOut ?? "-"} TRY</span>
              </Row>
              {withdrawn.withdraw.rate ? (
                <Row label={t("wd.rate")}>{withdrawn.withdraw.rate} TRY/USDC</Row>
              ) : null}
              {withdrawn.withdraw.iban ? <Row label="IBAN">{withdrawn.withdraw.iban}</Row> : null}
              {withdrawn.stellarTxId ? (
                <Row label={tr ? "Zincir işlemi" : "Stellar tx"}>
                  <TxLink
                    hash={withdrawn.stellarTxId}
                    href={`https://stellar.expert/explorer/testnet/tx/${withdrawn.stellarTxId}`}
                  />
                </Row>
              ) : null}
            </dl>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
