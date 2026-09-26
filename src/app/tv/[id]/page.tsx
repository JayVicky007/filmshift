// "use client";

// import React, { useState } from "react";
// import { getTvShowDetails, type TvShowDetails } from "@/utils/movieService";
// import ContentCarousel from "@/components/ContentCarousel";
// import RatingRing from "@/components/RatingRing";
// import { Play, X } from "lucide-react";
// import Link from "next/link";

// const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
// const TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
// const TMDB_PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";

// function formatScore(score: number | null) {
//   return score === null ? "N/A" : score.toFixed(1);
// }

// // 🚀 Fixed secure template match mapping law
// function googleSearchUrl(name: string, showName: string) {
//   return `https://google.com/search?q=${encodeURIComponent(`${name} ${showName}`)}`;
// }

// export default function TvShowDetailPage({
//   params,
// }: {
//   params: React.ComponentProps<any>["params"];
// }) {
//   const resolvedParams = React.use(params as any) as { id: string };
//   const [show, setShow] = useState<TvShowDetails | null>(null);
//   const [error, setError] = useState(false);

//   React.useEffect(() => {
//     getTvShowDetails(resolvedParams.id)
//       .then((data) => {
//         if (data) {
//           setShow(data);
//           window.scrollTo({ top: 0, left: 0, behavior: "instant" });
//         } else {
//           setError(true);
//         }
//       })
//       .catch(() => setError(true));
//   }, [resolvedParams.id]);

//   if (error) {
//     return (
//       <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
//         <p className="text-xl font-semibold">TV Series not found</p>
//       </main>
//     );
//   }

//   if (!show) {
//     return (
//       <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground animate-pulse">
//         <p className="text-xl font-semibold text-text-muted">Loading series details...</p>
//       </main>
//     );
//   }

//   const posterUrl = show.poster_path ? `${TMDB_POSTER_BASE_URL}${show.poster_path}` : null;
//   const backdropUrl = show.backdrop_path ? `${TMDB_BACKDROP_BASE_URL}${show.backdrop_path}` : null;

//   return (
//     <main className="min-h-screen bg-background text-foreground pb-12">
//       {/* 1. Immersive Hero Backdrop Header */}
//       <section className="relative isolate overflow-hidden border-b border-text-muted/15">
//         {backdropUrl && (
//           <div
//             className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
//             style={{ backgroundImage: `url(${backdropUrl})` }}
//             aria-hidden="true"
//           />
//         )}
//         <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,18,35,0.98)_0%,rgba(7,18,35,0.9)_48%,rgba(7,18,35,0.62)_100%)]" />
//         <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--background)_0%,transparent_45%,rgba(7,18,35,0.4)_100%)]" />

//         <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-5 pb-16 pt-8 sm:px-8 md:flex-row md:items-start md:gap-10 md:px-10 md:pt-14 lg:gap-12 lg:px-12">
          
//           <div className="w-full min-w-0 flex-shrink-0 md:w-[300px] lg:w-[350px]">
//             {posterUrl ? (
//               <img
//                 src={posterUrl}
//                 alt={`${show.name} poster`}
//                 className="h-auto w-full rounded-[28px] border border-text-muted/15 object-contain shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
//               />
//             ) : (
//               <div className="flex aspect-[2/3] items-center justify-center rounded-[28px] border border-text-muted/15 bg-surface p-6 text-center text-text-muted">
//                 Poster unavailable
//               </div>
//             )}
//           </div>

//           <div className="min-w-0 flex-1">
//             <Link href="/blog" className="text-sm font-semibold text-accent transition-colors hover:text-yellow-300">
//               ← Back to Journal Dashboard
//             </Link>
            
//             <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
//               {show.name}
//             </h1>
            
//             {show.tagline && (
//               <p className="mt-3 text-lg italic text-white/70">"{show.tagline}"</p>
//             )}

//             <div className="mt-5 flex flex-wrap items-center gap-2 text-sm leading-5 text-white/70">
//               <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent uppercase font-bold text-[10px]">TV Series</span>
//               <span aria-hidden="true">·</span>
//               <span>{show.first_air_date ? show.first_air_date.slice(0, 4) : "N/A"}</span>
//               <span aria-hidden="true">·</span>
//               <span>{show.number_of_seasons} {show.number_of_seasons === 1 ? "Season" : "Seasons"} ({show.number_of_episodes} eps)</span>
//             </div>

