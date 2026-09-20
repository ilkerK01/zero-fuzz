"use client";

import { useRef, useState } from "react";
import { FloatingNav, SiteFooter } from "@/components/home/nav";
import { AmountDisplay, Button, Kicker } from "@/components/ui";
import { useLang } from "@/components/lang";

type LaneKey = "state" | "auth" | "comp";

const ACCEPT = [".rs", ".wasm", ".toml", ".txt"];
const MAX_BYTES = 256 * 1024;

const SCAN_PRICE = 1.4;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function NewScanPage() {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const laneDefs: { key: LaneKey; title: string; desc: string; live: boolean }[] = [
    { key: "state", title: t("up.lane.state"), desc: t("up.lane.state.d"), live: true },
    { key: "auth", title: t("up.lane.auth"), desc: t("up.lane.auth.d"), live: false },
    { key: "comp", title: t("up.lane.comp"), desc: t("up.lane.comp.d"), live: false },
  ];

  const accept = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    const ext = picked.name.slice(picked.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.includes(ext)) {
      setError(t("up.badtype"));
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(t("up.toobig"));
      return;
    }
    setFile({ name: picked.name, size: picked.size });
  };

  return (
    <>
      <FloatingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-16">
        <Kicker>{t("up.title")}</Kicker>
        <h1 className="mt-3 font-display text-2xl text-fg">{t("up.title")}</h1>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
          className={`mt-8 grid-lines flex cursor-pointer flex-col items-center justify-center border border-dashed bg-surface p-12 text-center transition ${
            dragging ? "border-agent" : "border-line-strong hover:border-agent"
          }`}
        >
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M17 23V7M17 7l-6 6M17 7l6 6" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 25v2h22v-2" stroke="#5A636E" strokeWidth="2" />
          </svg>
          <p className="mt-4 text-sm text-fg">{t("up.drop")}</p>
          <p className="mt-1 text-[11px] text-fg-3">{t("up.hint")}</p>
          <p className="mono mt-3 text-[11px] text-fg-3">{t("up.accept")}</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </label>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        {file ? (
          <div className="mono mt-3 flex items-center justify-between border border-line-strong bg-inset px-4 py-3 text-[12px]">
            <span className="text-fg">
              <span className="text-fg-3">{t("up.loaded")} · </span>
              {file.name} <span className="text-fg-3">({formatSize(file.size)})</span>
            </span>
            <button
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-fg-3 transition hover:text-danger"
            >
              {t("up.clear")}
            </button>
          </div>
        ) : null}

        <div className="mt-8">
          <span className="text-[11px] text-fg-2">{t("up.lanes")}</span>
          <div className="mt-3 space-y-px bg-line">
            {laneDefs.map((lane) => {
              const on = lane.live;
              return (
                <div key={lane.key} className="flex w-full items-start gap-4 bg-surface p-4 text-left">
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                      on ? "border-agent bg-agent" : "border-line-strong"
                    }`}
                  >
                    {on ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5.5L4 8L8.5 2.5" stroke="#060708" strokeWidth="1.6" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm ${on ? "text-fg" : "text-fg-2"}`}>{lane.title}</span>
                    <span className="mt-0.5 block text-xs text-fg-3">{lane.desc}</span>
                  </span>
                  {on ? null : <span className="mono text-[10px] text-fg-3">{t("up.soon")}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 border-l border-line-strong pl-4 text-[12px] leading-relaxed text-fg-3">
          {t("up.note")}
        </p>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <div>
            <span className="block text-[11px] text-fg-3">{t("up.est")}</span>
            <AmountDisplay value={`~${SCAN_PRICE.toFixed(1)}`} unit="TRYC" tone="agent" size="lg" />
          </div>
          <Button href="/scan/demo" variant="primary">{t("up.start")}</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
