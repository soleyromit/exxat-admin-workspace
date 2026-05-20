---
type: decision
date: 2026-05-08
product: exam-management
status: Proposed
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-016 — Five assessment types defined by taxonomy doc (blocked)

## Status

Proposed — blocked on taxonomy document from product team

## Context

Exam Management needs a canonical set of assessment types that determines what configuration options, pre-exam flows, and analytics views are available. Early discussions referenced five types, but the exact taxonomy was not finalised.

From the May 8 session, Aarti acknowledged the types but deferred finalisation:

> "Five assessment types — taxonomy doc as blocker."

The types in discussion (not yet confirmed):
1. **High-stakes exam** — scheduled, password-protected, downloaded, in-person proctored
2. **Take-home exam** — student self-administers within a time window; no classroom password
3. **Pop quiz / live assessment** — instructor-initiated in real time; no pre-scheduling
4. **Formative quiz** — low-stakes, auto-advance optional, immediate results
5. **Practice / self-assessment** — student-initiated, no grading, competency-building

Each type has different: password requirements, download behaviour, result publication timing (immediate vs. 3-4 day review), curving applicability, and accommodation handling.

## Decision (proposed, pending taxonomy doc)

Assessment type is a first-class field on every assessment. The type drives defaults for:
- Whether a classroom password is required
- Whether the exam is downloaded or browser-based
- Default result publication delay (immediate / faculty-controlled / 3-4 day review)
- Whether the live monitor applies
- Whether the "question auto-advance on selection" option is available

The five types listed above are the working proposal. This ADR moves to **Accepted** once the product team publishes the taxonomy document and it is reviewed by Vishaka.

## Alternatives considered

- **No type field — configure everything manually per assessment** — rejected. Faculty would need to configure 8+ settings per exam; the type should set sensible defaults, with overrides allowed.
- **Three types only (formal / informal / practice)** — considered but doesn't capture the pop quiz distinction (real-time instructor-initiated vs. pre-scheduled) that is important for the live assessment flow.

## Consequences

- Positive: Assessment type unlocks conditional UI (e.g., no password step for take-home; no download for browser-based pop quiz).
- Blocked: No assessment type field exists in the data model yet (`lib/qb-mock-data.ts` has no `type` field on the assessment object). Cannot finalise the pre-exam flow or assessment builder UI until the taxonomy is accepted.
- Next step: Product team to publish taxonomy doc → ADR moves to Accepted → assessment builder UI and data model updated to include type.
