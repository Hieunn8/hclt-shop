#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  echo "Docker already installed"
else
  echo "Install Docker Engine/Compose plugin before deploy, or extend this script for your OS image." >&2
fi

sudo mkdir -p /opt/aivisionary/{releases,shared,backups}
if [[ "${CREATE_SWAP:-false}" == "true" && ! -f /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
echo "Server directories ready"
