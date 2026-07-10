#!/bin/bash
#
# Pre-commit CSS validation: confirm @custom-variant block present in all product CSS entry points.
# Run from monorepo root. Exits non-zero if any entry point is missing the sentinel.
#
# Wire to git pre-commit hook:
#   echo "bash /Users/romitsoley/Work/scripts/check-ds-variants.sh" >> .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

SENTINEL="@custom-variant data-open"
FAILED=0
CHECKED=0

CSS_ENTRY_POINTS=(
  "apps/exam-management/assessment-taker/src/index.css"
  "apps/exam-management/admin/app/globals.css"
  "apps/pce/admin/app/globals.css"
  "apps/pce/student/app/globals.css"
  "apps/portal/app/globals.css"
)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "DS variant check — verifying @custom-variant block in product CSS entry points"
echo ""

for rel in "${CSS_ENTRY_POINTS[@]}"; do
  abs="$REPO_ROOT/$rel"
  CHECKED=$((CHECKED + 1))

  if [ ! -f "$abs" ]; then
    echo "  SKIP  $rel (file not found)"
    continue
  fi

  if grep -q "$SENTINEL" "$abs"; then
    echo "  OK    $rel"
  else
    echo "  FAIL  $rel — missing @custom-variant block"
    echo "         DS Tabs/Dialog/Sheet/Select/Checkbox states will be broken in browser."
    echo "         Restore from: shared/ds-tailwind-variants.css"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "Checked: $CHECKED | Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "Commit blocked. Restore the @custom-variant block in the files above."
  echo "Canonical block: shared/ds-tailwind-variants.css"
  echo "Full reference: docs/governance/ds-product-compatibility.md"
  exit 1
fi

exit 0
