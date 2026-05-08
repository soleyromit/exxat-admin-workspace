# PCE / CFE — Use Cases

> Each use case follows the workspace storytelling template:
> WHAT / HOW / WHY / for_persona / under_conditions / supported_elements + source.

---

## UC-01 — Module entry: "Course Evaluation and Surveys" home

| Field | Detail |
|---|---|
| **WHAT** | Single home entry rebranded "Course Evaluation and Surveys" with two children: Course Evaluation, Programmatic Surveys. |
| **HOW** | Module launcher tile (per workspace ADR-003) → opens in new tab → lands on this home. Two folders: Course Evaluation (default) and Programmatic Surveys (annual student/preceptor/alumni surveys). |
| **WHY** | Aarti 2026-05-05: PCE is a specialized survey, not a separate per-course UI. Unified home avoids confusion with Prism's existing surveys product. |
| **for_persona** | Admin (default landing); other tiers see filtered views |
| **under_conditions** | Phase 1; Prism customers; module purchased |
| **supported_elements** | DS: Sidebar (admin), Card (folders); module-launcher pattern |
| **source** | Aarti 2026-05-05 (`e9389c39`) |

---

## UC-02 — Admin program overview (term-driven dashboard)

| Field | Detail |
|---|---|
| **WHAT** | Term-driven program dashboard with course leaderboard + faculty leaderboard + trend across 5–6 terms. |
| **HOW** | Header: term selector + cohort breakdown table. Top sections: top 5 courses + top 5 faculty (and bottom 5 each). Average score (course) + average score (faculty). Trend chart: course-rating line + faculty-rating line over last 5–6 terms. Cohort grouping toggle (term ↔ cohort). |
| **WHY** | Admin needs to see which courses + faculty trended poorly this term, with longitudinal context. |
| **for_persona** | Admin (covers PD, CCC, Curriculum Chair, Dept Chair, DCE, Coordinator) |
| **under_conditions** | Phase 1; ≥1 prior term of data for trend |
| **supported_elements** | DS: Card, Table, custom trend chart; aggregation API |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-03 — All courses tab (term scope)

