---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-010 — Assessment status uses "ongoing" not "live"

## Status

Accepted (Aarti, 2026-05-08)

## Context

Early designs used "live" as a status label for assessments currently being administered. "Live" is industry jargon with ambiguous scope — it could mean "published and visible to students", "currently being taken in a classroom", or "results are published."

Aarti defined the canonical assessment status taxonomy:

> "Completion status as primary org taxonomy: ongoing → scheduled → not yet scheduled → completed."

"Live" was explicitly replaced. "Ongoing" aligns with the course-offering status model already in use (`'ongoing' | 'completed' | 'upcoming'`), making the vocabulary consistent across the product.

## Decision

The label "live" is not used anywhere in the UI to describe an assessment or course offering status. The canonical set is:

- **Ongoing** — currently in progress (exam is being administered or is open for submission)
- **Upcoming / Scheduled** — confirmed for a future date
- **Draft** — created but not yet published
- **Pending review** — awaiting chair/supervisor approval before publishing
- **Completed** — all submissions in; results may or may not be published

This applies to both course-offering status and assessment status labels visible to faculty and admins.

## Alternatives considered

- **"Live"** — rejected. Ambiguous (see context). Also inconsistent with course-offering vocabulary already using "ongoing."
- **"Active"** — rejected. "Active" is used for faculty/student status (active vs. inactive account). Using it for assessment status would create cross-entity confusion.

## Consequences

- Positive: Consistent vocabulary across course offerings and assessments.
- Positive: Eliminates "live now" label from faculty course cards — replaced with "ongoing."
- Fixed: `courses-client.tsx` lines 1178 + 1217 updated from "live" / "live now" → "ongoing".
- Follow-up: Audit the assessment-taker app's `in_progress` status label — it maps to "ongoing" conceptually. May need a display label pass to align wording.
