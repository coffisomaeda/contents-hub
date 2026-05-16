import { z } from 'zod';

export const shareContentSchema = z.object({
  recipientEmail: z.string().email('有効なメールアドレスを入力してください。'),
  message: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export type ShareContentInput = z.infer<typeof shareContentSchema>;
