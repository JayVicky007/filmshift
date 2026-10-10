"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, User, PenSquare, LogOut, Menu, X } from "lucide-react";
import type { SearchSuggestion } from "@/utils/movieService";
import { contentCollections, type CollectionMediaType } from "@/utils/contentCollections";
import { createClient } from "@/utils/supabase/client";
import SearchSuggestions from "./SearchSuggestions";
import ThemeToggle from "./ThemeToggle";


const getCollectionLinks = (mediaType: CollectionMediaType) =>
  contentCollections
    .filter((collection) => collection.mediaType === mediaType)
    .map((collection) => ({
      label: collection.label,
      href: `/collections/${mediaType}/${collection.slug}`,
    }));

// {/* 🚀 CategoryMenu component header */}
function CategoryMenu({
  label,
  menuId,
  collections,
  className = "",
}: {
  label: string;
  menuId: string;
  collections: Array<{ label: string; href: string }>;
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
        {collections.map((collection) => (
          <Link
            key={collection.href}
            href={collection.href}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {collection.label}
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
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionsQuery, setSuggestionsQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // 🚀 Place this near the top of your Navbar function along with username/avatarUrl
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const isHomePage = pathname === "/";
  const isMobileMenuOpen = mobileMenuPath === pathname;

  useEffect(() => {
    let isCurrent = true;
    const supabase = createClient();

    async function loadUserProfile(userId: string | null, email: string | null) {
      if (!userId) {
        setActiveUserId(null);
        setUnreadNotificationCount(0);
        setUserEmail(null);
        setUsername(null);
        setDisplayName(null);
        setAvatarUrl(null);
        setIsAdmin(false);
        return;
      }
      setActiveUserId(userId);
      setIsAdmin(false);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Unable to load navbar profile:", error.message);
      }

      if (isCurrent) {
        setUserEmail(email);
        setUsername(profile?.username ?? null);
        setDisplayName(profile?.display_name ?? null);
        setAvatarUrl(profile?.avatar_url ?? null);
        setIsAdmin(profile?.role === "admin");
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
    if (!activeUserId) return;

    let isCurrent = true;
    const supabase = createClient();

    async function refreshUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", activeUserId)
        .is("read_at", null);

      if (error) {
        console.error("Unable to load unread notifications:", error.message);
        return;
      }
      if (isCurrent) setUnreadNotificationCount(count ?? 0);
    }

    const refresh = () => void refreshUnreadCount();
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("filmshift-notifications-updated", refresh);
    const intervalId = window.setInterval(refresh, 60_000);

    return () => {
      isCurrent = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("filmshift-notifications-updated", refresh);
      window.clearInterval(intervalId);
    };
  }, [activeUserId]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (!searchOpen || searchTerm.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSuggesting(true);
      fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: { results?: SearchSuggestion[] }) => {
          setSuggestions(data.results ?? []);
          setSuggestionsQuery(searchTerm);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setSuggestionsQuery(searchTerm);
          }
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

  const accountLabel = displayName || username || userEmail?.split("@")[0] || "Account";
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
              <CategoryMenu label="" menuId="movie-categories" collections={getCollectionLinks("movie")} className="!py-0" />
            </div>

            <div className="flex items-center gap-1">
              <Link href="/tv" className="transition-colors hover:text-accent">TV Series</Link>
              <CategoryMenu label="" menuId="series-categories" collections={getCollectionLinks("tv")} className="!py-0" />
            </div>

            <Link href="/blog" className="transition-colors hover:text-accent">The Journal</Link>
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-accent">Admin</Link>
            )}
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
                  suggestions={suggestionsQuery === query.trim() && query.trim().length >= 2 ? suggestions : []}
                  isLoading={isSuggesting && query.trim().length >= 2}
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

          {userEmail && (
            <Link
              href="/notifications"
              aria-label={`Notifications, ${unreadNotificationCount} unread`}
              className={`relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-accent md:inline-flex ${isHomePage ? "text-white/90" : "text-text-muted"}`}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-slate-950">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </Link>
          )}

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
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 flex w-56 flex-col gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-xl invisible opacity-0 translate-y-1 group-hover/menu:visible group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all duration-150 ease-out">
                  <Link
                    href="/profile"
                    title={username ?? undefined}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent/10 hover:text-accent"
                  >
                    <User className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{username || "My Profile"}</span>
                  </Link>
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
            onClick={() => setMobileMenuPath(isMobileMenuOpen ? null : pathname)}
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
                <CategoryMenu label="Browse Collections" menuId="mobile-movie-cats" collections={getCollectionLinks("movie")} />
              </div>
            </div>

            {/* TV Series Block - NOW FULLY VISIBLE ON MOBILE */}
            <div className="border-b border-text-muted/10 pb-2">
              <div className="flex items-center justify-between py-2">
                <Link href="/tv" className="text-base text-accent">TV Series Index →</Link>
                <CategoryMenu label="Browse Collections" menuId="mobile-series-cats" collections={getCollectionLinks("tv")} />
              </div>
            </div>

            {/* Journal Link Row */}
            <Link href="/blog" className="py-3 border-b border-text-muted/10 text-base hover:text-accent transition-colors">
              The Journal
            </Link>
            {isAdmin && (
              <Link href="/admin" className="py-3 border-b border-text-muted/10 text-base text-accent transition-colors hover:text-yellow-300">
                Admin dashboard
              </Link>
            )}

            {/* Authenticated Account Profile Links Row */}
            {userEmail ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs text-text-muted uppercase tracking-wider px-1 font-bold">User Dashboard</div>
                <Link
                  href="/profile"
                  title={username ?? undefined}
                  className="flex min-w-0 items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm"
                >
                  <User size={16} className="shrink-0" />
                  <span className="truncate">{username || "My Profile"}</span>
                </Link>
                <Link href="/notifications" className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-background text-sm">
                  <span className="flex items-center gap-2"><Bell size={16} />Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-slate-950">
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </Link>
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
          
