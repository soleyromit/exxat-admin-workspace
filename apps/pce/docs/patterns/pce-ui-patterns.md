# PCE Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start via CLAUDE.md. Updated in the same commit whenever a new pattern is established.
> Last extracted from codebase: 2026-05-17.

---

## 1. Page Shell Anatomy

Every PCE list page uses this exact structure. Do not deviate.

```tsx
// Header — always first child of the page root
<header
  className="flex items-center gap-2 border-b border-border shrink-0"
  style={{ padding: '18px 28px 14px' }}
>
  <SidebarTrigger className="-ms-1" />
  <Separator orientation="vertical" className="h-4" />
  <h1
    className="flex-1 text-[22px] font-normal"
    style={{ fontFamily: 'var(--font-heading)' }}
  >
    Page Title
  </h1>
  <Button variant="default" size="sm" onClick={...}>
    <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
    Primary Action
  </Button>
</header>

// Content area — always flex-1 overflow-auto
<div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
  ...
</div>
```

Source: `apps/pce/admin/app/(app)/surveys/page.tsx`, `templates/page.tsx`, `moderation/page.tsx`

**What NOT to do:**
- Never use `p-6` or Tailwind padding classes on the header — inline style only (pixel-precise per design spec)
- Never put a secondary CTA before the primary CTA — primary always at far right
- Never use `<h2>` or `<h3>` as the page title — always `<h1>`

---

## 2. DataTable Conventions

Source: `apps/pce/admin/components/data-table/index.tsx`

### Row type pattern
```typescript
// Always extend Record<string, unknown> — required by DataTable generic constraint
// Sortable fields MUST be real scalar properties (DataTable sorts by TData key directly)
interface SurveyRow extends Record<string, unknown> {
  id: string          // used by getRowId
  survey: PceSurvey   // source object for renderers
  courseCode: string  // sortable scalar
  status: SurveyStatus // sortable scalar
  responseRate: number // sortable scalar
}
```

### ColumnDef pattern
```typescript
const columns: ColumnDef<SurveyRow>[] = [
  {
    key: 'courseCode',     // must match a real property on the row type
    label: 'Course',       // column header text
    sortable: true,        // omit = not sortable
    width: 200,            // always provide — prevents layout shift
    cell: (row) => (...),  // render function
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

### DataTable props
```tsx
<DataTable<SurveyRow>
  data={rows}
  columns={columns}
  getRowId={(row) => row.id}   // always provide
  selectable                    // always on for list pages
  searchable                    // always on for list pages
  defaultGroupBy="status"       // when status grouping applies
  groupLabels={GROUP_LABELS}
  groupOrder={GROUP_ORDER}
  onRowClick={(row) => { window.location.href = `/surveys/${row.survey.id}` }}
/>
```

### Status grouping — Aarti's rule
```typescript
// Active buckets first, closed at the bottom — non-negotiable
const GROUP_ORDER: SurveyStatus[] = ['pending_review', 'collecting', 'active', 'draft', 'released', 'closed']
const GROUP_LABELS: Record<SurveyStatus, string> = {
  pending_review: 'Needs Action',
  collecting:     'Collecting',
  active:         'Active',
  draft:          'Draft',
  released:       'Shared with Faculty',
  closed:         'Closed',
}
```

**What NOT to do:**
- Never use raw `<table>` — always the vendored `DataTable` from `components/data-table/`
- Never use a third-party grid (ag-Grid, TanStack Table directly) — DS DataTable wraps TanStack
- Never put non-scalar objects as sortable columns — the sort breaks silently

---

## 3. Interaction Patterns

### Row click
```typescript
// Use window.location.href — not router.push
// router.push causes hydration mismatch in the current Next.js setup
onRowClick={(row) => { window.location.href = `/surveys/${row.survey.id}` }}
```

### Link cells inside a row-clickable table
```tsx
// Always stopPropagation — otherwise link click also fires the row click
<Link
  href={`/surveys/${row.survey.id}`}
  className="font-medium hover:underline text-sm"
  onClick={(e) => e.stopPropagation()}
>
  {row.survey.courseCode}
</Link>
```

### Row actions dropdown
```tsx
// modal={false} is REQUIRED — prevents Radix hideOthers from setting
// aria-hidden on the sidebar wrapper while the dropdown is open.
// Without this: axe reports aria-hidden-focus violation (confirmed 2026-05-11)
<DropdownMenu modal={false} onOpenChange={setMenuOpen} open={menuOpen}>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Survey actions"   // REQUIRED — icon-only button
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

### Drawer / Sheet trigger
- Always a DS `Button` — never a raw `<div onClick>` or `<span onClick>`
- Sheet opens from the right (`side="right"`) unless specified otherwise

---

## 4. Empty State Formula

```tsx
function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {/* Icon: fa-light variant, 40px, muted-foreground color */}
      <i
        className="fa-light fa-[relevant-icon] text-muted-foreground"
        aria-hidden="true"
        style={{ fontSize: 40 }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {hasFilters ? 'No X match these filters' : 'No X yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : 'Descriptive one-liner about what to do.'}
        </p>
      </div>
      {!hasFilters && (
        <Button variant="default" size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create X
        </Button>
      )}
    </div>
  )
}
```

Source: `apps/pce/admin/app/(app)/surveys/page.tsx:EmptySurveys`, `templates/page.tsx:EmptyState`

---

## 5. DS Component Map (PCE-specific)

