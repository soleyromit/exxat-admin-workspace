# State Coverage (Admin)

**Pattern ID:** `ADMIN-004`
**Binds rules:** A11Y-001, A11Y-002, DS-001
**Question answered:** For any admin page that fetches async data, accepts form input, or renders a list/grid, what states MUST be handled — and what does each one look like?

**Reference:** diagnostic findings in [`docs/governance/blind-spots.md`](../../governance/blind-spots.md) row #14 (state-coverage class) and [`docs/governance/verification-discipline.md`](../../governance/verification-discipline.md) Pattern F (state coverage). Static enforcement: five audit rules in `scripts/ds-adoption-audit.py` listed under [`docs/governance/ds-adoption.md`](../../governance/ds-adoption.md) → "State-coverage requirements."

---

## When to use

Any admin page where ANY of the following is true:

1. Data is fetched after first render (`useEffect` + `fetch`, `useSWR`, `useQuery`, server actions returning a promise the page awaits).
2. The page accepts form input (`<Input>`, `<Textarea>`, `<Select>`, `<DatePickerField>`, `<Checkbox>`, `<RadioGroup>`, anything inside `<form>`).
3. The page renders a list, table, grid, or repeated card layout (`<DataTable>`, `<ul>`, `.map(row => ...)`).

If any of the three is true, the page MUST handle every required state in §"Canonical examples per state" below. The audit script flags violations; the `state-review` subagent enforces depth.

Pages with NO async / NO form / NO list (rare — basically static info pages) skip this pattern.

## The seven required states

| State | Required when | DS surface |
|---|---|---|
| **Loading** | Page fetches async data | `Skeleton` placement matching post-load shape |
| **Empty** | List, DataTable, or grid renders 0 items | `emptyState` prop (DataTable) or hand-rolled fallback with icon + heading + explanation |
| **Error** | Async fetch can fail | `LocalBanner variant="error"` with retry affordance |
| **Validation** | Form accepts input | `aria-invalid` + `<FieldError>` per field + multi-error `<LocalBanner>` summary |
| **Submission** | Form posts data | `LocalBanner variant="success"` after save (NEVER toast/Sonner per workspace CLAUDE.md §8) |
| **Disabled** | Control is conditionally inactive | DS component's own `disabled` prop (NEVER `opacity-60` on parent — drops `text-muted-foreground` contrast below WCAG 4.5:1) |
| **Focus** | Custom clickable (non-DS Button) | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` + `tabIndex={0}` + `onKeyDown` (Enter/Space) + `role="button"` |

---

## Canonical examples per state

### Loading — Skeleton placement

`apps/pce/admin/app/(app)/my-surveys/page.tsx:187-198`

```tsx
function MySurveysSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    </>
  )
}

// Use:
<Suspense fallback={<MySurveysSkeleton />}>
  <MySurveysContent />
</Suspense>
```

**Load-bearing details:**

1. Skeleton shapes match the post-load layout (header + grid rows match the rendered grid).
2. Wrapped in `<Suspense>` for server components, OR gated on `isLoading` for client components.
3. Skeleton variants: `Skeleton className="h-N w-N rounded-..."` — never custom `<div className="animate-pulse bg-gray-200">` (DS Skeleton ships theme-aware shimmer).

### Empty — DataTable emptyState prop

`apps/pce/admin/app/(app)/admin/assessment-types/page.tsx:96-110`

```tsx
<DataTable<AssessmentTypeRow>
  data={rows}
  columns={columns}
  getRowId={(row) => row.id}
  searchable
  emptyState={
    <div className="flex flex-col items-center gap-2 py-6">
      <i
        className="fa-light fa-clipboard-question text-muted-foreground"
        aria-hidden="true"
        style={{ fontSize: 24 }}
      />
      <p className="text-sm font-medium">No assessment types match your search</p>
      <p className="text-xs text-muted-foreground">
        Try clearing the search or filters.
      </p>
    </div>
  }
/>
```

**Load-bearing details:**

1. Icon (FA-light, `text-muted-foreground`, size 20-28px).
2. Heading (`text-sm font-medium`) — what the user is looking at.
3. 1-line explanation (`text-xs text-muted-foreground`) — why it's empty + what to do.
4. Optional CTA (`<Button variant="outline" size="sm">`) when the empty state is recoverable.

**Distinguish "no source data" from "filter returned 0".** DataTable's default empty string is "No results match your filters." If the source itself is empty (no rows have ever been created), supply an `emptyState` that says so. Two patterns:

```tsx
// Pattern A: same emptyState for both — accept that filters can hide everything
<DataTable data={rows} emptyState={<EmptyAssessmentTypes />} />

// Pattern B: branch in render — show first-run empty when the source is empty
if (rows.length === 0) return <FirstRunEmptyState />
return <DataTable data={rows} emptyState={<FilteredEmpty />} />
```

Audit accepts either. `scan_file_for_datatable_no_empty_state` flags only when NEITHER is present.

### Error — LocalBanner variant="error"

`apps/exam-management/admin/app/(app)/access/page.tsx` (or any file using LocalBanner — grep workspace for `LocalBanner variant="error"`)

```tsx
const [error, setError] = useState<string | null>(null)

