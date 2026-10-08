import React from "react";
import { getMovieDetails } from "@/utils/movieService";
import ContentCarousel from "@/components/ContentCarousel";
import RatingRing from "@/components/RatingRing";
import OfficialVideos from "@/components/OfficialVideos";
import { MovieTrailerModalButton } from "@/app/movie/[id]/MovieTrailerModalButton";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
const TMDB_PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";

function formatRuntime(runtime: number | null) {
  if (!runtime) return "Runtime unavailable";
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatScore(score: number | null) {
  return score === null ? "N/A" : score.toFixed(1);
}

function googleSearchUrl(name: string, movieTitle: string) {
  return `https://google.com/search?q=${encodeURIComponent(`${name} ${movieTitle}`)}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground animate-fade-entry">
        <p className="text-xl font-semibold">Movie not found</p>
      </main>
    );
  }

  const posterUrl = movie.poster_path ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}` : null;
  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP_BASE_URL}${movie.backdrop_path}` : null;

  return (
    <main className="min-h-screen bg-background text-foreground animate-fade-entry">
      <section className="relative isolate overflow-hidden border-b border-text-muted/15">
        {backdropUrl && (
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,18,35,0.98)_0%,rgba(7,18,35,0.9)_48%,rgba(7,18,35,0.62)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--background)_0%,transparent_45%,rgba(7,18,35,0.4)_100%)]" />

        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-5 pb-16 pt-8 sm:px-8 md:flex-row md:items-start md:gap-10 md:px-10 md:pt-14 lg:gap-12 lg:px-12">
          <div className="w-full min-w-0 flex-shrink-0 md:w-[300px] lg:w-[350px]">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                className="h-auto w-full rounded-[28px] border border-text-muted/15 object-contain shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-[28px] border border-text-muted/15 bg-surface p-6 text-center text-text-muted">
                Poster unavailable
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              FilmShift movie guide
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="mt-3 text-lg italic text-white/70">{movie.tagline}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm leading-5 text-white/70">
              <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent uppercase font-bold text-[10px]">Movie</span>
              <span>{movie.status || "Status unavailable"}</span>
              <span aria-hidden="true">·</span>
              <span>{movie.release_date || "Release date unavailable"}</span>
              <span aria-hidden="true" className="text-text-muted/60">·</span>
              <span>{formatRuntime(movie.runtime)}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-sm text-white"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-2 flex items-center gap-3 h-14">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Audience</p>
                  <p className="text-xs text-white/60">Score Rating</p>
                </div>
                <RatingRing rating={movie.audienceRating} size="sm" />
              </div>
              
              {movie.trailer && <MovieTrailerModalButton trailerKey={movie.trailer.key} movieTitle={movie.title} />}
            </div>


            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/85">
              {movie.overview || "No summary is available for this movie."}
            </p>

            <p className="mt-3 text-xs text-white/50">
              {movie.audienceVoteCount.toLocaleString()} audience votes
            </p>

            <section className="mt-10">
              <h2 className="text-2xl font-bold text-white">Critic Scores</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">IMDb</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatScore(movie.ratings.imdb)}</p>
                </div>
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">Rotten Tomatoes</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {movie.ratings.rottenTomatoes === null ? "N/A" : `${movie.ratings.rottenTomatoes}%`}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">Metacritic</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatScore(movie.ratings.metascore)}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 sm:px-8 lg:px-12">
        <OfficialVideos videos={movie.officialVideos} />

        {movie.creativeCredits.length > 0 && (
          <section className="md:px-4">
            <h2 className="pl-1 text-2xl font-bold">Credits</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {movie.creativeCredits.map(({ role, names }) => (
                <p key={role} className="rounded-xl border border-text-muted/15 bg-surface p-4">
                  <span className="font-semibold text-text-muted">{role}</span>{" "}
                  {names.map((name, index) => (
                    <span key={name}>
                      {index > 0 ? ", " : ""}
                      <a href={googleSearchUrl(name, movie.title)} target="_blank" rel="noreferrer" className="no-underline transition-colors hover:text-accent">
                        {name}
                      </a>
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </section>
        )}

        {movie.cast.length > 0 && (
          <section className="md:px-4">
            <h2 className="pl-1 text-2xl font-bold">Top Cast</h2>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
              {movie.cast.map((person) => (
                <div key={person.id} className="min-w-0 text-center">
                  <a href={googleSearchUrl(person.name, movie.title)} target="_blank" rel="noreferrer" className="block no-underline">
                    <div className="mx-auto aspect-square w-full max-w-32 overflow-hidden rounded-full border border-text-muted/15 bg-surface">
                      {person.profilePath ? (
                        <img 
                          src={`${TMDB_PROFILE_BASE_URL}${person.profilePath}`} 
                          alt={person.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-text-muted bg-surface/50">?</div>
                      )}
                    </div>
                    <p className="mt-3 truncate font-semibold transition-colors hover:text-accent">{person.name}</p>
                  </a>
                  <p className="truncate text-sm text-text-muted">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.similar.length > 0 && <ContentCarousel title="More From This Creator" movies={movie.similar} />}
        {movie.recommendations.length > 0 && <ContentCarousel title="Recommendations" movies={movie.recommendations} />}
      </div>
    </main>
  );
}
