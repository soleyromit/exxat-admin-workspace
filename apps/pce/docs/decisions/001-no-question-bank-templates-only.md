---
type: decision
date: 2026-05-08
product: pce
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# PCE ADR-001 — No question bank in PCE / CFE; templates only

## Status

Accepted (Aarti, 2026-05-08)

## Context

PCE (Course Faculty Evaluation, "CFE" in Aarti's framing) was originally designed to mirror Exam Management's question bank structure: standardized banks at university level, templates pulling from banks, version pinning, etc. (See HANDOFF.md FR-05.)

In the 2026-05-08 review, Aarti rejected this. CFE evaluation questions are school-specific, not reusable across programs the way exam content is. A standardized national bank of "Was your faculty effective?" questions doesn't add value the way a standardized item bank for pharmacology does.

The simplification matters because CFE is meant to ship quickly:

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."

## Decision

PCE / CFE has NO question bank. It uses **templates** only.

- **5–6 templates** per school (configurable). One inactive by default.
- Schools author their own evaluation questions per template.
- AI extracts themes from open-text responses dynamically (per workspace ADR-005), so schools don't need to pre-tag questions into theme categories.

Cross-school reusability is achieved via "starter templates" Exxat ships, not via a standardized bank.

## Alternatives considered

- **Standardized question banks** (original PRD FR-05) — rejected per Aarti. Eval questions are school-specific; the bank-template-version-pin model is overengineered for the value.
- **Templates + question library (lighter than a full bank)** — rejected as halfway; either commit to bank structure or skip it. Aarti chose skip.
- **Free-form per-template authoring** (no templates, just authoring) — rejected because schools need a way to standardize across courses within a program.

## Consequences

- Positive: PCE Phase 1 ships much faster — no bank infrastructure, no version pinning, no longitudinal-impact warning logic.
- Positive: Schools have full authoring flexibility per template.
- Positive: ADR-005 (AI-first thinking) handles theme aggregation, so the bank's analytics value is replaced by AI extraction.
- Negative: Cross-school benchmarking on identical questions becomes impossible. Mitigated because Aarti doesn't view this as a Phase 1 need.
- Negative: HANDOFF.md FR-05 is no longer accurate — needs update or supersedence note.
- Follow-up: Update PCE prototype's "Question Bank" surface to remove or repurpose. The current prototype has Templates + Banks separated; collapse to Templates only.
- Follow-up: Decide on "starter templates" Exxat ships (separate workstream).
