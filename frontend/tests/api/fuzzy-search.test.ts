import { expect, test } from '@playwright/test';
import { login, APP_ORIGIN } from './utils';

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

test.describe('Fuzzy Search API', () => {
  test('POST /contents/new?/fuzzySearch finds registered content by partial title', async ({
    request,
  }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, '/contents/new?/fuzzySearch', {
      query: '進撃',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('success');

    const data = JSON.stringify(body.data);
    expect(data).toContain('fuzzySearch');
    expect(data).toContain('進撃の巨人');
  });

  test('POST /contents/new?/fuzzySearch returns empty for unmatched query', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, '/contents/new?/fuzzySearch', {
      query: 'xxxxxxxxxx_not_found',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('success');

    const data = JSON.stringify(body.data);
    expect(data).toContain('fuzzySearch');
    expect(data).toContain('fuzzyResults');
    // fuzzyResults should be empty array
    expect(data).not.toContain('title');
  });

  test('POST /contents/new?/fuzzySearch rejects empty query', async ({ request }) => {
    await login(request, 'test1@example.com');

    const response = await postForm(request, '/contents/new?/fuzzySearch', {
      query: '',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('failure');
    expect(body.status).toBe(400);
  });
});
