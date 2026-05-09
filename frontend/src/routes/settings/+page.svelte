<script lang="ts">
  import { resolve } from '$app/paths';
  import SearchSettingsForm from '$lib/components/SearchSettingsForm.svelte';

  let { data, form } = $props();
</script>

<section class="mx-auto grid max-w-[720px] gap-8">
  <div class="grid gap-3">
    <p class="text-primary text-[13px] font-bold tracking-normal uppercase m-0">Settings</p>
    <div>
      <h1 class="text-display-md m-0 text-ink">設定</h1>
      <p class="text-ink-muted-80 mt-3 mb-0">コンテンツ登録で使う検索対象を選択します。</p>
    </div>
  </div>

  <section class="rounded-sm border border-hairline bg-canvas p-5">
    <SearchSettingsForm searchMediaTypes={data.searchMediaTypes} {form} />
  </section>

  <section class="rounded-sm border border-hairline bg-canvas p-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-body-strong m-0">アカウント</h2>
        <p class="text-caption text-ink-muted-48 mt-1 mb-0">{data.user?.email ?? ''}</p>
      </div>
      <form method="POST" action={resolve('/logout')} class="m-0">
        <button type="submit" class="btn-secondary rounded-sm w-full sm:w-auto">
          ログアウト
        </button>
      </form>
    </div>
  </section>
</section>
