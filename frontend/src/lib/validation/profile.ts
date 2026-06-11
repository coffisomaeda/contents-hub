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
    .regex(
      /^[A-Za-z0-9]([A-Za-z0-9]|_(?!_))*[A-Za-z0-9]$/,
      '英数字で開始・終了し、連続アンダースコアは不可',
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
