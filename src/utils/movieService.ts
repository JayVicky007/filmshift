import axios from "axios";
import { unstable_cache } from "next/cache"; // ⚡️ Import Next.js Core Cache functionality


export interface ContentItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  media_type?: string;
}

/** @deprecated Use ContentItem for shared movie, series, and other content lists. */
export type TrendingMovie = ContentItem;

interface TmdbGenre {
  id: number;
  name: string;
}

export interface SearchSuggestion {
  id: number;
  title: string;
  mediaType: "Movie" | "TV Series" | "Animation" | "Anime" | "Documentary" | "Person" | string;
  rawMediaType: "movie" | "tv" | "person";
  posterPath: string | null;
}

export const movieCategories = [
  "trending",
  "upcoming",
  "now-playing",
  "top-rated",
] as const;

export type MovieCategory = (typeof movieCategories)[number];
export const trendingPeriods = ["day", "week", "month", "year"] as const;
export type TrendingPeriod = (typeof trendingPeriods)[number];
export const topRatedPeriods = ["all-time", "year", "month"] as const;
export type TopRatedPeriod = (typeof topRatedPeriods)[number];

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbMovie {
  imdbRating?: string;
  Metascore?: string;
  Ratings?: OmdbRating[];
}

export function rankAllTimeMovies(movies: ContentItem[]): ContentItem[] {
  const globalMean = movies.length > 0
    ? movies.reduce((sum, movie) => sum + movie.vote_average, 0) / movies.length
    : 7;
  const minimumVotes = 1000;

  return movies
    .map((movie) => {
      const voteCount = movie.vote_count ?? 0;
      const bayesianRating =
        (voteCount / (voteCount + minimumVotes)) * movie.vote_average +
        (minimumVotes / (voteCount + minimumVotes)) * globalMean;
      const releaseYear = Number.parseInt(movie.release_date.slice(0, 4), 10);
      const ageBonus = Number.isFinite(releaseYear)
        ? Math.min(0.15, Math.max(0, (new Date().getFullYear() - releaseYear) / 500))
        : 0;

      return { movie, score: bayesianRating + ageBonus };
    })
    .sort((first, second) => second.score - first.score)
    .map(({ movie }) => movie);
}

export function formatMovieRating(rating: number | null | undefined) {
  return rating && Number.isFinite(rating) && rating > 0
    ? `${rating.toFixed(1)}/10`
    : "--/10";
}

