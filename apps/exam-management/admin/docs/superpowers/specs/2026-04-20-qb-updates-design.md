# Question Bank Updates — Design Spec
**Date:** 2026-04-20
**Product:** Exam Management Admin (`apps/exam-management/admin/`)
**Author:** Romit Soley
**Status:** Approved for implementation

---

## Overview

This spec covers all updates to the Question Bank (QB) hub plus two new scaffolded navigation sections — Courses and Assessment Builder. The implementation follows a layer-by-layer approach: data model → state/role logic → sidebar → table → header/title/badges → modals → new nav pages.

---

## Section 1: Data Model

### `lib/qb-types.ts`

**Status — simplified from 7 → 2 values:**
```ts
type QStatus = 'Saved' | 'Draft'
```
All previous values (Active, Ready, In Review, Flagged, Approved, Locked) are removed.

**Question — field changes:**
- `shortlisted?: boolean` → renamed to `favorited?: boolean`
- `folderPath: string` added — full path string e.g. `"PHAR101 Question Bank (QB) / Cardiology / Week 3"`

**FolderNode — field removals:**
- `isCourseOffering` removed
- `courseYear` removed
- `isQuestionSet` removed
- `isLifetimeRepo` removed (no course offering concept)

**New types for scaffolded pages:**
```ts
type CourseOffering = {
  id: string
  courseId: string
  semester: string   // e.g. "Fall 2026"
  year: number
  studentCount: number
}

type Course = {
  id: string
  code: string       // e.g. "PHAR101"
  name: string       // e.g. "Pharmacology"
  offerings: CourseOffering[]
}

type Assessment = {
  id: string
  courseOfferingId: string
  title: string
  questionCount: number
  questions: { id: string; difficulty: QDiff }[]
}
```

### `lib/qb-mock-data.ts`

- All question statuses updated: Active/Ready/Approved/Locked → `'Saved'`; Draft → `'Draft'`
- All `shortlisted` fields renamed to `favorited`
- `folderPath` added to every question, derived from the new flat tree
- Folder tree flattened: offering nodes removed, their child folders move directly under the course node
- Course nodes renamed: `"PHAR101"` → `"PHAR101 Question Bank (QB)"` etc.
- Question Set folder (`qs-midterm-2024`) removed from mock data
- New mock arrays added: `mockCourses[]`, `mockCourseOfferings[]`, `mockAssessments[]`

---

## Section 2: State & Role Logic (`qb-state.tsx`)

### Role-based visibility — `visibleQuestions` derived state

| Role | Sees |
|---|---|
| Admin | `Saved` questions from everyone + their own `Draft` questions only |
| Faculty (with folder access) | `Saved` questions from assigned folders + their own `Draft` questions |
| Faculty (no folder access) | Empty state — Request Access |

**Exact filter logic:**
```ts
visibleQuestions = questions.filter(q => {
  const roleVisible =
    currentPersona.role === 'Admin'
      ? q.status === 'Saved' || q.creator === currentPersona.id
      : q.status === 'Saved' || (q.status === 'Draft' && q.creator === currentPersona.id)

  const folderVisible =
    navView === 'all' ? true :
    navView === 'my' ? q.creator === currentPersona.id :
    /* folder */ isInSubtree(q.folderId, selectedFolderId, folders)

  return roleVisible && folderVisible
})
```

### Auto-select first course (Faculty)
On mount and on persona switch: if `currentPersona.role === 'Faculty'` and `assignedFolders.length > 0`, set `selectedFolderId = assignedFolders[0]` automatically. No "select a course" empty state.

### New state fields
- `highlightedFolderId: string | null` — transient, set on subfolder/breadcrumb click, cleared after 1500ms via `setTimeout`. Used to trigger flash highlight on sidebar folder row.
- `columnOrder: string[]` — tracks current column order for drag-to-reorder. `question` column always first (pinned).
- `favoritesFilter: boolean` — true when filtering to favorited questions only.

### Removed from state
- All references to `isCourseOffering`, `courseYear`, `isQuestionSet` in folder traversal
- `shortlisted` references → replaced with `favorited`

### Empty state (Faculty, no assigned folders)
Renders in `question-bank-client.tsx`:
- Icon: `fa-folder-open` (56px, `--muted-foreground`) with `fa-lock-keyhole` badge (20px, `--brand-color`, bottom-right)
- Heading: "No question banks yet"
- Body: "You haven't been added to any courses. Once your administrator assigns you to a course, its question bank will appear here."
- Action: `Button variant="outline" size="sm"` "Request Access" → opens a confirmation dialog: "Your request has been sent to your administrator."

