<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { invalidate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import favicon from '$lib/assets/favicon.svg';
  import { createClient } from '$lib/supabase/client';

  let { children, data } = $props();

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
</svelte:head>

<div class="min-h-screen bg-canvas-parchment text-ink flex flex-col">
  <header
    class="flex items-center justify-between bg-surface-black h-[44px] px-5 sm:px-12 text-body-on-dark text-nav-link"
  >
    <a class="font-semibold text-[14px] hover:opacity-80 transition-opacity" href={resolve('/')}
      >Contents Hub</a
    >
    <nav aria-label="メインナビゲーション" class="flex items-center gap-4">
      {#if data.user}
        <span class="text-body-muted">{data.user.email}</span>
        <form method="POST" action={resolve('/logout')} class="m-0 flex">
          <button
            type="submit"
            class="bg-ink text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] transition-transform active:scale-95 cursor-pointer border-none"
          >
            ログアウト
          </button>
        </form>
      {:else}
        <a href={resolve('/login')} class="hover:text-body-muted transition-colors">ログイン</a>
        <a
          href={resolve('/signup')}
          class="bg-ink text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] transition-transform active:scale-95 cursor-pointer hover:bg-opacity-80"
        >
          登録
        </a>
      {/if}
    </nav>
  </header>

  <main class="px-5 py-10 sm:px-12 sm:py-16 flex-1">
    {@render children()}
  </main>
</div>
