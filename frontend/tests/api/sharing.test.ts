import { expect, test } from '@playwright/test';
import { login, saveSearchSettings, APP_ORIGIN } from './utils';

const SEED_CONTENT_ID = '11111111-1111-1111-1111-111111111111';

const postForm = (
  request: import('@playwright/test').APIRequestContext,
  url: string,
  data: Record<string, string>,
) =>
  request.post(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: new URLSearchParams(data).toString(),
  });

test.describe('Sharing API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /contents/{id}?/share shares content with another user', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, `/contents/${SEED_CONTENT_ID}?/share`, {
      recipientEmail: 'test2@example.com',
      message: 'おすすめ！',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('success');
    expect(JSON.stringify(body.data)).toContain('コンテンツを共有しました。');
  });

  test('POST /contents/{id}?/share rejects sharing to self', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, `/contents/${SEED_CONTENT_ID}?/share`, {
      recipientEmail: 'test1@example.com',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('failure');
    expect(body.status).toBe(404);
  });

  test('GET /contents shows shared content for recipient', async ({ request }) => {
    // Share was created in test 1; just verify recipient can see it
    await login(request, 'test2@example.com');
    await saveSearchSettings(request, ['book', 'movie'], '/settings/onboarding');

    const contentsResponse = await request.get('/contents');
    expect(contentsResponse.status()).toBe(200);
    const html = await contentsResponse.text();
    expect(html).toContain('共有されたコンテンツ');
    expect(html).toContain('進撃の巨人');
    expect(html).toContain('おすすめ！');
  });
});
