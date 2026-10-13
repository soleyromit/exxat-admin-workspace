# Design Contract: S-01 Overview (attainment)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only) · `[CALL 09-23]` · `[CALL 03-05]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08


## 1. Surface and wave

**Surface.**
S-01 Overview (attainment): tabs By student · By skill · By tag, filter rail, KPI strip   Wave: W5

## 2. Persona and RBAC

P-A Program administrator (reads). P-R is the same admin role wearing the approval hat; no separate access. [REQ §11 "Programs need to see attainment across a population"]  
RBAC row: Administrator (program scope; the exxat-domain-context 'Super Program Admin' row), "full read/write ... for their assigned program; no cross-program data" [exxat-domain-context RBAC table]. Admin sub-roles are undefined in REQ (gap G-8, docs/strategy/07): this surface assumes one admin role.

## 3. Scope and data seen

Students, cohorts, groups, courses, categories, tags, locations, settings of the admin's own program only. Student names and per-skill state. Evaluator names appear only after drill-down (S-03).  
Must NOT show: other programs' data; evaluator or site quality analytics, heatmaps [CALL 09-23 line 74: "Heatmap reports and all, where that we need to talk to Sarah"; discovery with Sarah pending], preceptor consistency [OD-11 deferred; CALL 09-23 line 76: "That could be phase 2, could be later"].

## 4. Job to be done and why

**Job-to-be-done.**
When I need to know whether a cohort is practice-ready, I want to see attainment by student, skill and tag and reach the evidence behind any number, so I can intervene early and defend the figure to an accreditor.

**Why → So what.**
Why: replaces disconnected forms and spreadsheets; "program-level visibility" [REQ §1.2]. So what: the admin can go from "6 skills below 50%" to the single evaluation behind it without restarting the search [REQ §11 intro; journeys/01-admin-journey.md stage F-G; moment of truth 4: "can I show an accreditor the evaluation behind this number?"].

## 5. Requirements and open decisions

**Requirements.**
RP-01, RP-02, RP-03, RP-04, RP-05, RP-06, RP-08, RP-09, RP-10 (entry point; the export artifact itself is S-17), AE-01, AE-03, AE-04, AE-05, AE-02, SL-11 (deactivated skills leave reporting scope), IM-09 (unconfigured skills are not in scope). RP-07 lives in S-03.

**Open decisions hit.**
OD-03 (four states vs merged "Not met"): seam = one display flag `skillStatusDisplay` = "four" | "merged"; data layer stores the AE-04 four-state enum always. Both renderings specified below; neither committed.  
OD-10 (CSV vs Excel): Export is a format adapter; the control here only opens S-17.  
OD-11 (evaluator and site dimension): location and setting are filters because RP-01 requires them; no evaluator dimension, no site-quality view is built. Evaluator/location are captured per evidence row regardless.  
OD-02: no skill-to-competency linkage column. OD-05, OD-06, OD-09: not touched.

## 6. Prototype reference (keep / do not copy)

docs/source/screens/01 (by student), 03 (by skill), 04 (by tag), 05 (filters), 25 (export menu).  
KEEP [PROTO]: KPI strip; three tabs; the honesty footnotes (by-skill denominator caveat, by-tag overlap note); Export beside tabs; scope sentence under the filters.  
DO NOT COPY: "Not met" lumping of no-evidence and does-not-qualify as a committed answer (DEFECT-04); attainment progress bars as the main visual; uppercase tracking labels; identical names without an identifier (DEFECT-09); the KPI set as if it were REQ (it is a [PROTO] choice).

## 7. Pattern and reference hub

Route (hub). View tabs + FilterBar + KeyMetrics + DataTable; drill opens S-02 in a non-modal right rail (docs/ux/08 P-07). Reference hubs in repo (read, not guessed):  
apps/pce/admin/app/(app)/analytics/page.tsx (tabbed analytics hub, Tabs + scope Selects + lazy panels + Skeleton);  
apps/pce/admin/app/(app)/admin/courses/page.tsx (KeyMetrics strip + DataTablePaginated list);  
apps/pce/admin/app/(app)/admin/students/[id]/page.tsx (student record with KeyMetrics + DataTable, an analogue for the S-02 content);  
apps/pce/admin/app/(app)/results/[id]/page.tsx (FloatingSheetPanel rail opened from a card, "View all responses").  
Caveat: PCE imports a LOCAL DataTable (`@/components/data-table`, 5 files, built before the package exported DataTable). ds-adoption-reviewer verdict: do NOT copy it; import `DataTable` and `DataTablePaginated` from `@exxatdesignux/ui`. The registry rows in `docs/governance/ds-adoption.md` that say VENDOR are stale (not edited here).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** Status chips: `No evidence yet` → `neutral`, `Evidence does not qualify` → `warning` (never red), `In progress` → `info`, `Achieved` → `success`, through the shared `SkillStatusBadge` wrapper (cross-cutting §5) which wraps IMPORT. EmptyState = VENDOR (`apps/pce/admin/components/empty-state.tsx`). ChartCard = VENDOR only if charts are confirmed. C-16 is one `LocalBanner variant="info"` use, not a component file.


