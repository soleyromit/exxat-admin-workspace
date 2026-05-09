# Data Table Semantics

**Question answered:** How do we ensure tabular data is announced as a table (with rows, columns, captions) and not as a stream of disconnected cells?

**Pattern ID:** `A11Y-PATTERN-005`
**Binds rules:** A11Y-019 (heading hierarchy); DS-008 (use DS Table, not raw `<table>` or third-party grid); WCAG 1.3.1 Info and Relationships

## The DS Table handles most of this

`Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` from `@exxat-ds/ui` render real `<table><thead><tbody><tr><th><td>` elements. Use them.

## Required additions

### 1. Caption (when not redundant)

```tsx
<Table>
  <caption className="sr-only">
    Students enrolled in Spring 2026 cohort, sortable by name, ID, email, and status.
  </caption>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

Skip the caption ONLY if a heading directly precedes the table with equivalent context (`<h2>Students — Spring 2026</h2>` then table).

### 2. Scope on header cells

`TableHead` already renders `<th>` but should explicitly carry `scope`:

```tsx
<TableHead scope="col">Name</TableHead>      {/* column header */}
<TableHead scope="row">{row.name}</TableHead> {/* row header — first cell of a row */}
```

### 3. Sortable column announcements

When a column is sortable:

```tsx
<TableHead
  scope="col"
  aria-sort={sortKey === 'name' ? sortDirection : 'none'}
>
  <button onClick={() => toggleSort('name')}>
    Name
    {sortKey === 'name' && (
      <i className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`} aria-hidden="true" />
    )}
  </button>
</TableHead>
```

Values: `none`, `ascending`, `descending`, `other`.

### 4. Selection (when row checkbox)

```tsx
<TableCell>
  <Checkbox
    checked={isSelected}
    onCheckedChange={onToggle}
    aria-label={`Select ${row.name}`}
  />
</TableCell>
```

The `aria-label` is what makes this row's checkbox distinguishable from every other row's checkbox in screen-reader output.

### 5. Empty state — announce, don't hide

```tsx
{rows.length === 0 ? (
  <TableRow>
    <TableCell colSpan={6} role="status" aria-live="polite">
      No students match these filters.
    </TableCell>
  </TableRow>
) : (
  rows.map(...)
)}
```

## Anti-patterns

- ❌ Layout `<div>` grid that "looks like" a table — no semantics; screen readers announce as a stream
- ❌ Third-party data grid (TanStack, AG-Grid) — DS rule DS-008 ban
- ❌ `<table>` for layout (banned since CSS layout exists)
- ❌ `aria-sort` value left as static (must reflect current sort state)
- ❌ Row checkboxes with shared `aria-label="Select"` (every row sounds identical)
- ❌ Sortable header that's a `<th>` only (not focusable; needs button inside or role=button + tabIndex)
- ❌ Hiding the empty state from screen readers (silent failure)

## Caption when redundant — example

```tsx
<>
  <h2 className="text-lg font-semibold">Students — Spring 2026</h2>
  <p className="text-sm text-muted-foreground">N enrolled, sortable.</p>
  <Table>
    {/* no caption needed; h2 + paragraph above provide context */}
    ...
  </Table>
</>
```

## Verification

1. NVDA / VoiceOver: announces table as "table with N rows, M columns" + caption
2. Tab into header → announces column name + sort state
3. Arrow into rows → announces "row N of M, [first column header]: [value]"
4. Each row checkbox announces its row identity uniquely
5. Sort changes → next focus on header announces new sort state

## See also

- DESIGN.md A11Y-019, DS-008
- W3C WCAG 1.3.1: https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships
- WAI Tables Tutorial: https://www.w3.org/WAI/tutorials/tables/
