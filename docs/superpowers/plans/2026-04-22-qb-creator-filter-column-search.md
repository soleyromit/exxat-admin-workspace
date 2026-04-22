# QB Creator / Last Edited By Filters + Column Header Inline Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Creator and Last Edited By filter fields to the QB filter system, and add an inline search+checkbox picker inside column header dropdown menus for all filterable columns.

**Architecture:** All changes are contained in `qb-table.tsx`. `QBFilterKey` is extended; `QB_FILTER_FIELDS` gains two new static entries (options left empty); a `qbFilterFields` derived value inside `QBTable` fills in dynamic options from `visibleQuestions` + `MOCK_QB_PERSONAS`. This computed value is threaded via props to the three filter-consuming components (`FilterPill`, `FilterPropertiesSheet`, and the new `ColHeader` inline search). The existing `getColFilterSet`/`getColFilterToggler` infrastructure already handles add/update/remove correctly once the type union is expanded.

**Tech Stack:** React 18, Next.js App Router, TypeScript — all changes in one file.

---

## File Map

| File | Change |
|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | All changes — types, dynamic options, prop threading, filter matching, ColHeader inline search |

No other files need changes.

---

### Task 1: Extend QBFilterKey and QB_FILTER_FIELDS

**Files:**
- Modify: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:355-364`

- [ ] **Step 1: Expand QBFilterKey type**

Find line ~355:
```ts
type QBFilterKey = 'status' | 'type' | 'difficulty' | 'blooms'
```
Replace with:
```ts
type QBFilterKey = 'status' | 'type' | 'difficulty' | 'blooms' | 'creator' | 'lastEditedBy'
```

- [ ] **Step 2: Add two new entries to QB_FILTER_FIELDS**

Find the `QB_FILTER_FIELDS` const (~line 359). The current array ends after the `blooms` entry. Append two new entries:
```ts
const QB_FILTER_FIELDS: { key: QBFilterKey; label: string; icon: string; options: string[] }[] = [
  { key: 'status',       label: 'Status',          icon: 'fa-circle-dot',      options: ['Saved', 'Draft'] },
  { key: 'type',         label: 'Type',             icon: 'fa-rectangle-list',  options: ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'] },
  { key: 'difficulty',   label: 'Difficulty',       icon: 'fa-signal',          options: ['Easy', 'Medium', 'Hard'] },
  { key: 'blooms',       label: "Bloom's",          icon: 'fa-brain',           options: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
  { key: 'creator',      label: 'Creator',          icon: 'fa-user',            options: [] },
  { key: 'lastEditedBy', label: 'Last Edited By',   icon: 'fa-pen-to-square',   options: [] },
]
```
The empty `options: []` is intentional — the dynamic version will fill these in per-render inside `QBTable`.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors. The `QBConditionalRule` type at ~line 484 references `QBFilterKey` — it will automatically accept the two new values.

- [ ] **Step 4: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx && git commit -m "feat(qb): extend QBFilterKey with creator and lastEditedBy"
```

---

### Task 2: Compute dynamic filter fields in QBTable and thread into FilterPill/FilterChips/AddFilterDropdown

`FilterPill` (~line 192), `AddFilterDropdown` (~line 294), and `FilterChips` (~line 319) all reference the module-level `QB_FILTER_FIELDS` constant directly. For creator/lastEditedBy the options list must be dynamic (persona names derived from `visibleQuestions`). This task passes a `filterFields` prop into these components so they use the computed version instead.

**Files:**
- Modify: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:192-350, 1637-1900`

- [ ] **Step 1: Add filterFields prop to FilterPill**

Find the `FilterPill` function signature (~line 192):
```ts
function FilterPill({ filter, onUpdate, onRemove, autoOpen = false }: {
  filter: QBFilter
  onUpdate: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemove: (id: string) => void
  autoOpen?: boolean
}) {
```
Replace with:
```ts
function FilterPill({ filter, onUpdate, onRemove, autoOpen = false, fieldDefs = QB_FILTER_FIELDS }: {
  filter: QBFilter
  onUpdate: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemove: (id: string) => void
  autoOpen?: boolean
  fieldDefs?: typeof QB_FILTER_FIELDS
}) {
```

Then update the lookup on ~line 200 from:
```ts
const fieldDef = QB_FILTER_FIELDS.find(f => f.key === filter.fieldKey)!
```
to:
```ts
const fieldDef = fieldDefs.find(f => f.key === filter.fieldKey)!
```

- [ ] **Step 2: Add filterFields prop to AddFilterDropdown**

Find the `AddFilterDropdown` function signature (~line 294):
```ts
function AddFilterDropdown({ onAdd }: { onAdd: (fieldKey: QBFilterKey) => void }) {
```
Replace with:
```ts
function AddFilterDropdown({ onAdd, fieldDefs = QB_FILTER_FIELDS }: {
  onAdd: (fieldKey: QBFilterKey) => void
  fieldDefs?: typeof QB_FILTER_FIELDS
}) {
```

Then find the `.map` inside `AddFilterDropdown` (~line 308):
```ts
{QB_FILTER_FIELDS.map(f => (
```
Replace with:
```ts
{fieldDefs.map(f => (
```

- [ ] **Step 3: Add filterFields prop to FilterChips and thread to children**

Find the `FilterChips` function signature (~line 319):
```ts
function FilterChips({
  activeFilters, bookmarkChips, lastAddedId,
  onAddFilter, onUpdateFilter, onRemoveFilter, onClearAll,
}: {
  activeFilters: QBFilter[]
  bookmarkChips: ChipDef[]
  lastAddedId: string | null
  onAddFilter: (fieldKey: QBFilterKey) => void
  onUpdateFilter: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
}) {
```
Replace with:
```ts
function FilterChips({
  activeFilters, bookmarkChips, lastAddedId,
  onAddFilter, onUpdateFilter, onRemoveFilter, onClearAll,
  filterFields = QB_FILTER_FIELDS,
}: {
  activeFilters: QBFilter[]
  bookmarkChips: ChipDef[]
  lastAddedId: string | null
  onAddFilter: (fieldKey: QBFilterKey) => void
  onUpdateFilter: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
  filterFields?: typeof QB_FILTER_FIELDS
}) {
```

Then find the `<FilterPill>` render inside `FilterChips` (~line 335):
```tsx
<FilterPill
  key={filter.id}
  filter={filter}
  onUpdate={onUpdateFilter}
  onRemove={onRemoveFilter}
  autoOpen={filter.id === lastAddedId}
/>
```
Replace with:
```tsx
<FilterPill
  key={filter.id}
  filter={filter}
  onUpdate={onUpdateFilter}
  onRemove={onRemoveFilter}
  autoOpen={filter.id === lastAddedId}
  fieldDefs={filterFields}
/>
```

Then find the `<AddFilterDropdown>` render inside `FilterChips` (~line 344):
```tsx
<AddFilterDropdown onAdd={onAddFilter} />
```
Replace with:
```tsx
<AddFilterDropdown onAdd={onAddFilter} fieldDefs={filterFields} />
```

- [ ] **Step 4: Compute qbFilterFields inside QBTable**

In `QBTable`, after the `useQB()` destructure (~line 1637), add the dynamic options computation. Find where `visibleQuestions` and `favoritedIds` are destructured from `useQB()`. Add `personas` to the destructure:

Find:
```ts
const {
  visibleQuestions,
```
In that same destructure block, add `personas`:
```ts
const {
  visibleQuestions,
  personas,
```
(it's already on `QBState` as `MOCK_QB_PERSONAS` is what it returns — confirmed from `qb-state.tsx` line 386)

Then after the `useQB()` block, add the derived field list (place it just before the `FILTERABLE_COL_VALUES` const at ~line 1763):
```ts
const qbFilterFields = QB_FILTER_FIELDS.map(f => {
  if (f.key !== 'creator' && f.key !== 'lastEditedBy') return f
  const ids = [...new Set(
    visibleQuestions.map(q => f.key === 'creator' ? q.creator : q.lastEditedBy).filter((id): id is string => !!id)
  )]
  const options = ids.map(id => personas.find(p => p.id === id)?.name ?? id).sort()
  return { ...f, options }
})
```

- [ ] **Step 5: Pass qbFilterFields to FilterChips in the JSX**

Find the `<FilterChips` render inside `QBTable` (~line 1881):
```tsx
<FilterChips
  activeFilters={activeFilters}
  bookmarkChips={...}
  lastAddedId={lastAddedFilterId}
  onAddFilter={addFilter}
  onUpdateFilter={updateFilter}
  onRemoveFilter={removeFilter}
  onClearAll={clearAllFilters}
/>
```
Add the `filterFields` prop:
```tsx
<FilterChips
  activeFilters={activeFilters}
  bookmarkChips={bookmarkOnly ? [{ key: 'bookmark', icon: 'fa-star', label: 'Bookmarked', onRemove: () => setBookmarkOnly(false) }] : []}
  lastAddedId={lastAddedFilterId}
  onAddFilter={addFilter}
  onUpdateFilter={updateFilter}
  onRemoveFilter={removeFilter}
  onClearAll={clearAllFilters}
  filterFields={qbFilterFields}
/>
```

- [ ] **Step 6: Verify TypeScript compiles and dev server renders without errors**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx && git commit -m "feat(qb): thread dynamic filter fields into FilterPill, FilterChips, AddFilterDropdown"
```

---

### Task 3: Thread dynamic filter fields into FilterPropertiesSheet

`FilterPropertiesSheet` references `QB_FILTER_FIELDS` in four places: the active-filter list (~line 717), the Add filter dropdown (~line 788), the conditional-rules list (~line 970), and the Add rule dropdown (~line 1061). All four need to use the dynamic version.

**Files:**
- Modify: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:496-544, 700-800, 960-1075, 2840-2860`

- [ ] **Step 1: Add filterFields prop to FilterPropertiesSheet**

Find the `FilterPropertiesSheet` props interface (~line 511). It currently ends with:
```ts
  initialPanel?: SheetPanel
}
```
Replace those two lines with:
```ts
  initialPanel?: SheetPanel
  filterFields?: typeof QB_FILTER_FIELDS
}
```

Find the destructure at the top of `FilterPropertiesSheet` (~line 496):
```ts
function FilterPropertiesSheet({
  open, onOpenChange,
  activeFilters, onAddFilter, onUpdateFilter, onRemoveFilter,
  expandedFilterIds, onExpandedFilterIdsChange,
  filterLogic, onToggleFilterLogic,
  filterBarVisible, onFilterBarVisibleChange,
  bookmarkOnly, setBookmarkOnly,
  hiddenCols, setHiddenCols,
  filteredCount, totalCount,
  sortCol, sortDir, onSort,
  groupBy, onGroupByChange,
  showGridlines, onShowGridlinesChange,
  rowHeight, onRowHeightChange,
  conditionalRules, onAddConditionalRule, onRemoveConditionalRule, onUpdateConditionalRule,
  initialPanel,
}: {
```
Replace with (add `filterFields = QB_FILTER_FIELDS` to destructure):
```ts
function FilterPropertiesSheet({
  open, onOpenChange,
  activeFilters, onAddFilter, onUpdateFilter, onRemoveFilter,
  expandedFilterIds, onExpandedFilterIdsChange,
  filterLogic, onToggleFilterLogic,
  filterBarVisible, onFilterBarVisibleChange,
  bookmarkOnly, setBookmarkOnly,
  hiddenCols, setHiddenCols,
  filteredCount, totalCount,
  sortCol, sortDir, onSort,
  groupBy, onGroupByChange,
  showGridlines, onShowGridlinesChange,
  rowHeight, onRowHeightChange,
  conditionalRules, onAddConditionalRule, onRemoveConditionalRule, onUpdateConditionalRule,
  initialPanel,
  filterFields = QB_FILTER_FIELDS,
}: {
```

- [ ] **Step 2: Replace QB_FILTER_FIELDS references inside FilterPropertiesSheet with filterFields**

There are four occurrences inside the body of `FilterPropertiesSheet`. Replace each:

**Occurrence 1** (~line 717) — active filters list:
```ts
const fieldDef = QB_FILTER_FIELDS.find(fd => fd.key === f.fieldKey)
```
→
```ts
const fieldDef = filterFields.find(fd => fd.key === f.fieldKey)
```

**Occurrence 2** (~line 788) — Add filter dropdown:
```tsx
{QB_FILTER_FIELDS.map(f => (
```
→
```tsx
{filterFields.map(f => (
```

**Occurrence 3** (~line 970) — conditional rules list:
```ts
const fieldDef = QB_FILTER_FIELDS.find(fd => fd.key === rule.fieldKey)
```
→
```ts
const fieldDef = filterFields.find(fd => fd.key === rule.fieldKey)
```

**Occurrence 4** (~line 1061) — Add rule dropdown:
```tsx
{QB_FILTER_FIELDS.map(f => (
```
→
```tsx
{filterFields.map(f => (
```

- [ ] **Step 3: Pass qbFilterFields to FilterPropertiesSheet in QBTable JSX**

Find the `<FilterPropertiesSheet` render (~line 2840). It currently has many props and ends before the closing `/>`. Add `filterFields={qbFilterFields}` as a new prop (place it just before the closing `/>` or after `initialPanel`):
```tsx
filterFields={qbFilterFields}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx && git commit -m "feat(qb): thread dynamic filter fields into FilterPropertiesSheet"
```

---

### Task 4: Implement creator / lastEditedBy filter matching

With the type and UI in place, the actual filter logic needs to handle the two new field keys. The existing block in `filteredQuestions` (~line 1824) resolves `q.status`, `q.type`, `q.difficulty`, `q.blooms` — extend it with `creator` and `lastEditedBy`.

**Files:**
- Modify: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:1824-1834`

- [ ] **Step 1: Add creator and lastEditedBy cases to filteredQuestions**

Find the filter-matching block inside the `filteredQuestions` useMemo/filter:
```ts
    for (const f of activeNonEmptyFilters) {
      let val = ''
      if (f.fieldKey === 'status')     val = q.status
      if (f.fieldKey === 'type')       val = q.type
      if (f.fieldKey === 'difficulty') val = q.difficulty
      if (f.fieldKey === 'blooms')     val = q.blooms
      const matches = f.values.includes(val)
      if (f.operator === 'is'     && !matches) return false
      if (f.operator === 'is_not' &&  matches) return false
    }
```
Replace with:
```ts
    for (const f of activeNonEmptyFilters) {
      let val = ''
      if (f.fieldKey === 'status')        val = q.status
      if (f.fieldKey === 'type')          val = q.type
      if (f.fieldKey === 'difficulty')    val = q.difficulty
      if (f.fieldKey === 'blooms')        val = q.blooms
      if (f.fieldKey === 'creator')       val = personas.find(p => p.id === q.creator)?.name ?? ''
      if (f.fieldKey === 'lastEditedBy')  val = personas.find(p => p.id === q.lastEditedBy)?.name ?? ''
      const matches = f.values.includes(val)
      if (f.operator === 'is'     && !matches) return false
      if (f.operator === 'is_not' &&  matches) return false
    }
```

Note: `personas` is already available in `QBTable` scope from Task 2 Step 4.

- [ ] **Step 2: Verify filters work end-to-end**

Start the dev server if not running:
```bash
kill $(lsof -ti :3001) 2>/dev/null; nohup bash -c 'cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev' > /tmp/exam-admin-dev.log 2>&1 &
```
Then open `http://localhost:3001` and:
1. Open the filter toolbar → click `+ Add filter` → confirm "Creator" and "Last Edited By" appear in the picker
2. Add a "Creator" filter → confirm Dr. Thompson, Dr. Chen, etc. appear as options (from visibleQuestions)
3. Check "Dr. Thompson" → confirm the table rows reduce to only her questions
4. Switch to "My Questions" nav view → confirm Creator options narrow to match
5. Add a "Last Edited By" filter → confirm it works independently
6. Open FilterPropertiesSheet → confirm both new fields appear in "Add filter" and "Add rule" dropdowns
7. Confirm all existing filters (Status, Type, Difficulty, Bloom's) still work exactly as before

- [ ] **Step 3: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx && git commit -m "feat(qb): add creator and lastEditedBy filter matching"
```

---

### Task 5: Add inline search to ColHeader + wire in QBTable

Add a search input + checkbox list to `ColHeader`'s `DropdownMenuContent` for the 6 filterable columns (status, type, difficulty, blooms, creator, lastEditedBy). Selecting a value creates or updates the corresponding `QBFilter` using the existing `getColFilterToggler` infrastructure.

**Files:**
- Modify: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:1432-1634, 1763-1792, 2186-2230`

- [ ] **Step 1: Add filterOptions, filterSet, onFilterToggle props to ColHeader**

Find the `ColHeader` props interface (~line 1442):
```ts
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: () => void
  onDragEnd?: () => void
  dragOverStyle?: React.CSSProperties
}
```
Add three new optional props before `dragOverStyle`:
```ts
  filterOptions?: string[]
  filterSet?: Set<string>
  onFilterToggle?: (v: string) => void
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: () => void
  onDragEnd?: () => void
  dragOverStyle?: React.CSSProperties
}
```

Also update the function parameter destructure (~line 1432):
```ts
function ColHeader({
  col, sortCol, sortDir, onSort, onHide,
  onPinLeft, onPinRight, onUnpin,
  pinnedLeft, pinnedRight,
  wrapText, onToggleWrapText,
  onOpenFilterPanel,
  className,
  distQuestions,
  bloomsQuestions,
  draggable, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverStyle,
}: {
```
Replace with:
```ts
function ColHeader({
  col, sortCol, sortDir, onSort, onHide,
  onPinLeft, onPinRight, onUnpin,
  pinnedLeft, pinnedRight,
  wrapText, onToggleWrapText,
  onOpenFilterPanel,
  className,
  distQuestions,
  bloomsQuestions,
  filterOptions,
  filterSet,
  onFilterToggle,
  draggable, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverStyle,
}: {
```

Also add a local state for the inline search input inside `ColHeader`, immediately after the existing `bloomsHoverTimerRef` declaration (~line 1477):
```ts
const [colSearch, setColSearch] = useState('')
const hasInlineFilter = !!filterOptions && filterOptions.length > 0
const filteredColOptions = colSearch
  ? (filterOptions ?? []).filter(o => o.toLowerCase().includes(colSearch.toLowerCase()))
  : (filterOptions ?? [])
```

- [ ] **Step 2: Add inline search UI inside DropdownMenuContent**

Find the `DropdownMenuContent` opening tag inside `ColHeader` (~line 1563):
```tsx
        <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={e => e.preventDefault()}>
          {/* Pin actions */}
```
Replace with the block below. The inline search section is prepended before the existing pin/sort actions:
```tsx
        <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={e => e.preventDefault()}>
          {/* Inline column value search — only for filterable columns */}
          {hasInlineFilter && (
            <>
              <div className="px-2 pt-2 pb-1" onKeyDown={e => e.stopPropagation()}>
                <Input
                  placeholder="Search values…"
                  value={colSearch}
                  onChange={e => setColSearch(e.target.value)}
                  className="h-7 text-xs"
                  style={{ fontSize: 12 }}
                  autoFocus={false}
                />
              </div>
              <div className="max-h-40 overflow-y-auto py-0.5">
                {filteredColOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                ) : filteredColOptions.map(opt => {
                  const checked = filterSet?.has(opt) ?? false
                  return (
                    <DropdownMenuItem
                      key={opt}
                      onSelect={e => { e.preventDefault(); onFilterToggle?.(opt) }}
                      className="gap-2 text-xs"
                    >
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center justify-center shrink-0 rounded-[3px] border transition-colors"
                        style={{
                          width: 13, height: 13,
                          background: checked ? 'var(--primary)' : 'var(--background)',
                          borderColor: checked ? 'var(--primary)' : 'var(--border-control-3)',
                        }}
                      >
                        {checked && <i className="fa-solid fa-check text-primary-foreground" aria-hidden="true" style={{ fontSize: 7 }} />}
                      </span>
                      {opt}
                    </DropdownMenuItem>
                  )
                })}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          {/* Pin actions */}
```

- [ ] **Step 3: Reset colSearch when the dropdown closes**

Find the `useEffect` block that cleans up the hover timers (~line 1479):
```ts
  useEffect(() => {
    return () => {
      if (diffHoverTimerRef.current) clearTimeout(diffHoverTimerRef.current)
      if (bloomsHoverTimerRef.current) clearTimeout(bloomsHoverTimerRef.current)
    }
  }, [])
```

The DropdownMenu needs to clear `colSearch` on close. Wrap the `DropdownMenu` render in `ColHeader` to track open state. Find the `<DropdownMenu>` opening tag (~line 1497):
```tsx
      <DropdownMenu>
```
Replace with:
```tsx
      <DropdownMenu onOpenChange={open => { if (!open) setColSearch('') }}>
```

- [ ] **Step 4: Update getColFilterSet and getColFilterToggler to use qbFilterFields**

The two guard checks inside these functions still reference `QB_FILTER_FIELDS`. After Task 1, `QB_FILTER_FIELDS` now includes creator/lastEditedBy so the guards already pass — but the `FILTERABLE_COL_VALUES` const at ~line 1763 needs updating to include the new keys too (it's used nowhere functionally anymore given the guards, but keep it in sync):

Find:
```ts
  const FILTERABLE_COL_VALUES: Partial<Record<ColKey, string[]>> = {
    status: ['Saved', 'Draft'],
    type: ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'],
    difficulty: ['Easy', 'Medium', 'Hard'],
    blooms: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
  }
```
Replace with:
```ts
  const FILTERABLE_COL_VALUES: Partial<Record<ColKey, string[]>> = {
    status:       ['Saved', 'Draft'],
    type:         ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'],
    difficulty:   ['Easy', 'Medium', 'Hard'],
    blooms:       ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    creator:      qbFilterFields.find(f => f.key === 'creator')?.options ?? [],
    lastEditedBy: qbFilterFields.find(f => f.key === 'lastEditedBy')?.options ?? [],
  }
```

- [ ] **Step 5: Wire filterOptions, filterSet, onFilterToggle in QBTable's ColHeader render**

Find the `<ColHeader` render block (~line 2186). It currently ends around line 2230. Add three new props after the existing `bloomsQuestions` prop:
```tsx
                        bloomsQuestions={col.key === 'blooms' ? filteredQuestions : undefined}
                        filterOptions={qbFilterFields.find(f => f.key === col.key)?.options}
                        filterSet={getColFilterSet(col.key)}
                        onFilterToggle={getColFilterToggler(col.key)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && npx tsc --noEmit 2>&1 | head -30
```
Expected: no new errors.

- [ ] **Step 7: Verify inline search end-to-end**

Open `http://localhost:3001`. In the QB table:
1. Hover over the **Status** column header → click the `⌄` chevron → confirm a search input appears at the top of the dropdown with "Saved" and "Draft" as checkboxes
2. Check "Draft" → confirm the Status filter chip appears in the toolbar with "Status Draft" and rows reduce to drafts
3. Reopen the Status column header dropdown → confirm "Draft" checkbox is checked (state reflected)
4. Uncheck "Draft" → confirm the filter chip disappears and all rows return
5. Repeat for **Creator** column → confirm Dr. Thompson, Dr. Chen, etc. appear as options
6. Check a creator → confirm filter chip appears and rows reduce correctly
7. Confirm **Title**, **Usage**, **Version** column headers have NO search section (non-filterable)
8. Confirm the **Filter by this column** menu item still opens FilterPropertiesSheet as before
9. Confirm all existing sort/pin/hide/wrap-text menu items still work

- [ ] **Step 8: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx && git commit -m "feat(qb): inline search picker in column header dropdown for filterable columns"
```
