variable "supabase_organization_id" {
  description = "Supabase の Organization ID"
  type        = string
}

variable "supabase_db_password" {
  description = "Supabase データベースパスワード（インポート時のみ必要、lifecycle で無視される）"
  type        = string
  sensitive   = true
}
