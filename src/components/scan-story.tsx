"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "@/components/lang";
import type { Key } from "@/lib/i18n";

type Tone = "agent" | "danger" | "ok";

const stages: { n: string; key: string; tone: Tone; bg: string }[] = [
  { n: "01", key: "s1", tone: "agent", bg: "#0A0B0D" },
  { n: "02", key: "s2", tone: "agent", bg: "#0A0E11" },
  { n: "03", key: "s3", tone: "agent", bg: "#08131A" },
  { n: "04", key: "s4", tone: "danger", bg: "#16090A" },
  { n: "05", key: "s5", tone: "ok", bg: "#071710" },
];

const toneText: Record<Tone, string> = {
  agent: "text-agent",
  danger: "text-danger",
  ok: "text-ok",
};

const toneDot: Record<Tone, string> = {
  agent: "bg-agent",
  danger: "bg-danger",
  ok: "bg-ok",
};

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function StagePanel({ i, active }: { i: number; active: boolean }) {
  const { t } = useLang();
  const s = stages[i];
  const k = (suffix: string) => t(`story.${s.key}.${suffix}` as Key);
  const glow =
    s.tone === "danger" ? "glow-danger" : s.tone === "ok" ? "glow-ok" : "border border-line-strong";
  const lines = [k("l1"), k("l2"), k("l3")];
  return (
    <div className="w-full shrink-0 px-2">
      <div
        className={`scanlines bg-inset transition-all duration-700 ${
          active ? glow : "border border-line opacity-60"
        }`}
      >
        <div className="mono flex items-center gap-2 border-b border-line px-4 py-3 text-[11px] text-fg-3">
          <span className={`h-2 w-2 ${toneDot[s.tone]}`} />
          {k("tag")}
        </div>
        <div className="mono space-y-2 p-5 text-[13px] leading-relaxed">
          {lines.map((l, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-fg-3">{String(idx + 1).padStart(2, "0")}</span>
              <span className={idx === 2 ? toneText[s.tone] : "text-fg-2"}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScanStory() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight;
      const progress = span > 0 ? Math.min(0.999, Math.max(0, -rect.top / span)) : 0;
      setActive(Math.floor(progress * stages.length));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section id="how" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-agent">
            {t("story.kicker")}
          </p>
          <h2 className="font-display mt-3 text-3xl text-fg sm:text-4xl">{t("story.title")}</h2>
          <div className="mt-10 space-y-10">
            {stages.map((s, i) => (
              <div key={s.key}>
                <h3 className="text-sm text-fg">
                  {s.n} · {t(`story.${s.key}.t` as Key)}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-fg-2">{t(`story.${s.key}.b` as Key)}</p>
                <div className="mt-3">
                  <StagePanel i={i} active />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const current = stages[active];
  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative border-b border-line"
      style={{ height: `${stages.length * 90}svh` }}
    >
      <div
        className="sticky top-0 flex h-svh items-center overflow-hidden transition-colors duration-700"
        style={{ background: current.bg }}
      >
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-700 ${toneText[current.tone]}`}
            >
              {t("story.kicker")}
            </p>
            <div className="relative mt-5 grid">
              {stages.map((s, i) => (
                <div
                  key={s.key}
                  aria-hidden={i !== active}
                  className={`col-start-1 row-start-1 transition-all duration-500 ${
                    i === active ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                  }`}
                >
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl tabular-nums ${toneText[s.tone]}`}>{s.n}</span>
                    <span className="text-fg-3">/ 05</span>
                  </div>
                  <h2 className="font-display mt-4 text-3xl text-fg sm:text-4xl">
                    {t(`story.${s.key}.t` as Key)}
                  </h2>
                  <p className="mt-4 max-w-md text-lg leading-relaxed text-fg-2">
                    {t(`story.${s.key}.b` as Key)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-2">
              {stages.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-1 flex-1 transition-all duration-500 ${
                    i <= active ? toneDot[current.tone] : "bg-line-strong"
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-fg-3">
              {t("story.hint")}
            </p>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {stages.map((s, i) => (
                <StagePanel key={s.key} i={i} active={i === active} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
