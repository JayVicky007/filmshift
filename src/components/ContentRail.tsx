"use client";

import { startTransition, useEffect, useState } from "react";
import type {
  TopRatedPeriod,
  ContentItem,
  TrendingPeriod,
  UpcomingPeriod,
} from "@/utils/movieService";
import ContentCard from "./ContentCard";

export default function ContentRail({
  title,
  movies,
  periodFilter = false,
  periodCategory = "trending",
  collection,
}: {
  title: string;
  movies: ContentItem[];
  periodFilter?: boolean;
  collection?: { mediaType: "movie" | "tv"; slug: string };
  periodCategory?:
    | "trending"
    | "trending-tv"
    | "top-rated"
    | "top-rated-tv"
    | "top-rated-mixed"
    | "upcoming-movies"
    | "upcoming-tv"
    | "coming-soon";
}) {
  const isUpcoming = periodCategory.startsWith("upcoming") || periodCategory === "coming-soon";
  const isTopRated = periodCategory.startsWith("top-rated");
  const collectionMediaType = collection?.mediaType;
  const collectionSlug = collection?.slug;
  const [selectedPeriod, setSelectedPeriod] = useState<
    TrendingPeriod | TopRatedPeriod | UpcomingPeriod
  >(
    isUpcoming ? "1-month" : isTopRated ? "month" : "day",
  );
  const [railMovies, setRailMovies] = useState(movies);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const isDefaultPeriod = isUpcoming
    ? selectedPeriod === "1-month"
    : isTopRated
      ? selectedPeriod === "month"
      : selectedPeriod === "day";
  const displayedMovies = isDefaultPeriod ? movies : railMovies;
  const periods: Array<TrendingPeriod | TopRatedPeriod | UpcomingPeriod> = isUpcoming
    ? ["1-month", "3-months", "6-months"]
    : isTopRated
      ? ["month", "year", "all-time"]
      : ["day", "week", "month"];
  const selectPeriod = (period: TrendingPeriod | TopRatedPeriod | UpcomingPeriod) => {
    setLoadError("");
    setIsLoading(
      period !== (isUpcoming ? "1-month" : isTopRated ? "month" : "day"),
    );
    setSelectedPeriod(period);
  };
  const getPeriodLabel = (period: TrendingPeriod | TopRatedPeriod | UpcomingPeriod) => {
    if (period === "all-time") return "All Time";
    if (period === "1-month") return "Month";
    if (period === "3-months") return "3 Months";
    if (period === "6-months") return "6 Months";
    return period;
  };

  useEffect(() => {
    if (!periodFilter) {
      return;
    }

    if (isDefaultPeriod) {
      return;
    }

    let isCurrent = true;
    const endpoint = collectionMediaType && collectionSlug
      ? `/api/collections/${collectionMediaType}/${collectionSlug}?category=${periodCategory}&period=${selectedPeriod}`
      : `/api/movies?category=${periodCategory}&period=${selectedPeriod}`;
    fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load this time period.");
        }
        return response.json() as Promise<{ results?: ContentItem[] }>;
      })
      .then((data) => {
        const results = data.results;
        if (!Array.isArray(results)) {
          throw new Error("No results were returned for this time period.");
        }
        if (isCurrent) {
          startTransition(() => setRailMovies(results));
        }
      })
      .catch((error: Error) => {
        if (isCurrent) setLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [collectionMediaType, collectionSlug, isDefaultPeriod, periodCategory, periodFilter, selectedPeriod]);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>

        {periodFilter ? (
          <>
            <div className="hidden items-center rounded-full border border-text-muted/15 bg-surface p-1 text-xs font-semibold sm:flex">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => selectPeriod(period)}
                  aria-pressed={selectedPeriod === period}
                  className={`shrink-0 rounded-full px-3 py-1.5 capitalize transition-colors ${selectedPeriod === period ? "bg-accent text-slate-950" : "text-text-muted hover:text-accent"}`}
                >
                  {getPeriodLabel(period)}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor={`${periodCategory}-period-${title.replace(/\W+/g, "-").toLowerCase()}`}>
              Choose time period for {title}
            </label>
            <select
              id={`${periodCategory}-period-${title.replace(/\W+/g, "-").toLowerCase()}`}
              value={selectedPeriod}
              onChange={(event) =>
                selectPeriod(
                  event.target.value as TrendingPeriod | TopRatedPeriod | UpcomingPeriod,
                )
              }
              className="w-full max-w-48 rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm font-semibold capitalize text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 sm:hidden"
            >
              {periods.map((period) => (
                <option key={period} value={period}>
                  {getPeriodLabel(period)}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        {loadError && (
          <p role="status" className="mb-3 text-sm text-rose-500">
            {loadError}
          </p>
        )}
        {displayedMovies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-text-muted/20 bg-surface/50 p-10 text-center">
            <p className="text-sm font-semibold text-text-muted">
              🍿 No titles found for this selection. Check back soon!
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label={`${title} titles`}
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] [scrollbar-color:var(--text-muted)_transparent] motion-reduce:scroll-auto"
          >
            {displayedMovies.map((movie, index) => (
              <div
                key={`${movie.id}-rail-${index}`}
                className="w-[42%] min-w-[140px] max-w-[190px] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]"
              >
                <ContentCard movie={movie} showRating={!isUpcoming} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
