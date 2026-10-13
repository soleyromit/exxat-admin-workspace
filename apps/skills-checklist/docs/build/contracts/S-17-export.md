# Design contract — S-17 Export (aggregate and evidence detail)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
**Surface:** S-17 (opened from the S-01 toolbar) · **Flow:** F-12 · **Wave:** W5 (Reporting + export) · **Patterns:** P-06 (filter chips), P-14 (loading), P-17 (error recovery), `ux/09 §5 S-17`.

## 1. Surface and wave

Design contract — S-17 Export (aggregate and evidence detail). Wave: W5 (docs/build/01-build-plan.md §4). Derived from the contract title; no separate surface label was drafted.

## 2. Persona and RBAC

| Item | Value | Source |
|---|---|---|
| Persona | P-A program administrator (primary). P-R reviewer is an administrator acting in approval | `[REQ §11]`, `docs/ux/03 §9` |
| RBAC row | Administrator (program scope; exxat-domain-context 'Super Program Admin' row): full read/write across compliance and curriculum **for their assigned program**; no cross-program data | `[exxat-domain-context RBAC]` |
| Sees / exports | Whatever the admin's program scope and the applied filters match | `[REQ RP-10]` |
| Must never get | Another program's students; raw evaluator link tokens; free-text from other programs | `[INFER]` |
| Permissions-matrix note | `ux/03 §9` shows P-A "W" and P-R "R" on S-17; "R" for an export action is unclear (export is a read that produces a file). Proposed: any role that can read S-01 may export what it can read; confirm sub-roles (gap G-8) | `[INFER]` |

## 3. Scope and data seen

Covered in §2 (Persona and RBAC) and §5.

## 4. Job to be done and why

- **JTBD:** *When I need to share or analyse attainment outside Prism, I want to take exactly the view I am looking at, or every underlying evaluation, with the filters recorded, so that numbers in a spreadsheet can be traced back to evidence and reproduced.* `[REQ RP-10]`
- **Why:** Programs report to accreditors and faculty committees and still work in spreadsheets `[REQ §1.2 "Evidence of outcomes", §3 context]`. An export that silently covers only the visible page, or hides the filters, produces numbers nobody can defend.
- **So what:** Aggregate export lets leadership see cohort attainment; the evidence-detail export is the audit trail (feedback, settings, locations, self-evaluations, review notes). Both must be reproducible from the recorded filters.

## 5. Requirements and open decisions

**Requirements.**
| ID | How S-17 satisfies it |
|---|---|
| RP-10 | Two exports: the aggregate view as shown, and one row per evaluation carrying feedback, settings, locations, self-evaluations and review notes; both cover the **full filtered scope** (not the visible 25 rows) and **record the filters** that produced them |
| RP-11 | Format is open (OD-10); the UI lists formats from configuration and ships CSV only |
| RP-01 | The filters applied on S-01 are the export scope; each chip removed on S-01 changes the export; S-17 shows the scope summary before creating |
| RP-02, RP-03, RP-04 | Aggregate export follows the active tab: by student, by skill or by tag; the tag export states that figures overlap (RP-04) |
| RP-07 | Evidence-detail rows contain the complete evaluation content, not only a summary such as "9 of 12 answered Yes" (per-question answers and scores) |
| RP-08 | When filtered by location or setting, only evidence gathered there is counted and exported; the file says so |
| RP-09 | A filter combination that cannot produce evidence is explained in the dialog instead of producing an empty file |
| AE-04 | Status columns carry the engine's **four-state enum** value irrespective of the display flag (OD-03) |
| SH-02 | Evidence-detail rows carry the submission outcome (counted, did not meet criteria, returned, waiting) |
| AR-04 | Review notes are included for evaluations that were reviewed |
| ST-05, ST-06 | Rows carry performed-in (clinical or lab), clinical setting and location |

**Open decisions and seams.**
| OD | Seam | Default |
|---|---|---|
| OD-10 CSV vs native Excel | An export service returns tabular rows; a format adapter turns rows into a file; the UI renders the format list from config | CSV only; do not claim Excel workbook support `[ux/09]` |
| OD-11 expose evaluator and site dimension | Evidence-detail rows always capture `evaluator` and `location` ids; whether an **evaluator** column is exported is a flag. Location is already required by RP-10 | Location column on; evaluator column off until OD-11 is decided `[INFER]` |
| OD-03 | Enum value column plus a display-label column driven by the flag | Both columns present |
| OD-05 | Evaluator identity shown as name only (no email) in v1 | Name only `[INFER]` |
| OD-24 | Evidence for a deactivated skill stays in exports (retained per SL-11) with the skill flagged inactive | Flag column `[INFER]` |

