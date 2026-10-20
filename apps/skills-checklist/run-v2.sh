#!/usr/bin/env bash
# Starts the Skills Checklist admin app and prints the v2 prototype URL.
# Usage: ./run-v2.sh   (from anywhere)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/admin"
if [ ! -d node_modules ]; then
  echo "node_modules missing, installing with pnpm..."
  pnpm install
fi
if lsof -i :3007 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port 3007 is already in use. Stop that process or open http://localhost:3007/v2 if it is this app." >&2
  exit 1
fi
echo "Connected prototype v2: http://localhost:3007/v2"
exec pnpm dev
