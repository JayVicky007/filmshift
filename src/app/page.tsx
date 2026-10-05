import HomeHero from "@/components/HomeHero";
import ContentRail from "@/components/ContentRail";
import TrailerRail from "@/components/TrailerRail";
import {
  getMoviesByCategory,
  getLatestTrailers,
  getUpcomingMoviesByPeriod,
  getTopRatedMoviesByPeriod,
  getTopRatedTvByPeriod,
  getUnifiedTrendingByPeriod,
  getUpcomingTvShows,
} from "@/utils/movieService";

export default async function HomePage() {
  const [
    trendingMixed,
    nowPlayingMovies,
    topRatedMovies,
    topRatedTv,
    upcomingMovies,
    upcomingTv,
    latestTrailers,
  ] = await Promise.all([
    getUnifiedTrendingByPeriod("month"),
    getMoviesByCategory("now-playing"),
    getTopRatedMoviesByPeriod("year"),
    getTopRatedTvByPeriod("year"),
    getUpcomingMoviesByPeriod("3-months"),
    getUpcomingTvShows("3-months"),
    getLatestTrailers(),
  ]);

  const topRatedMixed = [];
  const maxCuratedLength = Math.max(topRatedMovies.length, topRatedTv.length);
  for (let i = 0; i < maxCuratedLength; i++) {
    if (topRatedMovies[i]) topRatedMixed.push({ ...topRatedMovies[i], media_type: "movie" });
    if (topRatedTv[i]) topRatedMixed.push({ ...topRatedTv[i], media_type: "tv" });
  }

  const comingSoon = [
    ...upcomingMovies.map((movie) => ({ ...movie, media_type: "movie" })),
    ...upcomingTv,
  ]
    .sort((first, second) =>
      (second.popularity ?? 0) - (first.popularity ?? 0) ||
      first.release_date.localeCompare(second.release_date),
    )
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-background px-4 pb-4 text-foreground sm:px-8 sm:pb-8">
      <HomeHero movies={trendingMixed} />

      <div className="mx-auto mt-16 max-w-7xl space-y-16">
        <ContentRail
          title="Trending"
          movies={trendingMixed}
          periodFilter
          periodCategory="trending"
        />
        <TrailerRail trailers={latestTrailers} />
        <ContentRail
          title="Now Playing in Theaters"
          movies={nowPlayingMovies.map((movie) => ({ ...movie, media_type: "movie" }))}
        />
        <ContentRail
          title="Top Rated Movies & TV"
          movies={topRatedMixed}
          periodFilter
          periodCategory="top-rated-mixed"
        />
        <ContentRail
          title="Coming Soon"
          movies={comingSoon}
          periodFilter
          periodCategory="coming-soon"
        />
      </div>
    </main>
  );
}
