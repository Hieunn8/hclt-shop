#!/usr/bin/env bash
set -euo pipefail

required=(NEXT_PUBLIC_SITE_URL STRAPI_INTERNAL_URL REVALIDATE_SECRET RATE_LIMIT_SALT)
missing=0
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" || "${!key:-}" == *"<required"* || "${!key:-}" == "change-me"* ]]; then
    echo "Missing or placeholder env: $key" >&2
    missing=1
  fi
done

if [[ "${REDIS_CACHE_DISABLED:-false}" != "true" ]]; then
  if [[ -z "${REDIS_URL:-}" || "${REDIS_URL:-}" == *"<required"* || "${REDIS_URL:-}" == "change-me"* ]]; then
    echo "Missing or placeholder env: REDIS_URL" >&2
    missing=1
  fi
fi

if [[ "${DATABASE_HOST:-}" == "13.140.130.137" && "${ALLOW_PRODUCTION_DB:-false}" != "true" ]]; then
  echo "Refusing production database host without ALLOW_PRODUCTION_DB=true" >&2
  missing=1
fi

exit "$missing"
