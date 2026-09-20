"use client";

import { useEffect, useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { AmountDisplay, Kicker, StatusPill, TxLink } from "@/components/ui";
import { useLang } from "@/components/lang";
import { useWallet } from "@/components/wallet";
import { WalletConnect } from "@/components/wallet-connect";
import { ensureWallet, signXdr } from "@/lib/wallet";

const amounts = [500, 1000, 2000, 3000];
const usdcAmounts = [1, 5, 10];

type Result = {
  deposit: { id: string; iban: string; memo: string; bank: string; feePercent: number };
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
  balance: string;
};

type WithdrawInfo = { id: string; iban: string; rate: string | null; feePercent: number; memo: string };

type WithdrawResult = {
  withdraw: WithdrawInfo;
  amountIn: string;
  status: string;
  amountOut: string | null;
  stellarTxId: string | null;
  balance: string;
};

type WalletWithdrawInit = {
  xdr?: string;
  networkPassphrase?: string;
  amountIn?: string;
  withdraw?: WithdrawInfo;
  error?: string;
};

type Stage = "" | "anchor" | "sign" | "submit";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-surface px-4 py-3">
      <dt className="text-fg-3">{label}</dt>
      <dd className="text-fg-2">{children}</dd>
    </div>
  );
}

async function signWithFallback(xdr: string, address: string, networkPassphrase: string) {
  try {
    return await signXdr(xdr, address, networkPassphrase);
  } catch {
    await ensureWallet();
    return await signXdr(xdr, address, networkPassphrase);
  }
}

