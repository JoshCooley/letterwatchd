terraform {
  required_version = ">= 1.14"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.22"
    }
  }
}

provider "cloudflare" {}

data "cloudflare_zone" "this" {
  filter = {
    name = var.domain
  }
}

resource "cloudflare_workers_script" "tmdb_proxy" {
  account_id  = var.account_id
  script_name = "letterwatchd-tmdb-proxy"

  content_file   = "${path.module}/../worker/index.js"
  content_sha256 = filesha256("${path.module}/../worker/index.js")
  main_module    = "index.js"

  compatibility_date = "2026-06-16"

  bindings = [
    {
      name        = "TMDB_API_KEY"
      type        = "secrets_store_secret"
      store_id    = var.secrets_store_id
      secret_name = var.secret_name
    },
  ]
}

resource "cloudflare_workers_route" "api" {
  zone_id = data.cloudflare_zone.this.zone_id
  pattern = "${var.domain}/api/*"
  script  = cloudflare_workers_script.tmdb_proxy.script_name
}
