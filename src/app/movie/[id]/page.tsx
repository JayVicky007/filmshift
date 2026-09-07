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
      <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-8">
        <p className="text-xl font-semibold">Movie not found</p>
      </main>
    );
  }

  const posterUrl = movie.poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
    : null;

  return (
    <main className="bg-background text-foreground min-h-screen p-6 md:p-12 flex justify-center">
      <section className="flex flex-col md:flex-row gap-8 lg:gap-12 max-w-5xl w-full">
        <div className="flex-shrink-0 w-full md:w-[350px]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="w-full h-auto object-contain rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-neutral-200 p-6 text-center text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              Poster unavailable
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-start min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            FilmShift movie guide
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {movie.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-5 text-neutral-600 dark:text-neutral-400">
            <span>{movie.release_date || "Release date unavailable"}</span>
            <span aria-hidden="true" className="text-neutral-400 dark:text-neutral-600">
              ·
            </span>
            <span>{formatRuntime(movie.runtime)}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-700 dark:text-neutral-300">
            {movie.overview || "No summary is available for this movie."}
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-bold">Critic Scores</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                <p className="text-sm font-semibold">IMDb</p>
                <p className="mt-1 text-2xl font-bold">{formatScore(movie.ratings.imdb)}</p>
              </div>
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-950 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100">
                <p className="text-sm font-semibold">Rotten Tomatoes</p>
                <p className="mt-1 text-2xl font-bold">
                  {movie.ratings.rottenTomatoes === null
                    ? "N/A"
                    : `${movie.ratings.rottenTomatoes}%`}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100">
                <p className="text-sm font-semibold">Metacritic</p>
                <p className="mt-1 text-2xl font-bold">
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
