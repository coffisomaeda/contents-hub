import type { Component } from 'svelte';
import { BookOpen, Gamepad2, Film, Tv, type IconProps } from '@lucide/svelte';
import type { ContentRegistrationInput } from '$lib/validation/content';

export type SearchMediaType = ContentRegistrationInput['mediaType'];

export const searchMediaTypeValues = ['book', 'game', 'movie', 'tv'] as const;

export const searchMediaTypeMeta: Record<
  SearchMediaType,
  { label: string; icon: Component<IconProps> }
> = {
  book: {
    label: '書籍',
    icon: BookOpen,
  },
  game: {
    label: 'ゲーム',
    icon: Gamepad2,
  },
  movie: {
    label: '映画',
    icon: Film,
  },
  tv: {
    label: 'TV',
    icon: Tv,
  },
};

export const defaultSearchMediaTypes: SearchMediaType[] = [...searchMediaTypeValues];
