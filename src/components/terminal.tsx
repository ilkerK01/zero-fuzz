"use client";

import { useEffect, useRef, useState } from "react";
import { scanLog, type LogLine } from "@/lib/mock";

const toneClass: Record<LogLine["tone"], string> = {
  agent: "text-agent",
  ok: "text-ok",
  danger: "text-danger",
  muted: "text-fg-2",
};

export function Terminal({
  onDone,
  running = true,
}: {
  onDone?: () => void;
  running?: boolean;
}) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    let i = 0;
    const timer = setInterval(() => {
      setLines((prev) => [...prev, scanLog[i]]);
      i += 1;
      if (i >= scanLog.length) {
        clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, 850);
    return () => clearInterval(timer);
  }, [running, onDone]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines]);

  return (
    <div
      ref={boxRef}
      className="mono scanlines h-[420px] overflow-y-auto bg-inset p-4 text-[13px] leading-relaxed"
    >
      {lines.map((l, idx) => (
        <div key={idx} className="rise flex gap-3">
          <span className="w-16 shrink-0 text-fg-3">{l.agent}</span>
          <span className="text-fg-3">&gt;</span>
          <span className={`${toneClass[l.tone]} flex-1`}>{l.text}</span>
          {l.cost ? <span className="text-fg-3">-{l.cost.toFixed(1)} TRYC</span> : null}
        </div>
      ))}
      {lines.length < scanLog.length && running ? (
        <div className="flex gap-3">
          <span className="w-16 shrink-0 text-fg-3">agent</span>
          <span className="text-fg-3">&gt;</span>
          <span className="cursor flex-1 text-agent" />
        </div>
      ) : null}
    </div>
  );
}
