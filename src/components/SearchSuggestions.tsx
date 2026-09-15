"use client";

import type { SearchSuggestion } from "@/utils/movieService";

export default function SearchSuggestions({
  suggestions,
  isLoading,
  onSelect,
  className = "absolute left-0 right-0 top-full z-50 mt-2",
}: {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  className?: string;
}) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`${className} overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl`}>
      {isLoading ? (
        <p className="px-3 py-2 text-sm text-slate-400">Finding something good...</p>
      ) : (
        suggestions.map((suggestion) => (
          <button
            key={`${suggestion.mediaType}-${suggestion.id}`}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100"
          >
            <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-[10px] text-slate-400">
              {suggestion.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${suggestion.posterPath}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900">{suggestion.title}</span>
              <span className="block text-xs text-slate-400">{suggestion.mediaType}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
