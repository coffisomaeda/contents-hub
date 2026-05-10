<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let showCreateForm = $state(false);
  const messageTone = $derived(form?.success ? 'success' : 'error');
</script>

<div class="grid gap-6 max-w-screen-md mx-auto">
  <div class="flex items-center justify-between">
    <h1 class="text-title m-0">リスト</h1>
    <button
      type="button"
      class="bg-primary text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] cursor-pointer border-none transition-transform active:scale-95"
      onclick={() => (showCreateForm = !showCreateForm)}
    >
      {showCreateForm ? 'キャンセル' : '新規作成'}
    </button>
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

  {#if showCreateForm}
    <form
      method="POST"
      action="?/create"
      use:enhance
      class="grid gap-3 p-4 border border-hairline rounded-sm bg-surface-ivory"
    >
      <label class="grid gap-1 text-body-strong">
        リスト名
        <input
          type="text"
          name="name"
          required
          maxlength="100"
          class="border border-hairline rounded-sm px-3 py-2 text-body bg-canvas-parchment"
        />
      </label>
      <label class="grid gap-1 text-body-strong">
        説明（任意）
        <textarea
          name="description"
          maxlength="500"
          rows="2"
          class="border border-hairline rounded-sm px-3 py-2 text-body bg-canvas-parchment"
        ></textarea>
      </label>
      <button
        type="submit"
        class="bg-primary text-body-on-dark text-button-utility rounded-sm px-[15px] py-[8px] cursor-pointer border-none transition-transform active:scale-95 justify-self-start"
      >
        作成
      </button>
    </form>
  {/if}

  {#if data.ownLists.length > 0}
    <section class="grid gap-3">
      <h2 class="text-heading m-0">マイリスト</h2>
      <div class="grid gap-2">
        {#each data.ownLists as list (list.id)}
          <a
            href={resolve(`/lists/${list.id}`)}
            class="flex items-center justify-between p-3 border border-hairline rounded-sm bg-surface-ivory hover:bg-surface-warm transition-colors text-ink no-underline"
          >
            <div class="grid gap-1">
              <span class="font-semibold">{list.name}</span>
              {#if list.description}
                <span class="text-caption text-ink-muted-48">{list.description}</span>
              {/if}
            </div>
            <span class="text-caption text-ink-muted-48">
              {list.content_list_items[0]?.count ?? 0}件
            </span>
          </a>
        {/each}
      </div>
    </section>
  {:else if !showCreateForm}
    <p class="text-caption text-ink-muted-48 m-0">リストがありません。新規作成してください。</p>
  {/if}

  {#if data.sharedLists.length > 0}
    <section class="grid gap-3">
      <h2 class="text-heading m-0">共有されたリスト</h2>
      <div class="grid gap-2">
        {#each data.sharedLists as share (share.id)}
          {#if share.content_lists}
            <a
              href={resolve(`/lists/${share.content_lists.id}`)}
              class="flex items-center justify-between p-3 border border-hairline rounded-sm bg-surface-ivory hover:bg-surface-warm transition-colors text-ink no-underline"
            >
              <span class="font-semibold">{share.content_lists.name}</span>
            </a>
          {/if}
        {/each}
      </div>
    </section>
  {/if}
</div>
