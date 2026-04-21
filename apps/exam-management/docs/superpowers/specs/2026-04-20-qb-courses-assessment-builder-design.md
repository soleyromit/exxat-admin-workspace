# Exam Management — QB, Courses & Assessment Builder Redesign
**Date:** 2026-04-20
**Author:** Romit Soley (Product Designer II)
**Status:** Approved for implementation

---

## 1. Overview

Three connected updates to the Exam Management admin app:

1. **QB Updates** — table column redesign, sidebar cleanup, column context menus with full filter/sort/drag/hide logic
2. **Courses** — new standalone page listing courses and offerings with student counts
3. **Assessment Builder** — new standalone page for composing assessments by picking questions from the QB, with smart views and a live difficulty distribution chart

All three are separate entries in the app's main sidebar (no nesting). DS `Table` primitives from `@exxat/ds/packages/ui/src` replace the existing raw `<table>` in QB.

---

## 2. Navigation & Information Architecture

### 2.1 Sidebar entries
Three peer sidebar items, added to `components/app-sidebar.tsx`:

| Item | Icon | Route |
|---|---|---|
| Courses | `fa-light fa-book` | `/courses` |
| Assessment Builder | `fa-light fa-pen-ruler` | `/assessment-builder` |
| Question Bank | `fa-light fa-book-open` (existing) | `/question-bank` (existing) |

Each is a fully independent page. No shared chrome between the three.

### 2.2 Cross-navigation
- **Courses page** → `fa-light fa-arrow-right` "Go to QB" links to `/question-bank?course=PHAR101`
- **Assessment Builder** course/offering selector is self-contained; does not redirect to Courses
- **QB breadcrumb** parent link navigates within QB only (to parent folder, not to Courses)

---

## 3. Question Bank — QB Updates

### 3.1 QB Table — Column Redesign

Migrate table from raw `<table>` to DS `Table, TableHeader, TableBody, TableRow, TableCell, TableHead` from `@exxat/ds/packages/ui/src`.

#### Final column order

| # | Key | Label | Default visible | Sortable | Filterable | Notes |
|---|---|---|---|---|---|---|
| 1 | `select` | — | Yes | No | No | Checkbox; always visible |
| 2 | `title` | Question | Yes | Yes | Text → panel | Title only. Remove type pill from cell. |
| 3 | `status` | Status | Yes | Yes | Inline enum | Saved / Draft only |
| 4 | `type` | Type | Yes | Yes | Inline enum | Renamed from "Question". Plain neutral text, no pill. |
| 5 | `difficulty` | Difficulty | Yes | Yes | Inline enum | Weight-only text hierarchy (see §3.2) |
| 6 | `blooms` | Bloom's | Yes | Yes | Inline enum | Existing badge style retained |
| 7 | `location` | Location | Yes | No | No | Renamed from "Sub Folder". Shows `Course QB › Subfolder`. Course segment is a clickable link navigating to that folder in the sidebar. |
| 8 | `creator` | Creator | Yes | No | No | Avatar + name. Stays. |
| 9 | `lastEditedBy` | Last Edited By | Yes | No | No | Avatar + name |
| 10 | `usage` | Usage | Yes | Yes | No | Times used in assessments |
| 11 | `pbis` | P– | Yes | Yes | No | pBIS value with direction arrow |
| 12 | `version` | Ver. | Yes | No | No | Version badge |
| 13 | `favorited` | ★ | Yes | No | No | Star icon per row. Filled = favorited, empty = not. Replaces bookmark. |
| 14 | `actions` | — | Yes | No | No | ⋯ context menu; always visible |

**Columns that can be hidden:** type, difficulty, blooms, location, creator, lastEditedBy, usage, pbis, version.

**Columns that cannot be hidden:** select, title, status, favorited, actions.

#### Removed from Question cell
- Type badge/pill (was shown as sub-row inside the title cell)
- Control type label

#### Status values
Only `Saved` and `Draft` remain. All other status types (Active, Ready, In-Review, Flagged, Approved, Locked) are removed from QB entirely.

