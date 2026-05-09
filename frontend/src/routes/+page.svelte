<script lang="ts">
  import { resolve } from '$app/paths';

  let { data } = $props();
</script>

<section class="home">
  {#if data.user}
    <p class="eyebrow">Signed in</p>
    <h1>コンテンツを記録する準備ができています</h1>
    <p>
      書籍、ゲーム、映像作品をひとつの場所で管理できます。まずは新しいコンテンツを登録してください。
    </p>
    <div class="actions">
      <a href={resolve('/contents')}>一覧を見る</a>
      <a class="primary" href={resolve('/contents/new')}>登録する</a>
    </div>
  {:else}
    <p class="eyebrow">Contents Hub</p>
    <h1>見たもの、読んだもの、遊んだものをまとめて管理</h1>
    <p>アカウントを作成すると、自分専用のコンテンツ記録を始められます。</p>
    <div class="actions">
      <a class="primary" href={resolve('/signup')}>登録する</a>
      <a href={resolve('/login')}>ログイン</a>
    </div>
  {/if}
</section>

<style>
  .home {
    max-width: 760px;
  }

  .eyebrow {
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0;
    margin: 0 0 12px;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(28px, 6vw, 60px);
    font-weight: 600;
    line-height: 1.08;
    margin: 0;
  }

  p {
    color: var(--color-ink-muted-80);
    font-size: 17px;
    line-height: 1.75;
    margin: 22px 0 0;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 24px;
  }

  @media (min-width: 640px) {
    .actions {
      flex-direction: row;
      gap: 14px;
      margin-top: 30px;
    }
  }

  .actions a {
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-sm);
    color: var(--color-ink);
    font-weight: 600;
    padding: 12px 14px;
    text-align: center;
    text-decoration: none;
  }

  .actions .primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
  }
</style>
