import { expect, test } from '@playwright/test';
import { login, saveSearchSettings, signup } from './utils';

test.describe('Search settings API (SvelteKit Form Actions)', () => {
  test('POST /settings saves selected media types and filters /contents/new choices', async ({
    request,
  }) => {
    await login(request);

    try {
      const settingsResponse = await saveSearchSettings(request, ['book', 'movie']);
      expect(settingsResponse.status()).toBe(200);

      const settingsBody = await settingsResponse.json();
      expect(settingsBody.type).toBe('success');
      expect(JSON.stringify(settingsBody.data)).toContain('設定を保存しました。');

      const newContentResponse = await request.get('/contents/new');
      expect(newContentResponse.status()).toBe(200);

      const html = await newContentResponse.text();
      expect(html).toContain('書籍');
      expect(html).toContain('映画');
      expect(html).not.toContain('ゲーム');
      expect(html).not.toContain('>TV<');

      const rejectedSearchResponse = await request.post('/contents/new?/search', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'http://localhost:5175',
          Accept: 'application/json',
        },
        data: new URLSearchParams({
          mediaType: 'game',
          query: 'zelda',
        }).toString(),
      });

      expect(rejectedSearchResponse.status()).toBe(200);
      const rejectedSearchBody = await rejectedSearchResponse.json();
      expect(rejectedSearchBody.type).toBe('failure');
      expect(rejectedSearchBody.status).toBe(400);
      expect(JSON.stringify(rejectedSearchBody.data)).toContain('選択できない検索対象です。');
    } finally {
      await saveSearchSettings(request);
    }
  });

  test('new user must complete onboarding before protected pages', async ({ request }) => {
    const email = `onboarding-${Date.now()}@example.com`;
    await signup(request, email);

    const protectedResponse = await request.get('/contents/new', { maxRedirects: 0 });
    expect(protectedResponse.status()).toBe(303);
    expect(protectedResponse.headers()['location']).toBe('/settings/onboarding');

    const formData = new URLSearchParams();
    formData.append('searchMediaTypes', 'book');
    formData.append('searchMediaTypes', 'movie');

    const onboardingResponse = await request.post('/settings/onboarding', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'http://localhost:5175',
      },
      data: formData.toString(),
      maxRedirects: 0,
    });

    if (onboardingResponse.status() === 303) {
      expect(onboardingResponse.headers()['location']).toBe('/contents/new');
    } else {
      expect(onboardingResponse.status()).toBe(200);
      const onboardingBody = await onboardingResponse.json();
      expect(onboardingBody.type).toBe('redirect');
      expect(onboardingBody.location).toBe('/contents/new');
    }
  });
});
