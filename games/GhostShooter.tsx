"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Flame } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeys } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Enemy {
  x: number;
  y: number;
  speed: number;
  hp: number;
  size: number;
  phase: number;
  type: "phantom" | "wraith" | "brute";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface ShooterState {
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  pointerAim: boolean;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  spawnIn: number;
  fireIn: number;
  time: number;
  score: number;
  kills: number;
  wave: number;
  ended: boolean;
  flash: number;
}

export default function GhostShooter() {
  const api = useGameApi();
  const active = api.status === "playing";
  const keys = useKeys(active);
  const stateRef = useRef<ShooterState>({
    x: 0.5,
    y: 0.55,
    aimX: 1,
    aimY: 0.5,
    pointerAim: false,
    bullets: [],
    enemies: [],
    particles: [],
    spawnIn: 1.2,
    fireIn: 0,
    time: 0,
    score: 0,
    kills: 0,
    wave: 1,
    ended: false,
    flash: 0,
  });
  const [kills, setKills] = useState(0);
  const [wave, setWave] = useState(1);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const addScoreRef = useRef(api.addScore);
  addScoreRef.current = api.addScore;
  const draggingRef = useRef(false);
  const fireHeldRef = useRef(false);
  const lastPointerRef = useRef<"mouse" | "touch" | null>(null);

  useEffect(() => {
    const onUp = () => {
      fireHeldRef.current = false;
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, elapsed) => {
      const state = stateRef.current;
      state.time += dt;
      const gameTime = state.time;
      const unit = Math.min(width, height);
      const playerR = unit * 0.036;

      if (!state.ended && active) {
        const left = keys.current.has("a") || keys.current.has("arrowleft");
        const right = keys.current.has("d") || keys.current.has("arrowright");
        const up = keys.current.has("w") || keys.current.has("arrowup");
        const down = keys.current.has("s") || keys.current.has("arrowdown");
        let dx = (right ? 1 : 0) - (left ? 1 : 0);
        let dy = (down ? 1 : 0) - (up ? 1 : 0);
        if (dx || dy) {
          const length = Math.hypot(dx, dy);
          dx /= length;
          dy /= length;
          state.x = clamp(state.x + dx * 0.56 * dt, 0.05, 0.95);
          state.y = clamp(state.y + dy * 0.56 * dt, 0.08, 0.92);
        }

        state.wave = 1 + Math.floor(gameTime / 18);

        // aim: pointer if recently used, otherwise nearest enemy
        let aimX = state.aimX;
        let aimY = state.aimY;
        if (!state.pointerAim) {
          let nearest: Enemy | null = null;
          let best = Infinity;
          for (const enemy of state.enemies) {
            const d = Math.hypot(enemy.x - state.x, enemy.y - state.y);
            if (d < best) {
              best = d;
              nearest = enemy;
            }
          }
          if (nearest) {
            aimX = nearest.x - state.x;
            aimY = nearest.y - state.y;
          } else {
            aimX = 1;
            aimY = 0;
          }
          const len = Math.hypot(aimX, aimY) || 1;
          state.aimX = state.x + (aimX / len) * 0.2;
          state.aimY = state.y + (aimY / len) * 0.2;
        }

        state.fireIn -= dt;
        const firing = keys.current.has(" ") || fireHeldRef.current;
        if (firing && state.fireIn <= 0) {
          state.fireIn = 0.16;
          const dirX = state.aimX - state.x;
          const dirY = state.aimY - state.y;
          const len = Math.hypot(dirX, dirY) || 1;
          const speed = 1.5;
          state.bullets.push({
            x: state.x + (dirX / len) * 0.04,
            y: state.y + (dirY / len) * 0.04,
            vx: (dirX / len) * speed,
            vy: (dirY / len) * speed,
          });
          sfx.shoot();
        }

        for (const bullet of state.bullets) {
          bullet.x += bullet.vx * dt;
          bullet.y += bullet.vy * dt;
        }
        state.bullets = state.bullets.filter(
          (b) => b.x > -0.05 && b.x < 1.05 && b.y > -0.05 && b.y < 1.05,
        );

        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
          const edge = Math.floor(rand(0, 4));
          const roll = Math.random();
          let type: Enemy["type"] = "phantom";
          if (state.wave >= 2 && roll < 0.28) type = "wraith";
          if (state.wave >= 3 && roll > 0.86) type = "brute";
          state.enemies.push({
            x: edge === 0 ? 0.03 : edge === 1 ? 0.97 : rand(0.1, 0.9),
            y: edge === 2 ? 0.06 : edge === 3 ? 0.94 : rand(0.1, 0.9),
            speed: type === "wraith" ? 0.21 : type === "brute" ? 0.085 : 0.13 + state.wave * 0.008,
            hp: type === "brute" ? 3 : 1,
            size: type === "brute" ? 0.055 : type === "wraith" ? 0.029 : 0.038,
            phase: rand(0, Math.PI * 2),
            type,
          });
          state.spawnIn = Math.max(0.45, 1.7 - state.wave * 0.18) * rand(0.8, 1.2);
        }

        for (const enemy of state.enemies) {
          const ex = state.x - enemy.x;
          const ey = state.y - enemy.y;
          const len = Math.hypot(ex, ey) || 1;
          enemy.x += (ex / len) * enemy.speed * dt;
          enemy.y += (ey / len) * enemy.speed * dt;
          enemy.phase += dt;
        }

        // bullet collisions
        for (const bullet of state.bullets) {
          for (const enemy of state.enemies) {
            if (enemy.hp <= 0) continue;
            if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.size + 0.017) {
              enemy.hp -= 1;
              bullet.x = 99;
              for (let p = 0; p < 7; p++) {
                state.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: rand(-0.25, 0.25),
                  vy: rand(-0.25, 0.25),
                  life: rand(0.3, 0.7),
                  color: enemy.type === "brute" ? "#fbbf24" : "#f472b6",
                });
              }
              if (enemy.hp <= 0) {
                const points = enemy.type === "brute" ? 60 : 20;
                state.score += points;
                addScoreRef.current(points);
                state.kills += 1;
                setKills(state.kills);
                sfx.catch();
              }
            }
          }
        }
        state.bullets = state.bullets.filter((b) => b.x < 50);
        state.enemies = state.enemies.filter((e) => e.hp > 0);

        // player damage - one touch ends the run
        for (const enemy of state.enemies) {
          if (Math.hypot(enemy.x - state.x, enemy.y - state.y) < enemy.size + playerR / unit * 0.8) {
            state.ended = true;
            state.flash = 0.6;
            sfx.hit();
            endRef.current({ score: state.score });
            break;
          }
        }

        for (const particle of state.particles) {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.life -= dt;
        }
        state.particles = state.particles.filter((p) => p.life > 0);
        setWave(state.wave);
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.8);
      bg.addColorStop(0, "#0f0d20");
      bg.addColorStop(1, "#05050c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // floor grid
      ctx.strokeStyle = "rgba(139,92,246,0.07)";
      ctx.lineWidth = 1;
      const grid = 46;
      for (let x = 0; x < width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // mist
      for (let i = 0; i < 4; i++) {
        const gx = ((elapsed * 18 + i * 260) % (width + 400)) - 200;
        const grad = ctx.createRadialGradient(gx, height * (0.3 + i * 0.15), 10, gx, height * (0.3 + i * 0.15), 160);
        grad.addColorStop(0, "rgba(34,211,238,0.035)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // particles
      for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // bullets
      for (const bullet of state.bullets) {
        ctx.save();
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#a5f3fc";
        ctx.beginPath();
        ctx.arc(bullet.x * width, bullet.y * height, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // enemies
      for (const enemy of state.enemies) {
        const color = enemy.type === "brute" ? "#fbbf24" : enemy.type === "wraith" ? "#c084fc" : "#f472b6";
        drawGhost(
          ctx,
          enemy.x * width,
          enemy.y * height + Math.sin(enemy.phase * 3) * 3,
          enemy.size * unit,
          {
            color,
            eyeColor: "#130410",
            eyeStyle: enemy.type === "wraith" ? "spiral" : "angry",
            glow: 18,
            alpha: 0.95,
          },
        );
        if (enemy.type === "brute" && enemy.hp > 1) {
          ctx.strokeStyle = "rgba(251,191,36,0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(enemy.x * width, enemy.y * height, enemy.size * unit * 1.25, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // aim guide
      const aimDx = state.aimX - state.x;
      const aimDy = state.aimY - state.y;
      const aimLen = Math.hypot(aimDx, aimDy) || 1;
      const guideX = state.x + (aimDx / aimLen) * 0.28;
      const guideY = state.y + (aimDy / aimLen) * 0.28;
      ctx.strokeStyle = "rgba(103,232,249,0.18)";
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(state.x * width, state.y * height);
      ctx.lineTo(guideX * width, guideY * height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(103,232,249,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(state.aimX * width, state.aimY * height, 6, 0, Math.PI * 2);
      ctx.stroke();

      // player
      drawGhost(ctx, state.x * width, state.y * height + Math.sin(elapsed * 4) * 2, playerR, {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: "dot",
        mouth: true,
        glow: 26,
      });

      drawVignette(ctx, width, height, 0.6);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < 3) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.42)";
        ctx.fillText("WASD TO MOVE · SPACE TO FIRE · ONE TOUCH IS FATAL", width / 2, height * 0.93);
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full touch-none overflow-hidden"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") {
          const rect = e.currentTarget.getBoundingClientRect();
          stateRef.current.aimX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
          stateRef.current.aimY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
          stateRef.current.pointerAim = true;
          fireHeldRef.current = true;
          lastPointerRef.current = "mouse";
        } else {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = clamp((e.clientX - rect.left) / rect.width, 0.05, 0.95);
        const y = clamp((e.clientY - rect.top) / rect.height, 0.08, 0.92);
        if (e.pointerType === "mouse") {
          stateRef.current.aimX = x;
          stateRef.current.aimY = y;
          stateRef.current.pointerAim = true;
          lastPointerRef.current = "mouse";
        } else if (draggingRef.current) {
          stateRef.current.x = x;
          stateRef.current.y = y;
          stateRef.current.pointerAim = false;
          lastPointerRef.current = "touch";
        }
      }}
      onPointerUp={() => {
        draggingRef.current = false;
        if (lastPointerRef.current === "mouse") fireHeldRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
        fireHeldRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />

      <div className="pointer-events-none absolute left-3 right-3 top-2 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur">
            Wave <span className="font-score text-violet-200">{wave}</span>
          </span>
          <span className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur">
            Kills <span className="font-score text-cyan-200">{kills}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg border border-rose-300/20 bg-black/40 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-rose-300/80 backdrop-blur">
          <Flame size={10} /> One touch
        </span>
      </div>

      <button
        type="button"
        className="absolute bottom-5 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_30px_-8px_rgba(34,211,238,0.8)] backdrop-blur active:bg-cyan-400/30 md:hidden"
        aria-label="Fire"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fireHeldRef.current = true;
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          fireHeldRef.current = false;
        }}
        onPointerCancel={() => {
          fireHeldRef.current = false;
        }}
      >
        <Crosshair size={24} />
      </button>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 md:hidden">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
          Drag to move
        </span>
      </div>
    </div>
  );
}
