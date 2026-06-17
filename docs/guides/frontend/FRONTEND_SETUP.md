# フロントエンド セットアップガイド

フロントエンド開発を始めるための**オンボーディング + 開発リファレンス**です。
clone 後に開発できる状態にする手順（依存インストール・環境変数・型生成）、日常の開発コマンド、
構成・ディレクトリの参照をまとめています。

関連ドキュメント / スキルとの役割分担:

- **本番デプロイ**: 初回は [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)、再デプロイは `deploy-production` スキル
- **楽天 API のローカル確認**: `rakuten-api-local` スキル
- **アプリのローカル起動 / スクショ**: `run-contents-hub` / `screenshot-docs` スキル

## 構成

なぜ SvelteKit を採用したか（候補比較・判断基準）は設計判断の記録
[FRONTEND_FRAMEWORK_RESEARCH.md](../../decisions/FRONTEND_FRAMEWORK_RESEARCH.md) を参照してください。

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

| 変数名                     | 説明                               | 設定方法                                               |
| -------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `PUBLIC_SUPABASE_URL`      | Supabase プロジェクトの URL        | Supabase ダッシュボード → Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon（公開）キー       | Supabase ダッシュボード → Settings → API → anon key    |
| `RAKUTEN_APP_ID`           | 楽天 Web Service の Application ID | 楽天 Web Service → アプリ ID 発行                      |
| `RAKUTEN_ACCESS_KEY`       | 楽天 Web Service の Access Key     | 楽天 Web Service → アプリ ID 発行                      |
| `TMDB_API_KEY`             | TMDB API キー                      | TMDB の API 設定画面                                   |
| `WATCHMODE_API_KEY`        | Watchmode API キー                 | Watchmode の API 設定画面                              |

> **注意**: `PUBLIC_` プレフィックスの変数はブラウザに公開されます。anon key は公開して問題ありません（RLS でアクセス制御します）。
> `RAKUTEN_APP_ID`、`RAKUTEN_ACCESS_KEY`、`TMDB_API_KEY`、`WATCHMODE_API_KEY` はサーバー側専用です。`PUBLIC_` を付けないでください。

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

## 楽天ブックス API をローカルで確認する

楽天 Web Service の新しい API エンドポイントは `Application ID` / `Access Key` に加えて
リクエスト元ホストの制限（Allowed websites）を使います。`localhost` や `127.0.0.1` は
楽天側で無効な値として拒否されるため、ローカル確認では Cloudflare Quick Tunnel で公開 URL を
作り、その hostname を vite の `allowedHosts` と楽天の Allowed websites に登録します。

具体的な手順（Tunnel 起動 → `allowedHosts` 更新 → 楽天登録 → 検索確認）は
`rakuten-api-local` スキルが対応します（Tunnel 起動と `allowedHosts` 書き換えは自動化済み）。
固定 URL が必要な場合は、Cloudflare 管理の独自ドメインで固定 hostname の Tunnel を作ります。

## Cloudflare へのデプロイ

- **初回の本番デプロイ**（一度きりのセットアップを含む）: [本番ビルド・デプロイ手順](./PRODUCTION_DEPLOY.md)
- **2 回目以降の通常リリース**（build → deploy → 動作確認）: `deploy-production` スキル

外部 API キーは本番では Cloudflare Workers のシークレット（`wrangler secret put`）、
ローカルでは `frontend/.env` から読み込まれます。詳細は上記を参照してください。

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
