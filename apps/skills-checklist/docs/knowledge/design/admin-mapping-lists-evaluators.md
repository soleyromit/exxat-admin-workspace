# Admin: course mapping, lists and cohort assignment, evaluator directory (design lab)

**Written:** 2026-10-26. **Status:** built in the lab, for Romit's review. Nothing here decides an `OD-*`.
**Consulted:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md`, `../strategy/07-ux-laws-and-density.md` (binding), `../../v2/audit/T1-admin.md`, REQ CM-01..08, SL-08/09, RP-08, the Oct 9 call notes, build prompt section 5 (completion rule), section 7 (admcourse, admassign, admevals, admconsistency), section 10 (N-13).
**Routes:** `/lab/admin/course-mapping?variant=A|B&term=trm-fa26`, `/lab/admin/lists-cohorts?variant=A|B`, `/lab/admin/evaluator-directory?variant=A|B`. Demo states on every variant: `?state=loading|empty|error`.

## 1. Mobbin references (viewed 2026-10-26)

| # | Reference | What we took | Used on |
|---|---|---|---|
| M1 | [Meetup, Members](https://mobbin.com/screens/2b3b50f7-c02c-4905-9ffc-b78786087a4d) | One row of compact filters above a member table; role and location as filters, not columns | Evaluators A toolbar |
| M2 | [Gumloop, Organization members](https://mobbin.com/screens/b191aef1-ec44-48ac-ad7f-c76673fed6f5) | "Pending" as a quiet chip beside the person, pagination under the table | Evaluators status badge, paginated table |
| M3 | [Square, Customer directory](https://mobbin.com/screens/515531bc-92ff-4a24-b0fe-4440f32ad471) | Name as the link column, a total count above the table, filters in one place | Evaluators summary line |
| M4 | [Klaviyo, Profiles](https://mobbin.com/screens/c4006505-8637-4785-922e-d78471727183) | Two or three headline counts above a long people table, each count a filter | Evaluators summary line (3 figures, awaiting filters) |
| M5 | [Klaviyo, Merge profile](https://mobbin.com/screens/c140e960-f3d9-4a5a-a747-c9c0719a522d) | Merge as a dialog: the record on top, "merge into" below, consequence stated before confirm | Adopt or merge dialog |
| M6 | [Calendly, Merge contacts](https://mobbin.com/screens/9b1906d3-3035-4a74-a7ff-c72606a8bde5) | Suggested duplicates; a merge is a deliberate choice, never automatic | Merge candidates with a reason ("same surname, same site") |
| M7 | [Etsy, Policy settings](https://mobbin.com/screens/b377022c-aec7-496f-99fa-bcb8884706d5) | A policy object that says how many listings use it | Lists table "Used by" column |
| M8 | [Workable, Time tracking policies](https://mobbin.com/screens/a77d2867-d720-4d70-8a19-fceddea23daa) | "Applied in 1 department in 1 location": the object names where it applies | List detail: groups checked off |
| M9 | [Klaviyo, Attach assets](https://mobbin.com/screens/bec9981b-fe97-4b8f-9da9-a68478883f6c) | Search plus one filter above a checkable table; selection count with one action | Course mapping bulk "Set to" |
| M10 | [Square, Import choice](https://mobbin.com/screens/47bde187-62a8-43d1-93d0-2ab18519a7ba) | Two radio choices, each with its consequence, before a destructive change | "Add as a second list" or "Move this group" dialog |

Anti-example: [Shopify, bulk editor](https://mobbin.com/screens/216154c7-fd41-4f57-af75-13f1821cd4fa) shows editable cells with no context; we keep the offering's facts and counts above its table.

## 2. Course mapping

**Question per variant (in `screens.json`).** A, offering first: does picking one of 110 offerings and setting each skill mandatory, non-mandatory or not mapped, with a coverage view, map faster and catch required skills in no course? B, skill first: does picking a skill and setting its level per offering answer "where is this taught" better?

**Layout A (recommended), 1440 x 900.**

```
Course mapping                                                     (h1, 20px)
[Search offerings][Fall 2026 v][All cohorts v][All years v]   [Offerings|Coverage]
◆ 12 required skills are in no Fall 2026 course.  Show them
┌ Offering        Mapped Mandatory ┐ ┌ DSG 130 Dosage Calculation   26 mapped 0 mandatory ┐
│ DSG 130 BSN 2028·Year 2   26  0  │ │ Fall 2026 · 2026-27 · Year 2 · BSN 2028            │
│ NUR 101 ...               60 25  │ │ [Search skills][All skills v]   ■ Mand □ Non - Not  │
│ ... 22 offerings in the term     │ │ ☐ Skill            Required  In DSG 130 [Select v] │
└──────────────────────────────────┘ └ 178 skills, lazy rows, bulk "Set to" on selection ─┘
```

| Region | DS component | Why |
|---|---|---|
| Header | `PageHeader` via `PageFrame` | 20px serif title; no action (mapping saves per change) |
| Toolbar | `InputGroup`, `Select` (term grouped by academic year with `SelectGroup`), `ViewSegmentedControl` | CM-02: search, cohort, term, academic year (through the term groups and the search text), professional year on one 32px row |
| N-13 line | text + amber diamond + `Button variant="link"` | Calm line, not a banner; it opens Coverage |
| Offerings | `DataTable` with `openRowId` | CM-01 identity (code, cohort, year, name) and CM-04 counts per offering |
| Offering pane | `DataTable` (selectable, lazy), `Select` per row, `Badge` "Required", `LocalBanner` after bulk | CM-03 level per offering; CM-06 differs by offering; unconfigured rows sit last with "Not configured" linking to Configure, the reason said once above the table [IM-09] |
| Coverage view | `DataTable` with pinned skill column, glyph cells that link to the offering | build prompt coverage matrix: required skills of the default list by the term's offerings, "In no course" first; columns follow the cohort, year and search filters |

**Variant B (skill first).** Same header and toolbar shape (search, term, Show); skills table by name with the term's carriers ("3, 1 mandatory" or the amber "In no course"); the pane lists the 22 offerings with a level `Select` each. The library's "Not mapped" link (`course-mapping?skill=`) lands on A and hands over to B with the skill kept.

**Decisions made here [INFER].** Levels use the glossary words Mandatory, Non-mandatory, Not mapped (REQ CM-03; "optional" is banned). The row order is stable (configured first, then section and name) so a level change never moves the row under the cursor. An edit applies to one offering only; carry-forward between terms is OD-01 and is not offered. Required means required on the default list. B is sorted by name so the amber marks stay about 7% of the list; the N-13 line filters to them.

**What v2 lost [AUDIT T1].** Mapping hard-coded to NURS 350, no terms, no offering identity, no coverage matrix, "No gaps found" repeated on every row. Here: 110 offerings, the counts per offering, one N-13 line, and no per-row filler.

## 3. Lists and cohort assignment

**Question per variant.** A, list first: does treating each list as an object and checking off the groups it applies to, with "what would change", set up lists without overriding a program's established ones? B, group first: does a groups by lists grid, with the next new cohort as a row, make "which cohort uses which list" clearer?

**Layout A (recommended).**

```
Lists                                                             [New list]
┌ List                          Size                    Used by                Status ┐
│ Clinical skills checklist [Default]  154 skills, 52 required  BSN 2026, BSN 2027... ◎ Live │
│ Practicum competencies        24 competencies, 16 req.  BSN 2027, Accelerated  ◎ Live │
│ Clinical skills checklist, 2027 standard  154 skills    No group yet           ✎ Draft│
└───────────────────────────────────────────────────────────────────────────────────────┘
Clinical skills checklist                       [Make default] [New list for a new standard]
Holds skills · 154 skills, 52 required
┌ ☑ Student group     Meet the rule  Median achieved ┐  ┌ Completion rule            ┐
│ ☑ BSN 2026 38       0 of 38        82 of 154 · 52/52 │  │ Every required skill (52) │
│ ☑ BSN 2027 29 ...                                   │  │ and at least [120] of 154  │
│ ☐ Accelerated track  Not using                      │  │ What would change (on edit)│
└─────────────────────────────────────────────────────┘  └───────────────────────────┘
```

| Region | DS component | Why |
|---|---|---|
| Header | `PageHeader`, one primary `Button` "New list" | A new standard is a new list [CALL] |
| Lists | `DataTable`, `Badge` "Default", `StatusBadge` Live or Draft | Lists as objects with their noun [LEDGER D-B] |
| Groups | `DataTable`, `Checkbox` per group | Cohorts and tracks are checked off, not cloned per cohort [CALL]; cohort is a filter [LEDGER] |
| Completion rule | `Card`, `Input type=number` | All required plus a minimum total [BUILD-PROMPT 5]; the impact per group shows only once the number changes, before Save |
| Confirmations | `Dialog`, `RadioGroup` | Attaching a list to a group that already uses a list of the same noun asks "Add as a second list" or "Move this group"; detaching and making default say what stays. No silent override |

**Variant B.** One `DataTable`: rows are cohorts and the track, plus "Next new cohort" (gets the default list automatically); a column per list with a `Checkbox` and "n of N meet it" linking to the rule in A. Same dialogs.

**Decisions made here [INFER].** The seed has one implicit list, so `lib/lab/lists.ts` derives three: the imported checklist (default, every cohort), practicum competencies (a second list on BSN 2027 and the track, from the communication, documentation, teaching and psycho-social sections; it overlaps the checklist), and a draft for the 2027 standard. One default at a time. A new list may start empty or as a copy of a live list; the call disliked cloning per cohort, not per standard, so the copy is offered and flagged below. Medians are hidden below 5 students.

**What the data shows.** Under the 120 minimum nobody meets the checklist rule; at 60, 31 of 38 in BSN 2026 would. That is the "what would change" story the rule card tells before Save.

## 4. Evaluator directory

**Question per variant.** A, people first: find any of 174 evaluators, decide adopt or merge on the 14 names awaiting approval, compare rates only where n is big enough. B, site first: start from the sites and open one site's evaluators.

**Layout A (recommended).**

```
Evaluators                                                   [Add an evaluator]
174 evaluators   14 names awaiting approval   99.5% of evaluations signed by adopted evaluators
[Search name or email][All roles v][All sites v (type to search)][Any status v]
┌ Evaluator           Role and site     Status            Evaluations  Not qualifying  Open requests  │Decide          ┐
│ BC B. Chowdhury     Preceptor          ⌛ Awaiting approval  6 held     Not compared    None          │[Adopt or merge]│
│ ... names awaiting approval first, then by name; 25 per page, 7 pages                                         │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Region | DS component | Why |
|---|---|---|
| Header | `PageHeader`, primary "Add an evaluator" | SL-08: a name and an email are enough |
| Summary | three figures in one line; the awaiting figure filters | Verified share of evidence [BUILD-PROMPT admevals] |
| Toolbar | `InputGroup`, `Select` (role, status), `Popover` + `Command` (site, 39 sites with evaluators) | Hick: 4 controls; long list is type to search |
| Table | `DataTablePaginated`, `PersonIdentityCell`, `StatusBadge`, `Tip` | 174 rows paginated; held evaluations link to Approvals, open requests link to the evaluator's requests on the dashboard ops view |
| Decision | `Dialog`, `RadioGroup` | Adopt, or merge into a suggested evaluator with the reason; writes the shared reviewer decision, so held evidence counts and the name leaves the awaiting list [LEDGER; REQ SL-09] |

