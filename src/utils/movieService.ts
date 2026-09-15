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
  genres: TmdbGenre[];
  runtime: number | null;
  external_ids?: {
    imdb_id?: string | null;
  };
}

export interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
}

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

export function rankAllTimeMovies(movies: TrendingMovie[]): TrendingMovie[] {
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

export async function getTrendingMovies(): Promise<TrendingMovie[]> {
  return getMoviesByCategory("trending");
}

export async function getMoviesByCategory(
  category: MovieCategory,
): Promise<TrendingMovie[]> {
  const endpoint = category === "trending"
    ? "trending/movie/week"
    : `movie/${category.replace("-", "_")}`;
  const response = await axios.get<{ results: TrendingMovie[] }>(
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
): Promise<TrendingMovie[]> {
  if (period === "day" || period === "week") {
    const response = await axios.get<{ results: TrendingMovie[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `trending/movie/${period}`),
      { params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY } },
    );

    return response.data.results;
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (period === "month" ? 30 : 365));
  const response = await axios.get<{ results: TrendingMovie[] }>(
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
): Promise<TrendingMovie[]> {
  if (period === "all-time") {
    const today = new Date();
    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, index) => index + 1).map((page) =>
        axios.get<{ results: TrendingMovie[] }>(
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

  const response = await axios.get<{ results: TrendingMovie[] }>(
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

export async function searchMovies(query: string): Promise<TrendingMovie[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await axios.get<{ results: TrendingMovie[] }>(
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
        append_to_response: "external_ids",
      },
    },
  );

  const movie = tmdbResponse.data;
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
    genres: movie.genres,
    runtime: movie.runtime,
    ratings: {
      imdb: imdbRating,
      rottenTomatoes,
      metascore,
    },
  };
}
