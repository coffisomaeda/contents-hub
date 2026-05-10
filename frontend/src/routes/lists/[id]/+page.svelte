<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  let { data, form } = $props();
  let showAddForm = $state(false);
  let showShareForm = $state(false);
  const messageTone = $derived(form?.success ? 'success' : 'error');

  const existingContentIds = $derived(new Set(data.items.map((item) => item.content_id)));
  const availableContents = $derived(
    data.userContents.filter((uc) => !existingContentIds.has(uc.content_id)),
  );

  $effect(() => {
    if (form?.kind === 'delete' && form?.success) {
      goto(resolve('/lists'));
    }
  });
</script>

<div class="grid gap-6 max-w-screen-md mx-auto">
  <div class="flex items-center justify-between">
    <div class="grid gap-1">
      <h1 class="text-title m-0">{data.list.name}</h1>
      {#if data.list.description}
        <p class="text-caption text-ink-muted-48 m-0">{data.list.description}</p>
      {/if}
    </div>
    {#if data.isOwner}
      <div class="flex gap-2">
        <button
          type="button"
          class="bg-primary text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] cursor-pointer border-none transition-transform active:scale-95"
          onclick={() => {
            showShareForm = !showShareForm;
            showAddForm = false;
          }}
        >
          共有
        </button>
      </div>
    {/if}
  </div>

  {#if form?.message}
    <p
      class="m-0 text-caption {messageTone === 'success'
        ? 'text-status-success'
        : 'text-status-error'}"
    >
      {form.message}
    </p>
  {/if}

  {#if showShareForm && data.isOwner}
    <form
      method="POST"
      action="?/share"
      use:enhance
      class="grid gap-3 p-4 border border-hairline rounded-sm bg-surface-ivory"
    >
      <label class="grid gap-1 text-body-strong">
        共有先メールアドレス
        <input
          type="email"
          name="recipientEmail"
          required
          class="border border-hairline rounded-sm px-3 py-2 text-body bg-canvas-parchment"
        />
      </label>
      <button
        type="submit"
        class="bg-primary text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] cursor-pointer border-none transition-transform active:scale-95 justify-self-start"
      >
        共有する
      </button>
    </form>
  {/if}

  {#if data.items.length > 0}
    <section class="grid gap-3">
      <h2 class="text-heading m-0">コンテンツ（{data.items.length}件）</h2>
      <div class="grid gap-2">
        {#each data.items as item (item.id)}
          {#if item.contents}
            <div
              class="flex items-center justify-between p-3 border border-hairline rounded-sm bg-surface-ivory"
            >
              <a
                href={resolve(`/contents/${item.content_id}`)}
                class="text-ink no-underline font-semibold hover:text-primary transition-colors"
              >
                {item.contents.title}
              </a>
              {#if data.isOwner}
                <form method="POST" action="?/removeItem" use:enhance class="m-0">
                  <input type="hidden" name="contentId" value={item.content_id} />
                  <button
                    type="submit"
                    class="text-status-error text-caption cursor-pointer bg-transparent border-none hover:underline"
                  >
                    削除
                  </button>
                </form>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {:else}
    <p class="text-caption text-ink-muted-48 m-0">リストにコンテンツがありません。</p>
  {/if}

  {#if data.isOwner}
    <section class="grid gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-heading m-0">アイテム追加</h2>
        <button
          type="button"
          class="text-caption text-primary cursor-pointer bg-transparent border-none hover:underline"
          onclick={() => (showAddForm = !showAddForm)}
        >
          {showAddForm ? '閉じる' : '追加する'}
        </button>
      </div>
      {#if showAddForm}
        {#if availableContents.length > 0}
          <div class="grid gap-2">
            {#each availableContents as uc (uc.content_id)}
              <form
                method="POST"
                action="?/addItem"
                use:enhance
                class="flex items-center justify-between p-3 border border-hairline rounded-sm bg-surface-ivory m-0"
              >
                <span class="font-semibold">{uc.contents?.title ?? uc.content_id}</span>
                <input type="hidden" name="contentId" value={uc.content_id} />
                <button
                  type="submit"
                  class="text-primary text-caption cursor-pointer bg-transparent border-none hover:underline"
                >
                  追加
                </button>
              </form>
            {/each}
          </div>
        {:else}
          <p class="text-caption text-ink-muted-48 m-0">追加可能なコンテンツがありません。</p>
        {/if}
      {/if}
    </section>

    <section class="border-t border-hairline pt-4">
      <form method="POST" action="?/delete" use:enhance>
        <button
          type="submit"
          class="text-status-error text-caption cursor-pointer bg-transparent border-none hover:underline"
        >
          このリストを削除
        </button>
      </form>
    </section>
  {/if}

  <a href={resolve('/lists')} class="text-caption text-primary hover:underline">← リスト一覧へ</a>
</div>
