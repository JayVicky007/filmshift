"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import type {
  TopRatedPeriod,
  TrendingMovie,
  TrendingPeriod,
} from "@/utils/movieService";
import ContentCard from "./ContentCard";

export default function ContentRail({
  title,
  category,
  movies,
  periodFilter = false,
  periodCategory = "trending",
}: {
  title: string;
  category: string;
  movies: TrendingMovie[];
  periodFilter?: boolean;
  periodCategory?: "trending" | "top-rated";
}) {
  const [page, setPage] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<TrendingPeriod | TopRatedPeriod>(
    periodCategory === "top-rated" ? "all-time" : "year",
  );
  const [railMovies, setRailMovies] = useState(movies);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(railMovies.length / pageSize));
  const moviePages = Array.from({ length: pageCount }, (_, pageIndex) =>
    railMovies.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
  );

  useEffect(() => {
    if (!periodFilter) {
      return;
    }

    if (
      (periodCategory === "trending" && selectedPeriod === "year") ||
      (periodCategory === "top-rated" && selectedPeriod === "all-time")
    ) {
      setRailMovies(movies);
      setPage(0);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    fetch(`/api/movies?category=${periodCategory}&period=${selectedPeriod}`)
      .then((response) => response.json())
      .then((data: { results?: TrendingMovie[] }) => {
        if (isCurrent && data.results) {
          startTransition(() => {
            setRailMovies(data.results ?? []);
            setPage(0);
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
  }, [movies, periodCategory, periodFilter, selectedPeriod]);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <Link
            href={`/movies/${category}`}
            className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-lg font-bold text-trending-text transition-colors hover:border-accent hover:text-accent"
          >
            {title}
          </Link>
        </div>

        {periodFilter ? (
          <div className="flex max-w-full flex-wrap items-center justify-center rounded-full border border-text-muted/15 bg-surface p-1 text-xs font-semibold">
            {(periodCategory === "trending"
              ? (["day", "week", "month", "year"] as TrendingPeriod[])
              : (["all-time", "year", "month"] as TopRatedPeriod[])
            ).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`shrink-0 rounded-full px-3 py-1.5 capitalize transition-colors ${selectedPeriod === period ? "bg-accent text-slate-950" : "text-text-muted hover:text-accent"}`}
              >
                  {period === "all-time" ? "All Time" : period}
              </button>
            ))}
          </div>
        ) : <div />}

        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/movies/${category}`}
            className="mr-2 hidden text-sm font-semibold text-text-muted transition-colors hover:text-accent sm:inline"
          >
            View all
          </Link>
          <button
            type="button"
            aria-label={`Show previous ${title.toLowerCase()} movies`}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            disabled={page === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Show more ${title.toLowerCase()} movies`}
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
            disabled={page >= pageCount - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {moviePages.map((moviePage, pageIndex) => (
            <div
              key={pageIndex}
              className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {moviePage.map((movie) => (
                <ContentCard key={movie.id} movie={movie} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
