"use client";

import { useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { AmountDisplay, Button, Kicker } from "@/components/ui";
import { useLang } from "@/components/lang";

type LaneKey = "state" | "auth" | "comp";

export default function NewScanPage() {
  const { t } = useLang();
  const [lanes, setLanes] = useState<Record<LaneKey, boolean>>({
    state: true,
    auth: false,
    comp: true,
  });

  const laneDefs: { key: LaneKey; title: string; desc: string }[] = [
    { key: "state", title: t("up.lane.state"), desc: t("up.lane.state.d") },
    { key: "auth", title: t("up.lane.auth"), desc: t("up.lane.auth.d") },
    { key: "comp", title: t("up.lane.comp"), desc: t("up.lane.comp.d") },
  ];
  const selected = Object.values(lanes).filter(Boolean).length;

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
        <Kicker>{t("up.title")}</Kicker>
        <h1 className="mt-3 font-display text-2xl text-fg">{t("up.title")}</h1>

        <label className="mt-8 grid-lines flex cursor-pointer flex-col items-center justify-center border border-dashed border-line-strong bg-surface p-12 text-center hover:border-agent">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M17 23V7M17 7l-6 6M17 7l6 6" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 25v2h22v-2" stroke="#5A636E" strokeWidth="2" />
          </svg>
          <p className="mt-4 text-sm text-fg">{t("up.drop")}</p>
          <p className="mt-1 text-[11px] text-fg-3">{t("up.hint")}</p>
          <input type="file" className="hidden" />
        </label>

        <div className="mt-8">
          <span className="text-[11px] text-fg-2">{t("up.lanes")}</span>
          <div className="mt-3 space-y-px bg-line">
            {laneDefs.map((lane) => {
              const on = lanes[lane.key];
              return (
                <button
                  key={lane.key}
                  onClick={() => setLanes((p) => ({ ...p, [lane.key]: !p[lane.key] }))}
                  className="flex w-full items-start gap-4 bg-surface p-4 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                      on ? "border-agent bg-agent" : "border-line-strong"
                    }`}
                  >
                    {on ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5.5L4 8L8.5 2.5" stroke="#060708" strokeWidth="1.6" />
                      </svg>
                    ) : null}
                  </span>
                  <span>
                    <span className={`block text-sm ${on ? "text-fg" : "text-fg-2"}`}>{lane.title}</span>
                    <span className="mt-0.5 block text-xs text-fg-3">{lane.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <div>
            <span className="block text-[11px] text-fg-3">{t("up.est")}</span>
            <AmountDisplay value={`~${(selected * 6.5).toFixed(1)}`} unit="TRYC" tone="agent" size="lg" />
          </div>
          <Button href="/scan/demo" variant="primary">{t("up.start")}</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
