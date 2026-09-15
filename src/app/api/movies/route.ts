import { NextResponse } from "next/server";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  getTrendingMoviesByPeriod,
  movieCategories,
  topRatedPeriods,
  trendingPeriods,
  type MovieCategory,
  type TopRatedPeriod,
  type TrendingPeriod,
} from "@/utils/movieService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const period = searchParams.get("period");

  try {
    const movies = category === "trending" && trendingPeriods.includes(period as TrendingPeriod)
      ? await getTrendingMoviesByPeriod(period as TrendingPeriod)
      : category === "top-rated" && topRatedPeriods.includes(period as TopRatedPeriod)
        ? await getTopRatedMoviesByPeriod(period as TopRatedPeriod)
      : movieCategories.includes(category as MovieCategory)
        ? await getMoviesByCategory(category as MovieCategory)
        : null;

    if (!movies) {
      return NextResponse.json({ error: "Invalid movie category or period" }, { status: 400 });
    }

    return NextResponse.json({ results: movies });
  } catch {
    return NextResponse.json({ error: "Unable to load movies" }, { status: 502 });
  }
}