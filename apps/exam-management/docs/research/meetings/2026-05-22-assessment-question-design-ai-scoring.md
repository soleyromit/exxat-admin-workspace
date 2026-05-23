---
type: meeting
date: 2026-05-22
product: exam-management
participants: [Romit, Aarti (transcribed as "Ardeep" by Granola voice recognition), Vishaka]
source: granola
granola_id: 1ce6d16e-dae9-43cd-a99e-f4effd5f3814
---

# Assessment Question Design — AI Features, Scoring, and Workflow

**Date:** 2026-05-22 · **Time:** 1:23 PM EDT

## Topics covered

1. AI features in question creation — stem enhancement, option/distractor generation, prompt-based question generation
2. Scoring model — per-question score, per-option score, partial credit
3. AI button placement in question editor — "Suggest distractors" top-right vs "Add option" bottom-left
4. Essay rubric — should be optional, framed for AI grading assistance
5. Reference documents/images — upload location in question creation form (currently missing)
6. Assessment creation entry — 4-option modal confirmed (from scratch, QB, copy, import PDF)
7. Assessment setup 2-stage flow — question building separate from publish/admin setup
8. K-type question type — explicitly deferred, not phase 1
9. Scope directive — only build BRD question types; stop discussing out-of-scope types
10. Process directive — design should start from ExamSoft January Bangalore recordings, not a blank slate
11. "Copy from existing" clarification — same-term assessments included, not just prior-term
12. "Delivery" label on prototype screen — Vishaka flagged as confusing (existing code already uses "Download Window" correctly — no action needed)

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM36 | **"Copy from existing" includes same-term assessments.** Not limited to prior-term exams. Label "Copy from existing" (not "Copy from previous terms") is correct. Existing modal already uses this label. | Admin / Faculty | — |
| D_EM37 | **Assessment creation: two-stage setup flow.** Stage 1 = question building (name, metadata, question selection/creation). Stage 2 = publish/admin options (dates, download window, randomization, time limit). Faculty should not be shown delivery/scheduling options while still building the assessment. DESIGN-REVIEW needed. | Admin / Faculty | — |
| D_EM38 | **Reference documents/images upload must appear in the question creation form.** Currently missing. Applies to all question types (a question may reference an image or document). Location and UX TBD. | Admin / Faculty | — |
| D_EM39 | **AI button placement and label in question editor — design decision pending.** Vishaka flagged that "Suggest distractors" (top-right) and "Add option" (bottom-left) are on opposite sides of the answer section. AI can generate both the correct answer and distractors, so the label should be broader than "Suggest distractors." Label direction: "Add using AI" or similar. But exact placement (together vs. separate) is NOT yet decided — "That design choice, haven't made it yet. So you'll need to think through." DESIGN-REVIEW needed. | Admin / Faculty | — |
| D_EM40 | **Essay rubric is optional.** For essay-type questions, the rubric is optional — faculty can skip it and grade manually. When provided, it enables AI to assist with grading. Framing: "Optional rubric — if you want AI to support grading." Apply to question editor: update rubric label in EssayControls. | Admin / Faculty | — |
| D_EM41 | **Scoring must be complete in the question form.** Every question must show: (1) per-question total points, (2) per-option score (default: correct option = N points, all others = 0), (3) ability to edit individual option scores for partial credit ("instructor can go and edit any of these things"). Current editor is missing per-question score field and per-option score fields entirely. DESIGN-REVIEW needed. | Admin / Faculty | — |
| D_EM42 | **K-type questions: NOT Phase 1.** Explicitly deferred. Romit agrees. Do not design or build K-type. Do not discuss K-type in design sessions for the current release. | Admin / Faculty | — |
| D_EM43 | **Scope: only BRD question types for launch.** "If the BRD says there are five types of questions, I do not want to have a discussion about the type right now. I only want to limit to those five types." Stop exploring out-of-scope question types during design sprints. | Process | — |
| D_EM44 | **Design must start from ExamSoft January Bangalore recordings.** "Look at the workflows that they have created. And unless there is a strong rationale for us to change those we should not reinvent it." Romit must thoroughly review the Bangalore recordings before designing setup screens. If changing something from ExamSoft, state the rationale explicitly. | Process | — |

---

## Verbatim quotes

> "I really need us to be on track. If the BRD says there are five types of questions, I do not want to have a discussion about the type right now. I only want to limit to those five types, and I only want to get to a complete screen ASAP." — Aarti

> "I don't want to even, like, spend one second or one microsecond talking about a question type that is not going to be supported in our current release." — Aarti

