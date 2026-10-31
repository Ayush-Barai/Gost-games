export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const randInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** The arcade's signature little ghost, drawn on canvas. */
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  options: {
    color?: string;
    alpha?: number;
    glow?: number;
    eyeColor?: string;
    eyeStyle?: "dot" | "sad" | "angry" | "spiral";
    mouth?: boolean;
    squash?: number;
    tilt?: number;
  } = {},
) {
  const {
    color = "#a78bfa",
    alpha = 1,
    glow = 18,
    eyeColor = "#080812",
    eyeStyle = "dot",
    mouth = false,
    squash = 1,
    tilt = 0,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(squash, 1);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;

  const topY = -r * 0.75;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.9);
  ctx.lineTo(-r, topY);
  ctx.arc(0, topY, r, Math.PI, 0, false);
  ctx.lineTo(r, r * 0.9);

  // wavy spectral hem
  const bumps = 4;
  for (let i = 0; i < bumps; i++) {
    const startX = r - (i * 2 * r) / bumps;
    const endX = r - ((i + 1) * 2 * r) / bumps;
    const midX = (startX + endX) / 2;
    const lift = i % 2 === 0 ? -r * 0.16 : r * 0.08;
    ctx.quadraticCurveTo(midX, r * 0.9 + lift, endX, r * 0.9);
  }
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, topY - r, 0, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#c4b5fd");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = "#f5f3ff";
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();
  ctx.globalAlpha = alpha;

  const eyeY = topY + r * 0.32;
  const eyeX = r * 0.34;
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = "#e0f2fe";
  ctx.shadowBlur = r * 0.5;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    if (eyeStyle === "spiral") {
      ctx.arc(dir * eyeX, eyeY, r * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = "#0b0b1a";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dir * eyeX, eyeY, r * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f3ff";
      ctx.fill();
    } else if (eyeStyle === "angry") {
      ctx.ellipse(dir * eyeX, eyeY, r * 0.13, r * 0.09, dir * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === "sad") {
      ctx.ellipse(dir * eyeX, eyeY + r * 0.04, r * 0.09, r * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.ellipse(dir * eyeX, eyeY, r * 0.11, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = eyeColor;

  if (mouth) {
    ctx.beginPath();
    ctx.ellipse(0, topY + r * 0.68, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawPumpkin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation = 0,
  glow = 14,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = glow;

  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(-r * 0.08, -r * 1.12, r * 0.16, r * 0.32);

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
  grad.addColorStop(0, "#fdba74");
  grad.addColorStop(0.55, "#f97316");
  grad.addColorStop(1, "#c2410c");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(124,45,18,0.5)";
  ctx.lineWidth = Math.max(1, r * 0.07);
  for (const sx of [-0.45, 0, 0.45]) {
    ctx.beginPath();
    ctx.ellipse(sx * r, 0, r * 0.44, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1c0a04";
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.12);
  ctx.lineTo(-r * 0.12, -r * 0.34);
  ctx.lineTo(-r * 0.14, -r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.42, -r * 0.12);
  ctx.lineTo(r * 0.12, -r * 0.34);
  ctx.lineTo(r * 0.14, -r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.36, r * 0.22);
  ctx.quadraticCurveTo(0, r * 0.62, r * 0.36, r * 0.22);
  ctx.quadraticCurveTo(r * 0.26, r * 0.4, 0, r * 0.36);
  ctx.quadraticCurveTo(-r * 0.26, r * 0.4, -r * 0.36, r * 0.22);
  ctx.fill();
  ctx.restore();
}

export function drawSkull(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#e2e8f0",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.15, r * 0.75, Math.PI, 0);
  ctx.lineTo(x + r * 0.62, y + r * 0.28);
  ctx.quadraticCurveTo(x + r * 0.6, y + r * 0.55, x + r * 0.25, y + r * 0.55);
  ctx.lineTo(x - r * 0.25, y + r * 0.55);
  ctx.quadraticCurveTo(x - r * 0.6, y + r * 0.55, x - r * 0.62, y + r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b0b1a";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.28, y - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.14);
  ctx.lineTo(x - r * 0.1, y + r * 0.3);
  ctx.lineTo(x + r * 0.1, y + r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0b0b1a";
  ctx.lineWidth = r * 0.05;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * r * 0.18, y + r * 0.44);
    ctx.lineTo(x + i * r * 0.18, y + r * 0.57);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  count = 60,
) {
  for (let i = 0; i < count; i++) {
    const x = ((i * 137.5 + time * 6) % width + width) % width;
    const y = (i * 79.3) % (height * 0.7);
    const alpha = 0.12 + ((i * 17) % 50) / 100;
    const r = 0.5 + ((i * 7) % 13) / 10;
    ctx.beginPath();
    ctx.fillStyle = i % 5 === 0 ? `rgba(103,232,249,${alpha})` : `rgba(226,232,240,${alpha})`;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#c4b5fd",
) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.8);
  glow.addColorStop(0, `${color}55`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#080812";
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.arc(x + r * 0.32, y + r * 0.25, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 0.55,
) {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(2,2,8,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
