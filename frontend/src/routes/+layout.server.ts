import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { normalizeSearchMediaTypes } from '$lib/server/user-settings';
import type { SearchMediaType } from '$lib/media-types';

export const load: LayoutServerLoad = async ({ depends, locals }) => {
  depends('supabase:auth');

  const { session, user } = await locals.safeGetSession();

  if (!user) {
    return {
      session,
      user,
      profile: null,
      searchMediaTypes: [] as SearchMediaType[],
      settingsCompletedAt: null,
    };
  }

  // オンボーディング判定と検索対象の制御で共通利用するため、
  // いったんはキャッシュ制御を増やさず毎回最新の設定を取得する。
  // ※ profiles テーブルへの2回の直列クエリを1回に統合
  const { data, error: dbError } = await locals.supabase
    .from('profiles')
    .select('display_name, username, search_media_types, settings_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (dbError) {
    error(500, 'プロファイルの取得に失敗しました。');
  }

  return {
    session,
    user,
    profile: data ? { display_name: data.display_name, username: data.username } : null,
    searchMediaTypes: normalizeSearchMediaTypes(data?.search_media_types),
    settingsCompletedAt: data?.settings_completed_at ?? null,
  };
};
