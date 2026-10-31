"use client";

import {
  BookOpen,
  MousePointerClick,
  PlayCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AchievementGallery } from "./AchievementGallery";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Choose a game",
    text: "Browse the collection, filter by mood, and follow the glowing portal.",
  },
  {
    icon: BookOpen,
    title: "Read the controls",
    text: "Every room lists its rules, keys, and touch controls before you start.",
  },
  {
    icon: PlayCircle,
    title: "Start playing",
    text: "Press start, then survive. Pause any time — the spirits are patient.",
  },
  {
    icon: Trophy,
    title: "Beat your high score",
    text: "Scores save to this browser automatically. No account required.",
  },
  {
    icon: Sparkles,
    title: "Unlock achievements",
    text: "Seven trophies hide in the arcade. Play everything to claim them all.",
  },
];

export function HowToPlay() {
  return (
    <section id="how-to" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
      <div className="pointer-events-none absolute inset-x-8 top-1/3 h-64 rounded-full bg-violet-700/10 blur-[120px]" />

      <Reveal>
        <SectionHeading
          eyebrow="The ritual"
          title={
            <>
              How to <span className="gradient-text">play</span>
            </>
          }
          description="Five small steps between you and the other side. There is no login, no download, and no escape clause."
          align="center"
        />
      </Reveal>

      <div className="relative mt-12">
        <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="group relative h-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors hover:border-violet-400/30 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/25 bg-[#0d0d20] text-violet-300 shadow-[0_0_20px_-8px_rgba(139,92,246,0.8)]">
                      <Icon size={18} />
                    </span>
                    <span className="font-score text-2xl font-bold text-white/[0.07]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[15px] font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{step.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      <AchievementGallery />
    </section>
  );
}
