import { expect, test } from '@playwright/test';

test.describe('Content Registration API (SvelteKit Form Actions)', () => {
  test('POST /contents/new?/register registers a book selected from search results', async ({
    request,
  }) => {
    const loginResponse = await request.post('/login', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'http://localhost:5173',
        Accept: 'application/json',
      },
      data: 'email=test1@example.com&password=password123',
      maxRedirects: 0,
    });

    expect([200, 303]).toContain(loginResponse.status());
    expect(loginResponse.headers()['set-cookie']).toContain('sb-');

    const uniqueSuffix = Date.now();
    const formData = new URLSearchParams({
      mediaType: 'book',
      title: `検索結果テスト書籍 ${uniqueSuffix}`,
      titleKana: `ケンサクケッカテストショセキ${uniqueSuffix}`,
      description: '検索結果の候補から登録する Happy Path',
      releaseDate: '2026-05-02',
      isbn: `978${String(uniqueSuffix).slice(-10)}`,
      author: '検索結果テスト著者',
      publisherName: '検索結果テスト出版社',
      status: 'want',
    });

    const response = await request.post('/contents/new?/register', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'http://localhost:5173',
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
  });
});
