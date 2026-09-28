"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, User, PenSquare, LogOut, Menu, X } from "lucide-react";
import type { SearchSuggestion } from "@/utils/movieService";
import { createClient } from "@/utils/supabase/client";
import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";


const movieCategories = [
  "Hollywood",
  "British",
  "European",
  "Bollywood",
  "Nollywood",
  "East Asian",
  "Animation",
  "Anime",
];

const seriesCategories = [
  "American",
  "British",
  "European",
  "Indian",
  "East Asian",
  "African",
];

const animationCategories = [
  "American",
  "European",
  "Japanese Anime",
  "Chinese Donghua",
  "Korean Animation",
  "African Animation",
];

type OpenMenu = "movies" | "series" | "animation" | null;

// {/* 🚀 CategoryMenu component header */}
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile dropdown when tapping outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div 
      ref={menuRef}
      className={`relative group/menu py-2 ${className}`}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-0.5 transition-colors hover:text-accent cursor-pointer text-sm font-semibold"
      >
        {label && <span>{label}</span>}
        <ChevronDown className="h-4 w-4 transition-transform group-hover/menu:rotate-180 opacity-60" aria-hidden="true" />
      </button>
      
      <div
        id={menuId}
        role="menu"
        className={`absolute left-0 top-full z-50 mt-1 grid w-64 gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.18)] 
        transition-all duration-150 ease-out
        ${isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1 md:group-hover/menu:visible md:group-hover/menu:opacity-100 md:group-hover/menu:translate-y-0"}`}
      >
        {categories.map((category) => (
          <Link
            key={category}
            href={`/search?q=${encodeURIComponent(category)}`}
            role="menuitem"
            onClick={() => setIsOpen(false)}
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile tracking state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const isHomePage = pathname === "/";

  // Automatically collapse the navigation sheet whenever the router switches views
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSuggesting(false);
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
      ref={navRef}
      className={`z-50 w-full transition-all duration-200 ${
        isHomePage
          ? "absolute left-0 right-0 top-0 border-transparent bg-transparent"
          : "sticky top-0 border-b border-text-muted/10 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        
        {/* Left Control Cluster: Brand & Desktop Links */}
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <Link href="/" className={`text-2xl font-black tracking-tight transition-colors hover:text-accent md:text-3xl shrink-0 ${isHomePage ? "text-white" : "text-foreground"}`}>
            <span>Film</span><span className="text-accent">Shift</span>
          </Link>

          {/* Desktop Only Navigation Links */}
          <nav className={`hidden md:flex items-center gap-6 text-sm font-semibold ${isHomePage ? "text-white/90" : "text-text-muted"}`}>
            <div className="flex items-center gap-1">
              <Link href="/movies" className="transition-colors hover:text-accent">Movies</Link>
              <CategoryMenu label="" menuId="movie-categories" categories={movieCategories} className="!py-0" />
            </div>

            <div className="flex items-center gap-1">
              <Link href="/tv" className="transition-colors hover:text-accent">TV Series</Link>
              <CategoryMenu label="" menuId="series-categories" categories={seriesCategories} className="!py-0" />
            </div>

            <Link href="/blog" className="transition-colors hover:text-accent">Blog</Link>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3 text-sm font-semibold pl-2 shrink-0">
          
          {/* Integrated Search Trigger */}
          <div 
            ref={searchContainerRef}
            className="flex items-center gap-2"
            onBlur={(event) => {
              if (!searchContainerRef.current?.contains(event.relatedTarget as Node)) {
                setSuggestions([]);
              }
            }}
          >
            {searchOpen && (
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  id="nav-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  autoFocus
                  className="w-24 rounded-full border border-text-muted/20 bg-surface py-2 px-3 text-sm text-foreground shadow-inner focus:outline-none focus:ring-2 focus:ring-accent/80 sm:w-36"
                />
                <SearchSuggestions
                  suggestions={suggestions}
                  isLoading={isSuggesting}
                  className="absolute right-0 top-full z-50 mt-2 w-64 sm:w-72"
                  onSelect={(suggestion) => {
                    setSuggestions([]);
                    setQuery("");
                    setSearchOpen(false);
                    const routeType = suggestion.rawMediaType === "tv" ? "tv" : "movie";
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

          {/* User Desktop Menu Hook */}
          <div className="hidden md:flex items-center gap-3">
            {userEmail ? (
              <div className="relative group/menu py-2">
                <button type="button" className={`inline-flex max-w-28 items-center gap-2 truncate transition-colors hover:text-accent cursor-pointer ${isHomePage ? "text-white/90" : "text-text-muted"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${isHomePage ? "border-white/30 bg-white/10" : "border-text-muted/20 bg-surface"}`}>
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold">{accountInitial}</span>}
                  </span>
                  <span className="truncate">{accountLabel}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-hover/menu:rotate-180" aria-hidden="true" />
                </button>
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 flex w-44 flex-col gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-xl invisible opacity-0 translate-y-1 group-hover/menu:visible group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all duration-150 ease-out">
                  <Link href="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent/10 hover:text-accent"><User className="h-4 w-4 opacity-70" /><span>My Profile</span></Link>
                  <Link href="/write" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent/10 hover:text-accent"><PenSquare className="h-4 w-4 opacity-70" /><span>Write Post</span></Link>
                  <hr className="my-1 border-text-muted/10" />
                  <button type="button" onClick={handleSignOut} className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"><LogOut className="h-4 w-4 opacity-70" /><span>Sign Out</span></button>
                </div>
              </div>
            ) : (
              <Link href="/login" className={`transition-colors hover:text-accent ${isHomePage ? "text-white/90" : "text-text-muted"}`}>Login</Link>
            )}
          </div>

          {/* Core Theme Toggle Icon */}
          <ThemeToggle className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent cursor-pointer ${isHomePage ? "border-white/25 bg-black/20 text-white" : "border-text-muted/20 bg-surface text-foreground"}`} />

          {/* Responsive Hamburger Toggle Button */}
          <button
            type="button"
            aria-label="Toggle mobile menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden transition-colors hover:text-accent cursor-pointer ${isHomePage ? "text-white" : "text-foreground"}`}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* FULL WIDTH DROP-DOWN DRAWER OVERLAY FOR MOBILE VIEWPORTS */}
      {isMobileMenuOpen && (
        <div className="w-full bg-surface border-b border-text-muted/15 shadow-xl md:hidden animate-search-placeholder">
          <nav className="flex flex-col p-4 gap-2 font-semibold text-foreground">
            
            {/* Movies Block */}
            <div className="border-b border-text-muted/10 pb-2">
              <div className="flex items-center justify-between py-2">
                <Link href="/movies" className="text-base text-accent">Movies Index →</Link>
                <CategoryMenu label="Browse Genres" menuId="mobile-movie-cats" categories={movieCategories} />
              </div>
            </div>

            {/* TV Series Block - NOW FULLY VISIBLE ON MOBILE */}
            <div className="border-b border-text-muted/10 pb-2">
              <div className="flex items-center justify-between py-2">
                <Link href="/tv" className="text-base text-accent">TV Series Index →</Link>
                <CategoryMenu label="Browse Genres" menuId="mobile-series-cats" categories={seriesCategories} />
              </div>
            </div>

            {/* Blog Link Row */}
            <Link href="/blog" className="py-3 border-b border-text-muted/10 text-base hover:text-accent transition-colors">
              The Journal (Blog)
            </Link>

            {/* Authenticated Account Profile Links Row */}
            {userEmail ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs text-text-muted uppercase tracking-wider px-1 font-bold">User Dashboard</div>
                <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-background text-sm"><User size={16} />My Profile</Link>
                <Link href="/write" className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-background text-sm"><PenSquare size={16} />Write Post</Link>
                <button type="button" onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-rose-500/10 text-rose-400 text-sm text-left w-full mt-1"><LogOut size={16} />Sign Out</button>
              </div>
            ) : (
              <Link href="/login" className="mt-2 text-center rounded-xl bg-accent py-3 font-bold text-slate-950 transition-colors">Login to Account</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
          
