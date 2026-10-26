# Director: Dashboard, Verification detail, Reports (design lab)

**Persona:** Dr. K. Brennan, program director (`dir-brennan`). **Data:** scaled seed (123 students, 3 cohorts), read through `lib/lab/director.ts`, which takes the population from `populationRows` (the single behind calculation in `lib/lab/dashboard.ts`) and the skill states from `skillProgress` / `recordStateOf`. No number is hard-coded.
**Consulted:** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`, strategy 01 to 07 (03 section 4.4, H8, H9, H11, D3; 06 scope and states; 07 density budget), `dashboard-concepts/README.md` (director readiness idea), `visual-language.md`, `components/lab/viz-tokens.css`, `docs/v2/audit/T3-evaluator-review-director.md`, REQ RP-01..RP-10, AE-04, SH, `dataset-spec.md` (arc 2 and story 9), v2 decision D36.
**Routes:** `/lab/director/dashboard?variant=A|B|C`, `/lab/director/verification-detail?variant=A|B&student=`, `/lab/director/reports?variant=A|B&view=student|skill|section`. Load with an explicit `term=` (for example `&term=Fall%202026`). Demo states on every screen: `?state=loading|empty|clear|error|partial|stale`.

## 1. What the director needs, and what v2 lost

| Need | Source | v2 today | Lab answer |
|---|---|---|---|
| Know who in the graduating cohort is ready, and who is behind | brief section 1; dataset story 2 | 4 KPI cards over 12 students, "Students in the cohort" is a constant [AUDIT T3] | One readiness model over 38 students: Complete 31, One skill short 4 (all on Hangs PB Med), Far behind 3 |
| Verification is the worklist, not a separate page | ledger (Dashboard with Verification as its worklist) | Separate Records page, flat group of 12 | Dashboard C is the worklist; A and B end in it; every figure lands there filtered |
| Verify without overclaiming | strategy/03 D3; COMP section 9 | One checkbox over a 2-of-4 record [AUDIT T3] | Each gap has its own named acknowledgement; the verified record states its own gaps; no "ready for practice" wording |
| See when a verified record went stale | strategy/03 H11 | Only an evaluation reopen flags it | "Changed since verified" also after a rule change, with the rule named and the old version kept |
| Reach evidence from any figure | REQ RP-05, RP-06 | "Open review queue" hard-coded to the reviewer role [AUDIT T3 #11] | Figures link to filtered lists in the director's own scope; skill rows link to the staff record with `student` and `skill` |
| Export what is on screen, and know what leaves | REQ RP-10; D36 | Signed PDF only, no row-per-evaluation [AUDIT T1] | ExportDrawer; a popover (A) or preview (B) says what the signed PDF and the evaluation-level CSV hold; one line names what is excluded |

## 2. Rules and inferences (flag to Romit)

- **Required for graduation = the program's checklist flag** (`skill.hgtc.required`, the asterisk "must be validated before graduation"), 52 skills. The term's mapped mandatory set holds only 3 skills for the graduating cohort, so it cannot answer readiness. Population, scope and evidence (RP-08 recount) still come from `populationRows`. [INFER]
- **Far behind = 2 or more required skills not achieved.** In the data the 3 far behind miss 18, 15 and 10. [INFER; dataset says 4 or more]
- **What blocks verification:** evidence in flux, kept from v2 `pendingReasons` (open sign-off request, awaiting approval, returned, reopened). Gaps never block. [v2; strategy/03 D3] Open requests blocking is v2's rule and is not decided; ledger Q3 is still open.
- **Lab fixture** (sample data only, one function `directorFixture`, same on every director screen): one one-short student's waiting request was answered Unmet on Oct 21 (so 3 of the 4 one short have a waiting request, as dataset story 2 says, and one record has a gap with nothing open); two complete records were verified on Oct 2 and a rule changed on Oct 20 (Oral medication, the required skill with most evidence), so they read Changed since verified. Verifying in the lab is kept on the page only.
- **D36 vs RP-10:** the CSV carries feedback (RP-10); self-ratings and private notes are excluded (task brief, D36). RP-10 also lists self-evaluations and review notes, so this is a conflict to settle. The seed has no feedback text; the preview shows "None recorded".
- **Cohort is a filter**, preselected to the graduating cohort (the next graduation year). Choosing Any writes `cohort=any`. The shared scope bar shows the applied cohort as a removable chip, which costs a second row of 32 px.

## 3. Screens and variants

### Dashboard (tier 1, dashboard budget)

```
| Dashboard                                                          |
| [Term][Cohort BSN 2026][Course][Filters]       As of 06:47 [r] [Sample] |   scope bar, sm (32 px)
| [Cohort: BSN 2026 x] Clear filters                                 |
```

| Variant | Mental model | First viewport (regions) | DS per region | Tests |
|---|---|---|---|---|
| A Readiness pipeline (recommended) | Funnel to verification | header · scope · pipeline card (unit chart: 31 Complete / 4 One skill short / 3 Far behind, hatched where a request is open, "29 ready to verify") · Ready to verify table (6 rows, All 29) · Not complete list (7) | PageHeader (PageFrame), Select, Popover, FilterBar, Button, Badge, Card, Tip, DataTable, PersonIdentityCell, StatusBadge, LocalBanner | Does seeing the cohort as complete, one short and far behind, with open requests overlaid, tell the director who can be verified now? |
| B Blockers first | Which skill to chase | header · scope · 3 figures (KeyMetrics flat) · What blocks graduation (skills grouped by the exact students they block: Hangs PB Med 7, then "9 skills, the same students" 3, "5 skills" 2, "3 skills" 1; dot on a 0 to 38 track; Waiting and Only gap link) · Requests waiting on a blocking skill | KeyMetrics, Table, Tip, Card, LocalBanner | Does ranking the required skills that block graduation, with students per blocker and waiting requests, show what to chase? |
| C Verification worklist | Inbox | header · scope · status tabs (Ready 27, Changed since verified 2, Blocked 9, All 38) · DataTable with What stops it, Required, Last verified, Open; bulk "Open n for verification" only for like rows | Tabs + TabsCountBadge, DataTable (selectable, bulkActionsSlot), StatusBadge, Button | Is a table of every graduating student, with what stops each, the fastest way to verify? |

Lists behind figures: `?variant=C&list=complete|short|far|ready|gaps|waiting|only|has|progress|notmet&skill=` with the scope in the URL; a removable chip names the narrowing and "Showing n of 38" equals the figure (tested in `tests/lab/director.test.ts`).

### Verification detail (tier 2, detail budget)

| Variant | Layout | Tests |
|---|---|---|
| A Record view (recommended) | Record line (status, cohort, "51 of 52 required skills achieved", version) · Changed since verified banner when it applies · left: every required skill by section, gaps first, state glyph + word, evidence link, latest date · right (sticky): what stops verification, Gaps (n) with a checkbox each "{skill} not achieved", stamped "Acknowledged by Dr. K. Brennan, Oct 26", "The verified record will state", optional note, Verify record (only primary, disabled with the reason until every gap is acknowledged) | Does reading the whole record beside one decision panel support a verify decision? |
| B Checklist view | One reading column: 1 What changed, 2 Acknowledge each gap, 3 Spot-check the evidence (sections collapsed, short sections open), 4 Verify | Does stepping through change, gaps, spot check and verify support the decision? |

Default record: the first record with a gap that can be verified (Fiona Oyelaran in the sample, whose Hangs PB Med request was answered Unmet in the fixture). `?queue=` walks a bulk selection ("Next record, 2 of 3").

### Reports (tier 2, list budget)

| Variant | Layout | Tests |
|---|---|---|
| A One table, three views (recommended) | scope bar · view switch (By student / By skill / By section) + What each file holds + Export · DataTable · "Not in either file: self-ratings and private notes." | Does switching views on the shared scope, then exporting what is on screen, answer the reporting job? |
| B Preview what leaves | left: view switch + table · right: What leaves the program (PDF, signed / CSV tabs: PDF title, filters, signer, figures; CSV header and the 3 newest rows, row count), Export, excluded line | Does seeing the files before export build trust? |

By student: achieved, in progress, not met, attainment [RP-02]. By skill: achieved, in progress, not met, each a link to the students [RP-03, RP-05]. By section: the section links to the skill view filtered by that category. CSV: one row per evaluation of a required skill in scope (student, skill, date, outcome, evaluator, setting, location, feedback) [RP-10].

## 4. States (every screen)

loading: final-shape skeleton · empty (`?state=empty` or no required skill): "No skills are marked required for graduation" · filtered empty: names the filters, one Remove each · clear: everyone complete, nothing open (calm, says so) · error: per-region LocalBanner with Try again, says what is kept · partial: A and B hide the request overlay and say so · stale: the scope bar's "Figures from yesterday" badge.

## 5. Visual rules applied

Neutral ink for complete and every verification status (statuses name a step, not a judgement); amber (`--lab-viz-behind`) only for required skills not achieved; hatch for "request open" (an overlay, never a state). No red, no saturated blue, no progress bars (unit chart and dot plot instead). Controls `size="sm"` on one toolbar row; page title is the DS PageHeader.

## 6. Mobbin references (viewed 2026-10-26)

| # | Reference | What we took | Used in |
|---|---|---|---|
| M1 | [Vanta, Home: compliance progress and monitoring](https://mobbin.com/screens/eaeda897-a742-4213-834c-7025bcf3c7c1) | One readiness figure per framework with OK vs total, then "Needs attention" cards | A pipeline + ready figure |
| M2 | [Vanta, Tests: OK vs Needs attention over a filtered table](https://mobbin.com/screens/eb1d71b4-2b3c-4a83-8435-bdc0e7cbb9e2) | Two-number split above a table with filter chips and Clear | C (tabs with counts over one table) |
| M3 | [Vanta, Trust report: controls shown per category](https://mobbin.com/screens/ecd5d521-293f-4c90-a0bc-508b74813cc3) | "11 of 19" per category, the rule behind the count in a tooltip | Reports by section, B blocker groups |
| M4 | [Vanta, Controls list grouped by section with status](https://mobbin.com/screens/f989a00d-2e2c-4cb2-ae99-61cb6606476f) | Section-grouped rows, status at row end | Verification detail A record table |
| M5 | [Vanta, Program overview report](https://mobbin.com/screens/e6f27c45-3ee6-4985-93b5-180fdf160300) | Date and framework filters on one row, Share as the one action | Reports toolbar |
| M6 | [Klaviyo, Review submission checklist](https://mobbin.com/screens/02359910-64f7-4f23-8280-f1bf18c8e95f) | Each requirement its own row with state glyph, submit disabled until resolved | Verification detail B steps, gap rows |
| M7 | [Square, Contract signature before share](https://mobbin.com/screens/48205967-5bfe-4654-81bc-cec3162e4ff8) | Named signer and date as part of the act | Named acknowledgement stamp, signed PDF line |
| M8 | [Square, Export: scope and format each described](https://mobbin.com/screens/e4539b32-5313-4543-bb60-d95d76565c19) | Each format says what it holds; "matching applied filters" | What each file holds |
| M9 | [Plane, Export page: format and content](https://mobbin.com/screens/9e13ea5b-72e8-48ae-a506-35da61dbc49e) | Format and content chosen separately | Reports B preview tabs |
| M10 | [Snowflake, Trust Center: "1 not ready" leads to action](https://mobbin.com/screens/c04490cc-bbb7-432b-b656-ae5f279852d0) (from dashboard-concepts D15) | Readiness count that opens the people behind it | A and B figures linking to C |
| M11 | [Workable, distribution chart over the people table](https://mobbin.com/screens/a90f6805-b6e6-4d21-b15e-8c3258c48a9b) (from dashboard-concepts D14) | Chart directly above the people it describes | A pipeline above the ready table |

Anti-patterns seen: Vanta donut for two values (M1 sibling) and green progress bars on every card (M1, M3); we use a unit chart and a dot plot instead.

## 7. Open questions for Romit

1. May a record with an open sign-off request be verified (gaps acknowledged), or does the open request block as in v2? (ledger Q3)
2. Far behind threshold: 2 or more (lab) or 4 or more (dataset 7% story)?
3. CSV contents: RP-10 says self-evaluations and review notes; D36 and this brief exclude self-ratings and private notes.
4. Director nav: the persona still lists Dashboard and Attainment; Reports is reachable by URL only. The ledger's 2-row director nav is not decided.

## 8. Density audit (strategy/07 method, measured 2026-10-26 at 1440 x 900)

Measured with the `measure()` function of `admin/tests/lab/density-budget.mjs` on the director routes (the script's routes are fixed to the admin dashboards, so a scratch copy pointed at these URLs; it applies the dashboard budget to every page).

| Screen | Regions | Figures | Charts | Controls above first chart or table | Words | Hues | Repeats |
|---|---|---|---|---|---|---|---|
| Dashboard A | 5/5 | 4/4 | 1/2 | 7/8 | 15/40 | 1 (amber) | 0 |
| Dashboard B | 5/5 | 3/4 | 1/2 | 7/8 | 6/40 | 0 | 0 |
| Dashboard C (list) | 4 | 0 (tab counts) | 0 | 11 (scope 7 + 4 tabs); list budget is 6 | 0 | 0 | 0 |
| Verification A (detail) | 4/5 | 1/4 | 0 | 0 | 26/40 | 0 | 0 |
| Verification A, changed | 5/5 | 1/4 | 0 | 0 | 38/40 | 0 | 0 |
| Verification B (detail) | 5/5 | 1/4 | 0 | 7 (section toggles); detail budget is 6 | 40/40 | 0 | 0 |
| Reports A (list) | 4 | 0 | 0 | 12 (scope 7, 3-segment view switch, file info, Export) | 0 | 0 | 0 |
| Reports B (list) | 5 | 0 | 0 | 13 (scope 7, view switch 3, Export, 2 preview tabs) | 27 | 0 | 0 |

Over budget: C and both Reports on controls. Two of the scope bar's seven are the applied-cohort chip and Clear filters, shown because the cohort is preselected. "Primary" reads 2 on the detail pages and 28 on C because the DS Checkbox carries `data-variant=default`; the only filled Button is Verify record (checked in the page).
