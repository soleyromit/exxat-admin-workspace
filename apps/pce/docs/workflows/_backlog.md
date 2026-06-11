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

## Phase 1 design tasks — added 2026-05-28

Source: `docs/research/meetings/2026-05-28-pce-dashboard-navigation-distribution-flow.md` (Granola `666c9e88`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T46 | Admin landing: term-driven KPI dashboard | Admin | Course eval landing | P1 | NEW PAGE NEEDED. Term + academic year picker → KPI widget (% of courses with evaluation) + master survey list. "All" filter for cross-term view. D_PCE24. |
| T47 | Analytics: semester / faculty / course entry points | Admin | Analytics | P1 | Three analytics entry points. Faculty entry groups faculty-eval AND course-eval for courses they taught. Question analytics = Phase 2. DESIGN-REVIEW — major. D_PCE25, D_PCE26. |
| T48 | Step-zero: Leo audit screen | Admin | Course eval pre-launch | P1 | NEW PAGE NEEDED. Pre-term audit with "Use Leo" (not "Run with AI"). No program dropdown. Pre-populates courses missing faculty. Admin can exclude placeholder courses. D_PCE27. |
| T49 | 5-step push survey flow | Admin | Survey distribution | P1 | DESIGN-REVIEW — structural rearchitecture. Replaces current 3-step flow: Properties → Scope → Design/Templates (default tag auto-assign) → Communication (standard + custom email only) → Review. D_PCE28–D_PCE30. |

## Phase 1 design tasks — added 2026-05-28 (Monil survey/moderation call)

Source: `docs/research/meetings/2026-05-28-survey-template-moderation-monil.md` (Granola `81beffd7`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T50 | Remove moderation from left nav; integrate into survey list | Admin | Sidebar + surveys | P1 — ✅ APPLIED | Removed 'Review & Moderation' from ADMIN_NAV in `app-sidebar.tsx`. D_PCE34. |
| T51 | Survey list: remove horizontal grouping; add status filter + pending-review banner | Admin | Surveys landing | P1 — ✅ APPLIED | Removed `defaultGroupBy="status"`, added status filter Select + attention banner for pending_review surveys. D_PCE35. |
| T52 | Survey table: Action column with role-appropriate CTAs | Admin | Surveys landing | P1 — DESIGN-REVIEW | New column: preview / pending result / review & release CTAs per survey status. Replaces kebab-only row actions. D_PCE36. |
| T53 | Report access step in create survey flow | Admin | Push survey (step N) | P1 — DESIGN-REVIEW | Cross-table: left = roles evaluated (Instructor, Course Coordinator), right = who can see responses (Instructor, Coordinator, Program Admin, Program Director, Department Chair). D_PCE37, D_PCE38. |
| T54 | PCE nav: add Programmatic Survey as top-level nav entry | Admin | Sidebar | P1 — DESIGN-REVIEW | Two top-level entries: Post Course Evaluation + Programmatic Survey. Both share sub-nav: surveys, templates. Analytics = skip for now. Setup = PCE only. D_PCE33. Structural — needs Romit design direction. |

## Phase 1 design tasks — added 2026-06-01

Source: `apps/pce/admin/app/(app)/surveys/page.tsx` (applied from Granola `666c9e88`) · `apps/exam-management/docs/research/meetings/2026-05-27-design-system-adoption-himanshu.md` (Granola `ae66b50f`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T55 | Released status label: admin vs. faculty language | Admin | Survey landing | P1 — ✅ APPLIED | Changed `released` status label from "Closed, Results Available" → "Results Released to Faculty" in `surveys/page.tsx:29`. Faculty language ("Results Available") should not appear in admin view. D_PCE (Meeting 4 directive). |
| T56 | Define product brand color for PCE | Design | DS / theming | P2 | Leadership decision: each product has its own color (Prism=pink, ExactOne=indigo). PCE color is TBD. Pick token, apply to product theme. D_DS01. |

## Phase 1 design tasks — added 2026-06-03

Source: `apps/pce/docs/research/meetings/2026-06-03-weekly-product-sync.md` (Granola `7a53688f`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T57 | Search and Ask Leo placement — confirm in Prism top panel, not left nav | Admin | All PCE screens | P1 — DESIGN-REVIEW | Aarti: "search for example, should not be moved into the left hand [side]... And then same thing with Ask Leo... we cannot make them into left hand side menus." Structural nav change requires Prism alignment discussion with Himanshu + Yash first. D_PCE42. |
| T58 | Term missing start/end dates → show reminder/link | Admin | PCE landing / term setup entry | P1 — DESIGN-REVIEW | Aarti: "some message if they haven't entered the start date and end date... a reminder to go add start date and date. So a link to come here or something." New UI pattern — banner or contextual callout linking to academic calendar setup. D_PCE41. |
| T59 | Survey push panel: font size / readability on small screens | Admin | `surveys/push/page.tsx` Step 2 | P2 — DESIGN-REVIEW | Aarti: "the font is and the gray is very small. On a small screen." Review text sizing and contrast in the course offerings list panel. D_PCE44. |

---

## Phase 1 — killed / superseded (updated 2026-05-26)

| # | Decision | Reason | Source |
|---|---|---|---|
| ~~§6.11 "Likert scale + free text ONLY"~~ | Phase 1 will have 3rd and 4th answer types. Design must use dropdown for extensibility. | 2026-05-26 |

## Phase 1 design tasks — added 2026-06-09

Source: `docs/research/meetings/2026-06-09-post-course-survey-cadence.md` (Granola `3fd2ac92`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T60 | Template creation — 3 mutually exclusive top-level paths | Admin | Template creation | P1 — DESIGN-REVIEW | Paths: (1) Build new (manual), (2) Copy existing (duplicate + rename), (3) Import from PDF or Word (system auto-generates draft). Structural change to CreateTemplateSheet. D_PCE_NC01. |
| T61 | PDF/Word import at top-level template screen | Admin | Template creation | P1 — DESIGN-REVIEW | Top-level path only. Remove per-section PDF upload. One doc → system extracts all sections + questions. Aarti previously requested this; keep her preference. D_PCE_NC02, D_PCE_NC08. |
| T62 | Multi-select roles for section creation (Build new path) | Admin | Template editor | P1 — DESIGN-REVIEW | Admin picks all roles at once (multi-select); system creates one section per role. Replaces current one-at-a-time section add. D_PCE_NC04. |
| T63 | KILL section-level "add from template" option | Admin | Template editor | P1 | Do not build. Remove from any in-progress designs. "Too complicated." Vishaka 2026-06-09. D_PCE_NC07. |
| T64 | KILL visibility/privacy toggle in survey distribution | Admin | Survey push / settings | P1 | Do not build. Post-course evaluations use review-and-release workflow, not open-sharing toggle. D_PCE_NC09. |
| T65 | KILL anonymous responses toggle | Admin | Survey push / settings | P1 | Default = anonymous always. Convey via message only. Do not build toggle. D_PCE_NC10. |
| T66 | Post-course distribution: Prism-only channel | Admin | Survey push — distribution step | P1 — DESIGN-REVIEW | PCE: remove additional-email and anonymous-link options. General surveys: keep all 3 channels. D_PCE_NC11, D_PCE_NC12. |
| T67 | Reminders: multiselect + from-closing-date messaging | Admin | Survey push — reminders step | P1 | Reminders counted from closing date. Messaging must be explicit. D_PCE_NC13. |
| T68 | Results release date: required field (no comment moderation) | Admin | Survey push | P1 — DESIGN-REVIEW | Required if comment moderation not in Phase 1. Add messaging: if no date set, admin must manually release results. D_PCE_NC14. |
| T69 | Term-level date cascade for bulk surveys | Admin | Survey push / dashboard | P1 — DESIGN-REVIEW | Surveys grouped by term. Term-level date change cascades to all instances. Individual course-level override still possible. NEW CONCEPT. D_PCE_NC15. |
| T70 | CONFIRMED KILL — report access screen not in Phase 1 | Admin | Survey push flow | P1 | Supersedes T53 DESIGN-REVIEW → now confirmed KILL. Role-based access handles result visibility. Edge cases = manual download + email. D_PCE_NC16. |
| T71 | File upload wording: "PDF or Word document" everywhere | Admin | Template creation + survey push | P1 | Replace all instances of "PDF" with "PDF or Word document" in upload labels and helper text. D_PCE_NC06. |

## Phase 1 design tasks — added 2026-06-10

Source: `docs/research/meetings/2026-06-10-pce-architecture-vishaka-arun.md` (Granola `4d1fa807`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T72 | Analytics tab: rename "Longitudinal Insights" → "Course Offering" and "Faculty" | Admin | PCE nav / analytics | P1 | Do NOT call the analytics tabs "longitudinal insights". Two named entries: "Course Offering" + "Faculty". D_PCE_AV01. |
| T73 | Faculty analytics page — leaderboard + grid + detail | Admin | Analytics | P1 — NEW PAGE NEEDED | Top performers section + needs-attention section + searchable grid (total courses, avg score, highest, lowest). Click → faculty detail: spider graph + trend chart + per-course history. D_PCE_AV04, D_PCE_AV05. |
| T74 | Course offering analytics page — term-grouped with stats | Admin | Analytics | P1 — NEW PAGE NEEDED | Term-grouped offering list; row stats: avg rating, response rate, enrolled, completed; trend (5+ terms). D_PCE_AV03, D_PCE_AV16. |
| T75 | Student detail view — merge course + survey status | Admin | Student directory detail | P1 — DESIGN-REVIEW | Current courses on top, past below, no future. Survey status (filled/not, released/not) integrated as column on course rows. No separate "surveys" tab. D_PCE_AV06, D_PCE_AV07. |
| T76 | Academic calendar settings screen | Admin | Settings | P1 — NEW PAGE NEEDED | Academic year (label + start date + end date) + terms per year (start date + end date). Prerequisite for dashboard term-grouping. D_PCE_AV08, D_PCE_AV09. |
| T77 | Dashboard: only show terms with configured calendar dates | Admin | PCE landing / dashboard | P1 — DESIGN-REVIEW | Unconfigured/blank terms excluded. Show reminder/link for any unconfigured terms (pairs with T58). D_PCE_AV09. |
| T78 | Student directory in PCE — view-only with PCE columns | Admin | Student directory page | P1 — DESIGN-REVIEW | Phase-1 columns: cohort, campus, category, status, survey count, adherence metric. Entity actions → navigate to Prism in new tab. D_PCE_AV10, D_PCE_AV11. |
| T79 | Faculty directory in PCE — view-only with PCE columns | Admin | Faculty directory page | P1 — DESIGN-REVIEW | Columns: name, designation, courses taught, avg rating. Entry to faculty detail/analytics. Entity actions → navigate to Prism in new tab. D_PCE_AV10, D_PCE_AV12. |

## Phase 1 design tasks — added 2026-06-10 (Aarti 1:1)

Source: `docs/research/meetings/2026-06-10-course-faculty-eval-setup-aarti.md` (Granola `410d7c0e`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T80 | Finalize menu structure (entry points, nav labels) with Mondal — before Baroda visit June 22 | Admin | PCE nav | P0 — URGENT | Coordination task. Nail down: how many menu items, how many entry points, overall layout (where Leo, where search, where entry points sit). D_PCE_AAD06. |
| T81 | Setup section — email templates (initial + reminder) | Admin | Settings / Setup | P1 — NEW PAGE NEEDED | Two persistent email templates in Setup: (1) initial email sent when evaluation published; (2) reminder email. Reused term after term. Admin can override per-term. D_PCE_AAD01. |
| T82 | Setup section — reminder schedule default | Admin | Settings / Setup | P1 — NEW PAGE NEEDED | Reminder schedule as a Setup item. Default = 15 days before term end date. Admin configures days-relative-to-close-date. Per-survey override allowed. D_PCE_AAD02. |
| T83 | Setup section — course type → template default mapping | Admin | Settings / Setup | P1 — NEW PAGE NEEDED | Design mapping screen: each course type → default survey template. Auto-fills template during term setup. Admin can override per course. D_PCE_AAD03. |
| T84 | Terminal evaluation card — consistent design across all 3 entry points | Admin | Analytics drilldown | P1 — DESIGN-REVIEW | The final course-offering instance view (analysis, response breakdown, per-question data) is the SAME whether entered via term, faculty, or course analytics path. Entry point only changes pre-drill aggregation. D_PCE_AAD08. |

## Phase 1 — confirmed deferred (updated 2026-06-10)

| # | Decision | Reason | Source |
|---|---|---|---|
| D_PCE_AAD05 | General survey module UI enhancements | Aarti: "I don't have the bandwidth to discuss updates to the general survey module." Phase 1 = course evaluations only. General survey entry point changes (nav) may still be needed, but no new general survey features in Phase 1. | 2026-06-10 Aarti 1:1 |

---

## Open product questions

- F2 (adjunct faculty) — email-only or rolls into faculty view? Reconfirm with Aarti.
- Grade-lock workflow — was a PCE PRD feature; Aarti didn't reaffirm in 2026-05-08; treat as deferred until reconfirmed
- "Notes" concept — Aarti said "low priority placeholder" for action-plan content (D32)
