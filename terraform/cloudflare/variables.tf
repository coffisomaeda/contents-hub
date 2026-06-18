variable "cloudflare_account_id" {
  description = "Cloudflare の Account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token。未指定時は provider が CLOUDFLARE_API_TOKEN を参照します。"
  type        = string
  default     = null
  sensitive   = true
}

variable "worker_name" {
  description = "Cloudflare Worker のスクリプト名"
  type        = string
  default     = "contents-hub"
}

variable "ai_gateway_id" {
  description = "AI Gateway の ID（名前）。Worker からはこの ID で AI 呼び出しを経由させる。"
  type        = string
  default     = "contents-hub"
}

variable "custom_domain" {
  description = "カスタムドメイン（不要な場合は null）"
  type        = string
  default     = null
}

variable "cloudflare_zone_id" {
  description = "Cloudflare の Zone ID（カスタムドメイン使用時に必要）"
  type        = string
  default     = null

  validation {
    condition     = var.cloudflare_zone_id != null || var.custom_domain == null
    error_message = "custom_domain を設定する場合は cloudflare_zone_id も必要です。"
  }
}
