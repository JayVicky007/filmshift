import HomeHero from "@/components/HomeHero";
import ContentRail from "@/components/ContentRail";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  getTrendingMoviesByPeriod,
} from "@/utils/movieService";

const sections = [
  { title: "Trending", category: "trending" as const },
  { title: "Now Playing", category: "now-playing" as const },
  { title: "Top Rated", category: "top-rated" as const },
  { title: "Upcoming", category: "upcoming" as const },
];

export default async function HomePage() {
  /* 🚀 Re-aligned the Promise array fetching sequence to match our new layout order! */
  const [trending, nowPlaying, topRated, upcoming] = await Promise.all([
    getTrendingMoviesByPeriod("year"),
    getMoviesByCategory("now-playing"),
    getTopRatedMoviesByPeriod("all-time"), // Fetches top-rated 3rd now
    getMoviesByCategory("upcoming"),  // Fetches upcoming 4th now
  ]);
  const moviesByCategory = [trending, nowPlaying, topRated, upcoming];

  return (
    <main className="min-h-screen bg-background px-4 pb-4 text-foreground sm:px-8 sm:pb-8">
      <HomeHero movies={trending} />

      <div className="mx-auto mt-16 max-w-7xl space-y-16">
        {sections.map((section, index) => (
          <ContentRail
            key={section.category}
            title={section.title}
            category={section.category}
            movies={moviesByCategory[index]}
            periodFilter={section.category === "trending" || section.category === "top-rated"}
            periodCategory={section.category === "top-rated" ? "top-rated" : "trending"}
          />
        ))}
      </div>
    </main>
  );
}
