---
type: meeting
date: 2026-05-08
product: pce
also-affects: [exam-management, workspace]
participants: [Aarti, Romit, Vishakha (briefly)]
source: granola
granola_id: 4e1c850e-d760-4d05-81a1-a52287b9ae21
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
duration: ~3hr
---

# 2026-05-08 — Aarti design review (PCE / CFE focus + cross-product)

> Cross-product meeting. Full content lives at `apps/exam-management/docs/research/meetings/2026-05-08-aarti-design-review.md` — this file is a PCE-scoped pointer.
>
> The meeting covered Exam Management for the first ~2/3 and PCE/CFE for the last ~1/3. Findings affecting both products are in the canonical file above.

## PCE-specific decisions (subset of full meeting log)

| # | Decision | ADR? |
|---|---|---|
| D22 | **PCE personas collapse from 8 to 3:** admin (covers PD / CCC / Curriculum Chair / Dept Chair / Director), faculty (covers full + adjunct), student | yes |
| D25 | CFE has NO question bank — uses templates (5–6 of them, one inactive) | yes |
| D26 | CFE primary axis = term, with cohort grouping; two leaderboards (course + faculty); trend across 5–6 terms | yes |
| D27 | Students rate TWO distinct entities — course content + faculty teaching style | yes |
| D28 | Evaluation themes: AI-extracted from school-authored questions; no preset taxonomy | yes |
| D29 | "AI-first thinking": pulled data = trends/averages; AI = themes/insights/action-plans | yes |
| D31 | Action-plan tracking deferred to Phase 2/3 (doesn't help sell the product) | small |
| D33 | Faculty self-view: course rating + faculty rating + trend + lifetime + comparative — must show all five | yes |

## Things Aarti killed in PCE

- Mobile evaluation form (Romit's prototype) — use existing mobile architecture
- Cohort readiness — students aren't being assessed in CFE
- Competency rating — competencies are outcomes, not student-rated
- 8 personas — collapse to 3 admin/faculty/student
- Practice questions — out of Phase 1
- Heavy action-plan tracking — Phase 2/3

## Verbatim (PCE-relevant)

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views."

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."

> "AI is good at finding themes and grouping the information by themes. Just let AI do that work… You're still thinking that everything has to be tagged and grouped and organized. But, no, like, let it be dynamic."

## What this changes in PCE docs

- `apps/pce/DESIGN.md §3` — collapse 8 personas to 3 view tiers (Phase 1)
- `apps/pce/docs/personas.md` — restructure: 3 Phase-1 personas at top, 8 detail-personas as "admin sub-archetypes" + "faculty sub-archetypes" reference data
- `apps/pce/docs/content.md` — add: lifetime average, course rating vs faculty rating, action plan, reflection, cohort, term/cohort grouping
- `apps/pce/DESIGN.md §4` — workflows: drop mobile-evaluation as a custom design task; add term-driven dashboard, cohort grouping, AI themes
- `apps/pce/DESIGN.md §1` — north star unchanged but tighten: phase 1 ships an admin dashboard (term + cohort), faculty self-view, student form (existing mobile arch); CQI is Phase 2/3

## Cross-references

- Cross-product architectural decisions (program-level entity universe, LMS-first default, module launcher, accommodations module): in canonical file.
- Workspace updates (module launcher direction, persona collapse rule, AI-first pattern): see proposed workspace `DESIGN.md` and `docs/patterns/` updates in the audit response.
