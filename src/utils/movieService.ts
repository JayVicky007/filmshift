import axios from "axios";
import { unstable_cache } from "next/cache"; // ⚡️ Import Next.js Core Cache functionality
import {
  contentCollections,
  type ContentCollection,
  type CollectionMediaType,
} from "@/utils/contentCollections";


export interface ContentItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  media_type?: string;
}

export interface LatestTrailer extends ContentItem {
  media_type: "movie" | "tv";
  trailerKey: string;
  trailerName: string;
  trailerPublishedAt: string;
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
export const trendingPeriods = ["day", "week", "month"] as const;
export type TrendingPeriod = (typeof trendingPeriods)[number];
export const topRatedPeriods = ["all-time", "year", "month"] as const;
export type TopRatedPeriod = (typeof topRatedPeriods)[number];
export const upcomingPeriods = ["1-month", "3-months", "6-months"] as const;
export type UpcomingPeriod = (typeof upcomingPeriods)[number];
export const popularModes = ["streaming", "on-tv", "in-theaters"] as const;
export type PopularMode = (typeof popularModes)[number];
const MIN_TOP_RATED_SCORE = 7;
const MIN_ALL_TIME_RATING = 8;
const MIN_ALL_TIME_MOVIE_VOTES = 5000;
const MIN_RECENT_ALL_TIME_MOVIE_VOTES = 10000;
const MIN_ALL_TIME_TV_VOTES = 1000;

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbMovie {
  imdbRating?: string;
  Metascore?: string;
  Ratings?: OmdbRating[];
}

interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  media_type?: string;
}

interface TmdbSearchResult extends TmdbListItem {
  media_type: "movie" | "tv" | "person";
}

interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
}

export interface OfficialVideo {
  key: string;
  name: string;
  type: string;
  published_at: string | null;
}

function getOfficialVideos(videos: TmdbVideo[] | undefined): OfficialVideo[] {
  const typeOrder = ["Trailer", "Teaser", "Featurette", "Clip", "Behind the Scenes"];
  const seenKeys = new Set<string>();

  return (videos ?? [])
    .filter((video) => {
      if (video.site !== "YouTube" || video.official !== true || !video.key || seenKeys.has(video.key)) {
        return false;
      }
      seenKeys.add(video.key);
      return true;
    })
    .sort((first, second) => {
      const firstTypeOrder = typeOrder.indexOf(first.type);
      const secondTypeOrder = typeOrder.indexOf(second.type);
      const firstRank = firstTypeOrder === -1 ? typeOrder.length : firstTypeOrder;
      const secondRank = secondTypeOrder === -1 ? typeOrder.length : secondTypeOrder;
      return firstRank - secondRank ||
        (Date.parse(second.published_at ?? "") || 0) - (Date.parse(first.published_at ?? "") || 0);
    })
    .slice(0, 8)
    .map(({ key, name, type, published_at }) => ({
      key,
      name,
      type,
      published_at: published_at ?? null,
    }));
}

interface TmdbPersonCredit {
  id: number;
  name: string;
  profile_path: string | null;
  poster_path?: string | null;
  job?: string;
  character?: string;
  order?: number;
  title?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
}

interface TmdbCredits {
  cast: TmdbPersonCredit[];
  crew?: TmdbPersonCredit[];
}

interface TmdbCreator {
  id: number;
  name: string;
}

const CREATIVE_CREDIT_JOBS = [
  "Director",
  "Writer",
  "Screenplay",
  "Story",
  "Original Story",
  "Original Work",
  "Original Concept",
  "Series Composition",
  "Series Director",
  "Chief Director",
  "Comic Book",
  "Manga",
  "Novel",
  "Characters",
  "Character Design",
  "Animation Director",
] as const;
const CREATIVE_CREDIT_JOB_SET = new Set<string>(CREATIVE_CREDIT_JOBS);

function mapCreativeCredits(crew: TmdbPersonCredit[] = []) {
  const creditsByRole = new Map<string, string[]>();

  for (const person of crew) {
    if (!person.job || !CREATIVE_CREDIT_JOB_SET.has(person.job)) {
      continue;
    }

    const names = creditsByRole.get(person.job) ?? [];
    if (!names.includes(person.name)) names.push(person.name);
    creditsByRole.set(person.job, names);
  }

  return Array.from(creditsByRole, ([role, names]) => ({ role, names }));
}

function getRelatedCreatorCredit(
  crew: TmdbPersonCredit[],
  preferredJobs: string[],
): TmdbPersonCredit | undefined {
  for (const job of preferredJobs) {
    const person = crew.find((credit) => credit.job === job);
    if (person) return person;
  }
}

interface TmdbRecommendations<T = ContentItem> {
  results: T[];
}

