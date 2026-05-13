---
type: decision
date: 2026-05-13
product: exam-management
status: Accepted
source: conversation
session: 2026-05-13-qb-folder-actions
---

# ADR-002 — Archived questions appear at end of folder list with mutable, filterable status

## Status

Accepted

## Context

The team needed to decide what happens visually and functionally when a question is archived. Two positions were considered: hide archived questions from folder views entirely (clean list, lower cognitive load) or keep them visible with a distinct status (auditability, context for collaborators, reversibility). See also ADR-003 for how archived questions are located in All Questions.

## Decision

Archived questions remain visible at the bottom of any folder list they are tagged to, rendered with an **"Archived" status badge**. The position is always last — below all active (Saved, Draft, In Review) questions in the list — regardless of sort order applied to the rest of the list.

Status is **mutable**: an archived question can have its status changed back to Draft, Saved, or any valid status from the status-change affordance (inline or via row action menu). Archive is not a terminal state.

The status filter includes **"Archived"** as a selectable option. By default, archived questions are excluded from filter results unless explicitly selected. When "Archived" is active in the filter, archived questions are shown in their normal position (bottom of list) rather than interspersed.

## Alternatives considered

- **Hide archived questions from folder views entirely** — rejected because it removes context for collaborators reviewing folder contents and makes accidental archive harder to recover from (user would need to find the question in All Questions to restore it).

## Consequences

- Positive: Archived questions remain auditable and reversible without leaving the current folder view.
- Positive: Status mutability supports workflows where archive = "hold" rather than "delete."
- Negative: Long folders with many archived questions may require design attention (e.g., collapsible archived section) in a future pass.
- Follow-up required: Define visual treatment for the archived section separator (label, divider, or collapse affordance) in the wireframe pass.
- Follow-up required: Confirm which roles can change status from Archived back to active.
