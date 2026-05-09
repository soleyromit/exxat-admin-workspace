---
type: meeting-distillation
date: 2026-05-08
product: pce
source: granola
participants: [Aarti, Romit]
session: 2026-05-09-course-eval-redesign
status: Distilled
---

# Course Evaluation — May 8 2026

> Distilled from Granola via `query_granola_meetings`. Surfaces directives that drive the Course Evaluation redesign across PCE admin, faculty, and student surfaces.

## Decisions made

| ID | Decision | Owner | Maps to |
|---|---|---|---|
| D-1 | Course evaluation data is **always collected at the course offering level** (faculty + course + term + cohort) | Aarti | Information architecture spine |
| D-2 | **Three user views only** for the dashboard (admin, faculty, student) | Aarti | Workspace ADR-004 (persona collapse) — already aligned |
| D-3 | **Same survey template required** for cross-course aggregation to be meaningful | Aarti | Template-consistency guardrail |
| D-4 | Faculty cannot see peer comparisons — only their own performance vs. averages | Aarti | Privacy + cultural choice; faculty view scope |

## Data architecture

**Collection grain:** course offering = unique (faculty × course × term × cohort).

**Aggregation tree:**
```
Course offering (atomic — every student submission)
  ├── Course level (multiple offerings over time → trend analysis)
  ├── Faculty level (all course offerings taught by an individual)
  ├── Term level (semester/quarter cross-course)
  └── Cohort level (graduating class longitudinal — 3+ years)
```

## Two primary dashboard views

| View | Default? | Purpose |
|---|---|---|
| **Term-based** | ✅ default | All courses in a specific academic term, cross-course comparison |
| **Cohort-based** | secondary tab | All courses taken by a specific graduating class, separable by didactic vs clinical |

## Term-based dashboard structure (per Aarti)

- Courses grouped by cohort within each term
- Average scores for **courses** and **faculty** shown separately
- Trend analysis across **5–6 previous terms**

## Drill-down navigation pattern

```
High-level AI summary  ──►  Question-level detail  ──►  Individual course offering
   (term overview)         (per-course / per-faculty)         (deepest level)
```

## Faculty view scope (D-4)

- Personal performance vs department/university averages — yes
- Peer comparisons (other faculty by name) — **NO**
- Faculty's own term-over-term trajectory — yes
- Faculty's own per-course breakdown — yes

## AI insights integration (Aarti's directives)

| Pillar | Manifests as |
|---|---|
| Cross-course theme identification | "3 courses mentioned 'online resources lacking'" — surfaced on term overview |
| Performance benchmarking | Department/university averages drawn ON viz, not in prose |
| Automated highlighting of top/bottom performers | Outlier panels highlighted (amber border per VIZ-PATTERN-006) |
| Trend analysis for course improvement | Per-course slope graph; per-faculty trajectory in small multiples |
| Action plan recommendations from qualitative responses | AI insight card with confidence + source citation |

## Concerns raised

| ID | Concern | Implication for design |
|---|---|---|
| C-1 | Template consistency risk: cross-course analysis impossible if different templates used (e.g., clinical vs didactic) | Surface a "Template variance" indicator. When templates differ, gracefully degrade cross-course analysis to basic 1-5 rating only. |
| C-2 | Dashboard utility risk if template standardization fails | Banner pattern: "Cross-course analysis limited — N templates in use across these courses" |
| C-3 | No written requirements yet for complex dashboard use cases — multiple interpretations leading to wasted dev cycles | This spec is the response. PRD-shaped. |

## Action items

| ID | Item | Owner | Status |
|---|---|---|---|
| A-1 | Write detailed PRDs for evaluation dashboards before screen development begins | Romit | This spec (`apps/pce/docs/specs/course-evaluation.md`) |
| A-2 | Use case validation with Vishal before any dashboard screens are built | Romit + Vishal | pending |
| A-3 | Foundational documentation for program architecture (including course evaluation data model) | Aarti / Mohan | pending |
| A-4 | Develop admin screens for master lists while complex analysis screens are still being scoped | Romit | already shipped (apps/pce/admin/app/(app)/admin/* — 11 entity routes) |

## How this distillation feeds the spec

`apps/pce/docs/specs/course-evaluation.md` references this file as the source of truth for:
- Data architecture decisions
- View hierarchy
- AI integration scope
- Faculty privacy guardrails
- Template-consistency UX pattern

When the design changes, update this distillation OR add a new dated meeting file — never silently re-interpret.
