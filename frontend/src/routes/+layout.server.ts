import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getUserSearchSettings } from '$lib/server/user-settings';

export const load: LayoutServerLoad = async ({ depends, locals, url }) => {
  depends('supabase:auth');

  const { session, user } = await locals.safeGetSession();
  const searchSettings = user
    ? await getUserSearchSettings(locals.supabase, user.id)
    : { searchMediaTypes: [], settingsCompletedAt: null };

  if (
    user &&
    !searchSettings.settingsCompletedAt &&
    url.pathname !== '/settings/onboarding' &&
    url.pathname !== '/logout'
  ) {
    redirect(303, '/settings/onboarding');
  }

  return {
    session,
    user,
    searchMediaTypes: searchSettings.searchMediaTypes,
    settingsCompletedAt: searchSettings.settingsCompletedAt,
  };
};
