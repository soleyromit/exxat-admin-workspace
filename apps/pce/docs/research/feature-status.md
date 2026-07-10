# PCE Feature Status — Aarti Jun 10 Brief
**Source:** `docs/research/meetings/2026-06-10-course-evaluation-aarti-brief.md`
**Last updated:** 2026-06-15 · Phase 3 complete

Status key: ✅ Done · 🟡 Partial · ❌ Missing

---

## Setup Zone

| Feature | Status | File(s) | What's there | What's missing |
|---|---|---|---|---|
| Terms — start/end dates | ✅ Done | `app/(app)/admin/terms/page.tsx` | DatePicker for start/end on each term | — |
| Terms — "Enable for evaluation" toggle | ✅ Done | `app/(app)/admin/terms/page.tsx` | ToggleSwitch per row; enabledCount in description; new terms default to false | — |
| Email Templates — standalone page | ✅ Done | `app/(app)/admin/email-templates/page.tsx` | Initial + Reminder tabs; subject + body editor; `{{activity_dashboard_url}}` chip + both CTAs in both template bodies | — |
| Reminder Schedule | ✅ Done | `app/(app)/admin/reminder-schedule/page.tsx` | Interval picker anchored to term end date | — |
| Survey Templates — basic CRUD | ✅ Done | `app/(app)/templates/page.tsx` + `components/pce/templates-hub.tsx` | Template list, create, delete | — |
| Survey Templates — Section 1 (course) / Section 2 (faculty) model | ✅ Done | `app/(app)/templates/[id]/page.tsx` | Two-zone CE builder: "1 Course Questions" (course_content sections) + "2 Faculty Questions" (faculty role sections) | — |
| Survey Templates — Faculty role variants | ✅ Done | `app/(app)/templates/[id]/page.tsx` | Role tabs within Zone 2: Course Instructor / Course Coordinator / Teaching Assistant / Lab Instructor / Course Director; each role has its own sections + questions | — |
| Survey Templates — Import from document | ✅ Done | `app/(app)/templates/new/page.tsx` | "Import from document" OptionCard already existed; file upload → mock extraction → template creation flow complete | — |
| Survey Templates — No "Copy existing" for CE | ✅ Done | `app/(app)/templates/new/page.tsx` | "Copy existing" OptionCard already guarded by `{isGeneral && ...}` — hidden for CE mode | — |

---

## Activation

| Feature | Status | File(s) | What's there | What's missing |
|---|---|---|---|---|
| 5-step wizard (Term → Courses → Dates → Email → Review) | ✅ Done | `app/(app)/surveys/activate/page.tsx` + `components/pce/activate-wizard/` | All 5 steps with WizardNav; `/surveys/push` already redirects to `/surveys/activate` | — |
| Save ≠ Send (schedule only, no immediate email) | ✅ Done | `app/(app)/surveys/activate/page.tsx` | `handleActivate` → `pushSurveyBatch` → step `'activated'`; success screen says "scheduled, emails fire on openDate" — no immediate send | — |
| Auto-template assignment by course type (Step 2) | ✅ Done | `components/pce/activate-wizard/step-courses.tsx` | Templates auto-assign by course type | — |
| Dates calculated from term end anchor (Step 3) | ✅ Done | `components/pce/activate-wizard/step-dates.tsx` | Dates computed from term end | — |
| Enabled-only terms in Step 1 picker | ✅ Done | `components/pce/activate-wizard/step-term.tsx` + `activate/page.tsx` | Select filtered to `enabledForEval === true`; LATEST_TERM_ID also requires it | — |

---

## Analytics

| Feature | Status | File(s) | What's there | What's missing |
|---|---|---|---|---|
| By Term — table with completion %, status | ✅ Done | `app/(app)/analytics/page.tsx` | Completion %, status, drill to Eval Card | — |
| By Term — Ad-hoc Nudge button | ✅ Done | `app/(app)/analytics/page.tsx` | Nudge button per row with confirmation dialog | — |
| By Faculty — KPIs + offerings grid | ✅ Done | `app/(app)/analytics/page.tsx` | KPIs, offerings grid, avg rating, completion %, row → Eval Card | — |
| By Course — cross-term grid | ✅ Done | `app/(app)/analytics/page.tsx` | Cross-term offerings grid, rating, drill to Eval Card | — |
| Evaluation Card — per-question bar charts | ✅ Done | `components/pce/evaluation-card-sheet.tsx` | Distribution bars per question, multi-faculty blocks, free-text count | — |
| Inline Moderation (Review & Release) | ✅ Done | `components/pce/moderation-sheet.tsx` + wired in `surveys-hub.tsx` | Hide/unhide responses, confirm dialog, releases to faculty | — |

---

## Entity List Pages
**Nav location:** Setup group in left sidebar — collapsible; only expands when on a Setup route.