//             <div className="mt-5 flex flex-wrap gap-2">
//               {show.genres?.map((genre) => (
//                 <span
//                   key={genre.id}
//                   className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-sm text-white"
//                 >
//                   {genre.name}
//                 </span>
//               ))}
//             </div>
//             <div className="mt-8 flex flex-wrap items-center gap-4">
//               <div className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-2 flex items-center gap-3 h-14">
//                 <div>
//                   <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Audience</p>
//                   <p className="text-xs text-white/60">Score Rating</p>
//                 </div>
//                 <RatingRing rating={show.vote_average} size="sm" />
//               </div>
              
//               {show.trailer && <TvTrailerModalButton trailerKey={show.trailer.key} seriesTitle={show.name} />}
//             </div>

//             <p className="mt-8 max-w-3xl text-lg leading-8 text-white/85">
//               {show.overview || "No summary is available for this series."}
//             </p>

//             <p className="mt-3 text-xs text-white/50 mb-10">
//               {show.vote_count?.toLocaleString() || 0} audience votes
//             </p>

//             {/* 🚀 UPGRADED: Clean, full type-safe parity metrics across IMDb, Rotten Tomatoes, and Metacritic */}
//             <section className="mt-10">
//               <h2 className="text-2xl font-bold text-white">Critic Scores</h2>
//               <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
//                 <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-foreground shadow-sm">
//                   <p className="text-sm font-semibold text-text-muted">IMDb Rating</p>
//                   <p className="mt-1 text-2xl font-bold text-foreground">
//                     {formatScore(show.ratings.imdb)}
//                   </p>
//                 </div>
//                 <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-foreground shadow-sm">
//                   <p className="text-sm font-semibold text-text-muted">Rotten Tomatoes</p>
//                   <p className="mt-1 text-2xl font-bold text-foreground">
//                     {show.ratings.rottenTomatoes === null ? "N/A" : `${show.ratings.rottenTomatoes}%`}
//                   </p>
//                 </div>
//                 <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-foreground shadow-sm">
//                   <p className="text-sm font-semibold text-text-muted">Metacritic</p>
//                   <p className="mt-1 text-2xl font-bold text-foreground">
//                     {show.ratings.metascore === null ? "--" : show.ratings.metascore}
//                   </p>
//                   <p className="text-[10px] font-medium text-text-muted mt-0.5">
//                     {show.ratings.metascore !== null ? "Official Metascore" : "No Score Available"}
//                   </p>
//                 </div>
//               </div>
//             </section>
//           </div>
//         </div>
//       </section>

//       {/* 2. Secondary Metadata Stack (Credits and Cast) */}
//       <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 sm:px-8 lg:px-12">
//         {show.creators && show.creators.length > 0 && (
//           <section className="md:px-4">
//             <h2 className="pl-1 text-2xl font-bold">Credits</h2>
//             <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
//               <p className="rounded-xl border border-text-muted/15 bg-surface p-4">
//                 <span className="font-semibold text-text-muted">Created By:</span>{" "}
//                 {show.creators.map((creator: string, index: number) => (
//                   <span key={creator}>
//                     {index > 0 ? ", " : ""}
//                     <a
//                       href={googleSearchUrl(creator, show.name)}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="no-underline transition-colors hover:text-accent"
//                     >
//                       {creator}
//                     </a>
//                   </span>
//                 ))}
//               </p>
              
//               <p className="rounded-xl border border-text-muted/15 bg-surface p-4">
//                 <span className="font-semibold text-text-muted">Production Status:</span>{" "}
//                 <span className="text-emerald-400 font-medium">{show.status || "Ongoing"}</span>
//               </p>
//             </div>
//           </section>
//         )}

