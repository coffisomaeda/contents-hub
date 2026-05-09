import { expect, test } from '@playwright/test';
import { login } from './utils';

const MATRIX_CONTENT_ID = '33333333-3333-3333-3333-333333333333';

test.describe('Content Detail API', () => {
  test('GET /contents/{id} exposes detail without internal video fields', async ({ request }) => {
    await login(request);

    const detailResponse = await request.get(`/contents/${MATRIX_CONTENT_ID}`);
    expect(detailResponse.status()).toBe(200);

    const html = await detailResponse.text();
    expect(html).toContain('マトリックス');
    expect(html).toContain('映画');
    expect(html).toContain('完了');
    expect(html).toContain('value="4"');
    expect(html).toContain('1999-03-30');
    expect(html).toContain('The Matrix');
    expect(html).toContain('136分');
    expect(html).toContain('何度見ても世界観が強い。配信情報の表示確認用。');
    expect(html).toContain('配信情報');
    expect(html).toContain('Netflix');
    expect(html).toContain('サブスク');
    expect(html).not.toContain('<h2 class="text-tagline m-0">詳細</h2>');
    expect(html).not.toContain('TMDB ID');
    expect(html).not.toContain('ジャンル');
    expect(html).not.toContain('投票数');
    expect(html).not.toContain('シーズン数');
    expect(html).not.toContain('エピソード数');
    expect(html).not.toContain('地域');
  });

  test('GET /contents/{id} redirects unauthenticated user to login', async ({ request }) => {
    const response = await request.get('/contents/00000000-0000-0000-0000-000000000000', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/login');
  });
});
