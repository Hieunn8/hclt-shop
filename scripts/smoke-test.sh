#!/usr/bin/env bash
set -euo pipefail
curl -fsS "${FRONTEND_URL:-http://localhost:3000}" >/dev/null
curl -fsS "${FRONTEND_URL:-http://localhost:3000}/api/health" >/dev/null
echo "Smoke test passed"
