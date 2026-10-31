"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeys } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawMoon,
  drawPumpkin,
  drawStarfield,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Pumpkin {
  x: number;
  y: number;
  speed: number;
  size: number;
  rot: number;
  spin: number;
  dodged: boolean;
}

interface DodgeState {
  x: number;
  target: number | null;
  vx: number;
  pumpkins: Pumpkin[];
  spawnIn: number;
  time: number;
  score: number;
  reported: number;
  ended: boolean;
  flash: number;
}

export default function PumpkinDodge() {
  const api = useGameApi();
  const active = api.status === "playing";
  const keys = useKeys(active);
  const stateRef = useRef<DodgeState>({
    x: 0.5,
    target: null,
    vx: 0,
    pumpkins: [],
    spawnIn: 0.8,
    time: 0,
    score: 0,
    reported: 0,
    ended: false,
    flash: 0,
  });
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const setScoreRef = useRef(api.setScore);
  setScoreRef.current = api.setScore;
  const draggingRef = useRef(false);

  useEffect(() => {
    const state = stateRef.current;
    state.ended = false;
    return () => {
      state.ended = true;
    };
  }, []);

  const onPointer = useCallback((clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    stateRef.current.target = clamp((clientX - rect.left) / rect.width, 0.1, 0.9);
  }, []);

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, time) => {
      const state = stateRef.current;
      state.time = time;
      const ground = height - Math.min(92, height * 0.16);
      const playerY = ground - Math.min(38, height * 0.05);

      if (!state.ended && active) {
        const left = keys.current.has("arrowleft") || keys.current.has("a");
        const right = keys.current.has("arrowright") || keys.current.has("d");
        let dir = 0;
        if (left) dir -= 1;
        if (right) dir += 1;

        if (dir !== 0) {
          state.target = null;
          state.x = clamp(state.x + dir * 0.9 * dt, 0.09, 0.91);
          state.vx = dir * 0.9;
        } else if (state.target !== null) {
          const next = state.x + (state.target - state.x) * Math.min(1, dt * 9);
          state.vx = (next - state.x) / Math.max(dt, 0.001);
          state.x = next;
        } else {
          state.vx *= 0.85;
        }

        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
          const size = rand(16, 29);
          state.pumpkins.push({
            x: rand(0.08, 0.92),
            y: -size * 2,
            speed: rand(150, 210) + Math.min(190, time * 11),
            size,
            rot: rand(0, Math.PI * 2),
            spin: rand(-3, 3),
            dodged: false,
          });
          state.spawnIn = Math.max(0.24, 0.72 - time * 0.012) * rand(0.75, 1.2);
          if (Math.random() < 0.15 && time > 12) {
            state.pumpkins.push({
              x: rand(0.1, 0.9),
              y: -60,
              speed: rand(200, 260) + Math.min(170, time * 10),
              size: rand(14, 22),
              rot: rand(0, 6),
              spin: rand(-4, 4),
              dodged: false,
            });
          }
        }

        state.score = Math.floor(time * 10);
        for (const pumpkin of state.pumpkins) {
          pumpkin.y += pumpkin.speed * dt;
          pumpkin.rot += pumpkin.spin * dt;
          if (!pumpkin.dodged && pumpkin.y > ground + 30) {
            pumpkin.dodged = true;
            state.score += 5;
            sfx.point();
          }
          if (!pumpkin.dodged) {
            const px = state.x * width;
            const radius = pumpkin.size + 12;
            if (Math.hypot(px - pumpkin.x * width, playerY - pumpkin.y) < radius) {
              state.ended = true;
              state.flash = 0.5;
              sfx.hit();
              setScoreRef.current(state.score);
              endRef.current({ score: state.score });
            }
          }
        }
        state.pumpkins = state.pumpkins.filter((p) => p.y < height + 80);

        if (state.score > state.reported) {
          state.reported = state.score;
          setScoreRef.current(state.score);
        }
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#140a1e");
      sky.addColorStop(0.5, "#0e0a1a");
      sky.addColorStop(1, "#06060e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, ground, time, 44);
      drawMoon(ctx, width * 0.5, height * 0.18, Math.min(44, width * 0.07), "#f9a8d4");

      // fence
      ctx.strokeStyle = "rgba(148,163,184,0.12)";
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, ground - 48);
        ctx.lineTo(x, ground);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4, ground - 46);
        ctx.lineTo(x + 4, ground - 60);
        ctx.lineTo(x + 14, ground - 52);
        ctx.lineTo(x + 24, ground - 60);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, ground - 30);
      ctx.lineTo(width, ground - 30);
      ctx.stroke();

      // ground fog
      const fog = ctx.createLinearGradient(0, ground - 40, 0, height);
      fog.addColorStop(0, "rgba(139,92,246,0.08)");
      fog.addColorStop(1, "rgba(6,6,14,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, ground - 40, width, height - ground + 40);
      ctx.fillStyle = "#0a0a15";
      ctx.fillRect(0, ground, width, height - ground);
      ctx.strokeStyle = "rgba(244,114,182,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, ground);
      ctx.lineTo(width, ground);
      ctx.stroke();

      for (const pumpkin of state.pumpkins) {
        drawPumpkin(ctx, pumpkin.x * width, pumpkin.y, pumpkin.size, pumpkin.rot, 8);
      }

      // player
      const px = state.x * width;
      const bob = Math.sin(time * 4) * 2;
      drawGhost(ctx, px, playerY + bob, Math.min(27, width * 0.055), {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: state.vx < -0.3 ? "angry" : "dot",
        mouth: true,
        tilt: clamp(state.vx * -0.3, -0.2, 0.2),
        glow: 24,
      });

      // danger line
      ctx.strokeStyle = "rgba(244,63,94,0.12)";
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(0, playerY + 34);
      ctx.lineTo(width, playerY + 34);
      ctx.stroke();
      ctx.setLineDash([]);

      drawVignette(ctx, width, height, 0.5);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(249,115,22,${state.flash * 0.5})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (time < 3) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.4)";
        ctx.fillText("MOVE · DODGE THE HARVEST", width / 2, height * 0.44);
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full touch-none overflow-hidden"
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointer(e.clientX, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        onPointer(e.clientX, e.currentTarget);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-3 sm:hidden">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400 backdrop-blur">
          Drag to move
        </span>
      </div>
    </div>
  );
}
