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
| T30 | PCE settings page — Likert scale config | Admin | Settings | **Phase 2** — deprioritized Jul 9 (D_PCE_0709_01) | Program director sets default Likert pointer (3/4/5/7/10). Warning: changing setting won't affect live surveys. |

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
| T78 | Student directory in PCE — view-only with PCE columns | Admin | Student directory page | P1 — PARTIAL APPLY | Read-only mode applied 2026-06-22: removed Add Student button, Import CSV button, Edit profile, Mark on leave, Reactivate, Withdraw row actions, and the Add student Dialog. Remaining: PCE-specific columns (cohort, campus, category, status, survey count, adherence metric); entity actions → navigate to Prism in new tab. D_PCE_AV10, D_PCE_AV11, D_PCE_MN02. |
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

## Phase 1 design tasks — added 2026-06-13

Source: `docs/research/meetings/2026-06-13-aarti-pce-exam-management.md` (Granola `ab7e2691`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T85 | Cohere conference booth — user testing with Romit + Himanshu | Design | Cross-product coordination | P1 — ACTION ITEM | 300+ attendees. AB testing, current-product issue collection, feedback. Aarti applying for Himanshu US visa. Post-India (July) planning meeting. Coordinate screens/iPads with Kunal. D_PCE_J13_06. |

## Phase 1 design tasks — added 2026-06-16

Source: `docs/research/meetings/2026-06-16-pce-directory-entry-points-manil.md` (Granola `9a5f3e06`)

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T86 | Multi-select courses in directory → "Push survey" CTA | Admin | Course directory | P1 — DESIGN-REVIEW | When admin selects 2+ courses in the course directory, show a "Push survey" button. Creates a survey scoped to only those courses; flow jumps to step 2 (scope pre-filled). NEW affordance — not in current push survey flow. D_PCE_MN03. |
| T87 | Directory four-view tabs — per-view entry points | Admin | PCE directory | P1 — NEW PAGE NEEDED + DESIGN-REVIEW | Four directory tabs: term view, course view, faculty view, student view. Each tab must have entry points for: (1) create template, (2) create survey, (3) analytics. Route `app/(app)/directory/` does not exist — currently split into separate admin entity pages. Unified "Directory" section with tabs is what Manil/Aarti envision. Architecture decision needed before implementing. Supplements T47, T78, T79. D_PCE_MN01. |

## Phase 1 design tasks — added 2026-06-25

Source: `docs/research/meetings/2026-06-25-course-eval-sync.md` (Granola `c9797a3b`)

> Nipun post-Vadodara sync. PCE requirements frozen. Engineering (Vinay) starts grooming this week. Target: 4 capability designs ready for Aarti's Bangalore visit Wed Jul 2.

### Updates to existing tasks

| # | Update |
|---|---|
| T46 | Dashboard = **3 fixed term cards**: current term, last term, upcoming term. Cards shift as new terms start (oldest drops off). First-time login = single "configure term calendar" CTA only. D_PCE_625_01. |
| T48 | Data audit action label: **"Add data"** (not "Fixed data"). Arjun's directive from Vadodara: "positive or a soft word." Applies everywhere the audit fix action is labeled. D_PCE_625_02. |
| T49 | Push survey step count: **4 steps confirmed** (not 5 as in PRD; not 3 as currently coded). Step purposes: (1) select courses/term, (2) assign/design template, (3) communication, (4) review/push. Names TBD. D_PCE_625_03. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T88 | Template editor: clone faculty sub-role question set | Admin | Template editor | P1 — DESIGN-REVIEW | When a template has multiple faculty sub-role sections (e.g. instructor + course coordinator), admin can clone the full question set from one role to another. Romit confirmed his multi-role design solves this. Design the clone affordance inside the template editor. D_PCE_625_04. Supplements T34, T35. |

## Phase 1 design tasks — added 2026-06-29 / 2026-06-30

Source: `docs/research/meetings/2026-06-29-template-survey-nav-vishal.md` (Granola `253f8e5f`) · `docs/research/meetings/2026-06-30-template-builder-first-monel.md` (Granola `6932e692`) · `docs/research/meetings/2026-06-30-post-course-survey-cadence.md` (Granola `b235be1e`)

> Vishal + Monel engineering-handoff call (Jun 29) + Monel design review (Jun 30 morning) + Monel + David cadence call (Jun 30 morning). Aarti arrives Bangalore Jul 1 — review meeting Jul 2. Engineering front-end starting next week.

### Updates to existing tasks

| # | Update |
|---|---|
| T80 | **P0 URGENT**: Aditi explicitly said she wants to see the left nav structure laid out. Monel: "That's one thing which Aditi explicitly said that she want to see." Must be ready before Jul 2 Aarti review. Vishal (Jun 29): "nail down the left nav structure." D_PCE_629_01, D_PCE_630_06. |
| T46 | "Dashboard" label is wrong for the course eval landing. Vishal (Jun 29): "we are calling dashboard. But is this dashboard or is it something else? It should not be showing analytics here." The landing is the term-cards / survey-list operational view, not an analytics dashboard. Rename. D_PCE_629_02. |
| T35 | Faculty role taxonomy enriched (see T96). Roles come from Prism settings only — no custom labels allowed. Monel (Jun 30): "Will not give user the ability to add custom rules. It will be predefined from the drop down list." D_PCE_630_03. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T89 | Builder-first template creation flow | Admin | Template creation (CreateTemplateSheet) | P1 — DESIGN-REVIEW | Show the builder interface FIRST when creating a template — not a details form. Details (name, description, course type) should surface as a popup at publish time or as a separate final step. Affects `components/pce/pce-modals.tsx` `CreateTemplateSheet`. Monel: "we should start by giving them the builder flow... it should be builder that should show first." Structural rearchitecture — needs Romit design direction before touching code. D_PCE_630_01. |
| T90 | Kill "add group" / group naming concept in template builder | Admin | Template editor | P1 — DESIGN-REVIEW | Remove the "add group" concept from Romit's Figma/Lovable designs. Three fixed top-level aspects (Content/Course, Faculty, General) ARE the groupings. No custom group names. Within Faculty, use multi-select roles (D_PCE_NC04, T62) — not group labels. Monel: "we should not have a grouping concept because that will add to engineering effort." D_PCE_630_02. |
| T91 | PCE left nav — expanded by default + layout for Aarti | Admin | app-sidebar.tsx / nav | **P0 URGENT — before Jul 2** | Course evaluation nav section must be expanded by default (not collapsed). Vishal + Monel confirm nav structure: course evaluation (expanded) → Templates, Setup. "Analytics" not in the primary course eval nav. Sub-items order: Templates first, Setup at bottom. Monel: "Are we keeping course evaluation expandable? I think it's an overkill. No. No. It's collapsed. Expanded by default." Aditi explicitly asked for this layout before her Jul 2 visit. D_PCE_629_01, D_PCE_630_05, D_PCE_630_06. NEW PAGE NEEDED for nav restructuring. |
| T92 | Remove duplicate "answer type labels" from settings UI | Admin | Settings | P1 | Romit's settings design had an "answer type labels" config section. Monel confirmed it is a duplicate of the Likert scale template picker already in settings. Remove the redundant "answer type labels" UI. Keep only the predefined Likert scale templates (satisfaction / agreement / frequency / quality / difficulty / true-false). D_PCE_630_04. |
| T93 | Faculty roles: predefined Prism dropdown only in template builder | Admin | Template editor | P1 | Admin cannot type custom faculty role labels in the template. Roles populate from Prism. Settings page = admin defines a subset of Prism's universal role list. That subset shows in create-template. If no settings configured, show full universal list. Reinforces T35. Monel: "Will not give user the ability to add custom rules. It will be predefined from the drop down list." D_PCE_630_03. |
| T94 | Student roster refresh before survey push | Engineering | Survey push flow | P1 — DESIGN-REVIEW | System must refresh student roster (from SIS/LMS) immediately before sending the survey, not at the time of scheduling. Students who dropped must be excluded; late-adds must be included. Surface this in the push-survey review/confirm step so admin understands when the list was last refreshed. David: "Yes. 100%." D_PCE_630_12. |
| T95 | Course-level start/end date override in push survey scheduling | Admin | Push survey flow (step 1 / scope) | P1 — DESIGN-REVIEW | Individual course start/end date can override the term-level default dates. Term-level = default for bulk pushes; course-level = override. Design the override affordance in step 1 (select courses/term). Supplements T69, D_PCE_NC15. D_PCE_630_13. |
| T96 | Faculty role taxonomy for template role picker (research reference) | Admin | Template editor role picker | P1 | Reference taxonomy for designing T35 / T93 role selector. Didactic: Course Coordinator, Course Director (top), Instructor/Lecturer/Teacher (mid). Lab: Lab TA / Lab Assistant (separate). Clinical: Director of Clinical Education (DCE), Placement Faculty. Preceptors NOT evaluated via PCE (they go through LAM). Use this taxonomy when building the Prism-role subset picker in settings + the role selector in template builder. D_PCE_630_14. |

## ⚠️ Escalated conflicts — updated 2026-06-17

Source: `apps/exam-management/docs/research/meetings/2026-06-17-himanshu-design-system-nav-alignment.md` (Granola `1f55db0d`)

| # | Conflict | Status | Parties | Notes |
|---|---|---|---|---|
| T57-CONFLICT | Ask Leo placement: Aarti (Jun 3, D_PCE42) said NOT in left nav. Himanshu (Jun 17) confirmed Ask Leo IS in left sidebar due to 400–500 person Zoom layout issues. | UNRESOLVED — do NOT touch sidebar | Himanshu to coordinate with Arun + Yash + Aarti | Do not apply any Ask Leo or sidebar positioning changes until alignment meeting happens. T99 in exam-management backlog tracks the same conflict. |

## Phase 1 — confirmed deferred (updated 2026-06-13)

| # | Decision | Reason | Source |
|---|---|---|---|
| D_PCE_J13_02 | Multiple admin permission tiers | Phase 1 = super admin only. "We don't want to worry about like, oh, you can do this but not this." Tiers evolve as module matures. | 2026-06-13 |

## Phase 1 design tasks — added 2026-07-02 (course eval sync up)

Source: `docs/research/meetings/2026-07-02-course-eval-sync-up.md` (Granola `fdf4dbb5`)

> Monil status call (Jul 2 9:30 AM). Create template confirmed done. Create survey (course eval only) freeze deadline Jul 3. Engineering grooming Monday Jul 6.

### Updates to existing tasks (Jul 2 — course eval sync)

| # | Update |
|---|---|
| T28 | **DONE.** Monil confirmed: "Create template is done. And preached." Engineering will be groomed on this Jul 6. D_PCE_0702_05. |
| T29 | **FREEZE DEADLINE: Jul 3.** Create survey for course evaluation only (NOT programmatic survey — D_PCE_0702_04). Monil grooming engineering on both T28 + T29 Monday Jul 6. |

---

## Phase 1 design tasks — added 2026-07-02 (Monil upload/handoff call)

Source: `docs/research/meetings/2026-07-02-template-upload-aspects-monil.md` (Granola `3c5d6795`)

> Monil check-in call (Jul 2 morning). Template handoff readiness + new aspect-level upload directive.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T97 | ⚠️ Resolve T61 vs. Monil conflict — per-aspect upload capability | Admin | Template creation | P0 — BLOCKER | T61 (Jun 9, Vishaka): top-level import only, remove per-section PDF upload. Monil (Jul 2): per-aspect upload IS wanted because single-doc AI parsing fails to reliably separate content by aspect (course material / faculty / general). Cannot finalize upload UX for template creation until Aarti/Vishaka/Monil align. Add to next Aarti review. D_PCE_0702_01. |

## Phase 1 design tasks — added 2026-07-09 (Monil course eval sync)

Source: `docs/research/meetings/2026-07-09-course-eval-sync-monil.md` (Granola `497b1010`)

> Monil sync Jul 9. Topics: layout width fix (rows 3–10 screens), settings deprioritized to Phase 2, single-survey analytics first (row 16), engineering QA deadline Aug 15, handoff gated on Yash review Jul 10.

### Updates to existing tasks (Jul 9)

| # | Update |
|---|---|
| T30 | **Deprioritized to Phase 2.** Monil: "most of the settings would go in phase two. So we can deprioritize that at least for the, from the design standpoint." D_PCE_0709_01. |
| T81 | **Phase 2.** Part of settings — deferred. D_PCE_0709_01. |
| T82 | **Phase 2.** Part of settings — deferred. D_PCE_0709_01. |
| T83 | **Phase 2.** Part of settings — deferred. D_PCE_0709_01. |
| T92 | **Phase 2.** Answer type labels = settings concern — deferred. D_PCE_0709_01. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T98 | Layout fix — survey screens must use full screen width | Admin | `surveys/[id]/page.tsx`, `surveys/[id]/responses/page.tsx`, `surveys/push/page.tsx` | P0 — ✅ APPLIED | Monil Jul 9: "we are only using 70 of the screens." Removed `max-w-2xl` from `surveys/[id]/page.tsx:75` and `surveys/[id]/responses/page.tsx:83`. Removed `maxWidth: 640` from `surveys/push/page.tsx:125`. Push survey Step 2 table specifically: Romit confirmed "we should stretch the table." Prerequisite for Yash review + engineering handoff. D_PCE_0709_04. |
| T99 | Settings deprioritized — demote all settings tasks to Phase 2 | Admin | Settings | Phase 2 — logged | Monil Jul 9: "most of the settings would go in phase two." T30, T81, T82, T83, T92 all moved to Phase 2. No active design work on settings in Phase 1. D_PCE_0709_01. |
| T100 | Single-survey analytics (row 16) — design and review | Admin | Survey analytics | P1 — IN PROGRESS | Monil Jul 9: focus on single-survey analytics only; multi-survey longitudinal is deferred. Row 16 UI partially built; Romit to share updated link for Monil review. Longitudinal analytics = Phase 2 or later. D_PCE_0709_02. |

## Phase 1 design tasks — added 2026-07-13 (Monil dashboard + analytics design review)

Source: `docs/research/meetings/2026-07-13-dashboard-analytics-design-monil.md` (Granola `8330d724`)

> Monil design review Jul 13. Topics: dashboard term-card CTAs and verbiage, single-survey analytics deadline (end Jul 18 week), multi-survey analytics structure orientation (By Faculty / By Course / By Term), analytics tab placement (top not sidebar).

### Updates to existing tasks (Jul 13)

| # | Update |
|---|---|
| T46 | Dashboard term cards: (a) remove "Send Evaluation" CTA from current + last term cards; (b) replace "View Term" with "Setup Evaluations" in upcoming card; (c) faculty column = count or avatars + tooltip (not full names); (d) student count column = skip. D_PCE_0713_02, D_PCE_0713_03, D_PCE_0713_07, D_PCE_0713_10. |
| T49 | Push survey wizard: start from Course Readiness (not Term Details). Term label pre-populated from card context. D_PCE_0713_04. |
| T72 | Analytics tabs must be horizontal at TOP of screen (not sidebar). Tab labels: Overview / By Faculty / By Course / By Term. D_PCE_0713_06. |
| T100 | **DEADLINE: end of Jul 18 week.** Monil will review single-survey analytics and provide feedback by end of day Jul 14. Feedback round → finalize → hand to engineering. D_PCE_0713_08. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T101 | Dashboard course table: faculty column → count or 2 avatars + tooltip | Admin | Dashboard term-card drill view | P1 — pending T46 dashboard build | Show "1", "2", … count or two avatar circles; hover = tooltip with full names. D_PCE_0713_07. |
| T102 | Dashboard upcoming card: replace "View Term" CTA with "Setup Evaluations" | Admin | Dashboard upcoming card | P1 — pending T46 dashboard build | No data to view in upcoming term — CTA initiates setup flow, pre-seeded with term context. D_PCE_0713_03. |
| T103 | Remove "Send Evaluation" CTA from current + last term dashboard cards | Admin | Dashboard current/last term cards | P1 — pending T46 dashboard build | Wrong action for those cards. Only CTA is "View Term" (drill into course list). D_PCE_0713_02. |
| T104 | Setup survey wizard: open on Course Readiness step (not Term Details) | Admin | Push survey wizard | P1 — DESIGN-REVIEW | Term label pre-populated from card context; wizard opens at course/cohort selection. Revise step structure per D_PCE_0713_04. |
| T105 | Multi-survey analytics: By Faculty page | Admin | Analytics | P1 — BLOCKED (Monil PRD in progress) | Leaderboard of faculty sorted by score → click → faculty detail (performance by term, courses taught, avg numbers, theme gaps → single-survey results). D_PCE_0713_05. |
| T106 | Multi-survey analytics: By Term page | Admin | Analytics | P1 — BLOCKED (Monil PRD in progress) | Top-level KPIs + trend graph + deep-dive course table. Investigate which courses pulled term average down. D_PCE_0713_05. |
| T107 | Multi-survey analytics: tabs at top of screen | Admin | Analytics navigation | P1 — BLOCKED (Monil PRD in progress) | Horizontal tabs (Overview / By Faculty / By Course / By Term) in analytics header. D_PCE_0713_06. |
| T108 | Analytics layout: remove max-w-4xl from analytics content container | Admin | `analytics/page.tsx` | P0 — ✅ APPLIED Jul 13 | Removed `max-w-4xl` from content div at line 478. Analytics page now uses full screen width (missed from T98 Jul 9 fix). D_PCE_0709_04. |

## Phase 1 design tasks — added 2026-07-14 (Course eval setup feedback — Monil)

Source: `docs/research/meetings/2026-07-14-course-eval-setup-feedback-monil.md` (Granola `f1f8d1e4`)

> Monil design review Jul 14 (morning, pre-bi-weekly call). Cohort + "What to evaluate" radio buttons fail at Prism scale. Action needed column CTA consolidation. Step 1 reframed as data-audit, not evaluee selection.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T109 | Action needed column: consolidate to max 2 CTAs ("Add Faculty" + "Add Student") | Admin | Dashboard setup evaluation / action needed column | P1 — DESIGN-REVIEW | D_PCE_0714A_01. No code equivalent (dashboard is prototype-only). Apply in Lovable prototype. Individual per-role CTAs (add lab instructor / add instructor / add course coordinator as separate buttons) → replace with one "Add Faculty" + one "Add Student" CTA. |
| T110 | Cohort + "What to evaluate" fields: replace radio buttons with scalable selector | Admin | Setup evaluation flow (Course Readiness step) | P1 — DESIGN-REVIEW | D_PCE_0714A_02, D_PCE_0714A_03, D_PCE_0714A_04. Cohort = Prism lookup, can have 20+ options. "What to evaluate" = Prism faculty roles, 45–50 options. Radio buttons overflow horizontally at this scale. Redesign as dropdown or scrollable multi-select. Cohort = empty state by default (not pre-selected). |
| T111 | Step 1 copy change: frame as "data audit" not "evaluee selection" | Admin | Setup evaluation flow step 1 | P1 — DESIGN-REVIEW + async feedback | D_PCE_0714A_05. Goal of Step 1 = help admin identify and fill missing course data, not to pick who gets evaluated. Try copy/label change first (section header + description). Share screen in feedback doc; Monil to tag Vishaka + David for async input. |

## Phase 1 design tasks — added 2026-07-14 (BiWeekly cadence — Vishaka + David + Monil)

Source: `docs/research/meetings/2026-07-14-post-course-survey-cadence-vishaka-david.md` (Granola `90332d37`)

> Bi-weekly cadence call. Homepage landing concept introduced. All 4 term-card scenarios required. Clinical term PA edge case flagged. "Settings" → "Setup" terminology confirmed (code already correct).

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T112 | Confirm "Setup" label in all prototype screens (not "Settings") | Admin | All PCE prototype nav screens | P1 — DESIGN-REVIEW | D_PCE_0714B_01. Code already uses "Setup" in ADMIN_NAV (app-sidebar.tsx:150) — confirmation only. Review Lovable prototype for remaining "Settings" labels in PCE module nav and rename. |
| T113 | Homepage landing page: overview of both programmatic survey + course eval modules | Admin | PCE tile landing | P1 — NEW PAGE NEEDED | D_PCE_0714B_02. Cannot default to either module alone. Show aggregate stats from both (active surveys, active evaluations). Entry points to each module. Supplements T46. Needs Romit design direction before any code. |
| T114 | Dashboard: design all 4 term-card scenarios | Admin | Dashboard prototype | P1 — DESIGN-REVIEW | D_PCE_0714B_03. Scenario 1: empty state (nothing configured). Scenario 2: current term only (no last, no upcoming). Scenario 3: current + last (no upcoming). Scenario 4: all three terms present. Currently only scenario 4 exists in prototype. |
| T115 | Clinical term edge case: investigate PA program data + propose dashboard handling | Admin | Dashboard term cards | P1 — RESEARCH FLAG | D_PCE_0714B_04. PA programs define a year-long "clinical term" spanning the full academic year — it always appears as the current term. Vishaka to ask Carol (PA admin) how they collect course evals for clinical courses. Monil to run data query: how many PA programs have a clinical term defined. No design change until investigation complete. |

## Phase 1 design tasks — added 2026-07-15 (DS analytics chart strategy + scope sync — Monil)

Source: `docs/research/meetings/2026-07-15-ds-analytics-chart-strategy-monil.md` (Granola `1e018244`)

> Monil + Romit sync Jul 15. DS chart catalog rule hardened. Analytics surface-first pattern (summary → expand). Export capability confirmed. Assessment scope handed to product team; Romit = course evaluation only. Portal landing page ownership + DS update. Cohere booth planning.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T116 | Course evaluation analytics — surface-first chart pattern: compact summary tile visible by default; double-click/expand reveals full chart + grid data | Admin | PCE analytics (all chart surfaces) | P1 — DESIGN-REVIEW | D_PCE_0715_01, D_PCE_0715_02. DS catalog is first chart source; observable plot for advanced viz (Sankey, heatmap, four-quadrant, range/median comparisons) when DS chart doesn't cover the scenario. Do not show full 30+ item charts without a summary/expand affordance. Romit: "primary information should be at the surface level." No code equivalent yet. |
| T117 | Course evaluation analytics — export capability: PNG/PDF chart export + raw data export per chart | Admin | PCE analytics | P1 — DESIGN-REVIEW | D_PCE_0715_03, D_PCE_0715_04. Required for all analytics chart surfaces. Users combine Exxat analytics data with external tools (influx, Excel). Production chart library = high charts (Monil to get key from Wina). Observable plot is for prototype exploration only. |
| T118 | Portal landing page — DS update + replace labels with new marketing product names from Kunal infographic | Admin | Portal entry point (`apps/portal/`) | P1 — DESIGN-REVIEW | D_PORTAL_0715_01, D_PORTAL_0715_02. Remove unnecessary components added to existing build. Replace current product labels with marketing names from Kunal's email infographic. Align with Aarti + Kunal before involving marketing team on colors/branding. Marketing team owns content + colors within experience framework Romit defines. |
| T119 | Cohere conference booth plan (September) — prepare initial strategy for Monday's call | — | Planning | P1 | D_MISC_0715_01. Options: usability testing, feedback collection, product demo showcase. Romit to share draft plan before next Monday placeholder call with Monil. |

## Phase 1 design tasks — added 2026-07-16 (Course eval sync — Vishal)

Source: `docs/research/meetings/2026-07-16-course-eval-sync-vishal.md` (Granola `b1b6d7fb`)

> Vishal + Romit status sync Jul 16. Priority confirmed: rows 19–21 (T19, T20, T21) are active focus. Requirements for rows 23–32 incoming Jul 17 EOD. DS compliance mandate reinforced — Himanshu + Vinay building shared components across exam-management and PCE. Engineering continues independently; UI alignment applied retroactively before Cohere.

### Updates to existing tasks (Jul 16)

| # | Update |
|---|---|
| T19 | **ACTIVE PRIORITY** (confirmed Jul 16). Vishal: "focus on row 19, 20 and 21. Because we are going in that order." Course detail is the current design focus alongside T20 + T21. D_PCE_0716_01. |
| T20 | **ACTIVE PRIORITY** (confirmed Jul 16). Faculty self-view is the current design focus alongside T19 + T21. D_PCE_0716_01. |
| T21 | **ACTIVE PRIORITY** (confirmed Jul 16). Course distribution viz is the current design focus alongside T19 + T20. D_PCE_0716_01. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T120 | Rows 23–32 design scope — await + start design once Vishal shares requirements | Admin | PCE (PRD rows 23–32) | P1 — BLOCKED pending requirements from Vishal (due Jul 17 EOD) | D_PCE_0716_02. Vishal: "by tomorrow end of the day I will also have enough requirement captured in the document for you to start this section 23 to 32." Do not start until requirements land. |
| T121 | Review Aarti + Vishaka course evaluation meeting recording (Vishal to share) | Design | Research | P1 — ACTION ITEM | D_PCE_0716_06. Recording covers analytics workflows, which metrics to keep or drop, and broader course eval decisions. Review when received — informs T100, T116, T117. Vishal: "That will give you overall understanding of the solution." |

## Phase 1 design tasks — added 2026-07-19 (Modular product strategy — Arun)

Source: `docs/research/meetings/2026-07-19-modular-product-strategy.md` (Granola `1bc03a5a`)

> Leadership strategy call. Portal cross-sell/upsell visual design. Owned products = de-emphasized; not-owned = prominent for upsell. Pictorial ecosystem diagram explored. Above-the-fold constraint. AI = point-and-click + agentic (both paths, not either/or). Team AI strategy conversation: week of Aug 3.

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T122 | Portal: upsell visual treatment — de-emphasize subscribed products, highlight not-subscribed | Admin | Portal entry point (`apps/portal/`) | P1 — DESIGN-REVIEW | D_PORTAL_0719_01. "The ones that you already have can be grayed out and the ones that you don't have can be given a little bit more important or whatever." `subscriptionStatus: 'active' \| 'trial'` = visually de-emphasized; `subscriptionStatus: 'not-subscribed'` = prominent for upsell. Above-the-fold constraint: all products visible without scrolling (D_PORTAL_0719_03). Supplements T118. |
| T123 | Portal: pictorial product ecosystem diagram — show product relationships with owned vs. not-owned visual state | Admin | Portal entry point (`apps/portal/`) | P1 — DESIGN-REVIEW | D_PORTAL_0719_02, D_PORTAL_0719_03. "If there's a way to incorporate that diagram and give them a way to explode that." Owned products grayed; not-owned highlighted. Based on Kunal's infographic (T118). Explore as an alternative to or companion to the current product list. Romit design exploration required before any code. |

## Phase 1 design tasks — added 2026-07-20 (1:1 Arun + Romit / Survey design — Monil)

Source: `docs/research/meetings/2026-07-20-1-1-arun-romit.md` (Granola `2870dd23`) · `docs/research/meetings/2026-07-20-survey-design-course-template-flow.md` (Granola `7cc5879f`)

> 1:1 status sync with Arun (Jul 20 10:00 AM): course eval 80–85% done, wrap-up target = Cohere Sep 2026, exam management cannot demo, AI features = PM decision, DS AI Figma work paused. Design review with Monil (Jul 20 9:05 AM): setup evaluations step order reversed (template first → data audit second), combined-step design is P0 urgent, "Create Template" CTA added to dashboard cards for first-time entities, missing data = soft warning only.

### Updates to existing tasks (Jul 20)

| # | Update |
|---|---|
| T111 | **SUPERSEDED by T124.** Step-1-as-data-audit direction (Jul 14) is reversed. New order: course-to-template assignment first, data validation second. T124 is the active design task. D_PCE_0720B_01. |

### New tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T124 | Setup evaluations flow redesign: combined course-selection + template-assignment + data-audit in single table — URGENT | Admin | Setup evaluations wizard (dashboard → term card → "Setup Evaluations") | **P0 URGENT** | D_PCE_0720B_01, D_PCE_0720B_02. Primary: one unified table (course row + template picker column + data-gap flags). Fallback if too cluttered: two steps in new order (template first, audit second). Must complete before dev picks up this flow. Supersedes T111. Needs Romit design direction — no code changes until designed. |
| T125 | Dashboard cards: add "Create Template" CTA for entities with zero templates and no prior survey push | Admin | Dashboard term cards | P1 — DESIGN-REVIEW | D_PCE_0720B_03. Entities that get CTA: Riverside, DPT Lakeside, Summit, Cascade (zero templates + no prior push). Entities that do NOT: Harbor, Spring 2026, Fall 2026 (prior-term push exists → template exists). Stack above existing card CTAs. Supplements T114. |
| T126 | Soft warning treatment for missing faculty/student rows in setup evaluations data-audit column | Admin | Setup evaluations wizard | P1 — DESIGN-REVIEW | D_PCE_0720B_04. Rows missing faculty or student data show inline soft warning (badge, flag, or caution indicator). Proceeding is allowed. Zero-students hard block = backend only, no UI change needed. Use DS-compliant warning pattern (LocalBanner or inline badge — never toast). |

---

## Open product questions

- F2 (adjunct faculty) — email-only or rolls into faculty view? Reconfirm with Aarti.
- Grade-lock workflow — was a PCE PRD feature; Aarti didn't reaffirm in 2026-05-08; treat as deferred until reconfirmed
- "Notes" concept — Aarti said "low priority placeholder" for action-plan content (D32)