interface TmdbMovieRecord {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  status: string;
  tagline: string;
  vote_average: number;
  vote_count: number;
  external_ids?: { imdb_id?: string };
  videos?: { results: TmdbVideo[] };
  genres: TmdbGenre[];
  runtime: number | null;
}

interface TmdbTvRecord {
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
  external_ids?: { imdb_id?: string; results?: { imdb_id?: string } };
  videos?: { results: TmdbVideo[] };
  genres: TmdbGenre[];
  created_by?: TmdbCreator[];
}

export function rankAllTimeContent(
  movies: ContentItem[],
  minimumVotes = MIN_ALL_TIME_MOVIE_VOTES,
): ContentItem[] {
  const globalMean = movies.length > 0
    ? movies.reduce((sum, movie) => sum + movie.vote_average, 0) / movies.length
    : MIN_ALL_TIME_RATING;
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

export const rankAllTimeMovies = rankAllTimeContent;

function meetsAllTimeMovieVoteThreshold(movie: ContentItem, currentYear: number): boolean {
  const releaseYear = Number.parseInt(movie.release_date.slice(0, 4), 10);
  const ageInYears = currentYear - releaseYear;
  const minimumVotes = Number.isFinite(ageInYears) && ageInYears < 2
    ? MIN_RECENT_ALL_TIME_MOVIE_VOTES
    : MIN_ALL_TIME_MOVIE_VOTES;

  return (movie.vote_count ?? 0) >= minimumVotes;
}

export function rankPeriodContent(
  items: ContentItem[],
  priorWeight: number,
): ContentItem[] {
  const totalVotes = items.reduce((sum, item) => sum + (item.vote_count ?? 0), 0);
  const priorMean = totalVotes
    ? items.reduce(
        (sum, item) => sum + item.vote_average * (item.vote_count ?? 0),
        0,
      ) / totalVotes
    : 6.5;

  return items
    .map((item) => {
      const votes = item.vote_count ?? 0;
      const score =
        (votes / (votes + priorWeight)) * item.vote_average +
        (priorWeight / (votes + priorWeight)) * priorMean;
      return { item, score };
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        (second.item.popularity ?? 0) - (first.item.popularity ?? 0) ||
        (second.item.vote_count ?? 0) - (first.item.vote_count ?? 0),
    )
    .map(({ item }) => item);
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

export function findContentCollection(mediaType: string, slug: string) {
  return contentCollections.find(
    (collection) => collection.mediaType === mediaType && collection.slug === slug,
  ) ?? null;
}

export const getContentCollection = unstable_cache(
  async (mediaType: CollectionMediaType, slug: string): Promise<ContentItem[]> => {
    const collection = findContentCollection(mediaType, slug);
    if (!collection) {
      throw new Error(`Unknown ${mediaType} content collection: ${slug}`);
    }
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB API Key is missing from the server environment config.");
    }

    const baseParams: Record<string, string | number | boolean> = {
      api_key: apiKey,
      language: "en-US",
      sort_by: "popularity.desc",
      include_adult: false,
    };

    if (collection.originCountries?.length) {
      baseParams.with_origin_country = collection.originCountries.join("|");
    }
    if (collection.genreId) {
      baseParams.with_genres = collection.genreId;
    }

    const endpoint = `discover/${mediaType}`;
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        axios.get<{ results: TmdbListItem[] }>(
          getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, endpoint),
          { params: { ...baseParams, page } },
        ),
      ),
    );

    const uniqueItems = new Map<number, TmdbListItem>();
    pages
      .flatMap(({ data }) => data.results)
      .filter((item) => item.poster_path && (item.title ?? item.name)?.trim())
      .forEach((item) => {
        if (!uniqueItems.has(item.id)) uniqueItems.set(item.id, item);
      });

    return Array.from(uniqueItems.values()).map((item) => ({
      id: item.id,
      title: item.title ?? item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.release_date ?? item.first_air_date ?? "",
      vote_average: item.vote_average ?? 0,
      vote_count: item.vote_count,
      popularity: item.popularity,
      media_type: mediaType,
    }));
  },
  ["content-collection-cache"],
  { revalidate: 3600 },
);

type CollectionRailKind = "trending" | "top-rated" | "coming-soon";

