# CLAUDE.md — Exxat DS Workspace

> Loaded every message. **Full rules + config:** `docs/CLAUDE-RULES.md` (lazy). **DS APIs:** `docs/CLAUDE-DS-REFERENCE.md` (lazy — read before any UI code).

## Identity
Romit Soley (Product Designer II, Exxat). Main branch = Himanshu Suthar (Engineering). Never merge to main without Himanshu review.

## Repo
`/Users/romitsoley/Work/` — monorepo root
- `exxat-ds/packages/ui/src/` — Admin DS submodule (READ ONLY, NEVER EDIT)
- `studentUX/src/` — Student DS submodule (READ ONLY, NEVER EDIT)
- `apps/<product>/{admin,student}/` — product apps
- `docs/` — spec, registries, governance, patterns, watch system

## Products
Active: `exam-management` (3001), `pce` (3005), `portal` (3100). See `docs/PRODUCTS.md` for full registry.

## DS Imports
**Admin:** `import { Button, ... } from '@exxat/ds/packages/ui/src'` · CSS: `@import '../../../../exxat-ds/packages/ui/src/theme.css'`
**Student:** `import { Button } from '@exxat/student/components/ui/button'` · CSS: `@import '../../../../studentUX/src/styles/globals.css'`

## Dev Server
```bash
cd /Users/romitsoley/Work/apps/<product>/<admin|student> && pnpm dev
```
No `package.json` at monorepo root — `pnpm --filter` does NOT work from there.

## Non-negotiable rules (hooks will block commits on violations)
- NEVER edit `exxat-ds/` or `studentUX/`
- NEVER use raw `<button>` — DS `Button` with explicit `variant` + `size`
- NEVER hardcode hex/rgb — use `var(--token)`
- NEVER build raw `<table>` or recreate DataTable/KeyMetrics/Button/Badge/Dialog — import or vendor per registry
- NEVER use toast for product feedback — use `LocalBanner`
- ALWAYS `'use client'` on interactive components
- ALWAYS `aria-hidden="true"` on FA icons; `aria-label` on icon-only buttons
- Before new component: spawn `ds-adoption-reviewer` subagent
- Before claiming done: spawn `verification-reviewer` subagent
- Granola decisions: always `get_meeting_transcript` raw, never summaries. "Adi" = Aarti.

## Key tokens (80% of UI work — full table in `docs/CLAUDE-DS-REFERENCE.md`)
`--background` `--foreground` `--card` `--muted` `--muted-foreground` `--border` `--border-control-35` `--brand-color` `--brand-tint` `--primary` `--destructive` `--ring` `--radius` `--control-height`

## 10. Workspace Doc Map (lazy-load — read only when relevant)
| Doc | Read when |
|---|---|
| `docs/CLAUDE-RULES.md` | Full always/never list, DS source rules, workspace config, new product setup, font loading, verification patterns |
| `docs/CLAUDE-DS-REFERENCE.md` | Any UI code — tokens, component APIs, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term / Master Course pages |
| `docs/PRODUCTS.md` | Need ports, owners, package names |
| `docs/watch/ds-snapshot.json` | DS component variants/sizes/props lookup |
| `docs/governance/verification-discipline.md` | Before claiming done |
| `apps/<product>/CLAUDE.md` | Per-product rules |
| `apps/<product>/docs/patterns/*.md` | Per-product UI patterns (load only for that product) |
