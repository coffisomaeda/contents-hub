# チャットのツール呼び出し eval（promptfoo）

`/api/chat` の「ユーザーの自然文 → 正しいツール呼び出し・引数」の精度を評価し、
複数モデル（Gemini / Cloudflare Workers AI）を横並びで比較するための eval です。

DB や外部 API、認証は呼ばず、**アプリと同じシステムプロンプト + ツール定義**をモデルに与えて、
返ってくるツール呼び出しだけを検証します（= AIの振る舞いの評価。決定的なロジックは通常の Playwright/ユニットテストで担保）。

## 何をテストしているか

`promptfooconfig.yaml` の各 `tests`:

- 正しい**ツール**が呼ばれたか（本=book / ゲーム=game / 映像=video / 検索=library）
- `status`（want/doing/done）や `rating`、映像の `media_type`（movie/tv）など**引数**が正しいか
- 「読了」「クリア」→ done、ステータス未指定 → want などの**マッピング**

検証ロジックは `assert.js`、ツール定義は `tools.yaml`、システムプロンプトは `prompt.yaml`。
いずれも `src/routes/api/chat/+server.ts` と内容を一致させること（サーバー側を変えたら追従する）。

## 実行方法

評価したいプロバイダーの環境変数を設定（一部だけでも可。`frontend/.env` に書けば自動で読まれる）:

```bash
export GEMINI_API_KEY=...    # gemini プロバイダー用（Google AI Studio のキー）
export AI_API_KEY=...        # cf プロバイダー用（Cloudflare Workers AI のトークン）
export AI_BASE_URL=https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1
```

実行:

```bash
# frontend/ で
pnpm eval        # = npx promptfoo eval -c evals/promptfooconfig.yaml
pnpm eval:view   # 結果をブラウザの比較ビューで開く
```

`pnpm eval` のサマリで「モデル × テスト」の合格率が表で出ます。
モデルを増減したいときは `promptfooconfig.yaml` の `providers` を編集してください。

## 注意

- これは非決定的なので **CIの必須ゲートにはしない**想定です。モデル変更時やプロンプト変更時に手動で回して比較する用途。
- Cloudflare のモデルは function calling 対応モデルのみ使えます（モデルIDの末尾を差し替えるだけで比較対象を追加できます）。
- API 利用料が発生します（特に大きいモデル）。
