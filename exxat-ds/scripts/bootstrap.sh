#!/usr/bin/env bash
# One-shot setup: GitHub auth (gh) → clone private repo → Corepack pnpm → pnpm install
#
# Private repo: do NOT curl raw.githubusercontent.com — use gh (authenticated).
# macOS (install node + gh, then run) — see README Quick Start:
#   brew install node gh && gh api -H "Accept: application/vnd.github.raw" \
#     "/repos/ExxatDesign/Exxat-DS-Workspace/contents/scripts/bootstrap.sh?ref=main" | bash \
#     && cd Exxat-DS-Workspace && pnpm dev:web
# If node+gh already installed:
#   gh api ... | bash && cd Exxat-DS-Workspace && pnpm dev:web
#
# Or clone first, then:
#   gh repo clone ExxatDesign/Exxat-DS-Workspace && cd Exxat-DS-Workspace && bash scripts/bootstrap.sh
# From an existing clone (repo root): bash scripts/bootstrap.sh   OR   pnpm bootstrap

set -euo pipefail

REPO_SLUG="ExxatDesign/Exxat-DS-Workspace"
FOLDER="Exxat-DS-Workspace"
PNPM_VER="10.33.0"

die() {
  echo "Error: $*" >&2
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  echo "" >&2
  echo "Node.js is not installed or not on your PATH." >&2
  echo "Install Node.js 20 LTS first, then re-run this command:" >&2
  echo "  macOS (Homebrew):  brew install node" >&2
  echo "  Or download:       https://nodejs.org/  (choose LTS)" >&2
  echo "  Then verify:       node -v   (should show v20.x or higher)" >&2
  echo "" >&2
  exit 1
fi

node -e "const m=+(process.version.match(/^v(\d+)/)||[])[1]; process.exit(m>=20?0:1)" 2>/dev/null ||
  die "Node 20+ required. You have $(node -v). Install newer Node: https://nodejs.org/ or brew install node"

is_repo_root() {
  [[ -f package.json ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"exxat-ds-workspace"' package.json
}

if is_repo_root; then
  REPO_ROOT=$(pwd -P)
  echo "Already in Exxat DS workspace: $REPO_ROOT"
else
  if command -v gh >/dev/null 2>&1; then
    if ! gh auth status >/dev/null 2>&1; then
      echo "Sign in to GitHub (browser)…"
      gh auth login
    fi
    if [[ -d $FOLDER ]] && [[ -f $FOLDER/package.json ]]; then
      echo "Using existing ./$FOLDER"
      cd "$FOLDER"
    else
      if [[ -e $FOLDER ]]; then
        die "./$FOLDER exists and is not a valid clone. Remove it or choose another directory."
      fi
      echo "Cloning $REPO_SLUG …"
      gh repo clone "$REPO_SLUG" "$FOLDER"
      cd "$FOLDER"
    fi
  else
    die "Install GitHub CLI: https://cli.github.com/ (e.g. brew install gh). For a private repo it is the simplest way to authenticate. Alternative: git clone manually, cd into the repo, then run: bash scripts/bootstrap.sh"
  fi
  REPO_ROOT=$(pwd -P)
fi

echo "Enabling pnpm ${PNPM_VER} (corepack)…"
corepack enable
corepack prepare "pnpm@${PNPM_VER}" --activate

echo "Installing workspace dependencies…"
pnpm install

echo ""
echo "✓ Setup complete: $REPO_ROOT"
echo ""
echo "  Start the app:  cd \"$REPO_ROOT\" && pnpm dev:web"
echo "  → http://localhost:3000"
