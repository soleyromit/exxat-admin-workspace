# Product Conventions

Business rules, data formatting, state management, and domain-specific standards for Exxat One School.

---

## Program Context

The app always operates within a single selected program (PT, Nursing, OT). The active program is chosen via the Team Switcher in the sidebar.

### Rules

- All pages, data, filters, and views are scoped to the selected program.
- **Discipline is never shown** — it is implicit from the program selection.
- **Specialization is shown** when relevant (e.g., within PT: Orthopedics, Neurology, Pediatrics).
- All data tables, charts, and reports display data for the selected program only.
- The sidebar dynamically filters nav items via `programExclusions` in the Zustand store.

### What to Show vs Hide

| Element | Show? | Reason |
|---------|-------|--------|
| Discipline column/filter | Never | Redundant — implied by program |
| Specialization column | When needed | Differentiates within program |
| Specialization filter | When needed | Narrows results within program |
| Program name in header | Optional | Context badge (e.g., "PT Program") |

### Example

```tsx
// ✅ CORRECT — No discipline
<FilterBar filterConfigs={[
  { key: "specialization", label: "Specialization", options: ["Orthopedics", "Neurology"] },
  { key: "status", label: "Status", options: ["Active", "Pending"] },
]} />

// ❌ WRONG — Discipline filter is redundant
<FilterBar filterConfigs={[
  { key: "discipline", label: "Discipline", options: ["PT", "Nursing", "OT"] },
]} />
```

---

## Date Formats

All dates use **MM/DD/YYYY** format.

| Format | Usage |
|--------|-------|
| `03/15/2024` | Standard date display |
| `03/15/2024 - 05/10/2024` | Date range |
| `Mar 15 – May 10, 2024` | Short range (space-constrained) |

```tsx
const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
```

---

## State Management — Zustand

Use `useAppStore` for navigation and global state; keep component-specific state local.

```tsx
const currentPage = useAppStore((state) => state.currentPage);
const navigateToPage = useAppStore((state) => state.navigateToPage);
```

- Use store selectors (subscribe to specific slices).
- Navigation actions live in the store.
- Program selection, sidebar state, and selected IDs are global.

---

## Status & Badge Conventions

### Status Indicators

Use the `Badge` component with semantic color tokens.

| Status | Color Token |
|--------|------------|
| Active / Confirmed | `chart-2` (green) |
| Pending | `chart-4` (yellow) |
| Error / Rejected | `destructive` |
| Inactive / Closed | `muted` |

### Partner Tiers

Gold, Silver, Bronze — use text labels + color indicators.

### Priority Levels

| Priority | Visual |
|----------|--------|
| High | `destructive` + text "High" |
| Medium | `chart-4` + text "Medium" |
| Low | `muted` + text "Low" |

### Consortium

Display as simple "Consortium" text — no specific names.

---

## Data Table Conventions

### Specialization Column

- Render as **plain text** (`font-medium text-base`).
- Never use Badge/chip wrappers in table cells.
- FilterBar may use chip UI for active filter pills — this rule is for cells only.

### Link Styling in Tables

- Use `data-table-clickable` class or `text-chart-1`.
- Hover: blue color with underline and opacity change.
- Never use non-theme colors for links.

### Column Pinning

For tables with 8+ columns:
- Left pin: Identifier columns (ID, Name).
- Right pin: Action/Status columns.
- Max: 2 left + 2 right.

---

## Performance

- `React.memo` for expensive components.
- `useCallback` for event handlers passed as props.
- `React.lazy` + `Suspense` for heavy components.
- Predefined CSS class objects to avoid inline style churn.

---

## Error Handling

- Components handle missing data gracefully.
- Error boundaries around component trees.
- Skeleton loading states during data fetch.
- Clear error messages and success notifications (via `sonner` toasts).
