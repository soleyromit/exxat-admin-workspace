#!/bin/bash
# Install local a11y tooling per docs/governance/claude-practices.md
# "A11Y tooling roadmap" P0 items. Run interactively — does not auto-run
# on commit. User invokes when ready.
#
# What this installs:
#   - eslint-plugin-jsx-a11y       in admin/student app devDeps
#   - @axe-core/react              in admin/student app devDeps (dev-mode)
#   - eslint.config.mjs (flat)     extends next/core-web-vitals +
#                                  jsx-a11y/recommended
#   - app/_axe-core-bootstrap.tsx  4-line dev-only axe-core mount
#
# Re-runnable: skips already-installed steps. No-op if app not scaffolded.

set -e

cd "$(git rev-parse --show-toplevel)"

YELLOW='\033[33m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'

# Apps to instrument (active builds only — extend as products go active)
APPS=(
  "apps/exam-management/admin"
  "apps/pce/admin"
  # "apps/exam-management/student"
  # "apps/pce/student"
)

for app in "${APPS[@]}"; do
  if [ ! -f "$app/package.json" ]; then
    printf "${YELLOW}skip${RESET} $app — not scaffolded\n"
    continue
  fi

  printf "${GREEN}>>> $app${RESET}\n"

  # 1. Install dependencies (idempotent — pnpm skips if already present)
  pushd "$app" > /dev/null
  pnpm add -D eslint-plugin-jsx-a11y @axe-core/react 2>&1 | tail -5
  popd > /dev/null

  # 2. Drop ESLint flat config if missing
  if [ ! -f "$app/eslint.config.mjs" ]; then
    cat > "$app/eslint.config.mjs" <<'CONFIG'
import { FlatCompat } from '@eslint/eslintrc'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      // Tighten over time; start with recommended baseline.
      // Strict-mode candidates:
      // 'jsx-a11y/no-autofocus': 'error',
      // 'jsx-a11y/click-events-have-key-events': 'error',
      // 'jsx-a11y/no-noninteractive-element-interactions': 'error',
    },
  },
]
CONFIG
    printf "  ✓ wrote $app/eslint.config.mjs\n"
  else
    printf "  ✓ eslint.config.mjs already present\n"
  fi

  # 3. axe-core dev bootstrap — only in admin app's app/layout.tsx area
  bootstrap="$app/lib/axe-core-bootstrap.ts"
  if [ ! -f "$bootstrap" ]; then
    mkdir -p "$(dirname "$bootstrap")"
    cat > "$bootstrap" <<'BOOT'
// Dev-only axe-core mount. Logs WCAG violations to console during pnpm dev.
// Tree-shaken in production builds.
//
// Wire-up: add to app/layout.tsx top-level:
//   if (process.env.NODE_ENV !== 'production') {
//     import('@/lib/axe-core-bootstrap')
//   }
//
// Configure: see https://www.npmjs.com/package/@axe-core/react

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Dynamic import to keep production bundle clean
  void import('react').then(async (React) => {
    const ReactDOM = await import('react-dom')
    const axe = (await import('@axe-core/react')).default
    // 1000ms throttle — adjust per app responsiveness
    axe(React, ReactDOM, 1000)
  })
}

export {}
BOOT
    printf "  ✓ wrote $bootstrap\n"
  else
    printf "  ✓ axe-core-bootstrap already present\n"
  fi

  # 4. Lint check — surface count of issues without blocking
  pushd "$app" > /dev/null
  printf "  ${YELLOW}running lint to surface a11y issues...${RESET}\n"
  set +e
  pnpm lint 2>&1 | grep -E "(jsx-a11y|warning|error)" | head -10 || true
  set -e
  popd > /dev/null

  echo
done

echo "Done. Next steps:"
echo "  1. Wire axe-core in app/layout.tsx of each app:"
echo "     if (process.env.NODE_ENV !== 'production') {"
echo "       import('@/lib/axe-core-bootstrap')"
echo "     }"
echo "  2. Run pnpm dev and watch console for runtime a11y violations"
echo "  3. Run pnpm lint per app — fix or downgrade noisy jsx-a11y rules"
echo "  4. Lighthouse CI a11y gate (≥0.90) is already wired in"
echo "     .github/workflows/lighthouse.yml"
