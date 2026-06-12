# CLAUDE.md — Exxat DS Workspace

> Loaded every message. **Full rules + config:** `docs/CLAUDE-RULES.md` (lazy). **DS APIs (real, before any UI code):** `node tools/ds/source.mjs <Component>` (installed `@exxatdesignux/ui` — props/variants + live `localhost:4000/library/<id>`). Tokens: `@exxatdesignux/ui/src/globals.css`. Visual match: `node tools/visual-check/visual-diff.mjs`.

## Session Start — Self-Briefing (run before every task)

Before doing anything, ask yourself these questions and answer them from memory:

1. **What have I repeatedly failed on for this type of work?**
   Read `MEMORY.md` — surface the top 2 feedback entries relevant to the task.
2. **What does the discipline log say I keep skipping?**
   Check `docs/governance/verification-discipline.md` — which patterns (A-J) are most recent?
3. **What did Romit correct me on last time we worked on this product?**
   Check `MEMORY.md` for project + feedback entries for this product.

If any of these surface a recurring failure: state it explicitly at the top of the response.
Do not wait for Romit to remind you. Surface it yourself first.

## Identity
Romit Soley (Product Designer II, Exxat). Main branch = Himanshu Suthar (Engineering). Never merge to main without Himanshu review.

## Repo
`/Users/romitsoley/Work/` — monorepo root
- `exxat-ds/packages/ui/src/` — Admin DS submodule (READ ONLY, NEVER EDIT — legacy reference only)
- `studentUX/src/` — Student DS submodule (READ ONLY, NEVER EDIT)
- `@exxatdesignux/ui` — **new canonical Admin DS package** (npm, source of truth for all products)
- `apps/<product>/{admin,student}/` — product apps
- `docs/` — spec, registries, governance, patterns, watch system

## Products
Active: `exam-management` (3001), `pce` (3005), `portal` (3100). See `docs/PRODUCTS.md` for full registry.

## DS Imports
**Admin:** `import { Button, ... } from '@exxatdesignux/ui'` · CSS: `@import '@exxatdesignux/ui/globals.css'`
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
- Granola decisions: always `get_meeting_transcript` raw, never summaries. "Adi" = Aarti.

## Sequential Design Protocol (non-negotiable — full spec: `docs/governance/design-review-protocol.md`)

**Pre-task declaration (BEFORE touching any file — no exceptions):**
Write this block before any code:
```
File: <path>
Current DS violations: <list or "none found">
Hand-rolled with DS equivalent: <list or "none">
WCAG issues (static read): <list or "none found">
```
Anchors the session. Prevents hallucination about what existed before the edit.

**Gate 1 — Before writing any JSX:**
1. `query_granola_meetings` for the entity/feature → pull raw transcript if hits found → extract decisions, scope constraints, UX directives
2. Read per-product `ui-patterns.md` + `docs/governance/design-anti-patterns.md` + `docs/governance/component-consistency.md`
3. Run `node tools/ds/source.mjs <Component…>` — the REAL installed `@exxatdesignux/ui` API (props/variants/sizes) + live `localhost:4000/library/<id>` URL. Authoritative over `ds-snapshot.json` / `*-reference.md`, which drift. Generate AGAINST this, not from memory.
4. Spawn `ds-adoption-reviewer` before any new component file

**Gate 2 — After any UI-touching change, before claiming done:**
1. Self-review against 10-point component-consistency checklist (`component-consistency.md §10`)
2. Transcript alignment — cross-check implementation against Gate 1 Granola decisions (✅ match / ⚠ assumption / ❌ contradiction)
3. Spawn `ds-conformance-reviewer` — the **single post-UI gate** (runs `visual-diff.mjs` vs localhost:4000 + token conformance + axe a11y across interaction states + static WCAG/FERPA grep). **Paste its literal DS-MATCH/GREENLIGHT or DEVIATIONS/NEEDS-MORE verdict.** "I spawned it" without output = not run. Enforced by the `Stop` hook `ds-claim-gate.py`: emitting the verdict token **`GREENLIGHT (runtime)`** without a fresh (≤30 min) `visual-diff.mjs` run that reported **DS-MATCH** is BLOCKED. The gate keys only off that deliberate token (not loose prose like "matches the DS"), so discussing the DS or reporting deviations is fine. If a server is down, use `GREENLIGHT (static) — NOT visually verified`.
4. Spawn `state-review` for any list/form/async page — **paste literal verdict**.
5. Spawn `verification-reviewer` — **paste literal verdict**.
6. Grep changed files for banned patterns: `uppercase tracking-wide`, `py-20 text-center`, `color-mix(in oklch`
7. **Spawn `Explore` to grep-verify every claimed change exists** (Pattern G — never claim done from memory)
8. For every mistake found: write a discipline log entry AND either fix it now or write a rule preventing recurrence (Pattern H — no text-only self-reflections)
9. **Evidence block on every done claim** — state: axe-core path or "not run — no dev server", DS import `file:line` per new component, grep result. Saying "it passes" without evidence = Pattern I violation.
10. **Two-tier verdict (Pattern L — never say GREENLIGHT alone):**
    - `GREENLIGHT (static)` — code analysis only; browser NOT opened
    - `GREENLIGHT (runtime)` — interactions.mjs ran, popover/tooltip/color-tokens states passed
    Always list what was NOT verified: popover clip, color token rendering, hover/focus states, z-index stacking.

## Key tokens (80% of UI work — full set in the real `@exxatdesignux/ui/src/globals.css`)
`--background` `--foreground` `--card` `--muted` `--muted-foreground` `--border` `--border-control-35` `--brand-color` `--brand-tint` `--primary` `--destructive` `--ring` `--radius` `--control-height`

## 10. Workspace Doc Map (lazy-load — read only when relevant)
| Doc | Read when |
|---|---|
| `docs/governance/design-review-protocol.md` | **Any UI work** — full sequential protocol with subagent trigger map |
| `docs/CLAUDE-RULES.md` | Full always/never list, DS source rules, workspace config, new product setup, font loading, verification patterns |
| `node tools/ds/source.mjs <Component>` + `globals.css` | Any UI code — real component APIs (live), tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term / Master Course pages |
| `docs/PRODUCTS.md` | Need ports, owners, package names |
| `node tools/ds/source.mjs --list` | DS component variants/sizes/props lookup |
| `docs/governance/verification-discipline.md` | Before claiming done (Patterns A-H) — includes grep-verify (G) and artifact-not-text self-reflection (H) |
| `docs/governance/design-anti-patterns.md` | Before any UI component — banned pattern blacklist |
| `docs/governance/component-consistency.md` | DataTable, header, sheet, dialog governance |
| `apps/<product>/CLAUDE.md` | Per-product rules |
| `apps/<product>/docs/patterns/*.md` | Per-product UI patterns (load only for that product) |
