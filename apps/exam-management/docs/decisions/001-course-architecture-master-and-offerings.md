---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
related: workspace-ADR-001
---

# Exam Management ADR-001 — Three-concept course architecture

## Status

Accepted (Aarti, 2026-05-08)

## Context

The current Exam Management designs treat "courses" as a single entity. A faculty member sees "their courses" and acts on them. But this collapses three distinct concepts:

1. The abstract course (e.g., "Pharmacology I") that the program offers.
2. The specific term in which a course is offered (e.g., "Spring 2026").
3. The combination — that specific course in that specific term, taught by that specific faculty assignment.

Aarti made the distinction explicit:

> "Pharmacology one, spring twenty twenty six, that is like a combination of a term and a course. That's a course offering. Not a base course."

Without separating these, the system can't model: a course taught by different faculty in different terms, a course offered in multiple sections in one term, longitudinal trend analysis across course offerings, or admin's master-list view of "all courses we offer" vs "what's running this term."

## Decision

Exam Management uses three distinct entities (defined at program level per workspace ADR-001):

1. **Master course** — the abstract course. Catalog-level. Owned by Admin. Examples: "PHARM 101 Pharmacology I", "ANAT 201 Anatomy".
2. **Term** — the academic term. Catalog-level. Owned by Admin. Examples: "Spring 2026", "Fall 2025".
3. **Course offering** — the combination of a master course + term + faculty assignment + roster. Owned by Admin (creates) / Faculty (acts on). This is what Faculty sees as "my courses."

Faculty cannot add master courses, terms, or course offerings. Admin owns all three. Faculty can be assigned to a course offering as Course Director or Instructor (per Exam Mgmt ADR-002 on roles).

> "As a faculty, I cannot just randomly add a new course to my syllabus." — Aarti

## Alternatives considered

- **Single "courses" entity** (current design) — rejected. Conflates three concepts, breaks longitudinal analysis, breaks admin master-list workflow.
- **Master course + term, no separate offering** — rejected. The faculty assignment is a first-class concept (different faculty teach the same course in different terms; different roles within one offering); it deserves its own entity.

## Consequences

- Positive: Clean entity model for trend reporting (compare same master course across terms).
- Positive: Admin can set up a master course once and rev it forward into each term as a course offering.
- Positive: LMS integration becomes mappable — LMS courses correspond to course offerings, not master courses.
- Negative: Schema migration required for existing Exam Mgmt data (which conflates the three).
- Negative: UI must clearly communicate the three-tier model without overwhelming faculty (who only care about course offerings). Master courses + terms appear in admin only.
- Follow-up: Admin master-list screens for all three entities (T2 in 2026-05-08 audit).
- Follow-up: Faculty home design (T1) — show course offerings, not master courses.
