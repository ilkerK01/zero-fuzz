"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "@/components/lang";

export function PanelShot() {
  const { lang } = useLang();
  const tr = lang === "tr";
  return (
    <section className="border-b border-line bg-inset">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-agent">
            {tr ? "Panelden" : "From the panel"}
          </p>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl text-fg sm:text-4xl">
            {tr
              ? "Ajan çalışırken izlersin, sonra kanıtı alırsın."
              : "Watch the agent work, then take the proof."}
          </h2>
        </div>
        <div className="mt-10 border border-line-strong bg-base p-2">
          <Image
            src="/panel.png"
            alt={tr ? "Z-FUZZ canlı ajan terminali" : "Z-FUZZ live agent terminal"}
            width={1240}
            height={700}
            sizes="(min-width: 1024px) 60rem, 100vw"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}

type Audience = {
  key: string;
  tab: { en: string; tr: string };
  head: { en: string; tr: string };
  body: { en: string; tr: string };
  points: { en: string; tr: string }[];
};

const audiences: Audience[] = [
  {
    key: "solo",
    tab: { en: "Solo builders", tr: "Tek başına geliştirenler" },
    head: { en: "The reviewer you do not have.", tr: "Sahip olmadığın gözden geçiren." },
    body: {
      en: "You ship alone and nobody reads your storage code. Z-FUZZ breaks the contract and hands you the failing test with the patch beside it.",
      tr: "Tek başına yayınlıyorsun ve storage kodunu kimse okumuyor. Z-FUZZ kontratı kırar, başarısız testi ve yanında yamayı verir.",
    },
    points: [
      { en: "A full scan costs about 7.4 TRYC", tr: "Tam tarama yaklaşık 7,4 TRYC" },
      { en: "No audit firm, no waiting list", tr: "Denetim firması yok, sıra beklemek yok" },
    ],
  },
  {
    key: "teams",
    tab: { en: "Protocol teams", tr: "Protokol ekipleri" },
    head: { en: "Regressions fail CI, not mainnet.", tr: "Regresyonlar CI'da patlar, ana ağda değil." },
    body: {
      en: "Every pull request runs the same lanes. A composability regression against Blend v2 shows up as a red build hours before it could show up as a drained pool.",
      tr: "Her pull request aynı kulvarları koşar. Blend v2'ye karşı bir composability regresyonu, boşalmış bir havuz olarak görünmeden saatler önce kırmızı build olarak görünür.",
    },
    points: [
      { en: "One step in your pipeline", tr: "Pipeline'ında tek adım" },
      { en: "Budget capped per scan with x402", tr: "x402 ile tarama başına bütçe tavanı" },
    ],
  },
  {
    key: "auditors",
    tab: { en: "Auditors", tr: "Denetçiler" },
    head: { en: "Start from a failure, not a hunch.", tr: "Sezgiden değil, hatadan başla." },
    body: {
      en: "The proof-of-concept test is the artefact you would have written by hand. Z-FUZZ produces it first, so your hours go into judgement instead of setup.",
      tr: "PoC testi zaten elle yazacağın çıktının kendisi. Z-FUZZ onu önce üretir; saatlerin kurulum yerine muhakemeye gider.",
    },
    points: [
      { en: "Reproducible in a sealed sandbox", tr: "Mühürlü kapsülde tekrarlanabilir" },
      { en: "Static triage findings included", tr: "Statik eleme bulguları dahil" },
    ],
  },
  {
    key: "integrators",
    tab: { en: "DeFi integrators", tr: "DeFi entegratörleri" },
    head: { en: "Know what you are composing with.", tr: "Neyle bileştiğini bil." },
    body: {
      en: "Before you route liquidity through someone else's contract, run it against a live pool and watch what the state machine does under pressure.",
      tr: "Likiditeyi başkasının kontratından geçirmeden önce onu canlı bir havuzla koştur ve state makinesinin baskı altında ne yaptığını gör.",
    },
    points: [
      { en: "Blend v2 and Soroswap interfaces", tr: "Blend v2 ve Soroswap arayüzleri" },
      { en: "The YieldBlox class, reproduced", tr: "YieldBlox sınıfı, yeniden üretilmiş" },
    ],
  },
  {
    key: "listings",
    tab: { en: "Exchanges & custodians", tr: "Borsalar ve saklayıcılar" },
    head: { en: "Make the stamp a listing requirement.", tr: "Damgayı listeleme şartı yap." },
    body: {
      en: "A passing contract carries a Z-FUZZ Audited stamp whose result hash is written on chain. You do not take our word for it, you check the hash.",
      tr: "Geçen bir kontrat, sonuç hash'i zincire yazılmış bir Z-FUZZ Onaylı damgası taşır. Bize güvenmene gerek yok, hash'i kontrol edersin.",
    },
    points: [
      { en: "Verifiable on Stellar Expert", tr: "Stellar Expert'te doğrulanabilir" },
      { en: "Re-scan on every contract upgrade", tr: "Her kontrat yükseltmesinde yeniden tarama" },
    ],
  },
];

export function Audiences() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [active, setActive] = useState(0);
  const a = audiences[active];
  return (
    <section id="who" className="scroll-mt-20 border-b border-line">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="font-display mx-auto max-w-2xl text-center text-3xl text-fg sm:text-4xl">
          {tr ? "Herkesin gerçekten güvendiği tek kanıt:" : "One proof everyone actually trusts:"}{" "}
          <span className="text-agent">
            {tr ? "başarısız bir test." : "a test that failed."}
          </span>
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {audiences.map((item, i) => (
            <button
              key={item.key}
              onClick={() => setActive(i)}
              className={`border px-4 py-2 text-sm font-medium transition ${
                i === active
                  ? "border-agent bg-agent text-inset"
                  : "border-line-strong text-fg-2 hover:border-agent hover:text-agent"
              }`}
            >
              {tr ? item.tab.tr : item.tab.en}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 border border-line bg-surface p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="font-display text-2xl text-fg sm:text-3xl">
              {tr ? a.head.tr : a.head.en}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-fg-2">{tr ? a.body.tr : a.body.en}</p>
          </div>
          <ul className="space-y-3 border-line lg:border-l lg:pl-8">
            {a.points.map((p) => (
              <li key={p.en} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-agent" />
                <span className="text-sm text-fg-2">{tr ? p.tr : p.en}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
