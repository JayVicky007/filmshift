import HomeHero from "@/components/HomeHero";
import ContentRail from "@/components/ContentRail";
import TrailerRail from "@/components/TrailerRail";
import PopularRail from "@/components/PopularRail";
import {
  getLatestTrailers,
  getUpcomingMoviesByPeriod,
  getTopRatedMoviesByPeriod,
  getTopRatedTvByPeriod,
  getUnifiedTrendingByPeriod,
  getUpcomingTvShows,
  getPopularContent,
} from "@/utils/movieService";

export default async function HomePage() {
  const [
    trendingMixed,
    topRatedMovies,
    topRatedTv,
    upcomingMovies,
    upcomingTv,
    latestTrailers,
    popular,
  ] = await Promise.all([
    getUnifiedTrendingByPeriod("day"),
    getTopRatedMoviesByPeriod("month"),
    getTopRatedTvByPeriod("month"),
    getUpcomingMoviesByPeriod("1-month"),
    getUpcomingTvShows("1-month"),
    getLatestTrailers(),
    getPopularContent("streaming"),
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
        <PopularRail movies={popular} />
        <TrailerRail trailers={latestTrailers} />
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
