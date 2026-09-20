"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/lang";

export type ScanStep = { agent: string; tone: "agent" | "ok" | "danger" | "muted"; text: string };
export type ScanReport = {
  steps: ScanStep[];
  testSource: string;
  sandbox: { compiled: boolean; failed: number; summary: string; log: string[] };
  vulnerable: boolean;
  sandboxAvailable: boolean;
  billing: { cycles: number; spent: number; budget: number; durationMs: number };
};

const toneClass: Record<ScanStep["tone"], string> = {
  agent: "text-agent",
  ok: "text-ok",
  danger: "text-danger",
  muted: "text-fg-2",
};

const PRE: ScanStep[] = [
  { agent: "static", tone: "muted", text: "scout-soroban + cargo-audit: narrowing search space" },
  { agent: "agent-1", tone: "agent", text: "mapping storage entries and auth paths" },
  { agent: "agent-2", tone: "agent", text: "asking the model for a #[test] on this invariant" },
];

export function LiveScan({ onDone }: { onDone?: (r: ScanReport) => void }) {
  const { lang } = useLang();
  const tr = lang === "tr";
  const [lines, setLines] = useState<ScanStep[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let i = 0;
    const tick = setInterval(() => {
      const step = PRE[i];
      if (!step) {
        clearInterval(tick);
        return;
      }
      i += 1;
      setLines((p) => [...p, step]);
    }, 900);

    (async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = (await res.json()) as ScanReport & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "scan failed");
        clearInterval(tick);
        setLines(data.steps);
        setReport(data);
        onDone?.(data);
      } catch (e) {
        clearInterval(tick);
        setError(e instanceof Error ? e.message : "scan failed");
      }
    })();

    return () => clearInterval(tick);
  }, [onDone]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines, report]);

  return (
    <div
      ref={boxRef}
      className="mono scanlines h-[420px] overflow-y-auto bg-inset p-4 text-[13px] leading-relaxed"
    >
      {lines.filter(Boolean).map((l, idx) => (
        <div key={idx} className="rise flex gap-3">
          <span className="w-16 shrink-0 text-fg-3">{l.agent}</span>
          <span className="text-fg-3">&gt;</span>
          <span className={`${toneClass[l.tone] ?? "text-fg-2"} flex-1`}>{l.text}</span>
        </div>
      ))}

      {report ? (
        <div className="mt-3 border-t border-line pt-3">
          {report.sandbox.log
            .filter((l) => /test .* \.\.\.|test result:|assertion|left:|right:/.test(l))
            .map((l, i) => (
              <div key={i} className={/FAILED|assertion|left:|right:/.test(l) ? "text-danger" : "text-fg-2"}>
                {l}
              </div>
            ))}
        </div>
      ) : null}

      {error ? <div className="mt-2 text-danger">error: {error}</div> : null}

      {!report && !error ? (
        <div className="flex gap-3">
          <span className="w-16 shrink-0 text-fg-3">agent</span>
          <span className="text-fg-3">&gt;</span>
          <span className="cursor flex-1 text-agent" />
        </div>
      ) : null}

      {report && report.sandboxAvailable ? (
        <p className="mt-3 text-fg-3">
          {tr ? "kapsül kapatıldı" : "sandbox destroyed"} · {report.sandbox.summary}
        </p>
      ) : null}

      {report && !report.sandboxAvailable ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-fg-2">
            {tr
              ? "Bu ortamda konteyner çalıştırılamıyor, test koşulmadı."
              : "No container runtime on this host, so the test was not executed."}
          </p>
          <p className="mt-2 text-fg-3">
            {tr
              ? "Ajanın ürettiği test aşağıda. Kapsül yerelde çalışır: npm run dev + Docker."
              : "The generated test is below. The sandbox runs locally with Docker."}
          </p>
          <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-[12px] text-agent">
            {report.testSource}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
