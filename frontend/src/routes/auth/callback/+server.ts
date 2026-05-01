import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
  }

  // オープンリダイレクト対策: 相対パス（/ で始まり // で始まらない）のみ許可
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  redirect(303, safeNext);
};
