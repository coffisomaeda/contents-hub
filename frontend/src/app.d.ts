// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      supabase: import('@supabase/supabase-js').SupabaseClient<
        import('$lib/types/supabase').Database
      >;
      safeGetSession: () => Promise<{
        session: import('@supabase/supabase-js').Session | null;
        user: import('@supabase/supabase-js').User | null;
      }>;
    }

    interface PageData {
      session: import('@supabase/supabase-js').Session | null;
      user: import('@supabase/supabase-js').User | null;
    }

    interface Platform {
      env: {
        ASSETS: { fetch: typeof fetch };
        PUBLIC_SUPABASE_URL: string;
        PUBLIC_SUPABASE_ANON_KEY: string;
        RAKUTEN_APP_ID?: string;
        RAKUTEN_ACCESS_KEY?: string;
        TMDB_API_KEY?: string;
        WATCHMODE_API_KEY?: string;
        WATCHMODE_API_BASE_URL?: string;
        EXTERNAL_API_CACHE: KVNamespace;
      };
      ctx: {
        waitUntil: (promise: Promise<unknown>) => void;
        passThroughOnException: () => void;
      };
      caches: CacheStorage;
      cf?: Record<string, unknown>;
    }

    // interface Error {}
    // interface PageState {}
  }
}

export {};
