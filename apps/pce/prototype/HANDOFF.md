# PCE Post Course Evaluation: Engineering Handoff

**Source:** Monil's PRD v3.0 (March 2026), Aarti's autopilot vision (April 2026), David's data-integrity feedback (May 2026)
**Canonical prototype:** http://localhost:64592/pce-evaluation.html
**Target app:** `apps/pce/admin/` (Next.js + `@exxat/ds`)
**Phase 1 scope:** program level only, no dean-level surfaces, didactic + clinical course evaluations only

---

## 1. The product is one file

**Canonical: `pce-evaluation.html`** — this is the product. Build from this.

It contains:
- **One-time setup** (PD → Setup): LMS Integration, Course Types CRUD, Terms with offsets, Decision Admin
- **Per-term operations** (Coordinator): Autopilot dashboard, Live Monitor, Create Surveys wizard, Audit Trail
- **Authoring** (PD → Templates / Question Banks): full template builder with section/question CRUD, locked standardized banks, version pinning, longitudinal-impact warning
- **Distribution** (autopilot + per-survey detail view): real survey lifecycle visible end to end, with Day 3/7/10 reminders and email previews
- **Response** (Student): mobile shell with anonymity badge, two sections, prior-cohort feedback note
- **Review** (Faculty): grade-locked + min-N suppressed self-view, 5-term trend, themes, structured reflection, 2-sentence next-cohort note
- **Analyse** (CCC, Chair, DCE): multi-cohort trends with sparklines, faculty dossier, clinical readiness facets
- **Loop closure** (PD → CQI Log): create action, reassess, close; CAPTE 2C export
- **Adjunct**: email digest preview only (no app login per PRD)

The folder also contains `_reference/pce-autopilot.html` and `_reference/pce-interactive.html` — earlier exploratory prototypes. Do not implement from them.

---

## 2. Personas and surfaces

9 personas in PRD. Status per persona:

| # | Persona | Built? | Where in prototype | Notes |
|---|---|---|---|---|
| 1 | Dean / President | Deferred (Phase 2) | None in eval; legacy stub in interactive | PRD assumption: "no dean level product thinking yet" |
| 2 | Associate Dean | Deferred (Phase 2) | None | Same as Dean |
| 3 | **Program Director** | Built | Eval: `pd` persona | Dashboard, Templates, Banks, All Results, CQI Log |
| 4 | **Curriculum Committee Chair** | Built | Eval: `ccc` persona | Multi-cohort trends, Competency coverage matrix, Cross-course themes |
| 5 | **Department Chair** | Built | Eval: `chair` persona | Faculty roster, Faculty dossier with longitudinal scores |
| 6 | **DCE** (Director of Clinical Education) | Built | Eval: `dce` persona | Clinical dashboard, Cohort readiness facets |
| 7 | **Course Director / Faculty** | Built | Eval: `fac` persona | My results (grade-locked), Reflection, Notes for next cohort |
| 8 | **Adjunct Faculty** | Built (email-only) | Eval: `adj` persona | Email digest preview, no app login per PRD |
| 9 | **Program Coordinator** | Built | Eval: `coord` persona | Setup wizard, Live monitor, Audit trail |
| 10 | **Student** | Built | Eval: `stu` persona | Mobile shell with anonymity badge, two-section form, prior cohort note |

**Persona switching** happens via the topbar pill (or the Demo Controls panel, bottom-right of every screen). Persona changes the visible nav and default landing. Cross-persona state is shared (a student submitting bumps coordinator completion, etc.).

---

## 3. Functional requirements coverage (FR-by-FR)

