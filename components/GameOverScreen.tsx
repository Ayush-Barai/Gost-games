"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowLeft, Crown, Ghost, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react";
import type { GameMeta } from "@/lib/games";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 1) return "<1s";
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function GameOverScreen({
  game,
  score,
  best,
  isNewBest,
  elapsed,
  win,
  onRestart,
  onExit,
}: {
  game: GameMeta;
  score: number;
  best: number;
  isNewBest: boolean;
  elapsed: number;
  win: boolean;
  onRestart: () => void;
  onExit: () => void;
}) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [a, b] = game.accent;

  useEffect(() => {
    const el = scoreRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = score.toLocaleString();
      return;
    }
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: score,
      duration: 1.1,
      ease: "power2.out",
      delay: 0.15,
      onUpdate: () => {
        el.textContent = Math.round(counter.value).toLocaleString();
      },
    });
    return () => {
      tween.kill();
    };
  }, [score]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(
      el,
      { y: 26, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-[#05050c]/78 px-4 py-6 backdrop-blur-md sm:items-center sm:py-10">
      <div
        ref={panelRef}
        className="glass-strong relative w-full max-w-md overflow-hidden rounded-2xl border-white/15 p-6 text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] sm:p-8"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-40 blur-2xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${a}, transparent 70%)` }}
        />

        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04]">
          {win ? (
            <Crown size={24} className="text-amber-300" />
          ) : (
            <Ghost size={26} className="text-violet-300" />
          )}
          <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em]" style={{ color: b }}>
          {win ? "Haunt complete" : "The night claims you"}
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl">
          {win ? "You survived it" : "Game over"}
        </h2>
        <p className="mt-1.5 text-[12px] text-slate-500">
          {game.title} · {game.category}
        </p>

        {isNewBest && (
          <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
            <Sparkles size={11} /> New personal best
          </div>
        )}

        <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/25 px-5 py-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-slate-500">Final score</p>
          <span
            ref={scoreRef}
            className="font-score mt-1 block text-4xl font-bold text-white"
            style={{ textShadow: `0 0 30px ${b}66` }}
          >
            0
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <Trophy size={13} className="text-amber-400/80" />
            <div className="text-left">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Best</p>
              <p className="font-score text-[13px] text-slate-200">{best.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
            <Timer size={13} className="text-cyan-300/80" />
            <div className="text-left">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Run time</p>
              <p className="font-score text-[13px] text-slate-200">{formatTime(elapsed)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onRestart} className="btn btn-primary w-full py-3 text-[12px] tracking-[0.1em]">
            <RotateCcw size={14} /> PLAY AGAIN
          </button>
          <button type="button" onClick={onExit} className="btn btn-secondary w-full py-3 text-[12px]">
            <ArrowLeft size={14} /> Back to the arcade
          </button>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-slate-600">
          Your best score is saved locally. No account, no tracking — just the
          ghosts.
        </p>
      </div>
    </div>
  );
}
