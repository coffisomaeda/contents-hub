---
paths:
  - 'frontend/wrangler.jsonc'
  - 'frontend/worker-configuration.d.ts'
  - 'frontend/.env*'
---

# Cloudflare / wrangler 型生成のルール

`frontend/worker-configuration.d.ts`（Cloudflare バインディング/env の型）を更新するときは、
必ず `pnpm gen:wrangler` を使い、**ビルド成果物が無いクリーンな状態**で生成すること。

- 更新（書き込み）: `pnpm gen:wrangler`（`.svelte-kit/cloudflare` を消してから `wrangler types`）
- 確認のみ（書き込まない）: `pnpm gen`（= `wrangler types --check`）

## 理由

ビルド済みの `.svelte-kit/cloudflare/_worker.js` が存在する状態で素の `wrangler types` を
実行すると、`declare namespace Cloudflare` に `GlobalProps.mainModule` ブロックが混入する。
CI の型チェック（`check` / `build`）はビルド前に `wrangler types --check` するため、この
ブロックを含む d.ts はハッシュ不一致で「out of date」になり CI が落ちる。正準形は
「ビルド非依存（GlobalProps 無し）」であり、`pnpm gen:wrangler` が常にその形を生成する。

## 補足: env 変数を増やしたとき

`worker-configuration.d.ts` の `Env` は `wrangler.jsonc` のバインディング/vars と `.env` の
キーから生成される。CI は `cp .env.example .env` してから型チェックするので、env を追加したら
`.env.example` にも同じキーを追記してから `pnpm gen:wrangler` で再生成すること。
