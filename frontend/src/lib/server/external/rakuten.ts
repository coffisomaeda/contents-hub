import { buildCacheKey, consumeToken, getFromCache, setToCache } from './cache';
import type { TokenBucketConfig } from './cache';
import { fetchWithRetry } from './fetch-with-retry';
import type { ContentSearchResponse, ContentSearchResult } from './types';

type RakutenBookItem = {
  title?: string;
  titleKana?: string;
  subTitle?: string;
  author?: string;
  authorKana?: string;
  publisherName?: string;
  isbn?: string;
  itemCaption?: string;
  largeImageUrl?: string;
  salesDate?: string;
  itemUrl?: string;
  itemPrice?: number;
  booksGenreId?: string;
  reviewCount?: number;
  reviewAverage?: string | number;
};

type RakutenGameItem = {
  title?: string;
  titleKana?: string;
  hardware?: string;
  label?: string;
  jan?: string;
  itemCaption?: string;
  largeImageUrl?: string;
  salesDate?: string;
  itemUrl?: string;
  itemPrice?: number;
  booksGenreId?: string;
  reviewCount?: number;
  reviewAverage?: string | number;
};

type RakutenResponse<T> = {
  Items?: Array<{ Item?: T }>;
};

const RAKUTEN_MAX_HITS_PER_PAGE = 30;
const RAKUTEN_SEARCH_CANDIDATE_LIMIT = 30; // 1ページ（30件）のみ取得するように変更
const SEARCH_RESULT_LIMIT = 10;
const RAKUTEN_CACHE_TTL = 86400; // 24 hours

const RAKUTEN_TOKEN_BUCKET: TokenBucketConfig = {
  bucket: 'rakuten',
  maxTokens: 10,
  refillRatePerSecond: 2,
};

