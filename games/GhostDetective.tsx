"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock3, Fingerprint, Flame, KeyRound, Search, Sparkles } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { sfx } from "@/lib/audio";

interface Clue {
  id: string;
  label: string;
  x: number;
  y: number;
  title: string;
  text: string;
}

const CLUES: Clue[] = [
  {
    id: "portrait",
    label: "Portrait",
    x: 38.5,
    y: 31,
    title: "A turned portrait",
    text: "Lady Morrigan's portrait has been turned to face the wall. The dust line shows it happened tonight — and only someone tall enough to reach the frame could move it.",
  },
  {
    id: "books",
    label: "Bookcase",
    x: 14.4,
    y: 60,
    title: "A marked chapter",
    text: "A book on séances lies open at 'Binding a Spirit to Silver'. A pressed jasmine petal marks the page — Lady Morrigan's perfume, and her habit of leaving flowers in books.",
  },
  {
    id: "candle",
    label: "Candle",
    x: 60,
    y: 57,
    title: "A recently snuffed flame",
    text: "The candle is still warm. A faint trail of jasmine perfume hangs in the air, and a smear of pale face powder sits on the table edge.",
  },
  {
    id: "clock",
    label: "Clock",
    x: 82.6,
    y: 62,
    title: "Stopped at 11:47",
    text: "The grandfather clock stopped at 11:47. Tucked behind its door: a white lace glove, monogrammed L.M. The locket was taken at exactly that hour.",
  },
];

const SUSPECTS = [
  {
    id: "morrigan",
    name: "Lady Morrigan",
    note: "The lady of the house. Pale, perfumed, and fond of silver.",
    correct: true,
  },
  {
    id: "graves",
    name: "Mr. Graves",
    note: "The butler. Tall, silent, and unable to read the marked book.",
    correct: false,
  },
  {
    id: "gardener",
    name: "The Gardener",
    note: "Works outdoors. Smells of earth, not jasmine.",
    correct: false,
  },
];