Verified with `node tools/ds/source.mjs` (1.5.1, 2026-10-08); export lists of 1.5.1 and PCE's pinned 1.6.5 diffed by name: 1.6.5 only adds Carousel, DropdownButton, WhatsNew*, PageHeaderScrollActions*; every component below exists in both. Prop-level drift between versions is NOT diffed (see docs/ux/10 version-pin warning).  
PageHeader ✓ IMPORT (title + actions; page title type is built in) · KeyMetrics ✓ IMPORT (≤4 items, flat/compact) · Tabs ✓ IMPORT (or ViewSegmentedControl ✓ with aria-label) · FilterBar ✓ + FilterBarAddButton + FilterBarClearButton IMPORT · DataTable ✓ / DataTablePaginated ✓ IMPORT (never raw table) · ProgressCell ✓ IMPORT for the attainment cell only · StatusBadge ✓ (semantic label+tone+icon: size sm|md only) IMPORT for state cells · Select ✓ (sort) · Input ✓ (search) · FloatingSheetPanel ✓ (rail, hosts S-02/S-03) · LocalBanner ✓ (info/error/success) · Skeleton ✓ · Button ✓ (explicit variant + size) · DropdownMenu ✓ (Export) · Tooltip ✓.  
Not exported (do not assume): Pagination (use DataTablePaginated), Progress, ChartContainer, ChartCard, EmptyState, MultiSelect, Combobox. Needed compositions: filter-value pickers (Popover + Command + Checkbox, the sanctioned multi-select gap), EmptyState (VENDOR candidate apps/pce/admin/components/empty-state.tsx), C-16 impossible-filter explainer (LocalBanner info).  
Viz: numbers first. No progress-bar-only viz. No red in attainment viz (Aarti, memory). A distribution chart for By skill is optional and, if wanted, uses vendored ChartCard/ChartFigure from apps/pce/admin/components/charts-core.tsx (verify before reuse). Verdicts: IMPORT for all ✓ rows; VENDOR for EmptyState and any chart; HAND-ROLL only filter pickers and C-16 — all pending ds-adoption-reviewer.

## 9. Layout, content and behaviour

See the wireframe for S-01 in docs/ux/07 and the sections around this one; no additional layout rules were drafted.

## 10. States (L E Er V S Su D P Bl)

L   First load: skeleton in final shape (KPI strip 4 cells, 8 table rows, tab bar). Filter or sort change: previous rows stay dimmed for up to 400 ms, then skeleton rows; polite live region "Updating results" (docs/ux/08 P-14).  
E   No students match the filters: "No students match these filters. Clear filters to see everyone in scope." with Clear. No configured skills at all: "No configured skills yet. Configure skills in the library to see attainment here." with link to S-04. Valid combination but no evidence: "No evidence recorded for this combination yet." [strategy/06 §1 Reports]  
Er  Fetch failure: LocalBanner error "Attainment could not be loaded. Try again." with Try again; filters kept. Export failure: S-17.  
V   Group filter disabled until a cohort is chosen, reason shown as helper text "Select a cohort first" [PROTO 05, REQ RP-01 silent on dependency, INFER].  
S   Export opens S-17 and shows "Preparing export" there. Applying filters is S-level loading above.  
Su  Export completed: LocalBanner success states the filters recorded in the file header [REQ RP-10].  
D   Export disabled while data is loading or zero rows with a reason; filter chips are never disabled. Row open disabled only while that row's data loads.  
P   Mixed: "Showing 25 of 150 students" with "Show 25 more"; By-tag counts are student-skill records, not students (stated). While rules recalc (AE-02) a badge shows "Recalculating" rather than a stale state [docs/ux/08 P-14].  
Bl  Impossible location x setting combination (RP-09): table region replaced by LocalBanner info "No evidence can match this combination. {Location} does not offer {setting}. Choose a different setting or location." with inline "Remove {setting}" and "Remove {location}"; KPIs show "—" not 0.

