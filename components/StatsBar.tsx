"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CloudOff, Gamepad2, LayoutGrid, Sparkles } from "lucide-react";

const STATS = [
  { value: 20, suffix: "", label: "Mini Games", icon: Gamepad2, color: "#8B5CF6" },
  { value: 4, suffix: "", label: "Game Categories", icon: LayoutGrid, color: "#22D3EE" },
  { value: 0, suffix: "", label: "Downloads Required", icon: CloudOff, color: "#F472B6" },
  { value: 100, suffix: "%", label: "Free to Play", icon: Sparkles, color: "#FBBF24" },
];

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
        const target = Number(node.dataset.count);
        if (reduced) {
          node.textContent = target.toLocaleString();
          return;
        }
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            node.textContent = Math.round(counter.value).toLocaleString();
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section aria-label="Arcade statistics" className="relative z-10 mx-auto -mt-2 w-full max-w-7xl px-5 sm:px-8">
      <div
        ref={ref}
        className="glass inset-glow grid grid-cols-2 divide-white/[0.07] rounded-2xl sm:grid-cols-4 sm:divide-x"
      >
        {STATS.map(({ value, suffix, label, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3.5 px-5 py-5 sm:px-6">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: `${color}33`, background: `${color}12`, color }}
            >
              <Icon size={18} />
            </span>
            <div>
              <div className="font-score text-xl font-bold text-white sm:text-2xl">
                <span data-count={value}>0</span>
                {suffix}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
