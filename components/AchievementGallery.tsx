"use client";

import {
  Brain,
  Check,
  Crown,
  Ghost,
  Heart,
  Lock,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useArcadeStore } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  ghost: Ghost,
  brain: Brain,
  shield: Shield,
  crown: Crown,
  trophy: Trophy,
  heart: Heart,
};

export function AchievementGallery() {
  const unlocked = useArcadeStore((s) => s.achievements);
  const progress = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-[#0a0a18]/70 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-300/80">
            Trophy crypt
          </p>
          <h3 className="mt-1.5 font-display text-xl text-white">Achievements</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-score text-xs text-slate-400">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = unlocked.includes(achievement.id);
          const Icon = ICONS[achievement.icon] ?? Sparkles;
          return (
            <div
              key={achievement.id}
              className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                earned
                  ? "border-amber-300/25 bg-amber-400/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02]"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  earned
                    ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
                    : "border-white/10 bg-white/[0.03] text-slate-600"
                }`}
              >
                <Icon size={16} />
                {!earned && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#0a0a18] bg-[#171728] text-slate-500">
                    <Lock size={8} />
                  </span>
                )}
                {earned && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#0a0a18] bg-emerald-400 text-[#080812]">
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
              </span>
              <div>
                <p className={`text-[12.5px] font-semibold ${earned ? "text-amber-100" : "text-slate-300"}`}>
                  {achievement.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  {achievement.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
