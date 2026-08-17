---
description: Exxat DS constitution. Precedence, ten commandments, UX router entry (always-on with product, brief, and copy-discipline).
activation: always_on
---

<!-- Synced from .agents/rules/_constitution.exxat-ds.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS constitution

**UX router (fast path):** `exxat-surface-router` / `node scripts/agent-context-router.mjs <surface>` → `exxat-token-economy` skill → `docs/exxat-ds/component-selection-guide.md` only when choosing a surface. **Index:** `docs/exxat-ds/INDEX.yaml`. **Human map:** `docs/exxat-ds/HANDBOOK.md`.

**Codebase context (fast path):** Graphify is the index. `graphify-out/` is gitignored, so Glob reports 0 files even when the graph is present. Do not search for `GRAPH_REPORT.md`. For architecture, dependency, impact, ownership, or broad "where/how" questions, MUST run `graphify query "<question>" --budget 1200` via Shell **before** Grep, Glob, or explore agents. Then read only the returned source locations. Known target files and runtime evidence stay authoritative. Hook floor: `exxat-graphify-gate.mjs`.

## Precedence

1. User / task instructions.
2. This constitution + scoped `.agents/rules/*.mdc` on files you touch.
3. `./AGENTS.md` (map + ship checklist only).
4. Skills on demand (`exxat-senior-ux`, `exxat-ux-audit`, consolidated domain skills).
5. Pattern / job docs (narrative, not binding unless cited by a rule).

Prefer the **more specific** source for the surface type.

## Always-on rules (also apply every turn)

- `_constitution.exxat-ds.md` (this file)
- `exxat-product-context.md`
- `exxat-product-routing.md`
- `exxat-ux-discovery-protocol.md`
- `exxat-copy-discipline.md` (no decorative descriptions; no dash punctuation in UI copy)

## Ten commandments

| # | Commandment | Scoped detail (when editing matching files) |
|---|-------------|---------------------------------------------|
| 1 | **Brief before design** — IA/layout decisions need brief + user go-ahead. Hook: `exxat-brief-gate.mjs`. | `exxat-ux-discovery-protocol.md` |
| 2 | **Product context** — Product / Scope / Persona in briefs; routes under product roots. | `exxat-product-context.md`, `exxat-product-routing.md` |
| 3 | **Reuse before custom** — grep `component-map.json` for your intent **before** writing any component; a hit means import it. Ask before new shared primitives. | `exxat-reuse-before-custom.md` |
| 4 | **Hub data stack** — lists → `HubTable` in `ListPageTemplate` + one `useTableState` bag. | `exxat-data-tables.md`, `jobs/list-hub.md` |
| 5 | **No toast** — banners, inline status, dialogs; not Sonner/snackbars. | `exxat-no-toast.md` |
| 6 | **Tokens only** — no hex/deprecated tokens; prefer L0 `--exxat-*`. ESLint enforces. | `exxat-token-discipline.md` |
| 7 | **Images = IA only** — never pixel-copy screenshots; map to DS reference hub. | `exxat-no-image-pixel-copy.md` |
| 8 | **A11y floor** — WCAG 2.1 AA; one H1; icon-only = `aria-label` **+ visible `Tip`** (never label alone); every primary/bulk action gets a **keyboard shortcut + visible `Kbd`**; ship checklist before merge. | `exxat-accessibility.md`, `exxat-kbd-shortcuts.md` |
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
