# V2-IA: shell, navigation and information architecture for the connected prototype (DRAFT)

**Status:** DRAFT, contract and IA spec only, no app code. Renaming this file to `V2-IA-shell-and-nav.md` (dropping `_draft-`) is Romit's confirmation and unlocks the code gate.
**Written:** 2026-10-25 · **Branch:** `feat/skills-checklist-v2` · **Scope:** `admin/app/(v2)`, `admin/components/v2`, `admin/lib/v2`, `docs/v2/verify`
**Tags:** `[REQ xx-nn]` only IDs in `docs/source/requirements.extracted.txt` · `[OD-n]` open, never decided here · `[D-n]` a v2 decision in `docs/v2/decisions-and-open-questions.md` · `[PROPOSED]` beyond the requirements · `[INFER]` my reading · `[PROTO]` Sankalp's prototype · `[DS]` installed `@exxatdesignux/ui` 1.6.5 types.

**Self-brief (recurring failures that apply):** "Never render internal notes in UI copy" (this whole contract is that rule applied to the prototype), "Action surfaces show work, not counts" (admin Home), "A claim cannot reach further than its check" (every acceptance test below names its check), "Audit existing surfaces before building new" (section 1 is the audit).

**Vault notes consulted:** `_Insights.md` (index, Skills rows only); `Meetings/exxat/2026-09-23-skills-checklist-with-sankalp.md` (and a keyword pass over the raw transcript `Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` for nav, home, report, launch); `Research/skills-checklist/research/meetings/2026-10-08-skills-tracking-requirements-and-prototype-analysis.md`; `Decisions/skills-checklist/decisions/README.md` (empty index). Nothing else pulled. **Mobbin:** not run. The shell is the DS Design OS shell already captured from PCE and the starter in `docs/build/ds-shell-anatomy.md`; no external pattern is being chosen.

---

## 0. Contract header (template `docs/build/02-design-contract-template.md`)

```
Surface:              v2 shell: left nav per role, utility-bar breadcrumb, role landings, admin Home,
                      demo layer (role switcher + Demo menu), copy cleanup          Wave: v2 shell pass
Persona(s) & role:    Program administrator (P-A), reviewer / clinical coordinator (P-R), program director
                      (v2 role, [PROPOSED] D29), student (P-S), preceptor and lab instructor (P-P, P-L).
                      RBAC: docs/ux/03-information-architecture.md permissions matrix; v2 roles in lib/v2/roles.ts
Scope / data seen:    Each role sees only its own nav rows. Confidential concerns never on any Home or nav badge
                      (D23 open). Students never see staff routes. Evaluators see only the request on their link.
Job-to-be-done:       Each person opens the product and lands where their work is, with the nav the product
                      would really have, not a guided tour of the prototype.
Why → So what:        Today v2 teaches the viewer how to use the prototype (numbered step rows, story cards,
                      caveats in page bodies). Stakeholders judge the walkthrough, not the product. After this
                      pass every page reads as the shipped product; the walkthrough lives only in the Demo menu.
Requirements:         SC-15, AR-01, AR-02, IM-09, IM-10, SC-01, SC-18, SC-19, CM-01, CM-03, CM-05, EV-01,
                      EV-05, ST-01, SH-06, RP-01, RP-07, AE-03
Open decisions hit:   OD-29 (report as launch page), OD-34 (standalone vs Prism section, label), OD-P1
                      (standalone app vs Prism section), OD-19 (batch grid). Seams in section 9.
Prototype reference:  [PROTO] sidebar groups Administrator / Student / Evaluator: NOT copied (personas are
                      never sibling groups, ds-shell-anatomy.md §3). Kept: Review and approve as a label.
Pattern:              route (every nav row is a route); Reference hub: apps/pce/admin lib/pce-nav.tsx and
                      apps/skills-checklist/admin/lib/skills-nav.tsx (v1 hybrid nav)
DS mapping:           section 7
States:               section 4.4 (admin Home), 5 (demo layer), 6 (shell)
Edge cases:           sub-page active row (6.3), no role in URL (/v2), unknown role (404), reset while on a
                      record that no longer exists (5.5)
Copy:                 section 8; sentence case, no em dashes, no "step", no numbers, no "scenario" in product UI
A11y:                 section 6.5
Out of scope:         renaming routes; redesigning any page body beyond its h1, subtitle and caveat lines;
                      REQ §14 items; deciding any OD
Acceptance tests:     section 10
Risks / unknowns:     section 11
```

---

## 1. Audit: what the shell does today (read 2026-10-25, file:line)

| Area | Today | Problem |
|---|---|---|
| Left nav | `v2-nav.tsx:15-33`: "Scenario overview", "<Role> home", then `${s.n}. ${s.title}` rows, then extra admin/director/student rows | A tour, not a product. Numbers and story titles ("Configure IV catheter insertion") as nav rows |
| Breadcrumb | `v2-titles.ts:5-19`: `${step.n}. ${step.title}`, fallback "Scenario overview" | Same |
| `/v2` | `overview-page.tsx:20-50`: "Connected prototype v2", "Story steps" grid, "Shared demo data" counters | A prototype index page as the entry point |
| Role homes | `role-home.tsx:21-41`: "Acting as …", "Your steps in the story" cards with Reviewed badges | Teaching cards for 4 roles; the student already has a real home (`student-home.tsx`) |
| Command menu | `v2-command-menu.tsx:34-53`: "Go to a scenario step", numbered items | Search is a step jumper |
| Scenario menu | `scenario-menu.tsx:34-67`: "Story steps (x of 14 reviewed)", 3 phone toggles, Reset | Fine as a demo layer, but carries review state |
| Body demo controls | `preceptor/evaluation-form.tsx:129-159` ("Demo controls (not part of the product)", "Open this link as"); `preceptor/lab-grid-page.tsx:153` ("Open as R. Whitmore"); `student/demo-controls.tsx:22-55` rendered at `student/sync-page.tsx:179` | Demo chrome inside product pages |
| Identity | `v2-shell-wiring.tsx:23`, `v2-user-menu.tsx:40,62` "Demo presenter", "sample data" | |
| Unreachable | `step-page.tsx` (foundation page, "Mark step as reviewed"); `StepScreen` never falls back now that all 14 are built | Dead code with teaching copy |

---

## 2. Visual sitemap (one page)

