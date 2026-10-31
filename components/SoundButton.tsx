"use client";

import { Volume2, VolumeX } from "lucide-react";
import { sfx } from "@/lib/audio";
import { useArcadeStore } from "@/lib/store";

export function SoundButton() {
  const soundOn = useArcadeStore((s) => s.soundOn);
  const toggleSound = useArcadeStore((s) => s.toggleSound);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !soundOn;
        toggleSound();
        if (next) window.setTimeout(() => sfx.click(), 10);
      }}
      className="icon-btn !h-9 !w-9"
      aria-label={soundOn ? "Mute sound" : "Enable sound"}
      title={soundOn ? "Mute sound" : "Enable sound"}
    >
      {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  );
}
