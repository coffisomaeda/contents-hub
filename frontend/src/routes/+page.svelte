<script lang="ts">
  import { slide } from 'svelte/transition';
  import { resolve } from '$app/paths';

  // メディア種別のメタデータ
  const mediaTypeMeta: Record<string, { label: string; className: string }> = {
    book: {
      label: '書籍',
      className: 'border-primary/30 bg-primary/10 text-primary',
    },
    game: {
      label: 'ゲーム',
      className: 'border-[#2f7d32]/30 bg-[#2f7d32]/10 text-[#2f7d32]',
    },
    movie: {
      label: '映画',
      className: 'border-[#7b3fb6]/30 bg-[#7b3fb6]/10 text-[#6f35a8]',
    },
    tv: {
      label: 'TV',
      className: 'border-[#bf5b00]/30 bg-[#bf5b00]/10 text-[#9a4600]',
    },
  };

  // ステータスのメタデータ
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

  // メッセージの型定義
  interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
    registeredContent?: {
      contentId?: string;
      mediaType: string;
      title: string;
      author?: string;
      hardware?: string;
      imageUrl?: string;
      isbn?: string;
      jan?: string;
      status: string;
      rating?: number;
      memo?: string;
    } | null;
  }

  let messages = $state<Message[]>([]);

  let inputVal = $state('');
  let isLoading = $state(false);
  let chatEndEl = $state<HTMLElement | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text };
    messages = [...messages, userMsg];
    inputVal = '';
    isLoading = true;

    // 入力送信後にスクロール
    setTimeout(scrollToBottom, 50);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          // 今回送信したメッセージ(末尾)を除いて履歴として送信
          history: messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました。');
      }

      const data = (await response.json()) as {
        reply: string;
        registeredContent: Message['registeredContent'];
      };
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: data.reply,
          registeredContent: data.registeredContent,
        },
      ];
    } catch (e) {
      messages = [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: `エラーが発生しました: ${e instanceof Error ? e.message : '接続に失敗しました。'}`,
        },
      ];
    } finally {
      isLoading = false;
      setTimeout(scrollToBottom, 50);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputVal);
    }
  }

  function scrollToBottom() {
    chatEndEl?.scrollIntoView({ behavior: 'smooth' });
  }

</script>

<svelte:head>
  <title>AIアシスタント | Contents Hub</title>
</svelte:head>

<section class="mx-auto max-w-[800px] flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
  <div class="mb-4">
    <p class="text-caption text-primary m-0 font-semibold text-center sm:text-left">AI Agent</p>
    <h1 class="text-display-md m-0 mt-1 text-center sm:text-left">AIアシスタントチャット</h1>
  </div>

  <!-- チャット履歴と入力コンテナ -->
  <div
    class="flex-1 flex flex-col bg-canvas rounded-sm border border-hairline overflow-hidden shadow-sm"
  >
    <!-- メッセージエリア -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
      {#each messages as msg (msg.id)}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] sm:max-w-[70%]">
            <!-- 吹き出し -->
            <div
              class="rounded-sm p-3.5 text-body shadow-sm transition-all
              {msg.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-canvas-parchment text-ink border border-divider-soft rounded-bl-none'}"
            >
              <p class="m-0 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>

            <!-- コンテンツ登録成功時のインラインカード -->
            {#if msg.registeredContent}
              {@const item = msg.registeredContent}
              {@const mediaMeta = mediaTypeMeta[item.mediaType]}
              {@const statMeta = statusMeta[item.status]}
              <div transition:slide={{ duration: 200 }} class="mt-3">
                <article
                  class="flex gap-3.5 rounded-sm border border-hairline bg-surface-pearl p-3 shadow-sm transition-all hover:border-primary"
                >
                  {#if item.imageUrl}
                    <img
                      src={item.imageUrl}
                      alt=""
                      class="h-[96px] w-[72px] rounded-xs bg-canvas object-cover shadow-xs"
                      loading="lazy"
                    />
                  {:else}
                    <div
                      class="h-[96px] w-[72px] rounded-xs bg-canvas border border-divider-soft flex items-center justify-center text-ink-muted-48 text-[12px]"
                    >
                      No Image
                    </div>
                  {/if}

                  <div class="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span
                          class="px-1.5 py-0.5 rounded-xs border text-[10px] font-semibold tracking-wider {mediaMeta.className}"
                        >
                          {mediaMeta.label}
                        </span>
                        <span
                          class="px-1.5 py-0.5 rounded-xs border text-[10px] font-semibold tracking-wider {statMeta.className}"
                        >
                          {statMeta.label}
                        </span>
                      </div>
                      <h2 class="text-body font-semibold m-0 mt-1.5 truncate text-ink">
                        {item.title}
                      </h2>
                      {#if item.mediaType === 'book' && item.author}
                        <p class="text-caption text-ink-muted-48 m-0 mt-0.5 truncate">
                          著者: {item.author}
                        </p>
                      {/if}
                      {#if item.mediaType === 'game' && item.hardware}
                        <p class="text-caption text-ink-muted-48 m-0 mt-0.5 truncate">
                          ハード: {item.hardware}
                        </p>
                      {/if}
                    </div>

                    <div class="flex items-center justify-between gap-2 mt-2">
                      <div class="flex items-center gap-1">
                        {#if item.rating}
                          <span class="text-amber-500 font-semibold text-caption"
                            >★ {item.rating}</span
                          >
                        {/if}
                        {#if item.memo}
                          <span
                            class="text-ink-muted-48 text-caption truncate max-w-[150px] border-l border-divider pl-1.5"
                            title={item.memo}>{item.memo}</span
                          >
                        {/if}
                      </div>
                      {#if item.contentId}
                        <a
                          href={resolve(`/contents/${item.contentId}`)}
                          class="text-caption text-primary hover:underline font-semibold flex items-center gap-0.5"
                        >
                          詳細を見る →
                        </a>
                      {/if}
                    </div>
                  </div>
                </article>
              </div>
            {/if}
          </div>
        </div>
      {/each}

      {#if isLoading}
        <div class="flex justify-start">
          <div
            class="bg-canvas-parchment text-ink border border-divider-soft rounded-sm rounded-bl-none p-3.5 flex items-center gap-2 shadow-sm"
          >
            <span
              class="inline-block w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"
            ></span>
            <span
              class="inline-block w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"
            ></span>
            <span class="inline-block w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></span>
          </div>
        </div>
      {/if}

      <div bind:this={chatEndEl}></div>
    </div>

    <!-- 入力フォーム -->
    <div class="p-3 bg-canvas-parchment border-t border-hairline flex items-center gap-2">
      <input
        type="text"
        bind:value={inputVal}
        onkeydown={handleKeydown}
        placeholder="AIにコンテンツの登録や検索を指示..."
        disabled={isLoading}
        class="flex-1 input-standard rounded-xs"
      />
      <button
        onclick={() => sendMessage(inputVal)}
        disabled={isLoading || !inputVal.trim()}
        class="btn-primary rounded-xs px-5 py-2.5 text-button-utility flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        送信
      </button>
    </div>
  </div>
</section>

<style>
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
  .animate-bounce {
    animation: bounce 0.6s infinite ease-in-out;
  }
</style>