---

## Section 3: QB Sidebar (`qb-sidebar.tsx`)

### Tree structure
- Course offerings removed from rendering entirely
- Folders that were under offerings now render directly under the course node
- Course node labels: `"PHAR101"` → `"PHAR101 Question Bank (QB)"`
- Course node icon: `fa-graduation-cap` (unchanged)
- "+" add-course button in sidebar header: **removed**

### Context menus — removals
| Removed item | From where |
|---|---|
| All course offering menu items | Offering nodes gone |
| "New Question Set" | All folder context menus |
| "Lock / Unlock Folder" | All folder context menus |
| Question Set "SET" badge on folder rows | Folder row rendering |
| `isQuestionSet` folder type | All rendering and logic |

### Manage Collaborators modal trigger
- Option stays in context menu
- "Folder Visibility" tab removed inside the modal (see Section 6)

### Drag behavior
- Questions drag onto folders — unchanged
- Folder drag onto folder — unchanged
- Question Set as drag target — removed

### Quick nav counts
- "All Questions" and "My Questions" counts reflect new `Saved | Draft` visibility rules per role

### Sidebar folder row — highlight flash
When `highlightedFolderId` matches a folder row ID:
- Apply `background: var(--brand-tint)` with a 1500ms CSS transition that fades back to transparent
- Scroll the row into view on trigger

---

## Section 4: QB Table (`qb-table.tsx`)

### Column definitions — updated `QB_COLS`

| Column key | Header label | Change |
|---|---|---|
| `question` | Question | Remove control type pill from cell. Keep title, code, version, pin icon. |
| `status` | Status | Only renders `Saved` / `Draft` badges. |
| `type` | Type | **New column.** Neutral `--muted-foreground` text + `fa-light` icon per type. No colored background. |
| `difficulty` | Difficulty | Plain neutral text only — `--muted-foreground`, no color, no weight variation across Easy/Medium/Hard. |
| `subfolder` | Location | **New column.** Full path string. Each segment is an interactive link (see Subfolder Interaction). |
| `lastEditedBy` | Last Edited By | Renamed from previous creator/edited column. Reads `question.lastEditedBy`. |
| `favorited` | — | Inline `fa-star` icon in each row. `fa-light fa-star` = off, `fa-solid fa-star` + `--chart-4` amber = on. Click toggles `question.favorited`. |
| `blooms` | Bloom's | Unchanged |
| `usage` | Usage | Unchanged |
| `pbis` | P-Bis | Unchanged |
| `version` | Version | Unchanged |

### Subfolder column interaction
Each path segment (`"PHAR101 QB / Cardiology / Week 3"`) is composed of:
- **Text** → `Button variant="ghost" size="sm"` styled as a link. Click: sets `selectedFolderId`, expands sidebar tree, scrolls folder into view, sets `highlightedFolderId` (triggers 1500ms flash)
- **Hover on text** → DS `Popover` showing folder snapshot (see Folder Snapshot Popover below)

### Folder snapshot popover
Appears on hover of any folder reference (subfolder column + breadcrumb segments):
```
📁 Cardiology
─────────────────────────────
[DT][SC]  Dr. Thompson, Dr. Chen   (Avatar initials, collaborators)
fa-rectangle-list  14 questions
fa-clock  Last updated 2 days ago
─────────────────────────────
[Easy ████|Medium ████████|Hard ██]   difficulty distribution bar
```
- DS `Popover` + `PopoverContent`
- Difficulty bar uses `--chart-2` teal / `--chart-4` amber / `--chart-1` indigo segments
- Tooltip on hover of each bar segment shows count + percentage

### Difficulty distribution — column header popover
Hover the `Difficulty` column header → `Popover` showing distribution for currently visible questions:
```
Difficulty Distribution
────────────────────────────────
[████████████░░░░░░░░]  Easy    6  43%
[████████░░░░░░░░░░░░]  Medium  5  36%
[████░░░░░░░░░░░░░░░░]  Hard    3  21%
```
- Per-row horizontal bar. Colors: `--chart-2` / `--chart-4` / `--chart-1`
- Updates live as filters change

### Column header context menu
Every column header has a `DropdownMenu`:
```
fa-arrow-up     Sort Ascending
fa-arrow-down   Sort Descending
────────────────
fa-sliders      Filter by [Column]   → opens inline column filter Popover
────────────────
fa-eye-slash    Hide Column          (disabled on `question` column)
```

