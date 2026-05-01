import { redirect, type RequestHandler } from '@sveltejs/kit';
import { getSafeRedirect } from '$lib/utils/auth';

export const GET: RequestHandler = async ({ locals, url }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
  }

  // オープンリダイレクト対策: 共通ユーティリティを使用して検証
  const safeNext = getSafeRedirect(next);
  redirect(303, safeNext);
};
