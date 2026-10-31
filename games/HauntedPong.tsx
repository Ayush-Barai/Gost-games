"use client";

import { useEffect, useRef } from "react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeys } from "@/hooks/useKeyboardControls";
import { clamp, drawGhost, drawVignette } from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface PongState {
  playerY: number;
  aiY: number;
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  speed: number;
  playerScore: number;
  aiScore: number;
  rally: number;
  serve: number;
  serveDir: number;
  ended: boolean;
  flash: number;
  trail: { x: number; y: number; life: number }[];
}

const WIN_SCORE = 5;

export default function HauntedPong() {
  const api = useGameApi();
  const active = api.status === "playing";
  const keys = useKeys(active);
  const stateRef = useRef<PongState>({
    playerY: 0.5,
    aiY: 0.5,
    ballX: 0.5,
    ballY: 0.5,
    vx: 0.48,
    vy: 0.26,
    speed: 0.52,
    playerScore: 0,
    aiScore: 0,
    rally: 0,
    serve: 1,
    serveDir: 1,
    ended: false,
    flash: 0,
    trail: [],
  });
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const setScoreRef = useRef(api.setScore);
  setScoreRef.current = api.setScore;
  const scoreRef = useRef(0);
  const draggingRef = useRef(false);
  const endedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (endedTimer.current) window.clearTimeout(endedTimer.current);
    };
  }, []);

  const pointerY = (clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    stateRef.current.playerY = clamp((clientY - rect.top) / rect.height, 0.12, 0.88);
  };

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, time) => {
      const state = stateRef.current;
      const paddleH = Math.max(64, height * 0.22) / height;
      const paddleW = Math.max(8, width * 0.016);
      const ballR = Math.max(5, Math.min(width, height) * 0.014);
      const leftX = width * 0.045;
      const rightX = width * 0.955;

      if (!state.ended && active) {
        const up = keys.current.has("w") || keys.current.has("arrowup");
        const down = keys.current.has("s") || keys.current.has("arrowdown");
        if (up) state.playerY -= 0.95 * dt;
        if (down) state.playerY += 0.95 * dt;
        state.playerY = clamp(state.playerY, paddleH / 2, 1 - paddleH / 2);

        // AI tracks the ball with a little fallibility
        const target = state.ballY + Math.sin(time * 0.8) * 0.015;
        const aiSpeed = 0.46 + state.playerScore * 0.035;
        const diff = target - state.aiY;
        state.aiY += clamp(diff, -aiSpeed * dt, aiSpeed * dt);
        state.aiY = clamp(state.aiY, paddleH / 2, 1 - paddleH / 2);

        if (state.serve > 0) {
          state.serve -= dt;
          state.ballX = 0.5;
          state.ballY = 0.5;
        } else {
          state.ballX += state.vx * state.speed * dt;
          state.ballY += state.vy * state.speed * dt;

          if (state.ballY < ballR / height) {
            state.ballY = ballR / height;
            state.vy = Math.abs(state.vy);
          }
          if (state.ballY > 1 - ballR / height) {
            state.ballY = 1 - ballR / height;
            state.vy = -Math.abs(state.vy);
          }

          const ballLeft = state.ballX - ballR / width;
          const ballRight = state.ballX + ballR / width;

          if (
            ballLeft < 0.04 + paddleW / width &&
            state.ballX > 0.02 &&
            state.vx < 0 &&
            Math.abs(state.ballY - state.playerY) < paddleH / 2 + ballR / height
          ) {
            state.ballX = 0.04 + paddleW / width + ballR / width;
            state.vx = Math.abs(state.vx);
            const offset = (state.ballY - state.playerY) / (paddleH / 2);
            state.vy = clamp(offset * 0.75, -0.8, 0.8);
            state.speed = Math.min(1.05, state.speed + 0.032);
            state.rally += 1;
            scoreRef.current += 2;
            setScoreRef.current(scoreRef.current);
            sfx.point();
          }

          if (
            ballRight > 0.96 - paddleW / width &&
            state.ballX < 0.98 &&
            state.vx > 0 &&
            Math.abs(state.ballY - state.aiY) < paddleH / 2 + ballR / height
          ) {
            state.ballX = 0.96 - paddleW / width - ballR / width;
            state.vx = -Math.abs(state.vx);
            const offset = (state.ballY - state.aiY) / (paddleH / 2);
            state.vy = clamp(offset * 0.7, -0.75, 0.75);
            state.speed = Math.min(1.05, state.speed + 0.03);
            state.rally += 1;
            sfx.flip();
          }

          if (state.ballX < -0.02 || state.ballX > 1.02) {
            const playerScored = state.ballX > 1;
            if (playerScored) {
              state.playerScore += 1;
              scoreRef.current += 100;
              sfx.win();
            } else {
              state.aiScore += 1;
              sfx.lose();
            }
            setScoreRef.current(scoreRef.current);
            state.flash = 0.35;
            state.rally = 0;
            state.speed = 0.52;
            state.ballX = 0.5;
            state.ballY = 0.5;
            state.serve = 0.8;
            state.serveDir = playerScored ? 1 : -1;
            const angle = (Math.random() - 0.5) * 0.5;
            state.vx = state.serveDir;
            state.vy = angle;

            if (state.playerScore >= WIN_SCORE || state.aiScore >= WIN_SCORE) {
              state.ended = true;
              const won = state.playerScore > state.aiScore;
              const finalScore = scoreRef.current;
              endedTimer.current = window.setTimeout(() => {
                endRef.current({ score: finalScore, win: won });
              }, 900);
            }
          }

          state.trail.push({ x: state.ballX, y: state.ballY, life: 0.28 });
          state.trail.forEach((t) => (t.life -= dt));
          state.trail = state.trail.filter((t) => t.life > 0).slice(-14);
        }
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#080814");
      bg.addColorStop(0.5, "#0d0a1d");
      bg.addColorStop(1, "#070712");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // table glow
      const glow = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width * 0.65);
      glow.addColorStop(0, "rgba(139,92,246,0.08)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(148,163,184,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 22);
      ctx.lineTo(width / 2, height - 22);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(139,92,246,0.16)";
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, width - 28, height - 28);

      // score
      ctx.textAlign = "center";
      ctx.font = "bold 34px monospace";
      ctx.fillStyle = "rgba(226,232,240,0.16)";
      ctx.fillText(String(state.playerScore), width * 0.36, 66);
      ctx.fillText(String(state.aiScore), width * 0.64, 66);

      // trail
      for (const t of state.trail) {
        ctx.globalAlpha = t.life * 1.6;
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath();
        ctx.arc(t.x * width, t.y * height, ballR * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // paddles as ghostly columns
      const drawPaddle = (x: number, y: number, color: string, flip: number) => {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 24;
        const grad = ctx.createLinearGradient(0, (y - paddleH / 2) * height, 0, (y + paddleH / 2) * height);
        grad.addColorStop(0, `${color}33`);
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, `${color}33`);
        ctx.fillStyle = grad;
        const h = paddleH * height;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - paddleW / 2, y * height - h / 2, paddleW, h, paddleW) : ctx.fillRect(x - paddleW / 2, y * height - h / 2, paddleW, h);
        ctx.fill();
        ctx.restore();
        drawGhost(ctx, x + flip * 24, y * height, Math.min(18, width * 0.025), {
          color,
          eyeColor: "#060612",
          eyeStyle: "dot",
          alpha: 0.6,
          glow: 12,
        });
      };
      drawPaddle(leftX, state.playerY, "#22d3ee", 1);
      drawPaddle(rightX, state.aiY, "#f472b6", -1);

      // ball
      ctx.save();
      ctx.shadowColor = "#a5f3fc";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#ecfeff";
      ctx.beginPath();
      ctx.arc(state.ballX * width, state.ballY * height, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (state.serve > 0 && !state.ended) {
        ctx.textAlign = "center";
        ctx.font = "bold 28px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.7)";
        ctx.fillText(String(Math.ceil(state.serve)), width / 2, height / 2 - 60);
      }

      if (state.ended) {
        ctx.fillStyle = "rgba(6,6,14,0.45)";
        ctx.fillRect(0, 0, width, height);
        ctx.textAlign = "center";
        ctx.font = "bold 26px serif";
        ctx.fillStyle = state.playerScore > state.aiScore ? "#a7f3d0" : "#f9a8d4";
        ctx.fillText(state.playerScore > state.aiScore ? "THE NIGHT IS YOURS" : "THE HOUSE WINS", width / 2, height / 2);
      }

      drawVignette(ctx, width, height, 0.5);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(139,92,246,${state.flash * 0.5})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (time < 2.5) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.4)";
        ctx.fillText("FIRST TO 5 · W/S OR DRAG", width / 2, height * 0.72);
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
        pointerY(e.clientY, e.currentTarget);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" || draggingRef.current) {
          pointerY(e.clientY, e.currentTarget);
        }
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center sm:flex">
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600 backdrop-blur">
          W / S or drag · first to 5
        </span>
      </div>
    </div>
  );
}
