"use client";

import { startTransition, useEffect, useState } from "react";
import type { ContentItem, PopularMode } from "@/utils/movieService";
import ContentCard from "./ContentCard";

const modes: Array<{ value: PopularMode; label: string }> = [
  { value: "streaming", label: "Streaming" },
  { value: "on-tv", label: "On TV" },
  { value: "in-theaters", label: "In Theaters" },
];

export default function PopularRail({
  movies,
  collection,
}: {
  movies: ContentItem[];
  collection?: { mediaType: "movie" | "tv"; slug: string };
}) {
  const [selectedMode, setSelectedMode] = useState<PopularMode>("streaming");
  const [railMovies, setRailMovies] = useState(movies);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const collectionMediaType = collection?.mediaType;
  const collectionSlug = collection?.slug;

  const selectMode = (mode: PopularMode) => {
    setLoadError("");
    setIsLoading(mode !== "streaming");
    if (mode !== "streaming") setRailMovies([]);
    setSelectedMode(mode);
  };

  useEffect(() => {
    if (selectedMode === "streaming") {
      return;
    }

    let isCurrent = true;
    const endpoint = collectionMediaType && collectionSlug
      ? `/api/collections/${collectionMediaType}/${collectionSlug}?category=popular&mode=${selectedMode}`
      : `/api/movies?category=popular&mode=${selectedMode}`;

    fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load popular titles.");
        return response.json() as Promise<{ results?: ContentItem[] }>;
      })
      .then((data) => {
        const results = data.results;
        if (!Array.isArray(results)) {
          throw new Error("No results were returned for this selection.");
        }
        if (isCurrent) {
          startTransition(() => setRailMovies(results));
        }
      })
      .catch((error: Error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [collectionMediaType, collectionSlug, selectedMode]);
  const displayedMovies = selectedMode === "streaming" ? movies : railMovies;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          What&apos;s Popular
        </h2>
        <div className="hidden items-center rounded-full border border-text-muted/15 bg-surface p-1 text-xs font-semibold sm:flex">
          {modes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => selectMode(value)}
              aria-pressed={selectedMode === value}
              className={`shrink-0 rounded-full px-3 py-1.5 transition-colors ${selectedMode === value ? "bg-accent text-slate-950" : "text-text-muted hover:text-accent"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="popular-mode-mobile">
          Choose popular titles category
        </label>
        <select
          id="popular-mode-mobile"
          value={selectedMode}
          onChange={(event) => selectMode(event.target.value as PopularMode)}
          className="w-full max-w-48 rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 sm:hidden"
        >
          {modes.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="w-full text-xs text-text-muted">
          Streaming availability and theaters use US listings; On TV includes shows airing this week.
        </p>
      </div>

      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        {loadError && <p role="status" className="mb-3 text-sm text-rose-500">{loadError}</p>}
        {displayedMovies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-text-muted/20 bg-surface/50 p-10 text-center">
            <p className="text-sm font-semibold text-text-muted">🍿 No titles found for this category right now.</p>
          </div>
        ) : (
          <div
            role="region"
            aria-label={`What's popular: ${modes.find(({ value }) => value === selectedMode)?.label}`}
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] [scrollbar-color:var(--text-muted)_transparent] motion-reduce:scroll-auto"
          >
            {displayedMovies.map((movie, index) => (
              <div
                key={`${movie.media_type ?? "content"}-${movie.id}-popular-${index}`}
                className="w-[42%] min-w-[140px] max-w-[190px] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]"
              >
                <ContentCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
