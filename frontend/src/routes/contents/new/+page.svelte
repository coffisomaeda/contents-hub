<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';
  import type { ContentRegistrationInput } from '$lib/validation/content';

  let { data, form } = $props();
  let isSearching = $state(false);
  let isRegistering = $state(false);
  let selectedResult = $state<Partial<ContentRegistrationInput> | null>(null);
  let selectedMediaType = $state('book');

  const value = (input: unknown) => (input === null || input === undefined ? '' : String(input));
  const searchResults = $derived(form?.kind === 'search' ? (form.results ?? []) : []);
  const messageTone = $derived(form?.success ? 'success' : 'error');
  const isVideoRegistration = $derived(
    selectedResult?.mediaType === 'movie' || selectedResult?.mediaType === 'tv',
  );
  const registrationStatusTitle = $derived(isVideoRegistration ? '配信情報を取得中' : '登録中');
  const registrationStatusDescription = $derived(
    isVideoRegistration
      ? 'Watchmode API から配信サービス情報を取得しています。'
      : '登録内容を保存しています。',
  );
  const mediaTypeMeta: Record<string, { label: string; iconPath: string }> = {
    book: {
      label: '書籍',
      iconPath: '/icons/book.png',
    },
    game: {
      label: 'ゲーム',
      iconPath: '/icons/game.png',
    },
    movie: {
      label: '映画',
      iconPath: '/icons/movie.png',
    },
    tv: {
      label: 'TV',
      iconPath: '/icons/tv.png',
    },
  };
  const mediaTypeOptions = Object.entries(mediaTypeMeta);

  $effect(() => {
    if (form?.mediaType) {
      selectedMediaType = form.mediaType;
    }
  });

  const selectResult = (result: Partial<ContentRegistrationInput>) => {
    selectedResult = {
      ...result,
      status: 'want',
      rating: undefined,
      memo: '',
    };
  };
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
    <div
      class="rounded-sm p-3 text-caption m-0 {messageTone === 'success'
        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
        : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
      role={messageTone === 'success' ? 'status' : 'alert'}
    >
      <p class="m-0">{form.message}</p>
      {#if form.success && form.contentId}
        <div class="mt-3 flex flex-wrap gap-3">
          <a class="text-primary underline" href={resolve(`/contents/${form.contentId}`)}
            >詳細を見る</a
          >
          <a class="text-primary underline" href={resolve('/contents')}>一覧を見る</a>
        </div>
      {/if}
    </div>
  {/if}

  <div class="grid gap-6">
    <section class="grid gap-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-tagline m-0">検索</h2>
        {#if data.showApiAvailability}
          <p class="text-caption text-ink-muted-48 m-0">
            楽天: {data.apiAvailability.rakuten ? '有効' : '未設定'} / TMDB:
            {data.apiAvailability.tmdb ? '有効' : '未設定'}
          </p>
        {/if}
      </div>

      <form
        method="POST"
        action="?/search"
        class="grid gap-3 sm:grid-cols-[320px_1fr_auto]"
        use:enhance={() => {
          isSearching = true;

          return async ({ update }) => {
            await update();
            isSearching = false;
          };
        }}
      >
        <fieldset class="grid gap-2 border-0 p-0 m-0">
          <legend class="text-body-strong">種別</legend>
          <div class="grid grid-cols-2 gap-2">
            {#each mediaTypeOptions as [mediaType, mediaTypeOption] (mediaType)}
              <label
                class={`flex cursor-pointer items-center gap-2 rounded-sm border bg-canvas px-3 py-2 text-caption transition-colors ${
                  selectedMediaType === mediaType
                    ? 'border-primary text-primary'
                    : 'border-divider-soft text-ink hover:border-primary'
                }`}
              >
                <input
                  class="sr-only"
                  type="radio"
                  name="mediaType"
                  value={mediaType}
                  bind:group={selectedMediaType}
                  disabled={isSearching}
                />
                <img
                  src={mediaTypeOption.iconPath}
                  alt=""
                  class="h-7 w-7 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
                <span class="font-semibold">{mediaTypeOption.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>
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
      {:else if selectedResult}
        <section class="grid gap-4 rounded-sm border border-hairline bg-canvas p-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-tagline m-0">登録</h2>
              <p class="text-caption text-ink-muted-48 mt-1 mb-0">
                {selectedResult.mediaType === 'book'
                  ? '書籍'
                  : selectedResult.mediaType === 'game'
                    ? 'ゲーム'
                    : selectedResult.mediaType === 'movie'
                      ? '映画'
                      : 'TV'}
              </p>
            </div>
            <button
              type="button"
              class="border border-hairline rounded-sm px-4 py-2 text-button-utility text-ink bg-canvas hover:border-primary"
              disabled={isRegistering}
              onclick={() => (selectedResult = null)}
            >
              検索結果に戻る
            </button>
          </div>

          <form
            method="POST"
            action="?/register"
            class="grid gap-5"
            aria-busy={isRegistering}
            use:enhance={() => {
              isRegistering = true;

              return async ({ update }) => {
                try {
                  await update();
                } finally {
                  isRegistering = false;
                }
              };
            }}
          >
            <input type="hidden" name="mediaType" value={value(selectedResult.mediaType)} />
            <input type="hidden" name="title" value={value(selectedResult.title)} />
            <input type="hidden" name="titleKana" value={value(selectedResult.titleKana)} />
            <input type="hidden" name="description" value={value(selectedResult.description)} />
            <input type="hidden" name="imageUrl" value={value(selectedResult.imageUrl)} />
            <input type="hidden" name="releaseDate" value={value(selectedResult.releaseDate)} />
            <input type="hidden" name="itemUrl" value={value(selectedResult.itemUrl)} />
            <input type="hidden" name="isbn" value={value(selectedResult.isbn)} />
            <input type="hidden" name="author" value={value(selectedResult.author)} />
            <input type="hidden" name="authorKana" value={value(selectedResult.authorKana)} />
            <input type="hidden" name="publisherName" value={value(selectedResult.publisherName)} />
            <input type="hidden" name="jan" value={value(selectedResult.jan)} />
            <input type="hidden" name="hardware" value={value(selectedResult.hardware)} />
            <input type="hidden" name="label" value={value(selectedResult.label)} />
            <input type="hidden" name="posterPath" value={value(selectedResult.posterPath)} />
            <input type="hidden" name="backdropPath" value={value(selectedResult.backdropPath)} />
            <input type="hidden" name="genresJson" value={value(selectedResult.genresJson)} />
            <input type="hidden" name="makerCode" value={value(selectedResult.makerCode)} />

            <div class="grid gap-4 lg:grid-cols-[160px_1fr]">
              {#if selectedResult.imageUrl}
                <img
                  src={selectedResult.imageUrl}
                  alt=""
                  class="h-[220px] w-[160px] rounded-sm object-cover bg-canvas-parchment"
                />
              {:else}
                <div class="h-[220px] w-[160px] rounded-sm bg-canvas-parchment"></div>
              {/if}

              <div class="grid gap-4">
                <div>
                  <h3 class="text-body-strong m-0">{selectedResult.title}</h3>
                  {#if selectedResult.titleKana}
                    <p class="text-caption text-ink-muted-48 mt-1 mb-0">
                      {selectedResult.titleKana}
                    </p>
                  {/if}
                  {#if selectedResult.description}
                    <p class="text-caption text-ink-muted-80 mt-3 mb-0">
                      {selectedResult.description}
                    </p>
                  {/if}
                </div>

                <dl class="grid gap-3 text-caption md:grid-cols-2">
                  {#if selectedResult.releaseDate}
                    <div>
                      <dt class="text-ink-muted-48">発売日</dt>
                      <dd class="m-0 text-ink">{selectedResult.releaseDate}</dd>
                    </div>
                  {/if}
                  {#if selectedResult.itemUrl}
                    <div>
                      <dt class="text-ink-muted-48">商品URL</dt>
                      <dd class="m-0 break-all text-ink">{selectedResult.itemUrl}</dd>
                    </div>
                  {/if}
                </dl>
              </div>
            </div>

            {#if selectedResult.mediaType === 'book'}
              <dl class="grid gap-3 text-caption md:grid-cols-2">
                {#if selectedResult.isbn}
                  <div>
                    <dt class="text-ink-muted-48">ISBN</dt>
                    <dd class="m-0 text-ink">{selectedResult.isbn}</dd>
                  </div>
                {/if}
                {#if selectedResult.author}
                  <div>
                    <dt class="text-ink-muted-48">著者</dt>
                    <dd class="m-0 text-ink">{selectedResult.author}</dd>
                  </div>
                {/if}
                {#if selectedResult.publisherName}
                  <div>
                    <dt class="text-ink-muted-48">出版社</dt>
                    <dd class="m-0 text-ink">{selectedResult.publisherName}</dd>
                  </div>
                {/if}
              </dl>
            {:else if selectedResult.mediaType === 'game'}
              <dl class="grid gap-3 text-caption md:grid-cols-2">
                {#if selectedResult.jan}
                  <div>
                    <dt class="text-ink-muted-48">JAN</dt>
                    <dd class="m-0 text-ink">{selectedResult.jan}</dd>
                  </div>
                {/if}
                {#if selectedResult.hardware}
                  <div>
                    <dt class="text-ink-muted-48">ハード</dt>
                    <dd class="m-0 text-ink">{selectedResult.hardware}</dd>
                  </div>
                {/if}
                {#if selectedResult.label}
                  <div>
                    <dt class="text-ink-muted-48">発売元</dt>
                    <dd class="m-0 text-ink">{selectedResult.label}</dd>
                  </div>
                {/if}
              </dl>
            {:else if selectedResult.mediaType === 'movie' || selectedResult.mediaType === 'tv'}
              <input type="hidden" name="tmdbId" value={value(selectedResult.tmdbId)} />
              <input
                type="hidden"
                name="originalTitle"
                value={value(selectedResult.originalTitle)}
              />
              <input type="hidden" name="voteAverage" value={value(selectedResult.voteAverage)} />
              <input type="hidden" name="voteCount" value={value(selectedResult.voteCount)} />
              <input type="hidden" name="videoStatus" value={value(selectedResult.videoStatus)} />
              <dl class="grid gap-3 text-caption md:grid-cols-2">
                {#if selectedResult.tmdbId}
                  <div>
                    <dt class="text-ink-muted-48">TMDB ID</dt>
                    <dd class="m-0 text-ink">{selectedResult.tmdbId}</dd>
                  </div>
                {/if}
                {#if selectedResult.originalTitle}
                  <div>
                    <dt class="text-ink-muted-48">原題</dt>
                    <dd class="m-0 text-ink">{selectedResult.originalTitle}</dd>
                  </div>
                {/if}
                {#if selectedResult.voteAverage !== undefined}
                  <div>
                    <dt class="text-ink-muted-48">投票平均</dt>
                    <dd class="m-0 text-ink">{selectedResult.voteAverage}</dd>
                  </div>
                {/if}
                {#if selectedResult.voteCount !== undefined}
                  <div>
                    <dt class="text-ink-muted-48">投票数</dt>
                    <dd class="m-0 text-ink">{selectedResult.voteCount}</dd>
                  </div>
                {/if}
              </dl>
            {/if}

            <input type="hidden" name="itemPrice" value={value(selectedResult.itemPrice)} />
            <input
              type="hidden"
              name="rakutenGenreId"
              value={value(selectedResult.rakutenGenreId)}
            />
            <input type="hidden" name="reviewCount" value={value(selectedResult.reviewCount)} />
            <input type="hidden" name="reviewAverage" value={value(selectedResult.reviewAverage)} />

            <div class="grid gap-4 md:grid-cols-3">
              <label class="grid gap-2 text-body-strong">
                ステータス
                <select class="input-standard" name="status" disabled={isRegistering}>
                  <option value="want" selected={selectedResult.status === 'want'}>気になる</option>
                  <option value="doing" selected={selectedResult.status === 'doing'}>進行中</option>
                  <option value="done" selected={selectedResult.status === 'done'}>完了</option>
                </select>
              </label>
              <label class="grid gap-2 text-body-strong">
                評価
                <input
                  class="input-standard"
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={value(selectedResult.rating)}
                  disabled={isRegistering}
                />
              </label>
              <label class="grid gap-2 text-body-strong md:col-span-3">
                メモ
                <textarea class="input-standard min-h-[96px]" name="memo" disabled={isRegistering}
                  >{value(selectedResult.memo)}</textarea
                >
              </label>
            </div>

            {#if isRegistering}
              <div
                class="grid gap-3 rounded-sm border border-hairline bg-canvas-parchment p-4"
                role="status"
                aria-live="polite"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="block h-4 w-4 rounded-full border-2 border-hairline border-t-primary animate-spin"
                  ></span>
                  <span class="text-body-strong text-ink">{registrationStatusTitle}</span>
                </div>
                <p class="text-caption text-ink-muted-80 m-0">
                  {registrationStatusDescription}
                </p>
              </div>
            {/if}

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="border border-hairline rounded-sm px-4 py-2 text-button-utility text-ink bg-canvas hover:border-primary"
                disabled={isRegistering}
                onclick={() => (selectedResult = null)}
              >
                検索結果に戻る
              </button>
              <button type="submit" class="btn-primary rounded-sm" disabled={isRegistering}>
                {isRegistering ? registrationStatusTitle : '登録'}
              </button>
            </div>
          </form>
        </section>
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
              <button
                type="button"
                class="btn-primary self-center rounded-sm whitespace-nowrap"
                onclick={() => selectResult(result)}
              >
                登録
              </button>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</section>
