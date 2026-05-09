<script lang="ts">
  import { resolve } from '$app/paths';

  let { data } = $props();

  const mediaTypeLabels: Record<string, string> = {
    book: '書籍',
    game: 'ゲーム',
    movie: '映画',
    tv: 'TV',
  };

  const statusLabels: Record<string, string> = {
    want: '気になる',
    doing: '進行中',
    done: '完了',
  };

  const videoSourceTypeLabels: Record<string, string> = {
    sub: 'サブスク',
    rent: 'レンタル',
    buy: '購入',
    free: '無料',
    tve: 'TV Everywhere',
  };

  const formatDate = (value: string | null) => value ?? '未設定';
  const formatDateTime = (value: string) => new Date(value).toLocaleString('ja-JP');
  const formatRating = (value: number | null) => (value ? `${value}/5` : '未評価');
  const hasValue = (value: unknown) => value !== null && value !== undefined && value !== '';
</script>

<section class="mx-auto grid max-w-[1120px] gap-8">
  <div>
    <a class="text-caption text-primary no-underline" href={resolve('/contents')}>一覧に戻る</a>
  </div>

  <article class="grid gap-8 lg:grid-cols-[260px_1fr]">
    <div>
      {#if data.content.image_url}
        <img
          src={data.content.image_url}
          alt=""
          class="h-auto w-full max-w-[260px] rounded-sm bg-canvas object-cover shadow-product"
        />
      {:else}
        <div class="h-[360px] w-full max-w-[260px] rounded-sm bg-canvas"></div>
      {/if}
    </div>

    <div class="grid gap-6">
      <div>
        <p class="text-caption text-primary m-0 font-semibold">
          {mediaTypeLabels[data.content.media_type] ?? data.content.media_type}
        </p>
        <h1 class="text-display-lg m-0 mt-2">{data.content.title}</h1>
        {#if data.content.title_kana}
          <p class="text-caption text-ink-muted-48 m-0 mt-2">{data.content.title_kana}</p>
        {/if}
        {#if data.content.description}
          <p class="text-body text-ink-muted-80 m-0 mt-5 whitespace-pre-wrap">
            {data.content.description}
          </p>
        {/if}
      </div>

      <section class="grid gap-5 rounded-sm border border-hairline bg-canvas p-5">
        <dl class="grid gap-4 text-caption sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt class="text-ink-muted-48">ステータス</dt>
            <dd class="m-0">{statusLabels[data.userContent.status] ?? data.userContent.status}</dd>
          </div>
          <div>
            <dt class="text-ink-muted-48">評価</dt>
            <dd class="m-0">{formatRating(data.userContent.rating)}</dd>
          </div>
          <div>
            <dt class="text-ink-muted-48">登録日</dt>
            <dd class="m-0">{formatDateTime(data.userContent.created_at)}</dd>
          </div>
          <div>
            <dt class="text-ink-muted-48">更新日</dt>
            <dd class="m-0">{formatDateTime(data.userContent.updated_at)}</dd>
          </div>
          {#if data.content.release_date}
            <div>
              <dt class="text-ink-muted-48">発売日</dt>
              <dd class="m-0">{formatDate(data.content.release_date)}</dd>
            </div>
          {/if}
          {#if data.content.item_url}
            <div>
              <dt class="text-ink-muted-48">商品URL</dt>
              <dd class="m-0 break-all">
                <a class="text-primary" href={data.content.item_url}>{data.content.item_url}</a>
              </dd>
            </div>
          {/if}

          {#if data.video}
            {#if hasValue(data.video.original_title)}
              <div>
                <dt class="text-ink-muted-48">原題</dt>
                <dd class="m-0">{data.video.original_title}</dd>
              </div>
            {/if}
            {#if data.video.runtime !== null}
              <div>
                <dt class="text-ink-muted-48">上映時間</dt>
                <dd class="m-0">{data.video.runtime}分</dd>
              </div>
            {/if}
            {#if data.content.media_type === 'tv' && data.video.number_of_seasons !== null}
              <div>
                <dt class="text-ink-muted-48">シーズン数</dt>
                <dd class="m-0">{data.video.number_of_seasons}</dd>
              </div>
            {/if}
            {#if data.content.media_type === 'tv' && data.video.number_of_episodes !== null}
              <div>
                <dt class="text-ink-muted-48">エピソード数</dt>
                <dd class="m-0">{data.video.number_of_episodes}</dd>
              </div>
            {/if}
          {/if}
        </dl>

        {#if data.userContent.memo}
          <div>
            <h3 class="text-caption text-ink-muted-48 m-0">メモ</h3>
            <p class="text-body m-0 mt-2 whitespace-pre-wrap">{data.userContent.memo}</p>
          </div>
        {/if}

        {#if data.videoSources.length > 0}
          <div class="grid gap-3 border-t border-hairline pt-5">
            <h3 class="text-caption text-ink-muted-48 m-0">配信情報</h3>
            <div class="grid gap-3">
              {#each data.videoSources as source (source.id)}
                <div class="grid gap-2 text-caption sm:grid-cols-[1fr_120px_auto] sm:items-center">
                  <p class="m-0">{source.name}</p>
                  <p class="m-0">{videoSourceTypeLabels[source.type] ?? source.type}</p>
                  <div>
                    {#if source.web_url}
                      <a class="text-primary" href={source.web_url}>開く</a>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    </div>
  </article>
</section>
