# Aarti Decisions Summary — Exam Management + Course Faculty Evaluation

> Consolidates 8 stakeholder meetings (May 5–8, 2026) into one canonical reference, per Aarti's request 2026-05-08 16:09: *"For my benefit and your benefit and the project's benefit, create a summary of everything we have discussed."*
>
> Source meetings: see appendix.
>
> **Status:** living document. Update as new meetings audit through the intake skill.

**Maintainer:** Romit Soley (Designer II)
**Last revision:** 2026-06-10

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
| "High stakes" / "low stakes" labels | Don't categorize assessments by stakes level anywhere in the product — no meaningful product distinction. Removed from all UI labels, copy, and tooltips. | 2026-05-21 |
| K-type questions | Not Phase 1. Not impactful enough for current release. "Do not obsess about the questions that they are not going to offer." | 2026-05-22 |
| Out-of-BRD question type discussion in design sessions | "I don't want to even, like, spend one second or one microsecond talking about a question type that is not going to be supported in our current release." Only work on question types in the BRD. | 2026-05-22 |

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

### 5.20 Course landing page and navigation (Vishal + Romit, 2026-06-04)

Source: `docs/research/meetings/2026-06-04-exam-management-vishal-course-landing.md` (Granola `e97078d1`)

| Decision | Detail |
|---|---|
| Default landing | Course offerings list, filtered to **Ongoing** by default |
| Filters | All / Ongoing / Upcoming / Completed (status pills) |
| Card view | Deferred — list view only for Phase 1 |
| "Primary Faculty" label | Not a Prism term — replaced with **"Course Coordinator"** everywhere |
| Column label | "Faculty / Staff" acceptable for course list column |
| Setup tab + Course Catalog | Navigate to Prism-base pages — do NOT rebuild inside Exam Management |
| Mapping tab in course detail | Deferred — "We'll not have this right now" (Vishal). Confirm with Aarti before removing |
| Accommodations tab | Placeholder — build when accommodations module ships |
| Difficulty distribution in builder | Always visible (persistent) during assessment building |
| ExamSoft parity | Explicit baseline floor — every design addition/removal needs stated rationale |
| LMS integration UI | Deferred — not in current sprint scope |

> "primary faculty is not a term we are using in Prism." — Vishal, 2026-06-04

> "we can remove one tab altogether. That's a lot of space." — Vishal, 2026-06-04 (re: Setup tab)

> "our designs should consider what ExamSoft has and with a strong rationale add or subtract from." — Vishal, 2026-06-04

---

### 6.11 CFE/PCE module architecture and student experience (Aarti, 2026-06-04)

Source: `docs/research/meetings/2026-06-04-prism-redesign-aarti-alignment.md` (Granola `2ad77c6e`)

| Decision | Detail |
|---|---|
| Two sections | CFE = **Course & Faculty Evaluation** + **Institutional Surveys** — distinct dashboards, distinct entry points |
| Student experience | Email-driven and minimal. Pending-activities landing page aggregates all open survey emails |
| Email CTAs | Two buttons per email: "complete this survey" (direct) + "see all my pending activities" (landing page) |
| Module independence | New modules must work without Prism legacy dependency for base entity management |
| Coexistence | New and old Prism modules must coexist during transition — no design island |
| Himanshu alignment | Required before new module navigation is finalized and shipped |
| Super admin only | Phase 1 ships super admin role only — no granular role variations at launch |

> "we are going to have these two entry points and almost treat them as two sections of the product. And I'm good with that. Course and faculty, and institutional surveys." — Aarti, 2026-06-04

> "I don't expect a lot of people to go here. I expect them to barely do this call to action, click done, dusted." — Aarti, 2026-06-04

> "This needs to function independently. They're still saving data in the student entity, but this is operating independently." — Aarti, 2026-06-04

---

### 5.21 Base entity mockup scope — current-information only (Mohit, 2026-06-09)

Source: `docs/research/meetings/2026-06-09-exam-management-sync-mohit.md` (Granola `70d6511f`)

| Decision | Detail |
|---|---|
| Mockup scope | Base entity landing pages (course offering, students, faculty, assessments) designed for CURRENT information availability ONLY |
| Not in scope yet | Performance data, accommodations, interventions — introduced per-feature as each feature is built |
| Assessment entry point | Confirmed: entry is from a COURSE OFFERING, not from the left-side "Assessment" menu |
| Assessment creation scope | 8 core parts. Analytics additions expand to 10–12 later |
| Questions emphasis | Arthi/Kurat feedback (5-min review): questions should be visually emphasized more |

> "But my document is strictly limited to what we will have, the information we'll have. We are building course offering landing page. Performance will come later. We will introduce that information as in the respective entities or sub entities. Whenever we build that particular feature." — Mohit, 2026-06-09

---

### 6.12 PCE template builder + distribution — June 9 cadence decisions (Vishaka + David, 2026-06-09)

Source: `apps/pce/docs/research/meetings/2026-06-09-post-course-survey-cadence.md` (Granola `3fd2ac92`)

