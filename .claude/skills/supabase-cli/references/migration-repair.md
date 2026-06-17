# migration repair

`supabase migration repair` は、リモート DB の migration 管理テーブル
（`supabase_migrations.schema_migrations`）とローカルファイルの状態を合わせるコマンド。

Supabase はファイル名とファイル内容のチェックサムで「適用済みか否か」を管理している。
ローカルファイルを直接編集・削除すると、このテーブルとの不整合が生じて `db push` が
失敗するため repair が必要になる。

## migration ファイルを削除したとき

ローカルからファイルを消したが、リモートには適用済みとして残っている場合、リモート履歴から
「取り消し済み」にする:

```bash
supabase migration repair --status reverted <migration_version>
# 複数まとめて指定できる
supabase migration repair --status reverted 20260511010000 20260516000000
```

## migration ファイルの内容を書き換えたとき

適用済みファイルを書き換えるとチェックサムが変わり `db push` がエラーになる。
DB 上のスキーマはすでに正しい状態である前提で、チェックサムだけ更新する:

```bash
supabase migration repair --status applied <migration_version>
```

## 典型的な手順（ファイル削除 + 元ファイル書き換えを両方やった場合）

```bash
# 1. 削除したファイルをリモート履歴から除外
supabase migration repair --status reverted 20260511010000 20260516000000

# 2. 書き換えたファイルのチェックサムを更新
supabase migration repair --status applied 20260510120000 20260511000000

# 3. 状態確認（"Remote database is up to date." になれば OK）
supabase db push
```

## 注意事項（必読）

- `repair` は管理テーブルを書き換えるだけで、**DB のスキーマ自体は変更しない**。
- この手法が安全なのは **本番にそのテーブルのデータが無い場合のみ**。
- 本番にデータがある場合は、`ALTER TABLE` / `DROP TABLE` の migration を素直に追加するほうが安全。
- `supabase db reset`（ローカルのフルリセット）は repair 不要で、常に全ファイルを再実行する。
