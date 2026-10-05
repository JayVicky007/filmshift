"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import type { LatestTrailer } from "@/utils/movieService";

const getContentHref = (trailer: LatestTrailer) =>
  `/${trailer.media_type}/${trailer.id}`;

export default function TrailerRail({ trailers }: { trailers: LatestTrailer[] }) {
  const [activeTrailer, setActiveTrailer] = useState<LatestTrailer | null>(null);

  useEffect(() => {
    if (!activeTrailer) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveTrailer(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeTrailer]);

  if (trailers.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl">
      <h2 className="mb-5 border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        Latest Trailers
      </h2>
      <div
        role="region"
        aria-label="Latest trailers"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] [scrollbar-color:var(--text-muted)_transparent]"
      >
        {trailers.map((trailer) => (
          <article
            key={`${trailer.media_type}-${trailer.id}`}
            className="w-[78%] min-w-[240px] max-w-[340px] shrink-0 snap-start"
          >
            <button
              type="button"
              onClick={() => setActiveTrailer(trailer)}
              aria-label={`Play ${trailer.title} trailer`}
              className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-text-muted/15 bg-slate-900 bg-cover bg-center shadow-lg"
              style={{
                backgroundImage: `url("https://img.youtube.com/vi/${encodeURIComponent(trailer.trailerKey)}/hqdefault.jpg")`,
              }}
            >
              <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/45" />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-slate-950 shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
              </span>
            </button>
            <div className="mt-3">
              <Link
                href={getContentHref(trailer)}
                className="line-clamp-1 font-bold text-foreground transition-colors hover:text-accent"
              >
                {trailer.title}
              </Link>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {trailer.media_type === "tv" ? "Series" : "Movie"} trailer
              </p>
            </div>
          </article>
        ))}
      </div>

      {activeTrailer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setActiveTrailer(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${activeTrailer.title} trailer`}
            className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-surface p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="truncate font-bold text-foreground">{activeTrailer.title} — Trailer</h3>
              <button
                type="button"
                onClick={() => setActiveTrailer(null)}
                aria-label="Close trailer"
                className="shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-text-muted/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeTrailer.trailerKey)}?autoplay=1`}
                title={`${activeTrailer.title} trailer`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
