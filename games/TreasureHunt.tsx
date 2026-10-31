"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DoorOpen,
  Footprints,
  Gem,
  Heart,
  KeyRound,
  MapPin,
  Skull,
  Sparkles,
} from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { GameGlyph } from "@/components/GameArt";
import { GhostSprite } from "./shared/GhostSprite";
import { TouchDpad } from "./shared/TouchDpad";
import { sfx } from "@/lib/audio";

const SIZE = 7;
const KEY_GOAL = 2;
const TREASURE_GOAL = 3;
const START_INDEX = (SIZE - 1) * SIZE;
const EXIT_INDEX = SIZE - 1;

type CellKind = "empty" | "treasure" | "key" | "trap" | "exit";

interface Cell {
  kind: CellKind;
  seen: boolean;
  collected: boolean;
}

interface HuntState {
  cells: Cell[];
  pos: number;
  lives: number;
  keys: number;
  treasures: number;
  score: number;
  steps: number;
  ended: boolean;
  win: boolean;
}

function makeCells(): Cell[] {
  const cells: Cell[] = Array.from({ length: SIZE * SIZE }, () => ({
    kind: "empty",
    seen: false,
    collected: false,
  }));

  const candidates: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (i === START_INDEX || i === EXIT_INDEX) continue;
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const startRow = SIZE - 1;
    const startCol = 0;
    if (Math.abs(row - startRow) + Math.abs(col - startCol) <= 1) continue;
    candidates.push(i);
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const picks = candidates.slice(0, TREASURE_GOAL + KEY_GOAL + 3);
  picks.slice(0, TREASURE_GOAL).forEach((index) => {
    cells[index].kind = "treasure";
  });
  picks.slice(TREASURE_GOAL, TREASURE_GOAL + KEY_GOAL).forEach((index) => {
    cells[index].kind = "key";
  });
  picks.slice(TREASURE_GOAL + KEY_GOAL).forEach((index) => {
    cells[index].kind = "trap";
  });

  cells[START_INDEX].seen = true;
  cells[EXIT_INDEX].kind = "exit";
  cells[EXIT_INDEX].seen = true;
  return cells;
}

function createHunt(): HuntState {
  return {
    cells: makeCells(),
    pos: START_INDEX,
    lives: 3,
    keys: 0,
    treasures: 0,
    score: 0,
    steps: 0,
    ended: false,
    win: false,
  };
}

