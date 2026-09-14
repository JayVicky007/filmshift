"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent"
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
