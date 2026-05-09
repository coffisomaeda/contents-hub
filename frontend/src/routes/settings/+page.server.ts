import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { handleSettingsUpdate } from '$lib/server/user-settings';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const result = await handleSettingsUpdate(request, locals);

    if (result.error) {
      return fail(result.status, {
        message: result.message,
      });
    }

    return {
      success: true,
      message: '設定を保存しました。',
    };
  },
};
