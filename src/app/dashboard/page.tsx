"use client";

import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { PasskeyBadge, PasskeyGate } from "@/components/passkey";
import { WalletConnect } from "@/components/wallet-connect";
import { AmountDisplay, Button, Kicker } from "@/components/ui";
import { useLang } from "@/components/lang";

export default function DashboardPage() {
  const { t } = useLang();
  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <Kicker>{t("dash.title")}</Kicker>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11px] text-fg-3">
                {t("dash.credit")}
              </span>
              <AmountDisplay value="0.00" unit="TRYC" tone="muted" size="lg" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WalletConnect />
            <PasskeyBadge />
            <Button href="/deposit" variant="ghost">{t("nav.deposit")}</Button>
            <Button href="/scan/new" variant="primary">{t("dash.newscan")}</Button>
          </div>
        </div>

        <div className="mt-8">
          <PasskeyGate>
        <div className="grid-lines flex min-h-[420px] flex-col items-center justify-center border border-line bg-surface p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-line-strong bg-inset">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="12" cy="12" r="8" stroke="#5A636E" strokeWidth="2" />
              <path d="M18 18L26 26" stroke="#5A636E" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="mt-6 text-lg text-fg">{t("dash.empty.t")}</h2>
          <p className="mt-2 max-w-sm text-sm text-fg-2">{t("dash.empty.b")}</p>
          <div className="mt-6">
            <Button href="/scan/new" variant="primary">{t("dash.empty.cta")}</Button>
          </div>
        </div>
          </PasskeyGate>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
