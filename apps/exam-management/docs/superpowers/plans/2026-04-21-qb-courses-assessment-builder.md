# QB, Courses & Assessment Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the QB table (DS Table migration, neutral difficulty, type/location/favorites columns, hybrid column context menus), clean up the QB sidebar, replace the Courses and Assessment Builder scaffold pages with the designed layouts.

**Architecture:** Three independent phases — QB Updates touches existing files in `app/(app)/question-bank/`; Courses and Assessment Builder replace scaffold clients in their respective routes. All state stays in mock data (no API). DS `Table` primitives replace the raw `<table>` in QB.

**Tech Stack:** Next.js 14 App Router, TypeScript, `@exxat/ds/packages/ui/src` (DS Table, DropdownMenu, Button, Badge, Checkbox, Sheet, Chart), Font Awesome Pro icons, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-04-20-qb-courses-assessment-builder-design.md`

**No test infrastructure exists** — each task ends with a visual verification step in the browser at `http://localhost:3001`.

---

## File Map

### Modified
- `app/globals.css` — new CSS tokens (diff, status)
- `components/qb/badges.tsx` — DiffBadge → plain text, no DS Badge wrapper
- `app/(app)/question-bank/qb-table.tsx` — DS Table migration, column restructure, context menus, favorites
- `app/(app)/question-bank/qb-sidebar.tsx` — display name transform, remove Question Set + Lock Folder
- `app/(app)/question-bank/qb-modals.tsx` — remove FilterSheet, remove Folder Visibility tab
- `app/(app)/question-bank/qb-state.tsx` — wire columnOrder, fix timer leak, remove dead state
- `lib/qb-types.ts` — add `ColumnId` discriminated union, add AB types

### Replaced (scaffold → designed)
- `app/(app)/courses/courses-client.tsx` — full table layout
- `app/(app)/assessment-builder/assessment-builder-client.tsx` — persistent split layout

### Deleted
- `components/qb/tooltip.tsx` — unused
- `components/qb/portal.tsx` — unused

---

## Phase 1 — Foundation

### Task 1: CSS tokens + dead code removal

**Files:**
- Modify: `app/globals.css`
- Delete: `components/qb/tooltip.tsx`
- Delete: `components/qb/portal.tsx`

- [ ] **Step 1: Add new CSS tokens to globals.css**

Open `apps/exam-management/admin/app/globals.css`. Find the `/* QB color tokens */` block and add:

```css
/* Difficulty — neutral weight, no color */
--qb-diff-easy:   oklch(0.55 0.005 270);
--qb-diff-medium: oklch(0.35 0.005 270);
--qb-diff-hard:   oklch(0.18 0.005 270);

/* Status — updated tints */
--qb-status-saved-bg: oklch(0.93 0.04 200 / 0.25);
--qb-status-saved-fg: oklch(0.35 0.12 200);
--qb-status-draft-bg: oklch(0.93 0.03 80 / 0.25);
--qb-status-draft-fg: oklch(0.45 0.1 70);
```

- [ ] **Step 2: Delete unused QB components**

```bash
rm apps/exam-management/admin/components/qb/tooltip.tsx
rm apps/exam-management/admin/components/qb/portal.tsx
```

- [ ] **Step 3: Verify no imports reference the deleted files**

```bash
grep -r "qb/tooltip\|qb/portal" apps/exam-management/admin/
```

Expected: no output. If any file imports them, remove that import.

- [ ] **Step 4: Commit**

```bash
cd /Users/romitsoley/Work
git add apps/exam-management/admin/app/globals.css
git add -u apps/exam-management/admin/components/qb/tooltip.tsx
git add -u apps/exam-management/admin/components/qb/portal.tsx
git commit -m "chore(qb): add diff/status CSS tokens, remove unused tooltip and portal components"
```

---

### Task 2: DiffBadge → neutral weight text

**Files:**
- Modify: `components/qb/badges.tsx`

- [ ] **Step 1: Replace DiffBadge**

Open `apps/exam-management/admin/components/qb/badges.tsx`. Find the `DiffBadge` component and replace it entirely:

```tsx
export function DiffBadge({ diff }: { diff: QDiff }) {
  const styles: Record<QDiff, { fontWeight: number; color: string }> = {
    Easy:   { fontWeight: 400, color: 'var(--qb-diff-easy)' },
    Medium: { fontWeight: 600, color: 'var(--qb-diff-medium)' },
    Hard:   { fontWeight: 800, color: 'var(--qb-diff-hard)' },
  }
  const s = styles[diff]
  return (
    <span style={{ fontSize: 11.5, fontWeight: s.fontWeight, color: s.color, letterSpacing: diff === 'Hard' ? '-0.01em' : undefined }}>
      {diff}
    </span>
  )
}
```

- [ ] **Step 2: Update StatusBadge to use new tokens**

Find `StatusBadge` in the same file. Replace the status map entries for `Saved` and `Draft` (remove all other statuses — only these two remain in QB):

```tsx
type QStatusReduced = 'Saved' | 'Draft'

const STATUS_MAP: Record<QStatusReduced, { bg: string; fg: string; icon: string }> = {
  Saved: { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', icon: 'fa-circle' },
  Draft: { bg: 'var(--qb-status-draft-bg)', fg: 'var(--qb-status-draft-fg)', icon: 'fa-circle-half-stroke' },
}

export function StatusBadge({ status }: { status: QStatusReduced }) {
  const s = STATUS_MAP[status]
  if (!s) return null
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2.5 py-0.5 gap-1 font-semibold whitespace-nowrap text-[10px]"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-solid ${s.icon}`} aria-hidden="true" style={{ fontSize: 8 }} />
      {status}
    </Badge>
  )
}
```

- [ ] **Step 3: Update QStatus type in qb-types.ts**

Open `apps/exam-management/admin/lib/qb-types.ts`. Replace:

```ts
export type QStatus = 'Saved' | 'Draft'
```

Remove any other status values if they exist. The type now has exactly two members.

- [ ] **Step 4: Visual verification**

Run `pnpm dev` (port 3001), navigate to `/question-bank`. Confirm:
- Difficulty cells show plain text with weight: "Easy" (light), "**Medium**" (semibold), "**Hard**" (heavy black)
- Status pills show teal for Saved, amber for Draft — no other status values visible

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/components/qb/badges.tsx \
        apps/exam-management/admin/lib/qb-types.ts
git commit -m "feat(qb): DiffBadge neutral weight text, StatusBadge Saved/Draft only"
```

---

## Phase 2 — QB Table Redesign

### Task 3: DS Table primitives migration

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

This is the largest single task. The existing raw `<table>` is replaced with DS primitives. Layout and logic are preserved — only the JSX element names change.

- [ ] **Step 1: Add DS Table imports to qb-table.tsx**

At the top of `qb-table.tsx`, add to the existing DS import line:

```tsx
import {
  // existing imports ...
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@exxat/ds/packages/ui/src'
```

- [ ] **Step 2: Replace table root elements**

Find the JSX that renders `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` and replace with DS equivalents. The DS components accept `className` and `style` props identically to HTML elements.

Mapping:
```
<table>   → <Table>
<thead>   → <TableHeader>
<tbody>   → <TableBody>
<tr>      → <TableRow>
<th>      → <TableHead>
<td>      → <TableCell>
```

