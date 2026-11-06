# ADMIN-D2 Add

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D2

Build scope 2026-11-04: truth only (Bulk upload and Starting points make no false claim; edit mode leaves the sheet). The D2 redesign, map step G5, is not in this build.

## Other actions
| Action | Where | Why |
|---|---|---|
| Add several, Bulk upload (Later), Starting points (Later) | Chevron beside Add a skill | Same job, one menu [map D1] |
| Open it, on a repeated name | Inline under the Name field | Leads to the existing skill instead of a second one |
| Show them | The result banner after Add several | Filters the Library to what was just added |

## Task test IDs
A1 A2 A3 A4 A5 A6 A7 A8 A9 A11 A12 A13

## Build 2026-11-05 (T6, basics of Add a skill and Add several)
Add a skill: one primary and Cancel, Category reads optional, a repeated name warns and offers the choices. Add several: first cell only [REQ IM-03], other cells reported [REQ IM-08], unread lines stay in the box [REQ IM-08], Show them, summary and banner use one wording. Duplicate rule in one place, `duplicateChoices`: Skip, Replace, Keep both while the library skill has no evidence; Skip and Keep both with evidence, OD-13 open [REQ IM-06]. The `paste` stop renders the table.
The map's D2 now says what is built (2026-11-05), so these are no longer differences: a name in the library defaults to Skip [REQ IM-06], "Add another" not built [INFER].

## Rework 2026-11-05 (independent review of Add a skill and Add several)
- Second submit does nothing; no result banner for nothing done. Skip chosen: Add skill disabled, never a bare "Skip" (rule E4).
- Add several is modal like Add a skill. Focus opens in the first field and returns to the button that opened the sheet. Open it and browser Back ask first while changed.
- Banner actions are one style, the DS outline button (`LabLocalBanner`), for every lab banner: the DS draws `href` and `onClick` differently.
- `?program=new` is the Library page itself (`SkillsLibraryTablePage`), with Set up skills or Continue setup outline beside the add button. Empty: the same columns and "No skills yet".
- The inline add row is gone from `?program=new` [INFER]: it read "Add a skill, or paste a list" under a header that says Add a skill with Add several behind the chevron, so it was a second door for one job. Step 1 of the wizard keeps it, having no such header. This narrows D-L46 ("add row shared with step 1"), still Proposed.
- `?state=empty`: Add a skill is the filled button, Set up skills outline, and an added skill shows its row.
