# Exam Management — Use Cases

> Each use case follows the workspace storytelling template:
> WHAT / HOW / WHY / for_persona / under_conditions / supported_elements + source.
>
> Maintained by intake skill. Source meetings cited inline.

---

## UC-01 — Faculty entry into Exam Management (Phase 1: Prism tile; Phase 2: standalone)

| Field | Detail |
|---|---|
| **WHAT** | Faculty enters Exam Management via a tile on their existing Prism dashboard (Phase 1) or via standalone login (Phase 2 for non-Prism customers). |
| **HOW** | Phase 1: tile click → opens Exam Management in new tab (per workspace ADR-003 module sellability). Phase 2: direct login at exam-management URL. Visual continuity with Prism brand/themes is mandatory. |
| **WHY** | Continuity of identity for existing customers; future-proofing for non-Prism customers per Aarti's "with or without Prism" framing. |
| **for_persona** | Faculty (Course Coordinator + Course Instructor); Admin |
| **under_conditions** | Phase 1: Prism customer; Phase 2: any customer |
| **supported_elements** | DS: Sidebar (admin), NavShell (faculty); module launcher per `docs/patterns/nav/module-launcher.md` |
| **source** | Vishaka 2026-05-05 (`e82b0659`); Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-02 — Faculty home: My Course Offerings

