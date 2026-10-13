# Design Contract: S-02 Student drill-down

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only) · `[CALL 09-23]` · `[CALL 03-05]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08


## 1. Surface and wave

**Surface.**
S-02 Student drill-down (rail level 2 of the S-01 → S-02 → S-03 chain)   Wave: W5

## 2. Persona and RBAC

P-A Program administrator. [REQ §11]. RBAC row: Administrator (program scope; the exxat-domain-context 'Super Program Admin' row), own program only, "no cross-program data" [exxat-domain-context RBAC table]. Student view of the same data is S-15 / S-14, not this surface.

## 3. Scope and data seen

One student of the admin's program: name, cohort, group, per-skill status (AE-04), criteria text, n of N progress, per-level strip, per-setting progress. Evidence rows are one level down in S-03.  
Must NOT show: other students' data in this rail; self-evaluation text or reviewer notes (those are in S-03 evaluation detail); contact details of evaluators.

## 4. Job to be done and why

**Job-to-be-done.**
When a number on the Overview looks wrong or worrying, I want to open that one student's record across all skills, so I can see exactly where they are short and why.

**Why → So what.**
Why: aggregates are only trusted if the individual behind them is reachable [REQ RP-05, RP-06; journeys/01 stage F-G]. So what: the admin sees "Wound Care: 4 of 4 demonstrations, still needs 1 in Inpatient and 1 in Emergency" in one place and can decide on follow-up outside the product (remediation is out of scope).

## 5. Requirements and open decisions

**Requirements.**
RP-05, RP-06, AE-03, AE-04, AE-05, SC-10 (per-level minimums shown), SC-11 and SC-12 (per-setting minimums; lab never counts toward clinical settings), SH-05 (admin sees the same per-setting truth, [INFER]), RP-08 (rail respects active location/setting filter and says so), SL-11, IM-09.

**Open decisions hit.**
OD-03: the counter row renders from the four-state enum behind the same display flag as S-01 (`skillStatusDisplay` = "four" | "merged"); both renderings specified; neither committed.  
OD-11: shows no evaluator-quality indicators. OD-02: no competency links. OD-17 does not apply (that is evaluator-facing S-16).

## 6. Prototype reference (keep / do not copy)

docs/source/screens/02 (student panel), 06 (evidence under a skill).  
KEEP [PROTO 02]: counters with "Show these only" filter-in-place; criteria text under each skill; n/N progress per skill.  
DO NOT COPY: "Not Started" for a no-evidence skill counted inside "Not met" (DEFECT-04); a modal over the table (use a non-modal rail so the table stays usable, P-07); "7 / 5" ratio notation without words (write "7 of 5").

## 7. Pattern and reference hub

Non-modal right rail, `FloatingSheetPanel` size lg, opened from an S-01 row via railTriggerProps; selecting another row swaps the content (docs/ux/08 P-07). Alternative the same chain allows: a route `/students/:id/skills/:skillId` (deep link, print) — decision deferred to Romit review; both satisfy RP-05/06.  
Reference hubs in repo (read): apps/pce/admin/app/(app)/results/[id]/page.tsx lines ~79-90 and imports at ~154 (FloatingSheetPanel, FloatingSheetPanelBody used for "View all responses"); apps/pce/admin/components/pce/evaluation-card-sheet.tsx (an evaluation inspector sheet); apps/pce/admin/app/(app)/admin/students/[id]/page.tsx (student record layout: Avatar + KeyMetrics + DataTable; shows how PCE presents one student).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `FloatingSheetPanel` IMPORT (use `railTriggerProps` on the row that opens it). C-12 and C-13 are HAND-ROLL on text rows + Badge. Same status-tone mapping as S-01.


Verified with `node tools/ds/source.mjs` 1.5.1 (and name-diffed to PCE's pinned 1.6.5: components below exist in both; prop drift not diffed).  
FloatingSheetPanel ✓ + FloatingSheetPanelBody (IMPORT; single rail, `exclusive` prop) · Breadcrumb ✓ (level trail inside the rail) · Accordion ✓ / Collapsible ✓ (skill rows expand to S-03 ledger) · StatusBadge ✓ semantic (size sm|md) for state · Badge ✓ (per-level strip chips) · ProgressCell ✓ (optional, numbers first) · ToggleGroup ✓ (Radix Root; "Show these only" as a single-select group — `type="single"` is a Radix root prop but is NOT visible in the .d.ts output I read, so VERIFY against the pinned version; otherwise use Button variant=ghost toggles) · Avatar ✓ (24px min disc) · Skeleton ✓ · LocalBanner ✓ · Button ✓ (explicit variant+size; Close = ghost icon button with aria-label).  
Custom compositions: C-12 progress-by-setting, C-13 per-level strip (docs/ux/10 §5). Both HAND-ROLL on DS primitives (text rows + Badge); no new shared primitive. Verdict pending ds-adoption-reviewer.

## 9. Layout, content and behaviour

See the wireframe for S-02 in docs/ux/07 and the sections around this one; no additional layout rules were drafted.

## 10. States (L E Er V S Su D P Bl)

L   Rail opens immediately with title and counter skeleton, then skill rows skeleton; swapping students keeps the rail frame and shows row skeletons (P-14).  
E   No skills in scope for this student with current filters: "No skills are in scope for this student with the current filters." with "Clear filters" action that acts on the S-01 filters. Student has skills but zero evidence: rows show the "No evidence yet" label, not an empty rail.  
Er  Fetch error inside the rail: LocalBanner error "This student's record could not be loaded. Try again." Rail stays open, S-01 table untouched (P-17).  
V   n/a (read-only).  
S   n/a (no writes).  
Su  n/a.  
D   "Show these only" disabled when its count is 0, with the count visible. Prev/next student buttons disabled at the ends of the current table order.  
P   Skill with pending approvals: row shows "n waiting, not counted yet" and the status is computed without them (AE-01, AR-06). While a rule is being re-applied the row shows "Recalculating".  
Bl  n/a. If the admin lacks access to this student (cross-program): "You do not have access to this record." No student name leaked (P-17 permission row).

## 11. Edge cases

EC-5 (setting minimum with lab-only evidence: lab shown separately, not counted), EC-6, EC-8 (level removed: evidence kept, no longer counts toward that level), EC-10, EC-11 (unmapped skill evidence counts), EC-26 (two students same name: header shows cohort and group), EC-23 (location/setting filter recalculates counts shown in rail and says so), plus DEFECT-07 case (4 of 4 demonstrations but a setting minimum unmet must show the unmet item).

## 12. Copy and interactions

**Copy.**
docs/ux/09 §5 S-02 (heading, subline, counters, row, empty) and §4 (four-state labels incl. merged form), §7.2 skill-level reasons (the same generator the student sees, so both read the same sentence; max three unmet criteria, most actionable first, never the word "failed", never red text). Do not ship the §9 list.

**Interactions.**
docs/ux/08 P-07 (chain, URL state `?student=…&skill=…&evaluation=…`, browser Back mirrors levels), P-18 (explaining outcomes and per-setting progress), P-13, P-14, P-17.

## 13. Accessibility (WCAG 2.1 AA)

Rail = role="complementary" labelled by its title; focus moves to the rail title on open, Tab order Back, content, Close; Esc closes one level then the rail; focus returns to the originating row (P-13). Level changes announced in a polite live region. Counters are text with numbers, never colour only. Rows are buttons or links with accessible names "{Skill}, {status}, {n} of {N}". Axe on rail open, empty, error and swapped states.

## 14. Out of scope

REQ §14 items; remediation actions or flags on the student; intervention notes; comparisons between students; peer ranking; heatmaps and preceptor-consistency views [CALL 09-23 phase 2]; editing anything (read surface); competency linkage (OD-02); notifications.

## 15. Acceptance tests (Given / When / Then)

RP-05   Given I selected a student row in S-01, When the rail opens, Then I see every in-scope skill with its state and progress and the S-01 table, filters and scroll position are unchanged.  
RP-06   Given a skill row, When I expand it or choose View evidence, Then S-03 shows the underlying evidence without leaving the rail or re-searching.  
AE-03   Given IV Insertion needing 5 total with minimums 1/1/3, When the student has 7 total with Observed 2, With assistance 1, Independent 4, Then the row shows Achieved and the strip reads "Observed 2 of 1 · With assistance 1 of 1 · Independent 4 of 3".  
AE-03b  Given Wound Care needing 4 total plus 1 in Inpatient and 1 in Emergency, When the student has 4 demonstrations and none in Emergency, Then the row is In progress and states "Still needed: 1 in Emergency" (DEFECT-07 resolved).  
AE-04   Given one skill with no evidence and another whose evidence does not qualify, When skillStatusDisplay = "four", Then the counters show them separately; When "merged", Then both count under "Not met".  
AE-05   Given the student has evidence for IV Insertion in two courses, When I view the rail, Then there is one IV Insertion record and the filter row states the course scope if one is applied.  
SC-12   Given 2 lab demonstrations and 0 clinical in Inpatient, When the setting minimum is 1 in Inpatient, Then the setting line reads 0 of 1 and shows lab evidence separately as not counted toward clinical settings.  
RP-08   Given the Overview has Setting = Emergency, When I open the rail, Then counts reflect only Emergency evidence and the rail says "Counting evidence recorded in Emergency only" with a "Show all evidence" control.  
SL-11   Given a skill was deactivated, When I open the rail, Then that skill is not listed as in scope.  
IM-09   Given an unconfigured skill, When I open the rail, Then it is not listed.  
SH-05   Given a skill with setting minimums, When I view the row, Then per-setting progress for each named setting is visible without opening another level.
SC-10   Given IV Insertion needs 5 total with minimums 1 observed, 1 with assistance, 3 independent, When a student has 6 total and 0 with assistance, Then the level strip reads With assistance 0 of 1, the skill is In progress, and the unmet minimum is named.
SC-11   Given Wound Care needs 1 in Inpatient and 1 in Emergency, When the student has 3 Inpatient and 0 Emergency demonstrations, Then the setting lines read 3 of 1 (met) and 0 of 1, the skill is In progress, and progress is counted per setting, not as one clinical total.

## 16. Risks and unknowns (max 3)

(1) Rail vs route is undecided; rail state in the URL must work either way or deep links break. (2) Names are not unique (DEFECT-09); the rail header needs cohort + group and ideally an identifier. (3) Whether `ToggleGroup` supports single-select is unverified in this environment; fall back is defined above.

## 17. Vault notes consulted

Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md (raw; "for a specific student ... bottom 20% lagging"); Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md ("students lack a comprehensive view of progress toward graduation"); Meetings/exxat/2026-08-19-curriculum-mapping-competency-demo.md (competency module already has a per-student status dashboard; consistency reference); _Insights.md (searched).

## 18. Open questions for Romit

rail or route for the S-01 → S-02 → S-03 chain? Proposal [INFER]: rail (scan many students quickly), with a deep-link URL so a shared link reopens the same view.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** The student record is a 1024px DS Dialog opened from a By-student row (URL `?student=<id>`; the old `/overview/students/[id]` route redirects). It lists the student's skills with status, `n / N` progress and the per-level and per-setting breakdown; a skill row opens S-03 as a second dialog (`?skill=`). Esc closes only the top dialog. The `FloatingSheetPanel` rail is no longer used.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-02 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** RP-02, RP-05, RP-06, SH-03/SH-05 reason text (DEFECT-07: '4 of 4' with the missing settings stated), AE-03/AE-04, SL-11, IM-09, student scope and no peer data.

**Weakened or traded away (honest list):** The non-modal rail let the hub behind stay clickable and keep its scroll and focus; a modal dialog does not (focus trap, background inert). Stacked dialogs (record, then evaluation) replace rail-to-rail navigation, so breadcrumb-style back is Esc plus the dialog title, not a persistent trail.
