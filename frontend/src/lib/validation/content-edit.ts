import { z } from 'zod';

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
    isEbook: z.preprocess(
      (v) =>
        v === 'true' || v === 'on' || v === true ? true : v === '' || v === undefined ? false : v,
      z.boolean().default(false),
    ),
    isSold: z.preprocess(
      (v) =>
        v === 'true' || v === 'on' || v === true ? true : v === '' || v === undefined ? false : v,
      z.boolean().default(false),
    ),
  })
  .refine((data) => !(data.isEbook && data.isSold), {
    message: '電子書籍は売却済みにできません。',
    path: ['isSold'],
  });

export type ContentEditInput = z.infer<typeof contentEditSchema>;
