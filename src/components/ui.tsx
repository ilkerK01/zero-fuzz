import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Tone = "ok" | "danger" | "agent" | "muted";

const toneText: Record<Tone, string> = {
  ok: "text-ok",
  danger: "text-danger",
  agent: "text-agent",
  muted: "text-fg-2",
};

const toneDot: Record<Tone, string> = {
  ok: "bg-ok",
  danger: "bg-danger",
  agent: "bg-agent",
  muted: "bg-fg-3",
};

export function StatusPill({
  tone,
  children,
  pulse,
}: {
  tone: Tone;
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 border border-line-strong bg-inset px-2.5 py-1 text-xs font-medium ${toneText[tone]}`}
    >
      <span className={`h-1.5 w-1.5 ${toneDot[tone]} ${pulse ? "pulse-danger" : ""}`} />
      {children}
    </span>
  );
}

export function TxLink({ hash, href }: { hash: string; href?: string }) {
  const short = hash.length > 12 ? `${hash.slice(0, 4)}…${hash.slice(-4)}` : hash;
  return (
    <a
      href={href ?? "#"}
      className="mono inline-flex items-center gap-1.5 text-sm text-agent hover:underline"
      target={href ? "_blank" : undefined}
      rel="noreferrer"
    >
      <span className="text-fg-3">chain</span>
      {short}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </a>
  );
}

export function BudgetMeter({ spent, total }: { spent: number; total: number }) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs text-fg-2">
        <span>x402 budget</span>
        <span className="text-agent">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-inset">
        <div className="h-full bg-agent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AmountDisplay({
  value,
  unit,
  tone = "muted",
  size = "md",
}: {
  value: string;
  unit: string;
  tone?: Tone;
  size?: "md" | "lg" | "xl";
}) {
  const s = size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-base";
  return (
    <span className={`font-display ${s} ${toneText[tone]} tabular-nums`}>
      {value}
      <span className="ml-1.5 align-middle text-[0.55em] font-normal text-fg-3">{unit}</span>
    </span>
  );
}

export function Panel({
  children,
  className = "",
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "danger" | "ok" | "agent";
}) {
  const g = glow ? `glow-${glow}` : "border border-line";
  return <div className={`bg-surface ${g} ${className}`}>{children}</div>;
}

export function Kicker({ children, tone = "agent" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${toneText[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-agent text-inset hover:brightness-110",
    ghost: "border border-line-strong text-fg hover:border-agent hover:text-agent",
    danger: "bg-danger text-inset hover:brightness-110",
  }[variant];
  return (
    <Link
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
