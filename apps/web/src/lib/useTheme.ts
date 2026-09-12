import { useEffect, useState } from "react";
import type { ThemePreference } from "../data/types";

export type ResolvedTheme = "light" | "dark";

export const STORAGE_KEY = "throughline-theme";
export const LEGACY_STORAGE_KEY = "lg-theme";
const THEME_COLOR = { light: "#f1ede3", dark: "#15171e" } as const;

function prefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function systemTheme(): ResolvedTheme {
  return prefersDark() ? "dark" : "light";
}

/**
 * Retrieves the stored theme preference from localStorage, checking the modern
 * "throughline-theme" key first and falling back to the legacy "lg-theme" key.
 */
export function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const modern = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (modern) {
      return modern;
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY) as ThemePreference | null;
    if (legacy) {
      return legacy;
    }
  } catch {
    // Ignore storage failures (private browsing, disabled storage).
  }
  return null;
}

/**
 * Resolves the user's theme preference to a concrete light/dark value, applies
 * it to <html data-theme>, keeps the mobile theme-color in sync, and mirrors the
 * preference to localStorage using "throughline-theme" (with "lg-theme" fallback).
 */
export function useTheme(preference?: ThemePreference): ResolvedTheme {
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

  const effectivePreference = preference ?? getStoredThemePreference() ?? "light";
  const resolved: ResolvedTheme = effectivePreference === "system" ? system : effectivePreference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_COLOR[resolved]);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, effectivePreference);
    } catch {
      // Ignore storage failures (private mode, disabled storage).
    }
  }, [resolved, effectivePreference]);

  return resolved;
}