## 6. Prototype reference (keep / do not copy)

Screen `docs/source/screens/25-export-menu.png`; wireframe `docs/ux/07 S-17`.
**Keep `[PROTO]`:** exactly two choices, aggregate "this table" and "Evidence detail, one row per evaluation, with comments and setting"; the sentence that current filters are written into the file header.
**Do not copy:** describing the format as "CSV, opens in Excel" as the only story (OD-10); unnamed files; not exercised: the downloaded file itself (not downloaded in the walkthrough), so column set and header layout are unverified and must be designed from RP-10.

## 7. Pattern and reference hub

- **Entry:** `Export` button in the S-01 toolbar opens a `DropdownMenu` with two items: "Attainment summary" and "Evidence detail" `[docs/ux/09]`.
- **Choosing an item** opens a `Sheet` (right, size `sm`) titled "Export {type}" with: scope summary (chips read-only, count of rows that will be exported), a note about what is included, format (single option "CSV" until OD-10), and the single filled primary `Export`. If the scope produces zero rows or an impossible combination the sheet shows the explanation (RP-09) and the primary is disabled.
- Alternative considered: export directly from the menu with no sheet. Rejected as the default because the user cannot see that the export covers the full scope and not the visible rows `[INFER]`; kept as an option if testing shows the sheet is friction.
- **Progress:** button label "Preparing your export"; for large scopes the sheet stays open with a `LocalBanner variant="info"`; success `LocalBanner variant="success"` "Your export is ready." with the download.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `DropdownMenu` or `Sheet` for the entry point; format choice = `SelectionTileGrid interaction="radio"` (CSV only until OD-10). `LocalBanner` for success/error. All IMPORT.


| Need | Component | Verdict (proposal) |
|---|---|---|
| Menu | `DropdownMenu` (+ Trigger/Content/Item) | IMPORT |
| Scope sheet | `Sheet` `side="right"` `size="sm"` | IMPORT |
| Applied filters (read-only) | `FilterBar` chips in a read-only mode or `Badge` list | IMPORT; confirm read-only mode with `source.mjs FilterBar` |
| Primary and secondary | `Button` `variant="default"` for Export, `variant="outline"` for Cancel | IMPORT |
| Progress / result | `LocalBanner` `info` / `success` / `error` | IMPORT |
| Skeleton | `Skeleton` | IMPORT |
| Format select | `Select` (single option disabled-looking until OD-10) or plain text | IMPORT / omit |
| File creation | server-side service | not a UI component |
No raw buttons, no toast, no icon on the Export button, no hardcoded colours.

## 9. Layout, content and behaviour

**Common header block (every file):** report name, generated at, generated by (role, not email), program, applied filters as `name: value` lines, row count, scope statement ("All rows matching these filters", never "visible rows"), skill-status rendering note, tag-overlap note when exporting by tag. Because the prototype writes "the current filters are written into the file header" `[PROTO]`, the open question is how to keep the data table machine-readable: proposal is a leading block of lines starting with `#` then a blank line then the table, or a second file `filters.txt` in a zip. **Decision needed from the program/analyst users; default: leading `#` block.** `[INFER]`

| Export | Row grain | Columns (proposed) |
|---|---|---|
| Attainment by student | one per student | student identifier, name, cohort, group, skills in scope, achieved, in progress, did not qualify / no evidence (per flag), attainment % |
| Attainment by skill | one per skill | skill, category, tags, evaluation model, mandatory (if course-scoped), students in view, counts per state, % achieved, courses |
| Attainment by tag | one per tag | tag, skills, categories spanned, counts, % achieved, students achieving all; footnote that rows overlap `[RP-04]` |
| Evidence detail | one per evaluation | student, cohort, group, course (code, term), skill, performed in (clinical/lab), clinical setting, location, evaluator role (and name only if OD-11 flag), date, outcome recorded, qualifies (yes/no at export time), counts toward record (yes/no/waiting), per-question answers or levels or scores, evaluator comment, student-supplied details, student self-evaluation, review note, attempt number, revisions |
Rules: dates ISO 8601; booleans as words; one header row; UTF-8 with BOM only if Excel interoperability is tested `[INFER]`.

