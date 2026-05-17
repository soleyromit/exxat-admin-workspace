# Exam Management Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start via CLAUDE.md. Updated in the same commit whenever a new pattern is established.
> Last extracted from codebase: 2026-05-17.

---

## 1. Page Shell Anatomy

Exam Management uses a **two-component header** rather than PCE's single inline header. Do not merge them.

```tsx
// Tier 1 — SiteHeader: always first child of the page root.
// Height: h-14 (56px). Contains EntryPathChip + breadcrumb or h1 + PersonaSwitcher.
<SiteHeader title="Students" />

// Tier 2 — PageHeader: content area title with subtitle + actions.
// px-6 py-4. Separated from SiteHeader by border-b.
<PageHeader
  title="Students"
  subtitle="42 students"
  actions={
    <Button variant="default" size="sm">
      <i className="fa-light fa-plus" aria-hidden="true" />
      Add Student
    </Button>
  }
/>

// Content area — always flex flex-1 flex-col with overflow-auto wrapper
<div className="flex flex-1 flex-col gap-0 min-w-0">
  ...
</div>
```

Source: `apps/exam-management/admin/components/site-header.tsx`,
`apps/exam-management/admin/components/page-header.tsx`,
`apps/exam-management/admin/app/(app)/students/students-client.tsx`

**Differences from PCE:**
- PCE: one inline `<header>` with `SidebarTrigger` + `<h1>` + primary action. Height: 56px via `py-4`.
- Exam Management: two-tier header. `SiteHeader` (56px, h-14) carries breadcrumb/title; `PageHeader` (px-6 py-4) carries count subtitle + primary action. The `SidebarTrigger` is NOT in `SiteHeader` — the QB page surface exposes its own sidebar toggle in `QBHeader`.

**What NOT to do:**
- Never collapse `SiteHeader` and `PageHeader` into one element — they have different visual weights and different roles.
- Never put `<h1>` inside `PageHeader` — `PageHeader` uses `<h2>`. `SiteHeader` holds the `<h1>` (via `text-base font-semibold`).
- Never use Tailwind padding classes on `PageHeader` — inline style in the component controls pixel precision.

### Question Bank shell — exception

The QB surface (`/question-bank`) does NOT use `SiteHeader` + `PageHeader`. It has its own `QBHeader` (44px min-height, `qb-header-bar` CSS class) that contains:
- Main DS sidebar toggle (`fa-sidebar` icon)
- QB folder-tree toggle (`fa-folder-tree` icon)
- `QBBreadcrumb` (dynamic: folder path or "Question Bank")
- Persona switcher (`DropdownMenu` with `Avatar`)
- Ask Leo button

Source: `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx`

---

## 2. DataTable Conventions

Source: `apps/exam-management/admin/components/data-table/index.tsx` (vendored from PCE canonical, 2026-05-11)

### Row type pattern

```typescript
// Always extend Record<string, unknown> — required by DataTable generic constraint
// Intersect to keep full type inference in cell renderers
type StudentTableRow = StudentListRow & Record<string, unknown>
```

### ColumnDef pattern

```typescript
const COLUMNS: ColumnDef<StudentTableRow>[] = [
  {
    key: 'select',      // always first — renders checkbox; no cell fn needed
    label: '',
    width: 40,
    defaultPin: 'left',
    lockPin: true,
  },
  {
    key: 'student',     // synthetic key — sortKey must point to a real scalar property
    label: 'Student',
    width: 240,
    sortable: true,
    sortKey: 'fullName',  // real scalar property used for sort
    cell: (row) => (...),
  },
  // Actions column — always last, no label, width 44
  {
    key: 'actions',
    label: '',
    width: 44,
    cell: (row) => <RowActions ... />,
  },
]
```

### DataTable props — students page

