# Base Entities P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all P1 design updates across Student, Faculty, and Course Offering base entity pages in exam-management admin, sourced from Aarti + Vishaka raw Granola transcripts (May 13, 19, 20).

**Architecture:** Eight independent tasks, each self-contained. No new routes. QB pages untouched — only reference their InputGroup/FilterPill visual patterns. All LMS gate state is a local `const IS_LMS_ACTIVE = false` flag; no real integration.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, `@exxat/ds/packages/ui/src`, TailwindCSS v4, mock data from `lib/`

---

## Source decisions (read before any task)

| Decision | Task |
|---|---|
| QB first in left nav, Courses second — Aarti May 19 | T1 |
| Student list: filter by current/recent term — Aarti May 13 | T2 |
| LMS active → disable add/edit on all entity pages — Aarti May 13 | T2, T4 |
| Competency bars → strip plot; red → amber for < 65 — May 19–20 | T3 |
| Academic standing: admin-only (FERPA) — Aarti May 13 | T3 |
| Faculty list: recently viewed sidebar — Aarti May 13 | T4 |
| Faculty detail: Teaching = coordinator + contributor split — Aarti May 13 | T5 |
| Faculty detail: QB folders owned + pending reviews — Aarti May 19 | T5 |
| Course detail: LMS chip on header — Vishaka May 19 | T6 |
| Course detail: tab count badges — Aarti May 19 | T6 |
| Course detail: QB tab replaces Questions tab — Aarti May 19–20 | T7 |
| Course detail overview: QB stats block (Phase 1), objectives = Phase 2 — Aarti May 19 | T7 |

## QB table pattern (reference — do NOT change QB files)

The QB uses these patterns. Apply to entity tables with large data:
- **Search:** `InputGroup` + `InputGroupAddon` (magnifying-glass icon) + `InputGroupInput` + clear `InputGroupButton` when non-empty. `SearchInput` component already follows this.
- **Filter chips:** Dashed border + `--border` when empty/unset. Solid border + `--border-control-3` + `--muted` bg when active. Each chip opens a Popover with a checkbox list. "+N more" badge for overflow values. "Clear all" appears when any filter is active.
- **Toolbar layout:** Left = filter chips row (flex-wrap). Right = count text + primary action.

For entity pages, apply filter chips using `Popover` + `PopoverTrigger` + `PopoverContent` from DS (same as QB) — no shared component extraction needed for P1.

---

## File map

| File | Task | Op |
|---|---|---|
| `components/app-sidebar.tsx` | T1 | Modify |
| `app/(app)/students/students-client.tsx` | T2 | Modify |
| `app/(app)/students/[id]/student-detail-client.tsx` | T3 | Modify |
| `app/(app)/faculty/faculty-client.tsx` | T4 | Modify |
| `app/(app)/faculty/[id]/faculty-detail-client.tsx` | T5 | Modify |
| `app/(app)/courses/[id]/course-detail-client.tsx` | T6, T7 | Modify |
| `app/(app)/courses/[id]/tabs/overview-tab.tsx` | T7 | Modify |
| `app/(app)/courses/[id]/tabs/question-bank-tab.tsx` | T7 | Create |

> All paths relative to `apps/exam-management/admin/`.

---

## Task 1 — Sidebar: QB first, Courses second

**Files:**
- Modify: `components/app-sidebar.tsx:295-341`

- [ ] **Step 1: Reorder NAV_ITEMS_BASE array**

In `app-sidebar.tsx`, find `const NAV_ITEMS_BASE = [` at line 295. Reorder so `question-bank` is first and `courses` is second:

```ts
const NAV_ITEMS_BASE = [
  {
    key: 'question-bank',
    title: 'Question Bank',
    href: '/question-bank',
    icon: 'fa-books',
  },
  {
    key: 'courses',
    title: 'Courses',
    href: '/courses',
    icon: 'fa-graduation-cap',
  },
  {
    key: 'students',
    title: 'Students',
    href: '/students',
    icon: 'fa-user-graduate',
  },
  {
    key: 'faculty',
    title: 'Faculty',
    href: '/faculty',
    icon: 'fa-chalkboard-user',
    adminOnly: true,
  },
  {
    key: 'accommodations',
    title: 'Student Accommodations',
    href: '/accommodations',
    icon: 'fa-universal-access',
    adminOnly: true,
  },
  {
    key: 'competency',
    title: 'Competency',
    href: '/competency',
    icon: 'fa-bullseye-arrow',
  },
]
```

- [ ] **Step 2: Verify in browser**

Start dev server: `cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev`

Open http://localhost:3001. Confirm sidebar order: Question Bank → Courses → Students → Faculty → Accommodations → Competency.

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/admin/components/app-sidebar.tsx
git commit -m "feat(base-entities): reorder sidebar — QB first, Courses second (Aarti May 19)"
```

---

## Task 2 — Student list: term filter chip + LMS gate

**Files:**
- Modify: `app/(app)/students/students-client.tsx`

The student list uses a Google-style single search (no filter controls per Aarti). Exception: term filter is required because "do NOT show all students ever — filter by current/recent term" (Aarti May 13). The term chip follows QB filter chip visual pattern.

- [ ] **Step 1: Add imports and constants**

At the top of `students-client.tsx`, add to the existing DS import block:

```ts
import {
  // existing imports...
  Popover, PopoverTrigger, PopoverContent,
} from '@exxat/ds/packages/ui/src'
```

After the existing imports, add these constants before `COLUMNS`:

```ts
// LMS gate — when active, add/edit controls are disabled and a "Managed by Canvas"
// indicator is shown. Set to true to preview the LMS-active state.
const IS_LMS_ACTIVE = false

