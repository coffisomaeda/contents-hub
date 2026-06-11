import { expect, test } from '@playwright/test';
import { APP_ORIGIN } from './utils';

test.describe('AI Chat API (/api/chat)', () => {
  test.beforeEach(async () => {
    // AI_API_KEY または GEMINI_API_KEY が設定されていない場合はテストをスキップ
    const hasApiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    test.skip(!hasApiKey, 'AI API key is not configured. Skipping integration test.');
  });

  test('POST /api/chat registers a book content via Function Calling', async ({ request }) => {
    // 1. テストユーザーでログイン
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
    const targetTitle = `AIテスト本 ${uniqueSuffix}`;

    // 2. AIチャットAPIに登録を指示
    const chatResponse = await request.post('/api/chat', {
      headers: {
        Origin: APP_ORIGIN,
      },
      data: {
        message: `本「${targetTitle}」を「気になる」ステータスで登録して。著者名は「AIアシスタント」、出版社は「AIパブリッシング」、価格は2000円。`,
        history: [],
      },
    });

    expect(chatResponse.status()).toBe(200);

    const body = await chatResponse.json();
    expect(body.reply).toBeTruthy();
    expect(body.registeredContent).toBeTruthy();

    const registered = body.registeredContent;
    expect(registered.mediaType).toBe('book');
    expect(registered.title).toContain(targetTitle);
    expect(registered.status).toBe('want');
    expect(registered.contentId).toBeTruthy();

    const contentId = registered.contentId;

    // 3. ライブラリ詳細ページにアクセスし、正しく登録されていることを確認
    const detailResponse = await request.get(`/contents/${contentId}`);
    expect(detailResponse.status()).toBe(200);

    const detailHtml = await detailResponse.text();
    expect(detailHtml).toContain(targetTitle);
    expect(detailHtml).toContain('気になる');
    expect(detailHtml).toContain('AIアシスタント');
    expect(detailHtml).toContain('AIパブリッシング');
  });
});
