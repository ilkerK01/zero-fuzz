"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type Connection = { address: string | null; verified: boolean; token: string | null };

type WalletContextValue = Connection & {
  connect: (address: string) => void;
  markVerified: (token: string) => void;
  disconnect: () => void;
  expire: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const listeners = new Set<() => void>();
const EMPTY: Connection = { address: null, verified: false, token: null };
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

  const connect = useCallback(
    (address: string) => write({ address, verified: false, token: null }),
    [],
  );
  const markVerified = useCallback((token: string) => {
    const current = read();
    if (current.address) write({ address: current.address, verified: true, token });
  }, []);
  const disconnect = useCallback(() => write(EMPTY), []);
  const expire = useCallback(() => {
    const current = read();
    if (current.address) write({ address: current.address, verified: false, token: null });
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, markVerified, disconnect, expire }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
