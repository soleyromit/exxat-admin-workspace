#!/bin/bash
# Overnight variants trigger — fires nightly via launchd.
# Picks up the newest brief in ~/Inbox/briefs/, dispatches /design-variants
# in headless Claude Code mode, logs result.
#
# Skips silently if:
#   - No briefs in inbox
#   - Newest brief already processed (older than last_run timestamp)
#   - claude CLI unavailable
#
# Logs to ~/Library/Logs/exxat-overnight-variants.log

set -e

LOG="$HOME/Library/Logs/exxat-overnight-variants.log"
INBOX="$HOME/Inbox/briefs"
STATE="$HOME/.exxat-overnight-state"
WORKSPACE="/Users/romitsoley/Work"
N_VARIANTS="${EXXAT_OVERNIGHT_N:-15}"
MODE="${EXXAT_OVERNIGHT_MODE:-spec}"

mkdir -p "$(dirname "$LOG")" "$INBOX"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

log "=== overnight-variants tick ==="

# 1. Inbox empty?
if [ -z "$(ls -A "$INBOX"/*.md 2>/dev/null)" ]; then
  log "no briefs in $INBOX — skipping"
  exit 0
fi

# 2. Find newest brief
NEWEST=$(ls -t "$INBOX"/*.md 2>/dev/null | head -1)
if [ -z "$NEWEST" ]; then
  log "no .md briefs found — skipping"
  exit 0
fi

NEWEST_MTIME=$(stat -f %m "$NEWEST")
LAST_RUN=$(cat "$STATE" 2>/dev/null || echo 0)

if [ "$NEWEST_MTIME" -le "$LAST_RUN" ]; then
  log "newest brief ($NEWEST) older than last run ($LAST_RUN) — skipping"
  exit 0
fi

log "processing brief: $NEWEST (mtime: $NEWEST_MTIME)"

# 3. Check claude CLI
if ! command -v claude &> /dev/null; then
  log "ERROR: claude CLI not in PATH — cannot dispatch variants. Skipping."
  exit 1
fi

# 4. Read brief content
BRIEF=$(cat "$NEWEST")
if [ -z "$BRIEF" ]; then
  log "WARN: brief is empty — skipping"
  exit 0
fi

if [ ${#BRIEF} -lt 30 ]; then
  log "WARN: brief shorter than 30 chars — likely incomplete. Skipping."
  exit 0
fi

# 5. Dispatch via headless claude (--print runs prompt non-interactively)
log "dispatching: /design-variants $N_VARIANTS $MODE [brief truncated]"

cd "$WORKSPACE"

# Use --print mode (headless). Captures full prompt + response in log.
# claude --print emits to stdout; we tee to log and discard interactive prompts.
claude --print "/design-variants $N_VARIANTS $MODE $BRIEF" 2>&1 | tee -a "$LOG" || {
  log "ERROR: claude invocation failed (exit $?)"
  exit 1
}

# 6. Update state
echo "$NEWEST_MTIME" > "$STATE"

# 7. macOS notification (silent if osascript unavailable)
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"$N_VARIANTS variants generating from brief: $(basename "$NEWEST")\" with title \"Overnight variants started\"" 2>/dev/null || true
fi

log "dispatch complete; state updated to $NEWEST_MTIME"
log ""
