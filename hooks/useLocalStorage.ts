"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

/** Small SSR-safe localStorage state hook. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    setValue(readJSON<T>(key, initial));
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (loaded.current) writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
