# Devin レビュー指摘まとめ（PR #9）

PR #9 の Devin レビューで指摘された 9 件の内容と対応状況をまとめる。

---

## 🔴 BUG（修正済み）

### BUG-01: `buildRegistrationInput` の `.parse()` が `.safeParse()` より先に throw する

**ファイル:** `frontend/src/routes/contents/new/+page.server.ts`

**問題:**
`buildRegistrationInput` 内で `contentRegistrationSchema.parse()` を呼んでいたため、バリデーション失敗時に `ZodError` が throw される。呼び出し元の `safeParse` には到達せず、汎用 catch ブロックで `ZodError` の JSON 文字列がそのままユーザーに返っていた。

**修正:** `buildRegistrationInput` から `contentRegistrationSchema.parse()` を削除し、生のオブジェクトを返すだけに変更。バリデーションは呼び出し元の `safeParse` で行う。

---

### BUG-02: `search` アクションに認証チェックがない

**ファイル:** `frontend/src/routes/contents/new/+page.server.ts`

**問題:**
`search` アクションに `locals` の分割代入がなく、認証チェックを行っていなかった。`load` 関数は未認証ユーザーをリダイレクトするが、form action への直接 POST はページの `load` を経由しない。未認証の攻撃者がレート制限付きの外部 API（楽天・TMDB）を消費可能。

**修正:** `search` アクションに `locals` を追加し、`safeGetSession()` による認証チェックを追加。未認証の場合は `/login` にリダイレクト。

---

### BUG-03: Watchmode の `null` 検索結果がキャッシュから復元できない

**ファイル:** `frontend/src/lib/server/external/watchmode.ts`

**問題:**
`getFromCache` は KV にキーが存在しない場合も、キャッシュ値が `null` の場合も `null` を返す。API が結果なし（`null`）を返してキャッシュに保存した場合、次のリクエストでもキャッシュミスと区別できず毎回 API を呼び直す。Watchmode は月 2,500 リクエスト制限のため影響が大きい。

**修正:** `null` 結果をラッパーオブジェクト `{ value: WatchmodeTitleResult | null }` で保存し、キャッシュヒット時は `cached !== null` で判定してから `cached.value` を返す。

---

## 🚩 ANALYSIS（修正済み）

### ANALYSIS-02: `consumeToken` がトークン取得失敗時にエラーなく続行する

**ファイル:** `frontend/src/lib/server/external/cache.ts`

**問題:**
`MAX_WAIT_ATTEMPTS`（5回）を使い切った場合、関数は何も throw せず静かに return していた。呼び出し元はそのまま API リクエストを実行するため、レート制限を突破していた。

**修正:** ループ後に `Error` を throw するよう変更。

---

### ANALYSIS-03: `vite.config.ts` に Quick Tunnel の固定 hostname が残っている

**ファイル:** `frontend/vite.config.ts`

**問題:**
`server.allowedHosts` に `notices-spam-frequency-analyzed.trycloudflare.com` というハードコードされた Cloudflare Quick Tunnel の URL が残っていた。Quick Tunnel の URL は起動ごとに変わるため無効。他の開発者が混乱する可能性がある。

**修正:** `server.allowedHosts` の設定を削除。

---

### ANALYSIS-04: `fetchWithRetry` の `Retry-After` ヘッダー解釈が秒単位前提

**ファイル:** `frontend/src/lib/server/external/fetch-with-retry.ts`

**問題:**
`Retry-After` ヘッダーを `Number(value) * 1000` で変換していたが、HTTP-date 形式（例: `Wed, 21 Oct 2015 07:28:00 GMT`）の場合 `Number()` が `NaN` を返し、`setTimeout(fn, NaN)` は即座に実行される。即時リトライによる 429 応答ループが発生しうる。

**修正:** `isNaN` チェックを追加し、日付形式や不正な値の場合は指数バックオフにフォールバック。

---

### ANALYSIS-05: `createContent` で子テーブル挿入失敗時に `contents` レコードが孤立する

**ファイル:** `frontend/src/lib/server/content-registration.ts`

**問題:**
`contents` テーブルへの INSERT 成功後、`books`/`games`/`videos` テーブルへの INSERT が失敗した場合、`contents` レコードが孤立していた。Supabase JS クライアントにはトランザクション API がない。

**修正:** 子テーブル挿入失敗時にベストエフォートで `contents` レコードを削除するクリーンアップを追加。完全なアトミック性は保証されないが、孤立レコードの発生を大幅に減らす。

> **TODO:** 将来的には Supabase RPC（データベース関数）でアトミックに実装することを検討。

---

## 🚩 ANALYSIS（コードは未変更・要検討）

### ANALYSIS-01: トークンバケットの KV read-modify-write に競合状態がある

**ファイル:** `frontend/src/lib/server/external/cache.ts`

**問題:**
`consumeToken` の KV の read → compute → write がアトミックでない。複数の Cloudflare Workers インスタンスが同時にトークンを消費すると、同じトークンを二重消費する可能性がある。Cloudflare KV は結果整合性のため、厳密なレート制限には不向き。

**対応方針:** 現状のユースケース（楽天 API の秒間 2 リクエスト程度）では実害は小さい。本番でトラフィックが増えた場合は [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) への移行を検討する。

---

## 📝 INFO（確認・対応不要）

### INFO-01: `tsconfig.json` の `checkJs: false` への変更

**ファイル:** `frontend/tsconfig.json`

**内容:**
`checkJs` が `true` から `false` に変更されている。`eslint.config.js`、`svelte.config.js` などの JS 設定ファイルでの型エラーを抑制する意図。TS ソースには影響しない。意図的な変更であり、現状維持。