// Available terms — in production, derived from enrolled courses.
const TERMS = ['Fall 2026', 'Spring 2026', 'Fall 2025', 'Spring 2025'] as const
type Term = typeof TERMS[number]
const CURRENT_TERM: Term = 'Fall 2026'
```

- [ ] **Step 2: Add term state to StudentsClient**

Inside `export default function StudentsClient()`, add term state after existing `useState` calls:

```ts
const [selectedTerm, setSelectedTerm] = useState<Term>(CURRENT_TERM)
const [termOpen, setTermOpen] = useState(false)
```

- [ ] **Step 3: Update filter logic to include term**

Replace the existing `const filtered = useMemo(...)` with:

```ts
const filtered = useMemo((): StudentTableRow[] => {
  const q = query.trim().toLowerCase()
  // Term filter: in production, studentListRows would have a term field.
  // Mock: filter by cohort year matching the term year as a proxy.
  const termYear = selectedTerm.split(' ')[1]
  const rows = studentListRows.filter(s => {
    const matchTerm = s.cohort.includes(termYear)
    const matchQuery = !q || (
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.cohort.toLowerCase().includes(q) ||
      s.advisor.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q) ||
      s.annotations.some(a => a.text.toLowerCase().includes(q))
    )
    return matchTerm && matchQuery
  })
  return rows as StudentTableRow[]
}, [query, selectedTerm])
```

- [ ] **Step 4: Add LMS gate to "Add Student" button**

In the JSX, find the `<PageHeader` component call. Replace the `actions` prop:

```tsx
actions={
  IS_LMS_ACTIVE ? (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="rounded-full gap-1.5 text-xs"
        style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color)' }}
      >
        <i className="fa-light fa-link" aria-hidden="true" />
        Managed by Canvas
      </Badge>
    </div>
  ) : (
    <Button size="sm" onClick={() => setAddStudentOpen(true)}>
      <i className="fa-light fa-plus" aria-hidden="true" />
      Add Student
    </Button>
  )
}
```

- [ ] **Step 5: Add term filter chip + toolbar row**

In the JSX, find the `<div className="px-4 lg:px-6 pt-4 pb-2">` block that contains `<SearchInput`. Replace the entire block with:

```tsx
<div className="px-4 lg:px-6 pt-4 pb-2 flex flex-col gap-2">
  {/* Google-style search — Aarti: "single line like Google search, no filters" */}
  <SearchInput
    entityKey="students"
    value={query}
    onChange={setQuery}
    placeholder="Search by name, ID, email, cohort, advisor, or tag…"
    aria-label="Search students"
    width="w-full max-w-lg"
  />

  {/* Term filter chip — QB pattern: dashed = unset, solid = active */}
  <div className="flex items-center gap-2 flex-wrap">
    <Popover open={termOpen} onOpenChange={setTermOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={termOpen}
          className="inline-flex items-center gap-1.5 text-xs rounded"
          style={{
            height: 26,
            padding: '0 8px 0 8px',
            border: '1.5px dashed var(--border)',
            backgroundColor: 'var(--background)',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <i className="fa-light fa-calendar" aria-hidden="true" style={{ fontSize: 10 }} />
          <span className="font-medium">{selectedTerm}</span>
          <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 8 }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: 180, padding: '6px 0' }}>
        {TERMS.map(term => (
          <button
            key={term}
            type="button"
            onClick={() => { setSelectedTerm(term); setTermOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
            style={{ color: term === selectedTerm ? 'var(--brand-color)' : 'var(--foreground)' }}
          >
            {term === selectedTerm && (
              <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, flexShrink: 0 }} />
            )}
            {term !== selectedTerm && <span style={{ width: 14, flexShrink: 0 }} aria-hidden="true" />}
            {term}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  </div>
</div>
```

- [ ] **Step 6: Gate "Edit Student" row action**

In `COLUMNS`, find the `actions` column cell. Wrap the Edit action with LMS check:

```tsx
actions={[
  ...(!IS_LMS_ACTIVE ? [{ label: 'Edit Student', icon: 'fa-pen', onClick: () => {} }] : []),
  ...(row.prismLinked ? [{ label: 'View in Prism', icon: 'fa-arrow-up-right-from-square', onClick: () => window.open(`https://steps.exxat.com/admin/student/${row.id as string}`, '_blank') }] : []),
  ...(!IS_LMS_ACTIVE ? [{ label: 'Deactivate', icon: 'fa-ban', variant: 'destructive' as const, divider: true, onClick: () => {} }] : []),
]}
```

- [ ] **Step 7: Verify**

In browser: confirm term chip appears, switching terms filters students. Toggle `IS_LMS_ACTIVE = true` to preview: Add Student button replaced by Canvas badge, Edit action removed from row menu.

- [ ] **Step 8: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/students/students-client.tsx
git commit -m "feat(base-entities): student list — term filter chip + LMS gate (Aarti May 13)"
```

---

## Task 3 — Student detail: competency strip plot + standing gate

**Files:**
- Modify: `app/(app)/students/[id]/student-detail-client.tsx`

Two changes: (1) replace progress bars in AssessmentsTab with a dot-on-line strip plot (no bars — confirmed May 19/20), (2) gate academic standing to admin role only (FERPA — Aarti May 13).

- [ ] **Step 1: Add useFacultySession import**

At the top of `student-detail-client.tsx`, find the existing imports. Add `useFacultySession` if not already imported:

```ts
import { useFacultySession } from '@/lib/faculty-session'
```

- [ ] **Step 2: Replace the competency performance section in AssessmentsTab**

In `AssessmentsTab`, find the `{student.competencyPerformance.length > 0 && (` block (around line 553). Replace the entire `<section>` that contains the competency bars with:

```tsx
{student.competencyPerformance.length > 0 && (
  <section aria-labelledby="competency-heading" className="rounded-xl border border-border bg-card p-5">
    <h2 id="competency-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-4">
      Competency Performance
    </h2>
    <div className="flex flex-col gap-5">
      {student.competencyPerformance.map(cp => {
        // Amber for below 65, success-green for 80+, brand for in-between
        // Never use --destructive for scores (Aarti: no red in score viz)
        const fgColor =
          cp.avgScore >= 80 ? 'var(--qb-status-saved-fg)' :
          cp.avgScore < 65  ? 'var(--standing-warning-fg)' :
                              'var(--brand-color)'
        const trendIcon =
          cp.trend === 'improving' ? 'fa-arrow-trend-up' :
          cp.trend === 'declining' ? 'fa-arrow-trend-down' : 'fa-minus'

        // Strip plot: a horizontal line with a dot marker at the score position
        // and a thin background track. No filled bar — dot-on-line pattern from QB conventions.
        const pct = `${cp.avgScore}%`

        return (
          <div key={cp.area} className="flex items-center gap-3">
            <span
              className="text-sm text-foreground shrink-0 truncate"
              id={`comp-${cp.area.replace(/\s/g, '-')}`}
              style={{ width: 200 }}
            >
              {cp.area}
            </span>

            {/* Strip plot track */}
            <div
              className="flex-1 relative"
              role="img"
              aria-label={`${cp.area}: ${cp.avgScore}%`}
            >
              {/* Background track */}
              <div
                className="rounded-full"
                style={{ height: 2, backgroundColor: 'var(--border)', position: 'relative' }}
              >
                {/* Benchmark line at 65% — threshold */}
                <div
                  style={{
                    position: 'absolute',
                    left: '65%',
                    top: -3,
                    width: 1,
                    height: 8,
                    backgroundColor: 'var(--border)',
                    opacity: 0.6,
                  }}
                  aria-hidden="true"
                />
                {/* Score dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: pct,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: fgColor,
                    border: '2px solid var(--background)',
                    boxShadow: `0 0 0 1px ${fgColor}`,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Min/max labels */}
              <div className="flex justify-between mt-1" aria-hidden="true">
                <span className="text-[9px] text-muted-foreground">0%</span>
                <span className="text-[9px] text-muted-foreground" style={{ marginLeft: '60%' }}>65</span>
                <span className="text-[9px] text-muted-foreground">100%</span>
              </div>
            </div>

            <span
              className="text-sm font-semibold tabular-nums shrink-0"
              style={{ width: 36, textAlign: 'right', color: fgColor }}
            >
              {cp.avgScore.toFixed(0)}%
            </span>
            <i
              className={`fa-light ${trendIcon} shrink-0`}
              aria-label={cp.trend}
              style={{ fontSize: 11, color: 'var(--muted-foreground)' }}
            />
          </div>
        )
      })}
    </div>

    {/* Legend */}
    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--standing-warning-fg)' }} aria-hidden="true" />
        Below 65%
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--qb-status-saved-fg)' }} aria-hidden="true" />
        80%+ strong
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <div style={{ width: 1, height: 10, backgroundColor: 'var(--border)' }} aria-hidden="true" />
        65% threshold
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 3: Gate academic standing to admin role**

In `StudentDetailClient`, add the role hook after the existing `useState`:

```ts
const { role, hydrated } = useFacultySession()
const isAdmin = !hydrated || role === 'admin'
```

In the header strip JSX, find `<StandingBadge ... />` and wrap with:

```tsx
{isAdmin && (
  <StandingBadge status={student.academicStanding.status} label={student.academicStanding.label} />
)}
```

In `OverviewTab`, find the `Section 4 — Academic Standing` section. Wrap the entire `<section aria-labelledby="standing-heading"` block:

```tsx
{/* Academic standing — ADMIN only (FERPA: Aarti May 13) */}
{isPrism && (   /* existing isPrism condition, replace with role check below */
```

Actually, `OverviewTab` receives `isPrism` as a prop. Add a new `isAdmin` prop to it:

Change `OverviewTab` signature from:
```tsx
function OverviewTab({ student, isPrism }: { student: ExtendedStudent; isPrism: boolean }) {
```
to:
```tsx
function OverviewTab({ student, isPrism, isAdmin }: { student: ExtendedStudent; isPrism: boolean; isAdmin: boolean }) {
```

Then wrap the Academic Standing section:

```tsx
{/* Academic standing — ADMIN only per FERPA (Aarti May 13) */}
{isAdmin && (
  <section aria-labelledby="standing-heading" className="rounded-xl border border-border bg-card p-5">
    {/* ...existing standing content unchanged... */}
  </section>
)}
```

And update the call site in the render:

```tsx
<TabsContent value="overview" className="mt-0 outline-none">
  <OverviewTab student={student} isPrism={isPrism} isAdmin={isAdmin} />
</TabsContent>
```

- [ ] **Step 4: Verify**

In browser at `/students/[any-id]`:
- Assessments tab: dots on horizontal lines, no filled bars, amber dot for low scores, green for high.
- Toggle role to faculty in PersonaSwitcher: standing badge disappears from header, Academic Standing card gone from Overview tab.

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/students/\[id\]/student-detail-client.tsx
git commit -m "feat(base-entities): student detail — strip plot for competency, admin-only standing gate (Aarti May 13+19)"
```

---

## Task 4 — Faculty list: recently viewed sidebar + LMS gate

**Files:**
- Modify: `app/(app)/faculty/faculty-client.tsx`

Mirror the student list's recently-viewed right panel (xl breakpoint) and add LMS gate identical to Task 2.

- [ ] **Step 1: Add imports**

At top of `faculty-client.tsx`, add to DS imports:

```ts
import {
  // existing...
  Popover, PopoverTrigger, PopoverContent,
} from '@exxat/ds/packages/ui/src'
```

Add lib imports:

```ts
import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'
```

Note: `useRouter` is likely already imported. Check and avoid duplicating.

- [ ] **Step 2: Add constants after existing STATUS_CONFIG**

```ts
const IS_LMS_ACTIVE = false
```

- [ ] **Step 3: Add state in FacultyClient**

Inside the `FacultyClient` component, add after existing state:

```ts
const router = useRouter()
const [recentFaculty, setRecentFaculty] = useState<RecentlyViewedItem[]>([])

const refreshRecent = useCallback(() => {
  setRecentFaculty(loadRecentlyViewed('faculty'))
}, [])

useEffect(() => {
  refreshRecent()
  window.addEventListener('focus', refreshRecent)
  return () => window.removeEventListener('focus', refreshRecent)
}, [refreshRecent])
```

- [ ] **Step 4: Add LMS gate to Add Faculty button**

Find the `<PageHeader` actions prop. Replace the `<Button>` with:

```tsx
actions={
  IS_LMS_ACTIVE ? (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="rounded-full gap-1.5 text-xs"
        style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color)' }}
      >
        <i className="fa-light fa-link" aria-hidden="true" />
        Managed by Canvas
      </Badge>
    </div>
  ) : (
    <Button size="sm" onClick={() => setAddFacultyOpen(true)}>
      <i className="fa-light fa-plus" aria-hidden="true" />
      Add Faculty
    </Button>
  )
}
```

- [ ] **Step 5: Wrap main content in split layout + add right sidebar**

Find the `<div className="flex flex-1 min-h-0">` (or equivalent wrapper before the DataTable). If it doesn't exist, wrap the DataTable section. Make the overall layout:

```tsx
<div className="flex flex-1 min-h-0">
  {/* Main table */}
  <div className="flex flex-1 flex-col gap-0 min-h-0 min-w-0">
    <div className="px-4 lg:px-6 pt-4 pb-2">
      <SearchInput
        entityKey="faculty"
        value={query}
        onChange={setQuery}
        placeholder="Search by name, email, position, or department…"
        aria-label="Search faculty"
        width="w-full max-w-lg"
      />
    </div>

    <DataTable<FacultyTableRow>
      data={filtered}
      columns={buildFacultyColumns(isPrism)}
      getRowId={(row) => row.id as string}
      getRowSelectionLabel={(row) => row.fullName}
      selectable
      searchable={false}
      showQueryControls={false}
      onRowClick={(row) => router.push(`/faculty/${row.id as string}`)}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-chalkboard-user text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No faculty match your search</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try a different name, position, or department.
          </p>
        </div>
      }
      toolbarSlot={() => (
        <span className="text-xs text-muted-foreground">
          {filtered.length} faculty member{filtered.length !== 1 ? 's' : ''}
          {query && ` matching "${query}"`}
        </span>
      )}
    />
  </div>

  {/* Recently viewed — xl only, matches student list pattern */}
  <aside
    className="w-64 shrink-0 hidden xl:flex flex-col gap-3 px-6 pt-1"
    aria-label="Recently viewed faculty"
  >
    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
      Recently viewed
    </p>
    {recentFaculty.length === 0 ? (
      <div
        className="rounded-xl border border-dashed border-border bg-card p-4 flex flex-col items-center justify-center gap-2 text-center"
        style={{ minHeight: 120 }}
      >
        <i className="fa-light fa-clock-rotate-left text-muted-foreground" aria-hidden="true" style={{ fontSize: 18 }} />
        <p className="text-xs text-muted-foreground">Recently viewed faculty will appear here</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-1">
        {recentFaculty.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/60 transition-colors"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: 'var(--muted)' }}
                aria-hidden="true"
              >
                <i className="fa-light fa-chalkboard-user text-muted-foreground" style={{ fontSize: 12 }} aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    )}
  </aside>
</div>
```

- [ ] **Step 6: Ensure recordView is called on faculty detail**

Open `app/(app)/faculty/[id]/faculty-detail-client.tsx`. Confirm it calls `recordView('faculty', { id, name, subtitle, href, icon })` in `useEffect`. If missing, add it after the existing `useEffect` for recently-viewed (pattern from `student-detail-client.tsx:690-699`). Use `icon: 'fa-chalkboard-user'`.

- [ ] **Step 7: Verify**

Visit a few faculty detail pages, then go back to Faculty list. Confirm recently-viewed sidebar populates at xl width.

- [ ] **Step 8: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/faculty/faculty-client.tsx \
        apps/exam-management/admin/app/\(app\)/faculty/\[id\]/faculty-detail-client.tsx
git commit -m "feat(base-entities): faculty list — recently viewed sidebar + LMS gate (Aarti May 13)"
```

---

## Task 5 — Faculty detail: Teaching split + QB folders + pending reviews

**Files:**
- Modify: `app/(app)/faculty/[id]/faculty-detail-client.tsx`

Three additions to the existing tabs: (1) Teaching tab splits courses into "Coordinator" and "Contributor" groups, (2) add QB Folders panel, (3) add Pending Reviews panel.

- [ ] **Step 1: Add mock data for QB folders and pending reviews**

After the existing imports in `faculty-detail-client.tsx`, add mock data constants (these would come from an API in production):

```ts
// Mock QB folders owned by this faculty — production derives from QB folder ownership.
const MOCK_QB_FOLDERS_BY_FACULTY: Record<string, { id: string; name: string; course: string; questionCount: number }[]> = {
  'faculty-1': [
    { id: 'f1', name: 'Pharmacology I', course: 'PHAR 101', questionCount: 48 },
    { id: 'f2', name: 'Drug Interactions', course: 'PHAR 101', questionCount: 22 },
  ],
  'faculty-2': [
    { id: 'f3', name: 'Cardiology', course: 'PHYS 210', questionCount: 31 },
  ],
}

// Mock pending reviews — assessments this faculty has been asked to review.
const MOCK_PENDING_REVIEWS_BY_FACULTY: Record<string, { id: string; title: string; course: string; requestedBy: string; requestedAt: string }[]> = {
  'faculty-1': [
    { id: 'r1', title: 'Midterm 1 — Spring 2026', course: 'PHAR 101', requestedBy: 'Dr. Chen', requestedAt: '2026-05-18' },
  ],
  'faculty-2': [],
}
```

- [ ] **Step 2: Split Teaching tab into Coordinator and Contributor groups**

In the `TeachingTab` (or wherever courses are listed), find where courses are rendered as a DataTable. Above the DataTable, derive two groups:

```tsx
// Split by role: coordinator vs contributor — Aarti May 13
// Uses faculty.courses array; each course has a `level` field ('editor' | 'viewer')
const coordinatorCourses = rows.filter(r => {
  const fc = faculty.courses.find(c => c.id === r.id)
  return fc?.level === 'editor'
})
const contributorCourses = rows.filter(r => {
  const fc = faculty.courses.find(c => c.id === r.id)
  return fc?.level === 'viewer'
})
```

Replace the single DataTable with two grouped sections:

```tsx
<div className="flex flex-col gap-6">
  {/* Coordinator courses */}
  <section aria-labelledby="coordinator-heading">
    <div className="flex items-center gap-2 mb-3 px-6">
      <h2 id="coordinator-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
        Courses I Coordinate
      </h2>
      {coordinatorCourses.length > 0 && (
        <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
          {coordinatorCourses.length}
        </Badge>
      )}
    </div>
    {coordinatorCourses.length === 0 ? (
      <p className="text-sm text-muted-foreground px-6">No courses as coordinator.</p>
    ) : (
      <DataTable<CourseRow>
        data={coordinatorCourses}
        columns={buildCourseColumns(onRemoveCourse)}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        onRowClick={(row) => router.push(`/courses/${row.id as string}`)}
        toolbarSlot={() => (
          <span className="text-xs text-muted-foreground">
            {coordinatorCourses.length} course{coordinatorCourses.length !== 1 ? 's' : ''}
          </span>
        )}
      />
    )}
  </section>

  {/* Contributor courses */}
  <section aria-labelledby="contributor-heading">
    <div className="flex items-center gap-2 mb-3 px-6">
      <h2 id="contributor-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
        Courses I Contribute To
      </h2>
      {contributorCourses.length > 0 && (
        <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
          {contributorCourses.length}
        </Badge>
      )}
    </div>
    {contributorCourses.length === 0 ? (
      <p className="text-sm text-muted-foreground px-6">No courses as contributor.</p>
    ) : (
      <DataTable<CourseRow>
        data={contributorCourses}
        columns={buildCourseColumns(() => {})}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        onRowClick={(row) => router.push(`/courses/${row.id as string}`)}
        toolbarSlot={() => (
          <span className="text-xs text-muted-foreground">
            {contributorCourses.length} course{contributorCourses.length !== 1 ? 's' : ''}
          </span>
        )}
      />
    )}
  </section>
</div>
```

- [ ] **Step 3: Add QB Folders section to Assessments tab**

In the Assessments tab component, find the end of the tab content. After the existing assessments DataTable, add a QB Folders card:

```tsx
{/* QB Folders owned by this faculty — Aarti May 19 */}
{(() => {
  const folders = MOCK_QB_FOLDERS_BY_FACULTY[faculty.id] ?? []
  return (
    <section aria-labelledby="qb-folders-heading" className="rounded-xl border border-border bg-card p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 id="qb-folders-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Question Bank Folders
        </h2>
        {folders.length > 0 && (
          <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
            {folders.length}
          </Badge>
        )}
      </div>
      {folders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No QB folders owned.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {folders.map(folder => (
            <div key={folder.id} className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}>
                <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 13, color: 'var(--brand-color)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{folder.course} · {folder.questionCount} questions</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
})()}
```

- [ ] **Step 4: Add Pending Reviews section to Assessments tab**

After the QB Folders card (or as a separate card at the top of the Assessments tab before the assessments table), add:

```tsx
{/* Pending Reviews — Aarti May 19: "which reviews are they pending" */}
{(() => {
  const pendingReviews = MOCK_PENDING_REVIEWS_BY_FACULTY[faculty.id] ?? []
  if (pendingReviews.length === 0) return null
  return (
    <section aria-labelledby="pending-reviews-heading" className="rounded-xl border border-border bg-card p-5"
      style={{ borderLeft: '3px solid var(--chart-4)' }}>
      <div className="flex items-center gap-2 mb-3">
        <h2 id="pending-reviews-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Pending Reviews
        </h2>
        <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center"
          style={{ backgroundColor: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))', color: 'var(--chart-4)' }}>
          {pendingReviews.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {pendingReviews.map(review => (
          <div key={review.id} className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
              style={{ backgroundColor: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))' }}>
              <i className="fa-light fa-clipboard-check" aria-hidden="true" style={{ fontSize: 13, color: 'var(--chart-4)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{review.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {review.course} · Requested by {review.requestedBy} ·{' '}
                {new Date(review.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 text-xs">
              Review
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
})()}
```

- [ ] **Step 5: Verify**

Visit a faculty detail page. Check:
- Teaching tab: two sections (Coordinates / Contributes To), each with count badge.
- Assessments tab: Pending Reviews card appears if mock data has entries; QB Folders card shows folders.

- [ ] **Step 6: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/faculty/\[id\]/faculty-detail-client.tsx
git commit -m "feat(base-entities): faculty detail — teaching role split, QB folders, pending reviews (Aarti May 13+19)"
```

---

## Task 6 — Course detail header: LMS chip + tab count badges

**Files:**
- Modify: `app/(app)/courses/[id]/course-detail-client.tsx`

- [ ] **Step 1: Add LMS active constant and derive tab counts**

At the top of `course-detail-client.tsx` (after imports), add:

```ts
const IS_LMS_ACTIVE = false
```

Inside `CourseDetailClient`, after existing derived values, add tab count derivations. These depend on what data is available for this course; use existing arrays already in the component:

```ts
// Tab count badges — Aarti May 19: "counter tells me everything I need to know about the course"
const studentsCount = facultyStudents.filter(s => s.enrolledCourseIds.includes(courseId)).length
const facultyCount  = facultyListRows.filter(f => f.courses?.some(c => c.id === courseId)).length
const assessmentsCount = ALL_ASSESSMENTS.filter(a => a.courseId === courseId).length
```

Adjust the data sources to match what's actually available in the component's existing `useMemo` hooks. If `facultyStudents` is not imported, check existing imports and use the equivalent already in scope.

- [ ] **Step 2: Add LMS chip to course header**

Find the course header section (the `<div className="border-b border-border ...">` containing the course title and action buttons). After the course name/code display and before or after the action buttons, add:

```tsx
{/* LMS integration chip — Vishaka May 19 */}
{IS_LMS_ACTIVE && (
  <Badge
    variant="secondary"
    className="rounded-full gap-1.5 text-xs shrink-0"
    style={{
      backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
      color: 'var(--brand-color)',
    }}
  >
    <i className="fa-light fa-link" aria-hidden="true" />
    Linked to Canvas
  </Badge>
)}
{!IS_LMS_ACTIVE && (
  <Badge
    variant="secondary"
    className="rounded-full gap-1.5 text-xs shrink-0"
    style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
  >
    <i className="fa-light fa-unlink" aria-hidden="true" />
    No LMS linked
  </Badge>
)}
```

- [ ] **Step 3: Add count badges to tab triggers**

Find the `<TabsList>` that renders the tab triggers. Add count badges to Students, Faculty, and Assessments triggers:

```tsx
<TabsTrigger value="assessments">
  <i className="fa-light fa-clipboard-list" aria-hidden="true" style={{ fontSize: 13 }} />
  Assessments
  {assessmentsCount > 0 && (
    <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
      {assessmentsCount}
    </Badge>
  )}
</TabsTrigger>
<TabsTrigger value="students">
  <i className="fa-light fa-user-graduate" aria-hidden="true" style={{ fontSize: 13 }} />
  Students
  {studentsCount > 0 && (
    <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
      {studentsCount}
    </Badge>
  )}
</TabsTrigger>
<TabsTrigger value="faculty">
  <i className="fa-light fa-chalkboard-user" aria-hidden="true" style={{ fontSize: 13 }} />
  Faculty
  {facultyCount > 0 && (
    <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
      {facultyCount}
    </Badge>
  )}
</TabsTrigger>
```

Match the existing tab trigger markup pattern exactly — just insert the Badge after the label text.

- [ ] **Step 4: Verify**

Open a course detail page. Confirm LMS chip in header, count badges on Assessments/Students/Faculty tabs. Toggle `IS_LMS_ACTIVE = true` to see the green Canvas chip.

- [ ] **Step 5: Commit**

```bash
git add apps/exam-management/admin/app/\(app\)/courses/\[id\]/course-detail-client.tsx
git commit -m "feat(base-entities): course detail — LMS chip + tab count badges (Vishaka + Aarti May 19)"
```

---

## Task 7 — Course detail: QB tab + overview QB stats block

**Files:**
- Create: `app/(app)/courses/[id]/tabs/question-bank-tab.tsx`
- Modify: `app/(app)/courses/[id]/tabs/overview-tab.tsx`
- Modify: `app/(app)/courses/[id]/course-detail-client.tsx`

Aarti May 19: "Question bank is more relevant for this page than showing objectives... question bank is the perfect landing spot... Phase 1 we will only have the question bank stats."

- [ ] **Step 1: Create question-bank-tab.tsx**

Create `app/(app)/courses/[id]/tabs/question-bank-tab.tsx`:

```tsx
'use client'

/**
 * QUESTION BANK TAB — course-scoped QB reference.
 *
 * Phase 1: Stats block (# questions, # folders, last updated) +
 * quick link to the course's QB folder in the Question Bank nav.
 *
 * Aarti May 19: "Question bank is more relevant for this page than showing
 * objectives... I'm not going to ever have somebody come in and work here
 * in isolation. They'll pretty much always pick their course and go to the
 * question bank for that course."
 *
 * QB editing stays in /question-bank — do not duplicate QB interactions here.
 */

import Link from 'next/link'
import { Button, Badge } from '@exxat/ds/packages/ui/src'
import { mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'

interface QuestionBankTabProps {
  courseId: string
}

export function QuestionBankTab({ courseId }: QuestionBankTabProps) {
  const course = mockCourses.find(c => c.id === courseId)

  // Derive stats from mock QB data
  const courseQuestions = course
    ? MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(course.questionBankFolderId))
    : []
  const draftCount    = courseQuestions.filter(q => q.status === 'Draft').length
  const savedCount    = courseQuestions.filter(q => q.status === 'Saved').length
  const archivedCount = courseQuestions.filter(q => q.status === 'Archived').length

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <i className="fa-light fa-books text-muted-foreground text-3xl" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No question bank linked to this course.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pt-2">

      {/* Stats strip — QB overview at a glance */}
      <section aria-labelledby="qb-stats-heading" className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <i className="fa-light fa-books text-muted-foreground" aria-hidden="true" style={{ fontSize: 16 }} />
            <h2 id="qb-stats-heading" className="text-sm font-semibold text-foreground">
              {course.name} — Question Bank
            </h2>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
            <Link href="/question-bank">
              <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
              Open Question Bank
            </Link>
          </Button>
        </div>

        {/* Stat tiles — QB pattern: neutral bg, no color for counts */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total questions', value: courseQuestions.length, icon: 'fa-list-check' },
            { label: 'Saved',           value: savedCount,             icon: 'fa-circle-check' },
            { label: 'Drafts',          value: draftCount,             icon: 'fa-file-pen' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-3"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <i
                  className={`fa-light ${stat.icon}`}
                  aria-hidden="true"
                  style={{ fontSize: 13, color: 'var(--muted-foreground)' }}
                />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {archivedCount > 0 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            {archivedCount} archived question{archivedCount !== 1 ? 's' : ''} — visible in the full Question Bank.
          </p>
        )}
      </section>

      {/* Folder list — top-level folders in this course's QB */}
      <section aria-labelledby="qb-folders-heading" className="rounded-xl border border-border bg-card p-5">
        <h2 id="qb-folders-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">
          Folders
        </h2>

        {courseQuestions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-folder-open text-muted-foreground text-lg" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              No questions yet. Open the Question Bank to add questions to this course.
            </p>
            <Button size="sm" className="gap-1.5 mt-1" asChild>
              <Link href="/question-bank">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Go to Question Bank
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Group by unique folder paths — simple top-level grouping */}
            {(() => {
              const folderGroups = courseQuestions.reduce<Record<string, number>>((acc, q) => {
                const folder = q.folderPath.split(' / ').pop() ?? q.folderPath
                acc[folder] = (acc[folder] ?? 0) + 1
                return acc
              }, {})
              return (
                <div className="flex flex-col gap-1">
                  {Object.entries(folderGroups).map(([folder, count]) => (
                    <div
                      key={folder}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors group"
                    >
                      <i
                        className="fa-light fa-folder text-muted-foreground shrink-0"
                        aria-hidden="true"
                        style={{ fontSize: 14 }}
                      />
                      <span className="flex-1 text-sm text-foreground truncate">{folder}</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] tabular-nums"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            })()}

            <div className="mt-3 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" asChild>
                <Link href="/question-bank">
                  <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
                  Manage in Question Bank
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Add QB stats block to overview-tab.tsx**

In `overview-tab.tsx`, find the file's imports and add:

```ts
import Link from 'next/link'
import { mockCourses, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
```

In `OverviewTab`, derive QB stats before the return:

```ts
// QB stats for Phase 1 overview block — Aarti May 19
const courseData = mockCourses.find(c => c.id === course.id)
const qbQuestions = courseData
  ? MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(courseData.questionBankFolderId))
  : []
```

In the JSX, replace the untested-objectives callout section (or add before the Curricular Loop card) with a QB stats card. Place it at the top, before `{untested.length > 0 && ...}`:

```tsx
{/* QB Stats block — Phase 1 overview content (Aarti May 19)
    Learning objectives in overview = Phase 2 only. */}
<section aria-labelledby="qb-overview-heading" className="rounded-xl border border-border bg-card p-5">
  <div className="flex items-center justify-between gap-3 mb-3">
    <div className="flex items-center gap-2">
      <i className="fa-light fa-books text-muted-foreground" aria-hidden="true" style={{ fontSize: 14 }} />
      <h2 id="qb-overview-heading" className="text-sm font-semibold text-foreground">
        Question Bank
      </h2>
    </div>
    <Button variant="outline" size="sm" className="gap-1.5 shrink-0 text-xs" asChild>
      <Link href="/question-bank">
        <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 10 }} />
        Open QB
      </Link>
    </Button>
  </div>
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-foreground tabular-nums">{qbQuestions.length}</span>
      <span className="text-xs text-muted-foreground leading-tight">total<br/>questions</span>
    </div>
    <div className="w-px h-8 bg-border shrink-0" aria-hidden="true" />
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-foreground tabular-nums">
        {qbQuestions.filter(q => q.status === 'Saved').length}
      </span>
      <span className="text-xs text-muted-foreground leading-tight">saved<br/>& ready</span>
    </div>
    <div className="w-px h-8 bg-border shrink-0" aria-hidden="true" />
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-foreground tabular-nums">
        {qbQuestions.filter(q => q.status === 'Draft').length}
      </span>
      <span className="text-xs text-muted-foreground leading-tight">in<br/>draft</span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Wire up in course-detail-client.tsx**

In `course-detail-client.tsx`:

1. Add import at top:
```ts
import { QuestionBankTab } from './tabs/question-bank-tab'
```

2. Find the TabsTrigger for "Questions" (or "questions"). Rename it:
```tsx
<TabsTrigger value="question-bank">
  <i className="fa-light fa-books" aria-hidden="true" style={{ fontSize: 13 }} />
  Question Bank
</TabsTrigger>
```

3. Find the TabsContent for "questions". Replace with:
```tsx
<TabsContent value="question-bank" className="mt-0 outline-none">
  <QuestionBankTab courseId={courseId} />
</TabsContent>
```

4. Remove the old `import { QuestionsTab } from './tabs/questions-tab'` line (the file still exists but is no longer used in this tab — do not delete the file as it may be referenced elsewhere).

5. Update `useState('assessments')` — confirm it stays as `'assessments'` (landing tab unchanged).

- [ ] **Step 4: Verify**

Open a course detail page. Confirm:
- "Question Bank" tab (not "Questions") appears in the tab list.
- QB tab shows stats block + folder list + "Open Question Bank" button linking to `/question-bank`.
- Overview tab has QB stats card at the top with question count.
- Landing tab is still Assessments.

- [ ] **Step 5: Commit**

```bash
git add \
  apps/exam-management/admin/app/\(app\)/courses/\[id\]/tabs/question-bank-tab.tsx \
  apps/exam-management/admin/app/\(app\)/courses/\[id\]/tabs/overview-tab.tsx \
  apps/exam-management/admin/app/\(app\)/courses/\[id\]/course-detail-client.tsx
git commit -m "feat(base-entities): course detail — QB tab replaces Questions, overview QB stats (Aarti May 19–20)"
```

---

## Self-review

**Spec coverage check:**

| P1 item | Task |
|---|---|
| Left nav: QB first, Courses second | T1 ✅ |
| Student list: current-term filter | T2 ✅ |
| Student list: LMS gate | T2 ✅ |
| Student detail: competency bars → strip plot | T3 ✅ |
| Student detail: red → amber for low scores | T3 ✅ |
| Student detail: academic standing admin-only | T3 ✅ |
| Faculty list: recently viewed sidebar | T4 ✅ |
| Faculty list: LMS gate | T4 ✅ |
| Faculty detail: Teaching coordinator/contributor split | T5 ✅ |
| Faculty detail: QB folders section | T5 ✅ |
| Faculty detail: Pending reviews section | T5 ✅ |
| Course detail: LMS chip on header | T6 ✅ |
| Course detail: tab count badges | T6 ✅ |
| Course detail: QB tab (replaces Questions) | T7 ✅ |
| Course detail overview: QB stats (Phase 1) | T7 ✅ |

**QB table pattern applied:** SearchInput (already InputGroup-based) used for all list pages. Filter chip (term chip in T2) uses Popover + border pattern matching QB. No QB files modified.

**P2 items intentionally deferred:** Assessments tab role-gate (coordinators only), Prism link label wording, course registration page, routing /courses/offerings/[id] investigation.
