# Discord からチャットアシスタントを使えるようにする構築計画

> **ステータス: 未実装（将来計画）。** これはまだ実装されていない機能の構築手順です。
> 実際の挙動ではなく「これから作るときの計画」を記したものなので、実装に着手する際の
> 設計メモとして読んでください。実装後は現状の運用ドキュメント（`docs/guides/frontend/`）側へ
> 反映・移管します。

現在 Web 画面（`/`）で提供しているコンテンツ管理アシスタントを、Discord のチャットからも
操作できるようにするための計画です。「本を登録して」「完了した本を見せて」といった指示を
Discord 上で送ると、既存の AI ロジック（Workers AI + ツール呼び出し）が動いて応答します。

## 背景：なぜ可能か

現状のチャットは「Cloudflare Workers 上の `POST /api/chat` が Workers AI（AI Gateway 経由）と
外部 API ツールを呼び、JSON で応答を返す」構成です（`frontend/src/routes/api/chat/+server.ts`）。
入口が Svelte 画面なだけなので、**入口を Discord に差し替える**ことができれば、同じ
バックエンドロジック（ツール群・登録処理・ライブラリ検索）をそのまま再利用できます。

Discord Bot の「Interactions Endpoint URL」に Cloudflare Workers のエンドポイントを登録する
構成は、Workers の代表的なユースケースの一つです。常駐プロセス（gateway 接続型 Bot）ではなく、
**HTTP Interactions 型**で実装するのが Workers と相性が良く、本計画でもこちらを採用します。

## 設計上の最重要論点

### 1. セッション境界の決め方（Discord には「セッション」概念が無い）

Discord 自体にアプリ的なセッションは無いため、こちらで境界を決め打ちする必要があります。
段階的に進める前提で、以下の方針とします。

- **フェーズ1（初期）= ワンショット（stateless）**
  1 回の Slash Command に対して 1 問 1 答だけを返し、会話履歴は持たない。
  Discord 連携の本質的に難しい部分（署名検証・3秒ルール・認証紐付け）の検証に集中する。
- **フェーズ2 = スレッドでマルチターン**
  Bot が応答時にスレッドを作成し、`thread_id`（= channel_id）を既存の `conversationId` に
  対応づけて履歴を持たせる。スレッドのアーカイブ＝セッションクリアに対応させる。

| 区切りの単位 | セッションとしての適性 | 備考                                                            |
| ------------ | ---------------------- | --------------------------------------------------------------- |
| Thread       | ◎ 最有力               | 1スレッド=1セッション。`thread_id` を `conversationId` にマップ |
| Channel      | △                      | 常設で区切り感が薄い                                            |
| DM           | △                      | 1本の長い会話になり区切れない                                   |
| User ID      | ×                      | 「セッション」ではなく「アカウント」単位                        |

### 2. 認証の紐付け（誰のライブラリを操作するのか）

既存チャットは Supabase Auth のログインユーザー（`user.id`）単位でライブラリを操作します。
Discord には Supabase セッションが無いので、**Discord ユーザー ↔ Hub ユーザーの紐付け**が必要です。

- フェーズ1の最小構成では「**自分専用 Bot（紐付けは固定 1 ユーザー）**」とし、環境変数で
  対象 `user.id` を 1 つ指定して動かす（実装・検証コストを最小化）。
- 本格運用では連携テーブル（後述 `discord_links`）を用意し、Web 側で発行したワンタイム
  コードを Discord で入力して紐付ける、などのフローを設計する。

### 3. Discord の 3 秒ルール

Discord の Interaction は **3 秒以内に一次応答**を返す必要があります。AI 応答（ツール呼び出しを
含むと数秒〜十数秒）は間に合わないため、次の二段構えにします。

1. 受信直後に `type: 5`（**deferred** = 「考え中…」）を即返す。
2. その後、非同期で AI を実行し、結果を **Webhook（フォローアップ）** で送信して
   先ほどのメッセージを更新する。Workers では `ctx.waitUntil()` で実行を継続する
   （既存の `saveChatHistory` が `waitUntil` を使っているのと同じ仕組み）。

### 4. 署名検証（必須）

Discord は全 Interaction リクエストに **Ed25519 署名**（`X-Signature-Ed25519` /
`X-Signature-Timestamp` ヘッダ）を付けて送ります。署名検証に失敗したリクエストは
`401` で弾く必要があります（Discord の検証 ping もこれで通る）。Workers の WebCrypto で
`Ed25519` を検証できます。

## 1. Discord 側の設定

