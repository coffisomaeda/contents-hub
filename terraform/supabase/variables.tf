variable "supabase_organization_id" {
  description = "Supabase の Organization ID"
  type        = string
}

variable "supabase_db_password" {
  description = "Supabase データベースパスワード（インポート時のみ必要、lifecycle で無視される）"
  type        = string
  sensitive   = true
}

variable "supabase_site_url" {
  description = "Supabase Auth の Site URL。本番 URL が決まったら設定します。"
  type        = string
  default     = null
}

variable "supabase_auth_redirect_urls" {
  description = "Supabase Auth の Redirect URLs。例: https://example.com/auth/callback"
  type        = list(string)
  default     = []
}
