---
description: Run axe ship matrix, read report, fix at component level, re-scan until zero violations.
---

# /a11y-ship — Accessibility gate

## Steps

1. Ensure dev server: `pnpm dev:web` → http://127.0.0.1:4000
2. Load `.agents/skills/exxat-accessibility/SKILL.md`.
3. **Smoke** (while iterating):

   ```bash
   pnpm a11y:axe
   pnpm a11y:axe /design-os/library   # routes you changed
   ```

4. **Pre-ship full matrix** (~25 min):

   ```bash
   pnpm a11y:axe:all --variants ship
   pnpm a11y:axe:report
   ```

5. Read `.axe-reports/<latest>/axe-a11y-report.md`.
6. Fix at **component level** in `packages/ui` when the violation is shared — not per-page patches.
7. Rebuild UI if package changed: `pnpm --filter @exxatdesignux/ui build`
8. Re-run until `978/978 passed` (or target routes pass).
9. Optional Lighthouse spot-check: `pnpm a11y:lighthouse`

## Pass criteria

Zero axe violations for WCAG 2.x AA tags in every ship variant.
