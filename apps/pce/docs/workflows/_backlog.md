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

## Phase 1 design tasks — added 2026-05-19

Source: `docs/research/meetings/2026-05-19-template-subject-architecture.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T34 | Terminology review — find better word than "subject" for template sections | Admin | Template editor | P1 | Vishaka: "Subject can have many meanings." Candidates: Evaluatees, Roles, Categories. Affects `SECTION_LABELS` and sidebar header label in `templates/[id]/page.tsx:190`. |
| T35 | Subject list data source — must come from Prism course-level role associations, NOT hardcoded | Admin | Template editor | P1 | Currently hardcoded as 3 types in `pce-mock-data.ts:2` and `templates/[id]/page.tsx:32`. Requires Sankalp + backend discussion. Vishaka: "We shouldn't hard code. The course level associations, we should offer them." |
| T36 | Conditional subject display — if course offering has no matching role, hide that subject section from student survey | Student | Survey response | P1 | Engineering logic at distribution time. Monil: "If a course does not have a faculty. You will not see the faculty section." Not yet implemented in `surveys/push/page.tsx`. |
| T37 | Out-of-the-box default subjects for new templates | Admin | Template creation | P2 | Reduce setup friction for first-time users. David: "the less barriers you put between them and actually launching these, the more likely they are to adopt it." |
| T38 | Subject/role sync mechanism — new Prism role additions must surface in course eval subject list | Admin | Template editor | P1 | Involves Sankalp. Add-capability in Prism must propagate to CFE. Vishaka: "this list and this list has to be in sync." |

## Phase 1 — killed (updated 2026-05-19)

| # | Task | Reason | Source |
|---|---|---|---|
| T39 | Guest lecturer feedback flow | Phase 2 — schools use student-initiated forms today; admin visibility too low | 2026-05-19 |

## Phase 1 design tasks — added 2026-05-19 (ETA sync)

Source: `docs/research/meetings/2026-05-19-course-eval-eta-design-sync.md`

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T28 | Create template UI — **DEADLINE May 25** | Admin | Template creation | P1 — URGENT | Romit committed to sharing v1 before May 25. Engineering has full bandwidth and is waiting. Do not block. |
| T29 | Push survey UI — **part of May 27 design freeze** | Admin | Survey distribution | P1 — URGENT | May 27 is the confirmed design freeze date for modules 1–3. |

## Phase 1 design tasks — added 2026-05-26

Source: `docs/research/meetings/2026-05-26-survey-design-templates-push-workflow.md` (Granola `433fe75c`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T40 | Survey status: add "Scheduled" state | Admin | Survey landing | P1 | DESIGN-REVIEW. New status between Draft and Live: push is configured but start date is in the future. Requires TypeScript `SurveyStatus` type update + badge/label. Reconcile with existing `active` / `collecting` statuses. D_PCE13. |
| T41 | Course evaluation — separate landing page from general surveys | Admin | Navigation / landing | P1 | NEW PAGE NEEDED. General surveys and course evaluation must have separate home pages and separate creation flows ("both of them will have separate landing page and separate creation step" — Nipun). DESIGN-REVIEW — structural. D_PCE12. |
| T42 | Faculty results view: gate on "Results Released" status | Faculty | Faculty login | P1 | Surveys visible to faculty only when status = `released`. Review faculty login surface and ensure gate is in place. D_PCE14. |
| T43 | Review and Release CTA on pending_review surveys | Admin | Survey detail | P1 | When status = `pending_review`, show "Review & Release" CTA. Inside: list open-text comments with per-comment hide/unhide toggle. Release button → status → `released`. D_PCE15. |
| T44 | Answer type selector: use dropdown for extensibility | Admin | Template editor | P1 | Replace fixed Likert/Free-text buttons with a dropdown that can accommodate 3rd and 4th answer types (Phase 1 will have them). D_PCE18. DESIGN-REVIEW — check `templates/[id]/page.tsx`. |
| T45 | "Created by" column: hidden by default, user-configurable | Admin | Survey landing | P2 | Column exists in the landing table but hidden by default. Admin can enable via column visibility controls. Supports hierarchical admin team use case. D_PCE16, D_PCE20. |

## Phase 1 — killed / superseded (updated 2026-05-26)

| # | Decision | Reason | Source |
|---|---|---|---|
| ~~§6.11 "Likert scale + free text ONLY"~~ | Phase 1 will have 3rd and 4th answer types. Design must use dropdown for extensibility. | 2026-05-26 |

## Open product questions

- F2 (adjunct faculty) — email-only or rolls into faculty view? Reconfirm with Aarti.
- Grade-lock workflow — was a PCE PRD feature; Aarti didn't reaffirm in 2026-05-08; treat as deferred until reconfirmed
- "Notes" concept — Aarti said "low priority placeholder" for action-plan content (D32)
