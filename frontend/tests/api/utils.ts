import { expect, type APIRequestContext } from '@playwright/test';

export const APP_ORIGIN = 'http://127.0.0.1:5175';
export const DEFAULT_SEARCH_MEDIA_TYPES = ['book', 'game', 'movie', 'tv'];
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const login = async (request: APIRequestContext, email = 'test1@example.com') => {
  const response = await request.post('/login', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: new URLSearchParams({ email, password: 'password123' }).toString(),
    maxRedirects: 0,
  });

  expect([200, 303]).toContain(response.status());
  expect(response.headers()['set-cookie']).toContain('sb-');
};

export const signup = async (request: APIRequestContext, email: string) => {
  const response = await request.post('/signup', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: new URLSearchParams({
      displayName: email,
      email,
      password: 'password123',
    }).toString(),
    maxRedirects: 0,
  });

  expect([200, 303]).toContain(response.status());
  expect(response.headers()['set-cookie']).toContain('sb-');
};

export const getSupabaseAccessToken = async (
  request: APIRequestContext,
  email = 'test1@example.com',
) => {
  const response = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password: 'password123',
    },
  });

  expect(response.status()).toBe(200);
  return (await response.json()).access_token as string;
};

export const saveSearchSettings = async (
  request: APIRequestContext,
  searchMediaTypes = DEFAULT_SEARCH_MEDIA_TYPES,
  path = '/settings',
) => {
  const formData = new URLSearchParams();
  searchMediaTypes.forEach((mediaType) => formData.append('searchMediaTypes', mediaType));

  const targetPath = path === '/settings' ? '/settings?/updateSettings' : path;

  const response = await request.post(targetPath, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: APP_ORIGIN,
      Accept: 'application/json',
    },
    data: formData.toString(),
    maxRedirects: 0,
  });

  return response;
};
