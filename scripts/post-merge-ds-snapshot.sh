#!/usr/bin/env bash
# Post-merge git hook — auto-regenerate ds-snapshot.json when DS submodules change.
#
# Triggered by: git checkout, git pull, git merge, git rebase
# Detects changes to exxat-ds/ or studentUX/ submodule pointers; regenerates
# docs/foundations/ds-snapshot.json so DS-010 verification stays current.
#
# Install: ln -sf "$PWD/scripts/post-merge-ds-snapshot.sh" .git/hooks/post-merge
# Or invoke manually: bash scripts/post-merge-ds-snapshot.sh
set -euo pipefail

# Resolve to workspace root (script may be symlinked from .git/hooks)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WORKSPACE_ROOT"

# Find prev → current commit range. The post-merge hook runs after a merge,
# so HEAD@{1} is the pre-merge state.
PREV="${1:-HEAD@{1}}"
CURR="HEAD"

# Did either DS submodule pointer change between PREV and CURR?
DS_CHANGED=0
for sub in "exxat-ds" "studentUX"; do
  if git diff --quiet "$PREV" "$CURR" -- "$sub" 2>/dev/null; then
    continue
  fi
  echo "[post-merge] DS submodule '$sub' changed → regenerate snapshot."
  DS_CHANGED=1
done

if [ "$DS_CHANGED" -eq 0 ]; then
  exit 0
fi

# Regenerate
if command -v python3 >/dev/null 2>&1; then
  python3 "$WORKSPACE_ROOT/scripts/ds-snapshot.py"
  echo "[post-merge] ds-snapshot.json regenerated."
  echo "[post-merge] git status: $(git status --short docs/foundations/ds-snapshot.json | head -1)"
else
  echo "[post-merge] ERROR: python3 not found; cannot regenerate snapshot."
  exit 1
fi
