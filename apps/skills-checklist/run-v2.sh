#!/usr/bin/env bash
# Starts the Skills Checklist connected prototype (v2) and tells you when it is ready.
# Usage: ./run-v2.sh   (from anywhere). Ctrl+C stops it.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=3007
URL="http://localhost:${PORT}/v2"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed. Install pnpm 10 (https://pnpm.io/installation), then run this again." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node 20 or newer is needed (the app targets Node 22). Found: $(node -v 2>/dev/null || echo none)." >&2
  exit 1
fi

cd "$ROOT/admin"
if [ ! -d node_modules ]; then
  echo "node_modules is missing. Installing with pnpm (one time, a few minutes)..."
  pnpm install
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} is already in use by:" >&2
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN | sed 's/^/  /' >&2
  echo "If that is this app, open ${URL}. Otherwise stop that process and run this again." >&2
  exit 1
fi

# Print "Ready" once the app answers, so you know when to open it. Gives up after 3 minutes or when the server stops.
PARENT=$$
(
  for _ in $(seq 1 180); do
    kill -0 "$PARENT" 2>/dev/null || exit 0
    if curl -fsS -o /dev/null --max-time 5 "$URL" 2>/dev/null; then
      echo ""
      echo "Ready: ${URL}"
      echo "The scenario starts at the overview. The Scenario menu (top bar) jumps to each of the 14 steps and has Reset demo."
      exit 0
    fi
    sleep 1
  done
  echo "Still not answering after 3 minutes. Check the output above for an error." >&2
) &

echo "Starting the Skills Checklist prototype on port ${PORT} (first load compiles, about 20 seconds)..."
exec pnpm dev