return (
  <>
    {error && (
      <LocalBanner
        variant="error"
        title="Couldn't load this page"
        action={
          <Button variant="outline" size="sm" onClick={() => retry()}>
            Retry
          </Button>
        }
      >
        {error}
      </LocalBanner>
    )}
    {/* rest of page */}
  </>
)
```

**Load-bearing details:**

1. `variant="error"` — sets the banner's color and icon to the destructive token.
2. `title` is a noun phrase, 4-6 words; the body is a 1-2 sentence explanation.
3. `action` slot carries a `<Button variant="outline" size="sm">` with a retry handler — every error state must be recoverable.
4. NEVER use `toast()` / Sonner for async errors — banned per workspace CLAUDE.md §8. Banners persist; toasts disappear before users read them.

### Validation — aria-invalid + FieldError + multi-error LocalBanner

`apps/exam-management/admin/app/(app)/access/page.tsx:293-321`

```tsx
<FieldGroup>
  <Field orientation="vertical">
    <FieldLabel htmlFor="invite-name">Name *</FieldLabel>
    <Input
      id="invite-name"
      placeholder="Dr. Jane Doe"
      value={name}
      onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }) }}
      autoFocus
      aria-required="true"
      aria-invalid={!!errors.name}
      aria-describedby={errors.name ? 'invite-name-error' : undefined}
    />
    {errors.name && <FieldError id="invite-name-error">{errors.name}</FieldError>}
  </Field>
  {/* ...email Field with same pattern */}
</FieldGroup>
```

**Load-bearing details:**

1. `aria-invalid={!!errors.<field>}` on every Input that can fail validation.
2. `aria-describedby` points at the FieldError id when error is present.
3. `<FieldError id="...">` renders the per-field message AND announces it to screen readers (WCAG 3.3.1).
4. For multi-field forms with multiple errors, add a `<LocalBanner variant="error">` at the top of the form summarising the count: "2 fields need attention" — links to each field via anchor / focus management.
5. On `onChange`, clear the field's error so the user gets immediate feedback that the fix worked.

**Multi-error LocalBanner summary** (for forms with 3+ fields):

```tsx
{Object.keys(errors).length > 1 && (
  <LocalBanner variant="error" title={`${Object.keys(errors).length} fields need attention`}>
    Review the highlighted fields below and try again.
  </LocalBanner>
)}
```

### Submission — LocalBanner variant="success"

```tsx
const [saved, setSaved] = useState(false)

useEffect(() => {
  if (saved) {
    const t = setTimeout(() => setSaved(false), 6000)
    return () => clearTimeout(t)
  }
}, [saved])

return (
  <>
    {saved && (
      <LocalBanner variant="success" title="Changes saved">
        Your updates were applied.
      </LocalBanner>
    )}
    {/* form */}
  </>
)
```

**Load-bearing details:**

1. `variant="success"` — green tint via DS token.
2. Auto-dismiss is OPTIONAL (6s timeout); persistent success is also acceptable.
3. NEVER `toast.success()` — banned per workspace CLAUDE.md §8.
4. Position the banner above the form so users see it before scrolling.

### Disabled — component's disabled prop, not opacity-60

```tsx
// CORRECT
<Button variant="outline" disabled={isLoading}>
  Save
</Button>

<Input
  value={value}
  onChange={onChange}
  disabled={mode === 'view-only'}
  aria-disabled={mode === 'view-only'}
/>

// WRONG (the audit flags this)
<Card className="opacity-60 cursor-not-allowed">
  <CardContent>
    <p className="text-muted-foreground">...</p>  {/* now below 4.5:1 contrast */}
  </CardContent>
</Card>
```

**Load-bearing details:**

1. Use each DS component's own `disabled` prop — Button, Input, Select, Checkbox, RadioGroup, DropdownMenuItem all support it.
2. Compound it with `aria-disabled="true"` if the visual disabled state is overridden by a `pointer-events-none` wrapper (rare).
3. NEVER `opacity-60` on a parent that contains `text-muted-foreground` children — opacity compounds the alpha and drops contrast below WCAG 4.5:1.
4. If the whole subtree must be disabled, use the DS component's `disabled` prop on each interactive child AND aria-disabled on the wrapping fieldset.

### Focus — DS Button or focus-visible:ring on custom clickable

```tsx
// PREFERRED — DS Button handles focus
<Button variant="ghost" size="sm" onClick={handle}>
  Action
</Button>

// ACCEPTABLE — custom clickable with explicit focus + keyboard
<div
  role="button"
  tabIndex={0}
  className="cursor-pointer rounded-md p-3 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  onClick={handle}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle() } }}
>
  ...
</div>

// WRONG (the audit flags this)
<div className="cursor-pointer" onClick={handle}>
  ...
