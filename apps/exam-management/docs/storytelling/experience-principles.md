# Exam Management — Experience Principles

> Product-specific UX/UI principles. Workspace patterns are upstream; this is what's specific to Exam Management's audience.
>
> Synthesized from Vishaka (workflow realism) + Aarti (strategic IA) + Vishal (PRD framing).

---

## Per-surface principles

### Faculty home

- **Primary axis:** active courses (by date), all affiliated below. Default filter = active; toggle to past/all.
- **Secondary axis:** within a bucket, time-of-engagement (most recent first).
- **Card→list adaptive:** cards for ≤4 courses, auto-list at 5+.
- **Search:** course code FIRST ("301 tox"), then name. Soft fallback if hit lives outside current filter.
- **Cognitive load:** mini metrics on cards (live, draft, pending review) — small, with assessment iconography. Stats bar at top: parked until logic is defined (Vishaka).
- **Persona gating:** "Live assessments" widget = Course Coordinator only.

### Course detail

- **4-section IA:** Overview · Assessments · Students · Accommodations [read-only inherited]. **NO Questions tab** (Vishaka killed — duplicates QB).
- **Default landing:** Overview tab = list of assessments grouped by completion (Aarti 2026-05-07).
- **Tab variant:** DS Tabs line variant (per existing Exxat-DS pattern).
- **Brand continuity:** matches Prism colors/themes (Vishaka).

### Assessment overview (the meat)

- **Primary axis:** completion status (Not Scheduled → Scheduled → Ongoing → Completed). NOT workflow.
- **Card sizing as priority:** Ongoing/Scheduled large, Completed compact (Aarti).
- **Top counter strip:** "7 assessments · 5 completed · 2 scheduled" — acts as filter chips.
- **Workflow approval:** secondary widget ("5 pending review, 2 reviewed"), NEVER the org axis.
- **Word "live" forbidden:** use "ongoing" (Aarti — "live" reserved for proctoring, out of scope).

### Live monitor (Ongoing assessment)

- **Persona gate:** Course Coordinator only.
- **Three counts:** Not Started / In Progress / Submitted. Scan-band style at top.
- **NO question-level live view:** Aarti killed it. Question analysis is post-close secondary tab.
- **Last-updated indicator visible always:** trust signal during polling (per `docs/patterns/async/live-monitor-polling.md`).
- **Flagged questions:** statuses addressed/dismissed/acknowledged. NO real-time student↔faculty messaging.
- **Faculty's reality:** "When the assessment is actually live, that faculty is in the classroom" (Vishaka). Minimum chrome required.

### Assessment review / curving

