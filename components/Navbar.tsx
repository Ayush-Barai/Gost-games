"use client";

import { useEffect, useState } from "react";
import { Ghost, Heart, Menu, Play, Volume2, VolumeX, X } from "lucide-react";
import { sfx } from "@/lib/audio";
import { useArcadeStore } from "@/lib/store";
import { useUiStore } from "@/lib/uiStore";

function SoundToggle({ compact = false }: { compact?: boolean }) {
  const soundOn = useArcadeStore((s) => s.soundOn);
  const toggleSound = useArcadeStore((s) => s.toggleSound);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !soundOn;
        toggleSound();
        if (next) window.setTimeout(() => sfx.click(), 10);
      }}
      className="icon-btn"
      aria-label={soundOn ? "Mute sound" : "Enable sound"}
      title={soundOn ? "Mute sound" : "Enable sound"}
    >
      {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
      {compact && <span className="sr-only">Sound</span>}
    </button>
  );
}

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "Explore Games", href: "#games" },
  { label: "How to Play", href: "#how-to" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openGame = useUiStore((s) => s.openGame);
  const showFavorites = useUiStore((s) => s.showFavorites);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-[#080812]/85 shadow-[0_16px_50px_-30px_rgba(0,0,0,1)] backdrop-blur-2xl"
          : "border-b border-transparent bg-gradient-to-b from-[#080812]/80 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="group flex items-center gap-3" aria-label="Ghost Games Arcade home">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/35 bg-gradient-to-br from-violet-500/30 to-cyan-400/10 shadow-[0_0_24px_-8px_rgba(139,92,246,0.9)]">
            <Ghost size={22} className="text-violet-200 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[15px] font-bold tracking-[0.16em] text-white">
              GHOST GAMES
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.42em] text-violet-300/80">
              Arcade
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              showFavorites();
            }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Heart size={14} className="text-pink-400/80" />
            Favorites
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SoundToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.start();
              openGame("ghost-catcher");
            }}
            className="btn btn-primary hidden py-2.5 text-[12px] sm:inline-flex"
          >
            <Play size={14} fill="currentColor" />
            Play Now
          </button>
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-white/5 bg-[#080812]/97 backdrop-blur-2xl transition-[max-height,opacity] duration-300 lg:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              showFavorites();
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Heart size={15} className="text-pink-400" /> Favorites
          </button>
          <div className="mt-2 flex items-center gap-2">
            <SoundToggle />
            <button
              type="button"
              onClick={() => {
                sfx.start();
                setMenuOpen(false);
                openGame("ghost-catcher");
              }}
              className="btn btn-primary flex-1"
            >
              <Play size={14} fill="currentColor" /> Play Now
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