**Safety:** cells beginning with `=`, `+`, `-`, `@` are prefixed to prevent spreadsheet formula injection (comments and names are user-entered text) `[INFER; REQ silent]`. No evaluator link tokens or emails appear. PII minimisation: student identifier plus name only.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour | Source |
|---|---|---|
| **L** | Sheet opens with scope summary skeleton while the row count resolves | P-14 |
| **E** | "There is nothing to export for these filters." Primary disabled; offer Clear filters link | `ux/09` |
| **Er** | "The export could not be created. Try again." Filters preserved | P-17 |
| **V** | Not applicable (no user input except choosing the export) | — |
| **S** | Button "Preparing your export" `aria-busy`; cancel allowed before completion | P-14 |
| **Su** | Banner "Your export is ready." plus download action; row count and filters echoed | RP-10 |
| **D** | Primary disabled when zero rows or impossible combination | RP-09 |
| **P** | Very large scope: asynchronous; the user can close the sheet and is told where the file appears (location of completed exports is a question: notification is out of scope `[REQ §14]`, so the file must be retrievable in place) | `[INFER]` |
| **Bl** | Impossible combination explained: "{Location} does not offer {Setting}. Remove one of these filters to see evidence." | RP-09 |
| Permission | Role without read access cannot open the menu | cross-cutting §7 |

## 11. Edge cases

Filters changed while the export is being prepared (snapshot at press time); tab is By tag (overlap note); location filter set to a location that does not offer the chosen setting (RP-09); zero evidence for a skill in scope (row still appears with zero counts); student with the same name twice (identifier column); evidence recorded for a skill later deactivated (flag); free-text beginning with a formula character; very long comments; non-ASCII names; export run twice returns the same rows for the same data at the same time; attempt counts for revised submissions.

## 12. Copy and interactions

`docs/ux/09 §5 S-17` keys: Button "Export"; menu items; helper "The filters you have applied are recorded in the file. Exports cover everything that matches, not only the rows shown."; format label (OD-10, CSV only); progress "Preparing your export"; success "Your export is ready."; error "The export could not be created. Try again."; empty "There is nothing to export for these filters." Menu item names in `ux/07` ("Aggregate: this view") differ from `ux/09` ("Attainment summary"); this contract follows `09`.

## 13. Accessibility (WCAG 2.1 AA)

Menu and sheet follow P-13 (focus into sheet title, Esc closes, focus returns to the Export button); scope summary is text with the chips also readable as a list; progress changes are announced via a polite live region; the download action has an explicit accessible name including file type and row count; no timeout.

## 14. Out of scope

Native Excel workbook (OD-10 open); scheduled or emailed exports; accreditation-ready report packages beyond these exports `[REQ §14]`; PDF; charts in files; sharing links; exporting other modules' data.

## 15. Acceptance tests (Given / When / Then)