### Column drag-to-reorder
- `columnOrder: string[]` in table state (sourced from `qb-state.tsx`)
- Column headers: `draggable={true}`, `onDragStart` sets dragged column key, `onDragOver` shows drop indicator, `onDrop` reorders `columnOrder`
- `question` column pinned left — not draggable, always index 0

### Inline column filter popover
Triggered from column header context menu "Filter by [col]":
- DS `Popover` anchored to column header
- Checkbox list of that column's distinct values
- "Clear" link at bottom
- Reads/writes same filter state as `FilterSheet` — fully synced

### Toolbar changes
- Favorites filter button: `Button variant="outline" size="icon-sm"` with `fa-star`. Active state: `--chart-4` amber border + color + tinted bg. Toggles `favoritesFilter` state.
- Bookmark filter removed (replaced by favorites)
- Status, type, difficulty filters wired to new `Saved | Draft` values

### Bulk action bar
Unchanged — Export, Add to Folder, Clear selection.

### Row context menus — status references updated
All instances of old status values (Active, Approved, etc.) replaced with `Saved | Draft` in all three context menu variants (Admin, Faculty-own, Faculty-view-only).
- "Promote to Pool" → "Promote to Saved" (Faculty own Draft questions)

---

## Section 5: Header, Title & Badges

### `qb-header.tsx` — simplified
- **Left side:** Sidebar toggle button + divider only. Breadcrumb removed.
- **Right side:** Persona switcher + Ask Leo button — unchanged.
- Header is pure chrome — all navigation context lives in the title.

### `qb-title.tsx` — Google Drive–style breadcrumb title

The h1 becomes the breadcrumb navigator:
```
Question Bank › [PHAR101 QB ▾] › [Cardiology ▾]     [New Question ▾]  [⋯]
14 questions · Last updated 2 days ago
```

**Each path segment:**
- `text` rendered as `Button variant="ghost" size="sm"` styled as a link
  - Click → navigates directly to that folder level
  - Hover → folder snapshot `Popover` (name, collaborators, count, last updated, difficulty bar)
- `▾` rendered as `Button variant="ghost" size="icon-xs"` immediately after text
  - Click → `DropdownMenu` of sibling folders at that level, current one marked with checkmark
  - Selecting a sibling → navigates to it, updates `selectedFolderId`, triggers sidebar highlight flash

**Special cases:**
- `"Question Bank"` = root segment, no chevron. Click resets to All Questions view.
- `navView === 'all'`: title shows `Question Bank › All Questions` (no chevron)
- `navView === 'my'`: title shows `Question Bank › My Questions` (no chevron)

**Subtitle:** `"{count} questions · Last updated {time}"` — unchanged.

**Split button + overflow `[⋯]`:** unchanged.

### `badges.tsx` — updated

**StatusBadge:** Two variants only:
```ts
Saved: { bg: '--qb-status-saved-bg', fg: '--qb-status-saved-fg', icon: 'fa-circle-check' }
Draft: { bg: '--qb-status-draft-bg', fg: '--qb-status-draft-fg', icon: 'fa-hourglass' }
```
All other status styles removed.

**DiffBadge:** Plain neutral text. `color: 'var(--muted-foreground)'`, no font-weight variation, no icon.

**TypeBadge:** Neutral `--muted-foreground` text + `fa-light` type icon. No colored background. Renders as inline text.

**CSS tokens to add to `app/globals.css`:**
```css
--qb-status-saved-bg:  color-mix(in oklch, var(--chart-2) 15%, transparent);
--qb-status-saved-fg:  color-mix(in oklch, var(--chart-2) 80%, var(--foreground));
--qb-status-draft-bg:  color-mix(in oklch, var(--chart-4) 15%, transparent);
--qb-status-draft-fg:  color-mix(in oklch, var(--chart-4) 75%, var(--foreground));
```

---

## Section 6: Modals & Filter Sheet

### `ManageCollaboratorsModal` — redesigned

Single-view modal (no tabs):

**Header:** "Manage Access" title + folder path subtitle (e.g. `PHAR101 QB › Cardiology`)

**People with access section:**
- Owner row: `Avatar` (initials, `--avatar-initials-bg/fg`) + name + `Badge variant="secondary"` "Owner" — no role selector, no remove button
- Collaborator rows: `Avatar` + name + inline `Select` (Can Edit / View Only) + `Button variant="ghost" size="icon-xs"` `fa-xmark` remove
- Remove triggers inline confirmation: `"Remove [Name]? [Undo]"` auto-dismisses in 3s

