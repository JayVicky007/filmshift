"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const movieCategories = [
  "Hollywood",
  "British Cinema",
  "European Cinema",
  "Bollywood",
  "Nollywood",
  "East Asian Cinema",
  "Animation",
  "Anime",
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [moviesOpen, setMoviesOpen] = useState(false);
  const moviesMenuRef = useRef<HTMLDivElement>(null);
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!moviesOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!moviesMenuRef.current?.contains(event.target as Node)) {
        setMoviesOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoviesOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moviesOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = query.trim();

    if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  return (
    <header
      className={`z-50 w-full border-b shadow-[0_1px_0_rgba(0,0,0,0.04)] ${
        isHomePage
          ? "absolute left-4 right-4 top-0 w-auto rounded-t-[2rem] border-transparent bg-slate-950/45 backdrop-blur-[2px] sm:left-8 sm:right-8"
          : "sticky top-0 border-text-muted/10 bg-background/75 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-foreground transition-colors hover:text-accent md:text-3xl">
          <span>Film</span><span className="text-accent">Shift</span>
        </Link>

        <nav className="ml-auto mr-1 flex items-center gap-4 text-sm font-semibold text-text-muted md:mr-2 md:gap-7">
          <div ref={moviesMenuRef} className="relative">
            <button
              type="button"
              aria-expanded={moviesOpen}
              aria-controls="movie-categories"
              onClick={() => setMoviesOpen((open) => !open)}
              className="inline-flex items-center gap-1 transition-colors hover:text-accent"
            >
              Movies
              <ChevronDown className={`h-4 w-4 transition-transform ${moviesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            {moviesOpen && (
              <div
                id="movie-categories"
                role="menu"
                className="absolute right-0 top-full z-50 mt-4 grid w-64 gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
              >
                {movieCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/search?q=${encodeURIComponent(category)}`}
                    role="menuitem"
                    onClick={() => setMoviesOpen(false)}
                    className="rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="#trending" className="hidden transition-colors hover:text-accent sm:inline">Series</Link>
          <Link href="#trending" className="hidden transition-colors hover:text-accent md:inline">Animation</Link>
          <Link href="/login" className="transition-colors hover:text-accent">Login</Link>
        </nav>

        <div className="mr-2 flex items-center gap-2 md:mr-3">
          {searchOpen && (
            <form onSubmit={handleSearchSubmit} className="relative">
              <label className="sr-only" htmlFor="nav-search">Search</label>
              <input
                id="nav-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                autoFocus
                className="w-28 rounded-full border border-text-muted/20 bg-surface py-2 pl-3 pr-3 text-sm text-foreground shadow-inner shadow-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 sm:w-36"
              />
            </form>
          )}
          <button
            type="button"
            aria-label={searchOpen ? "Close search" : "Open search"}
            onClick={() => setSearchOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-accent"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <ThemeToggle
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent"
          />
        </div>
      </div>
    </header>
  );
}
