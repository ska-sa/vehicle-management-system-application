# Define variables for paths and container name (adjust paths as needed)
$BACKUP_FILE = "C:\Users\TheirUsername\vehicle-management-system-application\backups\backup_20250513_120000.sql"
$CONTAINER_NAME = "vehicle-management-system-application_postgres_1"
$DB_NAME = "VehicleManagementSystemDB"
$DB_USER = "admin"

# Check if the backup file exists
if (-Not (Test-Path $BACKUP_FILE)) {
    Write-Output "Backup file not found at $BACKUP_FILE. Please check the path and file name."
    exit 1
}

# Drop and recreate the database to avoid conflicts (optional, comment out if not needed)
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore the backup by piping the .sql file into psql
Get-Content $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

# Check if the restore was successful
if ($LASTEXITCODE -eq 0) {
    Write-Output "Database restore completed successfully."
} else {
    Write-Output "Error occurred during database restore. Check the logs for details."
}