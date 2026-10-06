import Link from "next/link";
import { notFound } from "next/navigation";
import ContentRail from "@/components/ContentRail";
import PopularRail from "@/components/PopularRail";
import TrailerRail from "@/components/TrailerRail";
import {
  findContentCollection,
  getCollectionRailItems,
  getCollectionTrailers,
  getPopularContent,
} from "@/utils/movieService";

export default async function ContentCollectionPage({
  params,
}: {
  params: Promise<{ mediaType: string; slug: string }>;
}) {
  const { mediaType, slug } = await params;
  const collection = findContentCollection(mediaType, slug);

  if (!collection) notFound();

  const [trending, popular, trailers, topRated, comingSoon] = await Promise.all([
    getCollectionRailItems(collection.mediaType, collection.slug, "trending", "day"),
    getPopularContent("streaming", collection.mediaType, collection.slug),
    getCollectionTrailers(collection.mediaType, collection.slug),
    getCollectionRailItems(collection.mediaType, collection.slug, "top-rated", "month"),
    getCollectionRailItems(collection.mediaType, collection.slug, "coming-soon", "1-month"),
  ]);
  const indexPath = collection.mediaType === "movie" ? "/movies" : "/tv";
  const description = collection.genreId === 16
    ? collection.originCountries
      ? "Japanese productions classified as animation by TMDB."
      : "Animated titles from around the world, classified by TMDB."
    : "A collection of titles selected using TMDB origin-country metadata. Regional collections can overlap.";

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto mb-10 max-w-7xl">
        <Link href={indexPath} className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
          ← Back to {collection.mediaType === "movie" ? "Movies" : "TV Series"}
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          FilmShift Collection
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {collection.label}
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-text-muted">{description}</p>
      </header>

      <div className="mx-auto max-w-7xl space-y-16">
        <ContentRail
          title="Trending"
          movies={trending}
          periodFilter
          periodCategory="trending"
          collection={{ mediaType: collection.mediaType, slug: collection.slug }}
        />
        <PopularRail
          movies={popular}
          collection={{ mediaType: collection.mediaType, slug: collection.slug }}
        />
        <TrailerRail trailers={trailers} />
        <ContentRail
          title={collection.mediaType === "movie" ? "Top Rated Movies" : "Top Rated TV"}
          movies={topRated}
          periodFilter
          periodCategory="top-rated"
          collection={{ mediaType: collection.mediaType, slug: collection.slug }}
        />
        <ContentRail
          title="Coming Soon"
          movies={comingSoon}
          periodFilter
          periodCategory="coming-soon"
          collection={{ mediaType: collection.mediaType, slug: collection.slug }}
        />
      </div>
    </main>
  );
}
