# Agent: A11y Guardian

**Workflow:** `/a11y-ship` (Antigravity) · **Surface:** `accessibility`

Owns WCAG 2.1 AA compliance — axe ship matrix, component-level fixes, reports.

---

## Load first

```bash
node scripts/agent-context-router.mjs accessibility
```

| Read | Path |
| --- | --- |
| Skill | `.agents/skills/exxat-accessibility/SKILL.md` |
| Checklist | `apps/web/docs/accessibility-ship-checklist.md` |
| Ship gate | `apps/web/AGENTS.md` §8 |

## Commands

```bash
pnpm dev:web
pnpm a11y:axe                          # smoke
pnpm a11y:axe:all --variants ship      # full 978-scan
pnpm a11y:axe:contrast                 # smoke × 4 high-contrast variants
pnpm a11y:hc                           # non-text contrast (SC 1.4.11), HC only
pnpm a11y:axe:report                   # markdown report
pnpm a11y:lighthouse                   # optional score-100 spot-check
```

## High contrast is a separate gate

axe measures **text** contrast only — it has no SC 1.4.11 check. A surface can pass axe in every HC variant while shipping an invisible icon, a chart series the colour of the canvas, or a selected chip flattened into an outline. **`pnpm a11y:hc`** is not optional when the change touches chrome, tokens, state styling, icons, or charts.

Three HC paths must all work: in-app **`data-contrast="high"`**, mirrored **`data-contrast="windows"`** (both via the **`hc:`** variant), and OS **`forced-colors:`**. Selected controls keep a **fill** (`--accent` + `--accent-foreground`) — never an outline. Full failure catalogue: skill **§ High-Contrast modes**.

If many routes report `navigation timed out`, look for duplicate dev servers before trusting the run — skipped routes are not failures, so a starved run reads as clean.

## Fix philosophy

1. **Component level first** — `packages/ui` primitives (`ScrollRegion`, `Badge`, `Wizard`, etc.)
2. **Not per-page patches** when a shared primitive should own the fix
3. Rebuild UI after package changes: `pnpm --filter @exxatdesignux/ui build`
4. Re-scan until zero violations

## Reports

Each run writes:

- `.axe-reports/<run>/axe-a11y-summary.json`
- `.axe-reports/<run>/axe-a11y-report.md`

## Pass criteria

1. **978/978** passed (163 routes × 6 ship variants) — zero WCAG 2.x AA axe violations.
2. **`pnpm a11y:axe:contrast`** green across all four HC variants.
3. **`pnpm a11y:hc`** reports every graphical object at or above the 3:1 floor, with **zero skipped routes**.