## 11. Edge cases

EC-21 (tag spans categories: overlap note), EC-22 (filter location + setting not offered: explain), EC-23 (location/setting filter recomputes progress from only that evidence), EC-24 (export while filtered covers full scope, filters in header), EC-26 (same name twice: show cohort and an identifier), EC-10 (deactivated skill leaves scope, evidence retained), EC-6 (rule edit changes status of existing evidence), EC-28 (unconfigured skills are excluded from scope).

## 12. Copy and interactions

**Copy.**
docs/ux/09 §4 (four-state labels incl. merged form) and §5 S-01; failed/why copy not needed here. Impossible filter and scope sentence copy in 09 S-01 table. Do not ship any prototype string on the §9 list.

**Interactions.**
docs/ux/08 P-06 (filters, impossible combos, recalculation sentence), P-07 (drill chain, rail state in URL, by-skill and by-tag rows reach individuals), P-14 (loading), P-13 (keyboard), P-17 (error recovery).

## 13. Accessibility (WCAG 2.1 AA)

Tabs with roving tabindex; FilterBar chip group named "Applied filters", each chip remove control `aria-label="Remove filter {dimension} {value}"`, Backspace/Delete removes a focused chip and moves focus to the next chip or Add filter (P-06). Table: DS grid semantics, `aria-sort`, `aria-rowcount` for 150+ rows, sticky header must not hide the focused row (WCAG 2.4.11). Status always text (not colour only, 1.4.1); percentages as text beside any ProgressCell. Scope sentence mirrors the chips for screen readers. Rail: role="complementary", focus moves into rail on open and back to the row on close (P-13). Axe on default + filtered + impossible-combination + rail-open states before any done claim.

## 14. Out of scope

REQ §14: remediation, notifications, skill expiry, patient-encounter linkage, accreditation-ready outputs beyond exports, Evaluations migration. Call-only items not in REQ: heatmaps, preceptor-consistency or site-quality reports, bottom-20% auto-lists as a feature (CALL 09-23 mentions the need; REQ RP-02 covers sort and filter only), batch student x skill grid (OD-19), QR. No competency linkage (OD-02). No saved views. No scheduled reports.

## 15. Acceptance tests (Given / When / Then)

RP-01   Given filters Cohort BSN 2026 and Setting Inpatient, When I view Overview, Then each filter appears as a chip, the scope sentence names both, and removing the Setting chip alone restores setting scope without touching the cohort chip.  
RP-02   Given a student with 7 achieved, 0 in progress and 2 not achieved, When I view By student, Then the row shows those counts and an attainment of 7 of 9.  
RP-03   Given a clinical-course filter is applied, When I view By skill, Then each skill row shows whether it is mandatory for that course; Given no course filter, Then no mandatory column is shown.  
RP-04   Given a skill carries Tags A and B, When I view By tag, Then it is counted under both rows and the page states that the rows overlap and count student-skill records.  
RP-05   Given any figure (student row, skill row, tag row), When I select it, Then I reach the individual students or student-skill pairs behind it in the rail without losing the table or its filters.  
RP-06   Given a student in the rail, When I open a skill, Then I see the evidence ledger without re-searching (S-03).  
RP-08   Given Setting = Emergency, When the table renders, Then progress and states count only evidence recorded in Emergency, the scope sentence says "Counting evidence recorded in Emergency only", and clearing the chip restores the full counts.  
RP-09   Given Location = Mercy Home Health and Setting = Emergency and that location does not offer Emergency, When both are applied, Then no empty table is shown, an info banner explains why with two remove actions, and KPIs read "—".  
RP-10   Given active filters, When I open Export, Then both the aggregate and the row-per-evaluation exports are offered, cover the full filtered scope (not the visible 25 rows) and record the filters in the file (verified in S-17 contract).  
AE-04   Given a skill with evidence that does not qualify and another with none, When skillStatusDisplay = "four", Then they appear in separate columns; When = "merged", Then both appear under "Not met"; the underlying state values are identical in both modes.  
AE-03   Given a demonstration skill needing 5 total with 1 observed, 1 assisted, 3 independent, When a student has 6 total but 0 assisted, Then the skill is In progress, not Achieved.  
AE-05   Given a student's evidence for one skill across two courses, When I filter to one course, Then the skill still shows one record and the filtered view says the figure is course-scoped.  
AE-01   Given 2 submissions awaiting approval, When I view the skill, Then they are excluded from the achieved count.  
SL-11   Given a skill is deactivated, When I view Overview, Then it is absent from the skill list and from "skills in scope" while student evidence remains reachable from S-03 history.
AE-02   Given a skill's qualification rule is edited (for example from "at least 3 of 4" to "all 4") and 12 students hold evidence for it, When the rule is saved and I reopen Overview, Then those students' states follow the new rule, no recorded response is changed, and while recalculating the affected cells show "Recalculating" instead of a stale state.
IM-09   Given an imported skill that is still unconfigured, When I view any Overview tab, Then it is not in "skills in scope" or the By skill table, and a line "{n} skills need configuration" links to the library worklist.
RP-07   Given I follow a student and skill from Overview to an evaluation, When I open it, Then S-03 shows the full evaluation (answers, scores, feedback, student-supplied details), never only a summary such as "9 of 12 answered Yes" (tested in S-03).