| Use case | Component | Import |
|---|---|---|
| Survey / template status badge | `SurveyStatusBadge` | `@/components/pce/pce-badges` |
| Response rate display | `ResponseGauge` | `@/components/pce/response-gauge` (hand-roll — documented) |
| Template section chips | `TemplateSectionChips` | `@/components/pce/pce-badges` |
| Date inputs (deadlines, term dates) | `DatePickerField` | `@exxat/ds/packages/ui/src` |
| Instructor avatar | `Avatar` + `AvatarFallback` | `@exxat/ds/packages/ui/src` |
| KPI / analytics row | `KeyMetrics` | `@/components/key-metrics` (vendored) |
| Modals / confirmations | `Dialog` | `@exxat/ds/packages/ui/src` |
| Slide-over forms | `Sheet` | `@exxat/ds/packages/ui/src` |

**Avatar token rule:**
```tsx
<AvatarFallback
  className="text-xs"
  style={{
    backgroundColor: 'var(--avatar-initials-bg)',
    color: 'var(--avatar-initials-fg)',
  }}
>
  {initials}
</AvatarFallback>
```

---

## 6. Token Conventions (PCE actively uses)

```
--background / --foreground          page surfaces and text
--card / --card-foreground           card surfaces
--muted / --muted-foreground         de-emphasized surfaces and secondary text
--border                             decorative borders
--border-control-3 / --border-control-35  form field borders
--brand-color / --brand-color-dark   interactive accent / hover
--primary / --primary-foreground     CTA buttons
--destructive                        error / delete
--ring                               focus ring
--radius, --radius-sm, --radius-md   border radii
--control-height / --control-height-sm  40px / 32px standard heights
--font-heading                       h1 and display text
--avatar-initials-bg / --avatar-initials-fg  avatar fallback colors
```

Never use hex, rgb, or oklch values in component files. Use `var(--token)` only.

---

## 7. Guardrails

| Banned | Use instead |
|---|---|
| `toast()` / Sonner | `LocalBanner variant="success"` after save |
| `opacity-60` on parent containing `text-muted-foreground` | DS `disabled` prop on the component itself |
| `<button>` | DS `Button` with explicit `variant` and `size` |
| Raw `<table>` | Vendored `DataTable` |
| `<Input type="date">` | DS `DatePickerField` |
| Hex / rgb / oklch in component files | `var(--token)` |
| `window.location.href` outside `onRowClick` | `router.push` or DS `Link` |
| `className="rounded"` on Badge for pill shape | Badge already pills by default; `className="rounded"` makes it rectangular |

---

## 8. Accessibility — WCAG 2.1 AA (Full Checklist)

**Format:** Rule → SC → Consequence if violated → How I verify

| Check | SC | Consequence | Verification method |
|---|---|---|---|
| All FA icons `aria-hidden="true"` | 4.1.2 | Screen reader announces class names as content | Grep: `fa-` without `aria-hidden` in same element |
| All icon-only buttons have `aria-label` | 4.1.2 | Button announced as "button" with no name — unusable | Grep: `size="icon"` or `size="icon-sm"` without `aria-label` |
| `DropdownMenu modal={false}` | 4.1.2 | `aria-hidden` set on sidebar — axe `aria-hidden-focus` violation | axe-core via visual-check |
| Focus visible at 200%+ zoom | 2.4.7 | Keyboard users lose position | Playwright zoom test |
| 400% zoom / reflow (320px viewport) — no horizontal scroll | 1.4.10 | Fails VPAT — blocks enterprise procurement | Playwright 320px viewport test |
| Text spacing override — no content loss | 1.4.12 | Content clipped for dyslexic users with OS spacing | Playwright text-spacing injection |
| Contrast 4.5:1 normal text / 3:1 large + UI | 1.4.3, 1.4.11 | ADA Title III exposure; `--muted-foreground` on data cells borderline | axe-core |
| Touch targets 44×44px | 2.5.5 | WCAG fail on mobile; `icon-sm` buttons at risk | Visual check at 375px viewport |
| Dynamic status changes have `aria-live` | 4.1.3 | Survey submission, status changes silent to screen reader | Grep: state transitions without `aria-live` |
| Semantic table structure | 1.3.1 | Screen reader cannot navigate by column | axe-core |
| Form validation: `aria-invalid` + `FieldError` | 1.3.1, 3.3.1 | Errors not announced on submit | Code review per form |

---

## 9. FERPA Compliance

Exxat client institutions are subject to FERPA (20 U.S.C. § 1232g). UI violations expose Exxat to contract loss.

| Rule | Consequence | Enforcement |
|---|---|---|
| No student identifier + response text in same component render | Federal audit failure, client contract termination | FERPA assertion in `scripts/ds-adoption-audit.py` at pre-commit |
| Faculty sees only their assigned courses | Unauthorized access to educational records | Server-side role filter — UI hide/show is NOT sufficient |
| Results suppressed below N=5 responses | Individual students identifiable below threshold | Data layer enforcement — UI warning is secondary |
| Exports contain no student names linked to answers | Exportable FERPA breach | Export API strips identifiers — never trust UI-only guard |
| Admin audit trail never exposed to faculty | Role boundary violation | Separate API endpoints per role |

---

## 10. HIPAA Considerations

Clinical rotation course surveys may contain PHI-adjacent content. Violations: $100–$50,000 per incident.

| Rule | Consequence | Enforcement |
|---|---|---|
| Free-text clinical responses never displayed outside moderation screen | PHI exposure | Route guard: only admin moderation page renders raw response text |
| Clinical survey templates cannot include patient name/DOB/MRN fields | Unauthorized PHI collection | Question type allowlist at template creation |
| Deletion UI warns about 7-year retention before allowing removal | HIPAA retention violation | Warning component required before any survey data deletion action |

---

## 11. Claude Correction Log Reference

When Romit identifies a mistake in this product, the correction is logged to:
- `docs/watch/updates-log.json` (type: `claude-correction`)
- `docs/governance/verification-discipline.md`
- Claude's memory system (feedback type)

View all PCE corrections: `__updates('pce', 'corrections')` in browser DevTools console.
