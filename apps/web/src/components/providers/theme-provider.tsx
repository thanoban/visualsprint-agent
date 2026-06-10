"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AppTheme = "ink" | "paper" | "system";

interface ThemeContextValue {
  theme: AppTheme;
  resolvedTheme: "ink" | "paper";
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "ink" | "paper" {
  if (typeof window === "undefined") return "ink";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "paper"
    : "ink";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"ink" | "paper">("ink");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vs-theme") as AppTheme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    const html = document.documentElement;
    html.classList.add("theme-transition");
    html.setAttribute("data-theme", resolved);
    const timer = setTimeout(() => html.classList.remove("theme-transition"), 350);
    return () => clearTimeout(timer);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const listener = (e: MediaQueryListEvent) => {
      const html = document.documentElement;
      html.classList.add("theme-transition");
      setResolvedTheme(e.matches ? "paper" : "ink");
      html.setAttribute("data-theme", e.matches ? "paper" : "ink");
      const timer = setTimeout(() => html.classList.remove("theme-transition"), 350);
      return () => clearTimeout(timer);
    };
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme, mounted]);

  const setTheme = (next: AppTheme) => {
    setThemeState(next);
    localStorage.setItem("vs-theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
