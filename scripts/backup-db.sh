#!/usr/bin/env bash
set -euo pipefail

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$backup_dir/aivisionary-$timestamp.dump"

if [[ -z "${DATABASE_HOST:-}" || -z "${DATABASE_NAME:-}" ]]; then
  echo "Dry-run backup: DATABASE_HOST/DATABASE_NAME not set. Would write $file"
  exit 0
fi

PGPASSWORD="${DATABASE_PASSWORD:-}" pg_dump -h "$DATABASE_HOST" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USERNAME:-postgres}" -Fc "$DATABASE_NAME" > "$file"
echo "Backup written: $file"
