import type { ContentRegistrationInput } from '$lib/validation/content';

export type SearchMediaType = ContentRegistrationInput['mediaType'];

export const searchMediaTypeValues = ['book', 'game', 'movie', 'tv'] as const;

export const searchMediaTypeMeta: Record<SearchMediaType, { label: string; iconPath: string }> = {
  book: {
    label: '書籍',
    iconPath: '/icons/book.png',
  },
  game: {
    label: 'ゲーム',
    iconPath: '/icons/game.png',
  },
  movie: {
    label: '映画',
    iconPath: '/icons/movie.png',
  },
  tv: {
    label: 'TV',
    iconPath: '/icons/tv.png',
  },
};

export const defaultSearchMediaTypes: SearchMediaType[] = [...searchMediaTypeValues];
