# Admin: Attainment, Export, Settings, Deactivate / new list (design lab)

**Written:** 2026-10-26. **Consulted:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md`, `../strategy/02` (text budget), `../strategy/03` section 5.3, `../strategy/06` (scope bar, URL, as-of, drill rules, Section x scope view), `../strategy/07` (density budget), `dashboard-concepts/README.md` (concept D), `../../v2/audit/T1-admin.md`, REQ RP-01..11, AE-04, SL-02..11, CALL 2026-10-09 follow-up.
**Tags:** `[REQ id]` `[CALL]` `[AUDIT T1]` `[LEDGER]` `[INFER]`. No `OD-*` is treated as decided.

| Screen | Lab URL (explicit term) | Variants | Files |
|---|---|---|---|
| Attainment | `/lab/admin/attainment?variant=A&term=Fall%202026` | A matrix explorer (recommended), B ranked skills | `components/lab/screens/admin-attainment-{a,b}.tsx`, `components/lab/admin-b/*`, `lib/lab/attainment.ts` |
| Export | `/lab/admin/export?term=Fall%202026` | A only (Tier 3) | `admin-export-a.tsx`, `admin-b/export-panel.tsx` |
| Settings | `/lab/admin/settings` (`&tab=tags|settings|instructors`) | A only (Tier 3) | `admin-settings-a.tsx`, `admin-b/settings-page.tsx`, `lib/lab/settings.ts` |
| Deactivate, retire, new list | `/lab/admin/retire-deactivate?variant=A&skill=<id>` | A own page (recommended), B side panel from the list | `admin-deactivate-{a,b}.tsx`, `admin-b/retire-flow.tsx`, `lib/lab/retire.ts` |

States on every screen: `?state=loading|empty|error|partial` (Attainment also honours `stale` from the shared scope bar).

Note on URLs: the shared scope bar matches the term by **name** (`term=Fall%202026`). `term=trm-fa26` resolves the figures but leaves the Term select blank.

---

## 1. Attainment (Tier 2)

### Layout (1440 x 900)

```
| Attainment (20 px serif)                                         [Export] [Sample data] |
| [Term Fall 2026 v][Cohort Any v][Course Any v][Filters 0 v]   [Compare with Expected now v] As of 06:47 [r] |
| Students 123 | Skills 35 | Sections 17 | Tags 3          legend: none / under half / half+ / all  <> Behind |
| Student          Achieved | Emotional  Wound  Medic.  ...  (sections, most shared first)            |
| ABSN 2027 . 14 students                                                                              |
| Noah W.  <>Behind  0 of 5 |  0/1      0/1    0/1                                                   |
| Sofia M. <>Behind  2 of 5 | [1/1]     0/1    0/1    <- click: evidence peek (FloatingSheetPanel)  |
| ... 25 per page, PaginationBar                                                                       |
```

| Region | DS component | Notes |
|---|---|---|
| Header | `PageHeader` via `PageFrame`, one outline action (Export), `Badge` Sample data | Same frame as the dashboard |
| Scope bar | shared `ScopeBar` (`Select size="sm"`, `Popover`, `FilterBar`, `Button` icon) | Imported read-only from `components/lab/dashboard/scope-bar.tsx`; scope in the URL, shared with the dashboard [S06 S1..S5] |
| Views | `Tabs` (line) with counts | The tab counts are the counts: no KPI band [S07 list budget] |
| Matrix (A) | DS `Table` primitives + `PaginationBar` | No matrix DataTable in the DS; same composition as `section-matrix.tsx` |
| Tables (B and the other views) | `DataTable` with query controls, lazy rows past 80 | Distribution strip is decoration; the four counts are links |
| Evidence peek | `FloatingSheetPanel` (non-modal), `StatusBadge`, `Button` | `peek` in the URL; matrix cell stays marked while open |

### Decisions

| # | DECISION | WHY | REJECTED |
|---|---|---|---|
| A1 | Recommended view is concept D: students x sections heat matrix, cell = `achieved/required` | Designer note: concept D fits as the first view in Attainment; strategy/06 5.2 already moved the section grid here; RP-02 asks per student | 123 x 178 skill cells (cannot render, cannot read) |
| A2 | Alternative (B) opens on Skills: ranked by students not yet achieved, with a four-state strip and four linked counts | Answers "what do I fix first" (RP-03); a different first question, not a reskin | Cohort lens as default (ledger: cohort is a filter, comparison secondary) |
| A3 | One unit: the required skill record from `populationRows` + `pipelineRecords` in `lib/lab/dashboard.ts` | Same population, the single "behind" calculation and the four engine states as the dashboard; tests assert equality | A second attainment calculation |
| A4 | Rows grouped cohort by cohort (furthest behind first inside), columns ordered by how many students share the section | Cohorts take different courses, so a global order made a checkerboard (seen in the first screenshot). Ordering is not comparison lanes; cohort stays a filter | Split columns by cohort by default |
| A5 | Amber appears once: the behind diamond + word "Behind" on a row. Cells are a brand tint ramp; states are graded neutrals with icon + word | Calm palette, one saturated colour [S07 rule 7; viz-tokens.css] | Amber cells, a hue per state |
| A6 | Every count opens the peek with exactly that many records (cells, student totals, skill/section/tag state counts) | RP-05, RP-06, S06 R1; `tests/lab/attainment.test.ts` checks every one | Navigating away to a drill route for in-report questions |
| A7 | Tags view says the figures overlap and how many records have no tag | RP-04 requires it | Summing tags as if a partition |

### Questions for Romit

1. Matrix columns: 17 sections in Fall 2026 means horizontal scroll at 1440 with the sidebar open. Acceptable, or collapse to groups first?
2. Skills view lists the 35 skills that are **required** in scope (mandatory mappings), not all 178. Add a "Required | All skills" switch as dashboard D has?
3. Deactivated skills: SL-11 and the call say they leave reporting scope. The dashboard does not exclude them yet, so Attainment does not either (consistency first). Exclude in both together?

### What v2 lost that this restores

v2 reports had cohort, group, course, tag and location filters missing (RP-01), no tag report (RP-04), and a cell sheet that only said "N of M counted" with evidence a navigation away (RP-06) [AUDIT T1]. Here the scope bar carries all seven dimensions, Tags is a view, and the peek lists evaluations (date, evaluator, setting, outcome, counted or held) in place.

---

## 2. Export (Tier 3)

```
| Attainment page behind ...                     | Export                        [<->][x] |
|                                                | 1,790 rows, one per evaluation        |
|                                                | What is on screen                     |
|                                                | Students view . Term: Fall 2026 . ... |
|                                                | Format  [Signed PDF][CSV][Excel]      |
|                                                | Contains          | Leaves out        |
|                                                | . one row per eval| - Self-ratings    |
|                                                | . feedback, review| - Private notes   |
|                                                | [Close Esc]        [Export CSV  Enter]|
```

| Region | DS component |
|---|---|
| Panel | `FloatingSheetPanel`, `FloatingSheetPanelHeader`, `FloatingSheetPanelWorkflowFooter` |
| Format | `SelectionTileGrid` (radio) |
| Result | `LocalBanner` success in the panel (never a toast) |

**Why not `ExportDrawer` itself:** its props are only `open`, `onOpenChange`, `totalRows`, `visibleColumns` (checked with `node tools/ds/source.mjs ExportDrawer` and the 1.6.5 source). Its body is fixed: CSV / Excel / PDF tiles, a date range, all or visible columns, an "apply filters" box. It cannot say what each format contains or leaves out, and a date range would let the export drift from the scope on screen. The panel is built from the same DS parts ExportDrawer uses.

Decisions: scope is not editable in the panel (export what is on screen, RP-10 "record the filters"); signed PDF is the summary of the current view; CSV and Excel are one row per evaluation with evaluator, setting, location, outcome, feedback and review decision (RP-10); both CSV and Excel are offered because OD-10 is open. The CSV is a real file in the prototype; PDF and Excel confirm in place.

**Open conflict (not decided here):** RP-10 says the detail export carries self-evaluations and review notes. v2 D36 (PROPOSED) keeps self-ratings and notes out. The brief for this screen said to exclude self-ratings and private notes, so the lists say so; REQ outranks a v2 proposal, so this needs Romit's call.

---

## 3. Settings (Tier 3)

```
| Settings                                                                         |
| Categories 45 | Tags 3 | Clinical settings 3 | Lab instructors 6                  |
| [New category        ] [Add]                                                     |
| (DataTable search, sort)                                                          |
| Name               Skills   Status    ...                                          |
| Assessment            12     Active    [...] Deactivate / Delete (off: Used by 12 skills) |
```

Clinical settings columns: Sites (active, linked), Skill rules (minimum in that setting, linked), Courses (linked), Evaluations. Lab instructors: name, email, evaluations signed (linked), with name + email inline create (SL-08: enough to send a request).

Rules: delete only while unused, the menu names what uses it; deactivate keeps the entry where it is used, marked inactive, and stops offering it (SL-06); inline create validates duplicates (case-insensitive) and email shape; every count opens a side panel with a list of the same length (`tests/lab/settings.test.ts`). DS: `Tabs`, `DataTable`, `Input`, `Label`, `Button`, `DropdownMenu`, `AlertDialog`, `LocalBanner`, `FloatingSheetPanel`, `StatusBadge`, `Badge`.

"Which lists use them": the seed holds one list, so a Lists column would show the same value on every row (strategy/07 Von Restorff). Shown instead as what references each setting (sites, rules, courses). Revisit when lists exist (`lists-cohorts` screen).

---

## 4. Deactivate, retire, new list (Tier 2)

```
| Deactivate or replace a skill                                                    |
| Skills > Blood glucose monitoring                       [Skill  Blood glucose ... v] |
| Why change this skill?                       | Impact                             |
| (o) It was a mistake                          | Students who have it now   86      |
|     Deactivate it. Reversible; evaluations    | Courses it is mapped to     3      |
|     are kept but hidden.                      | Evaluations recorded      412      |
| ( ) The standard changed                      | Open requests               4      |
|     Start a new list for new cohorts.         | -> Hidden from 86 students ...     |
| [Deactivate]                                  | -> 412 evaluations kept, out of reports |
| Delete the skill: 412 evaluations are recorded against it, so it cannot be deleted. [Delete (off)] |
```

| # | DECISION | WHY |
|---|---|---|
| R1 | Intent first, in the admin's words: "It was a mistake" vs "The standard changed" | CALL 10-09: "Inactivate just means I made a mistake"; a changed standard means "create a new list and ... attach your new cohorts" |
| R2 | Mistake = deactivate: reversible (Undo, Reactivate), evidence kept, out of mapping, student selection and reports | SL-11; CALL "I don't want deactivated things in the report" |
| R3 | Standard changed = new list: name + cohorts that move; the current list keeps its history | CALL; strategy/03 5.3 |
| R4 | Delete only while nothing is recorded; the evaluation count is the reason it is off | CALL "as soon as there is data ... prevent them from deleting" |
| R5 | Impact before confirm: 4 figures, then what confirming changes | Brief; strategy/07 detail budget (4 figures) |

Variant B puts the same flow in a `FloatingSheetPanel` from each row of a skills `DataTable` that shows evaluations per skill, so deletable skills are visible before opening any. DS: `PageHeader`, `RadioGroup`, `Checkbox`, `Input`, `Field`, `Button`, `LocalBanner`, `AlertDialog`, `Select` (A), `Breadcrumb` (A), `DataTable` + `FloatingSheetPanel` (B).

**Not decided:** what happens to open requests on a deactivated skill (not in REQ or the call); shown as a figure only. The library's own delete rule also requires no course mapping; this flow follows the call (evidence only). Align the two.

---

## 5. Density count (first viewport, 1440 x 900, shell and lab chrome excluded)

| Screen | Regions | Figures | Charts | Controls above table | Prose words | Budget (list / form / detail) |
|---|---|---|---|---|---|---|
| Attainment A | 4 (header, scope bar, tabs + legend, matrix) | 0 (tab counts) | 1 (matrix) | 7 (term, cohort, course, filters, compare, refresh, export) + 4 tabs | 0 sentences (legend labels only) | list: 4 / 0 / 1 in-cell viz / 6 controls / 40 words: controls 7 vs 6 (the shared scope bar) |
| Attainment B | 4 | 0 | 0 (in-cell strips) | 7 + table search | 0 | same |
| Export | 4 behind + panel | 1 (row count) | 0 | panel: 3 format tiles, 2 footer buttons | about 30 (contains / leaves out lists) | within |
| Settings | 4 (header, tabs, create row, table) | 0 | 0 | 2 (name, Add) + table search | 0 until an action | within |
| Deactivate A | 4 (header, toolbar, decision, impact) | 4 | 0 | 4 (skill, 2 radios, confirm) + Delete | about 30 | form: within |

---

## 6. Mobbin references (viewed 2026-10-26)

| Reference | What it shows | Used for |
|---|---|---|
| [Quo, busy-times heat map](https://mobbin.com/screens/c2a9cf1b-9b32-4ac4-89b5-b907c8f26146) | Calm single-hue grid, small legend top right, rows by day | Matrix ramp and legend placement |
| [Plane, analytics with Export as csv](https://mobbin.com/screens/aa584d96-6d24-4fbb-a440-80a99c151b5d) | Chart, count table, then per-assignee state columns | Skills view: one column per state with counts |
| [AirOps, pages table with filters in one row](https://mobbin.com/screens/7f35b7d4-98ee-42c8-b981-a9026fd4730a) | Compact filter row above a dense table | One 32 px toolbar row |
| [Klaviyo, metric scope popover](https://mobbin.com/screens/817e4450-5215-4979-ac69-d8ba8ce88bcf) | Scope set in a popover, period stated beside it | Filters popover, as-of beside scope |
| [Square, export dialog with format](https://mobbin.com/screens/469e75a3-e1b7-4c59-8387-0801e4c10294) | Choose what (all / matching filters) then format with a one-line purpose each | Format tiles with contains / leaves out |
| [Juicebox, optional CSV export fields](https://mobbin.com/screens/c3641fbb-02a6-4c2e-8a56-21d36117d7f8) | Says which fields a CSV includes | Contains list per format |
| [Klaviyo, export campaign analytics](https://mobbin.com/screens/d15e276f-ac71-4a6d-be47-0451b8aa5ca2) | Export with a date range | Rejected: a date range lets an export drift from the scope on screen |
| [Plane, release tags inline add](https://mobbin.com/screens/8ae7bf3b-4358-4668-ae5f-3687a85dcf4b) | Tabs (tags, labels) with an inline name field and Add | Settings tabs and inline create |
| [Mercury, tags with status](https://mobbin.com/screens/8f7ba975-d85a-4e25-a6e7-63c13de15ad2) | Tag list with Active status and a row menu | Status column and row actions |
| [Snowflake, tags with unused count](https://mobbin.com/screens/4f35f2e6-b21b-43cf-b137-a076299e4e60) | Applied vs unused tags | Usage counts drive delete |
| [Mercury, archive budget](https://mobbin.com/screens/cd8e7199-5a91-4c14-93fe-171203567314) | States the effect and "You can restore it later" | Deactivate copy: reversible, effect named |
| [Klaviyo, archive flows with impact](https://mobbin.com/screens/0f98c431-e63a-4243-8438-611ce3911d61) | Names the side effects before confirm | Impact before confirm |

No reference combined "why" (mistake vs new standard) with impact; that pairing comes from the call, not from a pattern [INFER].

## 7. Verification

See the worker report for pasted results: `npx vitest run tests/lab`, `npx tsc --noEmit`, `node scripts/lab-ds-gate.mjs`, and the screens loaded in Chrome at 1440.
