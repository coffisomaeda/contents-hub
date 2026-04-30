terraform {
  required_version = ">= 1.14.0"

  # backend は未設定（ローカル保存）。
  # チーム開発時は remote backend（Terraform Cloud 等）への移行を検討してください。

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# 認証: 環境変数 SUPABASE_ACCESS_TOKEN を使用
provider "supabase" {}

# 東京リージョンに新規プロジェクトを作成
resource "supabase_project" "main" {
  organization_id   = var.supabase_organization_id
  name              = "contents-hub"
  database_password = var.supabase_db_password
  region            = "ap-northeast-1"

  lifecycle {
    ignore_changes = [database_password]
  }
}
