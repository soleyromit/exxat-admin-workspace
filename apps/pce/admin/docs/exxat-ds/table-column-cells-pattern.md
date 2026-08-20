# Table column cells — pick the right renderer

**Live catalog:** `/columns` → `apps/web/components/columns-showcase.tsx`  
**Primitives:** `apps/web/components/data-views/table-cells.tsx` (import `@/components/data-views`)  
**Binding rule:** `.cursor/rules/exxat-table-column-cells.mdc`  
**Checklist skill:** `.cursor/skills/exxat-table-column-cells/SKILL.md`

---

## Job-to-be-done

When authoring `ColumnDef[]` for a hub, every **data point** must map to the **named cell pattern** the DS already ships — not ad-hoc JSX that re-implements progress bars, avatars, status chips, or currency formatters.

---

## Decision table (data point → cell)

| Data point | Use | Filter (`ColumnDef.filter`) | Notes |
|------------|-----|-----------------------------|-------|
| **Primary record title + system ID** | Inline two-line: title + `font-mono tabular-nums` ID | `text` on title column; ID is secondary line | Copy `columns-showcase` **Question** column. [`exxat-mono-ids.mdc`](../../.cursor/rules/exxat-mono-ids.mdc) |
| **One person** (author, owner, student, coordinator) | **`AvatarInitials` + name + muted email** (`mailto:`) | **`cellKind: "person"`** — picker options from rows (`name` + `{key}Email`) | **Dedicated person column** — [`exxat-person-identity-display.mdc`](../../.cursor/rules/exxat-person-identity-display.mdc). Copy `library-table.tsx` **Author** or `columns-showcase` **Author** |
| **Multiple people** (reviewers, assignees, collaborators) | **`PeopleAvatarRailCell`** | **`cellKind: "people-rail"`** — person picker from unique rail members | **Non-overlapping** avatars + `+N`. **NOT** a single person column |
| **Person name only** (dense column, not identity column) | Plain `truncate` name + **`Tip`** with email | `text` | Board cards: avatar + name only — no email line |
| **Lifecycle / workflow status** | **`ListHubStatusBadge`** + domain map on **`LIST_HUB_STATUS_TINT_*`** | `select` with `options[].node` chip preview | [`exxat-data-tables.mdc`](../../.cursor/rules/exxat-data-tables.mdc). **Never** raw `Badge` + `uppercase` |
| **Categorical type / kind** (non-status) | **`PillCell`** + FA icon | `select` | e.g. question type, document kind |
| **Keywords / tags** | **`TagListCell`** | `text` (contains) | Free-form labels |
| **Ordinal level** (easy / medium / hard) | **`SignalBarsCell`** + accessible `label` | `select` optional | Not plain text "Medium" |
| **Boolean flag** (published, active, enabled) | **`BooleanToggleCell`** | `select` (`true`/`false`) or filter on related status | Stops row-click propagation |
| **Progress / completion %** | **`ProgressCell`** | **`cellKind: "progress"`** — range slider (0–100 or data bounds) | Not hand-built `<div className="h-2 bg-…">` |
| **Star rating** | **`RatingCell`** | **`cellKind: "rating"`** or `filter: { options: ratingFilterOptions() }` | Not a manual star loop |
| **Money / price** | **`CurrencyCell`** | **`cellKind: "currency"`** — range from dataset when `dataBounds` | `tabular-nums`, not `font-mono` |
| **Integer count** | **`NumericCell`** | **`cellKind: "numeric"`** — range from dataset when `dataBounds` | Right-aligned |
| **Attachment count** | **`AttachmentCountCell`** | `text` | |
| **External URL** | **`ExternalLinkCell`** | `text` on host/label | Not raw `<a target="_blank">` |
| **Recency** ("3 hours ago") | **`RelativeTimeCell`** | `date` if filtering by day | `Tip` shows absolute timestamp |
| **Calendar date (absolute)** | `formatDateUS` + `text-sm tabular-nums whitespace-nowrap` | `date` | `lib/date-filter.ts` |
| **Plain enum / short text** | `truncate` span | `select` when values are closed set; else default text filter | Library **Topic** is OK as text |
| **Long prose** | `line-clamp-2` or `truncate` + row preview | `text` | Consider `HoverCard` row preview for identity |
| **Null / empty** | **`EMPTY_DASH`** or primitive's built-in dash | — | |
| **Row selection** | `key: "select"`, `defaultPin: "left"`, `lockPin: true` | — | DataTable built-in |
| **Row overflow actions** | **`RowActionsCell<TRow>`** or `key: "actions"` pinned right | — | Generic ⋯ menu |