```
UTILITY BAR (every page, every role)
[≡][(E) Clinical Education v] | Crumb / Crumb ............ [Search][Bell][?][Ask Leo] | [Role v][Demo v][Avatar]
                                                                                        └─ demo layer (section 5)

ADMINISTRATOR  (/v2 ──redirect──▶ /v2/admin)
 ├─ Home ........................ /v2/admin                         setup first, then needs attention
 ├─ Skills library .............. /v2/admin/starter-library
 │    ├─ Configure skill ........ /v2/admin/configure-skill?skill=   (row action "Configure", Home "Configure next skill")
 │    └─ Review and publish ..... /v2/admin/validate-publish?skill=  (wizard step 8, Home "Review and publish")
 ├─ Courses ..................... /v2/admin/map-courses
 ├─ Review and approve (n) ...... /v2/admin/review-queue
 │    └─ Review item ............ /v2/admin/review-queue/{id}
 ├─ Outcomes .................... /v2/admin/outcomes
 │    ├─ Evaluation ............. /v2/admin/evaluation/{id}
 │    └─ Remediation plan ....... /v2/admin/remediation/{id}
 ├─ Records ..................... /v2/admin/verification
 │    └─ Program record ......... /v2/admin/verification/{studentId}
 └─ Reports ..................... /v2/admin/reports

REVIEWER  (/v2/reviewer ──redirect──▶ review-queue)
 ├─ Review and approve (n) ...... /v2/reviewer/review-queue      └─ Review item  /v2/reviewer/review-queue/{id}
 ├─ Outcomes .................... /v2/reviewer/outcome-remediation └─ Evaluation, Remediation plan
 └─ Records ..................... /v2/reviewer/verification      └─ Program record

PROGRAM DIRECTOR  (/v2/director ──redirect──▶ director-verification)
 ├─ Records ..................... /v2/director/director-verification └─ Program record /v2/director/verification/{id}
 ├─ Reports ..................... /v2/director/reports
 └─ Outcomes .................... /v2/director/outcomes          └─ Evaluation, Remediation plan

PRECEPTOR  (demo allowance; product truth = shell-free /e/{token}, EV-01)   (/v2/preceptor ──redirect──▶ Requests)
 ├─ Requests (n) ................ /v2/preceptor/preceptor-evaluation
 │    └─ Evaluation ............. /v2/preceptor/preceptor-evaluation?request={id}
 └─ Lab sessions ................ /v2/preceptor/lab-batch-grid

STUDENT  (left shell ≥768px, bottom bar <768px, same 4 rows)
 ├─ Home ........................ /v2/student
 │    ├─ Sync and offline ....... /v2/student/offline-sync          (sync strip "Sync details", every student page)
 │    └─ Remediation plan ....... /v2/student/remediation/{id}      (plan card on Home)
 ├─ Log skills .................. /v2/student/pick-and-rate
 ├─ Requests (n) ................ /v2/student/request-signoff
 └─ Record ...................... /v2/student/history
      ├─ Share verified record .. /v2/student/verified-record
      └─ Evaluation ............. /v2/student/evaluation/{id}

DEMO MENU (top right, not product):  Walkthrough ▸ (14 jumps) · Student phone (5 controls) ·
                                     Open evaluator link as ▸ (preceptor role) · Reset demo…
```

---

## 3. Nav architecture per role

