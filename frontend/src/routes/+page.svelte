<script lang="ts">
  import { resolve } from '$app/paths';

  let { data } = $props();
</script>

<section class="home">
  {#if data.user}
    <p class="eyebrow">Signed in</p>
    <h1>コンテンツを記録する準備ができています</h1>
    <p>
      書籍、ゲーム、映像作品をひとつの場所で管理するためのホームです。次のフェーズで検索と登録機能をここに追加します。
    </p>
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
    color: #1f6feb;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    margin: 0 0 12px;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(34px, 6vw, 60px);
    line-height: 1.08;
    margin: 0;
  }

  p {
    color: #526071;
    font-size: 18px;
    line-height: 1.75;
    margin: 22px 0 0;
  }

  .actions {
    display: flex;
    gap: 14px;
    margin-top: 30px;
  }

  .actions a {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #243044;
    font-weight: 700;
    padding: 10px 14px;
    text-decoration: none;
  }

  .actions .primary {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #ffffff;
  }
</style>