| # | REQ | Test |
|---|---|---|
| AT-1 | RP-10 | Given 150 students and a filter matching 40, when Attainment summary is exported, then the file has 40 rows, not 25, and the header lists the applied filters |
| AT-2 | RP-10 | Given any filter set, when Evidence detail is exported, then each row is one evaluation and includes feedback, setting, location, self-evaluation and review note columns |
| AT-3 | RP-10 | Given two different filter sets, when both are exported, then the headers differ and reproduce the filters |
| AT-4 | RP-11 | Given the format list, when rendered, then only CSV appears and no copy claims Excel workbook support |
| AT-5 | RP-07 | Given an evaluation with 12 questions, when exported, then all 12 answers are present, not only "9 of 12 Yes" |
| AT-6 | RP-08 | Given the setting filter Inpatient, when exported, then counts include only Inpatient clinical evidence and the file states the filter |
| AT-7 | RP-09 | Given location L that does not offer setting S, when both are applied, then the sheet explains why and Export is disabled |
| AT-8 | RP-04 | Given the By tag tab, when exported, then the file notes that tag rows overlap |
| AT-9 | RP-01 | Given a removed filter chip on S-01, when Export is opened, then the scope reflects the removal |
| AT-10 | AE-04 | Given a student with no evidence and one with failing evidence, when exported with display flag B, then the label column shows "Not met" for both and the enum column shows two different values |
| AT-11 | SH-02, AR-04 | Given an evaluation returned with a review note, when evidence detail is exported, then outcome "returned" and the note appear |
| AT-12 | ST-05, ST-06 | Given lab and clinical evidence, when exported, then performed-in, setting and location are populated correctly (setting empty for lab) |
| AT-13 | safety | Given a comment starting with "=", when exported, then it is neutralised and opens as text |
| AT-14 | scope | Given a role limited to program P, when exporting, then no rows from program Q appear |
| AT-15 | a11y | Given keyboard only, when exporting, then every step is reachable, focus returns to Export and success is announced |
| AT-16 | RP-02 | Given the By student tab, When I export Attainment summary, Then every student row appears with achieved, in progress and not met counts and attainment. |
| AT-17 | RP-03 | Given the By skill tab with a course filter, When I export Attainment summary, Then each skill row states whether it is mandatory for that course. |
| AT-18 | SL-11 | Given a skill deactivated after evidence was recorded, When I export Evidence detail, Then its evaluations remain in the file marked as an inactive skill, while Attainment summary excludes it from scope. |

## 16. Risks and unknowns (max 3)

1. **Header layout versus machine readability:** the requirement to record filters in the file conflicts with a clean table; wrong choice breaks analysts' imports.
2. **OD-10/OD-11 late changes:** adding Excel or an evaluator column later is cheap only if the service/adapter and flag seams exist.
3. **PII leakage in exports** (names, comments): scope and role checks must be server-side and tested.

## 17. Vault notes consulted

- `…/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw): reporting needs such as students lagging, cohort completion; heatmaps and preceptor-consistency reports raised as possible phase 2, not in REQ.
- `…/Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`: reporting gap from placement-bound evaluations.
- `docs/ux/07 S-17`, `09 §5 S-17`, `03 §9`, `06`, `docs/strategy/05, 06, 07`, `docs/source/prototype-text-dump.txt` export menu text; `_Insights.md` entries for the two meetings only.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

**Review log.**
| Reviewer | Verdict | Date |
|---|---|---|
| ds-adoption-reviewer | not yet run | — |
| skills-requirements-auditor | not yet run | — |
| skills-ux-critic | not yet run | — |
| Romit confirmation | pending | — |

**Contradictions found while drafting.**
1. `ux/07 S-17` item name "Aggregate: this view (By student)" vs `ux/09` "Attainment summary"; also the aggregate export covers the active tab, not always "By student".
2. `ux/03 §9` gives P-R "R" on S-17 while the surface is an action (see §2).
3. RP-10 says filters are recorded; neither the requirements nor the prototype show where in a CSV; §9 proposes an approach.
4. `ux/07` says no filled primary on the page and the menu items are the choices, while this contract adds a sheet with a filled primary; the menu items remain non-filled.

**Deviations from the cross-cutting contract.**
None.

## 20. What was not verified

The actual downloaded file in the prototype; Excel behaviour of CSV with BOM; DS `FilterBar` read-only mode; real data volumes; 1.6.5 exports; axe and runtime.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-12. Strong: scope radios with row counts (Wix), included-data list (HubSpot), field and column counts (Qatalog, Whop). No precedent for writing applied filters into the file header (RP-10).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Export is the prototype's popover on the right of the tab row, with two items ('By student — this table' and 'Evidence detail', per the prototype strings), not a Sheet with scope radios and a column picker. Both are CSV with the leading `#` header block recording the applied filters; the evidence export has one row per evaluation, including superseded ones with `evaluation_revision` and `superseded` columns.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-01 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** RP-10 (full filtered scope, filters recorded), RP-11/OD-10 (CSV only, Excel open), OD-11 (evaluator column off by default), AE-04 four-state value in the files regardless of the display flag.

**Weakened or traded away (honest list):** No scope radios, row-count preview or column picker (prototype popover has none), so the contract's Mobbin-inspired export dialog is not built; the evaluator column cannot be switched on from the UI (OD-11).
