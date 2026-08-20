# Cards vs table rows vs list rows

> **Related:** **`AGENTS.md` §4–§5**, **`.cursor/rules/exxat-data-tables.mdc`**, **`.cursor/rules/exxat-board-cards.mdc`**, **`docs/data-views-pattern.md`**.

## When to use **rows** (table or dense list)

- **Many similar records** (roughly **10+**) where users **scan**, **sort**, **filter**, and **compare columns**.
- **Same fields** across entities — columns align; export and **TablePropertiesDrawer** apply.
- **Primary hub** pattern — **`DataTable`** + **`ListPageTemplate`** per **`exxat-data-tables`**.

**Use:** `DataTable`, shared toolbar, row actions, pinned columns.

## When to use **cards** (tile / board / marketing)

- **Lower cardinality** or **visual-first** browsing — folders, dashboards, “pick a template”, hero metrics beside a chart.
- **Heterogeneous content** — each card has a different layout (title, badge, avatar, two-line body) where a rigid grid of columns would fight the design.
- **Kanban** — **`ListPageBoardCard`** + column model; still fed by **`tableState.rows`**.

**Use:** `ListPageBoardCard`, `ChartCard`, icon grids under **`ListPageViewFrame`**, dashboard chart tiles.

## When to use **list rows** (not full DataTable)

- **Medium density** — fewer columns than a grid; reading order is **vertical** (timeline, activity, simple roster without heavy operators).
- Still wire **search** when the list is the main surface and item count grows.

**Prefer** graduating to **`DataTable`** once the hub needs filters, column hide, density, or export parity with other list hubs.

## Anti-patterns

- **Cards for 50+ homogeneous records** when the product expects sort/filter/compare — that belongs in **`DataTable`**.
- **A second bespoke “table”** alongside **`DataTable`** for the same dataset — extend the table stack instead (**`exxat-centralized-list-dataset`**).
- **Raw `<table>`** for product data lists — forbidden (**`exxat-data-tables`**).

## See also

- **`.cursor/rules/exxat-card-vs-list-rows.mdc`**, **`.cursor/skills/exxat-card-vs-list-rows/SKILL.md`**
