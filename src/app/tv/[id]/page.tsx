import Link from "next/link";
import { notFound } from "next/navigation";
import { getTvShowDetails } from "@/utils/movieService";
import RatingRing from "@/components/RatingRing";

const TMDB_POSTER_BASE_URL = "https://tmdb.org";
const TMDB_BACKDROP_BASE_URL = "https://tmdb.org";
const TMDB_PROFILE_BASE_URL = "https://tmdb.org";

// A clean, completely flat string combination that cannot break syntax rules
function googleSearchUrl(name: string, showName: string) {
  return "https://google.com" + encodeURIComponent(name + " " + showName);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TvShowDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  let show = null;

  try {
    show = await getTvShowDetails(resolvedParams.id);
  } catch {
    show = null;
  }

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
    <main className="min-h-screen bg-background text-foreground pb-12">
      {/* 1. Immersive Hero Backdrop Header */}
      <section className="relative isolate overflow-hidden border-b border-text-muted/15">
        {backdropUrl && (
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,18,35,0.98)_0%,rgba(7,18,35,0.9)_48%,rgba(7,18,35,0.62)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--background)_0%,transparent_45%,rgba(7,18,35,0.4)_100%)]" />

        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8 px-5 pb-16 pt-8 sm:px-8 md:flex-row md:items-start md:gap-10 md:px-10 md:pt-14 lg:gap-12 lg:px-12">
          
          {/* TV Poster Visual Asset Block */}
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

          {/* TV Metadata Breakdown Layer */}
          <div className="min-w-0 flex-1">
            <Link href="/" className="text-sm font-semibold text-accent transition-colors hover:text-yellow-300">
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
              <div className="rounded-2xl border border-accent/60 bg-accent/15 px-5 py-3">
                <p className="text-sm font-semibold text-white/70">Audience Score</p>
                <div className="mt-2 flex items-center gap-3">
                  <RatingRing rating={show.vote_average ?? 0} size="md" />
                  <span className="text-sm text-white/60">/10</span>
                </div>
              </div>
            </div>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/85">
              {show.overview || "No summary is available for this series."}
            </p>

            <p className="mt-3 text-xs text-white/50">
              {show.vote_count?.toLocaleString() || 0} audience votes
            </p>
          </div>
        </div>
      </section>

      {/* 2. Secondary Metadata Stack (Credits and Cast) */}
      <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 sm:px-8 lg:px-12">
        {show.creators && show.creators.length > 0 && (
          <section className="md:px-4">
            <h2 className="pl-1 text-2xl font-bold">Creators</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p className="rounded-xl border border-text-muted/15 bg-surface p-4">
                <span className="font-semibold text-text-muted">Created By:</span>{" "}
                {show.creators.map((creator: string, index: number) => (
                  <span key={creator}>
                    {index > 0 ? ", " : ""}
                    <a
                      href={googleSearchUrl(creator, show.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="no-underline transition-colors hover:text-accent"
                    >
                      {creator}
                    </a>
                  </span>
                ))}
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
                  <a
                    href={googleSearchUrl(person.name, show.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="block no-underline"
                  >
                    <div className="mx-auto aspect-square w-full max-w-32 overflow-hidden rounded-full border border-text-muted/15 bg-surface">
                      {/* Fixed: Reads the aligned camelCase profilePath from your custom service mapping! */}
                      {person.profilePath ? (
                        <img
                          src={`${TMDB_PROFILE_BASE_URL}${person.profilePath}`}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
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
      </div>
    </main>
  );
}
