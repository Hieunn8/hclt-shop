#!/usr/bin/env bash
set -euo pipefail

branch_or_tag="${1:-main}"
git fetch --all --tags
git checkout "$branch_or_tag"
git pull --ff-only || true
pnpm install
pnpm lint
pnpm typecheck
pnpm test
bash scripts/deploy.sh
