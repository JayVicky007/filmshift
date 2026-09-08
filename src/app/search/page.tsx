import Link from "next/link";
import { searchMovies } from "@/utils/movieService";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const movies = await searchMovies(q);
  const searchTerm = q.trim();

  return (
    <main className="bg-background text-foreground min-h-screen p-8">
      <header className="mx-auto mb-12 max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Search Results for: &quot;{searchTerm}&quot;
        </h1>
      </header>

      {movies.length === 0 ? (
        <p
          role="status"
          className="mx-auto max-w-7xl rounded-xl border border-neutral-200 bg-neutral-100 p-6 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
        >
          No movies found matching your search criteria
        </p>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mx-auto max-w-7xl">
          {movies.map((movie) => {
            const releaseYear = movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "Unknown year";

            return (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="block bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              >
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                    alt={`${movie.title} poster`}
                    className="aspect-[2/3] w-full object-contain"
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
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}