//         {show.cast && show.cast.length > 0 && (
//           <section className="md:px-4">
//             <h2 className="pl-1 text-2xl font-bold">Top Cast</h2>
//             <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
//               {show.cast.map((person) => (
//                 <div key={person.id} className="min-w-0 text-center">
//                   <a
//                     href={googleSearchUrl(person.name, show.name)}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="block no-underline"
//                   >
//                     <div className="mx-auto aspect-square w-full max-w-32 overflow-hidden rounded-full border border-text-muted/15 bg-surface">
//                       {person.profilePath ? (
//                         <img
//                           src={`${TMDB_PROFILE_BASE_URL}${person.profilePath}`}
//                           alt={person.name}
//                           className="h-full w-full object-cover"
//                         />
//                       ) : (
//                         <div className="flex h-full items-center justify-center text-2xl text-text-muted bg-surface/50">?</div>
//                       )}
//                     </div>
//                     <p className="mt-3 truncate font-semibold transition-colors hover:text-accent">{person.name}</p>
//                   </a>
//                   <p className="truncate text-sm text-text-muted">{person.character}</p>
//                 </div>
//               ))}
//             </div>
//           </section>
//         )}

//         {show.similar && show.similar.length > 0 && (
//           <ContentCarousel title="Similar TV Shows" movies={show.similar} />
//         )}

//         {show.recommendations && show.recommendations.length > 0 && (
//           <ContentCarousel title="Recommendations" movies={show.recommendations} />
//         )}
//       </div>
//     </main>
//   );
// }

// function TvTrailerModalButton({ trailerKey, seriesTitle }: { trailerKey: string; seriesTitle: string }) {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       <button
//         type="button"
//         onClick={() => setIsOpen(true)}
//         className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 h-14 font-bold text-slate-950 transition-all hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
//       >
//         <Play className="h-4 w-4 fill-current" />
//         <span>Watch Trailer</span>
//       </button>

//       {isOpen && (
//         <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md">
//           <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
//           <div className="relative w-full max-w-4xl rounded-2xl border border-text-muted/20 bg-surface p-4 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10">
//             <div className="flex items-center justify-between pb-3 px-1 border-b border-text-muted/10 shrink-0 mb-3">
//               <h3 className="font-bold text-foreground text-sm truncate pr-4">
//                 {seriesTitle} — Trailer
//               </h3>
//               <button
//                 type="button"
//                 onClick={() => setIsOpen(false)}
//                 className="rounded-full p-2 text-text-muted hover:bg-text-muted/10 hover:text-foreground transition-colors cursor-pointer shrink-0"
//                 aria-label="Close trailer"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-text-muted/10">              
//               <iframe
//                 src={`https://youtube.com/embed/${trailerKey}`}
//                 title={`${seriesTitle} Official Trailer`}
//                 className="absolute inset-0 h-full w-full border-0"
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                 allowFullScreen
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }




import React from "react";
import { getTvShowDetails } from "@/utils/movieService";
import ContentCarousel from "@/components/ContentCarousel";
import RatingRing from "@/components/RatingRing";
import Link from "next/link";
import { TvTrailerModalButton } from "./TvTrailerModalButton";


  const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
	const TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";
	const TMDB_PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185";


function formatScore(score: number | null) {
  return score === null ? "N/A" : score.toFixed(1);
}