| FR | Description | Built in eval prototype? | Screen / Component |
|---|---|---|---|
| FR-01 | Survey template builder | Yes | `renderTemplateBuilder()` — sections, drag reorder, pull from bank, preview, save with version |
| FR-02 | Anonymous submission | Yes | `anon-badge` in student survey + welcome screen |
| FR-03 | Min response threshold (≥5) | Yes | `fac-suppress` block in `renderFacResults()`; `minNFail` flag on COURSES |
| FR-04 | Two-section survey | Yes | `renderStudentSurvey()` with section tabs |
| FR-05 | Standardized question banks (locked) | Yes | `renderQuestionBanks()` with locked badge; banks not editable in builder |
| FR-06 | Grade-lock timing | Yes | `gradeWindow` state on COURSES; `fac-locked` block when not `grades-submitted` |
| FR-07 | Role-based access (7-9 tiers) | Partial | 8 personas implemented; permission matrix not enforced server-side (frontend only) |
| FR-08 | Auto-trigger on course close | Yes (UI) | Wizard step 4 hands off to autopilot model; actual scheduling in autopilot file |
| FR-09 | Day 3/7/10 reminder cadence | Yes | Audit trail surfaces these events per course; UI shown in wizard step 4 |
| FR-10 | Live completion dashboard | Yes | `renderCoordMonitor()` |
| FR-11 | Faculty self-view (own only, no peer) | Yes | `renderFacResults()` |
| FR-12 | PD all-results dashboard | Yes | `renderPdDashboard()` + `renderAllResults()` |
| FR-13 | Longitudinal trends (4+ terms) | Yes | `renderFacTrendSvg()` 5-term chart on faculty results; CCC trends grid |
| FR-14 | CQI action log (Result→Action→Reassess) | Yes | `renderCqiLog()` + create/reassess flows |
| FR-15 | Accreditation-mapped export (CAPTE 2C) | Yes | `exportAccreditationReport()` CSV |
| FR-16 | Faculty feedback loop (2-sentence note) | Yes | `renderFacFeedback()`; surfaces in next-cohort student survey welcome |
| FR-17 | Dean aggregate view | Deferred | Phase 2 per PRD |
| FR-18 | Structured faculty self-reflection | Yes | `renderFacReflection()` 3-question form |
| FR-28 | Unified setup wizard | Yes | `renderCoordWizard()` 4 steps |
| FR-29 | Audit trail export | Yes | `exportAudit()` |

---

## 4. Data model (entities, relationships, key fields)

```
QuestionBank (locked at university level)
  ├ bankId: 'didactic' | 'clinical'
  ├ name: string
  ├ sections: { course: SectionDef, faculty: SectionDef }
  └ SectionDef.questions: [Question]
    └ Question { id, text, type: 'likert'|'open', category }

Template
  ├ id, name, version (incremented on save)
  ├ status: 'draft' | 'active'
  ├ boundCourseTypes: [courseTypeId]   // determines which courses use it
  ├ updatedAt, updatedBy
  └ sections: [
      { name, type: 'course'|'faculty',
        questions: [QuestionRef { bankId, sectionId, questionId }]
      }
    ]

CourseType
  └ id, name, color, badge

Term
  ├ id, name, startDate, endDate, status: 'active'|'upcoming'|'closed'
  └ (Survey scheduling anchored to endDate; defaults: -14d open, +7d close)

Course
  ├ id, code, name, typeId, termId
  ├ instructor, enrolled, completion (%)
  ├ avg, prev (avg from prior term)
  ├ gradeWindow: 'open' | 'survey-open' | 'survey-closed' | 'grades-submitted'
  └ minNFail (boolean — set when responseCount < 5 even after close)

Survey (derived)
  ├ courseId, templateId, templateVersion (pinned at survey open)
  ├ openDate, closeDate (computed from term + offsets)
  └ status, completion

Response (anonymous, never stored with PII)
  ├ surveyId, sectionIdx, questionId
  └ value (1-5) | text

Reflection (FR-18)
  ├ courseId, facultyId, termId
  ├ q1: 'what worked'
  ├ q2: 'what surprised you'
  ├ q3: 'one change for next term'
  └ savedAt

FeedbackNote (FR-16, 2-sentence next-cohort message)
  ├ courseCode, facultyName, termId, note, postedAt
  └ Visible to: students taking the next cycle's survey for the same course code

CQIAction (FR-14, CAPTE 2C evidence chain)
  ├ id, courseCode, courseName, termId
  ├ issue: string (what the data showed)
  ├ action: string (what change you made)
  ├ owner, accreditationStandard ('CAPTE 2C' | 'ACOTE B.7' | 'CCNE IV-A' | 'CACREP 4-G')
  ├ status: 'open' | 'reassessment-due' | 'closed'
  ├ baselineScore, currentScore
  ├ reassessTermId  // when to reassess
  ├ reassessedAt, outcome  // populated on close
  └ createdAt

Competency
  ├ id, code (e.g. 'CAPTE 7D27'), name, area
  └ Mapped to courses via COURSE_COMPETENCIES[courseId] = [competencyId]

FacultyRoster (used by Dept Chair view)
  └ id, name, department, rank, hireYear

FacultyHistory[facultyId] = [
  { termId, course, score, n }   // n=responseCount; score=null if min-N suppressed
]
```

