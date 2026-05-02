import { redirect, type RequestHandler } from '@sveltejs/kit';
import { getSafeRedirect } from '$lib/utils/auth';

export const GET: RequestHandler = async ({ locals, url }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // エラーがある場合はログインページにリダイレクト
      const message = encodeURIComponent(
        '認証に失敗しました。リンクが無効か期限切れの可能性があります。',
      );
      redirect(303, `/login?message=${message}`);
    }
  }

  // オープンリダイレクト対策: 共通ユーティリティを使用して検証
  const safeNext = getSafeRedirect(next);
  redirect(303, safeNext);
};
