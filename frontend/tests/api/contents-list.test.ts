import { expect, test, type APIRequestContext } from '@playwright/test';
import { login } from './utils';

// test1（00000000-...-0001）のシード済みライブラリ:
//   進撃の巨人（1）          book  done
//   ゼルダの伝説 ...         game  doing
//   プロダクトマネジメントのすべて  book  doing
//   ELDEN RING              game  want
//   マトリックス             movie done
//   ブレイキング・バッド       tv    want
const SHINGEKI = '進撃の巨人（1）';
const ZELDA = 'ゼルダの伝説 ティアーズ オブ ザ キングダム';
const PM = 'プロダクトマネジメントのすべて';
const ELDEN = 'ELDEN RING';
const MATRIX = 'マトリックス';
const BREAKING = 'ブレイキング・バッド';
const NO_MATCH = '該当なし';

const fetchContents = async (request: APIRequestContext, query = '') => {
  const response = await request.get(`/contents${query}`);
  expect(response.status()).toBe(200);
  return response.text();
};

test.describe('Contents List Filter', () => {
  test('ジャンル(type=book)で書籍のみに絞り込む', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?type=book');

    expect(html).toContain(SHINGEKI);
    expect(html).toContain(PM);
    expect(html).not.toContain(ZELDA);
    expect(html).not.toContain(ELDEN);
    expect(html).not.toContain(MATRIX);
    expect(html).not.toContain(BREAKING);
  });

  test('ステータス(status=done)で完了のみに絞り込む', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?status=done');

    expect(html).toContain(SHINGEKI);
    expect(html).toContain(MATRIX);
    expect(html).not.toContain(ZELDA); // doing
    expect(html).not.toContain(PM); // doing
    expect(html).not.toContain(ELDEN); // want
    expect(html).not.toContain(BREAKING); // want
  });

  test('タイトル(q)で部分一致絞り込みする', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, `?q=${encodeURIComponent('進撃')}`);

    expect(html).toContain(SHINGEKI);
    expect(html).not.toContain(PM);
    expect(html).not.toContain(MATRIX);
  });

  test('ジャンルとタイトルを複合で絞り込む', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, `?type=book&q=${encodeURIComponent('進撃')}`);

    expect(html).toContain(SHINGEKI);
    expect(html).not.toContain(PM); // book だがタイトル不一致
    expect(html).not.toContain(ZELDA);
  });

  test('登録日(from)が未来日なら該当なしになる', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?from=2099-01-01');

    expect(html).toContain(NO_MATCH);
    expect(html).not.toContain(SHINGEKI);
  });

  test('登録日(from)が過去日なら全件残る', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?from=2000-01-01');

    expect(html).toContain(SHINGEKI);
    expect(html).toContain(MATRIX);
    expect(html).not.toContain(NO_MATCH);
  });

  test('一致しないタイトルは該当なしになる', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?q=zzzz_no_such_title_xx');

    expect(html).toContain(NO_MATCH);
    expect(html).not.toContain(SHINGEKI);
  });

  test('不正な type は無視され全件返る', async ({ request }) => {
    await login(request);
    const html = await fetchContents(request, '?type=invalid');

    expect(html).toContain(SHINGEKI);
    expect(html).toContain(ZELDA);
    expect(html).toContain(MATRIX);
    expect(html).not.toContain(NO_MATCH);
  });

  test('未認証ユーザーは /login へリダイレクトされる', async ({ request }) => {
    const response = await request.get('/contents', { maxRedirects: 0 });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
