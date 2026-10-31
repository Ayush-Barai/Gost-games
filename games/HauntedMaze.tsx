"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, KeyRound, Skull } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { useGameCanvas } from "@/hooks/useGameCanvas";
import { drawGhost, drawVignette } from "@/lib/canvas";
import { sfx } from "@/lib/audio";
import { TouchDpad } from "./shared/TouchDpad";

const W = 15;
const H = 15;
const KEY_GOAL = 3;

interface Pos {
  x: number;
  y: number;
}

interface World {
  grid: number[][];
  keys: Pos[];
  ghosts: Pos[];
  exit: Pos;
}

function createWorld(): World {
  const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(1));
  const stack: Pos[] = [{ x: 1, y: 1 }];
  grid[1][1] = 0;
  while (stack.length) {
    const current = stack[stack.length - 1];
    const directions = [
      { x: 2, y: 0 },
      { x: -2, y: 0 },
      { x: 0, y: 2 },
      { x: 0, y: -2 },
    ].sort(() => Math.random() - 0.5);
    let carved = false;
    for (const d of directions) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1 && grid[ny][nx] === 1) {
        grid[current.y + d.y / 2][current.x + d.x / 2] = 0;
        grid[ny][nx] = 0;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }

  const floors: Pos[] = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (grid[y][x] === 0) floors.push({ x, y });
    }
  }
  const shuffled = floors.filter((p) => p.x + p.y > 6).sort(() => Math.random() - 0.5);
  const exit = { x: W - 2, y: H - 2 };
  grid[exit.y][exit.x] = 0;

  return {
    grid,
    exit,
    keys: shuffled.slice(0, KEY_GOAL).map((p) => ({ ...p })),
    ghosts: shuffled.slice(KEY_GOAL, KEY_GOAL + 3).map((p) => ({ ...p })),
  };
}

