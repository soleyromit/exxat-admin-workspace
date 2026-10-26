# Skills library and Add a skill (admin): design and lab build

**Written:** 2026-10-26. **Status:** lab build for Romit's review; nothing here decides an `OD-*`.
**Consulted:** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`, `strategy/01` (IA, library sitemap and scale table), `strategy/02` (text budget), `strategy/03` (state 5.3, edge cases section 9), `strategy/04` (DataTable rule), `ds-usage-map.md`, `ds-conformance-v2.md`, `dataset-spec.md`, `design/dashboards-and-layouts.md`, `docs/v2/audit/T1-admin.md`, REQ sections SL, IM, SC, CM.
**Lab routes:** `/lab/admin/skills-library?variant=A|B|C`, `/lab/admin/add-skill?variant=A|B`. Demo states on all five: `?state=loading|empty|error`.

## 1. What v2 lost (the gaps this answers)

| Gap in v2 | Source | Answer here |
|---|---|---|
| No manual single-skill create | [REQ IM-12] [AUDIT T1] | "Add a skill" primary action; sheet (A) or inline row (B) |
| No deactivate or retire; no delete rule | [REQ SL-11] [CALL Oct 9] [AUDIT T1 P0] | Row action "Deactivate or replace" asks the intent first; delete only with no evidence and no course, and the menu says why not |
| No categories or tags, no search | [REQ SL-03, SL-04, SL-10] | Category and tag columns and filters, create at the point of need in the sheet [REQ SL-05], DataTable search |
| No active or inactive state | [REQ SL-02] | Fourth status "Inactive" (evidence kept) |
| Starter cards push the table down | [AUDIT T1] | Starter libraries moved into "More ways to add" (DS DropdownMenu); the table is the first object |
| 6 columns and 2 buttons per row | [AUDIT T1] | 5 visible columns, one kebab; the skill name itself opens Configure |
| No bulk apply of a configuration | [REQ IM-14] | Bulk select, "Copy settings", "Configure n together" |
| No pagination or virtualisation at 178 rows | [dataset-spec 273] | DataTable `lazyLoading` (chunks of 40 after 80); board columns page 30 at a time |
| "Not configured" said three times on one page | [AUDIT T1 lines 189-192] | Said once: the warning banner (hidden while the list is already filtered to it) |

## 2. Regions and DS component per region (variant A, recommended)

```
+ PageHeader "Skills" ...................... [More ways to add v] [Import] [Add a skill] +
| KeyMetrics x4 (click filters)                                                        |
|  Skills 178 | Configured 160 (145 published) | Not configured 16 | Inactive 2          |
| LocalBanner warning "16 skills not configured" . "They cannot be mapped ..." [Show them]|
| LocalBanner success/result (after an action, with Undo or next step)                   |
| Tabs (saved views): All skills | Setup queue | Mapping check | custom...  [Save view] |
| DataTable: search, filter pills, Properties (columns, sort, group by), bulk bar        |
|  [ ] Section group header (count)                                                      |
|  Skill (link to Configure) | Status (StatusBadge) | Model | Courses (link) | Evals | ... |
+----------------------------------------------------------------------------------------+
```

| Region | DS component | Why |
|---|---|---|
| Header and actions | `PageHeader` via `PageFrame`, `Button` (text only, explicit variant and size), `DropdownMenu` | "Add a skill" filled primary, "Import" outline, starter list and "new list for a new standard" are secondary [AUDIT T1; CALL Oct 9] |
| Configuration progress | `KeyMetrics` cards, max 4, `onClick` filters the table | Backlog is the first admin job [REQ IM-10]; KPI max 4 rule |
| Hard stop | `LocalBanner` warning (amber) | Unconfigured skills cannot be mapped or submitted [REQ IM-09] |
| Result feedback | `LocalBanner` success with Undo or "Configure it" | Never a toast; in view after the action [strategy/02 321] |
| Saved views | `Tabs` line | Views are jobs (setup, mapping check), not statuses, so they do not repeat the KPI strip |
| Library | `DataTable` with an external `useTableState`, `groupable`, `selectable`, `searchable`, `showQueryControls`, `bulkActionsSlot`, `lazyLoading` | DS-native column chooser, group by, filters and bulk bar [ds-conformance-v2 165] |
| Status | `StatusBadge` (glyph + word + tone) | Never colour alone; amber for Not configured, never red |
| Row actions | `DropdownMenu` behind an icon `Button` with `aria-label` | One control per row |
| Lifecycle dialogs | `Dialog` + `RadioGroup` (intent), `AlertDialog` (delete), `Dialog` + `Select` (copy settings) | Confirm for anything that changes achievement [strategy/03 235] |
| Add a skill | `FloatingSheetPanel` (Header, Body, Footer), `Field`, `Input`, `Select`, `RadioGroup`, `Badge` chips, `AlertDialog` guard | Memory rule: DS OS sheets are FloatingSheetPanel |
| Loading | `Skeleton` in the final layout (4 KPI cells, table rows) | No lone spinner |

## 3. Variants and the question each tests

| Variant | Question | Layout | Mobbin basis |
|---|---|---|---|
| **A (recommended)** Table | Can a coordinator find, filter, group and bulk-configure 178 skills in one table with saved views? | DataTable grouped by section, saved views as tabs, bulk bar | Linear grouped list with counts and saved views [1][2][3]; Stripe customers tabs plus "Edit columns" [5]; Plane column chooser and bottom bulk bar [9][10] |
| **B** Grouped tree | Does the program's own Section > Group structure, with roll-ups, make setup progress easier to see and work through? | `Accordion` per section, `Collapsible` per group, "12 of 14 configured" plus an amber "n not configured" badge at each level, "Configure n here" and "Add a skill here" per section, "Most to set up first" toggle | Linear grouped list with "2 / 3" roll-ups [2]; Linear statuses settings tree [4]; Copilot Money collapsible category groups [12] |
| **C** Board | Does a board by configuration status beat a flat list for working through a part-configured library? | Four `Card` columns (Not configured, Configured, Published, Inactive), each scrolls inside itself and pages 30 at a time; `ViewSegmentedControl` switches to the list (A's table without views) | Square "View as Board / List" [11]; Plane/Basecamp status columns [9][13] |

Add a skill:

| Variant | Question | Mobbin basis |
|---|---|---|
| **A (recommended)** Side panel | Does a short sheet over the library get a coordinator to a saved, clearly unconfigured skill without losing their place, and invite configuring next? | Stripe "Add a product" right-side panel: required name first, more options folded, Cancel and Add [6] |
| **B** Inline row | When adding several skills by hand, is type, Enter, repeat worth deferring category, tags and model? | Canny inline "Enter idea title" row at the top of the table [14]; Airtable add row [15] |

Why A over B: the sheet is the only one that can show the model choice without a default [REQ SC-02] and the create-at-point-of-need pickers [REQ SL-05]; B wins only if hand entry is frequent, and REQ says bulk import is the main path [REQ IM-01, section 3].

## 4. Behaviour and states

| Item | Rule | Source |
|---|---|---|
| Status | Not configured, Configured (not published), Published, Inactive. One table in `lib/lab/library.ts` `STATUS_META` | [REQ IM-09, SC-19, SL-02] [strategy/03 5.3] |
| Link targets | Skill name -> Configure (`/lab/admin/configure-skill?skill=`); course count -> mapping (`/lab/admin/course-mapping?skill=`); evaluations -> attainment | [brief 5.3 record-linked navigation] |
| Not configured | Courses cell reads "Cannot map yet" (no link); Map to courses menu item hidden | [REQ IM-09] |
| Deactivate | Dialog asks "Why remove?": "added by mistake" (deactivate; leaves mapping, selection, reports; reversible) or "a new standard replaces it" (start a new list). States the evaluation count kept | [REQ SL-11] [CALL Oct 9, Aarti] [strategy/03 section 9] |
| Delete | Enabled only with 0 evaluations and 0 courses; otherwise the menu item is disabled with "Has 398 evaluations, so it cannot be deleted" | [strategy/03 section 9] |
| Bulk | Copy settings (choose a configured source; targets become Configured, not published), Configure n together, Deactivate | [REQ IM-14] |
| Add a skill fields | Name (required, duplicate check case and space insensitive), Section (required, new allowed), Group, Category, Tags (any number), Requirement when mapped (optional), Evaluation model (optional, **none preselected**) | [REQ IM-12, SL-03..05, SC-01, SC-02, CM-03] |
| Save | "Save" closes and shows the result banner; "Save and configure" goes to Configure for the new skill | [REQ SC-01] |
| Unsaved changes | Close, Escape, outside click or Cancel on a dirty form opens "Discard your changes?" with focus on "Keep editing"; `beforeunload` guard while dirty | |
| Errors | Inline under the field, `{what failed}. {what to do}.`; DS Field error styling | [strategy/02 294] |
| Loading / empty / error | Skeleton; "Your skills library is empty. Add skills from a file or one at a time." with Import and Add one; error banner with Try again | [strategy/02 49, 307] |
| Scale | 178 skills, 28 sections (10 HGTC sections plus sample starter sections), 17 HGTC groups; DataTable lazy rendering; tree and board scroll inside their panel | [dataset-spec] [strategy/01 348, 357] |

Copy: sentence case, no em dashes, "skills" from `lib/lab/terms.ts`, never "items". Prose above the fold is the banner (16 words) plus KPI captions, under the 40-word desktop budget [strategy/02 4.2].

## 5. Data

Read-only from the scaled v2 seed: `state.skills`, `state.mappings`, `state.batches`, `evalsOfSkill` (`lib/v2/evidence-index.ts`), section and group from `lib/v2/hgtc-library.json`. Selectors the v2 lib does not have are in `lib/lab/library.ts` (`buildLibrary`, `buildTree`, `countLibrary`, `byStatus`, `validateDraft`, `pickerOptions`). All writes (add, edit, copy settings, deactivate, reactivate, delete) go to a lab-local overlay in the browser tab, never to the v2 store. The seed has no inactive skill (v2 never built it), so the lab marks two published Safety skills inactive as a visible demo (`demoInactiveIds`).

## 6. Open points for Romit (not decided here)

1. **Inactive or Retired?** The brief said "Retired"; REQ SL-02 and strategy/03 say "Inactive", and the call says "inactivate". The lab uses Inactive; it is one label in `STATUS_META`. `[PENDING-ROMIT]`
2. **Section, group and category overlap.** REQ has one optional category per skill [SL-03] and imports may propose headings as categories [IM-07]. The HGTC list has sections and groups too. The lab keeps all three; one may be redundant. `[INFER]`
3. **Requirement when mapped.** REQ sets mandatory per offering [CM-03, CM-06]. The sheet offers an optional default only, labelled "Each course can change it". Drop it if it reads as a skill-level flag. `[INFER]`
4. **Starter libraries** stay reachable from "More ways to add" but conflict with the hard stop on shipped skills [REQ SL-01] [LEDGER Q5].
5. **Copy settings across models** is allowed to any configured source; whether it should be limited to the same model (SC-09) is open. `[INFER]`
6. "Configure n together" links to the configure screen with `?skills=`; that screen must accept a set (another worker's screen).

## 7. Mobbin references

1. Linear, issues grouped by status with filters: https://mobbin.com/screens/fd1b4d88-f021-49a3-98af-4cd3a87e1d29
2. Linear, project issues grouped with "2 / 3" roll-up counts: https://mobbin.com/screens/ef923b0e-9a40-4fdd-80f2-f3aafb4f36ce
3. Linear, saved view "Save to Personal" with filter menu: https://mobbin.com/screens/ed670cda-0527-4716-a1a6-0159f12c4f42
4. Linear, settings tree of statuses with counts: https://mobbin.com/screens/e494c7a9-8c56-4840-bca4-a0324b332710
5. Stripe, customers with saved-view tabs, filter pills, Edit columns: https://mobbin.com/screens/eade1912-e11c-4d70-9556-1527dbd9837c
6. Stripe, "Add a product" side panel: https://mobbin.com/screens/f0721d55-7d3c-4827-ba9e-e6bcbdfe9c2d
7. Sprig, floating bulk action bar on selected rows: https://mobbin.com/screens/1d3533e8-7c1d-48cf-9a99-99ec4fc3c654
8. Meetup, selection count and bulk export bar: https://mobbin.com/screens/755f717f-b938-4090-89be-3aa6d9c2ec4f
9. Plane, grouped work items with bottom bulk bar: https://mobbin.com/screens/7f0b7bee-acd1-4a60-99dd-21bcb8f75c73
10. Plane, column chooser (Properties): https://mobbin.com/screens/418d01d1-95a4-4d63-98a7-fbc561af4029
11. Square, "View as Board / List" toggle on a status board: https://mobbin.com/screens/8d75c04b-1d38-4fd8-8340-de79ce82ef47
12. Copilot Money, collapsible category groups with a side summary: https://mobbin.com/screens/b540379b-f62e-4115-8654-62ad2342928e
13. Basecamp, card table by status: https://mobbin.com/screens/52476c45-1afb-415f-826e-6f8ef09182df
14. Canny, inline new row at the top of the table: https://mobbin.com/screens/d566deca-9ded-4465-9abe-c63f1a9b5b1c
15. Airtable, grid view add row menu: https://mobbin.com/screens/fcb71c04-9de8-47d6-9d57-ea82310f3dc2
16. Base44, confirm before a destructive bulk action: https://mobbin.com/screens/38515bce-6b9d-4a0c-b60f-f455a449801b
