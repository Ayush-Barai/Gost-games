"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { GAME_MAP } from "@/lib/games";
import { useUiStore } from "@/lib/uiStore";
import { GameShell } from "./GameShell";
import { GAME_COMPONENTS } from "@/games/registry";

export function GameModal() {
  const activeId = useUiStore((s) => s.activeGameId);
  const closeStore = useUiStore((s) => s.closeGame);
  const [displayId, setDisplayId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    if (activeId) {
      closingRef.current = false;
      setDisplayId(activeId);
    }
  }, [activeId]);

  const finishClose = useCallback(() => {
    setDisplayId(null);
    closingRef.current = false;
    closeStore();
  }, [closeStore]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !panelRef.current) {
      finishClose();
      return;
    }
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.22, ease: "power2.in" });
    gsap.to(panelRef.current, {
      opacity: 0,
      y: 22,
      scale: 0.985,
      duration: 0.26,
      ease: "power2.in",
      onComplete: finishClose,
    });
  }, [finishClose]);

  useLayoutEffect(() => {
    if (!displayId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([backdropRef.current, panelRef.current], { opacity: 1 });
        return;
      }
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 30, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" },
      );
    });
    panelRef.current?.focus();
    return () => ctx.revert();
  }, [displayId]);

  useEffect(() => {
    if (!displayId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [displayId]);

  if (!displayId) return null;
  const game = GAME_MAP[displayId];
  const GameComponent = GAME_COMPONENTS[displayId];
  if (!game || !GameComponent) return null;
  const index = Object.keys(GAME_MAP).indexOf(displayId);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`${game.title} game`}>
      <div ref={backdropRef} className="absolute inset-0 bg-[#04040a]/88 backdrop-blur-2xl" onClick={(e) => e.stopPropagation()} />
      <div className="absolute inset-0 flex items-stretch justify-center p-0 sm:p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="relative flex h-[100dvh] w-full max-w-[1400px] flex-col overflow-hidden border-white/10 bg-[#07070f] outline-none sm:h-full sm:rounded-2xl sm:border sm:shadow-[0_50px_140px_-40px_rgba(0,0,0,1)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
          <GameShell
            key={displayId}
            game={game}
            index={index}
            GameComponent={GameComponent}
            onExit={requestClose}
          />
        </div>
      </div>
    </div>
  );
}