```tsx
<DataTable<StudentTableRow>
  data={filtered}           // pre-filtered; searchable=false when external search is used
  columns={COLUMNS}
  getRowId={(row) => row.id as string}
  getRowSelectionLabel={(row) => row.fullName}
  selectable
  searchable={false}        // external InputGroup handles search — do NOT double-search
  onRowClick={(row) => router.push(`/students/${row.id as string}`)}
  emptyState={<div className="flex flex-col items-center justify-center py-16 ...">...</div>}
  toolbarSlot={() => (
    <span className="text-xs text-muted-foreground">
      {filtered.length} student{filtered.length !== 1 ? 's' : ''}
      {query && ` matching "${query}"`}
    </span>
  )}
/>
```

### QB table — custom `<table>`, not vendored DataTable

The Question Bank uses a bespoke `<table>` implemented directly in `qb-table.tsx`. It uses DS table token classes (`TH`, `TD` constants), DS `Checkbox`, DS `DropdownMenu` for column headers, and the `QB_COLS` constant for column definitions. This is intentional — the QB has non-standard interactions (folder-tree context, multi-step bulk actions, per-row trust-level rendering) that the generic DataTable cannot express without heavy override.

**Rule:** Do NOT replace the QB table with the vendored `DataTable`. Extend `QB_COLS` when adding columns.

### DS Table border container rule

```tsx
// ALWAYS add overflow-hidden when wrapping DS Table with a border+radius container
<div className="border border-border rounded-lg overflow-hidden">
  <Table ...>
```

Without `overflow-hidden`, the rounded corners don't clip the DS Table's internal scroll container and borders appear incomplete.

**What NOT to do:**
- Never use raw `<table>` outside the QB — always the vendored `DataTable` from `components/data-table/`
- Never use a third-party grid (ag-Grid, TanStack Table directly)
- Never put non-scalar objects as sortable column keys — sort breaks silently
- Never use `searchable` on `DataTable` when an external `InputGroup` search already filters `data`

---

## 3. Interaction Patterns

### Row click

```typescript
// Exam Management uses router.push (Next.js App Router) — not window.location.href
onRowClick={(row) => router.push(`/students/${row.id as string}`)}
```

Difference from PCE: PCE uses `window.location.href` to avoid a hydration mismatch. Exam Management uses `router.push` from `next/navigation`. Both are valid — do not swap them between products without testing.

### Link cells inside a row-clickable table

```tsx
// Always stopPropagation — otherwise link click also fires row click
<Link
  href={`/courses/${row.id}`}
  className="font-medium hover:underline text-sm"
  onClick={(e) => e.stopPropagation()}
>
  {row.courseCode}
</Link>
```

### Row actions dropdown

```tsx
// modal={false} is REQUIRED — prevents Radix hideOthers from setting
// aria-hidden on the sidebar, causing axe aria-hidden-focus violation (2026-05-11)
<DropdownMenu modal={false}>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Question actions"
      onClick={(e) => e.stopPropagation()}
    >
      <i className="fa-regular fa-ellipsis" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    align="end"
    className="w-44"
    onClick={(e) => e.stopPropagation()}
  >
    ...
  </DropdownMenuContent>
</DropdownMenu>
```

### QB folder tree — hover-only context menu

The folder ⋯ button uses `opacity`/`pointerEvents` toggled via CSS class `qb-folder-menu-btn`:

```css
/* globals.css */
.qb-folder-menu-btn { opacity: 0; transition: opacity 100ms; }
[role="treeitem"]:hover .qb-folder-menu-btn,
[role="treeitem"][aria-selected="true"] .qb-folder-menu-btn,
[role="treeitem"]:focus-within .qb-folder-menu-btn { opacity: 1; }
```

The button is `position: absolute` inside a `position: relative` row — it takes no layout space. `menuOpen` state (from `DropdownMenu onOpenChange`) keeps it visible while the dropdown is open.

Source: `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx`

### QB breadcrumb — 4-rule collapse

