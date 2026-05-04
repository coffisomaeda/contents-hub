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
