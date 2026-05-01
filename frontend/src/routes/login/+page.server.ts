import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: '有効なメールアドレスを入力してください。' })),
  password: z.string().min(1, 'パスワードを入力してください。'),
});

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();

  if (user) {
    redirect(303, '/');
  }
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const emailStr = String(formData.get('email') ?? '');
    const passwordStr = String(formData.get('password') ?? '');

    const parsed = loginSchema.safeParse({ email: emailStr, password: passwordStr });

    if (!parsed.success) {
      return fail(400, {
        email: emailStr,
        message: parsed.error.issues[0].message,
      });
    }

    const { email, password } = parsed.data;

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail(400, {
        email,
        message: 'ログインに失敗しました。入力内容を確認してください。',
      });
    }

    redirect(303, '/');
  },
};
