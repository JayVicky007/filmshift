import axios from "axios";

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
  mediaType: "Movie" | "TV Series" | "Animation" | "Anime" | "Documentary" | "Person";
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

  const response = await axios.get<{ results: ContentItem[] }>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "search/movie"),
    {
      params: {
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
        query: query.trim(),
      },
    },
  );

  return response.data.results;
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
    .map((result) => ({
      id: result.id,
      title: result.title ?? result.name ?? "Untitled",
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
    }));
}

export async function getMovieDetails(movieId: string): Promise<MovieDetails> {
  const tmdbResponse = await axios.get<TmdbMovie>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}`),
    {
      params: {
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
        append_to_response: "external_ids,videos,credits,similar,recommendations",
      },
    },
  );

  const movie = tmdbResponse.data;
  const trailer = movie.videos?.results.find(
    (video) =>
      video.site === "YouTube" &&
      video.type === "Trailer" &&
      video.official,
  ) ?? movie.videos?.results.find(
    (video) => video.site === "YouTube" && video.type === "Trailer",
  ) ?? null;
  let imdbRating: number | null = null;
  let rottenTomatoes: number | null = null;
  let metascore: number | null = null;

  if (movie.external_ids?.imdb_id) {
    try {
      const omdbResponse = await axios.get<OmdbMovie>(
        getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""),
        {
          params: {
            apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY,
            i: movie.external_ids.imdb_id,
          },
        },
      );

      const omdbMovie = omdbResponse.data;
      imdbRating = parseScore(omdbMovie.imdbRating);
      metascore = parseScore(omdbMovie.Metascore);
      rottenTomatoes = parseScore(
        omdbMovie.Ratings?.find(
          (rating) => rating.Source === "Rotten Tomatoes",
        )?.Value,
        "%",
      );
    } catch {
    }
  }

  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    status: movie.status,
    tagline: movie.tagline,
    audienceRating: movie.vote_average,
    audienceVoteCount: movie.vote_count,
    trailer: trailer
      ? { key: trailer.key, name: trailer.name }
      : null,
    directors: movie.credits?.crew
      .filter((person) => person.job === "Director")
      .map((person) => person.name)
      .filter((name, index, names) => names.indexOf(name) === index) ?? [],
    writers: movie.credits?.crew
      .filter((person) => person.job === "Writer" || person.job === "Screenplay")
      .map((person) => person.name)
      .filter((name, index, names) => names.indexOf(name) === index) ?? [],
    cast: movie.credits?.cast
      .sort((first, second) => first.order - second.order)
      .slice(0, 6)
      .map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })) ?? [],
    similar: movie.similar?.results.slice(0, 10) ?? [],
    recommendations: movie.recommendations?.results.slice(0, 10) ?? [],
    genres: movie.genres,
    runtime: movie.runtime,
    ratings: {
      imdb: imdbRating,
      rottenTomatoes,
      metascore,
    },
  };
}





// Append to the absolute bottom of src/utils/movieService.ts

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
    profilePath: string | null; // Matches your custom cast architecture!
  }>;
    similar: ContentItem[];
    recommendations: ContentItem[];
}

export async function getTvShowDetails(id: string): Promise<TvShowDetails | null> {
  try {
    const response = await axios.get<any>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}`),
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
          // 1. Tell TMDB to pack similar shows and recommendations into the response!
          append_to_response: "credits,similar,recommendations",
        },
      }
    );

    const show = response.data;

    // 2. Helper tool to map TV properties cleanly to match our ContentItem structure
    const mapTvToContentItem = (item: any): ContentItem => ({
      id: item.id,
      title: item.name, // Maps TV 'name' over to 'title' so ContentCard understands it!
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      media_type: "tv",
    });

    return {
      id: show.id,
      name: show.name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      first_air_date: show.first_air_date,
      status: show.status,
      tagline: show.tagline,
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      number_of_seasons: show.number_of_seasons,
      number_of_episodes: show.number_of_episodes,
      creators: show.created_by?.map((c: any) => c.name) || [],
      genres: show.genres || [],
      cast: show.credits?.cast?.slice(0, 6).map((person: any) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })) || [],
      // 3. Attach the mapped lists safely into our data contract
      similar: show.similar?.results?.slice(0, 10).map(mapTvToContentItem) || [],
      recommendations: show.recommendations?.results?.slice(0, 10).map(mapTvToContentItem) || [],
    };
  } catch (error) {
    console.error("❌ movieService TV Fetch Error:", error);
    return null;
  }
}

