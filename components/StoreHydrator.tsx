"use client";

import { useEffect } from "react";
import { useArcadeStore } from "@/lib/store";

/** Rehydrates persisted progress after mount, avoiding SSR mismatches. */
export function StoreHydrator() {
  useEffect(() => {
    let alive = true;
    const finish = () => {
      if (alive) useArcadeStore.getState().setHydrated();
    };
    try {
      const result = useArcadeStore.persist.rehydrate();
      if (result && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>).then(finish).catch(finish);
      } else {
        finish();
      }
    } catch {
      finish();
    }
    return () => {
      alive = false;
    };
  }, []);

  return null;
}
