"use client";

import Link from "next/link";
import { useLang } from "@/components/lang";
import { BrandInline, Logo } from "@/components/logo";
import { FlagGB, FlagTR } from "@/components/marketing/primitives";

function LangToggle() {
  const { lang, setLang } = useLang();
  const next = lang === "en" ? "tr" : "en";
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={next === "tr" ? "Türkçe'ye geç" : "Switch to English"}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1.5 text-xs font-medium text-fg-2 transition hover:border-agent hover:text-agent"
    >
      {next === "tr" ? <FlagTR /> : <FlagGB />}
      {next === "tr" ? "TR" : "EN"}
    </button>
  );
}

export function FloatingNav() {
  const { t } = useLang();
  return (
    <div className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-line-strong bg-surface/90 py-2 pr-2 pl-4 backdrop-blur-md sm:pl-6">
        <Link href="/" aria-label="Z-FUZZ home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm lg:flex">
          <Link href="/#how" className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-fg/5 hover:text-fg">{t("nav.how")}</Link>
          <Link href="/#who" className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-fg/5 hover:text-fg">{t("nav.classes")}</Link>
          <Link href="/#pricing" className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-fg/5 hover:text-fg">{t("nav.pricing")}</Link>
          <Link href="/#coverage" className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-fg/5 hover:text-fg">{t("nav.coverage")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <Link
            href="/deposit"
            className="hidden rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-fg transition hover:border-agent hover:text-agent sm:inline-flex"
          >
            {t("nav.deposit")}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-gradient-to-r from-agent to-[#8AF0FF] px-4 py-2 text-sm font-medium whitespace-nowrap text-inset hover:brightness-105"
          >
            {t("nav.launch")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const { t, lang } = useLang();
  const tr = lang === "tr";
  const cols: { title: string; links: [string, string][] }[] = [
    {
      title: tr ? "Ürün" : "Product",
      links: [
        [tr ? "Nasıl çalışır" : "How it works", "/#how"],
        [tr ? "Yeni tarama" : "New scan", "/scan/new"],
        [tr ? "Kredi yükle" : "Add credit", "/deposit"],
        [tr ? "Panel" : "Dashboard", "/dashboard"],
      ],
    },
    {
      title: tr ? "Kulvarlar" : "Lanes",
      links: [
        [tr ? "State yaşam döngüsü" : "State lifecycle", "/scan/new"],
        [tr ? "Yetkilendirme" : "Authorization", "/scan/new"],
        ["Composability", "/scan/new"],
        [tr ? "Aritmetik" : "Arithmetic", "/scan/new"],
      ],
    },
    {
      title: "Z-FUZZ",
      links: [
        [tr ? "Neden Z-FUZZ" : "Why Z-FUZZ", "/#why"],
        [tr ? "Hata sınıfları" : "Bug classes", "/#classes"],
        [tr ? "Fiyatlama" : "Pricing", "/#pricing"],
        [tr ? "Kapsama" : "Coverage", "/#coverage"],
      ],
    },
    {
      title: tr ? "Altyapı" : "Built on",
      links: [
        ["Stellar", "https://stellar.org"],
        ["Soroban", "https://developers.stellar.org"],
        ["Blend", "https://blend.capital"],
        ["Stellar Expert", "https://stellar.expert/explorer/testnet"],
      ],
    },
  ];
  return (
    <footer className="mt-auto border-t border-line bg-inset">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-fg-2">{t("foot.tag")}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-medium text-fg">
              {c.title === "Z-FUZZ" ? <BrandInline size={14} /> : c.title}
            </p>
            <ul className="space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith("http") ? (
                    <a href={href} target="_blank" rel="noreferrer" className="text-fg-2 hover:text-agent">
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className="text-fg-2 hover:text-agent">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-fg-3 sm:px-6">
          <span>© 2026 Z-FUZZ · Rise In x Stellar Pro Hackathon, Istanbul</span>
          <span>{t("foot.built")}</span>
        </div>
      </div>
    </footer>
  );
}
