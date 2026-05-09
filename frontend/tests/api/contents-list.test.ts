import { expect, test } from '@playwright/test';
import { APP_ORIGIN, login } from './utils';

const extractContentId = (body: unknown) => {
  const bodyText = JSON.stringify(body);

  if (!bodyText.includes('contentId')) {
    return undefined;
  }

  return bodyText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
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

  test('POST /contents?/delete removes registered content from user list', async ({ request }) => {
    await login(request);

    const uniqueSuffix = Date.now();
    const selectedTitle = `一覧削除APIテスト書籍 ${uniqueSuffix}`;
    const formData = new URLSearchParams({
      mediaType: 'book',
      title: selectedTitle,
      titleKana: `イチランサクジョエーピーアイテストショセキ${uniqueSuffix}`,
      description: '一覧削除用 API テスト',
      releaseDate: '2026-05-09',
      imageUrl: 'https://example.com/delete-list-book.jpg',
      isbn: `978${String(uniqueSuffix).slice(-10)}`,
      author: '一覧削除テスト著者',
      publisherName: '一覧削除テスト出版社',
      status: 'want',
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

    const deleteResponse = await request.post('/contents?/delete', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: APP_ORIGIN,
        Accept: 'application/json',
      },
      data: new URLSearchParams({ contentId: String(contentId) }).toString(),
    });

    expect(deleteResponse.status()).toBe(200);

    const deleteBody = await deleteResponse.json();
    expect(deleteBody.type).toBe('success');
    expect(JSON.stringify(deleteBody.data)).toContain('一覧から削除しました。');

    const listResponse = await request.get('/contents');
    expect(listResponse.status()).toBe(200);

    const html = await listResponse.text();
    expect(html).not.toContain(selectedTitle);
    expect(html).not.toContain(String(contentId));

    const detailResponse = await request.get(`/contents/${contentId}`);
    expect(detailResponse.status()).toBe(404);
  });

  test('GET /contents redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/contents', { maxRedirects: 0 });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
