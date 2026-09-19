"use client";

import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { Button, Kicker, StatusPill } from "@/components/ui";
import { useLang } from "@/components/lang";
import { patch } from "@/lib/mock";

function CodeBlock({
  lines,
  tone,
  label,
}: {
  lines: string[];
  tone: "danger" | "ok";
  label: string;
}) {
  const border = tone === "danger" ? "border-danger/50" : "border-ok/50";
  const bar = tone === "danger" ? "bg-danger" : "bg-ok";
  return (
    <div className={`border ${border} bg-inset`}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[11px] text-fg-3">
        <span className={`h-2 w-2 ${bar}`} />
        {label}
      </div>
      <pre className="mono overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-6 shrink-0 select-none text-right text-fg-3">{i + 1}</span>
            <span className={tone === "danger" ? "text-danger/90" : "text-ok/90"}>{l || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function PatchPage() {
  const { t } = useLang();
  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <Kicker tone="ok">{t("patch.title")}</Kicker>
            <h1 className="mt-3 font-display text-2xl text-fg">{t("patch.title")}</h1>
          </div>
          <StatusPill tone="danger">{t("hero7.name")}</StatusPill>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <CodeBlock lines={patch.before} tone="danger" label={t("patch.before")} />
          <CodeBlock lines={patch.after} tone="ok" label={t("patch.after")} />
        </div>

        <div className="mt-6 border-l-2 border-ok bg-surface p-5">
          <p className="text-sm leading-relaxed text-fg-2">{t("patch.explain")}</p>
        </div>

        <div className="mt-8">
          <Button href="/scan/demo/certificate" variant="primary">{t("patch.rescan")}</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
