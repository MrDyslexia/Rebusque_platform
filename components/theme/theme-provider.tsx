"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = React.createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "dark",
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "rebusque-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("dark");
  const [mounted, setMounted] = React.useState(false);

  const applyTheme = React.useCallback((next: Theme) => {
    const root = window.document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = next === "system" ? (systemDark ? "dark" : "light") : next;

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, []);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as Theme | null;
    const initial = stored ?? defaultTheme;
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);

    const listener = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [storageKey, defaultTheme, applyTheme, theme]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      window.localStorage.setItem(storageKey, next);
      setThemeState(next);
      applyTheme(next);
    },
    [storageKey, applyTheme],
  );

  if (!mounted) {
    return (
      <ThemeProviderContext.Provider value={{ theme: defaultTheme, setTheme: () => {}, resolvedTheme: "dark" }}>
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeProviderContext);
}
