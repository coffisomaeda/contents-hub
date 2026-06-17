import { z } from 'zod';

export const shareContentSchema = z.object({
  recipientUsername: z
    .string()
    .trim()
    .min(3, 'ユーザー名は3文字以上で入力してください。')
    .max(20, 'ユーザー名は20文字以内で入力してください。')
    .regex(/^[a-zA-Z0-9_]+$/, 'ユーザー名は半角英数字とアンダースコアのみ使用できます。'),
  message: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});
