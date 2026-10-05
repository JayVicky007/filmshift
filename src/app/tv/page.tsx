import Link from "next/link";
import ContentRail from "@/components/ContentRail";
import { 
  getTrendingTvByPeriod,
  getTvAiringToday,
  getTopRatedTvByPeriod,
  getUpcomingTvShows,
} from "@/utils/movieService";

export default async function TvSeriesIndexPage() {
  // Fetch the identical four-channel catalog stack concurrently 
  const [trending, airingToday, topRated, upcomingDrops] = await Promise.all([
    getTrendingTvByPeriod("month"),
    getTvAiringToday(),
    getTopRatedTvByPeriod("year"),
    getUpcomingTvShows("3-months"),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto mb-12 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
          ← Back to home
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          FilmShift Network Hub
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">TV Series</h1>
        <p className="mt-3 text-lg text-text-muted">
          Your full episodic dashboard for seasonal drops, network trends, and timeless television history.
        </p>
      </header>

      {/* Curie layout rows rendering distinct sliding rails */}
      <div className="mx-auto space-y-16 max-w-7xl">
        <ContentRail
          title="Trending Series"
          movies={trending}
          periodFilter
          periodCategory="trending-tv"
        />

        <ContentRail
          title="Airing Today"
          movies={airingToday}
        />

        <ContentRail
          title="Top Rated TV Series"
          movies={topRated}
          periodFilter
          periodCategory="top-rated-tv"
        />

        <ContentRail
          title="Upcoming Series"
          movies={upcomingDrops}
          periodFilter
          periodCategory="upcoming-tv"
        />
      </div>
    </main>
  );
}