async function fetchCollectionDiscoverItems(
  mediaType: CollectionMediaType,
  collectionSlug: string,
  params: Record<string, string | number | boolean>,
): Promise<ContentItem[]> {
  const collection = findContentCollection(mediaType, collectionSlug);
  if (!collection) {
    throw new Error(`Unknown ${mediaType} content collection: ${collectionSlug}`);
  }

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB API Key is missing from the server environment config.");
  }

  const collectionParams: Record<string, string | number> = {};
  if (collection.originCountries?.length) {
    collectionParams.with_origin_country = collection.originCountries.join("|");
  }
  if (collection.genreId) collectionParams.with_genres = collection.genreId;

  const endpoint = `discover/${mediaType}`;
  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      axios.get<{ results: TmdbListItem[] }>(
        getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, endpoint),
        {
          params: {
            api_key: apiKey,
            language: "en-US",
            include_adult: false,
            ...collectionParams,
            ...params,
            page,
          },
        },
      ),
    ),
  );

  const uniqueItems = new Map<number, TmdbListItem>();
  pages
    .flatMap(({ data }) => data.results)
    .filter((item) => item.poster_path && (item.title ?? item.name)?.trim())
    .forEach((item) => {
      if (!uniqueItems.has(item.id)) uniqueItems.set(item.id, item);
    });

  return Array.from(uniqueItems.values()).map((item) => ({
    id: item.id,
    title: item.title ?? item.name ?? "Untitled",
    poster_path: item.poster_path,
    release_date: item.release_date ?? item.first_air_date ?? "",
    vote_average: item.vote_average ?? 0,
    vote_count: item.vote_count,
    popularity: item.popularity,
    media_type: mediaType,
  }));
}

export const getCollectionRailItems = unstable_cache(
  async (
    mediaType: CollectionMediaType,
    collectionSlug: string,
    kind: CollectionRailKind,
    period: TrendingPeriod | TopRatedPeriod | UpcomingPeriod,
  ): Promise<ContentItem[]> => {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const base = { sort_by: "popularity.desc" };

    if (kind === "trending") {
      const days = period === "day" ? 1 : period === "week" ? 7 : 30;
      const start = new Date(today);
      start.setDate(start.getDate() - days);
      const dateKey = mediaType === "movie" ? "primary_release_date" : "first_air_date";
      return fetchCollectionDiscoverItems(mediaType, collectionSlug, {
        ...base,
        [`${dateKey}.gte`]: start.toISOString().slice(0, 10),
        [`${dateKey}.lte`]: todayString,
      });
    }

    if (kind === "top-rated") {
      const dateParams: Record<string, string> = {};
      if (period !== "all-time") {
        const start = new Date(today);
        start.setDate(start.getDate() - (period === "year" ? 365 : 30));
        const dateKey = mediaType === "movie" ? "primary_release_date" : "first_air_date";
        dateParams[`${dateKey}.gte`] = start.toISOString().slice(0, 10);
        dateParams[`${dateKey}.lte`] = todayString;
      }

      const minimumVotes = period === "all-time"
        ? mediaType === "movie"
          ? MIN_ALL_TIME_MOVIE_VOTES
          : MIN_ALL_TIME_TV_VOTES
        : period === "year"
          ? 250
          : 30;
      const items = await fetchCollectionDiscoverItems(mediaType, collectionSlug, {
        sort_by: "vote_count.desc",
        "vote_average.gte": period === "all-time" ? MIN_ALL_TIME_RATING : MIN_TOP_RATED_SCORE,
        "vote_count.gte": minimumVotes,
        ...dateParams,
      });
      const qualifiedItems = period === "all-time"
        ? items.filter((item) => item.vote_average >= MIN_ALL_TIME_RATING)
          .filter((item) => mediaType === "tv" || meetsAllTimeMovieVoteThreshold(item, today.getFullYear()))
        : items;
      const votePrior = mediaType === "movie"
        ? MIN_ALL_TIME_MOVIE_VOTES
        : MIN_ALL_TIME_TV_VOTES;
      return (period === "all-time" ? rankAllTimeContent(qualifiedItems, votePrior) : qualifiedItems).slice(0, 20);
    }

    if (!upcomingPeriods.includes(period as UpcomingPeriod)) {
      throw new Error(`Invalid coming-soon period: ${period}`);
    }
    const startKey = mediaType === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
    const endKey = mediaType === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
    return fetchCollectionDiscoverItems(mediaType, collectionSlug, {
      ...base,
      [startKey]: todayString,
      [endKey]: getPeriodEndDate(period as UpcomingPeriod),
    });
  },
  ["collection-rail-items-cache"],
  { revalidate: 3600 },
);

