import type { ContentItem } from "@/utils/movieService";
import ContentCard from "./ContentCard";

export default function ContentCarousel({
  title,
  movies,
}: {
  title: string;
  movies: ContentItem[];
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="border-l-4 border-accent pl-4 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>

      <div
        role="region"
        aria-label={`${title} titles`}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin] [scrollbar-color:var(--text-muted)_transparent]"
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="w-[42%] min-w-[140px] max-w-[190px] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]"
          >
            <ContentCard movie={movie} />
          </div>
        ))}
      </div>
    </section>
  );
}