export default function DepositPage() {
  const { t, lang } = useLang();
  const { address: wallet, verified, token, expire } = useWallet();
  const tr = lang === "tr";
  const [tab, setTab] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState(1000);
  const [usdc, setUsdc] = useState(1);
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [withdrawn, setWithdrawn] = useState<WithdrawResult | null>(null);
  const [source, setSource] = useState<{ connected: boolean; funded: boolean; trustline: boolean } | null>(null);
  const [prepBusy, setPrepBusy] = useState(false);
  const [prepStage, setPrepStage] = useState<Stage>("");
  const [prepError, setPrepError] = useState<string | null>(null);

  const mode: "demo" | "unverified" | "wallet" = !wallet ? "demo" : !verified ? "unverified" : "wallet";
  const needsPrepare = mode === "wallet" && source !== null && (!source.funded || !source.trustline);

  const loadBalance = async () => {
    try {
      const url = wallet ? `/api/anchor?address=${wallet}` : "/api/anchor";
      const res = await fetch(url);
      const data = (await res.json()) as {
        balance?: string;
        connected?: boolean;
        funded?: boolean;
        trustline?: boolean;
      };
      if (res.ok) {
        setBalance(data.balance ?? "0");
        setSource({
          connected: Boolean(data.connected),
          funded: data.funded !== false,
          trustline: data.trustline !== false,
        });
      }
    } catch {}
  };

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

  const switchTab = (next: "in" | "out") => {
    setTab(next);
    setError(null);
    setResult(null);
    setWithdrawn(null);
    setPrepError(null);
  };

  const prepareAccount = async () => {
    if (!wallet) return;
    setPrepBusy(true);
    setPrepError(null);
    setPrepStage("anchor");
    try {
      const res = await fetch("/api/wallet/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: wallet }),
      });
      const data = (await res.json()) as {
        ready?: boolean;
        funded?: boolean;
        xdr?: string;
        networkPassphrase?: string;
        error?: string;
      };
      if (res.status === 401) {
        expire();
        setPrepError(data.error ?? (tr ? "Oturum süresi doldu" : "Session expired"));
        return;
      }
      if (!res.ok) throw new Error(data.error ?? (tr ? "Hazırlık başarısız" : "Prepare failed"));
      if (data.xdr && data.networkPassphrase) {
        setPrepStage("sign");
        let signed: string;
        try {
          signed = await signWithFallback(data.xdr, wallet, data.networkPassphrase);
        } catch {
          setPrepError(t("wallet.sign.cancelled"));
          return;
        }
        setPrepStage("submit");
        const subRes = await fetch("/api/wallet/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ xdr: signed }),
        });
        const subData = (await subRes.json()) as { hash?: string; error?: string };
        if (subRes.status === 401) {
          expire();
          setPrepError(subData.error ?? (tr ? "Oturum süresi doldu" : "Session expired"));
          return;
        }
        if (!subRes.ok) throw new Error(subData.error ?? (tr ? "Gönderim başarısız" : "Submit failed"));
      }
      await loadBalance();
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : tr ? "Hazırlık başarısız" : "Prepare failed");
    } finally {
      setPrepBusy(false);
      setPrepStage("");
    }
  };

  const submitDeposit = async () => {
    setBusy(true);
    setStage("anchor");
    setError(null);
    setResult(null);
    try {
      const body: { amount: number; address?: string; token?: string } = { amount };
      if (mode === "wallet" && wallet && token) {
        body.address = wallet;
        body.token = token;
      }
      const res = await fetch("/api/anchor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (res.status === 401) {
        expire();
        throw new Error(data.error ?? (tr ? "Oturum süresi doldu" : "Session expired"));
      }
      if (!res.ok) throw new Error(data.error ?? "Deposit failed");
      setResult(data);
      setBalance(data.balance);
      await loadBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  const submitWithdraw = async () => {
    setBusy(true);
    setStage("anchor");
    setError(null);
    setWithdrawn(null);
    try {
      if (mode === "wallet" && wallet && token) {
        const res = await fetch("/api/anchor/withdraw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ amount: usdc, address: wallet, token }),
        });
        const data = (await res.json()) as WalletWithdrawInit;
        if (res.status === 401) {
          expire();
          throw new Error(data.error ?? (tr ? "Oturum süresi doldu" : "Session expired"));
        }
        if (!res.ok || !data.xdr || !data.networkPassphrase || !data.withdraw) {
          throw new Error(data.error ?? (tr ? "Çekim başlatılamadı" : "Withdrawal failed"));
        }
        const withdrawInfo = data.withdraw;
        setStage("sign");
        let signed: string;
        try {
          signed = await signWithFallback(data.xdr, wallet, data.networkPassphrase);
        } catch {
          setError(t("wallet.sign.cancelled"));
          return;
        }
        setStage("submit");
        const subRes = await fetch("/api/anchor/withdraw/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ xdr: signed, id: withdrawInfo.id, token, address: wallet }),
        });
        const subData = (await subRes.json()) as {
          status?: string;
          amountOut?: string | null;
          stellarTxId?: string | null;
          balance?: string;
          error?: string;
        };
        if (subRes.status === 401) {
          expire();
          throw new Error(subData.error ?? (tr ? "Oturum süresi doldu" : "Session expired"));
        }
        if (!subRes.ok) throw new Error(subData.error ?? (tr ? "Çekim gönderilemedi" : "Withdrawal submit failed"));
        setWithdrawn({
          withdraw: withdrawInfo,
          amountIn: data.amountIn ?? String(usdc),
          status: subData.status ?? "pending",
          amountOut: subData.amountOut ?? null,
          stellarTxId: subData.stellarTxId ?? null,
          balance: subData.balance ?? balance ?? "0",
        });
        if (subData.balance) setBalance(subData.balance);
        await loadBalance();
        return;
      }

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
      void loadBalance();
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  const available = balance === null ? 0 : Number(balance);

  const stageLabel = (s: Stage) => {
    if (s === "sign") return t("stage.sign");
    if (s === "submit") return t("stage.submit");
    return t("stage.anchor");
  };

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
        <Kicker>{tab === "in" ? t("dep.title") : t("wd.title")}</Kicker>
        <h1 className="font-display mt-3 text-2xl text-fg">
          {tab === "in" ? t("dep.title") : t("wd.title")}
        </h1>
        <p className="mt-3 max-w-xl text-fg-2">{tab === "in" ? t("dep.body") : t("wd.body")}</p>

        <div className="mt-6">
          <WalletConnect />
        </div>

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

          {mode === "wallet" && needsPrepare ? (
            <div className="mt-6">
              <p className="text-sm text-fg-2">{t("prep.needed")}</p>
            </div>
          ) : tab === "in" ? (
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
              {mode === "unverified" ? (
                <p className="mt-2 text-[11px] text-danger">{t("wallet.verify.hint")}</p>
              ) : null}
            </div>
          ) : null}

          {mode === "wallet" && needsPrepare ? (
            <>
              <button
                onClick={prepareAccount}
                disabled={prepBusy}
                className="mt-6 w-full bg-agent px-5 py-3 text-sm font-medium text-inset transition hover:brightness-110 disabled:opacity-50"
              >
                {prepBusy ? stageLabel(prepStage) : t("prep.button")}
              </button>
              {prepError ? <p className="mt-4 text-sm text-danger">{prepError}</p> : null}
            </>
          ) : (
            <>
              <button
                onClick={tab === "in" ? submitDeposit : submitWithdraw}
                disabled={busy || mode === "unverified" || (tab === "out" && (usdc <= 0 || usdc > available))}
                className="mt-6 w-full bg-agent px-5 py-3 text-sm font-medium text-inset transition hover:brightness-110 disabled:opacity-50"
              >
                {busy
                  ? stageLabel(stage)
                  : tab === "in"
                    ? t("dep.submit")
                    : t("wd.submit")}
              </button>
              {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
            </>
          )}
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