Example — the header row:
```tsx
// Before
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr>
      <th className="...">...</th>

// After
<Table style={{ width: '100%' }}>
  <TableHeader>
    <TableRow>
      <TableHead className="...">...</TableHead>
```

Apply this replacement throughout the entire component. Keep all existing `className`, `style`, and event handler props intact on each replaced element.

- [ ] **Step 3: Fix any TypeScript errors**

```bash
cd apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

DS `TableHead` does not forward `colSpan` — if any `<th colSpan={...}>` exists, move `colSpan` into a wrapping `<div>` or restructure. DS `TableCell` does forward `colSpan`.

- [ ] **Step 4: Visual verification**

Navigate to `/question-bank`. Table should look identical to before — DS primitives apply the same `--dt-*` token styling. Confirm no layout regression.

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx
git commit -m "refactor(qb): migrate table to DS Table/TableHeader/TableBody/TableRow/TableHead/TableCell primitives"
```

---

### Task 4: Column restructure — Type, Location, Creator, Favorites

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`
- Modify: `lib/qb-types.ts`

- [ ] **Step 1: Update QB_COLS constant**

In `qb-table.tsx`, find the `QB_COLS` array. Replace it entirely:

```tsx
type ColumnId =
  | 'select' | 'title' | 'status' | 'type' | 'difficulty'
  | 'blooms' | 'location' | 'creator' | 'lastEditedBy'
  | 'usage' | 'pbis' | 'version' | 'favorited' | 'actions'

const QB_COLS: { key: ColumnId; label: string; hideable: boolean; sortable: boolean }[] = [
  { key: 'select',      label: '',              hideable: false, sortable: false },
  { key: 'title',       label: 'Question',      hideable: false, sortable: true  },
  { key: 'status',      label: 'Status',        hideable: false, sortable: true  },
  { key: 'type',        label: 'Type',          hideable: true,  sortable: true  },
  { key: 'difficulty',  label: 'Difficulty',    hideable: true,  sortable: true  },
  { key: 'blooms',      label: "Bloom's",       hideable: true,  sortable: true  },
  { key: 'location',    label: 'Location',      hideable: true,  sortable: false },
  { key: 'creator',     label: 'Creator',       hideable: true,  sortable: false },
  { key: 'lastEditedBy',label: 'Last Edited By',hideable: true,  sortable: false },
  { key: 'usage',       label: 'Usage',         hideable: true,  sortable: true  },
  { key: 'pbis',        label: 'P–',            hideable: true,  sortable: true  },
  { key: 'version',     label: 'Ver.',          hideable: true,  sortable: false },
  { key: 'favorited',   label: '★',             hideable: false, sortable: false },
  { key: 'actions',     label: '',              hideable: false, sortable: false },
]
```

- [ ] **Step 2: Update Question title cell — remove type pill**

Find the question cell renderer. Remove the sub-row that shows the type badge. The title cell now shows only:
- Pin icon (if `q.pinned`)
- Question title text
- Code badge (`q.code`) — keep this

```tsx
// Question cell — title + code only (no type pill)
<TableCell key="title" style={{ ...TD, minWidth: 280, maxWidth: 380 }}>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
    {q.pinned && (
      <i className="fa-solid fa-thumbtack" aria-hidden="true"
        style={{ fontSize: 10, color: 'var(--brand-color)', marginTop: 3, transform: 'rotate(45deg)', flexShrink: 0 }} />
    )}
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.4 }}>
        {q.title}
      </div>
      <div style={{ marginTop: 3 }}>
        <Badge variant="secondary" className="rounded font-mono border border-border"
          style={{ fontSize: 10, padding: '1px 5px' }}>
          {q.code}
        </Badge>
      </div>
    </div>
  </div>
</TableCell>
```

- [ ] **Step 3: Add Type column cell**

In the row renderer, add a cell for `type` key:

```tsx
{col.key === 'type' && (
  <TableCell key="type" style={{ ...TD, width: 100 }}>
    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted-foreground)' }}>
      {q.type}
    </span>
  </TableCell>
)}
```

- [ ] **Step 4: Add Location column cell (rename from subfolder)**

Replace the existing `subfolder` cell renderer with a `location` cell:

```tsx
{col.key === 'location' && (
  <TableCell key="location" style={{ ...TD, width: 180 }}>
    {q.folderPath ? (() => {
      // folderPath format: "PHAR101 QB / Antibiotics & Antimicrobials"
      const parts = q.folderPath.split(' / ')
      const courseRoot = parts[0]   // e.g. "PHAR101 QB"
      const sub = parts.slice(1).join(' / ')  // e.g. "Antibiotics & Antimicrobials"
      // Find the course root folder id
      const rootFolder = folders.find(f => f.isCourse && f.name.startsWith(courseRoot.split(' ')[0]))
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <button
            onClick={(e) => { e.stopPropagation(); if (rootFolder) navigateToFolder(rootFolder.id) }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--brand-color)', textDecoration: 'underline', textUnderlineOffset: 2,
              fontSize: 11, fontFamily: 'inherit' }}
          >
            {courseRoot}
          </button>
          {sub && (
            <>
              <span style={{ opacity: 0.4 }}>›</span>
              <span style={{ color: 'var(--muted-foreground)' }}>{sub}</span>
            </>
          )}
        </div>
      )
    })() : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
  </TableCell>
)}
```

Note: `folders` and `navigateToFolder` must be pulled from QB context — add them to the destructured context at the top of the component.

- [ ] **Step 5: Add Creator column cell**

```tsx
{col.key === 'creator' && (
  <TableCell key="creator" style={{ ...TD, width: 130 }}>
    {(() => {
      const p = MOCK_QB_PERSONAS.find(x => x.id === q.creator)
      if (!p) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: p.color,
            color: 'white', fontSize: 8, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{p.initials}</div>
          <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{p.name}</span>
        </div>
      )
    })()}
  </TableCell>
)}
```

Import `MOCK_QB_PERSONAS` from `@/lib/qb-mock-data` at the top of the file.

- [ ] **Step 6: Replace FavoritedCell — star icon**

Find `FavoritedCell` and replace the bookmark icon with a star:

```tsx
function FavoritedCell({ questionId }: { questionId: string }) {
  const { favoritedIds, toggleQuestionFavorited } = useQBState()
  const isFav = favoritedIds.has(questionId)
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={(e) => { e.stopPropagation(); toggleQuestionFavorited(questionId) }}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      style={{ color: isFav ? 'var(--chart-4)' : 'var(--muted-foreground)', opacity: isFav ? 1 : 0 }}
      className="transition-opacity group-hover:opacity-100"
    >
      <i className={`${isFav ? 'fa-solid' : 'fa-light'} fa-star`} aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  )
}
```

Add `group` class to each `<TableRow>` so `group-hover:opacity-100` applies to star buttons within it:

```tsx
<TableRow key={q.id} className="group" ...>
```

- [ ] **Step 7: Update toolbar favorites toggle**

Find the bookmark toggle button in the toolbar. Replace bookmark icon with star:

```tsx
<Button
  variant="outline"
  size="icon-sm"
  aria-label="Show favorites only"
  aria-pressed={favoritesFilter}
  onClick={() => setFavoritesFilter(!favoritesFilter)}
  style={favoritesFilter ? {
    borderColor: 'var(--chart-4)',
    color: 'var(--chart-4)',
    backgroundColor: 'color-mix(in oklch, var(--chart-4) 10%, var(--background))',
  } : {}}
