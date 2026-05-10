import { z } from 'zod';

export const shareContentSchema = z.object({
  recipientEmail: z.string().email('有効なメールアドレスを入力してください。'),
  message: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export type ShareContentInput = z.infer<typeof shareContentSchema>;

export const createListSchema = z.object({
  name: z.string().trim().min(1, 'リスト名を入力してください。').max(100),
  description: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export type CreateListInput = z.infer<typeof createListSchema>;

export const shareListSchema = z.object({
  recipientEmail: z.string().email('有効なメールアドレスを入力してください。'),
});

export type ShareListInput = z.infer<typeof shareListSchema>;
