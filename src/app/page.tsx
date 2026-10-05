import HomeHero from "@/components/HomeHero";
import ContentRail from "@/components/ContentRail";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  getTopRatedTv,
  getUnifiedTrendingByPeriod,
  getTvOnTheAir,
} from "@/utils/movieService";

const sections = [
  { title: "Trending", periodFilter: true, periodCategory: "trending" as const },
  { title: "Now Playing in Theaters", periodFilter: false, periodCategory: "trending" as const },
  { title: "Top Rated Masterpieces", periodFilter: false, periodCategory: "top-rated" as const },
  { title: "Upcoming TV Seasons", periodFilter: false, periodCategory: "trending" as const },
];

export default async function HomePage() {
  // 🚀 Concurrently fetch mixed entertainment arrays
  const [trendingMixed, nowPlayingMovies, topRatedMovies, topRatedTv, upcomingTv] = await Promise.all([
    getUnifiedTrendingByPeriod("year"),
    getMoviesByCategory("now-playing"),
    getTopRatedMoviesByPeriod("all-time"),
    getTopRatedTv(),
    getTvOnTheAir(),
  ]);

  // 🚀 Combine Top Rated Movies and TV shows into an interleaved masterpiece row
  const topRatedMixed = [];
  const maxCuratedLength = Math.max(topRatedMovies.length, topRatedTv.length);
  for (let i = 0; i < maxCuratedLength; i++) {
    if (topRatedMovies[i]) topRatedMixed.push({ ...topRatedMovies[i], media_type: "movie" });
    if (topRatedTv[i]) topRatedMixed.push({ ...topRatedTv[i], media_type: "tv" });
  }

  const moviesByCategory = [
    trendingMixed,
    nowPlayingMovies.map(m => ({ ...m, media_type: "movie" })),
    topRatedMixed,
    upcomingTv.map(t => ({ ...t, media_type: "tv" }))
  ];

  return (
    <main className="min-h-screen bg-background px-4 pb-4 text-foreground sm:px-8 sm:pb-8">
      {/* Hero background cycles dynamically through the combined trending items! */}
      <HomeHero movies={trendingMixed} />

      <div className="mx-auto mt-16 max-w-7xl space-y-16">
        {sections.map((section, index) => (
          <ContentRail
            key={section.title}
            title={section.title}
            movies={moviesByCategory[index]}
            periodFilter={section.periodFilter}
            periodCategory={section.periodCategory}
          />
        ))}
      </div>
    </main>
  );
}
