"use client";

import { useEffect, useRef } from "react";
import { useRafLoop } from "./useKeyboardControls";

export type CanvasRenderer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dt: number,
  elapsed: number,
) => void;

/**
 * Responsive canvas with DPR-aware sizing and a RAF loop that stops when the
 * game is not playing. The render callback is always fresh via a ref.
 */
export function useGameCanvas(render: CanvasRenderer, active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const renderRef = useRef(render);
  renderRef.current = render;
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    window.addEventListener("orientationchange", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  useEffect(() => {
    if (active) startRef.current = 0;
  }, [active]);

  useRafLoop((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { w, h } = sizeRef.current;
    if (!ctx || w === 0 || h === 0) return;
    if (!startRef.current) startRef.current = performance.now();
    const elapsed = (performance.now() - startRef.current) / 1000;
    renderRef.current(ctx, w, h, dt, elapsed);
  }, active);

  return canvasRef;
}