function googleSearchUrl(name: string, showName: string) {
  return `https://google.com/search?q=${encodeURIComponent(`${name} ${showName}`)}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TvShowDetailPage({ params }: PageProps) {
  const { id } = await params;
  const show = await getTvShowDetails(id);

  if (!show) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        <p className="text-xl font-semibold">TV Series not found</p>
      </main>
    );
  }

  const posterUrl = show.poster_path ? `${TMDB_POSTER_BASE_URL}${show.poster_path}` : null;
  const backdropUrl = show.backdrop_path ? `${TMDB_BACKDROP_BASE_URL}${show.backdrop_path}` : null;

  return (
    <main className="min-h-screen bg-background text-foreground pb-12 animate-fade-entry">
      <section className="relative isolate overflow-hidden border-b border-text-muted/15">
        {backdropUrl && (
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,18,35,0.98)_0%,rgba(7,18,35,0.9)_48%,rgba(7,18,35,0.62)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--background)_0%,transparent_45%,rgba(7,18,35,0.4)_100%)]" />

        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-5 pb-16 pt-8 sm:px-8 md:flex-row md:items-start md:gap-10 md:px-10 md:pt-14 lg:gap-12 lg:px-12">
          
          <div className="w-full min-w-0 flex-shrink-0 md:w-[300px] lg:w-[350px]">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${show.name} poster`}
                className="h-auto w-full rounded-[28px] border border-text-muted/15 object-contain shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-[28px] border border-text-muted/15 bg-surface p-6 text-center text-text-muted">
                Poster unavailable
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link href="/blog" className="text-sm font-semibold text-accent transition-colors hover:text-yellow-300">
              ← Back to Journal Dashboard
            </Link>
            
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              {show.name}
            </h1>
            
            {show.tagline && (
              <p className="mt-3 text-lg italic text-white/70">"{show.tagline}"</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm leading-5 text-white/70">
              <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-accent uppercase font-bold text-[10px]">TV Series</span>
              <span aria-hidden="true">·</span>
              <span>{show.first_air_date ? show.first_air_date.slice(0, 4) : "N/A"}</span>
              <span aria-hidden="true">·</span>
              <span>{show.number_of_seasons} {show.number_of_seasons === 1 ? "Season" : "Seasons"} ({show.number_of_episodes} eps)</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {show.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-sm text-white"
                >
                  {genre.name}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-accent/40 bg-accent/15 px-4 py-2 flex items-center gap-3 h-14">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Audience</p>
                  <p className="text-xs text-white/60">Score Rating</p>
                </div>
                <RatingRing rating={show.vote_average} size="sm" />
              </div>
              
              {show.trailer && <TvTrailerModalButton trailerKey={show.trailer.key} seriesTitle={show.name} />}
            </div>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/85">
              {show.overview || "No summary is available for this series."}
            </p>

            <p className="mt-3 text-xs text-white/50 mb-10">
              {show.vote_count?.toLocaleString() || 0} audience votes
            </p>

            <section className="mt-10">
              <h2 className="text-2xl font-bold text-white">Critic Scores</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">IMDb Rating</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {formatScore(show.ratings.imdb)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">Rotten Tomatoes</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {show.ratings.rottenTomatoes === null ? "N/A" : `${show.ratings.rottenTomatoes}%`}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-foreground shadow-sm">
                  <p className="text-sm font-semibold text-text-muted">Metacritic</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {show.ratings.metascore === null ? "--" : show.ratings.metascore}
                  </p>
                  <p className="text-[10px] font-medium text-text-muted mt-0.5">
                    {show.ratings.metascore !== null ? "Official Metascore" : "No Score Available"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 sm:px-8 lg:px-12">
        {show.creators && show.creators.length > 0 && (
          <section className="md:px-4">
            <h2 className="pl-1 text-2xl font-bold">Credits</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p className="rounded-xl border border-text-muted/15 bg-surface p-4">
                <span className="font-semibold text-text-muted">Created By:</span>{" "}
                {show.creators.map((creator: string, index: number) => (
                  <span key={creator}>
                    {index > 0 ? ", " : ""}
                    <a href={googleSearchUrl(creator, show.name)} target="_blank" rel="noreferrer" className="no-underline transition-colors hover:text-accent">
                      {creator}
                    </a>
                  </span>
                ))}
              </p>
              
              <p className="rounded-xl border border-text-muted/15 bg-surface p-4">
                <span className="font-semibold text-text-muted">Production Status:</span>{" "}
                <span className="text-emerald-400 font-medium">{show.status || "Ongoing"}</span>
              </p>
            </div>
          </section>
        )}

        {show.cast && show.cast.length > 0 && (
          <section className="md:px-4">
            <h2 className="pl-1 text-2xl font-bold">Top Cast</h2>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
              {show.cast.map((person) => (
                <div key={person.id} className="min-w-0 text-center">
                  <a href={googleSearchUrl(person.name, show.name)} target="_blank" rel="noreferrer" className="block no-underline">
                    <div className="mx-auto aspect-square w-full max-w-32 overflow-hidden rounded-full border border-text-muted/15 bg-surface">
                      {person.profilePath ? (
                        <img src={`${TMDB_PROFILE_BASE_URL}${person.profilePath}`} alt={person.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-text-muted bg-surface/50">?</div>
                      )}
                    </div>
                    <p className="mt-3 truncate font-semibold transition-colors hover:text-accent">{person.name}</p>
                  </a>
                  <p className="truncate text-sm text-text-muted">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {show.similar && show.similar.length > 0 && <ContentCarousel title="Similar TV Shows" movies={show.similar} />}
        {show.recommendations && show.recommendations.length > 0 && <ContentCarousel title="Recommendations" movies={show.recommendations} />}
      </div>
    </main>
  );
}