</div>
```

**Load-bearing details:**

1. Default to DS `<Button>` — it ships focus ring, keyboard semantics, and aria-pressed if needed.
2. For card-as-click patterns where Button doesn't fit (whole card is clickable), the custom-clickable affordances above are mandatory: `role="button"` + `tabIndex={0}` + `onKeyDown` + `focus-visible:ring`.
3. NEVER `outline-none` without a `focus-visible:ring-*` sibling (the PreToolUse hook blocks this via A11Y-002).

---

## Anti-patterns (with file:line of resolved cases)

- **Raw spinner divs** — `<div className="animate-spin">` instead of DS Skeleton. Loses theme adaptation and shimmer animation. Use `Skeleton`.
- **Hand-rolled empty-state cards** — `<Card><div className="text-center">No data</div></Card>` instead of `emptyState` prop. DataTable's `emptyState` slot keeps the empty render INSIDE the table chrome (consistent header, search bar visible) instead of replacing the whole component. Documented in `docs/governance/component-depth-audits/forms-input.md`.
- **Silent submission failures** — async save that rejects, page state unchanged, user repeatedly clicks "Save." Always render either `LocalBanner variant="success"` or `LocalBanner variant="error"` after the await settles.
- **`opacity-60` on a Card containing `text-muted-foreground` text** — drops contrast below 4.5:1. Examples (open): `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx:499`, `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx:276`.
- **Clickable div without focus ring** — `<div className="cursor-pointer" onClick={...}>` is a keyboard trap. Examples (open): `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:1139, 1950`.
- **Validation error that doesn't clear on edit** — user edits the bad field, error persists, looks broken. Always `if (errors.X) setErrors({ ...errors, X: '' })` inside the field's `onChange`.
- **toast() for product feedback** — banned per workspace CLAUDE.md §8 and the PreToolUse hook (DS-005). Always banner.

---

## API surface (per DS component, per state)

| Component | Loading | Empty | Error | Validation | Disabled |
|---|---|---|---|---|---|
| `DataTable` | wrap in `<Suspense fallback={<Skeleton />}>` | `emptyState` prop | render `<LocalBanner variant="error">` above | n/a | per-row via `conditionalRules` |
| `Input` | n/a | n/a | n/a | `aria-invalid={!!error}` + sibling `<FieldError>` | `disabled` prop |
| `Select` | n/a | n/a | n/a | `aria-invalid` on `<SelectTrigger>` | `disabled` prop on trigger |
| `DatePickerField` | n/a | n/a | n/a | `aria-invalid` on trigger | `disabled` prop |
| `Button` | optional `<Skeleton className="h-9 w-24" />` placeholder | n/a | n/a | n/a | `disabled` prop |
| `Card` | wrap content in `<Skeleton />` | hand-roll empty state inside `<CardContent>` | hand-roll error inside `<CardContent>` | n/a | DON'T use `opacity-60` on the Card |
| `Dialog` | n/a | n/a | `<LocalBanner variant="error">` inside `<DialogContent>` | per-field aria-invalid + multi-error summary | `disabled` on action button |
| `Sheet` | n/a | n/a | `<LocalBanner variant="error">` inside `<SheetContent>` | per-field aria-invalid + multi-error summary | `disabled` on action button |

For the full per-component required-state matrix, see `docs/governance/component-state-catalog.md` (canonical source, maintained alongside this pattern doc).

---

## Open questions / future considerations

- **Optimistic UI vs. wait-for-server.** When a mutation can be optimistic (e.g., toggling a checkbox), the success banner is redundant. Open: should we codify a per-action threshold (e.g., "any save > 200ms latency requires a success banner")? Defer until Aarti or Vishaka flags it.
- **Skeleton variants per layout.** Cards, table rows, KPI tiles, sparkline regions each have a canonical skeleton shape — none are codified as DS exports. Open: should we publish `<DataTableSkeleton />`, `<KeyMetricsSkeleton />`, etc.? Block on the second sister product needing one.
- **Validation: client-side vs. server-side.** Pattern above is client-side. Server-side validation (rare in current product code, but coming) needs a different banner pattern — single `<LocalBanner variant="error">` summarising server-returned messages, anchored to the form top. Defer until first server-mutation page ships.
- **Disabled with reason.** A disabled control should explain WHY it's disabled. Pattern: wrap in `<Tip label="Reason this is disabled">` — but Tip on disabled DS Button doesn't fire pointer events. Open: codify a `disabledReason` prop convention or use `<Tooltip>` with `asChild` on a wrapping span. Defer until a second consumer hits this.
- **Empty state for first-time users.** "Welcome, create your first X" is different from "0 items match your filter." Pattern not yet codified — see Pattern A vs. B in the Empty section above. Open: a `firstRunEmptyState` prop on DataTable would split the cases. Block on first product needing it.
- **Promotion to block.** All five state-coverage audit rules are currently WARN. Promotion path documented in `docs/governance/ds-adoption.md` → "State-coverage requirements." When a rule's hit count drops to 0 workspace-wide, promote it via `--strict-rules <slug>` in the pre-commit hook.