>
  <i className={`${favoritesFilter ? 'fa-solid' : 'fa-light'} fa-star`} aria-hidden="true" style={{ fontSize: 13 }} />
</Button>
```

- [ ] **Step 8: Remove old subfolder / bookmark / code columns**

Search for `col.key === 'subfolder'`, `col.key === 'code'`, and any remaining `fa-bookmark` references in `qb-table.tsx`. Delete those cell renderers.

- [ ] **Step 9: Visual verification**

Navigate to `/question-bank`. Confirm:
- Question column: title + code badge only (no type pill under title)
- Type column: plain neutral text (MCQ, Fill blank, etc.)
- Difficulty: weight-only text, no pill
- Location column: `PHAR101 QB › Antibiotics` with clickable course root
- Creator column: avatar + name
- Last Edited By: avatar + name
- ★ column: empty star (hidden until hover), filled gold star if favorited
- Toolbar ★ toggle filters to favorited questions only

- [ ] **Step 10: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx \
        apps/exam-management/admin/lib/qb-mock-data.ts
git commit -m "feat(qb): column restructure — type/location/creator columns, star favorites, remove type pill"
```

---

### Task 5: Status filter — Saved/Draft only + My Questions tab

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

- [ ] **Step 1: Simplify status filter options**

Find `FilterSection` for status inside `FilterPropertiesSheet`. Replace with Saved/Draft only:

```tsx
<FilterSection<'Saved' | 'Draft'>
  label="Status"
  options={['Saved', 'Draft']}
  active={statusFilter as Set<'Saved' | 'Draft'>}
  onChange={(val) => {
    setStatusFilter(prev => {
      const next = new Set(prev)
      if (next.has(val)) next.delete(val); else next.add(val)
      return next
    })
  }}
/>
```

- [ ] **Step 2: Update visible questions logic in qb-state.tsx**

Open `qb-state.tsx`. In the `visibleQuestions` useMemo, the role-based filter already allows only 'Saved' and own 'Draft'. Remove any references to other status values:

```tsx
const visibleQuestions = useMemo(() => {
  let qs = questions

  // Role-based: Faculty sees only Saved + own Drafts
  if (!isAdmin) {
    qs = qs.filter(q =>
      q.status === 'Saved' ||
      (q.status === 'Draft' && q.creator === currentPersona.id)
    )
  }

  // Nav-based
  if (navView === 'my') qs = qs.filter(q => q.creator === currentPersona.id)
  if (navView === 'folder' && selectedFolderId) {
    qs = qs.filter(q => isInSubtree(q.folder, selectedFolderId, folders))
  }

  // Global toggles
  if (myQuestionsOnly) qs = qs.filter(q => q.creator === currentPersona.id)
  if (favoritesFilter) qs = qs.filter(q => favoritedIds.has(q.id))

  return qs
}, [isAdmin, currentPersona.id, navView, selectedFolderId, myQuestionsOnly, favoritesFilter, favoritedIds, questions, folders])
```

- [ ] **Step 3: Visual verification**

In Faculty persona: navigate to All Questions — Draft questions from other creators should not appear. Status filter panel shows only Saved / Draft checkboxes.

- [ ] **Step 4: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx \
        apps/exam-management/admin/app/\(app\)/question-bank/qb-state.tsx