---

## 5. State machines (the three lifecycles dev must model precisely)

### 5.1 Survey grade-window lifecycle (FR-06)
```
[course in session] open
       │
       │ (term.endDate − 14 days)
       ▼
[survey-open] survey-open ─── reminders fire D3/D7/D10 ─── students respond
       │
       │ (term.endDate + 7 days)
       ▼
[survey-closed] survey-closed
       │
       │ (faculty submits final grades to SIS; signal received)
       ▼
[grades-submitted] grades-submitted
       │
       ├── responseCount < 5 → results SUPPRESSED to faculty (FR-03)
       └── responseCount ≥ 5 → results UNLOCKED to faculty
                                    │
                                    │ faculty completes reflection (FR-18)
                                    ▼
                                [reflection-saved] → faculty can post next-cohort note (FR-16)
```

### 5.2 CQI Action lifecycle (FR-14, CAPTE 2C)
```
[result triggers concern]
       │
       │ PD creates action linking source course/result + action plan + reassess term
       ▼
[open]
       │
       │ time advances; reassessTerm becomes active
       ▼
[reassessment-due]
       │
       │ PD adds outcome narrative + current score
       ▼
[closed]   ──→ part of CAPTE 2C export
```

### 5.3 Template version lifecycle (FR-01 + David's data-integrity concern)
```
[active v1]
       │
       │ PD edits → builder shows "Comparability impact" panel
       │   - additive only → safe (purple), longitudinal trend preserved
       │   - removes existing question → BREAKS comparability (amber warning)
       ▼
[active v2]
       │
       │ Past surveys remain pinned to v1 (templateVersion captured at survey open)
       │ Future surveys use v2
       ▼
[Trend chart for v1-pinned questions still works; new v2 questions start fresh trend]
```
**Critical:** templateVersion must be captured at survey open and never change. Engineering should snapshot, not reference.

---

## 6. API surface engineering needs

### Templates
- `GET /api/templates?status=active` → list
- `GET /api/templates/:id` → with sections, version
- `POST /api/templates` → create draft
- `PATCH /api/templates/:id` → save (increments version)
- `GET /api/question-banks/:bankId` → standardized questions (read-only at university level)
- `POST /api/templates/:id/bindings` → bind/unbind course types (warn on conflict)

### Surveys
- `POST /api/surveys/wizard` → create batch (returns survey IDs queued for autopilot)
- `GET /api/surveys?termId=&status=` → live monitor
- `POST /api/surveys/:id/disable` → coordinator override (writes to disabledSurveyIds)
- `POST /api/surveys/:id/grades-submitted` → unlock faculty results (SIS webhook usually)

### Responses (anonymous)
- `POST /api/surveys/:id/responses` → submit (no auth context; magic-token from email)
- `GET /api/surveys/:id/results?facultyId=...` → role-gated; min-N enforced server-side

### Reflections + Notes
- `POST /api/reflections` (facultyId, courseId, q1, q2, q3)
- `POST /api/feedback-notes` (courseCode, termId, note, max 320 chars)
- `GET /api/feedback-notes/latest?courseCode=` → for student survey welcome

### CQI
- `GET /api/cqi-actions?status=` → list with filter
- `POST /api/cqi-actions` → create (sourceResultId, issue, action, owner, reassessTermId)
- `PATCH /api/cqi-actions/:id/reassess` → close with outcome
- `GET /api/cqi-actions/export?format=csv` → CAPTE 2C evidence

### Audit + Analytics
- `GET /api/audit?termId=&from=&to=` → event log (paginated)
- `GET /api/analytics/courses?termId=&type=&percentile=` → leaderboard
- `GET /api/analytics/faculty/:id/longitudinal` → cross-term performance for dossier
- `GET /api/analytics/competency-coverage?termId=` → CCC matrix

---

## 7. Integrations (what must exist before dev starts)

