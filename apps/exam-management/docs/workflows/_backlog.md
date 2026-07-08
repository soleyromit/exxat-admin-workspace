# Exam Management — Design Backlog

Source: 2026-05-08 Aarti audit (`docs/research/meetings/2026-05-08-aarti-design-review.md`).

## Phase 1 design tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T1 | Faculty home — courses split | Faculty | Home/landing | P1 | Active course offerings on top, all affiliated below. Remove "Add new course" (Faculty cannot — per Exam Mgmt ADR-001). One search filter spanning both |
| T2 | Admin: course architecture screens | Admin | Admin module | P0 (foundational) | Master courses, master terms, course offerings, faculty assignment, "can add collaborators" permission toggle. LMS-on disables manual add (per workspace ADR-002) |
| T3 | Live monitor — student-centric counts | Faculty / Admin | Assessment monitor | P1 | Three buckets at top: Not Started / In Progress / Submitted (scan-band style). For in-progress show minutes + answered-of-N. Move flag panel to top. No chart-vs-numbers redundancy |
| T4 | Flagged-question workflow | Faculty / Admin | Live monitor + post-exam | P1 | Flag statuses: addressed / dismissed / acknowledged. No real-time student↔faculty messaging during exam (confirm Vishakha — R9) |
| T5 | Alerts-to-students banner | Faculty / Admin | Live monitor | P2 | Banner notification primitive (compliance broadcasts). Don't recreate "5 minutes left" (platform handles) |
| T6 | Assessment statuses + types — pre-design doc | All | Pre-design doc | **BLOCKER** | Word doc: 5 assessment types + per-type parameters; status taxonomy. Must align with PMs + Vishakha before more screens (R5, R6) |
| T7 | Assessment review / curving redesign | Faculty | Assessment results | P1 | Tabs in order: Overview (score distribution + content area frequency + objective frequency + Bloom's distribution) → Per-question analysis → Curving |
| T8 | Per-question analysis card | Faculty | Assessment review | P1 | How many right / wrong / skipped; distractor distribution (green=correct, single accent for others); difficulty (3-tier x-axis); curving inline at row level. Drop 2D scatter until R1 (point-biserial) done |
| T9 | Content-area / objective / Bloom's coverage | Faculty | Overview tab | P1 | Frequency counts ("8 of 20"), NOT percentages (Aarti — D17) |
| T10 | Question tagging at creation + assessment-build prompts | Faculty | Question editor + builder | P1 | Tag content area / competency / objective at create time. In builder, surface untagged questions with AI-suggested tags |
| T11 | Course-level question-bank health (gap analysis) | Faculty | Course detail | P1 | List content areas / competencies / objectives covered; per-item count of QB questions; "Generate more with AI" CTA per gap. AI uses course materials (syllabus, lecture, chapter). Move from competency to course screen (D13) |
| T12 | Program-level master lists (admin) | Admin | Admin module | P0 (foundational) | Per workspace ADR-001: content areas, competencies, standards, master courses, terms, course offerings, students, accommodations master list, faculty, permissions, assessment types |
| T13 | Accommodations module (shared) | Admin / Faculty | Cross-product | P1 | Per workspace ADR-006. Three tiers: master list, per-student application + docs upload, faculty read-only filtered view. Support non-registered students for makeup |
| T14 | Course-level mapping screens | Faculty / Admin | Course detail | P1 | Map course offering to subset of program content areas / competencies / objectives / standards |
| T15 | Two-question dashboards | Admin | Program reports | P1 | "Am I teaching everything?" + "Am I testing what I'm teaching?" Includes orphan detection ("2 standards not covered by any objectives") |
| T28 | Frequency-of-use column on QB rows | Faculty | Question bank | ✅ done | Already added (Romit confirmed in meeting) |
| T29 | Student dashboard — 4-section layout | Student | Student home | P1 | My Courses, My Accommodations, Open Action Items, Recently Published Results. New screen needed. |
| T30 | Download section UI | Student | Pre-exam | P1 | Fields: course name, assessment name, instructions, download window, exam date/time, download button. ExamSoft gap to fix. |
| T31 | Exam header — add course name + assessment name | Student | Assessment taker | P1 | Both mandatory in header sacred space. DESIGN-REVIEW: requires new props. |
| T32 | Submit button relocation | Student | Assessment taker | P1 | Move to TOP panel. DESIGN-REVIEW: structural change to exam engine — flag for dedicated pass. |
| T33 | Bottom panel prominence | Student | Assessment taker | P1 | Increase visual weight of Next/Flag buttons. Not a removal — improve prominence. |
| T34 | Answer checkbox position | Student | Assessment taker | P1 | Move selection control to LEFT of option text. Currently sandwiched. Flag for exam engine DS pass. |
| T35 | QuestionNavigatorPopover — remove number grid | Student | Assessment taker | DESIGN-REVIEW | Grid of question numbers (1, 2, 3…) not aligned with Vishaka directive. QuestionJumpPopover (group-based) is the right approach. Arch decision on which to keep. |
| T36 | Pre-submission summary | Student | Assessment taker | P1 | Skipped + Flagged popup before final submit. Skipped = unanswered before furthest progress position. |
| T37 | Async submission + success state | Student | Assessment taker | P1 | Background sync; "uploaded successfully" notification; exam never lost post-submit. |
| T38 | Student notification audit log | Student/Admin | Student profile | P2 | All system-sent emails/notifications logged and viewable by student and admin. |
| T39 | Auto-download-window notification | Student | Notifications | P1 | Email to students when download window ending and they haven't downloaded. Config option in assessment setup. |
| T40 | Entity directory pages — 8 screens | Admin | Admin module | P1 | Student search/landing, faculty search/landing, course search/landing, master course list, master term list, plus competencies/standards/content areas. Global-search UX (one box). Romit working on these. |
| T41 | Faculty profile — trim for exam management | Admin | Directory | P1 | Course associations (coordinator vs instructor role) only. Remove teaching/scholarship/service, placements, compliance, advisees tabs. |
| T42 | Student profile — trim for exam management | Admin | Directory | P1 | Courses + Accommodations only. Remove compliance, learning activities, competency dashboard, intervention tabs. |
| T43 | QB landing page — folder dashboard | Admin/Faculty | Question bank | P0 | Higher-level view: folder count, questions count, approval status, tags coverage. NOT "all questions" as default. |
| T44 | Product landing page — current-term courses | Admin/Faculty | Landing | P1 | Active/current-term course offerings as primary anchor. Not a flat list of all courses ever. |
| T45 | Assessment builder — section creation UI | Faculty | Assessment builder | P1 | Free text title per section, assign instructor per section, add/remove sections. Must-have Phase 1. |
| T46 | Pre-exam instruction page | Faculty | Assessment builder | P1 | Faculty uploads free text instructions; configurable timer (eats into / doesn't eat into total time); optional student attestation. NEW screen — FLAG. |
| T47 | Assessment review workflow | Faculty/Admin | Assessment builder | P1 | Send to 1+ reviewers; track status (pending/approved/changes-requested). Assessment-level only (not section-level). DESIGN-REVIEW — needs new data model. |
| T48 | Reference material in exam | Student | Assessment taker | P1 | Globally accessible (button, like calculator). Question-specific reference = tabs. Formula sheets AI-converted to text area. |
| T49 | Faculty app — point-of-view doc | Faculty | Design brief | P1 | Romit drafts: persona, landing page, core workflows for faculty login. |
| T50 | Three alignment docs | PM/Design | Process | P0 | (1) Types of questions supported, (2) config at assessment vs. question level, (3) attributes of a question. PM team to produce. |

## Phase 1 design tasks — added 2026-05-19

Source: `docs/research/meetings/2026-05-19-assessment-creation-workflows.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T51 | Assessment creation entry modal — 4-option flow | Admin / Faculty | Assessment builder | P1 | Option cards: Copy existing / AI-generated / Upload doc / Manually select. NEW SCREEN — DESIGN-REVIEW: structural change to assessment builder entry point. |
| T52 | AI text prompt for assessment generation | Admin / Faculty | Assessment builder | P1 | Free-text description of what assessment should test. Parameter guidance text + one example prompt shown. AI selects from QB, flags when new Qs needed. Pairs with T51 option 2. |
| T53 | Option locking per question — question-level config | Admin / Faculty | Question editor | P1 | Lock option positions per question. ExamSoft parity. Add to question editor config panel. Currently absent. D_EM19. |
| T54 | QB quick link on course offering overview | Admin / Faculty | Course offering detail | P1 | ✅ Applied today — added to Quick Reference sidebar in `course-offering-detail-client.tsx`. D_EM24. |
| T55 | Results access: admin + course coordinator isolation | Admin / Faculty | Role gating | P1 | Collaborators / contributors / reviewers cannot see student scores. Coordinator can share at their discretion. DESIGN-REVIEW — auth architecture. D_EM22. |
| T56 | Review function separated from results access | Admin / Faculty | Assessment review | P1 | Reviewer sees question feedback UI only. No student performance data exposed to reviewers. DESIGN-REVIEW — data model. D_EM23. |
| T57 | Course offerings sorted descending, max 6-8 shown | Admin / Faculty | QB + course listing | P2 | Reverse-chrono order, load-more for older offerings. D_EM25. |
| T58 | Download exam — Phase 1 confirmed | Admin / Faculty / Student | Pre-exam flow | P1 | Confirmed Phase 1. Default = download-and-take (not browser-only). Admin side needs download generation. Closes R3. Flag for PM + back-end alignment. D_EM26. |

## Phase 1 design tasks — added 2026-05-21

Source: `docs/research/meetings/2026-05-21-assessment-prd-accessibility-download.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T59 | Remove high/low stakes labels from all UI | Admin / Faculty / Student | All exam management surfaces | P1 | ✅ Applied today: `create-assessment-modal.tsx`, `settings/page.tsx`, `PostExam.tsx`, `assessments.ts`. D_EM29. |
| T60 | Accessibility settings panel for exam-taker | Student | Assessment taker | P1 | NEW SCREEN NEEDED. Settings during exam: text-to-speech toggle, 200% magnification, dyslexic font toggle, high contrast toggle. DESIGN-REVIEW — pending final ExamSoft parity check from consultant. D_EM30. |
| T61 | ExamSoft parity table — full exam management module | PM / Nipun | Process / PRD | P0 (blocker) | PM task: every feature tagged as parity / parity-deferred / differentiator. Must be complete before further setup screen design. D_EM35. |
| T62 | Copy assessment — section reorganization UX | Admin / Faculty | Assessment builder | P1 | Builds on T51 "Copy existing" path. After copy: support moving questions between sections, re-assigning sections to different faculty. DESIGN-REVIEW — requires section drag+drop or move-to-section affordance. D_EM33. |

## Phase 1 design tasks — added 2026-05-22

Source: `docs/research/meetings/2026-05-22-assessment-question-design-ai-scoring.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T63 | AI option button + "Add option" — label and placement redesign | Admin / Faculty | Question editor | P1 | "Suggest distractors" (top-right) is too narrow; should cover correct answer too. Vishaka direction: label = "Add using AI" or similar. But placement (together vs. separate) is explicitly NOT decided — "haven't made it yet." DESIGN-REVIEW. D_EM39. |
| T64 | Scoring fields: per-question total + per-option scores | Admin / Faculty | Question editor | P0 (Tuesday deadline) | Currently entirely missing. Must add: (1) per-question total points, (2) per-option score (correct = N pts, others = 0 by default), (3) editable partial credit per option. Aarti expects to sign off on Tuesday. DESIGN-REVIEW — requires QuestionDraft type + UI. D_EM41. |
| T65 | Reference documents/images: upload in question creation form | Admin / Faculty | Question editor | P1 | Vishaka: "where are you allowing for reference documents to be uploaded?" Currently no upload field. Applies to all question types. DESIGN-REVIEW — new field + UI. D_EM38. |
| T66 | Assessment creation: 2-stage flow (build vs. publish/admin) | Admin / Faculty | Assessment builder / create flow | P1 | Stage 1 = question building. Stage 2 = publish/admin setup (dates, download window, randomization). Faculty should not see delivery options while building. Vishaka directive. DESIGN-REVIEW — structural rearchitecture of create-assessment-modal. D_EM37. |

## Phase 1 design tasks — added 2026-05-25

Source: weekly Granola audit (meeting `f59cfbe4` cross-reference pass 5)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T67 | Questions tab — wire up in course-detail hub | Admin / Faculty | Course detail (`courses/[id]`) | P1 | ✅ Applied 2026-05-25. `QuestionsTab` component existed and was complete but not imported or rendered. Now wired as the second tab between Assessments and Students. Fulfills D_EM24 (course-hub level) — filtered question list with p-biserial, difficulty, Bloom's, and flagged-item toggle scoped to the course's QB folder. |

## Phase 1 design tasks — added 2026-05-27

Source: `docs/research/meetings/2026-05-27-exam-management-status-offline-faculty-access.md` (Granola `943b9e4a`) + `docs/research/meetings/2026-05-27-assessment-creation-entry-points-question-selection.md` (Granola `693723b8`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T68 | Faculty access levels: alignment document | Admin / Faculty | Pre-design doc | P0 (blocker) | Romit + PMs + Vishaka must produce roles document before designing access-control screens. 4 tiers: Full / Read-only / Add-own / Section contributor (Phase 2). D_EM48. |
| ~~T51~~ | ~~Assessment creation entry modal — 4-option flow~~ | ~~Admin / Faculty~~ | ~~Assessment builder~~ | ~~CANCELLED~~ | Decision reversed 2026-05-27. Entry stays at 2 options (blank/copy per D_EM55). All other methods (AI, QB, PDF) go inside builder. Current modal is correct. |
| T69 | Offline mode: update T58 status → Q1 deliverable | Admin / Faculty / Student | Pre-exam flow | P1 | T58 said "Phase 1 confirmed." REVISED: offline download mode is Q1 2027, not December 2026. December launch is browser-only with preload safety net. D_EM45 supersedes §5.35. |
| T70 | Respondus lockdown browser integration research | Eng | Pre-exam flow | P1 | Engineering research task. Explore Respondus (or equivalent) integration as the lockdown browser solution. Building own desktop client explicitly ruled out. D_EM46. |
| T71 | Point-biserial number in assessment builder | Admin / Faculty | Assessment builder | P1 — ✅ APPLIED | Added P-bis column to question picker in `assessment-builder-client.tsx`. Shows value as number; red (`var(--destructive)`) if negative; `—` if null. D_EM58. |
| T72 | Assessment summary screen before publish | Admin / Faculty | Assessment builder | P1 | NEW PAGE NEEDED. Pre-publish summary between Stage 2 (Build) and Stage 3 (Publish): total questions, expected completion time, psychometric summary (p-bis range, difficulty distribution, Bloom's coverage), questions missing rationale. D_EM61. DESIGN-REVIEW. |

## Phase 1 design tasks — added 2026-05-28

Source: `docs/research/meetings/2026-05-28-assessment-setup-ai-automation.md` (Granola `925fa644`) + `docs/research/meetings/2026-05-28-design-priorities-bandwidth.md` (Granola `9781e589`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T73 | Assessment setup: comprehensive single-page config view | Admin / Faculty | Assessment builder | P1 | All setup items visible together on one view. Do not split config before/after question selection. Reference ExamSoft setup page as baseline. D_EM67. DESIGN-REVIEW — structural. |
| T74 | Document upload: accept PDF AND Word (.doc/.docx) | Admin / Faculty | Question import / assessment creation | P1 | Current design shows PDF only. Must update upload `accept` attribute when component is built. D_EM66. |
| T75 | Confirm no section back-navigation lock exists | Admin / Faculty / Student | Assessment taker | P1 | Default = allow free navigation between sections. If configurable setting added in future, default must be "allow." D_EM62. |
| T76 | QB pinning feature — UX review (remove or redesign) | Admin / Faculty | Question bank sidebar | P1 — DESIGN-REVIEW | Pinning implemented in `qb-sidebar.tsx:513–535`. Nipun says "from the information hierarchy UX perspective, made wrongly." Do NOT remove without Nipun direction. Do NOT build additional pin UI. Nipun to provide decision. D_EM72. |

## Phase 1 design tasks — added 2026-06-01

Source: `docs/research/meetings/2026-05-27-design-system-adoption-himanshu.md` (Granola `ae66b50f`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T77 | Define product brand color for exam-management | Design | DS / theming | P2 | Leadership decision: each product has its own color (Prism=pink, ExactOne=indigo). exam-management color is TBD. Pick token, apply to product theme. D_DS01. |

## Phase 1 design tasks — added 2026-06-02

Source: `docs/research/meetings/2026-06-01-exam-taker-navigation-rohit.md` (Granola `caaae283`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T78 | Question nav panel: surface only flagged questions; answered count shown as summary chip at top | Student | Assessment taker | P1 — DESIGN-REVIEW | Rohit (2026-06-01): "Only flagged can be surfaced here because after I answer a lot of questions, I don't need the answered questions. I only need the flagged ones." Extends and aligns with T35 (QuestionNavigatorPopover → QuestionJumpPopover direction). D_AT02. |
| T79 | Question navigation: move to LEFT panel to minimize cursor movement | Student | Assessment taker | P1 — DESIGN-REVIEW | Rohit (2026-06-01): "I don't want the student's cursor to move across too much. Always surface the questions on the left." USMLE/GRE/GMAT reference. Major layout change — full panel rearchitecture. D_AT03. |
| T80 | Keyboard shortcuts modal: expose all exam shortcuts via a button-triggered modal | Student | Assessment taker | P1 — DESIGN-REVIEW | Rohit: "put a button or some sort of element. Once you click that, you'll open a model where you show all the common shortcuts." Required for full keyboard-only accessibility (students with no mouse). D_AT08. |
| T81 | "Flag" vocabulary split: "Bookmark" (personal) + "Report an issue" (faculty review) — separate icons, separate flows | Student | Assessment taker | P1 — DESIGN-REVIEW | Rohit agreed with Romit's proposal. Current code uses single "Flag" concept. Requires separate UX flows + new data model for each. D_AT05. |
| T82 | "Report an issue" button: de-emphasize — move into settings gear panel or bottom non-primary area | Student | Assessment taker | P1 — DESIGN-REVIEW | Rohit: "put it inside the settings button at the top or somewhere at the bottom where it doesn't take much attention." D_AT06. |

## Phase 1 design tasks — added 2026-06-03

Source: `docs/research/meetings/2026-06-03-weekly-product-sync.md` (Granola `7a53688f`) · `docs/research/meetings/2026-06-03-exam-management-sync-nipun.md` (Granola `d4f85e99`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T83 | System compatibility check — removed from visible pre-exam flow | Student | Assessment taker (PreExamFlow) | P1 — ✅ APPLIED | Removed `System Check` step from `PreExamFlow.tsx`. Flow is now 4 steps: Password → Instructions → Accommodation → Ready. Runs as background check; surfaces only on failure. Nipun directive Jun 3. D_AT11. |
| T84 | Reference attachments scope — extends T48 | Student / Admin | Assessment taker + question editor | P1 — DESIGN-REVIEW | Question-level: unlimited count (200MB total), shown as tabs in split view. Assessment-level: ONE global doc. Section-level: NOT supported. Update T48 design when building that surface. D_AT12. |

## Phase 1 design tasks — added 2026-06-04

Source: `docs/research/meetings/2026-06-04-exam-management-vishal-course-landing.md` (Granola `e97078d1`) · `docs/research/meetings/2026-06-04-prism-redesign-aarti-alignment.md` (Granola `2ad77c6e`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T85 | Admin Courses — Setup tab + Course Catalog → navigate to Prism-base pages instead of full rebuild | Admin | Courses page (`courses-client.tsx`) | P1 — DESIGN-REVIEW | Vishal Jun 4: "we can remove one tab altogether. That's a lot of space … should we also move course catalog to the present base and have only course offerings here?" Structural tab removal — confirm with Aarti before applying. D_EM73. |
| T86 | Mapping tab in course detail — confirm with Aarti, then hide/remove | Admin / Faculty | Course detail (`courses/[id]/course-detail-client.tsx`) | P1 — DESIGN-REVIEW | Vishal Jun 4: "Mapping is what? Tagging? Yeah. It's tagging. It'll come later. Yes. We'll not have this right now." Tab currently visible at line ~212. Do NOT remove without Aarti confirmation — conflicts with T14. D_EM74. |
| T87 | Course offerings landing — analytics section design | Admin | Courses page | P2 | Vishal Jun 4: "we'll think of some analytics on screen analytics we can show." New design needed — data requirements TBD with Vishal. NEW DESIGN NEEDED. |
| T88 | Himanshu alignment — schedule navigation coexistence review before shipping any new module nav | Design / Eng | Cross-product nav | P0 (blocker for nav) | Aarti Jun 4: "before we say this is ready for consumption, he needs to be included aligned, and invited to some of these meetings." Block new module nav design until completed. D_PCE10. |
| T89 | PCE/CFE two-section architecture — two distinct entry points + dashboards for course+faculty eval vs. institutional surveys | Admin / Faculty | PCE product | P1 — DESIGN-REVIEW | Aarti Jun 4: "we are going to have these two entry points and almost treat them as two sections of the product. And I'm good with that. Course and faculty, and institutional surveys." NEW PAGE NEEDED — requires full product architecture pass for PCE. D_PCE12. |
| T90 | PCE student email templates — two-CTA email design + pending-activities landing page | Student | PCE student flow | P1 — DESIGN-REVIEW | Aarti Jun 4: "this email should have both buttons. Like, see all my pending activities or click here to complete this survey." Two CTAs: complete-this-survey (direct link) + see-all-pending (landing page). NEW PAGE NEEDED. D_PCE14. |

## Phase 1 design tasks — added 2026-06-06

Source: `docs/research/meetings/2026-06-06-question-bank-design-kunal.md` (Granola `7729d58c`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T91 | QB layout: resizable vertical divider between folder sidebar and question list | Admin / Faculty | Question bank | P1 — DESIGN-REVIEW | Kunal + Aarti confirmed: user must be able to drag vertical line to resize sidebar. Needed when folder/course names overflow. D_QB01. |
| T92 | QB sidebar: "Not Assigned" virtual folder for questions with no location | Admin / Faculty | Question bank sidebar (`qb-sidebar.tsx`) | P1 | Virtual nav item alongside "All Questions" showing unassigned questions. Kunal implementing engineering side. Confirm design treatment with Kunal. D_QB02. |
| T93 | Course list: filter or indicator for courses with zero QB questions | Admin | Courses page | P1 — DESIGN-REVIEW | Aarti: "show me all of the courses which have zero questions tagged to them." Could be a filter chip or empty-state badge on course rows. D_QB03. |
| T94 | Assessment builder: section sticky header or floating label during scroll | Admin / Faculty | Assessment builder | P1 — DESIGN-REVIEW | Aarti: "when I'm scrolling the which section am I at? I don't know." User must always know which section they are in while scrolling. Sticky section header or intersection-observer-based floating label. D_QB07. |
| T95 | QB question title: upgrade to font-semibold for readability | Admin / Faculty | Question bank table (`qb-table.tsx`) | P1 — ✅ APPLIED | Aarti: "maybe we want to put the question in bold." Changed `font-medium` → `font-semibold` on question stem div. D_QB06. |

## Phase 1 design tasks — added 2026-06-09

Source: `docs/research/meetings/2026-06-09-exam-management-sync-mohit.md` (Granola `70d6511f`) · `docs/research/meetings/2026-06-09-design-execution-arun.md` (Granola `a4a0e1db`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T96 | Revise base entity mockups — remove future-state data | Admin / Faculty | Base entity pages (course offering, students, faculty, assessments) | P1 | Mohit 2026-06-09: design scope = current information availability ONLY. Performance data, accommodations, interventions introduced per-feature later. Deadline Thursday 2026-06-12. D_EM_M01. |

## Phase 1 design tasks — added 2026-06-13

Source: `docs/research/meetings/2026-06-13-aarti-pce-exam-management.md` (Granola `ab7e2691`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T97 | Assessment lifecycle tabs within course | Admin / Faculty | Assessment landing (within course detail) | P1 — DESIGN-REVIEW | Three distinct tabs/phases after assessment is created: (1) Edit/Build — questions + sections; (2) Publish/Distribute — dates, delivery method, time limits; (3) Stats/Monitor — proctoring view, completion counts. Distribution is a SEPARATE step from building. D_EM_J13_04. |
| T98 | Cohere conference booth — user testing with Romit + Himanshu | Design | Cross-product coordination | P1 — ACTION ITEM | 300+ attendees. AB testing, current-product issue collection, feedback. Aarti applying for Himanshu US visa. Post-India (July) planning meeting. Coordinate with Kunal on screens/iPads. D_EM_J13_08. |

## Phase 1 design tasks — added 2026-06-17

Source: `docs/research/meetings/2026-06-17-himanshu-design-system-nav-alignment.md` (Granola `1f55db0d`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T99 | ⚠️ Ask Leo placement conflict — BLOCKER for nav sidebar placement | Design / Eng | Cross-product nav (exam-management + PCE) | P0 — BLOCKER | Aarti Jun 3 (D_PCE42, T57): Ask Leo should NOT be in left nav. Himanshu Jun 17: Ask Leo IS in left sidebar. 2026-06-22: Removed Ask Leo button from `qb-header.tsx` top-right (old position cleared). Sidebar placement still unresolved — do NOT add Ask Leo to sidebar until Himanshu coordinates with Arun + Yash + Aarti. D_EM_HIM01, D_EM_HIM02. |
| T100 | Student exam experience — DS adaptation for exam-specific components | Student | Assessment taker | P1 — DESIGN-REVIEW | Design system needs new/adapted components for exam-taker flow: keyboard-navigable answer selection (no mouse), text highlight, text strikethrough/elimination, bookmarks, hotspot questions, accessibility panel (color vision, 400% text size, dark contrast, on-screen keyboard), PDF viewer with zoom, audio/video. Himanshu to prioritize. Track together. D_EM_HIM07. |
| T101 | Module entry point concept — share with Himanshu; align with Aarti | Design | Cross-product platform | P1 — ACTION ITEM | **Updated Jul 2:** Aarti saw the concept in meeting and endorsed the direction. Primary purpose = operational launcher. Secondary = cross-sell real estate for non-subscribed modules. "Think through this and work with Amit... for us to discuss in August." Deferred to August review. App-store-style: subscribed modules prominent; non-subscribed → trial/interest CTA. D_EM_HIM05, D_EM_0702_05. |

## Phase 1 design tasks — added 2026-07-02

Source: `docs/research/meetings/2026-07-02-ai-strategy-design-system-nav-alignment.md` (Granola `d2449a66`)

> Large cross-functional meeting: AI strategy, exam management timeline, navigation debate, design system approach, PCE Q4 goals.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T102 | Manual time extension — per-student end-time override in live monitor | Admin | Live monitor (`assessments/[id]/live`) | P1 — DESIGN-REVIEW | MVP scope item. Admin must be able to manually extend an individual student's exam end time without the full accommodations module. This is a single override field — "the same field that gets overwritten by the accommodation setup" when Phase 2 accommodations land. Add to live monitor student row actions. D_EM_0702_02. |
| T103 | Navigation direction update — top bar + new module left-nav (partially resolves T99) | Design / Eng | Cross-product nav (all products) | P0 — DESIGN-REVIEW | Direction from Jul 2 leadership meeting: keep top utility bar (module switcher, search, Leo, profile) consistent across ALL modules including Prism. New modules (exam management, course evaluation) use Himanshu's left-nav design below that bar. Prism navigation stays as-is. Minimized left nav by default; shows as breadcrumb label. PARTIAL RESOLUTION of T99 — Ask Leo goes in top bar, not sidebar. NEXT STEP: Himanshu to design top bar options; "set up a time next week" to finalize before applying any changes. D_EM_0702_04. |

### Updates to existing tasks (Jul 2)

| # | Update |
|---|---|
| T99 | Partially resolved Jul 2: Ask Leo + search → top utility bar, not left nav sidebar. Left nav = module navigation only. Final confirmation after Himanshu's top bar design (T103). Do not apply nav changes yet. D_EM_0702_04. |
| T13 | Full accommodations = Phase 2. Only manual end-time extension in MVP (tracked as T102). D_EM_0702_07. |

## Phase 1 design tasks — added 2026-07-07

Source: `docs/research/meetings/2026-07-07-vishal-exam-mgmt-priority-sync.md` (Granola `91c567e8`) · `docs/research/meetings/2026-07-06-arun-romit-priority-1on1.md` (Granola `e69904b6`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T104 | Assessment creation screens — information density review | Admin / Faculty | Assessment builder (create-assessment-modal.tsx + related builder screens) | P1 — DESIGN-REVIEW | Vishal Jul 7: "there are some screens where the information is too dense. We need to figure out a way to present so much of information. And little screen." Workflow is correct — this is a visual hierarchy and information grouping pass only. Do NOT restructure the workflow; only reconsider grouping, spacing, and visual weight within existing screens. D_EM_0707_05. |

### Priority clarification (Jul 2026)

| # | Update |
|---|---|
| — | **Exam management question creation = P0.** Vishal Jul 7: "your P0 will be question creation. Period." Supersedes relative priorities set prior to Jul 2026. No code change — priority signal for Romit's design sequencing. D_EM_0707_03. |
| — | **Day-to-day approver = Yash.** Weekly Aarti call permanently canceled. Yash reviews designs going forward. Aarti reviews the full picture every ~1.5 months. D_EM_0707_01, D_EM_0707_02. |

## Phase 1 → Phase 2 demotions (updated 2026-06-13)

| # | Task | Original priority | Demotion reason | Source |
|---|---|---|---|---|
| T47 | Assessment review workflow | P1 — DESIGN-REVIEW | Aarti Jun 4: "Later we can build in review process because review is like a phase two process. So we're not doing that." Phase 2 confirmed. | 2026-06-13 |
| T45 | Assessment builder — section creation UI (faculty assignment portion) | P1 | Faculty section assignment (assigning a section to a faculty to add questions) = Phase 2. Aarti Jun 4: "Is this feature going in the first phase? No, not yet." Section creation UI itself is still P1, but the per-section faculty assignment is Phase 2. | 2026-06-13 |

---

## Research / blockers (R1–R10 from audit)

| # | Item | Owner | Deadline |
|---|---|---|---|
| R1 | Read up on point-biserial; explain calculation | Romit | Before T8 final design |
| R2 | Send Aarti a Claude note on point-biserial | Romit | After R1 |
| R3 | ExamSoft download / lockdown / take-home patterns | Romit | T6 input |
| R5 | Five assessment types — PM/PMS alignment | Romit + PMs | T6 |
| R6 | Status taxonomy — PM alignment | Romit + PMs | T6 |
| R7 | Permissions matrix — define rational levels | Romit + PMs + Vishakha | T2, T12 |
| R8 | Faculty profile — Prism-level vs additional fields | Romit + Aarti | T12 |
| R9 | Confirm flag-during-exam read-only | Romit + Vishakha | T4 |

## Aarti's homework for Romit

> "For my benefit and your benefit and the project's benefit, create a summary of everything we have discussed."

T27 — write the summary doc covering admin view structure, key tabs and information per topic. This `_backlog.md` + the meeting notes file together form the raw material; Romit needs to compile a polished summary doc separately.
