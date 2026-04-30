# フロントエンドフレームワーク調査

調査日: 2026-04-30

## 結論

フェーズ 3 のフロントエンドフレームワークは **SvelteKit** が最も適切です。

Contents Hub は、公開コンテンツサイトではなく、認証済みユーザーが本・ゲーム・映像作品を検索、登録、一覧、編集する個人向け管理アプリです。そのため、静的サイト生成の強さよりも、認証状態、フォーム、一覧検索、API キーを隠した外部 API 呼び出し、Cloudflare への自然なデプロイをまとめて扱えることが重要です。

SvelteKit はこの要件に対して、Cloudflare Workers 向けの `@sveltejs/adapter-cloudflare` で Workers に載せられます。`wrangler deploy` でビルド成果物をデプロイし、SvelteKit の request handler として API を実装できます。将来、楽天ブックス API、TMDB API、Watchmode API の呼び出しをサーバー側に寄せる場合も、SvelteKit の API route 相当の request handler として実装できます。

## 判断基準

- Cloudflare Workers へのデプロイが自然であること
- Supabase Auth / Database と組み合わせやすいこと
- 外部 API キーをクライアントに露出しない実装へ移行しやすいこと
- 一覧、検索、詳細、登録、編集といったアプリ UI を過剰な構成なしで作れること
- 既存方針である TypeScript / Vite / pnpm と整合すること
- 個人開発として、運用・ビルド・設定の複雑さが増えすぎないこと

## 候補比較

| 候補         | 評価           | 理由                                                                                                                                                                                                            |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SvelteKit    | 推奨           | Cloudflare Workers 対応の adapter があり、Vite ベース。ルーティング、フォーム、サーバー側 handler を一体で扱えるため、認証付き CRUD アプリに向いている。                                                |
| Astro        | 条件付きで有力 | Cloudflare Workers 対応は良いが、Astro の主戦場は高速な content-focused サイト。Contents Hub はログイン後の操作中心アプリなので、SvelteKit より適性は少し落ちる。                                       |
| Next.js      | 今回は非推奨   | React エコシステムと Supabase 事例は強い。ただし Cloudflare Workers では OpenNext adapter が必要で、フルスタック SSR の設定が複雑。今回の規模では複雑さが先に立つ。 |
| React + Vite | 条件付きで有力 | 既存の Vite 方針に最も素直で、SPA としては軽い。ただし API キー保護のためのサーバー側 endpoint、ルーティング、フォーム、認証保護などを個別に組み合わせる必要があり、フェーズ 4 以降で構成が散らばりやすい。     |

## SvelteKit を選ぶ理由

### 1. Cloudflare Workers との相性が良い

Cloudflare は新規プロジェクトに Workers を推奨しており、`@sveltejs/adapter-cloudflare` で Workers 上に SvelteKit をデプロイできます。`wrangler deploy` でビルド・デプロイを一括管理できます。

### 2. Supabase Auth と相性が良い

Supabase は SSR フレームワークで Auth を扱う場合、セッションを cookie に保存する構成を案内しており、`@supabase/ssr` による設定を推奨しています。Supabase の SSR ガイドには Next.js と SvelteKit の quickstart が用意されています。

Contents Hub は RLS を有効化済みで、認証済みユーザーのみ CRUD 可能にする設計です。クライアントだけで完結する SPA より、サーバー側でも認証状態を扱える SvelteKit のほうが、ログイン後ページの保護や初期データ取得の設計を整理しやすいです。

### 3. 外部 API キーを守りやすい

フェーズ 4 では楽天ブックス API、TMDB API、Watchmode API を使います。これらの API キーは `.env` で管理し、Git にコミットしない方針です。

検索機能をブラウザから直接外部 API に投げると、キーの露出や CORS、レート制限の扱いが課題になります。SvelteKit であれば、検索処理を `+server.ts` などの server endpoint に置き、ブラウザには Contents Hub 側の API だけを見せる構成にできます。Workers 上で実行されるため、API キーはサーバーサイドに留まります。

### 4. アプリ UI に必要な機能が過不足ない

Contents Hub のフェーズ 3 は、ログイン、検索、候補選択、登録確認、一覧、詳細、編集、削除、ステータス管理が中心です。SvelteKit はファイルベースルーティング、load 関数、form actions、server endpoint を同一フレームワーク内で扱えるため、画面ごとの責務を整理しやすいです。

Astro でも実装できますが、Astro は「コンテンツ中心サイト」の強みが大きく、ログイン後の操作中心 UI では SvelteKit のほうが素直です。React + Vite でも実装可能ですが、ルーティングやサーバー側 API を別途組み立てる必要があります。

## 採用時の初期構成案

- フレームワーク: SvelteKit
- デプロイ先: Cloudflare Workers
- adapter: `@sveltejs/adapter-cloudflare`
- デプロイ: `wrangler deploy`
- 言語: TypeScript
- パッケージマネージャー: pnpm
- Supabase:
  - `@supabase/supabase-js`
  - SSR を使う場合は `@supabase/ssr`
- 環境変数:
  - ブラウザに公開してよい Supabase URL / publishable key
  - サーバー側だけで使う外部 API キー（wrangler secret で管理）
- Cloudflare Pages 出力先:
  - `.svelte-kit/cloudflare`（wrangler deploy で自動的にアップロードされる）

## 注意点

- Cloudflare は新規プロジェクトに Cloudflare Workers を推奨しています。このリポジトリでも Workers ベースの構成を採用しています。
- SvelteKit の Cloudflare adapter を使う場合、SvelteKit の request handler として API を実装します。
- Worker の環境変数・シークレットは `wrangler.toml` / `wrangler secret` で管理します。Terraform は Worker のインフラ定義（存在宣言・カスタムドメイン）のみを管理します。
- Next.js を採用する場合、Workers + OpenNext adapter が必要になり、設定が複雑化します。
- React + Vite を採用する場合、サーバー側 API を Workers/Hono で別途設計する必要があります。小さく始めるには良いものの、フェーズ 4 以降の API キー管理を考えると SvelteKit のほうがまとまりやすいです。

## 次の作業案

フェーズ 3 実装に進む場合は、次の順で進めるのがよいです。

1. SvelteKit プロジェクトを `frontend/` 配下に作成する
2. `@sveltejs/adapter-cloudflare` を設定する
3. `wrangler.toml` を作成し、Workers へのデプロイ設定を行う
4. Supabase 型生成の出力先を `frontend/src/lib/database.types.ts` に合わせる
5. ログイン画面と認証状態管理を先に作る
6. 一覧・詳細・登録フローを Supabase 直結で実装する
7. 外部 API 連携は server endpoint 経由にする

## 参照

- Cloudflare Workers: SvelteKit guide
  https://developers.cloudflare.com/workers/frameworks/framework-guides/svelte/
- Cloudflare Workers: Astro guide
  https://developers.cloudflare.com/workers/frameworks/framework-guides/astro/
- OpenNext Cloudflare adapter
  https://opennext.js.org/cloudflare
- Supabase Auth: Server-Side Rendering
  https://supabase.com/docs/guides/auth/server-side
