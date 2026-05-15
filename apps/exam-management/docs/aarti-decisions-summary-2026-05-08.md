# Aarti Decisions Summary — Exam Management + Course Faculty Evaluation

> Consolidates 8 stakeholder meetings (May 5–8, 2026) into one canonical reference, per Aarti's request 2026-05-08 16:09: *"For my benefit and your benefit and the project's benefit, create a summary of everything we have discussed."*
>
> Source meetings: see appendix.
>
> **Status:** living document. Update as new meetings audit through the intake skill.

**Maintainer:** Romit Soley (Designer II)
**Last revision:** 2026-05-09

---

## 1. North Star

**Replace ExamSoft as the default exam platform for accredited health-sciences programs by closing the Curricular Assessment Loop — the four-stage cycle no incumbent has built.**

### The Curricular Assessment Loop (Aarti's canonical model, 2026-05-07 + 2026-05-08)

```
A) Why is content taught          →  Standards / competencies (NAPLEX, NCLEX, CAPTE)
B) How is content taught          →  Course objectives in courses
C) How are students tested        →  Exam questions
D) How do you know they learned   →  Assessment scores
E) Loop D back to B               →  Class-wide failure → curriculum tweak
                                  →  Single-student failure → individual support
```

Competitors decompose the loop:
- **AS Map / Carrot:** A↔B (curriculum mapping only)
- **ExamSoft:** C↔A (questions to standards only)
- **Influx:** Analytics layer over imported ExamSoft data — no original data
- **Exxat (target):** Full loop, owned end-to-end

> "No software, to my knowledge today, covers the entire curricular assessment loop. And that could be our value proposition and our differentiator if we can get it right." — Aarti, 2026-05-07

---

## 2. Strategic anchors

| Anchor | Detail | Source |
|---|---|---|
| **Match-then-extend** | ExamSoft parity is the FLOOR. Differentiators are the CEILING. Maintain a parity sheet. | 2026-05-06 + 2026-05-07 |
| **Top 10 differentiators by Sept 2026** | Marketing page on exact.com goes live before Cohere with Jan 20, 2027 launch date. The top-10 list is the marketing anchor. | 2026-05-06 |
| **Modular sellability** | Each Exxat product standalone-sellable; module launcher replaces Prism main dashboard. *"Going forward, I'm going to be with or without Prism… each product is independently sellable."* | 2026-05-08 |
| **AI as platform** | Pervasive AI in question creation, assessment building, gap analysis — but human validates. AI recommends, faculty decides. | 2026-05-06 + 2026-05-07 |
| **3-layer analytics** | L1 Dashboard + L2 On-screen analytics + L3 Canned + custom reports (PDF AND Excel) | 2026-05-06 |
| **One mechanism per concept** | Don't repeat curriculum-mapping product's "attributes vs direct mapping" mistake. Tagging = Gmail-style nested labels. | 2026-05-07 |
| **Faculty are conservative on new questions** | 90–95% recycled per exam, ~5–10% new. AI generates → faculty validates carefully. Don't optimize for generation volume; optimize for trust. | 2026-05-07 |
| **LMS-first default** | Today ~5% of customers integrate LMS. Should flip to ~95% with new modules. | 2026-05-08 |

---

## 3. Phasing

