# ──────────────────────────────────────
# Supabase
# ──────────────────────────────────────

variable "supabase_project_ref" {
  description = "Supabase プロジェクトの Reference ID"
  type        = string
}

variable "supabase_organization_id" {
  description = "Supabase の Organization ID"
  type        = string
}

# ──────────────────────────────────────
# Cloudflare
# ──────────────────────────────────────

variable "cloudflare_account_id" {
  description = "Cloudflare の Account ID"
  type        = string
}
