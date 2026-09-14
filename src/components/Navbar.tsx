"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearchChange(value: string) {
    setQuery(value);

    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/");
    }
  }

  return (
    <header className="w-full sticky top-0 z-50 border-b border-text-muted/10 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-xl font-black tracking-tight text-foreground transition-colors hover:text-accent">
          FilmShift
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <input
            type="text"
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search movies"
            aria-label="Search movies"
            className="w-64 rounded-full border border-text-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground shadow-inner shadow-black/5 transition-all duration-200 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 md:w-80"
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