const getApiUrl = (baseUrl: string | undefined, path: string) => {
  let cleanBaseUrl = baseUrl;
  
  if (!cleanBaseUrl) {
    if (path.includes("movie") || path.includes("tv") || path.includes("trending") || path.includes("discover") || path.includes("search")) {
      cleanBaseUrl = "https://themoviedb.org";
    } else {
      cleanBaseUrl = "https://omdbapi.com";
    }
  }

  return `${cleanBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

const parseScore = (score: string | undefined, suffix = "") => {
  if (!score) {
    return null;
  }

  const normalizedScore = suffix ? score.replace(suffix, "") : score;
  const parsedScore = Number.parseFloat(normalizedScore);

  return Number.isNaN(parsedScore) ? null : parsedScore;
};


export async function getTrendingMovies(): Promise<ContentItem[]> {
  return getMoviesByCategory("trending");
}

// export async function getMoviesByCategory(
//   category: MovieCategory,
// ): Promise<ContentItem[]> {
//   const endpoint = category === "trending"
//     ? "trending/movie/week"
//     : `movie/${category.replace("-", "_")}`;
//   const response = await axios.get<{ results: ContentItem[] }>(
//     getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, endpoint),
//     {
//       params: {
//         api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
//       },
//     },
//   );

//   const movies = response.data.results;

//   if (category === "upcoming") {
//     const today = new Date().toISOString().slice(0, 10);
//     return movies.filter((movie) => movie.release_date >= today);
//   }

//   return movies;
// }

 /* ⚡️ CORE REVALIDATION CACHE WRAPPER */
export const getMoviesByCategory = unstable_cache(
  async (category: MovieCategory): Promise<ContentItem[]> => {
    const endpoint = category === "trending"
      ? "trending/movie/week"
      : `movie/${category.replace("-", "_")}`;
      
    const response = await axios.get<{ results: ContentItem[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, endpoint),
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
        },
      },
    );

    const movies = response.data.results;

    if (category === "upcoming") {
      const today = new Date().toISOString().slice(0, 10);
      return movies.filter((movie) => movie.release_date >= today);
    }

    return movies;
  },
  ["movies-by-category-cache"], // Cache Identifier Key
  { revalidate: 3600 }          // Stale-While-Revalidate window: 1 Hour (3,600 seconds)
);


// export async function getTrendingMoviesByPeriod(
//   period: TrendingPeriod,
// ): Promise<ContentItem[]> {
//   if (period === "day" || period === "week") {
//     const response = await axios.get<{ results: ContentItem[] }>(
//       getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `trending/movie/${period}`),
//       { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } },
//     );

//     return response.data.results;
//   }

//   const today = new Date();
//   const startDate = new Date(today);
//   startDate.setDate(today.getDate() - (period === "month" ? 30 : 365));
//   const response = await axios.get<{ results: ContentItem[] }>(
//     getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
//     {
//       params: {
//         api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
//         sort_by: "popularity.desc",
//         "primary_release_date.gte": startDate.toISOString().slice(0, 10),
//         "primary_release_date.lte": today.toISOString().slice(0, 10),
//       },
//     },
//   );

//   return response.data.results;
// }

export const getTrendingMoviesByPeriod = unstable_cache(
  async (period: TrendingPeriod): Promise<ContentItem[]> => {
    if (period === "day" || period === "week") {
      const response = await axios.get<{ results: ContentItem[] }>(
        getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `trending/movie/${period}`),
        { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } },
      );

      return response.data.results;
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (period === "month" ? 30 : 365));
    
    const response = await axios.get<{ results: ContentItem[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
          sort_by: "popularity.desc",
          "primary_release_date.gte": startDate.toISOString().slice(0, 10),
          "primary_release_date.lte": today.toISOString().slice(0, 10),
        },
      },
    );

    return response.data.results;
  },
  ["trending-movies-period-cache"],
  { revalidate: 3600 } // Holds information for 1 hour before checking for updates in background
);


export async function getTopRatedMoviesByPeriod(
  period: TopRatedPeriod,
): Promise<ContentItem[]> {
  if (period === "all-time") {
    const today = new Date();
    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, index) => index + 1).map((page) =>
        axios.get<{ results: ContentItem[] }>(
          getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
          {
            params: {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
              sort_by: "vote_count.desc",
              "vote_count.gte": 1000,
              page,
            },
          },
        ),
      ),
    );
    const candidates = responses
      .flatMap((response) => response.data.results)
      .filter((movie) => movie.release_date <= today.toISOString().slice(0, 10))
      .filter((movie) => {
        const releaseYear = Number.parseInt(movie.release_date.slice(0, 4), 10);
        const ageInYears = today.getFullYear() - releaseYear;
        const minimumVotes = ageInYears < 2
          ? 10000
          : ageInYears < 5
            ? 5000
            : 1000;

        return (movie.vote_count ?? 0) >= minimumVotes;
      });

    return rankAllTimeMovies(candidates);
  }

  const today = new Date();
  const startDate = new Date(today);
  const days = period === "year" ? 365 : 30;
  startDate.setDate(today.getDate() - days);

  const response = await axios.get<{ results: ContentItem[] }>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
    {
      params: {
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
        sort_by: "vote_average.desc",
        "vote_count.gte": period === "year" ? 100 : 25,
        "primary_release_date.gte": startDate.toISOString().slice(0, 10),
        "primary_release_date.lte": today.toISOString().slice(0, 10),
      },
    },
  );

  return response.data.results;
}


export async function getUnifiedTrendingByPeriod(period: "day" | "week" | "month" | "year"): Promise<ContentItem[]> {
  try {
    const [movies, tvShows] = await Promise.all([
      getTrendingMoviesByPeriod(period),
      getTrendingTvByPeriod(period === "year" ? "week" : (period as "day" | "week")),
    ]);

    const combined: ContentItem[] = [];
    const maxLength = Math.max(movies.length, tvShows.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (movies[i]) combined.push({ ...movies[i], media_type: "movie" });
      if (tvShows[i]) combined.push({ ...tvShows[i], media_type: "tv" });
    }

    return combined;
  } catch (error) {
    console.error("❌ Failed to fetch unified trending content:", error);
    return getTrendingMoviesByPeriod(period);
  }
}

export async function searchMovies(query: string): Promise<ContentItem[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await axios.get<{ results: any[] }>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/multi"),
    {
      params: {
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
        query: query.trim(),
        include_adult: false,
      },
    }
  );

  return response.data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.release_date || item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      media_type: item.media_type,
    }));
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const response = await axios.get<{
    results: Array<{
      id: number;
      media_type: "movie" | "tv" | "person";
      title?: string;
      name?: string;
      poster_path?: string | null;
      profile_path?: string | null;
      genre_ids?: number[];
      original_language?: string;
      release_date?: string;
      first_air_date?: string;
    }>;
  }>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/multi"), {
    params: {
      api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
      query: query.trim(),
      include_adult: false,
    },
  });

  return response.data.results
    .filter((result) => result.media_type === "movie" || result.media_type === "tv" || result.media_type === "person")
    .slice(0, 6)
    .map((result) => {
      const rawDate = result.release_date || result.first_air_date || "";
      const year = rawDate ? ` (${rawDate.slice(0, 4)})` : "";
      const baseTitle = result.title ?? result.name ?? "Untitled";

      return {
        id: result.id,
        title: result.media_type === "person" ? baseTitle : `${baseTitle}${year}`,
        rawMediaType: result.media_type,
        mediaType: result.media_type === "person"
          ? "Person"
          : result.genre_ids?.includes(99)
            ? "Documentary"
            : result.genre_ids?.includes(16) && result.original_language === "ja"
              ? "Anime"
              : result.genre_ids?.includes(16)
                ? "Animation"
                : result.media_type === "tv"
                  ? "TV Series"
                  : "Movie",
        posterPath: result.poster_path ?? result.profile_path ?? null,
      };
    });
}


// export async function getMoviesByDirector(directorName: string, excludeMovieId: number): Promise<ContentItem[]> {
//   try {
//     const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
//     if (!apiKey || !directorName) return [];

//     // Step 1: Find the Director's unique TMDB Person ID
//     const searchResponse = await axios.get<{ results: Array<{ id: number }> }>(
//       getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/person"),
//       { params: { api_key: apiKey, query: directorName } }
//     );

//     const personId = searchResponse.data.results?.[0]?.id;
//     if (!personId) return [];

//     // Step 2: Use discover/movie to find other films directed by this person ID
//     const discoverResponse = await axios.get<{ results: any[] }>(
//       getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
//       {
//         params: {
//           api_key: apiKey,
//           with_crew: personId,
//           crew_role: "Director",
//           sort_by: "popularity.desc",
//         },
//       }
//     );

//     return discoverResponse.data.results
//       .filter((movie) => movie.id !== excludeMovieId)
//       .map((movie) => ({
//         id: movie.id,
//         title: movie.title ?? "Untitled",
//         poster_path: movie.poster_path,
//         release_date: movie.release_date || "",
//         vote_average: movie.vote_average ?? 0,
//         media_type: "movie"
//       }))
//       .slice(0, 10);
//   } catch (error) {
//     console.error("❌ Error fetching movies by director:", error);
//     return [];
//   }
// }

// export async function getTvShowsByCreator(creatorName: string, excludeTvId: number): Promise<ContentItem[]> {
//   try {
//     const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
//     if (!apiKey || !creatorName) return [];

//     // Step 1: Find the Creator's unique TMDB Person ID
//     const searchResponse = await axios.get<{ results: Array<{ id: number }> }>(
//       getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/person"),
//       { params: { api_key: apiKey, query: creatorName } }
//     );

//     const personId = searchResponse.data.results?.[0]?.id;
//     if (!personId) return [];

//     // Step 2: Use discover/tv to find other shows involving this person ID as a creator
//     const discoverResponse = await axios.get<{ results: any[] }>(
//       getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/tv"),
//       {
//         params: {
//           api_key: apiKey,
//           with_people: personId,
//           sort_by: "popularity.desc",
//         },
//       }
//     );

//     return discoverResponse.data.results
//       .filter((show) => show.id !== excludeTvId)
//       .map((show) => ({
//         id: show.id,
//         title: show.name ?? "Untitled",
//         poster_path: show.poster_path,
//         release_date: show.first_air_date || "",
//         vote_average: show.vote_average ?? 0,
//         media_type: "tv"
//       }))
//       .slice(0, 10);
//   } catch (error) {
//     console.error("❌ Error fetching TV shows by creator:", error);
//     return [];
//   }
// }

export async function getMoviesByDirector(directorName: string, excludeMovieId: number): Promise<ContentItem[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey || !directorName) return [];

    // Step 1: Find the Director's unique TMDB Person ID
    const searchResponse = await axios.get<{ results: Array<{ id: number }> }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/person"),
      { params: { api_key: apiKey, query: directorName } }
    );

    const personId = searchResponse.data.results?.[0]?.id;
    if (!personId) return [];

    // Step 2: Query their explicit person movie_credits profile to isolate pure filmographies
    const creditsResponse = await axios.get<{ crew: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `person/${personId}/movie_credits`),
      { params: { api_key: apiKey } }
    );

    // 🚀 STRENGTHENED FILTER: Restrict matches strictly to the "Director" job title
    const crewCredits = creditsResponse.data.crew || [];
    const directedMovies = crewCredits
      .filter((credit) => credit.job === "Director")
      .filter((movie) => movie.id !== excludeMovieId);

    // Remove any duplicate records caused by regional film re-entries
    const uniqueMoviesMap = new Map<number, any>();
    directedMovies.forEach((movie) => {
      if (!uniqueMoviesMap.has(movie.id)) {
        uniqueMoviesMap.set(movie.id, movie);
      }
    });

    return Array.from(uniqueMoviesMap.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((movie) => ({
        id: movie.id,
        title: movie.title ?? "Untitled",
        poster_path: movie.poster_path,
        release_date: movie.release_date || "",
        vote_average: movie.vote_average ?? 0,
        media_type: "movie"
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("❌ Error fetching movies by director:", error);
    return [];
  }
}


export async function getTvShowsByCreator(creatorName: string, excludeTvId: number): Promise<ContentItem[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey || !creatorName) return [];

    // Step 1: Find the Creator's unique TMDB Person ID
    const searchResponse = await axios.get<{ results: Array<{ id: number }> }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/person"),
      { params: { api_key: apiKey, query: creatorName } }
    );

    const personId = searchResponse.data.results?.[0]?.id;
    if (!personId) return [];

    // Step 2: Query their explicit person tv_credits profile directly (Bypasses discover parameters)
    const creditsResponse = await axios.get<{ crew: any[], cast: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `person/${personId}/tv_credits`),
      { params: { api_key: apiKey } }
    );

    // Filter for unique shows where they were a "Creator", "Executive Producer", or "Writer"
    const crewCredits = creditsResponse.data.crew || [];
    const createdShows = crewCredits
      .filter((credit) => 
        credit.job === "Creator" || 
        credit.job === "Executive Producer" || 
        credit.job === "Writer"
      )
      .filter((show) => show.id !== excludeTvId);

    // Remove any duplicate entries from matching episodes
    const uniqueShowsMap = new Map<number, any>();
    createdShows.forEach((show) => {
      if (!uniqueShowsMap.has(show.id)) {
        uniqueShowsMap.set(show.id, show);
      }
    });

    return Array.from(uniqueShowsMap.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((show) => ({
        id: show.id,
        title: show.name ?? "Untitled",
        poster_path: show.poster_path,
        release_date: show.first_air_date || "",
        vote_average: show.vote_average ?? 0,
        media_type: "tv"
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("❌ Error fetching TV shows by creator:", error);
    return [];
  }
}



export async function getMovieDetails(movieId: string): Promise<MovieDetails> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error("TMDB API Key is missing from the server environment config.");
  }

  const coreTmdbUrl = getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}`);
  const coreTmdbResponse = await axios.get<any>(coreTmdbUrl, {
    params: { api_key: apiKey, append_to_response: "external_ids,videos" },
  });

  const movieData = coreTmdbResponse.data;
  const imdbId = movieData.external_ids?.imdb_id;

  const omdbPromise = imdbId
    ? axios.get<OmdbMovie>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
        params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: imdbId },
      }).catch(() => null)
    : Promise.resolve(null);

  const creditsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/credits`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { cast: [], crew: [] } }));

  const recommendationsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/recommendations`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { results: [] } }));

  const [omdbResult, creditsResult, recommendationsResult] = await Promise.all([
    omdbPromise,
    creditsPromise,
    recommendationsPromise,
  ]);

  const trailer = movieData.videos?.results.find(
    (video: any) => video.site === "YouTube" && video.type === "Trailer" && video.official
  ) ?? movieData.videos?.results.find((video: any) => video.site === "YouTube" && video.type === "Trailer") ?? null;

  let imdbRating: number | null = null;
  let rottenTomatoes: number | null = null;
  let metascore: number | null = null;

  if (omdbResult && omdbResult.data) {
    const omdbMovie = omdbResult.data;
    imdbRating = parseScore(omdbMovie.imdbRating);
    metascore = parseScore(omdbMovie.Metascore);
    rottenTomatoes = parseScore(
      omdbMovie.Ratings?.find((rating) => rating.Source === "Rotten Tomatoes")?.Value,
      "%"
    );
  }

  const crew = creditsResult.data.crew || [];
  const cast = creditsResult.data.cast || [];

  const directors = crew
    .filter((person: any) => person.job === "Director")
    .map((person: any) => person.name)
    .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index);

  const writers = crew
    .filter((person: any) => person.job === "Writer" || person.job === "Screenplay")
    .map((person: any) => person.name)
    .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index);

  // 🚀 CRUCIAL REFACTOR ELEMENT: Query by primary director instead of TMDB 'similar' endpoints
  const primaryDirector = directors[0] || "";
  const directorMovies = primaryDirector 
    ? await getMoviesByDirector(primaryDirector, movieData.id)
    : [];

  return {
    id: movieData.id,
    title: movieData.title,
    overview: movieData.overview,
    poster_path: movieData.poster_path,
    backdrop_path: movieData.backdrop_path,
    release_date: movieData.release_date,
    status: movieData.status,
    tagline: movieData.tagline,
    audienceRating: movieData.vote_average,
    audienceVoteCount: movieData.vote_count,
    trailer: trailer ? { key: trailer.key, name: trailer.name } : null,
    directors,
    writers,
    cast: cast
      .sort((first: any, second: any) => first.order - second.order)
      .slice(0, 6)
      .map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })),
    similar: directorMovies, // Linked directly into the 'similar' layout slot to keep interface stability
    recommendations: recommendationsResult.data.results?.slice(0, 10) || [],
    genres: movieData.genres || [],
    runtime: movieData.runtime,
    ratings: {
      imdb: imdbRating,
      rottenTomatoes,
      metascore,
    },
  };
}


