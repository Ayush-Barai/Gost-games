"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Ghost as GhostIcon } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { BombSprite, GhostSprite, GoldenGhostSprite } from "./shared/GhostSprite";
import { sfx } from "@/lib/audio";

type HoleType = "ghost" | "gold" | "bomb" | null;
interface Hole {
  type: HoleType;
  until: number;
}

const EMPTY: Hole = { type: null, until: 0 };

export default function WhackAGhost() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [holes, setHoles] = useState<Hole[]>(Array(6).fill(EMPTY));
  const holesRef = useRef<Hole[]>(Array(6).fill(EMPTY));
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [caught, setCaught] = useState(0);
  const caughtRef = useRef(0);
  const [popups, setPopups] = useState<Record<number, { text: string; color: string; key: number }>>({});
  const comboTimeout = useRef<number | null>(null);
  const popupTimers = useRef<number[]>([]);
  const apiRef = useRef(api);
  apiRef.current = api;

  const publish = useCallback((next: Hole[]) => {
    holesRef.current = next;
    setHoles(next);
  }, []);

  useEffect(() => {
    return () => {
      if (comboTimeout.current) window.clearTimeout(comboTimeout.current);
      popupTimers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const started = performance.now();
    let spawnIn = 350;
    let last = performance.now();
    const tick = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - started) / 1000;
      let changed = false;
      let next = holesRef.current.map((hole) => {
        if (hole.type && now > hole.until) {
          changed = true;
          return EMPTY;
        }
        return hole;
      });

      spawnIn -= now - last;
      last = now;
      if (spawnIn <= 0) {
        spawnIn = Math.max(360, 720 - elapsed * 7);
        const free = next.map((h, i) => (h.type === null ? i : -1)).filter((i) => i >= 0);
        if (free.length > 0) {
          const picks = Math.random() < 0.22 && free.length > 2 ? 2 : 1;
          for (let p = 0; p < picks; p++) {
            const pool = next.map((h, i) => (h.type === null ? i : -1)).filter((i) => i >= 0);
            if (!pool.length) break;
            const index = pool[Math.floor(Math.random() * pool.length)];
            const roll = Math.random();
            const type: HoleType = roll < 0.13 ? "bomb" : roll < 0.24 ? "gold" : "ghost";
            const duration = type === "gold" ? 900 : type === "bomb" ? 1150 : Math.max(620, 1050 - elapsed * 5);
            next = next.map((h, i) => (i === index ? { type, until: now + duration } : h));
            changed = true;
          }
        }
      }
      if (changed) publish(next);
    }, 90);
    return () => window.clearInterval(tick);
  }, [active, publish]);

  const showPopup = (index: number, text: string, color: string) => {
    const key = Date.now() + index;
    setPopups((prev) => ({ ...prev, [index]: { text, color, key } }));
    const timer = window.setTimeout(() => {
      setPopups((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }, 620);
    popupTimers.current.push(timer);
  };

  const hit = (index: number) => {
    if (!active) return;
    const hole = holesRef.current[index];
    if (!hole.type) return;
    if (performance.now() > hole.until) return;

    const next = holesRef.current.map((h, i) => (i === index ? EMPTY : h));
    publish(next);

    if (hole.type === "bomb") {
      sfx.bomb();
      comboRef.current = 0;
      setCombo(0);
      api.addScore(-20);
      showPopup(index, "-20", "#fb7185");
      return;
    }

    comboRef.current += 1;
    setCombo(comboRef.current);
    if (comboTimeout.current) window.clearTimeout(comboTimeout.current);
    comboTimeout.current = window.setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, 2600);

    const points = hole.type === "gold" ? 30 : 10 + Math.min(20, (comboRef.current - 1) * 2);
    api.addScore(points);
    caughtRef.current += 1;
    setCaught(caughtRef.current);
    api.reportGhosts(caughtRef.current);
    if (hole.type === "gold") sfx.golden();
    else sfx.catch();
    showPopup(index, `+${points}`, hole.type === "gold" ? "#fbbf24" : "#67e8f9");
  };

  return (
    <div className="game-stage relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-3 py-4 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(52,211,153,0.08),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur">
            <GhostIcon size={13} className="text-emerald-300" />
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Caught</span>
            <span className="font-score text-sm text-white">{caught}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-all ${
              combo > 1
                ? "border-amber-300/35 bg-amber-400/10 text-amber-200"
                : "border-white/10 bg-black/30 text-slate-500"
            }`}
          >
            <Flame size={13} className={combo > 1 ? "text-amber-300" : "text-slate-600"} />
            <span className="font-mono text-[9px] uppercase tracking-[0.16em]">Combo</span>
            <span className="font-score text-sm">{combo}×</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {holes.map((hole, index) => (
            <button
              key={index}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                hit(index);
              }}
              aria-label={`Grave ${index + 1}${hole.type ? `, ${hole.type}` : ", empty"}`}
              className="group relative aspect-[1/1.05] select-none overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#121027] to-[#08080f] transition-colors hover:border-violet-400/25"
              style={{ cursor: "crosshair" }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />

              {/* tombstone */}
              <div className="absolute bottom-0 left-1/2 h-[46%] w-[64%] -translate-x-1/2 rounded-t-[45%] border border-white/[0.08] bg-gradient-to-b from-[#191830] to-[#0b0b16]">
                <span className="absolute left-1/2 top-[28%] -translate-x-1/2 font-display text-[8px] tracking-[0.2em] text-slate-600">
                  RIP
                </span>
              </div>

              {/* pit */}
              <div className="absolute bottom-[16%] left-1/2 h-[22%] w-[74%] -translate-x-1/2 rounded-[50%] border border-violet-400/10 bg-[#04040a] shadow-[inset_0_8px_16px_rgba(0,0,0,0.9)]" />

              {hole.type && (
                <div
                  key={`${index}-${hole.until}`}
                  className="absolute bottom-[20%] left-1/2 z-10 -translate-x-1/2"
                  style={{ animation: "whack-rise 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
                >
                  {hole.type === "bomb" ? (
                    <BombSprite size={50} />
                  ) : hole.type === "gold" ? (
                    <GoldenGhostSprite size={52} />
                  ) : (
                    <GhostSprite color={combo > 2 ? "#6ee7b7" : "#a78bfa"} size={52} />
                  )}
                </div>
              )}

              {popups[index] && (
                <span
                  key={popups[index].key}
                  className="pointer-events-none absolute left-1/2 top-[12%] z-20 -translate-x-1/2 font-score text-sm font-bold"
                  style={{
                    color: popups[index].color,
                    textShadow: `0 0 14px ${popups[index].color}`,
                    animation: "score-float 0.6s ease-out forwards",
                  }}
                >
                  {popups[index].text}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
          Bop the ghosts · avoid bombs · chain hits for combos
        </p>
      </div>
    </div>
  );
}
