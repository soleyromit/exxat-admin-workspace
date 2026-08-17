---
description: Exxat DS — one vertical scroll owner per page
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-page-scroll-ownership.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — page scroll ownership

**Binding for product pages and Design reference doc pages.**

## MUST

1. **One vertical scroll owner** — `PrimaryPageTemplate` → `[data-page-scroll]`. Content flows; the page scrolls once (table, list, board, **and** folder / panel / tree splits).
2. **Content column** — Inside `[data-page-scroll]`, use **`block min-h-full`** (not `flex flex-col` / `flex-1 min-h-0`) so sticky view tabs work. Use `overflow-x-clip` (not `overflow-x-hidden`) on the scrollport.
3. **MUST NOT** add ad-hoc `overflow-y-auto` around doc bodies, hub sections, Miller columns, or dashboard stacks that create a second scrollbar beside the page.

## Allowed nested scroll (exceptions only)

- **Data tables** — horizontal overflow on the grid; vertical growth uses `[data-page-scroll]`.
- **Chart canvases** — Recharts SVG (WCAG 1.4.10).
- **`HorizontalScrollRegion`** — horizontal overflow only.
- **Drawers / sheets / dialogs** — overlay scroll ports.
- **Sidebar / secondary rail / Ask Leo** — chrome rails (their own internal thread scroll).

## SHOULD

- Prefer pagination or "show more" over capped inner scroll on doc surfaces.

## MUST NOT

- Ship doc pages with `max-h-[70vh]` + `overflow-y-auto` around main content.
- Pin `PageHeader` while only a middle card scrolls.
- Lock list+details / tree+details with `100dvh` so the page cannot scroll.

## Reference

- `primary-page-template.tsx` — content column + scrollport
- `list-page-split-hub-chrome.tsx` / `list-page-split-hub-tokens.ts` — split hubs grow with page
- `design-system-shell.tsx` — scroll comment on outlet
