"use client";

import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { Button, TxLink } from "@/components/ui";
import { BrandInline } from "@/components/logo";
import { useLang } from "@/components/lang";
import { finding } from "@/lib/mock";

export default function CertificatePage() {
  const { t } = useLang();
  return (
    <>
      <FloatingNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 pt-28 pb-16">
        <div className="glow-ok w-full bg-surface p-10 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center border border-ok bg-inset glow-ok">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M8 20l8 8 16-16" stroke="#3DDC84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ok/50 bg-ok/10 px-4 py-1.5 text-sm font-medium text-ok">
              <BrandInline size={14} />
              {t("cert.stampSuffix")}
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">{t("cert.title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-2">{t("cert.body")}</p>

          <dl className="mono mt-8 space-y-px bg-line text-left text-[12px]">
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <dt className="text-fg-3">{t("cert.contract")}</dt>
              <dd><TxLink hash={finding.contract} /></dd>
            </div>
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <dt className="text-fg-3">{t("cert.hash")}</dt>
              <dd className="text-fg">{finding.resultHash.slice(0, 8)}…{finding.resultHash.slice(-8)}</dd>
            </div>
            <div className="flex items-center justify-between bg-surface px-4 py-3">
              <dt className="text-fg-3">{t("cert.date")}</dt>
              <dd className="text-fg">2026-09-19</dd>
            </div>
          </dl>

          <div className="mt-8">
            <Button href="/dashboard" variant="ghost">{t("cert.view")}</Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
