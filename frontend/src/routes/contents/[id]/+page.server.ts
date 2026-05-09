import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';

type UserContent = Tables<'user_contents'> & {
  contents: Tables<'contents'> | null;
};

type VideoSource = Tables<'video_sources'>;

const compactVideoSources = (sources: VideoSource[]) => {
  const sourceMap = new Map<string, VideoSource>();

  for (const source of sources) {
    const key = [
      source.source_id ?? source.name,
      source.name,
      source.type,
      source.web_url ?? '',
    ].join(':');

    if (!sourceMap.has(key)) {
      sourceMap.set(key, source);
    }
  }

  return [...sourceMap.values()];
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = await locals.safeGetSession();

  if (!user) {
    redirect(303, '/login');
  }

  const { data: userContent, error: userContentError } = await locals.supabase
    .from('user_contents')
    .select('*, contents(*)')
    .eq('user_id', user.id)
    .eq('content_id', params.id)
    .maybeSingle();

  if (userContentError) {
    error(500, '登録済みコンテンツの取得に失敗しました。');
  }

  if (!userContent?.contents) {
    error(404, '登録済みコンテンツが見つかりません。');
  }

  const content = userContent.contents;

  const [bookResult, gameResult, videoResult, sourcesResult] = await Promise.all([
    content.media_type === 'book'
      ? locals.supabase.from('books').select('*').eq('id', content.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    content.media_type === 'game'
      ? locals.supabase.from('games').select('*').eq('id', content.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    content.media_type === 'movie' || content.media_type === 'tv'
      ? locals.supabase.from('videos').select('*').eq('id', content.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    content.media_type === 'movie' || content.media_type === 'tv'
      ? locals.supabase
          .from('video_sources')
          .select('*')
          .eq('video_id', content.id)
          .order('fetched_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (bookResult.error || gameResult.error || videoResult.error || sourcesResult.error) {
    error(500, 'コンテンツ詳細の取得に失敗しました。');
  }

  return {
    userContent: userContent as UserContent,
    content,
    book: bookResult.data as Tables<'books'> | null,
    game: gameResult.data as Tables<'games'> | null,
    video: videoResult.data as Tables<'videos'> | null,
    videoSources: compactVideoSources((sourcesResult.data ?? []) as VideoSource[]),
  };
};
