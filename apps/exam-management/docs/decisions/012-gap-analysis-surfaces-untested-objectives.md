---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-012 — Gap analysis surfaces untested objectives at course level; AI-assisted in Phase 2

## Status

Accepted (Aarti, 2026-05-08) — Phase 1: metric + surfacing; Phase 2: AI-assisted question generation

## Context

A course may teach 30 learning objectives but only 20 are covered by exam questions in the Question Bank. The 10 untested objectives represent a curriculum gap — students are taught content that is never assessed, which undermines both the assessment's validity and competency-based reporting.

Aarti described this as a differentiator:

> "If a course objective is taught but they are not assessing it anywhere, we should highlight that. Those are the things that are important while creating an assessment."

> "AI mapping between questions and course objectives to flag insufficient topic coverage. Course-level question-bank gap analysis is a key differentiator from ExamSoft."

The mechanism: if curriculum mapping is done (questions tagged to objectives), the system can compute which objectives have zero coverage and surface them.

## Decision

**Phase 1 (metrics surface, no AI):** Each course card in the admin view shows `untestedObjectivesCount` — the number of course objectives with no mapped questions. This count appears as a status bit on the course card to signal that coverage work is needed. Requires curriculum mapping to be completed first; shows zero if no mapping exists.

**Phase 2 (AI-assisted generation):** When an untested objective is surfaced, the coordinator can request AI-generated question drafts targeting that objective. The AI generates candidate questions with rationale; the coordinator reviews, edits, and adds them to the QB. This is a Phase 2 feature — the data model and metric are Phase 1.

## Alternatives considered

- **Show gap analysis only in a dedicated analytics page** — rejected for Phase 1. The signal must be visible on the course card without additional navigation; coordinators should notice the gap during normal workflow.
- **Automatic AI question insertion without review** — rejected. Coordinators must review and approve any AI-generated content before it enters the QB. Faculty authority over assessment content is non-negotiable.

## Consequences

- Positive: Coordinators see coverage gaps before finalising an assessment, not after.
- Positive: AI generation flow can be introduced incrementally — the metric exists before the AI feature, so the feature can be shipped in phases without a design rethink.
- Negative: The metric is only meaningful if curriculum mapping is completed. Without mapping, the count is always 0 and the signal is silent.
- Implemented (Phase 1): `untestedObjectivesCount` computed in `courses-client.tsx` `buildSummary` and surfaced on course cards.
- Not yet built: The gap analysis detail page and AI generation flow.
