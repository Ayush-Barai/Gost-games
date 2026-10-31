"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check, Sparkles } from "lucide-react";
import { ACHIEVEMENT_MAP } from "@/lib/achievements";
import { useArcadeStore, type AchievementToast } from "@/lib/store";
import { sfx } from "@/lib/audio";

function ToastItem({ toast }: { toast: AchievementToast }) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useArcadeStore((s) => s.dismissToast);
  const achievement = ACHIEVEMENT_MAP[toast.achievementId];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sfx.achievement();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline();
    if (!reduced) {
      tl.fromTo(
        el,
        { x: 60, opacity: 0, scale: 0.96 },
        { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" },
      ).to(el, { x: 40, opacity: 0, duration: 0.4, delay: 4.4, ease: "power2.in" });
    } else {
      tl.to(el, { opacity: 0, duration: 0.3, delay: 4.6 });
    }
    tl.call(() => dismiss(toast.key));
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!achievement) return null;

  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-amber-300/25 bg-[#12101f]/95 p-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/30 bg-amber-400/10 text-amber-200">
        <Sparkles size={17} />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[#080812]">
          <Check size={9} strokeWidth={3} />
        </span>
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/80">
          Achievement unlocked
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-white">{achievement.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{achievement.description}</p>
      </div>
    </div>
  );
}

export function AchievementToastHost() {
  const toasts = useArcadeStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[110] flex w-[min(92vw,340px)] flex-col gap-2">
      {toasts.slice(0, 3).map((toast) => (
        <ToastItem key={toast.key} toast={toast} />
      ))}
    </div>
  );
}
