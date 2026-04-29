locals {
  # github_repo_name が未指定の場合は pages_project_name を流用
  github_repo_name = coalesce(var.github_repo_name, var.pages_project_name)
}

resource "cloudflare_pages_project" "contents_hub" {
  account_id        = var.cloudflare_account_id
  name              = var.pages_project_name
  production_branch = var.pages_production_branch

  # GitHub ソース連携（フロントエンドフレームワーク確定後に有効化）
  # GitHub App のインストールが事前に必要:
  #   https://github.com/apps/cloudflare-pages → インストール後にコメントアウトを外す
  # source = {
  #   type = "github"
  #   config = {
  #     owner                          = var.github_owner
  #     repo_name                      = local.github_repo_name
  #     production_branch              = var.pages_production_branch
  #     pr_comments_enabled            = true
  #     preview_deployment_setting     = "all"
  #     production_deployments_enabled = true
  #   }
  # }

  build_config = {
    build_command   = var.pages_build_command
    destination_dir = var.pages_build_output_dir
    build_caching   = true
  }

  deployment_configs = {
    production = {
      env_vars = var.pages_production_env_vars
    }
    preview = {
      env_vars = var.pages_preview_env_vars
    }
  }
}

# カスタムドメイン（var.custom_domain が設定された場合のみ作成）
# 前提: 同一 Cloudflare アカウントでゾーンが管理されているか、外部 DNS で TXT 検証が完了していること
resource "cloudflare_pages_domain" "contents_hub" {
  count        = var.custom_domain != null ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.contents_hub.name
  name         = var.custom_domain
}
