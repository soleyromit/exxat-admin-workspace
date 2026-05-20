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
