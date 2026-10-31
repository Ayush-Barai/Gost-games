"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { evaluateAchievements } from "./achievements";
import { GAME_MAP } from "./games";
import { STORAGE_KEY } from "./storage";

export interface ArcadeStats {
  gamesPlayed: number;
  gamesCompleted: number;
  ghostsCaught: number;
  puzzlesCompleted: number;
  longestSurvival: number;
  totalScore: number;
  playedGames: string[];
}

export interface AchievementToast {
  key: string;
  achievementId: string;
}

export interface GameOverPayload {
  id: string;
  score: number;
  survivalSeconds?: number;
  ghostsCaught?: number;
}

interface ArcadeState {
  bestScores: Record<string, number>;
  favorites: string[];
  stats: ArcadeStats;
  achievements: string[];
  soundOn: boolean;
  hydrated: boolean;
  toasts: AchievementToast[];

  setHydrated: () => void;
  toggleSound: () => void;
  toggleFavorite: (id: string) => void;
  recordPlay: (id: string) => void;
  recordGameOver: (payload: GameOverPayload) => void;
  dismissToast: (key: string) => void;
  resetProgress: () => void;
}

const emptyStats = (): ArcadeStats => ({
  gamesPlayed: 0,
  gamesCompleted: 0,
  ghostsCaught: 0,
  puzzlesCompleted: 0,
  longestSurvival: 0,
  totalScore: 0,
  playedGames: [],
});

function withAchievements(state: ArcadeState, nextStats: ArcadeStats, bestScores: Record<string, number>, favorites: string[]) {
  const unlocked = evaluateAchievements({
    gamesPlayed: nextStats.gamesPlayed,
    playedGames: nextStats.playedGames,
    ghostsCaught: nextStats.ghostsCaught,
    puzzlesCompleted: nextStats.puzzlesCompleted,
    longestSurvival: nextStats.longestSurvival,
    bestScores,
    favorites,
    unlocked: state.achievements,
  });

  if (unlocked.length === 0) {
    return { stats: nextStats, bestScores, achievements: state.achievements };
  }

  return {
    stats: nextStats,
    bestScores,
    achievements: [...state.achievements, ...unlocked],
    toasts: [
      ...state.toasts,
      ...unlocked.map((achievementId, i) => ({
        key: `${achievementId}-${Date.now()}-${i}`,
        achievementId,
      })),
    ],
  };
}

export const useArcadeStore = create<ArcadeState>()(
  persist(
    (set, get) => ({
      bestScores: {},
      favorites: [],
      stats: emptyStats(),
      achievements: [],
      soundOn: true,
      hydrated: false,
      toasts: [],

      setHydrated: () => set({ hydrated: true }),

      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      toggleFavorite: (id) => {
        const state = get();
        const favorites = state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id];
        set(withAchievements(state, state.stats, state.bestScores, favorites));
      },

      recordPlay: (id) => {
        const state = get();
        const playedGames = state.stats.playedGames.includes(id)
          ? state.stats.playedGames
          : [...state.stats.playedGames, id];
        const stats = {
          ...state.stats,
          gamesPlayed: state.stats.gamesPlayed + 1,
          playedGames,
        };
        set(withAchievements(state, stats, state.bestScores, state.favorites));
      },

      recordGameOver: ({ id, score, survivalSeconds = 0, ghostsCaught = 0 }) => {
        const state = get();
        const meta = GAME_MAP[id];
        const safeScore = Math.max(0, Math.round(score));
        const bestScores = {
          ...state.bestScores,
          [id]: Math.max(state.bestScores[id] ?? 0, safeScore),
        };
        const stats: ArcadeStats = {
          ...state.stats,
          gamesCompleted: state.stats.gamesCompleted + 1,
          puzzlesCompleted:
            state.stats.puzzlesCompleted + (meta?.category === "Puzzle" ? 1 : 0),
          ghostsCaught: state.stats.ghostsCaught + Math.max(0, ghostsCaught),
          longestSurvival: Math.max(
            state.stats.longestSurvival,
            Math.round(survivalSeconds),
          ),
          totalScore: state.stats.totalScore + safeScore,
        };
        set(withAchievements(state, stats, bestScores, state.favorites));
      },

      dismissToast: (key) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),

      resetProgress: () =>
        set({
          bestScores: {},
          favorites: [],
          stats: emptyStats(),
          achievements: [],
          toasts: [],
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        bestScores: state.bestScores,
        favorites: state.favorites,
        stats: state.stats,
        achievements: state.achievements,
        soundOn: state.soundOn,
      }),
    },
  ),
);

/** Convenience selectors, kept outside components for stable references. */
export const selectBest = (id: string) => (s: ArcadeState) => s.bestScores[id] ?? 0;
