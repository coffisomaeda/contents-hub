output "project_ref" {
  description = "作成されたプロジェクトの Reference ID"
  value       = supabase_project.main.id
}

output "project_name" {
  description = "プロジェクト名"
  value       = supabase_project.main.name
}

output "project_region" {
  description = "プロジェクトのリージョン"
  value       = supabase_project.main.region
}
