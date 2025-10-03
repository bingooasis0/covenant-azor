param(
  [ValidateSet('host','compose')][string]$Mode = 'host',
  [string]$Host = '127.0.0.1',
  [int]$Port = 5434,
  [string]$Db = 'azor',
  [string]$User = 'azor',
  [string]$Pass = 'azor'
)

if ($Mode -eq 'host') {
  $dsn = "postgresql+psycopg2://$User:$Pass@$Host:$Port/$Db"
  $env:DATABASE_URL = $dsn
  $env:FRONTEND_ORIGIN = "http://localhost:3000"
  Write-Host "Set current-session env:"
  Write-Host "  DATABASE_URL=$dsn"
  Write-Host "  FRONTEND_ORIGIN=$($env:FRONTEND_ORIGIN)"
  Write-Host "Restart uvicorn to apply."
} else {
  Write-Host "Using Docker Compose override. Copy 'docker-compose.override.yml' next to compose file."
  Write-Host "It points to: postgresql+psycopg2://$User:$Pass@covenant_azor_db:5432/$Db"
  Write-Host "Then: docker compose up -d --force-recreate api"
}
