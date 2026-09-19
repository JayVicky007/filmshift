"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { SearchSuggestion } from "@/utils/movieService";
import { createClient } from "@/utils/supabase/client";
import SearchSuggestions from "./SearchSuggestions";
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

const seriesCategories = [
  "American Series",
  "British Series",
  "European Series",
  "Indian Series",
  "East Asian Series",
  "Latin American Series",
  "Turkish Series",
  "African Series",
];

const animationCategories = [
  "American Animation",
  "European Animation",
  "Japanese Anime",
  "Chinese Donghua",
  "Korean Animation",
  "Indian Animation",
  "Latin American Animation",
  "African Animation",
];

type OpenMenu = "movies" | "series" | "animation" | null;


function CategoryMenu({
  label,
  menuId,
  categories,
  className = "",
}: {
  label: string;
  menuId: string;
  categories: string[];
  className?: string;
}) {
  return (
    /* 🚀 group/menu enables hover triggers. invisible/opacity-0 handles fluid fade entries! */
    <div className={`relative group/menu py-2 ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-controls={menuId}
        className="inline-flex items-center gap-1 transition-colors hover:text-accent cursor-pointer"
      >
        {label}
        <ChevronDown className="h-4 w-4 transition-transform group-hover/menu:rotate-180" aria-hidden="true" />
      </button>
      
      <div
        id={menuId}
        role="menu"
        className="absolute left-0 top-full z-50 mt-1 grid w-64 gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.18)] 
        invisible opacity-0 translate-y-1 group-hover/menu:visible group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all duration-150 ease-out"
      >
        {categories.map((category) => (
          <Link
            key={category}
            href={`/search?q=${encodeURIComponent(category)}`}
            role="menuitem"
            className="rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}


export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const navRef = useRef<HTMLElement>(null);
  const isHomePage = pathname === "/";

  useEffect(() => {
    let isCurrent = true;
    const supabase = createClient();

    async function loadUserProfile(userId: string | null, email: string | null) {
      if (!userId) {
        setUserEmail(null);
        setUsername(null);
        setAvatarUrl(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (isCurrent) {
        setUserEmail(email);
        setUsername(profile?.username ?? null);
        setAvatarUrl(profile?.avatar_url ?? null);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadUserProfile(data.user?.id ?? null, data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUserProfile(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      isCurrent = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    const searchTerm = query.trim();

    if (!searchOpen || searchTerm.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSuggesting(true);
      fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: { results?: SearchSuggestion[] }) => setSuggestions(data.results ?? []))
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSuggesting(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, searchOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = query.trim();

    if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.refresh();
  }

  const accountLabel = username || userEmail?.split("@")[0] || "Account";
  const accountInitial = accountLabel.charAt(0).toUpperCase();


  return (
    <header
      className={`z-50 w-full transition-all duration-200 ${
        isHomePage
          /* 🚀 ULTIMATE CLEANUP: Removed all backgrounds, blurs, borders, and shadows! 
             The navbar items will now float gracefully directly over your hero movie poster artwork. */
          ? "absolute left-0 right-0 top-0 border-transparent bg-transparent"
          : "sticky top-0 border-b border-text-muted/10 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* 🚀 Changed px-6 to px-4 or px-8 on larger viewports to match page margins perfectly and prevent text clashing */}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 sm:px-8">
        
        {/* 1. Main Application Brand Title */}
        <Link href="/" className={`text-2xl font-black tracking-tight transition-colors hover:text-accent md:text-3xl shrink-0 ${isHomePage ? "text-white" : "text-foreground"}`}>
          <span>Film</span><span className="text-accent">Shift</span>
        </Link>

        {/* 2. Main Navigation Block (Shifted Left!) */}
        <nav className={`flex flex-1 items-center gap-5 text-sm font-semibold ${isHomePage ? "text-white/90" : "text-text-muted"}`}>
          <CategoryMenu
            label="Movies"
            menuId="movie-categories"
            categories={movieCategories}
          />
          <CategoryMenu
            label="Series"
            menuId="series-categories"
            categories={seriesCategories}
            className="hidden sm:block"
          />
          <CategoryMenu
            label="Animation"
            menuId="animation-categories"
            categories={animationCategories}
            className="hidden md:block"
          />
          <Link href="/blog" className="hidden transition-colors hover:text-accent sm:inline">Blog</Link>

          {/* 🔍 Search Input Layout Layer */}
          <div className="ml-1 flex items-center gap-2">
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
                  className="w-24 rounded-full border border-text-muted/20 bg-surface py-2 pl-3 pr-3 text-sm text-foreground shadow-inner shadow-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/80 sm:w-32"
                />
                <SearchSuggestions
                  suggestions={suggestions}
                  isLoading={isSuggesting}
                  onSelect={(suggestion) => {
                    setSuggestions([]);
                    setQuery("");
                    setSearchOpen(false);
                    const mediaTypeNormalized = suggestion.mediaType?.toLowerCase() || "";
                    const routeType = mediaTypeNormalized.includes("tv") || mediaTypeNormalized.includes("series") ? "tv" : "movie";
                    router.push(`/${routeType}/${suggestion.id}`);
                  }}
                />
              </form>
            )}
            <button
              type="button"
              aria-label={searchOpen ? "Close search" : "Open search"}
              onClick={() => {
                setSearchOpen((open) => !open);
                setSuggestions([]);
              }}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-accent cursor-pointer ${isHomePage ? "text-white" : "text-foreground"}`}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* 3. Account Settings and Mode Actions Block */}
        {/* 🚀 Changed gap-4 to gap-3 to pull the toggle slightly inward with crisp internal margins */}
        <div className="ml-auto flex items-center gap-3 text-sm font-semibold pr-1">
          {userEmail ? (
            <>
              <Link
                href="/profile"
                className={`inline-flex max-w-28 items-center gap-2 truncate transition-colors hover:text-accent ${isHomePage ? "text-white/90" : "text-text-muted"}`}
                title={accountLabel}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${isHomePage ? "border-white/30 bg-white/10" : "border-text-muted/20 bg-surface"}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{accountInitial}</span>
                  )}
                </span>
                <span className="hidden truncate sm:inline">{accountLabel}</span>
              </Link>
              <Link href="/write" className={`transition-colors hover:text-accent ${isHomePage ? "text-white/90" : "text-text-muted"}`}>Write</Link>
              <button type="button" onClick={handleSignOut} className={`transition-colors hover:text-accent cursor-pointer ${isHomePage ? "text-white/90" : "text-text-muted"}`}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className={`transition-colors hover:text-accent ${isHomePage ? "text-white/90" : "text-text-muted"}`}>Login</Link>
          )}

          <ThemeToggle
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent cursor-pointer ${isHomePage ? "border-white/25 bg-black/20 text-white" : "border-text-muted/20 bg-surface text-foreground"}`}
          />
        </div>

      </div>
    </header>
  );
}