> "Time is of the essence here. Ramit. If we do not get this design signed off, Arun is going to put his hands up and he's going to say, there's no way for me to code this." — Aarti

> "When I when we look at the data on Tuesday, can we make sure that if there are 10 things that have to be set up for a question, that all 10 things are addressed." — Aarti

> "I don't know why your AI button is on the right hand side on the top for answers. And your add option is at the bottom. AI can be used for both the right answer and the distractor. So we can just say, add using AI." — Vishaka

> "But I don't know if these actions should be, like, one here, one here, or they should be together. That, again, like, that design choice, haven't made it yet. So you'll need to think through." — Vishaka

> "Make make this rubric optional. Okay. And say, optional rubric in case you want AI to support grading or recommend grading or whatever. So they know it's optional. They can move on." — Vishaka

> "Where in the process of creating a question, where are you allowing for the reference documents to be uploaded?" — Vishaka

> "Administration of exam related setup, like the dates, the publishing, the download window, whether they want to randomize, what is the time, scoring, all of that should be a separate workspace for them." — Vishaka

> "Look at the workflows that they have created. And unless there is a strong rationale for us to change those we should not reinvent it." — Vishaka

> "You can change user previous terms assessment. It could be the same term also. Right? So user previous assessment is fine." — Vishaka

> "New assessment. How would you like to start? From scratch? From question bank? Copy from previous. Import PDF. Yep. This is good. This is what we discussed last time." — Vishaka (confirming 4-option flow)

> "The correct choice is going to have five points. The other ones is going to have zero points or 10 points or 20 points or 100 points. The default is that there is a right answer and everything else is zero. But I want to give somebody a partial credit. I'll make that zero, two and a half." — Vishaka

> "If there are 10 things that have to be set up for a question, I want it now. I want to see it. I want to sign off on it, and I want to move on." — Aarti

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx:653` | "Download Window" section already uses "Opens on" / "Closes on" date fields — NOT the "Delivery" label Vishaka flagged. | ✅ No action — existing code is correct. |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:230` | Already says "Copy from existing" — not "Copy from previous." Same-term included by default. | ✅ No action — label is correct. |
| `apps/exam-management/admin/components/question-editor/question-editor.tsx:257` | "Suggest distractors" button top-right; "Add option" at bottom-left. | Flagged — layout + label decision pending (D_EM39). T63. |
| `apps/exam-management/admin/components/question-editor/question-editor.tsx:684` | Essay `EssayControls` — rubric label says "Rubric" with no "optional" framing. | ✅ Applied today — added "(optional — for AI-assisted grading)" to rubric label (D_EM40). |
| `apps/exam-management/admin/components/question-editor/question-editor.tsx` — MCQ section | No per-question score field. No per-option score field. Partial credit = toggle only (no point value per option). | Flagged — DESIGN-REVIEW. T64. |
| `apps/exam-management/admin/components/question-editor/question-editor.tsx` — all types | No reference document/image upload field in question creation form. | Flagged — DESIGN-REVIEW. T65. |
| `apps/exam-management/admin/components/create-assessment-modal.tsx` | Only "Blank assessment" and "Copy from existing" options — missing "From question bank" and "Import PDF" modes. | Flagged — already in T51. Confirmed by Vishaka in this meeting. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T63 — AI option button + Add option: label and placement redesign | P1 | Vishaka flagged "Suggest distractors" as too narrow. Should be "Add using AI" or similar — covers both correct answer and distractors. Layout decision (together vs. separate) explicitly NOT made — needs design pass. DESIGN-REVIEW. D_EM39. |
| T64 — Scoring fields: per-question total + per-option scores | P0 (Tuesday deadline) | Currently entirely missing. Must show: (1) question total points, (2) per-option score (default correct=5pts, others=0), (3) editable partial credit per option. Aarti expects this signed off by Tuesday. DESIGN-REVIEW — requires QuestionDraft type changes. D_EM41. |
| T65 — Reference documents/images: upload in question creation form | P1 | Vishaka explicitly asked "where are you allowing for reference documents to be uploaded?" — currently no upload field in question editor. All question types may have reference material. DESIGN-REVIEW — new field + UI. D_EM38. |
| T66 — Assessment creation: 2-stage flow | P1 | Stage 1 = question building. Stage 2 = publish/admin setup (dates, download window, randomization). Faculty should not see delivery options while building. Vishaka directive: "that should be a separate workspace for them." DESIGN-REVIEW — structural rearchitecture of create-assessment-modal and builder flow. D_EM37. |
