"use client";

import Image from "next/image";
import Link from "next/link";
import { ScanStory } from "@/components/scan-story";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import {
  ControlBanner,
  ForDevelopers,
  Lanes,
  WhyItMatters,
} from "@/components/home/sections";
import { Audiences, PanelShot } from "@/components/home/audience";
import { Button } from "@/components/ui";
import { Eyebrow, GradientText, Pill, techStrip, WaveLines } from "@/components/marketing/primitives";
import { useLang } from "@/components/lang";

const partners = [
  { code: "BLD", en: "Blend v2", tr: "Blend v2", kind: { en: "Lending pool", tr: "Borç havuzu" }, live: true },
  { code: "SWP", en: "Soroswap", tr: "Soroswap", kind: { en: "DEX / price", tr: "DEX / fiyat" }, live: true },
  { code: "DFX", en: "DeFindex", tr: "DeFindex", kind: { en: "Yield vault", tr: "Getiri kasası" }, live: false },
  { code: "AQU", en: "Aquarius", tr: "Aquarius", kind: { en: "AMM", tr: "AMM" }, live: false },
  { code: "RFL", en: "Reflector", tr: "Reflector", kind: { en: "Oracle feed", tr: "Oracle beslemesi" }, live: false },
];

function Section({
  id,
  kicker,
  title,
  children,
  className = "",
}: {
  id?: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-b border-line ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-agent">{kicker}</p>
        <h2 className="font-display mt-3 max-w-3xl text-3xl text-fg sm:text-4xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}


export default function LandingPage() {
  const { t, lang } = useLang();
  const tr = lang === "tr";
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-base text-fg">
        <WaveLines className="absolute inset-0 -z-10 h-full w-full text-agent" count={46} />
        <div className="absolute top-6 right-0 bottom-14 -z-10 w-full md:w-[56%]">
          <Image
            src="/robot-engraved.jpg"
            alt={
              tr
                ? "Elinde büyüteç tutan, kodda kırmızı bir zafiyet satırı bulan gravür robot"
                : "Engraved robot holding a magnifying glass over code with one vulnerable line in red"
            }
            fill
            priority
            sizes="(min-width: 768px) 56vw, 100vw"
            className="object-cover object-[68%_top] opacity-35 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_34%),linear-gradient(to_top,transparent,black_12%)] md:opacity-100"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(10,11,13,0.97)_38%,transparent_72%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,229,255,0)_55%,rgba(0,229,255,0.10)_100%)] mix-blend-screen" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(0,229,255,0.10),rgba(255,92,92,0.08)_60%,rgba(61,220,132,0.08))] mix-blend-color" />

        <FloatingNav />

        <div className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-5 pt-28 pb-40">
          <div className="rise max-w-3xl">
            <Eyebrow className="text-danger">{t("hero.kicker")}</Eyebrow>
            <h1 className="mt-5 text-[40px] leading-[1.03] font-medium tracking-[-0.03em] sm:text-5xl lg:text-[62px]">
              <GradientText className="whitespace-nowrap">{t("hero.title1")}</GradientText>
              <br />
              <span className="text-fg">{t("hero.title2")}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-fg-2">{t("hero.lead")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Pill href="/scan/new" tone="agent">
                {t("hero.cta")}
              </Pill>
              <Pill href="/#who" tone="ghost">
                {t("hero.secondary")}
              </Pill>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-10">
          <div className="relative">
            <div className="absolute top-1/2 right-0 left-[64%] hidden h-4 -translate-y-1/2 bg-gradient-to-r from-agent/70 via-[#7DF3FF]/60 to-ok/60 blur-[0.5px] md:block" />
            <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-3 px-5 text-[15px] font-semibold tracking-tight text-fg/85">
              {techStrip.map((x) => (
                <span key={x} className="whitespace-nowrap">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PanelShot />

      <Audiences />

      <ScanStory />

      <WhyItMatters />

      <ForDevelopers />

      <Lanes />

      <Section
        id="pricing"
        kicker={tr ? "Fiyatlama" : "Pricing"}
        title={tr ? "Denetim fiyatı, tarama fiyatına düşer." : "Audit money, at scan prices."}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="overflow-hidden border border-line bg-surface">
              {[
                ["0.4", tr ? "ajan döngüsü başına (TRYC)" : "per agent cycle (TRYC)", "text-agent"],
                ["0.2", tr ? "kapsül çalıştırma başına (TRYC)" : "per sandbox run (TRYC)", "text-fg-2"],
                ["~7.4", tr ? "tam tarama, tek kontrat (TRYC)" : "full scan, one contract (TRYC)", "text-ok"],
                [
                  "$8K+",
                  tr ? "elle güvenlik denetimi" : "manual security audit",
                  "text-danger line-through decoration-danger/40",
                ],
              ].map(([v, label, tone]) => (
                <div
                  key={label}
                  className="flex items-center gap-5 border-b border-line px-5 py-4 last:border-0"
                >
                  <span className={`font-display w-20 shrink-0 text-2xl tabular-nums ${tone}`}>
                    {tr ? v.replace(".", ",") : v}
                  </span>
                  <span className="text-sm text-fg-2">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-fg-2">
              {tr
                ? "1.000 TL yüklersen yaklaşık 20,40 TRYC kredi alırsın; bu iki tam taramayı fazlasıyla karşılar."
                : "Load 1,000 TRY and you get about 20.40 TRYC of credit, which covers two full scans with room to spare."}
            </p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden border border-line bg-inset">
            <Image src="/robot-square.jpg" alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
          </div>
        </div>
      </Section>

      <Section
        id="coverage"
        kicker={tr ? "Kapsama" : "Coverage"}
        title={tr ? "Kontratın yalnız çalışmıyor, biz de öyle test etmiyoruz." : "Your contract is not alone, so we do not test it alone."}
      >
        <p className="-mt-4 mb-8 max-w-2xl text-lg leading-relaxed text-fg-2">
          {tr
            ? "Headline zafiyetimiz Blend v2 olmadan üretilemez. Entegrasyon dekor değil, hatanın kendisi."
            : "Our headline vulnerability cannot be produced without Blend v2. The integration is not decoration, it is the bug."}
        </p>
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-inset text-[11px] text-fg-3">
              <tr>
                <th className="px-5 py-3 font-medium">{tr ? "Protokol" : "Protocol"}</th>
                <th className="px-5 py-3 font-medium">{tr ? "Tür" : "Kind"}</th>
                <th className="px-5 py-3 font-medium">{tr ? "Durum" : "Status"}</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {partners.map((p) => (
                <tr key={p.code} className="border-t border-line">
                  <td className="px-5 py-3 text-fg">
                    <span className="mr-2 inline-block w-10 bg-inset py-0.5 text-center text-[10px] text-fg-3">
                      {p.code}
                    </span>
                    {p[lang]}
                  </td>
                  <td className="px-5 py-3 text-fg-2">{p.kind[lang]}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 text-[11px] ${
                        p.live ? "bg-ok/10 text-ok" : "bg-inset text-fg-3"
                      }`}
                    >
                      {p.live ? (tr ? "Aktif" : "Live") : tr ? "Sırada" : "Next"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/scan/new" variant="primary">
            {tr ? "Composability taraması başlat" : "Run a composability scan"}
          </Button>
        </div>
      </Section>

      <section id="try" className="scanlines relative scroll-mt-20 overflow-hidden bg-inset px-4 py-24 sm:px-6">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-6xl items-start gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl leading-tight text-fg sm:text-5xl">
              {tr ? (
                <>
                  Daha az sürpriz.
                  <br />
                  Daha az kayıp.
                  <br />
                  <span className="text-ok">Daha hızlı sevkiyat.</span>
                </>
              ) : (
                <>
                  Fewer surprises.
                  <br />
                  Fewer losses.
                  <br />
                  <span className="text-ok">Faster shipping.</span>
                </>
              )}
            </h2>
            <div className="glow-ok relative mt-8 aspect-square w-full max-w-xs overflow-hidden bg-base">
              <Image src="/robot-certified.jpg" alt="" fill sizes="320px" className="object-cover" />
            </div>
          </div>
          <div className="border border-line-strong bg-surface p-6">
            <h3 className="font-display text-2xl text-fg">{tr ? "İlk taraman bizden" : "Your first scan is on us"}</h3>
            <p className="mt-2 mb-5 text-sm text-fg-2">
              {tr
                ? "Test kredisiyle başla. Kontratını yükle, ajanı çalıştır, bulguyu ve yamayı gör."
                : "Start with test credit. Upload a contract, run the agent, see the finding and the patch."}
            </p>
            <div className="space-y-3">
              <Link
                href="/deposit"
                className="flex w-full items-center justify-center border border-line-strong px-5 py-3 text-sm text-fg transition hover:border-agent hover:text-agent"
              >
                {t("nav.deposit")}
              </Link>
              <Link
                href="/scan/new"
                className="flex w-full items-center justify-center bg-agent px-5 py-3 text-sm font-medium text-inset hover:brightness-110"
              >
                {t("hero.cta")}
              </Link>
            </div>
            <p className="mt-4 text-[11px] text-fg-3">
              {tr ? "SEP-6 anchor · x402 ölçülü faturalama" : "SEP-6 anchor · x402 metered billing"}
            </p>
          </div>
        </div>
        <div className="relative">
          <ControlBanner />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
