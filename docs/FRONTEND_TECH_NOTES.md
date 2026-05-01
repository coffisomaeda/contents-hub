# フロントエンド 技術メモ（Devin レビュー指摘より）

PR #7 の Devin レビューで挙がった情報系の指摘をまとめたドキュメントです。
バグとして修正済みの項目は含みません。

---

## 1. `safeGetSession` の設計意図（セキュリティ）

**対象ファイル:** `frontend/src/hooks.server.ts:17-35`

`safeGetSession` は `getSession()` で JWT ベースのセッションを取得した後、
`getUser()` でサーバー側検証を行い、検証成功時のみ `session` を返す実装になっています。

```ts
// getSession() は JWT を検証なしで読む（クライアント改ざんの可能性あり）
// getUser() はサーバーに問い合わせて検証する（信頼できる）
// → getUser() が成功した場合のみ session を返すことで安全性を担保
```

**注意点:**

- `session` 内のカスタムクレーム（`user_metadata` 等）をサーバー側の権限判定に使う場合は
  改ざんリスクがあるため、権限制御は RLS（Row Level Security）に委ねること
- この実装は [Supabase 公式の SSR 推奨パターン](https://supabase.com/docs/guides/auth/server-side) に沿っています

---

## 2. `$effect` 内での `createClient()` 呼び出し

**対象ファイル:** `frontend/src/routes/+layout.svelte:11-20`

`$effect` 内で `createClient()` を呼ぶと毎回新しいインスタンスが生成されるように見えますが、
`@supabase/ssr` の `createBrowserClient` はシングルトンパターンで実装されており、
同じ URL/Key での 2 回目以降は既存インスタンスを返します。

**現状で問題がない理由:**

- `browser` ガードにより SSR 時は実行されない
- cleanup 関数で `onAuthStateChange` リスナーを解除するためメモリリークなし
- シングルトンにより Supabase 接続の重複生成なし

---

## 3. `use:enhance` なしのフォーム送信

**対象ファイル:** `frontend/src/routes/+layout.svelte:37-44`（ログアウトフォーム）

ログイン・登録・ログアウトのフォームはいずれも `use:enhance` なしで実装されており、
ブラウザのネイティブフォーム送信（フルページリロード）で処理されます。

**現状での影響:**

- ログアウトはページ遷移を伴うためフルリロードで問題なし
- ログイン・登録はエラー時にフォーム値を保持するため現状でも許容範囲

**将来の改善案（フェーズ 3-5 以降）:**

ローディング表示やクライアント側での即時フィードバックが必要になった場合は
`use:enhance` を追加することを検討してください。

```svelte
<script>
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>
  ...
</form>
```

---

## 4. `$env/static/public` と Cloudflare Workers のランタイム環境変数

**対象ファイル:** `frontend/src/hooks.server.ts:1-2`

**現在の動作:**

`$env/static/public` はビルド時に値が静的に埋め込まれます。
`.env` ファイルから `PUBLIC_SUPABASE_URL` と `PUBLIC_SUPABASE_ANON_KEY` を読み込み、
ビルド成果物に直接含まれた状態で Workers にデプロイされます。

**注意が必要なケース（現在は非該当）:**

将来、ステージング環境と本番環境で別の Supabase プロジェクトを使い分けたい場合、
ビルドごとに `.env` を切り替える必要があります。

Cloudflare Workers のランタイムで動的に環境変数を切り替えたい場合は、
以下の変更を検討してください。

| 方法                         | 概要                             | 適用場面                                         |
| ---------------------------- | -------------------------------- | ------------------------------------------------ |
| `$env/static/public`（現状） | ビルド時に埋め込み               | 環境が 1 つで固定の場合                          |
| `$env/dynamic/public`        | 実行時に `platform.env` から取得 | ステージング/本番切り替えが必要な場合            |
| `platform.env` 直接参照      | Workers の `Env` 型から参照      | サーバー専用の秘密鍵と合わせて統一管理したい場合 |

現段階（個人開発・Supabase プロジェクト 1 つ）では `$env/static/public` のままで問題ありません。

---

## 修正済み項目（参照）

このドキュメントに含まれない以下の項目は PR #7 のレビュー対応で修正済みです。

| #   | 深刻度    | 内容                                      | 対象ファイル               |
| --- | --------- | ----------------------------------------- | -------------------------- |
| 1   | 🔴 BUG    | オープンリダイレクト脆弱性                | `auth/callback/+server.ts` |
| 2   | 🟡 MEDIUM | 登録メッセージの CSS クラス競合           | `signup/+page.svelte`      |
| 3   | 🟡 MEDIUM | デザインシステム外のインライン hex カラー | `+page.svelte`             |
| 4   | 🚩 FLAG   | `text-nav-link` ユーティリティ未定義      | `app.css`                  |