export const getPopularContent = unstable_cache(
  async (
    mode: PopularMode,
    collectionMediaType?: CollectionMediaType,
    collectionSlug?: string,
  ): Promise<ContentItem[]> => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB API Key is missing from the server environment config.");
    }

    let collection: ContentCollection | null = null;
    if (collectionMediaType && collectionSlug) {
      collection = findContentCollection(collectionMediaType, collectionSlug);
      if (!collection) {
        throw new Error(`Unknown ${collectionMediaType} content collection: ${collectionSlug}`);
      }
    }

    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const datesAgo = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() - days);
      return date.toISOString().slice(0, 10);
    };
    const datesAhead = (days: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };

    const mediaTypes: CollectionMediaType[] = mode === "streaming"
      ? ["movie", "tv"]
      : mode === "on-tv"
        ? ["tv"]
        : ["movie"];
    const responses = await Promise.all(mediaTypes.map(async (mediaType) => {
      const params: Record<string, string | number | boolean> = {
        api_key: apiKey,
        language: "en-US",
        include_adult: false,
        sort_by: "popularity.desc",
        watch_region: "US",
      };
      if (collection?.originCountries?.length) {
        params.with_origin_country = collection.originCountries.join("|");
      }
      if (collection?.genreId) params.with_genres = collection.genreId;

      if (mode === "streaming") {
        params.with_watch_monetization_types = "flatrate";
      } else if (mode === "on-tv") {
        params["air_date.gte"] = todayString;
        params["air_date.lte"] = datesAhead(7);
      } else {
        params["primary_release_date.gte"] = datesAgo(45);
        params["primary_release_date.lte"] = todayString;
        params.with_release_type = "2|3";
      }

      const pages = await Promise.all(
        [1, 2].map((page) =>
          axios.get<{ results: TmdbListItem[] }>(
            getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `discover/${mediaType}`),
            { params: { ...params, page } },
          ),
        ),
      );
      return pages.flatMap(({ data }) => data.results).map((item) => ({
        id: item.id,
        title: item.title ?? item.name ?? "Untitled",
        poster_path: item.poster_path,
        release_date: item.release_date ?? item.first_air_date ?? "",
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count,
        popularity: item.popularity,
        media_type: mediaType,
      }));
    }));

    const uniqueItems = new Map<string, ContentItem>();
    responses
      .flat()
      .filter((item) => item.poster_path && item.title.trim())
      .forEach((item) => uniqueItems.set(`${item.media_type}-${item.id}`, item));
    return Array.from(uniqueItems.values())
      .sort((first, second) => (second.popularity ?? 0) - (first.popularity ?? 0))
      .slice(0, 20);
  },
  ["popular-content-cache"],
  { revalidate: 3600 },
);

export const getCollectionTrailers = unstable_cache(
  async (mediaType: CollectionMediaType, collectionSlug: string): Promise<LatestTrailer[]> => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB API Key is missing from the server environment config.");
    }
    const candidates = await fetchCollectionDiscoverItems(
      mediaType,
      collectionSlug,
      { sort_by: "popularity.desc" },
    );
    const videoResults = await Promise.allSettled(
      candidates.slice(0, 8).map(async (item) => {
        const response = await axios.get<{ results: TmdbVideo[] }>(
          getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `${mediaType}/${item.id}/videos`),
          { params: { api_key: apiKey, language: "en-US" } },
        );
        const trailer = response.data.results.find(
          (video) => video.site === "YouTube" && video.type === "Trailer" && video.official,
        ) ?? response.data.results.find(
          (video) => video.site === "YouTube" && video.type === "Trailer",
        );
        return trailer
          ? {
              ...item,
              media_type: mediaType,
              trailerKey: trailer.key,
              trailerName: trailer.name,
              trailerPublishedAt: trailer.published_at ?? "",
            } satisfies LatestTrailer
          : null;
      }),
    );

    return videoResults
      .flatMap((result) => {
        if (result.status === "rejected") {
          console.warn("Unable to fetch a collection title's trailer:", result.reason);
          return [];
        }
        return result.value ? [result.value] : [];
      })
      .sort((first, second) =>
        (Date.parse(second.trailerPublishedAt) || 0) -
        (Date.parse(first.trailerPublishedAt) || 0),
      )
      .slice(0, 10);
  },
  ["collection-trailers-cache"],
  { revalidate: 3600 },
);

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
      return movies
        .filter((movie) =>
          movie.release_date >= today &&
          Boolean(movie.poster_path) &&
          Boolean(movie.title?.trim()) &&
          (movie.popularity ?? 0) >= 5,
        )
        .sort((first, second) => (second.popularity ?? 0) - (first.popularity ?? 0))
        .slice(0, 20);
    }

    return movies;
  },
  ["movies-by-category-cache"], // Cache Identifier Key
  { revalidate: 3600 }          // Stale-While-Revalidate window: 1 Hour (3,600 seconds)
);

function getPeriodEndDate(period: UpcomingPeriod): string {
  const today = new Date();
  const months = Number.parseInt(period, 10);
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, 0),
  ).getUTCDate();
  endDate.setUTCDate(Math.min(today.getUTCDate(), lastDay));
  return endDate.toISOString().slice(0, 10);
}

