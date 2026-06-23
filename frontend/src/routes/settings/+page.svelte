<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import type { SubmitFunction } from '@sveltejs/kit';
  import SearchSettingsForm from '$lib/components/SearchSettingsForm.svelte';

  let { data, form } = $props();

  let profileDisplayName = $state('');
  let profileUsername = $state('');
  let isSavingProfile = $state(false);

  $effect(() => {
    profileDisplayName = data.profile?.display_name ?? '';
    profileUsername = data.profile?.username ?? '';
  });

  const handleProfileSubmit: SubmitFunction = () => {
    isSavingProfile = true;
    return async ({ update }) => {
      try {
        await update();
      } finally {
        isSavingProfile = false;
      }
    };
  };
</script>

<section class="mx-auto grid max-w-[720px] gap-3 sm:gap-8">
  <section class="rounded-sm border border-hairline bg-canvas p-4 sm:p-5">
    <h2 class="text-body-strong m-0 mb-3 sm:mb-4">プロフィール設定</h2>

    {#if form?.kind === 'profile' && form.message}
      <div
        class="rounded-sm p-3 text-caption mb-4 {form.success
          ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
          : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
        role={form.success ? 'status' : 'alert'}
      >
        {form.message}
      </div>
    {/if}

    <form
      method="POST"
      action="?/updateProfile"
      class="grid gap-3"
      use:enhance={handleProfileSubmit}
    >
      <div class="grid gap-1.5">
        <label for="displayName" class="text-caption text-ink-muted-48">表示名</label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          required
          class="input-standard text-caption"
          bind:value={profileDisplayName}
          disabled={isSavingProfile}
        />
      </div>

      <div class="grid gap-1.5">
        <label for="username" class="text-caption text-ink-muted-48">ユーザー名</label>
        <input
          type="text"
          id="username"
          name="username"
          required
          class="input-standard text-caption"
          bind:value={profileUsername}
          disabled={isSavingProfile}
          placeholder="半角英数字とアンダースコア（3〜20文字）"
        />
      </div>

      <div class="flex justify-end">
        <button
          type="submit"
          class="btn-primary rounded-sm min-w-[96px]"
          disabled={isSavingProfile}
        >
          {isSavingProfile ? '保存中' : '保存'}
        </button>
      </div>
    </form>
  </section>

  <section class="rounded-sm border border-hairline bg-canvas p-4 sm:p-5">
    <SearchSettingsForm
      searchMediaTypes={data.searchMediaTypes}
      form={form?.kind === 'settings' ? form : null}
    />
  </section>

  <section class="rounded-sm border border-hairline bg-canvas p-4 sm:p-5">
    <div class="flex flex-row items-center justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-body-strong m-0">アカウント</h2>
        <p class="text-caption text-ink-muted-48 mt-1 mb-0 truncate">{data.user?.email ?? ''}</p>
      </div>
      <form method="POST" action={resolve('/logout')} class="m-0 shrink-0">
        <button type="submit" class="btn-secondary rounded-sm"> ログアウト </button>
      </form>
    </div>
  </section>
</section>
