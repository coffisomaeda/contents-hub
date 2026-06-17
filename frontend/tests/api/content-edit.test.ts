import { expect, test, type APIRequestContext } from '@playwright/test';
import { APP_ORIGIN, login } from './utils';

const EDIT_TARGET_ID = '11111111-1111-1111-1111-111111111111';

const restoreSeedData = async (request: APIRequestContext) => {
  const response = await request.post(`/contents/${EDIT_TARGET_ID}?/edit`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: 'status=done&rating=5&memo=最高に面白かった。',
  });
  expect(response.status()).toBe(200);
};

test.describe('Content Edit API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /contents/{id}?/edit updates status, rating, and memo', async ({ request }) => {
    await login(request);

    try {
      const editResponse = await request.post(`/contents/${EDIT_TARGET_ID}?/edit`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: APP_ORIGIN,
          Accept: 'application/json',
        },
        data: 'status=doing&rating=3&memo=編集テスト用メモ',
      });

      expect(editResponse.status()).toBe(200);

      const body = await editResponse.json();
      expect(body.type).toBe('success');

      const bodyText = JSON.stringify(body);
      expect(bodyText).toContain('コンテンツを更新しました。');

      const detailResponse = await request.get(`/contents/${EDIT_TARGET_ID}`);
      expect(detailResponse.status()).toBe(200);

      const html = await detailResponse.text();
      expect(html).toContain('進撃の巨人');
      expect(html).toContain('編集テスト用メモ');
    } finally {
      // restore seed data
      await restoreSeedData(request);
    }
  });

  test('POST /contents/{id}?/edit clears rating when empty', async ({ request }) => {
    await login(request);

    try {
      const editResponse = await request.post(`/contents/${EDIT_TARGET_ID}?/edit`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: APP_ORIGIN,
          Accept: 'application/json',
        },
        data: 'status=want&rating=&memo=',
      });

      expect(editResponse.status()).toBe(200);

      const body = await editResponse.json();
      expect(body.type).toBe('success');

      const detailResponse = await request.get(`/contents/${EDIT_TARGET_ID}`);
      const html = await detailResponse.text();
      expect(html).toContain('進撃の巨人');
      expect(html).toContain('未評価');
    } finally {
      // restore seed data
      await restoreSeedData(request);
    }
  });

  test('GET /contents/{id} redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get(`/contents/00000000-0000-0000-0000-000000000000`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
