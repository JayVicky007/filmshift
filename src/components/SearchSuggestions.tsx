// "use client";

// import type { SearchSuggestion } from "@/utils/movieService";

// export default function SearchSuggestions({
//   suggestions,
//   isLoading,
//   onSelect,
//   className = "absolute left-0 right-0 top-full z-50 mt-2",
// }: {
//   suggestions: SearchSuggestion[];
//   isLoading: boolean;
//   onSelect: (suggestion: SearchSuggestion) => void;
//   className?: string;
// }) {
//   if (!isLoading && suggestions.length === 0) {
//     return null;
//   }

//   return (
//     <div className={`${className} overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl`}>
//       {isLoading ? (
//         <p className="px-3 py-2 text-sm text-slate-400">Finding something good...</p>
//       ) : (
//         suggestions.map((suggestion) => (
//           <button
//             key={`${suggestion.mediaType}-${suggestion.id}`}
//             type="button"
//             onClick={() => onSelect(suggestion)}
//             className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100"
//           >
//             <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-[10px] text-slate-400">
//               {suggestion.posterPath ? (
//                 <img
//                   src={`https://image.tmdb.org/t/p/w92${suggestion.posterPath}`}
//                   alt=""
//                   className="h-full w-full object-cover"
//                 />
//               ) : "?"}
//             </span>
//             <span className="min-w-0">
//               <span className="block truncate font-semibold text-slate-900">{suggestion.title}</span>
//               <span className="block text-xs text-slate-400">{suggestion.mediaType}</span>
//             </span>
//           </button>
//         ))
//       )}
//     </div>
//   );
// }


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
  // If we aren't loading and there's nothing to show, don't render anything
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`${className} overflow-hidden rounded-2xl border border-text-muted/15 bg-surface p-2 text-left shadow-2xl`}>
      {isLoading ? (
        /* 🚀 A smooth, pulse-animated loading item that tells the user the app is thinking! */
        <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <div className="h-10 w-8 shrink-0 rounded bg-text-muted/20" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-text-muted/20" />
            <div className="h-3 w-1/4 rounded bg-text-muted/20" />
          </div>
        </div>
      ) : (
        suggestions.map((suggestion) => (
          <button
            key={`${suggestion.mediaType}-${suggestion.id}`}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent/10 group/item"
          >
            <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-background text-[10px] text-text-muted border border-text-muted/10">
              {suggestion.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${suggestion.posterPath}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : "🍿"}
            </span>
            <span className="min-w-0 flex-1">
              {/* 🚀 'truncate' prevents giant text from breaking our clean rows */}
              <span className="block truncate font-semibold text-foreground group-hover/item:text-accent transition-colors">
                {suggestion.title}
              </span>
              <span className="block text-xs text-text-muted mt-0.5">
                {suggestion.mediaType}
              </span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}

