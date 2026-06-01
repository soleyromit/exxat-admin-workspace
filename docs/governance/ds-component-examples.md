# DS Component Canonical Examples

> **Source of truth for correct usage.** Read this before writing any JSX for the components below.
> Updated: 2026-06-01. Derived from `@exxatdesignux/ui` v0.6.17 type definitions + existing correct usage in the workspace.
>
> For the full prop API: read `node_modules/@exxatdesignux/ui/dist/components/<name>/<name>.d.ts`
> For the live rendered version: `http://localhost:4000/library/<id>` (requires dev server)

---

## Button

**Import:** `import { Button } from '@exxatdesignux/ui'`

**Required:** always explicit `variant` + `size`. Never omit either. Never use raw `<button>`.

```tsx
// Standard action
<Button variant="default" size="sm">Save</Button>

// Secondary / outline
<Button variant="outline" size="sm">Cancel</Button>

// Destructive
<Button variant="destructive" size="sm">Delete</Button>

// Ghost (toolbar icons, low-priority actions)
<Button variant="ghost" size="sm">Edit</Button>

// Icon-only — MUST have aria-label
<Button variant="ghost" size="icon" aria-label="More options">
  <i className="fa-solid fa-ellipsis" aria-hidden="true" />
</Button>

// Icon-only small
<Button variant="ghost" size="icon-sm" aria-label="Filter columns">
  <i className="fa-solid fa-columns" aria-hidden="true" />
</Button>

// Link style
<Button variant="link" size="sm">View details</Button>
```

**Never:**
- `<button className="...">` — raw HTML button
- `<Button>` without variant and size
- Icon inside button without `aria-hidden="true"`
- `variant="icon"` — there is no "icon" variant; use `size="icon"` with any variant

---

## DataTable

**Import:** `import { DataTable } from '@exxatdesignux/ui'`  
or from vendored local copy in PCE/EM: `import { DataTable } from '@/components/data-table'`

**Required props:** `data`, `columns`, `emptyState`, `toolbarSlot` (on list pages), `selectable` (on list pages)

```tsx
import { DataTable } from '@exxatdesignux/ui'
import { useTableState } from '@exxatdesignux/ui'

// Minimal correct list page usage
<DataTable
  data={rows}
  columns={columns}
  getRowId={(row) => row.id}
  selectable
  emptyState={{
    icon: 'fa-clipboard-list',          // entity-specific icon, not generic
    heading: 'No surveys yet',           // entity-specific, not "No results"
    description: 'Create your first survey to get started.',
    action: <Button variant="default" size="sm" onClick={onCreate}>Create survey</Button>,
  }}
  toolbarSlot={(state) => (
    <>
      <span className="text-sm text-muted-foreground">
        {state.filteredRows.length} survey{state.filteredRows.length !== 1 ? 's' : ''}
      </span>
      <TablePropertiesDrawer state={state} columns={columns} />
    </>
  )}
/>
```

**emptyState is REQUIRED** — never omit. "No results match your filters" is the fallback, not an acceptable first-run state.

**toolbarSlot is REQUIRED on all list pages** — always include row count + properties drawer.

**columns definition:**
```tsx
const columns: ColumnDef<Survey>[] = [
  {
    key: 'title',
    label: 'Title',
    width: 280,
    sortable: true,
    cell: (row) => <span className="font-medium">{row.title}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    filter: { type: 'select', options: STATUS_OPTIONS },
    cell: (row) => <StatusBadge status={row.status} />,  // use StatusBadge, not hand-rolled chip
  },
]
```

---

## ListPageTemplate

**Import:** `import { ListPageTemplate } from '@exxatdesignux/ui'`

All admin list pages use this as the top-level wrapper. Never build a custom page shell for a list page.

```tsx
import { ListPageTemplate, type ViewTab } from '@exxatdesignux/ui'

const DEFAULT_TABS: ViewTab[] = [
  { id: 'all',       label: 'All',       viewType: 'table', icon: 'fa-list',    filterId: 'all' },
  { id: 'active',    label: 'Active',    viewType: 'table', icon: 'fa-circle',  filterId: 'active' },
  { id: 'archived',  label: 'Archived',  viewType: 'table', icon: 'fa-archive', filterId: 'archived' },
]

export default function SurveysPage() {
  return (
    <ListPageTemplate
      header={<SiteHeader title="Surveys" />}
      metrics={<KeyMetrics items={kpiItems} />}
      defaultTabs={DEFAULT_TABS}
    >
      {(activeTab) => (
        <DataTable
          data={filterByTab(rows, activeTab.filterId)}
          columns={columns}
          emptyState={getEmptyState(activeTab)}
          toolbarSlot={...}
          selectable
        />
      )}
    </ListPageTemplate>
  )
}
```

**Never:** build a custom page shell (custom header div + custom tab row + custom content area) when ListPageTemplate covers it.

---

## Sheet

**Import:** `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@exxatdesignux/ui'`