```
0 segments → "Question Bank" (plain span)
1 segment  → "Question Bank > Root"
2 segments → "Question Bank > Parent > Leaf"
3+ segments → "Question Bank > … > Parent > Leaf"  (… is a DropdownMenu with collapsed nodes)
```

Source: `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx:QBBreadcrumb`

### Toolbar icon buttons

```tsx
// Active state override — use style prop, not a different variant
<Button
  variant="outline"
  size="icon-sm"
  aria-label="..."
  style={isActive
    ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' }
    : {}}
>
  <i className="fa-light fa-..." aria-hidden="true" style={{ fontSize: 13 }} />
</Button>
```

Never use `color-mix(in oklch, ... white)` — always use `var(--background)`.

### Sheet / filter sheet

```tsx
// Filter properties sheet — floating, no overlay, no close button
<Sheet showOverlay={false} showCloseButton={false} style={{ height: 'calc(100vh - 1rem)' }}>
```

Source: `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:FilterPropertiesSheet`

### QB action toast — exception to the "no toast" rule

The QB uses `toast()` (Sonner) for **undo-able destructive actions** (move, delete, archive) with a 5s progress bar and Undo button. This is the ONE place toast is permitted. It uses QB-specific dark tokens (`--qb-toast-bg`, `--qb-toast-fg`, etc.) defined in `globals.css`. The class `qb-action-toast` applies the progress bar animation.

All other product feedback (save success, form errors) must use banners, not toast.

---

## 4. Empty State Formula

Two patterns are used. Use the appropriate one per context.

### Pattern A — DataTable `emptyState` prop (list pages)

```tsx
// Used in: students page
<DataTable
  emptyState={
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <i className="fa-light fa-user-group text-muted-foreground text-xl" aria-hidden="true" />
      </div>
      <p className="font-semibold text-foreground">No students match your search</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Try a different name, ID, cohort, or adviser.
      </p>
    </div>
  }
/>
```

### Pattern B — `EmptyState` component (panels, filter sub-panels, modals)

```tsx
// Used in: qb-table filter sub-panels, add-accommodation-modal, live-monitor
import { EmptyState } from '@/components/empty-state'

// Icon + title + description
<EmptyState
  icon="fa-filter"
  title="No filters applied"
  description="Add a filter to narrow the question list."
/>

// Icon + title + numbered steps
<EmptyState
  icon="fa-question"
  title="No questions yet"
  steps={[
    'Create a folder in the library',
    'Add questions using the + button',
    'Assign to an assessment',
  ]}
/>

// Icon + title + footer CTA
<EmptyState
  icon="fa-lock"
  title="Access restricted"
  footer={<Button variant="outline" size="sm">Request access</Button>}
/>
```

Source: `apps/exam-management/admin/components/empty-state.tsx`
Composition: DS `Card size="sm"` + `CardHeader` (icon square + `CardTitle` + `CardDescription`) + optional `CardContent` (steps) + optional `CardFooter`.

**What NOT to do:**
- Never inline `rounded-xl border border-border bg-muted/40 p-4` as an ad-hoc empty panel — use `EmptyState`
- Never use opacity or grey-out for "zero data" states — show an explicit empty state

---

## 5. DS Component Map (Exam Management–specific)

| Use case | Component | Import |
|---|---|---|
| Question status badge (Saved / Draft / In Review / Archived) | `StatusBadge` | `@/components/qb/badges` |
| Question type icon + label | `TypeBadge` | `@/components/qb/badges` |
| Difficulty display | `DiffBadge` | `@/components/qb/badges` |
| Bloom's taxonomy display | `BloomsBadge` | `@/components/qb/badges` |
| Point-biserial cell | `PBisCell` | `@/components/qb/badges` |
| Academic standing (Good / Needs Attention / At Risk) | `StandingBadge` | inline in `student-detail-client.tsx` — not yet promoted to `badges.tsx` |
| Student avatar | `Avatar` + `AvatarFallback` | `@exxat/ds/packages/ui/src` |
| Tag chips in student list | DS `Badge variant="secondary" className="rounded"` + `Tooltip` | `@exxat/ds/packages/ui/src` |
| Course term filter | DS `Select` | `@exxat/ds/packages/ui/src` |
| Cards / list view toggle | DS `ViewSegmentedControl` | `@exxat/ds/packages/ui/src` |
| QB folder tree search | DS `InputGroup` + `InputGroupAddon` + `InputGroupInput` | `@exxat/ds/packages/ui/src` |
| Add folder inline | DS `Input` with `border:none` override | `@exxat/ds/packages/ui/src` |
| KPI strip | `KeyMetrics` | `@/components/key-metrics` (vendored) |
| Zero-data panels | `EmptyState` | `@/components/empty-state` |
| Ask Leo | `Button variant="outline" size="sm"` + `fa-duotone fa-solid fa-star-christmas` | — |

