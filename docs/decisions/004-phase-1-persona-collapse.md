---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-004 — Phase-1 persona collapse to 3 view tiers

## Status

Accepted (Aarti, 2026-05-08)

## Context

PCE's `personas.md` documented 8 personas (Dean, Associate Dean, PD, CCC, Dept Chair, DCE, Faculty, Adjunct, Coordinator, Student) per the original PRD. Aarti pushed back hard during the 2026-05-08 review:

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views."

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."

The same constraint applies to all products in Phase 1 — design 3 views, not 8+.

## Decision

Phase 1 of every Exxat product collapses to **3 view tiers**:

| Tier | Covers |
|---|---|
| Admin | Program Director, Curriculum Committee Chair, Curriculum Chair, Department Chair, Director, Coordinator, anyone with cross-faculty visibility |
| Faculty | Full faculty + adjunct + course director + instructor variants |
| Student | All student roles |

Per-product DESIGN.md files MAY document additional sub-archetypes for design context (goals, frustrations, JTBD per archetype) — but Phase 1 SHIPS three views, not eight.

Sub-archetypes within a tier inform the priority of features within that view (e.g., the admin view emphasizes PD-style cohort drill-in but is also usable by a Coordinator) but don't get separate UIs.

## Alternatives considered

- **Per-persona views** (current PCE design) — rejected per Aarti. Bandwidth.
- **Two views (admin + non-admin)** — rejected because student vs faculty are too different in mental model and surface needs.
- **N views, with role-aware feature visibility within each** — partial overlap with the chosen approach; the difference is that roles within a tier share the same screens, with surfaced features tuned to majority sub-archetype.

## Consequences

- Positive: Phase 1 ships in months, not years.
- Positive: Engineering builds 3 nav shells per product, not 8+.
- Positive: Sub-archetype context still available to designers via personas.md for prioritization decisions.
- Negative: Some sub-archetypes will feel "designed for someone else" — e.g., a Coordinator using the admin view that's optimized for PDs. Mitigated by surfacing Coordinator-relevant entry points prominently.
- Negative: PCE's existing 8-persona design needs restructuring. PR companion to this ADR collapses PCE personas.md.
- Follow-up: Each per-product personas.md should organize as: 3 Phase-1 personas at top, sub-archetypes as reference.