| Integration | Purpose | Phase |
|---|---|---|
| **LMS** (Canvas LTI v1.3) | Course rosters, instructor list, term schedules | Phase 1 (required before January cohort) |
| **SIS grade-lock signal** | Webhook when faculty submits final grades; unlocks faculty results | Phase 1 |
| **Email service** | Survey invitations, Day 3/7/10 reminders, faculty result-ready, adjunct digest | Phase 1 |
| **SSO** (institution credentials) | Auth for PD, Coordinator, Faculty, CCC, Chair, DCE | Phase 1 |
| **Magic-token email** | Anonymous student survey access (no SSO required for response) | Phase 1 |
| **Blackboard / D2L** | Alternative LMS support | Phase 2 |
| **Exxat clinical data API** | Cohort correlation (didactic score → clinical competency) | Phase 2 |
| **Anthology import** | Migration path for historical PDF/CSV evaluation data | Phase 2 (OQ-06) |

---

## 8. Design tokens used

All values are oklch (CSS custom properties). The brainstorm prototype uses approximate Lavender brand tokens; the production app should pull these from `@exxat-ds/ui/theme.css` (`--brand-color`, `--brand-tint`, `--foreground`, etc.).

| Prototype token | Production equivalent |
|---|---|
| `--brand-color` | `var(--brand-color)` from DS |
| `--brand-tint` | `var(--brand-tint)` |
| `--foreground` `--muted-fg` `--muted` | DS semantic tokens |
| `--c-amber` `--c-green` `--c-indigo` | DS chart tokens (`--chart-4`, `--chart-2`, `--chart-1`) |
| `--persona-pd` `--persona-coord` `--persona-fac` `--persona-stu` | New tokens, derive from `--chart-*` |
| `--destructive` `--destructive-fg` | DS semantic tokens |

No hex codes or rgb anywhere in the prototypes.

---

## 9. Component → @exxat/ds primitive mapping

| Prototype element | DS component to use in production |
|---|---|
| `.btn` variants | `Button` with `variant` (default, outline, ghost, destructive) and `size` |
| `.badge` variants | `Badge` with custom color via `style` (no separate primitive needed) |
| `.modal` overlay | `Dialog` (not Sheet) for confirm flows; `Sheet` (right side) for drawer flows like Setup Wizard if preferred |
| `.input`, `.select`, `.textarea` | `Input`, `Select`, `Textarea`, all wrapped in `Field` |
| Persona switcher | `DropdownMenu` triggered from topbar pill |
| Setup wizard stepper | Custom; consider `Tabs` with disabled state, or build a Stepper |
| Faculty results course list | `DataTable` with row click navigation |
| CQI action rows | `Card` per row, NOT `DataTable` (free-form content) |
| Student mobile shell | Standalone CSS shell; the form fields use `Field` + custom Likert (no DS Likert primitive exists) |
| Audit trail | Vertical event list, no DS primitive needed |
| Trend SVG charts | `Chart` from DS (Recharts under the hood) |
| Toast | `Sonner` (already in DS) |

**Banner / system messages:** per CLAUDE.md, use `LocalBanner` / `SystemBanner`, **not** Sonner toast for product feedback. The prototype uses inline toast for prototype convenience; production should use banners except for transient confirmations.

---

## 10. Open product questions (block engineering at the points called out)

| ID | Question | Blocker for | Owner |
|---|---|---|---|
| OQ-01 | Final question bank composition for didactic vs clinical | Template builder content; can stub initially | Product + CX |
| OQ-02 | Min-N threshold (currently 5) | Suppression rule; set as constant for v1 | Product + Legal |
| OQ-03 | Grade-lock signal mechanism (SIS webhook vs manual confirm) | FR-06 implementation | Engineering + IT |
| OQ-04 | Whether program admin can add supplemental questions to a locked bank template | Template builder UX | Product + CX |
| OQ-05 | Dean view scope (one university dashboard or per-college) | Phase 2; not blocking Phase 1 | Product |
| OQ-06 | Anthology data migration path | Phase 2; not blocking Phase 1 | Engineering |
| OQ-07 | FERPA legality of cohort-level didactic-clinical correlation | Phase 2 cohort correlation feature | Product + Legal |
| OQ-08 | Persistent token mechanism for alumni surveys | Phase 2 alumni feature | Engineering |
| OQ-09 | Faculty opt-out from receiving results (union agreements) | Faculty self-view edge case | Product + CX |
| OQ-10 | Adjuncts shared across multiple programs (one digest or one per program) | Adjunct email digest implementation | Product |

---

## 11. Known prototype limitations (and what they mean for dev)

