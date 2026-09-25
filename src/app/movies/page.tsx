import Link from "next/link";
import ContentRail from "@/components/ContentRail";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  getTrendingMoviesByPeriod,
} from "@/utils/movieService";

export default async function MoviesIndexPage() {
  // 🚀 Fetch the exact same category arrays running on the main index route
  const [trending, nowPlaying, topRated, upcoming] = await Promise.all([
    getTrendingMoviesByPeriod("year"),
    getMoviesByCategory("now-playing"),
    getTopRatedMoviesByPeriod("all-time"),
    getMoviesByCategory("upcoming"),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto mb-12 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
          ← Back to home
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
          FilmShift Movie Hub
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">Movies</h1>
        <p className="mt-3 text-lg text-text-muted">
          Your full theater destination for currently playing, all-time highest ranked, and trending cinema collections.
        </p>
      </header>

      {/* 🚀 Category section rails aligned cleanly with homepage architecture parameters */}
      <div className="mx-auto space-y-16 max-w-7xl">
        <ContentRail
          title="Trending"
          category="trending"
          movies={trending}
          periodFilter={true}
          periodCategory="trending"
        />

        <ContentRail
          title="Now Playing"
          category="now-playing"
          movies={nowPlaying}
        />

        <ContentRail
          title="Top Rated"
          category="top-rated"
          movies={topRated}
          periodFilter={true}
          periodCategory="top-rated"
        />

        <ContentRail
          title="Upcoming"
          category="upcoming"
          movies={upcoming}
        />
      </div>
    </main>
  );
}
