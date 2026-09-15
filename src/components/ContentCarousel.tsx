"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ContentItem } from "@/utils/movieService";
import ContentCard from "./ContentCard";

export default function ContentCarousel({
  title,
  movies,
}: {
  title: string;
  movies: ContentItem[];
}) {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(movies.length / pageSize));
  const moviePages = Array.from({ length: pageCount }, (_, pageIndex) =>
    movies.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
  );

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Show previous ${title.toLowerCase()}`}
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            disabled={page === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Show more ${title.toLowerCase()}`}
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
            disabled={page >= pageCount - 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
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