- Saved: teal-tinted pill — `background: oklch(0.93 0.04 200 / 0.25)`, `color: oklch(0.35 0.12 200)`
- Draft: amber-tinted pill — `background: oklch(0.93 0.03 80 / 0.25)`, `color: oklch(0.45 0.1 70)`

Role-based visibility:
- Admin: sees all Saved and Draft questions in scope
- Faculty: sees all Saved questions + only their own Draft questions

### 3.2 Difficulty — Neutral Weight Hierarchy

Remove pill entirely. Render as plain text with weight-only differentiation. No color.

```
Easy   → font-weight: 400, color: oklch(0.55 0.005 270)   (light gray)
Medium → font-weight: 600, color: oklch(0.35 0.005 270)   (semibold dark)
Hard   → font-weight: 800, color: oklch(0.18 0.005 270)   (extrabold near-black)
```

CSS tokens: add `--qb-diff-easy`, `--qb-diff-medium`, `--qb-diff-hard` to `app/globals.css`. Update `DiffBadge` in `components/qb/badges.tsx` to render text-only (no DS `Badge` wrapper).

### 3.3 Favorites — Star Icon

Replace bookmark icon with star icon per row. Controlled from the `favorited` column.

- Empty: `fa-light fa-star`, `color: var(--muted-foreground)`, `opacity: 0` (visible on row hover or if favorited)
- Filled: `fa-solid fa-star`, `color: var(--chart-4)` (amber)

The toolbar ★ filter button filters to favorited questions only. Active state: `borderColor: var(--chart-4)`, `color: var(--chart-4)`.

Remove all bookmark (`fa-bookmark`) references from QB.

### 3.4 Location Column

Replaces "Sub Folder" column. Shows the full path of the question's folder:

```
PHAR101 QB  ›  Antibiotics & Antimicrobials
   ↑                    ↑
 clickable link       plain text
 navigates to         (current folder)
 course root
 in QB sidebar
```

- Parent segment: `color: var(--brand-color)`, underlined, `onClick → navigateToFolder(courseRootId)`
- Separator: `›` at `opacity: 0.4`
- Current segment: `color: var(--muted-foreground)`, plain text

### 3.5 Column Header Context Menus — Hybrid Filter Approach

Every column header renders a DS `DropdownMenu` (extends existing `ColHeader` component in `qb-table.tsx`). Content varies by column type:

#### All columns include:
```
Sort ascending     (↑)
Sort descending    (↓)
─────────────────
Pin left           (📌)  — freeze column to left edge
Auto-fit width     (↔)  — resize to content
Hide column        (👁)  — add to hiddenCols; non-hideable columns grey this out
```

#### Enum columns additionally include an inline filter section:
Enum columns: Status, Type, Difficulty, Bloom's

```
─────────────────
Filter
☐ Easy
☑ Medium
☐ Hard
```

Checking/unchecking updates that column's filter Set immediately (no apply button). Active filters show as chips below the toolbar.

#### Text/relational columns open the filter panel:
Text columns: Title (search), Last Edited By

```
─────────────────
🔍 Filter by [column] →     (opens FilterPropertiesSheet, scrolled to that section)
```

#### Column drag-reorder:
All hideable columns support drag-to-reorder via HTML5 drag events on `<th>`. State stored in `columnOrder: ColumnId[]` in QB context (currently defined but unused — wire it up). Non-hideable columns (select, title, status, favorited, actions) cannot be reordered.

### 3.6 All Questions View

- Shows all Saved questions + own Draft questions (role-based, per §3.1)
- Switched to via the **All Questions** sidebar nav item (no duplicate toolbar tab — sidebar is the single switcher)
- Active filter chips below toolbar showing all active column filters
- Filter panel (right sheet): Title search, Last Edited By search, column visibility toggles

### 3.7 My Questions View

- Shows only questions where `creator === currentPersona.id`
- Same table columns and column context menus as All Questions
- No additional filtering beyond creator ownership

### 3.8 Toolbar Actions

Retained:
- Search (expandable `InputGroup`)
- Favorites toggle ★ (active = chart-4 amber)
- Columns & Filters button (opens `FilterPropertiesSheet`)

