---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-006 — Accommodations as a shared cross-product module

## Status

Accepted (Aarti, 2026-05-08)

## Context

Student accommodations (extra time, reader, alternate format, etc.) apply across multiple Exxat products — students who need extra time on exams (Exam Management) often also need accommodations on clinical encounters (Patient Log) or skill demonstrations (Skills Checklist). The current state has each product handling accommodations locally with no shared list, no shared documentation, no shared admin authority.

Aarti was emphatic that accommodations are an administrative function, not a faculty one:

> "A faculty cannot decide whether this student gets this accommodation or not. At the higher level, that decision is made."

## Decision

Accommodations are a shared cross-product module with three tiers:

1. **Master accommodations list** (program level) — admin-defined catalog of accommodation types (extra time, reader, etc.). Schools may add custom accommodations.
2. **Per-student accommodation assignments** (admin only) — admin applies one or more accommodations to a student, with documentation upload supporting the determination.
3. **Course-level read-only inherited view** (faculty) — faculty sees, on each course's roster, which students have which accommodations. Read-only. Filtered to that course's enrolled students.

Faculty cannot create, edit, or revoke accommodations. Faculty cannot apply accommodations to non-students.

Non-registered students may take a single assessment with proper workflow (e.g., makeup exam) — this requires accommodation lookup to work for non-registered students too.

## Alternatives considered

- **Per-product accommodations** (current state) — rejected per Aarti. Inconsistent application across products is a compliance risk and a usability disaster for students with accommodations across multiple modules.
- **Faculty-applied accommodations** — rejected per Aarti. Wrong authority level — accommodations are administrative determinations backed by documentation, not faculty discretion.
- **Read-write for faculty with admin approval** — rejected as procedurally complex with no user benefit; admin-only is simpler.

## Consequences

- Positive: One source of truth for student accommodations across all 5 products.
- Positive: Compliance posture improves — documentation is centralized, audit trail is consistent.
- Positive: Faculty workflow simplifies — they see flags/badges on their roster, no decision authority required.
- Negative: Cross-product schema dependency — accommodations module must exist before any product depending on it can ship.
- Negative: School admin workflow becomes more central; bottleneck risk if school doesn't staff appropriately.
- Follow-up: Define the accommodations module as a workspace-level shared service (likely lives in `apps/program-admin/` or similar — TBD with engineering).
- Follow-up: Each product's faculty surface needs the read-only inherited filtered view designed (P3 pattern candidate).
