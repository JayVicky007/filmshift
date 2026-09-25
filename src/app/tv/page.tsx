import Link from "next/link";
import ContentCard from "@/components/ContentCard";
import { getTrendingTvByPeriod } from "@/utils/movieService";

export default async function TvSeriesIndexPage() {
  // Leverage your existing trending service array context to sample current popular hits
  // NOTE: By routing through multi-search rulesets, the components safely resolve format differences!
  const popularSeriesSamples = await getTrendingTvByPeriod("week");
  
  // Filter downstream results to focus heavily on modern formatting titles
  const simulatedTvCatalog = popularSeriesSamples.slice(0, 15);

  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <header className="mx-auto mb-10 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">
          ← Back to home
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          FilmShift Streaming Guides
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">TV Series Network</h1>
        <p className="mt-3 text-lg text-text-muted">
          Explore seasonal streaming dramas, trending binge watches, and legendary episodic releases.
        </p>
      </header>

      {/* Grid view optimized to display a high-volume collection of items comfortably */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {simulatedTvCatalog.map((item) => (
          <ContentCard 
            key={item.id} 
            movie={{
              ...item,
              media_type: "tv" // Explicitly forcing the tv routing parameter law safely
            }} 
          />
        ))}
      </section>
    </main>
  );
}
