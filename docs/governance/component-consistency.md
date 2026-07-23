# Component Consistency — Cross-Product Governance

> Enforced for every list page, entity page, and data table across all products.
> **Source:** Romit audit directive (2026-05-21). Canonical reference: QB + Students (exam-management).
> **Pairs with:** `docs/governance/design-anti-patterns.md`, per-product `ui-patterns.md`

---

## 1. Page Header — Required on Every Route

Each product has its own header pattern. Do NOT mix them.

### Exam Management Admin (`apps/exam-management/admin/`)

```tsx
// Two-tier: SiteHeader (h-14, breadcrumbs + persona + sidebar toggle)
//           PageHeader (px-6 py-4, title + subtitle + actions)
<SiteHeader title="Students" breadcrumbs={[{ label: 'Students' }]} />
<div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
  <PageHeader
    title="Students"
    subtitle="48 of 48 students"
    actions={<Button size="sm">Add Student</Button>}
  />
  {/* content */}
</div>
```

- `SiteHeader` includes the **sidebar toggle button** (`fa-sidebar` + `useSidebar().toggleSidebar`) — do not add a separate one
- `id="main-content"` + `tabIndex={-1}` required for skip-link accessibility

### PCE Admin (`apps/pce/admin/`)

```tsx
// Single inline header — exact pixel values, no Tailwind padding
<header
  className="flex items-center gap-2 border-b border-border shrink-0"
  style={{ padding: '18px 28px 14px' }}
>
  <SidebarTrigger className="-ms-1" />
  <Separator orientation="vertical" className="h-4" />
  <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
    Page Title
  </h1>
  <Button variant="default" size="sm">Primary Action</Button>
</header>
```

- `SidebarTrigger` is required — not optional
- Primary CTA always at far right
- Never use `<h2>` / `<h3>` as page title

---

## 2. DataTable — Required Props on Every List Page

```tsx
<DataTable<TRow>
  data={filtered}
  columns={COLUMNS}
  getRowId={(row) => row.id}        // REQUIRED — always provide
  getRowSelectionLabel={(row) => row.name} // REQUIRED when selectable
  selectable                         // always on for entity list pages
  searchable={false}                 // exam-management: use external SearchInput
  // PCE: searchable (built-in search) — no external InputGroup
  showQueryControls={false}          // exam-management only
  onRowClick={(row) => router.push(`/${entity}/${row.id}`)}
  emptyState={<EntityEmptyState />}  // REQUIRED — never omit
  toolbarSlot={() => (               // REQUIRED — always show count
    <span className="text-xs text-muted-foreground">
      {filtered.length} {entity}{filtered.length !== 1 ? 's' : ''}
      {query && ` matching "${query}"`}
    </span>
  )}
/>
```

### Missing = violation:
| Missing prop | Symptom | Fix |
|---|---|---|
| `toolbarSlot` | No count shown — user has no density signal | Add `toolbarSlot` returning count span |
| `emptyState` | DataTable falls back to generic empty | Add entity-specific empty state |
| `getRowId` | Row selection breaks silently | Always pass |
| `selectable` omitted | No bulk-action surface | Add for all list pages |

---

## 3. Search — Per-Product Pattern (Don't Mix)

### Exam Management
```tsx
// External SearchInput above DataTable; DataTable has searchable={false}
<SearchInput
  entityKey="students"          // used for recent-search persistence
  value={query}
  onChange={setQuery}
  placeholder="Search by name, ID, email…"
  aria-label="Search students"
  width="w-full max-w-lg"
/>
<DataTable ... searchable={false} showQueryControls={false} />
```

### PCE
```tsx
// Built-in DataTable search; no external InputGroup above the table
<DataTable ... searchable />
// DataTable renders its own InputGroup search bar in the toolbar
```

**Never** use PCE's `searchable` prop in exam-management and vice versa — the two apps have different search UX contracts (Aarti's "Google search" directive for EM).

---

## 4. Sidebar Toggle — Required on All List Pages

### Exam Management
The `SiteHeader` component now includes `useSidebar().toggleSidebar` with `fa-sidebar` icon. Every page using `SiteHeader` gets it automatically.

```tsx
// ✓ Correct — toggle is inside SiteHeader
<SiteHeader title="Faculty" breadcrumbs={[{ label: 'Faculty' }]} />

// ✗ Wrong — do NOT add a second toggle manually
```

### PCE
`SidebarTrigger` must be the first item in the inline `<header>`. It renders the DS sidebar toggle.

```tsx
<header ...>
  <SidebarTrigger className="-ms-1" />  {/* REQUIRED — first item */}
  ...
</header>
```

---

## 5. DataTablePaginated — When to Use

Use `DataTablePaginated` instead of `DataTable` when the list can exceed 50 rows.

