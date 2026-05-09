<script lang="ts">
  import '../app.css';
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

  $effect(() => {
    if (!browser) return;

    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth');
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
        <a href={resolve('/contents')} class="hover:text-body-muted transition-colors">一覧</a>
        <a href={resolve('/contents/new')} class="hover:text-body-muted transition-colors">登録</a>
        <a href={resolve('/settings')} class="hover:text-body-muted transition-colors">設定</a>
        <span class="text-body-muted">{data.user.email}</span>
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
        href={resolve('/contents')}
        class="flex-1 flex flex-col items-center gap-1 py-2 text-[11px] transition-colors {isActive(
          '/contents',
        ) && !isActive('/contents/new')
          ? 'text-primary-on-dark'
          : 'text-body-muted'}"
        aria-current={isActive('/contents') && !isActive('/contents/new') ? 'page' : undefined}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-6 h-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
        設定
      </a>
    </nav>
  {/if}
</div>
