import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth';
import { registerContentForUser } from '$lib/server/content-registration';
import { createRakutenClient } from '$lib/server/external/rakuten';
import { createTmdbClient } from '$lib/server/external/tmdb';
import { createWatchmodeClient } from '$lib/server/external/watchmode';
import { getUserSearchSettings } from '$lib/server/user-settings';
import {
  contentRegistrationSchema,
  contentRegistrationFields,
  contentSearchSchema,
} from '$lib/validation/content';

const getPrivateEnv = (platform: App.Platform | undefined, key: string): string | undefined => {
  const platformEnv = platform?.env as Record<string, string | undefined> | undefined;
  return env[key] ?? platformEnv?.[key];
};

type RegistrationFormKey = keyof typeof contentRegistrationFields;

const formValue = (formData: FormData, key: RegistrationFormKey) =>
  formData.get(String(key)) ?? undefined;

const buildRegistrationInput = (formData: FormData) => ({
  mediaType: formValue(formData, 'mediaType'),
  title: formValue(formData, 'title'),
  titleKana: formValue(formData, 'titleKana'),
  description: formValue(formData, 'description'),
  imageUrl: formValue(formData, 'imageUrl'),
  releaseDate: formValue(formData, 'releaseDate'),
  itemUrl: formValue(formData, 'itemUrl'),
  status: formValue(formData, 'status') ?? 'want',
  rating: formValue(formData, 'rating'),
  memo: formValue(formData, 'memo'),
  isEbook: formData.get('isEbook') === 'true' || formData.get('isEbook') === 'on',
  isSold: formData.get('isSold') === 'true' || formData.get('isSold') === 'on',
  currentVolume: formValue(formData, 'currentVolume'),
  isbn: formValue(formData, 'isbn'),
  author: formValue(formData, 'author'),
  authorKana: formValue(formData, 'authorKana'),
  publisherName: formValue(formData, 'publisherName'),
  jan: formValue(formData, 'jan'),
  hardware: formValue(formData, 'hardware'),
  label: formValue(formData, 'label'),
  makerCode: formValue(formData, 'makerCode'),
  itemPrice: formValue(formData, 'itemPrice'),
  rakutenGenreId: formValue(formData, 'rakutenGenreId'),
  reviewCount: formValue(formData, 'reviewCount'),
  reviewAverage: formValue(formData, 'reviewAverage'),
  tmdbId: formValue(formData, 'tmdbId'),
  originalTitle: formValue(formData, 'originalTitle'),
  posterPath: formValue(formData, 'posterPath'),
  backdropPath: formValue(formData, 'backdropPath'),
  genresJson: formValue(formData, 'genresJson'),
  voteAverage: formValue(formData, 'voteAverage'),
  voteCount: formValue(formData, 'voteCount'),
  runtime: formValue(formData, 'runtime'),
  numberOfSeasons: formValue(formData, 'numberOfSeasons'),
  numberOfEpisodes: formValue(formData, 'numberOfEpisodes'),
  videoStatus: formValue(formData, 'videoStatus'),
  imdbId: formValue(formData, 'imdbId'),
  watchmodeId: formValue(formData, 'watchmodeId'),
});

export const load: PageServerLoad = async ({ locals, platform }) => {
  await requireUser(locals);

  return {
    showApiAvailability: dev,
    apiAvailability: {
      rakuten: Boolean(
        getPrivateEnv(platform, 'RAKUTEN_APP_ID') && getPrivateEnv(platform, 'RAKUTEN_ACCESS_KEY'),
      ),
      tmdb: Boolean(getPrivateEnv(platform, 'TMDB_API_KEY')),
      watchmode: Boolean(getPrivateEnv(platform, 'WATCHMODE_API_KEY')),
    },
  };
};

export const actions: Actions = {
  search: async ({ request, locals, platform }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = contentSearchSchema.safeParse({
      mediaType: formData.get('mediaType'),
      query: formData.get('query'),
    });

    if (!parsed.success) {
      return fail(400, {
        kind: 'search',
        message: parsed.error.issues[0].message,
      });
    }

    const { mediaType, query } = parsed.data;
    const { searchMediaTypes } = await getUserSearchSettings(locals.supabase, user.id);

    if (!searchMediaTypes.includes(mediaType)) {
      return fail(400, {
        kind: 'search',
        mediaType,
        query,
        message: '選択できない検索対象です。',
      });
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const kv = platform?.env?.EXTERNAL_API_CACHE;

    try {
      const rakuten = createRakutenClient(
        kv,
        getPrivateEnv(platform, 'RAKUTEN_APP_ID'),
        getPrivateEnv(platform, 'RAKUTEN_ACCESS_KEY'),
      );
      const tmdb = createTmdbClient(kv, getPrivateEnv(platform, 'TMDB_API_KEY'));

      const response =
        mediaType === 'book'
          ? await rakuten.searchBooks(query, origin)
          : mediaType === 'game'
            ? await rakuten.searchGames(query, origin)
            : await tmdb.search(mediaType, query);

      return {
        kind: 'search',
        mediaType,
        query,
        results: response.results,
        message: response.available ? undefined : response.message,
      };
    } catch (error) {
      return fail(502, {
        kind: 'search',
        mediaType,
        query,
        message: error instanceof Error ? error.message : '検索に失敗しました。',
      });
    }
  },
  register: async ({ request, locals, platform }) => {
    const user = await requireUser(locals);

    const formData = await request.formData();
    const parsed = contentRegistrationSchema.safeParse(buildRegistrationInput(formData));

    if (!parsed.success) {
      return fail(400, {
        kind: 'register',
        message: parsed.error.issues[0].message,
      });
    }

    try {
      const kv = platform?.env?.EXTERNAL_API_CACHE;
      const result = await registerContentForUser(locals.supabase, user.id, parsed.data, {
        watchmode: createWatchmodeClient(
          kv,
          getPrivateEnv(platform, 'WATCHMODE_API_KEY'),
          getPrivateEnv(platform, 'WATCHMODE_API_BASE_URL'),
        ),
      });

      return {
        kind: 'register',
        success: true,
        contentId: result.contentId,
        message: result.reusedContent
          ? '既存コンテンツをライブラリに追加しました。'
          : 'コンテンツを登録しました。',
      };
    } catch (error) {
      return fail(400, {
        kind: 'register',
        message: error instanceof Error ? error.message : 'コンテンツ登録に失敗しました。',
      });
    }
  },
};
