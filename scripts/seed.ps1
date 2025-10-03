\
    Param(
      [string]$DbContainer = "covenant_azor_db"
    )

    Write-Host "Copying SQL files into container '$DbContainer'..."
    docker exec $DbContainer sh -c "mkdir -p /seed" | Out-Null
    docker cp sql\reset-db-login.sql $DbContainer:/seed/reset-db-login.sql
    docker cp sql\alter-role-default.sql $DbContainer:/seed/alter-role-default.sql
    docker cp sql\seed-admin.sql $DbContainer:/seed/seed-admin.sql

    Write-Host "Applying SQL..."
    docker exec -i $DbContainer psql -U azor -d azor -v ON_ERROR_STOP=1 -f /seed/reset-db-login.sql
    docker exec -i $DbContainer psql -U azor -d azor -v ON_ERROR_STOP=1 -f /seed/alter-role-default.sql
    docker exec -i $DbContainer psql -U azor -d azor -v ON_ERROR_STOP=1 -f /seed/seed-admin.sql

    Write-Host "Verifying TCP auth to host:5434 (enter password 'azor' when prompted if asked)..."
    docker exec -it $DbContainer psql -U azor -h host.docker.internal -p 5434 -d azor -c "\conninfo"