| Decision | Detail |
|---|---|
| Template creation paths | 3 mutually exclusive: Build new (manual) / Copy existing / Import from PDF or Word |
| PDF/Word import location | Top-level template screen only — NOT buried inside sections. Aarti previously requested this; keep her preference |
| Build new path | Go straight into writing questions — no per-section "add from template" or per-section upload |
| Section creation | Multi-select roles at once → system generates one section per role |
| Section labels | Labels only (from Prism course roles). No description text under labels |
| Wording | "PDF or Word document" — never just "PDF" |
| KILL: section-level "add from template" | Too complex — the copy-existing top-level path already handles this |
| KILL: per-section upload | One doc at top level → all sections extracted. No section-level upload |
| KILL: visibility/privacy toggle | Post-course uses review-and-release workflow, not open-sharing |
| KILL: anonymous toggle | Always anonymous by default. Message only — no toggle |
| KILL: anonymous link (PCE only) | Post-course = Prism-only distribution. General surveys keep all 3 channels |
| KILL: additional email distribution (PCE only) | Exact Prism only for post-course surveys |
| Reminders | Multiselect; counted from closing date; messaging must be explicit |
| Results release date | Required field if comment moderation is not in Phase 1. Manual release fallback if no date |
| Term-level date cascade | Surveys grouped by term (not "project"). Term-level date changes cascade to all instances; course-level override still possible |
| KILL: report access screen | Phase 1 kill (supersedes T53). Role-based access handles who sees results |
| Programmatic surveys | NO changes to existing UI or backend. Entry point only changes. Dashboard adds KPIs. Push flow = production flow |

> "This whole section is not needed. Visibility, because we are going to control — we are not gonna call it visibility... we are going to have a review and release results workflow." — Vishaka, 2026-06-09

> "Post course evaluation will only have one channel, which is via Exact Prism." — Vishaka, 2026-06-09

> "By default, it would be anonymous. By default, Yes. It has to be anonymous... We should not ask. We'll just convey the message." — Vishaka, 2026-06-09

---

### 6.13 PCE architecture — tab structure, analytics, academic calendar (Vishaka + Arun, 2026-06-10)

Source: `apps/pce/docs/research/meetings/2026-06-10-pce-architecture-vishaka-arun.md` (Granola `4d1fa807`)

| Decision | Detail |
|---|---|
| Analytics tab naming | NOT "Longitudinal Insights" — use "Course Offering" + "Faculty" as the two entry points |
| Course offering analytics | Term-grouped; per-offering stats: avg rating, response rate, enrolled, completed; 5-term trend |
| Faculty analytics page | Top performers + needs-attention leaderboard at top, then searchable grid. Click → detail with spider graph + peer comparison + trend |
| Student detail view | Current courses at top, past below, no future. Survey completion status integrated into course rows — NO separate "surveys" tab |
| Academic calendar setup | PREREQUISITE. Settings screen: academic year (label + start/end date) + terms (start/end per year+term combo). Only configured terms pull into dashboard |
| Base entities | View-only in PCE Phase 1. Students, faculty, courses pulled from Prism. Entity actions → navigate to Prism in new tab |
| Standalone sellability | 2027 target. Phase 1 relies on Prism base |

> "Don't call it longitudinal because call it faculty because I want faculty's insights." — Arun, 2026-06-10

> "This page and this page [course + faculty dimensions] is what makes sense for us to say we are carving this out as a unique type of survey. It only makes sense to carve out if you can ace this." — Arun, 2026-06-10

> "I don't think we need a separate tab called surveys. The whether or not the student has filled the survey be integrated here itself." — Arun, 2026-06-10

> "We have to ensure your configuration is correct. Academic calendar is essentially a label... If it doesn't exist, we shall not pull it in." — Vishaka/Arun, 2026-06-10

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

### 5.38 Accessibility Phase 1 targets — pending ExamSoft parity check (2026-05-21)

Source: `docs/research/meetings/2026-05-21-assessment-prd-accessibility-download.md` (Granola `66898189`)

Phase 1 accessibility targets for the exam-taking experience:
- **Text-to-speech** — Phase 1
- **200% magnification** — Phase 1 (explicitly chose 200% not 400%; "start at 200%")
- **Dyslexic font support** — Phase 1 (entire font of the feature changes to dyslexic-friendly)
- **High contrast color combinations** — Phase 1
- **Speech-to-text** — lowest priority; likely Phase 2

**Caveat:** scope confirmed pending consultant response on ExamSoft's own accessibility compliance. If ExamSoft doesn't comply, Phase 2 deferral is an acceptable fallback for January 2027 launch.

Design task generated: T60 (accessibility settings panel for exam-taker) — DESIGN-REVIEW.

### 5.39 Download workflow — explicit coordinator window + lockdown model (2026-05-21)

Source: `docs/research/meetings/2026-05-21-assessment-prd-accessibility-download.md` (Granola `66898189`)

Builds on §5.35 (download exam confirmed Phase 1). Adds workflow detail:

- **Download window** is coordinator-configured: opens at publication, closes approximately 2 hours before exam time.
- **Explicit student action required** — no auto-download. The student must consciously initiate. Product must make the call-to-action unmissable ("you have to create a workflow that will explicitly point them that there is some action needed").
- **Lockdown browser** during exam — password (given in the exam room on exam day) decrypts the locally downloaded exam.
- **Async submission** — student clicks Submit → exam locks immediately → background upload → "uploaded successfully" on reconnect. Never lost post-submit.
- If WiFi fails at submit time → exam re-submits automatically when student's device reconnects.