**Add people section:**
- `InputGroup` + `InputGroupAddon fa-magnifying-glass` — filters available faculty via `Command`
- `Select` for role preset (Can Edit / View Only)
- `Button variant="default" size="sm"` "Invite" — disabled until faculty selected from search results

**Removed:** Folder visibility tab entirely.

### `SmartPopulateModal` — status references updated
- "Promote Drafts" mode: language updated to `Draft → Saved`
- Step 1 filter: shows `Draft` questions only (user's own per role)
- All status references updated from old values to `Saved | Draft`

### `FilterSheet` — updated

**New section at top:** "Favorites" — single toggle "Show favorites only" — synced with toolbar favorites filter.

**Status section:** Two checkboxes only — `Saved`, `Draft`.

**Difficulty section:** Neutral text labels (matching DiffBadge).

**Type, Bloom's sections:** Unchanged.

### Inline column filter popover
- Triggered from column header context menu
- DS `Popover` anchored to `<th>`
- Checkbox list of column's distinct values
- "Clear" link at bottom
- Reads/writes same filter state as `FilterSheet`

---

## Section 7: New Nav Pages

### App Sidebar — new items (`app-sidebar.tsx`)
```
fa-graduation-cap   Courses           /courses
fa-rectangle-list   Assessment Builder  /assessment-builder
fa-folder           Question Bank      /question-bank  (existing)
```

### Courses Page (`app/(app)/courses/page.tsx`)

**Layout:** Page header "Courses" + accordion list.

**Each course:** DS `Collapsible` row with `fa-chevron-right` / `fa-chevron-down` toggle.

**Each offering row (inside collapsible):**
- Semester + year label
- Student count with `fa-users` icon
- `Button variant="ghost" size="sm"` "View QB" → navigates to `/question-bank` with that course pre-selected

**`[+ New Course]` button:** Present, disabled, `Tooltip` "Coming soon".

**Mock data:** Uses `mockCourses[]` + `mockCourseOfferings[]` from `qb-mock-data.ts`.

### Assessment Builder Page (`app/(app)/assessment-builder/page.tsx`)

**Layout:** Two-panel split.

**Left panel (240px):** Course + offering tree. Click an offering to load its assessments in the right panel. First offering auto-selected on mount.

**Right panel:** 
- Header: selected course + offering name + assessment count
- Smart views: `Tabs variant="line"` — "All", "High Difficulty", "Unbalanced"
- Assessment cards: DS `Card` per assessment showing:
  - Title + question count
  - Difficulty distribution segmented bar (same design as folder snapshot, using `--chart-2/4/1` tokens)
  - `Button variant="ghost" size="sm"` "View Questions" (placeholder, no navigation yet)

**Mock data:** Uses `mockAssessments[]` from `qb-mock-data.ts`.

---

## Implementation Order (Layer-by-layer)

1. `lib/qb-types.ts` — data model changes
2. `lib/qb-mock-data.ts` — updated mock data + new mock arrays
3. `qb-state.tsx` — role logic, new state fields, auto-select, empty state
4. `qb-sidebar.tsx` — tree restructure, context menu removals
5. `app/globals.css` — new CSS tokens (status, highlight flash animation)
6. `badges.tsx` — StatusBadge, DiffBadge, TypeBadge updates
7. `qb-table.tsx` — column changes, drag-to-reorder, header context menus, subfolder interaction, favorites, difficulty popover
8. `qb-header.tsx` — simplified (breadcrumb removal)
9. `qb-title.tsx` — Google Drive–style breadcrumb title
10. `qb-modals.tsx` — ManageCollaboratorsModal redesign, SmartPopulateModal status update, FilterSheet updates
11. `app-sidebar.tsx` — new nav items
12. `app/(app)/courses/` — new Courses page
13. `app/(app)/assessment-builder/` — new Assessment Builder page

---

## Rules (from CLAUDE.md — apply throughout)

- Never hardcode hex/rgb/oklch — use `var(--token)` always
- Every button must be DS `Button` with explicit `variant` and `size`
- Never use raw `<button>`, `<table>`, or third-party grids
- Never use toast — use banners or inline status
- All interactive components: `'use client'` at top
- Font Awesome Pro icons only: `fa-light` default, `fa-solid` active/selected
- All DS components imported from `@exxat/ds/packages/ui/src`
- Never edit files in `exxat-ds/` or `studentUX/`
