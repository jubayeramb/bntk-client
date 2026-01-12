"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="flex items-center justify-center w-10 h-10 bg-[var(--overlay-color)] border border-[var(--border-color)] rounded-xl cursor-pointer transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {/* Sun icon - show in dark mode (click to switch to light) */}
      <span className="text-xl leading-none hidden dark:block">☀️</span>
      {/* Moon icon - show in light mode (click to switch to dark) */}
      <span className="text-xl leading-none block dark:hidden">🌙</span>
    </button>
  );
}
