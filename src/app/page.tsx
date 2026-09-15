import HomeHero from "@/components/HomeHero";
import MovieRail from "@/components/MovieRail";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  getTrendingMoviesByPeriod,
} from "@/utils/movieService";

const sections = [
  { title: "Trending", category: "trending" as const },
  { title: "Now Playing", category: "now-playing" as const },
  { title: "Upcoming", category: "upcoming" as const },
  { title: "Top Rated", category: "top-rated" as const },
];

export default async function HomePage() {
  const [trending, nowPlaying, upcoming, topRated] = await Promise.all([
    getTrendingMoviesByPeriod("year"),
    getMoviesByCategory("now-playing"),
    getMoviesByCategory("upcoming"),
    getTopRatedMoviesByPeriod("all-time"),
  ]);
  const moviesByCategory = [trending, nowPlaying, upcoming, topRated];

  return (
    <main className="min-h-screen bg-background px-4 pb-4 text-foreground sm:px-8 sm:pb-8">
      <HomeHero movies={trending} />

      <div className="mx-auto mt-16 max-w-7xl space-y-16">
        {sections.map((section, index) => (
          <MovieRail
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
