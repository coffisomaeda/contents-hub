# フロントエンド セットアップガイド

フェーズ 3-1 で構築したフロントエンド環境のセットアップ手順です。

## 構成

| 項目                  | 技術                                      |
| --------------------- | ----------------------------------------- |
| フレームワーク        | SvelteKit                                 |
| デプロイ先            | Cloudflare Workers                        |
| adapter               | `@sveltejs/adapter-cloudflare`            |
| Supabase クライアント | `@supabase/supabase-js` + `@supabase/ssr` |
| 言語                  | TypeScript                                |
| Linter                | ESLint（`eslint-plugin-svelte`）          |
| Formatter             | Prettier（`prettier-plugin-svelte`）      |

## 初回セットアップ

### 1. 依存パッケージのインストール

```bash
cd frontend
pnpm install
```

### 2. 環境変数の設定

`frontend/.env.example` をコピーして `frontend/.env` を作成し、実際の値を設定してください。

```bash
cp .env.example .env
```

設定が必要な値:

| 変数名                     | 説明                         | 設定方法                                               |
| -------------------------- | ---------------------------- | ------------------------------------------------------ |
| `PUBLIC_SUPABASE_URL`      | Supabase プロジェクトの URL  | Supabase ダッシュボード → Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon（公開）キー | Supabase ダッシュボード → Settings → API → anon key    |

> **注意**: `PUBLIC_` プレフィックスの変数はブラウザに公開されます。anon key は公開して問題ありません（RLS でアクセス制御します）。

### 3. Cloudflare の型生成

```bash
pnpm gen
```

`worker-configuration.d.ts` が生成されます。`wrangler.jsonc` や `.env` を変更した場合は再実行してください。

### 4. Supabase の型生成（任意）

ローカル Supabase が起動している場合、DB スキーマから TypeScript 型を生成できます。

```bash
# リポジトリルートで実行
supabase gen types typescript --local > frontend/src/lib/database.types.ts
```

> この型ファイルはスキーマ変更時に再生成が必要です。

## 開発コマンド

`frontend/` ディレクトリで実行してください。

| コマンド           | 説明                                         |
| ------------------ | -------------------------------------------- |
| `pnpm dev`         | 開発サーバーを起動（http://localhost:5173）  |
| `pnpm build`       | プロダクションビルド                         |
| `pnpm preview`     | ビルド成果物を Wrangler でローカルプレビュー |
| `pnpm check`       | TypeScript + Svelte の型チェック             |
| `pnpm check:watch` | 型チェック（ウォッチモード）                 |
| `pnpm lint`        | Prettier + ESLint のチェック                 |
| `pnpm format`      | Prettier で自動フォーマット                  |
| `pnpm gen`         | Cloudflare Workers の型を再生成              |

## Cloudflare へのデプロイ

### 前提

- Cloudflare アカウントが必要です
- `wrangler login` で認証済みであること

### デプロイ手順

```bash
cd frontend
pnpm build
npx wrangler deploy
```

### wrangler.jsonc の設定

| 項目                 | 現在の値                            | 説明                       |
| -------------------- | ----------------------------------- | -------------------------- |
| `name`               | `contents-hub`                      | Workers のサービス名       |
| `compatibility_date` | `2026-04-30`                        | Workers ランタイムの互換日 |
| `main`               | `.svelte-kit/cloudflare/_worker.js` | エントリーポイント         |

> **カスタムドメイン**: 必要に応じて `wrangler.jsonc` に `routes` を追加するか、Cloudflare ダッシュボードから設定してください。

### サーバー側の環境変数（シークレット）

フェーズ 4 で使う外部 API キーは、Cloudflare Workers のシークレットとして設定します。

```bash
npx wrangler secret put RAKUTEN_APP_ID
npx wrangler secret put TMDB_API_KEY
npx wrangler secret put WATCHMODE_API_KEY
```

> ローカル開発では `frontend/.env` から読み込まれます。本番では `wrangler secret` で設定した値が使われます。

## ディレクトリ構成

```
frontend/
├── src/
│   ├── app.d.ts            # アプリの型定義（Platform 等）
│   ├── app.html             # HTML テンプレート
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts    # ブラウザ用 Supabase クライアント
│   │   │   └── server.ts    # サーバー用 Supabase クライアント
│   │   └── index.ts         # ライブラリのエントリーポイント
│   └── routes/
│       ├── +layout.svelte   # ルートレイアウト
│       └── +page.svelte     # トップページ
├── static/                  # 静的ファイル
├── svelte.config.js         # SvelteKit 設定
├── vite.config.ts           # Vite 設定
├── wrangler.jsonc           # Cloudflare Workers 設定
├── tsconfig.json            # TypeScript 設定
├── eslint.config.js         # ESLint 設定
├── .prettierrc              # Prettier 設定
├── .env.example             # 環境変数テンプレート
└── .env                     # 環境変数（Git 管理外）
```

## 注意事項

- `pnpm check` はビルド前に実行してください。ビルド後に実行すると `.svelte-kit/output/` の生成ファイルが型チェック対象に含まれ、不要なエラーが出る場合があります
- `worker-configuration.d.ts` は `pnpm gen` で生成されるファイルです。手動で編集しないでください
- `frontend/.env` は `.gitignore` で管理外です。環境変数のテンプレートは `frontend/.env.example` を参照してください
