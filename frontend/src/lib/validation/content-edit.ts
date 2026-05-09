import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalRating = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(5).optional(),
);

export const contentEditSchema = z.object({
  status: z.enum(['want', 'doing', 'done']),
  rating: optionalRating,
  memo: optionalText,
});

export type ContentEditInput = z.infer<typeof contentEditSchema>;
