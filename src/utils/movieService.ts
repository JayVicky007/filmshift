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
  const response = await axios.get<{ results: TrendingMovie[] }>(
    getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "trending/movie/week"),
    {
      params: {
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
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
