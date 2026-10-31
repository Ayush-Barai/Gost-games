"use client";

import { useArcadeStore } from "./store";

/**
 * Tiny synthesized sound engine. No audio files are shipped, so the arcade
 * stays lightweight and every sound works offline.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOptions {
  freq: number;
  to?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
}

function tone({
  freq,
  to,
  duration = 0.12,
  type = "sine",
  volume = 0.06,
  delay = 0,
}: ToneOptions) {
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to && to !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function play(notes: ToneOptions[]) {
  if (!useArcadeStore.getState().soundOn) return;
  notes.forEach(tone);
}

export const sfx = {
  click: () => play([{ freq: 520, to: 660, duration: 0.06, type: "triangle", volume: 0.04 }]),
  hover: () => play([{ freq: 880, duration: 0.03, type: "sine", volume: 0.015 }]),
  start: () =>
    play([
      { freq: 392, to: 523, duration: 0.12, type: "triangle", volume: 0.05 },
      { freq: 659, duration: 0.18, type: "sine", volume: 0.04, delay: 0.1 },
    ]),
  catch: () => play([{ freq: 660, to: 990, duration: 0.09, type: "triangle", volume: 0.05 }]),
  golden: () =>
    play([
      { freq: 880, duration: 0.07, type: "triangle", volume: 0.05 },
      { freq: 1175, duration: 0.12, type: "triangle", volume: 0.05, delay: 0.07 },
      { freq: 1568, duration: 0.16, type: "sine", volume: 0.04, delay: 0.15 },
    ]),
  bomb: () =>
    play([{ freq: 180, to: 48, duration: 0.28, type: "sawtooth", volume: 0.08 }]),
  flip: () => play([{ freq: 420, to: 560, duration: 0.05, type: "square", volume: 0.025 }]),
  match: () =>
    play([
      { freq: 659, duration: 0.08, type: "triangle", volume: 0.05 },
      { freq: 988, duration: 0.14, type: "triangle", volume: 0.04, delay: 0.08 },
    ]),
  wrong: () => play([{ freq: 220, to: 160, duration: 0.16, type: "sawtooth", volume: 0.035 }]),
  jump: () => play([{ freq: 300, to: 620, duration: 0.14, type: "sine", volume: 0.045 }]),
  point: () => play([{ freq: 784, to: 1046, duration: 0.1, type: "sine", volume: 0.045 }]),
  hit: () => play([{ freq: 140, to: 70, duration: 0.2, type: "square", volume: 0.05 }]),
  shoot: () => play([{ freq: 900, to: 420, duration: 0.07, type: "square", volume: 0.025 }]),
  tick: () => play([{ freq: 1200, duration: 0.035, type: "square", volume: 0.015 }]),
  win: () =>
    play([
      { freq: 523, duration: 0.12, type: "triangle", volume: 0.05 },
      { freq: 659, duration: 0.12, type: "triangle", volume: 0.05, delay: 0.11 },
      { freq: 784, duration: 0.12, type: "triangle", volume: 0.05, delay: 0.22 },
      { freq: 1046, duration: 0.3, type: "sine", volume: 0.05, delay: 0.33 },
    ]),
  lose: () =>
    play([
      { freq: 330, to: 220, duration: 0.22, type: "sawtooth", volume: 0.045 },
      { freq: 220, to: 110, duration: 0.34, type: "sawtooth", volume: 0.045, delay: 0.18 },
    ]),
  achievement: () =>
    play([
      { freq: 784, duration: 0.1, type: "triangle", volume: 0.05 },
      { freq: 988, duration: 0.1, type: "triangle", volume: 0.05, delay: 0.09 },
      { freq: 1318, duration: 0.28, type: "sine", volume: 0.045, delay: 0.18 },
    ]),
};

export type SfxName = keyof typeof sfx;
