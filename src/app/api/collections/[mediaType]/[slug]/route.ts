import { NextResponse } from "next/server";
import {
  findContentCollection,
  getCollectionRailItems,
  getCollectionTrailers,
  getPopularContent,
  popularModes,
  topRatedPeriods,
  trendingPeriods,
  upcomingPeriods,
  type PopularMode,
  type TopRatedPeriod,
  type TrendingPeriod,
  type UpcomingPeriod,
} from "@/utils/movieService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaType: string; slug: string }> },
) {
  const { mediaType, slug } = await params;
  const collection = findContentCollection(mediaType, slug);
  if (!collection) {
    return NextResponse.json({ error: "Unknown content collection" }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const category = searchParams.get("category");
  const period = searchParams.get("period");
  const mode = searchParams.get("mode");

  try {
    if (category === "popular" && popularModes.includes(mode as PopularMode)) {
      return NextResponse.json({
        results: await getPopularContent(mode as PopularMode, collection.mediaType, collection.slug),
      });
    }
    if (category === "trailers") {
      return NextResponse.json({
        results: await getCollectionTrailers(collection.mediaType, collection.slug),
      });
    }
    if (category === "trending" && trendingPeriods.includes(period as TrendingPeriod)) {
      return NextResponse.json({
        results: await getCollectionRailItems(
          collection.mediaType,
          collection.slug,
          "trending",
          period as TrendingPeriod,
        ),
      });
    }
    if (category === "top-rated" && topRatedPeriods.includes(period as TopRatedPeriod)) {
      return NextResponse.json({
        results: await getCollectionRailItems(
          collection.mediaType,
          collection.slug,
          "top-rated",
          period as TopRatedPeriod,
        ),
      });
    }
    if (category === "coming-soon" && upcomingPeriods.includes(period as UpcomingPeriod)) {
      return NextResponse.json({
        results: await getCollectionRailItems(
          collection.mediaType,
          collection.slug,
          "coming-soon",
          period as UpcomingPeriod,
        ),
      });
    }
    return NextResponse.json({ error: "Invalid collection category or filter" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to load collection titles" }, { status: 502 });
  }
}
