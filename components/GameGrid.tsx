"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { Heart, SearchX } from "lucide-react";
import { CATEGORIES, GAMES, type Category } from "@/lib/games";
import { useArcadeStore } from "@/lib/store";
import { useUiStore, type ArcadeFilter } from "@/lib/uiStore";
import { GameCard } from "./GameCard";
import { SectionHeading } from "./SectionHeading";
import { sfx } from "@/lib/audio";

const CATEGORY_DOT: Record<string, string> = {
  "All Games": "#e2e8f0",
  Arcade: "#8B5CF6",
  Puzzle: "#F472B6",
  Adventure: "#22D3EE",
  Survival: "#F97316",
  Favorites: "#F472B6",
};

export function GameGrid() {
  const filter = useUiStore((s) => s.filter);
  const setFilter = useUiStore((s) => s.setFilter);
  const favorites = useArcadeStore((s) => s.favorites);
  const gridRef = useRef<HTMLDivElement>(null);

  const games = useMemo(() => {
    if (filter === "Favorites") return GAMES.filter((g) => favorites.includes(g.id));
    if (filter === "All Games") return GAMES;
    return GAMES.filter((g) => g.category === (filter as Category));
  }, [filter, favorites]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { "All Games": GAMES.length, Favorites: favorites.length };
    for (const game of GAMES) {
      map[game.category] = (map[game.category] ?? 0) + 1;
    }
    return map;
  }, [favorites.length]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = el.querySelectorAll("[data-game-card]");
    if (!cards.length) return;
    const tween = gsap.fromTo(
      cards,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.035, ease: "power2.out", overwrite: true },
    );
    return () => {
      tween.kill();
    };
  }, [filter, favorites.length]);

  return (
    <section id="games" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading
        eyebrow="The collection"
        title={
          <>
            Choose your <span className="gradient-text">haunting</span>
          </>
        }
        description="Twenty handcrafted games, from twitchy arcade reflexes to slow-burn puzzles. Every spirit gets its own rules."
        action={
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All playable offline
          </div>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter games">
        {CATEGORIES.map((category) => {
          const active = filter === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                sfx.click();
                setFilter(category as ArcadeFilter);
              }}
              className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-all duration-200 ${
                active
                  ? "border-violet-400/50 bg-violet-500/15 text-white shadow-[0_0_24px_-12px_rgba(139,92,246,0.9)]"
                  : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:bg-white/[0.05] hover:text-slate-200"
              }`}
            >
              {category === "Favorites" && <Heart size={12} className="text-pink-400" />}
              <span
                className="h-1.5 w-1.5 rounded-full transition-opacity"
                style={{
                  background: CATEGORY_DOT[category],
                  opacity: active ? 1 : 0.45,
                }}
              />
              {category}
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] ${
                  active ? "bg-white/10 text-violet-200" : "bg-white/[0.04] text-slate-600"
                }`}
              >
                {counts[category] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={gridRef}
        className="mt-7 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
      >
        {games.map((game) => {
          const index = GAMES.findIndex((g) => g.id === game.id);
          return (
            <div key={game.id} data-game-card className="h-full">
              <GameCard game={game} index={index} />
            </div>
          );
        })}
      </div>

      {games.length === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-pink-400/20 bg-pink-500/10 text-pink-300">
            {filter === "Favorites" ? <Heart size={22} /> : <SearchX size={22} />}
          </span>
          <h3 className="mt-4 font-display text-lg text-white">
            {filter === "Favorites" ? "No favorites yet" : "No games in this category"}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-slate-500">
            {filter === "Favorites"
              ? "Tap the heart on any game card to keep it close. The spirits will remember."
              : "Try another category — the arcade has more doors than it seems."}
          </p>
          <button type="button" onClick={() => setFilter("All Games")} className="btn btn-secondary mt-5">
            Show all 20 games
          </button>
        </div>
      )}
    </section>
  );
}
