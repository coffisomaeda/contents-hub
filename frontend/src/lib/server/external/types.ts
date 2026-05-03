import type { ContentRegistrationInput } from '$lib/validation/content';

export type ContentSearchResult = Pick<
  ContentRegistrationInput,
  | 'mediaType'
  | 'title'
  | 'titleKana'
  | 'description'
  | 'imageUrl'
  | 'releaseDate'
  | 'itemUrl'
  | 'isbn'
  | 'author'
  | 'authorKana'
  | 'publisherName'
  | 'jan'
  | 'hardware'
  | 'label'
  | 'makerCode'
  | 'itemPrice'
  | 'rakutenGenreId'
  | 'reviewCount'
  | 'reviewAverage'
  | 'tmdbId'
  | 'originalTitle'
  | 'posterPath'
  | 'backdropPath'
  | 'genresJson'
  | 'voteAverage'
  | 'voteCount'
  | 'videoStatus'
>;

export type ContentSearchResponse =
  | {
      available: true;
      results: ContentSearchResult[];
    }
  | {
      available: false;
      results: [];
      message: string;
    };
