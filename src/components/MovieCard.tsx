import Link from "next/link";
import { formatMovieRating, type TrendingMovie } from "@/utils/movieService";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function MovieCard({ movie }: { movie: TrendingMovie }) {
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "Unknown year";

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group block min-w-0 overflow-hidden rounded-2xl border border-text-muted/15 bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_16px_38px_rgba(255,193,7,0.15)]"
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
        <h3 className="line-clamp-2 font-bold text-foreground">{movie.title}</h3>
        <p className="mt-1 text-sm text-text-muted">
          {releaseYear} · {formatMovieRating(movie.vote_average)}
        </p>
      </div>
    </Link>
  );
}