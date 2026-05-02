<script lang="ts">
  import { resolve } from '$app/paths';

  let { data, form } = $props();
  const message = form?.message ?? data?.message;
</script>

<section class="max-w-[420px] mx-auto mt-12 sm:mt-24 p-6 sm:p-0">
  <p class="text-primary text-[13px] font-bold tracking-normal uppercase mb-2">Login</p>
  <h1 class="text-display-md mb-6 text-ink">ログイン</h1>

  {#if message}
    <p
      class="bg-[#fff1f2] border border-[#fecdd3] rounded-sm text-[#be123c] p-3 mb-6 text-caption"
      role="alert"
    >
      {message}
    </p>
  {/if}

  <form method="POST" class="grid gap-[18px]">
    <label class="grid gap-2 text-ink text-body-strong">
      メールアドレス
      <input
        class="input-standard"
        name="email"
        type="email"
        autocomplete="email"
        value={form?.email ?? ''}
        required
      />
    </label>

    <label class="grid gap-2 text-ink text-body-strong">
      パスワード
      <input
        class="input-standard"
        name="password"
        type="password"
        autocomplete="current-password"
        required
      />
    </label>

    <button type="submit" class="btn-primary mt-2 w-full">ログイン</button>
  </form>

  <p class="text-ink-muted-48 mt-6 text-center text-caption">
    アカウントがない場合は <a href={resolve('/signup')} class="text-primary hover:underline">登録</a
    >
  </p>
</section>
