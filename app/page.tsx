import { getTrendingMovies } from "@/utils/movieService";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default async function HomePage() {
  const movies = await getTrendingMovies();

  return (
    <main className="bg-background text-foreground min-h-screen p-8">
      <header className="mx-auto mb-12 max-w-7xl text-center">
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">FilmShift</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Discover and discuss your favorite cinema.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mx-auto max-w-7xl">
        {movies.map((movie) => {
          const releaseYear = movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "Unknown year";

          return (
            <article
              key={movie.id}
              className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:scale-105 transition-transform"
            >
              {movie.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={`${movie.title} poster`}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-neutral-200 px-4 text-center text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  Poster unavailable
                </div>
              )}
              <h2 className="font-bold mt-2 px-3">{movie.title}</h2>
              <p className="px-3 pb-3 pt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {releaseYear} · {movie.vote_average.toFixed(1)}/10
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
