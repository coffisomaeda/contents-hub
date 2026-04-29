output "pages_url" {
  description = "Cloudflare Pages の *.pages.dev URL"
  value       = "https://${cloudflare_pages_project.contents_hub.subdomain}"
}

output "pages_project_name" {
  description = "Cloudflare Pages プロジェクト名"
  value       = cloudflare_pages_project.contents_hub.name
}

output "pages_custom_domain" {
  description = "設定したカスタムドメイン（未設定時は null）"
  value       = var.custom_domain != null ? cloudflare_pages_domain.contents_hub[0].name : null
}
