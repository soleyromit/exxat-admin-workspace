---
type: meeting
date: 2026-05-19
product: exam-management
participants: [Romit, Aarti, Vishaka]
source: granola
granola_id: f59cfbe4-8964-4169-af2f-d1ccd6f91c06
---

# Assessment Creation Workflows and Question Bank Design

**Date:** 2026-05-19 · **Time:** 1:59 PM EDT

## Topics covered

1. Four assessment creation pathways — entry modal
2. AI assessment generation via natural language prompt
3. Option locking within questions (new config gap identified)
4. Rationale editing in-context during assessment creation
5. Assignment type deprioritization (LMS handles it)
6. Collaborator role + results access isolation
7. Review function vs. results access — explicitly separated
8. QB quick link from course offering page
9. Course offerings sorted descending, max 6-8 shown
10. Download exam — confirmed Phase 1, default out-of-box
11. Health of assessment review screen before publish
12. AI tagging: background always on, manual takes precedence

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM17 | **Assessment creation entry point = 4-option modal**: (1) Copy existing assessment, (2) AI-generated via text prompt, (3) Upload document for AI to parse, (4) Manually select from QB | Admin / Faculty | — |
| D_EM18 | **AI assessment generation = natural language text prompt**, not dropdown menus. Parameters shown as guidance (difficulty distribution, Bloom's level, topic scope). One example prompt below the text box. AI selects from QB; flags when new Qs needed | Admin / Faculty | — |
| D_EM19 | **Option locking per question** — faculty can pin an option to a fixed position. Parity with ExamSoft. Was missing from current question config design | Admin / Faculty | — |
| D_EM20 | **Rationale editable in-context** — when building assessment, faculty can edit a question's rationale without leaving. Edits save back to QB (rationale lives at QB level, not assessment level) | Admin / Faculty | — |
| D_EM21 | **Assignment type deprioritizable** — faculty use LMS (Canvas) for assignments; forcing them into exam management creates friction. Phase 1 can defer. Back end should accommodate but no Phase 1 UI requirement | Admin / Faculty | — |
| D_EM22 | **Results access = admin + course coordinator ONLY**. Collaborators, contributors, and reviewers CANNOT see student scores. Course coordinator can choose to share — that is their decision, not a product default | Admin / Faculty | — |
| D_EM23 | **Review = feedback on questions, not results access**. Being designated as a reviewer gives feedback capability on questions only. It does NOT grant access to see how students performed | Admin / Faculty | — |
| D_EM24 | **QB quick link from course offering page** — every course offering must have a visible quick-access link to the question bank for that course. Must appear in the overview/sidebar area of the page, not just in the nav | Admin / Faculty | — |
| D_EM25 | **Course offerings listed descending** (most recent first). Show max 6–8 by default; older offerings accessible via load-more. Rationale: current offering is primary; older ones are reference only | Admin / Faculty | — |
| D_EM26 | **Download exam = confirmed Phase 1 feature**. Default should be download-and-take (not browser-only). Universities need printed backup for WiFi failures. "Our out-of-the-box should be download and take it." | Admin / Faculty / Student | — |
| D_EM27 | **AI tagging always runs in background**. Manual tagging takes precedence when both exist. Visual treatment to distinguish: AI tags shown with sparkle icon or pastel color; manual tags shown at full weight. One tagging system — not two separate flows | Admin / Faculty | — |
| D_EM28 | **Health-of-assessment review screen before publish** — same screen regardless of creation pathway. Shows: frequency of question use, point-biserial score, difficulty distribution, Bloom's taxonomy coverage. Flags missing rationale per question | Admin / Faculty | — |

---

## Verbatim quotes

> "We should not, and that should be bad. I think we should build that. We launch. Because browser Wi-Fi... university Wi-Fi is reliable... so we should not bet on everyone taking it on the browser. That's not a safe option. Our out of the box should be download and take it." — Aarti (on download exam)

> "You never want the faculty to stop doing what they're doing in their workflow of creating the assessment [to] go to the question bank, pick that question, then edit it, then come back here. So that's a big no no. Anywhere in the product, you are not going to have to stop your work to go do something somewhere else." — Aarti (on in-context rationale editing)

> "Within a question, option locking is what I did not see. So that will need to [be added]." — Aarti

> "See, there should be... a quick link [that goes] to the question bank that is related to this course hub." — Aarti (on QB link from course offering page)

> "Seeing the results is today only something we want admin and course director to do." — Aarti

> "Review is a separate function. It's a feedback for questions. Scoring is a different function, and result is limited to only the core people in the course." — Aarti

> "AI should have the tagging done. And manual tagging precedes it... if there is a conflict between AI thinks this [and] manually they are saying this, we will treat it as [manual]. Because there's a lot of context while teaching." — Aarti

> "How would you like to start? Create questions from scratch, build from your question bank, or use a previous assessment and tweak it." — Aarti (describing the creation entry modal)

> "For doing that, the coordinator has to set up a rubric... so if we are seeing rubric based assessments will come later... but we will have to build it as a comprehensive one and rubric based and make that available later if you want." — Aarti (on rubric grading — Phase 2)

> "I really want to be able to see screens and see detailed BRDs, not superficial BRDs about this. And so I'm getting anxious. We will make progress over the next few weeks." — Aarti

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx:703` | `OverviewTab` renders Description + Learning Objectives + Quick Reference sidebar but NO question bank quick link | D_EM24 not yet implemented → add QB quick link to Quick Reference sidebar. Applied today. |
| `apps/exam-management/admin/components/assign-practice-dialog.tsx` | Orphaned component, no imports, feature killed (§5.19) | Removed today. |
| `apps/exam-management/admin/components/question-scatter-plot.tsx` | Orphaned component, no imports, feature killed (§5.15 / design rules) | Removed today. |
| `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx` | Option locking config not present in question setup form | D_EM19 not yet implemented → T53 backlog |
| `apps/exam-management/admin/components/create-assessment-modal.tsx` | Single-step creation modal; does not offer 4-option entry | D_EM17 not yet implemented → T51 backlog (DESIGN-REVIEW) |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T51 — Assessment creation entry modal — 4-option flow | P1 | New screen needed: option cards for Copy / AI / Upload / Manual. DESIGN-REVIEW — structural. |
| T52 — AI text prompt for assessment generation | P1 | Text area input (not dropdowns). Parameter guidance text below. One example prompt. AI selects from QB, flags gaps. Pairs with T51 option 2. |
| T53 — Option locking per question (question-level config) | P1 | Lock option positions in question setup. ExamSoft parity. Add to question editor config panel. |
| T54 — QB quick link on course offering overview | P1 | Add visible quick-reference link from course offering overview page to the course's question bank. Applied today in `course-offering-detail-client.tsx`. |
| T55 — Results access: admin + course coordinator isolation | P1 | Role-gate: collaborators/contributors/reviewers cannot see student scores. Coordinator can share at their discretion. DESIGN-REVIEW — auth architecture. |
| T56 — Review function separated from results access | P1 | Reviewer role = question feedback only. Must not surface student performance data. DESIGN-REVIEW — data model. |
| T57 — Course offerings sorted descending, max 6-8 shown | P2 | In QB context and any list of course offerings: reverse-chrono, load-more for older. |
| T58 — Download exam as Phase 1 confirmed | P1 | Upgrade R3 from research to confirmed feature. Default = download-and-take. Student flow already has download section (T30) but admin side needs download generation support. Flag for PM/back-end alignment. |

---

## Base Entity Design Review (same meeting — Romit showed prototype to Aarti + Vishaka)

> Note: The second half of this meeting was a live design review of the base entity prototypes (Student, Faculty, Course Offering). Decisions below are from that portion of the raw transcript.

### Decisions

| # | Decision | Scope | Quote |
|---|---|---|---|
| D_EM_BASE1 | **LMS integration chip on Course Offering header** — if Canvas/LMS is linked, show a chip on the course offering page header indicating the sync source. Not a "full record" link — frame it as a "view" not a "record". | Admin / Faculty | "There can be a chip that indicates if there is a link between the course offering and LMS integration. There is already a link and we are pulling data from their LMS or not." — Vishaka |
| D_EM_BASE2 | **Course Offering overview Phase 1 = QB stats only. Learning objectives deprioritized.** QB quick link + basic stats (# questions) is the primary overview content. Learning objectives in the overview = Phase 2. "We should be very intentional in why are they here — they are here to create and administer assessments." | Admin / Faculty | "Question bank is more relevant for this page than showing objectives... Question bank is the perfect landing spot. So we can say that Phase 1, we will only have the question bank stats." — Aarti |
| D_EM_BASE3 | **Tab counter badges on Course Offering** — student count, faculty count, assessment count shown as badge counters on the tab labels. Aarti explicitly called out these counters as "everything I need to know about the course." | Admin / Faculty | "There is no students, so there's no chip on the student. Like, counter on the student. But if there is, the counter tells me everything I need to know about the course." — Aarti |
| D_EM_BASE4 | **Faculty detail must show: courses owned, QB folders owned, assessments created, pending reviews.** These are first-class columns/sections on the faculty detail page — not secondary. | Admin | "I want to see how is the faculty doing, which courses are they owning, which banks do they own, which assessments have they created, which reviews are they pending. Like, it's part of my product and my workflow." — Aarti |
| D_EM_BASE5 | **Student entity has two distinct modes: setup (manage) and outcome (performance).** Setup = add/remove/disable students, manage LTI import. Outcome = how is this student doing — # assessments taken, performance across assessments, fun engagement stats. These are two different views/contexts, not one blended page. | Admin | "When you show it under setup, you are allowing me to add a student, remove a student... But when I tell you to bubble up the student as a stakeholder entry or an analyzable or an interpretation thing, I want to know how is the student doing." — Aarti |
| D_EM_BASE6 | **Left nav order: QB first, Courses second**, then other entities. QB is the primary daily-use entity; courses are the organizational container. | Admin / Faculty | "Question bank can be on the top and then courses can be the second one, and then some of these other things can fall at the bottom." — Aarti |
| D_EM_BASE7 | **Content Area + Competency are first-class navigation entities (Phase 2), not just standards.** Each gets a dedicated left-nav entry with its own dashboard: courses covering it, assessments mapped to it, QB coverage, student performance on it. Phase 1 = basic setup only. Phase 2 = full analytics/heat map dashboard. | Admin | "I want a left hand side menu that says content area. Then I want a way to — a dashboard of sorts, a report, a heat map, multiple tabs... helping me do a deep dive on how I'm doing on each of the content." — Aarti |

---

### Verbatim quotes (base entity section)

> "The default landing should always be assessments, like we talked about because they are in the assessment model." — Aarti (Course Offering landing tab)

> "See, there should be — a quick link [that goes] to the question bank that is related to this course hub. Oh, yeah. No. We didn't go to that extent yet... Why not? That's the obvious thing. Question bank is structured with course. I'm not going to ever have somebody come in and work here in isolation. They'll pretty much always pick their course and go to the question bank for that course." — Aarti (QB link from Course Offering)

> "Not full course record — they think about it as a view. Full course view in Prism. Or not full course record." — Vishaka (on Prism fallback link label — call it "view" not "record")

> "Which courses are they owning, which banks do they own, which assessments have they created, which reviews are they pending. Like, it's part of my product and my workflow and everything." — Aarti (on Faculty detail required fields)

> "When you show it here [in setup], you are allowing me to add a student, remove a student, make a student, disable, invite student to the platform... But when I tell you to bubble up the student as a stakeholder entry or an analyzable or an interpretation thing, then I want to know how is the student doing." — Aarti (setup vs. outcome mode)

> "Course is a vehicle through which you achieve your goal of teaching all your content areas to your students... I'm only going to look through the lens of a vehicle — how will I get the big picture?" — Aarti (on Content Area as a top-level entity)

---

### Design tasks generated (base entity portion)

| Task | Priority | Notes |
|---|---|---|
| T59 — LMS chip on Course Offering header | P1 | Small chip near title showing Canvas sync status. "Linked to Canvas" / "Not linked". Not a record link — a status indicator. |
| T60 — QB stats block on Course Offering overview | P1 | Replace or supplement learning objectives with QB quick link + stats (# questions, last updated). Phase 1. Learning objectives move to Phase 2. |
| T61 — Tab counter badges on Course Offering | P1 | Add count badges to Students / Faculty / Assessments tabs (mirrors pattern already on Student detail). |
| T62 — Faculty detail: pending reviews + QB folders + assessments created | P1 | Add these as columns/sections to faculty detail. Pending reviews needs a dedicated section. |
| T63 — Prism fallback label: "View full profile" → "View in Prism" (no "record") | P2 | Small wording fix per Vishaka. Already partially correct in student detail — audit faculty detail too. |
| T64 — Content Area + Competency entities (Phase 2 backlog) | P2 backlog | Dedicated left-nav entries, each with analytics dashboard tabs. Not Phase 1. Add to backlog now so backend architecture accounts for it. |

---

## Additional Decisions — from SharePoint summary (same meeting, May 19)

> Source: Written summary doc shared to SharePoint. Supplements raw Granola transcript. Adds detail on items partially covered above and introduces new decisions not yet recorded.

### Exam Delivery

| # | Decision | Scope |
|---|---|---|
| D_EM29 | **Print-ready exam generation required.** System must produce print-ready Scantron copies. Course admins keep 2–3 printed copies per exam as device-failure backup. Print output is a deliverable, not a nice-to-have. | Admin |
| D_EM30 | **Five-stage exam workflow is the official model.** Create → Publish/Distribute → Take (download + upload as sub-steps) → Grade (review, curve, publish results) → Review (optional, per assessment, coordinator's discretion). | All |
| D_EM31 | **Student post-grade review: password-gated, locked browser, shows Q + student answer + correct answer + rationale.** Instructor opt-in per assessment. Rationale display is also instructor-controlled. Browser must block copy, export, and screenshot. | Student / Admin |

### Assessment Creation Detail

| # | Decision | Scope |
|---|---|---|
| D_EM32 | **Question source tagging in AI workflow.** Every AI-surfaced question labeled visibly as "selected from bank" or "newly generated." When faculty accept a newly generated question, it auto-flows into the QB. Transparent sourcing is mandatory, not optional. | Admin / Faculty |
| D_EM33 | **Import fuzzy matching UI.** When a PDF/Word exam is uploaded, AI parses each question and displays match status: "found in QB" or "not found." User decides per question: link to existing question or save as new. Prevents silent duplication; allows legitimate variants. | Admin / Faculty |
| D_EM34 | **Question versioning trigger = edited after use only.** A new version is created only when a question is edited after it has already been used in a published assessment. Prior versions preserved with original assessment data. Rationale cannot differ between uses of the same question version — it is fixed at the version level. | Admin / Faculty |
| D_EM35 | **Question ownership and authorship tracked.** Every question has an original author. Ownership is transferable. Bulk ownership transfer must be supported for faculty departures. Contributors cannot edit questions they do not own. Open question: may RBAC at folder level make explicit ownership redundant — confirm with engineering. | Admin |
| D_EM36 | **Outside-course assessment creation = Phase 2, 2027, only if demand exists.** Back end must accommodate the capability. No Phase 1 UI. Will only be revisited if real institutional demand emerges. | Admin |
| D_EM37 | **Section creation is optional and must precede contributor work.** Course coordinator creates sections first; contributors fill their assigned sections. Sections are not mandatory — single-faculty assessments skip this step. | Admin / Faculty |
| D_EM38 | **Sections serve two use cases: multi-faculty division AND case-study grouping.** For multi-faculty: one section per instructor. For case studies: 3–5 related questions tied to a shared reference passage or scenario. Both use cases use the same section construct. | Admin / Faculty |
| D_EM39 | **Contributors can see all questions in an assessment they contribute to.** Privacy boundary is student results only, not question content. Question visibility and results visibility are controlled separately. | Faculty |
| D_EM40 | **Question type set expanded.** Phase 1 includes: true/false, MCQ (single select, multi-select, K-type), fill in the blank, hotspot, true/false hotspot with pictures, match the following, and short answer (free text). MCQ subtypes must all be explicitly supported, not bundled. | Admin / Faculty |
| D_EM41 | **AI can generate questions from uploaded content** (PPT, lecture notes, etc.) as part of the AI creation flow. This is a differentiator — faculty can bring source material and let AI draft questions from it. | Admin / Faculty |

### AI-Assisted Grading

| # | Decision | Scope |
|---|---|---|
| D_EM42 | **AI-assisted essay/short-answer grading = opt-in toggle per question.** Coordinator supplies ideal answer (full points reference) and grading guidelines (clarity, structure, inference, etc.). AI produces a recommended score per student response. Faculty accept or reject. Recommendation is advisory, not automatic. | Admin / Faculty |
| D_EM43 | **Simple AI essay grading in Phase 1 is the foundation for rubric-based grading in Phase 2.** Build Phase 1 so the rubric expansion fits cleanly. Do not block Phase 1 on rubric completion. | Admin / Faculty |

### Curriculum and Standards

| # | Decision | Scope |
|---|---|---|
| D_EM44 | **Both curriculum mapping path and direct assessment mapping path must be supported.** Choice should be intentional and explicit, not automatic. Curriculum mapping path closes the curricular assessment loop. Direct mapping (ExamSoft-style) tags questions straight to standards. Schools choose which path; product supports both. | Admin |
| D_EM45 | **Standards library needs explicit bucket typing.** Each standard must be categorized as filling either the "content area" bucket or the "competency" bucket (per program). This categorization enables course offering overviews to intelligently surface relevant data rather than showing all standards indiscriminately. | Admin |

---

### Additional design tasks (SharePoint additions)

| Task | Priority | Notes |
|---|---|---|
| T65 — Print-ready exam output | P1 | Generate Scantron-compatible print version per assessment. Flag for engineering — PDF generation with answer bubbles required. |
| T66 — Student review mode: password gate + locked browser | P1 | Password prompt before review starts. Locked browser session — no copy/export/screenshot. Show Q + student answer + correct answer + rationale. Instructor toggles rationale visibility separately. |
| T67 — Question source tags in AI flow ("from bank" / "newly generated") | P1 | Visual labels on every AI-surfaced question in the assessment builder. Accepted new questions route to QB. |
| T68 — Import fuzzy matching UI | P1 | Per-parsed-question status: "found" / "not found." User action: link to existing or save as new. |
| T69 — Question versioning: post-use trigger only | P2 | Versioning logic confirmed — new version created only on edit after published use. Rationale fixed per version. Flag for engineering. |
| T70 — Match-the-following + short-answer question types | P1 | Add to question editor. MCQ subtypes (single/multi/K-type) must be distinct UI options, not bundled. |
| T71 — AI generation from uploaded content (PPT/lecture notes) | P1 | Upload flow in AI creation path. AI parses doc and drafts questions. Faculty review and accept/reject. Accepted questions flow to QB. |
| T72 — AI-assisted essay grading toggle per question | P2 | Opt-in toggle in question editor. Coordinator inputs ideal answer + grading guidelines. AI recommends score per student. Faculty accept/reject. |
| T73 — Standards library: bucket typing UI (content area vs competency) | P2 | Admin settings: tag each standard as content-area type or competency type. Drives course offering overview widgets. |
