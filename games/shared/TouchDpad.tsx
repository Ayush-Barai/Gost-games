"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

export function TouchDpad({
  onMove,
  className = "",
}: {
  onMove: (dx: number, dy: number) => void;
  className?: string;
}) {
  const press = (dx: number, dy: number) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onMove(dx, dy);
  };
  const base =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#12122a]/90 text-slate-200 shadow-lg backdrop-blur active:bg-violet-500/30 active:border-violet-400/60 select-none touch-none";
  return (
    <div className={`absolute bottom-4 right-4 z-20 grid grid-cols-3 gap-1.5 md:hidden ${className}`}>
      <span />
      <button type="button" className={base} onPointerDown={press(0, -1)} aria-label="Move up">
        <ChevronUp size={18} />
      </button>
      <span />
      <button type="button" className={base} onPointerDown={press(-1, 0)} aria-label="Move left">
        <ChevronLeft size={18} />
      </button>
      <span className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <span className="h-1 w-1 rounded-full bg-violet-400/60" />
      </span>
      <button type="button" className={base} onPointerDown={press(1, 0)} aria-label="Move right">
        <ChevronRight size={18} />
      </button>
      <span />
      <button type="button" className={base} onPointerDown={press(0, 1)} aria-label="Move down">
        <ChevronDown size={18} />
      </button>
      <span />
    </div>
  );
}