git commit -m "feat(qb): status filter — Saved/Draft only, Faculty sees own Drafts"
```

---

### Task 6: Column header context menus — hybrid filter

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

- [ ] **Step 1: Extend ColHeader with full context menu**

Find the `ColHeader` component. Replace its dropdown content:

```tsx
function ColHeader({
  col, sortCol, sortDir, onSort, onHide, onPin,
  filterOptions, activeFilter, onFilterChange,
}: {
  col: typeof QB_COLS[number]
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  onSort: (key: string, dir: 'asc' | 'desc') => void
  onHide: (key: ColumnId) => void
  onPin: (key: ColumnId) => void
  filterOptions?: string[]          // enum values — show inline checkboxes
  activeFilter?: Set<string>        // currently active filter values
  onFilterChange?: (val: string) => void
  openPanel?: () => void            // for text columns — opens filter sheet
}) {
  const isSorted = sortCol === col.key
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          aria-label={`${col.label} column options`}
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            userSelect: 'none', fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}
          className="group"
        >
          {col.label}
          {isSorted && (
            <i className={`fa-solid fa-arrow-${sortDir === 'asc' ? 'up' : 'down'}`}
              aria-hidden="true" style={{ fontSize: 9, opacity: 0.7 }} />
          )}
          <i className="fa-regular fa-ellipsis" aria-hidden="true"
            style={{ fontSize: 10, opacity: 0, marginLeft: 2 }}
            className="group-hover:opacity-60" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" style={{ minWidth: 180 }}>
        {/* Sort */}
        {col.sortable && (
          <>
            <DropdownMenuItem onClick={() => onSort(col.key, 'asc')}>
              <i className="fa-light fa-arrow-up" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
              Sort ascending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort(col.key, 'desc')}>
              <i className="fa-light fa-arrow-down" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
              Sort descending
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Inline enum filter */}
        {filterOptions && activeFilter && onFilterChange && (
          <>
            <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
              Filter
            </div>
            {filterOptions.map(opt => (
              <DropdownMenuItem
                key={opt}
                onSelect={(e) => e.preventDefault()}
                onClick={() => onFilterChange(opt)}
              >
                <Checkbox
                  checked={activeFilter.has(opt)}
                  onCheckedChange={() => onFilterChange(opt)}
                  aria-label={opt}
                  style={{ marginRight: 6 }}
                />
                {opt}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Text column filter → open panel */}
        {col.key === 'lastEditedBy' && (
          <>
            <DropdownMenuItem onClick={() => { /* openPanel passed from parent */ }}>
              <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
              Filter by {col.label}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Column actions */}
        <DropdownMenuItem onClick={() => onPin(col.key)}>
          <i className="fa-light fa-thumbtack" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
          Pin left
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => col.hideable && onHide(col.key)}
          disabled={!col.hideable}
          style={!col.hideable ? { opacity: 0.4 } : {}}
        >
          <i className="fa-light fa-eye-slash" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
          Hide column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Wire enum filter props per column**

In the table header row, pass `filterOptions` and `activeFilter` for enum columns:

```tsx
const ENUM_FILTERS: Partial<Record<ColumnId, string[]>> = {
  status:     ['Saved', 'Draft'],
  type:       ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'],
  difficulty: ['Easy', 'Medium', 'Hard'],
  blooms:     ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
}

// In header render:
{visibleCols.map(col => (
  <TableHead key={col.key}>
    <ColHeader
      col={col}
      sortCol={sortCol}
      sortDir={sortDir}
      onSort={(key, dir) => { setSortCol(key as ColumnId); setSortDir(dir) }}
      onHide={(key) => setHiddenCols(prev => new Set([...prev, key]))}
      onPin={(key) => { /* pin logic below */ }}
      filterOptions={ENUM_FILTERS[col.key]}
      activeFilter={
        col.key === 'status'     ? statusFilter :
        col.key === 'type'       ? typeFilter :
        col.key === 'difficulty' ? diffFilter :
        col.key === 'blooms'     ? bloomsFilter :
        undefined
      }
      onFilterChange={
        col.key === 'status'     ? (v) => toggleFilter(setStatusFilter, v) :
        col.key === 'type'       ? (v) => toggleFilter(setTypeFilter, v) :
        col.key === 'difficulty' ? (v) => toggleFilter(setDiffFilter, v) :
        col.key === 'blooms'     ? (v) => toggleFilter(setBloomsFilter, v) :
        undefined
      }
    />
  </TableHead>
))}
```

Add a `toggleFilter` helper at component level:

```tsx
function toggleFilter(setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) {
  setter(prev => {
    const next = new Set(prev)
    if (next.has(val)) next.delete(val); else next.add(val)
    return next
  })
}
```

Add local state for `bloomsFilter`:

```tsx
const [bloomsFilter, setBloomsFilter] = useState<Set<string>>(new Set())
```

- [ ] **Step 3: Pin column — add to hiddenCols logic**

Add `pinnedCols` local state and apply sticky positioning:

```tsx
const [pinnedCols, setPinnedCols] = useState<Set<ColumnId>>(new Set())

// In TableHead render, if col is pinned:
style={pinnedCols.has(col.key) ? { position: 'sticky', left: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '2px 0 4px var(--sticky-edge-fade)' } : {}}
```

`onPin` handler:

```tsx
onPin={(key) => setPinnedCols(prev => {
  const next = new Set(prev)
  if (next.has(key)) next.delete(key); else next.add(key)
  return next
})}
```

- [ ] **Step 4: Visual verification**

Click each column header's ⋯ button:
- Status, Type, Difficulty, Bloom's: should show Sort + inline checkboxes + Pin + Hide
- Last Edited By: should show Sort + "Filter by Last Edited By" + Pin + Hide
- Select, Title, Favorites, Actions: should show only Pin (hide disabled/greyed for non-hideable)
- Checking an enum filter option immediately updates visible rows and shows chip below toolbar

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx
git commit -m "feat(qb): column header context menus — hybrid enum inline + panel redirect, pin, hide"
```

---

### Task 7: Column drag-reorder

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`
- Modify: `app/(app)/question-bank/qb-state.tsx`

- [ ] **Step 1: Wire columnOrder state in qb-state.tsx**

In `QBState` context type, `columnOrder` and `setColumnOrder` are already defined. In the provider's initial state, set:

```tsx
const [columnOrder, setColumnOrder] = useState<ColumnId[]>(
  QB_COLS.filter(c => c.hideable).map(c => c.key)
)
```

Import `ColumnId` from `qb-table.tsx` — move the `ColumnId` type definition to `lib/qb-types.ts` so both files can import it:

```ts
// lib/qb-types.ts — add:
export type ColumnId =
  | 'select' | 'title' | 'status' | 'type' | 'difficulty'
  | 'blooms' | 'location' | 'creator' | 'lastEditedBy'
  | 'usage' | 'pbis' | 'version' | 'favorited' | 'actions'
```

- [ ] **Step 2: Apply columnOrder to visible columns**

In `qb-table.tsx`, derive `visibleCols` using `columnOrder` from context:

```tsx
const { columnOrder, setColumnOrder } = useQBState()

const visibleCols = useMemo(() => {
  // Non-hideable columns are always in fixed positions
  const FIXED_START: ColumnId[] = ['select', 'title', 'status']
  const FIXED_END: ColumnId[] = ['favorited', 'actions']
  const reorderable = columnOrder.filter(k => !hiddenCols.has(k))
  return [
    ...QB_COLS.filter(c => FIXED_START.includes(c.key)),
    ...QB_COLS.filter(c => reorderable.includes(c.key) && !FIXED_START.includes(c.key) && !FIXED_END.includes(c.key))
      .sort((a, b) => reorderable.indexOf(a.key) - reorderable.indexOf(b.key)),
    ...QB_COLS.filter(c => FIXED_END.includes(c.key)),
  ]
}, [columnOrder, hiddenCols])
```

- [ ] **Step 3: Add drag handlers to TableHead**

```tsx
const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null)

// On each hideable TableHead:
<TableHead
  key={col.key}
  draggable={col.hideable}
  onDragStart={() => { /* store dragged col key in ref */ dragColRef.current = col.key }}
  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key) }}
  onDragLeave={() => setDragOverCol(null)}
  onDrop={() => {
    if (!dragColRef.current || dragColRef.current === col.key) return
    setColumnOrder(prev => {
      const next = [...prev]
      const fromIdx = next.indexOf(dragColRef.current!)
      const toIdx = next.indexOf(col.key)
      if (fromIdx < 0 || toIdx < 0) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, dragColRef.current!)
      return next
    })
    setDragOverCol(null)
  }}
  style={dragOverCol === col.key ? { outline: '2px dashed var(--brand-color)', outlineOffset: -2 } : {}}
>
```

Add ref at component level:
```tsx
const dragColRef = useRef<ColumnId | null>(null)
```

- [ ] **Step 4: Visual verification**

Drag a column header (e.g., "Bloom's") and drop it before another column (e.g., "Type"). The column order should update immediately and persist while on the page.

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx \
        apps/exam-management/admin/app/\(app\)/question-bank/qb-state.tsx \
        apps/exam-management/admin/lib/qb-types.ts
git commit -m "feat(qb): column drag-reorder via HTML5 drag events + wired columnOrder state"
```

---

## Phase 3 — QB Sidebar & State Cleanup

### Task 8: Sidebar — display name transform + removals

**Files:**
- Modify: `app/(app)/question-bank/qb-sidebar.tsx`

- [ ] **Step 1: Course folder display name transform**

In `FolderRow`, add a helper to format course folder names:

```tsx
function courseFolderLabel(name: string): string {
  // Input: "PHAR101 Question Bank (QB)" → Output: "PHAR101 · Question Bank"
  const match = name.match(/^([A-Z0-9]+)\s/)
  if (!match) return name
  return `${match[1]} · Question Bank`
}
```

In the `FolderRow` render, for course folders use:

```tsx
const displayName = folder.isCourse ? courseFolderLabel(folder.name) : folder.name
```

- [ ] **Step 2: Remove Question Set nodes**

In the folder tree renderer, filter out any folder with `isQuestionSet` flag:

```tsx
// In the filter that builds the visible folder list, add:
.filter(f => !f.isQuestionSet)
```

If `FolderNode` in `qb-types.ts` doesn't have `isQuestionSet`, this step is a no-op (no question set folders exist in mock data — confirm by checking `MOCK_QB_FOLDERS`).

- [ ] **Step 3: Remove Lock Folder from context menu**

In `FolderContextMenu`, remove the "Lock Folder" `DropdownMenuItem`. Keep:

```tsx
<DropdownMenuItem onClick={() => { /* new subfolder handler */ }}>
  <i className="fa-light fa-folder-plus" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
  New Subfolder
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setCollaboratorsModalFolderId(folder.id)}>
  <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
  Manage Access
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setIsRenaming(true)}>
  <i className="fa-light fa-pencil" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
  Rename
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem className="text-destructive focus:text-destructive">
  <i className="fa-light fa-trash" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
  Delete
</DropdownMenuItem>
```

- [ ] **Step 4: Remove lock icon from locked folders**

Find the locked folder render (shows `fa-lock` icon and italic/muted text). Remove the lock icon and italic styling — locked folders now look identical to regular folders. If locking is gone from the UX, the `locked` field on `FolderNode` can be ignored entirely.

- [ ] **Step 5: Remove course offering mentions**

Search for any text rendering semester/offering labels in the sidebar. There should be none in the mock data (no offering-level folder nodes), but confirm:

```bash
grep -n "Fall\|Spring\|semester\|offering" apps/exam-management/admin/app/\(app\)/question-bank/qb-sidebar.tsx
```

If any, remove them.

- [ ] **Step 6: Visual verification**

Navigate to `/question-bank`. Sidebar should show:
- `PHAR101 · Question Bank` (not "PHAR101 Question Bank (QB)")
- No semester labels anywhere
- No lock icons
- Folder context menu has 4 items only (New Subfolder, Manage Access, Rename, Delete)

- [ ] **Step 7: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-sidebar.tsx
git commit -m "feat(qb-sidebar): course display name transform, remove lock/question-set, clean context menu"
```

---

### Task 9: Modals cleanup

**Files:**
- Modify: `app/(app)/question-bank/qb-modals.tsx`

- [ ] **Step 1: Remove FilterSheet component**

Delete the entire `FilterSheet` function from `qb-modals.tsx` (it is not rendered anywhere — `FilterPropertiesSheet` in `qb-table.tsx` handles all filtering).

Also remove its export if exported, and remove `filterSheetOpen` / `setFilterSheetOpen` usage inside it.

- [ ] **Step 2: Remove Folder Visibility tab from ManageCollaboratorsModal**

Find the modal's tab structure. Remove any tab labeled "Folder Visibility" or "Visibility". Keep only the Collaborators tab content. If tabs were implemented with DS `Tabs`, the result should be:

```tsx
// No Tabs component needed — single panel, remove TabsList/TabsTrigger entirely
<Dialog open={!!collaboratorsModalFolderId} onOpenChange={() => setCollaboratorsModalFolderId(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{folder?.name} · {collaborators.length} collaborators</DialogTitle>
      <DialogDescription>Manage who can view or edit this folder</DialogDescription>
    </DialogHeader>
    {/* Collaborator list — no tabs */}
    ...
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: Remove filterSheetOpen from QB state**

In `qb-state.tsx`, remove:
- `filterSheetOpen: boolean` from `QBState` type
- `setFilterSheetOpen` from `QBState` type
- Both `useState` declarations
- Both from the context value object

- [ ] **Step 4: Visual verification**

Click "Manage Access" on a folder. Modal opens with collaborator list only — no tabs visible. No "Folder Visibility" option anywhere.

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-modals.tsx \
        apps/exam-management/admin/app/\(app\)/question-bank/qb-state.tsx
git commit -m "chore(qb): remove FilterSheet dead code, remove Folder Visibility tab from collaborators modal, remove dead filterSheetOpen state"
```

---

### Task 10: QB state — timer fix

**Files:**
- Modify: `app/(app)/question-bank/qb-state.tsx`

- [ ] **Step 1: Fix highlight timer leak**

Find `setHighlightedFolderId`. Replace the bare `setTimeout` with a `useRef`-tracked cleanup:

```tsx
const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const setHighlightedFolderId = useCallback((id: string | null) => {
  setHighlightedFolderIdState(id)
  if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
  if (id !== null) {
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedFolderIdState(null)
      highlightTimerRef.current = null
    }, 1500)
  }
}, [])

// In the provider's useEffect cleanup:
useEffect(() => {
  return () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
  }
}, [])
```

- [ ] **Step 2: Verify type-check passes**

```bash
cd apps/exam-management/admin && pnpm type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/question-bank/qb-state.tsx
git commit -m "fix(qb-state): fix highlight timer leak with useRef cleanup on unmount"
```

---

## Phase 4 — Courses Page

### Task 11: Courses page — full table layout

**Files:**
- Modify: `app/(app)/courses/courses-client.tsx`

- [ ] **Step 1: Replace the scaffold with the designed expandable table**

Replace the entire content of `courses-client.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'

export default function CoursesClient() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([mockCourses[0]?.id ?? '']))
  const router = useRouter()

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const totalStudents = (courseId: string) =>
    mockCourseOfferings
      .filter(o => o.courseId === courseId)
      .reduce((sum, o) => sum + o.studentCount, 0)

  const isActiveOffering = (semester: string) =>
    semester.includes('2026') // simplified: Spring 2026 is active

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Page header */}
      <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400, color: 'var(--foreground)' }}>Courses</h1>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
            {mockCourses.length} courses · {mockCourseOfferings.length} offerings
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 28px' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead style={{ width: 110 }}>Code</TableHead>
              <TableHead style={{ width: 220 }}>Course name</TableHead>
              <TableHead style={{ width: 150 }}>Offering / Semester</TableHead>
              <TableHead style={{ width: 110 }}>Students</TableHead>
              <TableHead style={{ width: 90 }}>Status</TableHead>
              <TableHead style={{ width: 130 }}>QB Questions</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCourses.map(course => {
              const offerings = mockCourseOfferings.filter(o => o.courseId === course.id)
              const isOpen = expandedIds.has(course.id)
              const assessmentCount = mockAssessments.filter(a => a.courseId === course.id).length

              return (
                <>
                  {/* Course row */}
                  <TableRow
                    key={course.id}
                    onClick={() => toggle(course.id)}
                    style={{ cursor: 'pointer', background: isOpen ? 'color-mix(in oklch, var(--brand-tint) 40%, var(--background))' : undefined }}
                  >
                    <TableCell>
                      <i
                        className="fa-light fa-chevron-right"
                        aria-hidden="true"
                        style={{ fontSize: 11, color: 'var(--muted-foreground)', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded font-mono text-[11px]"
                        style={{ background: 'var(--brand-tint)', color: 'var(--brand-color)', border: '1px solid color-mix(in oklch, var(--brand-color) 20%, transparent)' }}>
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: 13, fontWeight: 500 }}>{course.name}</TableCell>
                    <TableCell style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{offerings.length} offering{offerings.length !== 1 ? 's' : ''}</TableCell>
                    <TableCell style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 500 }}>{totalStudents(course.id)} total</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                        style={{ color: 'var(--brand-color)' }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/question-bank`) }}>
                        {/* count from MOCK_QB_FOLDERS by questionBankFolderId */}
                        View QB
                        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                        style={{ color: 'var(--brand-color)' }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/assessment-builder`) }}>
                        Assessment Builder
                        <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Offering rows */}
                  {isOpen && offerings.map(o => {
                    const active = isActiveOffering(o.semester)
                    return (
                      <TableRow key={o.id} style={{ background: 'color-mix(in oklch, var(--brand-tint) 18%, var(--background))' }}>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell style={{ paddingLeft: 28 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'var(--brand-color)' : 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{o.semester}</span>
                          </div>
                        </TableCell>
                        <TableCell style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{active ? 'Active offering' : 'Past offering'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded text-[11px]"
                            style={active ? { background: 'var(--brand-tint)', color: 'var(--brand-color)' } : {}}>
                            {o.studentCount} students
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded text-[10px]"
                            style={active ? { background: 'oklch(0.93 0.06 160 / 0.25)', color: 'oklch(0.32 0.10 160)' } : {}}>
                            {active ? '● Active' : 'Past'}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                          {mockAssessments.filter(a => a.offeringId === o.id).length} assessments
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1"
                            style={{ color: 'var(--brand-color)' }}
                            onClick={() => router.push('/assessment-builder')}>
                            View assessments
                            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--muted-foreground)' }}>
        {mockCourses.length} courses · {mockCourseOfferings.length} offerings
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Visual verification**

Navigate to `/courses`. Confirm:
- Course rows expand/collapse on click, chevron rotates
- Offering rows indent with semester dot (brand color = active, gray = past)
- "View QB" and "Assessment Builder" links navigate correctly
- Student counts and assessment counts are correct

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/courses/courses-client.tsx
git commit -m "feat(courses): full expandable table layout — course rows, offering rows, student counts"
```

---

## Phase 5 — Assessment Builder

### Task 12: Assessment Builder types

**Files:**
- Modify: `lib/qb-types.ts`

- [ ] **Step 1: Add AssessmentQuestion type and smart view types**

Append to `lib/qb-types.ts`:

```ts
export interface AssessmentQuestion {
  questionId: string
  order: number
}

export interface AssessmentDraft {
  id: string
  title: string
  courseId: string
  offeringId: string
  questions: AssessmentQuestion[]
}

export interface SmartView {
  id: string
  label: string
  isSystem: boolean
  filters: {
    difficulty?: QDiff[]
    type?: QType[]
    blooms?: QBlooms[]
    unusedOnly?: boolean
  }
}

export const SYSTEM_SMART_VIEWS: SmartView[] = [
  { id: 'all',      label: 'All questions', isSystem: true, filters: {} },
  { id: 'hard',     label: 'Hard only',     isSystem: true, filters: { difficulty: ['Hard'] } },
  { id: 'mcq-med',  label: 'MCQ · Medium',  isSystem: true, filters: { type: ['MCQ'], difficulty: ['Medium'] } },
  { id: 'apply',    label: 'Apply + Analyze',isSystem: true, filters: { blooms: ['Apply', 'Analyze'] } },
  { id: 'unused',   label: 'Not yet used',  isSystem: true, filters: { unusedOnly: true } },
]
```

- [ ] **Step 2: Commit**

```bash
git add apps/exam-management/admin/lib/qb-types.ts
git commit -m "feat(ab): add AssessmentDraft, SmartView types and SYSTEM_SMART_VIEWS"
```

---

### Task 13: Assessment Builder — persistent split layout

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Replace scaffold with persistent split layout**

Replace the entire file:

```tsx
'use client'
import { useState, useMemo, useCallback } from 'react'
import { Button, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import type { AssessmentDraft, SmartView } from '@/lib/qb-types'
import { SYSTEM_SMART_VIEWS } from '@/lib/qb-types'

// ─── Sub-components imported in following tasks ───────────────────────────────
// ABAssessmentList  — left panel
// ABQuestionPicker  — right panel (question list + smart views)
// ABDiffChart       — footer chart

export default function AssessmentBuilderClient() {
  // Course + offering selection
  const [courseId, setCourseId] = useState(mockCourses[0]?.id ?? '')
  const [offeringId, setOfferingId] = useState(
    mockCourseOfferings.find(o => o.courseId === mockCourses[0]?.id)?.id ?? ''
  )

  // Active assessment being edited
  const [activeAsmt, setActiveAsmt] = useState<AssessmentDraft | null>(null)

  // Active smart view
  const [smartViewId, setSmartViewId] = useState<string>('all')

  // User-saved smart views (persisted to localStorage)
  const [savedViews, setSavedViews] = useState<SmartView[]>(() => {
    try {
      const stored = localStorage.getItem('qb-smart-views')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const course = mockCourses.find(c => c.id === courseId)
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const assessments = mockAssessments.filter(a => a.courseId === courseId && a.offeringId === offeringId)

  const allSmartViews = useMemo(() => [...SYSTEM_SMART_VIEWS, ...savedViews], [savedViews])

  const saveSmartView = useCallback((view: SmartView) => {
    setSavedViews(prev => {
      const next = [...prev, view]
      try { localStorage.setItem('qb-smart-views', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Open an existing assessment as a draft
  function openAssessment(asmtId: string) {
    const source = assessments.find(a => a.id === asmtId)
    if (!source) return
    setActiveAsmt({
      id: source.id,
      title: source.title,
      courseId: source.courseId,
      offeringId: source.offeringId,
      questions: [],  // in real app: load from source
    })
  }

  // Create new assessment
  function createAssessment() {
    setActiveAsmt({
      id: `asmt-new-${Date.now()}`,
      title: 'New Assessment',
      courseId,
      offeringId,
      questions: [],
    })
  }

  // Toggle question in/out of active assessment
  function toggleQuestion(questionId: string) {
    if (!activeAsmt) return
    setActiveAsmt(prev => {
      if (!prev) return prev
      const exists = prev.questions.find(q => q.questionId === questionId)
      return {
        ...prev,
        questions: exists
          ? prev.questions.filter(q => q.questionId !== questionId)
          : [...prev.questions, { questionId, order: prev.questions.length + 1 }],
      }
    })
  }

  const selectedIds = useMemo(
    () => new Set(activeAsmt?.questions.map(q => q.questionId) ?? []),
    [activeAsmt]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Course + Offering selector bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'color-mix(in oklch, var(--brand-tint) 40%, var(--background))' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>Course</span>
        <Select value={courseId} onValueChange={(val) => {
          setCourseId(val)
          const firstOffering = mockCourseOfferings.find(o => o.courseId === val)
          if (firstOffering) setOfferingId(firstOffering.id)
          setActiveAsmt(null)
        }}>
          <SelectTrigger style={{ width: 180, height: 32, fontSize: 12 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockCourses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>Offering</span>
        <Select value={offeringId} onValueChange={(val) => { setOfferingId(val); setActiveAsmt(null) }}>
          <SelectTrigger style={{ width: 148, height: 32, fontSize: 12 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {offerings.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.semester}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeAsmt && (
          <Badge variant="secondary" className="rounded text-[11px]" style={{ marginLeft: 8 }}>
            Editing: {activeAsmt.title} · {activeAsmt.questions.length} questions
          </Badge>
        )}
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel — assessment list */}
        <ABAssessmentList
          assessments={assessments}
          activeId={activeAsmt?.id ?? null}
          onOpen={openAssessment}
          onCreate={createAssessment}
        />

        {/* Right panel — question picker */}
        {activeAsmt ? (
          <ABQuestionPicker
            courseId={courseId}
            selectedIds={selectedIds}
            onToggle={toggleQuestion}
            activeAsmt={activeAsmt}
            smartViews={allSmartViews}
            activeViewId={smartViewId}
            onViewChange={setSmartViewId}
            onSaveView={saveSmartView}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--muted-foreground)' }}>
            <i className="fa-light fa-pen-ruler" aria-hidden="true" style={{ fontSize: 32, opacity: .4 }} />
            <span style={{ fontSize: 13 }}>Select an assessment to start picking questions</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Placeholder sub-components (replaced in Tasks 14 & 15) ──────────────────

function ABAssessmentList({ assessments, activeId, onOpen, onCreate }: {
  assessments: typeof mockAssessments
  activeId: string | null
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  return (
    <aside style={{ width: 224, minWidth: 224, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'color-mix(in oklch, var(--brand-tint) 25%, var(--background))' }}>
      <div style={{ padding: '10px 10px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted-foreground)' }}>
        Assessments
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 6px 6px' }}>
        {assessments.map(a => (
          <button key={a.id} onClick={() => onOpen(a.id)}
            style={{ width: '100%', textAlign: 'left', background: activeId === a.id ? 'var(--accent)' : 'transparent', border: '1px solid', borderColor: activeId === a.id ? 'color-mix(in oklch, var(--brand-color) 20%, transparent)' : 'transparent', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', marginBottom: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{a.title}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{a.questionCount} questions</div>
          </button>
        ))}
        <button onClick={onCreate}
          style={{ width: '100%', textAlign: 'center', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', marginTop: 4, fontSize: 12, color: 'var(--muted-foreground)' }}>
          + New assessment
        </button>
      </div>
    </aside>
  )
}

function ABQuestionPicker({ courseId, selectedIds, onToggle, activeAsmt, smartViews, activeViewId, onViewChange, onSaveView }: {
  courseId: string
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  smartViews: SmartView[]
  activeViewId: string
  onViewChange: (id: string) => void
  onSaveView: (v: SmartView) => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
        {activeAsmt.title} · {selectedIds.size} of {MOCK_QB_QUESTIONS.length} QB questions added
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 12 }}>
        Question picker — implemented in Task 14
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Visual verification**

Navigate to `/assessment-builder`. Left panel shows assessment list. Clicking an assessment loads the editing context bar. Right panel shows placeholder until Task 14 fills it.

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx \
        apps/exam-management/admin/lib/qb-types.ts
git commit -m "feat(ab): persistent split layout — course/offering selector, assessment list, draft state"
```

---

### Task 14: Assessment Builder — QB question picker + smart views

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Replace the ABQuestionPicker placeholder with the real implementation**

Find the `ABQuestionPicker` function in `assessment-builder-client.tsx` and replace entirely:

```tsx
function ABQuestionPicker({ courseId, selectedIds, onToggle, activeAsmt, smartViews, activeViewId, onViewChange, onSaveView }: {
  courseId: string
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  smartViews: SmartView[]
  activeViewId: string
  onViewChange: (id: string) => void
  onSaveView: (v: SmartView) => void
}) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  const activeView = smartViews.find(v => v.id === activeViewId) ?? smartViews[0]

  // Apply smart view filters to QB questions
  const filteredQuestions = useMemo(() => {
    const { difficulty, type, blooms, unusedOnly } = activeView?.filters ?? {}
    return MOCK_QB_QUESTIONS.filter(q => {
      if (difficulty?.length && !difficulty.includes(q.difficulty)) return false
      if (type?.length && !type.includes(q.type)) return false
      if (blooms?.length && !blooms.includes(q.blooms)) return false
      if (unusedOnly && q.usage > 0) return false
      return true
    })
  }, [activeView])

  // Difficulty distribution of selected questions
  const distribution = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    return {
      Easy:   picked.filter(q => q.difficulty === 'Easy').length,
      Medium: picked.filter(q => q.difficulty === 'Medium').length,
      Hard:   picked.filter(q => q.difficulty === 'Hard').length,
    }
  }, [selectedIds])

  function handleSaveView() {
    if (!newViewName.trim()) return
    onSaveView({
      id: `user-${Date.now()}`,
      label: newViewName.trim(),
      isSystem: false,
      filters: activeView?.filters ?? {},
    })
    setNewViewName('')
    setSaveDialogOpen(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Assessment context */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{activeAsmt.title}</span>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          · {selectedIds.size} questions selected
        </span>
      </div>

      {/* Smart view chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0, background: 'color-mix(in oklch, var(--brand-tint) 20%, var(--background))' }}>
        {smartViews.map(view => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            style={{
              padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              border: '1px solid',
              ...(activeViewId === view.id
                ? { background: 'var(--brand-color)', color: 'white', borderColor: 'var(--brand-color)' }
                : view.isSystem
                  ? { background: 'transparent', color: 'var(--foreground)', borderColor: 'var(--border)' }
                  : { background: 'transparent', color: 'var(--brand-color)', borderColor: 'var(--brand-color)', borderStyle: 'dashed' }
              ),
            }}
          >
            {!view.isSystem && <span style={{ marginRight: 4 }}>★</span>}
            {view.label}
          </button>
        ))}
        <button
          onClick={() => setSaveDialogOpen(true)}
          style={{ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, background: 'transparent', color: 'var(--brand-color)', border: '1px solid var(--brand-color)', opacity: 0.7 }}
        >
          + Save view
        </button>
      </div>

      {/* Question list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead>Question</TableHead>
              <TableHead style={{ width: 80 }}>Difficulty</TableHead>
              <TableHead style={{ width: 100 }}>Type</TableHead>
              <TableHead style={{ width: 60 }}>Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No questions match this view
                </TableCell>
              </TableRow>
            ) : filteredQuestions.map(q => {
              const isPicked = selectedIds.has(q.id)
              const diffStyles = {
                Easy:   { fontWeight: 400, color: 'var(--qb-diff-easy)' },
                Medium: { fontWeight: 600, color: 'var(--qb-diff-medium)' },
                Hard:   { fontWeight: 800, color: 'var(--qb-diff-hard)' },
              }
              return (
                <TableRow
                  key={q.id}
                  onClick={() => onToggle(q.id)}
                  style={{ cursor: 'pointer', background: isPicked ? 'color-mix(in oklch, var(--brand-tint) 35%, var(--background))' : undefined }}
                >
                  <TableCell>
                    <input type="checkbox" checked={isPicked} onChange={() => onToggle(q.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 14, height: 14, accentColor: 'var(--brand-color)', cursor: 'pointer' }} />
                  </TableCell>
                  <TableCell style={{ fontSize: 12, maxWidth: 400 }}>
                    <div style={{ lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 11.5, ...diffStyles[q.difficulty] }}>{q.difficulty}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontWeight: 500 }}>
                    {q.type}
                  </TableCell>
                  <TableCell style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {q.usage > 0 ? `${q.usage}×` : '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer — difficulty chart + save */}
      <ABDiffChart distribution={distribution} onSave={() => { /* wire to parent save handler */ }} />

      {/* Save view dialog */}
      {saveDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSaveDialogOpen(false)}>
          <div style={{ background: 'var(--background)', borderRadius: 12, padding: 24, width: 340, boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Save smart view</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>
              Saves the current filter configuration as "{activeView?.label}" with a custom name.
            </div>
            <input
              autoFocus
              value={newViewName}
              onChange={e => setNewViewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveView()}
              placeholder="View name…"
              style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border-control-35)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveView} disabled={!newViewName.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

Add the `Table/TableHeader/TableBody/TableRow/TableHead/TableCell` imports to the file's DS import line.

- [ ] **Step 2: Visual verification**

Navigate to `/assessment-builder`. Select a course/offering, open an assessment:
- Smart view chips render; clicking each filters the question list
- Checkboxes toggle question selection; checked rows get brand-tinted background
- "Not yet used" filter shows only `usage === 0` questions
- "Save view" opens inline dialog; saved view appears with ★ prefix and dashed border
- Saved views persist across page reloads (localStorage)

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(ab): QB question picker with smart views — system views + user-saved presets, localStorage persistence"
```

---

### Task 15: Assessment Builder — difficulty distribution chart

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Replace ABDiffChart placeholder with real chart**

Add the `ABDiffChart` function to `assessment-builder-client.tsx`:

```tsx
function ABDiffChart({ distribution, onSave }: {
  distribution: { Easy: number; Medium: number; Hard: number }
  onSave: () => void
}) {
  const total = distribution.Easy + distribution.Medium + distribution.Hard

  const bars: { label: string; count: number; color: string; weight: number }[] = [
    { label: 'Easy',   count: distribution.Easy,   color: 'var(--qb-diff-easy)',   weight: 400 },
    { label: 'Medium', count: distribution.Medium, color: 'var(--qb-diff-medium)', weight: 600 },
    { label: 'Hard',   count: distribution.Hard,   color: 'var(--qb-diff-hard)',   weight: 800 },
  ]

  const maxCount = Math.max(...bars.map(b => b.count), 1)

  return (
    <div style={{ padding: '10px 16px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, background: 'color-mix(in oklch, var(--brand-tint) 15%, var(--background))' }}>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: bar.color }}>{bar.count > 0 ? bar.count : ''}</span>
            <div style={{ width: 28, borderRadius: '3px 3px 0 0', background: bar.color, height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 32}px`, transition: 'height .2s ease', opacity: bar.count === 0 ? .25 : 1 }} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ fontWeight: bar.weight, color: bar.color, width: 44 }}>{bar.label}</span>
            <span style={{ color: 'var(--muted-foreground)' }}>{bar.count} question{bar.count !== 1 ? 's' : ''}</span>
            {total > 0 && (
              <span style={{ color: 'var(--muted-foreground)', opacity: .6 }}>
                ({Math.round((bar.count / total) * 100)}%)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {total === 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Select questions to build assessment</span>
        )}
        <Button variant="outline" size="sm" onClick={() => {}}>Cancel</Button>
        <Button size="sm" disabled={total === 0} onClick={onSave}>
          Save assessment
        </Button>
      </div>
    </div>
  )
}
```

Wire `onSave` in `ABQuestionPicker`'s footer call:
```tsx
<ABDiffChart distribution={distribution} onSave={() => alert(`Saved: ${activeAsmt.title} (${selectedIds.size} questions)`)} />
```

- [ ] **Step 2: Visual verification**

Check/uncheck questions in the picker. The bar chart updates live:
- Bar heights animate as counts change
- Percentages update correctly
- Save button is disabled at 0 questions, enabled once at least 1 is selected
- Legend shows correct counts

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(ab): live difficulty distribution bar chart in footer, animated height, Save button"
```