**Consistency (admconsistency).** "Not qualifying" = did not meet criteria or returned, as a share of the evaluator's evaluations. Compared only with n >= 30 and >= 5 such evaluations; flagged in amber only at twice the program average (5.0% today, 13 evaluators flagged). Below the floor the cell says "Not compared". The build prompt marks consistency a Recommendation, not a P1 default.

**Variant B.** Sites table (site, setting, evaluators with "n awaiting", open requests with the oldest wait) with setting and "Show" filters (RP-08 lens), program faculty and lab instructors as one "Program" row; the pane lists that site's evaluators with Adopt or merge in the status cell.

## 5. Density counts (measured in Chrome at 1440 x 900 with a script over the rendered page)

Shell and lab chrome excluded. Budget: list page, 4 regions, 0 to 3 figures, 6 controls above the first table, 40 words.

| Screen | Regions | Figures | Controls above first table | Prose words | Notes |
|---|---|---|---|---|---|
| Course mapping A | 4 (header, toolbar, N-13 line, panes) | 2 in the pane (mapped, mandatory) | 7 counted (search, 3 selects, 2 segments of one view control, Show them) = 6 controls | 30 | pass, with the view control counted once |
| Course mapping B | 4 | 2 in the pane | 4 | 16 | pass |
| Lists A | 3 (header, lists, list detail) | 0 | 1 | 24 | pass |
| Lists B | 3 (header, grid, legend line) | 0 | 1 | 20 | pass |
| Evaluators A | 4 (header, summary, toolbar, table) | 3 | 5 | 4 | pass |
| Evaluators B | 4 | 3 | 4 | 9 | pass |

