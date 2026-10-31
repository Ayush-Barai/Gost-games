"use client";

export function GhostSprite({
  color = "#a78bfa",
  eyeColor = "#0b0b1a",
  size = 64,
  className = "",
  glow = true,
}: {
  color?: string;
  eyeColor?: string;
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const gradId = `g-${color.replace("#", "")}-${size}`;
  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 64 70"
      fill="none"
      className={className}
      aria-hidden="true"
      style={glow ? { filter: `drop-shadow(0 0 10px ${color}99)` } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="32" y1="6" x2="32" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor={color} />
          <stop offset="1" stopColor="#e9e4ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M8 61V33C8 18.6 18.7 8 32 8s24 10.6 24 25v28l-6-5-6 5-6-5-6 5-6-5-6 5-6-5-6 5Z"
        fill={`url(#${gradId})`}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
      />
      <ellipse cx="23" cy="33" rx="4.2" ry="5.6" fill={eyeColor} />
      <ellipse cx="41" cy="33" rx="4.2" ry="5.6" fill={eyeColor} />
      <circle cx="24.4" cy="31" r="1.3" fill="#f8fafc" opacity="0.8" />
      <circle cx="42.4" cy="31" r="1.3" fill="#f8fafc" opacity="0.8" />
      <ellipse cx="32" cy="46" rx="3.4" ry="4.4" fill={eyeColor} opacity="0.85" />
      <ellipse cx="17" cy="41" rx="3" ry="2" fill="#f472b6" opacity="0.24" />
      <ellipse cx="47" cy="41" rx="3" ry="2" fill="#f472b6" opacity="0.24" />
    </svg>
  );
}

export function BombSprite({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="30" cy="38" r="20" fill="#181826" stroke="#f43f5e" strokeWidth="2" />
      <circle cx="23" cy="31" r="5" fill="#334155" opacity="0.5" />
      <path d="M40 20c4-6 9-6 12-4" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M52 16c1.5-2.5 4-2 4.5 0 .5 2-1 3-2.5 3.5"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M20 34l4-3M25 44l4-2" stroke="#64748b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function GoldenGhostSprite({ size = 64, className = "" }: { size?: number; className?: string }) {
  return <GhostSprite color="#fbbf24" eyeColor="#3b1d05" size={size} className={className} />;
}
