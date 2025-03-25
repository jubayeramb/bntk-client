"use client";

import { useTheme } from "next-themes";
import { Button } from "@bntk/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="opacity-0" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full w-10 h-10"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 text-slate-300" />
      ) : (
        <Sun className="h-5 w-5 text-slate-600" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