Rules for every role:
- **This overrides `prototype-parity.md` §1 item 2** (the prototype's three labelled groups Administrator / Student / Evaluator in one rail). That rule was superseded by Romit's 2026-10-08 correction recorded in `ds-shell-anatomy.md` §3 to §4 ("personas are never sibling groups in the rail") and by brief-v2 question 2 (role-scoped nav). Romit's confirmation of this contract is the explicit sign-off for the override.
- The program director and reviewer roles are not created here: both already exist in v2 (`lib/v2/roles.ts`, Stage 4, `[D29]` `[PROPOSED]`). The director persona has no row in `docs/ux/03`; this contract only gives the existing role its nav.
- One flat list of primary rows per role, no section labels, no secondary panel `[DS]` `ds-shell-anatomy.md` §3 ("one flat list per view; persona via profile menu"). Expressed as `primaryLayout: { preamble: rows, sections: [] }`.
- Labels are product nouns only: no "step", no numbers, no "scenario", no "home" suffix on a role name.
- Icons are Font Awesome Pro, `fa-light` at rest and `fa-solid` when active (`iconActive`), `aria-hidden="true"` (existing `item()` helper in `v2-nav.tsx:10`).
- Badge = `NavLinkItem.badge` (number), omitted when 0 `[DS]`. Only two badges exist in the product, both are work waiting for that person: Review and approve, and Requests.
- Configure skill and Review and publish are never nav rows; they are reached from the Skills library row action (`library-table.tsx:75`), the "Skills added" banner action (`starter-library-page.tsx:26`) and the admin Home setup rows.

### 3.1 Administrator

| # | Label | Icon (FA) | Route | Badge rule | Visibility rule | Tags |
|---|---|---|---|---|---|---|
| 1 | Home | `house` | `/v2/admin` | none | always | `[PROPOSED]` brief-v2 hybrid "one Home, two states" |
| 2 | Skills library | `list-check` | `/v2/admin/starter-library` | none (count lives on Home) | always | `[REQ SC-01, IM-09, IM-10]` |
| 3 | Courses | `link` | `/v2/admin/map-courses` | none | always | `[REQ CM-01, CM-03]` |
| 4 | Review and approve | `clipboard-check` | `/v2/admin/review-queue` | `queueItems(s).length` (items awaiting approval) when > 0 | always in v2 (see note) | `[REQ AR-01, AR-02, SC-15]` `[D25]` |
| 5 | Outcomes | `clipboard-list-check` | `/v2/admin/outcomes` | none | always | `[REQ AE-03]` `[PROPOSED]` D21, D22 |
| 6 | Records | `badge-check` | `/v2/admin/verification` | none | always | `[PROPOSED]` D29; touches `[REQ RP-07]` |
| 7 | Reports | `chart-mixed` | `/v2/admin/reports` | none | always | `[REQ RP-01, RP-07]` |

Note on row 4: the doc IA shows Review and approve only when a skill has administrator approval on `[REQ SC-15]` (`docs/ux/03` §2.1), and v1 implements that (`lib/skills-nav.tsx:47`). In v2 the queue also holds photos of paper forms and stalled requests `[D25]` `[D28]`, which exist whether or not any skill has approval on, so hiding the row would hide real work. Kept always visible in v2 `[PROPOSED]`; open question 1.

Defaults kept from the brief. "Courses" kept over the doc IA's "Course mapping" because v1 and the brief-v2 hybrid use it; the page h1 becomes "Courses" and its subtitle names the course (section 4.1).

### 3.2 Reviewer

| # | Label | Icon | Route | Badge rule | Visibility | Tags |
|---|---|---|---|---|---|---|
| 1 | Review and approve | `clipboard-check` | `/v2/reviewer/review-queue` | `queueItems(s).length` when > 0 | always | `[REQ AR-01, AR-02]` |
| 2 | Outcomes | `clipboard-list-check` | `/v2/reviewer/outcome-remediation` | none | always | `[REQ AE-03]` |
| 3 | Records | `badge-check` | `/v2/reviewer/verification` | none | always (read only; only the director verifies, `verification-pages.tsx:50`) | `[PROPOSED]` D29; touches `[REQ RP-07]` |

No Home. `/v2/reviewer` redirects to `/v2/reviewer/review-queue`. Why: the reviewer's whole job is the queue; a home that repeats the queue count is a bare-count surface (workspace rule "action surfaces show work, not counts") `[INFER]`.

### 3.3 Program director

| # | Label | Icon | Route | Badge rule | Visibility | Tags |
|---|---|---|---|---|---|---|
| 1 | Records | `badge-check` | `/v2/director/director-verification` | none | always | `[PROPOSED]` D29; touches `[REQ RP-07, AE-03]` |
| 2 | Reports | `chart-mixed` | `/v2/director/reports` | none | always | `[REQ RP-01]` |
| 3 | Outcomes | `clipboard-list-check` | `/v2/director/outcomes` | none | always; concern rows follow `concernsFor(s, role)` unchanged, D23 open | `[REQ AE-03]` |

No Home. `/v2/director` redirects to `/v2/director/director-verification`. Why: verification is the one action only the director takes `[D29]`; the list already shows each student's status.

### 3.4 Preceptor (and lab instructor)

| # | Label | Icon | Route | Badge rule | Visibility | Tags |
|---|---|---|---|---|---|---|
| 1 | Requests | `stethoscope` | `/v2/preceptor/preceptor-evaluation` | `waitingFor(s, actorId).length` when > 0, actor = `?as` or J. Delgado | always | `[REQ EV-01, EV-05]` |
| 2 | Lab sessions | `flask` | `/v2/preceptor/lab-batch-grid` | none | always | `[PROPOSED]` D39, `[OD-19]` open |

**Demo allowance, stated:** evaluators have no shell in the product `[REQ EV-01]` (`docs/ux/03` §2.3: "no sidebar, no navigation, no account, nothing else reachable"). The production route is a tokenised `/e/{token}` page with no chrome. Lab instructors (P-L) share this role in v2 because neither has an account and the seed's R. Whitmore is reached through "Open evaluator link as" `[D6]`; they remain a distinct persona in `docs/ux/03`. v2 keeps the shell for the preceptor role only so a presenter can move between the two evaluator surfaces; nothing on either page may depend on the shell. `/v2/preceptor` redirects to Requests. The profile menu names the actor of the page: `?as` person if present, else J. Delgado on Requests and R. Whitmore on Lab sessions `[INFER]`.

### 3.5 Student

| # | Label (side nav) | Bottom bar label | Icon | Route | Badge rule | Tags |
|---|---|---|---|---|---|---|
| 1 | Home | Home | `house` | `/v2/student` | none | `[REQ ST-01]` |
| 2 | Log skills | Log | `pen-to-square` | `/v2/student/pick-and-rate` | none | `[REQ ST-01]` |
| 3 | Requests | Requests | `paper-plane` | `/v2/student/request-signoff` | `unsentEntries(s).length` (ready to send) when > 0 | `[REQ EV-01]` |
| 4 | Record | Record | `clock-rotate-left` | `/v2/student/history` | none | `[REQ SH-06]` |

- Same four destinations as the bottom bar `[D6]` (`student-frame.tsx:70-75`). The bottom bar keeps "Log" for width at 390 px `[INFER]`; the side nav and the page h1 say "Log skills".
- At ≥768 px the four rows render in the DS left shell (`AppSidebar`) and the in-column link row is hidden (`StudentNav` gets `md:hidden`; today it moves to the top of the column at `student-frame.tsx:83`).
- Below 768 px the bottom bar is the nav. The utility-bar sidebar toggle is hidden for the student role below 768 px so there are not two navs `[PROPOSED]` (open question 5).
- **Sync and offline** is not a nav row. It is reached from the always-visible sync strip ("Sync details", `student-frame.tsx:31`) on every student page, so the place a student meets a sync problem is where the link is. Breadcrumb: Home / Sync and offline `[INFER]`.

---

## 4. Page titles, breadcrumbs and role landings

### 4.1 Page titles (h1) = nav labels (`docs/build/prototype-parity.md` §1 item 3)

| Route | h1 today | h1 after | Subtitle after |
|---|---|---|---|
| `/v2/admin` | "Administrator home" | Home | `{school} {program}, {course code} {course name}, {term}.` |
| `/v2/admin/starter-library` | Add skills to the library | Skills library | Every skill the program holds, where it came from and whether it still needs configuring. |
| `/v2/admin/map-courses` | Map skills to NURS 350 | Courses | `Mandatory and optional skills for {code} {name}, {term}, {cohort}.` |
| `/v2/*/review-queue` | Review queue | Review and approve | unchanged |
| `/v2/admin/outcomes`, `/v2/reviewer/outcome-remediation`, `/v2/director/outcomes` | Outcomes and remediation | Outcomes | unchanged |
| `/v2/*/verification`, `/v2/director/director-verification` | Verify the program record | Records | unchanged (director and staff variants at `verification-pages.tsx:50`) |
| `/v2/*/reports` | Cohort reports | Reports | unchanged |
| `/v2/preceptor/preceptor-evaluation` (no request) | Requests waiting for you | Requests | Each one opens from the link or QR code a student sends. You do not need an account. |
| `/v2/preceptor/lab-batch-grid` | Record a lab session | Lab sessions | unchanged |
| `/v2/student/request-signoff` | Ask for sign-off | Requests | unchanged |
| `/v2/student/history` | Your record | Record | unchanged |
| `/v2/student/pick-and-rate` | Log skills | Log skills | unchanged |
| `/v2/student` | What's left in NURS 350 | **kept** (one exception) | unchanged |

Exception: the student Home keeps its job-led h1 ("What's left in NURS 350") because a mobile home leads with the job, and the side-nav row still says Home `[INFER]`. Sub-pages keep their object titles ("Configure IV catheter insertion", "Evaluate Maya Ferreira", "Maya Ferreira, program record", "Remediation plan: IV catheter insertion").

### 4.2 Breadcrumb scheme (replaces `v2-titles.ts`)

`v2-titles.ts` returns `Crumb[] = { label, href? }[]` from `(pathname, searchParams)`. The utility bar renders `BreadcrumbItem` + `BreadcrumbLink asChild <Link>` for every crumb with an `href`, `BreadcrumbSeparator` between, `BreadcrumbPage` for the last. Parent crumb = the nav row the sub-page belongs to. One level only; no back button that duplicates it (`docs/ux/03` §3).

| Path pattern | Crumbs |
|---|---|
| any nav-row route | `<nav label>` |
| `/v2/admin/configure-skill` | Skills library › Configure skill |
| `/v2/admin/validate-publish` | Skills library › Review and publish |
| `/v2/{role}/review-queue/{id}` | Review and approve › Review item |
| `/v2/{role}/evaluation/{id}` (staff) | Outcomes › Evaluation |
| `/v2/{role}/remediation/{id}` (staff) | Outcomes › Remediation plan |
| `/v2/{role}/verification/{studentId}` | Records › Program record |
| `/v2/preceptor/preceptor-evaluation?request=` | Requests › Evaluation |
| `/v2/student/offline-sync` | Home › Sync and offline |
| `/v2/student/remediation/{id}` | Home › Remediation plan |
| `/v2/student/verified-record` | Record › Share verified record |
| `/v2/student/evaluation/{id}` | Record › Evaluation |

### 4.3 Role landings and `/v2`

| URL | Behaviour | Why |
|---|---|---|
| `/v2` | server `redirect("/v2/admin")` in `app/(v2)/v2/page.tsx` | The product starts at a person's landing, not a prototype index `[INFER]` |
| `/v2/admin` | admin Home (4.4) | |
| `/v2/student` | `StudentHome`, unchanged | already a real home |
| `/v2/reviewer`, `/v2/director`, `/v2/preceptor` | redirect to the role's first nav row | 3.2 to 3.4 |
| `ROLES[].home` (`lib/v2/roles.ts`) | set to the landing URL, so the role switcher goes there directly | |

### 4.4 Admin Home content architecture

Brief-v2 hybrid: "One Home, two states: setup journey while the program is being set up, then a worklist" `[PROPOSED]`. Sankalp's flow "upload, inactive until configured, configure, activate, map" `[CALL 09-23]`. Rows show the work (names and the next action), never a bare number.

```
Home
Harbor University BSN, NURS 350 Clinical Practicum, Fall 2026.

SET UP                                                    (section hidden behind one line when every row is 0)
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 19 skills need configuration                                       [Configure next skill] │
│ Hand hygiene audit, Wound irrigation, Telemetry lead placement and 16 more  See all ›     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 1 skill is configured but not published                              [Review and publish]│
│ IV catheter insertion                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 4 published skills are not mapped to NURS 350                              [Open Courses]│
│ Students can still log them. Mapping sets what the course expects.                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 2 coverage warnings for NURS 350                                           [Open Courses]│
└─────────────────────────────────────────────────────────────────────────────────────────┘

NEEDS ATTENTION
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 4 submissions waiting for approval, 1 stalled request           [Open Review and approve]│
│ Jordan Okafor, Vital signs and early warning score ................................ Open ›│
│ Tomas Alvarez, photo of a paper form ............................................ Open ›│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 10 students are behind the expected pace                                  [Open Reports] │
│ Maya Ferreira, 2 evaluations short · Student B, 3 short · …                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 1 remediation plan is open                                               [Open Outcomes] │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 1 record changed since it was verified                                    [Open Records] │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
(Counts above are illustrative; every figure is read from the store.)

| Block / row | Selector (shared store) | Action and target | Empty state | Tags |
|---|---|---|---|---|
| Setup: need configuration | **new** `setupSummary(s).unconfigured` = `s.skills.filter(k => !k.configured)` | primary in row: "Configure next skill" → `/v2/admin/configure-skill?skill={first.id}`; link "See all" → `/v2/admin/starter-library` | row hidden | `[REQ SC-01, IM-09, IM-10]` |
| Setup: configured, not published | `setupSummary(s).unpublished` = `configured && !published` | "Review and publish" → `/v2/admin/validate-publish?skill={first.id}` | row hidden | `[REQ SC-18, SC-19]` |
| Setup: published, not mapped | `setupSummary(s).unmapped` = `published && !s.mappings.some(m => m.skillId === k.id && m.courseId === s.course.id)` | "Open Courses" → `/v2/admin/map-courses`. Copy must not imply students are blocked `[REQ CM-05]` | row hidden | `[REQ CM-01, CM-03, CM-05]` |
| Setup: coverage warnings | `coverageWarnings(s)` (`lib/v2/coverage.ts:24`) | "Open Courses" | row hidden | `[PROPOSED]` D12 |
| Setup, all rows 0 | | one line: "Setup is complete. Every skill is configured, published and mapped to {code}." | | |
| Attention: approvals | `queueItems(s)` + `stalledRequests(s)` (`lib/v2/queue.ts:65,94`), first 3 by `itemLabel` | row links → `/v2/admin/review-queue/{key}`; "Open Review and approve" | row hidden | `[REQ AR-01, AR-02]` `[D25, D28]` |
| Attention: behind pace | `behindPace(s)` (`lib/v2/reports.ts:201`), first 5 names with `behindBy` | "Open Reports" → `/v2/admin/reports` (pace basis is explained there, D31) | row hidden | `[PROPOSED]` D31 |
| Attention: open plans | `s.remediations.filter(r => r.status !== "closed")` | "Open Outcomes" | row hidden | `[PROPOSED]` D22 |
| Attention: changed records | `verificationRows(s).filter(r => r.status === "changed")` | "Open Records" | row hidden | `[PROPOSED]` D29 |
| Attention, all rows 0 | | "Nothing needs attention. New submissions, stalled requests and students behind pace show here." | | |
| Excluded | confidential concern count | never on Home (shared screens; D23 open, concerns stay in Outcomes) | | `[D23]` |

New selectors go in a **new** file `admin/lib/v2/home.ts` (`setupSummary`, `attentionSummary`) with `admin/tests/v2/home.test.ts` against the seed. No edits to `selectors.ts` for this.

States: **Loading** `LoadingBlocks` (`shared-loading.tsx`) while `!useV2Hydrated()` so seed counts do not flash before saved state. **Empty** per row above. **Error** none: the store discards bad data and falls back to the seed `[D5]`; nothing is fetched. **Disabled** none. One filled primary on the page at most: only the first visible setup row's button is `variant="default"`; every other row action is `variant="outline" size="sm"` or a link (rule: no two filled primaries).

OD seam: OD-29 ("the student-level report is the launch page") is not decided. This Home is the administrator's landing; Reports keeps a student entry so OD-29 can later swap the landing to a report without changing nav rows.

---

## 5. Demo layer (top right)

Kept: **Role switcher** (`role-switcher.tsx`), unchanged except role `home` targets (4.3). The label "Student (mobile)" stays: it is presenter-facing.

**Scenario menu becomes "Demo"** (`scenario-menu.tsx`, file and export name kept this pass to avoid a cross-task edit, section 12). "Demo" is honest about what the control is and short at 390 px `[INFER]`.

### 5.1 Contents

```
[Demo v]
 Harbor University BSN sample data            (muted label)
 ─────────────
 Walkthrough                               ▸  submenu: 14 rows, in story order, title + muted role
                                              ("Copy a specialty starter library  Administrator"), no numbers,
                                              no reviewed ticks, no count
 ─────────────
 Student phone                                (group label)
 [ ] Phone is offline                         checkbox (existing label, shoot.mjs depends on it)
 [ ] Phone is signed out                      checkbox
 [ ] App update is pending                    checkbox
 [ ] Next sync fails                          checkbox, bound to device.failNextSync (was a one-shot button)
     Simulate an edit on another device       item; disabled with reason text when there is no entry to edit
 ─────────────
 Open evaluator link as                    ▸  submenu, radio list of evaluatorChoicesForDemo(s)  (preceptor role only)
 ─────────────
 Reset demo…                                  opens the confirm dialog
```

### 5.2 Where each body control goes, and what the page shows instead

| Control today | Moves to | Page shows instead (product states only) |
|---|---|---|
| `evaluation-form.tsx:129-159` "Open this link as" card (both the form and the waiting list) | Demo › Open evaluator link as ▸. On `preceptor-evaluation` it keeps `?request` and sets `?as`; on `lab-batch-grid` it sets `?as`; elsewhere in the preceptor role it opens Requests with `?as` | The form, the receipt or the existing `Blocked` banner (`evaluation-form.tsx:113-127`) with its reason and fix. Subtitle "You opened this link as J. Delgado, RN. No account is needed." stays (the link identifies the evaluator, EV-01) |
| `lab-grid-page.tsx:153` "Open as R. Whitmore" button | Demo › Open evaluator link as ▸ R. Whitmore | The warning banner keeps `blockReason`; the button is removed |
| `student/demo-controls.tsx` card at `sync-page.tsx:179` (Go offline, Sign out, Mark update as pending, Make the next sync fail, Simulate an edit) | Demo › Student phone (all 5) | Sync page: connection status, queue, Send now, Retry, conflicts. Effects show through the product's own sync strip, chips and device banners (`student-frame.tsx:39-68`), whose "Sign in" and "Install update" buttons stay as real product actions |
| Scenario › Reset demo | Demo › Reset demo… | see 5.5 |
| Scenario › Story steps | Demo › Walkthrough ▸ | |

Feedback for the two action items: a visually hidden `role="status"` live region inside the Demo menu component announces the result ("Next sync will fail once", "Another device changed the latest entry"); no banner in the page body. The menu item for Simulate is disabled with the reason when `simulateServerEdit` would fail (dry run on the current state) `[INFER]`.

### 5.3 Step-review state

"Mark step as reviewed", the "Reviewed / Not reviewed" badges and the "x of 14 reviewed" count are removed from the UI. They were a presenter checklist, not product behaviour, and only `step-page.tsx` (unreachable) could set them. `V2State.stepsReviewed` and the store's mark function stay in the type and seed so saved envelopes still load `[D5]` and `tests/v2/store.test.ts` keeps passing; the `reviewed` counter row (`selectors.ts:36`) is deleted.

### 5.4 Command menu

Becomes a page search for the current role: title "Search", description "Go to a page", input and aria-label "Search pages", one group "Pages" with the role's nav rows, empty "No pages match." Walkthrough jumps are not in search (they are demo, in the Demo menu) `[INFER]`.

### 5.5 Reset demo

Confirm dialog: title "Reset the demo data?", description "Every change made in this browser goes back to the starting data for Harbor University BSN.", buttons "Keep my changes" (outline, autofocus) and "Reset demo data" (default). After reset: the dialog stays open in a success state, title "Demo data reset", text "Everything is back to the starting data.", one button "Done" that takes focus and returns it to the Demo trigger on close; the router goes to the current role's landing (so a detail page whose record no longer exists is never shown). The `?reset=1` banner on `/v2` is deleted. Nothing about the demo appears in a page body.

---

## 6. Shell behaviour

### 6.1 DS mapping

| Concern | DS API (verified in installed 1.6.5 `.d.ts`) | Verdict |
|---|---|---|
| Rail | `AppSidebar` + `SidebarShell` + `SidebarInset` (`v2-shell-frame.tsx`, unchanged) | IMPORT |
| Rows | `ShellNav.primary: NavLinkItem[]` and `primaryLayout: NavPrimaryLayout = { preamble, sections: [], epilogue? }` (`dist/components/shell/nav-render-types.d.ts`, `app-shell-slots.d.ts:149`) | IMPORT, fed by `buildV2Nav(role, state)` |
| Count | `NavLinkItem.badge?: number \| string` | IMPORT |
| Active row | longest-prefix match over `ShellNav.knownUrls` (`dist/lib/nav-active.js` `resolveActiveNavHref`) | IMPORT, see 6.3 |
| Secondary panel | `NavLinkItem.secondaryPanel`, `SecondaryPanelSpec` | not used (no hub needs scoping) |
| Breadcrumb | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage` | IMPORT |
| Demo menu | `DropdownMenu`, `DropdownMenuSub/SubTrigger/SubContent`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup/RadioItem`, `Dialog` | IMPORT |
| Home rows | `PageHeader` (via `PageFrame`), `Card`, `Button` (`default` once, else `outline size="sm"` or `link`) | IMPORT. No `KeyMetrics`: rows show work, not counts |
| Search | `CommandDialog`, `Command`, `CommandInput`, `CommandGroup`, `CommandItem`, `CommandEmpty` | IMPORT |

`node tools/ds/source.mjs AppSidebar` reports 1.5.1 while the app installs 1.6.5 (known, D-section G); nav types were read from the installed package.

### 6.2 `knownUrls`

Every route in section 2, including sub-route prefixes (`/v2/admin/configure-skill`, `/v2/admin/validate-publish`, `/v2/{role}/evaluation`, `/v2/{role}/remediation`, `/v2/{role}/verification`, `/v2/{role}/review-queue`, `/v2/student/offline-sync`, `/v2/student/verified-record`, `/v2/student/remediation`, `/v2/student/evaluation`).

### 6.3 Active row on sub-pages (known DS limit)

Without the sub-routes in `knownUrls`, Home (`/v2/admin`) would light on every admin sub-page by prefix. With them, no row lights on a sub-page whose URL does not extend its parent's (Configure skill, Review and publish). `rowActive` cannot activate a row whose URL does not match (`nav-active-state.d.ts`). The breadcrumb's first crumb carries the place. Sub-pages that do extend their parent (review item, program record) light the parent. `[INFER]`, verify at build.

### 6.4 Below 768 px

- Student: bottom bar only; rail hidden; sidebar toggle hidden.
- Every other role: DS default, the rail becomes the off-canvas sheet opened by the utility-bar toggle (`useIsMobile`, breakpoint 768 in `dist/hooks/use-mobile.js`). Rows identical. Role switcher, Demo and avatar stay in the bar; Search, Notifications, Help, Ask Leo already fold by breakpoint (`v2-utility-bar.tsx:76-90`).

### 6.5 Accessibility

Nav landmark from `AppSidebar`; `aria-current="page"` on the active row (DS). Badges are read with the row ("Review and approve, 4"); verify the DS renders them inside the link, else add an `sr-only` suffix. Breadcrumb `nav aria-label="Breadcrumb"`. Demo submenus reachable with arrow keys; focus returns to the Demo trigger after the reset dialog. Student bottom bar keeps 44 px targets. No colour-only status on Home rows (counts and names are text).

---

## 7. Copy deletions and rewrites

Sentence case, no em dashes. "Delete" means the string and its container go.

| File:line | Current | After |
|---|---|---|
| `v2-nav.tsx:17,20` | "Scenario overview" | delete |
| `v2-nav.tsx:21` | `${label} home` | delete (Home row only for admin and student) |
| `v2-nav.tsx:22` | `${s.n}. ${s.title}` rows | delete; rows per section 3 |
| `v2-nav.tsx:25-27,30,31` | "Review queue", "Outcomes and remediation", "Record verification", "Cohort reports", "Your record" | "Review and approve", "Outcomes", "Records", "Reports", "Record" |
| `v2-titles.ts:7` | `${step.n}. ${step.title}` | crumbs per 4.2 |
| `v2-titles.ts:18` | "Scenario overview" | delete |
| `overview-page.tsx` (whole) | "Connected prototype v2", "Story steps", "Shared demo data", "Demo data reset" | delete file; `/v2` redirects |
| `role-home.tsx:21` | `${label} home`, "Acting as … {blurb}" | admin: "Home" + subtitle per 4.1; other roles redirect |
| `role-home.tsx:22-41` | "Your steps in the story", step cards, Reviewed badges | delete |
| `step-page.tsx` (whole) | "Foundation page", "Live demo data", "Mark step as reviewed" | delete file and the `fallback` prop path |
| `v2-command-menu.tsx:34,35,37` | "Go to a scenario step" | "Go to a page" (description), "Search pages" (label, placeholder) |
| `v2-command-menu.tsx:40,41,44` | "No steps match.", "Scenario steps", `{n}. {title}` | "No pages match.", "Pages", nav row titles |
| `scenario-menu.tsx:34` | "Scenario" | "Demo" |
| `scenario-menu.tsx:40` | "Story steps ({n} of 14 reviewed)" | submenu trigger "Walkthrough" |
| `scenario-menu.tsx:53` | "Demo controls for the student phone" | "Student phone" |
| `scenario-menu.tsx:67` | "Reset demo" | "Reset demo…" |
| `scenario-menu.tsx:83` | "… Reviewed steps are cleared." | drop the last sentence |
| `v2-shell-wiring.tsx:23`, `v2-user-menu.tsx:40-41` | "Demo presenter", "DP" | delete (no role-less page remains) |
| `v2-user-menu.tsx:62` | "{role label}, sample data" | "{person title}" (for example "Program administrator"); "sample data" moves to the Demo menu label |
| `selectors.ts:36` | "Scenario steps reviewed" | delete row |
| `app/(v2)/layout.tsx:4` | "Skills tracking, connected prototype v2" | "Skills tracking" |
| `evaluation-form.tsx:129-159` | "Demo controls (not part of the product)", "A real link identifies the evaluator…", "Open this link as" | delete; Demo menu |
| `evaluation-form.tsx:51` | title "Requests waiting for you", subtitle "Each one opens from the link or QR code the student sends…" | title "Requests"; subtitle "Each one opens from the link or QR code a student sends. You do not need an account." |
| `lab-grid-page.tsx:152-154` | button "Open as R. Whitmore" | delete |
| `lab-grid-page.tsx:78,143` | "Record a lab session" | "Lab sessions" |
| `student/demo-controls.tsx` (whole) | "Demo controls (not part of the product)", "They stand in for…so a presenter can show every case." | delete file |
| `student/sync-page.tsx:179` | `<DemoControls …>`, toast-like title "Demo control" | delete |
| `student/sync-page.tsx:68` | "… The audit log has the decision." | drop that sentence |
| `student/record-page.tsx:140` | "A signed PDF. Whoever receives it can check it has not changed. This prototype signs with a demo key, so the check shows the file is unchanged, not who made it." | "A signed PDF. Whoever receives it can check that it has not changed since it was issued." (see open question 2) |
| `student/record-page.tsx:87` | "Back to your record" | "Back to Record" |
| `reports/reports-page.tsx:308` | "… The requirements do not define pace; this is the prototype's reading." | drop that sentence; keep the basis sentences |
| `reports/reports-page.tsx:434` | "This file has not changed since it was signed here. It does not prove who made it. This is a prototype: it signs with a demo key… A real deployment signs with the program's private key. Confidential concerns…" | "This file has not changed since it was signed. Confidential concerns, student self-ratings and notes, and evaluator feedback text are never in a report." |
| `reports/reports-page.tsx:121,168` | "Cohort reports" | "Reports" |
| `review/review-item-page.tsx:244` | "The prototype keeps the file name and size, not the image." | "The photo the student sent with this request." |
| `review/review-queue-page.tsx:78,85` | "Review queue" | "Review and approve" |
| `outcomes/outcomes-page.tsx:41` | "Outcomes and remediation" | "Outcomes" |
| `director/verification-pages.tsx:48,50` | "Verify the program record" | "Records" |
| `admin/starter-library-page.tsx:23` | "Add skills to the library" + subtitle | "Skills library" + subtitle per 4.1 |
| `admin/map-courses-page.tsx:52` | "Map skills to {code}" | "Courses" + subtitle per 4.1 |
| `student/request-signoff.tsx:145` | "Ask for sign-off" | "Requests" |
| `student/history-page.tsx:35` | "Your record" | "Record" |
| `lib/v2/roles.ts` `blurb` fields | presenter descriptions | delete field (only `role-home.tsx` read it) |

**Kept on purpose:** prototype marks inside generated files (`lib/v2/pdf.ts:153,155,165,179,252,253`, `lib/v2/record.ts:179`). A downloaded file can leave the room and be mistaken for a real record; the mark protects against that. They are not page-body teaching. "Use the sample checklist" (`import-panel.tsx:124`) is a real import affordance. Staff mentions of the audit log (`review-queue-page.tsx:266,365`) are product truth for staff.

---

## 8. Out of scope

Route renames; page-body redesign beyond h1, subtitle and the listed lines, **except the admin Home (4.4), which is the one new surface in this contract** (Romit asked for a real product home in place of the step cards); Skills library section order; v1 shell (`components/shell`, `lib/skills-nav.tsx`); production `/e/{token}`; REQ §14 items; any OD.

---

## 9. Open decisions and seams (none decided)

| OD | How this contract touches it | Seam |
|---|---|---|
| OD-29 | Admin lands on Home, not on a student report | Home is one route; swapping the landing changes `ROLES.admin.home` only |
| OD-34 / OD-P1 | Product label and standalone vs Prism section | Product switcher unchanged; nav labels are plain nouns that work in either |
| OD-19 | Lab sessions is a nav row in the preceptor demo shell | Row is `[PROPOSED]`; removing it removes one row |

---

## 10. Acceptance tests

Static (run from `apps/skills-checklist`):
1. `grep -rnE "Scenario overview|Story steps|Mark step|Your steps in the story|Demo presenter|scenario step|Scenario steps|not part of the product|This prototype|This is a prototype|The prototype keeps|prototype's reading|Reviewed steps" admin/components/v2 admin/app/\(v2\) admin/lib/v2/selectors.ts admin/lib/v2/roles.ts` returns nothing.
2. `grep -nE "s\.n\}|step\.n\}|\\$\{s\.n\}\.|\"[0-9]+\. " admin/components/v2/v2-nav.tsx admin/components/v2/v2-titles.ts admin/components/v2/v2-command-menu.tsx` returns nothing.
3. `grep -rn "data-demo-controls\|DemoControls" admin/components/v2` returns nothing; `admin/components/v2/student/demo-controls.tsx`, `step-page.tsx`, `overview-page.tsx` do not exist.
4. New `admin/tests/v2/nav.test.ts`: `buildV2Nav(role, seed).map(r => [r.title, r.url])` equals the section 3 tables exactly for all five roles; Review and approve badge equals `queueItems(seed).length`; preceptor Requests badge equals `waitingFor(seed, delgado).length`; student Requests badge equals `unsentEntries(seed).length`; no title matches `/step|scenario|^\d/i`.
5. New `admin/tests/v2/home.test.ts`: `setupSummary(seed)` and `attentionSummary(seed)` match hand counts from the seed; a fully set-up state returns empty lists; `attentionSummary` has no concern field.
6. `v2-titles` unit test: every row of 4.2 returns the listed crumbs, with `href` on every crumb but the last.
7. `cd admin && npx tsc --noEmit` and `npx vitest run tests/v2` pass. `node .claude/hooks/check-req-ids.mjs docs/build/contracts/_draft-V2-IA-shell-and-nav.md` passes.

Runtime (dev server on 3007):
8. `curl -sI localhost:3007/v2` is a redirect to `/v2/admin`; `/v2/reviewer`, `/v2/director`, `/v2/preceptor` redirect to `review-queue`, `director-verification`, `preceptor-evaluation`.
9. Per role at 1440 px, the sidebar link names are exactly the section 3 labels (badge text allowed as suffix); the h1 on each nav-row page equals the label (section 4.1, student Home excepted).
10. On `/v2/admin/configure-skill` and `/v2/admin/validate-publish` the Home row is not `data-active`; the breadcrumb reads "Skills library › …" and its first crumb links to `/v2/admin/starter-library`.
11. Student at 1440 px: 4 sidebar rows, no in-column link row; at 390 px: bottom bar with 4 items, sidebar toggle not rendered.
12. Demo menu: label "Demo"; Walkthrough submenu has 14 items with no digits; Student phone group has 4 checkboxes and 1 item; "Open evaluator link as" appears only in the preceptor role and changing it rewrites `?as` while keeping `?request`; Reset shows the success state and lands on the role's landing.
13. No page in the shoot route list renders `[data-demo-controls]` or the strings in test 1 (add as a `shoot.mjs` global check).
14. `docs/v2/verify/stage1..5.e2e.mjs` pass after their helpers change (section 12, task 4): `Scenario` → `Demo`; sync-page demo buttons → Demo menu items; `#open-as` → Demo submenu; `counter()` in `stage2` reads the store (`withEvaluator`, `queueWaiting`, `syncConflict` computed from `store()` with the same filters as `selectors.ts`) instead of the deleted `/v2` counters; heading checks updated to the new h1s (for example `stage1.e2e.mjs:130` "Courses").
15. Admin Home renders at most one `variant="default"` button (count `[data-slot="button"][data-variant="default"]`, or the DS equivalent attribute, inside `main`), in every combination of empty and non-empty rows tested in `home.test.ts` fixtures.
16. Evaluator pages do not depend on the shell: `preceptor-evaluation` (with a request) and `lab-batch-grid` contain no link inside `main` to any other `/v2/` route except their own query variants, so the same body could ship shell-free at `/e/{token}` `[REQ EV-01]`.
17. `node docs/v2/verify/shoot.mjs` (no route arguments): 0 new axe violations against the last `report.json` (known DS menu findings excepted), no page errors, no horizontal overflow at 390 px, focus cycle completes.

---

## 11. Risks and unknowns (max 3)

1. **Active row on two admin sub-pages** lights nothing (6.3). Acceptable with the breadcrumb, but it is a DS limit, not a choice.
2. **E2E churn:** stage2 and shoot lean on the sync-page demo buttons and on `/v2` counters; the rewrite is mechanical but touches many lines. Run them before and after.
3. **Honesty trade-off:** removing the signature caveat from page bodies means a stakeholder may read the PDF signature as production-grade. Mitigated by the marks kept in the files themselves; open question 2.

---

## 12. Build plan (4 tasks, disjoint file ownership)

Each task also owns every section 7 row whose file it owns (T1: `v2-nav`, `v2-titles`, `v2-command-menu`, `v2-shell-wiring`, `v2-user-menu`, `layout.tsx`, `selectors.ts`, `roles.ts`, the deleted overview and step pages; T2: `role-home.tsx`; T3: `scenario-menu`, `evaluation-form`, `lab-grid-page`, `sync-page`, `demo-controls`; T4: the rest). "Reset demo…" uses the single ellipsis character (U+2026). T1, T2 and T3 run in parallel. T4 runs its copy edits in parallel and its verify-script edits after T1 to T3 land.

| Task | Owns (only these files edit) | Delivers |
|---|---|---|
| **T1 Shell and nav** | `components/v2/v2-nav.tsx`, `v2-titles.ts`, `v2-shell-wiring.tsx`, `v2-utility-bar.tsx`, `v2-user-menu.tsx`, `v2-command-menu.tsx`, `step-screen.tsx`, `student/student-frame.tsx`; `lib/v2/roles.ts`, `lib/v2/selectors.ts`; `app/(v2)/layout.tsx`, `app/(v2)/v2/page.tsx`, `app/(v2)/v2/[role]/page.tsx`, `app/(v2)/v2/[role]/[slug]/page.tsx`; delete `step-page.tsx`, `overview-page.tsx`, `counters-table.tsx` (after grep shows no other importer); new `tests/v2/nav.test.ts`, `tests/v2/titles.test.ts` | Sections 3, 4.1 (role landings), 4.2, 4.3, 5.4, 6. `[role]/page.tsx` keeps rendering `<RoleHome role>` for admin and student |
| **T2 Admin Home** | `components/v2/role-home.tsx` (keeps the export `RoleHome({ role })`), new `components/v2/admin/admin-home.tsx`, new `lib/v2/home.ts`, new `tests/v2/home.test.ts` | Section 4.4 |
| **T3 Demo layer** | `components/v2/scenario-menu.tsx` (file and export name kept), `preceptor/evaluation-form.tsx`, `preceptor/lab-grid-page.tsx`, `student/sync-page.tsx`; delete `student/demo-controls.tsx` | Section 5; the copy rows of section 7 that sit in these four files |
| **T4 Copy, titles, verification** | `student/record-page.tsx`, `student/request-signoff.tsx`, `student/history-page.tsx`, `reports/reports-page.tsx`, `review/review-item-page.tsx`, `review/review-queue-page.tsx`, `outcomes/outcomes-page.tsx`, `director/verification-pages.tsx`, `admin/starter-library-page.tsx`, `admin/map-courses-page.tsx`; `docs/v2/verify/*.mjs`; `docs/v2/README.md`, `docs/v2/decisions-and-open-questions.md` (new D-rows for this pass) | Section 7 remaining rows, section 4.1 titles, section 10 tests 13 to 17 |

Gate after all four: `ds-conformance-reviewer`, `state-review` (admin Home, Demo menu), `verification-reviewer`, then `skills-journey-check` on each role landing.

---

## 13. Open questions for Romit (recommendation first)

1. **Review and approve always visible in v2?** Recommend yes: the queue holds paper-form photos and stalled requests that exist without SC-15 approval (D25, D28). The v1 rule (only when a skill needs approval) stays for production.
2. **Where does the "demo key" signature caveat live once it leaves the page body?** Recommend: in the generated PDF and CLR files (already there) and in `docs/v2`; page copy describes the production behaviour.
3. **Reviewer, director and preceptor land on their first nav row instead of a home?** Recommend yes; their homes would only repeat the first row's count.
4. **Rename "Scenario" to "Demo" and drop step-review ticks?** Recommend yes; the walkthrough stays one click away as a plain list.
5. **Student on desktop uses the left shell, and the sidebar toggle is hidden for the student below 768 px?** Recommend yes, so a student never sees two navs.

## Amendment 2026-10-25 (Romit: less instruction text, better IA and content strategy, add data visualization)

Normative addition: `docs/build/research/v2-ia-and-content-strategy.md` governs (a) the copy budget (no subtitle by default, subtitle at most 12 words and only when it adds a fact, section description at most 10 words and none by default, above-the-fold prose at most 40 words on desktop and 25 on phone), (b) the 24-row before/after copy table, and (c) the visual spec V1 to V17 per page. Where this contract's section 4.1 keeps a subtitle "unchanged", the research budget wins. Decisions: recharts is added to `admin/package.json` at the version the DS already uses, for the one time series (V15) only; all other visuals are token-coloured HTML/SVG; `KeyMetrics` carries KPI tiles; no red-only encoding, "did not meet" uses amber with an icon; no second course is seeded (V13 course switch is omitted, not faked); RP-04 by-tag view stays out (no tags field). OD-29 stays open.

Build waves: W1 = T0 seed variance, T1 shell and nav, T2 viz primitives, T3 demo layer. W2 = T4 admin Home plus Skills library and Courses visuals, T5 Reports, T6 student Home and Record, T7 queue, Records, Outcomes, lab grid and remaining copy. W3 = verify scripts rewrite, full verification, reviewers.
