import { z } from 'zod';
import { optionalBoolean } from './helpers';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalRating = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(5).optional(),
);

export const contentEditSchema = z
  .object({
    status: z.enum(['want', 'doing', 'done']),
    rating: optionalRating,
    memo: optionalText,
    isEbook: optionalBoolean,
    isSold: optionalBoolean,
  })
  .refine((data) => !(data.isEbook && data.isSold), {
    message: '電子書籍は売却済みにできません。',
    path: ['isSold'],
  });

export type ContentEditInput = z.infer<typeof contentEditSchema>;
