"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Ghost, RotateCcw, Sparkles } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { GameGlyph } from "@/components/GameArt";
import { sfx } from "@/lib/audio";

type Cell = "X" | "O" | null;
type Difficulty = "whisper" | "wail" | "shriek";
type Result = { winner: "X" | "O" | "draw"; line: number[] | null };

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getResult(board: Cell[]): Result | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line };
    }
  }
  if (board.every(Boolean)) return { winner: "draw", line: null };
  return null;
}

function minimax(board: Cell[], turn: "X" | "O", depth = 0): number {
  const result = getResult(board);
  if (result) {
    if (result.winner === "O") return 10 - depth;
    if (result.winner === "X") return depth - 10;
    return 0;
  }
  const available = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  if (turn === "O") {
    let best = -Infinity;
    for (const i of available) {
      board[i] = "O";
      best = Math.max(best, minimax(board, "X", depth + 1));
      board[i] = null;
    }
    return best;
  }
  let best = Infinity;
  for (const i of available) {
    board[i] = "X";
    best = Math.min(best, minimax(board, "O", depth + 1));
    board[i] = null;
  }
  return best;
}

function chooseAiMove(board: Cell[], difficulty: Difficulty): number {
  const available = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  if (available.length === 0) return -1;
  const randomChance = difficulty === "whisper" ? 0.7 : difficulty === "wail" ? 0.25 : 0;
  if (Math.random() < randomChance) return available[Math.floor(Math.random() * available.length)];

  let bestScore = -Infinity;
  let bestMove = available[0];
  for (const i of available) {
    board[i] = "O";
    const score = minimax(board, "X");
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

export default function GhostTicTacToe() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [round, setRound] = useState(1);
  const [tally, setTally] = useState({ wins: 0, losses: 0, draws: 0 });
  const [result, setResult] = useState<Result | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("wail");
  const [message, setMessage] = useState("Your move, spirit.");
  const scoreRef = useRef(0);
  const timers = useRef<number[]>([]);
  const finishedRef = useRef(false);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const tallyRef = useRef({ wins: 0, losses: 0, draws: 0 });
  const roundRef = useRef(1);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const completeRound = useCallback(
    (outcome: Result) => {
      setResult(outcome);
      let gained = 0;
      const nextTally = { ...tallyRef.current };
      if (outcome.winner === "X") {
        gained = 300;
        nextTally.wins += 1;
        setMessage("The ghost wins the round.");
        sfx.win();
      } else if (outcome.winner === "O") {
        gained = 50;
        nextTally.losses += 1;
        setMessage("The pumpkin takes it.");
        sfx.lose();
      } else {
        gained = 100;
        nextTally.draws += 1;
        setMessage("A restless draw.");
        sfx.point();
      }
      tallyRef.current = nextTally;
      setTally(nextTally);
      scoreRef.current += gained;
      api.setScore(scoreRef.current);

      const timer = window.setTimeout(() => {
        if (roundRef.current >= 3) {
          if (finishedRef.current) return;
          finishedRef.current = true;
          const won =
            tallyRef.current.wins > tallyRef.current.losses ||
            (tallyRef.current.wins === tallyRef.current.losses && tallyRef.current.wins > 0);
          endRef.current({ score: scoreRef.current, win: won });
        } else {
          roundRef.current += 1;
          setRound(roundRef.current);
          setBoard(Array(9).fill(null));
          setTurn("X");
          setResult(null);
          setMessage("New round. Your move.");
        }
      }, 1400);
      timers.current.push(timer);
    },
    [api],
  );

  const settle = useCallback(
    (nextBoard: Cell[]) => {
      const outcome = getResult(nextBoard);
      if (outcome) completeRound(outcome);
      else setTurn((t) => (t === "X" ? "O" : "X"));
    },
    [completeRound],
  );

  const play = (index: number) => {
    if (!active || board[index] !== null || result || turn !== "X" || finishedRef.current) return;
    const next = [...board];
    next[index] = "X";
    sfx.click();
    setBoard(next);
    settle(next);
  };

  // AI turn
  useEffect(() => {
    if (!active || turn !== "O" || result || !board.includes(null)) return;
    const timer = window.setTimeout(() => {
      const move = chooseAiMove([...board], difficulty);
      if (move < 0) return;
      const next = [...board];
      next[move] = "O";
      sfx.flip();
      setBoard(next);
      settle(next);
    }, 520);
    timers.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [active, turn, board, result, difficulty, settle]);

  const resetMatch = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    finishedRef.current = false;
    roundRef.current = 1;
    tallyRef.current = { wins: 0, losses: 0, draws: 0 };
    scoreRef.current = 0;
    api.setScore(0);
    setRound(1);
    setTally({ wins: 0, losses: 0, draws: 0 });
    setBoard(Array(9).fill(null));
    setTurn("X");
    setResult(null);
    setMessage("Clean slate. Your move.");
    sfx.start();
  };

  const changeDifficulty = (next: Difficulty) => {
    setDifficulty(next);
    resetMatch();
    setMessage(`${next === "whisper" ? "Whisper" : next === "wail" ? "Wail" : "Shriek"} mode. Your move.`);
  };

  return (
    <div className="game-stage flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-4 py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_10%,rgba(139,92,246,0.12),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Ghost size={14} className="text-cyan-300" />
            <span className="font-score text-sm text-white">{tally.wins}</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600">wins</span>
          </div>
          <div className="text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">Round {round}/3</p>
            <p className="text-[11px] text-slate-300">{message}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600">losses</span>
            <span className="font-score text-sm text-white">{tally.losses}</span>
            <GameGlyph glyph="pumpkin" size={14} color="#fdba74" />
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {board.map((cell, i) => {
            const highlighted = result?.line?.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => play(i)}
                disabled={!active || cell !== null || turn !== "X" || Boolean(result)}
                aria-label={`Cell ${i + 1}${cell ? `, ${cell === "X" ? "ghost" : "pumpkin"}` : ", empty"}`}
                className={`relative aspect-square rounded-xl border transition-all duration-200 ${
                  highlighted
                    ? "border-amber-300/50 bg-amber-400/10"
                    : "border-white/10 bg-[#0c0c1c]/80 hover:border-violet-400/35 hover:bg-violet-500/[0.06]"
                } ${cell === null && turn === "X" && !result ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {cell === "X" && <Ghost size={40} className="text-cyan-300" style={{ filter: "drop-shadow(0 0 12px rgba(34,211,238,0.6))" }} />}
                  {cell === "O" && <GameGlyph glyph="pumpkin" size={38} color="#fdba74" />}
                </span>
                {cell === null && !result && (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white/[0.06]">
                    {i + 1}
                  </span>
                )}
              </button>
            );
          })}
          {result && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl border border-white/15 bg-[#0a0a18]/90 px-5 py-3 text-center backdrop-blur">
                <p className="font-display text-lg text-white">
                  {result.winner === "X" ? "Ghost wins" : result.winner === "O" ? "Pumpkin wins" : "Draw"}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  {round < 3 ? "Next round incoming" : "Match complete"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {(["whisper", "wail", "shriek"] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => changeDifficulty(d)}
                className={`rounded-lg border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                  difficulty === d
                    ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                    : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={resetMatch}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-white"
          >
            <RotateCcw size={11} /> Match reset
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600">
          <Crown size={11} className="text-amber-400/60" />
          Win a round for 300 · draw 100 · loss 50. Best of three.
          <Sparkles size={10} className="text-violet-400/50" />
        </div>
      </div>
    </div>
  );
}