Removed:
- Bookmark toggle (replaced by Favorites ★)
- "My Questions" toggle button (moved to tab)

---

## 4. QB Sidebar — Changes

### 4.1 Folder naming
Course-level folders display as: `{CODE} · Question Bank`

Examples:
- `PHAR101 · Question Bank`
- `BIOL201 · Question Bank`

This is a **display-only transformation** in the sidebar renderer — derive the label from `folder.isCourse === true` folders by reformatting `folder.name` (e.g. strip " (QB)" suffix, reformat to `{code} · Question Bank`). Do not change the stored `folder.name` value. Sidebar truncates with ellipsis if too long.

No course offering label, no semester shown anywhere in QB sidebar.

### 4.2 Removed from sidebar
- **Fall 2026 / semester labels**: No offering-level folder nodes in QB. Subfolders sit directly under course root.
- **Question Set nodes**: Remove from folder tree and from all context menus.
- **Lock Folder**: Remove from folder context menu and QB nav menus.
- **Folder visibility indicator**: Lock icon on folders removed.

### 4.3 Folder Context Menu
Reduced to 4 items (admin only):

```
📁 New Subfolder
👥 Manage Access
✏️ Rename
─────────────
🗑 Delete       (destructive, requires confirmation dialog)
```

### 4.4 Row Context Menu (question rows)
Retained items:
- Edit (admin or owner only)
- Duplicate
- Move to Folder (admin only)
- Request Edit Access (faculty / non-owner only)
- Delete (admin or owner only, requires confirmation)

Removed:
- Add to Question Set
- Lock Question

### 4.5 Manage Access Modal
- Remove "Folder Visibility" tab entirely
- Single "Collaborators" tab remains
- No other changes to collaborator list UI

---

## 5. Courses Page — `/courses`

### 5.1 Layout
Standard admin page: page header + toolbar + expandable table.

Page title: **Courses** (ivypresto-text, 22px)
Page meta: `{N} courses · {M} offerings`

### 5.2 Table structure
Two-level expandable table using DS `Table` primitives:

**Course row** (expandable, click to toggle):
- Expand chevron (`fa-light fa-chevron-right`, rotates 90° when open)
- Code chip (monospace, brand-tinted)
- Course name
- Offering count
- Total students
- QB question count (clickable link → `/question-bank?course={code}`)
- "Assessment Builder →" link → `/assessment-builder?course={courseId}`

**Offering row** (child, shown when course expanded):
- Semester label with dot indicator (brand color = active, gray = past)
- "Active offering" / "Past offering" label
- Student count pill
- Status badge: Active (green-tinted) / Past (gray)
- Assessment count
- "View assessments →" link → `/assessment-builder?course={courseId}&offering={offeringId}`

### 5.3 Columns

| Column | Course row | Offering row |
|---|---|---|
| Code | Monospace chip | — (indented semester label) |
| Course name | Full name | — |
| Offering / Semester | "{N} offerings" | Semester label |
| Students | Total across offerings | Count pill |
| Status | — | Active / Past badge |
| QB Questions | Link to QB | Assessment count |
| Actions | "Assessment Builder →" | "View assessments →" |

---

## 6. Assessment Builder — `/assessment-builder`

### 6.1 Layout — Persistent split (Option A)

```
┌─────────────────────────────────────────────────────────────┐
│  [Course · Offering selector dropdown]                       │
├──────────────────┬──────────────────────────────────────────┤
│  Assessment list │  QB Question Picker                       │
│  (left panel)    │  [Smart view chips]                       │
│                  │  [Question rows with checkboxes]          │
│  Midterm Exam    │                                           │
│  ▓▓▓▓░░░░        │  ☑ Question title…  Easy  MCQ            │
│                  │  ☑ Question title…  Medium MCQ            │
│  Final Exam      │  ☐ Question title…  Hard  Ordering        │
│  ▓▓▓▓▓▓░░        │                                           │
│                  ├──────────────────────────────────────────┤
│  + New           │  [Difficulty distribution bar chart]      │
│    assessment    │  10 Easy · 20 Medium · 10 Hard            │
│                  │  [Cancel]  [Save assessment]              │
└──────────────────┴──────────────────────────────────────────┘
```

