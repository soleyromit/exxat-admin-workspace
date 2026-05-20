---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-011 — Question tagging happens at question level, not assessment level

## Status

Accepted (Aarti, 2026-05-08)

## Context

There are two points in the workflow where tagging could plausibly occur:
1. When creating/editing a question in the Question Bank
2. When building an assessment and selecting questions

Early discussions left this ambiguous. Aarti clarified:

> "They map when they're building the questions. That's why tagging — the major use case is while creating questions when they're building question banks. They're building an assessment, they are not doing the mapping work."

> "Viewing the tags while building an assessment is important. Tagging from while creating an assessment is not."

The mental model: a question carries its own metadata (Bloom's level, difficulty, competency mappings, content area tags) from the moment it's created. When an assessment is assembled from questions, the coordinator is selecting questions *by their tags*, not tagging them.

## Decision

Tags (Bloom's level, difficulty, competency, content area, custom labels) are set at the **question level** in the Question Bank. They are read-only at assessment level — visible as reference when selecting questions, not editable.

New questions created inline during assessment building (rather than from the QB) should also allow tagging at creation time, as a secondary path. But the primary tagging surface is the QB question editor.

## Alternatives considered

- **Tag at assessment level** — rejected. Moves tagging into the wrong context. A question can be reused across assessments; tagging it once in the QB applies everywhere. Re-tagging per assessment creates inconsistency.
- **No tagging during assessment building at all** — rejected for inline question creation. If a faculty member creates a new question while building an exam, they should be able to tag it immediately.

## Consequences

- Positive: Tags accumulate on the question over time as it's used in multiple assessments — the QB becomes the longitudinal quality record.
- Positive: Assessment-building UI stays focused on selection rather than metadata editing.
- Implemented: QB (`qb-table.tsx`) shows and edits tags at question level. Assessment analytics views tags read-only.
- Follow-up: When the assessment builder is built, question selection panel must show question tags inline so coordinators can filter by them.