```tsx
import { DataTablePaginated } from '@/components/data-table/pagination'

<DataTablePaginated<TRow>
  data={filtered}
  columns={COLUMNS}
  getRowId={(row) => row.id}
  selectable
  searchable={false}
  pagination={{ defaultPageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
  toolbarSlot={() => (...)}
/>
```

### Current status:
- Exam management students/faculty/courses: `DataTable` (mock data < 50 rows — upgrade when real data arrives)
- PCE admin/students: `DataTable` (has `TablePropertiesDrawer` — upgrade path is `DataTablePaginated`)

---

## 6. Sheet (Drawer) Conventions

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
    showOverlay={false}     // REQUIRED — floating, no scrim
    showCloseButton={false} // REQUIRED for form drawers — use SheetFooter Cancel
    side="right"
    style={{ width: 480 }}  // 420–480px for forms, 600px for detail panels
  >
    <SheetHeader>
      <SheetTitle>Add Entity</SheetTitle>
    </SheetHeader>

    {/* LMS info note — only when Canvas integration applies */}
    <div className="mx-4 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
      style={{
        backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
        color: 'var(--brand-color-dark)',
        border: '1px solid color-mix(in oklch, var(--brand-color) 20%, var(--background))',
      }}
      role="note"
    >
      <i className="fa-light fa-circle-info mt-0.5 shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
      <span>Canvas integration note.</span>
    </div>

    <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
      {/* form fields */}
    </div>

    <SheetFooter className="flex-row justify-end gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button>Save Entity</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Never:**
- `showOverlay={true}` on entity sheets (makes it feel modal, not inline)
- Put close button AND Cancel in footer — pick one, not both
- Width > 600px for forms (use full page instead)

---

## 7. Dialog Conventions

Dialogs are for destructive actions and confirmations only — not for forms. Use Sheet for forms.

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm action</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button variant="destructive" onClick={onConfirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Never use `toast()`** — use `LocalBanner` for post-action feedback:
```tsx
<LocalBanner variant="success">Survey pushed successfully.</LocalBanner>
```

---

## 8. Typography Hierarchy (Anti-repetition)

| Context | Class |
|---|---|
| Page title (SiteHeader) | `text-base font-semibold` |
| Page title (PCE inline h1) | `text-[22px] font-normal font-heading` |
| Section label | `text-sm font-semibold text-foreground` |
| Form label | `text-sm font-medium` (DS `Label`) |
| Table column header | DS DataTable handles — do not override |
| Metadata / secondary | `text-xs text-muted-foreground` |
| Count badge | `text-[11px] font-mono tabular-nums` |

**Max 1 instance of `uppercase tracking-wide`** per screen — eyebrow labels for Canvas Integration sections only.

---

## 9. Empty State Formula — Per Product

### Exam Management
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center gap-2">
  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
    <i className="fa-light fa-[entity-icon] text-muted-foreground text-xl" aria-hidden="true" />
  </div>
  <p className="font-semibold text-foreground">No students match your search</p>
  <p className="text-sm text-muted-foreground max-w-xs">
    Try a different name, ID, cohort, or advisor.
  </p>
</div>
```
- `py-16` (not py-20 or py-12) for top-level list pages
- Icon in `size-14` muted circle
- No "Create X" button when search/filter active

### PCE
```tsx
// Per pce-ui-patterns.md §4 — icon-only, no circle container
<div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
  <i className="fa-light fa-[entity-icon] text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
  <div className="flex flex-col gap-1">
    <p className="text-sm font-medium">{hasFilters ? 'No X match' : 'No X yet'}</p>
    <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>...</p>
  </div>
  {!hasFilters && <Button size="sm">Create X</Button>}
</div>
```

---

## 10. Audit Checklist — Run Before Claiming Done

```
□ SiteHeader (exam-management) or inline header with SidebarTrigger (PCE) present?
□ toolbarSlot with row count on every DataTable?
□ emptyState prop provided and entity-specific?
□ selectable on all list page DataTables?
□ External SearchInput (exam-management) or searchable prop (PCE)?
□ Sheet uses showOverlay={false} + showCloseButton={false}?
□ No toast() — LocalBanner only?
□ Typography: no uppercase tracking-wide more than once per screen?
□ No raw <button> — DS Button with variant + size?
□ All FA icons aria-hidden="true"; icon-only buttons have aria-label?
```

---

## Source Reference

- Canonical: `apps/exam-management/admin/app/(app)/students/students-client.tsx`
- Canonical header: `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx`
- Canonical pagination: `apps/exam-management/admin/components/data-table/pagination.tsx`
- PCE canonical: `apps/pce/admin/app/(app)/admin/students/page.tsx`
- Romit directive: 2026-05-21 — "sheets, dialog, datatable, header, fonts, color don't match exxat-ds"
