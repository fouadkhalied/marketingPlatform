#!/bin/bash

# Configuration
DB_USER="postgres"
DB_NAME="marketingplatformdatabase"
BACKUP_DIR="/tmp/db_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
GDRIVE_DIR="gdrive:DatabaseBackups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database and compress
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Upload to Google Drive
rclone copy $BACKUP_FILE $GDRIVE_DIR

# Clean up local backup
rm $BACKUP_FILE

# Delete old backups from Google Drive
rclone delete $GDRIVE_DIR --min-age ${RETENTION_DAYS}d

echo "Backup completed: $(basename $BACKUP_FILE)"