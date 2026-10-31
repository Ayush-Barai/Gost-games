import {
  Binary,
  Bird,
  Blocks,
  Brain,
  Crosshair,
  Crown,
  Footprints,
  Gem,
  Ghost,
  Grid3x3,
  Hammer,
  HelpCircle,
  Layers,
  Map,
  Rocket,
  Search,
  Sparkles,
  SpellCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { GameMeta } from "@/lib/games";

function PumpkinGlyph({ size = 64, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 18c-2-5-5-7-9-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <path
        d="M32 18c-13 0-22 7-22 17 0 11 9 19 22 19s22-8 22-19c0-10-9-17-22-17Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M25 18c-6 5-9 11-9 18M39 18c6 5 9 11 9 18" stroke={color} strokeWidth="1.2" opacity="0.5" />
      <path d="M20 34c2-3 5-4 7-2M44 34c-2-3-5-4-7-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M23 44c6 4 12 4 18 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M29 39l-2 4h4l-2 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChestGlyph({ size = 64, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M10 28c0-5 4-9 9-9h26c5 0 9 4 9 9v20a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5V28Z"
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M10 30h44" stroke={color} strokeWidth="1.8" />
      <path d="M26 30v-4c0-3 2-5 6-5s6 2 6 5v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="29" y="34" width="6" height="9" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M10 36h8M46 36h8" stroke={color} strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

const GLYPHS: Record<GameMeta["glyph"], LucideIcon | "pumpkin" | "chest"> = {
  ghost: Ghost,
  cards: Layers,
  maze: Map,
  jump: Rocket,
  pumpkin: "pumpkin",
  flappy: Bird,
  letters: SpellCheck,
  grid: Grid3x3,
  hammer: Hammer,
  souls: Sparkles,
  runner: Footprints,
  numbers: Binary,
  magnifier: Search,
  bolt: Zap,
  pong: Crosshair,
  blaster: Crosshair,
  quiz: HelpCircle,
  tower: Blocks,
  chest: "chest",
  crown: Crown,
};

export function GameGlyph({
  glyph,
  size = 56,
  color = "#f8fafc",
  className,
}: {
  glyph: GameMeta["glyph"];
  size?: number;
  color?: string;
  className?: string;
}) {
  const item = GLYPHS[glyph];
  if (item === "pumpkin") return <PumpkinGlyph size={size} color={color} />;
  if (item === "chest") return <ChestGlyph size={size} color={color} />;
  const Icon = item;
  return <Icon size={size} strokeWidth={1.15} color={color} className={className} />;
}

/**
 * Each game receives its own generated illustration: palette, moon position,
 * hills, stars and central relic all vary with its index.
 */
export function GameArt({
  game,
  index,
  className = "",
  compact = false,
}: {
  game: GameMeta;
  index: number;
  className?: string;
  compact?: boolean;
}) {
  const [a, b] = game.accent;
  const moonX = 78 + ((index * 37) % 210);
  const moonY = 54 + ((index * 19) % 46);
  const moonR = 20 + (index % 3) * 5;
  const stars = Array.from({ length: compact ? 12 : 20 }, (_, i) => ({
    x: 14 + ((i * 71 + index * 53) % 372),
    y: 12 + ((i * 43 + index * 31) % 172),
    r: 0.7 + ((i * 13) % 10) / 10,
    o: 0.25 + ((i * 29) % 60) / 100,
  }));

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(155deg, #0b0b1a 0%, ${a}22 45%, ${b}26 100%)`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id={`moon-${game.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={b} stopOpacity="0.95" />
            <stop offset="65%" stopColor={a} stopOpacity="0.55" />
            <stop offset="100%" stopColor={a} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`hill-${game.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={a} stopOpacity="0.22" />
            <stop offset="100%" stopColor="#080812" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`fog-${game.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={b} stopOpacity="0" />
            <stop offset="50%" stopColor={b} stopOpacity="0.22" />
            <stop offset="100%" stopColor={a} stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx={moonX} cy={moonY} r={moonR * 2.6} fill={`url(#moon-${game.id})`} opacity="0.75" />
        <circle cx={moonX} cy={moonY} r={moonR} fill="#0b0b1a" opacity="0.85" stroke={b} strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={moonX - 6} cy={moonY - 5} r={moonR * 0.22} fill={b} opacity="0.3" />
        <circle cx={moonX + 7} cy={moonY + 6} r={moonR * 0.14} fill={b} opacity="0.24" />

        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 4 === 0 ? b : "#c4b5fd"} opacity={s.o} />
        ))}

        <path
          d={`M0 186 C 60 ${150 + (index % 4) * 8}, 110 ${196 - (index % 3) * 10}, 190 180 S 320 ${156 + (index % 5) * 6}, 400 190 L400 240 L0 240 Z`}
          fill={`url(#hill-${game.id})`}
        />
        <path
          d={`M0 208 C 80 ${186 + (index % 3) * 7}, 150 214, 240 200 S 350 ${188 + (index % 4) * 5}, 400 210 L400 240 L0 240 Z`}
          fill="#080812"
          opacity="0.8"
        />

        {/* tombstones / ruins, varied by game */}
        {index % 2 === 0 ? (
          <g opacity="0.45" stroke={a} strokeWidth="1.2">
            <path d={`M${34 + (index % 5) * 12} 200 v-22 a7 7 0 0 1 14 0 v22`} fill="#080812" />
            <path d="M320 204 v-16 a6 6 0 0 1 12 0 v16" fill="#080812" />
          </g>
        ) : (
          <g opacity="0.4" fill="none" stroke={b} strokeWidth="1.2">
            <path d="M46 202 v-26 M38 184 h16" />
            <path d="M352 208 v-20 M345 195 h14" />
          </g>
        )}

        <rect x="0" y="176" width="400" height="30" fill={`url(#fog-${game.id})`} opacity="0.7" />
        <rect x="0" y="0" width="400" height="240" fill="url(#moon-${game.id})" opacity="0.06" />
      </svg>

      {/* central relic */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: compact ? 96 : 128,
            height: compact ? 96 : 128,
            background: `radial-gradient(circle, ${a}30 0%, transparent 68%)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full border opacity-40"
            style={{ borderColor: `${b}55` }}
          />
          <div
            className="absolute inset-3 rounded-full border opacity-20"
            style={{ borderColor: `${a}88`, borderStyle: "dashed" }}
          />
          <div style={{ filter: `drop-shadow(0 0 18px ${b}90)` }}>
            <GameGlyph glyph={game.glyph} size={compact ? 42 : 58} color="#f4f1ff" />
          </div>
        </div>
      </div>

      <span
        className="absolute bottom-2 right-3 font-score text-[11px] tracking-[0.3em] opacity-50"
        style={{ color: b }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-transparent opacity-80" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)",
        }}
      />
    </div>
  );
}
