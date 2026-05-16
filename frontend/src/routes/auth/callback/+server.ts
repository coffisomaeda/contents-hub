import { redirect, type RequestHandler } from '@sveltejs/kit';
import { getSafeRedirect } from '$lib/utils/auth';
import { getUserSearchSettings } from '$lib/server/user-settings';

export const GET: RequestHandler = async ({ locals, url }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { error, data } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // エラーがある場合はログインページにリダイレクト
      const message = encodeURIComponent(
        '認証に失敗しました。リンクが無効か期限切れの可能性があります。',
      );
      redirect(303, `/login?message=${message}`);
    }

    // 初回ログイン判定: settingsCompletedAt 未設定の場合はオンボーディングへ
    if (data?.user) {
      const settings = await getUserSearchSettings(locals.supabase, data.user.id);
      if (!settings.settingsCompletedAt) {
        redirect(303, '/settings/onboarding');
      }
    }
  }

  // オープンリダイレクト対策: 共通ユーティリティを使用して検証
  const safeNext = getSafeRedirect(next);
  redirect(303, safeNext);
};
