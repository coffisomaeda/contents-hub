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

# 認証: 環境変数 CLOUDFLARE_API_TOKEN または TF_VAR_cloudflare_api_token を使用
#
# 必要な API トークン権限（Account レベル）:
#   - Workers Scripts: Edit
#   - AI Gateway: Edit   ← cloudflare_ai_gateway リソースに必要
#
# トークン作成方法:
#   https://dash.cloudflare.com/profile/api-tokens
#   → "Edit Cloudflare Workers" テンプレートをベースに、
#     Permissions に Account > AI Gateway > Edit を追加してください。
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
