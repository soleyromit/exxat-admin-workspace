# ADMIN-D6 Skill lists

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D6

Build scope 2026-11-04: list size against members only ("154, 2 inactive").

Build scope 2026-11-05 (D-L106, designer: "super confusing with a lot of text, toggles, tabs"; Aarti 205da2dd ch 9; Sankalp 365abc25 ch 9-11): one page, one table, one panel. Assign stops being a page and a walkthrough stop and merges here (ADMIN-D7). No Save on the page; `exceptStudentIds` leaves the UI and the data path.

## Task test IDs
T1 T2 T3 T4 T5 T6 T7 T8 T9 N1 N2 N3 N4 N5 N6 N7 N8 N9 T10 T11 T12 T13 T14 T15 T16 T17 T18 T19 N10 N11 N12 T20 T21 T22 T23 T24 T25 T26 T27

## Amendment 2026-11-15 (Sankalp feedback on Skills > Setup > Skill lists; Proposed, for Romit)

Sources consulted: docs/knowledge/00-design-brief.md, glossary.md, 02-decisions-ledger.md, ds-usage-map.md; REQ SC-01, IM-09; LEDGER D-X17, D-L85, D-L106, D-L122. Sankalp's words (relayed by Romit): "Skills > Setup > Create Skill list > Give a name > Add skills under it; 3) For new list they can clone the earlier list; 4) Currently no way to delete a skills list; 5) No select all when adding skills to the list; 6) Adding skills to a group and configuring should be separate steps." Point 1 or 2 may be missing [INFER: the first points are the create flow in the same sentence].

Job: an admin sets up a skill list in the order they think: name it, put skills on it, optionally tune how they are judged, then choose who has it. Journey: Skill lists (this page) -> New skill list -> panel steps -> back on the table with the list in it (receiver cue: the result banner names the list and the table row shows its skill count and "Not assigned"). Walkthrough step ids and order are unchanged (lists, settings, map, ...); everything below happens inside the `lists` stop.

### a) Name first, then skills [CALL: Sankalp, name-first order only]
The four-step structure is [INFER, pending Romit]. It supersedes the step count of D-L122 ("three steps": name and skills, how judged, assign) by splitting its first step in two, and keeps D-L117 (one side panel, no full page) intact: the steps are levels inside the same panel.
```
Step 1 of 4  New skill list          Step 2 of 4  Add skills                                   Step 3 of 4  Configure (optional)   Step 4 of 4  Assign
[Name ____________]                  [Find or add][Choose from library][Copy from a list v]     "{n} of {m} skills not configured"     existing assign step
                                     [ ] Select all {N} skills in the library                   [Configure skills (n)], search
                         [Next]      rows, count            [Save and continue]                 [Next]                                 [Assign ...]
```
- Step 1 holds only the name (updated 2026-11-15: "Start from" moved to step 2 as Copy from a list, ADMIN-D6a amendment 2026-11-15b). Next validates the name (empty, too long, duplicate) and moves to step 2 without saving anything. Back from step 2 returns to step 1 with the typed name kept.
- Step 2 "Add skills" (ADMIN-D6a amendments 2026-11-15b and c). Its primary reads "Save and continue": it saves the list (needs at least one skill) and opens step 3. Step labels read "of 4"; no step id or route changes [INFER].
- Navigation (ADMIN-D6a amendment 2026-11-15c): Back and Esc step back one step on every step, including from step 3 to step 2 on the saved list; X and a press outside leave the flow for the Skill lists table; finishing step 4 lands on the table with the result banner.

