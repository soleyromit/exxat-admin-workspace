---
description: Exxat DS constitution — precedence, ten commandments, UX router entry (only always-on rule besides product + brief)
activation: always_on
---

<!-- Synced from .agents/rules/_constitution.exxat-ds.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — constitution

**UX router (fast path):** `exxat-surface-router` / `node scripts/agent-context-router.mjs <surface>` → `exxat-token-economy` skill → `docs/exxat-ds/component-selection-guide.md` only when choosing a surface. **Index:** `docs/exxat-ds/INDEX.yaml`. **Human map:** `docs/exxat-ds/HANDBOOK.md`.

## Precedence

1. User / task instructions.
2. This constitution + scoped `.agents/rules/*.mdc` on files you touch.
3. `./AGENTS.md` (map + ship checklist only).
4. Skills on demand (`exxat-senior-ux`, `exxat-ux-audit`, consolidated domain skills).
5. Pattern / job docs (narrative — not binding unless cited by a rule).

Prefer the **more specific** source for the surface type.

## Ten commandments

| # | Commandment | Scoped detail (when editing matching files) |
|---|-------------|---------------------------------------------|
| 1 | **Brief before design** — IA/layout decisions need brief + user go-ahead. Hook: `exxat-brief-gate.mjs`. | `exxat-ux-discovery-protocol.md` |
| 2 | **Product context** — Product / Scope / Persona in briefs; routes under product roots. | `exxat-product-context.md`, `exxat-product-routing.md` |
| 3 | **Reuse before custom** — compose `components/` + `packages/ui`; ask before new shared primitives. | `exxat-reuse-before-custom.md` |
| 4 | **Hub data stack** — lists → `HubTable` in `ListPageTemplate` + one `useTableState` bag. | `exxat-data-tables.md`, `jobs/list-hub.md` |
| 5 | **No toast** — banners, inline status, dialogs; not Sonner/snackbars. | `exxat-no-toast.md` |
| 6 | **Tokens only** — no hex/deprecated tokens; prefer L0 `--exxat-*`. ESLint enforces. | `exxat-token-discipline.md` |
| 7 | **Images = IA only** — never pixel-copy screenshots; map to DS reference hub. | `exxat-no-image-pixel-copy.md` |
| 8 | **A11y floor** — WCAG 2.1 AA; one H1; icon-only = label + tooltip; ship checklist before merge. | `exxat-accessibility.md` |
| 9 | **Focus ≠ hub** — exam lock / compose shells strip chrome; not `ListPageTemplate`. | `exxat-focus-workflow.md`, `jobs/focus-workflow.md` |
| 10 | **One boss per pattern** — rule = MUST; skill = procedure; pattern = why; job = user intent. | `INDEX.yaml` |

## P1–P8 (no deviations)

One way back · one H1 · one primary action · no pixel-copy · empty/error/loading · keyboard parity · WCAG AA · reuse before invent. P9–P20: `exxat-ux-principles.md` (load when designing).

## Image attached — mandatory (overrides aesthetic skills)

If the user message includes a **screenshot, mockup, Figma export, or legacy capture**:

1. **STOP** — post the design brief first (`exxat-ux-discovery-protocol.md`); **no code** in that turn.
2. **IA only** from the image — nav labels, fields, columns, actions, routes — **not** colors, density, sidebar chrome, or layout shapes.
3. **Map to DS** — name a **reference hub** + primitives (`ListPageTemplate`, `HubTable`, `AppSidebar` + `navigation.tsx`, …). Shell chrome stays DS-default unless the brief documents an approved P4 exception.
4. **MUST NOT** plan or say "match the screenshot", "visual parity", or use **`frontend-design`** / pixel-matching skills to mimic the upload. Full rule: **`exxat-no-image-pixel-copy.md`** (always on).

## Do not open on every turn

`AGENTS.md` full text, individual pattern docs, or `INDEX.yaml` rule lists — use **component-selection-guide** first.
