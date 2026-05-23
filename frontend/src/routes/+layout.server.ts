import type { LayoutServerLoad } from './$types';
import { getUserSearchSettings } from '$lib/server/user-settings';

export const load: LayoutServerLoad = async ({ depends, locals }) => {
  depends('supabase:auth');

  const { session, user } = await locals.safeGetSession();
  // オンボーディング判定と検索対象の制御で共通利用するため、
  // いったんはキャッシュ制御を増やさず毎回最新の設定を取得する。
  const searchSettings = user
    ? await getUserSearchSettings(locals.supabase, user.id)
    : { searchMediaTypes: [], settingsCompletedAt: null };

  const profile = user
    ? (
        await locals.supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', user.id)
          .maybeSingle()
      ).data
    : null;

  return {
    session,
    user,
    profile,
    searchMediaTypes: searchSettings.searchMediaTypes,
    settingsCompletedAt: searchSettings.settingsCompletedAt,
  };
};