> "You have to create a workflow that will explicitly point them that there is some action needed from them they come to take the actual exam. That's what that whole download workflow is." — Vishaka

> "If they are not able to submit because of lack of connectivity, then whenever they are connected to the network again, is when it gets submitted." — Vishaka

### 5.40 Copy assessment — section-level copy with reorganization capability (2026-05-21)

Source: `docs/research/meetings/2026-05-21-assessment-prd-accessibility-download.md` (Granola `66898189`)

Builds on §5.28 (Copy existing assessment as one of the 4 entry options). Adds structural detail:

- Faculty copy an entire prior-year exam: **sections copy, questions copy, structure copies**.
- Faculty-to-section assignments may change after copy (faculty may have left; content coverage dates may differ from prior year).
- Questions should be **movable between sections** post-copy.
- Points structure typically stays the same (most exams = 1 point per question).
- Net result: faculty spend their time editing and reorganizing, not rebuilding from scratch.

> "A way for us to copy the structure in terms of and the questions, but giving them the ability to edit, reorganize questions, move them to other sections. Would help." — Vishaka

Design task generated: T62 (copy assessment — section reorganization UX) — DESIGN-REVIEW.

### 5.41 Faculty exam planning cadence (2026-05-21)

Source: `docs/research/meetings/2026-05-21-assessment-prd-accessibility-download.md` (Granola `66898189`)

Faculty do NOT plan their exam schedule at the start of a term. Typical build window: **10 days to 1 month before the actual exam**. Some faculty wait until the week before. Product should not rely on a term-level "blueprint" of upcoming assessments to drive UX flows. Any "upcoming exam reminder" feature must account for this — it cannot depend on a coordinator inputting a full schedule at term start.

> "Some faculty like working on an assessment ten days before the actual assessment. Like, if a course has two midterms and one final... they may not go at the beginning of the course first week and say, oh, I have two midterms, one on this day." — Vishaka

---

## 6.11 PCE — Phase 1 survey scope (2026-05-14) ⚠️ PARTIALLY SUPERSEDED by §6.12

Source: `apps/pce/docs/research/meetings/2026-05-14-course-eval-base-entities.md` (Granola `6a648f67`)

**⚠️ Answer types: superseded.** §6.12 clarifies that Phase 1 will have 3rd and 4th answer types. Design must use a dropdown, not fixed buttons.

**Answer types Phase 1:** Likert scale + free text as baseline. ~~ONLY~~ — see §6.12.

**NOT Phase 1:** question bank import for surveys, AI-native survey flow (traditional/manual flow comes first), analytics (PRD not yet approved).

**Import method:** PDF document only — no Canvas/LMS integration.

**Likert configurability:** program director sets default pointer at settings level (options: 3, 4, 5, 7, 10). Changing settings does NOT retroactively affect live surveys.

**PRD status:**
- Create template + push survey = ✅ Approved. Start design here.
- Student responses = Adi drafting.
- Analytics = ⏳ In review — wait before designing.

**Base entity design deadline:** Tuesday May 19 (terms, course offerings, faculty landing pages).

---

## 6.12 PCE — Survey status lifecycle, landing page separation, and answer type extensibility (2026-05-26)

Source: `apps/pce/docs/research/meetings/2026-05-26-survey-design-templates-push-workflow.md` (Granola `433fe75c`)

### Survey status lifecycle (full detail)

`Draft → Scheduled → Live → Closed (Pending Review) → Results Released`

| Status | Trigger |
|---|---|
| **Draft** | Survey is being created/configured, not yet pushed |
| **Scheduled** | Push complete; start date is in the future |
| **Live** | Start date reached; collecting responses |
| **Closed / Pending Review** | Close date reached; admin must review open-text comments (hide/unhide) |
| **Results Released** | Admin clicked Release; faculty can now see results |

"Scheduled" is a new status not currently in the code. Design-review task added (T40 PCE).

### Separate landing pages for general surveys and course evaluation

General surveys and course evaluation must have **separate landing pages and separate creation flows.** "Both of them will have separate landing page and separate creation step." — Nipun. Back-end: `survey_type = 'programmatic' vs 'course_evaluation'`. Current single surveys page must be split. New page task: T41 PCE.

### Answer type extensibility

Phase 1 will include **3rd and 4th answer types** beyond Likert and free text. Design must use a **dropdown** for answer type selection — not fixed radio/option buttons. "Definitely, there will be a third type and fourth type very soon. In fact, in phase one only." — Nipun.

### Bounce email NOT tracked

Bounce email data (failed email delivery to students) is NOT shown in the course evaluation UI. "We will not tell the user that this morning [person's] email got bounced. It's fine." Admin should fix wrong email in Prism system.

### Faculty results gated on "Results Released"

Faculty login experience shows surveys only when status = `released`. Before that, faculty cannot see anything.

### Review and Release step

When status = `pending_review`, admin sees a "Review & Release" CTA. Inside: list of open-text comments with per-comment hide/unhide toggle. After reviewing, admin clicks Release → status changes to `released` → faculty can see.

---

### 5.28 Assessment creation entry flow — 4-option modal (2026-05-19) ⚠️ SUPERSEDED by §5.50

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

~~When starting a new assessment, faculty are presented with four options:~~
~~1. Copy an existing assessment~~
~~2. AI-generated~~
~~3. Upload a document~~
~~4. Manually select from QB~~