export default function HauntedMaze() {
  const api = useGameApi();
  const active = api.status === "playing";
  const [world] = useState(createWorld);
  const playerRef = useRef<Pos>({ x: 1, y: 1 });
  const keysRef = useRef<Pos[]>(world.keys.map((k) => ({ ...k })));
  const ghostsRef = useRef<Pos[]>(world.ghosts.map((g) => ({ ...g })));
  const [keysFound, setKeysFound] = useState(0);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  const invulnRef = useRef(0);
  const scoreRef = useRef(0);
  const endRef = useRef(api.endGame);
  endRef.current = api.endGame;
  const lastMoveRef = useRef(0);
  const endedRef = useRef(false);
  const [message, setMessage] = useState("Find the three keys, then escape.");
  const messageTimer = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  const say = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage("Find the three keys, then escape."), 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
    };
  }, []);

  const damage = useCallback(() => {
    if (performance.now() < invulnRef.current || endedRef.current) return;
    livesRef.current -= 1;
    setLives(livesRef.current);
    invulnRef.current = performance.now() + 1300;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
    sfx.hit();
    if (livesRef.current <= 0) {
      endedRef.current = true;
      endRef.current({ score: scoreRef.current });
    } else {
      playerRef.current = { x: 1, y: 1 };
      say("A spirit touched you. Back to the entrance.");
    }
  }, [say]);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (!active || endedRef.current) return;
      const now = performance.now();
      if (now - lastMoveRef.current < 95) return;
      lastMoveRef.current = now;
      const player = playerRef.current;
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
      if (world.grid[ny][nx] === 1) return;
      playerRef.current = { x: nx, y: ny };

      const keyIndex = keysRef.current.findIndex((k) => k.x === nx && k.y === ny);
      if (keyIndex >= 0) {
        keysRef.current.splice(keyIndex, 1);
        const found = KEY_GOAL - keysRef.current.length;
        setKeysFound(found);
        scoreRef.current += 150;
        api.setScore(scoreRef.current);
        sfx.golden();
        say(found === KEY_GOAL ? "All keys found. The exit is open." : `Key ${found} of ${KEY_GOAL}.`);
      }

      if (nx === world.exit.x && ny === world.exit.y) {
        if (keysRef.current.length === 0) {
          endedRef.current = true;
          const escapeBonus = 500 + Math.max(0, 30 - Math.floor(now / 1000) % 30);
          scoreRef.current += escapeBonus;
          api.setScore(scoreRef.current);
          endRef.current({ score: scoreRef.current, win: true });
        } else {
          say(`The door is sealed. ${keysRef.current.length} key${keysRef.current.length > 1 ? "s" : ""} missing.`);
        }
      }

      for (const ghost of ghostsRef.current) {
        if (ghost.x === nx && ghost.y === ny) damage();
      }
    },
    [active, api, damage, say, world],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "w"].includes(key)) {
        e.preventDefault();
        move(0, -1);
      } else if (["arrowdown", "s"].includes(key)) {
        e.preventDefault();
        move(0, 1);
      } else if (["arrowleft", "a"].includes(key)) {
        e.preventDefault();
        move(-1, 0);
      } else if (["arrowright", "d"].includes(key)) {
        e.preventDefault();
        move(1, 0);
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, move]);

  // Ghost patrols
  useEffect(() => {
    if (!active) return;
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const interval = window.setInterval(() => {
      if (endedRef.current) return;
      const player = playerRef.current;
      ghostsRef.current = ghostsRef.current.map((ghost) => {
        const options = directions
          .map(([dx, dy]) => ({ x: ghost.x + dx, y: ghost.y + dy }))
          .filter((p) => p.x >= 0 && p.y >= 0 && p.x < W && p.y < H && world.grid[p.y][p.x] === 0);
        if (options.length === 0) return ghost;
        const chase = Math.random() < 0.3;
        const sorted = options.sort((a, b) => {
          if (!chase) return Math.random() - 0.5;
          const da = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
          const db = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
          return da - db;
        });
        const next = sorted[0];
        if (next.x === player.x && next.y === player.y) {
          damage();
          return { ...ghost, x: next.x, y: next.y };
        }
        return { ...ghost, x: next.x, y: next.y };
      });
    }, 560);
    return () => window.clearInterval(interval);
  }, [active, damage, world.grid]);

  // Swipe support for tablets
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!swipeStart.current) return;
    const dx = e.clientX - swipeStart.current.x;
    const dy = e.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
    else move(0, dy > 0 ? 1 : -1);
  };

  const canvasRef = useGameCanvas(
    (ctx, width, height, _dt, time) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#06060e";
      ctx.fillRect(0, 0, width, height);

      const topPad = 64;
      const cell = Math.min((width - 24) / W, (height - topPad - 18) / H);
      const ox = (width - cell * W) / 2;
      const oy = topPad + (height - topPad - 18 - cell * H) / 2;

      // floor glow
      const glow = ctx.createRadialGradient(
        ox + playerRef.current.x * cell + cell / 2,
        oy + playerRef.current.y * cell + cell / 2,
        cell,
        ox + playerRef.current.x * cell + cell / 2,
        oy + playerRef.current.y * cell + cell / 2,
        cell * 8,
      );
      glow.addColorStop(0, "rgba(139,92,246,0.18)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const px = ox + x * cell;
          const py = oy + y * cell;
          if (world.grid[y][x] === 1) {
            ctx.fillStyle = "#141429";
            ctx.fillRect(px, py, cell + 0.5, cell + 0.5);
            ctx.strokeStyle = "rgba(139,92,246,0.13)";
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
          } else {
            ctx.fillStyle = "#0a0a18";
            ctx.fillRect(px, py, cell + 0.5, cell + 0.5);
            ctx.strokeStyle = "rgba(148,163,184,0.035)";
            ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
          }
        }
      }

      // exit
      const ex = ox + world.exit.x * cell + cell / 2;
      const ey = oy + world.exit.y * cell + cell / 2;
      const unlocked = keysRef.current.length === 0;
      const pulse = 0.5 + Math.sin(time * 4) * 0.2;
      ctx.save();
      ctx.shadowColor = unlocked ? "#34d399" : "#f472b6";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = unlocked ? `rgba(52,211,153,${pulse})` : "rgba(244,114,182,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ex - cell * 0.3, ey - cell * 0.38, cell * 0.6, cell * 0.76);
      ctx.fillStyle = unlocked ? "rgba(52,211,153,0.18)" : "rgba(244,114,182,0.08)";
      ctx.fillRect(ex - cell * 0.3, ey - cell * 0.38, cell * 0.6, cell * 0.76);
      ctx.fillStyle = unlocked ? "#a7f3d0" : "#f9a8d4";
      ctx.beginPath();
      ctx.arc(ex + cell * 0.14, ey, Math.max(1.2, cell * 0.045), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // keys
      for (const key of keysRef.current) {
        const kx = ox + key.x * cell + cell / 2;
        const ky = oy + key.y * cell + cell / 2 + Math.sin(time * 3 + key.x) * 2;
        ctx.save();
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "#fcd34d";
        ctx.fillStyle = "rgba(251,191,36,0.2)";
        ctx.lineWidth = Math.max(1.5, cell * 0.07);
        ctx.beginPath();
        ctx.arc(kx - cell * 0.1, ky - cell * 0.08, cell * 0.13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kx - cell * 0.02, ky + cell * 0.02);
        ctx.lineTo(kx + cell * 0.22, ky + cell * 0.2);
        ctx.stroke();
        ctx.restore();
      }

      // ghosts
      for (const ghost of ghostsRef.current) {
        const gx = ox + ghost.x * cell + cell / 2;
        const gy = oy + ghost.y * cell + cell / 2 + Math.sin(time * 2 + ghost.x) * 2;
        drawGhost(ctx, gx, gy, cell * 0.36, {
          color: "#f472b6",
          eyeColor: "#1b0512",
          eyeStyle: "angry",
          alpha: 0.92,
          glow: 16,
        });
      }

      // player
      const player = playerRef.current;
      const px = ox + player.x * cell + cell / 2;
      const py = oy + player.y * cell + cell / 2 + Math.sin(time * 3) * 1.5;
      const invulnerable = performance.now() < invulnRef.current;
      ctx.globalAlpha = invulnerable ? 0.35 + Math.abs(Math.sin(time * 14)) * 0.6 : 1;
      drawGhost(ctx, px, py, cell * 0.4, {
        color: "#67e8f9",
        eyeColor: "#04141a",
        eyeStyle: "dot",
        mouth: true,
        glow: 22,
      });
      ctx.globalAlpha = 1;

      drawVignette(ctx, width, height, 0.7);
    },
    active,
  );

  return (
    <div
      className="game-stage relative h-full w-full touch-none overflow-hidden bg-[#06060e]"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <canvas ref={canvasRef} className="game-canvas absolute inset-0" />

      <div className="pointer-events-none absolute left-3 right-3 top-2 z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-300/20 bg-black/40 px-2.5 py-1.5 backdrop-blur">
            <KeyRound size={12} className="text-amber-300" />
            <span className="font-score text-[12px] text-amber-200">
              {keysFound}/{KEY_GOAL}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-rose-300/20 bg-black/40 px-2.5 py-1.5 backdrop-blur">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={11}
                className={i < lives ? "text-rose-400" : "text-slate-700"}
                fill={i < lives ? "currentColor" : "none"}
              />
            ))}
          </div>
        </div>
        <div className="flex max-w-[52%] items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 backdrop-blur">
          <Skull size={11} className="shrink-0 text-violet-300" />
          <p className="truncate text-[10px] text-slate-300">{message}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden justify-center sm:flex">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
          WASD / arrows to move · collect 3 keys · avoid the pink spirits
        </p>
      </div>

      {flash && <div className="pointer-events-none absolute inset-0 z-10 bg-rose-500/15" />}

      <TouchDpad onMove={move} />
    </div>
  );
}
