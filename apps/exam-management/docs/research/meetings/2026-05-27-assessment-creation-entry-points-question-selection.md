---
type: meeting
date: 2026-05-27
product: exam-management
participants: [Aarti (Adi), Vishaka, Nipun, Romit]
source: granola
granola_id: 693723b8-16a8-4f80-b5f8-44c853ddc3f7
---

# Assessment Creation — Entry Points, Question Selection, and Setup Workflow

**Date:** 2026-05-27 · **Time:** 5:57 AM EDT
**Context:** Romit sharing design screens for the first time with Aarti and Vishaka (they had not seen them prior). Nipun had reviewed in afternoon sessions the previous week.

## Topics covered

1. Entry points for creating a new assessment — simplify from 4 options to 2
2. AI prompt entry point — move inside the builder, not the starting modal
3. Section setup — contributor workflow deferred, section creation mechanism
4. Question-level view during build — psychometric stats visibility
5. Point-biserial handling — show as number, flag red if negative
6. Checkboxes and bulk actions in the builder
7. Points per question — default 1 point, automation preferred
8. 3-stage assessment creation flow — preliminary info → build → final setup
9. Faculty context and planning cadence before exam creation
10. Match-the-following question type — Phase 1 confirmed
11. Assessment type field — rationale and logic differences per type (quiz vs. exam)
12. Assessment summary step before publish

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM55 | **Entry points reduced to 2: "Build new" OR "Copy existing."** AI prompt, question bank selection, and PDF import all move INSIDE the builder — they are question-addition methods, not starting paths. "In the beginning, limiting it to two options, like copy from somewhere or create new, are good options." — Aarti. This supersedes §5.28 (4-option entry modal). Current modal already has 2 options — T51 (4-option build) is CANCELLED. | Admin / Faculty | — |
| D_EM56 | **Inside the builder, all three question-addition methods are available.** (1) Select from question bank, (2) Upload/import from PDF, (3) Add from scratch (type or AI-generate). These can be mixed within a single assessment — some sections from QB, some from PDF, some typed. | Admin / Faculty | — |
| D_EM57 | **Contributor/reviewer workflow → Phase 2. Confirmed explicit deferral.** Section-level faculty assignment (assigning a faculty to a section with a question target and contribution deadline) is explicitly not Phase 1. "That workflow associated with getting contributors to come and contribute to the question or to the creation of the assessment is something we can do in a later phase." — Aarti. Reviewer workflow is also deferred. | Admin / Faculty | — |
| D_EM58 | **Point-biserial: show as number during build. Flag red if negative.** During question selection in the builder, show the point-biserial value as a plain number. If the value is negative, render it in red. No scatter chart. "Showing the number and making it in red if it's negative are good starting points for us." — Nipun + Aarti. Future enhancement: flag questions in the bottom 20% by percentile. | Admin / Faculty | — |
| D_EM59 | **Default scoring: 1 point per question.** Most exams are 1 point per question (rarely differential). Total points and total questions are set at preliminary step. Individual per-question overrides are allowed but advanced. Bulk-equal distribution should be the default; do not make faculty manually assign each question's point value. | Admin / Faculty | — |
| D_EM60 | **3-stage assessment creation confirmed: Preliminary → Build → Final setup.** Stage 1 (Preliminary): name, type, expected question count, total points — minimal inputs that help AI provide build-time intelligence. Stage 2 (Build): select/add questions, view psychometric stats inline. Stage 3 (Final Setup / Publish): all delivery config (dates, download window, randomization, time limit, proctoring, scoring publication) in ONE editable screen. Reinforces D_EM37 / T66. | Admin / Faculty | — |
| D_EM61 | **Assessment summary step required before publish.** Before final publish, show a summary screen: total questions selected, expected completion time, psychometric summary (point-biserial range, difficulty distribution, Bloom's coverage), questions with missing rationale flagged. NEW design task. | Admin / Faculty | — |
| D_EM62 | **Assessment type field is meaningful — quiz vs. exam have different logic.** Quiz may not need attestation, lockdown, or formal cheating policy. Midterm/final exam may require those. Type is used to drive setup defaults, not just as a label. PMs to document exactly what differs per type. | Admin / Faculty | — |
| D_EM63 | **Match-the-following: confirmed Phase 1.** "It is mentioned there" — Nipun confirmed match-the-following is in the Phase 1 question types list. | Admin / Faculty | — |
| D_EM64 | **Faculty planning context: exam objectives and topic weights known 6+ months in advance.** Faculty know what topics they taught and the proportional share (contact hours → question allocation). For AI context: if LMS or Prism course objectives are available, AI can map those to QB questions automatically. Design should not require faculty to manually re-enter topic weights at assessment build time if data exists in Prism. | Faculty | — |

---

## Verbatim quotes

> "In the beginning, limiting it to two options, like copy from somewhere or create new, are good options. And I'm happy for you guys to debate it, discuss it further and then finalize something. But from my point of view, I think I can live with that." — Aarti

> "The workflow associated with getting contributors to come and contribute to the question, or to the creation of the assessment is something we can do in a later phase. Even though [it] made it clear that this was a differentiator for us… We also don't have the bandwidth and the time to do that just yet." — Aarti

> "Contributor and reviewer can both be deferred." — Vishal

> "Showing the number and making it in red if it's negative are good starting points for us." — Nipun

> "Typically, [faculty] will have two midterms and one final. And each midterm will be approximately spaced equally… they already know what content was taught in the first 14 lectures which faculty were involved." — Aarti

> "So, Ramit, the question is not the question types. The question is [what] that you would have when somebody says, I have a document I want to upload. How does that look? I want to select questions from a question bank. How does that selection process look?" — Aarti (directing next screens to show)

> "Think of it this way: any assessment will have these options to modify it — add questions, whatever. So that is an acceptable point of view." — Aarti (on combining methods inside builder)

> "For now, showing the number and making it in red if it's negative are good. In a few days, we can try to figure out if you can add more flagging based on either a specified threshold or some numerically pre-calculated threshold." — Nipun

> "If there are five faculty who are associated with the course, they will have access to the relevant question banks. And then they will be able to create their own [assessments]." — Aarti (describing non-disruptive faculty access model)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/components/create-assessment-modal.tsx` | Already has only "Blank assessment" and "Copy from existing" — 2 options. ✅ Aligns with D_EM55. | ✅ No action on entry modal. |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:251–370` | Step 2 contains proctored/self-paced mode, duration, question target — delivery settings. These violate D_EM60 (Stage 3 = Publish). | 🔴 DESIGN-REVIEW (T66 already flagged — structural rearchitecture needed). |
| `apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx` | No contributor/section-assignment UI in code. Point-biserial not displayed in the question picker. | ✅ Contributor: correct (never built). Point-biserial number display: flagged — add to backlog (T71). |
| `apps/exam-management/docs/workflows/_backlog.md` T51 | "Assessment creation entry modal — 4-option flow." | ⚠️ CANCEL T51 — decision reversed to 2 options (D_EM55). |
| `apps/exam-management/docs/aarti-decisions-summary-2026-05-08.md` §5.28 | "4 options: Copy existing / AI-generated / Upload doc / Manually select." | ⚠️ SUPERSEDED by D_EM55. Entry is now 2 options. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T71 — Point-biserial number in assessment builder | P1 | Show p-bis as a number in the question picker column. Red if negative. Future: flag bottom-20% by percentile. D_EM58. |
| T72 — Assessment summary screen before publish | P1 | NEW SCREEN NEEDED. Pre-publish summary: total questions, expected completion time, psychometric summary, missing rationale flags. Goes between Stage 2 (Build) and Stage 3 (Publish). D_EM61. DESIGN-REVIEW. |
| ~~T51~~ — CANCELLED | — | 4-option entry modal cancelled. Current 2-option modal (blank/copy) is correct per D_EM55. |
