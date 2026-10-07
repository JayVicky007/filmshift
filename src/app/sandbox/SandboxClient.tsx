'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Search, User, PenSquare, LogOut, Menu, X, Sun, Moon } from "lucide-react";

// ==========================================
// 🍿 MOCK DATABASE DATA FROM ORIGINAL SNIPPET
// ==========================================
const mockSearchResults = [
  { id: 27205, title: "Inception", poster_path: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg", release_date: "2010-07-15", vote_average: 8.4 },
  { id: 157336, title: "Interstellar", poster_path: "/gEU2QniE6E77NIvHGvPbgDcwtgC.jpg", release_date: "2014-11-05", vote_average: 8.4 },
  { id: 11324, title: "Shutter Island", poster_path: "/kve20wIIgZzb68g1g4jZOCjIY9g.jpg", release_date: "2010-02-14", vote_average: 8.2 },
  { id: 49051, title: "The Hobbit", poster_path: "/b8568Y7Du6bM666g67v6u6gB.jpg", release_date: "2012-11-26", vote_average: 7.7 },
  { id: 120, title: "The Lord of the Rings", poster_path: "/6oom6Q72z6r7J6Bw67v6U6gB.jpg", release_date: "2001-12-18", vote_average: 8.4 },
];

const mockSuggestions = [
  { id: 27205, title: "Inception (2010)", mediaType: "Movie", rawMediaType: "movie", posterPath: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg" },
  { id: 1399, title: "Game of Thrones (2011)", mediaType: "TV Series", rawMediaType: "tv", posterPath: "/1xsYj8477DDZZ6gB.jpg" },
];

const movieCategories = ["Hollywood", "British Cinema", "European Cinema", "East Asian Cinema"];
const seriesCategories = ["American Series", "British Series", "European Series", "East Asian Series"];

// ==========================================
// 🛠️ TOUCH-SAFE DROP-DOWN MENU COMPONENT
// ==========================================
function SandboxCategoryMenu({
  label,
  menuId,
  categories,
}: {
  label: string;
  menuId: string;
  categories: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      className="relative group/menu py-2"
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
        className="inline-flex items-center gap-0.5 text-zinc-400 hover:text-amber-400 font-semibold cursor-pointer text-sm"
      >
        {label && <span>{label}</span>}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "group-hover/menu:rotate-180"} opacity-60`} />
      </button>
      
      <div
        id={menuId}
        role="menu"
        className={`absolute left-0 top-full z-50 mt-1 grid w-56 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs font-medium text-zinc-200 shadow-xl 
        transition-all duration-150 ease-out
        ${isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1 md:group-hover/menu:visible md:group-hover/menu:opacity-100 md:group-hover/menu:translate-y-0"}`}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              alert(`Navigating search query to: "${category}"`);
              setIsOpen(false);
            }}
            className="w-full text-left rounded-lg px-3 py-2 transition-colors hover:bg-amber-400/10 hover:text-amber-400 cursor-pointer"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 🧪 MAIN ROUTE SANDBOX WORKSPACE SUITE
// ==========================================
export default function SandboxPage() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Standalone simulated login variables
  const userEmail = "cinephile@filmshift.com";
  const username = "MovieMaster2026";
  const accountInitial = "M";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      {/* Informative Sandbox Control Slate */}
      <header className="max-w-4xl mx-auto mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-400">
          Local UI Simulation Area
        </span>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">Responsive Navbar Sandbox</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Open your browser developer options (<kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">F12</kbd> or <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Cmd+Shift+M</kbd>) and scale the screen width below <strong>768px (md breakpoint)</strong> to trigger the mobile toggle mode!
        </p>
      </header>

      {/* 🚀 THE LIVE TESTING NAV CONTAINER BAR FRAME */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
        <header className="w-full border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-6">
              <span className="text-xl font-black tracking-tight text-white select-none">
                Film<span className="text-amber-400">Shift</span> <span className="text-[10px] text-zinc-500 font-mono tracking-normal border border-zinc-700 px-1 rounded ml-1">TEST</span>
              </span>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-zinc-400">
                <div className="flex items-center gap-1">
                  <span className="hover:text-amber-400 transition-colors cursor-pointer">Movies</span>
                  <SandboxCategoryMenu label="" menuId="desk-movie" categories={movieCategories} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="hover:text-amber-400 transition-colors cursor-pointer">TV Series</span>
                  <SandboxCategoryMenu label="" menuId="desk-tv" categories={seriesCategories} />
                </div>
                <span className="hover:text-amber-400 transition-colors cursor-pointer">Blog</span>
              </nav>
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-3 text-sm font-semibold">
              
              {/* Search Toggle Block */}
              <div className="flex items-center gap-2">
                {searchOpen && (
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search titles..."
                    className="w-28 rounded-full border border-zinc-700 bg-zinc-950 py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400/80 sm:w-36"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Account Dropdown Control (Desktop Profile Block) */}
              <div className="hidden md:block relative group/profile py-2">
                <button type="button" className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 cursor-pointer">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-amber-400">
                    {accountInitial}
                  </span>
                  <span className="max-w-[80px] truncate">{username}</span>
                  <ChevronDown size={14} className="opacity-60 transition-transform group-hover/profile:rotate-180" />
                </button>
                
                {/* Secondary Drop menu simulation block */}
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-150">
                  <div className="rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-800 text-zinc-300 cursor-pointer flex items-center gap-2"><User size={14}/>Profile</div>
                  <div className="rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-800 text-zinc-300 cursor-pointer flex items-center gap-2"><PenSquare size={14}/>Write Post</div>
                </div>
              </div>

              {/* Theme Mock button */}
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                <Moon size={16} />
              </div>

              {/* Responsive Mobile Hamburger Trigger */}
            {/* Change md:hidden to flex to force display */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full flex text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            </div>

          </div>
        </header>

        {/* 📱 FULL WIDTH MOBILE OVERLAY INLINE RENDERING */}
          {/* Change md:hidden to block here to bypass screen measurement rules */}
          {isMobileMenuOpen && (
            <div className="w-full bg-zinc-900 border-t border-zinc-800 block animate-search-placeholder">
              <nav className="flex flex-col p-4 gap-2 font-semibold text-zinc-200">
                {/* ... keeping all your interior menu routes intact ... */}
              
              {/* Mobile Movie Section */}
              <div className="border-b border-zinc-800 pb-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-amber-400 cursor-pointer" onClick={() => alert("Index trigger")}>Movies Index →</span>
                  <SandboxCategoryMenu label="Browse Genres" menuId="mob-movie-cats" categories={movieCategories} />
                </div>
              </div>

              {/* Mobile Series Section - FIXED & RESTORED */}
              <div className="border-b border-zinc-800 pb-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-amber-400 cursor-pointer" onClick={() => alert("Index trigger")}>TV Series Index →</span>
                  <SandboxCategoryMenu label="Browse Genres" menuId="mob-series-cats" categories={seriesCategories} />
                </div>
              </div>

              <span className="py-2.5 border-b border-zinc-800 text-sm hover:text-amber-400 cursor-pointer">
                The Journal (Blog)
              </span>

              {/* Mobile Simulated Dashboard Slate */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider px-1 font-bold">User Dashboard</div>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-zinc-950 text-xs text-zinc-300 cursor-pointer"><User size={14} />My Profile</div>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-zinc-950 text-xs text-zinc-300 cursor-pointer"><PenSquare size={14} />Write Post</div>
                <button type="button" onClick={() => alert("Signed Out")} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-red-500/10 text-red-400 text-xs text-left w-full mt-1"><LogOut size={14} />Sign Out</button>
              </div>
            </nav>
          </div>
        )}

        {/* Dummy Page body filler just to anchor the menu visuals inside the sandbox layout */}
        <div className="p-8 text-center text-zinc-600 text-xs font-mono">
          [ Curated Content Workspace Grid Background ]
          {query && <p className="mt-2 text-zinc-400 text-xs">Simulated active keystroke input stream filter: &quot;{query}&quot;</p>}
        </div>
      </div>
    </main>
  );
}
