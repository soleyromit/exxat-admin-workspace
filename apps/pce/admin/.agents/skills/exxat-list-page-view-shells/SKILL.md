---
name: exxat-list-page-view-shells
description: >-
  Centered, reusable layout for ListPageTemplate view bodies — ListPageViewFrame,
  data-views/ primitives, and rules to avoid page-tied view markup. Use when adding
  folder/panel/custom views, fixing wide-viewport layout, or extracting view UI from a single hub.
---

# List-page view shells (Exxat DS)

## When to use this skill

- Adding or changing **`viewType`** surfaces: **folder**, **panel**, list/board chrome, icon grids, OS-style explorers.
- User or PR asks for **“centered”**, **“reusable view”**, or **“not tied to one page”** layout.
- You see **duplicated** `mx-4 lg:mx-6`, `mx-auto max-w-6xl`, or similar wrappers in multiple `*-table.tsx` files.

## Instructions

1. **Gutter + optional max width** — Import **`ListPageViewFrame`** from **`@/components/data-views/list-page-view-frame`** (or **`@/components/data-views`**). Wrap the view body (usually below **`DataTableToolbar`** when the view shares the table toolbar).
   - Pass **`maxWidthClassName={LIST_PAGE_VIEW_FRAME_MAX_ICON_GRID}`** for dense tile grids.
   - Pass **`maxWidthClassName={LIST_PAGE_VIEW_FRAME_MAX_WIDE}`** when the view includes toolbar rows + breadcrumbs + grid.
2. **Do not double-gutter** — If **`DataTable`** already provides horizontal inset for the **table** view, do **not** wrap that branch in **`ListPageViewFrame`**. Use the frame on **sibling** view branches (folder, panel, etc.) only.
3. **Reuse before inventing** — Prefer **`FolderGridView`**, **`FinderPanelView`**, **`ListPageBoardTemplate`**, **`ListPageViewFrame`**. If a new pattern appears twice, **promote** it to **`components/data-views/`** with domain-agnostic props.
4. **Entity-specific → generic** — If logic is “any tree + any row type”, build **`components/data-views/<generic-name>.tsx`** and keep **`library-*`** (or similar) as a thin composition + mock types.

## Checklist

- [ ] View body uses **`ListPageViewFrame`** (or a component that uses it internally, e.g. **`FolderGridView`**).
- [ ] No **extra** horizontal padding around **`DataTable`** vs **`AGENTS.md` §5**.
- [ ] New grid/shell lives under **`components/data-views/`** when a second hub could reuse it.

## References

- **`components/data-views/list-page-view-frame.tsx`** — implementation + exported constants.
- **`./AGENTS.md` §4.5** — MUST/MUST NOT.
- **`.agents/rules/exxat-list-page-view-shells.md`**.
