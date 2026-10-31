"use client";

import { useCallback, useRef } from "react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeyPress } from "@/hooks/useKeyboardControls";
import { drawGhost, drawMoon, drawStarfield, drawVignette, rand } from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Obstacle {
  x: number;
  h: number;
  w: number;
  scored: boolean;
}

interface Soul {
  x: number;
  y: number;
  scored: boolean;
  phase: number;
}

interface JumpState {
  y: number;
  vy: number;
  grounded: boolean;
  obstacles: Obstacle[];
  souls: Soul[];
  spawnIn: number;
  soulIn: number;
  speed: number;
  score: number;
  time: number;
  ended: boolean;
  flash: number;
}

export default function GhostJump() {
  const api = useGameApi();
  const active = api.status === "playing";
  const stateRef = useRef<JumpState>({
    y: 0,
    vy: 0,
    grounded: true,
    obstacles: [],
    souls: [],
    spawnIn: 1,
    soulIn: 1.8,
    speed: 250,
    score: 0,
    time: 0,
    ended: false,
    flash: 0,
  });
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const addScoreRef = useRef(api.addScore);
  addScoreRef.current = api.addScore;

  const jump = useCallback(() => {
    const state = stateRef.current;
    if (!active || state.ended) return;
    if (state.grounded) {
      state.vy = -680;
      state.grounded = false;
      sfx.jump();
    }
  }, [active]);

  useKeyPress(active, jump, [" ", "spacebar", "arrowup", "w"]);

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, time) => {
      const state = stateRef.current;
      const ground = height - Math.min(100, height * 0.17);
      const playerX = Math.min(120, width * 0.22);
      const ghostR = Math.min(27, height * 0.045);
      state.time = time;

      if (!state.ended && active) {
        // physics
        state.vy += 1900 * dt;
        state.y += state.vy * dt;
        if (state.y >= 0) {
          state.y = 0;
          state.vy = 0;
          state.grounded = true;
        }

        state.speed = Math.min(560, 250 + time * 9);
        state.spawnIn -= dt;
        state.soulIn -= dt;

        if (state.spawnIn <= 0) {
          state.obstacles.push({
            x: width + 40,
            h: rand(44, Math.min(100, height * 0.16)),
            w: rand(26, 40),
            scored: false,
          });
          state.spawnIn = rand(1.25, 1.9) - Math.min(0.5, time * 0.008);
          if (state.speed > 420 && Math.random() < 0.25) {
            state.obstacles.push({
              x: width + 40 + rand(150, 240),
              h: rand(40, 75),
              w: rand(24, 34),
              scored: false,
            });
          }
        }

        if (state.soulIn <= 0) {
          state.souls.push({
            x: width + 30,
            y: ground - rand(95, 210),
            scored: false,
            phase: rand(0, Math.PI * 2),
          });
          state.soulIn = rand(1.8, 3.2);
        }

        const move = state.speed * dt;
        for (const obstacle of state.obstacles) obstacle.x -= move;
        for (const soul of state.souls) soul.x -= move;

        for (const obstacle of state.obstacles) {
          if (!obstacle.scored && obstacle.x + obstacle.w < playerX - ghostR) {
            obstacle.scored = true;
            state.score += 10;
            addScoreRef.current(10);
          }
          const ghostTop = ground + state.y - ghostR * 1.9;
          const ghostBottom = ground + state.y;
          const hit =
            playerX + ghostR * 0.85 > obstacle.x &&
            playerX - ghostR * 0.85 < obstacle.x + obstacle.w &&
            ghostBottom > ground - obstacle.h &&
            ghostTop < ground;
          if (hit) {
            state.ended = true;
            state.flash = 0.4;
            sfx.hit();
            endRef.current({ score: state.score });
          }
        }

        for (const soul of state.souls) {
          if (soul.scored) continue;
          const soulR = 11;
          const cx = playerX;
          const cy = ground + state.y - ghostR * 0.9;
          if (Math.hypot(cx - soul.x, cy - soul.y) < ghostR + soulR) {
            soul.scored = true;
            state.score += 25;
            addScoreRef.current(25);
            sfx.golden();
          }
        }

        state.obstacles = state.obstacles.filter((o) => o.x + o.w > -30);
        state.souls = state.souls.filter((s) => s.x > -30 && !s.scored);
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#0a0a1d");
      sky.addColorStop(0.55, "#12102a");
      sky.addColorStop(1, "#06060e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, ground, time, 46);
      drawMoon(ctx, width * 0.78, height * 0.2, Math.min(48, width * 0.075), "#c4b5fd");

      // distant hills
      ctx.fillStyle = "rgba(27,24,52,0.7)";
      ctx.beginPath();
      ctx.moveTo(0, ground);
      for (let x = 0; x <= width; x += 60) {
        ctx.quadraticCurveTo(x + 30, ground - 50 - Math.sin(x * 0.02) * 20, x + 60, ground - 24);
      }
      ctx.lineTo(width, ground);
      ctx.closePath();
      ctx.fill();

      // ground
      ctx.fillStyle = "#0b0b16";
      ctx.fillRect(0, ground, width, height - ground);
      ctx.strokeStyle = "rgba(139,92,246,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(width, ground);
      ctx.stroke();
      for (let x = -40; x < width + 80; x += 90) {
        const offset = (x - time * state.speed * 0.6) % (width + 160);
        const gx = ((offset + width + 160) % (width + 160)) - 40;
        ctx.strokeStyle = "rgba(148,163,184,0.06)";
        ctx.beginPath();
        ctx.moveTo(gx, ground + 10);
        ctx.lineTo(gx - 14, ground + 34);
        ctx.stroke();
      }

      // obstacles
      for (const obstacle of state.obstacles) {
        const top = ground - obstacle.h;
        const gradient = ctx.createLinearGradient(0, top, 0, ground);
        gradient.addColorStop(0, "#241b3d");
        gradient.addColorStop(1, "#141024");
        ctx.fillStyle = gradient;
        ctx.strokeStyle = "rgba(196,181,253,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obstacle.x, ground);
        ctx.lineTo(obstacle.x, top + 12);
        ctx.quadraticCurveTo(obstacle.x + obstacle.w / 2, top - 10, obstacle.x + obstacle.w, top + 12);
        ctx.lineTo(obstacle.x + obstacle.w, ground);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(196,181,253,0.28)";
        ctx.font = `bold ${Math.max(8, obstacle.w * 0.3)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("RIP", obstacle.x + obstacle.w / 2, top + obstacle.h * 0.52);
      }

      // souls
      for (const soul of state.souls) {
        const bob = Math.sin(time * 3 + soul.phase) * 5;
        ctx.save();
        ctx.shadowColor = "#67e8f9";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "rgba(103,232,249,0.9)";
        ctx.beginPath();
        ctx.arc(soul.x, soul.y + bob, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(soul.x, soul.y + bob, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ghost
      const tilt = state.grounded ? 0 : Math.max(-0.2, Math.min(0.2, state.vy * 0.0003));
      const squash = state.grounded ? 1 : 0.92;
      drawGhost(ctx, playerX, ground + state.y - ghostR, ghostR, {
        color: "#a78bfa",
        eyeColor: "#0b0b1a",
        eyeStyle: "dot",
        mouth: true,
        tilt,
        squash,
        glow: 26,
      });

      drawVignette(ctx, width, height, 0.45);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (time < 3) {
        ctx.fillStyle = "rgba(226,232,240,0.45)";
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillText("TAP OR PRESS SPACE TO JUMP", width / 2, height * 0.44);
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full cursor-pointer overflow-hidden"
      onPointerDown={(e) => {
        e.preventDefault();
        jump();
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 sm:hidden">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400 backdrop-blur">
          Tap to jump
        </span>
      </div>
    </div>
  );
}
