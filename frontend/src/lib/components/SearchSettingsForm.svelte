<script lang="ts">
  import { enhance } from '$app/forms';
  import {
    searchMediaTypeMeta,
    searchMediaTypeValues,
    type SearchMediaType,
  } from '$lib/media-types';

  let {
    searchMediaTypes,
    form,
    submitLabel = '保存',
  }: {
    searchMediaTypes: SearchMediaType[];
    form?: { message?: string; success?: boolean } | null;
    submitLabel?: string;
  } = $props();

  let selectedMediaTypes = $state<SearchMediaType[]>([]);
  let isSaving = $state(false);

  $effect(() => {
    selectedMediaTypes = searchMediaTypes;
  });
</script>

<form
  method="POST"
  action="?/updateSettings"
  class="grid gap-5"
  use:enhance={() => {
    isSaving = true;

    return async ({ update }) => {
      await update();
      isSaving = false;
    };
  }}
>
  {#if form?.message}
    <div
      class="rounded-sm p-3 text-caption {form.success
        ? 'bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]'
        : 'bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]'}"
      role={form.success ? 'status' : 'alert'}
    >
      {form.message}
    </div>
  {/if}

  <fieldset class="grid gap-3 border-0 p-0 m-0">
    <legend class="text-body-strong">検索対象</legend>
    <div class="grid gap-2 grid-cols-2">
      {#each searchMediaTypeValues as mediaType (mediaType)}
        {@const Icon = searchMediaTypeMeta[mediaType].icon}
        <label
          class={`flex cursor-pointer items-center gap-3 rounded-sm border bg-canvas px-3 py-3.5 text-caption transition-colors min-h-[48px] ${
            selectedMediaTypes.includes(mediaType)
              ? 'border-primary text-primary'
              : 'border-divider-soft text-ink hover:border-primary'
          }`}
        >
          <input
            type="checkbox"
            name="searchMediaTypes"
            value={mediaType}
            bind:group={selectedMediaTypes}
            disabled={isSaving}
          />
          <Icon class="h-7 w-7 shrink-0" aria-hidden="true" />
          <span class="font-semibold">{searchMediaTypeMeta[mediaType].label}</span>
        </label>
      {/each}
    </div>
  </fieldset>

  <div class="flex justify-end">
    <button type="submit" class="btn-primary rounded-sm min-w-[96px]" disabled={isSaving}>
      {isSaving ? '保存中' : submitLabel}
    </button>
  </div>
</form>
