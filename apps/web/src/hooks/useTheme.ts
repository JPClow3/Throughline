import { useEffect, useState } from "react";
import type { ThemePreference } from "../data/types";

export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "lg-theme";
const THEME_COLOR = { light: "#eef1f6", dark: "#1b1d23" } as const;

function prefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function systemTheme(): ResolvedTheme {
  return prefersDark() ? "dark" : "light";
}

/**
 * Resolves the user's theme preference to a concrete light/dark value, applies
 * it to <html data-theme>, keeps the mobile theme-color in sync, and mirrors the
 * preference to localStorage so the pre-paint script in index.html avoids a flash.
 */
export function useTheme(preference: ThemePreference = "system"): ResolvedTheme {
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme = preference === "system" ? system : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_COLOR[resolved]);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Ignore storage failures (private mode, disabled storage).
    }
  }, [resolved, preference]);

  return resolved;
}
