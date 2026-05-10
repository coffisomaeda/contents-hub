import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentRegistrationInput } from '$lib/validation/content';
import type { Database, Json } from '$lib/types/supabase';
import type { WatchmodeSource, WatchmodeTitleResult } from './external/watchmode';

type RegisterResult = {
  contentId: string;
  reusedContent: boolean;
};

type WatchmodeClient = {
  searchByTmdbId: (
    mediaType: 'movie' | 'tv',
    tmdbId: number,
  ) => Promise<WatchmodeTitleResult | null>;
  getStreamingSources: (watchmodeId: number, regions?: string) => Promise<WatchmodeSource[]>;
};

type RegisterContentOptions = {
  watchmode?: WatchmodeClient;
};

const toNull = <T>(value: T | undefined) => value ?? null;

const parseJson = (value: string | undefined) => {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const findExistingContent = async (
  supabase: SupabaseClient<Database>,
  input: ContentRegistrationInput,
): Promise<string | null> => {
  if (input.mediaType === 'book' && input.isbn) {
    const { data } = await supabase.from('books').select('id').eq('isbn', input.isbn).maybeSingle();
    return data?.id ?? null;
  }

  if (input.mediaType === 'game' && input.jan) {
    const { data } = await supabase.from('games').select('id').eq('jan', input.jan).maybeSingle();
    return data?.id ?? null;
  }

  if ((input.mediaType === 'movie' || input.mediaType === 'tv') && input.tmdbId) {
    const { data } = await supabase
      .from('videos')
      .select('id')
      .eq('media_type', input.mediaType)
      .eq('tmdb_id', input.tmdbId)
      .maybeSingle();
    return data?.id ?? null;
  }

  const { data } = await supabase
    .from('contents')
    .select('id')
    .eq('media_type', input.mediaType)
    .eq('title', input.title)
    .maybeSingle();

  return data?.id ?? null;
};

const createContent = async (
  supabase: SupabaseClient<Database>,
  input: ContentRegistrationInput,
  options: RegisterContentOptions = {},
): Promise<string> => {
  const { data: content, error: contentError } = await supabase
    .from('contents')
    .insert({
      media_type: input.mediaType,
      title: input.title,
      title_kana: toNull(input.titleKana),
      description: toNull(input.description),
      image_url: toNull(input.imageUrl),
      release_date: toNull(input.releaseDate),
      item_url: toNull(input.itemUrl),
    })
    .select('id')
    .single();

  if (contentError || !content) {
    throw new Error(contentError?.message ?? 'コンテンツの作成に失敗しました。');
  }

  if (input.mediaType === 'book') {
    const { error } = await supabase.from('books').insert({
      id: content.id,
      isbn: toNull(input.isbn),
      author: toNull(input.author),
      author_kana: toNull(input.authorKana),
      publisher_name: toNull(input.publisherName),
      item_price: toNull(input.itemPrice),
      rakuten_genre_id: toNull(input.rakutenGenreId),
      review_count: toNull(input.reviewCount),
      review_average: toNull(input.reviewAverage),
    });

    if (error) {
      await supabase.from('contents').delete().eq('id', content.id);
      throw new Error(error.message);
    }
  }

  if (input.mediaType === 'game') {
    const { error } = await supabase.from('games').insert({
      id: content.id,
      jan: toNull(input.jan),
      hardware: toNull(input.hardware),
      label: toNull(input.label),
      maker_code: toNull(input.makerCode),
      item_price: toNull(input.itemPrice),
      rakuten_genre_id: toNull(input.rakutenGenreId),
      review_count: toNull(input.reviewCount),
      review_average: toNull(input.reviewAverage),
    });

    if (error) {
      await supabase.from('contents').delete().eq('id', content.id);
      throw new Error(error.message);
    }
  }

  if (input.mediaType === 'movie' || input.mediaType === 'tv') {
    if (!input.tmdbId) {
      await supabase.from('contents').delete().eq('id', content.id);
      throw new Error('映像作品の登録には TMDB ID が必要です。');
    }

    const watchmodeId = input.watchmodeId ?? (await resolveWatchmodeId(options.watchmode, input));

    const { error } = await supabase.from('videos').insert({
      id: content.id,
      media_type: input.mediaType,
      tmdb_id: input.tmdbId,
      original_title: toNull(input.originalTitle),
      poster_path: toNull(input.posterPath),
      backdrop_path: toNull(input.backdropPath),
      genres: parseJson(input.genresJson) as Json,
      vote_average: toNull(input.voteAverage),
      vote_count: toNull(input.voteCount),
      runtime: toNull(input.runtime),
      number_of_seasons: toNull(input.numberOfSeasons),
      number_of_episodes: toNull(input.numberOfEpisodes),
      status: toNull(input.videoStatus),
      imdb_id: toNull(input.imdbId),
      watchmode_id: toNull(watchmodeId),
    });

    if (error) {
      await supabase.from('contents').delete().eq('id', content.id);
      throw new Error(error.message);
    }

    await saveWatchmodeSources(supabase, content.id, watchmodeId, options.watchmode);
  }

  return content.id;
};

const resolveWatchmodeId = async (
  watchmode: WatchmodeClient | undefined,
  input: ContentRegistrationInput,
) => {
  if (!watchmode || !input.tmdbId || (input.mediaType !== 'movie' && input.mediaType !== 'tv')) {
    return undefined;
  }

  try {
    return (await watchmode.searchByTmdbId(input.mediaType, input.tmdbId))?.id;
  } catch {
    return undefined;
  }
};

const saveWatchmodeSources = async (
  supabase: SupabaseClient<Database>,
  videoId: string,
  watchmodeId: number | undefined,
  watchmode: WatchmodeClient | undefined,
) => {
  if (!watchmodeId || !watchmode) return;

  try {
    const sources = await watchmode.getStreamingSources(watchmodeId, 'JP');
    if (sources.length === 0) return;

    await supabase.from('video_sources').insert(
      sources.map((source) => ({
        video_id: videoId,
        source_id: toNull(source.source_id),
        name: source.name,
        type: source.type,
        region: toNull(source.region),
        web_url: toNull(source.web_url),
        format: toNull(source.format),
        price: toNull(source.price),
        seasons: toNull(source.seasons),
        episodes: toNull(source.episodes),
      })),
    );
  } catch {
    // Watchmode 連携失敗時もコンテンツ登録は成功扱い
  }
};

export const registerContentForUser = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  input: ContentRegistrationInput,
  options: RegisterContentOptions = {},
): Promise<RegisterResult> => {
  const existingContentId = await findExistingContent(supabase, input);
  const contentId = existingContentId ?? (await createContent(supabase, input, options));

  const { error } = await supabase.from('user_contents').insert({
    user_id: userId,
    content_id: contentId,
    status: input.status,
    rating: toNull(input.rating),
    memo: toNull(input.memo),
    is_ebook: input.isEbook ?? false,
    is_sold: input.isSold ?? false,
    current_volume: toNull(input.currentVolume),
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('このコンテンツはすでに登録されています。');
    }

    throw new Error(error.message);
  }

  return {
    contentId,
    reusedContent: existingContentId !== null,
  };
};
