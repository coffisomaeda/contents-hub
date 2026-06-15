---
name: screenshot-docs
disable-model-invocation: true
description: >
  contents-hub アプリをローカルで起動し、Playwright でスクリーンショットを撮影して
  coffisomaeda/docs の Mintlify ドキュメントを画像付きで更新するスキル。
  UI が変更されたとき、新しいページを追加するとき、ドキュメントの画像を最新化したいときに使う。
  「スクショ撮って」「ドキュメントの画像更新して」「Mintlify 更新して」「画像差し替えて」
  などと言われたら必ずこのスキルを使うこと。
---

# screenshot-docs スキル

## パス定数

```
APP_DIR   = /home/maeda/private/contents-hub/frontend
DOCS_DIR  = /home/maeda/private/github.com/coffisomaeda/docs
IMAGES_DIR = DOCS_DIR/images
TEST_EMAIL = test1@example.com
TEST_PASS  = password123
APP_URL    = http://localhost:5173
```

## システム前提条件の確認

スクリーンショット撮影前に以下を確認する。不足していればユーザーに `sudo apt-get install` を依頼する。

```bash
# 日本語フォント
fc-list | grep -i noto | grep -i cjk | head -1

# Chromium 依存ライブラリ
ldd ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | grep "not found"
```

不足ライブラリがあればユーザーに提示（`! sudo apt-get install -y libnspr4 libnss3 libasound2t64 fonts-noto-cjk`）。

Playwright 本体が未インストールの場合：

```bash
cd /home/maeda/private/contents-hub/frontend && npx playwright install chromium
```

## Step 1: dev サーバーの起動確認

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null
```

- 200 または 302 → すでに起動中。そのまま使う。
- 接続失敗 → バックグラウンドで起動し 5 秒待つ：

```bash
cd /home/maeda/private/contents-hub/frontend && pnpm dev --port 5173 &
sleep 5
```

## Step 2: Playwright でスクリーンショットを撮影

`scripts/take-screenshots.js` を参照して実行する。スクリプトはページと撮影シナリオを引数で受け取れるように設計されている。

```bash
# @playwright/test のパスをスクリプト内に直接埋め込んでいるため、どこからでも実行可能
node /home/maeda/private/contents-hub/.claude/skills/screenshot-docs/scripts/take-screenshots.cjs \
  --scenario register \
  --out /tmp

# シナリオ変更例
node .../take-screenshots.cjs --scenario library --out /tmp
node .../take-screenshots.cjs --scenario settings --out /tmp
```

### Playwright でのセレクタ注意点（必ず守ること）

このアプリ特有のトラップが複数ある。スクリプトを書く際は以下を厳守する：

**ログアウトボタンが先にマッチする問題**

- `button[type="submit"]` はヘッダーのログアウトフォームを先に拾う
- ✅ `page.locator('button:has-text("検索")').first()` を使う
- ✅ `page.locator('form[action="?/register"] button[type="submit"]')` を使う
- ❌ `page.click('button[type="submit"]')` は絶対に使わない

**ラジオボタンが画像に隠れている問題**

- `input[name="mediaType"]` の上に `<img>` が重なっていてクリック不能
- ✅ `page.locator('label:has(input[name="mediaType"][value="movie"])').click()`
- ❌ `page.locator('input[name="mediaType"][value="movie"]').check()` は失敗する

**`use:enhance` フォームは fetch で送信される**

- 検索フォームは SvelteKit の `use:enhance` でページ遷移せず fetch で結果を返す
- `waitForLoadState('networkidle')` は検索完了を検知できない
- ✅ `await page.waitForSelector('article', { timeout: 20000 })` で結果カード出現を待つ
- ✅ 登録完了は `page.waitForFunction(() => document.querySelector('[role="status"] a') !== null)` で待つ

**登録完了の待ち方**

```js
// 成功メッセージ内の「詳細を見る」リンクが出現したら完了
await page.waitForFunction(() => document.querySelector('[role="status"] a') !== null, {
  timeout: 30000,
});
```

### ログイン手順

```js
await page.goto(`${APP_URL}/login`);
await page.waitForLoadState('networkidle');
await page.fill('input[name="email"]', 'test1@example.com');
await page.fill('input[name="password"]', 'password123');
await page.locator('form button[type="submit"]').click();
await page.waitForLoadState('networkidle');
// APP_URL/ にリダイレクトされたらログイン成功
```

## Step 3: 画像を docs/images/ にコピー

撮影した画像は `/tmp/` に保存し、その後 `IMAGES_DIR` にコピーする。

```bash
mkdir -p /home/maeda/private/github.com/coffisomaeda/docs/images
cp /tmp/screenshot-*.png /home/maeda/private/github.com/coffisomaeda/docs/images/
```

ファイル名は `<機能>-<連番>-<内容>.png` の形式にする（例: `register-01-new-page.png`）。

## Step 4: MDX ファイルを更新

Mintlify では `<Frame>` コンポーネントで画像を囲むと枠とキャプションが付く：

```mdx
<Frame caption="画面の説明">
  <img src="/images/register-01-new-page.png" alt="alt テキスト" />
</Frame>
```

画像パスは `/images/ファイル名.png`（先頭スラッシュあり、`DOCS_DIR` からの相対）。

## Step 5: コミット・プッシュ

```bash
cd /home/maeda/private/github.com/coffisomaeda/docs
git add images/ **/*.mdx
git commit -m "docs: スクリーンショットを更新"
git push origin main
```

Mintlify が GitHub App 連携済みであれば、push 後に自動デプロイされる。

## よくある失敗と対処

| 症状                           | 原因                               | 対処                                                   |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------ |
| 検索後にログイン画面へ遷移     | ログアウトボタンを誤クリック       | `button:has-text("検索")` を使う                       |
| ラジオボタン操作がタイムアウト | 画像が重なっている                 | `label:has(input...)` をクリック                       |
| 日本語が□になる                | フォント未インストール             | `fonts-noto-cjk` をインストール                        |
| Chromium 起動失敗              | 共有ライブラリ不足                 | `libnspr4 libnss3 libasound2t64` をインストール        |
| 検索結果が出ない               | API キーが wrangler に渡っていない | `.env` に API キーがあるか確認。TMDB（映画）は動作する |
