---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-013 — Item analysis metrics appear in two contexts: QB inline and post-exam analytics

## Status

Accepted (Aarti, 2026-05-08)

## Context

Psychometric metrics for questions — p-value (difficulty index), point-biserial correlation (discrimination), distractor analysis, usage count — are generated post-exam once student responses exist. The question is: where should faculty see these metrics?

Two candidate surfaces:
1. **The Question Bank** — while browsing or selecting questions for a new assessment
2. **Post-exam analytics** — after all submissions are in, during scoring and curving

Aarti was explicit that both are needed:

> "Item analysis should be embedded in question selection, not isolated as a separate analytics area."

> "While building the assessment and while reviewing the assessment, those performance statistics and questions can be important. If those questions are already used previously, what was the average on each question? All of those we can bubble up. That will be useful for the chair as well as the program director reviewing the assessment."

The rationale: when a coordinator selects a question for a new exam, seeing its historical performance (how did students do last time it was used?) is directly relevant to the selection decision. This is different from post-exam analytics, which is about the *current* exam after results are in.

## Decision

Item analysis metrics appear in **two distinct contexts**, each with appropriate depth:

**Context 1 — Question Bank (pre-exam, shallow):** Each question in the QB shows lightweight performance indicators: p-value, discrimination (p-bis), usage count. This helps coordinators select high-quality questions. Shown in the question row or detail panel without requiring post-exam navigation.

**Context 2 — Post-exam analytics (post-exam, deep):** After submissions are collected, the analytics page provides full item analysis: score distribution per option (distractor analysis), comparison to cohort norms, flag for negative discrimination, and the curving/exclusion panel. This is a separate workflow from question selection.

These two contexts are **intentionally separate** — they serve different decisions (selection vs. scoring) and are visited at different points in the workflow.

## Alternatives considered

- **Analytics only (post-exam)** — rejected. A coordinator reviewing questions for reuse in a new exam shouldn't have to navigate to a previous assessment's analytics page to see historical performance.
- **QB only** — rejected. Post-exam analytics need deep psychometric review to support curving decisions — a shallow QB view isn't sufficient.
- **Merged into one combined view** — rejected. The contexts are temporally and purposively different; merging them creates an overloaded page that serves neither workflow well.

## Consequences

- Positive: Coordinators get performance data at the point of decision — during selection (QB) and during scoring (analytics).
- Positive: The QB becomes progressively richer as questions accumulate historical data, making it more useful over time.
- Implemented (Context 2): `analytics-client.tsx` has items analysis tab with p-bis, discrimination, curving panel.
- Not yet built (Context 1): Inline performance indicators in QB question rows/detail panel. This is the outstanding item for this ADR.
