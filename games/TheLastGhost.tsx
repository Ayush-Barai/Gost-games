"use client";

import { useRef, useState } from "react";
import { Crown, Shield, Skull, Sparkles, Timer } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { useKeys } from "@/hooks/useKeyboardControls";
import {
  clamp,
  drawGhost,
  drawMoon,
  drawStarfield,
  drawVignette,
  rand,
} from "@/lib/canvas";
import { sfx } from "@/lib/audio";

interface Hunter {
  x: number;
  y: number;
  speed: number;
  phase: number;
  size: number;
  hue: number;
}

interface Orb {
  x: number;
  y: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface LastState {
  x: number;
  y: number;
  target: { x: number; y: number } | null;
  trail: { x: number; y: number; life: number }[];
  hunters: Hunter[];
  orbs: Orb[];
  particles: Particle[];
  shield: number;
  invuln: number;
  score: number;
  time: number;
  spawnTimer: number;
  orbTimer: number;
  hudTimer: number;
  flash: number;
  ended: boolean;
}

export default function TheLastGhost() {
  const api = useGameApi();
  const active = api.status === "playing";
  const keys = useKeys(active);
  const stateRef = useRef<LastState>({
    x: 0.5,
    y: 0.52,
    target: null,
    trail: [],
    hunters: [],
    orbs: [],
    particles: [],
    shield: 100,
    invuln: 0,
    score: 0,
    time: 0,
    spawnTimer: 1.4,
    orbTimer: 0.8,
    hudTimer: 0,
    flash: 0,
    ended: false,
  });
  const [shield, setShield] = useState(100);
  const [time, setTime] = useState(0);
  const [hunterCount, setHunterCount] = useState(0);
  const [orbCount, setOrbCount] = useState(0);
  const draggingRef = useRef(false);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const setScoreRef = useRef(api.setScore);
  setScoreRef.current = api.setScore;
  const setTimeLeftRef = useRef(api.setTimeLeft);
  setTimeLeftRef.current = api.setTimeLeft;

  const pointer = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    stateRef.current.target = {
      x: clamp((clientX - rect.left) / rect.width, 0.04, 0.96),
      y: clamp((clientY - rect.top) / rect.height, 0.08, 0.93),
    };
  };

