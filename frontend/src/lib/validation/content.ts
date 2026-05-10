import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().finite().optional());
const optionalInteger = z.preprocess(emptyToUndefined, z.coerce.number().int().optional());

export const mediaTypeSchema = z.enum(['book', 'game', 'movie', 'tv']);
export const contentStatusSchema = z.enum(['want', 'doing', 'done']);

export const contentSearchSchema = z.object({
  mediaType: mediaTypeSchema,
  query: z.string().trim().min(1, '検索キーワードを入力してください。'),
});

const optionalBoolean = z.preprocess(
  (v) =>
    v === 'true' || v === 'on' || v === true ? true : v === '' || v === undefined ? false : v,
  z.boolean().default(false),
);

const contentRegistrationObjectSchema = z.object({
  mediaType: mediaTypeSchema,
  title: z.string().trim().min(1, 'タイトルを入力してください。'),
  titleKana: optionalText,
  description: optionalText,
  imageUrl: optionalText,
  releaseDate: optionalText,
  itemUrl: optionalText,
  status: contentStatusSchema.default('want'),
  rating: optionalInteger,
  memo: optionalText,
  isEbook: optionalBoolean,
  isSold: optionalBoolean,
  currentVolume: optionalInteger,
  isbn: optionalText,
  author: optionalText,
  authorKana: optionalText,
  publisherName: optionalText,
  jan: optionalText,
  hardware: optionalText,
  label: optionalText,
  makerCode: optionalText,
  itemPrice: optionalInteger,
  rakutenGenreId: optionalText,
  reviewCount: optionalInteger,
  reviewAverage: optionalNumber,
  tmdbId: optionalInteger,
  originalTitle: optionalText,
  posterPath: optionalText,
  backdropPath: optionalText,
  genresJson: optionalText,
  voteAverage: optionalNumber,
  voteCount: optionalInteger,
  runtime: optionalInteger,
  numberOfSeasons: optionalInteger,
  numberOfEpisodes: optionalInteger,
  videoStatus: optionalText,
  imdbId: optionalText,
  watchmodeId: optionalInteger,
});

export const contentRegistrationFields = contentRegistrationObjectSchema.shape;

export const contentRegistrationSchema = contentRegistrationObjectSchema.refine(
  (data) => !(data.isEbook && data.isSold),
  {
    message: '電子書籍は売却済みにできません。',
    path: ['isSold'],
  },
);

export type ContentSearchInput = z.infer<typeof contentSearchSchema>;
export type ContentRegistrationInput = z.infer<typeof contentRegistrationSchema>;
