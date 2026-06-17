<script lang="ts">
  import SearchSettingsForm from '$lib/components/SearchSettingsForm.svelte';

  let { data, form } = $props();
</script>

<section class="mx-auto grid max-w-[720px] gap-8">
  <div class="grid gap-3">
    <p class="text-primary text-[13px] font-bold tracking-normal uppercase m-0">Initial settings</p>
    <div>
      <h1 class="text-display-md m-0 text-ink">初回設定</h1>
      <p class="text-ink-muted-80 mt-3 mb-0">コンテンツ登録で使う検索対象を選択します。</p>
    </div>
  </div>

  <section class="rounded-sm border border-hairline bg-canvas p-5">
    <SearchSettingsForm searchMediaTypes={data.searchMediaTypes} {form} submitLabel="始める" />
  </section>
</section>
