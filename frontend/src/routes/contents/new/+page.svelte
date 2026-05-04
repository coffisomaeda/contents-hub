<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';

  let { data, form } = $props();
  let isSearching = $state(false);

  const value = (input: unknown) => (input === null || input === undefined ? '' : String(input));
  const currentMediaType = $derived(form?.mediaType ?? 'book');
  const searchResults = $derived(form?.kind === 'search' ? (form.results ?? []) : []);
  const messageTone = $derived(form?.success ? 'success' : 'error');
</script>

<section class="mx-auto grid max-w-[1040px] gap-8">
  <div class="grid gap-3">
    <p class="text-primary text-[13px] font-bold tracking-normal uppercase m-0">
      Content registration
    </p>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-display-md m-0 text-ink">コンテンツ登録</h1>
        <p class="text-ink-muted-80 mt-3 mb-0 max-w-[620px]">
          書籍、ゲーム、映像作品をキーワード検索から登録します。
        </p>
      </div>
      <a
        href={resolve('/')}
        class="border border-hairline rounded-sm px-4 py-2 text-button-utility text-ink no-underline hover:border-primary"
        >ホーム</a
      >
    </div>
  </div>

  {#if form?.message}
    <p
      class="rounded-sm p-3 text-caption m-0 {messageTone === 'success'
        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
        : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
      role={messageTone === 'success' ? 'status' : 'alert'}
    >
      {form.message}
    </p>
  {/if}

  <div class="grid gap-6">
    <section class="grid gap-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-tagline m-0">検索</h2>
        <p class="text-caption text-ink-muted-48 m-0">
          楽天: {data.apiAvailability.rakuten ? '有効' : '未設定'} / TMDB:
          {data.apiAvailability.tmdb ? '有効' : '未設定'}
        </p>
      </div>

      <form
        method="POST"
        action="?/search"
        class="grid gap-3 sm:grid-cols-[180px_1fr_auto]"
        use:enhance={() => {
          isSearching = true;

          return async ({ update }) => {
            await update();
            isSearching = false;
          };
        }}
      >
        <label class="grid gap-2 text-body-strong">
          種別
          <select class="input-standard" name="mediaType" disabled={isSearching}>
            <option value="book" selected={currentMediaType === 'book'}>書籍</option>
            <option value="game" selected={currentMediaType === 'game'}>ゲーム</option>
            <option value="movie" selected={currentMediaType === 'movie'}>映画</option>
            <option value="tv" selected={currentMediaType === 'tv'}>TV</option>
          </select>
        </label>
        <label class="grid gap-2 text-body-strong">
          キーワード
          <input
            class="input-standard"
            name="query"
            type="search"
            value={form?.query ?? ''}
            placeholder="タイトルで検索"
            required
            disabled={isSearching}
          />
        </label>
        <button
          type="submit"
          class="btn-primary self-end rounded-sm min-w-[88px]"
          disabled={isSearching}
        >
          {isSearching ? '検索中' : '検索'}
        </button>
      </form>

      {#if isSearching}
        <div
          class="grid gap-3 rounded-sm border border-hairline bg-canvas p-4"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-3">
            <span
              class="block h-4 w-4 rounded-full border-2 border-hairline border-t-primary animate-spin"
            ></span>
            <span class="text-body-strong text-ink">検索中</span>
          </div>
          <div class="grid gap-2">
            <div class="h-3 w-full max-w-[520px] rounded-sm bg-canvas-parchment"></div>
            <div class="h-3 w-full max-w-[360px] rounded-sm bg-canvas-parchment"></div>
          </div>
        </div>
      {:else if searchResults.length > 0}
        <div class="grid gap-3">
          {#each searchResults as result (`${result.mediaType}:${result.isbn ?? result.jan ?? result.tmdbId ?? result.title}`)}
            <article
              class="grid gap-4 rounded-sm border border-hairline bg-canvas p-4 sm:grid-cols-[72px_1fr_auto]"
            >
              {#if result.imageUrl}
                <img
                  src={result.imageUrl}
                  alt=""
                  class="h-[96px] w-[72px] rounded-sm object-cover bg-canvas-parchment"
                />
              {:else}
                <div class="h-[96px] w-[72px] rounded-sm bg-canvas-parchment"></div>
              {/if}
              <div class="min-w-0">
                <h3 class="text-body-strong m-0">{result.title}</h3>
                <p class="text-caption text-ink-muted-48 m-0 mt-1">
                  {result.author ??
                    result.hardware ??
                    result.originalTitle ??
                    result.releaseDate ??
                    '詳細なし'}
                </p>
                {#if result.description}
                  <p class="text-caption text-ink-muted-80 mt-2 mb-0 line-clamp-2">
                    {result.description}
                  </p>
                {/if}
              </div>
              <form method="POST" action="?/register" class="self-center">
                <input type="hidden" name="mediaType" value={result.mediaType} />
                <input type="hidden" name="title" value={value(result.title)} />
                <input type="hidden" name="titleKana" value={value(result.titleKana)} />
                <input type="hidden" name="description" value={value(result.description)} />
                <input type="hidden" name="imageUrl" value={value(result.imageUrl)} />
                <input type="hidden" name="releaseDate" value={value(result.releaseDate)} />
                <input type="hidden" name="itemUrl" value={value(result.itemUrl)} />
                <input type="hidden" name="status" value="want" />
                <input type="hidden" name="isbn" value={value(result.isbn)} />
                <input type="hidden" name="author" value={value(result.author)} />
                <input type="hidden" name="authorKana" value={value(result.authorKana)} />
                <input type="hidden" name="publisherName" value={value(result.publisherName)} />
                <input type="hidden" name="jan" value={value(result.jan)} />
                <input type="hidden" name="hardware" value={value(result.hardware)} />
                <input type="hidden" name="label" value={value(result.label)} />
                <input type="hidden" name="makerCode" value={value(result.makerCode)} />
                <input type="hidden" name="itemPrice" value={value(result.itemPrice)} />
                <input type="hidden" name="rakutenGenreId" value={value(result.rakutenGenreId)} />
                <input type="hidden" name="reviewCount" value={value(result.reviewCount)} />
                <input type="hidden" name="reviewAverage" value={value(result.reviewAverage)} />
                <input type="hidden" name="tmdbId" value={value(result.tmdbId)} />
                <input type="hidden" name="originalTitle" value={value(result.originalTitle)} />
                <input type="hidden" name="posterPath" value={value(result.posterPath)} />
                <input type="hidden" name="backdropPath" value={value(result.backdropPath)} />
                <input type="hidden" name="genresJson" value={value(result.genresJson)} />
                <input type="hidden" name="voteAverage" value={value(result.voteAverage)} />
                <input type="hidden" name="voteCount" value={value(result.voteCount)} />
                <input type="hidden" name="videoStatus" value={value(result.videoStatus)} />
                <button type="submit" class="btn-primary rounded-sm whitespace-nowrap">登録</button>
              </form>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</section>
