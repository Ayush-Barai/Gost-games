"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeys } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawStarfield,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Soul {
  x: number;
  y: number;
  phase: number;
}

interface Enemy {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

interface CollectorState {
  x: number;
  y: number;
  target: { x: number; y: number } | null;
  souls: Soul[];
  enemies: Enemy[];
  shield: number;
  invuln: number;
  score: number;
  soulCount: number;
  soulTimer: number;
  enemyTimer: number;
  survivalTimer: number;
  time: number;
  ended: boolean;
  flash: number;
  trail: { x: number; y: number; life: number }[];
}

export default function SoulCollector() {
  const api = useGameApi();
  const active = api.status === "playing";
  const keys = useKeys(active);
  const stateRef = useRef<CollectorState>({
    x: 0.5,
    y: 0.55,
    target: null,
    souls: [],
    enemies: [],
    shield: 3,
    invuln: 0,
    score: 0,
    soulCount: 0,
    soulTimer: 0.5,
    enemyTimer: 3,
    survivalTimer: 0,
    time: 0,
    ended: false,
    flash: 0,
    trail: [],
  });
  const [shield, setShield] = useState(3);
  const [souls, setSouls] = useState(0);
  const [time, setTime] = useState(0);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const setScoreRef = useRef(api.setScore);
  setScoreRef.current = api.setScore;
  const draggingRef = useRef(false);
  const layersRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {}, []);