### 6.2 Left panel — Assessment list

- Course + offering selector at top (DS `Select`)
- List of assessments for selected offering
- Each assessment shows:
  - Name
  - Question count
  - Mini difficulty distribution bar (3 segments: Easy/Medium/Hard using neutral weight colors, no color fill — gray tones matching the table difficulty style)
- "+ New assessment" button (dashed border card at bottom of list)
- Clicking an assessment loads its questions into the picker

### 6.3 Right panel — QB Question Picker

**Smart view chips** (horizontal scrollable row above question list):

System-defined (always present):
- All questions
- Hard only
- MCQ · Medium
- Apply + Analyze
- Not yet used (usage = 0)

User-saved presets:
- Shown with `★` prefix and dashed border
- "+ Save current view" chip appends current filter state as a named preset (DS `Dialog` for naming)
- Saved to localStorage under `qb-smart-views-{userId}`

**Question list:**
- Same columns as QB table but simplified: checkbox, title (truncated), difficulty (neutral weight), type (neutral text)
- Questions already added to the assessment show as checked
- Checking/unchecking updates the assessment and re-renders the difficulty chart
- No pagination — virtual scroll or load-all for typical assessment sizes

**Filter chips** below smart view row showing active filters (same chip pattern as QB table)

### 6.4 Footer — Difficulty Distribution

Vertical bar chart using DS `ChartContainer` / `ChartTooltip` from `@exxat/ds/packages/ui/src`:
- 3 bars: Easy, Medium, Hard
- Bar fills use neutral grays matching difficulty text colors: `oklch(0.55 0.005 270)` / `oklch(0.35 0.005 270)` / `oklch(0.18 0.005 270)`
- Label below each bar: count
- Summary text: `{E} Easy · {M} Medium · {H} Hard`
- Updates live as questions are checked/unchecked

Save button: DS `Button variant="default"` — disabled until at least 1 question selected.

---

## 7. DS Migration Notes

### 7.1 Table primitives
Replace all raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` in `qb-table.tsx` with DS equivalents:

```ts
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@exxat/ds/packages/ui/src'
```

All existing token-based styling (`--dt-header-bg`, `--dt-row-hover`, etc.) is preserved via `className` on DS components.

### 7.2 Dead code to remove
- `FilterSheet` component in `qb-modals.tsx` — not rendered anywhere, superseded by `FilterPropertiesSheet` in `qb-table.tsx`
- `/components/qb/tooltip.tsx` — unused; QB uses DS `Tooltip` directly
- `/components/qb/portal.tsx` — unused; no Portal-based overlays remain

### 7.3 State cleanup
- Wire `columnOrder` / `setColumnOrder` from QB context (currently defined but unused) to drive drag-reorder
- Move `myQuestionsOnly` / `favoritesFilter` filter state into qb-table local state (unify with `statusFilter`, `typeFilter`, `diffFilter`)
- Remove `filterSheetOpen` from QB context (dead, used only by removed `FilterSheet`)
- Fix `setTimeout` in `setHighlightedFolderId` — add cleanup via `useRef` to avoid leak on unmount

### 7.4 New CSS tokens (add to `app/globals.css`)
```css
/* Difficulty — neutral weight */
--qb-diff-easy:    oklch(0.55 0.005 270);
--qb-diff-medium:  oklch(0.35 0.005 270);
--qb-diff-hard:    oklch(0.18 0.005 270);

/* Status — updated */
--qb-status-saved-bg:  oklch(0.93 0.04 200 / 0.25);
--qb-status-saved-fg:  oklch(0.35 0.12 200);
--qb-status-draft-bg:  oklch(0.93 0.03 80 / 0.25);
--qb-status-draft-fg:  oklch(0.45 0.1 70);
```

---

## 8. Out of Scope

- Backend / API integration (all state remains mock data)
- Dark mode
- Mobile / responsive layouts
- Student app changes
- Assessment Builder — editing question content
- Courses page — adding/editing course records