- **Tabs in order:** Overview (score distribution + content area frequency + objective frequency + Bloom's distribution) → Per-question analysis → Curving.
- **Layout:** 3/4 width for question list, preview pane on right showing cohort-avg delta on adjustment.
- **Per-question card:** how many right/wrong/skipped + distractor distribution (green=correct, single accent for incorrect — NEVER rainbow palette) + difficulty 3-tier x-axis + curving inline.
- **Drop 2D point-biserial scatter** until Romit can explain the calculation (Aarti R1 directive).
- **Frequency counts, NOT percentages:** "8 of 20 questions cover this content area" (Aarti D17).

### Question authoring (QB and inline)

- **AI copilot:** right-rail Sheet, persistent during create + edit. Visible even on empty state ("dead also" but Aarti wants it).
- **Tagging:** primary at QB authoring; secondary inline during assessment build. **One mechanism only** — Gmail-style nested labels.
- **Validation:** faculty edits/accepts every AI-generated Q before it enters QB.
- **Frequency-of-use column:** "this question is used 6 times" (Aarti — already added).

### Bulk import review

- **Draft mode:** imported Qs are draft until reviewed.
- **Uploader-only review:** structural validation gate.
- **Preserve upload order:** confidence markers are filters, NOT a re-sort.
- **Confidence chips:** high / low / needs-attention.

### Pop quiz workflow

- **No separate Lecture section:** Aarti rejected.
- **Buttons:** DS Button default for Start, destructive for End.
- **Real-time:** assessment becomes immediately visible to all students in the course.

## Cross-surface principles

### From workspace patterns (this product inherits)

| Pattern | Where it applies in Exam Mgmt |
|---|---|
| `viz/ai-vs-pulled-lane.md` | All AI surfaces — copilot, gap analysis, question generation, bulk import confidence |
| `viz/RUBRIC.md` | All charts (no progress bars per VIZ-001; no red in score viz per VIZ-004) |
| `viz/bullet-vs-target.md` | Score-vs-target visualizations |
| `viz/gap-heatmap.md` | Course health gap analysis (UC-10), assessment-level gap (UC-11) |
| `viz/outlier-strip-plot.md` | Per-question performance distribution |
| `dashboards/two-question-dashboard.md` | UC-11 assessment-level gap analysis |
| `admin/master-list-admin.md` | UC-19 admin master-list screens (11 entities) |
| `admin/read-only-inherited-filtered-view.md` | UC-18 accommodations on course roster |
| `nav/module-launcher.md` | UC-20 entry from Prism (Phase 1) |
| `ia/cross-product-entity-views.md` | Students / faculty / courses lists (filtered to module scope) |
| `onboarding/lms-toggle-first-run.md` | School admin first-run (workspace ADR-002) |
| `async/live-monitor-polling.md` | UC-05 live monitor |
| `states/loading-empty-error-states.md` | All data-bearing surfaces |
| `forms/field-validation.md` | All forms (assessment builder, question editor, etc.) |

### Exam-Management-specific cross-surface

- **3-layer analytics** (L1 dashboard / L2 on-screen / L3 reports): every analytics surface uses this shape (Vishal 2026-05-06).
- **PDF + Excel** for canned reports (both, not either): "self-service report should also be added" (Aarti).
- **One mechanism per concept**: tagging = labels. NOT attributes + direct mapping. NOT multiple ways to do the same thing.
- **Provenance visible on every Q**: Pulled (LMS/upload) vs AI-generated vs Manual (per Aarti 2026-05-07).

## What we're NOT doing (anti-patterns from stakeholders)

| Anti-pattern | Source |
|---|---|
| Standalone Questions tab inside a course | Vishaka — duplicates QB |
| Global Assessment Builder menu (Phase 1) | Vishaka — assessments belong inside courses |
| "Awaiting results" status | Vishaka — confusing |
| Stats bar with mixed-meaning metrics | Vishaka — park until logic defined |
| Multiple ways to do the same thing | Aarti + Vishaka |
| AI features without trust contract | Aarti |
| AI claiming assessment completeness | Aarti |
| Pre-tagged taxonomies on user-authored content | Aarti |
| Raw `<button>` instead of DS Button | DS-001 |
| Red in score/rating viz | VIZ-004 (Aarti) |
| Percentages where frequency tells the story | Aarti D17 |
| Toast notifications for product feedback | DS-005 |
| Decorative metrics ("Total students: 1,247") with no decision attached | dashboards/RUBRIC.md |
| Hard-coded role permissions | Aarti — configurability mandatory |
| Faculty CRUD on master entities | Aarti — admin owns |
| Question-level live monitoring | Aarti — student-centric only |
| Faculty deciding accommodations | ADR-006 — admin determination |
| Hide LMS-off state | ADR-002 — 95% of customers today are LMS-off; can't alienate |
| Welcome tour overlays | onboarding/RUBRIC.md |

## Validation discipline

Per Vishaka 2026-05-05:

| Rule | Why |
|---|---|
| Don't bring half-baked screens to faculty | Burns champion goodwill |
| Restrict user-test pool to **didactic** faculty | Clinical faculty don't use exam software |
| Use paid consultants if champions are too busy | Ensures dedicated feedback time |

## Source provenance

All principles cite stakeholder + meeting. See:
- `apps/exam-management/docs/storytelling/aarti-perspective.md`
- `apps/exam-management/docs/storytelling/vishaka-perspective.md`
- `apps/exam-management/docs/storytelling/vision.md` § Source provenance
