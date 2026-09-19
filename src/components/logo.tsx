export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M29 16 22.5 27.26 9.5 27.26 3 16 9.5 4.74 22.5 4.74Z"
        stroke="#00E5FF"
        strokeWidth="1.9"
        strokeLinejoin="miter"
      />
      <path
        d="M10.5 11.5H21.5L10.5 20.5H18.8"
        stroke="#E6EAF0"
        strokeWidth="2.9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect x="19.2" y="19.05" width="2.9" height="2.9" fill="#FF5C5C" />
    </svg>
  );
}

export function BrandInline({
  size = 15,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 whitespace-nowrap ${className}`}>
      <LogoMark size={size} className="translate-y-[0.12em]" />
      <span className="font-semibold tracking-[0.04em]">Z-FUZZ</span>
    </span>
  );
}

export function Logo({
  withText = true,
  size = 26,
  className = "",
}: {
  withText?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withText ? (
        <span className="font-display text-[15px] font-semibold tracking-[0.18em] text-fg">
          Z-FUZZ
        </span>
      ) : null}
    </span>
  );
}
