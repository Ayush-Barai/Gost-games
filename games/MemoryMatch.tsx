"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cat,
  Eye,
  Flame,
  Ghost,
  Key,
  Moon,
  Skull,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { sfx } from "@/lib/audio";

const SYMBOLS: { icon: LucideIcon; color: string; label: string }[] = [
  { icon: Ghost, color: "#a78bfa", label: "Ghost" },
  { icon: Skull, color: "#e2e8f0", label: "Skull" },
  { icon: Moon, color: "#fbbf24", label: "Moon" },
  { icon: Key, color: "#22d3ee", label: "Key" },
  { icon: Eye, color: "#f472b6", label: "Eye" },
  { icon: Flame, color: "#fb923c", label: "Candle" },
  { icon: Cat, color: "#4ade80", label: "Black cat" },
  { icon: Sparkles, color: "#c4b5fd", label: "Spell" },
];

interface Card {
  uid: number;
  pair: number;
}

function createDeck(): Card[] {
  const cards: Card[] = [];
  for (let pair = 0; pair < SYMBOLS.length; pair++) {
    cards.push({ uid: pair * 2, pair });
    cards.push({ uid: pair * 2 + 1, pair });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export default function MemoryMatch() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [deck] = useState(createDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const scoreRef = useRef(0);
  const timers = useRef<number[]>([]);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const updateScore = useCallback(
    (delta: number) => {
      scoreRef.current = Math.max(0, scoreRef.current + delta);
      api.setScore(scoreRef.current);
    },
    [api],
  );

  const flip = (uid: number) => {
    if (!active || locked) return;
    if (flipped.includes(uid) || matched.includes(uid)) return;
    if (flipped.length >= 2) return;

    sfx.flip();
    const next = [...flipped, uid];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = next;
      const cardA = deck.find((c) => c.uid === first);
      const cardB = deck.find((c) => c.uid === second);
      if (cardA && cardB && cardA.pair === cardB.pair) {
        const timer = window.setTimeout(() => {
          sfx.match();
          setMatched((prev) => [...prev, first, second]);
          setFlipped([]);
          updateScore(100);
        }, 320);
        timers.current.push(timer);
      } else {
        setLocked(true);
        updateScore(-10);
        const timer = window.setTimeout(() => {
          sfx.wrong();
          setFlipped([]);
          setLocked(false);
        }, 780);
        timers.current.push(timer);
      }
    }
  };

  useEffect(() => {
    if (matched.length === deck.length && active) {
      const timer = window.setTimeout(() => {
        const bonus = Math.max(0, 400 - moves * 12);
        const final = scoreRef.current + bonus;
        scoreRef.current = final;
        endRef.current({ score: final, win: true });
      }, 650);
      timers.current.push(timer);
      return () => window.clearTimeout(timer);
    }
  }, [matched.length, deck.length, active, moves]);

  const pairsFound = matched.length / 2;
  const isFlipped = (uid: number) => flipped.includes(uid) || matched.includes(uid);

  const grid = useMemo(() => deck, [deck]);

  return (
    <div className="game-stage flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-[#07070f] px-3 py-5 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(244,114,182,0.1),transparent_65%)]" />
      <div className="relative z-10 w-full max-w-[520px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">Moves</span>
              <span className="ml-2 font-score text-sm text-slate-200">{moves}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">Pairs</span>
              <span className="ml-2 font-score text-sm text-pink-300">{pairsFound}/8</span>
            </div>
          </div>
          <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600 sm:block">
            Fewer moves = higher bonus
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {grid.map((card) => {
            const symbol = SYMBOLS[card.pair];
            const Icon = symbol.icon;
            const show = isFlipped(card.uid);
            const done = matched.includes(card.uid);
            return (
              <button
                key={card.uid}
                type="button"
                onClick={() => flip(card.uid)}
                disabled={done || locked}
                aria-label={show ? symbol.label : "Face-down card"}
                className="relative aspect-square w-full"
                style={{ perspective: "800px" }}
              >
                <div
                  className="relative h-full w-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: show ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* back */}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl border border-violet-400/20 bg-[linear-gradient(150deg,#15102b,#0c0c1c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="absolute inset-1.5 rounded-lg border border-dashed border-violet-400/15" />
                    <Ghost size={24} className="text-violet-400/40" />
                    <span className="absolute bottom-1.5 right-2 font-mono text-[7px] tracking-widest text-violet-300/20">
                      GGA
                    </span>
                  </div>

                  {/* front */}
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border ${
                      done
                        ? "border-emerald-300/30 bg-emerald-400/[0.07]"
                        : "border-white/15 bg-[#111126]"
                    }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <Icon size={30} color={symbol.color} style={{ filter: `drop-shadow(0 0 10px ${symbol.color}55)` }} />
                    <span className="hidden font-mono text-[7px] uppercase tracking-widest text-slate-600 sm:block">
                      {symbol.label}
                    </span>
                    {done && (
                      <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-emerald-300/20" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
          Match all eight relics · Mismatch −10 · Clear bonus for few moves
        </p>
      </div>
    </div>
  );
}
