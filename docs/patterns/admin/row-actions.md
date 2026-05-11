# Row Actions (Admin)

**Pattern ID:** `ADMIN-ROW-ACTIONS`
**Question answered:** What's the canonical shape of a per-row kebab-menu in an admin list page?

**Reference:** diagnostic findings in [`docs/governance/component-depth-audits/actions-overlays.md`](../../governance/component-depth-audits/actions-overlays.md) — this doc is the prescriptive companion.

---

## When to use

Any admin list / DataTable where each row needs ≥2 secondary actions (Edit, View, Archive, …).

- **≤1 secondary action per row** → render the affordance inline (icon Button), skip the dropdown.
- **The action is the row's primary navigation** → use a Link-wrapped row + a primary inline action, not a kebab.
- **The actions belong to bulk selection, not one row** → use the floating BulkActionBar pattern, not RowActions.

## Canonical example

The shape was locked across **11 / 11** PCE admin entity pages before being extracted into a generic component. All 11 used: `Button variant="ghost" size="icon-sm"` trigger + `fa-regular fa-ellipsis` + `DropdownMenuContent align="end"` + `stopPropagation` on both trigger and content. See actions-overlays.md adoption snapshot for the file list.

**Shared generic** (use this — do not re-roll):

- `apps/pce/admin/components/data-table/row-actions.tsx:55-88` — exports `<RowActions<TData> />` and the `RowAction<TData>` type
- `apps/exam-management/admin/components/data-table/row-actions.tsx` — identical vendor copy (2026-05-11)

**Usage (canonical):** `apps/pce/admin/app/(app)/admin/faculty/page.tsx:96-111`

```tsx
const FACULTY_ROW_ACTIONS: RowAction<FacultyRow>[] = [
  { label: 'Edit profile',   icon: 'fa-pen',            disabled: MOCK_LMS_ENABLED },
  { label: 'View offerings', icon: 'fa-rectangle-list' },
  { label: 'Manage roles',   icon: 'fa-shield-check'   },
  { label: 'Archive',        icon: 'fa-box-archive',    variant: 'destructive', divider: true },
]

cell: (row) => <RowActions row={row} label={row.name} actions={FACULTY_ROW_ACTIONS} />,
```

**Load-bearing details the generic handles** (inline forks must preserve all five):

- Trigger: `variant="ghost"` `size="icon-sm"` + `aria-label="Actions for {label}"` + `onClick={(e) => e.stopPropagation()}` (row click is usually navigation).
- Content: `align="end"` (default `start` overflows on narrow tables) + `onClick={(e) => e.stopPropagation()}` (item-select must not bubble).

## When to use the shared generic vs inline

**Default to the generic `<RowActions<TData>>`.**

Inline (`<DropdownMenu>` written longhand inside the cell) is acceptable only when:

- The action set is built from **>1 conditional behaviour that cannot be expressed via `hidden: boolean`** — e.g., separate `onClick` handlers per action that close over local component state, or a custom `asChild` Link inside one item. (Reference: the in-flight migration target `apps/pce/admin/app/(app)/surveys/page.tsx:226-264` — three actions where one is a `Link asChild`, one is conditional on `status === 'collecting'`, one is destructive close. This is the upper bound of "inline justified" before lifting into a typed factory.)
- You are inside a Card-list grid, not a DataTable cell — the generic was designed against a `(row) => ReactNode` cell signature.

**If your inline reason boils down to "I want to tweak which actions show"**, use the `hidden` flag on `RowAction<TData>` instead. `hidden: true` items don't render and adjacent dividers auto-collapse — that covers ~95% of conditional-action needs.

## Anti-patterns (with file:line of resolved cases)

- **Portal-based custom kebab** (resolved). Question Bank originally used a `<Portal><div style="position:fixed">` menu. Migrated to DS `DropdownMenu`; rule codified in `apps/exam-management/CLAUDE.md` §9 "Row Context Menu". Never re-introduce.
- **Missing `stopPropagation` on trigger.** Resolved on all 11 PCE pages. The one current outlier — `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:3091` (QB row-click is selection, not navigation, so the omission is intentional but undocumented) — flagged in actions-overlays.md §DropdownMenu "What audit can't see".
- **Buttons-as-menu-items inside a Popover** (open). Breadcrumb-overflow at `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx:112-142` is a Popover containing `<Button variant="ghost" size="sm">` rows. Loses `role="menuitem"`, arrow-key nav, `aria-haspopup="menu"`. Migrate to DropdownMenu (~15 LoC).
- **`align="start"` on a right-edge kebab.** Off-screen overflow on narrow tables; example resolved before lock-in. Always `align="end"` for row actions.

## API surface

```ts
interface RowAction<TData> {
  label: string                                // visible menu text
  icon: string                                 // FA name, no weight prefix — generic prepends `fa-light`
  onClick?: (row: TData) => void               // omit for asChild Link items (use inline pattern then)
  variant?: 'default' | 'destructive'          // destructive uses DS DropdownMenuItem variant
  disabled?: boolean                           // greys out the item
  divider?: boolean                            // renders DropdownMenuSeparator BEFORE this item
  hidden?: boolean                             // skips render; adjacent dividers auto-collapse
}

interface RowActionsProps<TData> {
  row: TData
  actions: RowAction<TData>[]
  label?: string                               // aria-label suffix, defaults to 'row'
  contentClassName?: string                    // tailwind for content width, defaults to 'w-44'
}
```

Source: `apps/pce/admin/components/data-table/row-actions.tsx:36-53`.

## Open questions / future considerations

- **`asChild` Link items.** The generic's `onClick` API doesn't cover the `<DropdownMenuItem asChild><Link>` case in `surveys/page.tsx:241-246`. Adding `href?: string` to `RowAction` (rendering `asChild Link` when present) would absorb the last inline-justified case. Defer until a second consumer needs it.
- **Per-item tooltips on `disabled`.** Faculty page disables Edit when `MOCK_LMS_ENABLED` — admin sees grey item with no explanation. A `tooltip?: string` field would let the generic wrap disabled items in `<Tip>`. Defer until Aarti calls out the discoverability gap.
- **Keyboard shortcut hints.** DropdownMenuItem accepts `shortcut` (visual only — needs sibling `<Shortcut>` to bind). The generic doesn't surface this yet. Block on first real ⌘K landing.
