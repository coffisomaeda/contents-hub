---
name: supabase-cli
description: >
  contents-hub で Supabase CLI を使ってローカル DB を起動し、スキーマ変更を
  migration 化し、型を再生成し、リモートへ反映するための手順。
  「ローカル Supabase を起動/停止」「migration を作る」「db reset / db diff」
  「型を再生成（database.types.ts）」「リモートに push」「supabase link / login」
  「migration repair」「schema を変更」などに触れたらこのスキルを使う。
  このリポジトリでは supabase の起動系は mise タスク（`mise run supabase:*`）で
  動かす点に注意（`pnpm supabase:*` は存在しない）。
---

# Supabase CLI（contents-hub）

ローカル Supabase の起動、スキーマ変更の migration 化、型生成、リモート反映を行う。

## 前提

- リポジトリ**ルート**で実行する。設定は `supabase/config.toml`（`project_id = "contents-hub"`）。
- Docker daemon が起動していること（`docker info` が成功）。`supabase:start` / `supabase:reset`
  の mise タスクは `docker:check` に依存しているので自動で確認される。
- CLI は `mise.toml` で管理（`supabase = 2.95.6`）。未導入なら `mise install`。

> **重要 — 起動系は mise タスク。** このリポジトリの `package.json` に `supabase:*` スクリプトは
> 無い。起動・停止・状態・リセットは `mise run supabase:<task>` を使う。
> migration 作成・diff・push・型生成・login・link などは素の `supabase ...` を直接実行する。

## 基本の流れ

1. ローカル Supabase を起動する
2. スキーマを変更する
3. 差分を migration にする
4. ローカル DB を reset して migration だけで再現できるか確認する
5. 必要ならリモート project に push する

## 起動・停止・状態（mise タスク）

```bash
mise run supabase:start     # 起動（Studio/API URL・DB接続・publishable/secret key が出る）
mise run supabase:status    # 状態確認
mise run supabase:reset     # ローカル DB を migration から再構築（seed も流れる）
mise run supabase:stop      # 停止（--project-id contents-hub 付き）
```

mise タスクに無い派生は素の `supabase`:

```bash
supabase status -o env              # 環境変数形式で表示
supabase stop --all                 # 全プロジェクトのローカルを停止
supabase stop --project-id contents-hub --no-backup   # data volume も消して完全削除
```

## スキーマ変更と migration

```bash
# 空の migration を作る（supabase/migrations/ に SQL が作られる）
supabase migration new <name>

# ローカル DB の変更から差分 migration を作る
supabase db diff -f <name>

# migration からローカル DB を作り直す（migration だけで再現できるかの確認。重要）
supabase db reset
supabase db reset --no-seed         # seed を流さない
```

`db reset` で「migration 群だけで DB を再構築できる」ことを確認するのがローカル開発の肝。
mise タスク版は `mise run supabase:reset`（docker 確認付き）。

## リモート連携

```bash
supabase login                              # ブラウザ認証
supabase login --token <personal-access-token>
supabase link --project-ref <project-ref>   # project を link（DB パスワードを求められることあり）
supabase db pull                            # リモート schema を pull（link 済みが前提）
supabase db push                            # migration をリモートへ反映
supabase db push --dry-run                  # 反映前の事前確認
```

おすすめ運用:

```bash
# ローカル変更を migration 化して確認
mise run supabase:start
supabase db diff -f <name>
mise run supabase:reset

# 共有/本番へ反映する前
supabase login
supabase link --project-ref <project-ref>
supabase db push --dry-run
supabase db push
```

## 型生成

このリポジトリの型ファイルは **`frontend/src/lib/types/supabase.ts`**（コードはここから import する）。
通常は frontend 側の `pnpm gen:types` を使うのが正（出力先がこのパスに固定されている）:

```bash
cd frontend && pnpm gen:types
# = supabase gen types typescript --local > src/lib/types/supabase.ts
```

直接 CLI を使う場合も同じ出力先に揃える:

```bash
supabase gen types --local --lang typescript > frontend/src/lib/types/supabase.ts   # ローカル DB から
supabase gen types --linked --lang typescript > frontend/src/lib/types/supabase.ts  # リモート project から
```

> スキーマを変更したら型を再生成する。出力先を別パスにすると import 元（`$lib/types/supabase`）と
> ずれて型が効かなくなるので、上記パスに統一すること。

## seed について

`supabase/config.toml` で seed が有効（`sql_paths = ["./seed.sql"]`）。`supabase/seed.sql` が
無い状態で `db reset` / `start` すると `WARN: no files matched pattern: supabase/seed.sql` が出る。
warning 止まりで失敗ではない。seed を使うなら `supabase/seed.sql` を追加、使わないなら
`config.toml` で seed を無効化する。

## さらに詳しく

- **migration repair**（チェックサム不整合の修復、ファイル削除/書き換え後の対処、
  本番データがある場合の安全注意）→ `references/migration-repair.md` を読む。**間違えると危険**なので
  repair が必要になったら必ず参照する。
- **トラブルシュート**（`container name ... already in use` / `failed to resolve reference` /
  `command not found` / Docker 前提）→ `references/troubleshooting.md` を読む。

## 参考

- Supabase CLI getting started: https://supabase.com/docs/guides/cli/getting-started
- Supabase local development: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase CLI reference: https://supabase.com/docs/reference/cli
