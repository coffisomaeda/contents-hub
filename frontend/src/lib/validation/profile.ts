import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, '表示名を入力してください。')
    .max(50, '表示名は50文字以内で入力してください。'),
  username: z
    .string()
    .trim()
    .min(3, 'ユーザー名は3文字以上で入力してください。')
    .max(20, 'ユーザー名は20文字以内で入力してください。')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は半角英数字とアンダースコアのみ使用できます。'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
