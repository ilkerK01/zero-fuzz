import Link from "next/link";
import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function WaveLines({
  className,
  color = "currentColor",
  count = 34,
  flip,
}: {
  className?: string;
  color?: string;
  count?: number;
  flip?: boolean;
}) {
  const lines = Array.from({ length: count }, (_, i) => {
    const o = i * 9;
    return `M-40 ${120 + o} C 220 ${-40 + o * 1.6}, 420 ${420 - o * 0.6}, 700 ${160 + o * 0.8} S 1100 ${-20 + o}, 1480 ${220 + o * 0.4}`;
  });
  return (
    <svg
      viewBox="0 0 1440 700"
      preserveAspectRatio="none"
      className={cx("pointer-events-none", flip && "-scale-x-100", className)}
      aria-hidden
    >
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="0.8" opacity={0.1 + (i % 5) * 0.03} />
      ))}
    </svg>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("text-[11px] font-medium uppercase tracking-[0.22em]", className)}>{children}</p>
  );
}

export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "bg-gradient-to-r from-agent via-[#7DF3FF] to-[#D9FBFF] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Pill({
  href,
  children,
  tone = "agent",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "agent" | "danger" | "ghost" | "light";
  className?: string;
}) {
  const tones = {
    agent: "bg-gradient-to-r from-agent to-[#8AF0FF] text-inset hover:brightness-105",
    danger: "bg-danger text-inset hover:brightness-110",
    ghost: "border border-fg/25 text-fg hover:border-fg/60",
    light: "bg-fg text-inset hover:brightness-95",
  }[tone];
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition",
        tones,
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function FloatCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-line-strong bg-surface/95 p-3 backdrop-blur shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("size-4", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" className={cx("h-3.5 w-[18px] shrink-0 rounded-[2px]", className)} aria-hidden>
      <rect width="60" height="36" fill="#012169" />
      <path d="M0 0 60 36M60 0 0 36" stroke="#fff" strokeWidth="7" />
      <path d="M0 0 60 36M60 0 0 36" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v36M0 18h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v36M0 18h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}

export function FlagTR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" className={cx("h-3.5 w-[18px] shrink-0 rounded-[2px]", className)} aria-hidden>
      <rect width="60" height="36" fill="#E30A17" />
      <circle cx="23" cy="18" r="9" fill="#fff" />
      <circle cx="26.5" cy="18" r="7.2" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="36,13 37.2,16.4 40.8,16.5 37.9,18.6 38.9,22.1 36,20 33.1,22.1 34.1,18.6 31.2,16.5 34.8,16.4"
      />
    </svg>
  );
}

export const techStrip = [
  "Stellar",
  "Soroban",
  "Rust",
  "Blend v2",
  "Soroswap",
  "x402",
  "SEP-10",
  "SEP-6",
];
