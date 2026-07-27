variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "domain" {
  description = "Apex domain the route attaches to"
  type        = string
  default     = "letterwatchd.com"
}

variable "pages_project_name" {
  description = "Cloudflare Pages project name"
  type        = string
  default     = "letterwatchd"
}

variable "production_branch" {
  description = "Branch that triggers production deploys"
  type        = string
  default     = "main"
}

variable "github_owner" {
  description = "GitHub account that owns the repo"
  type        = string
  default     = "JoshCooley"
}

variable "github_repo" {
  description = "GitHub repo name"
  type        = string
  default     = "letterwatchd"
}

variable "secrets_store_id" {
  description = "Secrets Store ID created with wrangler"
  type        = string
}

variable "secret_name" {
  description = "Secret name within the store"
  type        = string
  default     = "tmdb-api-key"
}