```tsx
// Standard detail/edit sheet
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent
    showOverlay={false}       // REQUIRED — no backdrop on list pages
    showCloseButton={false}   // REQUIRED — close via Cancel button in footer
    side="right"
    className="w-[480px]"
  >
    <SheetHeader>
      <SheetTitle>Edit Survey</SheetTitle>
    </SheetHeader>

    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {/* form fields */}
    </div>

    <SheetFooter>
      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="default" size="sm" onClick={handleSave}>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Never:**
- `showOverlay` defaults to true — always set `showOverlay={false}` on list page sheets
- `showCloseButton` defaults to true — always set `showCloseButton={false}` (use footer Cancel)
- Custom `<div>` overlay instead of Sheet

---

## Dialog

**Import:** `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@exxatdesignux/ui'`

```tsx
// Confirmation dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Survey?</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
      This action cannot be undone.
    </p>
    <DialogFooter>
      <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Form dialog — requires error feedback
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Survey</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          aria-required="true"
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>
      {/* form-level error */}
      {submitError && (
        <LocalBanner variant="error" title="Could not save" description={submitError} />
      )}
      <DialogFooter>
        <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="default" size="sm" type="submit" disabled={isSubmitting}>Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Never:** `toast()` for error feedback inside a dialog — use `LocalBanner` inside the dialog content.

---

## StatusBadge

**Import:** `import { StatusBadge } from '@exxatdesignux/ui'`

Replaces ALL hand-rolled status chips, `StatusPill`, `SurveyStatusBadge`, `AssessmentStatusBadge`.

```tsx
// Pill (default) — for table cells, detail headers
<StatusBadge status="beta" />
<StatusBadge status="new" size="sm" />
<StatusBadge status="alpha" />
<StatusBadge status="preview" />
<StatusBadge status="deprecated" />

// Dot — collapsed sidebar, tight spaces
<StatusBadge status="beta" variant="dot" />

// Anchored on a label
<span className="relative inline-flex items-center gap-1.5">
  Question Bank
  <StatusBadge status="new" size="sm" />
</span>
```

**Status values:** `"alpha" | "beta" | "new" | "preview" | "deprecated"`

**Never:** hand-roll `<span className="rounded-full text-xs px-2 ...">Beta</span>` — use StatusBadge.

---

## KeyMetrics

**Import:** `import { KeyMetrics, type MetricItem } from '@exxatdesignux/ui'`

**Hard rule:** MAX 4 `MetricItem` on any strip. Extra metrics go in charts or insight cards.

```tsx
const kpiItems: MetricItem[] = [
  {
    id: 'total',
    label: 'Total surveys',
    value: '148',
    delta: '+12',
    trend: 'up',
    trendPolarity: 'higher_is_better',  // more surveys = better
    description: 'vs last month',
  },
  {
    id: 'response-rate',
    label: 'Response rate',
    value: '73%',
    delta: '-4%',
    trend: 'down',
    trendPolarity: 'higher_is_better',  // higher rate = better → down = bad (red)
    description: 'across active surveys',
  },
  {
    id: 'overdue',
    label: 'Overdue',
    value: '6',
    delta: '+2',
    trend: 'up',
    trendPolarity: 'lower_is_better',  // overdue = bad → up = bad (red)
  },
  {
    id: 'distribution',
    label: 'Distribution type',
    value: '3 types',
    delta: '',
    trend: 'neutral',
    trendPolarity: 'informational',    // just counts, no judgment
  },
]

<KeyMetrics items={kpiItems} />
```

**trendPolarity is required** whenever the metric has a directional judgment. Omitting it defaults to `higher_is_better` which is WRONG for overdue/error/incident metrics.

**Empty delta:** pass `delta: ''` + `trend: 'neutral'` — the chip hides automatically. Never put prose like `"vs last week"` in delta — that goes in `description`.

---

## LocalBanner

**Import:** `import { LocalBanner } from '@exxatdesignux/ui'`

Replaces ALL `toast()` calls for inline product feedback.

```tsx
// Error state (form submit failure, fetch error)
<LocalBanner
  variant="error"
  title="Could not save changes"
  description="Check your connection and try again."
/>

// Warning
<LocalBanner
  variant="warning"
  title="Missing required fields"
  description="Complete all required fields before distributing."
/>

// Info
<LocalBanner
  variant="info"
  title="Survey distributed"
  description="Students will receive access within 15 minutes."
/>

// Success
<LocalBanner
  variant="success"
  title="Saved"
/>
```

**Never:** `toast()`, `toast.error()`, `toast.success()` for product feedback. `toast` is for transient system notifications only. `LocalBanner` is for inline form/page feedback.

---

## FA Icons — Accessibility

All FontAwesome icons need `aria-hidden="true"`. Icon-only buttons need `aria-label`.

```tsx
// Decorative icon (most common)
<i className="fa-solid fa-circle-check" aria-hidden="true" />

// Icon + visible text — icon is decorative, text carries meaning
<Button variant="outline" size="sm">
  <i className="fa-solid fa-download" aria-hidden="true" />
  Export
</Button>

// Icon-only button — aria-label on the Button, aria-hidden on icon
<Button variant="ghost" size="icon-sm" aria-label="Download CSV">
  <i className="fa-solid fa-download" aria-hidden="true" />
</Button>
```

**Never:**
- `<i className="fa-solid fa-check" />` without `aria-hidden="true"`
- Icon-only button without `aria-label` on the Button element
- `aria-label` on the `<i>` tag (put it on the interactive element, Button)