1. **アプリケーション作成**
   - [Discord Developer Portal](https://discord.com/developers/applications) でアプリを作成。
   - **Application ID** と **Public Key**（署名検証に使用）を控える。
2. **Bot の作成**
   - 「Bot」タブで Bot を作成し、**Bot Token** を控える（フォローアップ送信に使用）。
3. **Interactions Endpoint URL の設定**
   - 「General Information」の _Interactions Endpoint URL_ に、本アプリの受け口
     （例: `https://<本番ドメイン>/api/discord/interactions`）を登録する。
   - 登録時に Discord が検証 ping を送るので、署名検証エンドポイントが先に動いている必要がある。
4. **Slash Command の登録**
   - `/ask`（引数 `prompt: string`）などを登録する。Bot Token または Bearer で
     `PUT /applications/{app_id}/commands` を叩いて登録する（初回のみのセットアップスクリプトを用意）。
5. **Bot の招待**
   - OAuth2 URL Generator で `applications.commands`（と必要なら `bot`）スコープを付けて
     対象サーバーへ招待する。

## 2. シークレット・環境変数

`frontend/.env.enc`（sops + age 管理）と本番 secrets（`wrangler secret`）に追加する想定。

| 変数名                    | 用途                                                 |
| ------------------------- | ---------------------------------------------------- |
| `DISCORD_PUBLIC_KEY`      | Interaction 署名（Ed25519）の検証                    |
| `DISCORD_APP_ID`          | フォローアップ Webhook の URL 組み立て               |
| `DISCORD_BOT_TOKEN`       | Slash Command 登録・フォローアップ送信の認証         |
| `DISCORD_DEFAULT_USER_ID` | フェーズ1の固定紐付け先 Supabase ユーザー ID（暫定） |

> シークレットの追加・暗号化は既存の sops + age フロー（`frontend/.env.enc`）に従う。

## 3. 実装方針（SvelteKit / Workers）

### 3.1 受け口エンドポイント

`frontend/src/routes/api/discord/interactions/+server.ts` を新設する。

処理の流れ：

```text
POST /api/discord/interactions
  1. 署名検証（X-Signature-Ed25519 / X-Signature-Timestamp + DISCORD_PUBLIC_KEY）
     → 失敗なら 401
  2. type === 1 (PING) なら { type: 1 } を返す（Discord の疎通確認）
  3. type === 2 (APPLICATION_COMMAND) なら：
     a. 即時に { type: 5 }（deferred）を返す
     b. platform.ctx.waitUntil() で AI 実行を継続
        - Discord ユーザー → Supabase user.id を解決（フェーズ1は固定値）
        - 既存のチャットロジックを呼び、reply / registeredContent / searchResults を得る
        - 結果を Discord フォローアップ Webhook に PATCH/POST して表示更新
```

### 3.2 チャットロジックの共通化（リファクタ）

現状 `POST /api/chat` の `+server.ts` に AI ロジックが直書きされている。Discord と Web で
再利用するため、**HTTP に依存しない純粋な関数へ切り出す**。

- 切り出し先（案）: `frontend/src/lib/server/chat/run-assistant.ts`
- シグネチャ（案）:

```ts
export interface RunAssistantInput {
  userId: string;
  message: string;
  history?: { role: string; content: string }[];
  conversationId?: string;
}

export interface RunAssistantResult {
  reply: string;
  registeredContent: RegisteredContentInfo | null;
  searchResults: LibrarySearchResultItem[] | null;
}

export async function runAssistant(
  deps: {
    supabase: SupabaseClient;
    platform: App.Platform | undefined;
    origin: string;
  },
  input: RunAssistantInput,
): Promise<RunAssistantResult>;
```

- 既存の `POST /api/chat` はこの関数を呼ぶだけの薄いラッパーに変更する（挙動は不変）。
- Discord 側はこの関数を呼び、`RunAssistantResult` を Discord の埋め込み（embed）へ整形する。
  - `reply` は本文テキストに。
  - `registeredContent` / `searchResults` は Discord の **embed**（タイトル・サムネイル画像・
    リンク）として表現する。Web のカード UI に相当する見せ方。

### 3.3 Discord 応答の整形

- `search_my_library` の結果は最大 20 件。Discord embed は 1 メッセージ 10 embed 上限のため、
  件数が多い場合は先頭 N 件＋「他 M 件」表記にする。
- 画像は `imageUrl` を embed の `thumbnail` に設定。

## 4. 認証紐付けの本実装（フェーズ2以降）

固定ユーザーから脱却する場合の設計案。

1. **連携テーブル `discord_links`**（Supabase / Postgres）
   - `discord_user_id (text, pk)`, `user_id (uuid, fk -> auth.users)`, `created_at`。
2. **紐付けフロー**
   - Web の設定画面で「Discord 連携」ボタン → ワンタイムコードを発行。
   - Discord で `/link <code>` を実行 → コードを検証して `discord_links` に行を作成。
3. Interaction 受信時に `discord_user_id` から `user_id` を引き、未連携なら
   「まず Web で連携してください」と返す。

## 5. テスト・動作確認

- **署名検証の単体テスト**: 正しい署名で通過、改ざんで 401。Discord の検証 ping（type 1）に
  `{ type: 1 }` を返すこと。
- **runAssistant の単体テスト**: 既存のチャット API テストを共通関数側へ寄せ、Web/Discord
  双方が同じロジックを通ることを担保する。
- **ローカル確認**: ローカルでは Discord から直接叩けないため、Cloudflare Quick Tunnel で
  公開 URL を作り、Interactions Endpoint URL に一時登録して試す（`rakuten-api-local` スキルの
  トンネル手順が流用できる）。登録動作の確認は映画（TMDB）で行う方針（楽天 API はローカル不可）。

## 6. 段階的リリース計画

| フェーズ | 内容                                                         | 完了条件                                   |
| -------- | ------------------------------------------------------------ | ------------------------------------------ |
| 1        | ワンショット `/ask`・固定ユーザー・deferred 応答・署名検証   | Discord から登録/検索が 1 問 1 答で動く    |
| 2        | スレッド単位のマルチターン（`thread_id` = `conversationId`） | スレッド内で会話履歴が継続する             |
| 3        | `discord_links` による複数ユーザー紐付け・`/link` コマンド   | 任意ユーザーが自分のライブラリを操作できる |

## 未確定事項 / 要検討

- Bot を**自分専用に閉じる**か、複数ユーザーへ開放するか（フェーズ3 をやるかの判断）。
- DM 運用を許可するか（許可するとセッション区切りが難しくなる）。
- フォローアップ送信失敗時のリトライ／エラー通知の扱い。
- 既存の D1 `chat_messages` を Discord 由来の会話にも使うか、別系統にするか。