**Badge shape rules:**
- Status badges (`StatusBadge`): `rounded-full px-3 py-1` — full pill with icon + colored border
- Metadata badges (tags, codes, IDs): `rounded` — 4px rectangle
- Never use `white` in `color-mix()` — use `var(--background)`

**Avatar token rule for students:**
```tsx
<AvatarFallback
  className="text-[11px] font-bold"
  style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
>
  {initials}
</AvatarFallback>
```

**Avatar token rule for QB personas (smaller, neutral):**
```tsx
<AvatarFallback
  className="text-[10px] font-bold"
  style={{
    backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))',
    color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))',
  }}
>
  {initials}
</AvatarFallback>
```

---

## 6. Token Conventions

### Standard workspace tokens (same as PCE)
```
--background / --foreground          page surfaces and text
--card / --card-foreground           card surfaces
--muted / --muted-foreground         de-emphasized surfaces and secondary text
--border                             decorative borders
--border-control-3 / --border-control-35  form field borders (3:1 / 3.5:1 contrast)
--brand-color / --brand-color-dark   interactive accent / hover
--brand-tint                         sidebar + brand-washed surfaces
--primary / --primary-foreground     CTA buttons
--destructive                        error / delete
--ring                               focus ring
--radius, --radius-sm, --radius-md, --radius-lg  border radii
--control-height / --control-height-sm   40px / 32px standard heights
--font-heading                       h1 and display text
--sidebar / --sidebar-accent         sidebar bg / active item bg
```

### DataTable tokens (defined in `app/globals.css`)
```
--dt-header-bg        = var(--background)
--dt-row-bg           = var(--background)
--dt-row-hover        = oklch(0.972 0.001 270)
--dt-row-selected     = oklch(0.962 0.003 260)
--dt-row-selected-fg  = var(--foreground)
--dt-group-bg         = oklch(0.972 0.001 270)
--sticky-edge-fade    = oklch(0 0 0 / 0.08)
```

### QB-specific tokens (defined in `app/globals.css`)
```
--qb-private               = var(--brand-preview-prism)   /* fuchsia — private folders */
--qb-question-set          = var(--chart-2)                /* teal — question sets */
--qb-locked                = oklch(0.45 0.12 70)           /* amber — locked/bookmarked */
--qb-trust-senior-color    = oklch(0.40 0.14 145)          /* green — senior trust */
--qb-trust-mid-color       = oklch(0.35 0.10 220)          /* blue — mid trust */
--qb-status-saved-bg/fg/border                             /* green surface/text/border */
--qb-status-draft-bg/fg/border                             /* amber surface/text/border */
--qb-status-archived-bg/fg                                 /* neutral grey */
--qb-status-review-bg/fg                                   /* blue-tinted */
--qb-diff-easy/medium/hard-color                           /* neutral shades, not hue-based */
--qb-blooms-bar                                            /* brand-color tinted bar */
--qb-folder-selected-bg    = var(--sidebar-accent)         /* active folder bg */
--qb-bulk-bar-shadow                                       /* floating bar shadow */
--qb-delete-impact-bg/border                               /* destructive-tinted warning */
--qb-toast-bg/fg/border/muted/link/progress                /* dark toast tokens */
```

