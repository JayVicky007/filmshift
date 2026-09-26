import axios from "axios";


// 🚀 Fetch both trending movies and TV shows, then blend them together cleanly
export async function getUnifiedTrendingByPeriod(period: "day" | "week" | "month" | "year"): Promise<ContentItem[]> {
  try {
    const [movies, tvShows] = await Promise.all([
      getTrendingMoviesByPeriod(period),
      // Fallback to "week" if period is "year" since TMDB tv endpoint defaults to day/week
      getTrendingTvByPeriod(period === "year" ? "week" : (period as "day" | "week")),
    ]);

    // Interleave them or combine and slice
    const combined: ContentItem[] = [];
    const maxLength = Math.max(movies.length, tvShows.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (movies[i]) combined.push({ ...movies[i], media_type: "movie" });
      if (tvShows[i]) combined.push({ ...tvShows[i], media_type: "tv" });
    }

    return combined;
  } catch (error) {
    console.error("❌ Failed to fetch unified trending content:", error);
    return getTrendingMoviesByPeriod(period); // Fallback to movies if it fails
  }
}



interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  status: string;
  tagline: string;
  genres: TmdbGenre[];
  runtime: number | null;
  videos?: {
    results: Array<{
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  similar?: { results: ContentItem[] };
  recommendations?: { results: ContentItem[] };
  external_ids?: {
    imdb_id?: string | null;
  };
}

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

export interface SearchSuggestion {
  id: number;
  title: string;
  mediaType: "Movie" | "TV Series" | "Animation" | "Anime" | "Documentary" | "Person" | string;
  rawMediaType: "movie" | "tv" | "person"; // 🚀 Add this line!
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

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbMovie {
  imdbRating?: string;
  Metascore?: string;
  Ratings?: OmdbRating[];
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

const getApiUrl = (baseUrl: string | undefined, path: string) =>
  `${baseUrl?.replace(/\/+$/, "") ?? ""}/${path.replace(/^\/+/, "")}`;

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

export async function getMoviesByCategory(
  category: MovieCategory,
): Promise<ContentItem[]> {
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
}

export async function getTrendingMoviesByPeriod(
  period: TrendingPeriod,
): Promise<ContentItem[]> {
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
}

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

export async function searchMovies(query: string): Promise<ContentItem[]> {
  if (!query.trim()) {
    return [];
  }

  // 🚀 Switch endpoint from search/movie to search/multi to match suggestions behavior
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

  // Filter out people (actors) so the grid only renders clean watchable cards
  return response.data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "Untitled", // Handle movie titles & tv names safely
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
      // 🚀 Grab the release or first air year for brackets
      const rawDate = result.release_date || result.first_air_date || "";
      const year = rawDate ? ` (${rawDate.slice(0, 4)})` : "";
      const baseTitle = result.title ?? result.name ?? "Untitled";

      return {
        id: result.id,
        title: result.media_type === "person" ? baseTitle : `${baseTitle}${year}`,
        rawMediaType: result.media_type, // 🚀 Pass the absolute truth!
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

export async function getMovieDetails(movieId: string): Promise<MovieDetails> {
  // 🚀 Phase 1: Fetch the lightweight core TMDB data first to get the external IMDB ID as fast as possible
  const coreTmdbUrl = getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}`);
  const coreTmdbResponse = await axios.get<any>(coreTmdbUrl, {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY, append_to_response: "external_ids,videos" },
  });

  const movieData = coreTmdbResponse.data;
  const imdbId = movieData.external_ids?.imdb_id;

  // 🚀 Phase 2: Kick off the OMDb Critic request and the heavy TMDB sub-requests concurrently!
  const omdbPromise = imdbId
    ? axios.get<OmdbMovie>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
        params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: imdbId },
      }).catch(() => null) // Gracefully catch network dropouts
    : Promise.resolve(null);

  const creditsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/credits`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { cast: [], crew: [] } }));

  const similarPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/similar`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { results: [] } }));

  const recommendationsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/recommendations`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { results: [] } }));

  // Execute all secondary lookups concurrently on the server background
  const [omdbResult, creditsResult, similarResult, recommendationsResult] = await Promise.all([
    omdbPromise,
    creditsPromise,
    similarPromise,
    recommendationsPromise,
  ]);

  // 🚀 Phase 3: Parse and aggregate values cleanly into the layout contract
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
    directors: crew
      .filter((person: any) => person.job === "Director")
      .map((person: any) => person.name)
      .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index),
    writers: crew
      .filter((person: any) => person.job === "Writer" || person.job === "Screenplay")
      .map((person: any) => person.name)
      .filter((name: string, index: number, names: string[]) => names.indexOf(name) === index),
    cast: cast
      .sort((first: any, second: any) => first.order - second.order)
      .slice(0, 6)
      .map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })),
    similar: similarResult.data.results?.slice(0, 10) || [],
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
  
  // 🚀 UPGRADED: Unified multi-source tracking fields to support Metacritic parity
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
    // 🚀 Phase 1: Rapid core fetch to extract the TV external IDs block
    const coreTvUrl = getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}`);
    const coreTvResponse = await axios.get<any>(coreTvUrl, {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY, append_to_response: "external_ids,videos" },
    });

    const showData = coreTvResponse.data;
    const tvImdbId = showData.external_ids?.imdb_id || (showData.external_ids as any)?.results?.imdb_id;

    // 🚀 Phase 2: Parallelize external OMDb metrics along with TV sub-catalogs
    const omdbPromise = tvImdbId
      ? axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
          params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: tvImdbId },
        }).catch(() => null)
      : Promise.resolve(null);

    const creditsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/credits`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { cast: [] } }));

    const similarPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/similar`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { results: [] } }));

    const recommendationsPromise = axios.get<any>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/recommendations`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { results: [] } }));

    const [omdbResult, creditsResult, similarResult, recommendationsResult] = await Promise.all([
      omdbPromise,
      creditsPromise,
      similarPromise,
      recommendationsPromise,
    ]);

    // 🚀 Phase 3: Parse elements into unified layout tokens
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
      creators: showData.created_by?.map((c: any) => c.name) || [],
      genres: showData.genres || [],
      cast: creditsResult.data.cast?.slice(0, 6).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })) || [],
      similar: similarResult.data.results?.slice(0, 10).map(mapTvToContentItem) || [],
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


// 🚀 Add this new function to fetch real trending TV shows from TMDB
export async function getTrendingTvByPeriod(
  period: "day" | "week"
): Promise<ContentItem[]> {
  const response = await axios.get<{ results: any[] }>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `trending/tv/${period}`),
    { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } }
  );

  return response.data.results.map((item) => ({
    id: item.id,
    title: item.name ?? item.title ?? "Untitled", // TV uses .name instead of .title
    poster_path: item.poster_path,
    release_date: item.first_air_date || "",
    vote_average: item.vote_average ?? 0,
    media_type: "tv",
  }));
}


// 🚀 1. Fetch current live airing schedules (TV Parity for Now Playing)
export async function getTvAiringToday(): Promise<ContentItem[]> {
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
}

// 🚀 2. Fetch all-time critical television masterpieces
export async function getTopRatedTv(): Promise<ContentItem[]> {
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
}

// 🚀 3. Fetch scheduled upcoming network additions (TV Parity for Upcoming)
export async function getTvOnTheAir(): Promise<ContentItem[]> {
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
}