---

## Person column — common mistake

| Wrong | Right |
|-------|-------|
| Plain text for author name | **`AvatarInitials` + name + email** in a dedicated **Author** / **Owner** column |
| `PeopleAvatarRailCell` for one person | **`AvatarInitials` stack** (person identity column) |
| Overlapping `-space-x-2` face pile | **`PeopleAvatarRailCell`** or **`AvatarGroup`** with **`gap-1.5`** |
| Email as the only visible line | Name primary, email muted second line |

**Reference:** `library-table.tsx` (`buildLibraryColumns` → `author`), `columns-showcase.tsx` (**Author** column).

---

## Filters — `cellKind` + runtime context (canonical)

Hub filtering is **one stack** — toolbar chips, funnel menu, and Table properties drawer must stay in sync.

### Authoring columns

1. Set **`cellKind`** on every data column — drives default filter **icon**, **type**, and static **options** via `resolveColumnFilter` (`packages/ui/src/lib/column-cell-kind.ts`).
2. Add **`filter.options[].node`** for rich picker previews (stars, status chips, progress buckets) — helpers in `apps/web/lib/column-filter-rich-options.tsx`.
3. Override with explicit **`filter:`** only when UX must differ from the preset (custom enum list, `date-range`, etc.).
4. **Every data column is filterable** — omitting `filter` still applies the `cellKind` preset or text fallback (`filterableColumns` in `packages/ui/src/lib/column-filter.ts`).

### Runtime (from hub rows)

Some filter types need **dataset-derived** options — built in `buildFilterFieldContextMap` (`packages/ui/src/lib/column-filter-context.ts`):

| Need | `cellKind` | Runtime source |
|------|------------|----------------|
| Person avatar picker | `person`, `people-rail` | `derivePersonFilterOptions(rows, key, cellKind)` |
| Range slider bounds | `currency`, `numeric`, `progress` (+ `dataBounds`) | `computeNumericColumnBounds(rows, key)` |

**MUST:** Toolbar **`FilterPill`** and Properties **`filter-card`** both receive **`filterFieldContext`** from `useTableState` — never hand-roll person lists in page code.

### Wiring (`HubTable`)

| Consumer | Helper |
|----------|--------|
| Properties drawer fields | `columnsToFilterFields(columns)` |
| Toolbar “Add filter” menu | `filterableColumns(columns)` |
| Resolved type/icon/options | `resolveColumnFilter(col)` |
| Person + range runtime | `filterFieldContext[fieldKey]` |

**References:** `/column-types-demo` (rule demo) · `/columns` (full catalog) · `packages/ui/tests/lib/column-filter.test.ts`

---

## Anti-patterns (MUST NOT)

1. Inline **`Intl.NumberFormat`**, star loops, paperclip counts, or custom **`DropdownMenu`** overflow in `cell:`.
2. **`Badge variant="outline"` + `uppercase`** for hub status — use **`ListHubStatusBadge`**.
3. **`font-mono`** on names, emails, dates, or KPI values — mono is for **IDs only**.
4. New hub-specific cell component when an existing **`table-cells`** export fits.
5. **`filter: undefined`** on every column thinking filters are opt-in — columns without `filter` still appear; add **`select`/`date`** when filter UX should match the data type.

---

## When to extend the DS

Add a new export in **`table-cells.tsx`** + a row in **`columns-showcase.tsx`** + **`catalog-entries.ts`** only when **≥ 2 hubs** need the same pattern and nothing in the table above fits. Ask the user first ([`exxat-reuse-before-custom.mdc`](../../.cursor/rules/exxat-reuse-before-custom.mdc)).

---

## See also

- [`reference-implementations.md`](./reference-implementations.md) — cell primitive index
- [`component-selection-guide.md`](./component-selection-guide.md) §1.1a
- `.cursor/skills/exxat-token-economy/SKILL.md` §3 — agent alias table
- [`blueprints/data-table.md`](./blueprints/data-table.md)
