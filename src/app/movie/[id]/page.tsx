import { getMovieDetails } from "@/utils/movieService";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
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

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let movie = null;

  try {
    movie = await getMovieDetails(id);
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

  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
    : null;

  return (
    <main className="bg-background text-foreground min-h-screen pb-16">
      <section
        className="relative flex min-h-[24rem] items-end overflow-hidden bg-neutral-900"
        style={
          backdropUrl
            ? { backgroundImage: `url(${backdropUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 text-white">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-300">
            FilmShift movie guide
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {movie.title}
          </h1>
        </div>
      </section>

      <section className="flex flex-col md:flex-row gap-8 mt-6 max-w-6xl mx-auto p-4">
        <div className="w-full shrink-0 md:w-72">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="aspect-[2/3] w-full rounded-xl object-cover shadow-xl"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-neutral-200 p-6 text-center text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              Poster unavailable
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span>{movie.release_date || "Release date unavailable"}</span>
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
