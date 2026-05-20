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