| Field | Detail |
|---|---|
| **WHAT** | Grid view of all courses in current term: course name, offering, faculty, registered count, completed count, response %, current avg, lifetime avg, trending up/down with delta, color coded. |
| **HOW** | DS DataTable with filter chrome. Trend column uses sparklines or up/down arrows + delta. NEVER red (per VIZ-004 — Aarti's no-red-in-score-viz rule). |
| **WHY** | Admin needs scannable view of every course's state without drill-in. |
| **for_persona** | Admin |
| **under_conditions** | Phase 1; current term active |
| **supported_elements** | DS: DataTable; conditional formatting (yellow/orange for below-threshold, NEVER red); trend computation |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-04 — Course detail drilldown

| Field | Detail |
|---|---|
| **WHAT** | Per-course drilldown with course summary header + AI insights pane + per-question analysis + faculty insights + action plan. |
| **HOW** | Header: response rate, current avg, current trend, lifetime avg, # times offered, per-faculty historical comparison. AI insights (positive themes / improvement areas — per workspace ADR-005). Per-question analysis tab. Faculty insights tab. Action plan tab. |
| **WHY** | Admin drills into a course flagged on the dashboard; needs full context + actionable insights. |
| **for_persona** | Admin |
| **under_conditions** | Phase 1; course has response data |
| **supported_elements** | DS: Card, Tabs, Table; AI insights pane (per `docs/patterns/viz/ai-vs-pulled-lane.md`) |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-05 — Faculty self-view (the loop-closing surface)

| Field | Detail |
|---|---|
| **WHAT** | Faculty sees own course rating + faculty rating + trend + lifetime average + comparative. |
| **HOW** | Course rating + faculty rating SIDE-BY-SIDE (students rate both — they're distinct entities). Comparative ("0.3 above average"). Trend chart (current term). Lifetime average. Tenure to the right. |
| **WHY** | Aarti D33: faculty must understand both course content AND teaching style ratings because they're responsible for both. Comparative provides context without anxiety-inducing peer-by-peer naming. |
| **for_persona** | Faculty (full + adjunct + course director + instructor variants — all in one view per ADR-004) |
| **under_conditions** | Phase 1; faculty has ≥1 term of evaluation data |
| **supported_elements** | DS: Card, custom side-by-side rating viz, trend chart |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-06 — Action plan flow (lite, Phase 1)

| Field | Detail |
|---|---|
| **WHAT** | From negative theme → "Create action plan" → AI recommends → accept/edit/clear/type-own. |
| **HOW** | On a course or faculty detail surface, AI insight card surfaces a negative theme. CTA: "Create action plan" → opens action plan editor with AI-recommended steps → user accepts / edits / clears / types own → saves. |
| **WHY** | Phase 1 establishes the loop without heavy tracking infrastructure (Aarti deferred tracking to Phase 2/3). |
| **for_persona** | Admin (creates) + Faculty (creates own) |
| **under_conditions** | Phase 1; AI insight available; "lite" tracking only — no heavy state machine |
| **supported_elements** | DS: Card, Field, Button; AI suggestion engine (per workspace ADR-005); action plan data model (lite) |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-07 — Cohort grouping toggle

| Field | Detail |
|---|---|
| **WHAT** | Toggle on the admin dashboard to switch between Term view and Cohort view. |
| **HOW** | Cohort view aggregates 6 terms (3-yr program × 2 terms/year) for one cohort. Term view shows current-term courses + faculty. |
| **WHY** | Aarti D26: two valid lenses on the same data — term-of-engagement vs cohort-trajectory. |
| **for_persona** | Admin |
| **under_conditions** | Phase 1; ≥1 cohort of data for cohort view |
| **supported_elements** | DS: ToggleGroup or custom; aggregation logic per view |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-08 — Student mobile evaluation form (existing mobile arch)

| Field | Detail |
|---|---|
| **WHAT** | Mobile form for students to submit course evaluations. Two sections: course content + faculty teaching style. Multi-faculty courses fan out into per-instructor sections. |
| **HOW** | **Uses existing mobile architecture** — Romit does NOT custom-design this surface. Per Aarti 2026-05-08. Form rendered from the template's section-to-evaluatee mapping. |
| **WHY** | Aarti killed Romit's custom mobile prototype. The existing mobile arch already handles forms; CFE inherits. |
| **for_persona** | Student |
| **under_conditions** | Phase 1; Prism customer with mobile-form architecture available |
| **supported_elements** | Existing mobile form arch (NOT new design); template→section→evaluatee mapping |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-09 — Template authoring (5–6 templates per school, no QB)

| Field | Detail |
|---|---|
| **WHAT** | Schools author up to 5–6 templates, one inactive. NO question bank. Templates contain sections; sections contain questions. |
| **HOW** | Template editor (Fast capability per Vishal 2026-05-06): add sections, add questions per section, tag section to evaluatee (course content / instructor / coordinator). Templates are independent of cohort/course/students; only optional course-type metadata. |
| **WHY** | Aarti PCE ADR-001: eval questions are school-specific, not reusable like exam content. Skip the bank infrastructure. |
| **for_persona** | Admin (authors templates) |
| **under_conditions** | Phase 1; Fast module available (current legacy UI per Vishal — new DS for everything else) |
| **supported_elements** | Fast (form-builder) + section-to-evaluatee mapping; template data model |
| **source** | Aarti 2026-05-08 PCE ADR-001 (`4e1c850e`); Vishal 2026-05-06 (`1b317110`) |

---

## UC-10 — Survey distribution (LMS-on default)

| Field | Detail |
|---|---|
| **WHAT** | Distribute a survey to enrolled students of selected course offerings. |
| **HOW** | Step 1 Scope: survey type, term, academic year, course filter+select with real-time "existing survey pushed" status, faculty count column. Step 2 Design: pick template OR build from scratch. Step 3 Distribution: Prism users (Phase 1), bulk filtered by persona + course. Step 4 Reminder cadence: T-minus N days from reference date (course end / term end / custom — TBD with Vishaka R-CADENCE-01). |
| **WHY** | Aarti 2026-05-05: course offering uniqueness = base course × course number × term × academic year. Distribution attaches to course offerings. |
| **for_persona** | Admin (Program Coordinator sub-archetype) |
| **under_conditions** | Phase 1; LMS-on (per workspace ADR-002) — manual entry deferred. Manual-upload + anonymous-link tabs hidden Phase 1. |
| **supported_elements** | DS: multi-step Sheet/Wizard; LMS course offering data; reminder scheduler |
| **source** | Vishal 2026-05-06 (`1b317110`); Aarti 2026-05-05 (`e9389c39`) |

---

## UC-11 — Multi-faculty section fan-out

| Field | Detail |
|---|---|
| **WHAT** | A course with N faculty produces N instructor sections at distribution time (e.g., Section 2A = Dr. Robert, Section 2B = Dr. Marcus). |
| **HOW** | Survey designer maps each section to an evaluatee type. At distribution time, the system pulls the course's faculty list and instantiates one section per faculty. |
| **WHY** | Vishal 2026-05-06: each faculty must be evaluated separately; otherwise some faculty get missed. |
| **for_persona** | Admin (configures); Student (sees sectioned form) |
| **under_conditions** | Phase 1; courses with multiple faculty assigned via LMS-pulled faculty-course registration |
| **supported_elements** | Section-to-evaluatee mapping; faculty-course registration (LMS-pulled) |
| **source** | Vishal 2026-05-06 (`1b317110`) |

---

## UC-12 — AI theme extraction (no pre-tagged taxonomy)

| Field | Detail |
|---|---|
| **WHAT** | AI extracts themes from open-text student responses dynamically. No pre-tagged taxonomy. |
| **HOW** | Per workspace ADR-005. AI insight card per course/faculty surface: "Students consistently mention pacing in the second half. Comments cluster around weeks 8-10." Cites source ("Based on 47 open-text responses · 6 themes"). |
| **WHY** | Aarti 2026-05-08: "Just let AI do that work… let it be dynamic." Schools can't be expected to pre-tag every survey question. |
| **for_persona** | Admin (primary consumer); Faculty (sees on self-view) |
| **under_conditions** | Phase 1; sufficient response volume for theme extraction (≥10 responses recommended) |
| **supported_elements** | DS: Banner/Card with AI affordance; LLM theme extraction backend; per `docs/patterns/viz/ai-vs-pulled-lane.md` |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-13 — Anonymity (≥5 response gating + hide columns)

| Field | Detail |
|---|---|
| **WHAT** | Faculty results suppressed when fewer than 5 students responded. Truly anonymous reporting (no back-derivation of respondent identity). |
| **HOW** | Below threshold: "Only 3 students responded. Faculty self-view is suppressed below N=5. Coordinator can extend the survey window if appropriate." Hide columns that would identify respondents. PD-level all-results view sees aggregate even when faculty self-view is suppressed. |
| **WHY** | Aarti + Vishaka 2026-05-06 roadmap: OHSU sticking point on Prism today; CFE must be more sophisticated than just hide-columns. |
| **for_persona** | Faculty (sees suppression message); Admin (sees aggregate) |
| **under_conditions** | Phase 1; always — anonymity is foundational |
| **supported_elements** | DS: LocalBanner; suppression logic |
| **source** | Aarti + Vishaka 2026-05-06 (`a73456ab`) |

---

## UC-14 — Three schema attributes (Survey Type, Course Type, Subject)

| Field | Detail |
|---|---|
| **WHAT** | Three new attributes on the survey schema. |
| **HOW** | (1) Survey Type: Course Evaluation \| Programmatic Surveys (asked at create-time; auto-defaults if from PCE entry). (2) Course Type: Didactic \| Clinical (extensible to practicum) — OPTIONAL; powers future automation. (3) Subject: Course Content / Instructor / Course Coordinator (extensible) — section-level tag enabling per-section access control + reporting. |
| **WHY** | Aarti 2026-05-05: schema basis for routing/UX behavior + future AI hook. Course Type is optional because schools that use one template across didactic + clinical can keep doing so. |
| **for_persona** | Admin (creates with these attributes) |
| **under_conditions** | Phase 1; "Subject" naming is TBD (David flagged as misleading — better name needed) |
| **supported_elements** | Survey schema fields; per-section access control logic |
| **source** | Aarti + Mohan + David 2026-05-05 (`e9389c39`) |

---

## UC-15 — Programmatic Surveys folder (annual)

| Field | Detail |
|---|---|
| **WHAT** | Sibling folder to Course Evaluation. Houses annual student / preceptor / alumni / faculty / receptors surveys. |
| **HOW** | Same Fast template authoring flow. Survey Type = Programmatic Surveys. Distribution may be annual cadence rather than per-term. |
| **WHY** | Aarti 2026-05-05: renamed from "General Surveys" → "Programmatic Surveys" because it captures the real use case (annual standardized surveys). |
| **for_persona** | Admin (authors + distributes) |
| **under_conditions** | Phase 1; annual cadence supported |
| **supported_elements** | Same as Course Evaluation; cadence logic |
| **source** | Aarti 2026-05-05 (`e9389c39`) |

---

## Summary table

| UC | Title | Persona | Phase |
|---|---|---|---|
| 01 | Module entry: "Course Evaluation and Surveys" home | Admin | 1 |
| 02 | Admin program overview (term-driven) | Admin | 1 |
| 03 | All courses tab (term scope) | Admin | 1 |
| 04 | Course detail drilldown | Admin | 1 |
| 05 | Faculty self-view | Faculty | 1 |
| 06 | Action plan flow (lite) | Admin + Faculty | 1 |
| 07 | Cohort grouping toggle | Admin | 1 |
| 08 | Student mobile evaluation form | Student | 1 (existing arch) |
| 09 | Template authoring (5–6, no QB) | Admin | 1 |
| 10 | Survey distribution (LMS-on) | Admin | 1 |
| 11 | Multi-faculty section fan-out | Admin + Student | 1 |
| 12 | AI theme extraction | Admin + Faculty | 1 |
| 13 | Anonymity (≥5 gating + hide columns) | Faculty + Admin | 1 |
| 14 | Three schema attributes | Admin | 1 |
| 15 | Programmatic Surveys folder | Admin | 1 |

## Source provenance

All use cases cite Granola meeting IDs in the source field. See `apps/pce/docs/storytelling/vision.md` § Source provenance for the full meeting list.
