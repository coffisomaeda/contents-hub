---
name: run-contents-hub
description: >
  contents-hub アプリ（SvelteKit + Supabase）をローカルで起動し、Playwright で操作・スクリーンショットを撮影する。
  「アプリを起動して」「動作確認して」「スクリーンショット撮って」「run the app」「verify the change」
  「start the dev server」などと言われたらこのスキルを使うこと。
---

# run-contents-hub スキル

contents-hub は SvelteKit + Cloudflare Workers + Supabase で動く書籍・映画・ゲームのライブラリ管理アプリ。
エージェントは `frontend/` 配下で `pnpm dev` で開発サーバーを起動し、
`.claude/skills/run-contents-hub/driver.mjs` (Playwright) で操作する。

すべてのパスは **リポジトリルート** (`/home/maeda/private/contents-hub`) からの相対パス。

## 前提条件

Playwright の Chromium は `frontend/` の devDependencies に含まれる。
初回のみ：

```bash
cd frontend && npx playwright install chromium
```

Supabase はローカルで起動済みである必要がある（開発サーバー起動前）：

```bash
# Supabase が止まっている場合（リポジトリルートから）
supabase start
```

## Run（エージェントパス）

### 1. dev サーバーの起動確認

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null
```

- `200` または `302` → 起動済み。そのまま使う。
- 接続失敗 → **起動前に既存プロセスの残骸を掃除してから**バックグラウンドで起動し、ポートが応答するまで待つ：

```bash
# 既存の dev サーバー / 孤児プロセスを掃除する。
# vite を kill しても workerd（Cloudflare ランタイム）が孤児として残ることがあるため両方落とす。
# パターンは自分自身のシェルコマンドに誤マッチしないよう具体的に指定する。
for p in $(lsof -ti:5173 2>/dev/null); do kill -9 "$p" 2>/dev/null; done   # ポート占有プロセス
pkill -9 -f "vite/bin/vite" 2>/dev/null                                    # vite 本体
pkill -9 -f "workerd serve" 2>/dev/null                                    # 残った workerd
sleep 2

# 残骸が無いことを確認（0 件であること）
ps -eo args | grep -E "vite/bin/vite|workerd serve" | grep -v grep | wc -l

cd frontend && pnpm dev --port 5173 &
timeout 30 bash -c 'until curl -sf http://localhost:5173/health >/dev/null 2>&1; do sleep 1; done'
```

停止するときも同様に **vite と workerd の両方**を落とす（workerd の孤児を残さない）：

```bash
for p in $(lsof -ti:5173 2>/dev/null); do kill -9 "$p"; done
pkill -9 -f "vite/bin/vite"; pkill -9 -f "workerd serve"
```

### 2. ドライバーで操作

```bash
node .claude/skills/run-contents-hub/driver.mjs
```

デフォルトは `smoke` シナリオ。スクリーンショットは `/tmp/run-contents-hub-shots/` に保存される。

| オプション          | デフォルト                    | 説明                     |
| ------------------- | ----------------------------- | ------------------------ |
| `--url <url>`       | `http://localhost:5173`       | アプリのベース URL       |
| `--out <dir>`       | `/tmp/run-contents-hub-shots` | スクリーンショット出力先 |
| `--scenario <name>` | `smoke`                       | 実行シナリオ             |

| シナリオ名 | 内容                                                        |
| ---------- | ----------------------------------------------------------- |
| `smoke`    | 未認証→ログイン→AIチャット→コンテンツ一覧→登録画面（全4枚） |
| `login`    | ログイン画面のみ                                            |
| `contents` | ログイン後のコンテンツ一覧                                  |
| `register` | ログイン後のコンテンツ登録画面                              |

テストアカウント: `test1@example.com` / `password123`（ローカル Supabase のシードデータ）。

## Run（ヒューマンパス）

```bash
cd frontend && pnpm dev   # → http://localhost:5173 でブラウザを開く。Ctrl-C で停止。
```

## テスト

```bash
# Playwright e2e（モックサーバーも自動起動）
cd frontend && pnpm test

# 型チェック
cd frontend && pnpm check
```

## ルート一覧

| URL                    | 説明                                    |
| ---------------------- | --------------------------------------- |
| `/`                    | AI アシスタントチャット（ログイン必須） |
| `/login`               | ログイン画面                            |
| `/signup`              | アカウント登録                          |
| `/contents`            | 登録済みコンテンツ一覧                  |
| `/contents/new`        | コンテンツ新規登録                      |
| `/contents/[id]`       | コンテンツ詳細                          |
| `/settings`            | 設定                                    |
| `/settings/onboarding` | オンボーディング                        |

## Gotchas

- **`/library` は存在しない** — コンテンツ一覧は `/contents`。UI のラベルは "Library" だがルートは別。
- **未認証で `/` にアクセスすると `/login` にリダイレクト**される（302）。curl でのヘルスチェックには `/health` を使う。
- **ログアウトボタンが先にマッチする問題** — `button[type="submit"]` はヘッダーのログアウトフォームを先に拾う。ログインフォームのボタンには `page.locator('form button[type="submit"]')` を使う。
- **`pnpm dev` のデフォルトポートは 5173**。Playwright テスト (`pnpm test`) は 5175 を使うため競合しない。
- **Chromium パス** — `~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`（バージョンが上がると変わる）。

## トラブルシューティング

- **`Chromium not found`**: `cd frontend && npx playwright install chromium` を実行。
- **ログイン後に `/login` のまま**: Supabase が起動していない。`supabase start` を実行してから再試行。
- **`EADDRINUSE`**: ポート 5173 が使われている。「1. dev サーバーの起動確認」の掃除スニペット（vite と workerd の両方を kill）を実行してから再起動。
- **`workerd` が大量に残る / メモリを食う**: dev サーバーを vite だけ落として workerd が孤児化したケース。`pkill -9 -f "workerd serve"` で掃除する。
- **ページが空白**: Supabase の環境変数（`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`）が未設定。`frontend/.env` を確認。
