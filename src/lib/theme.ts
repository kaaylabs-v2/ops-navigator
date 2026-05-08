import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "jm-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function resolveTheme(pref: ThemePreference): Theme {
  return pref === "system" ? getSystemTheme() : pref;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePreference>(() => readStoredPreference());
  const [resolved, setResolved] = useState<Theme>(() => resolveTheme(readStoredPreference()));

  useEffect(() => {
    const t = resolveTheme(pref);
    setResolved(t);
    applyTheme(t);
  }, [pref]);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const t = getSystemTheme();
      setResolved(t);
      applyTheme(t);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pref]);

  const setPreference = useCallback((next: ThemePreference) => {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
    setPref(next);
  }, []);

  return { theme: resolved, preference: pref, setPreference };
}

export const themeBootstrapScript = `
  (function () {
    try {
      var stored = localStorage.getItem('${STORAGE_KEY}');
      var pref = stored === 'light' || stored === 'dark' ? stored : 'system';
      var theme = pref === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : pref;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (e) {
      document.documentElement.dataset.theme = 'dark';
    }
  })();
`;
