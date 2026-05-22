# CLAUDE.md — Exam Management

## MANDATORY: Before writing any implementation plan

**Pull raw Granola transcripts first. No exceptions.**

Summaries and memory files lose specifics. Option locking, K-type questions, instructions pages, download windows — these were all in raw transcripts and in no summary. Plans written from summaries generate rework.

1. `query_granola_meetings` — find which meetings are relevant (discovery only, not the source)
2. `get_meeting_transcript` for every relevant meeting — read the actual words
3. Cross-reference each planned feature against the raw transcripts before writing a single task
4. **Walk the actual code of every entity mentioned** — after reading, open the file and verify each requirement is implemented. "I read it and noted it" ≠ "the code reflects it." Rationale on McqOption, single objective, per-option True/False rationale were all in the transcripts and all missed because the code was never checked against what was said.

**Relevant meeting IDs for Exam Management (pull these first for any assessment/QB feature):**
- `f59cfbe4` — Assessment creation workflows and question bank design (May 19)
- `af529725` — Assessment builder: base entities, student experience, PRD workflow (May 14)
- `b68ede99` — Assessment overview design: completion status, workflow, pop quiz (May 7)
- `fb9e76c2` — AI-aided question creation and curricular assessment mapping (May 7)
- `4e1c850e` — Live monitoring, question analysis, accommodations with Aarti (May 8)
- `66898189` — Assessment PRD: accessibility, offline exam download, ExamSoft parity (May 21)
- `f274ade0` — Curriculum mapping, base entities, product alignment: Vishaka + Aarti (May 8)

Add new meeting IDs here as they happen.

---

## Sequential Design Protocol (full spec: `docs/governance/design-review-protocol.md`)

**Before any JSX — Gate 1:**
1. `query_granola_meetings` for the entity/feature → `get_meeting_transcript` for each hit — extract decisions, scope constraints, UX directives. Use the meeting IDs above as starting points.
2. Read `apps/exam-management/docs/patterns/ui-patterns.md` + `docs/governance/design-anti-patterns.md` + `docs/governance/component-consistency.md`
3. Spawn `ds-adoption-reviewer` for any new component file

**After any UI-touching change — Gate 2:**
1. Self-review: `component-consistency.md §10` checklist (10 items)
2. Transcript alignment: implementation vs Gate 1 transcript decisions (✅ match / ⚠ assumption / ❌ contradiction)
3. Spawn `compliance-reviewer` — WCAG 2.1 AA + FERPA. **NEEDS-MORE blocks done claim.**
4. Spawn `state-review` for list/form/async pages. **NEEDS-MORE blocks done claim.**
5. Spawn `verification-reviewer` — Patterns A-F. **NEEDS-MORE blocks done claim.**
6. Grep: `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch` — any hit = violation
7. Self-reflection: 3-5 bullets (what went well / mistakes / what to check next time)

**If a P1 flag or PRD change is mentioned:** read `docs/watch/digest-latest.md`

---

## Product identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | @exxat/exam-management-admin | 3001 | apps/exam-management/admin/ |
| Assessment Taker | @exxat/exam-management-student (Vite) | 5174 | apps/exam-management/assessment-taker/ |
| Student (Next) | @exxat/exam-management-student | 3002 | apps/exam-management/student/ |

**Active build:** Question Bank + Assessment Taker UI pass.
**Design reference:** https://www.magicpatterns.com/c/kq8sem88owbpxfzmopj8in/preview

---

## Assessment-taker DS exception

`assessment-taker/` is student-facing but uses **Admin DS** (`@exxat/ds`), not studentUX. Reason: studentUX has version-pinned Radix imports, a TS conflict on Badge's `style` prop, and Tailwind v4-only CSS that silently drops utilities in v3 apps.

**Switch-back:** when studentUX resolves those issues, swap `@exxat/ds/packages/ui/src` → `@exxat/student/components/ui/*`. Config aliases are already in place for a search-and-replace.

Config anchors: `vite.config.ts`, `tsconfig.json`, `src/index.css` (theme.css → studentUX globals), `index.html` (theme-prism → theme-rose).

---

## Admin app imports

**globals.css:**
```css
@import '../../../../exxat-ds/packages/ui/src/theme.css';
@import "tailwindcss";
@source '../../../../exxat-ds/packages/ui/src/**/*.{ts,tsx}';
```

**next.config.ts webpack aliases:**
```ts
'@exxat/ds'      → path.resolve(__dirname, '../../../exxat-ds')
'@exxat/student' → path.resolve(__dirname, '../../../studentUX/src')
```

**layout.tsx:** `<html lang="en" className="theme-one">` + Typekit + FA Kit (see `docs/CLAUDE-RULES.md` §Font loading)

---

## Already built components

```
components/app-sidebar.tsx        — main nav sidebar
components/data-table/            — vendored canonical DataTable (5 files)
components/data-table/row-actions.tsx — generic RowActions pattern
components/key-metrics/           — vendored KeyMetrics
components/empty-state.tsx        — zero-data panel
components/page-header.tsx        — page header + actions
components/site-header.tsx        — top application header
components/qb/badges.tsx          — QB status/type/diff/blooms badges
lib/qb-types.ts                   — QB TypeScript types
lib/qb-mock-data.ts               — QB mock data
lib/student-mock-data.ts          — student entity mock data
app/(app)/students/               — student list + detail (4 tabs)
```

---

## 10. Workspace Doc Map (lazy-load — read only when relevant)

| Doc | Read when |
|---|---|
| `docs/governance/design-review-protocol.md` | **Any UI work** — full sequential protocol |
| `apps/exam-management/docs/patterns/ui-patterns.md` | Before writing any UI component — contains full canonical component map |
| `docs/governance/design-anti-patterns.md` | Before any UI component — banned pattern blacklist |
| `docs/governance/component-consistency.md` | DataTable, header, sheet, dialog governance |
| `docs/CLAUDE-DS-REFERENCE.md` | Need DS component list, tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term pages |
| `docs/CLAUDE-RULES.md` | Need full always/never rules, font loading, workspace config |
| `docs/watch/digest-latest.md` | P1 flag or PRD change mentioned |
