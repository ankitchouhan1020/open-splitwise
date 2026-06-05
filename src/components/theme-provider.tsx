"use client";

import {
  applyThemeToDocument,
  readStoredTheme,
  storeTheme,
  type ThemePreference,
} from "@/lib/theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const apply = useCallback((pref: ThemePreference) => {
    applyThemeToDocument(pref);
    setResolved(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  useEffect(() => {
    const stored = readStoredTheme();
    setPreferenceState(stored);
    apply(stored);
  }, [apply]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, apply]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      storeTheme(next);
      apply(next);
    },
    [apply],
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
