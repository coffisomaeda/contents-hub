terraform {
  required_version = ">= 1.14.0"

  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# 認証: 環境変数 SUPABASE_ACCESS_TOKEN を使用
provider "supabase" {}

# 認証: 環境変数 CLOUDFLARE_API_TOKEN を使用
provider "cloudflare" {}
