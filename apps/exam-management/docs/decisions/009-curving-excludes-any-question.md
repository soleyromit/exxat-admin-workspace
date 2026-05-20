---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-009 — Curving allows excluding any question, not just flagged ones

## Status

Accepted (Aarti, 2026-05-08)

## Context

After an exam is submitted, coordinators often need to remove or "throw out" questions that were ambiguous, poorly worded, or had technical errors that students flagged during the exam. The natural assumption is that only student-flagged questions would be available for removal.

Aarti corrected this assumption: faculty need the freedom to exclude any question based on post-exam psychometric review — low p-value, negative discrimination index, distractor collapse — regardless of whether students flagged it.

From the analytics design review:

> "Point biserial: if it's a negative point biserial, that means even though the question was easy, it turned out that the students who knew the material got it wrong and those who didn't know got it right. That's when as a faculty my concern is something is wrong with this question."

Such a question should be removable even if no student flagged it as problematic.

## Decision

The curving panel in post-exam analytics allows coordinators to **exclude any question from scoring** — the exclusion list is not restricted to student-flagged questions. Excluded questions do not count against students' scores.

The UI surfaces psychometric signals (p-value, discrimination index, average completion time) to help coordinators identify candidates for exclusion, but the action is not gated on those signals — coordinators exercise their own judgment.

## Alternatives considered

- **Exclude flagged questions only** — rejected. A question can be statistically bad without any student having the confidence to flag it. Faculty reviewing results have the full picture; students don't.
- **Require a reason for exclusion** — deferred. Useful for audit trails, can be added in Phase 2 without changing the core interaction.

## Consequences

- Positive: Coordinators can correct bad questions revealed by psychometrics without needing student validation.
- Positive: Differentiates from ExamSoft, which has limited post-exam question management.
- Negative: Risk of coordinators excluding too many questions, inflating scores. Accepted as an administrator responsibility, not a product constraint.
- Implemented in `analytics-client.tsx` `CurveView` — label reads "Removed questions don't count against students. You can exclude any question — not just flagged ones."