| Phase | Target | Scope |
|---|---|---|
| **Phase 1 — Jan 20, 2027 launch (Exam Mgmt)** | ExamSoft parity + Curricular Assessment Loop foundation + AI in question creation/assessment + LMS-Canvas integration (pull + grade-push) + 3-tier persona collapse + bulk import (with draft mode) | Be better than ExamSoft on day one |
| **Phase 1 — Sept 15, 2026 launch (CFE)** | 3 view tiers + templates only (no QB) + AI theme extraction + LMS Canvas + term-driven dashboard + faculty self-view + cohort grouping toggle + action-plan flow lite | Cohere demo Aug; first real use end of fall semester |
| **Phase 2 — 2027** | Curricular Assessment Loop completion, faculty action-item logging, deeper integrations (Banner / Brightspace / Blackboard / SIS), three-tier program-level competency reporting | 50 signed customers for 2027 |
| **2027–2028** | AI-proof assessment design (faculty test students' ability to spot AI errors), lockdown browser vendor integration, Phase 3 cumulative competency reporting | TBD |

---

## 4. Foundational architecture (cross-product)

### 4.1 Three view tiers (workspace ADR-004)

Phase 1 collapses to **3 view tiers** for every product:

| Tier | Covers |
|---|---|
| Admin | PD, Curriculum Committee Chair, Curriculum Chair, Department Chair, Director, Coordinator, anyone with cross-faculty visibility |
| Faculty | Full faculty + adjunct + course director + instructor variants |
| Student | All student roles |

Per-product DESIGN.md may document sub-archetypes for design context, but **Phase 1 SHIPS three views, not eight.**

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views." — Aarti, 2026-05-08

### 4.2 Faculty sub-roles at course level

Within the Faculty tier, two sub-roles + a collaborator pattern:

| Role | Capability |
|---|---|
| **Course Coordinator** | "Whole and soul navigator" — full CRUD on Questions, Assessments, Students, Accommodations [read-only inherited]. Default role for any faculty assigned to a course offering. |
| **Instructor** | Limited — exact set TBD with PMs/Vishaka. Possible variants: can create assessments but not view results; can create questions but not assessments; can view results but not create content. |
| **Collaborator** | Read-only or co-edit access on a course or assessment. Admin assigns OR Course Coordinator invites with admin permission. First-class concept. |

### 4.3 Course architecture (3-concept entity model)

Per Exam Mgmt ADR-001 (workspace ADR-001):

1. **Master course** — abstract course in the program catalog. Owned by Admin. Reused across terms.
2. **Term** — academic term in the program catalog. Owned by Admin.
3. **Course offering** — the **atomic unit** for evaluation: `course × term × cohort × faculty` (4-tuple, refined 2026-05-08 16:09). What faculty acts on. Distinct from master course.

> "Pharmacology one, spring twenty twenty six, that is like a combination of a term and a course. That's a course offering." — Aarti, 2026-05-08

Faculty cannot add courses, terms, or course offerings. Admin owns all three.

### 4.4 Program-level entity universe (workspace ADR-001)

11 master entities live ONCE at program level; each module subsets them:

| # | Entity | Owned by |
|---|---|---|
| 1 | Master courses | Admin |
| 2 | Terms | Admin |
| 3 | Course offerings | Admin |
| 4 | Students | Admin (via LMS sync where on) |
| 5 | Faculty | Admin |
| 6 | Permissions / role assignments | Admin |
| 7 | Content areas | Admin |
| 8 | Competencies | Admin |
| 9 | Standards (accreditation) | Admin |
| 10 | Accommodations (master list) | Admin (workspace ADR-006 — shared module) |
| 11 | Assessment types | Admin |

Each module shows its own filtered view (e.g., Faculty in Exam Mgmt sees only courses they're assigned to).

### 4.5 LMS-integration-first default (workspace ADR-002)

Architecture and UI default to LMS-integration-on:
- Admin onboarding: school-level toggle "LMS integration enabled?" Default YES.
- When ON: manual add controls disabled (read-only with sync indicator); LMS is source of truth.
- When OFF: full CRUD (current state).

Today ~5% integrate. Aarti wants ~95% with new modules.

### 4.6 Module sellability + Prism launcher (workspace ADR-003)

Every product standalone-sellable. Prism main dashboard replaced by **module launcher**: each module = a tile, opens in new tab.

> "Going forward, I'm going to be with or without prism… each product is independently sellable." — Aarti, 2026-05-08

> "My whole definition of Prism is going to have to change. Prism is no longer Prism, it's modules." — Aarti, 2026-05-08 16:09

### 4.7 AI-first thinking (workspace ADR-005)

Every analytics surface splits content into two visually distinct lanes:

| Lane | Source | Examples | Visual treatment |
|---|---|---|---|
| **Pulled** | Computed from structured data | Trends, averages, comparative metrics, distributions | Standard chart/number; no AI badge |
| **AI** | LLM-extracted from user-authored content | Themes from open-text, insights, action plans | `fa-light fa-sparkles` + brand color + "AI insight" label + source citation |

Schools do NOT pre-tag user-authored content. AI extracts dynamically.

> "AI is good at finding themes and grouping the information by themes. Just let AI do that work." — Aarti, 2026-05-08

### 4.8 Comp Genie–style AI gap analysis (added 2026-05-08 16:09)

AI compares assessments to **published board exam blueprints** (NAPLEX, NCLEX, CAPTE 2C, ARC-PA, ASHA) — works WITHOUT requiring customer to upload curriculum.

Two tiers of AI value:
1. **No customer data:** compare assessments to published blueprints (Tier 1 — zero-friction)
2. **Customer uploaded curriculum:** compare to mapped course objectives (Tier 2 — full loop)

> "What Influx has been [doing], they call it the Comp Genie feature… AI has that." — Aarti, 2026-05-08 16:09

Curriculum mapping is **NOT a prerequisite** for using Exam Mgmt — but is required for full AI gap analysis.

---

## 5. Exam Management — feature decisions

### 5.1 Five assessment types

P1: Pop quiz, Timed exam, Take-home, Open-book, Standard proctored.
P2: Lockdown browser.
P3: Remote-monitored proctored.

Aarti requires per-type parameter doc before designing screens (R5 in homework list).

### 5.2 Assessment statuses

`draft / review / pending chair / change requested / approved / ongoing / done / results`

**Drop "live"** — Aarti is "personally not a fan of the word live." Use **ongoing** instead.

### 5.3 Course Overview = list of assessments grouped by completion (Aarti 2026-05-07 4:45)

Primary axis: **completion status** (Not Scheduled / Scheduled / Ongoing / Completed). NOT workflow approval.

Card sizing as priority: Ongoing/Scheduled large, Completed compact. Top counter strip acts as filter chips.

### 5.4 Pre-publication chair approval (Vishakha-driven)

Secondary feature (Aarti — *"Vishakha wants us to build. We'll build it as a secondary feature."*). Silent gate; never hard-blocks administer. Faculty can administer pending-approval; system says *"just so you know, this is still pending approval."*

### 5.5 Live monitoring is student-centric

Three counts at top: Not Started / In Progress / Submitted. Question-level analysis is a secondary tab post-close.

> "While the exam is on, who cares about question 9? I'm more concerned about the students." — Aarti, 2026-05-08

Course Coordinator only — generic instructor has no real association with assessment ownership today (R9 to confirm with Vishaka).

NO real-time student↔faculty messaging during exam. Flag statuses: addressed / dismissed / acknowledged.

### 5.6 Bulk import + draft mode + confidence markers (2026-05-06)

Imported questions stay in `draft` until reviewed. **Only the original uploader can review.** Confidence markers (high/low/needs-attention) per Q, surfaced as filter chip — NEVER reorder questions; preserve upload order.

### 5.7 AI question creation (2026-05-06 + 2026-05-07)

Three input modes:
1. Lecture upload (PowerPoint/PDF)
2. LMS pull (specific lectures, not all 10)
3. Natural-language prompt (no source material; world knowledge)

AI auto-tags generated Qs to standards/course measures. Faculty edits/accepts each before QB entry.

Two question→standard mapping pathways:
- **Via course objective** (auto-inherits content area + competency)
- **Direct to standards** (independent of curriculum)

### 5.8 AI copilot (right-rail authoring assistant)

Persistent right-rail panel during create + edit. Critiques: stem clarity, distractor balance, rationale auto-gen, Bloom's tag suggestion, category auto-suggest. Each flag has `Apply` button. Visible even on empty-state authoring.

### 5.9 Course-level QB gap analysis ("Course health")

Moved from competency screen to course screen (2026-05-08). Per course: list content areas / competencies / objectives covered → per-row count of QB questions → "Generate more with AI" CTA per gap, fed by course materials (syllabus, lecture, chapter).

### 5.10 Assessment-level gap analysis (the differentiator)

Three insights:
1. **Taught but not tested** — objective covered, no questions test it
2. **Tested but not taught** — questions exist, no objective covers them (unfair)
3. **Neither taught nor tested** — undercovered standard (most critical)

> "If you are not picking up those questions and actually using it in an assessment, it is as good as you've not created those questions." — Aarti, 2026-05-07

Higher ROI than QB-completeness gap analysis.

### 5.11 Tagging = Gmail-style nested labels

ONE mechanism. Replaces "attributes vs direct mapping" mistake from curriculum-mapping product. Houses: standards, course measures, faculty names, custom categories.

Working name: **labels**. Don't call the entity "Standards" — too narrow.

### 5.12 Hotspot questions

Phase 1: instructor-drawn polygons + instructor-placed points (both modes).
Phase 1: NOT student-drawn (defer; "worst case 1.5 years").

### 5.13 Pop quiz workflow (Start / End)

Lightweight Start/End control on an existing assessment. Faculty in lecture: presses Start → students see → presses End → access closes. NO separate Lecture section.

### 5.14 Curving / score adjustments

Allows excluding ANY question, not just flagged ones. Inline at per-question analysis row level. 3/4 width for question list; preview pane on right showing cohort-avg delta on adjustment.

### 5.15 Per-question analysis

Distractor distribution: green=correct + single accent for incorrect (NEVER rainbow palette). Difficulty: 3-tier x-axis (easy/medium/hard) — NOT 0–100% scatter. Drop 2D point-biserial scatter until R1 (point-biserial study) done.

Frequency counts ("8 of 20"), NOT percentages.

### 5.16 Confidence-based marking — PROVISIONAL

Student answers T/F + declares confidence %; partial credit based on confidence × correctness.

Aarti champions (was previously Nipun-driven, out of scope per old memory). Vishaka is the gatekeeper — pending her feedback.

### 5.17 Accommodations (workspace ADR-006)

Three tiers:
1. Master accommodations list (program level) — admin-defined catalog
2. Per-student accommodation assignments (admin only) — with documentation upload
3. Course-level read-only inherited view (faculty) — filtered to their course's students

Faculty cannot CRUD accommodations. Non-registered students may take a single assessment (makeup workflow).

> "A faculty cannot decide whether this student gets this accommodation or not. At the higher level, that decision is made." — Aarti, 2026-05-08

### 5.18 Course detail landing page (Aarti 2026-05-08 16:09)

When a faculty or admin navigates into a course, the **primary landing tab is Assessments** — not objectives, not syllabus, not course metadata. Course details (objectives, syllabus, reading material, content, events) are secondary tabs, never more than one click away.

> "If you're in the assessment section, we can make them land first on the assessments… Overview should be the list of my assessments." — Aarti, 2026-05-07 + 2026-05-08 16:09

Everything about the course must be accessible but secondary to the assessment workflow when inside Exam Management. This is not a limitation — it's focus. A course page inside CFE would land differently (on evaluation data).

### 5.19 Things Aarti killed for Exam Management

| Killed | Why | Source |
|---|---|---|
| Practice questions in Phase 1 | No PM/product alignment; not a must-have for launch. Future consideration only | 2026-05-08 |
| Point-biserial in current design sprint | Romit doesn't yet understand the calculation well enough to design with it responsibly | 2026-05-08 |
| 8-persona variations | Bandwidth; collapse to 3 views (admin / faculty / student) | 2026-05-08 |
| "Live" as a status label | Ambiguous — use "ongoing" instead | 2026-05-07 + 2026-05-08 |
| Chart + number redundancy on live monitor | If you have the chart, you don't need the number and vice versa | 2026-05-08 |
| Content-area coverage as percentages | Frequency counts only ("8 of 20 questions") — percentages imply correctness which adds confusion | 2026-05-08 |
| 2D scatter plot for difficulty × point-biserial | Use 3-bucket x-axis (easy/medium/hard) instead; scatter misleads until Romit understands point-biserial | 2026-05-08 |
| Objective as prominent per-question field | Objective is metadata ("FYI") — content area is the relevant forward field. Show objective on hover/click only | 2026-05-08 |
| Flagged-only exclusion for curving | Must be able to exclude ANY question, not just flagged | 2026-05-08 |

---

## 6. Course Faculty Evaluation (CFE / PCE) — feature decisions

### 6.1 Module entry (2026-05-05)

Single home: **"Course Evaluation and Surveys"** with two children:
- Course Evaluation
- Programmatic Surveys (renamed from "General Surveys")

Three new schema attributes: Survey Type, Course Type (didactic/clinical, optional), Subject (section-level — naming TBD).

### 6.2 Persona collapse (2026-05-08)

Originally 8 personas (Vishal's PRD draft). Collapsed to 3 view tiers. The 8 personas remain as **sub-archetypes** for design context — Phase 1 ships 3 views.

### 6.3 No question bank (PCE ADR-001)

CFE has NO question bank. Templates only (5–6 per school, one inactive). Eval questions are school-specific, not reusable.

### 6.4 Two top-level dashboard axes (2026-05-08 16:09)

**Term view** + **Cohort view** — both top-level. Faculty is **one click down**, NOT a top-level axis.

Cohort view aggregates 6 terms (3-yr program × 2 terms/year).

### 6.5 Two student-rated entities

Students rate two distinct things:
- **Course content**
- **Faculty teaching style**

Faculty self-view shows them side-by-side with comparative context. Not combined into one number.

### 6.6 AI 3 pillars for CFE (2026-05-06)

> "We want to use AI in the research analytics. We want to use AI for providing action items from that. And we want to use AI for building the actual evaluation template." — Aarti

1. Research analytics / theme extraction (extract themes from open-text dynamically)
2. Action item recommendations (AI suggests for negative themes)
3. Evaluation template builder (AI assists schools authoring templates)

### 6.7 Anonymity (≥5 gating + truly anonymous)

Faculty results suppressed when fewer than 5 students responded. Beyond just hide-columns: truly anonymous reporting (OHSU sticking point on Prism today).

PD-level all-results view sees aggregate even when faculty self-view is suppressed.

### 6.8 Action plan flow (lite, Phase 1)

From negative theme → "Create action plan" → AI recommends → accept/edit/clear/type-own. Heavy tracking infrastructure deferred to Phase 2/3.

### 6.9 Restrictive defaults, configurable per section (2026-05-05)

Defaults are okay; hard-coded role permissions are NOT. Survey creator decides who sees what.

Admin ≠ PCE viewer. Faculty-as-admin must NOT leak peer evaluations.

### 6.10 Things Aarti killed for CFE

| Killed | Why | When |
|---|---|---|
| 8-persona PCE nav | Bandwidth | 2026-05-08 |
| Custom mobile evaluation form | Use existing mobile arch | 2026-05-08 |
| Cohort readiness | Wrong product — students aren't being assessed in CFE | 2026-05-08 |
| Competency rating | Competencies are outcomes, not student-rated | 2026-05-08 |
| Heavy CQI tracking | Phase 2/3 — doesn't help sell | 2026-05-08 |
| Per-course PCE nesting | Specialized survey, not separate module | 2026-05-05 |
| "Dean level" terminology | Dean is a role, not a level | 2026-05-05 |
| "General Surveys" naming | Renamed Programmatic Surveys | 2026-05-05 |

---

## 7. Aarti's process anti-patterns (2026-05-08 16:09)

> "It is not [Romit's] position to start answering the question, what would a program director want to see? That's not expected."

> "There is no document that lists all of these things. And then I will get on a review call, and I will see eight versions of it, and I will lose it."

> "Right now, when I'm looking at the screens that he was showing me, it's like envisioning what we should do in this dashboard. Okay, fine. But you'll get so many things wrong if you start here."

> "Just go fucking create these pages. Like, what are you waiting for?"

**Translation:**
1. **Stop wearing personas you're not.** Romit doesn't decide what a Program Director wants — Aarti does.
2. **Document base entities first.** ONE canonical doc, not eight versions across review calls.
3. **Build the unglamorous setup screens BEFORE dashboard polish.** Master-list admin screens for the 11 entities are P0 foundational; dashboard exploration without alignment is a process anti-pattern.
4. **Speculative dashboard exploration is wasted work.**

---

## 8. Romit's homework (R1–R10 + T27)

| # | Item | Status |
|---|---|---|
| R1 | Read up on point-biserial — be able to explain calculation. Send Aarti a Claude note. | **In progress** — see `apps/exam-management/docs/research/point-biserial-explainer.md` |
| R2 | Send Aarti the Claude note when done | After R1 |
| R3 | Research ExamSoft download / lockdown / take-home patterns | Pending |
| R4 | Find CAPTE 2C / SSR template (PT accreditation form 2D1–2D9) — ask Dale if needed | Pending |
| R5 | Five assessment types — get product/PM alignment on definitions + per-type parameters | Pending |
| R6 | Assessment status taxonomy — agree with PMs (drop "live" → "ongoing") | Pending |
| R7 | Permissions matrix — define rational levels (avoid combinatorial blowup) | Pending |
| R8 | Faculty profile — Prism-level vs additional fields | Pending |
| R9 | Confirm with Vishaka: flag-during-exam read-only | Pending |
| R10 | Get Prism modules diagram from Aarti's email | Pending |
| T27 | This document | **Done** |

---

## 9. Decisions — full ADR list

| ADR | Title | Status | Source |
|---|---|---|---|
| **Workspace ADRs** | | | |
| 000 | Record architecture decisions | Accepted | Process |
| 001 | Program-level entity universe shared across all 5 products | Accepted | 2026-05-08 |
| 002 | LMS-integration-first default | Accepted | 2026-05-08 |
| 003 | Independent module sellability + Prism module launcher | Accepted | 2026-05-08 |
| 004 | Phase-1 persona collapse to 3 view tiers | Accepted | 2026-05-08 |
| 005 | AI-first thinking pattern for analytics surfaces | Accepted | 2026-05-08 |
| 006 | Accommodations as a shared cross-product module | Accepted | 2026-05-08 |
| **Exam Management ADRs** | | | |
| 001 | Three-concept course architecture (master + terms + offerings) | Accepted | 2026-05-08 |
| **PCE ADRs** | | | |
| 001 | No question bank in PCE / CFE; templates only | Accepted | 2026-05-08 |

**Pending Tier 2 ADRs** (15+ decisions documented in meeting notes; ADRs to be drafted as needed):
- Faculty role hierarchy + collaborator permission (D4, D5, D7)
- Live monitor is student-centric (D6)
- Question tagging is question-level (D12)
- Course-level QB gap analysis (D13)
- Two-question dashboards (D14)
- Coverage shows frequency counts, not percentages (D17)
- Curving allows excluding any question (D9)
- Five assessment types — taxonomy doc as blocker (D10)
- Drop "live" status → "ongoing" (D11)
- CFE: term + cohort dashboard structure (D26)
- CFE: two student-rated entities (D27)
- CFE: AI-extracted themes, no preset taxonomy (D28)
- CFE: faculty self-view structure (D33)
- Two question-mapping pathways (D2, 16:09)
- Comp Genie–style AI (D8, 16:09)
- Course offering 4-tuple (D3, 16:09)

---

## 5.20 Student experience — combined login and dashboard (2026-05-14)

Source: `docs/research/meetings/2026-05-14-student-login-experience.md` (Granola `81c06a04`) + `docs/research/meetings/2026-05-14-implementation-walkthrough.md` (Granola `d5aa2783`)

**One combined login.** No separate ExamSoft-style exam app. One student app, one login.

**Student dashboard Phase 1 must-haves (Vishaka 2026-05-14):**
1. My Courses
2. My Accommodations
3. Open Action Items — all actionable/downloadable assessments, surfaced without navigating into a course
4. Recently Published Results — completed+published assessments with scores

**Student dashboard deferred (post-January):** Overarching competency/strength/weakness insights. Review calendar. Faculty↔student communication.

**Download section required fields:** course name · assessment name · instructions · download window start/end · exam date/time · download button.

> "ExamSoft doesn't show course name in the download section. It's a big gap." — Vishaka

### 5.21 Exam-taking UI directives (2026-05-14)

These are direct screen corrections from Vishaka + Aarti:

| Element | Directive | Status |
|---|---|---|
| Exam header | BOTH course name AND assessment name mandatory — sacred space | 🔴 Not yet in header |
| Submit button | TOP panel ONLY — not in the bottom footer | 🔴 FLAG — structural change |
| Next + Flag | Bottom panel — improve prominence, not remove | ✅ Correct placement |
| Answer checkbox | LEFT of option text (before A/B/C/D) | 🔴 Currently sandwiched |
| Jump-to-question dropdown | KILL — use Flagged/Skipped filter instead | QuestionJumpPopover (group-based) = correct; QuestionNavigatorPopover (number grid) = needs review |
| Pre-submission | Show "Skipped + Flagged" summary popup | 🔴 Not yet built |
| Skipped definition | Any unanswered Q before the student's furthest-reached question | — |
| Section title in exam | Appears above section's questions — NOT in the top header | — |
| Progress counter | Show "X of Y answered" during exam | — |

> "The top panel has to be, like, sacred space." — Vishaka

> "Submit should not be at the bottom. Submit should only be at the top." — Aarti + Vishaka (confirmed in both meetings)

### 5.22 Exam submission — async sync model (2026-05-14)

When student clicks Submit: (1) exam locks immediately, (2) background async upload, (3) system notifies "uploaded successfully" when synced. Even with intermittent WiFi, the submitted exam must never be lost.

Notification audit: all system-sent emails/notifications to students must be logged and viewable by both student and admin.

Auto-notification: send email to students when download window is ending and they haven't downloaded yet.

### 5.23 Student, faculty, course profile — trim for exam management (2026-05-14)

**Student profile** in exam management: Courses + Accommodations ONLY. All other Prism profile tabs are NOT needed here.

**Faculty profile** in exam management: Course associations (coordinator vs. instructor role) ONLY. NOT teaching/scholarship/service, placements, compliance, advisees.

**Course profile**: student registration + announcements/email + course measures + resources (syllabi). NOT placements, NOT learning activities.

**Killed for exam management profiles:** compliance (student + faculty), intervention/communication tab, academic standing, competency dashboard (Prism handles this), learning activities.

> "When they are in exam module, it's just exams." — Vishaka

### 5.24 Phase 1 accommodations — explicit scope (2026-05-14)

Phase 1 accommodations = **extra time + font size increase ONLY**. Separate room = not product-controllable. Speech-to-text, hardware connections, custom keyboards = deferred.

Default: accommodations apply to all courses the student is registered in. Faculty can override per assessment (view-only).

### 5.25 Entity directory pages — UX philosophy (2026-05-14)

Global search (Google-style, one input box) — NOT field-by-field search boxes. Recently-used widget on entity search pages. Romit working on 8 entity screens: student search/landing, faculty search/landing, course search/landing, master course list, master term list, etc.

FERPA rule (Vishaka 2026-05-14): 4 legitimate access paths for student performance data — (1) direct instructor, (2) course director, (3) official adviser, (4) senior admin. Build only these; don't design complex role-check workarounds for secondary data fields.

### 5.26 Question bank landing page and QB philosophy (2026-05-14)

QB landing page is NOT "all questions". Needs a higher-level folder dashboard showing: total folders, total questions, approval status summary, tagging coverage.

"My questions" = default QB view for faculty. Admin sees folder permissions/access management first.

> "All questions is not something that should be default." — Aarti

Analytics/reporting = first-class design from day one, not bolted on later. Current-term active courses = primary anchor for the product landing page.

### 5.27 Assessment builder — section creation and collaboration (2026-05-14)

Section creation + free text title = MUST-HAVE Phase 1. Pre-exam instruction page (free text, configurable timer, optional attestation) = Phase 1.

Collaborative assessment: each faculty adds to their section. Faculty can SEE each other's sections but CANNOT edit others' questions.

Section-level review NOT required — assessment-level review is the unit.

Performance statistics (historical usage + difficulty tags) visible while building AND reviewing an assessment.

Three alignment docs needed (PM/Vishal to produce): types of questions supported, configuration at assessment vs. question level, attributes of a question.

---

## 6.11 PCE — Phase 1 survey scope (2026-05-14)

Source: `apps/pce/docs/research/meetings/2026-05-14-course-eval-base-entities.md` (Granola `6a648f67`)

**Answer types Phase 1:** Likert scale + free text ONLY.

**NOT Phase 1:** question bank import for surveys, AI-native survey flow (traditional/manual flow comes first), analytics (PRD not yet approved).

**Import method:** PDF document only — no Canvas/LMS integration.

**Likert configurability:** program director sets default pointer at settings level (options: 3, 4, 5, 7, 10). Changing settings does NOT retroactively affect live surveys.

**PRD status:**
- Create template + push survey = ✅ Approved. Start design here.
- Student responses = Adi drafting.
- Analytics = ⏳ In review — wait before designing.

**Base entity design deadline:** Tuesday May 19 (terms, course offerings, faculty landing pages).

---

## Appendix — source meetings

| Date | Title | Granola ID | Drove |
|---|---|---|---|
| 2026-05-05 09:00 | Post course evaluation alignment with Aarti | `e9389c39` | Aarti (Mohan presenting) |
| 2026-05-05 15:29 | Vishaka↔Romit Exam Mgmt dashboard | `e82b0659` | Vishaka |
| 2026-05-06 07:29 | Roadmap planning | `a73456ab` | Aarti (with Vishal + Vishaka) |
| 2026-05-06 09:00 | PCE persona mapping | `1b317110` | Vishal (Aarti absent) |
| 2026-05-06 10:55 | AI exam + confidence-based | `d6a35ea2` | Aarti |
| 2026-05-07 10:33 | AI question creation + Curricular Loop | `fb9e76c2` | Aarti |
| 2026-05-07 16:45 | Assessment overview design | `b68ede99` | Aarti | `docs/research/meetings/2026-05-07-aarti-assessment-overview.md` |
| 2026-05-08 12:44 | Live monitoring + accommodations + cross-product | `4e1c850e` | Aarti |
| 2026-05-08 16:09 | Curriculum mapping + base entities + product alignment | `f274ade0` | Aarti |
| 2026-05-14 08:14 | Exam management — implementation walkthrough, question bank, AI features | `d5aa2783` | Aarti + Vishal + Darshan |
| 2026-05-14 09:31 | Course evaluation survey design — base entities and product structure | `6a648f67` | Romit + Adi |
| 2026-05-14 10:30 | Assessment builder — base entities, student experience, PRD workflow | `af529725` | Vishaka + Nipun + Romit |
| 2026-05-14 14:02 | Exam Management — Student login experience | `81c06a04` | Vishaka + Romit |

Per-meeting raw notes at `apps/exam-management/docs/research/meetings/` and `apps/pce/docs/research/meetings/`.

---

## How to maintain this doc

- Add new Aarti decisions as they're made — append to relevant section, cite meeting + date.
- Mark superseded decisions explicitly; don't delete.
- When an ADR is drafted from a decision here, link to it.
- Keep section §3 (phasing) updated as launch dates shift.
- The meeting log at the bottom is the canonical source — this doc is the curated synthesis.
