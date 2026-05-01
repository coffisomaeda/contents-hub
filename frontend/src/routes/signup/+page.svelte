<script lang="ts">
  import { resolve } from '$app/paths';

  let { form } = $props();
</script>

<section class="max-w-[420px] mx-auto mt-12 sm:mt-24 p-6 sm:p-0">
  <p class="text-primary text-[13px] font-bold tracking-normal uppercase mb-2">Create account</p>
  <h1 class="text-display-md mb-6 text-ink">アカウント登録</h1>

  {#if form?.message}
    <p
      class="rounded-sm p-3 mb-6 text-caption {form.success
        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
        : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
      role="status"
    >
      {form.message}
    </p>
  {/if}

  <form method="POST" class="grid gap-[18px]">
    <label class="grid gap-2 text-ink text-body-strong">
      表示名
      <input
        class="input-standard"
        name="displayName"
        type="text"
        autocomplete="name"
        value={form?.displayName ?? ''}
        placeholder="任意"
      />
    </label>

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
        autocomplete="new-password"
        minlength="6"
        required
      />
    </label>

    <button type="submit" class="btn-primary mt-2 w-full">登録する</button>
  </form>

  <p class="text-ink-muted-48 mt-6 text-center text-caption">
    すでにアカウントがある場合は <a href={resolve('/login')} class="text-primary hover:underline"
      >ログイン</a
    >
  </p>
</section>
