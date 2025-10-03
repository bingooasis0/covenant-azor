# Lightweight DB status checks
Write-Host "Container publishes:"
docker port covenant_azor_db 5432
Write-Host ""
Write-Host "Tables in 'azor' schema:"
docker exec -e PGPASSWORD=azor -i covenant_azor_db psql -U azor -d azor -c "\dt public.*"
