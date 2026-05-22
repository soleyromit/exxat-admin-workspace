# CLAUDE.md — PCE (Practice/Clinical Experience)

## Sequential Design Protocol (full spec: `docs/governance/design-review-protocol.md`)

**Before any JSX — Gate 1:**
1. `query_granola_meetings` for the entity/feature → `get_meeting_transcript` for each hit — extract decisions, scope constraints, UX directives
2. Read `apps/pce/docs/patterns/pce-ui-patterns.md` + `docs/governance/design-anti-patterns.md` + `docs/governance/component-consistency.md`
3. Spawn `ds-adoption-reviewer` for any new component file

**After any UI-touching change — Gate 2:**
1. Self-review: `component-consistency.md §10` checklist (10 items)
2. Transcript alignment: implementation vs Gate 1 transcript decisions (✅ match / ⚠ assumption / ❌ contradiction)
3. Spawn `compliance-reviewer` — WCAG 2.1 AA + FERPA + **HIPAA** (PCE-specific: clinical response exposure). **NEEDS-MORE blocks done claim.**
4. Spawn `state-review` for list/form/async pages. **NEEDS-MORE blocks done claim.**
5. Spawn `verification-reviewer` — Patterns A-F. **NEEDS-MORE blocks done claim.**
6. Grep: `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch` — any hit = violation
7. Self-reflection: 3-5 bullets (what went well / mistakes / what to check next time)

**If a P1 flag or PRD change is mentioned:** read `docs/watch/digest-latest.md`

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
| `docs/governance/design-review-protocol.md` | **Any UI work** — full sequential protocol |
| `apps/pce/docs/patterns/pce-ui-patterns.md` | Before writing any UI component |
| `docs/governance/design-anti-patterns.md` | Before any UI component — banned pattern blacklist |
| `docs/governance/component-consistency.md` | DataTable, header, sheet, dialog governance |
| `docs/CLAUDE-DS-REFERENCE.md` | Need DS component list, tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term pages |
| `docs/CLAUDE-RULES.md` | Scaffolding new app, full always/never rules, font loading |
| `docs/watch/digest-latest.md` | P1 flag or PRD change mentioned |
