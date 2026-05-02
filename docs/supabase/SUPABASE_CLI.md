# Supabase CLI

このリポジトリでは Supabase CLI を使って、ローカルの Supabase 環境起動、マイグレーション作成、リモート反映を行います。

## 前提

- Docker が起動していること
- このリポジトリのルートでコマンドを実行すること
- Supabase CLI は `mise.toml` で管理（`supabase` コマンドで直接実行）

設定ファイルは `supabase/config.toml` にあります。

## よく使う流れ

1. ローカル Supabase を起動する
2. スキーマを変更する
3. 差分を migration にする
4. ローカル DB を reset して再現できることを確認する
5. 必要ならリモート project に push する

## ローカル開発

### 初回セットアップ

```bash
supabase init
```

このリポジトリではすでに `supabase/` ディレクトリがあるため、通常は再実行不要です。

### 起動

```bash
supabase start
```

起動後は次の情報が表示されます。

- Studio URL
- API URL
- DB 接続文字列
- ローカル用の publishable key / secret key

### 状態確認

```bash
supabase status
```

環境変数形式で見たい場合:

```bash
supabase status -o env
```

### 停止

```bash
supabase stop --project-id content-hub
```

全プロジェクトのローカル Supabase を止める場合:

```bash
supabase stop --all
```

データ volume も削除して完全に消したい場合:

```bash
supabase stop --project-id content-hub --no-backup
```

## DB と migration

### 空の migration を作る

```bash
supabase migration new create_books_table
```

`supabase/migrations/` に SQL ファイルが作られます。

### ローカル DB の変更から差分 migration を作る

```bash
supabase db diff -f add_books_table
```

これはローカル DB と migration 群の差分を見て、新しい migration を作ります。

### migration をローカル DB に適用し直す

```bash
supabase db reset
```

seed を流したくない場合:

```bash
supabase db reset --no-seed
```

このコマンドで migration だけで DB を再構築できるか確認できます。ローカル開発ではかなり重要です。

### リモートから schema を pull する

```bash
supabase db pull
```

リモート project に link 済みであることが前提です。

### リモートへ migration を push する

```bash
supabase db push
```

事前確認だけしたい場合:

```bash
supabase db push --dry-run
```

## リモート project 連携

### ログイン

```bash
supabase login
```

トークンを直接使う場合:

```bash
supabase login --token <personal-access-token>
```

### project を link する

```bash
supabase link --project-ref <project-ref>
```

必要に応じて DB パスワードも求められます。

## 型生成

TypeScript 型をローカル DB から生成する例:

```bash
supabase gen types --local --lang typescript
```

リモート project から生成する例:

```bash
supabase gen types --linked --lang typescript
```

ファイルへ保存する場合:

```bash
supabase gen types --local --lang typescript > frontend/src/lib/database.types.ts
```

出力先はフロントエンド側の構成に合わせて調整してください。

## seed について

このリポジトリの `supabase/config.toml` では seed が有効で、`./seed.sql` を参照する設定になっています。

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

そのため `supabase/seed.sql` が存在しない状態で `db reset` や `start` を実行すると、次の warning が出ます。

```text
WARN: no files matched pattern: supabase/seed.sql
```

warning 止まりで起動失敗ではありませんが、seed を使うなら `supabase/seed.sql` を追加してください。使わないなら `config.toml` 側で seed を無効化しても構いません。

## このリポジトリでのおすすめ運用

ローカル変更を migration 化して確認する時:

```bash
supabase start
supabase db diff -f <migration_name>
supabase db reset
```

本番または共有環境に反映する前:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push --dry-run
supabase db push
```

## よくあるトラブル

### `container name ... is already in use`

前回の `supabase start` の残骸コンテナが残っています。

```bash
supabase stop --project-id content-hub
supabase start
```

### `failed to resolve reference`

Docker が Supabase 関連イメージの取得に失敗している状態です。まず次を確認します。

```bash
supabase start --debug
docker --version
docker info
```

Docker daemon の再起動、VPN や proxy の見直しで直ることがあります。

### `supabase: command not found`

`mise install` を実行して Supabase CLI をインストールしてください。`mise.toml` にバージョンが定義されています。

## 参考

- Supabase CLI getting started: https://supabase.com/docs/guides/cli/getting-started
- Supabase local development: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase CLI reference: https://supabase.com/docs/reference/cli