export default function GhostDetective() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [found, setFound] = useState<string[]>([]);
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [accused, setAccused] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"win" | "lose" | null>(null);
  const scoreRef = useRef(0);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const inspect = (clue: Clue) => {
    if (!active || found.includes(clue.id)) return;
    setFound((prev) => [...prev, clue.id]);
    setActiveClue(clue);
    scoreRef.current += 50;
    api.setScore(scoreRef.current);
    sfx.flip();
  };

  const accuse = (suspectId: string) => {
    if (!active || verdict) return;
    setAccused(suspectId);
    const suspect = SUSPECTS.find((s) => s.id === suspectId);
    const correct = Boolean(suspect?.correct);
    if (correct) {
      scoreRef.current += 500;
      api.setScore(scoreRef.current);
      setVerdict("win");
      sfx.win();
    } else {
      setVerdict("lose");
      sfx.lose();
    }
    timer.current = window.setTimeout(() => {
      endRef.current({ score: scoreRef.current, win: correct });
    }, 1600);
  };

  const ready = found.length === CLUES.length;

  return (
    <div className="game-stage flex h-full w-full items-start justify-center overflow-y-auto bg-[#07070f] px-3 py-4 sm:px-5 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(251,191,36,0.07),transparent_70%)]" />
      <div className="relative z-10 grid w-full max-w-5xl gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        {/* room */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
            <svg viewBox="0 0 800 600" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
              <defs>
                <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#151227" />
                  <stop offset="1" stopColor="#0a0916" />
                </linearGradient>
                <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#161022" />
                  <stop offset="1" stopColor="#08070f" />
                </linearGradient>
                <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#fbbf24" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="window" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#67e8f9" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#0e7490" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="800" height="600" fill="url(#wall)" />
              <path d="M0 430 L800 430 L800 600 L0 600 Z" fill="url(#floor)" />
              {/* wallpaper pattern */}
              {Array.from({ length: 8 }).map((_, i) =>
                Array.from({ length: 5 }).map((_, j) => (
                  <path
                    key={`${i}-${j}`}
                    d={`M${50 + i * 100} ${40 + j * 80} l9 16 l-9 16 l-9 -16 Z`}
                    fill="none"
                    stroke="rgba(139,92,246,0.08)"
                  />
                )),
              )}
              {/* window */}
              <rect x="560" y="80" width="170" height="220" rx="8" fill="#0a1220" stroke="#25304a" strokeWidth="6" />
              <rect x="570" y="90" width="150" height="200" fill="url(#window)" />
              <circle cx="655" cy="150" r="34" fill="#e0f2fe" opacity="0.55" />
              <path d="M645 90 v200 M570 190 h150" stroke="#1e293b" strokeWidth="5" />
              <path d="M570 290 l40 -50 l40 50 Z" fill="#0c0c16" opacity="0.8" />

              {/* bookcase */}
              <rect x="40" y="230" width="150" height="270" rx="4" fill="#0d0a16" stroke="#302546" />
              {[0, 1, 2, 3].map((row) => (
                <g key={row}>
                  <rect x="48" y={245 + row * 62} width="134" height="50" fill="#0a0812" />
                  {[0, 1, 2, 3, 4].map((book) => (
                    <rect
                      key={book}
                      x={55 + book * 24}
                      y={254 + row * 62}
                      width={13 + (book % 3) * 3}
                      height={36}
                      rx="1"
                      fill={["#4c1d95", "#155e75", "#6b21a8", "#1e3a8a", "#3f1d38"][book]}
                      opacity="0.9"
                    />
                  ))}
                  <rect x="44" y={296 + row * 62} width="142" height="4" fill="#2f2544" />
                </g>
              ))}

              {/* portrait */}
              <rect x="238" y="100" width="140" height="176" rx="5" fill="#120d1d" stroke="#4b3a2a" strokeWidth="7" />
              <rect x="246" y="108" width="124" height="160" fill="#1a1224" />
              <ellipse cx="308" cy="160" rx="27" ry="34" fill="#2b1e3a" />
              <path d="M262 250 c0 -46 20 -66 46 -66 s46 20 46 66 Z" fill="#241a34" />
              <circle cx="299" cy="155" r="2" fill="#f8fafc" opacity="0.5" />
              <circle cx="317" cy="155" r="2" fill="#f8fafc" opacity="0.5" />
              <rect x="238" y="100" width="140" height="176" fill="#080812" opacity="0.45" />

              {/* clock */}
              <rect x="620" y="330" width="82" height="190" rx="6" fill="#120c1a" stroke="#3d2a1f" strokeWidth="4" />
              <circle cx="661" cy="374" r="25" fill="#0b0812" stroke="#a78bfa" strokeOpacity="0.5" />
              <path d="M661 374 v-14 M661 374 l9 8" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
              <path d="M641 470 h40" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2" />

              {/* rug */}
              <ellipse cx="420" cy="500" rx="230" ry="64" fill="#1a0f22" stroke="#3b1f3a" />
              <ellipse cx="420" cy="500" rx="180" ry="46" fill="none" stroke="#4c1d40" strokeDasharray="6 8" />

              {/* table + candle */}
              <rect x="380" y="380" width="210" height="14" rx="4" fill="#20142c" />
              <rect x="400" y="394" width="10" height="90" fill="#170f22" />
              <rect x="560" y="394" width="10" height="90" fill="#170f22" />
              <rect x="472" y="344" width="14" height="38" rx="3" fill="#e2e8f0" opacity="0.7" />
              <ellipse cx="479" cy="338" rx="26" ry="30" fill="url(#lamp)" />
              <path d="M479 330 c-5 -8 2 -12 0 -20 c8 6 10 12 4 20 Z" fill="#fbbf24" opacity="0.9" />

              {/* floor fog */}
              <rect x="0" y="430" width="800" height="80" fill="url(#window)" opacity="0.1" />
            </svg>

            {/* hot spots */}
            {CLUES.map((clue) => {
              const inspected = found.includes(clue.id);
              return (
                <button
                  key={clue.id}
                  type="button"
                  onClick={() => inspect(clue)}
                  disabled={inspected}
                  aria-label={inspected ? `${clue.label} inspected` : `Inspect ${clue.label}`}
                  className={`group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all ${
                    inspected
                      ? "h-7 w-7 border-emerald-300/40 bg-emerald-400/20 text-emerald-200"
                      : "h-10 w-10 animate-pulse border-amber-300/40 bg-amber-400/10 text-amber-200 hover:scale-110 hover:bg-amber-400/25"
                  }`}
                  style={{ left: `${clue.x}%`, top: `${clue.y}%` }}
                >
                  {inspected ? <Check size={12} /> : <Search size={15} />}
                  {!inspected && (
                    <span className="pointer-events-none absolute -bottom-6 whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber-100/80 opacity-0 transition-opacity group-hover:opacity-100">
                      {clue.label}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
              <span className="rounded-md border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
                Blackthorn Manor · 11:47 PM
              </span>
              <span className="rounded-md border border-amber-300/25 bg-black/45 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                {found.length}/4 clues
              </span>
            </div>
          </div>

          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
            Click the glowing objects to collect evidence
          </p>
        </div>

        {/* case file */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={14} className="text-amber-300" />
              <h3 className="font-display text-sm font-semibold text-white">Case file</h3>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              The Silver Locket vanished from the parlour at 11:47 PM. Four pieces
              of evidence remain. Find them, then name the thief.
            </p>

            <div className="mt-3 space-y-2">
              {CLUES.map((clue) => {
                const inspected = found.includes(clue.id);
                return (
                  <button
                    key={clue.id}
                    type="button"
                    onClick={() => {
                      if (inspected) {
                        setActiveClue(clue);
                        sfx.flip();
                      } else {
                        inspect(clue);
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      activeClue?.id === clue.id
                        ? "border-amber-300/35 bg-amber-400/[0.07]"
                        : inspected
                          ? "border-emerald-300/20 bg-emerald-400/[0.04] hover:border-emerald-300/40"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-medium ${inspected ? "text-slate-300" : "text-slate-500"}`}>
                        {inspected ? clue.title : `${clue.label} — unexamined`}
                      </span>
                      {inspected ? (
                        <Check size={11} className="text-emerald-300" />
                      ) : (
                        <KeyRound size={10} className="text-slate-600" />
                      )}
                    </div>
                    {activeClue?.id === clue.id && inspected && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{clue.text}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeClue && (
            <div className="rounded-xl border border-amber-300/15 bg-amber-400/[0.035] p-3.5">
              <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/80">
                <Sparkles size={10} /> Evidence · {activeClue.title}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{activeClue.text}</p>
            </div>
          )}

          {ready && !verdict && (
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
              <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-violet-200">
                <Clock3 size={10} /> Accusation
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Who took the Silver Locket?</p>
              <div className="mt-3 space-y-2">
                {SUSPECTS.map((suspect) => (
                  <button
                    key={suspect.id}
                    type="button"
                    onClick={() => accuse(suspect.id)}
                    disabled={Boolean(accused)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all ${
                      accused === suspect.id
                        ? suspect.correct
                          ? "border-emerald-300/40 bg-emerald-400/10"
                          : "border-rose-300/40 bg-rose-400/10"
                        : "border-white/10 bg-white/[0.02] hover:border-violet-400/40 hover:bg-violet-500/10"
                    }`}
                  >
                    <p className="text-[11.5px] font-semibold text-slate-200">{suspect.name}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{suspect.note}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {verdict && (
            <div
              className={`rounded-xl border p-4 ${
                verdict === "win"
                  ? "border-emerald-300/30 bg-emerald-400/[0.08]"
                  : "border-rose-300/30 bg-rose-400/[0.08]"
              }`}
            >
              <p className={`flex items-center gap-2 font-display text-sm ${verdict === "win" ? "text-emerald-200" : "text-rose-200"}`}>
                {verdict === "win" ? <Flame size={14} /> : <Clock3 size={14} />}
                {verdict === "win" ? "Case closed." : "Wrong spirit."}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {verdict === "win"
                  ? "Lady Morrigan bound the locket to her own spirit. The jasmine, the glove, the turned portrait — all hers."
                  : "The evidence did not add up. Lady Morrigan's perfume and monogram pointed to her all along."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
