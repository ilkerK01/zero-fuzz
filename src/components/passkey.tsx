"use client";

import { useCallback, useEffect, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useLang } from "@/components/lang";

export type Session = { label: string } | null;

async function call(payload: Record<string, unknown>) {
  const res = await fetch("/api/passkey", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { error?: string; options?: unknown; session?: Session };
  if (!res.ok) throw new Error(data.error ?? "Passkey request failed");
  return data;
}

export function usePasskeySession() {
  const [session, setSession] = useState<Session>(null);
  const [registered, setRegistered] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/passkey");
      const data = (await res.json()) as { session: Session; registered: boolean };
      setSession(data.session);
      setRegistered(data.registered);
    } catch {
      setSession(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/passkey");
        const data = (await res.json()) as { session: Session; registered: boolean };
        if (cancelled) return;
        setSession(data.session);
        setRegistered(data.registered);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, registered, ready, setSession, refresh };
}

export function PasskeyGate({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const { session, registered, ready, setSession } = usePasskeySession();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = () =>
    run(async () => {
      const name = label.trim();
      if (!name) throw new Error(t("pk.needName"));
      const { options } = await call({ action: "register-options", label: name });
      const response = await startRegistration({
        optionsJSON: options as Parameters<typeof startRegistration>[0]["optionsJSON"],
      });
      const done = await call({ action: "register", label: name, response });
      setSession(done.session ?? { label: name });
    });

  const onAuthenticate = () =>
    run(async () => {
      const { options } = await call({ action: "auth-options" });
      const response = await startAuthentication({
        optionsJSON: options as Parameters<typeof startAuthentication>[0]["optionsJSON"],
      });
      const done = await call({ action: "auth", response });
      setSession(done.session ?? null);
    });

  if (!ready) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="mono text-sm text-fg-3">checking session ...</p>
      </div>
    );
  }

  if (session) return <>{children}</>;

  return (
    <div className="grid-lines flex min-h-[420px] flex-col items-center justify-center border border-line bg-surface p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center border border-line-strong bg-inset">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <rect x="4" y="11" width="18" height="12" stroke="#00E5FF" strokeWidth="1.8" />
          <path d="M8 11V7.5a5 5 0 0110 0V11" stroke="#00E5FF" strokeWidth="1.8" />
          <circle cx="13" cy="17" r="1.8" fill="#FF5C5C" />
        </svg>
      </div>
      <h2 className="font-display mt-6 text-2xl text-fg">{t("pk.title")}</h2>
      <p className="mt-2 max-w-sm text-sm text-fg-2">{t("pk.body")}</p>

      <div className="mt-6 w-full max-w-sm space-y-3">
        {registered ? (
          <button
            onClick={onAuthenticate}
            disabled={busy}
            className="w-full bg-agent px-5 py-3 text-sm font-medium text-inset transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? t("pk.working") : t("pk.signIn")}
          </button>
        ) : null}

        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("pk.namePlaceholder")}
            className="w-full border border-line-strong bg-inset px-3 py-2.5 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-agent"
          />
          <button
            onClick={onRegister}
            disabled={busy}
            className="shrink-0 border border-line-strong px-4 py-2.5 text-sm font-medium text-fg transition hover:border-agent hover:text-agent disabled:opacity-50"
          >
            {t("pk.create")}
          </button>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <p className="text-xs text-fg-3">{t("pk.note")}</p>
      </div>
    </div>
  );
}

export function PasskeyBadge() {
  const { t } = useLang();
  const { session, setSession } = usePasskeySession();
  if (!session) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-2 border border-line-strong bg-inset px-2.5 py-1 text-xs text-ok">
        <span className="h-1.5 w-1.5 bg-ok" />
        {session.label}
      </span>
      <button
        onClick={async () => {
          await fetch("/api/passkey", { method: "DELETE" });
          setSession(null);
        }}
        className="text-xs text-fg-3 transition hover:text-danger"
      >
        {t("pk.signOut")}
      </button>
    </div>
  );
}