## 16. Risks and unknowns (max 3)

(1) Overview mixes aggregate and individual identity: duplicate names with no identifier (DEFECT-09) will cause misreads; need a stable identifier or cohort line in the row. (2) Recomputing 150 students x N skills on every filter (AE-02 re-application) may be slow; needs a derived-state strategy (docs/build/01 §7). (3) Which KPIs are right is unvalidated: the four are [PROTO] choices, not REQ; the proposed metric "Skills needing attention below 50%" has no source threshold.

## 17. Vault notes consulted

Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md (raw; reporting section: where students lag by skill, cohort bottom 20%, heatmaps need discovery with Sarah (line 74); preceptor-consistency reporting "could be phase 2" (line 76)); Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md (cross-placement aggregate gap); Meetings/exxat/2026-08-19-curriculum-mapping-competency-demo.md (competency module already has a student-level dashboard with per-student status and distribution charts; consistency reference only, line 22); _Insights.md (searched for skills/competency/accreditation themes). Not re-pulled: Granola search results.

## 18. Open questions for Romit

Should By student default-sort to Lowest attainment (spot laggards first, per CALL 09-23 "where are they lagging") instead of the prototype's Highest? Proposal [INFER]: Lowest first. Not an OD.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-9 and §M-10. Strong: removable filter chips with Clear all, export beside the table, row opens a detail panel (Navattic, Mixpanel, AirOps, Semrush). Empty-after-filter keeps chips visible with a Clear action (OpenSea, Delphi); no precedent for explaining why a specific combination cannot produce evidence (RP-09).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Overview is the prototype page in the shell: one bordered Filters bar (`Filters` button, applied-filter chips, `Showing everything`), the context line, four bordered KPI cards, tabs with icons (By student / By skill / By tag) with search, sort and `Export` on the right of the tab row, tables with the attainment cell (percentage plus `ProgressCell` bar) and the `Show 25 more` footer. The student drill-down and the evaluation view are 1024px dialogs (see S-02, S-03), not a rail. Export is a two-item popover (S-17). Default sort is Highest attainment (prototype). The default status display is now `merged` (Achieved / In progress / Not met, where Not met includes no evidence yet) via `skillStatusDisplay` (parity C-1); the engine stays four-state and `/dev/state` switches the flag. The extra '2 skills need configuration' line was removed (the prototype has none).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-01, P-01b in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** RP-01..RP-11, RP-08 recompute, RP-09 impossible-filter explanation (prototype layout: 'No evidence matches these filters' plus the reason), RP-04 overlap statement, RP-03 mandatory flag when course-scoped, AE-04 four-state enum in the engine and exports, SC-10..SC-12 reasons, OD-03 stays OPEN behind the flag.

**Weakened or traded away (honest list):** (1) The visible default hides the AE-04 distinction between no evidence and evidence that does not qualify (only the flag restores it; OD-03). (2) Default sort is Highest attainment, replacing this contract's proposed lowest-first (a proposal, not a requirement). (3) IM-10's count entry point is no longer on the Overview; it stays on S-04 (banner and `?status=unconfigured`). (4) Filters are an inline panel, not removable chips for every dimension in the bar, so RP-01 'each filter removable on its own' relies on the chips shown once applied (tested).
