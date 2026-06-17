import { z } from 'zod';
import { mediaTypeSchema } from '$lib/validation/content';

export const searchSettingsSchema = z.object({
  searchMediaTypes: z
    .array(mediaTypeSchema)
    .min(1, '検索対象を1つ以上選択してください。')
    .transform((mediaTypes) => [...new Set(mediaTypes)]),
});
