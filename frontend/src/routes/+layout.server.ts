import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUserSearchSettings } from '$lib/server/user-settings';

export const load: LayoutServerLoad = async ({ depends, locals, url }) => {
  depends('supabase:auth');

  const { session, user } = await locals.safeGetSession();
  // オンボーディング判定と検索対象の制御で共通利用するため、
  // いったんはキャッシュ制御を増やさず毎回最新の設定を取得する。
  const searchSettings = user
    ? await getUserSearchSettings(locals.supabase, user.id)
    : { searchMediaTypes: [], settingsCompletedAt: null };

  if (user && !searchSettings.settingsCompletedAt && url.pathname !== '/settings/onboarding') {
    redirect(303, '/settings/onboarding');
  }

  return {
    session,
    user,
    searchMediaTypes: searchSettings.searchMediaTypes,
    settingsCompletedAt: searchSettings.settingsCompletedAt,
  };
};
