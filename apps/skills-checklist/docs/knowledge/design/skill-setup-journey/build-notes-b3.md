# Build notes, builder B3: skills library and add a skill

**Written:** 2026-10-26. **Scope:** `02-skill-setup-content-and-ui-strategy.md` sections 5 and 6, rules L1 to L12 of `01-layout-patterns.md`, the caller's brief (which overrides the spec where they differ; differences listed below). Nothing here decides an `OD-*`.

## What was built

| Route | Option set | Template | What the reader sees |
|---|---|---|---|
| `/lab/admin/skills-library?variant=A` | 1 Guided | T1 list (T4 split when a row is open) | Title, one filled "Add a skill", one outline "More". One banner (result, else "16 skills are not configured" said once, hidden on the Not configured tab). Status tabs that carry the counts (All 178, Not configured 16, Configured 15, Published 145, Inactive 2), search and a small View menu on the tab row. DataTable grouped by category, bulk bar only on selection, row opens a FloatingSheetPanel with one primary (Configure, Check and publish, Open configuration or Reactivate) |
| `?variant=B` | 2 One page | T1 (T4 when open) | Same frame and tabs. Category tree in a DS Table with roll-ups ("21 of 25 configured", amber "4 not configured"); one menu per category; one menu for sort and expand; inline "Add a skill to {category}" row per open category; same detail panel |
| `?variant=C` | 3 Many at once | T1 board (T4 when open) | Same frame. Board or List switch, search, category select on one row. Four status columns whose headers carry the counts (no tabs, no KPI strip). "Configure 16 together" on Not configured only. List view is the set 1 table with tabs |
| `/lab/admin/add-skill?variant=A` | 1 | sheet over T1 | Add sheet (24 rem): Name, Category, Tags, Required to graduate. No evaluation model. "Save and configure" is the one primary; "Save for later" outline; Cancel ghost |
| `?variant=B` | 2 | inline row in the tree | Inline row under the first category that needs setup; Enter adds and keeps the row open |
| `?variant=C` (new) | 3 | sheet over the board | "Add several skills": paste or type names, one per line; one category for all; live count and skipped lines (already in the library, repeated, too long); "Add {n} skills" creates them not configured; success banner offers "Configure them together" |

States on every variant: `?state=loading` (skeleton tab row plus 48 px rows), `?state=empty` ("Your skills library is empty", one outline action), `?state=error` (error banner with Try again). Record in the URL: `?skill=`; tab: `?status=`; board or list: `?view=list`.

## Files

- `admin/lib/lab/library.ts`: `LIBRARY_TABS`, `tabCount`, `rowsForTab`, `requiredToGraduate` on rows and drafts, `NO_CATEGORY`, category optional in `validateDraft`, duplicate message "{Existing name} is already in the library.", `findDuplicate`, `parseSeveral`, two layout-only saved views.
- `admin/components/lab/library/library-chrome.tsx` (rewritten): `LibraryFrame`, `LibraryActions`, `LibraryTabs`, `LibraryBanner`, `useStatusTab`, `useOpenSkill`, `useUrlParam`, loading, empty, error. KPI strip and Sample data pill removed.
- `library-table.tsx` (rewritten), `skill-sheet.tsx` (rewritten: four fields, no model), `inline-add-row.tsx` (rewritten as a table row), `row-actions.tsx` ("Edit details", rail trigger marks), `use-library.tsx` (`addMany`, banner copy), new `skill-panel.tsx`, new `add-several-sheet.tsx`.
- Screens: `admin-skills-library-a/b/c.tsx`, `admin-add-skill-a/b.tsx`, new `admin-add-skill-c.tsx`.
- Registry: `components/lab/screens/index.ts` (add-skill C), `lib/lab/screens.json` (add-skill tier 1 with C; library A and B questions; `KeyMetrics` replaced by `Tabs` in required components; `Select` dropped from add-skill required).
- Tests: `admin/tests/lab/library.test.ts` (tab counts equal library counts and the shared facts; deactivation through `setSkillsActive` moves a skill to Inactive in tabs and facts together; add several parsing; category optional; required to graduate).

## Where I departed from the spec, and why