export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  status: string;
  tagline: string;
  audienceRating: number;
  audienceVoteCount: number;
  trailer: {
    key: string;
    name: string;
  } | null;
  directors: string[];
  writers: string[];
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
  similar: ContentItem[];
  recommendations: ContentItem[];
  genres: TmdbGenre[];
  runtime: number | null;
  ratings: {
    imdb: number | null;
    rottenTomatoes: number | null;
    metascore: number | null;
  };
}


export interface TvShowDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  status: string;
  tagline: string;
  vote_average: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  creators: string[];
  genres: TmdbGenre[];
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
  similar: ContentItem[];
  recommendations: ContentItem[];
  ratings: {
    imdb: number | null;
    rottenTomatoes: number | null;
    metascore: number | null;
  };
  trailer: {
    key: string;
    name: string;
  } | null;
}

export async function getTvShowDetails(id: string): Promise<TvShowDetails | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    
    if (!apiKey) {
      console.warn("⚠️ TV Fetch aborted: TMDB API Key missing.");
      return null;
    }

    const coreTvUrl = getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}`);
    const coreTvResponse = await axios.get<any>(coreTvUrl, {
      params: { api_key: apiKey, append_to_response: "external_ids,videos" },
    });

    const showData = coreTvResponse.data;
    const tvImdbId = showData.external_ids?.imdb_id || (showData.external_ids as any)?.results?.imdb_id;

    const omdbPromise = tvImdbId
      ? axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
          params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: tvImdbId },
        }).catch(() => null)
      : Promise.resolve(null);

    const creditsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/credits`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { cast: [] } }));

    const recommendationsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/recommendations`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { results: [] } }));

    const [omdbResult, creditsResult, recommendationsResult] = await Promise.all([
      omdbPromise,
      creditsPromise,
      recommendationsPromise,
    ]);

    const trailer = showData.videos?.results.find(
      (v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official
    ) ?? showData.videos?.results.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ?? null;

    let imdbRating: number | null = null;
    let rottenTomatoes: number | null = null;
    let metascore: number | null = null;

    if (omdbResult && omdbResult.data) {
      const omdbData = omdbResult.data;
      imdbRating = parseScore(omdbData.imdbRating);
      metascore = parseScore(omdbData.Metascore);
      if (omdbData.Ratings) {
        const rtRating = omdbData.Ratings.find((rating: any) => rating.Source === "Rotten Tomatoes");
        if (rtRating) rottenTomatoes = parseScore(rtRating.Value, "%");
      }
    }

    const mapTvToContentItem = (item: any): ContentItem => ({
      id: item.id,
      title: item.name,
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      media_type: "tv",
    });

    const creators = showData.created_by?.map((c: any) => c.name) || [];

    // 🚀 CRUCIAL REFACTOR ELEMENT: Query by primary creator instead of generic TMDB recommendations
    const primaryCreator = creators[0] || "";
    const creatorTvShows = primaryCreator
      ? await getTvShowsByCreator(primaryCreator, showData.id)
      : [];

    return {
      id: showData.id,
      name: showData.name,
      overview: showData.overview,
      poster_path: showData.poster_path,
      backdrop_path: showData.backdrop_path,
      first_air_date: showData.first_air_date,
      status: showData.status,
      tagline: showData.tagline,
      vote_average: showData.vote_average,
      vote_count: showData.vote_count,
      number_of_seasons: showData.number_of_seasons,
      number_of_episodes: showData.number_of_episodes,
      creators,
      genres: showData.genres || [],
      cast: creditsResult.data.cast?.slice(0, 6).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })) || [],
      similar: creatorTvShows, // Linked directly into the 'similar' carousel row layout slot
      recommendations: recommendationsResult.data.results?.slice(0, 10).map(mapTvToContentItem) || [],
      ratings: {
        imdb: imdbRating,
        rottenTomatoes,
        metascore,
      },
      trailer: trailer ? { key: trailer.key, name: trailer.name } : null,
    };
  } catch (error) {
    console.error("❌ movieService Parallel TV Fetch Error:", error);
    return null;
  }
}

/**
 * ⚡️ CACHED TRENDING TV SERIES
 * Caches seasonal television trends for 1 hour before revalidating.
 */
export const getTrendingTvByPeriod = unstable_cache(
  async (period: "day" | "week"): Promise<ContentItem[]> => {
    const response = await axios.get<{ results: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `trending/tv/${period}`),
      { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } }
    );

    return response.data.results.map((item) => ({
      id: item.id,
      title: item.name ?? item.title ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      media_type: "tv",
    }));
  },
  ["trending-tv-period-cache"],
  { revalidate: 3600 }
);

/**
 * ⚡️ CACHED TV AIRING TODAY
 * Keeps daily broadcast schedules stable and fast.
 */
export const getTvAiringToday = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const response = await axios.get<{ results: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "tv/airing_today"),
      { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } }
    );
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      media_type: "tv",
    }));
  },
  ["tv-airing-today-cache"],
  { revalidate: 3600 }
);

/**
 * ⚡️ CACHED TOP RATED TV
 * Television masterpieces change rarely, so caching these saves significant bandwidth.
 */
export const getTopRatedTv = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const response = await axios.get<{ results: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "tv/top_rated"),
      { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } }
    );
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      media_type: "tv",
    }));
  },
  ["top-rated-tv-cache"],
  { revalidate: 3600 }
);

/**
 * ⚡️ CACHED TV ON THE AIR
 * Stores upcoming network additions safely in memory.
 */
export const getTvOnTheAir = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const response = await axios.get<{ results: any[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "tv/on_the_air"),
      { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } }
    );
    return response.data.results.map((item) => ({
      id: item.id,
      title: item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      media_type: "tv",
    }));
  },
  ["tv-on-the-air-cache"],
  { revalidate: 3600 }
);
