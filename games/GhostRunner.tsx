"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Heart } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeyPress } from "@/hooks/useKeyboardControls";
import {
  drawGhost,
  drawMoon,
  drawStarfield,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

type ObstacleType = "tomb" | "gate";

interface Obstacle {
  x: number;
  type: ObstacleType;
  h: number;
  w: number;
  scored: boolean;
}

interface Coin {
  x: number;
  y: number;
  taken: boolean;
  phase: number;
}

interface RunnerState {
  y: number;
  vy: number;
  slide: number;
  obstacles: Obstacle[];
  coins: Coin[];
  spawnIn: number;
  coinIn: number;
  speed: number;
  score: number;
  lives: number;
  invuln: number;
  time: number;
  ended: boolean;
  flash: number;
}

export default function GhostRunner() {
  const api = useGameApi();
  const active = api.status === "playing";
  const stateRef = useRef<RunnerState>({
    y: 0,
    vy: 0,
    slide: 0,
    obstacles: [],
    coins: [],
    spawnIn: 1.2,
    coinIn: 1.4,
    speed: 300,
    score: 0,
    lives: 3,
    invuln: 0,
    time: 0,
    ended: false,
    flash: 0,
  });
  const [lives, setLives] = useState(3);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const addScoreRef = useRef(api.addScore);
  addScoreRef.current = api.addScore;

  const jump = useCallback(() => {
    const state = stateRef.current;
    if (!active || state.ended) return;
    if (state.y >= 0) {
      state.vy = -720;
      state.slide = 0;
      sfx.jump();
    }
  }, [active]);

  const slide = useCallback(() => {
    const state = stateRef.current;
    if (!active || state.ended) return;
    if (state.y >= 0) state.slide = 0.6;
    else state.vy += 560;
    sfx.click();
  }, [active]);

  useKeyPress(active, jump, [" ", "spacebar", "arrowup", "w"]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (["arrowdown", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (!e.repeat) slide();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, slide]);

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, elapsed) => {
      const state = stateRef.current;
      state.time = elapsed;
      const ground = height - Math.min(96, height * 0.17);
      const playerX = Math.min(130, width * 0.24);
      const sliding = state.slide > 0;

      if (!state.ended && active) {
        state.vy += 2100 * dt;
        state.y += state.vy * dt;
        if (state.y >= 0) {
          state.y = 0;
          state.vy = 0;
        }
        if (state.slide > 0) state.slide -= dt;

        state.speed = Math.min(620, 300 + elapsed * 11);
        state.spawnIn -= dt;
        state.coinIn -= dt;

        if (state.spawnIn <= 0) {
          const isGate = elapsed > 8 && Math.random() < 0.35;
          state.obstacles.push({
            x: width + 50,
            type: isGate ? "gate" : "tomb",
            h: isGate ? 28 : rand(48, 82),
            w: isGate ? 48 : rand(26, 38),
            scored: false,
          });
          state.spawnIn = Math.max(0.85, rand(1.3, 1.9) - elapsed * 0.008);
        }

        if (state.coinIn <= 0) {
          const count = Math.random() < 0.3 ? 3 : 1;
          for (let i = 0; i < count; i++) {
            state.coins.push({
              x: width + 60 + i * 42,
              y: randomCoinHeight(ground),
              taken: false,
              phase: rand(0, Math.PI * 2),
            });
          }
          state.coinIn = rand(1.8, 3.2);
        }

        const move = state.speed * dt;
        for (const o of state.obstacles) o.x -= move;
        for (const c of state.coins) c.x -= move;

        const playerH = sliding ? 34 : 64;
        const playerTop = ground + state.y - playerH;
        const playerBottom = ground + state.y;
        const playerLeft = playerX - 17;
        const playerRight = playerX + 17;

        for (const o of state.obstacles) {
          if (!o.scored && o.x + o.w < playerX - 20) {
            o.scored = true;
            state.score += 20;
            addScoreRef.current(20);
          }
          const obstacleTop = o.type === "gate" ? ground - 78 : ground - o.h;
          const obstacleBottom = o.type === "gate" ? ground - 50 : ground;
          const overlapX = playerRight > o.x && playerLeft < o.x + o.w;
          const overlapY = playerBottom > obstacleTop && playerTop < obstacleBottom;
          if (overlapX && overlapY && elapsed > state.invuln) {
            state.lives -= 1;
            setLives(state.lives);
            state.invuln = elapsed + 1.3;
            state.flash = 0.45;
            sfx.hit();
            if (state.lives <= 0) {
              state.ended = true;
              endRef.current({ score: state.score });
            }
          }
        }

        for (const coin of state.coins) {
          if (coin.taken) continue;
          const cx = playerX;
          const cy = ground + state.y - playerH * 0.6;
          if (Math.hypot(coin.x - cx, coin.y - cy) < 30) {
            coin.taken = true;
            state.score += 15;
            addScoreRef.current(15);
            sfx.golden();
          }
        }

        state.obstacles = state.obstacles.filter((o) => o.x > -80);
        state.coins = state.coins.filter((c) => c.x > -40 && !c.taken);
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#0d0a1d");
      sky.addColorStop(0.55, "#160e24");
      sky.addColorStop(1, "#06060e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, ground, elapsed * 0.5, 40);
      drawMoon(ctx, width * 0.72, height * 0.18, Math.min(40, width * 0.065), "#f9a8d4");

      // haunted skyline
      ctx.fillStyle = "rgba(22,16,38,0.85)";
      for (let i = 0; i < 10; i++) {
        const x = ((i * 120 - elapsed * 25) % (width + 160) + width + 160) % (width + 160) - 100;
        const h = 60 + ((i * 53) % 90);
        ctx.fillRect(x, ground - h, 64, h);
        ctx.beginPath();
        ctx.moveTo(x - 6, ground - h);
        ctx.lineTo(x + 32, ground - h - 28);
        ctx.lineTo(x + 70, ground - h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(251,191,36,0.25)";
        for (let wy = 0; wy < 3; wy++) {
          if ((i + wy) % 3 === 0) ctx.fillRect(x + 16 + wy * 14, ground - h + 20, 6, 10);
        }
        ctx.fillStyle = "rgba(22,16,38,0.85)";
      }

      // ground
      ctx.fillStyle = "#0b0b16";
      ctx.fillRect(0, ground, width, height - ground);
      ctx.strokeStyle = "rgba(244,114,182,0.28)";
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(width, ground);
      ctx.stroke();
      for (let x = -60; x < width + 80; x += 110) {
        const gx = ((x - elapsed * state.speed * 0.7) % (width + 180) + width + 180) % (width + 180) - 60;
        ctx.strokeStyle = "rgba(148,163,184,0.08)";
        ctx.beginPath();
        ctx.moveTo(gx, ground + 8);
        ctx.lineTo(gx - 20, ground + 30);
        ctx.moveTo(gx + 30, ground + 14);
        ctx.lineTo(gx + 46, ground + 32);
        ctx.stroke();
      }

      // coins
      for (const coin of state.coins) {
        const bob = Math.sin(elapsed * 4 + coin.phase) * 4;
        ctx.save();
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "rgba(251,191,36,0.9)";
        ctx.beginPath();
        ctx.arc(coin.x, coin.y + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,251,235,0.7)";
        ctx.beginPath();
        ctx.arc(coin.x - 2, coin.y + bob - 2, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // obstacles
      for (const o of state.obstacles) {
        if (o.type === "tomb") {
          ctx.fillStyle = "#1a1730";
          ctx.strokeStyle = "rgba(196,181,253,0.25)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(o.x, ground);
          ctx.lineTo(o.x, ground - o.h + 10);
          ctx.quadraticCurveTo(o.x + o.w / 2, ground - o.h - 14, o.x + o.w, ground - o.h + 10);
          ctx.lineTo(o.x + o.w, ground);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(196,181,253,0.3)";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText("RIP", o.x + o.w / 2, ground - o.h * 0.4);
        } else {
          ctx.strokeStyle = "rgba(244,114,182,0.5)";
          ctx.fillStyle = "rgba(244,114,182,0.1)";
          ctx.lineWidth = 2;
          ctx.fillRect(o.x, ground - 78, o.w, 28);
          ctx.strokeRect(o.x, ground - 78, o.w, 28);
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(o.x + 6 + i * 11, ground - 78);
            ctx.lineTo(o.x + 6 + i * 11, ground - 50);
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(244,114,182,0.55)";
          ctx.beginPath();
          ctx.arc(o.x + o.w / 2, ground - 64, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // runner
      const invulnerable = elapsed < state.invuln;
      ctx.globalAlpha = invulnerable ? 0.4 + Math.abs(Math.sin(elapsed * 16)) * 0.6 : 1;
      const ghostR = sliding ? 18 : 25;
      const ghostY = ground + state.y - (sliding ? 22 : 42);
      drawGhost(ctx, playerX, ghostY, ghostR, {
        color: invulnerable ? "#f472b6" : "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: "angry",
        mouth: true,
        tilt: sliding ? 1.1 : -0.06,
        squash: sliding ? 1.5 : 1,
        glow: 26,
      });
      ctx.globalAlpha = 1;

      drawVignette(ctx, width, height, 0.45);
      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < 3) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.42)";
        ctx.fillText("JUMP TOMBSTONES · SLIDE UNDER GATES", width / 2, height * 0.4);
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full touch-none overflow-hidden"
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientY - rect.top > rect.height * 0.6) slide();
        else jump();
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />

      <div className="pointer-events-none absolute left-3 top-2 z-10 flex items-center gap-1 rounded-lg border border-rose-300/15 bg-black/40 px-2.5 py-1.5 backdrop-blur">
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            size={11}
            className={i < lives ? "text-rose-400" : "text-slate-700"}
            fill={i < lives ? "currentColor" : "none"}
          />
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex gap-2 md:hidden">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            slide();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-slate-300 backdrop-blur active:bg-pink-500/20"
          aria-label="Slide"
        >
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            jump();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 backdrop-blur active:bg-cyan-400/25"
          aria-label="Jump"
        >
          <ArrowUp size={18} />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-center md:flex">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
          Space to jump · ↓ to slide
        </span>
      </div>
    </div>
  );
}

function randomCoinHeight(ground: number) {
  return ground - (Math.random() < 0.55 ? 55 : 130);
}
