"use client";

import { useCallback, useRef } from "react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeyPress } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawMoon,
  drawStarfield,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Gate {
  x: number;
  gapY: number;
  gapH: number;
  scored: boolean;
  rune: number;
}

interface FlappyState {
  y: number;
  vy: number;
  gates: Gate[];
  spawnIn: number;
  speed: number;
  score: number;
  ended: boolean;
  flash: number;
}

export default function GhostFlappy() {
  const api = useGameApi();
  const active = api.status === "playing";
  const stateRef = useRef<FlappyState>({
    y: 0,
    vy: 0,
    gates: [],
    spawnIn: 0.9,
    speed: 170,
    score: 0,
    ended: false,
    flash: 0,
  });
  const initializedRef = useRef(false);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const addScoreRef = useRef(api.addScore);
  addScoreRef.current = api.addScore;

  const flap = useCallback(() => {
    const state = stateRef.current;
    if (!active || state.ended) return;
    state.vy = -430;
    sfx.jump();
  }, [active]);

  useKeyPress(active, flap, [" ", "spacebar", "arrowup", "w"]);

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, time) => {
      const state = stateRef.current;
      const ghostX = Math.min(120, width * 0.26);
      const radius = Math.min(22, height * 0.035);
      if (!initializedRef.current) {
        state.y = height * 0.42;
        initializedRef.current = true;
      }

      if (!state.ended && active) {
        state.vy += 1250 * dt;
        state.vy = Math.min(state.vy, 720);
        state.y += state.vy * dt;
        state.speed = Math.min(320, 170 + time * 5.5);
        state.spawnIn -= dt;

        if (state.spawnIn <= 0) {
          const gapH = clamp(height * 0.31, 116, 190);
          state.gates.push({
            x: width + 60,
            gapY: rand(gapH / 2 + 42, height - gapH / 2 - 50),
            gapH,
            scored: false,
            rune: rand(0, 6),
          });
          state.spawnIn = clamp(1.65 - time * 0.008, 1.1, 1.65);
        }

        const shift = state.speed * dt;
        for (const gate of state.gates) gate.x -= shift;
        state.gates = state.gates.filter((g) => g.x > -100);

        const radiusPad = radius * 0.72;
        for (const gate of state.gates) {
          if (!gate.scored && gate.x + 54 < ghostX - radius) {
            gate.scored = true;
            state.score += 10;
            addScoreRef.current(10);
            sfx.point();
          }
          const inGateX = ghostX + radiusPad > gate.x && ghostX - radiusPad < gate.x + 54;
          if (inGateX) {
            const gapTop = gate.gapY - gate.gapH / 2;
            const gapBottom = gate.gapY + gate.gapH / 2;
            if (state.y - radiusPad < gapTop || state.y + radiusPad > gapBottom) {
              state.ended = true;
              state.flash = 0.5;
              sfx.hit();
              endRef.current({ score: state.score });
            }
          }
        }

        if (state.y > height - radius - 8) {
          state.y = height - radius - 8;
          if (state.vy > 0) {
            state.ended = true;
            state.flash = 0.5;
            sfx.hit();
            endRef.current({ score: state.score });
          }
        }
        if (state.y < radius) {
          state.y = radius;
          state.vy = Math.max(0, state.vy);
        }
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#08111c");
      sky.addColorStop(0.55, "#0b0a1c");
      sky.addColorStop(1, "#06060e");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, height, time * 0.4, 52);
      drawMoon(ctx, width * 0.8, height * 0.18, Math.min(38, width * 0.06), "#a5f3fc");

      // distant city / graveyard silhouettes
      ctx.fillStyle = "rgba(14,20,38,0.7)";
      for (let i = 0; i < 12; i++) {
        const x = ((i * 97 - time * 18) % (width + 160) + width + 160) % (width + 160) - 80;
        const h = 30 + ((i * 37) % 70);
        ctx.fillRect(x, height - h, 40, h);
      }

      // gates
      for (const gate of state.gates) {
        const gapTop = gate.gapY - gate.gapH / 2;
        const gapBottom = gate.gapY + gate.gapH / 2;
        const strip = ctx.createLinearGradient(gate.x, 0, gate.x + 54, 0);
        strip.addColorStop(0, "rgba(76,29,149,0.55)");
        strip.addColorStop(0.5, "rgba(139,92,246,0.32)");
        strip.addColorStop(1, "rgba(34,211,238,0.2)");
        ctx.fillStyle = strip;
        ctx.strokeStyle = "rgba(196,181,253,0.35)";
        ctx.lineWidth = 1.2;
        ctx.fillRect(gate.x, 0, 54, gapTop);
        ctx.strokeRect(gate.x + 0.5, 0, 53, gapTop);
        ctx.fillRect(gate.x, gapBottom, 54, height - gapBottom);
        ctx.strokeRect(gate.x + 0.5, gapBottom, 53, height - gapBottom);

        ctx.save();
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 12;
        ctx.font = "18px serif";
        ctx.fillStyle = "rgba(165,243,252,0.3)";
        ctx.textAlign = "center";
        const runes = ["☾", "✦", "◈", "☠", "⚶", "✧"];
        ctx.fillText(runes[Math.floor(gate.rune) % runes.length], gate.x + 27, gapTop - 14);
        ctx.fillText(runes[(Math.floor(gate.rune) + 2) % runes.length], gate.x + 27, gapBottom + 24);
        ctx.restore();

        // gate mouths
        ctx.fillStyle = "rgba(6,6,14,0.9)";
        ctx.fillRect(gate.x - 3, gapTop - 5, 60, 5);
        ctx.fillRect(gate.x - 3, gapBottom, 60, 5);
      }

      // ground mist
      const mist = ctx.createLinearGradient(0, height - 80, 0, height);
      mist.addColorStop(0, "rgba(34,211,238,0)");
      mist.addColorStop(1, "rgba(34,211,238,0.09)");
      ctx.fillStyle = mist;
      ctx.fillRect(0, height - 80, width, 80);

      // ghost
      drawGhost(ctx, ghostX, state.y, radius, {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: state.vy < -120 ? "dot" : "sad",
        mouth: true,
        tilt: clamp(state.vy * 0.0006, -0.35, 0.5),
        glow: 26,
      });

      drawVignette(ctx, width, height, 0.45);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (time < 2.6) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.42)";
        ctx.fillText("TAP · FLAP · SURVIVE THE GATES", width / 2, height * 0.3);
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full cursor-pointer touch-none overflow-hidden"
      onPointerDown={(e) => {
        e.preventDefault();
        flap();
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
        <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
          Space / tap to flap
        </span>
      </div>
    </div>
  );
}
