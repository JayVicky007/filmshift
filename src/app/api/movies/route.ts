import { NextResponse } from "next/server";
import {
  getMoviesByCategory,
  getTopRatedTvByPeriod,
  getTopRatedMoviesByPeriod,
  getTrendingMoviesByPeriod,
  getTrendingTvByPeriod,
  getUpcomingMoviesByPeriod,
  getUpcomingTvShows,
  combineContentItems,
  getPopularContent,
  movieCategories,
  popularModes,
  topRatedPeriods,
  trendingPeriods,
  upcomingPeriods,
  type MovieCategory,
  type TopRatedPeriod,
  type TrendingPeriod,
  type UpcomingPeriod,
  type PopularMode,
} from "@/utils/movieService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const period = searchParams.get("period");
  const mode = searchParams.get("mode");

  try {
  let movies = null;
  if (category === "popular" && popularModes.includes(mode as PopularMode)) {
    movies = await getPopularContent(mode as PopularMode);
  } else if (category === "trending" && trendingPeriods.includes(period as TrendingPeriod)) {
      movies = await getTrendingMoviesByPeriod(period as TrendingPeriod);
    } else if (category === "trending-tv" && trendingPeriods.includes(period as TrendingPeriod)) {
      movies = await getTrendingTvByPeriod(period as TrendingPeriod);
    } else if (category === "top-rated" && topRatedPeriods.includes(period as TopRatedPeriod)) {
      movies = await getTopRatedMoviesByPeriod(period as TopRatedPeriod);
    } else if (category === "top-rated-tv" && topRatedPeriods.includes(period as TopRatedPeriod)) {
      movies = await getTopRatedTvByPeriod(period as TopRatedPeriod);
    } else if (category === "top-rated-mixed" && topRatedPeriods.includes(period as TopRatedPeriod)) {
      const [topMovies, topShows] = await Promise.all([
        getTopRatedMoviesByPeriod(period as TopRatedPeriod),
        getTopRatedTvByPeriod(period as TopRatedPeriod),
      ]);
      movies = combineContentItems(topMovies, topShows);
    } else if (category === "upcoming-movies" && upcomingPeriods.includes(period as UpcomingPeriod)) {
      movies = await getUpcomingMoviesByPeriod(period as UpcomingPeriod);
    } else if (category === "upcoming-tv" && upcomingPeriods.includes(period as UpcomingPeriod)) {
      movies = await getUpcomingTvShows(period as UpcomingPeriod);
    } else if (category === "coming-soon" && upcomingPeriods.includes(period as UpcomingPeriod)) {
      const [upcomingMovies, upcomingShows] = await Promise.all([
        getUpcomingMoviesByPeriod(period as UpcomingPeriod),
        getUpcomingTvShows(period as UpcomingPeriod),
      ]);
      movies = [...upcomingMovies, ...upcomingShows]
        .sort((first, second) =>
          (second.popularity ?? 0) - (first.popularity ?? 0) ||
          first.release_date.localeCompare(second.release_date),
        )
        .slice(0, 20);
    } else if (!period && movieCategories.includes(category as MovieCategory)) {
      movies = await getMoviesByCategory(category as MovieCategory);
    }

    if (!movies) {
      return NextResponse.json({ error: "Invalid movie category or period" }, { status: 400 });
    }

    return NextResponse.json({ results: movies });
  } catch {
    return NextResponse.json({ error: "Unable to load movies" }, { status: 502 });
  }
}