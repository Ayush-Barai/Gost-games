"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Clock3, Hash, RotateCcw, Sparkles } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { sfx } from "@/lib/audio";

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function isSolved(tiles: number[]) {
  return tiles.every((tile, i) => tile === SOLVED[i]);
}

function neighbours(index: number) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const list: number[] = [];
  if (row > 0) list.push(index - 3);
  if (row < 2) list.push(index + 3);
  if (col > 0) list.push(index - 1);
  if (col < 2) list.push(index + 1);
  return list;
}

function shuffleTiles() {
  let tiles = [...SOLVED];
  let blank = 8;
  for (let step = 0; step < 120; step++) {
    const options = neighbours(blank);
    const next = options[Math.floor(Math.random() * options.length)];
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
    blank = next;
  }
  if (isSolved(tiles)) return shuffleTiles();
  return tiles;
}

export default function NumberPuzzle() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [tiles, setTiles] = useState<number[]>(shuffleTiles);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [solved, setSolved] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const movesRef = useRef(0);
  const solvedRef = useRef(false);
  const endTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!active || solved) return;
    const interval = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [active, solved, startedAt]);

  useEffect(() => {
    return () => {
      if (endTimer.current) window.clearTimeout(endTimer.current);
    };
  }, []);

  const reset = (newTiles = shuffleTiles()) => {
    if (endTimer.current) window.clearTimeout(endTimer.current);
    setTiles(newTiles);
    setMoves(0);
    movesRef.current = 0;
    setSeconds(0);
    setStartedAt(Date.now());
    setSolved(false);
    solvedRef.current = false;
    sfx.click();
  };

  const move = (index: number) => {
    if (!active || solvedRef.current) return;
    const blank = tiles.indexOf(0);
    if (!neighbours(blank).includes(index)) return;
    const next = [...tiles];
    [next[blank], next[index]] = [next[index], next[blank]];
    setTiles(next);
    const nextMoves = movesRef.current + 1;
    movesRef.current = nextMoves;
    setMoves(nextMoves);
    sfx.flip();

    if (isSolved(next)) {
      solvedRef.current = true;
      setSolved(true);
      const finalSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const score = Math.max(150, 2200 - nextMoves * 14 - finalSeconds * 5);
      api.setScore(score);
      sfx.win();
      endTimer.current = window.setTimeout(() => {
        endRef.current({ score, win: true });
      }, 750);
    }
  };

  const formatTime = (total: number) =>
    `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

  return (
    <div className="game-stage flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-4 py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(139,92,246,0.13),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <Hash size={11} className="text-violet-300" />
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Moves</span>
            <span className="font-score text-sm text-white">{moves}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <Clock3 size={11} className="text-cyan-300" />
            <span className="font-score text-sm text-cyan-200">{formatTime(seconds)}</span>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-white"
          >
            <RotateCcw size={11} /> Shuffle
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[linear-gradient(150deg,#141129,#0a0a18)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="relative aspect-square w-full">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/[0.04] bg-black/20" />
              ))}
            </div>
            {tiles.map((tile, index) => {
              if (tile === 0) return null;
              const row = Math.floor(index / 3);
              const col = index % 3;
              return (
                <button
                  key={tile}
                  type="button"
                  onClick={() => move(index)}
                  aria-label={`Slide tile ${tile}`}
                  className="absolute flex h-[calc(33.333%-3px)] w-[calc(33.333%-3px)] items-center justify-center rounded-lg border border-violet-400/25 bg-gradient-to-br from-[#211b3d] to-[#100e20] font-display text-2xl font-bold text-violet-100 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 ease-out hover:border-violet-300/50 hover:text-white active:scale-95"
                  style={{
                    left: `calc(${col * 33.333}% + 2px)`,
                    top: `calc(${row * 33.333}% + 2px)`,
                  }}
                >
                  {tile}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">
              <ArrowLeftRight size={10} /> Slide the tiles
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">
              {solved ? "Order restored" : "1 → 8 · gap last"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-amber-300/80" />
          <p className="text-[10.5px] leading-relaxed text-slate-500">
            Arrange the numbers from <span className="text-slate-300">1 to 8</span>, leaving the
            empty square in the bottom-right corner. Fewer moves and a faster
            time mean a higher score. Shuffle restarts the clock.
          </p>
        </div>
      </div>
    </div>
  );
}
