#!/usr/bin/env bash
set -euo pipefail

frontend_url="${FRONTEND_HEALTH_URL:-http://localhost:3000/api/health}"
for i in {1..24}; do
  if curl -fsS "$frontend_url" >/dev/null; then
    echo "Frontend healthy: $frontend_url"
    exit 0
  fi
  sleep 5
done
echo "Frontend health check failed: $frontend_url" >&2
exit 1
