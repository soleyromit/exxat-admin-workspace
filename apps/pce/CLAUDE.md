# CLAUDE.md — PCE (Practice/Clinical Experience)

## When to load pattern docs (lazy — do NOT load at session start)

- **Before writing any UI component:** read `apps/pce/docs/patterns/pce-ui-patterns.md` — UI patterns, DS map, WCAG, FERPA, HIPAA rules.
- **If a P1 flag or PRD change is mentioned:** read `docs/watch/digest-latest.md`
- **After any UI-touching change:** run `compliance-reviewer` alongside `verification-reviewer`

---

## Product identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | @exxat/pce-admin | 3005 | apps/pce/admin/ |
| Student | @exxat/pce-student | 3006 | apps/pce/student/ |

**Status:** Active — 11 entity routes shipped under `app/(app)/admin/`.

**Admin imports:** `@import '../../../../exxat-ds/packages/ui/src/theme.css'` · `<html className="theme-one">` · webpack alias `@exxat/ds` → `../../../exxat-ds`

---

## Already vendored

- `components/data-table/` — canonical DataTable (5 files + 3 PCE extensions: `defaultGroupBy`, `groupLabels`, `groupOrder`). Banned: raw `<Table>` in product code.
- `components/key-metrics/` — canonical KeyMetrics. `useAskLeo`/`AskLeoShortcutKbds` stubbed locally until PCE adopts Ask Leo provider.
- `components/table-properties/types.ts`, `lib/editable-target.ts`, `lib/row-height.ts` — DataTable deps.

## Already built

- `components/command-palette.tsx` — ⌘K / Ctrl+K navigator. 4 groups: Surveys, Templates, Admin (11 entities), Pages. Mounted via `<CommandPaletteProvider>` in `app/(app)/layout.tsx`. **When adding a new navigable surface, register it here.**
- `components/app-sidebar.tsx` — main nav + Search ⌘K affordance

---

## 10. Workspace Doc Map (lazy-load — read only when relevant)

| Doc | Read when |
|---|---|
| `apps/pce/docs/patterns/pce-ui-patterns.md` | Before writing any UI component |
| `docs/CLAUDE-DS-REFERENCE.md` | Need DS component list, tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term pages |
| `docs/CLAUDE-RULES.md` | Scaffolding new app, full always/never rules, font loading |
| `docs/watch/digest-latest.md` | P1 flag or PRD change mentioned |
