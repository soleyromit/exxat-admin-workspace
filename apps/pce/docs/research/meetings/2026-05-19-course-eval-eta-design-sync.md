---
type: meeting
date: 2026-05-19
product: pce
participants: [Romit, Mohit, Vishal]
source: granola
granola_id: ec8e55ac-b751-4847-adec-7cdf2e5174e7
---

# Course Evaluation and Survey Design — Base Entities, Template Workflow, and ETAs

**Date:** 2026-05-19 · **Time:** 9:32 AM EDT

## Topics covered

1. Design ETA alignment — engineering has full bandwidth and is waiting
2. Three-module scope for Phase 1 handoff: create template, distribute survey, student responds
3. Base entities design — incorporating RTI + Vishaka data
4. FERPA confirmation for course evaluations
5. Product structure — course evaluation vs. general/programmatic surveys on navbar
6. Design freeze deadline confirmed for May 27

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_CE18 | **Design freeze target: May 27** for modules 1–3 (create template, push/distribute survey, student response). Analytics (module 4) = one month after. | PCE Admin / Student | — |
| D_CE19 | **Template v1 (or more) to Vishal by May 25** — Romit committed to sharing something before the May 27 deadline | PCE Admin | — |
| D_CE20 | **Incremental handoff** — as each module is complete, hand to engineering without waiting for all three. Do not block engineers. | PCE | — |
| D_CE21 | **FERPA confirmed: course evaluations are not FERPA-protected** — faculty seeing aggregate student feedback does not violate FERPA. Student is openly sharing feedback; FERPA protects academic records (grades, scores), not freely-given feedback. | PCE | — |
| D_CE22 | **Navbar separation confirmed** — "Course Evaluation" and "Programmatic Surveys" (formerly "Other Surveys") are separate top-level nav items. Consistent with D from §6.1 decisions summary. | PCE Admin | — |
| D_CE23 | **Not redesigning foundational workflow** — current survey structure (2-step for templates, 4-step for general surveys: basic details → design → distribution → fulfillment) is kept. Design focuses on HOW to present, not what steps to take. | PCE Admin | — |

---

## Timeline

| Deliverable | Target date | Notes |
|---|---|---|
| Create template v1 | May 25, 2026 | Romit's self-committed date |
| Modules 1-3 design freeze | May 27, 2026 | Aligned with Vishal + Mohit |
| Analytics design | ~June 27, 2026 | One month after module 3 handoff |

---

## Verbatim quotes

> "I want am just want to convey that, Rumid, we want to move a bit faster because engineers are available and that's not a good state to be in when engineers are available and we don't have the requirement for them." — Mohit

> "When I say, it's a design freeze. Then front end will not be able to pick up before we design freeze." — Mohit

> "So you can start, Megan [Romit]. You can focus on templates and then surveys and then fulfillment experience. The moment you've completed create template, if you can share it across, we can just start... have the engineers start working on it." — Vishal

> "We are not making anything different [from the current survey flow]. Because if you go through current survey, the steps that are there to create a template [are] well defined. It's a good two, three step process." — Mohit

---

## Design tasks generated / updated

| Task | Priority | Notes |
|---|---|---|
| T28 — Create template UI (update note) | P1 — **due May 25** | Romit committed to sharing v1 before May 25. Already in backlog; urgency elevated. |
| T29 — Push survey UI (update note) | P1 — **due May 27** | Part of May 27 design freeze package. Already in backlog. |
