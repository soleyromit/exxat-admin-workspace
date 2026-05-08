# PCE — Strategy

Extended from `apps/pce/DESIGN.md §1–§2`. This file holds the long-form strategy that doesn't belong in the spec.

## North star

Close the post-course evaluation loop with no faculty surprise, no coordinator gruntwork, and a CAPTE/ARC-PA-defensible audit trail.

## Strategic context

PCE programs (DPT, MOT, MSPAS, MS-SLP, MS-AT, etc.) are required by accreditors (CAPTE 2C, ARC-PA, ASHA) to evaluate every course every term, action negative trends, and prove the loop closed. The current state across most programs:

- SurveyMonkey for distribution (no LMS hook, no anonymity guarantee enforced)
- Email chase by coordinator (manual, inconsistent)
- Anthology archive for compliance (PDF + CSV, retroactive, not actionable)
- Faculty get raw means; nothing comparative, no trends, no peer norming
- CQI happens in a Word doc that may or may not survive a leadership transition

PCE collapses this into one autopilot system that is enforced, not advisory.

## What success looks like (Phase 1)

| Metric | Baseline | Target | Owner |
|---|---|---|---|
| Coordinator time per term | ~20 hrs of chasing | <2 hrs (review autopilot exceptions) | Product |
| Faculty self-view rate (within 30 days of grade post) | <40% | >85% | Product |
| Closed CQI loops per term | typically 0 (logged but unactioned) | ≥3 per program with measurable reassess | PD |
| Accreditation export readiness | days of manual prep | one-click CAPTE 2C export | Engineering |

## What we're not doing (Phase 1)

- Dean / Associate Dean aggregate views (Phase 2)
- Cross-cohort didactic ↔ clinical correlation (Phase 2; FERPA OQ-07 unresolved)
- Anthology historical data migration (Phase 2; OQ-06)
- Alumni surveys (Phase 2; OQ-08 token mechanism)
- Blackboard / D2L LMS support (Phase 2 — Canvas only for Phase 1)

## Strategic risks

- **Faculty buy-in** — if faculty perceive PCE as evaluative-of-them rather than evaluative-of-the-course, they will resist. Mitigation: structured reflection (FR-18), 2-sentence next-cohort note (FR-16), grade-locked timing.
- **Coordinator workflow disruption** — if autopilot misses an edge case (e.g., cross-listed course), coordinator gets blamed. Mitigation: live monitor with surfaced exceptions, audit trail with timestamped events.
- **Min-N suppression abuse** — small electives below N=5 never see results. Mitigation: PD-level all-results view sees aggregate even when faculty self-view is suppressed.
