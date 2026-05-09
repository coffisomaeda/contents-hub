import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth';

type UserContent = Tables<'user_contents'> & {
  contents: Tables<'contents'> | null;
};

export const load: PageServerLoad = async ({ locals }) => {
  const user = await requireUser(locals);

  const { data, error: listError } = await locals.supabase
    .from('user_contents')
    .select('*, contents(*)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (listError) {
    error(500, '登録済みコンテンツの取得に失敗しました。');
  }

  return {
    items: (data ?? []) as UserContent[],
  };
};

const deleteSchema = z.object({
  contentId: z.uuid('削除対象が不正です。'),
});

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = deleteSchema.safeParse({
      contentId: formData.get('contentId'),
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'delete' as const,
        message: parsed.error.issues[0].message,
      });
    }

    const { error: deleteError } = await locals.supabase
      .from('user_contents')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', parsed.data.contentId);

    if (deleteError) {
      return fail(500, {
        kind: 'delete' as const,
        message: 'コンテンツの削除に失敗しました。',
      });
    }

    return {
      kind: 'delete' as const,
      success: true,
      message: '一覧から削除しました。',
    };
  },
};
