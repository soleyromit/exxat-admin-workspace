"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  TableBulkActionBarPreview,
  TableColumnsPreview,
  TablePreview,
} from "@/components/design-system/data-display-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const tableComponentDoc: ComponentDocSpec = {
  slug: "table",
  summary:
    "Three layers for tabular data: static Table chrome for read-only matrices, DataTable for the full sortable grid, and HubTable for list hubs with toolbar, Properties, and view renderers.",
  sections: [
    ex({ id: "column-types", title: "HubTable column types" }, <TableColumnsPreview />),
    ex({ id: "bulk-actions", title: "Bulk action bar" }, <TableBulkActionBarPreview />),
    ex({ id: "primitive", title: "Static table" }, <TablePreview />),
  ],
  anatomy: [
    { part: "Table", description: "Root chrome: rounded border, gridlines, header background tokens." },
    { part: "TableHeader / TableBody", description: "Semantic sections for column labels and data rows." },
    { part: "DataTable", description: "Sortable, filterable grid primitive. Owns toolbar inset and grid chrome." },
    { part: "HubTable", description: "Canonical hub wrapper: useTableState, Properties drawer, view renderers." },
    { part: "TableViewMoreFooter", description: "Embedded-surface footer when row count exceeds the preview cap." },
    { part: "table-cells", description: "Named cell primitives (ProgressCell, CurrencyCell, PersonIdentityCell, …)." },
  ],
  features: [
    {
      group: "Columns and layout",
      icon: "fa-table-columns",
      items: [
        {
          part: "Column resize",
          icon: "fa-arrows-left-right",
          description: "Drag the trailing edge of any non-locked header to resize. Widths persist via useTableState.",
        },
        {
          part: "Drag to reorder",
          icon: "fa-grip-dots-vertical",
          description: "Drag a free (unpinned) header to reorder columns. Pinned columns stay fixed.",
        },
        {
          part: "Pin left / pin right",
          icon: "fa-thumbtack",
          description: "Per-column header menu: pin left, pin right, or unpin. Select and Actions columns ship pinned.",
        },
        {
          part: "Auto pin on overflow",
          icon: "fa-table-cells-large",
          description: "When the grid overflows horizontally, pinned columns stay visible with edge fade chrome.",
        },
        {
          part: "Wrap text",
          icon: "fa-text-wrap",
          description: "Per-column header menu toggles wrap on long cell content.",
        },
        {
          part: "Hidden columns",
          icon: "fa-eye-slash",
          description: "Hide or show columns from Table properties. Hidden keys stay in state for restore.",
        },
      ],
    },
    {
      group: "Sort and search",
      icon: "fa-arrow-down-arrow-up",
      items: [
        {
          part: "Per-column sort",
          icon: "fa-sort",
          description: "Every sortable column exposes Sort ascending / descending in the header menu with aria-sort.",
        },
        {
          part: "Multi-column sort",
          icon: "fa-list-ol",
          description: "Properties drawer Sort panel stacks multiple sort rules with drag reorder.",
        },
        {
          part: "Toolbar search",
          icon: "fa-magnifying-glass",
          description: "Global query across searchable columns. Optional recent queries when persistKey is set.",
        },
        {
          part: "Per-column quick search",
          icon: "fa-magnifying-glass-plus",
          description: "Header menu search scopes to one column without opening Properties.",
        },
      ],
    },
    {
      group: "Filters",
      icon: "fa-filter",
      items: [
        {
          part: "cellKind filters",
          icon: "fa-tags",
          description: "ColumnDef.cellKind drives filter icon, type, and default options (person, date, rating, …).",
        },
        {
          part: "Filter pills",
          icon: "fa-filter-list",
          description: "Active filters render as inline chips in the toolbar with inline editors.",
        },
        {
          part: "Add filter menu",
          icon: "fa-plus",
          description: "Toolbar Add filter lists every filterable column derived from ColumnDef.",
        },
        {
          part: "Filter types",
          icon: "fa-sliders",
          description: "Text, select, person picker, date, date-range, and numeric range filters.",
        },
        {
          part: "filterFieldContext",
          icon: "fa-database",
          description: "Runtime options from row data (unique people, min/max range) stay in sync with Properties.",
        },
        {
          part: "Conditional rules",
          icon: "fa-palette",
          description: "Properties conditional formatting applies background tints to matching cells.",
        },
      ],
    },
    {
      group: "Rows and selection",
      icon: "fa-check-double",
      items: [
        {
          part: "Row selection",
          icon: "fa-square-check",
          description: "Checkbox column with getRowSelectionLabel for accessible bulk-action labels.",
        },
        {
          part: "Bulk action bar",
          icon: "fa-layer-group",
          description: "Floating bar when rows are selected. HubTable accepts bulkActions or bulkActionsSlot.",
        },
        {
          part: "Group by",
          icon: "fa-object-group",
          description: "Collapse rows under group headers when a groupable column is chosen in Properties.",
        },
        {
          part: "Row click",
          icon: "fa-arrow-pointer",
          description: "onRowClick on DataTable / HubTable for navigation or detail affordances.",
        },
        {
          part: "Lazy loading",
          icon: "fa-spinner",
          description: "Incremental row render for very large client-side datasets (optional lazyLoading prop).",
        },
      ],
    },
    {
      group: "Design tokens",
      icon: "fa-swatchbook",
      items: [
        {
          part: "--dt-header-bg",
          icon: "fa-table-columns",
          description: "Column header background. Use bg-dt-header-bg on thead.",
        },
        {
          part: "--dt-row-bg / hover / selected",
          icon: "fa-table-rows",
          description: "Row surfaces — opaque fills required for pinned columns.",
        },
        {
          part: "--dt-group-bg",
          icon: "fa-object-group",
          description: "Collapsible group header row tint.",
        },
        {
          part: "DATA_TABLE_*_INSET",
          icon: "fa-arrows-left-right-to-line",
          description: "Toolbar px-4 lg:px-6 and grid mx-4 lg:mx-6 — omit when parent pads.",
        },
        {
          part: "--interactive-hover-*",
          icon: "fa-hand-pointer",
          description: "Ghost buttons, toolbar hovers, and icon-button chrome.",
        },
        {
          part: "--sticky-edge-fade",
          icon: "fa-table-cells-large",
          description: "Pinned column edge gradient on horizontal overflow.",
        },
      ],
    },
    {
      group: "HubTable and views",
      icon: "fa-table",
      items: [
        {
          part: "useTableState",
          icon: "fa-database",
          description: "Single state bag for sort, filters, columns, pins, search, pagination, and display options.",
        },
        {
          part: "Table properties drawer",
          icon: "fa-sliders",
          description: "Columns, filters, sort, display, conditional rules, and view-type tiles in one sheet.",
        },
        {
          part: "View renderers",
          icon: "fa-grid-2",
          description: "table, list, board, dashboard, folder, panel, and tree bodies share the same state.",
        },
        {
          part: "Pagination",
          icon: "fa-table-list",
          description: "Optional PaginationBar on primary hubs. Toggle from Properties display options.",
        },
        {
          part: "embeddedPreview",
          icon: "fa-ellipsis",
          description: "Five-row cap with View more footer on embedded surfaces. View more navigates via onEmbeddedPreviewViewMore; edgeInset follows page padding.",
        },
        {
          part: "persistKey",
          icon: "fa-floppy-disk",
          description: "Product-namespaced localStorage restore for filters, sort, column layout, and display options.",
        },
      ],
    },
  ],
  api: [
    { prop: "columns", type: "ColumnDef[]", description: "HubTable / DataTable — keys, labels, cell renderers, filter, cellKind." },
    { prop: "cellKind", type: "string", description: "Drives filter preset and Properties field type for the column." },
    { prop: "filter", type: "FilterConfig", description: "Override preset when enum options or date-range UX must differ from cellKind." },
    { prop: "defaultSort", type: "{ key, dir }", description: "Initial sort column and direction." },
    { prop: "state", type: "useTableState", description: "Shared table state across table, list, board, and dashboard views." },
    { prop: "selectable", type: "boolean", defaultValue: "true", description: "Row checkbox column and bulk-action bar." },
    { prop: "groupable", type: "boolean", defaultValue: "false", description: "Enable group-by rows in Properties." },
    { prop: "pagination", type: "boolean", defaultValue: "false", description: "HubTable-owned PaginationBar. Incompatible with embeddedPreview." },
    { prop: "embeddedPreview", type: "boolean", description: "Cap at five rows with View more footer on embedded surfaces." },
    { prop: "edgeInset", type: "boolean", defaultValue: "true", description: "DataTable toolbar/grid mx/px inset. false when parent owns page padding." },
    { prop: "persistKey", type: "string", description: "Product-namespaced key for restored table state (use productPersistKey)." },
    { prop: "renderers", type: "HubTableRenderers", description: "Per-view bodies; omit table to use default DataTable renderer." },
    { prop: "displayOptionsInit", type: "object", description: "Initial toolbar search, column labels, gridlines, row height, pagination toggle." },
  ],
  extraImports: [
    { label: "DataTable", path: "@/components/data-table" },
    { label: "HubTable", path: "@/components/data-views" },
    { label: "Table cells", path: "@/components/data-views/table-cells" },
    { label: "useTableState", path: "@/components/data-table/use-table-state" },
    { label: "Embedded row limit", path: "@exxatdesignux/ui/lib/hub-table-embedded-preview" },
  ],
  guidelines: {
    do: [
      "Use HubTable inside ListPageTemplate for every primary list hub and showcase that mounts a data grid.",
      "Set cellKind on each ColumnDef and import named cells from table-cells instead of inline formatters.",
      "Pass embeddedPreview on dashboard sections and design-system demos so tables show five rows with View more.",
      "Wire onEmbeddedPreviewViewMore to navigate to the full hub route — do not rely on inline expand in docs.",
      "Use ui/Table only for tiny inline matrices inside a preview (chart legend, 2×2 demos).",
      "Catalog API sections use DataTable via ComponentDocApiTable — resizable columns, sort, header menus.",
      "Let auto pin handle horizontal overflow; pin Select and Actions columns deliberately.",
    ],
    dont: [
      "Do not build product list pages with ui/Table alone or third-party grids.",
      "Do not mount raw DataTable inside ListPageTemplate — users lose filters and Properties.",
      "Do not stack horizontal padding on a parent that already wraps HubTable (double gutter regression).",
      "Do not enable embeddedPreview on primary hubs that need full pagination and row counts.",
      "Do not hand-roll filter inputs above the grid — use cellKind + filter pills + Properties.",
    ],
  },
  accessibility: [
    "Sortable headers expose aria-sort and a visible direction glyph.",
    "Icon-only header controls and row actions require aria-label.",
    "Row checkboxes use getRowSelectionLabel for bulk-action announcements.",
    "Resize handles use role=separator with an accessible name.",
    "View more uses the ghost Button variant with resting fill for affordance.",
  ],
  relatedSlugs: [
    "data-table",
    "hub-table",
    "table-cells",
    "table-properties-drawer",
    "selection-tile-grid",
    "list-page-template",
    "view-segmented-control",
  ],
}
