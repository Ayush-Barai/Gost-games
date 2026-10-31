"use client";

import { ArrowLeft, Keyboard, MousePointer2, Play, Sparkles, Smartphone, Trophy } from "lucide-react";
import { GameArt } from "./GameArt";
import type { GameMeta } from "@/lib/games";

export function GameInstructions({
  game,
  index,
  best,
  onStart,
  onExit,
}: {
  game: GameMeta;
  index: number;
  best: number;
  onStart: () => void;
  onExit: () => void;
}) {
  const isKeyboard = /arrow|wasd|keyboard|space/i.test(game.controls);
  const isTouch = /touch|tap|mouse|click|drag/i.test(game.controls);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <GameArt game={game} index={index} className="aspect-[4/3] w-full" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="rounded-md border border-white/15 bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200 backdrop-blur">
                {game.category} · {game.difficulty}
              </span>
            </div>
          </div>

          <div>
            <div className="eyebrow">
              <Sparkles size={11} />
              Your next haunting
            </div>
            <h2 className="mt-2.5 font-display text-2xl font-bold text-white sm:text-3xl">
              {game.title}
            </h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400 sm:text-sm">
              {game.description}
            </p>

            <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2">
                {isKeyboard ? (
                  <Keyboard size={13} className="text-cyan-300" />
                ) : (
                  <MousePointer2 size={13} className="text-cyan-300" />
                )}
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">
                  Controls
                </span>
                {isTouch && (
                  <Smartphone size={12} className="ml-auto text-slate-500" aria-label="Touch friendly" />
                )}
              </div>
              <p className="mt-1.5 text-[13px] font-medium text-slate-200">{game.controls}</p>
            </div>

            <ol className="mt-4 space-y-2">
              {game.howTo.map((rule, i) => (
                <li key={rule} className="flex gap-2.5 text-[12.5px] leading-relaxed text-slate-400">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 font-mono text-[9px] text-violet-200">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStart}
                className="btn btn-primary flex-1 px-6 py-3.5 text-[13px] tracking-[0.1em]"
              >
                <Play size={15} fill="currentColor" />
                START GAME
              </button>
              <button type="button" onClick={onExit} className="btn btn-secondary px-4 py-3.5 text-[12px]">
                <ArrowLeft size={14} />
                Back to arcade
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-slate-600">
              <span className="flex items-center gap-1.5">
                <Trophy size={11} className="text-amber-400/70" />
                Best: <span className="font-score text-slate-300">{best > 0 ? best.toLocaleString() : "—"}</span>
              </span>
              <span>Progress saves locally</span>
              <span className="hidden sm:inline">Esc to leave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
