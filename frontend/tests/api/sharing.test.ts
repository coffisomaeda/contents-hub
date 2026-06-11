import { expect, test } from '@playwright/test';
import {
  login,
  saveSearchSettings,
  getSupabaseAccessToken,
  APP_ORIGIN,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from './utils';

const SEED_CONTENT_ID = '11111111-1111-1111-1111-111111111111';
const SHARE_TARGET_CONTENT_ID = '22222222-2222-2222-2222-222222222222';
const TEST_SHARER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_RECIPIENT_ID = '00000000-0000-0000-0000-000000000002';

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

const deleteShare = async (request: import('@playwright/test').APIRequestContext) => {
  const accessToken = await getSupabaseAccessToken(request, 'test1@example.com');

  const response = await request.delete(
    `${SUPABASE_URL}/rest/v1/content_shares?sharer_id=eq.${TEST_SHARER_ID}&recipient_id=eq.${TEST_RECIPIENT_ID}&content_id=eq.${SHARE_TARGET_CONTENT_ID}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  expect(response.status()).toBe(204);
};

test.describe('Sharing API', () => {
  test.beforeEach(async ({ request }) => {
    await deleteShare(request);
  });

  test.afterEach(async ({ request }) => {
    await deleteShare(request);
  });

  test('POST /contents/{id}?/share shares content with another user', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, `/contents/${SHARE_TARGET_CONTENT_ID}?/share`, {
      recipientUsername: 'user2',
      message: 'おすすめ！',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('success');
    expect(JSON.stringify(body)).toContain('コンテンツを共有しました。');
  });

  test('POST /contents/{id}?/share rejects sharing to self', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, `/contents/${SEED_CONTENT_ID}?/share`, {
      recipientUsername: 'user1',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('failure');
    expect(body.status).toBe(400);
  });

  test('GET /contents shows shared content for recipient', async ({ request }) => {
    await login(request, 'test1@example.com');

    const shareResponse = await postForm(request, `/contents/${SHARE_TARGET_CONTENT_ID}?/share`, {
      recipientUsername: 'user2',
      message: 'おすすめ！',
    });
    expect(shareResponse.status()).toBe(200);

    await login(request, 'test2@example.com');
    await saveSearchSettings(request, ['book', 'movie'], '/settings/onboarding');

    const contentsResponse = await request.get('/contents');
    expect(contentsResponse.status()).toBe(200);
    const html = await contentsResponse.text();
    expect(html).toContain('共有されたコンテンツ');
    expect(html).toContain('ゼルダの伝説');
    expect(html).toContain('おすすめ！');
  });
});