| Field | Detail |
|---|---|
| **WHAT** | Faculty lands on a list of their assigned course offerings: active on top, all affiliated below. |
| **HOW** | Default filter = active by start/end date; toggle to past/all. Cards for small sets, auto-list view at ~5–6+. Search respects current filter, soft-suggests if hit lives elsewhere. Per-card: course code, name, term, students, total assessments, accommodations count, mini assessment metrics. |
| **WHY** | Faculty mental model is "what's open / what's done"; course-centric (not QB-centric per Aarti's email). Course code is primary search key (Vishaka). |
| **for_persona** | Faculty (Course Coordinator + Course Instructor) |
| **under_conditions** | Phase 1; requires reliable course start/end dates in Prism (currently underused — product enforcement gap) |
| **supported_elements** | DS: Card, Badge, Input (search), Tabs (filter); LMS-pulled course offering data; faculty assignment data |
| **source** | Vishaka 2026-05-05 (`e82b0659`); Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-03 — Course detail: 4-section layout

| Field | Detail |
|---|---|
| **WHAT** | Per-course-offering view with 4 sections: Overview, Assessments, Students, Accommodations [read-only inherited]. NO Questions tab (removed per Vishaka). |
| **HOW** | Tab structure (DS Tabs line variant). Overview tab = list of assessments grouped by completion (per Aarti 2026-05-07). Assessments tab = the meat (creation, status, history). Students tab = roster (deprioritized, admin owns registration). Accommodations tab = read-only inherited filtered view per `docs/patterns/admin/read-only-inherited-filtered-view.md`. |
| **WHY** | "Why would a faculty come to a course inside an exam management product? To create assessments, administer them, review results." (Vishaka); QB lives separately; cognitive load discipline. |
| **for_persona** | Faculty (Course Coordinator primary; Course Instructor secondary) |
| **under_conditions** | Phase 1; assessments tied to courses (no global Assessment Builder per Vishaka) |
| **supported_elements** | DS: Tabs, Card, Badge, Table, DataTable; assessment list, roster, accommodations data |
| **source** | Vishaka 2026-05-05 (`e82b0659`); Aarti 2026-05-07 (`b68ede99`) + 2026-05-08 (`4e1c850e`) |

---

## UC-04 — Assessment overview: completion-status taxonomy

| Field | Detail |
|---|---|
| **WHAT** | Course Overview tab renders all assessments grouped by completion: Not Scheduled / Scheduled / Ongoing / Completed. Workflow approval is a side widget, not the org axis. |
| **HOW** | Top counter strip ("7 assessments · 5 completed · 2 scheduled") acts as filter chips. Card sizing: Ongoing/Scheduled large, Completed compact. Sort within bucket: time/chronology. |
| **WHY** | Aarti: "Completion is a bigger category... primary concern." Workflow approval is unproven (ExamSoft lacks it) — demote until validated. |
| **for_persona** | Faculty (Course Coordinator + Course Instructor) |
| **under_conditions** | Phase 1; assessment data tagged with completion status |
| **supported_elements** | DS: Card, Badge, Tabs; KeyMetricsShowcase or inline summary for counter strip; assessment status field |
| **source** | Aarti 2026-05-07 (`b68ede99`) |

---

## UC-05 — Live monitor: student-centric counts

| Field | Detail |
|---|---|
| **WHAT** | Real-time view of an Ongoing assessment: Not Started / In Progress / Submitted counts (scan-band style). Question-level analysis is a secondary tab post-close. |
| **HOW** | Three count cards at top. Time elapsed + close time in header. Flagged questions section (collapsed by default); statuses: addressed / dismissed / acknowledged. Last-updated indicator (5s polling per `docs/patterns/async/live-monitor-polling.md`). |
| **WHY** | Aarti: "While the exam is on, who cares about question 9? I'm more concerned about the students." Vishaka: ExamSoft parity. Faculty is in the classroom — minimum chrome required. |
| **for_persona** | Course Coordinator (only — Vishaka was emphatic). NOT generic instructor. |
| **under_conditions** | Assessment is "Ongoing" (replaces "Live"). No proctoring (out of scope). Instructor-to-assessment association must exist (gap today — talk to Nipun). |
| **supported_elements** | DS: Card, Badge, Banner; polling endpoint `/api/assessments/<id>/live-status`; flag data model |
| **source** | Aarti 2026-05-08 (`4e1c850e`); Vishaka 2026-05-05 (`e82b0659`) |

---

## UC-06 — Pop quiz: Start / End workflow

| Field | Detail |
|---|---|
| **WHAT** | Lightweight Start/End control to administer an assessment live during a lecture. No pre-scheduling required. |
| **HOW** | Faculty selects/creates assessment → presses Start → assessment becomes immediately visible to all students in the course → faculty presses End → access closes. No separate Lecture section. |
| **WHY** | Aarti: "I'm in the lecture. Everybody open up your computers, and I'm going to administer this." Models a real classroom moment; competing systems force scheduling overhead. |
| **for_persona** | Faculty (Course Coordinator) — in-classroom sub-archetype |
| **under_conditions** | Phase 1 candidate; no separate Lecture section needed (Aarti) |
| **supported_elements** | DS: Button (default for Start, destructive for End); real-time push to student app; assessment status transitions to Ongoing |
| **source** | Aarti 2026-05-07 (`b68ede99`) |

---

## UC-07 — Assessment building: 3 question sources

| Field | Detail |
|---|---|
| **WHAT** | Assessment builder lets faculty pull questions from: (1) this course's QB (default), (2) other course QBs (secondary), (3) inline new question authoring (tertiary). |
| **HOW** | Builder has a "Pull from QB" panel with course filter; "Build new" inline option for the "I'm 5 short" case (per Aarti). Tagging happens in QB primary, inline secondary. |
| **WHY** | Faculty are conservative — recycle 90–95%, new 5–10%. Default workflow must support recycle-first. |
| **for_persona** | Faculty (Course Coordinator) |
| **under_conditions** | Phase 1; QB exists with tagged questions |
| **supported_elements** | DS: Sheet (panel), Button, Field; QB question records with tags |
| **source** | Aarti 2026-05-07 (`fb9e76c2`) + 2026-05-06 (`d6a35ea2`); Vishaka 2026-05-05 (`e82b0659`) |

---

## UC-08 — AI question generation (3 input modes)

| Field | Detail |
|---|---|
| **WHAT** | AI generates questions from one of three input modes: (a) lecture upload (PowerPoint/PDF), (b) LMS pull (specific lectures, not all 10), (c) NL prompt ("5 medium-rigor MCQs on diabetes care"). |
| **HOW** | Faculty selects mode + scope → AI generates draft questions → faculty validates per-question (accept/edit/clear) → validated Qs flow to QB. AI auto-tags to standards/course measures (with manual override). |
| **WHY** | Faculty already use 3rd-party AI tools (Copilot, ChatGPT) outside the system because ExamSoft + most LMSes lack this. Bring it in-system. |
| **for_persona** | Faculty (any role authoring questions) |
| **under_conditions** | Phase 1; AI integration ready; faculty has source material (or NL prompt with no source) |
| **supported_elements** | DS: Sheet (right-rail copilot panel), Field, Button; AI generation backend; LMS integration; file upload; tag suggestion engine |
| **source** | Aarti 2026-05-07 (`fb9e76c2`) + 2026-05-06 (`d6a35ea2`) |

---

## UC-09 — Bulk import with draft mode + confidence markers

| Field | Detail |
|---|---|
| **WHAT** | Faculty uploads Word/PDF doc → AI parses questions → questions enter draft mode → only original uploader can review → confidence markers (high/low/needs-attention) per question → faculty accepts/edits/rejects → validated Qs join QB. |
| **HOW** | Upload file → AI parses (handles MCQ + T/F + match-the-following per Darshan's MVP). Review queue surfaces confidence-marker filter chips. NEVER reorder questions — preserve upload order. |
| **WHY** | Bulk migration from existing exam tools; faculty validation is the trust gate. |
| **for_persona** | Faculty (Course Coordinator); Admin (for bulk migration) |
| **under_conditions** | Phase 1; uploader-only review (structural validation gate per Aarti) |
| **supported_elements** | DS: Banner, Badge (confidence chips), Button; AI parsing backend; question draft state |
| **source** | Aarti + Nipun 2026-05-06 (`d6a35ea2`) + 2026-05-06 roadmap (`a73456ab`) |

---

## UC-10 — Course-level question-bank gap analysis ("Course health")

| Field | Detail |
|---|---|
| **WHAT** | Per-course view of which content areas / competencies / objectives have QB coverage and which don't. Per gap: count of questions, "Generate more with AI" CTA. |
| **HOW** | Course detail tab (or sub-section) → list of mapped content/competencies/objectives → per-row: questions count + AI-generate CTA → AI uses course materials (syllabus, lecture, chapter) for higher-quality generation. |
| **WHY** | Aarti moved AI gap analysis from competency screen to course screen on 2026-05-08. Course is the natural shell for content+question mapping. |
| **for_persona** | Faculty (Course Coordinator) |
| **under_conditions** | Phase 1; course mapped to content/competencies/objectives (per workspace ADR-001 entity model) |
| **supported_elements** | DS: Card, Badge, Button; question-tag query; AI generation with course-material context |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-11 — Assessment-level gap analysis (3 insights)

| Field | Detail |
|---|---|
| **WHAT** | Per-assessment view of three coverage insights: (a) Taught but not tested, (b) Tested but not taught, (c) Neither taught nor tested. Cumulative across all assessments + courses. |
| **HOW** | Per `docs/patterns/dashboards/two-question-dashboard.md`. Two side-by-side cards: Q1 = "Am I teaching everything?" Q2 = "Am I testing what I'm teaching?" Plus AI-lane insight summarizing across both. |
| **WHY** | Higher ROI than QB-completeness. Aarti: "If you are not picking up those questions and actually using it in an assessment, it is as good as you've not created those questions." |
| **for_persona** | Admin (PD, CCC); Faculty (Course Coordinator secondary) |
| **under_conditions** | Phase 1; assessments have tagged questions; courses have tagged objectives |
| **supported_elements** | DS: Card, custom viz; per-pattern viz |
| **source** | Aarti 2026-05-07 (`fb9e76c2`) |

---

## UC-12 — Pre-publication chair approval (silent gate)

| Field | Detail |
|---|---|
| **WHAT** | Faculty submits assessment for chair review; chair approves/requests-changes; approval is a side widget, never a hard block on administer. |
| **HOW** | Per-card chip ("pending review", "approved") + small dashboard widget summarizing counts ("5 pending review"). Faculty can administer without approval; system shows soft warning. |
| **WHY** | Vishaka pushed for this; Aarti accepted as secondary. Approvals often happen offline (printed, verbal) — system must accept that. |
| **for_persona** | Department Chair; Faculty (Course Coordinator who submits) |
| **under_conditions** | Phase 1; opt-in per assessment type (some institutions require for finals/summatives — policy layer) |
| **supported_elements** | DS: Badge, Banner (soft warning), Button; approval state machine |
| **source** | Aarti 2026-05-07 (`b68ede99`); Vishaka 2026-05-05 (`e82b0659`) |

---

## UC-13 — Curving / score adjustments

| Field | Detail |
|---|---|
| **WHAT** | Post-exam score adjustments at question or assessment level. Allows excluding ANY question, not just flagged ones. |
| **HOW** | Inline at the per-question analysis row level. Use 3/4 of width for question list; preview pane on right showing cohort-avg delta on adjustment. |
| **WHY** | Aarti 2026-05-08: issues surface offline or after exam too — flagged exclusion alone is insufficient. |
| **for_persona** | Faculty (Course Coordinator) |
| **under_conditions** | Phase 1; assessment is in Completed state |
| **supported_elements** | DS: Table, Sheet, Button; score adjustment data model |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-14 — Per-question analysis card

| Field | Detail |
|---|---|
| **WHAT** | Per-question stats: how many got it right / wrong / skipped; distractor distribution (green=correct + single accent for incorrect); difficulty (3-tier x-axis); curving inline. |
| **HOW** | Per `docs/patterns/dashboards/two-question-dashboard.md` viz disciplines: frequency counts (not %), 2-color distractor palette, 3-tier difficulty buckets (NOT 0–100% scatter). Drop 2D point-biserial scatter until Romit can explain the calculation (Aarti directive R1). |
| **WHY** | Embedded workflow intelligence at decision time, not in separate report. |
| **for_persona** | Faculty (Course Coordinator) |
| **under_conditions** | Phase 1; assessment Completed; sufficient response volume |
| **supported_elements** | DS: Card, custom viz; question-level analytics data |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-15 — Confidence-based marking (T/F + confidence %) — PROVISIONAL

| Field | Detail |
|---|---|
| **WHAT** | Student answers T/F AND declares confidence %; partial credit awarded based on confidence × correctness. |
| **HOW** | Correct + 80% confidence → 0.5 marks. Wrong + 50% confidence → 0.2 marks (or zero, instead of negative). Formula not finalized. |
| **WHY** | Aarti 2026-05-06: real-world calibration, especially for medical: "in real life [students] will be even more anxious." Reduces blind guessing. |
| **for_persona** | Student (medical/clinical primary); Faculty (Course Coordinator configures) |
| **under_conditions** | **PROVISIONAL — pending Vishaka feedback.** Stakes-tiering question raised by Romit (start with low-stakes formative?). Aarti raising verbally with Vishaka. **Supersedes prior memory note marking this Nipun-driven and out-of-scope.** |
| **supported_elements** | DS: custom slider/selector; new scoring formula; faculty config UI |
| **source** | Aarti 2026-05-06 (`d6a35ea2`) |

---

## UC-16 — Hotspot questions (Phase 1: instructor-drawn polygons + instructor-placed points)

| Field | Detail |
|---|---|
| **WHAT** | Image-based question type. Two modes Phase 1: instructor places clickable points OR draws polygon regions; student clicks to answer. |
| **HOW** | Question editor: image upload + region tool (point or polygon). Student view: image + clickable interactivity. Optionally paired with radio button or text entry for actual answer. |
| **WHY** | Aarti 2026-05-06: half of medical school customers need hotspots. ExamSoft has it. Student-drawn deferred — research ExamSoft first. |
| **for_persona** | Faculty (Course Coordinator authoring); Student (taking) |
| **under_conditions** | Phase 1: instructor-placed/drawn only. Student-drawn deferred to "worst case 1.5 years" |
| **supported_elements** | DS: image rendering, custom hotspot interactivity; per-region metadata for accessibility |
| **source** | Aarti + Romit 2026-05-06 (`d6a35ea2`) |

---

## UC-17 — Tagging (Gmail-style nested labels)

| Field | Detail |
|---|---|
| **WHAT** | Single tagging mechanism for questions: nested labels that house standards, course measures, faculty names, custom categories. Org-defined + personal labels. |
| **HOW** | Per question: label picker with nested hierarchy. Org admin defines required categories; faculty selects from those during authoring; personal labels available alongside. AI suggests tags; manual override always available. |
| **WHY** | Avoid the curriculum-mapping product's "attributes vs direct mapping" mistake (caused real user confusion). Aarti: "Something like labels which you see in Gmail." |
| **for_persona** | Faculty (Course Coordinator + Course Instructor); Admin (defines org labels) |
| **under_conditions** | Phase 1; label taxonomy seeded by Vishal's research |
| **supported_elements** | DS: custom label component (TBD — candidate for new DS primitive); label data model |
| **source** | Aarti 2026-05-07 (`fb9e76c2`) + 2026-05-06 (`d6a35ea2`) |

---

## UC-18 — Accommodations (faculty read-only inherited filtered view)

| Field | Detail |
|---|---|
| **WHAT** | Faculty sees on each course's roster which students have which accommodations. Read-only badges per row. |
| **HOW** | Per `docs/patterns/admin/read-only-inherited-filtered-view.md`. Inline DS Badge per accommodation, Tooltip for full description. Footer note: "Accommodations are managed by your program admin." Faculty cannot CRUD. |
| **WHY** | Workspace ADR-006: accommodations are administrative determinations backed by documentation. Faculty plans for them (rooms, proctors, printed exams) but doesn't decide them. |
| **for_persona** | Faculty (Course Coordinator); Admin owns the master list |
| **under_conditions** | Phase 1; admin has applied accommodations to students with documentation |
| **supported_elements** | DS: Table, Badge, Tooltip; accommodations data model (cross-product per ADR-006) |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-19 — Admin master-list screens (11 entities)

| Field | Detail |
|---|---|
| **WHAT** | Admin owns CRUD for the 11 program-level master entities (master courses, terms, course offerings, students, faculty, permissions, content areas, competencies, standards, accommodations, assessment types). |
| **HOW** | Uniform shape per `docs/patterns/admin/master-list-admin.md`. List + filter + create/edit + bulk actions. LMS-on disables manual add (per workspace ADR-002). |
| **WHY** | Workspace ADR-001: program-level entity universe shared across all 5 products. |
| **for_persona** | Admin (program-level) |
| **under_conditions** | Phase 1; LMS-on or LMS-off configured at school level |
| **supported_elements** | DS: Table, Input, Button, DropdownMenu, Tooltip, FloatingActionBar; per-entity API |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## UC-20 — Module launcher entry (Prism shell)

| Field | Detail |
|---|---|
| **WHAT** | Replaces current Prism main dashboard. Each Exxat module appears as a tile; clicking opens module in new tab. |
| **HOW** | Per `docs/patterns/nav/module-launcher.md`. Per-tile: icon + title + 1 pulled metric + Open ↗ CTA. Not-purchased modules faded with Request demo CTA. |
| **WHY** | Workspace ADR-003: independent module sellability. Customers buying only Exam Mgmt shouldn't land on a dashboard for products they don't have. |
| **for_persona** | All (entry surface for any user) |
| **under_conditions** | Always; default landing for any Exxat user |
| **supported_elements** | DS (Prism is Angular — pattern documents the contract); each module exposes `/api/launcher-status` |
| **source** | Aarti 2026-05-08 (`4e1c850e`) |

---

## Summary table

| UC | Title | Persona | Phase |
|---|---|---|---|
| 01 | Faculty entry | Faculty | 1 (Prism), 2 (standalone) |
| 02 | Faculty home: course offerings | Faculty | 1 |
| 03 | Course detail: 4-section | Faculty | 1 |
| 04 | Assessment overview: completion taxonomy | Faculty | 1 |
| 05 | Live monitor: student-centric | Course Coordinator | 1 |
| 06 | Pop quiz: Start/End | Course Coordinator | 1 candidate |
| 07 | Assessment building: 3 sources | Faculty | 1 |
| 08 | AI question generation | Faculty | 1 |
| 09 | Bulk import + draft + confidence | Faculty | 1 |
| 10 | Course health (gap analysis) | Faculty | 1 |
| 11 | Assessment-level gap analysis | Admin | 1 |
| 12 | Pre-publication chair approval | Chair, Faculty | 1 (silent) |
| 13 | Curving / score adjustments | Faculty | 1 |
| 14 | Per-question analysis | Faculty | 1 |
| 15 | Confidence-based marking | Student | **PROVISIONAL** |
| 16 | Hotspot questions | Faculty, Student | 1 |
| 17 | Tagging (Gmail labels) | Faculty, Admin | 1 |
| 18 | Accommodations (read-only inherited) | Faculty, Admin | 1 |
| 19 | Admin master-list screens | Admin | 1 |
| 20 | Module launcher | All | 1 |

## Source provenance

All use cases cite Granola meeting IDs in the source field. See `apps/exam-management/docs/storytelling/vision.md` § Source provenance for the full meeting list.
