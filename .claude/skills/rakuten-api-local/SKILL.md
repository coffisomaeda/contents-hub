---
name: rakuten-api-local
description: >
  contents-hub のローカル開発で楽天ブックス API（書籍・ゲーム検索）の動作を
  確認するための手順。Cloudflare Quick Tunnel で公開 URL を作り、vite の
  allowedHosts を更新し、楽天の Allowed websites に登録して検索を試すまでを案内する。
  「楽天 API をローカルで確認したい」「ローカルで書籍/ゲーム検索を試したい」
  「楽天の検索が localhost で動かない / 弾かれる」「cloudflared でトンネルを張りたい」
  「Allowed websites」などに触れたらこのスキルを使う。
  単にアプリをローカル起動するだけなら run-contents-hub を使う。
---

# 楽天ブックス API をローカルで確認する

楽天 Web Service の新エンドポイントは認証（Application ID + Access Key）に加えて
**リクエスト元ホストの制限（Allowed websites）** を使う。`localhost` / `127.0.0.1` /
`http://localhost:5173` は楽天側で無効な値として拒否されるため、ローカル確認には
**公開 URL が必要**。そこで Cloudflare Quick Tunnel で一時的な公開 URL を作って検証する。

Quick Tunnel の URL は **起動するたびに変わる**ので、毎回 `allowedHosts` の更新と
楽天への再登録が要る。この毎回の手間を減らすため、Tunnel 起動と `allowedHosts` 書き換えは
`scripts/start-tunnel.sh` に自動化してある。

## 前提の確認

1. `frontend/.env` に楽天の認証情報があるか確認する（無ければユーザーに設定を依頼）:
   ```
   RAKUTEN_APP_ID=...
   RAKUTEN_ACCESS_KEY=...
   ```
   これは楽天 Web Service のアプリ情報画面の値。Affiliate ID や Client Secret ではない。
   `.env` を変更したら `cd frontend && pnpm gen` で型を再生成する。
2. `cloudflared` が入っているか（`command -v cloudflared`）。無ければ Cloudflare 公式手順で導入。

## 手順

### 1. Tunnel を張って allowedHosts を更新する

dev server を**起動する前に**実行する（allowedHosts を先に更新しておけば dev の再起動が不要）。

```bash
bash /home/maeda/private/contents-hub/.claude/skills/rakuten-api-local/scripts/start-tunnel.sh
```

出力の `TUNNEL_URL`（`https://xxxx.trycloudflare.com`）と `TUNNEL_HOST`（`xxxx.trycloudflare.com`）、
`TUNNEL_PID` を控える。このスクリプトが `frontend/vite.config.ts` の `allowedHosts` を
取得した hostname に自動で書き換える。

> 既に dev server が動いている場合は、allowedHosts の変更を反映するため dev を再起動する。

### 2. dev server を起動する

```bash
cd /home/maeda/private/contents-hub/frontend && pnpm dev --host 127.0.0.1
```

（ローカル起動の一般的な面倒を見るのは `run-contents-hub` スキル。ここでは Tunnel が
127.0.0.1:5173 を指す前提なので `--host 127.0.0.1` で起動する。）

### 3. 楽天 Allowed websites に hostname を登録する（手動・ユーザー作業）

楽天 Web Service のアプリ設定 → Allowed websites に `TUNNEL_HOST` を登録するようユーザーに依頼する。

```txt
xxxx.trycloudflare.com
```

`https://` やポート番号は付けない。`localhost` / `127.0.0.1` は楽天側で拒否される。
これは人間にしかできない手作業なので、hostname を明示して登録を促し、完了を待つ。

### 4. 動作確認する

`TUNNEL_URL` をブラウザで開き、テストユーザーでログイン:

```txt
email: test1@example.com
password: password123
```

`/contents/new` で書籍またはゲームを選び、キーワード検索する。楽天ブックス API の結果が
表示されれば成功。Playwright で確認する場合は `run-contents-hub` のセレクタ注意点に従う
（検索フォームは `use:enhance` で fetch 送信される等）。

### 5. 後片付け

確認が終わったら Tunnel を止める:

```bash
kill <TUNNEL_PID>
```

`vite.config.ts` の `allowedHosts` は使い捨ての Tunnel hostname に書き換わっている。
コミットしないよう注意する（楽天確認は一時的なものなので、通常は変更を戻す or commit から除外）。

## トラブルシュート

| 症状                              | 確認                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 検索しても楽天結果が出ない        | Allowed websites に現在の Tunnel hostname を登録したか（URL は毎回変わる）。`https://`・ポートを付けていないか |
| Vite が "host not allowed" で弾く | `allowedHosts` が今の Tunnel hostname か。dev を再起動したか                                                   |
| 認証エラー                        | `.env` の `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` が正しいか。Affiliate ID 等と取り違えていないか              |
| Tunnel URL が取れない             | `cloudflared` のインストール／ネットワークを確認。スクリプトが出す LOG を見る                                  |

固定 URL が欲しい場合は、Cloudflare 管理の独自ドメインで固定 hostname の Tunnel を作る
（その場合 Allowed websites の再登録は初回だけで済む）。詳細な背景は
`docs/guides/frontend/FRONTEND_SETUP.md` の「楽天ブックス API をローカルで確認する」を参照。
