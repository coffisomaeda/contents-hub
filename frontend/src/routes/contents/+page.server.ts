import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Tables } from '$lib/types/supabase';

type UserContent = Tables<'user_contents'> & {
  contents: Tables<'contents'> | null;
};

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();

  if (!user) {
    redirect(303, '/login');
  }

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
