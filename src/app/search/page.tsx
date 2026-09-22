// import Link from "next/link";
// import { searchMovies } from "@/utils/movieService";
// import ContentCard from "@/components/ContentCard"; // 🚀 Import our smart component!

// export default async function SearchPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ q?: string }>;
// }) {
//   const { q = "" } = await searchParams;
//   const movies = await searchMovies(q);
//   const searchTerm = q.trim();

//   return (
//     <main className="min-h-screen bg-background p-8 text-foreground">
//       <header className="mx-auto mb-12 max-w-7xl">
//         <div className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
//           Search
//         </div>
//         <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">
//           Search Results for: &quot;{searchTerm}&quot;
//         </h1>
//       </header>

//       {movies.length === 0 ? (
//         <p
//           role="status"
//           className="mx-auto max-w-7xl rounded-2xl border border-text-muted/15 bg-surface p-6 text-text-muted"
//         >
//           No items found matching your search criteria
//         </p>
//       ) : (
//         <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
//           {movies.map((item) => (
//             // 🚀 Super clean: Reusing our smart card means anime/documentaries auto-route perfectly!
//             <ContentCard key={item.id} movie={item} />
//           ))}
//         </section>
//       )}
//     </main>
//   );
// }


import Link from "next/link";
import { searchMovies } from "@/utils/movieService";
import ContentCard from "@/components/ContentCard"; 

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const movies = await searchMovies(q);
  const searchTerm = q.trim();

  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <header className="mx-auto mb-10 max-w-7xl">
        <Link href="/" className="text-sm font-semibold text-text-muted hover:text-accent">
          ← Back to home
        </Link>
        <div className="mt-6 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Search Directory
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Search Results for: &quot;{searchTerm}&quot;
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Found <strong>{movies.length}</strong> {movies.length === 1 ? 'title' : 'titles'} matching your selection.
        </p>
      </header>

      {movies.length === 0 ? (
        <div
          role="status"
          className="mx-auto max-w-7xl rounded-2xl border border-dashed border-text-muted/20 bg-surface/50 p-12 text-center"
        >
          <p className="text-base font-semibold text-text-muted">
            🍿 No items found matching your search criteria. Try a different combination!
          </p>
        </div>
      ) : (
        /* 🚀 Fully responsive card cluster optimized for 1366x768 monitor resolutions */
        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((item) => (
            <ContentCard key={item.id} movie={item} />
          ))}
        </section>
      )}
    </main>
  );
}
