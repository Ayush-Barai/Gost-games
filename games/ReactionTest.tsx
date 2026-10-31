"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ghost, Timer, Trophy, Zap } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { sfx } from "@/lib/audio";

type Phase = "waiting" | "ready" | "early" | "result" | "finished";

const ROUNDS = 5;

export default function ReactionTest() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [phase, setPhase] = useState<Phase>("waiting");
  const [round, setRound] = useState(1);
  const [readyAt, setReadyAt] = useState(0);
  const [times, setTimes] = useState<(number | null)[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [lastEarly, setLastEarly] = useState(false);
  const [bestReaction, setBestReaction] = useLocalStorage<number | null>("gga-best-reaction", null);
  const [score, setScore] = useState(0);
  const timeout = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("waiting");
  const timesRef = useRef<(number | null)[]>([]);
  phaseRef.current = phase;
  const roundRef = useRef(1);
  roundRef.current = round;
  const scoreRef = useRef(0);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const finishedRef = useRef(false);

  const clearTimer = () => {
    if (timeout.current) {
      window.clearTimeout(timeout.current);
      timeout.current = null;
    }
  };

  const advance = useCallback(() => {
    setPhase("result");
    timeout.current = window.setTimeout(() => {
      if (roundRef.current >= ROUNDS) {
        setPhase("finished");
      } else {
        setRound((r) => r + 1);
        setPhase("waiting");
      }
    }, 1150);
  }, []);

  const record = useCallback(
    (ms: number | null, early = false) => {
      if (finishedRef.current) return;
      clearTimer();
      const next = [...timesRef.current, ms];
      timesRef.current = next;
      setTimes(next);
      setLastTime(ms);
      setLastEarly(early);
      if (ms !== null && !early) {
        const gained = Math.max(50, Math.round(1200 - ms));
        scoreRef.current += gained;
        setScore(scoreRef.current);
        api.setScore(scoreRef.current);
        setBestReaction((prev) => (prev === null || ms < prev ? Math.round(ms) : prev));
        sfx.point();
      } else {
        sfx.wrong();
      }
      if (next.length >= ROUNDS) {
        const valid = next.filter((t): t is number => t !== null);
        const average = valid.length
          ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
          : null;
        if (average !== null) {
          const bonus = Math.max(0, 600 - average);
          scoreRef.current += bonus;
          setScore(scoreRef.current);
          api.setScore(scoreRef.current);
        }
      }
      advance();
    },
    [advance, api, setBestReaction],
  );

  // Random delay before the scare
  useEffect(() => {
    if (!active || phase !== "waiting") return;
    const delay = 1300 + Math.random() * 2400;
    timeout.current = window.setTimeout(() => {
      setReadyAt(performance.now());
      setPhase("ready");
      sfx.flip();
    }, delay);
    return clearTimer;
  }, [active, phase, round]);

  // Missed reaction
  useEffect(() => {
    if (!active || phase !== "ready") return;
    timeout.current = window.setTimeout(() => {
      record(1800);
    }, 1900);
    return clearTimer;
  }, [active, phase, record]);

  const react = useCallback(() => {
    if (!active || finishedRef.current) return;
    const current = phaseRef.current;
    if (current === "waiting") {
      record(null, true);
    } else if (current === "ready") {
      const ms = performance.now() - readyAt;
      record(ms);
    }
  }, [active, readyAt, record]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if ([" ", "enter"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        react();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, react]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    endRef.current({ score: scoreRef.current, win: true });
  };

  const validTimes = times.filter((t): t is number => t !== null);
  const average = validTimes.length
    ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    : null;
  const validBest = validTimes.length ? Math.min(...validTimes) : null;

  return (
    <div className="game-stage relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#05050c] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_45%,rgba(34,211,238,0.07),transparent_70%)]" />

      <div className="absolute left-3 right-3 top-2 z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => {
            const value = times[i];
            return (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  value === null && times.length > i
                    ? "bg-rose-400/70"
                    : value !== undefined
                      ? "bg-cyan-400/70"
                      : i === round - 1
                        ? "bg-violet-400"
                        : "bg-white/10"
                }`}
              />
            );
          })}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Round {Math.min(round, ROUNDS)}/{ROUNDS}
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={react}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            react();
          }
        }}
        aria-label="Reaction target"
        className={`relative z-10 flex h-[74vmin] max-h-[460px] w-full max-w-xl select-none flex-col items-center justify-center rounded-3xl border transition-colors duration-150 ${
          phase === "ready"
            ? "border-cyan-300/50 bg-cyan-400/[0.1] shadow-[0_0_90px_-20px_rgba(34,211,238,0.7)]"
            : phase === "early"
              ? "border-rose-400/50 bg-rose-500/10"
              : phase === "result"
                ? "border-violet-400/25 bg-violet-500/[0.04]"
                : "border-white/10 bg-white/[0.02]"
        }`}
      >
        {phase === "waiting" && (
          <>
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full border border-violet-400/20" />
              <span className="absolute inset-4 rounded-full border border-violet-400/10" />
              <span className="h-2 w-2 rounded-full bg-violet-400/60" />
            </div>
            <p className="mt-6 font-display text-2xl text-white/70">Wait for it…</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-600">
              The ghost appears without warning
            </p>
          </>
        )}

        {phase === "ready" && (
          <div style={{ animation: "scare 0.22s cubic-bezier(0.34,1.56,0.64,1)" }} className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute inset-0 -m-8 rounded-full bg-cyan-400/20 blur-2xl" />
              <Ghost size={140} className="relative text-cyan-200" strokeWidth={0.9} style={{ filter: "drop-shadow(0 0 30px rgba(34,211,238,0.8))" }} />
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-white text-glow-cyan">CLICK!</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
              Banish it. Now.
            </p>
          </div>
        )}

        {phase === "early" && (
          <>
            <Zap size={52} className="text-rose-300" />
            <p className="mt-4 font-display text-2xl text-rose-200">Too early.</p>
            <p className="mt-1 text-[11px] text-slate-500">The spirit wasn&apos;t there yet. Round lost.</p>
          </>
        )}

        {phase === "result" && (
          <>
            {lastEarly || lastTime === null ? (
              <Zap size={44} className="text-rose-300" />
            ) : (
              <Timer size={44} className="text-cyan-300" />
            )}
            <p className="mt-4 font-score text-5xl font-bold text-white">
              {lastEarly || lastTime === null ? "—" : Math.round(lastTime)}
              <span className="ml-1 text-lg text-slate-500">ms</span>
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
              {lastEarly
                ? "Early click · no points"
                : lastTime !== null && lastTime < 250
                  ? "Lightning reflexes"
                  : lastTime !== null && lastTime < 400
                    ? "Quick as a spirit"
                    : "The ghost was quicker"}
            </p>
          </>
        )}

        {phase === "finished" && (
          <div className="w-full max-w-sm px-6">
            <div className="text-center">
              <Trophy size={34} className="mx-auto text-amber-300" />
              <h2 className="mt-3 font-display text-2xl font-bold text-white">Reflex report</h2>
              <p className="mt-1 text-[11px] text-slate-500">Five rounds. The dead are impressed.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">Average</p>
                <p className="font-score mt-1 text-2xl text-cyan-200">{average ?? "—"}<span className="text-xs">ms</span></p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">Fastest</p>
                <p className="font-score mt-1 text-2xl text-amber-200">{validBest ?? "—"}<span className="text-xs">ms</span></p>
              </div>
            </div>
            <div className="mt-3 flex justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Score</span>
              <span className="font-score text-sm text-white">{score.toLocaleString()}</span>
            </div>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
              Personal best {bestReaction ? `${bestReaction}ms` : "—"}
            </p>
            <button type="button" onClick={(e) => { e.stopPropagation(); finish(); }} className="btn btn-primary mt-4 w-full py-3 text-[12px]">
              Claim results
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-4 text-[10px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <Zap size={11} className="text-cyan-400/70" /> Click when the ghost appears
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <Trophy size={11} className="text-amber-400/70" /> Best single: {bestReaction ? `${bestReaction}ms` : "—"}
        </span>
      </div>
    </div>
  );
}
