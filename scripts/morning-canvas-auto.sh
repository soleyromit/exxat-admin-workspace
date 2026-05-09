#!/bin/bash
# Morning canvas trigger — fires daily via launchd.
# If new variant worktrees exist since last canvas generation,
# regenerates .review/canvas.html and opens it in the browser.
# Sends a macOS notification.
#
# Idempotent: only opens canvas if there's something new to show.
#
# Logs to ~/Library/Logs/exxat-morning-canvas.log

set -e

LOG="$HOME/Library/Logs/exxat-morning-canvas.log"
STATE="$HOME/.exxat-canvas-state"
WORKSPACE="/Users/romitsoley/Work"
CANVAS="$WORKSPACE/.review/canvas.html"

mkdir -p "$(dirname "$LOG")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

log "=== morning-canvas tick ==="

cd "$WORKSPACE"

# 1. Any variant branches?
VARIANT_BRANCHES=$(git branch --list 'variants/*' 2>/dev/null | wc -l | tr -d ' ')
if [ "$VARIANT_BRANCHES" -eq 0 ]; then
  log "no variant branches found — nothing to canvas"
  exit 0
fi

# 2. Newest variant commit timestamp
NEWEST_COMMIT=$(git for-each-ref --sort=-committerdate --format='%(committerdate:unix)' refs/heads/variants/ 2>/dev/null | head -1)
if [ -z "$NEWEST_COMMIT" ]; then
  log "no commits on variant branches — skipping"
  exit 0
fi

LAST_CANVAS=$(cat "$STATE" 2>/dev/null || echo 0)

if [ "$NEWEST_COMMIT" -le "$LAST_CANVAS" ]; then
  log "no new variant commits since last canvas (newest: $NEWEST_COMMIT, last: $LAST_CANVAS) — skipping"
  exit 0
fi

log "new variants detected (newest commit: $NEWEST_COMMIT, last canvas: $LAST_CANVAS)"

# 3. Check claude CLI
if ! command -v claude &> /dev/null; then
  log "ERROR: claude CLI not in PATH — cannot generate canvas"
  exit 1
fi

# 4. Generate canvas via headless claude
log "generating canvas via /morning-canvas"

claude --print "/morning-canvas --no-open" 2>&1 | tee -a "$LOG" || {
  log "ERROR: morning-canvas generation failed (exit $?)"
  exit 1
}

# 5. Verify canvas was written
if [ ! -f "$CANVAS" ]; then
  log "ERROR: $CANVAS not created — skill may have failed silently"
  exit 1
fi

# 6. Open in browser
if command -v open &> /dev/null; then
  open "$CANVAS"
  log "opened $CANVAS"
fi

# 7. Update state
echo "$NEWEST_COMMIT" > "$STATE"

# 8. Notification with variant count
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"$VARIANT_BRANCHES variants ready to review\" with title \"Variant canvas ready\" sound name \"Tink\"" 2>/dev/null || true
fi

log "canvas opened; state updated to $NEWEST_COMMIT"
log ""
