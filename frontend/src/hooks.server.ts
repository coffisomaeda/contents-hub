import { createClient } from '$lib/supabase/server';
import type { Handle } from '@sveltejs/kit';
import type { Session, User } from '@supabase/supabase-js';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createClient(event.cookies);

  // リクエストスコープでセッション結果をキャッシュし、
  // layout load と各 page load での重複認証リクエストを排除する
  let cached: { session: Session | null; user: User | null } | undefined;

  event.locals.safeGetSession = async () => {
    if (cached) return cached;

    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    if (!session) {
      cached = { session: null, user: null };
      return cached;
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();

    if (error) {
      cached = { session: null, user: null };
      return cached;
    }

    cached = { session, user };
    return cached;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
