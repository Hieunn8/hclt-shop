#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
target="${1:-previous}"
echo "Rolling back containers to $target. Database rollback is not automatic; use restore-db.sh with an explicit backup if needed."
docker compose -f deploy/docker-compose.yml up -d
bash scripts/healthcheck.sh
