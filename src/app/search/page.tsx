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
    <main className="min-h-screen bg-background p-8 text-foreground">
      <header className="mx-auto mb-12 max-w-7xl">
        <div className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Search
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">
          Search Results for: &quot;{searchTerm}&quot;
        </h1>
      </header>

      {movies.length === 0 ? (
        <p
          role="status"
          className="mx-auto max-w-7xl rounded-2xl border border-text-muted/15 bg-surface p-6 text-text-muted"
        >
          No movies found matching your search criteria
        </p>
      ) : (
        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie) => {
            const releaseYear = movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "Unknown year";

            return (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="group block overflow-hidden rounded-2xl border border-text-muted/15 bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_16px_38px_rgba(255,193,7,0.15)]"
              >
                {movie.poster_path ? (
                  <div className="overflow-hidden">
                    <img
                      src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                      alt={`${movie.title} poster`}
                      className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center bg-background px-4 text-center text-sm text-text-muted">
                    Poster unavailable
                  </div>
                )}
                <div className="p-3">
                  <h2 className="line-clamp-2 font-bold text-foreground">{movie.title}</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {releaseYear} · {movie.vote_average.toFixed(1)}/10
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}