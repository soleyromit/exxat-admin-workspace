---
name: exxat-card-vs-list-rows
description: Exxat DS — cards vs rows vs lists. Use when choosing card grids, DataTable, or simple list rows for a surface.
---

# Exxat DS — cards vs rows vs lists

Use when choosing **card grids**, **`DataTable`**, or **simple list rows** for a surface.

## Read first

- **`docs/card-vs-rows-pattern.md`**
- **`.cursor/rules/exxat-card-vs-list-rows.mdc`**, **`exxat-data-tables.mdc`**, **`exxat-board-cards.mdc`**
- **`exxat-centralized-list-dataset.mdc`** — one `tableState.rows` for table + board + cards

## Checklist

1. **10+ homogeneous records + compare/sort/filter?** → **`DataTable`** + hub template.
2. **Kanban / visual tiles / folders?** → **`ListPageBoardCard`** or **`ListPageViewFrame`** + card primitives.
3. **Medium vertical list without full table chrome?** → List row pattern; **promote** to `DataTable` when density and parity demand it.

## MUST NOT

- Card wall for the **primary** sortable hub that other hubs implement as **`DataTable`** without product reason.
- Second mock row source for cards vs table.
