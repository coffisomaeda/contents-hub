#!/usr/bin/env bash
#
# Cloudflare Quick Tunnel をローカル dev server に張り、公開 URL を取得して
# frontend/vite.config.ts の server.allowedHosts をその hostname に書き換える。
#
# 楽天 Web Service の新エンドポイントは localhost / 127.0.0.1 を Allowed websites
# として受け付けないため、ローカル確認には公開 URL（*.trycloudflare.com）が要る。
# Quick Tunnel の URL は起動ごとに変わるので、毎回この置き換えが必要になる。
#
# 使い方:  start-tunnel.sh [port]   (デフォルト 5173)
# 出力:    TUNNEL_PID / TUNNEL_URL / TUNNEL_HOST / LOG を stdout に出す。
#          allowedHosts への登録のため TUNNEL_HOST をユーザーに渡すこと。
#
set -euo pipefail

# スクリプト自身の位置からリポジトリルートを解決する
# （.claude/skills/rakuten-api-local/scripts/ の 4 階層上がルート）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
VITE_CONFIG="$REPO_ROOT/frontend/vite.config.ts"
PORT="${1:-5173}"
LOG="$(mktemp /tmp/cloudflared-XXXXXX.log)"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "ERROR: cloudflared が見つかりません。Cloudflare 公式手順でインストールしてください。" >&2
  exit 1
fi

if [ ! -f "$VITE_CONFIG" ]; then
  echo "ERROR: $VITE_CONFIG が見つかりません。リポジトリ構成を確認してください。" >&2
  exit 1
fi

# Quick Tunnel をバックグラウンドで起動（ログはファイルへ）
cloudflared tunnel --url "http://127.0.0.1:${PORT}" >"$LOG" 2>&1 &
TUNNEL_PID=$!

# 公開 URL が出るまで最大 ~30 秒待つ。
# cloudflared が起動直後にクラッシュした場合は待たずに即エラーにする。
URL=""
for _ in $(seq 1 30); do
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "ERROR: cloudflared プロセスが終了しました。ログ:" >&2
    cat "$LOG" >&2
    exit 1
  fi
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done

if [ -z "$URL" ]; then
  echo "ERROR: Tunnel URL を取得できませんでした。cloudflared ログ:" >&2
  cat "$LOG" >&2
  kill "$TUNNEL_PID" 2>/dev/null || true
  exit 1
fi

HOST="${URL#https://}"

# vite.config.ts の allowedHosts をこの hostname だけに更新。
# 失敗時は起動済みの cloudflared を孤児にしないよう必ず止めてから終了する。
# （node は読み込み→置換→書き込みの順で、allowedHosts 不検出時は writeFileSync 前に
#  exit するため、ファイルは未変更のまま。部分書き込みの心配はない。）
if ! node -e '
const fs = require("fs");
const [file, host] = process.argv.slice(1);
let s = fs.readFileSync(file, "utf8");
const re = /allowedHosts:\s*\[[^\]]*\]/;
if (!re.test(s)) { console.error("allowedHosts が " + file + " に見つかりません"); process.exit(1); }
s = s.replace(re, `allowedHosts: ['${host}']`);
fs.writeFileSync(file, s);
' "$VITE_CONFIG" "$HOST"; then
  echo "ERROR: vite.config.ts の allowedHosts 更新に失敗しました。" >&2
  kill "$TUNNEL_PID" 2>/dev/null || true
  exit 1
fi

echo "TUNNEL_PID=$TUNNEL_PID"
echo "TUNNEL_URL=$URL"
echo "TUNNEL_HOST=$HOST"
echo "LOG=$LOG"
