import { buildCacheKey, consumeToken, getFromCache, setToCache } from './cache';
import type { TokenBucketConfig } from './cache';
import { fetchWithRetry } from './fetch-with-retry';
import type { ContentSearchResponse, ContentSearchResult } from './types';

type TmdbSearchItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
};

type TmdbSearchResponse = {
  results?: TmdbSearchItem[];
};

const TMDB_CACHE_TTL = 86400; // 24 hours

const TMDB_TOKEN_BUCKET: TokenBucketConfig = {
  bucket: 'tmdb',
  maxTokens: 50,
  refillRatePerSecond: 40,
};

const posterUrl = (path?: string) => (path ? `https://image.tmdb.org/t/p/w500${path}` : undefined);

export const createTmdbClient = (kv: KVNamespace | undefined, apiKey?: string) => {
  const search = async (
    mediaType: 'movie' | 'tv',
    query: string,
  ): Promise<ContentSearchResponse> => {
    if (!apiKey) {
      return {
        available: false,
        results: [],
        message: 'TMDB API キーが未設定のため、映像作品検索は利用できません。',
      };
    }

    const cacheKey = buildCacheKey('tmdb', mediaType, query);
    const cached = await getFromCache<ContentSearchResponse>(kv, cacheKey);
    if (cached) return cached;

    if (kv) await consumeToken(kv, TMDB_TOKEN_BUCKET);

    const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('language', 'ja-JP');
    url.searchParams.set('region', 'JP');
    url.searchParams.set('include_adult', 'false');

    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error('TMDB API の検索に失敗しました。');
    }

    const payload = (await response.json()) as TmdbSearchResponse;

    const result: ContentSearchResponse = {
      available: true,
      results:
        payload.results
          ?.map((item): ContentSearchResult | null => {
            const title = mediaType === 'movie' ? item.title : item.name;
            if (!title) return null;

            return {
              mediaType,
              title,
              description: item.overview,
              imageUrl: posterUrl(item.poster_path),
              releaseDate: mediaType === 'movie' ? item.release_date : item.first_air_date,
              tmdbId: item.id,
              originalTitle: mediaType === 'movie' ? item.original_title : item.original_name,
              posterPath: item.poster_path,
              backdropPath: item.backdrop_path,
              genresJson: item.genre_ids
                ? JSON.stringify(item.genre_ids.map((id) => ({ id, name: String(id) })))
                : undefined,
              voteAverage: item.vote_average,
              voteCount: item.vote_count,
              videoStatus: undefined,
            };
          })
          .filter((item): item is ContentSearchResult => item !== null) ?? [],
    };

    await setToCache(kv, cacheKey, result, TMDB_CACHE_TTL);
    return result;
  };

  return { search };
};
