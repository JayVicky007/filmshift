"use client";

import { startTransition, useEffect, useState } from "react";
import type {
  TopRatedPeriod,
  ContentItem,
  TrendingPeriod,
} from "@/utils/movieService";
import ContentCard from "./ContentCard";

export default function ContentRail({
  title,
  movies,
  periodFilter = false,
  periodCategory = "trending",
}: {
  title: string;
  movies: ContentItem[];
  periodFilter?: boolean;
  periodCategory?: "trending" | "top-rated";
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod | TopRatedPeriod>(
    periodCategory === "top-rated" ? "all-time" : "year",
  );
  const [railMovies, setRailMovies] = useState(movies);
  const [isLoading, setIsLoading] = useState(false);
  const isDefaultPeriod = periodCategory === "top-rated"
    ? selectedPeriod === "all-time"
    : selectedPeriod === "year";
  const displayedMovies = isDefaultPeriod ? movies : railMovies;

  useEffect(() => {
    if (!periodFilter) {
      return;
    }

    if (isDefaultPeriod) {
      return;
    }

    let isCurrent = true;
    fetch(`/api/movies?category=${periodCategory}&period=${selectedPeriod}`)
      .then((response) => response.json())
      .then((data: { results?: ContentItem[] }) => {
        if (isCurrent && data.results) {
          startTransition(() => {
            setRailMovies(data.results ?? []);
          });
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isDefaultPeriod, periodCategory, periodFilter, selectedPeriod]);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>

        {periodFilter ? (
          <div className="flex max-w-full flex-wrap items-center rounded-full border border-text-muted/15 bg-surface p-1 text-xs font-semibold">
            {(periodCategory === "trending"
              ? (["day", "week", "month", "year"] as TrendingPeriod[])
              : (["all-time", "year", "month"] as TopRatedPeriod[])
            ).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setIsLoading(
                    period !== (periodCategory === "top-rated" ? "all-time" : "year"),
                  );
                  setSelectedPeriod(period);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 capitalize transition-colors ${selectedPeriod === period ? "bg-accent text-slate-950" : "text-text-muted hover:text-accent"}`}
              >
                  {period === "all-time" ? "All Time" : period}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        {displayedMovies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-text-muted/20 bg-surface/50 p-10 text-center">
            <p className="text-sm font-semibold text-text-muted">
              🍿 No upcoming releases scheduled for this exact window. Check back soon!
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
                <ContentCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
