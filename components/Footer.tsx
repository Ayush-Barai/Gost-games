"use client";

import { Ghost, ArrowUp, RotateCcw, Heart } from "lucide-react";
import { useArcadeStore } from "@/lib/store";
import { sfx } from "@/lib/audio";

export function Footer() {
  const stats = useArcadeStore((s) => s.stats);
  const achievements = useArcadeStore((s) => s.achievements);
  const resetProgress = useArcadeStore((s) => s.resetProgress);

  return (
    <footer id="about" className="relative mt-10 border-t border-white/[0.07] bg-[#060610]/80">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
              <Ghost size={21} />
            </span>
            <span>
              <span className="block font-display text-sm font-bold tracking-[0.16em] text-white">
                GHOST GAMES ARCADE
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.34em] text-violet-300/70">
                Enter the afterlife
              </span>
            </span>
          </a>
          <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-slate-500">
            Twenty cursed little games. One haunted arcade. No login. No
            downloads. Just pure spooky fun — built to run entirely in your
            browser.
          </p>
          <div className="mt-5 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
            <span>{stats.gamesPlayed} plays</span>
            <span className="h-3 w-px bg-white/10" />
            <span>{achievements.length}/7 trophies</span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1 text-pink-400/70">
              <Heart size={9} fill="currentColor" /> local saves
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">The arcade</h3>
          <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
            <li><a className="transition-colors hover:text-violet-300" href="#top">Home</a></li>
            <li><a className="transition-colors hover:text-violet-300" href="#games">Explore Games</a></li>
            <li><a className="transition-colors hover:text-violet-300" href="#how-to">How to Play</a></li>
            <li><a className="transition-colors hover:text-violet-300" href="#about">About</a></li>
            <li>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Erase all high scores, favorites and achievements from this browser?")) {
                    resetProgress();
                    sfx.click();
                  }
                }}
                className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-rose-300"
              >
                <RotateCcw size={11} /> Reset progress
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">The crypt</h3>
          <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
            <li>
              <a href="#achievements" className="transition-colors hover:text-violet-300">
                Achievements
              </a>
            </li>
            <li>
              <a href="#how-to" className="transition-colors hover:text-violet-300">
                Scoring &amp; controls
              </a>
            </li>
            <li>
              <a href="#credits" className="transition-colors hover:text-violet-300">Credits</a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-violet-300"
              >
                <ArrowUp size={11} /> Back to the gate
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div id="credits" className="mx-auto max-w-7xl border-t border-white/[0.06] px-5 py-6 sm:px-8">
        <div className="flex flex-col justify-between gap-2 text-[11px] text-slate-600 sm:flex-row">
          <p>© 2026 Ghost Games Arcade. All spirits reserved.</p>
          <p>
            Built with Next.js, Three.js, React Three Fiber, GSAP &amp; Tailwind CSS.
            Art generated in code · Audio synthesized in your browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
