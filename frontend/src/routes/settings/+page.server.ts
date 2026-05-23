import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { handleSettingsUpdate } from '$lib/server/user-settings';
import { requireUser } from '$lib/server/auth';
import { profileSchema } from '$lib/validation/profile';

export const load: PageServerLoad = async ({ locals }) => {
  const user = await requireUser(locals);

  const { data: profile, error: profileError } = await locals.supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return {
      profile: { display_name: null, username: null },
    };
  }

  return {
    profile,
  };
};

export const actions: Actions = {
  updateSettings: async ({ request, locals }) => {
    const result = await handleSettingsUpdate(request, locals);

    if (result.error) {
      return fail(result.status, {
        kind: 'settings' as const,
        message: result.message,
      });
    }

    return {
      kind: 'settings' as const,
      success: true,
      message: '設定を保存しました。',
    };
  },

  updateProfile: async ({ request, locals }) => {
    const user = await requireUser(locals);
    const formData = await request.formData();

    const parsed = profileSchema.safeParse({
      displayName: formData.get('displayName'),
      username: formData.get('username'),
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'profile' as const,
        message: parsed.error.issues[0].message,
      });
    }

    const { error: updateError } = await locals.supabase
      .from('profiles')
      .update({
        display_name: parsed.data.displayName,
        username: parsed.data.username,
      })
      .eq('id', user.id);

    if (updateError) {
      if (updateError.code === '23505') {
        return fail(409, {
          kind: 'profile' as const,
          message: 'このユーザー名は既に使われています。',
        });
      }
      return fail(500, {
        kind: 'profile' as const,
        message: 'プロフィールの更新に失敗しました。',
      });
    }

    return {
      kind: 'profile' as const,
      success: true,
      message: 'プロフィールを更新しました。',
    };
  },
};
