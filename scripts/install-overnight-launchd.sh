#!/bin/bash
# One-time installer for overnight variants automation.
# Symlinks the tracked launchd plists into ~/Library/LaunchAgents/
# and loads them so they fire on schedule.
#
# After this runs, the workflow is fully automatic:
#   - 11pm nightly: ~/Inbox/briefs/<newest>.md → /design-variants 15 spec
#   - 7am daily:    if new variant commits exist → opens /morning-canvas
#                    canvas in browser + sends notification
#
# Idempotent: re-running unloads the old version + reloads the new.

set -e

WORKSPACE="$(git rev-parse --show-toplevel)"
SRC="$WORKSPACE/scripts/launchd"
DST="$HOME/Library/LaunchAgents"

GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

mkdir -p "$DST"
mkdir -p "$HOME/Inbox/briefs"
mkdir -p "$HOME/Library/Logs"

# Sanity: claude CLI in PATH?
if ! command -v claude &> /dev/null; then
  echo -e "${RED}WARN${RESET}: claude CLI not in PATH."
  echo "  The overnight scripts will skip until claude is installed."
  echo "  Install: https://claude.com/claude-code"
  echo ""
fi

for plist in "$SRC"/*.plist; do
  [ -f "$plist" ] || continue
  name=$(basename "$plist")
  target="$DST/$name"

  # Unload if already loaded (so we can update)
  if launchctl list | grep -q "${name%.plist}"; then
    echo -e "  unloading existing: ${name%.plist}"
    launchctl unload "$target" 2>/dev/null || true
  fi

  # Symlink (so updates to the tracked plist propagate)
  if [ -L "$target" ]; then
    rm "$target"
  elif [ -f "$target" ]; then
    backup="$target.workspace-backup-$(date +%s)"
    echo -e "${YELLOW}backing up existing $name to $backup${RESET}"
    mv "$target" "$backup"
  fi

  ln -s "$plist" "$target"
  echo -e "  installed: $target → ${plist#$WORKSPACE/}"

  # Load
  launchctl load "$target"
  echo -e "  ${GREEN}loaded${RESET}"
done

# Make scripts executable
chmod +x "$WORKSPACE/scripts/overnight-variants.sh"
chmod +x "$WORKSPACE/scripts/morning-canvas-auto.sh"

echo
echo -e "${GREEN}✓${RESET} Overnight automation installed."
echo
echo "  Tonight at 11pm: if ~/Inbox/briefs/ has a brief newer than last run,"
echo "                   variants will dispatch in the background."
echo "  Tomorrow at 7am: if new variant commits exist, canvas opens in browser"
echo "                   + you get a desktop notification."
echo
echo "  Try it: write a brief to ~/Inbox/briefs/$(date +%Y-%m-%d)-test.md"
echo "          and confirm by reading the log at ~/Library/Logs/exxat-overnight-variants.log"
echo "          after 11pm tonight."
echo
echo "  Uninstall:"
echo "    launchctl unload $DST/com.exxat.overnight-variants.plist"
echo "    launchctl unload $DST/com.exxat.morning-canvas.plist"
echo "    rm $DST/com.exxat.overnight-variants.plist"
echo "    rm $DST/com.exxat.morning-canvas.plist"
echo
echo "  Logs:"
echo "    ~/Library/Logs/exxat-overnight-variants.log"
echo "    ~/Library/Logs/exxat-morning-canvas.log"
