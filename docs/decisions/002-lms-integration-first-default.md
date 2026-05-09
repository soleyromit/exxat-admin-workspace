---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-002 — LMS-integration-first default for all new modules

## Status

Accepted (Aarti, 2026-05-08)

## Context

Today ~5% of Exxat customers have LMS integration enabled (Canvas primarily). The other 95% manually add courses, terms, students, faculty. The new modules (Exam Mgmt, PCE, Patient Log, Skills Checklist, Learning Contracts) inherit this state — manual-first defaults — and the design assumes a coordinator typing data in.

Aarti wants to flip the default: assume LMS integration is on. Manual entry becomes the exception, not the norm. Phase 1 of the new modules should be designed for ~95% LMS-on customers, with manual flows as fallback.

## Decision

Architecture and UI default to LMS-integration-on:

- Admin onboarding has a single school-level toggle: "LMS integration enabled?" Default YES.
- When ON: manual add controls for courses / terms / course offerings / students are **disabled** (read-only with a sync indicator). The LMS is the source of truth.
- When OFF: full CRUD on those entities (current state).

Each admin master-list screen shows two states. Default UI assumes LMS-on.

> "My hope with these modules is that it will be the other way around, and that majority of our customers would have LMS integration turned on. So that is the default way in which I want to operate." — Aarti

## Alternatives considered

- **Manual-first default** (current state) — rejected because it perpetuates the 5% LMS adoption rate. Defaults shape behavior.
- **Auto-detect LMS presence** — rejected as too magical; school admins should make an explicit choice.
- **Per-entity LMS toggle** — rejected as too granular; a school either integrates or doesn't.

## Consequences

- Positive: Designs that ship will work cleanly for the future state Aarti is steering toward.
- Positive: LMS-on flows are simpler (less form chrome), so the primary UI gets cleaner.
- Negative: Manual-mode (current 95% of customers) gets the secondary treatment. Risk of regression in usability for those users until they migrate.
- Negative: Requires file upload/download integration for non-LMS customers (Aarti called this out as needed).
- Follow-up: Each admin master-list screen needs both LMS-on and manual states designed and built.
