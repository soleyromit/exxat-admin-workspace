---
name: exxat-mono-ids
description: Monospace typography for Exxat DS record IDs, question IDs, and system identifiers — font-mono tabular-nums, mixed subtitle lines, table meta. Use when adding or changing questionId, record id columns, header subtitles with IDs, or any copy-pasteable system key in apps/web UI.
user-invocable: true
---

# Exxat DS — monospace IDs

**Cursor rule:** `.agents/rules/exxat-mono-ids.md`  
**Handbook:** `./AGENTS.md` (§1, §13 checklist)

## Standard classes

```tsx
// Default secondary ID (table meta, list subline, inspector)
<span className="font-mono tabular-nums text-xs text-muted-foreground">{id}</span>

// ID in a page subtitle next to sans prose
<>
  <span className="font-mono tabular-nums">{questionId}</span>
  {" · V1 · Last updated just now"}
</>
```

Always include **`tabular-nums`** with **`font-mono`** so fixed-width digits align in tables and subtitles.

## MUST

1. **Every visible system ID** in product UI uses **`font-mono tabular-nums`** (plus contextual size/color).
2. **Mixed lines** — mono only on the identifier substring, not the whole sentence.
3. **Tables / lists / boards** — ID column or subline under a title: mono + usually **`text-xs text-muted-foreground`**.

## MUST NOT

- Mono on **display names**, **emails** (unless the column is explicitly “Principal ID”), **dates**, **KPI values**, or **status text**.
- Mono on **UI chrome** that is not an identifier (badges, buttons, nav labels).

## Reference implementations

| Surface | File |
|---------|------|
| Library table | `components/library-table.tsx` — `row.questionId` |
| Library list | `components/library-list-view.tsx` |
| New question subtitle | `components/new-library-item-form.tsx` — `questionId` in `PageHeader` subtitle |
| Sites record id | `components/sites-table.tsx` — `row.id` |
| OS folder tiles | `components/library-os-folder-view.tsx` |

## Review checklist

- [ ] New or changed **ID** fields use **`font-mono tabular-nums`**.
- [ ] Subtitle / description lines mono-wrap **only** the ID token.
- [ ] No mono applied to names, statuses, or numeric metrics that are not identifiers.

## See also

- `.agents/rules/exxat-person-identity-display.md` — name + email (sans, not mono for email unless ID column)
