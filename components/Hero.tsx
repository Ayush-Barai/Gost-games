"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import {
  ArrowDown,
  ArrowRight,
  Ghost,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useUiStore } from "@/lib/uiStore";
import { sfx } from "@/lib/audio";

const Ghost3D = dynamic(() => import("./Ghost3D"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 -m-16 rounded-full bg-violet-600/20 blur-3xl" />
        <Ghost size={120} className="relative animate-drift text-violet-300/70" strokeWidth={0.8} />
      </div>
    </div>
  ),
});

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const openGame = useUiStore((s) => s.openGame);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 18, opacity: 0, duration: 0.7 }, 0.1)
        .from(
          ".hero-word",
          { yPercent: 110, opacity: 0, rotate: 4, duration: 1, stagger: 0.09 },
          0.2,
        )
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.8 }, 0.7)
        .from(".hero-copy", { y: 20, opacity: 0, duration: 0.8 }, 0.82)
        .from(".hero-actions > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.95)
        .from(".hero-chip", { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 }, 1.12)
        .from(".hero-stage", { opacity: 0, scale: 0.92, duration: 1.4, ease: "power2.out" }, 0.35)
        .from(".hero-hud", { opacity: 0, x: 18, duration: 0.7, stagger: 0.12 }, 1.2)
        .from(".hero-scroll", { opacity: 0, duration: 0.6 }, 1.5);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={root}
      className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 sm:pt-32"
    >
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 bottom-0 h-[46%] grid-floor opacity-60" />
        <div className="absolute left-[8%] top-[18%] h-[420px] w-[420px] rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="absolute right-[4%] top-[22%] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
        <div className="absolute left-[12%] top-[30%] h-1.5 w-1.5 rounded-full bg-violet-300/70 shadow-[0_0_12px_3px_rgba(139,92,246,0.4)]" />
        <div className="absolute right-[18%] top-[20%] h-1 w-1 rounded-full bg-cyan-300/80 shadow-[0_0_12px_3px_rgba(34,211,238,0.5)]" />
        <div className="absolute left-[45%] top-[12%] h-1 w-1 rounded-full bg-pink-300/60" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
        <div className="relative z-10 max-w-2xl">
          <div className="hero-eyebrow eyebrow">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pink-400" />
            </span>
            Open after midnight · Est. 1893
          </div>

          <h1 className="mt-5 font-display font-bold uppercase leading-[0.92] tracking-[-0.01em]">
            <span className="block overflow-hidden">
              <span className="hero-word inline-block text-[clamp(2.7rem,6.2vw,5.6rem)] text-white">
                The Ghost
              </span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="hero-word gradient-text text-glow inline-block text-[clamp(2.7rem,6.2vw,5.6rem)]">
                Games Arcade
              </span>
            </span>
          </h1>

          <p className="hero-sub mt-5 font-display text-lg text-cyan-200/90 sm:text-xl">
            20 Mini Games. Infinite Haunted Fun.
          </p>

          <p className="hero-copy mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
            Step into a mysterious arcade filled with cursed puzzles, haunted
            adventures, spooky challenges, and mischievous ghosts.
          </p>

          <div className="hero-actions mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.start();
                openGame("ghost-catcher");
              }}
              className="btn btn-primary px-6 py-3.5 text-[13px] tracking-[0.08em]"
            >
              <Play size={15} fill="currentColor" />
              ENTER THE ARCADE
              <ArrowRight size={15} />
            </button>
            <a href="#games" className="btn btn-secondary px-6 py-3.5 text-[13px] tracking-[0.08em]">
              <Sparkles size={15} />
              EXPLORE GAMES
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            {[
              { icon: ShieldCheck, label: "No login" },
              { icon: Zap, label: "No downloads" },
              { icon: Ghost, label: "100% free" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="hero-chip flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                <Icon size={13} className="text-violet-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 3D stage */}
        <div className="hero-stage relative mx-auto w-full max-w-[560px]">
          <div className="relative aspect-square w-full">
            <div className="absolute inset-[8%] rounded-full bg-violet-600/10 blur-2xl" />
            <div className="absolute inset-[16%] rounded-full border border-violet-400/10" />
            <div className="absolute inset-[7%] rounded-full border border-dashed border-cyan-300/10" />
            <div className="absolute inset-0">
              <Ghost3D />
            </div>

            {/* HUD card top */}
            <div className="hero-hud absolute left-0 top-[8%] rounded-xl border border-white/10 bg-[#0a0a18]/70 px-3.5 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-200">
                  Spirit online
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[10px] tracking-widest text-slate-500">
                SPECTRE // 013
              </p>
            </div>

            <div className="hero-hud absolute right-0 top-[20%] rounded-xl border border-white/10 bg-[#0a0a18]/70 px-3.5 py-2.5 text-right backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Haunt level
              </p>
              <p className="font-display text-lg text-violet-200">MAX</p>
              <div className="mt-1 flex justify-end gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-1 w-3 rounded-full bg-violet-400/70" />
                ))}
              </div>
            </div>

            {/* HUD bottom */}
            <div className="hero-hud absolute inset-x-3 bottom-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a0a18]/75 px-4 py-3 backdrop-blur-md sm:inset-x-6">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-cyan-300/80">
                  Now haunting
                </p>
                <p className="mt-1 text-[13px] font-semibold text-white">
                  20 games · 1 restless arcade
                </p>
              </div>
              <div className="flex -space-x-2">
                {["#8B5CF6", "#22D3EE", "#F472B6", "#FBBF24"].map((color, i) => (
                  <span
                    key={color}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#080812] text-[10px]"
                    style={{ background: `${color}22`, color }}
                  >
                    <Ghost size={12} />
                  </span>
                ))}
              </div>
            </div>

            {/* corner brackets */}
            <span className="absolute left-2 top-1/3 h-5 w-5 border-l border-t border-violet-400/30" />
            <span className="absolute bottom-1/3 right-2 h-5 w-5 border-b border-r border-cyan-400/30" />
          </div>
        </div>
      </div>

      <div className="hero-scroll pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center sm:flex">
        <div className="flex flex-col items-center gap-2 text-slate-600">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Descend</span>
          <ArrowDown size={14} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}