| Limitation | Implication |
|---|---|
| All data is in-memory; refresh resets state | Dev must build real persistence; no migration from prototype state |
| `Math.random()` used for question response distributions | Distributions are illustrative only. Real data comes from `Response` table aggregation. |
| Trend lines are synthesized from `prev` and `avg` via sin/cos | Real trends come from historical Survey + Response queries |
| LMS and SIS integrations are toggled in the Demo Controls panel | Real integrations are nightly LMS sync + SIS webhook on grade submission |
| Templates are not actually pinned to surveys in the prototype | Production must snapshot template at survey open, store templateVersion on Survey row |
| Reminder cadence is shown but not actually fired | Real cron / queue worker required |
| Adjunct email is rendered as a webpage preview | Real implementation: email template (MJML or similar) sent via email service |
| Cross-prototype navigation is hardcoded URLs | Production has one app; the three prototypes were exploratory variants |

---

## 12. Phase 1 scope, in priority order

1. **LMS integration + course/roster sync** (must work before any cohort uses the product)
2. **Question banks seeded** (Didactic + Clinical, locked, per OQ-01 final list)
3. **Template builder + version pinning** (FR-01, FR-05) — including David's longitudinal-impact warning
4. **Setup wizard** (FR-28) — coordinator's primary flow
5. **Student response form + anonymity + min-N suppression** (FR-02, FR-03, FR-04)
6. **Grade-lock + faculty result unlock** (FR-06, FR-11)
7. **Reflection + feedback note loop** (FR-16, FR-18)
8. **Live monitor + reminder cadence** (FR-09, FR-10)
9. **CQI action log + CAPTE export** (FR-14, FR-15)
10. **PD dashboard, All Results, Faculty roster, CCC trends, DCE clinical view** (FR-12, FR-13)
11. **Audit trail export** (FR-29)
12. **Adjunct email digest template**

---

## 13. Files in this folder

| File | Purpose |
|---|---|
| `pce-evaluation.html` | **Canonical prototype.** Build the product from this. |
| `HANDOFF.md` | This document |
| `_reference/pce-autopilot.html` | Earlier exploratory prototype. Reference only. |
| `_reference/pce-interactive.html` | Earlier exploratory prototype (manual-flow mental model, replaced). Reference only. |

---

## 14. Operational lifecycle: how the product actually runs

The eval prototype models three time horizons. Engineering should preserve this separation.

**Horizon 1: One-time setup (PD owns)**
- LMS Integration: Canvas LTI v1.3, nightly sync of course rosters, instructors, term schedules
- Course Types: e.g., Didactic, Clinical Rotation, Lab, Seminar (CRUD)
- Templates: bind 1:1 with course type, pull questions from locked banks, version pinned at survey open
- Terms: start/end dates, with offsets (default open = end-14d, close = end+7d)
- Decision Admin: assignee + notification preferences (week-before, day-of, low-completion threshold)

**Horizon 2: Per-term operation (Coordinator owns; autopilot does the work)**
- **Create:** the Setup Wizard (now labeled "Create surveys") materializes survey instances at start of term. Each survey snapshots its template version. Coordinator pushes to autopilot in Step 4.
- **Distribute:** autopilot opens surveys 14 days before term end, sends invitation emails via magic-token (anonymous, no SSO). Day 3 + Day 7 reminders fire to non-completers only. Day 10 alert if completion < threshold.
- **Monitor:** Coordinator's Autopilot dashboard shows status. Live Monitor shows real-time completion. Per-survey detail view shows complete lifecycle for any single survey, with email previews for everything sent.
- **Close:** survey closes 7 days after term end. Faculty results stay locked until SIS confirms grades submitted.

**Horizon 3: Closure → analyse → CQI (multi-persona)**
- Faculty unlock results, see module breakdown + 5-term trend + themes, complete required reflection, optionally post 2-sentence next-cohort note
- PD reviews aggregate, drills into per-question PRISM distributions, creates CQI actions for at-risk courses (avg < 3.7)
- CCC reads multi-cohort trends + competency coverage matrix
- Chair pulls faculty dossiers (longitudinal scores with N-counts + min-N suppression honored)
- DCE checks cohort readiness facets per clinical rotation
- Adjunct receives an email digest (only) of their module's feedback
- CQI actions surface as "due for reassessment" the next term, get closed with outcome → CAPTE 2C export

The per-survey detail view (full screen, accessible from any course list) is the unifying screen that makes this lifecycle visible for any single survey from creation through closure.
