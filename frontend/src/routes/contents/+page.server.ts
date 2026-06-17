import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth';
import { searchMediaTypeValues } from '$lib/media-types';

type UserContent = Tables<'user_contents'> & {
  contents: Tables<'contents'> | null;
};

type SharedContent = Tables<'content_shares'> & {
  contents: Tables<'contents'> | null;
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'avatar_url'> | null;
};

const statusValues = ['want', 'doing', 'done'] as const;

const isDateString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = await requireUser(locals);
  const sharerFilter = url.searchParams.get('sharer');

  const titleQuery = url.searchParams.get('q')?.trim() ?? '';
  const mediaTypeParam = url.searchParams.get('type') ?? '';
  const statusParam = url.searchParams.get('status') ?? '';
  const fromParam = url.searchParams.get('from') ?? '';
  const toParam = url.searchParams.get('to') ?? '';

  const mediaTypeFilter = (searchMediaTypeValues as readonly string[]).includes(mediaTypeParam)
    ? mediaTypeParam
    : '';
  const statusFilter = (statusValues as readonly string[]).includes(statusParam) ? statusParam : '';
  const fromFilter = isDateString(fromParam) ? fromParam : '';
  const toFilter = isDateString(toParam) ? toParam : '';

  let itemsQuery = locals.supabase
    .from('user_contents')
    .select('*, contents!inner(*)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (titleQuery) {
    const escaped = titleQuery.replace(/[%_]/g, (match) => `\\${match}`);
    itemsQuery = itemsQuery.ilike('contents.title', `%${escaped}%`);
  }
  if (mediaTypeFilter) {
    itemsQuery = itemsQuery.eq('contents.media_type', mediaTypeFilter);
  }
  if (statusFilter) {
    itemsQuery = itemsQuery.eq('status', statusFilter);
  }
  if (fromFilter) {
    itemsQuery = itemsQuery.gte('created_at', `${fromFilter}T00:00:00`);
  }
  if (toFilter) {
    itemsQuery = itemsQuery.lte('created_at', `${toFilter}T23:59:59.999`);
  }

  const [itemsResult, sharedResult] = await Promise.all([
    itemsQuery,
    locals.supabase
      .from('content_shares')
      .select(
        '*, contents(*), profiles!content_shares_sharer_id_fkey(id, display_name, avatar_url)',
      )
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (itemsResult.error || sharedResult.error) {
    error(500, '登録済みコンテンツの取得に失敗しました。');
  }

  const sharers = [
    ...new Map(
      (sharedResult.data ?? []).filter((s) => s.profiles).map((s) => [s.sharer_id, s.profiles!]),
    ).values(),
  ];

  const sharedItems = sharerFilter
    ? (sharedResult.data ?? []).filter((s) => s.sharer_id === sharerFilter)
    : (sharedResult.data ?? []);

  return {
    items: (itemsResult.data ?? []) as UserContent[],
    sharedItems: sharedItems as SharedContent[],
    sharers,
    sharerFilter,
    filters: {
      q: titleQuery,
      type: mediaTypeFilter,
      status: statusFilter,
      from: fromFilter,
      to: toFilter,
    },
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