const normalizeDate = (value?: string) => {
  if (!value) return undefined;

  const match = value.match(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/);
  if (!match) return undefined;

  const [year, month, day] = match[0].split(/[/-]/);
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const numberOrUndefined = (value?: string | number) => {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const isRakutenGameGenre = (booksGenreId?: string) =>
  booksGenreId?.split('/').some((genreId) => genreId.startsWith('006')) ?? false;

const gameHardwarePatterns = [
  /Nintendo/i,
  /Switch/i,
  /Wii/i,
  /3DS/i,
  /DS/i,
  /Game Boy/i,
  /ゲームボーイ/,
  /PlayStation/i,
  /\bPS[0-9P]?\b/i,
  /PS Vita/i,
  /Xbox/i,
  /PC/i,
  /Windows/i,
  /Mac/i,
  /Steam/i,
];

const isGameHardware = (hardware?: string) =>
  Boolean(hardware && gameHardwarePatterns.some((pattern) => pattern.test(hardware)));

const searchRakuten = async <T>(
  kv: KVNamespace | undefined,
  endpoint: string,
  query: string,
  applicationId: string,
  accessKey: string,
  origin?: string,
  booksGenreId?: string,
  outOfStockFlag?: boolean,
): Promise<Array<{ Item?: T }>> => {
  const items: Array<{ Item?: T }> = [];
  const pageCount = Math.ceil(RAKUTEN_SEARCH_CANDIDATE_LIMIT / RAKUTEN_MAX_HITS_PER_PAGE);

  for (
    let page = 1;
    page <= pageCount && items.length < RAKUTEN_SEARCH_CANDIDATE_LIMIT;
    page += 1
  ) {
    if (kv) await consumeToken(kv, RAKUTEN_TOKEN_BUCKET);

    const url = new URL(endpoint);
    url.searchParams.set('format', 'json');
    url.searchParams.set('applicationId', applicationId);
    url.searchParams.set('accessKey', accessKey);
    url.searchParams.set('title', query);
    url.searchParams.set('hits', String(RAKUTEN_MAX_HITS_PER_PAGE));
    url.searchParams.set('page', String(page));
    if (booksGenreId) {
      url.searchParams.set('booksGenreId', booksGenreId);
    }
    if (outOfStockFlag) {
      url.searchParams.set('outOfStockFlag', '1');
    }

    const response = await fetchWithRetry(url, {
      headers: origin ? { Origin: origin } : undefined,
    });
    if (!response.ok) {
      throw new Error('楽天ブックス API の検索に失敗しました。');
    }

    const payload = (await response.json()) as RakutenResponse<T>;
    const pageItems = payload.Items ?? [];
    items.push(...pageItems);

    if (pageItems.length < RAKUTEN_MAX_HITS_PER_PAGE) {
      break;
    }
  }

  return items.slice(0, RAKUTEN_SEARCH_CANDIDATE_LIMIT);
};

export const createRakutenClient = (
  kv: KVNamespace | undefined,
  applicationId?: string,
  accessKey?: string,
) => {
  const performSearch = async <T>(
    query: string,
    origin: string | undefined,
    cacheType: string,
    endpoint: string,
    booksGenreId: string | undefined,
    outOfStockFlag: boolean | undefined,
    unavailableMessage: string,
    mapper: (item: { Item?: T }) => ContentSearchResult | null,
  ): Promise<ContentSearchResponse> => {
    if (!applicationId || !accessKey) {
      return {
        available: false,
        results: [],
        message: unavailableMessage,
      };
    }

    const cacheKey = buildCacheKey('rakuten', cacheType, query);
    const cached = await getFromCache<ContentSearchResponse>(kv, cacheKey);
    if (cached) return cached;

    const payload = await searchRakuten<T>(
      kv,
      endpoint,
      query,
      applicationId,
      accessKey,
      origin,
      booksGenreId,
      outOfStockFlag,
    );

    const result: ContentSearchResponse = {
      available: true,
      results: payload
        .map(mapper)
        .filter((item): item is ContentSearchResult => item !== null)
        .slice(0, SEARCH_RESULT_LIMIT),
    };

    await setToCache(kv, cacheKey, result, RAKUTEN_CACHE_TTL);
    return result;
  };

  const searchBooks = async (query: string, origin?: string): Promise<ContentSearchResponse> => {
    return performSearch<RakutenBookItem>(
      query,
      origin,
      'books',
      'https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404',
      undefined,
      undefined,
      '楽天 API の Application ID または Access Key が未設定のため、書籍検索は利用できません。',
      ({ Item }) => {
        if (!Item?.title) return null;

        return {
          mediaType: 'book',
          title: Item.title,
          titleKana: Item.titleKana,
          description: Item.itemCaption ?? Item.subTitle,
          imageUrl: Item.largeImageUrl,
          releaseDate: normalizeDate(Item.salesDate),
          itemUrl: Item.itemUrl,
          isbn: Item.isbn,
          author: Item.author,
          authorKana: Item.authorKana,
          publisherName: Item.publisherName,
          itemPrice: Item.itemPrice,
          rakutenGenreId: Item.booksGenreId,
          reviewCount: Item.reviewCount,
          reviewAverage: numberOrUndefined(Item.reviewAverage),
        };
      },
    );
  };

  const searchGames = async (query: string, origin?: string): Promise<ContentSearchResponse> => {
    return performSearch<RakutenGameItem>(
      query,
      origin,
      'games',
      'https://openapi.rakuten.co.jp/services/api/BooksGame/Search/20170404',
      '006',
      true,
      '楽天 API の Application ID または Access Key が未設定のため、ゲーム検索は利用できません。',
      ({ Item }) => {
        if (
          !Item?.title ||
          !isRakutenGameGenre(Item.booksGenreId) ||
          !isGameHardware(Item.hardware)
        ) {
          return null;
        }

        return {
          mediaType: 'game',
          title: Item.title,
          titleKana: Item.titleKana,
          description: Item.itemCaption,
          imageUrl: Item.largeImageUrl,
          releaseDate: normalizeDate(Item.salesDate),
          itemUrl: Item.itemUrl,
          jan: Item.jan,
          hardware: Item.hardware,
          label: Item.label,
          itemPrice: Item.itemPrice,
          rakutenGenreId: Item.booksGenreId,
          reviewCount: Item.reviewCount,
          reviewAverage: numberOrUndefined(Item.reviewAverage),
        };
      },
    );
  };

  return { searchBooks, searchGames };
};
