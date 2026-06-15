---
name: deploy-production
description: >
  contents-hub（SvelteKit + Cloudflare Workers）を本番（workers.dev）へ
  再デプロイし、デプロイ後の動作確認まで行う手順。
  「本番にデプロイ」「リリース」「deploy to production」「本番反映」
  「wrangler deploy したい」などと言われたらこのスキルを使う。
  ただし初回デプロイ（Supabase Auth URL 設定・楽天 Allowed websites 登録・
  secrets 投入・KV namespace 作成など一度きりのセットアップ）は対象外で、
  その場合は docs/guides/frontend/PRODUCTION_DEPLOY.md を案内すること。
---

# 本番デプロイ（再デプロイ）

contents-hub を Cloudflare Workers の本番へデプロイし、動作確認するまでの繰り返し手順。
実行ディレクトリは指定がなければ `frontend/`。

このスキルは **2 回目以降の通常リリース** を対象とする。初回セットアップ
（secrets 投入・Supabase Auth URL・楽天 Allowed websites・KV namespace 作成・
Cloudflare Access）は一度きりの作業なので、それらが未完了なら作業を止めて
`docs/guides/frontend/PRODUCTION_DEPLOY.md` を参照するよう案内する。

## 前提（満たされているはず。怪しければ確認）

- Cloudflare にログイン済み。OAuth が毎回要求される場合は API token を使う:
  ```bash
  export CLOUDFLARE_API_TOKEN="xxxxx"   # Workers / KV / secrets 権限が必要
  ```
- Workers secrets（`RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` / `TMDB_API_KEY` /
  `WATCHMODE_API_KEY`）が登録済み。確認: `pnpm exec wrangler secret list`
- `frontend/.env` に本番の `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY`
  （build 時に埋め込まれる）。
- `frontend/wrangler.jsonc` の KV binding `EXTERNAL_API_CACHE` が本番 namespace を向いている。

これらが未整備、または「初めての本番デプロイ」と分かる文脈なら、このスキルではなく
`docs/guides/frontend/PRODUCTION_DEPLOY.md` の手順に切り替える。

## 手順

### 1. ビルド

```bash
cd frontend
pnpm install
pnpm run build
```

`build` は `svelte-kit sync && wrangler types --check && vite build` を実行する。
型エラーやビルド失敗が出たら**デプロイせず**原因を直す。

### 2. デプロイ

```bash
pnpm exec wrangler deploy
```

出力された URL（`https://contents-hub.<account-subdomain>.workers.dev` または
カスタムドメイン）を控える。

### 3. 動作確認

本番 URL を開いて確認する（このリポジトリには `run-contents-hub` /
`screenshot-docs` スキルもあるが、ここで確認するのは**本番 URL**であってローカルではない）:

- Supabase signup / login が動く
- `/contents/new` が未ログイン時に `/login` へリダイレクトされる
- 書籍 or ゲーム検索で楽天 API の結果が返る
- 映像検索で TMDB の結果が返る
- 登録後に Supabase にデータが保存される

KV キャッシュは本番 URL で検索を 1 回実行してから確認する（`pnpm dev` では KV に保存されない）。
namespace id は `wrangler.jsonc` の `EXTERNAL_API_CACHE` の値を使う:

```bash
pnpm exec wrangler kv key list --namespace-id <namespace-id> --remote
# 中身を見る:
pnpm exec wrangler kv key get 'tmdb:movie:検索語' --namespace-id <namespace-id> --remote --text
```

## トラブルシュート

| 症状                       | 確認すること                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| 楽天 API が失敗            | Allowed websites に本番 hostname（`https://` やパスは付けない）／secrets 登録済みか      |
| Supabase callback 失敗     | Supabase Auth の `Site URL` と `/auth/callback` を含む Redirect URLs に本番 URL があるか |
| KV にキーが出ない          | 本番 URL で検索したか／namespace id が正しいか／`--remote` 付きか                        |
| wrangler が毎回 OAuth 要求 | `CLOUDFLARE_API_TOKEN` を環境変数で渡す                                                  |

初回セットアップ系の詳細（Terraform での Supabase 設定、Access 有効化手順など）は
`docs/guides/frontend/PRODUCTION_DEPLOY.md` を参照。
