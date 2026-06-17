<script lang="ts">
  import '../app.css';
  import { MessageCircle, List, Plus, Settings } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import favicon from '$lib/assets/favicon.svg';
  import { createClient } from '$lib/supabase/client';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children, data } = $props();

  const webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  const isActive = (path: string) =>
    page.url.pathname === path || page.url.pathname.startsWith(path + '/');

  const isChat = () => page.url.pathname === '/';

  $effect(() => {
    if (!browser) return;

    let currentToken = untrack(() => data.session?.access_token ?? null);

    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const next = newSession?.access_token ?? null;
      if (next !== currentToken) {
        currentToken = next;
        invalidate('supabase:auth');
      }
    });

    return () => listener.subscription.unsubscribe();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html webManifest}
</svelte:head>

<div class="min-h-screen bg-canvas-parchment text-ink flex flex-col">
  <header
    class="flex items-center justify-between bg-surface-black h-[44px] px-4 sm:px-12 text-body-on-dark text-nav-link"
  >
    <a class="font-semibold text-[14px] hover:opacity-80 transition-opacity" href={resolve('/')}
      >Contents Hub</a
    >
    {#if data.user}
      <nav aria-label="メインナビゲーション" class="hidden sm:flex items-center gap-4">
        <a href={resolve('/')} class="hover:text-body-muted transition-colors">チャット</a>
        <a href={resolve('/contents')} class="hover:text-body-muted transition-colors">一覧</a>
        <a href={resolve('/contents/new')} class="hover:text-body-muted transition-colors">登録</a>
        <a href={resolve('/settings')} class="hover:text-body-muted transition-colors">設定</a>
        <span class="text-body-muted"
          >{data.profile?.display_name ?? data.profile?.username ?? data.user.email}</span
        >
        <form method="POST" action={resolve('/logout')} class="m-0 flex">
          <button
            type="submit"
            class="bg-ink text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] transition-transform active:scale-95 cursor-pointer border-none"
          >
            ログアウト
          </button>
        </form>
      </nav>
    {:else}
      <nav aria-label="メインナビゲーション" class="flex items-center gap-3">
        <a href={resolve('/login')} class="hover:text-body-muted transition-colors">ログイン</a>
        <a
          href={resolve('/signup')}
          class="bg-ink text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] transition-transform active:scale-95 cursor-pointer hover:bg-opacity-80"
        >
          登録
        </a>
      </nav>
    {/if}
  </header>

  <main
    class="px-4 py-6 sm:px-12 sm:py-16 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-16"
  >
    {@render children()}
  </main>

  {#if data.user}
    <nav
      aria-label="タブナビゲーション"
      class="fixed inset-x-0 bottom-0 z-50 flex sm:hidden bg-surface-black text-body-on-dark border-t border-ink-muted-80"
      style="padding-bottom: env(safe-area-inset-bottom, 0px);"
    >
      <a
        href={resolve('/')}
        class="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors {isChat()
          ? 'text-primary-on-dark'
          : 'text-body-muted'}"
        aria-current={isChat() ? 'page' : undefined}
      >
        <MessageCircle class="w-6 h-6" aria-hidden="true" />
        チャット
      </a>
      <a
        href={resolve('/contents')}
        class="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors {isActive(
          '/contents',
        ) && !isActive('/contents/new')
          ? 'text-primary-on-dark'
          : 'text-body-muted'}"
        aria-current={isActive('/contents') && !isActive('/contents/new') ? 'page' : undefined}
      >
        <List class="w-6 h-6" aria-hidden="true" />
        一覧
      </a>
      <a
        href={resolve('/contents/new')}
        class="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors {isActive(
          '/contents/new',
        )
          ? 'text-primary-on-dark'
          : 'text-body-muted'}"
        aria-current={isActive('/contents/new') ? 'page' : undefined}
      >
        <Plus class="w-6 h-6" aria-hidden="true" />
        登録
      </a>
      <a
        href={resolve('/settings')}
        class="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors {isActive(
          '/settings',
        )
          ? 'text-primary-on-dark'
          : 'text-body-muted'}"
        aria-current={isActive('/settings') ? 'page' : undefined}
      >
        <Settings class="w-6 h-6" aria-hidden="true" />
        設定
      </a>
    </nav>
  {/if}
</div>
