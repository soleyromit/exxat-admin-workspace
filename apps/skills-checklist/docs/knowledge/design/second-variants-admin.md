# Second variants: admin drill, starting points, rule impact, export, settings

**Written:** 2026-10-26. **Consulted:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md` (sections 3b and 3c, D-X4, D-X5, D-X13 to D-X16, D-X21), `../strategy/07-ux-laws-and-density.md`, `admin-attainment-export-settings.md`, REQ RP-10, RP-11, SL-11.
**Tags:** `[REQ id]` · `[LEDGER D-Xn]` delegated default · `[INFER]` · `PENDING-ROMIT`. No `OD-*` is treated as decided.

All five screens are tier 3, so each gains one structurally different variant B (LEDGER D-X4: at least 2 per screen). Variant A stays recommended until Romit compares them. Every B reads the same single sources as A (`buildDrill`, `populationRows`, `pipelineRecords`, `buildAttainment`, `computeImpact`, `lib/lab/settings.ts`), so no figure can disagree with A or with the dashboard; `node tests/lab/consistency.mjs` passes 17 of 17.

## 1. Variants

### 1.1 Dashboard drill list B: grouped, with an inline peek

Route `/lab/admin/dashboard-drill?variant=B&list=students&cond=behind`. File `admin/components/lab/screens/admin-dashboard-drill-b.tsx`, peek `admin/components/lab/dashboard/drill-peek.tsx`.

**Question it tests:** does the same list, grouped by what the admin acts on, with a peek beside it showing what is left for the chosen row, answer "why" without leaving the page? (A: one flat table; each name leaves the page.)

```
| 28 students behind the term clock                                              |
| Dashboard > Students behind (28)                                               |
| [Term][Cohort][Course][Filters]          [Compare with] As of 07:19 [refresh]  |
| Showing [Behind the term clock x]  28 students in 3 groups          [Search ]  |
| v BSN 2028  17                                   | Samir Quintero          [x] |
| +------------------------------------------+     | BSN 2028, Group A. 6 of 29. |
| | Student         | Group   | Required ach.|     | Not achieved yet (23)       |
| | (SQ) Samir Q.   | Group A | 6 of 29      |<-   | (o) No evidence yet 23      |
| | ...                                      |     |   Adult                     |
| v BSN 2027  8                                    |   Ambulating ...            |
| > BSN 2026  3                                    | [Show all 23] [Attainment]  |
```

| Region | DS component |
|---|---|
| Header, breadcrumb | `PageHeader` (PageFrame), `Breadcrumb` |
| Scope | shared `ScopeBar` (DS `Select`, `Button`) |
| Condition and search | `FilterBar`, `Button` (removable chip), `Input`, `Label` |
| Groups | `Collapsible` per group (trigger is a ghost `Button` with count), `DataTable` per group, `PersonIdentityCell` |
| Peek | `Card`, `StatusBadge` (state said once per group: glyph + word + count), `Button` |
| States | `LocalBanner` (error with retry, empty) |

Groups: students by cohort, skills by section, sites by "oldest request 15 days or more" first, requests by site. First 3 groups open; searching opens all. Peek per list: a student's not-achieved required skills grouped by state; a skill's students not there yet; a site's waiting requests; a request's facts. Selection is in the URL (`row`).

### 1.2 Starting points B: gallery browsed by discipline

Route `/lab/admin/starter-library?variant=B`. Files `admin-starter-library-b.tsx`, shared `admin/components/lab/import/starter-copy.tsx` (preview body and copy dialog).

**Question:** do cards, browsed by discipline and each showing its sections before any click, let a program pick a starting point faster than a table (A), still knowing it owns an editable copy?

```
| Starting points                                                                |
| Example lists to copy and edit. Your program owns ...  [Decision pending][Sample] |
| [All 5 | Nursing 2 | Paramedic 1 | Radiography 1 | Surgical technology 1]      |
| +------------------+ +------------------+ +------------------+                 |
| | Nursing          | | Nursing          | | Radiography      |                 |
| | Two-year nursing | | BSN med-surg     | | Radiography      |                 |
| | 154 skills, 10   | | 8 skills, 4      | | 6 skills, 3      |                 |
| | Basic Skills  23 | | Medication     4 | | General       3  |                 |
| | and 6 more       | |                  | |                  |                 |
| | [Preview][Use as]| | [Preview][Use as]| | [Preview][Use as]|                 |
```

DS: `PageHeader`, `ViewSegmentedControl` (discipline), `Card` grid (one region, LEDGER D-X21), `Badge` + `Tip` (PENDING-ROMIT flag), `FloatingSheetPanel` (preview), `Dialog` + `Select` + `RadioGroup` (copy into a library, repeats), `LocalBanner` (after copy), `Button`.
**SL-01 conflict kept flagged:** REQ SL-01 says Prism ships no skills library. Shown only as editable starting points the program owns (LEDGER D-X5); "Decision pending" badge on the page; models, rules and evidence are never copied; copies arrive not configured.

### 1.3 Rule change impact B: people first, with what each role sees

Route `/lab/admin/rule-change-impact?variant=B`. File `admin-rule-impact-b.tsx`.

**Question:** does a per-student diff list, grouped by the move each student makes, with a preview of what each role sees, make the cost of a rule change clearer than before and after counts (A)?

```
| Oral medication administration    (o) In use  Medication. 121 have evidence.  |
| 15 students change status if evidence is re-evaluated        | The rule        |
| Of 121 with evidence. Grouped by the move, losses first.     | Now  3 Met      |
| (v) Achieved -> (o) In progress  15 students  [! Loses ach.] | After 3 Met, 2  |
| | Student        | Still needed after publish            |   | evaluators, 1 in|
| | Aiden Abara    | 1 more in Inpatient (you have 0 of 1) |   | ( ) Re-evaluate |
| | ...  [Show all 15]                                     |   | ( ) New only    |
|                                                              | [Publish ...]   |
|                                                              | What each role  |
|                                                              | sees: student / |
|                                                              | evaluator /     |
|                                                              | reviewer lines  |
```

DS: `Card`, `Table`, `StatusBadge` (states neutral; the one amber is "Loses achieved"), `RadioGroup` + `Badge` + `Tip` via the shared `EvidenceChoice` (PENDING-ROMIT, never preselected), `Button`, `LocalBanner` via `PublishedNotice`. Publish label and counts identical to A (`primaryLabel(..., live.students)`). The evaluator line says they never see the rule [REQ EV-03].

### 1.4 Export B: dedicated page with file preview and exports made

Route `/lab/admin/export?variant=B`. File `admin-export-b.tsx`.

**Question:** does setting the scope on its own page, previewing the file header and first rows before exporting, and listing each export made with its filters, beat exporting from a panel over Attainment (A)?

```
| Export                                                                         |
| [Term][Cohort][Course][Filters]                 [Compare with] As of [refresh] |
| +-What to export------------+ +-Preview of attainment-fall-2026-evaluations.csv-+
| | [PDF] [CSV*] [Excel]      | | Term: Fall 2026                               |
| | [Decision pending] CSV or | | Compare with: Expected now                    |
| | Contains   | Leaves out   | | As of Oct 26, 07:18                           |
| | ...        | ...          | | Rows (one per evaluation): 1790               |
| | [Export CSV] 1,790 rows   | | Student | Cohort | ... | Self-rating | Review note
| +---------------------------+ +-----------------------------------------------+
| Exports this session  [Repeating exports: proposed]                            |
| File | Format | Rows | Filters | Made | [Make again]                           |
```

DS: `PageHeader`, shared `ScopeBar`, `SelectionTileGrid` (format), `Badge` + `Tip` (OD-10 seam; repeating export seam), `ViewSegmentedControl` (which summary the PDF carries), `Table` (file preview, history), `Card`, `Button`, `LocalBanner` (error), `Skeleton` (loading). A repeating export is not built: a "Proposed" badge only [INFER; not in REQ].

### 1.5 Settings B: master and detail

Route `/lab/admin/settings?variant=B&list=settings`. File `admin-settings-b.tsx`.

**Question:** do three panes (lists, entries, the chosen entry with everything that uses it shown in place) make deactivate or delete a better-informed decision than tabs with a side panel (A)?

```
| Settings                                                                       |
| Categories   45 | [New category ][Add] | Airway  Active                         |
| Tags          3 | [Search categories ] | Used by 1 skill                        |
| Clinical s.   3 | Airway            1  |   Basic airway management   Configured |
| Lab instr.    6 | Assessment        7  | [Deactivate] [Delete (off)]            |
|                 | Basic Skills      5  | Used by 1 skill, so it cannot be       |
|                 | ...                  | deleted. Deactivate keeps it ...       |
```

DS: `PageHeader`, `Button` (list nav and entry rows, `aria-current`), `Input` + `Label` (inline create, search), `Card`, `StatusBadge` (Inactive), `Badge` (New), `AlertDialog` (delete), `LocalBanner` (feedback, error), `Skeleton`. Same rules as A: delete only while unused, the blocking count is the reason; deactivate keeps the entry where used, marked inactive [REQ SL-06]. A clinical setting's detail shows its sites, the skills with a minimum there and the courses, each list the same length as its count.

## 2. Density counts (1440 x 900, from the loaded pages; lab chrome excluded)

| Variant | Page type | Regions (limit) | Figures | Controls above first table | Prose words | Primary actions | Saturated hues | Notes |
|---|---|---|---|---|---|---|---|---|
| Drill B | list | 4 of 4 (header with crumb, scope, toolbar, list and peek) | 0 (title count is the count) | 10: scope bar 7, chip, search, group toggle | about 15 | 0 | amber only on Behind badge (hidden when every row carries it) | Scope bar is shared with A and every dashboard page; same count as A plus search and toggle. Over the list line of 6 by the scope bar |
| Starting points B | list | 3 (header, ownership line, switch and grid) | 0 | 1 switch (5 options), then 2 per card | about 20 | 0 (one per step in the dialog) | none | 5 cards, within D-X21 (max 6 tiles) |
| Rule impact B | form | 3 (header with facts, diff list, aside) | 1 (students who change) | 4 (2 radios, publish, edit) | about 40, borderline (aside helper lines) | 1 | amber on "Loses achieved" only | Role preview mostly below the fold |
| Export B | list | 4 (header, scope, export card with preview, history) | 0 | 11: scope bar 7, 3 format tiles, export | about 35 | 1 | none | Over the list control line (6): the scope bar is the price of an editable scope; A avoids it by fixing scope to the view |
| Settings B | list | 4 (header, lists, entries, detail) | 0 | 6 (4 list buttons, Add, search) + 2 detail actions | about 25 | 1 (Add) | none | Entry rows are selection, not counted as controls |

`node tests/lab/density-budget.mjs` measures only the six dashboard routes, so these were counted by hand from the screenshots.

## 3. Requirement fixes made with this work

| Item | Change | Where |
|---|---|---|
| RP-10 detail contents (LEDGER D-X13) | CSV and Excel rows now carry Self-rating, Self-evaluation note, Review decision and Review note besides feedback, setting and location. Self-evaluation comes from the evaluation, else the log entry the request was sent from. 1,790 rows in scope: 760 carry a self-evaluation, 136 a review note | `lib/lab/attainment.ts` `detailColumns`, `detailRows`, `toCsv`, `exportFormats` |
| RP-10 filters recorded | File header: term, every applied filter, Compare with, As of, then "Rows (one per evaluation): n" | `toCsv` (A and B), preview block (B) |
| PDF = aggregate summary | PDF leaves out individual evaluations, feedback, self-evaluations and review notes | `exportFormats` |
| RP-11 / OD-10 | Both CSV and Excel offered, "Decision pending" badge with a Tip on both export screens | `FORMAT_DECISION_PENDING`, `export-panel.tsx`, `admin-export-b.tsx` |
| D-X16 skills tab | Attainment Skills tab has "Required this term | All skills" (default required). All adds published skills nobody in scope needs this term as rows marked "Not required this term", no state counts, no figure changes (35 + 112 = 147) | `unrequiredSkills`, `attainment-page.tsx`, `attainment-tables.tsx` |

## 4. Rule alignment (reported, not all editable here)

**Deactivated skills in reporting (SL-11, LEDGER D-X14).** Not possible without editing the single source. The v2 `Skill` type has no active flag (`lib/v2/types.ts:174-191`); "inactive" exists only as a lab-library overlay in the browser tab (`lib/lab/library.ts` `demoInactiveIds` plus session overlay). The dashboard, Attainment and director figures all read `requiredSets` in `lib/v2/population.ts`, which filters only `configured && published` (line 128). Filtering in `attainment.ts` alone would make Attainment disagree with the dashboard, so it was not done. Exact change for the data-layer owner:
1. `lib/v2/types.ts` `Skill`: add `active?: boolean` (absent means active).
2. `lib/v2/population.ts:128`: `if (!skill || !skill.configured || !skill.published || skill.active === false) continue`.
3. The library's deactivate writes `active: false` to the store (today it writes only the tab overlay), and the demo-inactive skills are seeded with `active: false` so every screen sees them.
Evidence stays (evaluations untouched), as SL-11 requires.

**Delete versus retire (LEDGER D-X15).** REQ SL-11 says nothing about delete; the call says delete only while no data exists. Decision applied: delete only while the skill has no evidence; a course mapping never blocks delete, the mapped courses are listed as impact and unmapped on delete (mapping is expectation, not data [REQ CM-05]). `lib/lab/retire.ts` already gated on evidence only; added `deleteImpact()` (allowed, courses to unmap, reason) with a test. **Still misaligned:** `lib/lab/library.ts:170` sets `canDelete: evidence === 0 && courses === 0` (owned by another worker, not edited). Change it to `evidence === 0` and show `deleteImpact(...).unmapFrom` in the library's delete confirmation.

## 5. Mobbin references (looked at, web)

| Reference | What it informed |
|---|---|
| [Linear grouped issue list](https://mobbin.com/screens/46088879-314c-405c-88b5-eb7820c05efb) | Drill B: collapsible groups with a count in the header row |
| [Asana list with sections](https://mobbin.com/screens/2af90759-4ce5-4763-a3d0-796f38cb18e8) | Drill B: group headers as the scanning spine, rows below |
| [Vercel template finder](https://mobbin.com/screens/6a3993d5-b02b-48a2-8e7a-c1c1ed210b33) | Starting points B: card grid with a filter by use case |
| [Asana workflow gallery](https://mobbin.com/screens/188ad1c0-a889-4fbd-b5a9-dd7186247280) | Starting points B: category switch above a starter gallery |
| [Origin rule preview](https://mobbin.com/screens/d7ed55ab-4cdb-4fb2-82dd-9d98878e3fe2) | Rule impact B: list of matched records before the rule is created |
| [Stripe Radar review new rule](https://mobbin.com/screens/93387510-1b32-4659-90b5-3a5e5be63889) | Rule impact B: rule text on top, affected records below, actions top right |
| [Juicebox export history](https://mobbin.com/screens/f23a529d-b019-413b-9d0e-d308880920c9) | Export B: past exports table with format and row counts |
| [Customer.io exports](https://mobbin.com/screens/ba3f64a1-271c-49aa-82e9-762a33af7e4d) | Export B: export list with row count and who made it |
| [WhatsApp settings](https://mobbin.com/screens/1256548f-05fd-4cf6-ba73-d69b8329ba31) | Settings B: list pane beside an empty-until-chosen detail pane |
| [X settings](https://mobbin.com/screens/08864a54-8f9f-40e5-af2d-1a5ba8ab7350) | Settings B: three columns, category, entries, detail |

## 6. Open

- Starting points remain PENDING-ROMIT against REQ SL-01.
- OD-10 (CSV or Excel) open; Excel is a seam (the lab writes a real CSV file only).
- Repeating exports are a proposal badge only; not in REQ.
- "The view on screen as a table" in the PDF contents reads oddly on the dedicated export page (B), where the summary is chosen with the switch; a B-specific wording would need `exportFormats` to take the context [INFER].
- Registry test (`tests/lab/registry.test.ts`) relaxed to "tier 2 and 3: up to 3 variants, tier 3 at least 1" so screens can gain variants; tighten tier 3 to at least 2 once every tier 3 screen has its second.
