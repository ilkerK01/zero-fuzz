"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";
import { dict, type Key, type Lang } from "@/lib/i18n";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function readStored(): Lang {
  try {
    const saved = window.localStorage.getItem("zf-lang");
    return saved === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
}

function writeStored(l: Lang) {
  try {
    window.localStorage.setItem("zf-lang", l);
  } catch {}
  listeners.forEach((fn) => fn());
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, readStored, () => "en" as Lang);
  const [override, setOverride] = useState<Lang | null>(null);
  const lang = override ?? stored;

  const setLang = useCallback((l: Lang) => {
    setOverride(l);
    writeStored(l);
  }, []);

  const t = useCallback((k: Key) => dict[lang][k] ?? dict.en[k] ?? k, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang outside LangProvider");
  return ctx;
}
