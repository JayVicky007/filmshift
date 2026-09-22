"use client";

import React, { useState, useRef } from "react";
import ContentCard from "@/components/ContentCard";
import SearchSuggestions from "@/components/SearchSuggestions";

// 1. Mock Data representing your TMDB search payload stream
const mockSearchResults = [
  { id: 27205, title: "Inception", poster_path: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg", release_date: "2010-07-15", vote_average: 8.4 },
  { id: 157336, title: "Interstellar", poster_path: "/gEU2QniE6E77NIvHGvPbgDcwtgC.jpg", release_date: "2014-11-05", vote_average: 8.4 },
  { id: 11324, title: "Shutter Island", poster_path: "/kve20wIIgZzb68g1g4jZOCjIY9g.jpg", release_date: "2010-02-14", vote_average: 8.2 },
  { id: 49051, title: "The Hobbit", poster_path: "/b8568Y7Du6bM666g67v6u6gB.jpg", release_date: "2012-11-26", vote_average: 7.7 },
  { id: 120, title: "The Lord of the Rings", poster_path: "/6oom6Q72z6r7J6Bw67v6U6gB.jpg", release_date: "2001-12-18", vote_average: 8.4 },
];

// 2. Mock Data simulating autocomplete drop items
const mockSuggestions = [
  { id: 27205, title: "Inception (2010)", mediaType: "Movie", rawMediaType: "movie" as const, posterPath: "/9gk7adHY9CjST6Y29X9wZg2R7Y8.jpg" },
  { id: 1399, title: "Game of Thrones (2011)", mediaType: "TV Series", rawMediaType: "tv" as const, posterPath: "/1xsYj8477DDZZ6gB.jpg" },
];

export default function SandboxPage() {
  // Test states for simulating the Navbar interactive panel behavior
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(true);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [sandboxLog, setSandboxLog] = useState("Waiting for interaction...");
  
  // Isolated containment ref context rule
  const searchContainerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-background p-6 text-foreground sm:p-10 md:p-14">
      {/* Sandbox Header Control Context */}
      <header className="mx-auto mb-10 max-w-7xl border-b border-text-muted/20 pb-6">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent uppercase tracking-wider">
          🛠️ Isolated Component Test Kitchen
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          Dell Latitude Layout Monitor
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Simulating interactive event timelines and responsive grids on your local 1366x768 screen resolution canvas.
        </p>
      </header>

      <div className="mx-auto max-w-7xl space-y-12">
        
        {/* TEST ZONE 1: INPUT AUTOCOMPLETE FOCUS & RACE CONDITION CHECKER */}
        <section className="rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">
            Test Zone 1: Focus Event Race Condition Playground
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Click into the input box below, then try clicking a selection card or clicking completely outside. Watch the console logger underneath to verify if clicks register successfully before the popover layout panel collapses!
          </p>

          {/* This matches the exact event structure proposed for Navbar.tsx */}
          <div 
            ref={searchContainerRef}
            className="relative inline-flex items-center gap-2 border border-text-muted/20 rounded-full bg-background px-4 py-2 w-full max-w-md"
            onBlur={(event) => {
              if (!searchContainerRef.current?.contains(event.relatedTarget as Node)) {
                setSandboxLog("❌ Main container lost focus (onBlur). Dropping dropdown state.");
                setSuggestions([]);
              }
            }}
          >
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuggestions(e.target.value ? mockSuggestions : []);
              }}
              onFocus={() => {
                setSandboxLog("🔍 Input focused (onFocus). Showing mock drop listings.");
                setSuggestions(mockSuggestions);
              }}
              placeholder="Click inside to test timing focus..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted"
            />
            
            {suggestions.length > 0 && (
              <SearchSuggestions
                suggestions={suggestions}
                isLoading={false}
                className="absolute left-0 right-0 top-full z-50 mt-2 w-full"
                onSelect={(suggestion) => {
                  setSandboxLog(`✅ Selection Click SUCCESSFUL! Routed item ID: ${suggestion.id} (Format Type: ${suggestion.rawMediaType})`);
                  setSuggestions([]);
                  setQuery("");
                }}
              />
            )}
          </div>

          {/* Sandbox Live System Logger */}
          <div className="mt-24 rounded-xl bg-background/50 border border-text-muted/10 p-3 font-mono text-xs">
            <span className="font-bold text-text-muted">Live Event Output Log:</span>{" "}
            <span className="text-emerald-400 font-semibold">{sandboxLog}</span>
          </div>
        </section>


        {/* TEST ZONE 2: SEARCH DIRECTORY RESPONSIVE AUTO-GRID PREVIEW */}
        <section className="rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
              Test Zone 2: Search Directory Responsive Card Cluster
            </h2>
            <p className="text-xs text-text-muted mt-1">
              This renders your updated multi-breakpoint responsive loop ruleset (<code className="bg-background px-1 py-0.5 rounded text-rose-400">grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5</code>). Resize your window framework right now to guarantee content layout scaling fits completely without card overcrowding.
            </p>
          </div>

          {/* This matches the exact grid payload proposed for search/page.tsx */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {mockSearchResults.map((movie) => (
              <ContentCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
