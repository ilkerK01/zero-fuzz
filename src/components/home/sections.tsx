"use client";

import Link from "next/link";
import { useRef } from "react";
import { useLang } from "@/components/lang";
import { Button, StatusPill } from "@/components/ui";
import { BrandInline } from "@/components/logo";

export function WhyItMatters() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const stats = [
    { v: "4", l: tr ? "Soroban'a özgü hata sınıfı" : "Soroban-native bug classes" },
    { v: "0", l: tr ? "bunu modelleyen EVM fuzzer'ı" : "EVM fuzzers that model it" },
    { v: "100%", l: tr ? "bulgu çalışan testle gelir" : "findings ship a runnable test" },
    { v: "30s", l: tr ? "sonra kapsül yok edilir" : "until the sandbox is destroyed" },
  ];
  const market = [
    { v: "$10.2M", l: tr ? "YieldBlox, Blend V2 havuzu, Şubat 2026" : "YieldBlox, Blend V2 pool, Feb 2026", tone: "text-danger" },
    { v: "21-25K", l: tr ? "yıllık yeni varlık, çoğu scam" : "new assets per year, mostly scams", tone: "text-agent" },
    { v: "$1.5B+", l: tr ? "2026'da akıllı kontrat açıklarından kaybedilen" : "lost to smart contract exploits in 2026", tone: "text-ok" },
  ];
  return (
    <section id="why" className="relative scroll-mt-20 overflow-hidden border-b border-line bg-base">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div className="relative mx-auto h-[440px] w-full max-w-md">
          <div className="scanlines absolute top-0 left-4 w-64 border border-line bg-inset p-4">
            <p className="mono text-[10px] text-fg-3">scout-soroban</p>
            <p className="mono mt-2 text-[12px] text-fg-2">3 findings · 1 high</p>
            <p className="mono mt-1 text-[12px] text-agent">narrowing search space</p>
          </div>
          <div className="glow-danger absolute top-36 left-28 w-72 bg-surface p-4">
            <p className="mono text-[10px] text-fg-3">sandbox · zf_harness</p>
            <p className="mono mt-2 text-[13px] text-danger">test_resurrection_drain</p>
            <p className="mono mt-1 text-[12px] text-danger">... FAILED</p>
          </div>
          <div className="absolute bottom-16 left-0 w-60 border border-line bg-inset p-4">
            <p className="mono text-[10px] text-fg-3">x402</p>
            <p className="mono mt-2 text-[12px] text-fg-2">9 cycles · 7.4 TRYC</p>
            <div className="mt-2 h-1 w-full bg-base">
              <div className="h-full w-[37%] bg-agent" />
            </div>
          </div>
          <div className="glow-ok absolute right-0 bottom-0 w-56 bg-surface p-4">
            <p className="mono text-[10px] text-fg-3">after patch</p>
            <p className="mono mt-2 text-[12px] text-ok">cargo test ... 3 passed</p>
          </div>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-danger">
            {tr ? "Neden" : "Why"} <BrandInline size={13} className="tracking-normal text-fg" />
          </p>
          <h2 className="font-display mt-3 text-4xl text-fg sm:text-5xl">
            {tr ? "Ana ağ, hatalarını ücretsiz bulmaz." : "Mainnet does not find your bugs for free."}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-fg-2">
            {tr
              ? "Entry'ler sona erer, arşivlenir, geri getirilebilir. EVM'de bunların hiçbiri yok — o yüzden olgun araçlar buraya ulaşamıyor."
              : "Entries expire, get archived, come back. None of that exists on the EVM, which is why the mature tooling cannot reach it."}
          </p>
          <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2">
            {stats.map((s) => (
              <div key={s.l}>
                <p className="font-display text-5xl text-agent">{s.v}</p>
                <p className="mt-1.5 text-sm text-fg-2">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/scan/new" variant="primary">
              {tr ? "Kontratımı kır" : "Break my contract"}
            </Button>
            <Button href="/#classes" variant="ghost">
              {tr ? "Hata sınıfları" : "Bug classes"}
            </Button>
          </div>
        </div>
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {market.map((m) => (
            <div key={m.l} className="bg-surface p-6">
              <p className={`font-display text-4xl ${m.tone}`}>{m.v}</p>
              <p className="mt-1 text-sm text-fg-2">{m.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-fg-3">
          {tr
            ? "Kaynaklar: BlockSec ve Halborn YieldBlox raporları (2026); Stellar.Expert public directory."
            : "Sources: BlockSec and Halborn YieldBlox reports (2026); Stellar.Expert public directory."}
        </p>
      </div>
    </section>
  );
}

const K = ({ children }: { children: React.ReactNode }) => <span className="text-[#c792ea]">{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span className="text-ok">{children}</span>;
const N = ({ children }: { children: React.ReactNode }) => <span className="text-[#f7c46c]">{children}</span>;
const C = ({ children }: { children: React.ReactNode }) => <span className="text-fg-3">{children}</span>;

function Code() {
  const lines: React.ReactNode[] = [
    <>
      <K>const</K> scan = <K>await</K> zfuzz.scan({"{"}
    </>,
    <>
      {"  "}contract: <S>&quot;./contracts/registry_pool&quot;</S>,
    </>,
    <>
      {"  "}lanes: [<S>&quot;state&quot;</S>, <S>&quot;composability&quot;</S>],
    </>,
    <>
      {"  "}compose: [<S>&quot;pool_harness&quot;</S>], <C>{"// blend_v2, soroswap next"}</C>
    </>,
    <>
      {"  "}budget: <N>20</N>, <C>{"// TRYC, x402 metered"}</C>
    </>,
    <>{"});"}</>,
    <></>,
    <>
      <K>for await</K> (<K>const</K> ev <K>of</K> scan.stream()) {"{"}
    </>,
    <>
      {"  "}<K>if</K> (ev.type === <S>&quot;finding&quot;</S>) console.error(ev.poc);
    </>,
    <>{"}"}</>,
  ];
  return (
    <div className="mx-auto mt-10 max-w-2xl overflow-hidden border border-line-strong bg-inset text-left">
      <p className="mono border-b border-line px-5 py-2.5 text-[11px] text-fg-3">
        ci.ts
      </p>
      <pre className="mono overflow-x-auto px-5 py-4 text-[13px] leading-7 text-fg-2">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-5">
            <span className="w-4 shrink-0 text-right text-fg-3">{i + 1}</span>
            <span>{l}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function ForDevelopers() {
  const { lang } = useLang();
  const tr = lang === "tr";
  return (
    <section className="border-b border-line px-4 py-16 sm:px-6">
      <div className="scanlines relative mx-auto max-w-6xl overflow-hidden border border-line-strong bg-inset px-6 py-16 text-center">
        <div className="relative">
          <h2 className="font-display text-3xl text-fg sm:text-5xl">
            {tr ? "Kontrat mı yazıyorsun?" : "Shipping a contract?"}
            <br />
            <span className="text-agent">{tr ? "İki çağrıda otonom denetim." : "Autonomous audit in two calls."}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-fg-2">
            {tr
              ? "Taramayı başlat, akışı dinle. Kapsülü, bileşimi, ajan döngüsünü ve x402 faturasını Z-FUZZ halleder. CI'ına bir adım olarak koy."
              : "Start a scan, listen to the stream. Z-FUZZ handles the sandbox, the composition, the agent loop and the x402 billing. Drop it into CI as one step."}
          </p>
          <Link
            href="/scan/new"
            className="mt-6 inline-flex bg-agent px-5 py-2.5 text-[13px] font-medium text-inset hover:brightness-110"
          >
            {tr ? "Taramayı başlat" : "Run a scan"}
          </Link>
          <Code />
        </div>
      </div>
    </section>
  );
}

const lanes = [
  {
    en: "State lifecycle",
    tr: "State yaşam döngüsü",
    bg: "#00E5FF",
    ink: "#060708",
    d: {
      en: "TTL expiry, archival and resurrection. The class no EVM fuzzer can reach.",
      tr: "TTL sona ermesi, arşiv ve resurrection. Hiçbir EVM fuzzer'ının ulaşamadığı sınıf.",
    },
    s: [45, 35, 20],
  },
  {
    en: "Composability",
    tr: "Composability",
    bg: "#FF5C5C",
    ink: "#060708",
    d: {
      en: "Your contract against a lending-pool harness today, Blend v2 and Soroswap next. Where YieldBlox died.",
      tr: "Kontratın bugün borç havuzu harness'ine, sırada Blend v2 ve Soroswap'a karşı. YieldBlox'un öldüğü yer.",
    },
    s: [30, 50, 20],
  },
  {
    en: "Authorization",
    tr: "Yetkilendirme",
    bg: "#3DDC84",
    ink: "#060708",
    d: {
      en: "require_auth coverage, missing signer checks, privilege paths left open.",
      tr: "require_auth kapsamı, eksik imza kontrolleri, açık bırakılmış yetki yolları.",
    },
    s: [40, 40, 20],
  },
  {
    en: "Arithmetic",
    tr: "Aritmetik",
    bg: "#8B5CF6",
    ink: "#F5F3FF",
    d: {
      en: "i128 overflow, rounding drift and precision loss in share maths.",
      tr: "i128 taşması, yuvarlama kayması ve pay matematiğinde hassasiyet kaybı.",
    },
    s: [50, 30, 20],
  },
  {
    en: "Storage misuse",
    tr: "Storage yanlış kullanımı",
    bg: "#F59E0B",
    ink: "#0A0B0D",
    d: {
      en: "Instance vs persistent vs temporary chosen wrong, and the data loss that follows.",
      tr: "Instance/persistent/temporary yanlış seçimi ve ardından gelen veri kaybı.",
    },
    s: [35, 45, 20],
  },
  {
    en: "Upgrade paths",
    tr: "Yükseltme yolları",
    bg: "#23272F",
    ink: "#E6EAF0",
    d: {
      en: "Unprotected updates, admin takeover and state layout drift across versions.",
      tr: "Korumasız güncellemeler, admin devralma ve sürümler arası state kayması.",
    },
    s: [30, 40, 30],
  },
];

export function Lanes() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const rail = useRef<HTMLDivElement>(null);
  const move = (dir: number) => rail.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <section id="classes" className="scroll-mt-20 border-b border-line py-20">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
        <h2 className="font-display text-3xl text-fg sm:text-4xl">
          {tr ? "Z-FUZZ neyi avlar" : "What Z-FUZZ hunts"}
        </h2>
        <div className="flex gap-2">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => move(d)}
              aria-label={d < 0 ? "Previous" : "Next"}
              className="flex h-9 w-9 items-center justify-center border border-line-strong text-fg-2 transition hover:border-agent hover:text-agent"
            >
              {d < 0 ? "<" : ">"}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={rail}
        className="mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
      >
        {lanes.map((l) => (
          <article key={l.en} className="w-64 shrink-0 snap-start sm:w-72">
            <div
              className="flex h-40 flex-col justify-between p-4"
              style={{ background: l.bg, color: l.ink }}
            >
              <h3 className="font-display text-2xl">{lang === "tr" ? l.tr : l.en}</h3>
              <div className="flex gap-1.5">
                {l.s.map((w, i) => (
                  <span key={i} className="h-2 bg-current opacity-60" style={{ flex: w }} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-fg-2">{l.d[lang]}</p>
            <p className="mt-1 text-[11px] text-fg-3">
              {tr ? "Ağırlık" : "Weight"}: {l.s.map((x) => `${x}%`).join(" · ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ControlBanner() {
  const { lang } = useLang();
  const tr = lang === "tr";
  return (
    <div className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-between gap-2 border border-line-strong bg-inset px-6 py-3 text-[13px] text-fg-2">
      <span>
        {tr
          ? "Kontrol sende: kontratın internete kapalı bir kapsülde koşar, her döngü krediden düşer."
          : "You stay in control: your contract runs in a network-gapped sandbox, every cycle billed from your own credit."}
      </span>
      <Link href="/scan/new" className="text-agent hover:underline">
        {tr ? "Taramayı başlat »" : "Run a scan »"}
      </Link>
    </div>
  );
}

export function BugClasses() {
  const { lang } = useLang();
  const tr = lang === "tr";
  const rows: [string, string, "ok" | "agent" | "muted"][] = [
    ["TTL expiry", tr ? "Süresi dolmuş entry okuma" : "Reading an expired entry", "ok"],
    ["State archival", tr ? "Arşivlenmiş entry'ye erişim" : "Access to an archived entry", "ok"],
    ["Resurrection", tr ? "Restore sonrası stale değer" : "Stale value after restore", "ok"],
    ["Storage type", tr ? "temporary yerine persistent" : "temporary used as persistent", "ok"],
    ["Composability", tr ? "Havuz harness'i; sırada Blend v2 / Soroswap" : "Pool harness; Blend v2 / Soroswap next", "agent"],
    ["Auth paths", tr ? "Eksik require_auth" : "Missing require_auth", "agent"],
  ];
  return (
    <section className="border-b border-line bg-inset">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-agent">
            {tr ? "Hata sınıfları" : "Bug classes"}
          </p>
          <h2 className="font-display mt-3 text-3xl text-fg sm:text-4xl">
            {tr ? "Soroban'a özgü, EVM'de karşılığı yok." : "Soroban-native, with no EVM equivalent."}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-fg-2">
            {tr
              ? "Statik tarayıcılar bunları işaret edebilir. Z-FUZZ çalıştırıp kanıtlar."
              : "Static scanners can flag these. Z-FUZZ runs them and proves it."}
          </p>
          <div className="mt-8">
            <Button href="/scan/new" variant="primary">
              {tr ? "Bu kulvarları çalıştır" : "Run these lanes"}
            </Button>
          </div>
        </div>
        <div className="border border-line bg-surface">
          {rows.map(([name, desc, tone]) => (
            <div key={name} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
              <div>
                <p className="text-[13px] text-fg">{name}</p>
                <p className="mt-0.5 text-xs text-fg-3">{desc}</p>
              </div>
              <StatusPill tone={tone}>{tone === "ok" ? (tr ? "AKTİF" : "LIVE") : tr ? "AKTİF" : "LIVE"}</StatusPill>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
