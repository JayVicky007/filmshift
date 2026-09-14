import { getMovieDetails } from "@/utils/movieService";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function formatRuntime(runtime: number | null) {
  if (!runtime) {
    return "Runtime unavailable";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatScore(score: number | null) {
  return score === null ? "N/A" : score.toFixed(1);
}

export default async function MovieDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  let movie = null;

  try {
    movie = await getMovieDetails(resolvedParams.id);
  } catch {
    movie = null;
  }

  if (!movie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        <p className="text-xl font-semibold">Movie not found</p>
      </main>
    );
  }

  const posterUrl = movie.poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
    : null;

  return (
    <main className="flex min-h-screen justify-center bg-background p-6 text-foreground md:p-12">
      <section className="flex w-full max-w-5xl flex-col gap-8 md:flex-row lg:gap-12">
        <div className="w-full flex-shrink-0 md:w-[350px]">
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
            FilmShift movie guide
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            {movie.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-5 text-text-muted">
            <span>{movie.release_date || "Release date unavailable"}</span>
            <span aria-hidden="true" className="text-text-muted/60">
              ·
            </span>
            <span>{formatRuntime(movie.runtime)}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="rounded-full border border-text-muted/20 bg-surface px-3 py-1 text-sm text-foreground"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/90">
            {movie.overview || "No summary is available for this movie."}
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-foreground">Critic Scores</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-foreground shadow-sm">
                <p className="text-sm font-semibold text-text-muted">IMDb</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatScore(movie.ratings.imdb)}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-foreground shadow-sm">
                <p className="text-sm font-semibold text-text-muted">Rotten Tomatoes</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {movie.ratings.rottenTomatoes === null
                    ? "N/A"
                    : `${movie.ratings.rottenTomatoes}%`}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-foreground shadow-sm">
                <p className="text-sm font-semibold text-text-muted">Metacritic</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatScore(movie.ratings.metascore)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