### b) Start from an existing list (clone) [LEDGER D-X17: "a new list starts blank or as an explicit copy from; never silently cloned"]
- Superseded 2026-11-15 (ADMIN-D6a amendment 2026-11-15b): there is no "Start from" on step 1. Step 2 has "Copy from a list", a menu of the program's other lists that hold skills, each with its skill count, shown only when such a list exists.
- Choosing one opens "Copy from {list}" in the same panel with that list's active skills all ticked (search, Filters, Select all); the footer adds them. It adds to what is already on the list and never removes or repeats a skill [INFER]. No line on screen says what is not copied (Romit 2026-11-15: "remove unnecessary sub titles").
- What copies: the skills only. Not copied: which cohorts, groups or students have it (a new list starts on no one: `createList` in lib/lab/lists.ts), per-skill settings (they live on the skill, so they come with the skill) [INFER], course mappings (a mapping belongs to an offering, REQ CM, not to the list) [INFER], the default flag [LEDGER D-X17: one default]. The required marks and the minimum total of the source list are also not copied [INFER; nothing in REQ says a list's rule is inherited].
- Open question for Sankalp, not decided here: should a clone also copy "required" marks and the minimum total? [PENDING-SANKALP]

### c) Delete a skill list [CALL: Sankalp] [INFER for every rule below: the REQ has no list-deletion text; D-X15 covers deleting skills only]
- The row menu on the table and the same menu in the panel always show "Delete" (today it disappears for a list someone has and for the default, so people read it as missing).
- Default list: "Delete" is disabled and the reason sits in view under it (RowMenu `blockedBecause`, reachable by touch and keyboard): "New student groups get this list. Make another list the default first." Delete is still blocked when the list is the only one [INFER: a program keeps one default].
- A list that someone has: allowed. The confirm dialog (DS AlertDialog, destructive action "Delete skill list", Cancel first) names what goes: "{n} skills leave this list. They stay in the library." and who is affected: "{Groups} and {n} students have this list. They will have no skill list until you assign another. Their evaluations are kept." Evaluations kept follows RemoveFromListDialog wording [INFER]. Lists nobody has keep the short text.
- Feedback is a LocalBanner (ResultBanner) "{name} deleted." with Undo, replacing today's no-undo banner; no toast [workspace rule, CLAUDE.md]. Focus returns to New skill list [INFER].

### d) Select all in the add-skills picker [CALL: Sankalp]
- The picker (SkillPicker) gets a header row: DS Checkbox (checked / indeterminate / unchecked) labelled "Select all", plus the count "n of N skills selected" where N is the skills in the current search and category result and n is how many of those are on the list. When a search narrows the result, the label says "Select all N matching" and a second figure "M on the list in all" appears only if M differs.
- It acts on the whole filtered result, not the rows drawn: the picker draws every row (content-visibility) and has no pages, so the explicit "Select all N skills matching the filter" link the brief allows for paged results is not needed and is not drawn [INFER: re-check if the picker ever pages]. 100+ skills: one press selects them all; the polite count updates once.
- The old "Select all shown" / "Clear all shown" text buttons are replaced by this row.

### e) Adding skills and configuring them are separate steps [REQ SC-01] [REQ IM-09] [LEDGER D-L85]
- Adding a skill to a list (Write a skill, Choose from library, Add several, Copy) never opens a configure form (the Library add sheet already carries no evaluation model [INFER, read from the code]).
- After the list is saved, step 3 is titled "Configure skills", marked "Optional" and says "{n} of {m} skills are not configured. They stay on the list. They cannot be mapped to a course or submitted against until they are configured." When n is 0 it says "All {m} skills are configured." The one action is "Configure skills ({n})" (outline), linking to the configure screen for the not configured ones (several at once where the configure variant accepts them, else the first); the panel's footer Next continues to Assign without it. The per-skill rows with badge and Times needed stay below.
- The list panel's Skills section shows "{n} not configured" with a link to the same place when n > 0. The Not configured badge in the picker rows stays.
- Hard stop kept: no copy says an unconfigured skill is usable; mapping and submission wording is REQ IM-09's.

### States (new or changed) [all INFER: design detail, no REQ or LEDGER line]
| State | What shows |
|---|---|
| Step 1 empty submit | "Give the list a name." under the field, focus in the field |
| Step 1 duplicate / too long | existing validateListName messages |
| Step 2, no other list with skills | no "Copy from a list" button |
| Step 2 none yet | existing FirstRun "No skills on this list yet"; error "Add at least one skill." on Next |
| Picker, nothing matches | "No skills match." with Clear; header checkbox disabled, count "0 of 0 skills selected" |
| Picker, library empty | existing "There are no skills yet. Add them in the Library." |
| Delete: loading | none (in memory); error: none reachable [INFER], the Lists page error banner covers a load failure |
| Delete default | disabled with reason |
| Step 3, all configured | "All {m} skills are configured." and no Configure button |

### DS mapping
Select (`@exxatdesignux/ui/components/ui/select`), Checkbox, AlertDialog, DropdownMenu through RowMenu, Button (explicit variant and size), Field/FieldLabel/FieldError, StatusBadge, FloatingSheetPanel parts, LocalBanner via ResultBanner. No new component file; no hand-rolled button, badge or dialog. Tokens only.

### A11y
Header checkbox has an accessible name ("Select all {N} matching") and `aria-checked="mixed"` when some are on (DS Checkbox indeterminate); count is `role=status` polite; the disabled Delete keeps its reason in `aria-describedby` (RowMenu); every step change moves focus to the step's first field; step 2 "Copy from a list" is a labelled menu button.

### Acceptance checks (named so tests and the browser walk can cite them)
A1 name step then skills step; Back keeps the name. A2 clone fills step 2, copies skills only, no assignment. A3 delete default is blocked with a reason; delete an assigned list names who is affected; Undo restores. A4 header checkbox selects all N matching the filter and the count reads "n of N skills selected". A5 adding skills opens no configure form; step 3 is optional and counts not configured.
