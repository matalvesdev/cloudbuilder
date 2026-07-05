#!/bin/bash
# CloudBuilder — PostgreSQL Backup Script
# Usage: ./backup-db.sh [daily|hourly]
#
# Requires: pg_dump (via docker exec) or psql client
# Schedule via cron:
#   0 2 * * *  /path/to/scripts/backup-db.sh daily
#   0 * * * *  /path/to/scripts/backup-db.sh hourly

set -euo pipefail

BACKUP_TYPE="${1:-daily}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cloudbuilder}"
CONTAINER="${DB_CONTAINER:-cloudbuilder-postgres}"
DB_NAME="${DB_NAME:-cloudbuilder}"
DB_USER="${DB_USER:-cloudbuilder}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting ${BACKUP_TYPE} backup: ${FILENAME}"

# Create backup
docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --verbose \
    > "${BACKUP_DIR}/${FILENAME}"

FILESIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: ${FILENAME} (${FILESIZE})"

# Cleanup old backups
echo "[$(date -Iseconds)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
REMAINING=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] ${REMAINING} backup(s) remaining"

# Verify backup integrity
if docker exec "${CONTAINER}" pg_restore --list "${BACKUP_DIR}/${FILENAME}" > /dev/null 2>&1; then
    echo "[$(date -Iseconds)] Backup integrity: OK"
else
    echo "[$(date -Iseconds)] WARNING: Backup integrity check failed!"
    exit 1
fi

echo "[$(date -Iseconds)] Done."
