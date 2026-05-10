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

test.describe('Sharing & Lists API', () => {
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

  test('POST /lists?/create creates a new list', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, '/lists?/create', {
      name: 'テストリスト',
      description: 'テスト用の説明',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('success');
    expect(JSON.stringify(body.data)).toContain('リストを作成しました。');

    const listsResponse = await request.get('/lists');
    expect(listsResponse.status()).toBe(200);
    const html = await listsResponse.text();
    expect(html).toContain('テストリスト');
    expect(html).toContain('テスト用の説明');
  });

  test('list item add/remove and list sharing flow', async ({ request }) => {
    await login(request, 'test1@example.com');

    const createResponse = await postForm(request, '/lists?/create', {
      name: '共有用リスト',
    });
    expect((await createResponse.json()).type).toBe('success');

    const listsHtml = await (await request.get('/lists')).text();
    const listIdMatch = listsHtml.match(/\/lists\/([0-9a-f-]{36})/);
    expect(listIdMatch).toBeTruthy();
    const listId = listIdMatch![1];

    const addResponse = await postForm(request, `/lists/${listId}?/addItem`, {
      contentId: SEED_CONTENT_ID,
    });
    expect(addResponse.status()).toBe(200);
    expect((await addResponse.json()).type).toBe('success');

    const detailHtml = await (await request.get(`/lists/${listId}`)).text();
    expect(detailHtml).toContain('進撃の巨人');

    const shareResponse = await postForm(request, `/lists/${listId}?/share`, {
      recipientEmail: 'test2@example.com',
    });
    expect(shareResponse.status()).toBe(200);
    expect((await shareResponse.json()).type).toBe('success');

    await login(request, 'test2@example.com');
    await saveSearchSettings(request, ['book'], '/settings/onboarding');

    const recipientListsHtml = await (await request.get('/lists')).text();
    expect(recipientListsHtml).toContain('共有されたリスト');
    expect(recipientListsHtml).toContain('共有用リスト');
  });

  test('GET /lists redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/lists', { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