export const getUpcomingMoviesByPeriod = unstable_cache(
  async (period: UpcomingPeriod): Promise<ContentItem[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const response = await axios.get<{ results: ContentItem[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
          language: "en-US",
          sort_by: "popularity.desc",
          include_adult: false,
          "primary_release_date.gte": today,
          "primary_release_date.lte": getPeriodEndDate(period),
        },
      },
    );

    return response.data.results
      .filter((movie) =>
        movie.poster_path &&
        movie.title?.trim() &&
        movie.title !== "Untitled" &&
        (movie.popularity ?? 0) >= 5,
      )
      .map((movie) => ({ ...movie, media_type: "movie" }));
  },
  ["upcoming-movies-period-cache"],
  { revalidate: 3600 },
);


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
    startDate.setDate(today.getDate() - 30);
    
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
              "vote_count.gte": MIN_ALL_TIME_MOVIE_VOTES,
              page,
            },
          },
        ),
      ),
    );
    const candidates = responses
      .flatMap((response) => response.data.results)
      .filter((movie) => movie.vote_average >= MIN_ALL_TIME_RATING)
      .filter((movie) => movie.release_date <= today.toISOString().slice(0, 10))
      .filter((movie) => meetsAllTimeMovieVoteThreshold(movie, today.getFullYear()));

    return rankAllTimeContent(candidates);
  }

  const today = new Date();
  const startDate = new Date(today);
  const days = period === "year" ? 365 : 30;
  startDate.setDate(today.getDate() - days);

  const minimumVotes = period === "year" ? 250 : 30;
  const responses = await Promise.all(
    Array.from({ length: 3 }, (_, index) =>
      axios.get<{ results: ContentItem[] }>(
        getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/movie"),
        {
          params: {
            api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
            sort_by: "vote_count.desc",
            "vote_count.gte": minimumVotes,
            "primary_release_date.gte": startDate.toISOString().slice(0, 10),
            "primary_release_date.lte": today.toISOString().slice(0, 10),
            page: index + 1,
          },
        },
      ),
    ),
  );

  return rankPeriodContent(
    responses
      .flatMap((response) => response.data.results)
      .filter((movie) => movie.vote_average >= MIN_TOP_RATED_SCORE),
    period === "year" ? 250 : 100,
  );
}


export async function getUnifiedTrendingByPeriod(period: TrendingPeriod): Promise<ContentItem[]> {
  try {
    const [movies, tvShows] = await Promise.all([
      getTrendingMoviesByPeriod(period),
      getTrendingTvByPeriod(period),
    ]);

    return combineContentItems(movies, tvShows);
  } catch (error) {
    console.error("❌ Failed to fetch unified trending content:", error);
    return getTrendingMoviesByPeriod(period);
  }
}

export function combineContentItems(
  movies: ContentItem[],
  tvShows: ContentItem[],
): ContentItem[] {
  const combined: ContentItem[] = [];
  const maxLength = Math.max(movies.length, tvShows.length);

  for (let index = 0; index < maxLength; index++) {
    if (movies[index]) combined.push({ ...movies[index], media_type: "movie" });
    if (tvShows[index]) combined.push({ ...tvShows[index], media_type: "tv" });
  }

  return combined;
}

