import Link from "next/link";
import ContentRail from "@/components/ContentRail";
import { getMoviesByCategory } from "@/utils/movieService";

export default async function MoviesIndexPage() {
  // Fetch multiple categories concurrently for an aggregated dashboard view
  const [nowPlaying, upcoming, topRated] = await Promise.all([
    getMoviesByCategory("now-playing"),
    getMoviesByCategory("upcoming"),
    getMoviesByCategory("top-rated"),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto mb-12 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
          ← Back to Dashboard
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
          FilmShift Cinema Catalog
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">Browse Movies</h1>
        <p className="mt-3 text-lg text-text-muted">
          Dive into current theatrical listings, global top ratings, and highly anticipated releases.
        </p>
      </header>

      {/* Grid of beautifully curated Category Rails */}
      <div className="mx-auto space-y-16 max-w-7xl">
        <ContentRail 
          title="Now Playing in Theaters" 
          category="now-playing" 
          movies={nowPlaying} 
        />
        
        <ContentRail 
          title="Anticipated Upcoming Releases" 
          category="upcoming" 
          movies={upcoming} 
        />
        
        <ContentRail 
          title="All-Time Critical Masterpieces" 
          category="top-rated" 
          movies={topRated}
          periodFilter={true}
          periodCategory="top-rated"
        />
      </div>
    </main>
  );
}
