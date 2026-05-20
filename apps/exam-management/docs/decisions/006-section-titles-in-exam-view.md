---
type: decision
date: 2026-05-14
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 81c06a04-e3dc-499c-8f5a-c935e55d8d31
related: 005-multi-location-assignment-in-question-creation.md
---

# Exam Management ADR-006 — Section titles must be shown above questions during the exam

## Status

Accepted (Aarti, 2026-05-14) — Phase 1 must-have

## Context

Course offerings are commonly team-taught: multiple faculty each cover different content areas and contribute questions. Two use cases require section grouping in the assessment:

**Use case A — Faculty attribution.** When multiple faculty teach the same course, a 30-question exam may have 10 questions per instructor. Students need to know which instructor's content a question is testing, because the same topic can be taught from different angles. Without a section header, students cannot orient themselves.

**Use case B — Shared reference material (case study).** Five questions may share a single paragraph or case. The section label introduces that shared context before the question group begins.

Aarti (May 14, verbatim):
> "We used to create those sections in paper exams so that students knew: 'oh, these questions are from Dr. Gohil, these are from Dr. Mavi.' It was a parity item with how they handled paper exams."

> "Section title doesn't need to be on the top [toolbar]. That is your assessment where you have the question number. Above that, if there is a section label, you show the section label. And that section label stays the same for all 10 questions."

> "The top panel has to be like sacred space."

Section titles are **Phase 1** — explicitly confirmed as a must-have in both the May 14 student login session and the assessment builder session.

## Decision

The exam engine (`SplitQuestionView`) must render a section label above the question stem when the current question belongs to a section. The label:

- Appears in the question panel (LEFT side), above the question number and stem.
- Persists across all questions within that section without re-animating.
- Does NOT appear in the top toolbar (toolbar is reserved for course name, assessment name, timer, tools).
- Uses muted styling (small caps label, not a headline) so it provides context without visual dominance.
- Is optional — assessments without sections render no label.

The `Question` data type must carry a `sectionTitle?: string` field. Questions in the same section share the same `sectionTitle` value.

## Alternatives considered

- **Show section label in top toolbar** — rejected. Aarti explicitly called the top panel "sacred space" for course + assessment name. Overloading it breaks the visual hierarchy.
- **Show section label only at section transitions (animated banner)** — rejected. It would disappear while students are answering questions within the section, losing the attribution context that motivated the feature.
- **Defer sections to Phase 2** — rejected. Aarti confirmed Phase 1 in two separate May 14 meetings: "Section based exams supported — needs to be in phase one itself."

## Consequences

- Positive: Students can orient their answers to the correct instructor's content angle.
- Positive: Case-study sections (shared reference + N questions) are supported without repeating the reference on each question.
- Positive: Differentiates from ExamSoft, which has sections but no collaborative authoring flow.
- Negative: Question data model must be extended (`sectionTitle?: string`). Existing mock data needs updating for section-based assessments.
- Follow-up: Assessment builder UI must allow course coordinators to create and name sections, assign questions to sections, and assign per-section authoring access to instructors (ADR-007 area: authoring — not yet written).
- Follow-up: The section title should also be shown in the `SubmitReviewOverlay` grid so students can jump back to a specific section.
