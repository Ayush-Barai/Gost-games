"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import gsap from "gsap";
import {
  ArrowLeft,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trophy,
} from "lucide-react";
import { GameGlyph } from "./GameArt";
import { GameInstructions } from "./GameInstructions";
import { GameOverScreen } from "./GameOverScreen";
import { SoundButton } from "./SoundButton";
import type { GameMeta } from "@/lib/games";
import { useArcadeStore } from "@/lib/store";
import { sfx } from "@/lib/audio";

export type GameStatus = "ready" | "playing" | "paused" | "over";

export interface GameApi {
  status: GameStatus;
  paused: boolean;
  score: number;
  best: number;
  timeLeft: number | null;
  addScore: (amount: number) => void;
  setScore: (value: number) => void;
  setTimeLeft: (value: number | null) => void;
  reportGhosts: (total: number) => void;
  endGame: (result?: { score?: number; ghostsCaught?: number; win?: boolean }) => void;
}

const GameContext = createContext<GameApi | null>(null);

export function useGameApi(): GameApi {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameApi must be used inside GameShell");
  return context;
}

function LiveScore({ score }: { score: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(el, { y: -6, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.24, ease: "power2.out" });
  }, [score]);
  return (
    <span ref={ref} className="font-score inline-block text-[15px] font-bold text-white sm:text-base">
      {score.toLocaleString()}
    </span>
  );
}

function Stat({
  label,
  children,
  accent,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div className={`text-center ${wide ? "min-w-[58px]" : "min-w-[46px]"}`}>
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div style={accent ? { color: accent } : undefined}>{children}</div>
    </div>
  );
}

