"use client";

import React, { useState } from "react";
import { Play, X } from "lucide-react";

interface TvTrailerProps {
  trailerKey: string;
  seriesTitle: string;
}

export function TvTrailerModalButton({ trailerKey, seriesTitle }: TvTrailerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 h-14 font-bold text-slate-950 transition-all hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
      >
        <Play className="h-4 w-4 fill-current" />
        <span>Watch Trailer</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-4xl rounded-2xl border border-text-muted/20 bg-surface p-4 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10">
            <div className="flex items-center justify-between pb-3 px-1 border-b border-text-muted/10 shrink-0 mb-3">
              <h3 className="font-bold text-foreground text-sm truncate pr-4">
                {seriesTitle} — Trailer
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-text-muted hover:bg-text-muted/10 hover:text-foreground transition-colors cursor-pointer shrink-0"
                aria-label="Close trailer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-text-muted/10">              
              <iframe
                src={`https://youtube.com/embed/${trailerKey}`}
                title={`${seriesTitle} Official Trailer`}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