**⚠️ SUPERSEDED 2026-05-27.** Entry is now **2 options only**: Build new OR Copy existing. AI, QB selection, and PDF import are all question-addition methods INSIDE the builder. See §5.50.

> "How would you like to start? Create questions from scratch, build from your question bank, or use a previous assessment and tweak it. So three options or something like that." — Aarti (2026-05-19; revised 2026-05-27)

### 5.29 AI assessment generation — natural language prompt (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

For option 2 above: faculty type a free-text description of what the assessment should test. NOT dropdown menus for difficulty/Bloom's — a text box with parameter guidance shown below (example prompt provided). AI then selects from the QB. When no good matches exist, AI flags that new questions may need to be created (with option to create or skip).

> "I want to be able to say two difficult questions, five medium questions, three easy questions. [A single] drop down is not going to do it... A text box that has AI where they can feed it what they want it to do." — Aarti

### 5.30 Option locking within questions (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Each question must support locking individual options to a fixed position. Faculty who are "very picky that this option should always be in the third place or the last place" need this. ExamSoft parity. Was absent from existing question editor design.

> "Within a question, option locking is what I did not see. So that will need to [be added]. That's a parity thing." — Aarti

### 5.31 QB quick link from course offering page (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Every course offering page must have a visible quick-access link to the question bank for that course. Must appear in the Overview/Quick Reference area — not just in the global nav. Applied in `course-offering-detail-client.tsx`.

> "There should be a quick link that goes to the question bank that is related to this course hub." — Aarti

> "Why not? That's the obvious thing. Question bank is structured with course." — Aarti

### 5.32 Results access = admin + course coordinator only (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Student scores and assessment results are visible ONLY to admin and course coordinator. Collaborators, contributors, and reviewers cannot see results by default. If the course coordinator wants to share results with someone, that is their choice — the product does not grant it automatically.

> "Seeing the results is today only something we want admin and course director to do. We don't want anybody else to be able to see results of student performance." — Aarti

### 5.33 Review function = question feedback only, not results access (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

"Review" is a capability, not a role. Anyone can be designated as a reviewer. Being a reviewer means you can give feedback on question quality only — it does NOT grant access to see how students performed. Review and results access are completely separate gates.

> "Review is a separate function. It's a feedback for questions. Scoring is a different function, and result is limited to only the core people in the course. And then they have the ability to share that with whoever they [want]." — Aarti

### 5.34 Course offerings sorted descending, max 6-8 shown (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Wherever course offerings are listed (QB context, course catalog), show them in reverse-chronological order (most recent first). Default view shows 6–8; older offerings accessible via load-more. Rationale: current offering is primary; historical offerings are reference only.

> "Put this in descending order, first of all, because my most current course offering is what I care about the most and will be what I'm working [on]. You can keep the interface cleaner... six is also more than enough." — Aarti

### 5.35 Download exam — ~~confirmed Phase 1~~ ⚠️ SUPERSEDED by §5.47 — now Q1 2027 (2026-05-19 decision; revised 2026-05-27)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Download exam capability is confirmed for Phase 1. The default exam-taking experience should be download-and-take, not browser-only. Universities deal with WiFi failures and will face backlash if browser-only. Closes R3.

> "Our out of the box should be download and take it. That way, the faculty and the instructors don't have to deal with any technical issues on the day off, which is always a problem." — Aarti

### 5.36 AI tagging — always background, manual takes precedence (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

AI tagging runs in the background on all questions at all times. Manual tagging (faculty-applied) takes precedence when both exist. Visual treatment: AI-generated tags shown with sparkle icon or pastel colors; manually-applied tags shown at full visual weight. One tagging system — not two separate flows.

> "AI should have the tagging done. And manual tagging precedes it. If there is a conflict between AI thinks this [and] manually they are saying this, we will treat it as [manual]." — Aarti

### 5.37 Health-of-assessment review screen before publish (2026-05-19)

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md` (Granola `f59cfbe4`)

Before publishing any assessment — regardless of creation pathway — faculty see a unified health review screen. Columns to align on with PMs (before designing): frequency of question use, point-biserial score, difficulty distribution, Bloom's taxonomy coverage. Also flags questions with missing rationale.

> "No matter which way you do it, ultimately, you do the review. And... that review screen should call out: frequency of question use, the point-biserial... score... Bloom's taxonomy. Those four, five columns, we need to align on. And that is what I mean when I say get some PM alignment on." — Aarti

### 5.42 Assessment creation — "Copy from existing" includes same-term (2026-05-22)

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md` (Granola `1ce6d16e`)

"Copy from existing" is not limited to prior-term exams. Same-term assessments are valid sources. Existing modal label ("Copy from existing") is correct. This clarifies §5.28.

> "You can change user previous terms assessment. It could be the same term also. Right? So user previous assessment is fine." — Vishaka

### 5.43 Assessment creation — two-stage flow: build first, publish second (2026-05-22)

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md` (Granola `1ce6d16e`)

Assessment setup must be split into two distinct stages:
- **Stage 1 (Build):** Assessment name + metadata + question selection/creation. Nothing about delivery.
- **Stage 2 (Publish):** Dates, download window, randomization, time limit, scoring publication mode.

Faculty building their assessment should not be shown delivery/scheduling options until the question-building stage is complete.

> "Administration of exam related setup, like the dates, the publishing, the download window, whether they want to randomize, what is the time, scoring, all of that should be a separate workspace for them. Because when they are putting together the assessment, they are just worrying about, okay, which questions do I want to include?" — Vishaka

Design task generated: T66 (two-stage assessment creation flow) — DESIGN-REVIEW.

### 5.44 Question editor — reference documents/images upload is missing (2026-05-22)

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md` (Granola `1ce6d16e`)

