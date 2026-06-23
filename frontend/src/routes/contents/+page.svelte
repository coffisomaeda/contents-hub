<script lang="ts">
  import type { Component } from 'svelte';
  import { BookOpen, Gamepad2, Film, Tv, type IconProps } from '@lucide/svelte';
  import { resolve } from '$app/paths';

  let { data, form } = $props();

  const mediaTypeMeta: Record<
    string,
    { label: string; icon: Component<IconProps>; className: string }
  > = {
    book: {
      label: '書籍',
      icon: BookOpen,
      className: 'border-primary/30 bg-primary/10 text-primary',
    },
    game: {
      label: 'ゲーム',
      icon: Gamepad2,
      className: 'border-[#2f7d32]/30 bg-[#2f7d32]/10 text-[#2f7d32]',
    },
    movie: {
      label: '映画',
      icon: Film,
      className: 'border-[#7b3fb6]/30 bg-[#7b3fb6]/10 text-[#6f35a8]',
    },
    tv: {
      label: 'TV',
      icon: Tv,
      className: 'border-[#bf5b00]/30 bg-[#bf5b00]/10 text-[#9a4600]',
    },
  };

  const statusMeta: Record<string, { label: string; className: string }> = {
    want: {
      label: '気になる',
      className: 'border-primary/35 bg-primary/10 text-primary',
    },
    doing: {
      label: '進行中',
      className: 'border-[#b45309]/35 bg-[#b45309]/10 text-[#92400e]',
    },
    done: {
      label: '完了',
      className: 'border-[#15803d]/35 bg-[#15803d]/10 text-[#166534]',
    },
  };

  const formatDate = (value: string | null) => value?.slice(0, 10) ?? '未設定';
  const formatRating = (value: number | null) => (value ? `${value}/5` : '未評価');

  const filters = $derived(data.filters);
  const hasActiveFilters = $derived(
    Boolean(filters.q || filters.type || filters.status || filters.from || filters.to),
  );

  // 非同期検索: 入力をデバウンスして GET フォームを自動送信する。
  // SvelteKit が method="GET" の送信をクライアントナビゲーションに変換するため、
  // フルリロードせず load だけ再実行され、URL（共有可能な状態）も更新される。
  let formEl = $state<HTMLFormElement | null>(null);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // モバイルでは絞り込みフォームを全画面オーバーレイ（別画面風）として開閉する。
  // デスクトップ（sm 以上）では常時インライン表示するため、この状態は使わない。
  let filterOpen = $state(false);

  const submitNow = () => {
    clearTimeout(debounceTimer);
    formEl?.requestSubmit();
  };

  const submitDebounced = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => formEl?.requestSubmit(), 300);
  };
</script>

