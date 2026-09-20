"use client";

import { useState, useSyncExternalStore } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { LiveScan, type ScanReport } from "@/components/live-scan";
import { AmountDisplay, Button, Kicker, Panel, StatusPill, TxLink } from "@/components/ui";
import { useLang } from "@/components/lang";

function subscribeNoop() {
  return () => {};
}

function readStoredTarget(): string | null {
  try {
    return sessionStorage.getItem("zf-target");
  } catch {
    return null;
  }
}

export default function ScanPage() {
  const { t } = useLang();
  const [report, setReport] = useState<ScanReport | null>(null);
  const storedTarget = useSyncExternalStore(subscribeNoop, readStoredTarget, () => null);
  const done = report !== null;
  const vulnerable = report?.vulnerable ?? false;
  const noVerdict = Boolean(
    report && (!report.modelAvailable || !report.sandboxAvailable || !report.sandbox.compiled)
  );
  const noVerdictReason = !report
    ? ""
    : !report.modelAvailable
      ? (report.modelError ?? t("scan.nomodel"))
      : !report.sandboxAvailable
        ? t("scan.nosandbox")
        : t("scan.nocompile");
  const billing = report?.billing ?? { cycles: 0, spent: 0, budget: 20, durationMs: 0 };
  const testName = report?.sandbox.log.find((l) => /^test\s+\S+\s+\.\.\./.test(l))?.split(/\s+/)[1];
  const targetLabel = report?.target ?? storedTarget ?? "zf_harness/src/lib.rs";

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Kicker tone={vulnerable ? "danger" : noVerdict ? "agent" : done ? "ok" : "agent"}>
              {vulnerable ? t("hero7.kicker") : t("term.title")}
            </Kicker>
            <p className="mono mt-2 text-sm text-fg-3">{targetLabel}</p>
          </div>
          <StatusPill tone={vulnerable ? "danger" : noVerdict ? "muted" : done ? "ok" : "agent"} pulse={!done}>
            {vulnerable
              ? t("term.status.vuln")
              : noVerdict
              ? t("term.status.nocompile")
              : done
              ? t("term.status.secure")
              : t("term.status.fuzzing")}
          </StatusPill>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel className="p-0" glow={vulnerable ? "danger" : noVerdict ? undefined : done ? "ok" : undefined}>
            <LiveScan onDone={setReport} />
          </Panel>

          <div className="space-y-4">
            <div className="border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between text-[11px] text-fg-3">
                <span>{t("term.budget")}</span>
                <span className="text-agent">{billing.spent.toFixed(1)} / {billing.budget} TRYC</span>
              </div>
              <div className="h-1.5 w-full bg-inset">
                <div
                  className="h-full bg-agent transition-all duration-700"
                  style={{ width: `${Math.min(100, (billing.spent / billing.budget) * 100)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[12px]">
                <span className="text-fg-3">{t("hero7.cycles")}</span>
                <span className="tabular-nums text-fg">{billing.cycles}</span>
              </div>
            </div>

            {vulnerable ? (
              <div className="rise glow-danger bg-surface p-5">
                <StatusPill tone="danger" pulse>{t("hero7.critical")}</StatusPill>
                <h2 className="font-display mt-4 text-2xl text-fg">{t("hero7.title")}</h2>
                <p className="mono mt-3 text-sm text-danger">{testName ?? report?.sandbox.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">{t("hero7.desc")}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[12px]">
                  <span className="text-fg-3">{t("hero7.bill")}</span>
                  <AmountDisplay value={billing.spent.toFixed(1)} unit="TRYC" tone="danger" />
                </div>
                {report?.audit ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-[11px] text-fg-3">
                      {t("scan.recorded")}
                    </p>
                    <div className="mt-2">
                      <TxLink
                        hash={report.audit.txHash}
                        href={`https://stellar.expert/explorer/testnet/tx/${report.audit.txHash}`}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="mt-5 flex flex-col gap-2">
                  <Button href="/scan/demo/patch" variant="danger">{t("hero7.patch")}</Button>
                  <p className="text-center text-[11px] text-fg-3">
                    {t("hero7.cert")}
                  </p>
                </div>
              </div>
            ) : noVerdict ? (
              <div className="border border-line bg-surface p-5">
                <StatusPill tone="muted">{t("term.status.nocompile")}</StatusPill>
                <p className="mt-3 text-sm leading-relaxed text-fg-2">{noVerdictReason}</p>
              </div>
            ) : (
              <Button href="/dashboard" variant="ghost" className="w-full">{t("term.stop")}</Button>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
