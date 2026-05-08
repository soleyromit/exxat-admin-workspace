---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-001 — Program-level entity universe shared across all 5 products

## Status

Accepted (Aarti, 2026-05-08)

## Context

Each Exxat product (Exam Management, PCE, Patient Log, Skills Checklist, Learning Contracts) has been treating courses, students, faculty, content areas, etc. as product-local entities. As Aarti walked through Exam Management and PCE designs in the 2026-05-08 review, the duplication became untenable: the same student exists in Exam Mgmt's roster, PCE's response cohort, and Patient Log's encounter records. The same course exists 5+ times. Accommodations apply across products. Faculty assignments cross products.

Aarti pushed for a shared program-level entity model — owned by Admin once, subset by each module. This is also a precondition for ADR-003 (independent module sellability) because each module needs to know which subset of program data it operates on.

## Decision

We will define and own these entities ONCE at program level:

1. Master courses
2. Terms (master list)
3. Course offerings (course × term × faculty assignment)
4. Students
5. Faculty
6. Permissions / role assignments
7. Content areas
8. Competencies
9. Standards (accreditation)
10. Accommodations (master list)
11. Assessment types

Every module subsets these for its own use (e.g., Exam Mgmt shows "courses I'm assigned to" for Faculty view; PCE shows "courses being evaluated this term" for Admin view). Modules do NOT own these entities; they consume them.

> "Pharmacology one, spring twenty twenty six, that is like a combination of a term and a course. That's a course offering. Not a base course." — Aarti

## Alternatives considered

- **Per-product entity definitions** — rejected because it produces 5x duplication, breaks cross-product reporting (e.g., "this student's accommodations across all their modules"), and forces every product to rebuild the same admin master-list screens.
- **One product owns canonical, others reference** — rejected because no product is a natural owner; designating one (e.g., Exam Mgmt) creates an unhealthy dependency for all the others.

## Consequences

- Positive: One source of truth per entity. Cross-product reporting becomes trivial.
- Positive: Admin master-list screens are built once, reused.
- Positive: ADR-003 (module sellability) becomes implementable — each module standalone-sells but shares the entity backbone.
- Negative: Requires upfront work on the program-admin module before other modules can mature. Aarti acknowledged this: "let the developers develop these screens while you guys are worrying about more advanced screens."
- Negative: Schema migration required for existing Exam Mgmt data — entities must be promoted from product-local to program-global.
- Follow-up: Per-module DESIGN.md files must reference §11 of workspace DESIGN.md, not redefine entities locally.
