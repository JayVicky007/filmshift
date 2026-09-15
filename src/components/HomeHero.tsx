"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { SearchSuggestion, TrendingMovie } from "@/utils/movieService";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280";
const SEARCH_PLACEHOLDERS = [
  "Your next obsession is hiding in here somewhere.",
  "Search now, or we auto-play Dragon Ball Evolution.",
  "Name a movie. We can take it from here.",
  "Feed the algorithm. It is hungry.",
  "Search now, or enjoy a four-hour history of grass.",
  "Tell us what you want, or your parents pick the movie.",
  "Find something better than scrolling forever.",
  "Give us a title. We won't judge your comfort watch.",
  "One search stands between you and a great movie night.",
  "Your watchlist called. It wants attention.",
  "Find a movie before the group chat starts arguing.",
  "For when 'anything' somehow means nothing.",
  "Search by title, actor, mood, or questionable impulse.",
  "There is a perfect movie. It is probably not Morbius.",
  "Let us find tonight's main character energy.",
  "Give the search a try. Netflix can't love you like we can.",
  "We know you will rewatch The Office again. But try us anyway.",
];

export default function HomeHero({ movies }: { movies: TrendingMovie[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activePoster, setActivePoster] = useState(0);
  const [activePlaceholder, setActivePlaceholder] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const posters = movies.filter((movie) => movie.poster_path);
  const currentMovie = posters[activePoster % posters.length];

  useEffect(() => {
    if (posters.length < 2) {
      return;
    }

    setActivePoster(Math.floor(Math.random() * posters.length));

    const interval = window.setInterval(() => {
      setActivePoster((currentIndex) => {
        let nextIndex = currentIndex;

        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * posters.length);
        }

        return nextIndex;
      });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [posters.length]);

  useEffect(() => {
    setActivePlaceholder(Math.floor(Math.random() * SEARCH_PLACEHOLDERS.length));

    const interval = window.setInterval(() => {
      setActivePlaceholder((currentIndex) => {
        let nextIndex = currentIndex;

        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * SEARCH_PLACEHOLDERS.length);
        }

        return nextIndex;
      });
    }, 8000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const searchTerm = query.trim();

    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSuggesting(true);
      fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: { results?: SearchSuggestion[] }) => setSuggestions(data.results ?? []))
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSuggesting(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = query.trim();

    if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-text-muted/15 bg-surface shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
      <Link
        href={currentMovie ? `/movie/${currentMovie.id}` : "#"}
        aria-label={currentMovie ? `View ${currentMovie.title}` : "Featured movie"}
        className="absolute inset-0 -z-20 bg-cover bg-[center_top] transition-[background-image] duration-1000"
        style={{
          backgroundImage: currentMovie?.poster_path
            ? `url(${TMDB_IMAGE_BASE_URL}${currentMovie.poster_path})`
            : undefined,
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,10,18,0.94)_0%,rgba(5,10,18,0.78)_45%,rgba(5,10,18,0.45)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,10,18,0.85)_0%,transparent_55%,rgba(5,10,18,0.35)_100%)]" />

      <div className="mx-auto flex h-[100svh] min-h-[38rem] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center sm:px-12 lg:px-20">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Your cinema, curated
        </p>
        <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
          Welcome
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">
          Discover millions of movies, TV shows, and people. Start exploring now!
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
          role="search"
        >
          <label className="sr-only" htmlFor="hero-search">
            Search for a movie or TV show
          </label>
          <div className="relative flex min-h-14 flex-1 items-center rounded-full border border-white/20 bg-white px-5 shadow-2xl shadow-black/20">
            <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            {!query && (
              <span
                key={activePlaceholder}
                className="pointer-events-none absolute inset-y-0 left-14 right-5 flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-base text-slate-400 animate-search-placeholder"
                aria-hidden="true"
              >
                {SEARCH_PLACEHOLDERS[activePlaceholder]}
              </span>
            )}
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder=""
              className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            {(suggestions.length > 0 || isSuggesting) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl">
                {isSuggesting ? (
                  <p className="px-3 py-2 text-sm text-slate-400">Finding something good...</p>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.mediaType}-${suggestion.id}`}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion.title);
                        setSuggestions([]);
                      }}
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
            )}
          </div>
          <button
            type="submit"
            className="min-h-14 rounded-full bg-accent px-8 font-bold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Search
          </button>
        </form>

        {currentMovie && (
          <p className="mt-6 text-sm text-white/60">
            Now featuring{" "}
            <Link
              href={`/movie/${currentMovie.id}`}
              className="font-semibold text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              {currentMovie.title}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}