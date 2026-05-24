import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';
import { requireUser } from '$lib/server/auth';
import { contentEditSchema } from '$lib/validation/content-edit';
import { shareContentSchema } from '$lib/validation/sharing';

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
  const user = await requireUser(locals);

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

  const [bookResult, gameResult, videoResult, sourcesResult, userBookResult] = await Promise.all([
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
    content.media_type === 'book'
      ? locals.supabase
          .from('user_books')
          .select('*')
          .eq('user_content_id', userContent.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (
    bookResult.error ||
    gameResult.error ||
    videoResult.error ||
    sourcesResult.error ||
    userBookResult.error
  ) {
    error(500, 'コンテンツ詳細の取得に失敗しました。');
  }

  return {
    userContent: userContent as UserContent,
    content,
    userBook: userBookResult.data as Tables<'user_books'> | null,
    book: bookResult.data as Tables<'books'> | null,
    game: gameResult.data as Tables<'games'> | null,
    video: videoResult.data as Tables<'videos'> | null,
    videoSources: compactVideoSources((sourcesResult.data ?? []) as VideoSource[]),
  };
};

export const actions: Actions = {
  edit: async ({ request, locals, params }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = contentEditSchema.safeParse({
      status: formData.get('status'),
      rating: formData.get('rating'),
      memo: formData.get('memo'),
      isEbook: formData.get('isEbook') === 'true' || formData.get('isEbook') === 'on',
      isSold: formData.get('isSold') === 'true' || formData.get('isSold') === 'on',
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'edit' as const,
        message: parsed.error.issues[0].message,
      });
    }

    const { status, rating, memo, isEbook, isSold } = parsed.data;

    const { data: uc, error: updateError } = await locals.supabase
      .from('user_contents')
      .update({
        status,
        rating: rating ?? null,
        memo: memo ?? null,
      })
      .eq('user_id', user.id)
      .eq('content_id', params.id)
      .select('id')
      .single();

    if (updateError || !uc) {
      return fail(500, {
        kind: 'edit' as const,
        message: 'コンテンツの更新に失敗しました。',
      });
    }

    const { data: content } = await locals.supabase
      .from('contents')
      .select('media_type')
      .eq('id', params.id)
      .single();

    if (content?.media_type === 'book') {
      const { error: bookError } = await locals.supabase.from('user_books').upsert(
        {
          user_content_id: uc.id,
          is_ebook: isEbook,
          is_sold: isSold,
        },
        { onConflict: 'user_content_id' },
      );

      if (bookError) {
        return fail(500, {
          kind: 'edit' as const,
          message: 'コンテンツの更新に失敗しました。',
        });
      }
    }

    return {
      kind: 'edit' as const,
      success: true,
      message: 'コンテンツを更新しました。',
    };
  },

  share: async ({ request, locals, params }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = shareContentSchema.safeParse({
      recipientUsername: formData.get('recipientUsername'),
      message: formData.get('message'),
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'share' as const,
        message: parsed.error.issues[0].message,
      });
    }

    const { data: recipientProfile, error: profileError } = await locals.supabase
      .from('profiles')
      .select('id')
      .eq('username', parsed.data.recipientUsername)
      .maybeSingle();

    if (profileError) {
      return fail(500, {
        kind: 'share' as const,
        message: 'ユーザーの検索に失敗しました。',
      });
    }

    const recipientId = recipientProfile?.id;

    if (!recipientId || recipientId === user.id) {
      return fail(404, {
        kind: 'share' as const,
        message: '指定されたユーザーが見つかりません。',
      });
    }

    // Verify ownership before sharing
    const { data: ownership, error: ownershipError } = await locals.supabase
      .from('user_contents')
      .select('id')
      .eq('content_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownershipError || !ownership) {
      return fail(403, {
        kind: 'share' as const,
        message: 'このコンテンツを共有する権限がありません。',
      });
    }

    const { error: shareError } = await locals.supabase.from('content_shares').insert({
      sharer_id: user.id,
      recipient_id: recipientId,
      content_id: params.id,
      message: parsed.data.message ?? null,
    });

    if (shareError) {
      if (shareError.code === '23505') {
        return fail(409, {
          kind: 'share' as const,
          message: 'このコンテンツは既に共有済みです。',
        });
      }
      return fail(500, {
        kind: 'share' as const,
        message: 'コンテンツの共有に失敗しました。',
      });
    }

    return {
      kind: 'share' as const,
      success: true,
      message: 'コンテンツを共有しました。',
    };
  },
};
