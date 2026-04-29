variable "cloudflare_account_id" {
  description = "Cloudflare の Account ID"
  type        = string
}

variable "pages_project_name" {
  description = "Cloudflare Pages プロジェクト名"
  type        = string
  default     = "contents-hub"
}

variable "pages_production_branch" {
  description = "本番デプロイ対象のブランチ名"
  type        = string
  default     = "main"
}

variable "pages_build_command" {
  description = "ビルドコマンド（フロントエンドフレームワーク確定後に更新）"
  type        = string
  default     = "pnpm run build"
}

variable "pages_build_output_dir" {
  description = "ビルド成果物の出力ディレクトリ"
  type        = string
  default     = "dist"
}

variable "github_owner" {
  description = "GitHub オーナー名（ユーザー名または組織名）"
  type        = string
  default     = null
}

variable "github_repo_name" {
  description = "GitHub リポジトリ名（未指定時は pages_project_name を使用）"
  type        = string
  default     = null
}

variable "custom_domain" {
  description = "カスタムドメイン（不要な場合は null）"
  type        = string
  default     = null
}

variable "pages_production_env_vars" {
  description = "本番環境の環境変数。各エントリに type (\"plain_text\" | \"secret_text\") と value を指定"
  type = map(object({
    type  = string
    value = string
  }))
  default   = {}
  sensitive = true
}

variable "pages_preview_env_vars" {
  description = "プレビュー環境の環境変数。各エントリに type (\"plain_text\" | \"secret_text\") と value を指定"
  type = map(object({
    type  = string
    value = string
  }))
  default   = {}
  sensitive = true
}
