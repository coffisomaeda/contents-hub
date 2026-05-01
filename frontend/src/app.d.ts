// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      supabase: import('@supabase/supabase-js').SupabaseClient;
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