export default function TreasureHunt() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [state, setState] = useState<HuntState>(createHunt);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [message, setMessage] = useState("Find two keys, then escape through the gate.");
  const [flash, setFlash] = useState(false);
  const messageTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const setScoreRef = useRef(api.setScore);
  setScoreRef.current = api.setScore;

  const say = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(
      () => setMessage("Find two keys, then escape through the gate."),
      2600,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (!active) return;
      const current = stateRef.current;
      if (current.ended || (dx === 0 && dy === 0)) return;

      const row = Math.floor(current.pos / SIZE);
      const col = current.pos % SIZE;
      const nr = Math.max(0, Math.min(SIZE - 1, row + dy));
      const nc = Math.max(0, Math.min(SIZE - 1, col + dx));
      if (nr === row && nc === col) return;

      const nextIndex = nr * SIZE + nc;
      const cells = current.cells.map((cell) => ({ ...cell }));
      const cell = cells[nextIndex];
      let lives = current.lives;
      let keys = current.keys;
      let treasures = current.treasures;
      let score = current.score;
      let ended: boolean = current.ended;
      let win: boolean = current.win;
      let text = "";

      if (cell.kind === "exit") {
        if (keys >= KEY_GOAL) {
          score += 300 + lives * 100;
          ended = true;
          win = true;
          text = "You escaped with the crypt's hoard!";
        } else {
          sfx.wrong();
          text = `The gate is sealed. ${KEY_GOAL - keys} key${
            KEY_GOAL - keys === 1 ? "" : "s"
          } still lost in the fog.`;
        }
      } else if (!cell.seen) {
        cell.seen = true;
        if (!cell.collected) {
          if (cell.kind === "treasure") {
            cell.collected = true;
            treasures += 1;
            score += 150;
            sfx.golden();
            text =
              treasures >= TREASURE_GOAL
                ? "All three treasures claimed. Now find the keys."
                : `Treasure! ${TREASURE_GOAL - treasures} still buried.`;
          } else if (cell.kind === "key") {
            cell.collected = true;
            keys += 1;
            score += 100;
            sfx.golden();
            text =
              keys >= KEY_GOAL
                ? "Both crypt keys found — the gate is open!"
                : `A crypt key. ${KEY_GOAL - keys} more to go.`;
          } else if (cell.kind === "trap") {
            cell.collected = true;
            lives -= 1;
            score = Math.max(0, score - 50);
            sfx.hit();
            setFlash(true);
            if (flashTimer.current) window.clearTimeout(flashTimer.current);
            flashTimer.current = window.setTimeout(() => setFlash(false), 260);
            text =
              lives <= 0
                ? "The grave takes you."
                : `A trap! ${lives} ${lives === 1 ? "life" : "lives"} left.`;
          } else {
            sfx.flip();
          }
        }
      }

      if (lives <= 0) {
        lives = 0;
        ended = true;
        win = false;
      }

      const next: HuntState = {
        cells,
        pos: nextIndex,
        lives,
        keys,
        treasures,
        score,
        steps: current.steps + 1,
        ended,
        win,
      };
      stateRef.current = next;
      setState(next);
      setScoreRef.current(score);
      if (text) say(text);

      if (ended) {
        endRef.current({ score, win });
      }
    },
    [active, say],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const map: Record<string, [number, number]> = {
        arrowup: [0, -1],
        w: [0, -1],
        arrowdown: [0, 1],
        s: [0, 1],
        arrowleft: [-1, 0],
        a: [-1, 0],
        arrowright: [1, 0],
        d: [1, 0],
      };
      const delta = map[event.key.toLowerCase()];
      if (!delta) return;
      event.preventDefault();
      move(delta[0], delta[1]);
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, move]);

  const playerRow = Math.floor(state.pos / SIZE);
  const playerCol = state.pos % SIZE;
  const progress = Math.min(100, Math.round((state.steps / (SIZE * SIZE)) * 100));

  return (
    <div
      className="game-stage relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-3 py-4 sm:px-6"
      onPointerDown={(event) => {
        swipeRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = swipeRef.current;
        swipeRef.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
        else move(0, dy > 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        swipeRef.current = null;
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_0%,rgba(251,191,36,0.1),transparent_68%)]" />
        <div className="absolute left-[12%] top-[16%] h-28 w-28 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[#05050c] via-[#0a0a17]/80 to-transparent" />
        <div className="absolute bottom-[6%] left-1/2 h-24 w-[80%] max-w-xl -translate-x-1/2 rounded-[50%] bg-cyan-400/[0.045] blur-2xl" />
      </div>

      {/* HUD */}
      <div className="relative z-10 mb-3 flex w-full max-w-[540px] items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 backdrop-blur">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={12}
              className={i < state.lives ? "text-rose-400" : "text-slate-700"}
              fill={i < state.lives ? "currentColor" : "none"}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-cyan-200 backdrop-blur">
          <KeyRound size={11} />
          {state.keys}/{KEY_GOAL}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/20 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-amber-200 backdrop-blur">
          <Gem size={11} />
          {state.treasures}/{TREASURE_GOAL}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[540px]">
        <div className="relative rounded-2xl border border-white/10 bg-[#0a0a17]/70 p-2 shadow-[0_30px_80px_-40px_rgba(0,0,0,1)] backdrop-blur sm:p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-slate-500">
              Blackwood Cemetery
            </span>
            <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">
              <Footprints size={9} /> {state.steps} steps
            </span>
          </div>

          <div
            className={`relative grid aspect-square w-full grid-cols-7 gap-1 rounded-xl border border-white/[0.06] bg-[#06060f]/80 p-1.5 transition-shadow sm:gap-1.5 ${
              flash ? "shadow-[0_0_50px_-8px_rgba(244,63,94,0.75)]" : ""
            }`}
          >
            {state.cells.map((cell, index) => {
              const row = Math.floor(index / SIZE);
              const col = index % SIZE;
              const isPlayer = index === state.pos;
              const distance =
                Math.abs(row - playerRow) + Math.abs(col - playerCol);
              const clickable = active && !state.ended && distance === 1;
              const isExit = cell.kind === "exit";

              return (
                <button
                  key={index}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (!clickable) return;
                    move(col - playerCol, row - playerRow);
                  }}
                  aria-label={
                    isPlayer
                      ? "Your position"
                      : cell.seen
                        ? `Revealed ${cell.kind}`
                        : "Uncharted ground"
                  }
                  className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md border text-center transition-all duration-150 ${
                    isExit
                      ? "border-cyan-300/40 bg-cyan-400/[0.08]"
                      : cell.seen
                        ? "border-white/10 bg-[#12121f]"
                        : "border-white/[0.045] bg-[#0a0a14]"
                  } ${clickable ? "cursor-pointer hover:border-violet-400/50 hover:bg-violet-500/10" : "cursor-default"}`}
                >
                  {!cell.seen && (
                    <>
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.09),transparent_70%)]" />
                      <span className="font-display text-[11px] text-slate-700">?</span>
                    </>
                  )}

                  {cell.seen && cell.kind === "treasure" && (
                    <span className={cell.collected ? "opacity-30" : "animate-drift"}>
                      <GameGlyph glyph="chest" size={22} color={cell.collected ? "#64748b" : "#fbbf24"} />
                    </span>
                  )}
                  {cell.seen && cell.kind === "key" && (
                    <KeyRound
                      size={17}
                      className={cell.collected ? "text-slate-600" : "text-cyan-300"}
                    />
                  )}
                  {cell.seen && cell.kind === "trap" && (
                    <Skull
                      size={17}
                      className={cell.collected ? "text-slate-700" : "text-rose-400"}
                    />
                  )}
                  {cell.seen && cell.kind === "exit" && (
                    <span className="relative flex flex-col items-center">
                      <DoorOpen
                        size={19}
                        className={state.keys >= KEY_GOAL ? "text-emerald-300" : "text-cyan-300/80"}
                      />
                      {state.keys >= KEY_GOAL && (
                        <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                      )}
                    </span>
                  )}

                  {isPlayer && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center bg-violet-500/[0.08]">
                      <GhostSprite size={26} color="#a78bfa" />
                    </span>
                  )}

                  {cell.seen && !isPlayer && cell.kind === "empty" && (
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                  )}
                </button>
              );
            })}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-[#05050c]/60 to-transparent" />
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
            <MapPin size={12} className="shrink-0 text-violet-300" />
            <p className="min-w-0 flex-1 truncate text-[10.5px] text-slate-400">{message}</p>
            <span className="font-score hidden text-[9px] text-slate-600 sm:block">
              {progress}% mapped
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[8.5px] uppercase tracking-[0.16em] text-slate-600">
          <span className="flex items-center gap-1">
            <Sparkles size={9} className="text-amber-400/70" /> treasure 150
          </span>
          <span className="flex items-center gap-1">
            <KeyRound size={9} className="text-cyan-300/70" /> key 100
          </span>
          <span className="flex items-center gap-1">
            <Skull size={9} className="text-rose-400/70" /> trap −50
          </span>
        </div>
      </div>

      <TouchDpad onMove={move} />
    </div>
  );
}
