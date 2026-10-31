"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowUpRight, Heart, Play, Star, Trophy } from "lucide-react";
import { GameArt } from "./GameArt";
import type { GameMeta } from "@/lib/games";
import { useArcadeStore, selectBest } from "@/lib/store";
import { useUiStore } from "@/lib/uiStore";
import { sfx } from "@/lib/audio";

const DIFFICULTY_STYLE: Record<GameMeta["difficulty"], string> = {
  Easy: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Hard: "text-rose-300 bg-rose-400/10 border-rose-400/20",
};

export function GameCard({
  game,
  index,
  featured = false,
}: {
  game: GameMeta;
  index: number;
  featured?: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const openGame = useUiStore((s) => s.openGame);
  const best = useArcadeStore(selectBest(game.id));
  const favorite = useArcadeStore((s) => s.favorites.includes(game.id));
  const toggleFavorite = useArcadeStore((s) => s.toggleFavorite);
  const [a, b] = game.accent;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    gsap.set(el, { transformPerspective: 1100, transformStyle: "preserve-3d" });
    const rotX = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const rotY = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    const lift = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    const move = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotY(px * 9);
      rotX(py * -8);
    };
    const enter = () => lift(-6);
    const leave = () => {
      rotX(0);
      rotY(0);
      lift(0);
    };

    el.addEventListener("mousemove", move);
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
      gsap.killTweensOf(el);
    };
  }, []);

  const handleOpen = () => {
    sfx.click();
    openGame(game.id);
  };

  return (
    <article
      ref={cardRef}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c1c]/80 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] transition-colors duration-300 hover:border-white/20"
      style={{ willChange: "transform" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${a}22, transparent 70%)`,
        }}
      />

      <div className="relative overflow-hidden">
        <button
          type="button"
          onClick={handleOpen}
          className="block w-full text-left"
          aria-label={`Play ${game.title}`}
        >
          <GameArt
            game={game}
            index={index}
            compact={!featured}
            className={`w-full transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
              featured ? "aspect-[16/9]" : "aspect-[4/3]"
            }`}
          />
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className="rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.14em] uppercase backdrop-blur-md"
            style={{
              borderColor: `${b}44`,
              background: `${a}22`,
              color: "#e9e7ff",
            }}
          >
            {game.category}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sfx.click();
              toggleFavorite(game.id);
            }}
            aria-label={favorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
            aria-pressed={favorite}
            className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 ${
              favorite
                ? "border-pink-400/50 bg-pink-500/20 text-pink-300"
                : "border-white/15 bg-black/30 text-white/60 hover:border-pink-400/40 hover:text-pink-300"
            }`}
          >
            <Heart size={14} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>

        {featured && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-amber-300/30 bg-black/40 px-2 py-1 text-[10px] font-medium tracking-wider text-amber-200 backdrop-blur-md">
            <Star size={10} fill="currentColor" /> FEATURED
          </div>
        )}
      </div>

      <div className={`relative flex flex-1 flex-col ${featured ? "p-5" : "p-4"}`}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-display font-semibold leading-tight text-white ${
              featured ? "text-xl" : "text-[15px]"
            }`}
          >
            {game.title}
          </h3>
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${DIFFICULTY_STYLE[game.difficulty]}`}
          >
            {game.difficulty}
          </span>
        </div>

        <p
          className={`mt-1.5 text-[12px] leading-relaxed text-slate-400 ${
            featured ? "line-clamp-2" : "line-clamp-2"
          }`}
        >
          {featured ? game.description : game.tagline}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <Trophy size={11} className="text-slate-500" />
            <span className="uppercase tracking-wider">Best</span>
            <span className="font-semibold text-slate-200">
              {best > 0 ? best.toLocaleString() : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-200 hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white"
            style={{ boxShadow: "0 4px 18px -12px transparent" }}
          >
            <Play size={11} fill="currentColor" />
            Play Now
            <ArrowUpRight size={11} className="opacity-60 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${b}, transparent)` }}
      />
    </article>
  );
}
