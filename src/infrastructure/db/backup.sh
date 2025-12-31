#!/bin/bash

# Load environment variables from .env file
if [ -f ~/marketingPlatform/.env ]; then
    export $(cat ~/marketingPlatform/.env | grep -v '^#' | xargs)
fi

# Configuration (now uses environment variables)
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-marketingplatformdatabase}"
BACKUP_DIR="/tmp/db_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
GDRIVE_DIR="gdrive:DatabaseBackups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database (PGPASSWORD is already exported)
pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

if [ $? -ne 0 ]; then
    echo "ERROR: Database dump failed!"
    exit 1
fi

# Upload to Google Drive
rclone copy $BACKUP_FILE $GDRIVE_DIR

if [ $? -ne 0 ]; then
    echo "ERROR: Upload to Google Drive failed!"
    exit 1
fi

# Clean up
rm $BACKUP_FILE

# Delete old backups
rclone delete $GDRIVE_DIR --min-age ${RETENTION_DAYS}d

echo "Backup completed successfully: $(basename $BACKUP_FILE)"