| Feature | Status | File(s) | What's there | What's missing |
|---|---|---|---|---|
| Students — eval columns (courses, done, open) | ✅ Done | `app/(app)/admin/students/page.tsx` | Courses count, evals done/open, Prism row link | KPI strip (KeyMetrics), next-due date column, row detail panel |
| Students — read-only (no CRUD) | ✅ Done | `app/(app)/admin/students/page.tsx` | No add/edit/delete | — |
| Faculty — avg rating column | ✅ Done | `app/(app)/admin/faculty/page.tsx` | Avg rating with tier color, Prism row link | — |
| Faculty — completion % column | ✅ Done | `app/(app)/admin/faculty/page.tsx` | Completion % weighted by enrolled, tier color, sortable | — |
| Faculty — KPI strip | ✅ Done | `app/(app)/admin/faculty/page.tsx` | KeyMetrics: faculty count · departments · avg rating · avg completion | — |
| Faculty — read-only (no CRUD) | ✅ Done | `app/(app)/admin/faculty/page.tsx` | No add/edit/delete | — |
| Courses — eval columns (type, times offered, avg rating) | ✅ Done | `app/(app)/admin/courses/page.tsx` | Course type badge, times offered count, avg rating with tier color | — |
| Courses — KPI strip | ✅ Done | `app/(app)/admin/courses/page.tsx` | KeyMetrics: total courses · didactic count · clinical count · avg program rating | — |
| Courses — remove CRUD artifacts | ✅ Done | `app/(app)/admin/courses/page.tsx` | `lastEdited` + `editedBy` removed; type/timesOffered/avgRating in place | — |
| Courses — Prism row link | ✅ Done | `app/(app)/admin/courses/page.tsx` | Row opens course in Prism | — |
| Offerings — eval status column | ✅ Done | `app/(app)/admin/offerings/page.tsx` | Eval status badge, row → Eval Card | — |
| Offerings — completion % column | ✅ Done | `app/(app)/admin/offerings/page.tsx` | Completion % from MOCK_SURVEYS responseRate via courseCode-term key; tier color | — |
| Offerings — KPI strip | ✅ Done | `app/(app)/admin/offerings/page.tsx` | KeyMetrics: total offerings · collecting · closed/released · avg completion | — |
| Offerings — Prism link | ✅ Done | `app/(app)/admin/offerings/page.tsx` | Opens Prism for non-eval rows | — |

---

## Other Requirements

| Feature | Status | File(s) | What's there | What's missing |
|---|---|---|---|---|
| No red in rating viz | ✅ Done | `app/(app)/analytics/page.tsx`, `admin/faculty/page.tsx`, `admin/courses/page.tsx` | Uses `--chart-4` (amber/orange) for low ratings across all pages | — |
| Two CTAs in survey emails | ✅ Done | `app/(app)/admin/email-templates/page.tsx` | Direct survey link + activity dashboard link in both Initial and Reminder templates | — |
| Student activity dashboard (no-auth) | ✅ Done | `apps/pce/student/app/activities/page.tsx` | No-auth page; email token → student identity; lists open/completed surveys; expired-token state; links directly to `/surveys/[id]` | — |
| Survey form progress bar (student-side) | ✅ Done | `apps/pce/student/app/surveys/[id]/page.tsx:195` | `role="progressbar"` thin strip + section breadcrumb trail already present; section index / total in header | — |

---

## Scoreboard

| Zone | Done | Partial | Missing |
|---|---|---|---|
| Setup | 8 | 0 | 0 |
| Activation | 5 | 0 | 0 |
| Analytics | 6 | 0 | 0 |
| Entity Pages | 14 | 0 | 0 |
| Other | 4 | 0 | 0 |
| **Total** | **37** | **0** | **0** |

**Phase 4 complete. All 37 features Done.**

---

## Implementation Plan

### Phase 1 — Quick Setup fixes ✅ COMPLETE

- **P1-A** — Terms: Enable for evaluation toggle ✅
- **P1-B** — Email Templates: second CTA (`{{activity_dashboard_url}}`) ✅
- **P1-C** — Courses page: type + timesOffered + avgRating + KPI strip ✅
- **P1-D** — Faculty page: completion % column + KPI strip ✅

### Phase 2 — Offerings KPI + Activation consolidation ✅ COMPLETE

- **P2-A** — Offerings: completion % column + 4-metric KPI strip ✅
- **P2-B** — Activation Step 1 filtered to `enabledForEval` only; LATEST_TERM_ID updated; Save≠Send confirmed (schedules, doesn't collect immediately); push redirect already in place ✅

### Phase 3 — Survey Template restructure ✅ COMPLETE

- **P3-A** — Two-zone CE builder: Section 1 (Course Questions, course_content) + Section 2 (Faculty Questions, role tabs with Course Instructor / Coordinator / TA / Lab Instructor / Director) ✅
- **P3-B** — Import from document: already existed in `new/page.tsx`; file upload → mock extraction → template creation ✅
- **P3-C** — Copy existing hidden for CE: already guarded by `{isGeneral && ...}` in `new/page.tsx` ✅

### Phase 4 — Student features ✅ COMPLETE

- **P4-A** — Student activity dashboard: `apps/pce/student/app/activities/page.tsx` ✅  
  No-auth; `?token=` lookup → student identity; lists open + completed; expired-token state; direct links to `/surveys/[id]`
- **P4-B** — Survey progress bar: already existed at `apps/pce/student/app/surveys/[id]/page.tsx:195` ✅  
  `role="progressbar"` strip + section breadcrumb trail; feature-status had missed the student app