Vishaka asked where reference documents and images are uploaded in the question creation form. Currently they are not present. Must be added before Tuesday review. Applies to all question types — a question may reference an image or external document that students see alongside the question.

> "Where in the process of creating a question, where are you allowing for the reference documents to be uploaded?" — Vishaka

Design task generated: T65 (reference documents/images in question editor) — DESIGN-REVIEW.

### 5.45 Question editor — essay rubric is optional, framed for AI grading (2026-05-22)

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md` (Granola `1ce6d16e`)

For essay-type questions, the rubric is optional — faculty can skip it and grade manually. When provided, AI can use the rubric to assist with grading suggestions. Framing: "Optional rubric — if you want AI to support grading."

Applied today: updated rubric label in `QuestionEditor` EssayControls (question-editor.tsx).

> "Make make this rubric optional. Okay. And say, optional rubric in case you want AI to support grading or recommend grading or whatever. So they know it's optional. They can move on. They don't have to do anything." — Vishaka

### 5.46 Question editor — scoring must be complete: per-question + per-option (2026-05-22)

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md` (Granola `1ce6d16e`)

Every question form must show all of:
1. **Per-question total score** — how many points this question is worth
2. **Per-option score** — default: correct option = N points, all others = 0
3. **Editable partial credit** — instructor can override any option's point value ("I'll make that zero, two and a half")

Current question editor is missing items 1 and 2 entirely. Partial credit toggle exists but shows no point values. This is a P0 blocker — Aarti expects to see complete scoring by Tuesday.

> "The correct choice is going to have five points. The other ones is going to have zero points or 10 points or 20 points or 100 points. The default is that there is a right answer and everything else is zero. But I want to give somebody a partial credit. I'll make that zero, two and a half." — Vishaka

> "When I when we look at the data on Tuesday, can we make sure that if there are 10 things that have to be set up for a question, that all 10 things are addressed." — Aarti

Design task generated: T64 (scoring fields in question editor) — DESIGN-REVIEW.

### 5.47 Offline mode / download exam — Q1 deliverable, NOT December launch (2026-05-27)

Source: `docs/research/meetings/2026-05-27-exam-management-status-offline-faculty-access.md` (Granola `943b9e4a`)

**⚠️ SUPERSEDES §5.35 and T58.** Download exam / offline mode is no longer a Phase 1 (December 2026) deliverable. December launch = browser-only.

- Browser-based exam has a preload safety net: all exam data downloads at exam start. WiFi drop after start does not strand students. Known gap: if WiFi fails before login, student cannot begin.
- Offline mode (download file in advance, lockdown during exam) = **Q1 2027 target.**
- No standalone desktop client being built. **Respondus integration** (lockdown browser vendor) preferred over building own. Research required.

> "We are not going to make standalone desktop a must-have for launch. It will be highly desirable to have it, but not a must-have. As long as there is a fixed date by which we can do it." — Aarti

Design tasks updated: T58 revised to Q1. T69 (Respondus integration research) added to backlog.

### 5.48 Faculty access levels — 4-tier model, roles document needed (2026-05-27)

Source: `docs/research/meetings/2026-05-27-exam-management-status-offline-faculty-access.md` (Granola `943b9e4a`)

Four tiers of faculty access at the course level:

| Tier | Capability |
|---|---|
| **Full access** | CRUD on assessments, questions, students, accommodations |
| **Read-only** | View everything, modify nothing |
| **Add assessments (own only)** | Create and edit their own assessments; cannot modify others' |
| **Section contributor** | Add/modify questions in their assigned section only — **Phase 2** |

Score visibility is independent: contributor/reviewer access does NOT grant access to student scores (reinforces §5.32). Roles alignment document (Romit + PMs + Vishaka) is a P0 blocker before designing access-control screens. T68 added to backlog.

### 5.49 Contributor and reviewer workflows — Phase 2 confirmed (2026-05-27)

Source: `docs/research/meetings/2026-05-27-exam-management-status-offline-faculty-access.md` (Granola `943b9e4a`) + `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

Both contributor workflow (faculty assigned to a section with question target + deadline) and reviewer workflow (send assessment for question-quality feedback) are **explicitly deferred to Phase 2.** Confirmed in two separate meetings on the same day.

Code status: neither workflow was built into the assessment builder. The design prototype had the section-assignment UI but code does not. No code removal needed — design direction is confirmed.

### 5.50 Assessment creation entry — reduced to 2 options; all methods inside builder (2026-05-27)

Source: `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

**⚠️ SUPERSEDES §5.28 (4-option entry modal).** Entry is now 2 options only:

1. **Build new** (blank start)
2. **Copy existing** (from any prior or current-term assessment)

AI prompt, question bank selection, and PDF import all move **inside the builder** as question-addition methods available during creation — not as separate starting paths. The current `create-assessment-modal.tsx` already implements 2 options correctly. **T51 (4-option modal build) is CANCELLED.**

