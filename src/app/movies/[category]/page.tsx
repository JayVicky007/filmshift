import Link from "next/link";
import ContentCard from "@/components/ContentCard";
import {
  getMoviesByCategory,
  getTopRatedMoviesByPeriod,
  movieCategories,
  type MovieCategory,
} from "@/utils/movieService";

export default async function MovieCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const selectedCategory = movieCategories.includes(category as MovieCategory)
    ? (category as MovieCategory)
    : null;

  if (!selectedCategory) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        <div className="text-center">
          <h1 className="text-3xl font-black">Category not found</h1>
          <Link href="/" className="mt-4 inline-block text-accent hover:underline">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const movies = selectedCategory === "top-rated"
    ? await getTopRatedMoviesByPeriod("all-time")
    : await getMoviesByCategory(selectedCategory);
  const title = selectedCategory === "top-rated"
    ? "Top Rated"
    : selectedCategory === "now-playing"
      ? "Now Playing"
      : selectedCategory[0].toUpperCase() + selectedCategory.slice(1);

  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <header className="mx-auto mb-10 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent">
          Back to home
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
          FilmShift collection
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 text-lg text-text-muted">Explore more movies in this collection.</p>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {movies.map((movie) => (
          <ContentCard key={movie.id} movie={movie} />
        ))}
      </section>
    </main>
  );
}