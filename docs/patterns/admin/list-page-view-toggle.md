# List-Page View Toggle (Admin)

**Pattern ID:** `ADMIN-VIEW-TOGGLE`
**Question answered:** Which DS control belongs in the top-right of an admin list page — and which controls belong elsewhere?

**Reference:** diagnostic findings in [`docs/governance/component-depth-audits/display-navigation-atoms.md`](../../governance/component-depth-audits/display-navigation-atoms.md) §ViewSegmentedControl and [`docs/governance/component-depth-audits/tabs.md`](../../governance/component-depth-audits/tabs.md) §"where ToggleGroup is the RIGHT choice".

---

## The rule (3 axes, 4 controls)

| Control | Axis it changes | Use case |
|---|---|---|
| **`ViewSegmentedControl`** | **VIEW MODE** of the same data | Same rows, different presentation: Cards / List / Board / Dashboard / Calendar |
| **`ToggleGroup`** | **WHICH DATA** flows through every panel on the page | Term ↔ Cohort axis on analytics; Didactic/Clinical filter that re-scopes everything below it |
| **`Tabs`** (`variant="line"`) | **WHICH PANEL** you're viewing | Overview / Responses / Settings on a survey detail page |
| **`Select`** | **WHICH PANEL** (≥5 options) OR a sort/filter value | Term picker, sort-by selector |

Memorise the one-liner: **ToggleGroup changes WHAT data; ViewSegmentedControl changes HOW that data renders; Tabs changes WHICH panel.**

## When to use `ViewSegmentedControl`

Use when:

- The user toggles between 2-4 **renderings of the same dataset** (Cards ↔ List ↔ Board ↔ Dashboard).
- Each rendering is a complete view (not a sub-section).
- Choice is exclusive (radiogroup semantics).

**Canonical example:** `apps/exam-management/admin/app/(app)/courses/courses-client.tsx:204-217`

```tsx
<ViewSegmentedControl
  className="ms-auto"
  value={viewMode}
  onValueChange={(v) => setViewMode(v as 'cards' | 'list')}
  options={[
    { value: 'cards', label: 'Cards', icon: 'fa-light fa-grid-2' },
    { value: 'list',  label: 'List',  icon: 'fa-light fa-list' },
  ]}
  aria-label="View mode"
/>
```

This block is **7 LoC** and inherits keyboard nav (←→↑↓ Home End), auto-`Tip` wrappers when `iconOnly`, and ARIA radiogroup semantics. The component lives at `exxat-ds/packages/ui/src/components/ui/view-segmented-control.tsx` (161 LoC).

## When to use `ToggleGroup`

Use when the control **re-scopes every panel on the page** — it's a filter / axis selector, not a view-mode toggle.

**Canonical examples (both PCE analytics, both correct — do NOT migrate to ViewSegmentedControl):**

- `apps/pce/admin/app/(app)/analytics/page.tsx:430-438` — Term ↔ Cohort axis. Re-scopes the AI insight, KPI tiles, and By-Course panel below.
- `apps/pce/admin/app/(app)/analytics/page.tsx:501-510` — All / Didactic / Clinical course-type filter, nested under the Cohort axis. Re-scopes the dataset within the chosen axis.

The tell: when you switch the toggle, *new data fetches / recomputes*. View mode just re-paints existing rows.

## When to use `Tabs` (`variant="line"`)

Use when the user switches between **distinct content panels within a single page**:

- ≤5 panel choices.
- Panels are siblings, not different filterings of one dataset.
- Each panel may carry a count chip beside the label.

Reference shape lives in [`docs/patterns/admin/entity-detail-shell.md`](./entity-detail-shell.md). Canonical example: `apps/exam-management/admin/app/(app)/courses/[id]/course-detail-client.tsx:177-248`.

## When to use `Select`

Use when:

- ≥5 panel-switching or filter options (Tabs would overflow).
- The control is a form value (modals, sort-by, term picker).

Example: term/cohort selectors at `apps/pce/admin/app/(app)/analytics/page.tsx:441-458` — 6+ terms in a dropdown.

## Anti-patterns (with file:line of resolved cases)

- **Hand-rolled radiogroup as a view-mode toggle** (resolved). `courses-client.tsx` previously contained a 34-LoC `<div role="group" aria-label="View mode">` wrapping two `Button variant="ghost" size="icon-sm"` with `aria-pressed`, per-item `Tooltip`, and a `style` prop injecting `backgroundColor: var(--muted)` for active state. Migrated to `ViewSegmentedControl` (display-navigation-atoms.md §ViewSegmentedControl P1). Collapse: 34 LoC → 7 LoC, gains keyboard nav + auto-Tip, drops the `style` hack.
- **`ToggleGroup` used as a view-mode toggle.** Wrong axis — ToggleGroup is for data scope. If both render the same dataset, use ViewSegmentedControl.
- **`Tabs` used to switch data axis on an analytics page.** Breaks the "panels = siblings" rule (a Term/Cohort axis re-scopes *every* panel, not just one). See tabs.md §"where Tabs would be WRONG" — analytics page is explicitly out of scope for Tabs.
- **`Select` used to switch ≤4 panels.** Loses keyboard tab-cycle through visible options. Use Tabs `variant="line"`.

## API surface (ViewSegmentedControl)

```ts
interface ViewSegmentOption<T extends string> {
  value: T
  label: string                    // visible chip text (or Tip label if iconOnly)
  icon?: string                    // FA name (with weight, e.g. 'fa-light fa-grid-2')
}

interface ViewSegmentedControlProps<T> {
  value: T
  onValueChange: (next: T) => void
  options: ViewSegmentOption<T>[]
  'aria-label': string             // required for the radiogroup
  className?: string
  iconOnly?: boolean               // hides label, auto-wraps each option in <Tip>
  size?: 'sm' | 'default'
}
```

Source: `exxat-ds/packages/ui/src/components/ui/view-segmented-control.tsx`.

## Open questions / future considerations

- **3-option toggles.** Cards / List / Board would justify `ViewSegmentedControl` with 3 options — gated on Programs / Sites / Placements pages shipping a board view (display-navigation-atoms.md §"What this audit can't see").
- **Persistence across navigation.** `courses-client.tsx` stores `viewMode` in local state — switching to Settings and back resets to Cards. URL search param or cookie persistence is deferred until users complain.
- **Mobile view-mode default.** Cards default makes sense on desktop, but on <768px the List view fits better. No responsive override today — handle via `useMobile()` hook when mobile audit lands.
