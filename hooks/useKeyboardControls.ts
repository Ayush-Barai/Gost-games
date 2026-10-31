"use client";

import { useEffect, useRef } from "react";

/**
 * requestAnimationFrame loop with delta time, auto cleanup, and an active flag
 * tied to the game's playing state.
 */
export function useRafLoop(
  callback: (dt: number, now: number) => void,
  active: boolean,
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      cbRef.current(dt, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Returns a ref to the set of keys currently held down. */
export function useKeys(active: boolean) {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
      }
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      keys.current.clear();
    };
  }, [active]);

  return keys;
}

/** Fires on a fresh key press (not on OS key repeat). */
export function useKeyPress(
  active: boolean,
  onPress: (key: string) => void,
  keysToWatch = [" ", "spacebar", "arrowup", "enter"],
) {
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!keysToWatch.includes(key)) return;
      e.preventDefault();
      if (e.repeat) return;
      pressRef.current(key);
    };
    window.addEventListener("keydown", handler, { passive: false });
    return () => window.removeEventListener("keydown", handler);
    // keysToWatch is intentionally read once per activation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
