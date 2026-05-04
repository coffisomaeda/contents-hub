output "worker_name" {
  description = "Cloudflare Worker のスクリプト名"
  value       = cloudflare_worker.contents_hub.name
}

output "worker_custom_domain" {
  description = "設定したカスタムドメイン（未設定時は null）"
  value       = var.custom_domain != null ? cloudflare_workers_custom_domain.contents_hub[0].hostname : null
}

output "kv_namespace_id" {
  description = "外部APIキャッシュ用 KV ネームスペースの ID"
  value       = cloudflare_workers_kv_namespace.external_api_cache.id
}