  const pointer = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    stateRef.current.target = {
      x: clamp((clientX - rect.left) / rect.width, 0.05, 0.95),
      y: clamp((clientY - rect.top) / rect.height, 0.08, 0.92),
    };
  };

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, elapsed) => {
      const state = stateRef.current;
      state.time += dt;
      const gameTime = state.time;
      const r = Math.max(14, Math.min(width, height) * 0.033);

      if (!state.ended && active) {
        const left = keys.current.has("arrowleft") || keys.current.has("a");
        const right = keys.current.has("arrowright") || keys.current.has("d");
        const up = keys.current.has("arrowup") || keys.current.has("w");
        const down = keys.current.has("arrowdown") || keys.current.has("s");
        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (dx !== 0 || dy !== 0) {
          state.target = null;
          const length = Math.hypot(dx, dy) || 1;
          dx /= length;
          dy /= length;
          state.x = clamp(state.x + dx * 0.62 * dt, 0.045, 0.955);
          state.y = clamp(state.y + dy * 0.62 * dt, 0.07, 0.93);
        } else if (state.target) {
          state.x += (state.target.x - state.x) * Math.min(1, dt * 11);
          state.y += (state.target.y - state.y) * Math.min(1, dt * 11);
        }

        state.trail.push({ x: state.x, y: state.y, life: 0.4 });
        state.trail.forEach((t) => (t.life -= dt));
        state.trail = state.trail.filter((t) => t.life > 0).slice(-18);

        state.soulTimer -= dt;
        if (state.soulTimer <= 0 && state.souls.length < 7) {
          state.souls.push({
            x: rand(0.1, 0.9),
            y: rand(0.13, 0.87),
            phase: rand(0, Math.PI * 2),
          });
          state.soulTimer = rand(0.8, 1.5);
        }

        state.enemyTimer -= dt;
        if (state.enemyTimer <= 0) {
          const edge = Math.floor(rand(0, 4));
          state.enemies.push({
            x: edge === 0 ? 0.04 : edge === 1 ? 0.96 : rand(0.1, 0.9),
            y: edge === 2 ? 0.05 : edge === 3 ? 0.95 : rand(0.1, 0.9),
            speed: 0.1 + Math.min(0.16, gameTime * 0.004) + rand(-0.02, 0.03),
            phase: rand(0, Math.PI * 2),
          });
          state.enemyTimer = Math.max(1.5, 4 - gameTime * 0.045);
        }

        state.survivalTimer += dt;
        if (state.survivalTimer >= 1) {
          state.survivalTimer -= 1;
          state.score += 2;
          setScoreRef.current(state.score);
          setTime(Math.floor(gameTime));
        }

        for (const soul of state.souls) {
          if (Math.hypot(soul.x - state.x, soul.y - state.y) < 0.055) {
            soul.phase = -999;
            state.score += 10;
            state.soulCount += 1;
            setSouls(state.soulCount);
            setScoreRef.current(state.score);
            sfx.point();
            if (state.soulCount % 10 === 0 && state.shield < 5) {
              state.shield += 1;
              setShield(state.shield);
              sfx.golden();
            }
          }
        }
        state.souls = state.souls.filter((s) => s.phase !== -999);

        if (gameTime > state.invuln) {
          for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - state.x, enemy.y - state.y);
            if (dist < 0.065) {
              state.shield -= 1;
              setShield(state.shield);
              state.invuln = gameTime + 1.5;
              state.flash = 0.5;
              sfx.hit();
              if (state.shield <= 0) {
                state.ended = true;
                setScoreRef.current(state.score);
                endRef.current({ score: state.score });
              }
              break;
            }
          }
        }

        for (const enemy of state.enemies) {
          const ex = state.x - enemy.x;
          const ey = state.y - enemy.y;
          const length = Math.hypot(ex, ey) || 1;
          enemy.x += (ex / length) * enemy.speed * dt;
          enemy.y += (ey / length) * enemy.speed * dt;
        }
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.8);
      bg.addColorStop(0, "#10102a");
      bg.addColorStop(0.6, "#0a0a18");
      bg.addColorStop(1, "#05050c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, height, elapsed * 0.3, 40);

      // arena boundary
      ctx.save();
      ctx.strokeStyle = "rgba(139,92,246,0.22)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.strokeRect(width * 0.03, height * 0.05, width * 0.94, height * 0.9);
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(34,211,238,0.12)";
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // trail
      for (const t of state.trail) {
        ctx.globalAlpha = t.life * 0.35;
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath();
        ctx.arc(t.x * width, t.y * height, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // souls
      for (const soul of state.souls) {
        const px = soul.x * width;
        const py = soul.y * height + Math.sin(elapsed * 3 + soul.phase) * 3;
        ctx.save();
        ctx.shadowColor = "#a5f3fc";
        ctx.shadowBlur = 22;
        const halo = ctx.createRadialGradient(px, py, 1, px, py, 22);
        halo.addColorStop(0, "rgba(165,243,252,0.9)");
        halo.addColorStop(0.4, "rgba(34,211,238,0.45)");
        halo.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ecfeff";
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // enemies
      for (const enemy of state.enemies) {
        const px = enemy.x * width;
        const py = enemy.y * height + Math.sin(elapsed * 2 + enemy.phase) * 4;
        drawGhost(ctx, px, py, r * 1.05, {
          color: "#f472b6",
          eyeColor: "#1f0713",
          eyeStyle: "angry",
          glow: 20,
          alpha: 0.95,
        });
      }

      // player
      const invulnerable = gameTime < state.invuln;
      ctx.globalAlpha = invulnerable ? 0.4 + Math.abs(Math.sin(elapsed * 16)) * 0.6 : 1;
      drawGhost(ctx, state.x * width, state.y * height + Math.sin(elapsed * 3.2) * 2, r, {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: "dot",
        mouth: true,
        glow: 26,
      });
      ctx.globalAlpha = 1;

      drawVignette(ctx, width, height, 0.6);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash * 0.6})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < 3) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.42)";
        ctx.fillText("GATHER SOULS · EVADE THE PINK PHANTOMS", width / 2, height * 0.92);
      }
    },
    active,
  );

  return (
    <div
      ref={layersRef}
      className="game-stage relative h-full w-full touch-none overflow-hidden"
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointer(e.clientX, e.clientY, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        pointer(e.clientX, e.clientY, e.currentTarget);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />
      <div className="pointer-events-none absolute left-3 right-3 top-2 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 backdrop-blur">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart
              key={i}
              size={11}
              className={i < shield ? "text-rose-400" : "text-slate-700"}
              fill={i < shield ? "currentColor" : "none"}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] text-cyan-200 backdrop-blur">
            <Sparkles size={10} /> {souls} souls
          </span>
          <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-score text-[10px] text-slate-300 backdrop-blur">
            {time}s
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center md:hidden">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 backdrop-blur">
          Drag to drift
        </span>
      </div>
    </div>
  );
}
