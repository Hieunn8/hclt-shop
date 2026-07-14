#!/usr/bin/env bash
set -euo pipefail

backup="${1:-}"
if [[ -z "$backup" || "${RESTORE_CONFIRM:-}" != "yes" ]]; then
  echo "Usage: RESTORE_CONFIRM=yes scripts/restore-db.sh <backup.dump>" >&2
  exit 1
fi
if [[ ! -f "$backup" ]]; then
  echo "Backup not found: $backup" >&2
  exit 1
fi
PGPASSWORD="${DATABASE_PASSWORD:-}" pg_restore --clean --if-exists -h "$DATABASE_HOST" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USERNAME:-postgres}" -d "$DATABASE_NAME" "$backup"
echo "Restore completed from $backup"