---

### Task 16: Assessment Builder — mini difficulty bars in assessment list

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add mini diff bar to each assessment card in ABAssessmentList**

Replace the `ABAssessmentList` function with a version that shows the mini difficulty bar on each assessment item:

```tsx
function ABAssessmentList({ assessments, activeId, onOpen, onCreate }: {
  assessments: typeof mockAssessments
  activeId: string | null
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  return (
    <aside style={{ width: 224, minWidth: 224, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'color-mix(in oklch, var(--brand-tint) 25%, var(--background))' }}>
      <div style={{ padding: '10px 10px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted-foreground)' }}>
        Assessments
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 6px 6px' }}>
        {assessments.map(a => {
          const isActive = activeId === a.id
          const total = a.diffDistribution.Easy + a.diffDistribution.Medium + a.diffDistribution.Hard
          const pct = (n: number) => total > 0 ? (n / total) * 100 : 0
          return (
            <button key={a.id} onClick={() => onOpen(a.id)}
              style={{ width: '100%', textAlign: 'left',
                background: isActive ? 'var(--accent)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'color-mix(in oklch, var(--brand-color) 20%, transparent)' : 'transparent',
                borderRadius: 7, padding: '8px 10px', cursor: 'pointer', marginBottom: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 6px' }}>
                {a.questionCount} questions
              </div>
              {/* Mini difficulty bar — neutral grays */}
              <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                <div style={{ width: `${pct(a.diffDistribution.Easy)}%`, background: 'var(--qb-diff-easy)', opacity: .7, borderRadius: 2, transition: 'width .2s' }} title={`Easy: ${a.diffDistribution.Easy}`} />
                <div style={{ width: `${pct(a.diffDistribution.Medium)}%`, background: 'var(--qb-diff-medium)', opacity: .85, borderRadius: 2, transition: 'width .2s' }} title={`Medium: ${a.diffDistribution.Medium}`} />
                <div style={{ width: `${pct(a.diffDistribution.Hard)}%`, background: 'var(--qb-diff-hard)', borderRadius: 2, transition: 'width .2s' }} title={`Hard: ${a.diffDistribution.Hard}`} />
              </div>
            </button>
          )
        })}
        <button onClick={onCreate}
          style={{ width: '100%', textAlign: 'center', background: 'transparent',
            border: '1px dashed var(--border)', borderRadius: 7, padding: '8px 10px',
            cursor: 'pointer', marginTop: 4, fontSize: 12, color: 'var(--muted-foreground)' }}>
          + New assessment
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Final end-to-end visual verification**

Full walkthrough:
1. `/courses` — course rows expand, offering rows appear, student counts correct, links navigate correctly
2. `/assessment-builder` — course/offering dropdowns work, assessment list shows mini diff bars
3. Click assessment → question picker loads with smart view chips
4. Click system views → question list filters correctly
5. Check questions → footer chart animates, counts update
6. "Save view" → dialog opens, enter name, view appears in chips with ★, persists on reload
7. `/question-bank` — table uses DS primitives, columns in correct order
8. Column headers → DropdownMenu opens with sort + inline enum filters + pin + hide
9. Sidebar shows `PHAR101 · Question Bank`, no offering labels, correct context menu (4 items)
10. Manage Access modal → no Folder Visibility tab
11. Difficulty cells → plain weighted text, no pill
12. Type column → plain neutral text (MCQ, Fill blank, etc.)
13. Location column → clickable course root, navigates in sidebar
14. ★ icon per row → hover to reveal, click to toggle, toolbar ★ filter works
15. Status filter → only Saved/Draft in panel and column header dropdown

- [ ] **Step 3: Final commit**

```bash
git add apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(ab): mini difficulty bars on assessment list items — neutral gray tones, animated widths"
```

---

## Spec Coverage Check

| Spec section | Tasks |
|---|---|
| §3.1 Column order + DS Table migration | Tasks 3, 4 |
| §3.2 Neutral difficulty text | Task 2 |
| §3.3 Star favorites | Task 4 |
| §3.4 Location column | Task 4 |
| §3.5 Column context menus (hybrid) | Task 6 |
| §3.5 Column drag-reorder | Task 7 |
| §3.6 All Questions / My Questions via sidebar | Task 5 |
| §3.7 My Questions view | Task 5 |
| §4.1 Course folder display name | Task 8 |
| §4.2 Remove Question Set + Lock Folder | Task 8 |
| §4.3 Folder context menu 4 items | Task 8 |
| §4.4 Row context menu removals | Task 8 (Lock, Question Set items) |
| §4.5 Remove Folder Visibility tab | Task 9 |
| §7.1 DS Table migration | Task 3 |
| §7.2 Dead code removal | Task 1, 9 |
| §7.3 State cleanup (timer, dead state) | Tasks 9, 10 |
| §7.4 New CSS tokens | Task 1 |
| §5 Courses page | Task 11 |
| §6.1 AB split layout | Task 13 |
| §6.2 Assessment list + mini diff bars | Tasks 13, 16 |
| §6.3 Smart views + question picker | Task 14 |
| §6.4 Difficulty distribution chart | Task 15 |
