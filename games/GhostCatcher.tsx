"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameApi } from "@/components/GameShell";
import { BombSprite, GhostSprite, GoldenGhostSprite } from "./shared/GhostSprite";
import { sfx } from "@/lib/audio";

type SpookType = "normal" | "gold" | "bomb";

interface Spook {
  id: number;
  x: number;
  y: number;
  type: SpookType;
  born: number;
  life: number;
  scale: number;
}

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export default function GhostCatcher() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [spooks, setSpooks] = useState<Spook[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [caught, setCaught] = useState(0);
  const idRef = useRef(0);
  const caughtRef = useRef(0);
  const startedRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const spawn = useCallback(() => {
    const now = performance.now();
    if (!startedRef.current) startedRef.current = now;
    const elapsed = (now - startedRef.current) / 1000;
    setSpooks((prev) => {
      const alive = prev.filter((g) => now - g.born < g.life);
      if (alive.length >= 7) return alive;
      const roll = Math.random();
      const type: SpookType = roll < 0.1 ? "gold" : roll < 0.3 ? "bomb" : "normal";
      const life = type === "gold" ? 1500 : type === "bomb" ? 1400 : 1750 - Math.min(500, elapsed * 18);
      return [
        ...alive,
        {
          id: ++idRef.current,
          x: 9 + Math.random() * 82,
          y: 20 + Math.random() * 62,
          type,
          born: now,
          life,
          scale: type === "gold" ? 1.12 : 0.9 + Math.random() * 0.25,
        },
      ];
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    startedRef.current = 0;
    const spawnTimer = window.setInterval(spawn, 560);
    const cleanTimer = window.setInterval(() => {
      const now = performance.now();
      setSpooks((prev) => prev.filter((g) => now - g.born < g.life));
    }, 250);
    spawn();
    const first = window.setTimeout(spawn, 150);
    return () => {
      window.clearInterval(spawnTimer);
      window.clearInterval(cleanTimer);
      window.clearTimeout(first);
    };
  }, [active, spawn]);

  const addFloater = (x: number, y: number, text: string, color: string) => {
    const id = ++idRef.current;
    setFloaters((prev) => [...prev.slice(-6), { id, x, y, text, color }]);
    const timer = window.setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 850);
    timersRef.current.push(timer);
  };

  const catchGhost = (spook: Spook) => {
    if (!active) return;
    const now = performance.now();
    if (now - spook.born > spook.life + 120) {
      setSpooks((prev) => prev.filter((g) => g.id !== spook.id));
      return;
    }
    setSpooks((prev) => prev.filter((g) => g.id !== spook.id));

    if (spook.type === "bomb") {
      sfx.bomb();
      api.addScore(-15);
      addFloater(spook.x, spook.y, "-15", "#fb7185");
      return;
    }

    const points = spook.type === "gold" ? 30 : 10;
    api.addScore(points);
    caughtRef.current += 1;
    setCaught(caughtRef.current);
    api.reportGhosts(caughtRef.current);
    if (spook.type === "gold") sfx.golden();
    else sfx.catch();
    addFloater(spook.x, spook.y, `+${points}`, spook.type === "gold" ? "#fbbf24" : "#67e8f9");
  };

  return (
    <div className="game-stage h-full w-full select-none overflow-hidden bg-[#06060f]">
      {/* haunted graveyard backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(76,29,149,0.35),transparent_65%)]" />
        <div className="absolute left-[18%] top-[12%] h-24 w-24 rounded-full bg-violet-300/10 blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-[#04040a] via-[#0a0a18]/80 to-transparent" />
        <svg
          viewBox="0 0 800 260"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-[30%] w-full opacity-60"
        >
          <path d="M0 240 C80 210 140 238 220 224 S360 196 440 220 S600 206 800 228 L800 260 L0 260 Z" fill="#080812" />
          {[80, 150, 260, 380, 470, 590, 700].map((x, i) => (
            <g key={x} transform={`translate(${x},${196 + (i % 3) * 10})`} fill="#0c0c1c" stroke="#8b5cf6" strokeOpacity="0.22">
              <path d="M-14 26 V0 A14 14 0 0 1 14 0 V26 Z" />
              <path d="M0 4 v8 M-6 8 h12" stroke="#22d3ee" strokeOpacity="0.25" fill="none" />
            </g>
          ))}
        </svg>
        <div className="absolute left-1/2 top-[12%] h-40 w-40 -translate-x-1/2 rounded-full border border-violet-300/5" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3.5 py-1.5 backdrop-blur">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">
            Caught
          </span>
          <span className="font-score text-[12px] font-bold text-violet-200">{caught}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="flex items-center gap-1 text-[9px] text-cyan-300/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> +10
          </span>
          <span className="flex items-center gap-1 text-[9px] text-amber-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> +30
          </span>
          <span className="flex items-center gap-1 text-[9px] text-rose-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> -15
          </span>
        </div>
      </div>

      {spooks.map((spook) => {
        const lifeRatio = Math.max(0, 1 - (performance.now() - spook.born) / spook.life);
        return (
          <button
            key={spook.id}
            type="button"
            onClick={() => catchGhost(spook)}
            onPointerDown={(e) => e.preventDefault()}
            aria-label={`Catch ${spook.type} ghost`}
            className="group absolute z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-100 hover:scale-110 active:scale-95"
            style={{
              left: `${spook.x}%`,
              top: `${spook.y}%`,
              opacity: 0.35 + lifeRatio * 0.65,
              animation: "ghost-in 0.32s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <span className="absolute inset-2 rounded-full bg-violet-400/0 blur-md transition-colors group-hover:bg-violet-400/20" />
            <span className="animate-drift" style={{ transform: `scale(${spook.scale})` }}>
              {spook.type === "bomb" ? (
                <BombSprite size={54} />
              ) : spook.type === "gold" ? (
                <GoldenGhostSprite size={58} />
              ) : (
                <GhostSprite
                  color={spook.scale > 1.03 ? "#67e8f9" : "#a78bfa"}
                  size={58}
                />
              )}
            </span>
          </button>
        );
      })}

      {floaters.map((f) => (
        <span
          key={f.id}
          className="pointer-events-none absolute z-20 -translate-x-1/2 font-score text-sm font-bold"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            color: f.color,
            textShadow: `0 0 16px ${f.color}`,
            animation: "score-float 0.85s ease-out forwards",
          }}
        >
          {f.text}
        </span>
      ))}

      {caught === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
          <p className="font-display text-lg text-white/30">Catch the spirits</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/20">
            30 seconds · click or tap
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">
          Golden ghosts are worth 30 · bombs cost 15
        </p>
      </div>
    </div>
  );
}
