<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import type { SubmitFunction } from '@sveltejs/kit';

  let { data } = $props();

  const mediaTypeLabels: Record<string, string> = {
    book: '書籍',
    game: 'ゲーム',
    movie: '映画',
    tv: 'TV',
  };

  const statusOptions = [
    { value: 'want', label: '気になる' },
    { value: 'doing', label: '進行中' },
    { value: 'done', label: '完了' },
  ];

  const ratingOptions = [
    { value: '', label: '未評価' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ];

  const videoSourceTypeLabels: Record<string, string> = {
    sub: 'サブスク',
    rent: 'レンタル',
    buy: '購入',
    free: '無料',
    tve: 'TV Everywhere',
  };

  const formatDate = (value: string | null) => value ?? '未設定';
  const formatDateTime = (value: string) => new Date(value).toLocaleString('ja-JP');
  const hasValue = (value: unknown) => value !== null && value !== undefined && value !== '';

  let saving = $state(false);
  let editMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit: SubmitFunction = () => {
    saving = true;
    editMessage = null;

    return async ({ update, result }) => {
      saving = false;

      if (result.type === 'success' && result.data?.kind === 'edit') {
        editMessage = { type: 'success', text: String(result.data.message ?? '') };
      } else if (result.type === 'failure' && result.data?.kind === 'edit') {
        editMessage = { type: 'error', text: String(result.data.message ?? '') };
      }

      await update();
    };
  };
</script>

<section class="mx-auto grid max-w-[1120px] gap-6 sm:gap-8">
  <div>
    <a class="text-caption text-primary no-underline" href={resolve('/contents')}>一覧に戻る</a>
  </div>

  <article class="grid gap-6 sm:gap-8 lg:grid-cols-[260px_1fr]">
    <div class="flex justify-center lg:justify-start">
      {#if data.content.image_url}
        <img
          src={data.content.image_url}
          alt=""
          class="h-auto w-[180px] rounded-sm bg-canvas object-cover shadow-product sm:w-full sm:max-w-[260px]"
        />
      {:else}
        <div
          class="h-[250px] w-[180px] rounded-sm bg-canvas sm:h-[360px] sm:w-full sm:max-w-[260px]"
        ></div>
      {/if}
    </div>

    <div class="grid gap-5 sm:gap-6">
      <div>
        <p class="text-caption text-primary m-0 font-semibold">
          {mediaTypeLabels[data.content.media_type] ?? data.content.media_type}
        </p>
        <h1 class="text-display-lg m-0 mt-2">{data.content.title}</h1>
        {#if data.content.title_kana}
          <p class="text-caption text-ink-muted-48 m-0 mt-2">{data.content.title_kana}</p>
        {/if}
        {#if data.content.description}
          <p class="text-body text-ink-muted-80 m-0 mt-4 whitespace-pre-wrap">
            {data.content.description}
          </p>
        {/if}
      </div>

      <section class="grid gap-4 rounded-sm border border-hairline bg-canvas p-4 sm:gap-5 sm:p-5">
        <dl class="grid grid-cols-2 gap-3 text-caption sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
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
            <div class="col-span-2 sm:col-span-1">
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

        {#if data.videoSources.length > 0}
          <div class="grid gap-3 border-t border-hairline pt-4 sm:pt-5">
            <h3 class="text-caption text-ink-muted-48 m-0">配信情報</h3>
            <div class="grid gap-3">
              {#each data.videoSources as source (source.id)}
                <div
                  class="grid gap-1 text-caption sm:grid-cols-[1fr_120px_auto] sm:items-center sm:gap-2"
                >
                  <p class="m-0 font-semibold sm:font-normal">{source.name}</p>
                  <p class="m-0 text-ink-muted-48 sm:text-ink">
                    {videoSourceTypeLabels[source.type] ?? source.type}
                  </p>
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

      <section class="grid gap-4 rounded-sm border border-hairline bg-canvas p-4 sm:gap-5 sm:p-5">
        {#if editMessage}
          <p
            class="text-caption m-0 rounded-sm px-3 py-2 {editMessage.type === 'error'
              ? 'bg-[#fef2f2] text-[#991b1b]'
              : 'bg-[#f0fdf4] text-[#166534]'}"
            id="edit-message"
          >
            {editMessage.text}
          </p>
        {/if}

        <form method="POST" action="?/edit" use:enhance={handleSubmit} class="grid gap-4 sm:gap-5">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <label for="edit-status" class="text-caption text-ink-muted-48">ステータス</label>
              <select
                id="edit-status"
                name="status"
                class="input-standard text-caption"
                value={data.userContent.status}
              >
                {#each statusOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <div class="grid gap-2">
              <label for="edit-rating" class="text-caption text-ink-muted-48">評価</label>
              <select
                id="edit-rating"
                name="rating"
                class="input-standard text-caption"
                value={data.userContent.rating?.toString() ?? ''}
              >
                {#each ratingOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="grid gap-2">
            <label for="edit-memo" class="text-caption text-ink-muted-48">メモ</label>
            <textarea
              id="edit-memo"
              name="memo"
              rows="4"
              class="input-standard text-caption resize-y"
              placeholder="感想やメモを自由に入力...">{data.userContent.memo ?? ''}</textarea
            >
          </div>

          {#if data.content.media_type === 'book'}
            <div class="grid gap-4 sm:grid-cols-3">
              <label class="flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  name="isEbook"
                  value="true"
                  checked={data.userContent.is_ebook}
                  class="accent-primary"
                />
                電子書籍
              </label>
              <label class="flex items-center gap-2 text-caption">
                <input
                  type="checkbox"
                  name="isSold"
                  value="true"
                  checked={data.userContent.is_sold}
                  disabled={data.userContent.is_ebook}
                  class="accent-primary"
                />
                売却済み
              </label>
              <div class="grid gap-1">
                <label for="edit-current-volume" class="text-caption text-ink-muted-48"
                  >読了巻数</label
                >
                <input
                  id="edit-current-volume"
                  name="currentVolume"
                  type="number"
                  min="1"
                  class="input-standard text-caption"
                  value={data.userContent.current_volume ?? ''}
                />
              </div>
            </div>
          {/if}

          <div class="flex items-center gap-4">
            <button
              type="submit"
              class="btn-secondary w-full sm:w-auto"
              disabled={saving}
              id="edit-submit"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </section>
    </div>
  </article>
</section>
