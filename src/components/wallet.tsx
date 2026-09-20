"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type Connection = { address: string | null; verified: boolean };

type WalletContextValue = Connection & {
  connect: (address: string) => void;
  markVerified: () => void;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const listeners = new Set<() => void>();
const EMPTY: Connection = { address: null, verified: false };
let cache: Connection = EMPTY;
let cacheRaw: string | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function read(): Connection {
  try {
    const raw = window.sessionStorage.getItem("zf-wallet");
    if (raw === cacheRaw) return cache;
    cacheRaw = raw;
    cache = raw ? (JSON.parse(raw) as Connection) : EMPTY;
    return cache;
  } catch {
    return EMPTY;
  }
}

function write(next: Connection) {
  try {
    if (next.address) {
      window.sessionStorage.setItem("zf-wallet", JSON.stringify(next));
    } else {
      window.sessionStorage.removeItem("zf-wallet");
    }
  } catch {}
  listeners.forEach((fn) => fn());
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);

  const connect = useCallback((address: string) => write({ address, verified: false }), []);
  const markVerified = useCallback(() => {
    const current = read();
    if (current.address) write({ address: current.address, verified: true });
  }, []);
  const disconnect = useCallback(() => write(EMPTY), []);

  return (
    <WalletContext.Provider value={{ ...state, connect, markVerified, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
