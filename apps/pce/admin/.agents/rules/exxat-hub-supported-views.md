---
description: List-page hubs — FULL_HUB_SUPPORTED_VIEWS, Add view parity, and real renderers (never trimmed allowlists or placeholder list rows). Auto-attaches when editing hub clients / list-page templates.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-hub-supported-views.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — hub supported views (Add view parity)

**Canonical reference:** `components/library-table.tsx` + `components/library-client.tsx` (All questions / Library).

**Registry:** `FULL_HUB_SUPPORTED_VIEWS` in `@exxatdesignux/ui/lib/data-list-view-registry` (re-export `@/lib/data-list-view-registry`).

## Default allowlist (table only)

**New hubs default to table only.** `HubTable` and `ListPageTemplate` use **`TABLE_ONLY_HUB_SUPPORTED_VIEWS`** (`["table"]`) when `supportedViewTypes` is omitted. The views toolbar **auto-hides** when there is a single tab and only table is supported.

**Opt in** to multi-view when the **user or product explicitly asks** for list / board / dashboard / folder / panel / tree:

| # | View | When to add |
|---|------|-------------|
| 1 | Table | Always (default) |
| 2 | List | User needs row cards with hub toolbar |
| 3 | Board | User needs kanban |
| 4 | Dashboard | User needs KPI + charts on same dataset |
| 5–7 | Folder / panel / tree | User needs hierarchy browse (Library-shaped hubs) |

Pass **`FULL_HUB_SUPPORTED_VIEWS`** (seven views) only when implementing **every** renderer — reference: `library-table.tsx` + `library-client.tsx`.

**Reference showcases** (Columns, Library, Tokens) intentionally pass **`FULL_HUB_SUPPORTED_VIEWS`** — do not copy that allowlist to new product hubs unless asked.

## MUST (when multi-view is requested)

1. **Sync allowlists** — Pass the **same** `supportedViewTypes` to **`ListPageTemplate`** and **`HubTable`** when opting in beyond table-only.
2. **Implement every allowed view** — Each entry in `supportedViewTypes` needs a renderer (explicit `renderers` map and/or `renderListRow` / `renderBoardCard` + `boardGroups`). Dev warns when a view is allowed but missing; users see **“does not implement X view”** if you ship the allowlist without bodies.
3. **List rows use DS chrome** — **`ListPageBoardCard`** (Library list pattern). **MUST NOT** ship a bare two-line `renderListRow` (title + mono id only).
4. **Library-shaped rows** — Hubs on **`LibraryItem`** with a custom table (e.g. Column types) **MUST** delegate non-table views to **`LibraryTable`** (`columnDefs` + `hubLabels` + `folders` state) — do not reimplement folder/panel/tree in isolation.
5. **Token hubs** — Use **`FULL_HUB_SUPPORTED_VIEWS`** + **`components/tokens-hub-auxiliary-views.tsx`** when product asks for full Add view parity.

## MUST NOT

- Pass **`FULL_HUB_SUPPORTED_VIEWS`** on a new hub **without** implementing every renderer — unless it is an intentional reference showcase (Library, Columns, Tokens).
- Copy **`COLUMNS_SUPPORTED_VIEWS = FULL_…`** to a product hub when the user only asked for a table.
- Invent a new per-page allowlist constant without a matching renderer for every listed view.

## ⛔ Wrong vs ✅ Right (`*-supported-views.ts`)

For Exxat-domain entities, **default to FULL** because most entities have hierarchy worth surfacing — students (school > program > cohort), sites (network > location > site), placements (rotation > preceptor), courses (program > course > section).

```ts
// ⛔ WRONG — narrows the menu to 4 views with generic SaaS reasoning
//   that ignores the Exxat domain (this is the bug we shipped in test-3
//   for the Students hub — students DO have hierarchy).
/**
 * Why PRIMARY_HUB_SUPPORTED_VIEWS and not FULL_HUB_SUPPORTED_VIEWS?
 * Students are flat records — they are not stored in folders, do not form
 * a hierarchical tree, and have no parent/child split view…
 */
export { PRIMARY_HUB_SUPPORTED_VIEWS as STUDENTS_SUPPORTED_VIEWS }
  from "@/lib/data-list-view-registry"

// ✅ RIGHT — FULL is the default for new work; folder/panel/tree-panel
//   surface the program > cohort > student hierarchy that already exists.
/**
 * Students hub view allowlist — FULL_HUB_SUPPORTED_VIEWS (all seven views).
 * Every view is wired in `students-hub-table.tsx`:
 *   - table             → built-in via `HubTable`
 *   - list              → renderListRow using `ListPageBoardCard layout="row"`
 *   - board             → renderBoardCard + boardGroups (group by status / program / cohort)
 *   - dashboard         → renderers["dashboard-with-toolbar"] (KeyMetrics on filtered rows)
 *   - folder            → renderers["folder-with-toolbar"] (FolderGridView of programs)
 *   - panel             → renderers["panel-with-toolbar"] (FinderPanelView programs → students → detail)
 *   - tree-panel        → renderers["tree-panel-with-toolbar"] (program > cohort > student outline + detail)
 */
export { FULL_HUB_SUPPORTED_VIEWS as STUDENTS_SUPPORTED_VIEWS }
  from "@/lib/data-list-view-registry"
```

`HubTable` emits a dev-mode `console.warn` when `supportedViewTypes` matches `PRIMARY_HUB_SUPPORTED_VIEWS` (by reference or shape) — so the customer sees the recommendation on first dev boot if the agent narrows the allowlist by accident. Suppress only after documenting in your `*-supported-views.ts` why folder/panel/tree-panel are intentionally omitted (e.g. legacy Placements-only hubs).

## Narrow exceptions (document in code comment)

- Hubs that genuinely lack calendar/folder/panel/tree (e.g. legacy Placements-only four views) — export `ENTITY_SUPPORTED_VIEWS` in `lib/*-supported-views.ts` and **comment why** it is narrower than `FULL_HUB_SUPPORTED_VIEWS`.
- Calendar is **not** in `FULL_HUB_SUPPORTED_VIEWS`; add only when the hub implements `calendar-with-toolbar`.

## See also

- **`.agents/rules/exxat-data-tables.md`**, **`exxat-list-page-connected-views.md`**, **`exxat-list-page-view-shells.md`**
- **`docs/exxat-ds/hub-supported-views-pattern.md`**
- **`docs/exxat-ds/data-views-pattern.md`**
