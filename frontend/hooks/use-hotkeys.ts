"use client";

import { useEffect, useCallback } from "react";
import { HotkeyConfig } from "@/app/types";



export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        const ctrlKey = hotkey.ctrlKey ?? false;
        const metaKey = hotkey.metaKey ?? false;
        const shiftKey = hotkey.shiftKey ?? false;
        const altKey = hotkey.altKey ?? false;

        if (
          event.key === hotkey.key &&
          event.ctrlKey === ctrlKey &&
          event.metaKey === metaKey &&
          event.shiftKey === shiftKey &&
          event.altKey === altKey
        ) {
          event.preventDefault();
          hotkey.callback();
          break;
        }
      }
    },
    [hotkeys],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