Colour: neutral plus the brand tint for the selected row and the feedback banner (`promo`), amber only for "In no course" and an above-average rate. Status is glyph plus word: filled square, hollow square and a short line for levels, ⌛ and ◎ for evaluator status, ✎ and ◎ for list status.

## 6. States

Each variant: `?state=loading` (final-shape skeleton), `?state=empty` (what will appear and the next step), `?state=error` (LocalBanner with Try again, "Nothing was changed"). Filtered empty: the table's empty row says "No ... matches. Clear a filter". Bulk mapping that skips unconfigured skills says how many were skipped.

## 7. Uncertain, for Romit

1. Professional year is derived (`lib/lab/mapping.ts professionalYear`) because the seed has no year field; the seed also runs the 2026 cohort in 2026-27, so the formula treats that as its fourth year.
2. Lists are lab objects; the v2 model has one list. Overlap between the two live lists is allowed here (one record per skill, CM-07); reports never mix lists.
3. "Start from a copy of an existing list" when creating a list for a new standard. The call rejected cloning per cohort; copying per standard may also be unwanted.
4. One default list at a time.
5. The flag factor (2x the average) for the consistency rate is a guess; the n >= 30 and >= 5 floor is from the brief.
6. The nav Approvals badge did not drop after an adopt in my test; the queue reads the same overlay, the badge is owned by the shell and may read the store directly.
7. Coverage puts all 12 gap rows first, so 23% of visible rows carry amber; that view's job is the gap (strategy 07 exempts a chart whose job is the flag), but Romit may prefer a count line.
