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

# Resolve to workspace root. Script may be symlinked from .git/hooks/post-merge,
# in which case BASH_SOURCE[0] points at the symlink (inside .git/hooks/) — we
# must follow it to find the real script in scripts/.
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  # If the symlink target is relative, resolve it against the symlink's dir
  [[ "$SOURCE" != /* ]] && SOURCE="$SCRIPT_DIR/$SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WORKSPACE_ROOT"

# git's post-merge contract passes $1 = 1 (squash) or 0 (regular) — NOT a ref.
# To diff the merge, use ORIG_HEAD..HEAD which git sets reliably.
PREV="ORIG_HEAD"
CURR="HEAD"

# Verify both refs resolve before diffing (defensive — first-merge has no ORIG_HEAD)
if ! git rev-parse --verify --quiet "$PREV" >/dev/null; then
  exit 0
fi

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
