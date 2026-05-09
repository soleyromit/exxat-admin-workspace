#!/bin/bash
# Install workspace git hooks. Run once after cloning.
#
# Symlinks .git/hooks/pre-commit -> scripts/git-hooks/pre-commit so the
# audits + digest regen run automatically on every commit.

set -e

cd "$(git rev-parse --show-toplevel)"

HOOKS_SRC="scripts/git-hooks"
HOOKS_DST=".git/hooks"

if [ ! -d "$HOOKS_SRC" ]; then
  echo "ERROR: $HOOKS_SRC not found — run from repo root"
  exit 1
fi

mkdir -p "$HOOKS_DST"

installed=0
for hook_path in "$HOOKS_SRC"/*; do
  [ -f "$hook_path" ] || continue
  name=$(basename "$hook_path")
  target="$HOOKS_DST/$name"
  src="../../$hook_path"

  if [ -L "$target" ]; then
    rm "$target"
  elif [ -f "$target" ]; then
    backup="$target.workspace-backup-$(date +%s)"
    echo "  Backing up existing $name to $backup"
    mv "$target" "$backup"
  fi

  ln -s "$src" "$target"
  chmod +x "$hook_path"
  echo "  installed: $target -> $src"
  installed=$((installed + 1))
done

if [ "$installed" -eq 0 ]; then
  echo "(no hooks to install)"
else
  echo
  echo "✓ Installed $installed hook(s). They run automatically on every git commit."
  echo "  Bypass any time with: git commit --no-verify"
fi
