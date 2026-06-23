### デザイン

- [DESIGN.md](./DESIGN.md) を参照すること
- モバイルUIファーストで作成すること

### 型生成（Cloudflare / wrangler）

- `worker-configuration.d.ts`（Cloudflare バインディング/env の型）を更新するときは
  必ず `pnpm gen:wrangler` を使い、**ビルド成果物が無いクリーンな状態**で生成すること。
- 理由: ビルド済みの `.svelte-kit/cloudflare/_worker.js` が存在する状態で素の
  `wrangler types` を実行すると `GlobalProps.mainModule` ブロックが混入する。
  CI の型チェック（`check` / `build`）はビルド前に `wrangler types --check` するため、
  このブロックが入った d.ts はハッシュ不一致で「out of date」になり CI が落ちる。
- 確認だけなら `pnpm gen`（= `wrangler types --check`、書き込みなし）。
