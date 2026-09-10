---
description: Exxat DS constitution. Sole always-on rule. Ten commandments, copy floor, product lines, surface router.
activation: always_on
---

<!-- Synced from .agents/rules/_constitution.exxat-ds.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS constitution

**This is the only always-on rule.** Other `.mdc` files attach by glob or when you open them.

**UX router:** `exxat-surface-router` / `node scripts/agent-context-router.mjs <surface>` (consumer: `exxat-ui context <surface>`). Read only the packet. Do **not** open `exxat-token-economy` or `exxat-senior-ux` unless IA is undecided. **Index:** `docs/exxat-ds/INDEX.yaml`. **Map:** `docs/exxat-ds/HANDBOOK.md`.

**Codebase:** Graphify is the index (`graphify-out/` is gitignored). For architecture, dependency, impact, ownership, or broad where/how: `graphify query "<question>" --budget 1200` via Shell before Grep, Glob, or explore agents. Then read only those sources. Hook: `exxat-graphify-gate.mjs`.

## Precedence

1. User / task instructions.
2. This constitution + scoped `.agents/rules/*.mdc` on files you touch.
3. Slim `AGENTS.md` (map only). Full MUST/MUST NOT: `docs/exxat-ds/handbook/agents-handbook.md` in this repo, or `docs/exxat-ds/handbook/agents-handbook.md` in a consumer.
4. Skills on demand after the router packet.
5. Pattern / job docs (narrative unless a rule cites them).

## Brief before design

New or rebuilt page, hub, wizard, settings, dashboard, or significant component: post a brief, then **Ready to build — confirm or edit.** Wait. Hook: `exxat-brief-gate.mjs`.

Brief fields: Problem · User & frequency · Product · Scope · Persona · Job-to-be-done · Pattern · Reference (repo) · Reference (modern) · Principles · Deviations · Out of scope · Open questions.

```
Product: <exxat-prism | exxat-one-schools | exxat-one-sites | exxat-custom>
Scope: <school > program | brand > site > location>
Persona: <heading from exxat-domain-context>
```

Image / mockup / Figma: IA only (labels, fields, nav, routes). Map to a DS hub. **MUST NOT** pixel-copy or use `frontend-design` to match the upload.

## Copy

No decorative descriptions. No em dash, en dash, or hyphen-as-pause in user-visible copy. Missing value: `None` or blank, never a lone `-`. Allowed hyphens: `real-time`, `STU-2026-014`, code.

## Ten commandments

| # | MUST | Detail when files match |
|---|------|-------------------------|
| 1 | Brief before design | `exxat-ux-discovery-protocol.md` |
| 2 | Product / Scope / Persona; routes under product roots | `exxat-product-context.md`, `exxat-product-routing.md` |
| 3 | Reuse: grep `component-map.json` before a new component | `exxat-reuse-before-custom.md` |
| 4 | Lists → `HubTable` in `ListPageTemplate` + one `useTableState` | `exxat-data-tables.md` |
| 5 | No toast | `exxat-no-toast.md` |
| 6 | Tokens only (`--exxat-*`) | `exxat-token-discipline.md` |
| 7 | Images = IA only | `exxat-no-image-pixel-copy.md` |
| 8 | WCAG 2.1 AA; one H1; icon-only = `aria-label` + `Tip`; primary/bulk = shortcut + `Kbd` | `exxat-accessibility.md` |
| 9 | Focus shells are not hubs | `exxat-focus-workflow.md` |
| 10 | Rule = MUST; skill = procedure; pattern = why; job = intent | `INDEX.yaml` |

P1–P8 never break. P9–P20: `exxat-ux-principles.md` when designing.
