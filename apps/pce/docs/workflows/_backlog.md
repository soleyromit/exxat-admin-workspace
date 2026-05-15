# PCE / CFE — Design Backlog

Source: 2026-05-08 Aarti audit (`docs/research/meetings/2026-05-08-aarti-design-review.md`).

## Phase 1 design tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T17 | Admin program overview — term-driven | Admin | CFE landing | P1 | Term + course count + cohort breakdown header. Course leaderboard + Faculty leaderboard (top 5 + bottom 5). Trend chart: course-rating + faculty-rating over 5–6 terms |
| T18 | All courses tab (term scope) | Admin | CFE list | P1 | Grid: course name, offering, faculty, registered, completed, response %, current avg, lifetime avg, trending up/down with delta, color coded |
| T19 | Course detail | Admin | CFE drilldown | P1 | Header: response rate, current avg, trend, lifetime avg, # times offered, per-faculty historical comparison. AI insights pane (positive themes / improvement areas). Per-question analysis tab. Faculty insights. Action plan |
| T20 | Faculty self-view | Faculty | CFE faculty home | P1 | Course rating + faculty rating side-by-side. Comparative ("0.3 above average"). Trend. Lifetime average. Tenure to the right |
| T21 | Course distribution viz | Admin / Faculty | CFE detail | P1 | All-courses dot/strip with average line; current course highlighted, others faded. Same pattern for faculty distribution |
| T22 | Action plan flow (lite) | Admin / Faculty | CFE detail | P1 | From negative theme → "Create action plan" → AI recommends → accept/edit/clear/type-own. Notes attached |
| T23 | Cohort grouping toggle | Admin | CFE program | P1 | Switch dashboard between Term view and Cohort view. Cohort = 6 terms aggregated |

## Killed by Aarti on 2026-05-08

| # | Task | Reason |
|---|---|---|
| T24 | Mobile evaluation form (custom) | Use existing mobile architecture |
| T25 | Cohort readiness | Wrong product — students aren't being assessed in CFE |
| T26 | Competency rating | Competencies are outcomes, not student-rated |

## Phase 1 design tasks — added 2026-05-14

Source: `docs/research/meetings/2026-05-14-course-eval-base-entities.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T27 | PCE base entity landing pages | Admin | Module | **P0 — due Tue May 19** | Terms landing, course offerings landing, faculty landing — one page per entity. Adi confirmed this is Aarti's ask. |
| T28 | Create template UI | Admin | Survey creation | P1 | Manual zero-state → add questions → Likert or free text per question. No QB import. Start from approved PRD (create template + push survey doc). |
| T29 | Push survey UI | Admin | Survey push | P1 | Select course offering / term, configure distribution window. |
| T30 | PCE settings page — Likert scale config | Admin | Settings | P1 | Program director sets default Likert pointer (3/4/5/7/10). Warning: changing setting won't affect live surveys. |

## Phase 1 — killed (updated 2026-05-14)

| # | Task | Reason | Source |
|---|---|---|---|
| T24 | Mobile evaluation form (custom) | Use existing mobile architecture | 2026-05-08 |
| T25 | Cohort readiness | Wrong product — students aren't assessed in CFE | 2026-05-08 |
| T26 | Competency rating | Competencies are outcomes, not student-rated | 2026-05-08 |
| T31 | Question bank import for surveys | NOT phase 1 — nice-to-have, ignore for now | 2026-05-14 |
| T32 | AI-native survey flow | NOT phase 1 — traditional flow first | 2026-05-14 |
| T33 | Analytics design | PCE analytics PRD not yet approved — wait | 2026-05-14 |

## Open product questions

- F2 (adjunct faculty) — email-only or rolls into faculty view? Reconfirm with Aarti.
- Grade-lock workflow — was a PCE PRD feature; Aarti didn't reaffirm in 2026-05-08; treat as deferred until reconfirmed
- "Notes" concept — Aarti said "low priority placeholder" for action-plan content (D32)
