---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-014 — Coverage distributions show frequency counts, not percentages

## Status

Accepted (Aarti, 2026-05-08)

## Context

The QB sidebar shows distribution charts for Bloom's level and difficulty across questions in a folder. Each bar can display either the raw count of questions ("14 Apply") or a percentage of the total ("35%"). Both communicate the same underlying data but serve different mental models.

Coordinators building exams think in counts: "I need 10 easy, 15 medium, and 5 hard questions." They do not plan by percentage. Showing "33%" instead of "10 easy questions" forces an unnecessary conversion when what they actually care about is the raw number of questions available in each category.

## Decision

Distribution charts in the QB (Bloom's, difficulty, content area) display **raw question counts** as labels (e.g., `Easy: 10`, `Apply: 14`). Bar width may use percentage for visual proportion, but the printed label is always the count.

This applies to all coverage/distribution surfaces in Exam Management where the purpose is to help a coordinator decide what questions to include in an assessment.

Post-exam analytics that report *student performance* (e.g., "35% of students answered correctly") use percentages because those metrics describe rates, not counts.

## Alternatives considered

- **Percentages** — rejected for question coverage. When selecting questions, knowing "35% are Apply-level" is less actionable than knowing "14 Apply-level questions exist." Percentage suppresses the absolute number, hiding whether there are 14 or 140 questions.
- **Both count and percentage** — rejected for the label. Dual labelling clutters a small sidebar widget. Bar width provides the proportional view; the label provides the exact count.

## Consequences

- Positive: Coordinator sees immediately whether there are enough questions of a type to build their target mix.
- Positive: Consistent with how faculty think about exam construction ("I want 20% Apply-level" means "I need about 10 Apply questions for a 50-question exam" — the count is what they work with).
- Implemented: QB sidebar Bloom's distribution (`qb-sidebar.tsx` line 722: `{count}`) and difficulty distribution (line 700: `{label}: {count}`) both show raw counts.
