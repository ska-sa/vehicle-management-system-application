#!/bin/sh

# Set environment variables for pg_dump
export PGPASSWORD=$POSTGRES_PASSWORD

# Create a timestamp for the backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/backup_${TIMESTAMP}.sql"

# Run pg_dump to create the backup
pg_dump -h postgres -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

# Check if the backup was successful
if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
else
    echo "Backup failed" >&2
    exit 1
fi

