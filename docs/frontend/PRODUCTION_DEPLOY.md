# 本番ビルド・デプロイ手順

Cloudflare Workers に本番デプロイするための手順です。実行場所は、特に指定がない限り `frontend/` です。

## 前提

- Cloudflare アカウントにログイン済み
- Supabase 本番プロジェクト作成済み
- Supabase の migration 適用済み
- 楽天 Web Service / TMDB / Watchmode の API キー取得済み
- Cloudflare KV namespace 作成済み

Cloudflare の認証は OAuth または API token を使います。OAuth が毎回要求される場合は API token を使います。

```bash
export CLOUDFLARE_API_TOKEN="xxxxx"
```

## 1. 本番 URL を決める

現状は `frontend/wrangler.jsonc` で `workers_dev: true` のため、デプロイ先は Workers の `workers.dev` URL です。

```txt
https://contents-hub.<account-subdomain>.workers.dev
```

初回は `wrangler deploy` 後の出力で URL を確認します。カスタムドメインを使う場合は、そのドメインを以降の本番 URL として扱います。

## 2. Supabase Auth の URL を設定する

Terraform で管理する場合は `terraform/supabase/terraform.tfvars` に本番 URL を設定します。

```hcl
supabase_site_url = "https://contents-hub.<account-subdomain>.workers.dev"
supabase_auth_redirect_urls = [
  "https://contents-hub.<account-subdomain>.workers.dev/auth/callback",
]
```

反映します。

```bash
cd terraform/supabase
terraform plan
terraform apply
```

Dashboard から確認する場合は以下を開きます。

```txt
Authentication -> URL Configuration
```

設定値:

```txt
Site URL:
https://contents-hub.<account-subdomain>.workers.dev

Redirect URLs:
https://contents-hub.<account-subdomain>.workers.dev/auth/callback
```

この設定がないと、signup の確認メールや OAuth callback が本番 URL に戻れません。

## 3. 楽天 Allowed websites を設定する

楽天 Web Service のアプリ設定で、本番 hostname を Allowed websites に追加します。

```txt
contents-hub.<account-subdomain>.workers.dev
```

`https://` やパスは付けません。カスタムドメインを使う場合はカスタムドメインの hostname を登録します。

## 4. Cloudflare Workers secrets を設定する

サーバー側だけで使う値は Cloudflare Workers secrets に登録します。

```bash
cd frontend
pnpm exec wrangler secret put RAKUTEN_APP_ID
pnpm exec wrangler secret put RAKUTEN_ACCESS_KEY
pnpm exec wrangler secret put TMDB_API_KEY
pnpm exec wrangler secret put WATCHMODE_API_KEY
```

`PUBLIC_` で始まる Supabase の値は build 時に参照されます。`frontend/.env` に本番値を設定します。

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. KV binding を確認する

`frontend/wrangler.jsonc` の `EXTERNAL_API_CACHE` が本番用 namespace を向いていることを確認します。

```jsonc
"kv_namespaces": [
  {
    "binding": "EXTERNAL_API_CACHE",
    "id": "2775d91c558441a8b35fc6d261629ee0"
  }
]
```

現在の Terraform 管理 namespace は `contents-hub-external-api-cache` です。

## 6. 必要なら Cloudflare Access を有効化する

本番確認中に一般公開したくない場合は、デプロイ後に Cloudflare Dashboard で Access を有効化します。

```txt
Workers & Pages
-> contents-hub
-> Settings
-> Domains & Routes
-> workers.dev の行
-> Enable Cloudflare Access
```

Policy は自分のメールだけ許可します。

```txt
Action: Allow
Include: Emails
Email: 自分のメールアドレス
```

## 7. ビルドする

```bash
cd frontend
pnpm install
pnpm run build
```

`pnpm run build` は `wrangler types --check` と `vite build` を実行します。

## 8. デプロイする

```bash
pnpm exec wrangler deploy
```

デプロイ後、出力された URL を控えます。

## 9. 動作確認する

本番 URL を開いて、以下を確認します。

- Supabase signup / login が動くこと
- `/contents/new` が未ログイン時に `/login` へリダイレクトされること
- 書籍検索またはゲーム検索で楽天 API の結果が返ること
- 映像検索で TMDB の結果が返ること
- 登録後に Supabase にデータが保存されること

KV キャッシュは検索を 1 回実行してから確認します。

```bash
pnpm exec wrangler kv key list \
  --namespace-id 2775d91c558441a8b35fc6d261629ee0 \
  --remote
```

値を見る場合:

```bash
pnpm exec wrangler kv key get 'tmdb:movie:検索語' \
  --namespace-id 2775d91c558441a8b35fc6d261629ee0 \
  --remote \
  --text
```

## トラブルシュート

### 楽天 API が失敗する

- Allowed websites に本番 hostname が入っているか確認
- `https://` 付きで登録していないか確認
- `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` が Workers secrets に登録済みか確認

### Supabase の callback が失敗する

- Supabase Auth の `Site URL` と `Redirect URLs` に本番 URL が入っているか確認
- `/auth/callback` まで含めた URL を Redirect URLs に追加しているか確認

### KV にキーが出ない

- `pnpm dev` では Workers KV に保存されません
- 本番 URL で検索を実行したか確認
- `wrangler.jsonc` の `EXTERNAL_API_CACHE` が正しい namespace id か確認
- `--remote` を付けて確認しているか確認

### Wrangler が毎回 OAuth を要求する

API token を環境変数で渡します。

```bash
export CLOUDFLARE_API_TOKEN="xxxxx"
```

token には Workers / KV / secrets を操作できる権限が必要です。
