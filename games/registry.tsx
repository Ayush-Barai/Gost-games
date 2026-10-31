"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Ghost } from "lucide-react";

function GameLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#07070f]">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
        <span className="absolute inset-2 rounded-full border border-violet-400/30" />
        <Ghost size={28} className="relative animate-drift text-violet-300" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
        Summoning game…
      </p>
    </div>
  );
}

const load = () => dynamic(() => import("@/games/GhostCatcher"), { ssr: false, loading: GameLoader });

export const GAME_COMPONENTS: Record<string, ComponentType> = {
  "ghost-catcher": load(),
  "memory-match": dynamic(() => import("@/games/MemoryMatch"), { ssr: false, loading: GameLoader }),
  "haunted-maze": dynamic(() => import("@/games/HauntedMaze"), { ssr: false, loading: GameLoader }),
  "ghost-jump": dynamic(() => import("@/games/GhostJump"), { ssr: false, loading: GameLoader }),
  "pumpkin-dodge": dynamic(() => import("@/games/PumpkinDodge"), { ssr: false, loading: GameLoader }),
  "ghost-flappy": dynamic(() => import("@/games/GhostFlappy"), { ssr: false, loading: GameLoader }),
  "word-scramble": dynamic(() => import("@/games/WordScramble"), { ssr: false, loading: GameLoader }),
  "tic-tac-toe": dynamic(() => import("@/games/GhostTicTacToe"), { ssr: false, loading: GameLoader }),
  "whack-a-ghost": dynamic(() => import("@/games/WhackAGhost"), { ssr: false, loading: GameLoader }),
  "soul-collector": dynamic(() => import("@/games/SoulCollector"), { ssr: false, loading: GameLoader }),
  "ghost-runner": dynamic(() => import("@/games/GhostRunner"), { ssr: false, loading: GameLoader }),
  "number-puzzle": dynamic(() => import("@/games/NumberPuzzle"), { ssr: false, loading: GameLoader }),
  "ghost-detective": dynamic(() => import("@/games/GhostDetective"), { ssr: false, loading: GameLoader }),
  "reaction-test": dynamic(() => import("@/games/ReactionTest"), { ssr: false, loading: GameLoader }),
  "haunted-pong": dynamic(() => import("@/games/HauntedPong"), { ssr: false, loading: GameLoader }),
  "ghost-shooter": dynamic(() => import("@/games/GhostShooter"), { ssr: false, loading: GameLoader }),
  "memory-quiz": dynamic(() => import("@/games/MemoryQuiz"), { ssr: false, loading: GameLoader }),
  "ghost-tower": dynamic(() => import("@/games/GhostTower"), { ssr: false, loading: GameLoader }),
  "treasure-hunt": dynamic(() => import("@/games/TreasureHunt"), { ssr: false, loading: GameLoader }),
  "last-ghost": dynamic(() => import("@/games/TheLastGhost"), { ssr: false, loading: GameLoader }),
};
