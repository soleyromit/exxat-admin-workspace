---
type: meeting
date: 2026-07-30
product: exam-management
participants: [Romit Soley, Nipun, Aarti, Bhargav]
source: granola
granola_id: afac83e4-71f7-43ca-bc83-8852e8eaaeff
---

# Exam management weekly call — 2026-07-30

**Date:** 2026-07-30 10:30 AM EDT
**Participants:** Romit (Microphone), Nipun (questions + framing), Aarti (domain expert — faculty experience), Bhargav (briefly mentioned, not primary speaker)

---

## Topics covered

1. AI blueprint capture — how to gather faculty's assessment intent
2. Assessment repurposing as the primary faculty use case (90–95%)
3. Two primary paths for assessment creation: repurpose vs. from scratch
4. Cross-course assessment import — no topic/course restrictions
5. Import entire assessment at a time; pick-and-choose → question bank path
6. Blueprint scope from course objectives and lecture numbers
7. AI bubbles relevant questions from QB based on scope; no hard block on other folders
8. Pre-assessment point-biserial flag with admin-configurable threshold

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_EM_0730_01 | **Assessment repurposing is the PRIMARY faculty use case.** "If this is not their first faculty position and their first course where they're teaching in their first exam, they probably already have questions." 90–95% of faculty will start from a prior assessment, not scratch. AI should optimise for this use case first. | exam-management | §5.40, §5.42, §5.50 |
| D_EM_0730_02 | **No course or topic restrictions on "Copy existing" import.** Faculty can copy assessments from ANY course they have access to (any course they are associated with). "We should not build any constraints or restrictions based on the topic." Only access permissions apply (courses the faculty is assigned to). Current code restricts to same `courseId` — this is a gap. | exam-management | T109 |
| D_EM_0730_03 | **Import entire assessment at a time; sequential imports allowed.** Primary use case = import ALL questions from one prior assessment, then tweak. If faculty want questions from two assessments, they import one at a time sequentially. No simultaneous multi-assessment picker. Pick-and-choose from multiple assessments simultaneously → redirect to question bank. | exam-management | T109 |
| D_EM_0730_04 | **AI blueprint — two-path model confirmed with new specifics.** Path A (primary): repurpose existing assessment — import all, tweak with AI. Path B (secondary): create from scratch — (B1) QB selection with AI filtering by course objectives/lecture scope; (B2) AI generates new questions. AI assists in both paths. | exam-management | T110, §5.29, §5.50 |
| D_EM_0730_05 | **Blueprint scope = course objectives + lecture numbers.** When creating from scratch, system should pull course objectives from Prism course details if available. Scope defined by lecture range (e.g. lectures 1–14 for midterm 1). AI uses this to bubble up relevant questions from the course-specific QB folder — but faculty can still access other folders without restriction. | exam-management | T110 |
| D_EM_0730_06 | **Admin-configurable PB flag threshold confirmed as a good feature.** System flags questions with point-biserial below a configurable threshold before faculty include them in an assessment. Admin sets the threshold in Settings ("if a question has a point by serial of zero or less, we want to bring that in our radar"). Faculty must make a deliberate choice to keep flagged questions. Aarti: "I like the idea to make that threshold customizable." | exam-management | T111 |

---

## Verbatim quotes

> "If this is not their first faculty position and their first course where they're teaching in their first exam, they probably already have questions… they're just going to want to start from that and make tweaks to it so they are not going to create an assessment from scratch."

> "Why should we limit them that oh since this is a microbiology course we will only allow you to import an assessment from microbiology course offering? We should not build any constraints or restrictions based on the topic."

> "Focus on importing the entire assessment and then tweaking. If they really want to pick and choose the option to create an assessment is a better option where they're picking and choosing from their question bank."

> "If they want to import 50 questions from a midterm and then 20 questions from midterm two to create their final exam then we should allow that but then you can give them importing one assessment at a time."

> "The ideal case is if I'm using exact prism and I already have my syllabus and my course objectives in the course details section. I would want my exam management to refer to that."

> "A general guideline should be that AI will help them bring before them or bubble up the most relevant information based on what they provide us. So based on the scope of the assessment or the objectives AI can pull out questions from the relevant folder but not limit or restrict if they still want to pick questions from another course folder we are not going to stop them from doing that."

> "I like the idea to make that threshold customizable wherein if the school says that any question that has a point by serial of zero or less, we want to bring that in our radar. Then I think that's a good feature to have."

> "If I click in your workflow, if I say that oh I want to create the assessment from scratch by picking questions from my question bank… before selection, I should be able to view if that question has already been used previously. What was the point by serial? What was the rigor level? So some of the metadata related to the question, how many times has it been used so that I can decide."

---

## Code cross-reference (Pass 5 findings)

| Directive | Code status | Notes |
|---|---|---|
| D_EM_0730_02: No course restrictions on "Copy existing" | ❌ Gap | `create-assessment-modal.tsx:97` — `courseAssessments.filter(a => a.courseId === courseId)` — restricts to same course only. T109 added. |
| D_EM_0730_06: PB flag threshold (admin-configurable) | ❌ Not built | No configurable threshold in Settings. T111 added. |
| Question metadata in selection (PB + difficulty + usage) | ✅ Already present | `assessment-builder-client.tsx:766–775` shows difficulty, usage, P-bis in question picker. T71 was correctly marked applied. |
| Import entire assessment vs. pick-and-choose | ✅ Correct direction | Current "Copy existing" imports whole assessment structure per §5.40. Consistent with D_EM_0730_03. |
| AI blueprint planning UI | ❌ Not built | AI generate modal exists (`ai-generate-modal.tsx`) but blueprint from course objectives / lecture scope is not yet designed. T110 added. |

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T109 | "Copy existing" — expand to cross-course import from any associated course | P1 — DESIGN-REVIEW | Current modal restricts to same courseId. Needs new cross-course assessment browser UI. No topic/subject restrictions — only access permissions. Sequential imports allowed (one assessment at a time). `create-assessment-modal.tsx:97,234`. |
| T110 | AI blueprint planning — scope capture + lecture-based QB filtering | P1 — DESIGN-REVIEW — NEW FEATURE | When creating from scratch: (1) pull course objectives from Prism if available; (2) scope by lecture range (e.g. lectures 1–14); (3) AI bubbles relevant questions from course QB folder; (4) faculty can still access other folders without restriction. Requires new UX step in the assessment creation flow. |
| T111 | Admin-configurable PB flag threshold in Settings | P1 — DESIGN-REVIEW — NEW FEATURE | Settings screen: admin sets the PB threshold below which questions get flagged before inclusion in an assessment. Default = 0 or below. Faculty sees flag and must make deliberate choice to include. New settings UI + flag indicator in builder. |
