# CLAUDE.md — Exxat DS Workspace

> Loaded every message. **Full rules:** `docs/CLAUDE-RULES.md`. **Full design protocol:** `docs/governance/design-review-protocol.md`. **DS APIs (real, before any UI code):** `node tools/ds/source.mjs <Component>` + live `localhost:4000/library/<id>`. Tokens: `@exxatdesignux/ui/src/globals.css`. Visual match: `node tools/visual-check/visual-diff.mjs`.

## Session Start — Self-Brief (before any task)
Surface known failures yourself; don't wait to be reminded. Skim `MEMORY.md` for the feedback/project entries relevant to this task + product, and `docs/governance/verification-discipline.md` for the latest patterns. If a recurring failure applies, state it at the top of your response.

## Knowledge Vault (shared brain — Obsidian ⇄ Claude)
Durable knowledge lives canonically in the Obsidian vault at `/Users/romitsoley/Documents/research-repos` (decisions, research, meeting notes, architecture reference, the memory atoms).
- **Read (token-economical):** start at `_Insights.md` (curated, value-ranked index of decisions/research/meetings) or `_Home.md` → open only the matching note. Grep by frontmatter (`type:`/`tags:`/`product:`/`relevance:`) or dispatch `Explore`. **NEVER load the whole vault.**
- **🎨 On ANY design/UX task, consult the vault FIRST — before mockups or JSX.** Open `_Insights.md`, find the feature's product/theme, and read the relevant `Decisions/`, `Meetings/`, and `Research/` notes. This is your **persistent design memory** — prior stakeholder calls (Aarti / Vishaka / Nipun), settled decisions, and research findings live there distilled. Skipping it = losing context and re-litigating decisions already made. State which vault notes you consulted at the top of the response.
- **Write:** when you learn something durable (a decision, research insight, meeting takeaway, architecture rule), write an **atomic note** there with the schema (`type · product · tags · status · source · date · links`) and add it to the relevant `MOCs/MOC-*.md` + `_Home.md`.
- Romit edits the same vault in Obsidian; his edits are your context next session. **This is the two-way loop** — keep the schema + MOC index intact so both sides stay queryable.

## Identity
Romit Soley (Product Designer II, Exxat). Main branch = Himanshu Suthar (Engineering). Never merge to main without Himanshu review.

## Repo
`/Users/romitsoley/Work/` — monorepo root
- `exxat-ds/packages/ui/src/` — Admin DS submodule (READ ONLY, NEVER EDIT — legacy reference)
- `studentUX/src/` — Student DS submodule (READ ONLY, NEVER EDIT)
- `@exxatdesignux/ui` — **canonical Admin DS package** (source of truth for all products)
- `apps/<product>/{admin,student}/` — product apps · `docs/` — spec, registries, governance, patterns

## Products
Active: `exam-management` (3001), `pce` (3005), `portal` (3100). Full registry: `docs/PRODUCTS.md`.

## DS Imports
**Admin:** `import { Button, ... } from '@exxatdesignux/ui'` · CSS: `@import '@exxatdesignux/ui/globals.css'`
**Student:** `import { Button } from '@exxat/student/components/ui/button'` · CSS: `@import '../../../../studentUX/src/styles/globals.css'`

## Dev Server
`cd /Users/romitsoley/Work/apps/<product>/<admin|student> && pnpm dev` — no root `package.json`; `pnpm --filter` does NOT work from root.

## Non-negotiable rules (hooks block commits on violations)
- NEVER edit `exxat-ds/` or `studentUX/`
- NEVER raw `<button>` — DS `Button` with explicit `variant` + `size`
- NEVER hardcode hex/rgb — use `var(--token)`
- NEVER raw `<table>` or recreate DataTable/KeyMetrics/Button/Badge/Dialog — import or vendor per registry
- NEVER toast for product feedback — use `LocalBanner`
- ALWAYS `'use client'` on interactive components
- ALWAYS `aria-hidden="true"` on FA icons; `aria-label` on icon-only buttons
- Granola: always `get_meeting_transcript` raw, never summaries. "Adi" = Aarti.

## Design Protocol (non-negotiable — full spec: `docs/governance/design-review-protocol.md`)

**Pre-task declaration (before touching any file):** write `File / Current DS violations / Hand-rolled w/ DS equivalent / WCAG issues (static read)`. Anchors the session; prevents hallucinating prior state.

**Gate 1 — before any JSX:** (1) **Consult the Obsidian vault first** — `_Insights.md` → the feature's `Decisions/` + `Meetings/` + `Research/` notes (your persistent design memory; pull a raw Granola transcript only for a deep-dive the distilled note doesn't cover); (2) read per-product `ui-patterns.md` + `design-anti-patterns.md` + `component-consistency.md`; (3) `node tools/ds/source.mjs <Component>` (real API + `localhost:4000/library/<id>`) — generate against this, not memory; (4) spawn `ds-adoption-reviewer` before any new component file.

**Gate 2 — before claiming done:** spawn `ds-conformance-reviewer` (visual-diff vs localhost:4000 + tokens + axe + WCAG/FERPA), `state-review` (list/form/async), `verification-reviewer` — **paste each literal verdict**. Grep changed files for `uppercase tracking-wide`, `py-20 text-center`, `color-mix(in oklch`. Spawn `Explore` to grep-verify every claimed change (Pattern G). Evidence block on every done claim (axe path or "not run", DS import `file:line`, grep result — Pattern I).

**Two-tier verdict (never say GREENLIGHT alone — Pattern L):** `GREENLIGHT (static)` = code only, browser not opened; `GREENLIGHT (runtime)` = visual-diff/interactions ran & passed. Always list what was NOT verified. The `Stop` hook `ds-claim-gate.py` BLOCKS `GREENLIGHT (runtime)` without a fresh (≤30 min) `visual-diff.mjs` DS-MATCH; server down → use `GREENLIGHT (static)`.

## Key tokens (full set in `@exxatdesignux/ui/src/globals.css`)
`--background` `--foreground` `--card` `--muted` `--muted-foreground` `--border` `--border-control-35` `--brand-color` `--brand-tint` `--primary` `--destructive` `--ring` `--radius` `--control-height`

## 10. Workspace Doc Map (lazy — read only when relevant)
| Doc | Read when |
|---|---|
| `docs/governance/design-review-protocol.md` | **Any UI work** — full protocol + subagent trigger map |
| `docs/CLAUDE-RULES.md` | Full always/never list, DS source rules, config, new-product setup, fonts |
| `node tools/ds/source.mjs <Component>` + `globals.css` | Any UI code — real component APIs (live), tokens, theme |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term / Master Course pages |
| `docs/PRODUCTS.md` | Need ports, owners, package names |
| `docs/governance/verification-discipline.md` | Before claiming done (Patterns A–L) |
| `docs/governance/design-anti-patterns.md` | Before any UI component — banned-pattern blacklist |
| `docs/governance/component-consistency.md` | DataTable, header, sheet, dialog governance |
| `apps/<product>/CLAUDE.md` + `apps/<product>/docs/patterns/*.md` | Per-product rules + UI patterns |