> "In the beginning, limiting it to two options, like copy from somewhere or create new, are good options." — Aarti

### 5.51 Point-biserial: number in builder, red if negative (2026-05-27)

Source: `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

During question selection in the assessment builder, show point-biserial as a **plain number** in the question row. If the value is negative, render it **red**. Future enhancement (not committed): flag questions in the bottom 20th percentile by a calculated threshold. No scatter plot — reinforces §5.15.

> "Showing the number and making it in red if it's negative are good starting points for us." — Nipun + Aarti

Design task: T71 added to backlog.

### 5.52 Assessment summary screen before publish (2026-05-27)

Source: `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

Before final publish, faculty see a summary screen showing: total questions, expected completion time, psychometric summary (point-biserial range, difficulty distribution, Bloom's coverage), questions with missing rationale flagged. This sits between Stage 2 (Build) and Stage 3 (Publish). NEW PAGE NEEDED.

Design task: T72 added to backlog — DESIGN-REVIEW.

### 5.53 Match-the-following confirmed for Phase 1 (2026-05-27)

Source: `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

Nipun confirmed match-the-following is included in the Phase 1 question types list. Design needs to cover this type when building question-editor screens.

### 5.54 Assessment setup, timers, upload formats, and AI scope (2026-05-28)

Source: `docs/research/meetings/2026-05-28-assessment-setup-ai-automation.md` (Granola `925fa644`)

**Section back-navigation: no restriction.** Free navigation between exam sections. No ExamSoft-style lock. If a configurable setting is ever added, default = allow. D_EM62.

**Section-level timer → Phase 2.** Used almost exclusively in licensure standardized exams; not a typical midterm/final need. D_EM63.

**Question-level timer (visible config) → Phase 2. Background tracking = Phase 1 from day one.** System silently logs time-per-question (render → navigate-away). No visible per-question timer shown to students. D_EM64.

**Document upload: PDF AND Word (.doc/.docx).** Faculty create questions in Word; they only print to PDF. Both formats must be accepted in question import. D_EM66.

**Assessment setup: comprehensive single-page view.** All setup items on one view. Do not split config before/after question selection. Use ExamSoft setup page as a starting reference (not to copy — to exceed). D_EM67.

**Question tagging to standards/competencies = Phase 1 must-have** (reconfirms T10). Direct question→standard/competency mapping is ExamSoft parity. D_EM68.

**Curricular assessment loop (via LMS/Prism course-objective mapping) → post-launch.** Prerequisite data not reliably available. Does not block D_EM68 (direct tagging). D_EM69.

**AI features for assessment creation = post-launch nice-to-haves.** Phase 1 ceiling = basic keyword/tag-based AI question search from QB. D_EM70.

### 5.55 Design priority order and QB pinning issue (2026-05-28)

Source: `docs/research/meetings/2026-05-28-design-priorities-bandwidth.md` (Granola `9781e589`)

**Design priority order:** (1) Question Bank cleanup → (2) Student experience → (3) PCE template structure → (4) Assessment workflow. D_EM71.

**QB pinning feature — UX incorrectly designed.** Nipun: "from the information hierarchy UX perspective, made wrongly." Needs redesign or removal. Do NOT build additional pin UI. Nipun to provide direction. Implementation in `qb-sidebar.tsx:513–535`. D_EM72. Design task T76.

**Assessment design review with Aarti (May 29) cancelled.** Next review: Wednesday with Aarti, focused on assessment workflow. D_EM73.

---

### 5.56 Assessment taker — question label format, navigation panel, and accessibility (2026-06-01)

Source: `docs/research/meetings/2026-06-01-exam-taker-navigation-rohit.md` (Granola `caaae283`)  
Participants: Romit + Rohit. Design review before dev handoff. Nipun + Vishal to review next day.

**Question label format: remove "Question N" prefix.** Rohit: *"The word question is redundant because we know everything is a question. You can simply put it as seven dot [stem]."* **APPLIED:** `SplitQuestionView.tsx` — removed separate `<span>Question {N}</span>` heading, merged to `{N}. {stem}` inline in the `<h2>`. D_AT01.

**Navigation panel: surface only flagged questions.** Rohit: *"Only flagged can be surfaced here. After I answer a lot of questions, I don't need the answered questions. I only need the flagged ones."* Answered count shown as summary chip at top; not listed individually. DESIGN-REVIEW — T78, extends T35. D_AT02.

**Navigation position: move to LEFT.** Rohit: *"I don't want the student's cursor to move across too much. Always surface the questions on the left."* References USMLE/GRE/GMAT layout. Major layout change — T79. D_AT03.

**Keyboard shortcuts: must support full mouse-free navigation (WCAG accessibility).** Rohit: *"Somebody who has an accessibility issue... should be able to completely use the exam without any mouse."* All shortcuts exposed via a button-triggered modal. T80. D_AT08.

**"Flag" vocabulary split: Bookmark + Report an issue.** Romit proposed, Rohit agreed. "Flag" is ambiguous — currently serves two separate student intents. Two distinct flows needed. T81. D_AT05.

**"Report an issue" button: de-emphasize.** Rohit: *"Flagging a question for faculty's review is not something you come across regularly. Put it inside the settings button or somewhere at the bottom."* T82. D_AT06.

**Audio/video support: NOT Phase 1.** Rohit: *"We are actually not supporting audio in the first phase. Because that is still not a common thing that people ask."* Already noted in `PreExamFlow.tsx` comment. D_AT07.

**DS accessibility gaps: Himanshu nudge.** Color blindness simulation, voice narrator, calculator/keyboard not covered in current DS. Rohit to raise with Himanshu. Action item only — no code change. D_AT10.

---

## 6.13 PCE — Navigation structure, moderation placement, and survey list redesign (2026-05-28)

Source: `apps/pce/docs/research/meetings/2026-05-28-survey-template-moderation-monil.md` (Granola `81beffd7`)

### Navigation: two separate top-level entries (D_PCE33)

Post Course Evaluation and Programmatic Survey are **two separate top-level left nav entries** — not tabs, not merged. "Tabs are your day to day action capabilities. Tabs are not products. On the sidebar." — Monil. Both share sub-sections: surveys list, templates. Analytics = deferred (Monil hasn't started product thinking). Setup = PCE only.

### Moderation: removed from sidebar nav (D_PCE34)

"Ideally, it should be removed because subset. It is not an action that user takes every day." — Monil. **APPLIED:** removed 'Review & Moderation' from ADMIN_NAV in `app-sidebar.tsx`. Replaced by: (1) attention banner above surveys table when pending_review surveys exist, (2) "Review & Release" action on pending_review rows in Action column (T52 — DESIGN-REVIEW).

### Survey list: no horizontal grouping; status filter instead (D_PCE35)

"We don't need this. There is already a status column. We just have to add a filter, status filter." — Monil. **APPLIED:** removed `defaultGroupBy="status"` + `groupLabels` + `groupOrder` from DataTable in `surveys/page.tsx`. Added status filter Select dropdown. Added pending-review attention banner above the table.

### Survey table: Action column (D_PCE36)

New "Action" column with role-appropriate CTAs: preview / pending result / review & release. Merges details + deadline into one column. **DESIGN-REVIEW** — T52.

### Report access step: cross-table (D_PCE37, D_PCE38)

In the create-survey flow, a report access step shows which roles can see which roles' responses. Cross-table: left column = roles being evaluated (Instructor, Course Coordinator), right columns = viewer roles (Instructor, Coordinator, Program Admin, Program Director, Department Chair). Placement: inside create-survey flow for now; may move to Settings later. **DESIGN-REVIEW** — T53.

---

### 5.57 Vocabulary killed in prototype — "ad hoc", "view more", "Past" (2026-06-03)

Source: `docs/research/meetings/2026-06-03-weekly-product-sync.md` (Granola `7a53688f`)

Aarti reviewed Nipun's rough assessment prototype and killed three vocabulary/pattern items. None of these were present in Romit's built code — documented here to prevent future introduction.

| Killed | Why | Status |
|---|---|---|
| "Ad hoc assessments" label | Aarti: "what does ad hoc versus non ad hoc mean?" | Never in code; do not introduce |
| "View three more assessments" collapsed pattern | Aarti: "I do not also like the idea of hiding the past assessments under view three more assessments. That's just unnecessary clicks. It's okay to just make it longer scroll bar." | Never in code; do not introduce |
| "Past" label for completed assessments | Aarti: "I also don't know if the word past is the better word for it... grading is something you would do on a completed assessment. Past always gives me understanding of it's complete and done and dusted." | Code uses "Completed" — correct. |

### 5.58 System compatibility check → background only, never a visible step (2026-06-03)

Source: `docs/research/meetings/2026-06-03-exam-management-sync-nipun.md` (Granola `d4f85e99`)

System compatibility check (browser version, connectivity, storage) runs silently in the background. It must NEVER be a blocking visible step in the student pre-exam flow. It surfaces only on failure (e.g., incompatible browser).

> "That can be a background check and surface only when there is an issue. You don't have to have it in the main flow is what I'm trying to tell you." — Nipun

**Applied:** Removed `System Check` step from `PreExamFlow.tsx`. Flow is now 4 steps: Password → Instructions → Accommodation → Ready. D_AT11.

### 5.59 Reference attachments — scope and structure (2026-06-03)

Source: `docs/research/meetings/2026-06-03-exam-management-sync-nipun.md` (Granola `d4f85e99`)

Extends §5.27 and T48. Precise rules confirmed:

| Level | Rule |
|---|---|
| **Question-level** | Multiple attachments allowed. No limit on count. Total size limit 200MB. Rendered as tabs in the split view second pane. Supports: PDF, doc, table, video, audio, image. |
| **Assessment-level** | ONE global reference doc for the whole exam (e.g., formula sheets, unit conversion tables). Shown globally accessible to student throughout exam. |
| **Section-level** | NOT supported. "Will complicate it too much." |

> "Assessment level, 100%, we will have [one global doc]. Section level, I feel we'll have, but that I can confirm... assessment level and not go into section level." — Nipun

> "There's no limit on the number of attachments. The only limit is the size of the attachments." — Nipun (citing ExamSoft parity)

Design task: T84 — update T48 design when building attachment surface. DESIGN-REVIEW.

---

## 6.14 PCE — Prism nav alignment + term start/end date reminder (2026-06-03)

Source: `apps/pce/docs/research/meetings/2026-06-03-weekly-product-sync.md` (Granola `7a53688f`)

### Search and Ask Leo placement (D_PCE42)

Search and Ask Leo must stay in the **Prism top panel** — not in the left sidebar. This applies to PCE and all products.

> "Search for example, should not be moved into the left hand [side]. It should be something that we put on the browser on the top... And then same thing with Ask Leo. These are things that are on the top panel... we cannot make them into left hand side menus. That's not going to work out." — Aarti

Any structural nav change requires alignment with Himanshu + Yash before applying. T57 (PCE backlog).

### Term missing start/end dates → reminder (D_PCE41)

If the program has not entered start/end dates for a term in the academic calendar, PCE must show a reminder/link to go set them up. Course evaluation relies on term dates.

> "Some message if they haven't... entered the start date and end date... a reminder to go add start date and date. So a link to come here or something might also be required." — Aarti

T58 (PCE backlog). New UI pattern — DESIGN-REVIEW.

### Academic year: do not collect separately (D_PCE40)

Term picker already shows `{term name} · {academic year}` combined. Do not add a separate "Academic Year" field. Already correct in current code.

> "We don't need to collect the academic year twice." — Aarti

### 5.60 Question bank design review — filters, AI scope, and readability (2026-06-06)

Source: `docs/research/meetings/2026-06-06-question-bank-design-kunal.md` (Granola `7729d58c`)  
Participants: Romit + Kunal (Eng) + Aarti

| Decision | Detail |
|---|---|
| **Resizable QB panel (D_QB01)** | Vertical divider between QB folder sidebar and question list must be draggable. Users need to widen the sidebar when course/folder names are long. |
| **"Not Assigned" virtual folder (D_QB02)** | QB left sidebar must include a virtual item (alongside "All Questions") that shows only questions not assigned to any folder or location. Kunal is implementing on engineering side. |
| **Courses with zero questions filter (D_QB03)** | Admin must be able to filter the course list to see only courses with zero QB questions tagged. Aarti: "Show me all of the courses which have zero questions tagged to them." |
| **AI features stay in all designs (D_QB04)** | Even if engineering does not implement an AI feature on the current sprint, the UI/UX must show the full end-state including AI. Design does not wait for engineering. Engineering picks up features on their timeline. |
| **QB filter = Prism filter (D_QB05)** | QB filter interaction (filter icon, layout control, drag to resize, export) must exactly match Prism's table filter pattern. Users must not need to relearn filtering when entering exam management. |
| **QB question title: semibold (D_QB06)** | Question stem in QB table rows must use font-semibold for readability and visual differentiation from metadata. ✅ APPLIED: `qb-table.tsx` line ~3834. |
| **Section visibility during scroll (D_QB07)** | While building or reviewing a multi-section assessment, the user must always know which section they are currently in. A sticky section header or floating section label is required in the assessment builder. |

> "Your UI UX should be the end state. Whether Vishal and team pick it up and when do they introduce it and stuff like that is a different question." — Aarti, 2026-06-06

> "Show me all of the courses which have zero questions tagged to them." — Aarti, 2026-06-06

**Note on existing QB Sheet panels:** Version history (per-version course + avg score) and Usage panel (used count + last used date + avg score + P-bis) are already built in the question detail Sheet. Kunal demoed these as part of the engineering implementation review.

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
| 2026-05-19 13:59 | Assessment creation workflows and question bank design | `f59cfbe4` | Aarti + Vishaka + Romit |
| 2026-05-21 10:33 | Assessment PRD — accessibility standards, offline exam download, and parity with ExamSoft | `66898189` | Vishaka + Nipun + Romit |
| 2026-05-22 13:23 | Assessment question design — AI features, scoring, and workflow | `1ce6d16e` | Aarti + Vishaka + Romit |
| 2026-05-27 07:29 | Exam management — assessment creation, faculty access, and offline mode | `943b9e4a` | Aarti + Vishal + Nipun + Romit |
| 2026-05-27 05:57 | Assessment creation — entry points, question selection, and setup workflow | `693723b8` | Aarti + Vishaka + Nipun + Romit |
| 2026-05-28 10:04 | Design priorities and bandwidth planning — question bank, student experience, and assessment | `9781e589` | Nipun + Vishal + Romit |
| 2026-05-28 10:33 | Assessment setup and AI automation features for exam management | `925fa644` | Nipun + Vishal + Romit |
| 2026-05-28 09:30 | Survey and template design — layout, moderation, and report access with Monil | `81beffd7` | Monil + Romit |
| 2026-06-01 10:16 | Exam taker design review — navigation, question layout, and accessibility with Rohit | `caaae283` | Rohit + Romit |
| 2026-06-03 07:30 | Weekly Product Sync — assessment creation prototypes, PCE navigation, Prism alignment | `7a53688f` | Aarti + Vishaka + Nipun + Vishal + Romit |
| 2026-06-03 10:00 | Exam Management sync — assessment creation scope, system check, reference attachments | `d4f85e99` | Nipun + Romit |
| 2026-06-06 12:48 | Question bank design — filters, AI generation, and answer rationale | `7729d58c` | Kunal (Eng) + Aarti + Romit |

Per-meeting raw notes at `apps/exam-management/docs/research/meetings/` and `apps/pce/docs/research/meetings/`.

---

## How to maintain this doc

- Add new Aarti decisions as they're made — append to relevant section, cite meeting + date.
- Mark superseded decisions explicitly; don't delete.
- When an ADR is drafted from a decision here, link to it.