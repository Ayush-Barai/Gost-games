"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Blocks, Sparkles, Trophy } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeyPress } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawMoon,
  drawStarfield,
  drawVignette,
  roundRect,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Block {
  x: number;
  width: number;
  perfect: boolean;
}

interface TowerState {
  blocks: Block[];
  moving: { x: number; width: number; dir: number; speed: number };
  view: number;
  score: number;
  streak: number;
  ended: boolean;
  flash: number;
  dropFlash: number;
}

const BASE_WIDTH = 0.26;

export default function GhostTower() {
  const api = useGameApi();
  const active = api.status === "playing";
  const stateRef = useRef<TowerState>({
    blocks: [{ x: 0.5, width: BASE_WIDTH, perfect: false }],
    moving: { x: 0.5 - BASE_WIDTH / 2, width: BASE_WIDTH, dir: 1, speed: 0.34 },
    view: 0,
    score: 0,
    streak: 0,
    ended: false,
    flash: 0,
    dropFlash: 0,
  });
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const addScoreRef = useRef(api.addScore);
  addScoreRef.current = api.addScore;
  const [height, setHeight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((text: string) => {
    setToast({ text, key: Date.now() });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 700);
  }, []);

  const drop = useCallback(() => {
    const state = stateRef.current;
    if (!active || state.ended) return;
    const last = state.blocks[state.blocks.length - 1];
    const moving = state.moving;
    const left = Math.max(last.x - last.width / 2, moving.x - moving.width / 2);
    const right = Math.min(last.x + last.width / 2, moving.x + moving.width / 2);
    const overlap = right - left;

    if (overlap <= 0.004) {
      state.ended = true;
      state.flash = 0.65;
      sfx.bomb();
      endRef.current({ score: Math.round(state.score) });
      return;
    }

    const perfect = Math.abs(moving.x - last.x) <= 0.0065;
    let center = (left + right) / 2;
    let width = overlap;
    if (perfect) {
      center = last.x;
      width = Math.min(BASE_WIDTH, last.width + 0.015);
      state.streak += 1;
    } else {
      state.streak = 0;
    }

    const points = perfect ? 30 : 10;
    state.score += points;
    state.blocks.push({ x: center, width, perfect });
    addScoreRef.current(points);
    setHeight(state.blocks.length - 1);
    setStreak(state.streak);
    state.dropFlash = 0.22;
    state.moving.width = width;
    state.moving.x =
      state.blocks.length % 2 === 0 ? 0.12 + width / 2 : 0.88 - width / 2;
    state.moving.dir = state.blocks.length % 2 === 0 ? 1 : -1;
    state.moving.speed = Math.min(0.98, 0.34 + state.blocks.length * 0.018);

    if (perfect) {
      sfx.golden();
      showToast(state.streak >= 3 ? `PERFECT ×${state.streak}` : "PERFECT!");
    } else {
      sfx.point();
    }

    if (width < 0.014) {
      state.ended = true;
      state.flash = 0.5;
      endRef.current({ score: Math.round(state.score) });
    }
  }, [active, showToast]);

  useKeyPress(active, drop, [" ", "spacebar", "enter"]);

  const canvasRef = useGameCanvas(
    (ctx, width, heightPx, dt, time) => {
      const state = stateRef.current;
      const blockH = clamp(heightPx * 0.055, 17, 34);
      const baseY = heightPx - Math.max(42, heightPx * 0.075);
      const top = state.blocks[state.blocks.length - 1];

      if (!state.ended && active) {
        const moving = state.moving;
        moving.x += moving.dir * moving.speed * dt;
        const minX = 0.035 + moving.width / 2;
        const maxX = 0.965 - moving.width / 2;
        if (moving.x <= minX) {
          moving.x = minX;
          moving.dir = 1;
        } else if (moving.x >= maxX) {
          moving.x = maxX;
          moving.dir = -1;
        }
        if (state.dropFlash > 0) state.dropFlash -= dt;
      }
      if (state.flash > 0) state.flash -= dt;

      const targetView = Math.max(
        0,
        (state.blocks.length - 1) * blockH - (baseY - heightPx * 0.63),
      );
      state.view += (targetView - state.view) * Math.min(1, dt * 6);
      const view = state.view;

      // ---------- sky ----------
      const sky = ctx.createLinearGradient(0, 0, 0, heightPx);
      sky.addColorStop(0, "#0a1020");
      sky.addColorStop(0.5, "#0b0a1d");
      sky.addColorStop(1, "#05050c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, heightPx);
      drawStarfield(ctx, width, heightPx, time * 0.2, 44);
      drawMoon(ctx, width * 0.82, heightPx * 0.16, Math.min(30, width * 0.055), "#a5f3fc");

      // distant hills
      ctx.fillStyle = "rgba(8,8,18,0.85)";
      ctx.beginPath();
      ctx.moveTo(0, heightPx);
      ctx.lineTo(0, heightPx * 0.78);
      ctx.quadraticCurveTo(width * 0.2, heightPx * 0.68, width * 0.42, heightPx * 0.79);
      ctx.quadraticCurveTo(width * 0.65, heightPx * 0.72, width, heightPx * 0.8);
      ctx.lineTo(width, heightPx);
      ctx.closePath();
      ctx.fill();

      // glowing altar
      const altarY = baseY + blockH * 0.58;
      const altarGlow = ctx.createRadialGradient(
        width / 2,
        altarY,
        4,
        width / 2,
        altarY,
        Math.min(width * 0.3, 180),
      );
      altarGlow.addColorStop(0, "rgba(34,211,238,0.22)");
      altarGlow.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = altarGlow;
      ctx.beginPath();
      ctx.ellipse(width / 2, altarY, Math.min(width * 0.32, 200), blockH * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(103,232,249,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(width / 2, altarY, Math.min(width * 0.3, 190), blockH * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();

      // guide column under the moving block
      const lastX = (state.blocks[state.blocks.length - 1]?.x ?? 0.5) * width;
      const movingX = state.moving.x * width;
      ctx.save();
      ctx.strokeStyle = "rgba(167,139,250,0.16)";
      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(movingX, baseY - (state.blocks.length - 1) * blockH + view - blockH);
      ctx.lineTo(movingX, heightPx);
      ctx.stroke();
      ctx.restore();

      // ---------- tower ----------
      state.blocks.forEach((block, index) => {
        const y = baseY - index * blockH + view;
        if (y < -blockH * 2 || y > heightPx + blockH * 2) return;
        const w = block.width * width;
        const x = block.x * width - w / 2;
        const mix = index % 2 === 0;
        const colorA = mix ? "#22d3ee" : "#a78bfa";
        const colorB = mix ? "#8b5cf6" : "#f472b6";

        ctx.save();
        ctx.shadowColor = colorA;
        ctx.shadowBlur = block.perfect ? 22 : 12;
        const grad = ctx.createLinearGradient(x, y, x + w, y + blockH);
        grad.addColorStop(0, `${colorA}dd`);
        grad.addColorStop(0.55, `${colorB}aa`);
        grad.addColorStop(1, `${colorB}66`);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, w, blockH, Math.min(5, blockH * 0.22));
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        roundRect(ctx, x + 2, y + 2, Math.max(0, w - 4), Math.max(2, blockH * 0.16), 2);
        ctx.fill();

        ctx.strokeStyle = block.perfect ? "rgba(253,224,71,0.72)" : "rgba(255,255,255,0.28)";
        ctx.lineWidth = block.perfect ? 1.4 : 0.9;
        roundRect(ctx, x + 0.5, y + 0.5, w - 1, blockH - 1, Math.min(5, blockH * 0.22));
        ctx.stroke();

        // spectral rune
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#080812";
        ctx.beginPath();
        ctx.ellipse(block.x * width, y + blockH * 0.55, Math.max(1.5, w * 0.06), blockH * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      });

      // floating ghost on the tower top
      const ghostX = top.x * width;
      const ghostY =
        baseY - (state.blocks.length - 1) * blockH + view - blockH * 0.42 +
        Math.sin(time * 2.4) * 3;
      drawGhost(ctx, ghostX, ghostY, blockH * 0.62, {
        color: state.streak > 1 ? "#fde68a" : "#c4b5fd",
        eyeColor: "#0b0b1a",
        eyeStyle: state.streak > 1 ? "dot" : "sad",
        mouth: true,
        glow: 20,
      });

      // moving block
      if (!state.ended) {
        const moving = state.moving;
        const w = moving.width * width;
        const x = moving.x * width - w / 2;
        const y = baseY - state.blocks.length * blockH + view;
        const pulse = 0.8 + Math.sin(time * 6) * 0.12;
        ctx.save();
        ctx.shadowColor = "#67e8f9";
        ctx.shadowBlur = 26;
        const grad = ctx.createLinearGradient(x, y, x + w, y + blockH);
        grad.addColorStop(0, "rgba(103,232,249,0.95)");
        grad.addColorStop(0.5, "rgba(139,92,246,0.9)");
        grad.addColorStop(1, "rgba(244,114,182,0.82)");
        ctx.globalAlpha = pulse;
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, w, blockH, Math.min(5, blockH * 0.22));
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.2;
        roundRect(ctx, x + 0.5, y + 0.5, w - 1, blockH - 1, Math.min(5, blockH * 0.22));
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        roundRect(ctx, x + 2, y + 2, Math.max(0, w - 4), Math.max(2, blockH * 0.15), 2);
        ctx.fill();
        ctx.restore();
      }

      // drop overlap indicator near the moving block
      if (!state.ended) {
        const last = state.blocks[state.blocks.length - 1];
        const left = Math.max(last.x - last.width / 2, state.moving.x - state.moving.width / 2);
        const right = Math.min(last.x + last.width / 2, state.moving.x + state.moving.width / 2);
        const overlap = Math.max(0, right - left);
        const y = baseY - state.blocks.length * blockH + view + blockH + 5;
        ctx.fillStyle = "rgba(8,8,18,0.55)";
        roundRect(ctx, left * width, y, overlap * width, 3, 1.5);
        ctx.fill();
        ctx.fillStyle = overlap > 0.05 ? "rgba(103,232,249,0.85)" : "rgba(251,113,133,0.85)";
        roundRect(ctx, left * width, y, overlap * width, 3, 1.5);
        ctx.fill();
      }

      drawVignette(ctx, width, heightPx, 0.55);

      if (state.dropFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${state.dropFlash * 0.08})`;
        ctx.fillRect(0, 0, width, heightPx);
      }
      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash * 0.55})`;
        ctx.fillRect(0, 0, width, heightPx);
      }

      if (time < 3 && state.blocks.length === 1) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.45)";
        ctx.fillText("DROP THE BLOCK · STACK IT HIGH", width / 2, heightPx * 0.3);
      }

      if (Math.abs(lastX - movingX) < 2) {
        // subtle perfect alignment halo
        ctx.strokeStyle = "rgba(253,224,71,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(movingX, 0);
        ctx.lineTo(movingX, heightPx);
        ctx.stroke();
      }
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full cursor-pointer touch-none overflow-hidden"
      onPointerDown={(event) => {
        event.preventDefault();
        drop();
      }}
      role="application"
      aria-label="Ghost Tower stacking game"
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-black/40 px-3 py-1.5 backdrop-blur">
          <Blocks size={12} className="text-cyan-300" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">Height</span>
          <span className="font-score text-sm font-bold text-white">{height}</span>
        </div>
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 font-mono text-[10px] text-amber-200 backdrop-blur">
              <Sparkles size={11} /> ×{streak}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] text-slate-400 backdrop-blur">
            <Trophy size={11} className="text-amber-400/80" />
            {api.best.toLocaleString()}
          </span>
        </div>
      </div>

      {toast && (
        <span
          key={toast.key}
          className="pointer-events-none absolute inset-x-0 top-[42%] z-10 text-center font-display text-xl font-bold text-amber-200"
          style={{
            textShadow: "0 0 28px rgba(251,191,36,0.75)",
            animation: "tower-pop 0.7s ease-out forwards",
          }}
        >
          {toast.text}
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
          Tap · Space · Drop
        </span>
      </div>
    </div>
  );
}
