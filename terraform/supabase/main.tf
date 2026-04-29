terraform {
  required_version = ">= 1.14.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

# 認証: 環境変数 SUPABASE_ACCESS_TOKEN を使用
provider "supabase" {}