export function GameShell({
  game,
  index,
  GameComponent,
  onExit,
}: {
  game: GameMeta;
  index: number;
  GameComponent: ComponentType;
  onExit: () => void;
}) {
  const best = useArcadeStore((s) => s.bestScores[game.id] ?? 0);
  const recordPlay = useArcadeStore((s) => s.recordPlay);
  const recordGameOver = useArcadeStore((s) => s.recordGameOver);

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScoreState] = useState(0);
  const [timeLeft, setTimeLeftState] = useState<number | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [outcome, setOutcome] = useState<{
    win: boolean;
    elapsed: number;
    isNewBest: boolean;
    finalScore: number;
  } | null>(null);

  const scoreRef = useRef(0);
  const statusRef = useRef<GameStatus>("ready");
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const bestAtStartRef = useRef(0);
  const ghostsCaughtRef = useRef(0);
  const [a, b] = game.accent;

  const setStatusSafe = (next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const setScore = useCallback((value: number) => {
    const safe = Math.max(0, Math.round(value));
    scoreRef.current = safe;
    setScoreState(safe);
  }, []);

  const addScore = useCallback((amount: number) => {
    const safe = Math.max(0, Math.round(scoreRef.current + amount));
    scoreRef.current = safe;
    setScoreState(safe);
  }, []);

  const setTimeLeft = useCallback((value: number | null) => {
    setTimeLeftState(value);
  }, []);

  const reportGhosts = useCallback((total: number) => {
    ghostsCaughtRef.current = Math.max(ghostsCaughtRef.current, Math.round(total));
  }, []);

  const endGame = useCallback(
    (result?: { score?: number; ghostsCaught?: number; win?: boolean }) => {
      if (statusRef.current !== "playing") return;
      const finalScore = Math.max(
        0,
        Math.round(result?.score ?? scoreRef.current),
      );
      const elapsed =
        elapsedRef.current + (performance.now() - startRef.current) / 1000;
      const previousBest = bestAtStartRef.current;

      scoreRef.current = finalScore;
      setScoreState(finalScore);
      statusRef.current = "over";
      setStatus("over");
      if (game.duration != null) setTimeLeftState(0);
      setOutcome({
        win: Boolean(result?.win),
        elapsed,
        isNewBest: finalScore > previousBest && finalScore > 0,
        finalScore,
      });

      recordGameOver({
        id: game.id,
        score: finalScore,
        survivalSeconds: elapsed,
        ghostsCaught: result?.ghostsCaught ?? ghostsCaughtRef.current,
      });

      if (result?.win) sfx.win();
      else sfx.lose();
    },
    [game.id, game.duration, recordGameOver],
  );

  const beginRun = useCallback(() => {
    bestAtStartRef.current = useArcadeStore.getState().bestScores[game.id] ?? 0;
    recordPlay(game.id);
    sfx.start();
    scoreRef.current = 0;
    setScoreState(0);
    setTimeLeftState(game.duration ?? null);
    setOutcome(null);
    elapsedRef.current = 0;
    ghostsCaughtRef.current = 0;
    startRef.current = performance.now();
    setRunKey((k) => k + 1);
    setStatusSafe("playing");
  }, [game.id, game.duration, recordPlay]);

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    elapsedRef.current += (performance.now() - startRef.current) / 1000;
    setStatusSafe("paused");
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    startRef.current = performance.now();
    setStatusSafe("playing");
  }, []);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") pause();
    else if (statusRef.current === "paused") resume();
  }, [pause, resume]);

  // Countdown for games with a fixed duration.
  useEffect(() => {
    if (status !== "playing" || game.duration == null) return;
    const id = window.setInterval(() => {
      setTimeLeftState((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, game.duration]);

  useEffect(() => {
    if (status === "playing" && game.duration != null && timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, status, game.duration, endGame]);

  useEffect(() => {
    if (
      status === "playing" &&
      game.duration != null &&
      timeLeft !== null &&
      timeLeft > 0 &&
      timeLeft <= 5
    ) {
      sfx.tick();
    }
  }, [timeLeft, status, game.duration]);

  // Pause automatically when the tab loses focus.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  // Escape pauses; P toggles as well.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (statusRef.current === "playing") pause();
        else if (statusRef.current === "paused") resume();
        else onExit();
      }
      if (event.key.toLowerCase() === "p" && !event.repeat) {
        const target = event.target as HTMLElement | null;
        if (target && /input|textarea/i.test(target.tagName)) return;
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, resume, togglePause, onExit]);

  const api: GameApi = {
    status,
    paused: status === "paused",
    score,
    best,
    timeLeft,
    addScore,
    setScore,
    setTimeLeft,
    reportGhosts,
    endGame,
  };

  const timerDisplay =
    timeLeft !== null
      ? `${Math.floor(timeLeft / 60)}:${String(Math.max(0, timeLeft % 60)).padStart(2, "0")}`
      : null;

  return (
    <GameContext.Provider value={api}>
      <div className="flex h-full min-h-0 flex-col bg-[#07070f]">
        {/* Header / HUD */}
        <header className="relative z-20 shrink-0 border-b border-white/[0.08] bg-[#080812]/95 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-2.5 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                onExit();
              }}
              className="icon-btn !h-9 !w-9 shrink-0"
              aria-label="Exit game and return to the arcade"
              title="Exit game"
            >
              <ArrowLeft size={17} />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:flex"
                style={{ borderColor: `${b}33`, background: `${a}18`, color: b }}
              >
                <GameGlyph glyph={game.glyph} size={18} color={b} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-[13px] font-semibold leading-tight text-white sm:text-[15px]">
                  {game.title}
                </h1>
                <p className="mt-0.5 hidden font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500 sm:block">
                  {game.category} · {game.difficulty}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
              <Stat label="Score" wide>
                <LiveScore score={score} />
              </Stat>
              <div className="hidden lg:block">
                <Stat label="Best" wide>
                  <span className="font-score text-[13px] text-slate-300">{best.toLocaleString()}</span>
                </Stat>
              </div>
              {timerDisplay && (
                <Stat label="Time">
                  <span
                    className={`font-score flex items-center gap-1 text-[14px] font-bold ${
                      timeLeft !== null && timeLeft <= 5 ? "text-rose-400" : "text-cyan-200"
                    }`}
                  >
                    <Timer size={11} className="hidden sm:block" />
                    {timerDisplay}
                  </span>
                </Stat>
              )}

              <span className="mx-0.5 hidden h-6 w-px bg-white/10 sm:block" />

              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  togglePause();
                }}
                disabled={status !== "playing" && status !== "paused"}
                className="icon-btn !h-9 !w-9"
                aria-label={status === "paused" ? "Resume game" : "Pause game"}
                title={status === "paused" ? "Resume" : "Pause"}
              >
                {status === "paused" ? <Play size={15} fill="currentColor" /> : <Pause size={15} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  beginRun();
                }}
                disabled={status === "ready"}
                className="icon-btn !h-9 !w-9 hidden sm:inline-flex"
                aria-label="Restart game"
                title="Restart"
              >
                <RotateCcw size={15} />
              </button>
              <span className="hidden sm:block">
                <SoundButton />
              </span>
              <span className="sm:hidden">
                <SoundButton />
              </span>
            </div>
          </div>
          <div
            className="h-px w-full opacity-60"
            style={{ background: `linear-gradient(90deg, transparent, ${a}, ${b}, transparent)` }}
          />
        </header>

        {/* Stage */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${a}12, transparent 70%)`,
            }}
          />
          {status === "ready" ? (
            <GameInstructions
              game={game}
              index={index}
              best={best}
              onStart={beginRun}
              onExit={onExit}
            />
          ) : (
            <div className="absolute inset-0">
              <GameComponent key={runKey} />
            </div>
          )}

          {status === "paused" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05050c]/70 px-4 backdrop-blur-md">
              <div className="glass-strong w-full max-w-xs rounded-2xl p-6 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-violet-300/80">
                  Intermission
                </p>
                <h2 className="mt-2 font-display text-2xl text-white">Paused</h2>
                <p className="mt-1 text-[11px] text-slate-500">The spirits will wait. Probably.</p>
                <div className="mt-5 flex flex-col gap-2">
                  <button type="button" onClick={resume} className="btn btn-primary w-full py-2.5 text-[12px]">
                    <Play size={13} fill="currentColor" /> Resume
                  </button>
                  <button type="button" onClick={beginRun} className="btn btn-secondary w-full py-2.5 text-[12px]">
                    <RotateCcw size={13} /> Restart
                  </button>
                  <button type="button" onClick={onExit} className="btn btn-ghost w-full py-2 text-[11px]">
                    Exit to arcade
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === "over" && outcome && (
            <GameOverScreen
              game={game}
              score={outcome.finalScore}
              best={Math.max(best, outcome.finalScore)}
              isNewBest={outcome.isNewBest}
              elapsed={outcome.elapsed}
              win={outcome.win}
              onRestart={beginRun}
              onExit={onExit}
            />
          )}
        </div>

        {/* Controls strip */}
        <footer className="relative z-20 hidden shrink-0 items-center justify-between gap-4 border-t border-white/[0.07] bg-[#080812]/90 px-5 py-2 sm:flex">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Keyboard size={12} className="text-violet-400/70" />
            <span className="font-mono uppercase tracking-[0.14em]">{game.controls}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px]">ESC</kbd>
              pause
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy size={10} className="text-amber-500/70" />
              best {best.toLocaleString()}
            </span>
          </div>
        </footer>
      </div>
    </GameContext.Provider>
  );
}
