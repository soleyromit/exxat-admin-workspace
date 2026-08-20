---
name: exxat-table-column-cells
description: Pick the correct DataTable cell primitive for each data point — person avatar column, status badge, ProgressCell, filters. Use when adding or changing ColumnDef, hub table columns, columns-showcase, or when author/status/progress columns use plain text instead of DS cells.
user-invocable: true
---

# Exxat DS — table column cells

**Pattern doc:** `docs/exxat-ds/table-column-cells-pattern.md`  
**Rule:** `.agents/rules/exxat-table-column-cells.md`  
**Live catalog:** `components/columns-showcase.tsx` (`/columns`)

## Quick router (data point → import)

| Data point | Cell / compose |
|------------|----------------|
| One person (author, owner, student) | `AvatarInitials` + name + email — **not** plain text, **not** `PeopleAvatarRailCell` |
| Multiple people | `PeopleAvatarRailCell` |
| Status | `ListHubStatusBadge` + `lib/list-status-badges.ts` |
| Type / kind (non-status) | `PillCell` |
| Tags | `TagListCell` |
| Difficulty / ordinal | `SignalBarsCell` |
| Published / boolean | `BooleanToggleCell` |
| Progress % | `ProgressCell` |
| Rating | `RatingCell` |
| Money | `CurrencyCell` |
| Count | `NumericCell` |
| Files | `AttachmentCountCell` |
| URL | `ExternalLinkCell` |
| Recency | `RelativeTimeCell` |
| Absolute date | `formatDateUS` + `tabular-nums` |
| Record ID (secondary line) | `font-mono tabular-nums` |
| Row ⋯ actions | `RowActionsCell<TRow>` |

All named cells: `@/components/data-views`.

## Person column checklist

- [ ] Dedicated **Person / Author / Owner** column uses **`AvatarInitials`** (size-8 typical in tables).
- [ ] **Name** = `text-sm font-medium`; **email** = `text-xs text-muted-foreground` with optional `mailto:`.
- [ ] **Multiple** assignees use **`PeopleAvatarRailCell`**, not repeated person columns.
- [ ] Board/dense surfaces may omit email; table identity columns **include** email when available.

## Filter checklist

- [ ] Each column sets **`cellKind`** — filter pill icon + type come from preset when `filter` is partial.
- [ ] Person columns use **`cellKind: "person"`** / **`people-rail`** — options come from **`filterFieldContext`**, not hand-written lists.
- [ ] Rating / status / progress filters use **`options[].node`** for rich picker previews when helpful.
- [ ] Status / enum columns use **`filter: { options }`** when values are not covered by preset alone.
- [ ] Toolbar chips + Properties drawer both use **`resolveColumnFilter`** — do not gate chips on explicit `col.filter` only.

## Anti-pattern scan

- [ ] No inline `Intl.NumberFormat`, star maps, or custom overflow menus in `cell:`.
- [ ] No raw `Badge` + `uppercase` for status.
- [ ] No `font-mono` on person names or emails.

## References

| Surface | File |
|---------|------|
| Person + ID + status catalog | `components/columns-showcase.tsx` |
| Rule demo (cellKind + filters) | `components/column-types-rule-demo-client.tsx` (`/column-types-demo`) |
| Production author column | `components/library-table.tsx` → `buildLibraryColumns` |
| Filter runtime | `packages/ui/src/lib/column-filter-context.ts` |
| Primitives | `components/data-views/table-cells.tsx` |

## See also

- `.agents/skills/exxat-token-economy/SKILL.md` §3
- `.agents/skills/exxat-mono-ids/SKILL.md`
- `.agents/rules/exxat-person-identity-display.md`
