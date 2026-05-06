import { expect, test, type APIRequestContext } from '@playwright/test';

const APP_ORIGIN = 'http://localhost:5175';

const extractContentId = (body: unknown) => {
  const bodyText = JSON.stringify(body);

  if (!bodyText.includes('contentId')) {
    return undefined;
  }

  return bodyText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
};

const login = async (request: APIRequestContext) => {
  const response = await request.post('/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: 'email=test1@example.com&password=password123',
    maxRedirects: 0,
  });

  expect([200, 303]).toContain(response.status());
  expect(response.headers()['set-cookie']).toContain('sb-');
};

test.describe('Contents List API', () => {
  test('GET /contents exposes registered content summary', async ({ request }) => {
    await login(request);

    const uniqueSuffix = Date.now();
    const selectedTitle = `一覧APIテスト書籍 ${uniqueSuffix}`;
    const formData = new URLSearchParams({
      mediaType: 'book',
      title: selectedTitle,
      titleKana: `イチランエーピーアイテストショセキ${uniqueSuffix}`,
      description: '一覧表示用 API テスト',
      releaseDate: '2026-05-04',
      imageUrl: 'https://example.com/list-book.jpg',
      isbn: `979${String(uniqueSuffix).slice(-10)}`,
      author: '一覧テスト著者',
      publisherName: '一覧テスト出版社',
      status: 'done',
      rating: '4',
      memo: '一覧でメモあり表示を確認',
    });

    const registerResponse = await request.post('/contents/new?/register', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: formData.toString(),
    });

    expect(registerResponse.status()).toBe(200);

    const contentId = extractContentId(await registerResponse.json());
    expect(contentId).toBeTruthy();

    const listResponse = await request.get('/contents');
    expect(listResponse.status()).toBe(200);

    const html = await listResponse.text();
    expect(html).toContain('登録済みコンテンツ');
    expect(html).toContain(selectedTitle);
    expect(html).toContain(contentId);
    expect(html).toContain('書籍');
    expect(html).toContain('完了');
    expect(html).toContain('4/5');
    expect(html).toContain('メモ');
    expect(html).toContain('あり');
  });

  test('GET /contents redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/contents', { maxRedirects: 0 });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
