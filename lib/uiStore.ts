"use client";

import { create } from "zustand";
import type { Category } from "./games";

export type ArcadeFilter = "All Games" | Category | "Favorites";

interface UiState {
  activeGameId: string | null;
  filter: ArcadeFilter;
  openGame: (id: string) => void;
  closeGame: () => void;
  setFilter: (filter: ArcadeFilter) => void;
  showFavorites: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeGameId: null,
  filter: "All Games",
  openGame: (id) => set({ activeGameId: id }),
  closeGame: () => set({ activeGameId: null }),
  setFilter: (filter) => set({ filter }),
  showFavorites: () => {
    set({ filter: "Favorites" });
    if (typeof document !== "undefined") {
      document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });
    }
  },
}));
