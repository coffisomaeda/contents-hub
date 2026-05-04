import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

const signupSchema = z.object({
  displayName: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: '有効なメールアドレスを入力してください。' })),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください。'),
});

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();

  if (user) {
    redirect(303, '/');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const displayNameStr = String(formData.get('displayName') ?? '');
    const emailStr = String(formData.get('email') ?? '');
    const passwordStr = String(formData.get('password') ?? '');

    const parsed = signupSchema.safeParse({
      displayName: displayNameStr,
      email: emailStr,
      password: passwordStr,
    });

    if (!parsed.success) {
      return fail(400, {
        displayName: displayNameStr,
        email: emailStr,
        message: parsed.error.issues[0].message,
      });
    }

    const { displayName, email, password } = parsed.data;

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
      console.error('Supabase signup failed', {
        status: error.status,
        code: error.code,
        message: error.message,
      });

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
