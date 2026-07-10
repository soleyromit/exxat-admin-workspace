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

## MANDATORY: Documentation-first gate (assessment creation)

**A master spec file gates ALL assessment creation implementation.**

Check: `admin/docs/superpowers/specs/2026-06-13-assessment-creation-master-spec.md`

- **File exists** → documentation pass is complete. Implement against it. Any new Aarti/Vishaka meeting = update the master spec BEFORE resuming implementation.
- **File does not exist** → you are in a documentation pass. Complete every step below before writing a single word of architecture, refactors, or implementation.

**Documentation pass — mandatory steps in order:**

1. `get_meeting_transcript` for every meeting ID listed in this file (not summaries — raw transcripts)
2. Read PRD: `/Users/romitsoley/Downloads/Assessments PRD.docx`
3. Read all existing specs: `admin/docs/superpowers/specs/*.md`
4. Read gap analyses: `admin/docs/creation-flow-gap-analysis.md` + `admin/docs/assessment-creation-v0-requirements.md`
5. Create `admin/docs/decisions/<meeting-id>.md` for any meeting that has no decision file yet
6. Update `admin/docs/decisions/feature-registry.md` with every gap found
7. Write out every conflict between sources explicitly — which source wins and why (one line each)
8. Write the master spec to `admin/docs/superpowers/specs/YYYY-MM-DD-<feature>-master-spec.md`

**Allowed outputs during a documentation pass:** reading files, creating decision files, updating `feature-registry.md`, writing the master spec.

**Banned during a documentation pass:** architecture proposals, refactor suggestions, implementation questions, component naming, file path decisions. Any one of these before step 8 is a violation — even if it "feels like just a quick clarification."

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

- `2026-06-04-aarti-teams` — Assessment lifecycle (4-step: Create→Review→Distribute→Stats), distribution UI, monitoring, Prism coexistence (Jun 4) ← **SCOPE OVERRIDE: Review = Phase 2; file at admin/docs/decisions/2026-06-04-aarti-teams.md**

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
5. Spawn `verification-reviewer` — all current patterns in `docs/governance/verification-discipline.md`. **NEEDS-MORE blocks done claim.**
6. Grep: `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch` — any hit = violation
7. Spawn `Explore` to grep-verify every claimed change exists — never claim done from session memory (Pattern G).
8. **Evidence block on every done claim** — axe-core path or "not run", DS import file:line per new component, grep result (Pattern I).
9. **Two-tier verdict (Pattern L):** `GREENLIGHT (static)` — code analysis only / `GREENLIGHT (runtime)` — interactions.mjs ran. List what was NOT verified.

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
| `node tools/ds/source.mjs` (+ globals.css) | Need DS component list, tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term pages |
| `docs/CLAUDE-RULES.md` | Need full always/never rules, font loading, workspace config |
| `docs/watch/digest-latest.md` | P1 flag or PRD change mentioned |