<section class="mx-auto grid max-w-[1120px] gap-6">
  <div class="flex items-center justify-between gap-3 sm:justify-end">
    <button
      type="button"
      onclick={() => (filterOpen = true)}
      class="inline-flex items-center gap-2 rounded-sm border border-hairline bg-canvas px-3 py-2 text-caption text-ink transition-colors hover:border-primary sm:hidden"
    >
      絞り込み
      {#if hasActiveFilters}
        <span class="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true"></span>
      {/if}
    </button>
    <a class="btn-primary rounded-sm text-center" href={resolve('/contents/new')}>登録する</a>
  </div>

  <form
    method="GET"
    bind:this={formEl}
    class={`gap-3 rounded-sm border border-hairline bg-canvas p-3 sm:p-4 ${
      filterOpen
        ? 'fixed inset-0 z-[60] m-0 grid content-start overflow-y-auto rounded-none border-0 p-4 sm:static sm:z-auto sm:content-stretch sm:rounded-sm sm:border'
        : 'hidden sm:grid'
    }`}
    data-sveltekit-keepfocus
    data-sveltekit-noscroll
  >
    {#if data.sharerFilter}
      <input type="hidden" name="sharer" value={data.sharerFilter} />
    {/if}
    <div class="flex items-center justify-between sm:hidden">
      <span class="text-tagline m-0">絞り込み</span>
      <button
        type="button"
        onclick={() => (filterOpen = false)}
        class="rounded-sm px-2 py-1 text-caption text-ink-muted-80 hover:text-primary"
      >
        閉じる
      </button>
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label class="grid min-w-0 gap-1 text-caption">
        <span class="text-ink-muted-48">タイトル</span>
        <input
          type="search"
          name="q"
          value={filters.q}
          placeholder="タイトルで絞り込む"
          oninput={submitDebounced}
          class="w-full min-w-0 rounded-sm border border-hairline bg-canvas px-3 py-2 text-body"
        />
      </label>
      <label class="grid min-w-0 gap-1 text-caption">
        <span class="text-ink-muted-48">ジャンル</span>
        <select
          name="type"
          value={filters.type}
          onchange={submitNow}
          class="w-full min-w-0 rounded-sm border border-hairline bg-canvas px-3 py-2 text-body"
        >
          <option value="">すべて</option>
          {#each Object.entries(mediaTypeMeta) as [value, meta] (value)}
            <option {value}>{meta.label}</option>
          {/each}
        </select>
      </label>
      <label class="grid min-w-0 gap-1 text-caption">
        <span class="text-ink-muted-48">ステータス</span>
        <select
          name="status"
          value={filters.status}
          onchange={submitNow}
          class="w-full min-w-0 rounded-sm border border-hairline bg-canvas px-3 py-2 text-body"
        >
          <option value="">すべて</option>
          {#each Object.entries(statusMeta) as [value, meta] (value)}
            <option {value}>{meta.label}</option>
          {/each}
        </select>
      </label>
      <div class="grid min-w-0 grid-cols-2 gap-2">
        <label class="grid min-w-0 gap-1 text-caption">
          <span class="text-ink-muted-48">登録日（開始）</span>
          <input
            type="date"
            name="from"
            value={filters.from}
            onchange={submitNow}
            class="w-full min-w-0 rounded-sm border border-hairline bg-canvas px-2 py-2 text-body"
          />
        </label>
        <label class="grid min-w-0 gap-1 text-caption">
          <span class="text-ink-muted-48">登録日（終了）</span>
          <input
            type="date"
            name="to"
            value={filters.to}
            onchange={submitNow}
            class="w-full min-w-0 rounded-sm border border-hairline bg-canvas px-2 py-2 text-body"
          />
        </label>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button type="submit" class="btn-primary rounded-sm hidden sm:inline-flex">絞り込む</button>
      <button
        type="button"
        onclick={() => (filterOpen = false)}
        class="btn-primary rounded-sm sm:hidden">この条件で表示</button
      >
      {#if hasActiveFilters}
        <a
          href={data.sharerFilter
            ? resolve(`/contents?sharer=${data.sharerFilter}`)
            : resolve('/contents')}
          class="text-caption text-primary no-underline hover:underline">クリア</a
        >
      {/if}
    </div>
  </form>

  {#if form?.kind === 'delete' && form.message}
    <div
      class="rounded-sm p-3 text-caption {form.success
        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
        : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
      role={form.success ? 'status' : 'alert'}
    >
      {form.message}
    </div>
  {/if}

  {#if data.items.length === 0 && hasActiveFilters}
    <div class="grid gap-4 rounded-sm border border-hairline bg-canvas p-5">
      <h2 class="text-tagline m-0">該当なし</h2>
      <p class="text-body text-ink-muted-80 m-0">
        条件に一致する登録済みコンテンツが見つからなかった。
      </p>
    </div>
  {:else if data.items.length === 0}
    <div class="grid gap-4 rounded-sm border border-hairline bg-canvas p-5">
      <h2 class="text-tagline m-0">まだ登録なし</h2>
      <p class="text-body text-ink-muted-80 m-0">
        書籍、ゲーム、映像作品を登録すると一覧に表示される。
      </p>
      <div>
        <a class="btn-primary inline-block rounded-sm" href={resolve('/contents/new')}>登録する</a>
      </div>
    </div>
  {:else}
    <div class="grid gap-3">
      {#each data.items as item (item.id)}
        {@const content = item.contents}
        {#if content}
          {@const mediaType = mediaTypeMeta[content.media_type]}
          {@const status = statusMeta[item.status]}
          <article
            class="grid grid-cols-[72px_1fr] gap-3 rounded-sm border border-hairline bg-canvas p-3 text-ink transition-colors hover:border-primary sm:grid-cols-[96px_1fr_auto] sm:gap-4 sm:p-4"
          >
            <a href={resolve(`/contents/${content.id}`)} class="block no-underline">
              {#if content.image_url}
                <img
                  src={content.image_url}
                  alt=""
                  class="h-[100px] w-[72px] rounded-sm bg-canvas-parchment object-cover sm:h-[132px] sm:w-[96px]"
                />
              {:else}
                <div
                  class="h-[100px] w-[72px] rounded-sm bg-canvas-parchment sm:h-[132px] sm:w-[96px]"
                ></div>
              {/if}
            </a>

            <div class="grid content-start gap-2 min-w-0 sm:gap-3">
              <div>
                <span
                  class={`inline-flex w-fit items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[12px] font-semibold sm:gap-2 sm:px-3 sm:py-1 sm:text-caption ${mediaType?.className ?? 'border-hairline bg-canvas-parchment text-ink-muted-80'}`}
                >
                  {#if mediaType}
                    {@const Icon = mediaType.icon}
                    <Icon class="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                  {:else}
                    <span
                      class="grid h-4 min-w-4 place-items-center rounded-full bg-canvas px-0.5 text-[10px] font-semibold leading-none sm:h-5 sm:min-w-5 sm:px-1 sm:text-[11px]"
                      aria-hidden="true"
                    >
                      ?
                    </span>
                  {/if}
                  {mediaType?.label ?? content.media_type}
                </span>
                <h2 class="text-body-strong m-0 mt-1 line-clamp-2 sm:text-tagline">
                  <a
                    class="text-ink no-underline hover:text-primary"
                    href={resolve(`/contents/${content.id}`)}>{content.title}</a
                  >
                </h2>
              </div>
              <dl
                class="grid grid-cols-2 gap-1.5 text-[12px] sm:grid-cols-2 sm:gap-2 sm:text-caption lg:grid-cols-4"
              >
                <div>
                  <dt class="text-ink-muted-48">登録日</dt>
                  <dd class="m-0">{formatDate(item.created_at)}</dd>
                </div>
                <div>
                  <dt class="text-ink-muted-48">ステータス</dt>
                  <dd class="m-0">
                    <span
                      class={`inline-flex w-fit rounded-pill border px-2 py-0.5 text-[12px] font-semibold sm:px-3 sm:py-1 sm:text-caption ${status?.className ?? 'border-hairline bg-canvas-parchment text-ink-muted-80'}`}
                    >
                      {status?.label ?? item.status}
                    </span>
                  </dd>
                </div>
                <div class="hidden sm:block">
                  <dt class="text-ink-muted-48">評価</dt>
                  <dd class="m-0">{formatRating(item.rating)}</dd>
                </div>
                <div class="hidden sm:block">
                  <dt class="text-ink-muted-48">メモ</dt>
                  <dd class="m-0">{item.memo ? 'あり' : 'なし'}</dd>
                </div>
              </dl>
            </div>

            <div
              class="col-span-2 flex items-center gap-3 border-t border-divider-soft pt-2 sm:col-span-1 sm:flex-col sm:items-end sm:justify-self-end sm:self-center sm:border-t-0 sm:pt-0"
            >
              <a
                class="text-caption text-primary no-underline hover:underline"
                href={resolve(`/contents/${content.id}`)}>詳細</a
              >
              <form method="POST" action="?/delete" class="m-0">
                <input type="hidden" name="contentId" value={content.id} />
                <button
                  type="submit"
                  class="rounded-sm border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-caption text-[#be123c] hover:border-[#f43f5e]"
                  onclick={(event) => {
                    if (!confirm('一覧から削除しますか？')) {
                      event.preventDefault();
                    }
                  }}
                >
                  削除
                </button>
              </form>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  {/if}

  {#if data.sharedItems.length > 0}
    <section class="grid gap-3 border-t border-hairline pt-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-tagline m-0">共有されたコンテンツ</h2>
        {#if data.sharers.length > 0}
          <div class="flex items-center gap-2 text-caption">
            <span class="text-ink-muted-48">共有元:</span>
            <a
              href={resolve('/contents')}
              class="text-primary no-underline hover:underline {!data.sharerFilter
                ? 'font-semibold'
                : ''}"
            >
              全て
            </a>
            {#each data.sharers as sharer (sharer.id)}
              <a
                href={resolve(`/contents?sharer=${sharer.id}`)}
                class="text-primary no-underline hover:underline {data.sharerFilter === sharer.id
                  ? 'font-semibold'
                  : ''}"
              >
                {sharer.display_name ?? '不明'}
              </a>
            {/each}
          </div>
        {/if}
      </div>
      <div class="grid gap-2">
        {#each data.sharedItems as share (share.id)}
          {@const content = share.contents}
          {#if content}
            <div
              class="flex items-center justify-between p-3 rounded-sm border border-hairline bg-canvas"
            >
              <div class="grid gap-1">
                <a
                  href={resolve(`/contents/${content.id}`)}
                  class="text-ink no-underline font-semibold hover:text-primary"
                >
                  {content.title}
                </a>
                <span class="text-[12px] text-ink-muted-48">
                  {share.profiles?.display_name ?? '不明'}から共有
                  {#if share.message}
                    — {share.message}
                  {/if}
                </span>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}
</section>
