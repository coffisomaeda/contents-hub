import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultSearchMediaTypes, type SearchMediaType } from '$lib/media-types';
import type { Database } from '$lib/types/supabase';
import { requireUser } from '$lib/server/auth';
import { searchSettingsSchema } from '$lib/validation/settings';

export type UserSearchSettings = {
  searchMediaTypes: SearchMediaType[];
  settingsCompletedAt: string | null;
};

const normalizeSearchMediaTypes = (value: unknown): SearchMediaType[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return defaultSearchMediaTypes;
  }

  return value as SearchMediaType[];
};

export const getUserSearchSettings = async (
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserSearchSettings> => {
  const { data } = await supabase
    .from('profiles')
    .select('search_media_types, settings_completed_at')
    .eq('id', userId)
    .maybeSingle();

  return {
    searchMediaTypes: normalizeSearchMediaTypes(data?.search_media_types),
    settingsCompletedAt: data?.settings_completed_at ?? null,
  };
};

export const saveUserSearchSettings = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  searchMediaTypes: SearchMediaType[],
) =>
  supabase
    .from('profiles')
    .update({
      search_media_types: searchMediaTypes,
      settings_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

export const handleSettingsUpdate = async (request: Request, locals: App.Locals) => {
  const user = await requireUser(locals);
  const formData = await request.formData();

  const parsed = searchSettingsSchema.safeParse({
    searchMediaTypes: formData.getAll('searchMediaTypes'),
  });

  if (!parsed.success) {
    return { error: true as const, status: 400, message: parsed.error.issues[0].message };
  }

  const { error: dbError } = await saveUserSearchSettings(
    locals.supabase,
    user.id,
    parsed.data.searchMediaTypes,
  );

  if (dbError) {
    return { error: true as const, status: 500, message: '設定の保存に失敗しました。' };
  }

  return { error: false as const };
};
