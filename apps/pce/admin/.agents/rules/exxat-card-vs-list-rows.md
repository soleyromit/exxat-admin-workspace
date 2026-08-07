---
description: Exxat DS — when to use cards vs DataTable rows vs simple list rows.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-card-vs-list-rows.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — cards vs rows vs lists

## MUST

1. **Dense, comparable records (10+)** — **`DataTable`** + **`ListPageTemplate`** + **`useTableState`** for primary hubs (**`exxat-data-tables.md`**).
2. **Board / tiles / visual browse** — **`ListPageBoardCard`** (and related shells), **`ListPageViewFrame`** for non-table bodies (**`exxat-board-cards.md`**, **`exxat-list-page-view-shells.md`**).
3. **One dataset** — Cards and tables read the **same** **`tableState.rows`**; no forked mock arrays (**`exxat-centralized-list-dataset.md`**).

## MUST NOT

- Replace a **primary data hub grid** with a **card wall** when users need column sort, filter chips, and export parity.
- Introduce a **second table stack** for the same entity.

## See also

- **`docs/card-vs-rows-pattern.md`** · **`.agents/skills/exxat-card-vs-list-rows/SKILL.md`**
