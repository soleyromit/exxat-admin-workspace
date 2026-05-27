# CLAUDE.md — Exam Management

## MANDATORY: Decision files are the source of truth — read them first

**Every prompt touching assessment, QB, or any EM feature must start here:**

```
admin/docs/decisions/feature-registry.md   ← status of every feature
admin/docs/decisions/<meeting-id>.md       ← structured decisions, quotes, gaps
```

**Do NOT write a single line of implementation without first:**
1. Reading `feature-registry.md` to know what's built vs. missing
2. Reading every decision file relevant to the feature you're implementing
3. Citing the decision file + quote for every planned feature
4. Any feature with no citation = unverified, flag it explicitly

**If the decision file doesn't exist yet for a meeting, pull the raw transcript and create it before continuing.**

Decision files live at: `admin/docs/decisions/` — one per meeting, template at `_template.md`.

---

## MANDATORY: After any new Granola meeting

When a new exam-management Granola meeting happens:
1. `get_meeting_transcript` — pull the raw transcript (NOT the summary)
2. Create `admin/docs/decisions/<meeting-id>.md` using `_template.md`
3. Update `admin/docs/decisions/feature-registry.md` with any new or changed features
4. Update the meeting ID list below

---

## Granola meeting IDs — exam management decisions

Full decision files at `admin/docs/decisions/`:

- `f59cfbe4-8964-4169-af2f-d1ccd6f91c06` — Assessment creation workflows + QB design (May 19)
- `af529725-f08b-4a9e-9e6e-c4968b540338` — Assessment builder: base entities, student experience, PRD workflow (May 14) ← **REVIEW WORKFLOW defined here**
- `b68ede99-005a-44bf-aa3c-001e3753d8d8` — Assessment overview: completion status, pop quiz (May 7)
- `fb9e76c2-bc27-40d7-bc07-1d2a7e1fab0a` — AI-aided question creation + curricular assessment mapping (May 7)
- `4e1c850e-d760-4d05-81a1-a52287b9ae21` — Live monitoring, question analysis, accommodations (May 8)
- `66898189-b888-4d9a-8765-c0ebd838cc78` — Assessment PRD: accessibility, offline download, ExamSoft parity (May 21)
- `f274ade0-f47a-4d61-bbdc-1eeee5e08ca0` — Curriculum mapping, base entities, product alignment (May 8)
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
@import '@exxatdesignux/ui/globals.css';
@import "tailwindcss";
```

**Component imports:**
```ts
import { Button, ... } from '@exxatdesignux/ui'
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
