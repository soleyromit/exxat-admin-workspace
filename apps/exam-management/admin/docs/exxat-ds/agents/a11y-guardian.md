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
pnpm a11y:axe:report                   # markdown report
pnpm a11y:lighthouse                   # optional score-100 spot-check
```

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

**978/978** passed (163 routes × 6 ship variants) — zero WCAG 2.x AA axe violations.
