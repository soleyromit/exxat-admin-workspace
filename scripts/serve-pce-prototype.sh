#!/bin/bash
# Serve the PCE prototype (8-persona static HTML) at http://localhost:8000
# Per Romit 2026-05-09: keep this version handy for reference whenever
# we want to compare against the production Next.js app or build new
# screens from prior validated patterns.
#
# Usage:
#   bash scripts/serve-pce-prototype.sh           # default :8000
#   PORT=8765 bash scripts/serve-pce-prototype.sh # custom port

set -e

PORT="${PORT:-8000}"
WORKSPACE="$(git rev-parse --show-toplevel)"
PROTOTYPE_DIR="$WORKSPACE/apps/pce/prototype"

if [ ! -f "$PROTOTYPE_DIR/pce-evaluation.html" ]; then
  echo "ERROR: $PROTOTYPE_DIR/pce-evaluation.html not found"
  exit 1
fi

# Kill anything already on the port (idempotent restart)
existing=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$existing" ]; then
  echo "Port $PORT in use (PID $existing) — stopping..."
  kill $existing 2>/dev/null || true
  sleep 1
fi

LOG="/tmp/pce-prototype-$PORT.log"
nohup bash -c "cd '$PROTOTYPE_DIR' && python3 -m http.server $PORT" > "$LOG" 2>&1 &
PID=$!

# Wait for server to come up
for _ in 1 2 3 4 5; do
  if curl -s -o /dev/null http://localhost:$PORT/ 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "✓ PCE prototype running on http://localhost:$PORT (PID $PID)"
echo
echo "  Index:                http://localhost:$PORT/"
echo "  Canonical 8-persona:  http://localhost:$PORT/pce-evaluation.html"
echo "  Reference autopilot:  http://localhost:$PORT/_reference/pce-autopilot.html"
echo "  Reference interactive:http://localhost:$PORT/_reference/pce-interactive.html"
echo
echo "  Logs: $LOG"
echo "  Stop: kill $PID    (or: kill \$(lsof -ti :$PORT))"
