#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
if [[ -f deploy/env/frontend.env ]]; then set -a; source deploy/env/frontend.env; set +a; fi
bash scripts/verify-env.sh

release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD 2>/dev/null || echo local)"
echo "Deploying release $release_id"
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d
bash scripts/healthcheck.sh
mkdir -p deploy/releases
echo "$release_id" > deploy/releases/current
echo "Release $release_id healthy"
