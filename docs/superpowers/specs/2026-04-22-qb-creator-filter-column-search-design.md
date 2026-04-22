# Design Spec — QB Creator / Last Edited By Filters + Column Header Inline Search
**Date:** 2026-04-22
**Product:** Exam Management — Admin · Question Bank
**Files in scope:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx`

---

## 1. Overview

Two related features that extend the Question Bank table's filtering capabilities:

1. **Creator and Last Edited By filters** — add two new filter fields to the existing QB filter system (toolbar chips + FilterPropertiesSheet)
2. **Column header inline search** — add a search + checkbox picker directly inside the column header dropdown menu for filterable columns

Both features share the same `QBFilter` state as the existing filters (single source of truth).

---

## 2. Feature 1 — Creator & Last Edited By Filters

### 2.1 Type Changes

`QBFilterKey` in `qb-table.tsx` expands from:
```ts
type QBFilterKey = 'status' | 'type' | 'difficulty' | 'blooms'
```
to:
```ts
type QBFilterKey = 'status' | 'type' | 'difficulty' | 'blooms' | 'creator' | 'lastEditedBy'
```

### 2.2 Dynamic Field Definitions

`QB_FILTER_FIELDS` changes from a static const array to a function that accepts `visibleQuestions: Question[]` and `personas: Persona[]`:

```ts
function getQBFilterFields(visibleQuestions: Question[], personas: Persona[]) {
  // For creator: collect unique persona IDs from visibleQuestions, map to display names
  const creatorNames = [...new Set(
    visibleQuestions.map(q => q.creator).filter(Boolean)
  )].map(id => personas.find(p => p.id === id)?.name ?? id).sort()

  const lastEditedNames = [...new Set(
    visibleQuestions.map(q => q.lastEditedBy).filter(Boolean)
  )].map(id => personas.find(p => p.id === id)?.name ?? id).sort()

  return [
    { key: 'status',      label: 'Status',          icon: 'fa-circle-dot',      options: ['Saved', 'Draft'] },
    { key: 'type',        label: 'Type',             icon: 'fa-rectangle-list',  options: ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'] },
    { key: 'difficulty',  label: 'Difficulty',       icon: 'fa-signal',          options: ['Easy', 'Medium', 'Hard'] },
    { key: 'blooms',      label: "Bloom's",          icon: 'fa-brain',           options: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
    { key: 'creator',     label: 'Creator',          icon: 'fa-user',            options: creatorNames },
    { key: 'lastEditedBy',label: 'Last Edited By',   icon: 'fa-pen-to-square',   options: lastEditedNames },
  ] as const
}
```

- Options are derived from `visibleQuestions` (pre-filter, post-folder/role/nav) — dynamic, not static
- Options contain **display names** (`'Dr. Thompson'`), not persona IDs

### 2.3 Filter Matching Logic

In the `filteredQuestions` derived list, add two new cases to the existing field-matching block:

```ts
if (f.fieldKey === 'creator') {
  const name = personas.find(p => p.id === q.creator)?.name ?? q.creator ?? ''
  val = name
}
if (f.fieldKey === 'lastEditedBy') {
  const name = personas.find(p => p.id === q.lastEditedBy)?.name ?? q.lastEditedBy ?? ''
  val = name
}
```

- Resolves persona ID → display name before comparing against filter values
- Questions with `undefined` creator/lastEditedBy fall back to empty string (excluded from "is" matches, included in "is not" matches)

### 2.4 Data Source for Personas

`QBTable` already imports `visibleQuestions` from `useQB()`. It needs to also pull `personas` from the same context:

```ts
const { visibleQuestions, personas, ... } = useQB()
```

`personas` is already exposed on `QBState` as `MOCK_QB_PERSONAS`.

### 2.5 UI Surfaces

No new components. The two new fields appear automatically in:
- **`AddFilterDropdown`** — the `+ Add filter` picker lists all field definitions
- **`FilterPropertiesSheet` filter panel** — `QBFilterCard` renders each active filter using the field definition's options list
- **`FilterPill` toolbar chips** — chip label uses `fieldDef.label` and counts selected values

---

## 3. Feature 2 — Column Header Inline Search

### 3.1 Which Columns Get the Search Bar

Only columns that have a corresponding entry in `QB_FILTER_FIELDS` (filterable columns):

| Column key | Filterable |
|---|---|
| `status` | Yes |
| `type` | Yes |
| `difficulty` | Yes |
| `blooms` | Yes |
| `creator` | Yes |
| `lastEditedBy` | Yes |
| `title`, `location`, `usage`, `pbis`, `version` | No — menu unchanged |

### 3.2 ColHeader Prop Changes

`ColHeader` receives two new optional props:

```ts
filterFieldDef?: { key: QBFilterKey; label: string; icon: string; options: string[] }
activeColumnFilter?: QBFilter | undefined
onColumnFilterChange?: (values: string[]) => void
```

- `filterFieldDef` — the field definition for this column (passed only for filterable columns)
- `activeColumnFilter` — the current `QBFilter` for this column if one exists (so checkboxes reflect existing state)
- `onColumnFilterChange` — callback that receives the new selected values array; parent handles add/update/remove

### 3.3 Inline Search UI in DropdownMenuContent

For filterable columns, prepend to `DropdownMenuContent` before the pin actions:

```
┌─────────────────────────────────────┐
│ [🔍 Search values…          ]       │  ← Input inside menu, prevents close on type
│                                     │
│  ☑ Dr. Thompson                     │  ← Checkbox row, onSelect preventDefault
│  ☐ Dr. Chen                         │
│  ☐ Dr. Patel                        │
├─────────────────────────────────────┤
│ Pin left / Pin right / Unpin        │
│ Sort ascending / descending         │
│ Wrap text                           │
│ ─────────────────────────────────   │
│ Filter by this column               │  ← Still present; opens FilterPropertiesSheet
│ Group by this column                │
│ Add conditional rule                │
│ ─────────────────────────────────   │
│ Hide column                         │
└─────────────────────────────────────┘
```

**Implementation details:**
- `Input` inside the dropdown: wrap in a `div` with `onKeyDown={e => e.stopPropagation()}` to prevent Radix from closing on keystroke
- Each checkbox row: `onSelect={e => e.preventDefault()}` to prevent the dropdown from closing on click
- Checking a value calls `onColumnFilterChange([...currentValues, value])`
- Unchecking calls `onColumnFilterChange(currentValues.filter(v => v !== value))`
- When resulting values array is empty, parent removes that filter entirely
- Options list is filtered client-side by the search input value (same pattern as `FilterPill`)
- A `DropdownMenuSeparator` separates the search block from the pin/sort actions

### 3.4 Parent Wiring in QBTable

`QBTable` passes down to each `ColHeader`:

```ts
filterFieldDef={getQBFilterFields(visibleQuestions, personas).find(f => f.key === col.key)}
activeColumnFilter={activeFilters.find(f => f.fieldKey === col.key)}
onColumnFilterChange={(values) => {
  const existing = activeFilters.find(f => f.fieldKey === col.key as QBFilterKey)
  if (values.length === 0) {
    if (existing) removeFilter(existing.id)
  } else if (existing) {
    updateFilter(existing.id, { values })
  } else {
    addFilter(col.key as QBFilterKey, values)
  }
}}
```

`addFilter` needs a small signature extension to accept an optional initial `values` array (currently it only takes a `fieldKey`).

---

## 4. What Does Not Change

- `QBFilter` shape (`id`, `fieldKey`, `operator`, `values`) — unchanged
- Filter logic operators (`is` / `is_not`) — still available via FilterPropertiesSheet; column header picker uses `is` by default
- `FilterPropertiesSheet` "Filter by this column" menu item — kept; opens the sheet for operator control
- All non-filterable column header menus — unchanged
- `qb-state.tsx`, `qb-types.ts` — no changes needed

---

## 5. Edge Cases

| Scenario | Behaviour |
|---|---|
| Question has no `creator` set | Excluded from "Creator is X" matches; not shown as an option |
| All values unchecked via column header | Filter for that column is removed entirely |
| Column header + filter chip both active | Same `QBFilter` object — they stay in sync |
| Persona in filter but no longer in visibleQuestions | Still shown as selected chip (filter value persists); options list won't show them unless they reappear in visibleQuestions |
| `lastEditedBy` undefined on a question | Treated as empty string — same as no-creator case |
