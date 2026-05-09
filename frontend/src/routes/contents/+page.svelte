<script lang="ts">
  import { resolve } from '$app/paths';

  let { data } = $props();

  const mediaTypeMeta: Record<string, { label: string; iconPath: string; className: string }> = {
    book: {
      label: '書籍',
      iconPath: '/icons/book.png',
      className: 'border-primary/30 bg-primary/10 text-primary',
    },
    game: {
      label: 'ゲーム',
      iconPath: '/icons/game.png',
      className: 'border-[#2f7d32]/30 bg-[#2f7d32]/10 text-[#2f7d32]',
    },
    movie: {
      label: '映画',
      iconPath: '/icons/movie.png',
      className: 'border-[#7b3fb6]/30 bg-[#7b3fb6]/10 text-[#6f35a8]',
    },
    tv: {
      label: 'TV',
      iconPath: '/icons/tv.png',
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
</script>

<section class="mx-auto grid max-w-[1120px] gap-8">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="text-caption text-primary m-0 font-semibold">Library</p>
      <h1 class="text-display-lg m-0 mt-2">登録済みコンテンツ</h1>
    </div>
    <a class="btn-primary rounded-sm text-center" href={resolve('/contents/new')}>登録する</a>
  </div>

  {#if data.items.length === 0}
    <div class="grid gap-4 rounded-sm border border-hairline bg-canvas p-6">
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
          <a
            class="grid gap-4 rounded-sm border border-hairline bg-canvas p-4 text-ink no-underline transition-colors hover:border-primary md:grid-cols-[96px_1fr_auto]"
            href={resolve(`/contents/${content.id}`)}
          >
            {#if content.image_url}
              <img
                src={content.image_url}
                alt=""
                class="h-[132px] w-[96px] rounded-sm bg-canvas-parchment object-cover"
              />
            {:else}
              <div class="h-[132px] w-[96px] rounded-sm bg-canvas-parchment"></div>
            {/if}

            <div class="grid content-start gap-3">
              <div>
                <span
                  class={`inline-flex w-fit items-center gap-2 rounded-pill border px-3 py-1 text-caption font-semibold ${mediaType?.className ?? 'border-hairline bg-canvas-parchment text-ink-muted-80'}`}
                >
                  {#if mediaType}
                    <img
                      src={mediaType.iconPath}
                      alt=""
                      class="h-6 w-6 rounded-full bg-canvas object-cover"
                      loading="lazy"
                    />
                  {:else}
                    <span
                      class="grid h-5 min-w-5 place-items-center rounded-full bg-canvas px-1 text-[11px] font-semibold leading-none"
                      aria-hidden="true"
                    >
                      ?
                    </span>
                  {/if}
                  {mediaType?.label ?? content.media_type}
                </span>
                <h2 class="text-tagline m-0 mt-1">{content.title}</h2>
              </div>
              <dl class="grid gap-2 text-caption sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt class="text-ink-muted-48">登録日</dt>
                  <dd class="m-0">{formatDate(item.created_at)}</dd>
                </div>
                <div>
                  <dt class="text-ink-muted-48">ステータス</dt>
                  <dd class="m-0">
                    <span
                      class={`inline-flex w-fit rounded-pill border px-3 py-1 font-semibold ${status?.className ?? 'border-hairline bg-canvas-parchment text-ink-muted-80'}`}
                    >
                      {status?.label ?? item.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-ink-muted-48">評価</dt>
                  <dd class="m-0">{formatRating(item.rating)}</dd>
                </div>
                <div>
                  <dt class="text-ink-muted-48">メモ</dt>
                  <dd class="m-0">{item.memo ? 'あり' : 'なし'}</dd>
                </div>
              </dl>
            </div>

            <span
              class="text-caption text-primary self-center justify-self-start md:justify-self-end"
            >
              詳細
            </span>
          </a>
        {/if}
      {/each}
    </div>
  {/if}
</section>
