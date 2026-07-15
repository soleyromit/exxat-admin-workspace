---
description: Exxat DS — one vertical scroll owner per page; no nested page-level overflow-y
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-page-scroll-ownership.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — page scroll ownership

**Binding for product pages and Design reference doc pages.**

## MUST

1. **One vertical scroll owner** — The shell owns scroll: `PrimaryPageTemplate` → `[data-page-scroll]`. Content inside that region flows naturally; the **browser / page** scrolls once.
2. **MUST NOT** add `overflow-y-auto`, `overflow-auto`, or `max-h-[…vh]` wrappers around **doc bodies**, hub sections, or dashboard stacks that create a **second vertical scrollbar** beside the page scroll.
3. **Allowed nested scroll (exceptions only):**
   - **Data tables** (`HubTable` / `DataTable` body) — horizontal + vertical grid scroll.
   - **Chart canvases** — Recharts SVG (essential 2D region per WCAG 1.4.10).
   - **`HorizontalScrollRegion`** — horizontal tab/breadcrumb overflow only.
   - **Drawers / sheets** — overlay panels with their own scroll port.
   - **Miller columns / tree split** — documented split-pane patterns (`ListPageSplitHubChrome`).
4. **Design reference (`/design-system/*`)** — `design-system-shell.tsx` documents the contract: **no** `overflow-y-auto` on the outlet wrapper. Long token lists, anatomy blocks, and preview grids extend the **page** — never a fixed-height inner panel.

## SHOULD

- Prefer **pagination** or **"show more"** over a capped inner scroll for long static lists on doc/marketing surfaces.
- When a list is intentionally long (token index), use **one** theme control at the top of the section — not duplicated per subsection.

## MUST NOT

- Ship doc pages with `max-h-[70vh]` + `overflow-y-auto` around the main content (token index anti-pattern).
- Pin `PageHeader` while only a middle card scrolls — that breaks hub shell parity.

## Reference

- `components/design-system/design-system-shell.tsx` — scroll comment on outlet
- `components/design-system/token-doc-preview.tsx` — single-scroll token list
- `docs/exxat-ds/perf-memory-pattern.md` — scroll + memory notes
