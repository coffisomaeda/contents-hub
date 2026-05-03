import { buildCacheKey, consumeToken, getFromCache, setToCache } from './cache';
import type { TokenBucketConfig } from './cache';
import { fetchWithRetry } from './fetch-with-retry';

export type WatchmodeTitleResult = {
  id: number;
  name: string;
  type: string;
  year?: number;
  imdb_id?: string;
  tmdb_id?: number;
  tmdb_type?: string;
};

export type WatchmodeSource = {
  source_id: number;
  name: string;
  type: 'sub' | 'rent' | 'buy' | 'free' | 'tve';
  region: string;
  web_url?: string;
  format?: string;
  price?: number | null;
  seasons?: number;
  episodes?: number;
};

type WatchmodeSearchApiResponse = {
  title_results?: WatchmodeTitleResult[];
};

const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';
// Watchmode は月 2,500 リクエスト制限。24h キャッシュよりも長期保存で節約する
const WATCHMODE_SEARCH_CACHE_TTL = 604800; // 7 days
const WATCHMODE_SOURCES_CACHE_TTL = 604800; // 7 days

// 月 2,500 リクエスト ≈ 83 req/day ≈ 0.001 req/sec
// maxTokens=5 でバーストを許容しつつ、日次上限に近い速度で補充
const WATCHMODE_TOKEN_BUCKET: TokenBucketConfig = {
  bucket: 'watchmode',
  maxTokens: 5,
  refillRatePerSecond: 0.001,
};

type CachedSearchResult = { value: WatchmodeTitleResult | null };

export const createWatchmodeClient = (kv: KVNamespace | undefined, apiKey?: string) => {
  const searchByTmdbId = async (
    mediaType: 'movie' | 'tv',
    tmdbId: number,
  ): Promise<WatchmodeTitleResult | null> => {
    if (!apiKey) return null;

    const cacheKey = buildCacheKey('watchmode', 'search', mediaType, String(tmdbId));
    const cached = await getFromCache<CachedSearchResult>(kv, cacheKey);
    if (cached !== null) return cached.value;

    if (kv) await consumeToken(kv, WATCHMODE_TOKEN_BUCKET);

    const searchField = mediaType === 'movie' ? 'tmdb_movie_id' : 'tmdb_tv_id';
    const url = new URL(`${WATCHMODE_BASE_URL}/search/`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('search_field', searchField);
    url.searchParams.set('search_value', String(tmdbId));
    url.searchParams.set('types', mediaType === 'movie' ? 'movie' : 'tv_series,tv_special');

    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error('Watchmode タイトル検索に失敗しました。');
    }

    const payload = (await response.json()) as WatchmodeSearchApiResponse;
    const result = payload.title_results?.[0] ?? null;

    await setToCache(kv, cacheKey, { value: result }, WATCHMODE_SEARCH_CACHE_TTL);
    return result;
  };

  const getStreamingSources = async (
    watchmodeId: number,
    regions = 'JP',
  ): Promise<WatchmodeSource[]> => {
    if (!apiKey) return [];

    const cacheKey = buildCacheKey('watchmode', 'sources', String(watchmodeId), regions);
    const cached = await getFromCache<WatchmodeSource[]>(kv, cacheKey);
    if (cached) return cached;

    if (kv) await consumeToken(kv, WATCHMODE_TOKEN_BUCKET);

    const url = new URL(`${WATCHMODE_BASE_URL}/title/${watchmodeId}/sources/`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('regions', regions);

    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error('Watchmode 配信情報の取得に失敗しました。');
    }

    const result = (await response.json()) as WatchmodeSource[];

    await setToCache(kv, cacheKey, result, WATCHMODE_SOURCES_CACHE_TTL);
    return result;
  };

  return { searchByTmdbId, getStreamingSources };
};
