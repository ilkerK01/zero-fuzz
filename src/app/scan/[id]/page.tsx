"use client";

import { useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { Terminal } from "@/components/terminal";
import { AmountDisplay, Button, Kicker, Panel, StatusPill, TxLink } from "@/components/ui";
import { useLang } from "@/components/lang";
import { finding } from "@/lib/mock";

export default function ScanPage() {
  const { t } = useLang();
  const [done, setDone] = useState(false);

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Kicker tone={done ? "danger" : "agent"}>
              {done ? t("hero7.kicker") : t("term.title")}
            </Kicker>
            <p className="mono mt-2 text-sm text-fg-3">registry_pool.rs · 214 lines</p>
          </div>
          <StatusPill tone={done ? "danger" : "agent"} pulse={!done}>
            {done ? t("term.status.vuln") : t("term.status.fuzzing")}
          </StatusPill>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel className="p-0" glow={done ? "danger" : undefined}>
            <Terminal onDone={() => setDone(true)} />
          </Panel>

          <div className="space-y-4">
            <div className="border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between text-[11px] text-fg-3">
                <span>{t("term.budget")}</span>
                <span className="text-agent">{finding.spent.toFixed(1)} / {finding.budget} TRYC</span>
              </div>
              <div className="h-1.5 w-full bg-inset">
                <div
                  className="h-full bg-agent transition-all duration-700"
                  style={{ width: `${(finding.spent / finding.budget) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[12px]">
                <span className="text-fg-3">{t("hero7.cycles")}</span>
                <span className="tabular-nums text-fg">{finding.cycles}</span>
              </div>
            </div>

            {done ? (
              <div className="rise glow-danger bg-surface p-5">
                <StatusPill tone="danger" pulse>{t("hero7.critical")}</StatusPill>
                <h2 className="font-display mt-4 text-2xl text-fg">{t("hero7.title")}</h2>
                <p className="mono mt-3 text-sm text-danger">{finding.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-2">{t("hero7.desc")}</p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[12px]">
                  <span className="text-fg-3">{t("hero7.bill")}</span>
                  <AmountDisplay value={finding.spent.toFixed(1)} unit="TRYC" tone="danger" />
                </div>
                <div className="mt-3">
                  <TxLink hash={finding.contract} />
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button href="/scan/demo/patch" variant="danger">{t("hero7.patch")}</Button>
                  <p className="text-center text-[11px] text-fg-3">
                    {t("hero7.cert")}
                  </p>
                </div>
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
