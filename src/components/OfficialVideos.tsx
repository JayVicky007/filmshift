"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import type { OfficialVideo } from "@/utils/movieService";

export default function OfficialVideos({
  videos,
}: {
  videos: OfficialVideo[];
}) {
  const [activeVideo, setActiveVideo] = useState<OfficialVideo | null>(null);

  useEffect(() => {
    if (!activeVideo) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveVideo(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeVideo]);

  if (videos.length === 0) return null;

  return (
    <section className="md:px-4">
      <h2 className="mb-5 border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        Official Videos
      </h2>
      <div
        role="region"
        aria-label="Official videos"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] [scrollbar-color:var(--text-muted)_transparent]"
      >
        {videos.map((video) => (
          <article key={video.key} className="w-[78%] min-w-[240px] max-w-[340px] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setActiveVideo(video)}
              aria-label={`Play ${video.name}`}
              className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-text-muted/15 bg-slate-900 bg-cover bg-center shadow-lg"
              style={{
                backgroundImage: `url("https://img.youtube.com/vi/${encodeURIComponent(video.key)}/hqdefault.jpg")`,
              }}
            >
              <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/45" />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-slate-950 shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
              </span>
            </button>
            <div className="mt-3">
              <p className="line-clamp-1 font-bold text-foreground">{video.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Official {video.type}
              </p>
            </div>
          </article>
        ))}
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={activeVideo.name}
            className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-surface p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="truncate font-bold text-foreground">{activeVideo.name}</h3>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video"
                className="shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-text-muted/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(activeVideo.key)}?autoplay=1`}
                title={activeVideo.name}
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