export async function searchMovies(query: string): Promise<ContentItem[]> {
  if (!query.trim()) {
    return [];
  }

  const response = await axios.get<{ results: TmdbSearchResult[] }>(
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


export async function getMoviesByCreator(
  personId: number,
  jobs: string[],
  excludeMovieId: number,
): Promise<ContentItem[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) return [];

    const creditsResponse = await axios.get<{ crew: TmdbPersonCredit[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `person/${personId}/movie_credits`),
      { params: { api_key: apiKey } }
    );

    const crewCredits = creditsResponse.data.crew || [];
    const relatedMovies = crewCredits
      .filter((credit) => credit.job && jobs.includes(credit.job))
      .filter((movie) => movie.id !== excludeMovieId);

    const uniqueMoviesMap = new Map<number, TmdbPersonCredit>();
    relatedMovies.forEach((movie) => {
      if (!uniqueMoviesMap.has(movie.id)) {
        uniqueMoviesMap.set(movie.id, movie);
      }
    });

    return Array.from(uniqueMoviesMap.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((movie) => ({
        id: movie.id,
        title: movie.title ?? "Untitled",
        poster_path: movie.poster_path ?? null,
        release_date: movie.release_date || "",
        vote_average: movie.vote_average ?? 0,
        media_type: "movie"
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("Unable to fetch related movies for creator:", error);
    return [];
  }
}


export async function getTvShowsByCreator(
  personId: number,
  jobs: string[],
  excludeTvId: number,
): Promise<ContentItem[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) return [];

    const creditsResponse = await axios.get<{ crew: TmdbPersonCredit[]; cast: TmdbPersonCredit[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `person/${personId}/tv_credits`),
      { params: { api_key: apiKey } }
    );

    const crewCredits = creditsResponse.data.crew || [];
    const createdShows = crewCredits
      .filter((credit) => credit.job && jobs.includes(credit.job))
      .filter((show) => show.id !== excludeTvId);

    const uniqueShowsMap = new Map<number, TmdbPersonCredit>();
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
        poster_path: show.poster_path ?? null,
        release_date: show.first_air_date || "",
        vote_average: show.vote_average ?? 0,
        media_type: "tv"
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("Unable to fetch related TV shows for creator:", error);
    return [];
  }
}


export async function getMovieDetails(movieId: string): Promise<MovieDetails> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  
  if (!apiKey) {
    throw new Error("TMDB API Key is missing from the server environment config.");
  }

  const coreTmdbUrl = getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}`);
  const coreTmdbResponse = await axios.get<TmdbMovieRecord>(coreTmdbUrl, {
    params: { api_key: apiKey, append_to_response: "external_ids,videos" },
  });

  const movieData = coreTmdbResponse.data;
  const imdbId = movieData.external_ids?.imdb_id;

  const omdbPromise = imdbId
    ? axios.get<OmdbMovie>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
        params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: imdbId },
      }).catch(() => null)
    : Promise.resolve(null);

  const creditsPromise = axios.get<TmdbCredits>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/credits`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { cast: [], crew: [] } }));

  const recommendationsPromise = axios.get<TmdbRecommendations<ContentItem>>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `movie/${movieId}/recommendations`), {
    params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
  }).catch(() => ({ data: { results: [] } }));

  const [omdbResult, creditsResult, recommendationsResult] = await Promise.all([
    omdbPromise,
    creditsPromise,
    recommendationsPromise,
  ]);

  const trailer = movieData.videos?.results.find(
    (video) => video.site === "YouTube" && video.type === "Trailer" && video.official
  ) ?? movieData.videos?.results.find((video) => video.site === "YouTube" && video.type === "Trailer") ?? null;

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
    .filter((person) => person.job === "Director")
    .map((person) => person.name)
    .filter((name, index, names) => names.indexOf(name) === index);

  const writers = crew
    .filter((person) => person.job === "Writer" || person.job === "Screenplay")
    .map((person) => person.name)
    .filter((name, index, names) => names.indexOf(name) === index);

  const primaryCreator = getRelatedCreatorCredit(crew, [
    "Director",
    "Original Story",
    "Story",
    "Manga",
    "Writer",
    "Screenplay",
    "Original Concept",
    "Animation Director",
  ]);
  const relatedMovies = primaryCreator
    ? await getMoviesByCreator(
        primaryCreator.id,
        primaryCreator.job === "Director"
          ? ["Director"]
          : ["Original Story", "Story", "Manga", "Writer", "Screenplay", "Original Concept", "Animation Director"],
        movieData.id,
      )
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
    creativeCredits: mapCreativeCredits(crew),
    cast: cast
      .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
      .slice(0, 6)
      .map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character ?? "",
        profilePath: person.profile_path,
      })),
    similar: relatedMovies,
    recommendations: recommendationsResult.data.results?.slice(0, 10) || [],
    genres: movieData.genres || [],
    officialVideos: getOfficialVideos(movieData.videos?.results),
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
  creativeCredits: Array<{ role: string; names: string[] }>;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
  similar: ContentItem[];
  recommendations: ContentItem[];
  genres: TmdbGenre[];
  officialVideos: OfficialVideo[];
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
  creativeCredits: Array<{ role: string; names: string[] }>;
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
  officialVideos: OfficialVideo[];
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
    const coreTvResponse = await axios.get<TmdbTvRecord>(coreTvUrl, {
      params: { api_key: apiKey, append_to_response: "external_ids,videos" },
    });

    const showData = coreTvResponse.data;
    const tvImdbId = showData.external_ids?.imdb_id || showData.external_ids?.results?.imdb_id;

    const omdbPromise = tvImdbId
      ? axios.get<OmdbMovie>(getApiUrl(process.env.NEXT_PUBLIC_OMDB_BASE_URL, ""), {
          params: { apikey: process.env.NEXT_PUBLIC_OMDB_API_KEY, i: tvImdbId },
        }).catch(() => null)
      : Promise.resolve(null);

    const creditsPromise = axios.get<TmdbCredits>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/credits`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { cast: [], crew: [] } }));

    const recommendationsPromise = axios.get<TmdbRecommendations<TmdbListItem>>(getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, `tv/${id}/recommendations`), {
      params: { api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY },
    }).catch(() => ({ data: { results: [] } }));

    const [omdbResult, creditsResult, recommendationsResult] = await Promise.all([
      omdbPromise,
      creditsPromise,
      recommendationsPromise,
    ]);

    const trailer = showData.videos?.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer" && video.official
    ) ?? showData.videos?.results.find((video) => video.site === "YouTube" && video.type === "Trailer") ?? null;

    let imdbRating: number | null = null;
    let rottenTomatoes: number | null = null;
    let metascore: number | null = null;

    if (omdbResult && omdbResult.data) {
      const omdbData = omdbResult.data;
      imdbRating = parseScore(omdbData.imdbRating);
      metascore = parseScore(omdbData.Metascore);
      if (omdbData.Ratings) {
        const rtRating = omdbData.Ratings.find((rating) => rating.Source === "Rotten Tomatoes");
        if (rtRating) rottenTomatoes = parseScore(rtRating.Value, "%");
      }
    }

    const mapTvToContentItem = (item: TmdbListItem): ContentItem => ({
      id: item.id,
      title: item.name ?? item.title ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      media_type: "tv",
    });

    const nativeCreators = showData.created_by ?? [];
    const relatedCreatorCredit = getRelatedCreatorCredit(creditsResult.data.crew ?? [], [
      "Creator",
      "Original Story",
      "Story",
      "Manga",
      "Series Composition",
      "Writer",
      "Screenplay",
      "Original Concept",
      "Director",
      "Executive Producer",
    ]);
    const creators = nativeCreators.length > 0
      ? nativeCreators.map((creator) => creator.name)
      : relatedCreatorCredit
        ? [relatedCreatorCredit.name]
        : [];
    const creatorId = nativeCreators[0]?.id ?? relatedCreatorCredit?.id;
    const creatorJobs = nativeCreators.length > 0
      ? ["Creator", "Executive Producer", "Writer", "Screenplay"]
      : relatedCreatorCredit?.job === "Director"
        ? ["Director"]
        : ["Creator", "Original Story", "Story", "Manga", "Series Composition", "Writer", "Screenplay", "Original Concept"];
    const creatorTvShows = creatorId
      ? await getTvShowsByCreator(creatorId, creatorJobs, showData.id)
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
      creativeCredits: mapCreativeCredits(creditsResult.data.crew ?? []),
      genres: showData.genres || [],
      cast: creditsResult.data.cast?.slice(0, 6).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character ?? "",
        profilePath: person.profile_path,
      })) || [],
      similar: creatorTvShows, // Linked directly into the 'similar' carousel row layout slot
      recommendations: recommendationsResult.data.results?.slice(0, 10).map(mapTvToContentItem) || [],
      officialVideos: getOfficialVideos(showData.videos?.results),
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
  async (period: TrendingPeriod): Promise<ContentItem[]> => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const response = await axios.get<{ results: TmdbListItem[] }>(
      getApiUrl(
        process.env.NEXT_PUBLIC_TMDB_BASE_URL,
        period === "day" || period === "week" ? `trending/tv/${period}` : "discover/tv",
      ),
      {
        params: period === "day" || period === "week"
          ? { api_key: apiKey }
          : {
              api_key: apiKey,
              sort_by: "popularity.desc",
              "first_air_date.gte": startDate.toISOString().slice(0, 10),
              "first_air_date.lte": today.toISOString().slice(0, 10),
              "vote_count.gte": 10,
            },
      },
    );

    return response.data.results.map((item) => ({
      id: item.id,
      title: item.name ?? item.title ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      vote_count: item.vote_count,
      popularity: item.popularity,
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
    const response = await axios.get<{ results: TmdbListItem[] }>(
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
    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        axios.get<{ results: TmdbListItem[] }>(
          getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/tv"),
          {
            params: {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
              sort_by: "vote_count.desc",
              "vote_average.gte": MIN_ALL_TIME_RATING,
              "vote_count.gte": MIN_ALL_TIME_TV_VOTES,
              page: index + 1,
            },
          },
        ),
      ),
    );
    const qualifiedShows = responses
      .flatMap((response) => response.data.results)
      .map((item) => ({
        id: item.id,
        title: item.name ?? "Untitled",
        poster_path: item.poster_path,
        release_date: item.first_air_date || "",
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count,
        popularity: item.popularity,
        media_type: "tv",
      }))
      .filter((item) =>
        item.vote_average >= MIN_ALL_TIME_RATING &&
        (item.vote_count ?? 0) >= MIN_ALL_TIME_TV_VOTES,
      );
    return rankAllTimeContent(qualifiedShows, MIN_ALL_TIME_TV_VOTES);
  },
  ["top-rated-tv-cache"],
  { revalidate: 3600 }
);

export const getTopRatedTvByPeriod = unstable_cache(
  async (period: TopRatedPeriod): Promise<ContentItem[]> => {
    if (period === "all-time") {
      return getTopRatedTv();
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (period === "year" ? 365 : 30));
    const minimumVotes = period === "year" ? 100 : 25;
    const responses = await Promise.all(
      Array.from({ length: 3 }, (_, index) =>
        axios.get<{ results: TmdbListItem[] }>(
          getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/tv"),
          {
            params: {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
              sort_by: "vote_count.desc",
              "vote_count.gte": minimumVotes,
              "first_air_date.gte": startDate.toISOString().slice(0, 10),
              "first_air_date.lte": today.toISOString().slice(0, 10),
              page: index + 1,
            },
          },
        ),
      ),
    );

    const candidates = responses
      .flatMap((response) => response.data.results)
      .map((item) => ({
        id: item.id,
        title: item.name ?? "Untitled",
        poster_path: item.poster_path,
        release_date: item.first_air_date || "",
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count,
        popularity: item.popularity,
        media_type: "tv",
      }))
      .filter((item) => item.vote_average >= MIN_TOP_RATED_SCORE);
    return rankPeriodContent(candidates, period === "year" ? 150 : 75);
  },
  ["top-rated-tv-period-cache"],
  { revalidate: 3600 },
);

/**
 * ⚡️ CACHED TV ON THE AIR
 * Stores upcoming network additions safely in memory.
 */
export const getTvOnTheAir = unstable_cache(
  async (): Promise<ContentItem[]> => {
    const response = await axios.get<{ results: TmdbListItem[] }>(
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

export const getUpcomingTvShows = unstable_cache(
  async (period: UpcomingPeriod): Promise<ContentItem[]> => {
    const today = new Date();
    const endDate = getPeriodEndDate(period);
    const response = await axios.get<{ results: TmdbListItem[] }>(
      getApiUrl(process.env.NEXT_PUBLIC_TMDB_BASE_URL, "discover/tv"),
      {
        params: {
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
          language: "en-US",
          sort_by: "popularity.desc",
          "first_air_date.gte": today.toISOString().slice(0, 10),
          "first_air_date.lte": endDate,
          include_null_first_air_dates: false,
        },
      },
    );

    return response.data.results
      .filter((item) =>
        item.poster_path &&
        (item.name ?? "").trim() &&
        item.name !== "Untitled" &&
        (item.popularity ?? 0) >= 5,
      )
      .map((item) => ({
      id: item.id,
      title: item.name ?? "Untitled",
      poster_path: item.poster_path,
      release_date: item.first_air_date || "",
      vote_average: item.vote_average ?? 0,
      vote_count: item.vote_count,
      popularity: item.popularity,
      media_type: "tv",
    }))
      .sort((first, second) => (second.popularity ?? 0) - (first.popularity ?? 0))
      .slice(0, 20);
  },
  ["upcoming-tv-shows-cache"],
  { revalidate: 3600 },
);

export const getLatestTrailers = unstable_cache(
  async (): Promise<LatestTrailer[]> => {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB API Key is missing from the server environment config.");
    }

    const [movies, shows] = await Promise.all([
      getTrendingMoviesByPeriod("week"),
      getTrendingTvByPeriod("week"),
    ]);
    const candidates: ContentItem[] = [
      ...movies.slice(0, 8).map((movie) => ({ ...movie, media_type: "movie" })),
      ...shows.slice(0, 8),
    ].filter((item) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv"));

    const videoResults = await Promise.allSettled(
      candidates.map(async (item) => {
        const response = await axios.get<{ results: TmdbVideo[] }>(
          getApiUrl(
            process.env.NEXT_PUBLIC_TMDB_BASE_URL,
            `${item.media_type}/${item.id}/videos`,
          ),
          { params: { api_key: apiKey, language: "en-US" } },
        );
        const trailers = response.data.results.filter(
          (video) => video.site === "YouTube" && video.type === "Trailer",
        );
        const trailer = trailers.find((video) => video.official) ?? trailers[0];

        if (!trailer) {
          return null;
        }

        return {
          ...item,
          media_type: item.media_type as "movie" | "tv",
          trailerKey: trailer.key,
          trailerName: trailer.name,
          trailerPublishedAt: trailer.published_at ?? "",
        };
      }),
    );

    const trailers: LatestTrailer[] = [];
    for (const result of videoResults) {
      if (result.status === "fulfilled") {
        if (result.value) trailers.push(result.value);
      } else {
        console.warn("Unable to fetch a trending title's trailer:", result.reason);
      }
    }

    return trailers
      .sort((first, second) =>
        (Date.parse(second.trailerPublishedAt) || 0) -
        (Date.parse(first.trailerPublishedAt) || 0),
      )
      .slice(0, 10);
  },
  ["latest-trailers-cache"],
  { revalidate: 3600 },
);