1. **Tabs** follow the caller's list (All, Not configured, Configured, Published, Inactive), not the spec's "Not published". "Configured" means configured and not yet published (`STATUS_META.configured.short`).
2. **Primary placement**: Import, Add several and starter libraries sit in one outline "More" menu (caller); the spec showed Import as a visible outline button.
3. **Add sheet fields**: Name, Category, Tags, Required to graduate (caller). The spec had Description and folded tags; Description is not in the sheet.
4. **Add several** creates skills directly (caller) instead of handing off to import step 3 via `sessionStorage` (spec 02 section 6). It applies the same normalised-name repeat rule as the sheet. If Romit prefers the import hand-off, `parseSeveral` output is the payload.
5. **No ValidationSummary in the two sheets.** Each has one field that can fail, so a summary above it repeated the same sentence (L11 beats L9 here). The error is a FieldError and focus moves to the field. Shot `b3-add-skill-A-duplicate-1440.png`.
6. **No DS filter bar on the table.** DataTableToolbar always renders the filter bar and counted as a fifth region and two more controls; tabs, grouping and search already narrow the list. Toolbar is a DS `Input type="search"` bound to the table state plus the View menu.
7. **Bulk "Configure n together" is outline**, so the header primary stays the only filled button (L2).
8. **Set 3 header** "Add a skill" opens the one-at-a-time sheet (same action placement in every set); "Add several by name" is in More.

## Layout detail worth knowing

The DS line `TabsList` wraps itself in a full-width sticky subheader. To share its row with the toolbar at 1280 px and up, `LibraryTabs` gives that wrapper `flex-1 min-w-0` through a child selector (layout only, no visual override). Below 1280 px the toolbar drops under the tabs, right aligned, so all five tabs keep their labels at 1024 (the DS overflow ladder had moved three into a menu).

## Verification (pasted from the runs)

- `npx tsc --noEmit`: exit 0.
- `npx vitest run tests/lab`: 26 files, 310 tests passed.
- `node scripts/lab-ds-gate.mjs --write` then `node scripts/lab-ds-gate.mjs`: PASS for all six of my variants; "93 built variant(s) checked. GATE PASSED".
- `node tests/lab/consistency.mjs http://localhost:3017`: 25 of 25 (the script has no library check; the library tab invariant is in `library.test.ts` and was also read off the rendered pages: All 178, Not configured 16, Configured 15, Published 145, Inactive 2 on A, B and C list, equal to facts skillsNotConfigured 16, skillsInactive 2, skillsConfigured 162 = 15 + 145 + 2).
- Write path: deactivating one published skill from the row menu moved tabs to Published 144, Inactive 3; still 3 after reload and on set 3 List.
- Density (`node tests/lab/density-budget.mjs --only=admin/skills-library,admin/add-skill`):

| Screen | V | Type | Regions | Figures | Controls | Words | Hues | Result |
|---|---|---|---|---|---|---|---|---|
| skills-library | A | list | 4/4 | 0/0 | 9/6 | 13/40 | 0/2 | FAIL controls |
| skills-library | B | list | 4/4 | 0/0 | 9/6 | 13/40 | 1/2 | FAIL controls |
| skills-library | C | list | 3/4 | 0/3 | 6/6 | 13/40 | 1/2 | PASS |
| add-skill | A | form | 5/4 | 0/1 | 10/7 fields | 26/40 | 0/2 | FAIL regions, controls |
| add-skill | B | form | 4/4 | 0/1 | 6/7 fields | 13/40 | 1/2 | PASS |
| add-skill | C | form | 4/4 | 0/1 | 5/7 fields | 25/40 | 1/2 | PASS |

  The A and B list fails are the 5 status tabs counted one each (5 + Search, More, Add a skill, View or Sort = 9). Spec 02 section 8 targeted "6 + 5 tabs" and flagged counting the tabs as one view control `[INFER]`; with that rule both are 5/6. Add a skill A is a sheet over the list, so it is a split (budget regions 5, controls 8), but the script types `admin/add-skill` as `form` and counts the status tabs as fields. Both are script-config calls for B4 (`VARIANT_TYPE["admin/add-skill/A"] = "split"`, and a tabs-as-one rule for lists), not changes I can make in my files.
- One filled primary on every rendered case at 1440 and 1024 (read from the DOM in the shot run), no horizontal page overflow on any case.
- Screenshots: `docs/knowledge/design/lab-shots/b3-*.png` (every variant and state at 1440 and 1024, plus duplicate name, added, unsaved guard, bulk bar, pasted list, added several, board panel).

## Open for Romit

- Category versus section and group is still `[PENDING-ROMIT]` (spec J9). The UI calls the file's top level "Category"; the group shows as muted text under the name.
- Grouping by category shows many one-skill categories first (Airway 1, Assessment 1) because the data has 28 top-level values; the DataTable sorts groups by name. The tree (set 2) keeps library order with a "Most to set up first" sort.
- Add several: create directly (built) or route through import Fix (spec)?