  const canvasRef = useGameCanvas(
    (ctx, width, height, dt, elapsed) => {
      const state = stateRef.current;
      const r = Math.max(15, Math.min(width, height) * 0.035);

      if (!state.ended && active) {
        state.time += dt;

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
          state.x = clamp(state.x + dx * 0.6 * dt, 0.045, 0.955);
          state.y = clamp(state.y + dy * 0.6 * dt, 0.08, 0.93);
        } else if (state.target) {
          const tx = state.target.x - state.x;
          const ty = state.target.y - state.y;
          const dist = Math.hypot(tx, ty);
          if (dist > 0.004) {
            const step = Math.min(dist, 0.64 * dt);
            state.x = clamp(state.x + (tx / dist) * step, 0.045, 0.955);
            state.y = clamp(state.y + (ty / dist) * step, 0.08, 0.93);
          }
        }

        // fading energy
        state.shield -= dt * (0.85 + Math.min(1.1, state.time * 0.012));

        state.trail.push({ x: state.x, y: state.y, life: 0.42 });
        state.trail.forEach((t) => (t.life -= dt));
        state.trail = state.trail.filter((t) => t.life > 0).slice(-20);

        // spawn hunters
        state.spawnTimer -= dt;
        const cap = Math.min(15, 3 + Math.floor(state.time / 11));
        if (state.spawnTimer <= 0 && state.hunters.length < cap) {
          const edge = Math.floor(rand(0, 4));
          state.hunters.push({
            x: edge === 0 ? -0.04 : edge === 1 ? 1.04 : rand(0.08, 0.92),
            y: edge === 2 ? -0.04 : edge === 3 ? 1.04 : rand(0.1, 0.9),
            speed: 0.085 + Math.min(0.13, state.time * 0.0014) + rand(-0.01, 0.03),
            phase: rand(0, Math.PI * 2),
            size: rand(0.82, 1.16),
            hue: rand(0, 1),
          });
          state.spawnTimer = Math.max(0.95, 3.1 - state.time * 0.028);
        }

        // spawn energy orbs
        state.orbTimer -= dt;
        if (state.orbTimer <= 0 && state.orbs.length < 5) {
          state.orbs.push({
            x: rand(0.1, 0.9),
            y: rand(0.14, 0.88),
            phase: rand(0, Math.PI * 2),
          });
          state.orbTimer = rand(1.3, 2.1);
        }

        // move hunters
        for (const hunter of state.hunters) {
          const hx = state.x - hunter.x;
          const hy = state.y - hunter.y;
          const len = Math.hypot(hx, hy) || 1;
          hunter.x += (hx / len) * hunter.speed * dt;
          hunter.y += (hy / len) * hunter.speed * dt;
          hunter.phase += dt * 2.2;
        }

        // orbs
        for (const orb of state.orbs) {
          if (Math.hypot(orb.x - state.x, orb.y - state.y) < 0.052) {
            orb.phase = -999;
            state.shield = Math.min(100, state.shield + 26);
            state.score += 25;
            sfx.point();
            for (let i = 0; i < 8; i++) {
              state.particles.push({
                x: orb.x,
                y: orb.y,
                vx: rand(-0.06, 0.06),
                vy: rand(-0.06, 0.06),
                life: 0.55,
                maxLife: 0.55,
                color: "#67e8f9",
              });
            }
          }
        }
        state.orbs = state.orbs.filter((orb) => orb.phase !== -999);

        // contact
        if (state.time > state.invuln) {
          for (const hunter of state.hunters) {
            const dist = Math.hypot(hunter.x - state.x, hunter.y - state.y);
            if (dist < 0.065) {
              state.shield -= 20;
              state.invuln = state.time + 1.35;
              state.flash = 0.45;
              sfx.hit();
              const kx = state.x - hunter.x;
              const ky = state.y - hunter.y;
              const klen = Math.hypot(kx, ky) || 1;
              state.x = clamp(state.x + (kx / klen) * 0.07, 0.045, 0.955);
              state.y = clamp(state.y + (ky / klen) * 0.07, 0.08, 0.93);
              hunter.x -= (kx / klen) * 0.04;
              hunter.y -= (ky / klen) * 0.04;
              for (let i = 0; i < 14; i++) {
                state.particles.push({
                  x: state.x,
                  y: state.y,
                  vx: rand(-0.13, 0.13),
                  vy: rand(-0.13, 0.13),
                  life: 0.6,
                  maxLife: 0.6,
                  color: "#fb7185",
                });
              }
              break;
            }
          }
        }

        // ambient particles
        if (Math.random() < dt * 8) {
          state.particles.push({
            x: rand(0, 1),
            y: rand(0, 1),
            vx: rand(-0.01, 0.01),
            vy: rand(-0.03, -0.008),
            life: 1.4,
            maxLife: 1.4,
            color: Math.random() < 0.5 ? "#a78bfa" : "#67e8f9",
          });
        }

        for (const particle of state.particles) {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.life -= dt;
        }
        state.particles = state.particles.filter((p) => p.life > 0).slice(-90);

        // survival score
        state.score += dt * 2.4;
        if (state.shield <= 0) {
          state.shield = 0;
          state.ended = true;
          setScoreRef.current(Math.round(state.score));
          setShield(0);
          endRef.current({ score: Math.round(state.score) });
        }

        state.hudTimer -= dt;
        if (state.hudTimer <= 0) {
          state.hudTimer = 0.16;
          setShield(Math.ceil(state.shield));
          setTime(Math.floor(state.time));
          setHunterCount(state.hunters.length);
          setOrbCount(state.orbs.length);
          setScoreRef.current(Math.round(state.score));
          setTimeLeftRef.current(Math.floor(state.time));
        }
      }
      if (state.flash > 0) state.flash -= dt;

      // ---------- render ----------
      const bg = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        20,
        width / 2,
        height * 0.45,
        Math.max(width, height) * 0.75,
      );
      bg.addColorStop(0, "#14102a");
      bg.addColorStop(0.55, "#0a0a18");
      bg.addColorStop(1, "#04040a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawStarfield(ctx, width, height, elapsed * 0.25, 46);
      drawMoon(ctx, width * 0.16, height * 0.16, Math.min(26, width * 0.045), "#f9a8d4");

      // arena rings
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(elapsed * 0.05);
      ctx.strokeStyle = "rgba(139,92,246,0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 16]);
      for (const scale of [0.34, 0.48, 0.62]) {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.min(width, height) * scale, Math.min(width, height) * scale * 0.82, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // spectral trail
      for (const t of state.trail) {
        ctx.globalAlpha = (t.life / 0.42) * 0.3;
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath();
        ctx.arc(t.x * width, t.y * height, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // particles
      for (const particle of state.particles) {
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife) * 0.75;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x * width, particle.y * height, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // energy orbs
      for (const orb of state.orbs) {
        const px = orb.x * width;
        const py = orb.y * height + Math.sin(elapsed * 2.6 + orb.phase) * 3;
        ctx.save();
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 26;
        const halo = ctx.createRadialGradient(px, py, 1, px, py, 22);
        halo.addColorStop(0, "rgba(224,242,254,0.95)");
        halo.addColorStop(0.35, "rgba(34,211,238,0.5)");
        halo.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ecfeff";
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // hunters
      for (const hunter of state.hunters) {
        const px = hunter.x * width;
        const py = hunter.y * height + Math.sin(hunter.phase) * 3;
        const color = hunter.hue > 0.5 ? "#f472b6" : "#fb7185";
        drawGhost(ctx, px, py, r * hunter.size, {
          color,
          eyeColor: "#210512",
          eyeStyle: "angry",
          glow: 22,
          alpha: 0.96,
        });
      }

      // player
      const invulnerable = state.time < state.invuln;
      ctx.globalAlpha = invulnerable
        ? 0.42 + Math.abs(Math.sin(elapsed * 18)) * 0.55
        : 1;
      drawGhost(ctx, state.x * width, state.y * height + Math.sin(elapsed * 3) * 2, r * 1.12, {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: "dot",
        mouth: true,
        glow: 30,
      });
      ctx.globalAlpha = 1;

      // shield halo
      const shieldRatio = clamp(state.shield / 100, 0, 1);
      ctx.strokeStyle = `rgba(103,232,249,${0.1 + shieldRatio * 0.3})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(state.x * width, state.y * height, r * 1.7, 0, Math.PI * 2);
      ctx.stroke();

      drawVignette(ctx, width, height, 0.62);

      if (state.flash > 0) {
        ctx.fillStyle = `rgba(244,63,94,${state.flash * 0.5})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed < 3) {
        ctx.textAlign = "center";
        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(226,232,240,0.45)";
        ctx.fillText("GATHER ENERGY · OUTLAST THE HUNTERS", width / 2, height * 0.93);
      }
    },
    active,
  );

  const shieldRatio = clamp(shield / 100, 0, 1);
  const shieldColor =
    shieldRatio > 0.55 ? "#22d3ee" : shieldRatio > 0.25 ? "#fbbf24" : "#fb7185";

  return (
    <div
      className="game-stage relative h-full w-full touch-none overflow-hidden"
      onPointerDown={(event) => {
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointer(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        pointer(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex items-start justify-between gap-2 sm:inset-x-4">
        <div className="w-[40%] max-w-[190px] rounded-lg border border-white/10 bg-black/45 px-2.5 py-2 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <Shield size={11} style={{ color: shieldColor }} />
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-400">
              Energy
            </span>
            <span className="font-score ml-auto text-[10px]" style={{ color: shieldColor }}>
              {shield}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${shieldRatio * 100}%`,
                background: `linear-gradient(90deg, ${shieldColor}, #a78bfa)`,
                boxShadow: `0 0 12px ${shieldColor}99`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 font-score text-[10px] text-slate-300 backdrop-blur">
            <Timer size={10} className="text-cyan-300" />
            {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-lg border border-rose-400/20 bg-black/45 px-2 py-1 font-mono text-[9px] text-rose-200 backdrop-blur">
              <Skull size={10} /> {hunterCount}
            </span>
            <span className="flex items-center gap-1 rounded-lg border border-cyan-300/20 bg-black/45 px-2 py-1 font-mono text-[9px] text-cyan-200 backdrop-blur">
              <Sparkles size={10} /> {orbCount}
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[46%] z-0 flex justify-center">
        {time === 0 && (
          <div className="text-center">
            <p className="font-display text-lg text-white/25">The last ghost drifts</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/20">
              Drag · WASD · survive
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2">
        <Crown size={11} className="text-amber-300/70" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Score {Math.round(api.score).toLocaleString()}
        </span>
        <span className="h-2.5 w-px bg-white/10" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600 md:hidden">
          Drag to flee
        </span>
      </div>
    </div>
  );
}
