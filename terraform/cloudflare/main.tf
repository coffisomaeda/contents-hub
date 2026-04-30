terraform {
  required_version = ">= 1.14.0"

  # backend は未設定（ローカル保存）。
  # チーム開発時は remote backend（Terraform Cloud 等）への移行を検討してください。

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# 認証: 環境変数 CLOUDFLARE_API_TOKEN を使用
#
# 必要な API トークン権限（Account レベル）:
#   - Workers Scripts: Edit
#
# トークン作成方法:
#   https://dash.cloudflare.com/profile/api-tokens
#   → "Edit Cloudflare Workers" テンプレートを使用するのが最も簡単です。
provider "cloudflare" {}
