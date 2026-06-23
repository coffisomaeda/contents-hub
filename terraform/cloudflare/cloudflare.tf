# Cloudflare Worker の宣言
# コードのデプロイは wrangler deploy で行う。Terraform は Worker のインフラ定義のみ管理する。
resource "cloudflare_worker" "contents_hub" {
  account_id = var.cloudflare_account_id
  name       = var.worker_name

  observability = {
    enabled            = true
    head_sampling_rate = 1
    logs = {
      enabled            = true
      head_sampling_rate = 1
      invocation_logs    = true
      persist            = true
    }
  }

  subdomain = {
    enabled          = true
    previews_enabled = true
  }
}

# AI Gateway
# Worker から Workers AI 呼び出しをこの Gateway 経由にすることで、
# リクエスト/レスポンス（プロンプトと応答）・トークン数・レイテンシ・コストを
# ダッシュボードで 1 リクエストずつ閲覧できる。
# collect_logs = true がプロンプト/応答本文の記録に必須。
resource "cloudflare_ai_gateway" "contents_hub" {
  account_id = var.cloudflare_account_id
  id         = var.ai_gateway_id

  # ログ収集（プロンプト/応答本文を保存）。可視化の要。
  collect_logs = true

  # Logpush（外部への自動転送）は使わない。明示的に false 指定が必須。
  logpush = false

  # キャッシュは無効化（毎回モデルへ問い合わせ、動作確認を素直にする）。
  cache_ttl                  = 0
  cache_invalidate_on_update = false

  # レート制限。暴走時のコスト/過負荷の最後の砦として上限を設ける。
  # 環境ごとに変数で調整可能（0 = 無制限）。
  rate_limiting_interval = var.ai_gateway_rate_limiting_interval
  rate_limiting_limit    = var.ai_gateway_rate_limiting_limit
}

# 外部APIキャッシュおよびレート制限用のKVネームスペース
resource "cloudflare_workers_kv_namespace" "external_api_cache" {
  account_id = var.cloudflare_account_id
  title      = "${var.worker_name}-external-api-cache"
}

# カスタムドメイン（var.custom_domain が設定された場合のみ作成）
# 前提: 同一 Cloudflare アカウントでゾーンが管理されていること
resource "cloudflare_workers_custom_domain" "contents_hub" {
  count      = var.custom_domain != null ? 1 : 0
  account_id = var.cloudflare_account_id
  hostname   = var.custom_domain
  service    = cloudflare_worker.contents_hub.name
  zone_id    = var.cloudflare_zone_id
}
