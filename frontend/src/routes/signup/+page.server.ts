import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();

  if (user) {
    redirect(303, '/');
  }
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const displayName = String(formData.get('displayName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      return fail(400, {
        displayName,
        email,
        message: 'メールアドレスとパスワードを入力してください。',
      });
    }

    if (password.length < 6) {
      return fail(400, {
        displayName,
        email,
        message: 'パスワードは6文字以上で入力してください。',
      });
    }

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email,
        },
        emailRedirectTo: `${url.origin}/auth/callback`,
      },
    });

    if (error) {
      return fail(400, {
        displayName,
        email,
        message: 'アカウント登録に失敗しました。入力内容を確認してください。',
      });
    }

    if (data.session) {
      redirect(303, '/');
    }

    return {
      success: true,
      message: '確認メールを送信しました。メール内のリンクから登録を完了してください。',
    };
  },
};
