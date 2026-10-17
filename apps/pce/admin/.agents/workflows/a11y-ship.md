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

4. **High contrast** — required when the change touches chrome, tokens, state styling, icons, or charts:

   ```bash
   pnpm a11y:axe:contrast   # axe × hc-light, hc-dark, hc-app-light, hc-app-dark
   pnpm a11y:hc             # non-text contrast (SC 1.4.11) × the same four
   ```

   axe measures **text** contrast only, so a green axe run proves nothing about invisible icons, flat chart series, or selected chips flattened into outlines. Both commands must pass. See skill **§ High-Contrast modes**.

5. **Pre-ship full matrix** (~25 min):

   ```bash
   pnpm a11y:axe:all --variants ship
   pnpm a11y:axe:report
   ```

6. Read `.axe-reports/<latest>/axe-a11y-report.md`.
7. Fix at **component level** in `packages/ui` when the violation is shared — not per-page patches.
8. Rebuild UI if package changed: `pnpm --filter @exxatdesignux/ui build`
9. Re-run until `978/978 passed` (or target routes pass).
10. Optional Lighthouse spot-check: `pnpm a11y:lighthouse`

## Pass criteria

- Zero axe violations for WCAG 2.x AA tags in every ship variant.
- `pnpm a11y:hc` reports every graphical object at or above 3:1, with **zero skipped routes** — a route that timed out is not a route that passed.
