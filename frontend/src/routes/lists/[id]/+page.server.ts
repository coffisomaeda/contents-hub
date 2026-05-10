import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';
import { requireUser } from '$lib/server/auth';
import { shareListSchema } from '$lib/validation/sharing';

type ListItem = Tables<'content_list_items'> & {
  contents: Tables<'contents'> | null;
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const user = await requireUser(locals);

  const { data: list, error: listError } = await locals.supabase
    .from('content_lists')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (listError) {
    error(500, 'リストの取得に失敗しました。');
  }

  if (!list) {
    error(404, 'リストが見つかりません。');
  }

  const isOwner = list.owner_id === user.id;

  const [itemsResult, userContentsResult] = await Promise.all([
    locals.supabase
      .from('content_list_items')
      .select('*, contents(*)')
      .eq('list_id', params.id)
      .order('position', { ascending: true }),
    isOwner
      ? locals.supabase
          .from('user_contents')
          .select('content_id, contents(id, title, media_type)')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsResult.error) {
    error(500, 'リストアイテムの取得に失敗しました。');
  }

  return {
    list,
    isOwner,
    items: (itemsResult.data ?? []) as ListItem[],
    userContents: isOwner ? (userContentsResult.data ?? []) : [],
  };
};

export const actions: Actions = {
  addItem: async ({ request, locals, params }) => {
    await requireUser(locals);

    const formData = await request.formData();
    const contentId = formData.get('contentId');

    if (!contentId || typeof contentId !== 'string') {
      return fail(400, { kind: 'addItem' as const, message: 'コンテンツIDが不正です。' });
    }

    const { data: maxPos } = await locals.supabase
      .from('content_list_items')
      .select('position')
      .eq('list_id', params.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: insertError } = await locals.supabase.from('content_list_items').insert({
      list_id: params.id,
      content_id: contentId,
      position: (maxPos?.position ?? 0) + 1,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return fail(409, {
          kind: 'addItem' as const,
          message: 'このコンテンツは既にリストに追加済みです。',
        });
      }
      return fail(500, {
        kind: 'addItem' as const,
        message: 'アイテムの追加に失敗しました。',
      });
    }

    return { kind: 'addItem' as const, success: true, message: 'アイテムを追加しました。' };
  },

  removeItem: async ({ request, locals, params }) => {
    await requireUser(locals);

    const formData = await request.formData();
    const contentId = formData.get('contentId');

    if (!contentId || typeof contentId !== 'string') {
      return fail(400, { kind: 'removeItem' as const, message: 'コンテンツIDが不正です。' });
    }

    const { error: deleteError } = await locals.supabase
      .from('content_list_items')
      .delete()
      .eq('list_id', params.id)
      .eq('content_id', contentId);

    if (deleteError) {
      return fail(500, {
        kind: 'removeItem' as const,
        message: 'アイテムの削除に失敗しました。',
      });
    }

    return { kind: 'removeItem' as const, success: true, message: 'アイテムを削除しました。' };
  },

  share: async ({ request, locals, params }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = shareListSchema.safeParse({
      recipientEmail: formData.get('recipientEmail'),
    });

    if (!parsed.success) {
      return fail(400, { kind: 'share' as const, message: parsed.error.issues[0].message });
    }

    const { data: recipientId } = await locals.supabase.rpc('find_user_id_by_email', {
      target_email: parsed.data.recipientEmail,
    });

    if (!recipientId || recipientId === user.id) {
      return fail(404, {
        kind: 'share' as const,
        message: '指定されたユーザーが見つかりません。',
      });
    }

    const { error: shareError } = await locals.supabase.from('list_shares').insert({
      list_id: params.id,
      sharer_id: user.id,
      recipient_id: recipientId,
    });

    if (shareError) {
      if (shareError.code === '23505') {
        return fail(409, {
          kind: 'share' as const,
          message: 'このリストは既に共有済みです。',
        });
      }
      return fail(500, { kind: 'share' as const, message: 'リストの共有に失敗しました。' });
    }

    return { kind: 'share' as const, success: true, message: 'リストを共有しました。' };
  },

  delete: async ({ locals, params }) => {
    const user = await requireUser(locals);

    const { error: deleteError } = await locals.supabase
      .from('content_lists')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id);

    if (deleteError) {
      return fail(500, { kind: 'delete' as const, message: 'リストの削除に失敗しました。' });
    }

    return { kind: 'delete' as const, success: true, message: 'リストを削除しました。' };
  },
};