### Student entity tokens
```
--standing-warning-bg   = oklch(0.97 0.05 85)    /* amber surface — needs attention */
--standing-warning-fg   = oklch(0.45 0.15 60)    /* dark amber text */
```

### Assessment Builder tokens
```
--ab-selector-bar-bg    = color-mix(in oklch, var(--brand-tint) 40%, var(--background))
--ab-panel-bg           = color-mix(in oklch, var(--brand-tint) 25%, var(--background))
--ab-smart-view-bar-bg  = color-mix(in oklch, var(--brand-tint) 20%, var(--background))
--ab-picker-selected-bg = color-mix(in oklch, var(--brand-tint) 35%, var(--background))
--ab-active-border      = color-mix(in oklch, var(--brand-color) 20%, transparent)
```

**Never use hex, rgb, or raw oklch values in component files. Define new tokens in `app/globals.css` and reference with `var(--token)`.**

---

## 7. Guardrails

| Banned | Use instead |
|---|---|
| `toast()` / Sonner outside QB undo actions | `LocalBanner variant="success"` after save |
| QB `toast()` without `qb-action-toast` class | Always include class + `QB_TOAST_DURATION` + Undo button |
| `opacity-60` on parent containing `text-muted-foreground` | DS `disabled` prop on the component itself |
| Raw `<button>` | DS `Button` with explicit `variant` and `size` |
| Raw `<table>` outside QB | Vendored `DataTable` from `components/data-table/` |
| Third-party grid (ag-Grid, etc.) | Vendored `DataTable` |
| New `DataTable` replacement for QB | Extend `QB_COLS` in `qb-table.tsx` |
| `color-mix(in oklch, ... white)` | `color-mix(in oklch, ... var(--background))` |
| Hex / rgb / oklch literals in `.tsx` files | `var(--token)` — define token in `globals.css` first |
| `className="rounded-full"` on non-status Badge | Status badges use `rounded-full`; metadata badges use `rounded` |
| Inline empty panel with raw `rounded-xl border border-border` | `EmptyState` component |
| `<Input type="date">` | DS `DatePickerField` |
| Non-Font-Awesome icons (Lucide, Heroicons) | Font Awesome Pro only |
| `fa-sparkles` or `fa-plus` for Leo AI button | `fa-duotone fa-solid fa-star-christmas` |
| Second sidebar component | Main nav: `AppSidebar`. QB tree: `qb-sidebar.tsx`. Never a third. |
| `DropdownMenu` without `modal={false}` | Always `modal={false}` — prevents `aria-hidden-focus` violation |
| `window.location.href` | `router.push` from `next/navigation` |

---

## 8. Accessibility — WCAG 2.1 AA (Full Checklist)

**Format:** Rule → SC → Consequence if violated → How I verify

