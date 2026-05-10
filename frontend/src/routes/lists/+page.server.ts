import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';
import { requireUser } from '$lib/server/auth';
import { createListSchema } from '$lib/validation/sharing';

type ContentList = Tables<'content_lists'> & {
  content_list_items: { count: number }[];
};

type SharedList = Tables<'list_shares'> & {
  content_lists: Tables<'content_lists'> | null;
};

export const load: PageServerLoad = async ({ locals }) => {
  const user = await requireUser(locals);

  const [ownResult, sharedResult] = await Promise.all([
    locals.supabase
      .from('content_lists')
      .select('*, content_list_items(count)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    locals.supabase
      .from('list_shares')
      .select('*, content_lists(*)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (ownResult.error || sharedResult.error) {
    error(500, 'リストの取得に失敗しました。');
  }

  return {
    ownLists: (ownResult.data ?? []) as ContentList[],
    sharedLists: (sharedResult.data ?? []).filter((s) => s.content_lists) as SharedList[],
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = createListSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'create' as const,
        message: parsed.error.issues[0].message,
      });
    }

    const { error: insertError } = await locals.supabase.from('content_lists').insert({
      owner_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    });

    if (insertError) {
      return fail(500, {
        kind: 'create' as const,
        message: 'リストの作成に失敗しました。',
      });
    }

    return {
      kind: 'create' as const,
      success: true,
      message: 'リストを作成しました。',
    };
  },

  delete: async ({ request, locals }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const listId = formData.get('listId');
    if (!listId || typeof listId !== 'string') {
      return fail(400, { kind: 'delete' as const, message: '削除対象が不正です。' });
    }

    const { error: deleteError } = await locals.supabase
      .from('content_lists')
      .delete()
      .eq('id', listId)
      .eq('owner_id', user.id);

    if (deleteError) {
      return fail(500, { kind: 'delete' as const, message: 'リストの削除に失敗しました。' });
    }

    return {
      kind: 'delete' as const,
      success: true,
      message: 'リストを削除しました。',
    };
  },
};
