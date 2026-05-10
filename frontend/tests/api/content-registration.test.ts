import { expect, test } from '@playwright/test';

const APP_ORIGIN = 'http://localhost:5175';

const extractContentId = (body: unknown) => {
  const bodyText = JSON.stringify(body);

  if (!bodyText.includes('contentId')) {
    return undefined;
  }

  return bodyText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
};

test.describe('Content Registration API (SvelteKit Form Actions)', () => {
  test('POST /contents/new?/register registers selected book and exposes it on contents pages', async ({
    request,
  }) => {
    const loginResponse = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: 'email=test1@example.com&password=password123',
      maxRedirects: 0,
    });

    expect([200, 303]).toContain(loginResponse.status());
    expect(loginResponse.headers()['set-cookie']).toContain('sb-');

    const uniqueSuffix = Date.now();
    const selectedTitle = `検索結果テスト書籍 ${uniqueSuffix}`;
    const formData = new URLSearchParams({
      mediaType: 'book',
      title: selectedTitle,
      titleKana: `ケンサクケッカテストショセキ${uniqueSuffix}`,
      description: '検索結果由来の値を登録画面で確認する Happy Path',
      releaseDate: '2026-05-02',
      imageUrl: 'https://example.com/selected-book.jpg',
      itemUrl: 'https://example.com/selected-book',
      isbn: `978${String(uniqueSuffix).slice(-10)}`,
      author: '検索結果テスト著者',
      publisherName: '検索結果テスト出版社',
      status: 'doing',
      rating: '5',
      memo: '登録画面で追加したメモ',
    });

    const response = await request.post('/contents/new?/register', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: formData.toString(),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.type).toBe('success');

    const bodyText = JSON.stringify(body);
    expect(bodyText).toContain('コンテンツを登録しました。');
    expect(bodyText).toContain('contentId');

    const contentId = extractContentId(body);
    expect(contentId).toBeTruthy();

    const listResponse = await request.get('/contents');
    expect(listResponse.status()).toBe(200);

    const listHtml = await listResponse.text();
    expect(listHtml).toContain(selectedTitle);
    expect(listHtml).toContain('登録日');
    expect(listHtml).toContain('進行中');
    expect(listHtml).toContain('書籍');
    expect(listHtml).not.toContain('発売日');
    expect(listHtml).toMatch(
      /<dt class="text-ink-muted-48">登録日<\/dt>\s*<dd class="m-0">\d{4}-\d{2}-\d{2}<\/dd>/,
    );

    const detailResponse = await request.get(`/contents/${contentId}`);
    expect(detailResponse.status()).toBe(200);

    const detailHtml = await detailResponse.text();
    expect(detailHtml).toContain(selectedTitle);
    expect(detailHtml).toContain('進行中');
    expect(detailHtml).toContain('登録画面で追加したメモ');
    expect(detailHtml).not.toContain('<h2 class="text-tagline m-0">詳細</h2>');
    expect(detailHtml).not.toContain('<dt class="text-ink-muted-48">ISBN</dt>');
    expect(detailHtml).not.toContain('<dt class="text-ink-muted-48">著者</dt>');
    expect(detailHtml).not.toContain('<dt class="text-ink-muted-48">出版社</dt>');
  });

  test('POST /contents/new?/register stores Watchmode sources for selected movie', async ({
    request,
  }) => {
    const loginResponse = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: 'email=test1@example.com&password=password123',
      maxRedirects: 0,
    });

    expect([200, 303]).toContain(loginResponse.status());
    expect(loginResponse.headers()['set-cookie']).toContain('sb-');

    const uniqueSuffix = Date.now();
    const selectedTitle = `Watchmode テスト映画 ${uniqueSuffix}`;
    const formData = new URLSearchParams({
      mediaType: 'movie',
      title: selectedTitle,
      description: 'Watchmode 連携 Happy Path',
      releaseDate: '2026-05-03',
      imageUrl: 'https://example.com/watchmode-movie.jpg',
      tmdbId: String(810000 + (uniqueSuffix % 100000)),
      originalTitle: 'Watchmode Playwright Movie',
      posterPath: '/watchmode-movie.jpg',
      backdropPath: '/watchmode-backdrop.jpg',
      genresJson: JSON.stringify([{ id: 18, name: 'ドラマ' }]),
      voteAverage: '8.2',
      voteCount: '1234',
      runtime: '120',
      videoStatus: 'Released',
      status: 'want',
      memo: 'Watchmode 経由で配信情報を保存',
    });

    const response = await request.post('/contents/new?/register', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: formData.toString(),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.type).toBe('success');

    const contentId = extractContentId(body);
    expect(contentId).toBeTruthy();

    const detailResponse = await request.get(`/contents/${contentId}`);
    expect(detailResponse.status()).toBe(200);

    const detailHtml = await detailResponse.text();
    expect(detailHtml).toContain(selectedTitle);
    expect(detailHtml).toContain('配信情報');
    expect(detailHtml).toContain('Netflix');
    expect(detailHtml).toContain('サブスク');
    expect(detailHtml).toContain('https://www.netflix.com/jp/title/watchmode-playwright');
    expect(detailHtml).toContain('Amazon Prime Video');
    expect(detailHtml).toContain('レンタル');
    expect(
      detailHtml.match(/<p class="m-0 font-semibold sm:font-normal">Amazon Prime Video<\/p>/g) ??
        [],
    ).toHaveLength(1);
    expect(detailHtml).not.toContain('TMDB ID');
    expect(detailHtml).not.toContain('投票平均');
    expect(detailHtml).not.toContain('ジャンル');
    expect(detailHtml).not.toContain('投票数');
    expect(detailHtml).not.toContain('シーズン数');
    expect(detailHtml).not.toContain('エピソード数');
    expect(detailHtml).not.toContain('地域');
  });

  test('POST /contents/new?/register registers ebook with current volume', async ({ request }) => {
    const loginResponse = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: 'email=test1@example.com&password=password123',
      maxRedirects: 0,
    });

    expect([200, 303]).toContain(loginResponse.status());

    const uniqueSuffix = Date.now();
    const selectedTitle = `電子書籍テスト漫画 ${uniqueSuffix}`;
    const formData = new URLSearchParams({
      mediaType: 'book',
      title: selectedTitle,
      isbn: `978${String(uniqueSuffix).slice(-10)}`,
      author: '漫画テスト著者',
      rakutenGenreId: '001001001', // 少年コミック
      status: 'doing',
      isEbook: 'true',
    });

    const response = await request.post('/contents/new?/register', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: formData.toString(),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.type).toBe('success');

    const contentId = extractContentId(body);
    expect(contentId).toBeTruthy();

    const detailResponse = await request.get(`/contents/${contentId}`);
    expect(detailResponse.status()).toBe(200);

    const detailHtml = await detailResponse.text();
    expect(detailHtml).toContain(selectedTitle);
    expect(detailHtml).toContain('電子書籍');
    expect(detailHtml).toContain('value="5"');
  });

  test('GET /contents redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/contents', { maxRedirects: 0 });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });

  test('GET /contents/{id} redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/contents/00000000-0000-0000-0000-000000000000', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