| Check | SC | Consequence | Verification method |
|---|---|---|---|
| All FA icons `aria-hidden="true"` | 4.1.2 | Screen reader announces class names as content | Grep: `fa-` without `aria-hidden` in same element |
| All icon-only buttons have `aria-label` | 4.1.2 | Button announced as "button" with no name — unusable | Grep: `size="icon"` or `size="icon-sm"` without `aria-label` |
| `DropdownMenu modal={false}` | 4.1.2 | `aria-hidden` set on sidebar — axe `aria-hidden-focus` violation | axe-core via visual-check |
| Folder tree uses `role="treeitem"` | 1.3.1 | Screen reader cannot understand tree structure | Code review: grep for `role="treeitem"` in qb-sidebar |
| Focus ring on treeitem keyboard nav | 2.4.7 | Keyboard users lose position in folder tree | `globals.css` `[role="treeitem"]:focus-visible` rule present |
| Focus visible at 200%+ zoom | 2.4.7 | Keyboard users lose position | Playwright zoom test |
| 400% zoom / reflow (320px viewport) — no horizontal scroll | 1.4.10 | Fails VPAT — blocks enterprise procurement | QB responsive CSS + Playwright 320px test |
| Text spacing override — no content loss | 1.4.12 | Content clipped for dyslexic users with OS spacing | Playwright text-spacing injection |
| Contrast 4.5:1 normal text / 3:1 large + UI | 1.4.3, 1.4.11 | ADA Title III exposure; `--muted-foreground` on data cells borderline | axe-core |
| Touch targets 44×44px | 2.5.5 | WCAG fail on mobile; QB header is `minHeight: 44` | Visual check at 375px viewport |
| Dynamic status changes have `aria-live` | 4.1.3 | QB bulk action bar: `role="status" aria-live="polite"` required | Grep: QB bulk bar has `role="status"` |
| Semantic table structure | 1.3.1 | Screen reader cannot navigate by column | axe-core |
| Form validation: `aria-invalid` + `FieldError` | 1.3.1, 3.3.1 | Errors not announced on submit | Code review per form |
| Checkboxes in table header/cells suppress `::after` touch extension | 2.5.5 | Inflated cell height in compact QB table | `globals.css` `td [data-slot="checkbox"]::after { display: none }` present |
| QB row checkboxes always visible at 200%+ zoom | 2.5.5 | Hover-only is inaccessible when you cannot hover multiple rows | `globals.css` `.qb-row-checkbox { opacity: 1 !important }` at `≤960px` |

---

## 9. FERPA Compliance

Exxat client institutions are subject to FERPA (20 U.S.C. § 1232g). UI violations expose Exxat to contract loss.

| Rule | Consequence | Enforcement |
|---|---|---|
| No student identifier + response text in same component render | Federal audit failure, client contract termination | FERPA assertion in `scripts/ds-adoption-audit.py` at pre-commit |
| Faculty sees only their assigned courses | Unauthorized access to educational records | Server-side role filter — UI hide/show is NOT sufficient |
| Results suppressed below N=5 responses | Individual students identifiable below threshold | Data layer enforcement — UI warning is secondary |
| Student accommodations visible to admin/coordinator only | Role boundary violation | `Accommodations` tab conditionally rendered per role (Vishaka 2026-05-14) |
| Exports contain no student names linked to answers | Exportable FERPA breach | Export API strips identifiers — never trust UI-only guard |
| Admin audit trail never exposed to faculty | Role boundary violation | Separate API endpoints per role |
| "View full profile in Prism" link opens in new tab | Cross-system deep-link context separation | `target="_blank" rel="noopener"` on the Prism link |

---

## 10. HIPAA Considerations

Exam content may reference clinical scenarios or patient cases. Exam Management is less directly clinical than PCE (no rotation logs, no clinical placement data), but violations still carry risk: $100–$50,000 per incident.

| Rule | Consequence | Enforcement |
|---|---|---|
| Question text containing patient case details never displayed in public-facing views | PHI exposure | Admin-only access to raw question content in unreviewed state |
| Question Bank private folders contain PHI-adjacent draft questions | Unauthorized access | Private space access requires `isPrivateSpace` ACL check — not UI-only |
| Student free-text exam responses never shown to peers | Unauthorized PHI exposure | Results/analytics views show aggregate data only; individual responses behind role gate |
| Assessment deletion UI warns about academic record retention before allowing removal | Retention violation | Warning component required before any assessment data deletion action |
| Accommodation records (extended time, separate room) are PHI-adjacent | Unauthorized disclosure | `StudentAccommodationProvider` is role-gated; accommodation tab conditionally rendered |

---

## 11. Claude Correction Log Reference

When Romit identifies a mistake in this product, the correction is logged to:
- `docs/watch/updates-log.json` (type: `claude-correction`)
- `docs/governance/verification-discipline.md`
- Claude's memory system (feedback type)

View all Exam Management corrections: `__updates('exam-management', 'corrections')` in browser DevTools console.
