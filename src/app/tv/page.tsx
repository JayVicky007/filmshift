import Link from "next/link";
import ContentRail from "@/components/ContentRail";
import { 
  getTrendingTvByPeriod,
  getTvAiringToday,
  getTopRatedTv,
  getTvOnTheAir
} from "@/utils/movieService";

export default async function TvSeriesIndexPage() {
  // Fetch the identical four-channel catalog stack concurrently 
  const [trending, airingToday, topRated, upcomingDrops] = await Promise.all([
    getTrendingTvByPeriod("week"),
    getTvAiringToday(),
    getTopRatedTv(),
    getTvOnTheAir(),
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
          category="trending"
          movies={trending}
          periodFilter={false} // Clean single interval window fallback
        />

        <ContentRail
          title="Airing Today"
          category="now-playing"
          movies={airingToday}
        />

        <ContentRail
          title="Top Rated Masterpieces"
          category="top-rated"
          movies={topRated}
        />

        <ContentRail
          title="On The Air (New Seasons)"
          category="upcoming"
          movies={upcomingDrops}
        />
      </div>
    </main>
  );
}
