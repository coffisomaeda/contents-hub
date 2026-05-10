/**
 * 楽天ブックスの booksGenreId がコミック（漫画）かどうかを判定する。
 * コミックジャンルは 001001 で始まる（少年 001001001、青年 001001002 等）。
 */
export const isMangaGenre = (rakutenGenreId?: string | null): boolean =>
  rakutenGenreId?.split('/').some((id) => id.startsWith('001001')) ?? false;
