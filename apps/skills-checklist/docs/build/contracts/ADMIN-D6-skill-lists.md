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

---

## Amendment 2026-11-16 (lists-1116): toward Sankalp's 16 Nov prototype (Proposed, D-LS1116-a, -b, -c)
Source: Romit 2026-11-16 approved moving Skill lists toward the prototype `[PROTO 11-16, 10, 11, 16, 23, 25]`; clean-UI rule (Romit 2026-11-16: "make the ui clean where we don't add extra sub titles, or bold unnecessary"). Behaviour precedence REQ > CALL > PROTO > INFER.

### Requirements this surface must satisfy (every variant)
| ID | Quote (REQ) | Where |
|---|---|---|
| SC-01 | "A skill may exist in the library unconfigured, and configuration may be completed later." | Method cell reads "Choose a method" for an unconfigured skill; nothing is preselected |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | Method select has no default for a skill without one; the program's method is offered, never applied silently |
| AE-02 | rule changes show who changes | Method change names the students whose progress changes before it applies |
| SL-03 / SL-10 | category grouping and filters | List page stays grouped by category (DS DataTable `groupable`, `groupBy: section`) |

### a) Skill lists table (D-LS1116-a)
```
| Name                         | Students | Skills            | Assigned to             | ... |
| Clinical skills checklist ★  | 123  ->  | 154  (2 inactive) | [Class of 2026] [..]    | ... |
```
- New Students column: everyone the list reaches (groups and named students, counted once, `studentsOnList`). The number links to Reports scoped to that list (`admin/attainment?skillList=<id>`), where those students are listed. 0 reads "0" with no link.
- Skills column unchanged (total, inactive under it). The required / optional split is NOT drawn: see D-LS1116-b; every skill on a list is owed (D-L54, glossary "All assigned"), so a split would read "154 required, 0 optional" everywhere and use a retired word.
- Row menu gains Duplicate (slot lifecycle). It opens New skill list with the name "{name} (copy)" (then "(copy 2)"), the source's skills ticked on step 2, no assignment. Rename, Change skills, Delete with its confirm and the D-L131 tags stay.

### b) A list's skills page (D-LS1116-b)
```
| [ ] Skill            | Times needed | Category | Evaluation method        | Status | ... |
| [ ] ASSESSMENT  6                                                                     |
| [ ] Head to Toe      | [ 1 ]        | Assess.  | [Independence levels v]  | Active |
| [ ] New skill        | [ - ]        | Assess.  | [Choose a method      v] | Active |
```
- Configuration (Default / Custom / Not configured) is replaced in view by Evaluation method, a DS Select per row listing the saved methods of Evaluation settings (`methodsOf`). The method is the skill's, the same in every list (prototype "Method, all lists"); Configuration stays as a filter field so `?config=` links still work.
- Choosing a method: when students' progress would change, a DS AlertDialog names how many and the first names, with "Change method" and "Keep current"; otherwise it applies at once and a polite live line says so. Inactive skills show their method as text, no select.
- Grouping by category is the DS DataTable's own (`groupable`, saved view By category). Times needed stays per skill on this page.
- Required / Optional per list is NOT added: a question for Sankalp (REQ SC-11, SC-12 do not cover it; D-L54 and the glossary make every skill on a list owed; adding it would make the list page disagree with My progress and Reports).

### c) Saving a change to a list students are on (D-LS1116-c)
Merges with D-L119 (does not replace its entry point): Change skills still opens the list's skills in the panel; nothing changes until Save. Save now opens a DS Dialog:
```
+ Who should this change apply to? --------------------------- x +
| 123 students are on Clinical skills checklist.                  |
| ( ) Update it for everyone on it                                |
|     Evaluations already recorded still count.                   |
| (o) Save as a new skill list                                    |
|     Current students keep Clinical skills checklist.            |
|                                   [Cancel] [Save as new list]   |
+-----------------------------------------------------------------+
```
- Default choice: Save as a new skill list (Aarti 205da2dd ch 9: a change is a new version). Primary label follows the choice: "Update for 123 students" or "Save as new list".
- Update: the list's skills change in place, a success banner "{list} updated for {n} students." with Undo. Save as new: today's D-L119 result ("{list} v2", on no one).
- Cancel and Esc return to the picker with the ticks kept.

### States
| State | What shows |
|---|---|
| No saved methods (new program) | Method cell "Choose a method" select with one disabled line "No methods yet" and a link to Evaluation settings in the empty select |
| Method change refused (rule cannot hold the skill's numbers) | warning banner with the reason, value unchanged |
| List reaches 0 students | Students "0", no link |
| Duplicate name taken | "(copy 2)" etc.; validateListName still runs on step 1 |

### DS mapping
DataTable (groupable), Select, Dialog, RadioGroup, AlertDialog, Button, StatusBadge, RowMenu (DropdownMenu). No new component file outside `components/lab/library/` and `components/lab/admin-a/`.

### Acceptance checks
L1 Students column shows 123 for Clinical skills checklist and links to Reports with `skillList=list-clinical`. L2 Duplicate opens step 1 with "Clinical skills checklist (copy)", step 2 has every skill ticked, the saved list has no groups. L3 a list page row's method select lists saved methods; picking another one changes the skill's method on every list. L4 Change skills then Save on an assigned list opens the dialog; Update edits in place with Undo; Save as new makes "{name} v2" on no one. L5 no subtitle restating a label, no bold beyond titles and headers, no em dash, no "items".

### d) New skill list is one short dialog (D-LS1116-d, Decided, Romit 2026-11-16; [CALL 11-16] Sankalp)
```
+ New skill list --------------------------------- x +
| Name                                                 |
| [______________________________]                     |
| Add a description                                    |
| Who uses it                                          |
| (o) All students                                     |
| ( ) Specific cohorts                                 |
|     [BSN 2027, ABSN 2027                       v]    |
| 43 students. 2 cohorts move to this list from        |
| Clinical skills checklist.                           |
|                                  [Cancel] [Create]   |
+------------------------------------------------------+
```
- Create lands on `/admin/library?list=<id>`; the empty list offers Choose from library (`/admin/lists-cohorts?list=<id>&pick=1`, the list's picker), Create a skill, Bulk upload. Adds made on that page go on the list.
- The four-step panel (D-L117, D-L122, D-L156) is removed; old `?setup=configure&list=` links open the list's panel.
- Specific cohorts with none picked: "Choose at least one cohort." (a duplicate may start on no one). Picked cohorts leave the lists they were on.
- Skill lists with no lists: one line and "Create skill list".
- Supersedes this amendment's a) note on the required / optional split: not drawn, Required / Optional is a course-level setting (Sankalp).
- Checked with no scroll at 1440 x 900 (dialog 383 px) and 375 x 812 (419 px).

### e) New skill list opens in a right-side panel (D-LS1116-e, Decided, Romit 2026-11-16: "can you do the new skill list in a panel?")
Only the container changes from d): the DS Dialog becomes the lab's `FloatingSheetPanel` (`@/components/lab/shared/sheet`), side right, size `md`, `contentSlot="lab-admin-list-new"`, the same family as the list panel (`lab-admin-list-panel`). Same fields, same validation, same create and landing (`/admin/library?list=<id>`).
```
Skill lists (page)                       + New skill list ----------------- x +
                                         | Name                               |
                                         | [___________________________]      |
                                         | Add a description                  |
                                         | Who uses it                        |
                                         | (o) All students                   |
                                         | ( ) Specific cohorts               |
                                         | 123 students                       |
                                         |                                    |
                                         +------------------------------------+
                                         |             [Cancel] [Create skill list] |
```
- Toolbar (close X only, no size menu), header "New skill list" (Duplicate: "Duplicate {name}"), body, DS `FloatingSheetPanelWorkflowFooter`: Cancel and one primary "Create skill list" (Duplicate: "Duplicate"), no icon, submits the form.
- Focus goes to Name on open; an empty name keeps the panel open and focuses Name; X, Esc, Cancel and a press outside with typed input ask through the lab's DiscardChangesDialog ("This skill list has not been created."); focus returns to the opener on close. Full width at 375 (the DS panel is full width on compact screens).
- The cohort picker is still a Popover + Command, above the panel (`ABOVE_PANEL_MENU`). Opening it replaces the list's own panel (single rail).
- Acceptance: P1 New skill list opens a panel (role dialog, `data-slot` `lab-admin-list-new`), no centred modal. P2 the checks of d) hold unchanged in the panel. P3 Esc with typed input asks before discarding.
- Amended 2026-11-16 (D-LS1116-f, Decided, Romit: "after creating the skill lists, the user shouldn't go inside the skill list. it should stay at the landing page."): Create and Duplicate no longer navigate to `/admin/library?list=<id>`. The panel closes, the page stays on Skill lists with the new row in the table, and a success `LocalBanner` reads "{name} created." with one action, "Add skills", linking to that list's skills page (`listSkillsHref`). Focus returns to the opener; the banner is a polite live region. Acceptance P4: after Create the URL path is unchanged, the row is present, the banner shows, "Add skills" opens the list's page.

## Round 2026-11-16 (add-skills): adding skills to a list (Proposed, D-ADD1116; lab variants D and E of `admin/skills-library`, A kept)
Romit 2026-11-16, on a list's skills page: "when i click on choose from library, or bulk upload, or add skill, add several. It doesn't fit well with the experience."

### Diagnosis of the current page (variant A; walked at 1440 and 375, empty list and Clinical skills checklist)
| What happens | Why it does not fit | Principle |
|---|---|---|
| Four ways to add, as peers, in two places with different names and counts: header split button "Add a skill" plus a chevron menu (Choose from library, Add several, Bulk upload, Starting points) and the empty state (Choose from library, Create a skill, Bulk upload) | The admin picks a method before saying what they want; the two places disagree | Hick; Nielsen consistency |
| Each way opens a different container: Choose from library leaves the page for Skill lists with a panel; Add a skill is a narrow sheet (382 px); Add several a wide sheet (638 px); Bulk upload a four-step page | No shared frame, so nothing learned in one carries to the next | Jakob; consistency |
| Choose from library is titled "Change skills", on another page, and Save can also remove skills | The admin asked to add; the place is lost and the verb changed | Match between system and the real world; error prevention |
| Nothing says where the skills go: Add a skill and Add several never name the list; Bulk upload asks for the list again | The destination is the one fact that matters here | Visibility of system status |
| Select all sits one level down, on the other page | Sankalp and Aarti asked for it at the point of adding | Recognition over recall |
| The header's filled button adds one skill; the common job on a new list is many | The primary is not the main job | Pareto; Fitts |

### Requirements both variants carry (every way in)
- SL-02 "A skill has a name, a description and an active/inactive status." Name and description on each new line (Review each line).
- SL-03, SL-04, SL-05 category (one, optional) and tags (many), created where needed, for the names typed or read.
- SL-10 the library picker searches by name and filters by category.
- IM-01 "create skills in bulk by supplying an existing list"; IM-02 spreadsheets, documents, PDFs (the file is read into the names box; Bulk upload stays one link away for a file with headings, IM-04, IM-07).
- IM-05 nothing is created until the admin presses Add; each line can be renamed, described or left out first. IM-06 a name already in the library: use it, keep both, or replace. IM-08 lines not read stay, with their text.
- IM-09, SC-01, SC-02 a new skill arrives as the program's settings make it; nothing is preselected; the not configured banner stays [IM-10]. IM-12 one skill by hand stays possible (one line).
- D-LS1116-c a list students are on asks who the change applies to. D-X17 copying from another list is explicit. D-L157 the back icon leads to Skill lists.

### Concepts considered
| Concept | Mental model | Built |
|---|---|---|
| 1 One "Add skills" panel with two tabs (From library, New skills; a file fills New skills) | A drawer over the list; the list stays in view | D |
| 2 An add step as the page: library on the left, new names on the right, one footer | A build step; an empty list opens on it | E |
| 3 "Not on this list" as a tab of the table, with an Add action per row and a find-or-add field | Incremental, no commit | No: 176 single adds, and select all then needs its own bulk bar |
| 4 A chooser of four tiles (library, copy a list, type, upload) | Pick a method first | No: the same peer choice the diagnosis faults |

### D: one panel
```
Fall 2027 lab skills                                  [Add skills] [Export]
+------------------------------------+  + Add skills to Fall 2027 lab skills -- x +
| (list table or empty state)        |  | [From library 176] [New skills]         |
|                                    |  | [Search skills........] [Category v]    |
|  No skills on this list yet        |  | [ ] Select all   0 of 176 selected      |
|  Choose from the library, type     |  |                    [Copy from a list v] |
|  names or upload a file.           |  | [ ] ASSESSMENT 6                        |
|          [Add skills]              |  | [ ] Head to Toe                         |
+------------------------------------+  +-----------------------------------------+
                                        |              [Cancel] [Add 30 skills]   |
```
- One filled "Add skills" in the header (Export stays outline); the empty state has one line and the same button. The split button, the chevron menu and Starting points are not on this variant.
- The panel is the lab FloatingSheetPanel, size lg, modal, the same family as New skill list. Title "Add skills to {list}". Tabs: From library (the count is what is not on the list yet) and New skills. Both keep their state; the one primary adds everything chosen in both: "Add {n} skills".
- From library: only active skills not on the list, so nothing can be removed here. Search, category, Select all over the result ("Select all {n} matching" while filtered), a box per category, Copy from a list (ticks that list's skills, never unticks).
- New skills: the Add several form (names one per line, Review each line, category and tags for all, what the program's settings give them) with "Upload a file" beside the label: the file's lines land in the box, "{n} lines read from {file}." A name the library has reads "Use existing" by default and goes on the list as it is.
- A list students are on: the D-LS1116-c question, then the result. Not asked for a list with no skills yet, nor for the adds that follow on that list until the page is reloaded: it is still being built [INFER, Proposed after the critic's walk: a new list on All students otherwise asks on every add after the first, with "Save as a new skill list" preselected; whether a new list should ask at all is Romit's call]. When both tabs hold something, one line above the footer says what the primary adds ("30 from the library, 4 new"). Result banner: "{n} skills added to {list}." with Undo. Close with choices made asks first.

### E: the add step is the page
```
<- Add skills to Fall 2027 lab skills
+ From the library --------------------------+ + New skills ----------------------+
| [Search skills.......] [Category v]        | | Names, one per line [Upload a file]|
| [ ] Select all  0 of 176    [Copy a list v]| | [                              ]  |
| [ ] ASSESSMENT 6                           | | Category        Tags              |
| [ ] Head to Toe                            | | Evaluation settings (summary)     |
+--------------------------------------------+ +-----------------------------------+
[Cancel]                 30 from the library, 4 new            [Add 34 skills]
```
- An empty list opens on this step (no illustration, no choice of method). A list with skills shows its table and one "Add skills" button, which opens the step at `?add=1` (in the URL, so a reload stays on it; the back icon and Cancel return to the table; like the page's panels it adds no history entry, so browser Back leaves the list).
- Two panes from 1024 px, stacked below; sticky footer with Cancel, the count in words and the one primary. Same pickers, same form, same save question, same banner as D.

### States
Loading: the page's skeleton. Library empty: the left pane (or tab) says "The library has no other skills. Type names or upload a file." and New skills leads. Nothing chosen: the primary stays enabled; pressing it says "Choose skills or type a name." File not readable: "{file} could not be read. Try a spreadsheet, a document or a text file." in the form, input kept. Everything already on the list: info banner, nothing changed.

### DS mapping
`FloatingSheetPanel` (+ Header, Body, Footer), `Tabs` line with `TabsCountBadge`, `Checkbox`, `Input`, `Button`, `DropdownMenu`, `Textarea`, `Field`, `AlertDialog`, `Dialog` (SaveScopeDialog), `LocalBanner` through ResultBanner, lab `StickyFooter`.

### A11y
Panel: role dialog, labelled by its title, focus to the search box (or the names box when the library has nothing to offer), returns to the opener. Every checkbox has a label; group boxes are named "All {n} in {category}". The count is a polite live region. Touch targets 44 px at 375. File input reachable by keyboard through its button.

### Acceptance checks
A1 an empty list shows one way in (D: one button; E: the step itself). A2 Select all ticks every skill offered and the primary names the number; A3 30 ticked adds 30 and the table shows 30. A4 one typed name adds one skill and it is on the list. A5 several pasted names add that many. A6 a file's lines land in the names box and add. A7 Copy from a list ticks that list's skills. A8 on a list with students the save question shows before anything changes. A9 the back icon reaches Skill lists. A10 variant A is unchanged.
- Amended 2026-11-16 (D-LS1116-g, Decided, Romit: "doesn't need a count, also, can we make the radio button better as well"): Who uses it is the DS `ViewSegmentedControl` (two equal full-width segments, radiogroup, arrow keys, `min-h-10`, `text-sm`), not stacked radios. No student count anywhere in the panel. No helper or consequence line under the control or the picker (Romit: "remove these subtitles"); the cohort move itself is unchanged. Acceptance P5: ArrowRight/ArrowLeft switch the two choices; with two cohorts picked, no text under the picker.

## Round 2026-11-16 (add-skills-simple): a much simpler add (Proposed, D-ADD1116-s; lab variants F and G of `admin/skills-library`; A, D, E kept)
Romit 2026-11-16, on D and E: "I need more simplified. Can you refer to mobbin".

### What makes D and E heavy (counted on the open add surface at 1440)
| D and E | Why it is heavy | Principle |
|---|---|---|
| Two tabs (D) or two panes (E): the library and a names form | Two mental models at once; the admin decides which before doing anything | Hick, Tesler |
| New skills stacks a names box, Upload a file, review counts, Review each line, a category and tags block and an Evaluation settings summary | Six blocks for "type a name" | Occam, Miller |
| A box per category as well as Select all and a category select | Three ways to select a group | Hick |
| Copy from a list as a labelled button on the main row | A rare job at the weight of the main one | Pareto |

### Mobbin references (full table: scratchpad `add-skills-simple/mobbin.md`)
Shopify Add products (one search, one checkbox list, count and destination in the footer); Shopify Manage products (Select all is the list's header box); Spotify playlist (search on the list's page, Add per row, no overlay; an empty playlist opens on the search); Square "Search or add new" and Melio "Add new vendor" (the search box is the create box; create is the last row when nothing matches); Runway invite (paste many into the one field).

### Requirements F and G carry
- SL-10 "The library must be searchable and filterable by name, category, tag and status." Here: search by name or category; rows sit under their category; only active skills not on the list are offered. Tag filter stays on the list's table.
- SL-02 "A skill has a name, a description and an active/inactive status." SL-03, SL-04, SL-05 category and tags. A skill created here takes its name only; description, category and tags are on its edit panel, one click from the row it lands on (moved to a secondary place, not removed).
- IM-01 "create skills in bulk by supplying an existing list": paste many lines into the box, or Upload a file (More ways to add). IM-02 the file reader is D's (`/api/import/extract`).
- IM-05 "Nothing enters the library until the program has reviewed the extracted list and confirmed it": F stages every name as a ticked row, removable, before the one Add; G shows a pasted or uploaded batch as one line with its counts and adds only on "Add n". Rename, merge and split are in D, E and Bulk upload, not here: PARTIAL, flagged.
- IM-06 "possible duplicates identified, with the program deciding whether to skip, replace or keep both": a name the library has is identified and the library's skill is used (D-ADD1116 "Use existing"); the admin can leave it out. Replace and Keep both are not offered here: PARTIAL, flagged.
- IM-08 "Anything in the source that could not be interpreted must be reported alongside its original text": "n lines were not read" with Show, listing each line's text and why.
- IM-09, SC-01, SC-02: a new skill arrives as the program's settings make it; nothing is chosen or shown during the add; the list's Method column and the not configured banner say what is left.
- D-LS1116-c a list students are on asks who the change applies to (G: once per visit, then adds go on). D-X17 Copy from a list is explicit, in More ways to add. D-L157 back icon.

### Concepts considered
| Concept | Mental model | Primary job | Open surface at 1440 | Not on it | Risk | Built |
|---|---|---|---|---|---|---|
| 1 Search-first picker panel | Fill a basket, add once | Tick many, Add n | search, more menu, Select all, rows, Cancel, Add | tabs, category select, group boxes, names form, category, tags, settings summary | Create is found only by typing | F |
| 2 Add on the list's own page | Each press lands on the list at once | Add, Add, Add all | search, more menu, Done, Add all, rows with Add | panel, footer, selection, confirm step | 30 single presses for a subset; no single filled primary | G |
| 3 Command palette (centred dialog, keyboard first) | Jump and pick | Type, Enter | palette input, rows | everything else | Select all of 142 in a palette is odd; DS palette has no multi-select footer | No |
| 4 Keep D, hide New skills behind a link | D with less | Tick many | D minus a tab | the tab | Still two models, one hidden | No |

### F: search-first picker (panel, md)
```
Clinical skills checklist                          [Add skills] [Export]
+-----------------------------+  + Add skills to Clinical skills checklist  x +
| (table)                     |  | [Search or type a new skill.........] [...] |
|                             |  | [ ] Select all            0 of 142 selected |
|                             |  | New                                         |
|                             |  | [x] Chest tube care                         |
|                             |  | Assessment                                  |
|                             |  | [ ] Head to toe                             |
|                             |  | + Create "Wound vac change"                 |
+-----------------------------+  +---------------------------------------------+
                                 |                  [Cancel] [Add 31 skills]   |
```
- One box. Typing filters. A name the library does not have shows a last row, Create "{name}"; Enter does the same. It becomes a ticked row under New; unticking takes it away. Enter on a name the library has ticks it.
- Pasting several lines stages them all: new names ticked under New, library names ticked, one line saying what happened.
- More ways to add (icon button): Upload a file, Copy from a list (submenu of lists with sizes). Both tick; neither adds.
- One primary "Add n skills". Nothing chosen: the primary stays enabled and says "Choose skills or type a new name."

### G: add on the list's page
```
<- Clinical skills checklist                                  [Export]
+ Add skills -----------------------------------------------------------+
| [Search or type a new skill..........................] [...] [Done]   |
| 142 not on this list                                  [Add all 142]   |
| Head to toe                         Assessment               [Add]    |
| Heart sounds                        Assessment               [Add]    |
| + Create "Wound vac change"                                  [Add]    |
+-----------------------------------------------------------------------+
(tabs, toolbar, the list's table)
```
- "Add skills" in the header opens the region above the table (`?add=1`); an empty list opens on it. Add puts that skill on the list at once; the row then reads "Added"; the page banner says what was added, with Undo.
- "Add all n" adds the whole result (all, or all matching the search). Paste or upload shows one line with counts and "Add n"; nothing is added before that press.
- A list students are on asks who the change applies to on the first add of a visit.
- Done closes the region.

### Principles check
| Principle | Demands here | F | G |
|---|---|---|---|
| Hick | one way in, one control to start | one box | one box |
| Tesler | category, tags, settings stay out of the add | yes | yes |
| Miller | controls on the open surface 7 or fewer (rows aside) | 6 | 5 |
| Fitts | action beside its object; 44 px rows on a phone | checkbox rows 44 px | Add on the row, 44 px rows |
| Jakob | resource picker; add to playlist | Shopify | Spotify |
| Postel | messy paste accepted, guesses listed | notice + Show | notice + Show |
| Error prevention | nothing can be removed; nothing created before a press | yes | yes (batch asks; single is one press, Undo) |
| Peak-end | outcome sentence | banner "n skills added to {list}." Undo | same |
| WCAG 1.3.1, 4.1.2 | labelled boxes, list semantics, named icon button | yes | yes |
| WCAG 2.1.1 | keyboard: Enter creates or ticks; roving list | yes | Enter adds; buttons in tab order |
| WCAG 4.1.3 | status changes announced | polite status lines | polite status lines + banner |
| WCAG 2.5.8 | targets 24 px min | yes | yes |

### States
Loading: the page skeleton. Library has nothing else: "Every skill in the library is on this list. Type a name to create one." No match: only the Create row. Nothing chosen (F): message at the footer. File not readable: "{file} could not be read. Try a spreadsheet, a document or a text file." Already on the list: said in the notice, nothing changes.

### DS mapping
F: lab `FloatingSheetPanel` (md, modal) + Header, Body, WorkflowFooter; `Input`, `Checkbox`, `Label`, `Button`, `DropdownMenu` (+ Sub). G: `Input`, `Button`, `DropdownMenu`; the page's `LocalBanner` through the library banner. Both: `Dialog` (SaveScopeDialog), `AlertDialog` (discard, F).

### Acceptance checks
S1 the open surface has no tabs, no category select, no names textarea, no category or tags field, no settings summary. S2 Select all (F) or Add all (G) takes every offered skill. S3 a subset of 30 adds 30. S4 typing a new name and Enter (or the Create row) adds one new skill to the list. S5 pasting several names stages or offers them with counts; adding puts them on the list. S6 Upload a file does the same from a file. S7 Copy from a list ticks (F) or offers (G) that list's skills. S8 Undo takes the last add off the list. S9 the back icon reaches Skill lists. S10 A, D and E are unchanged.

### After the build (2026-11-16)
- Copy from a list is one level in the menu (a label and the lists), not a submenu: a submenu inside the modal panel closed under the pointer.
- The lab holds six tier 1 variants, so E is unregistered (file kept; the critic ranked F, G, D, E). D stays for comparison.
- Critic findings not applied, for Romit: a filled "Add all n" in G (it would give the most weight to the largest action); splitting a paste on commas (skill names contain commas). IM-05 and IM-06 stay PARTIAL in F and G.

## Round 2026-11-17 (add-skills-h): Romit's handoff spec, one side panel with a draft on the list (Decided, D-ADD1117; lab variant H of `admin/skills-library`, recommended; D unregistered)
Source: `add-skills-handoff.md` ("Variant A, side panel"), with Romit's answers to its section 11 (2026-11-17): a new skill reaches the library only on Save; Starting points removed; after Create list a LocalBanner "New list created. {Original} is unchanged."; substring search plus a "Close matches" group; the spec's simplified dialog copy (content review pending); H replaces D in the registry and is the recommended variant; no separate configure step (Review's times needed and Required cover it). Toasts become LocalBanner; the spec's hex and fonts become DS tokens and `TYPE`.

### Requirements H carries (quoted from requirements.extracted.txt)
- SL-10 "The library must be searchable and filterable by name, category, tag and status." Search by name (substring, plus Close matches), source picker (whole library or another list), grouped by category; Active only. Tag and status filters stay on the list's table.
- SL-02, SL-03, SL-05 "A category or tag can be created at the point it is needed while defining a skill". A new skill's name and category are edited on its Review row (category from the program's categories). Tags: on the row's edit panel after Save (moved, not removed).
- IM-01, IM-02, IM-03: Import tab, upload (the D reader, `/api/import/extract`) or paste; delimiter and header row detected; no template.
- IM-05 "Nothing enters the library until the program has reviewed the extracted list and confirmed it": nothing is created before Save (Decision 1); Review renames and removes; merge and split are not offered (PARTIAL).
- IM-06 duplicates: a name the library has is the library's skill (no Create row, "In library" on import rows); Replace and Keep both are not offered (PARTIAL, as F and G).
- IM-07 "headings ... may be proposed as categories ... subject to the same review": heading lines become a "Create categories ... from the file" checkbox (default on).
- IM-08 "reported alongside its original text": each skipped line listed with its text and reason.
- IM-09 "An unconfigured skill cannot be mapped ...": only skills with an evaluation method are offered; "N skills are not listed because they have no evaluation method yet". SC-02: a new skill takes the program's method; with none it reads "Not configured" in Review.
- CM-03 is per offering, not per list; Required here is the list's own required set (`requiredIds`).
- D-X17 a copy from another list is explicit (source picker). D-LS1116-c save scope ("Who gets these changes?"). D-L155 every way out of unsaved work asks.

### Layout (1440)
```
<- Clinical skills checklist        2 unsaved changes [Discard] [Add skills] [Save changes] [Export]
[All 142] [Active] [Inactive]                                    toolbar
| Unsaved  Wound vac change (New)  ...  amber row |
                                  +-- Add skills  (to Clinical skills checklist)    x --+
                                  | [Library] [Import]                                  |
                                  | [Whole library v | Search or type a new skill    ] |
                                  | [ ] Select all 12 not in this list   130 in list    |
                                  | Selected: Wound vac change  New skill               |
                                  | Assessment                         Select all 3     |
                                  | [x] Head to toe            On 2 lists               |
                                  | Close matches                                        |
                                  | [ Add "wound vac" as a new skill ]                  |
                                  | 9 skills are not listed: no evaluation method yet   |
                                  | 3 selected                      [Review and add]    |
                                  +-----------------------------------------------------+
```
Review: back icon, "3 skills to add", rows Skill / Times needed (stepper) / Required; a new skill's row has a name input, Category and Evaluation method selects; footer Keep browsing, Add 3 skills.

### States
Empty result ("No skills match" + Create), all on the list ("Every skill is already in this list"), import read nothing ("We couldn't find any skills in this file."), file reading, unsaved list, save with no students (direct, banner), save with students (Who gets these changes?), A new list invalid (Create list disabled with field hints).

### DS mapping
FloatingSheetPanel (+ Toolbar onBack, Header, Body, Footer), Tabs, InputGroup, Select, Checkbox, Input, Button, StatusBadge, Dialog, RadioGroup, Popover + Command, Field, Textarea, LocalBanner via ResultBanner. No toast.

### Acceptance checks
Tests in `tests/lab/add-skills-h.test.tsx` and `tests/lab/skill-search.test.ts`; browser walk at 1440 and 375; axe on the list and the open panel.

### Amendment 2026-11-17 (D-ADD1117-r, D-ADD1117-t)
- Review edits four things on every row: Name, Category, Times needed, Required. No evaluation method select; a new skill takes the program's method on Save, or reads "Not configured" (tag only) when there is none [REQ SC-02, IM-09]. A library skill's name, category and times needed change on the skill when the list is saved (times stay on the skill, D-ADD1117-t).
- Layout: two tight lines per skill under one set of column heads; line 1 box, name, New skill tag, remove; line 2 category (wraps, never cut), times, required. Row boxes and Select all; ticked rows show a bar above the heads: "n selected", Category, Times, Required, Optional, Remove (icon), each named for its scope ("Set category for 3 skills").
```
3 selected [Category v] [Times] [Required] [Optional]      (trash)
[ ] Skill and category              Times needed   Required
[x] [Suctioning, oral.........]  New skill               x
    [Airway               v]      [1]           [x]
```
- Library: "Select all n not in this list" and its "already in list" count are hidden when n is 0 (rows say "In list" themselves).
- List: unsaved rows have a 3 px amber left edge (`--chart-5`), the group heading carries one warning StatusBadge "Unsaved"; no per-row tag (a screen-reader "Unsaved" stays on each row).
- A list panel's "Upload a file" opens H with Import selected (`add=1&addTab=import`), on the walkthrough path.

### Amendment 2026-11-17, later (concept A, Romit; supersedes the Review layout of the amendment above)
```
5 skills to add                                        x
For all 5   Times needed [ 1 ]   [x] Required
Advanced procedures                                    2
   Chest tube drainage check                 New    >
   Wound vac dressing change         New  2 times   >
No category                                            1
   blood sugar check                         New    >
Keep browsing                              [Add 5 skills]
```
- Batch line sets every skill with no own value; times shows the shared value, or empty with "Mixed" when skills differ (typing sets all).
- Rows are read-only, grouped by category; a note only for what differs from the batch. A row opens in place (DS Collapsible, one at a time): Name, Category, Times needed, Required, "Use batch settings" (only when it differs), "Remove from this batch". A category change moves the row into its group; the row stays open and focused.
- A name another skill has: error in the open row, "Fix name" on the closed row; Add stays enabled and opens that row on its name instead of adding.
- Several at once: a row box (shown on hover, focus, or once any row is ticked); a bar replaces the batch line: n selected, Move to category, Required (tri-state), Remove, Clear.
- Panel md (32rem). No helper text.
- Craft pass (Romit 11-17, "proper icons, hierarchy... accordion"): rows are the DS Accordion (single, its own rotating chevron, no style override); each category is a heading (folder icon, name, outline count Badge) over one bordered list; the batch line and the bulk bar are one neutral strip (`--dt-group-bg`, layer-group icon) with top labels like the open row's fields; the open row's body sits in the row on the same neutral surface: Name, then Category, Times needed, Required, then "Use batch settings" left and a trash "Remove" right; times exception carries the repeat icon. Icons fa-light, aria-hidden, one size and colour.

### Amendment 2026-11-17, later (D-ADD1117-i, D-ADD1117-s)
- Import: a line naming a library skill has a compact choice at the row's end: Use library skill (default), Keep both, Replace (only with no evaluations recorded) [REQ IM-05, IM-06]; applied on Save only. A document title is skipped and listed [REQ IM-08]. Merge and split stay in Bulk upload only.
- Tabs: Library | Import | Selected {n} (disabled at 0). Selected = batch strip, groups, accordion rows. Footer: one primary, "Review {n} skills" or "Add {n} skills"; no back arrow, no Keep browsing.
- Several at once: DS BulkSelectionBar replaces the footer; Category menu, Times popover with Apply, Required menu, Remove icon with Undo; one LocalBanner per result; group heading box; Esc ends the selection. Phone: Category and Times as icons, Required and Remove in More.

### Amendment 2026-11-17, last (D-ADD1117-s revised, D-ADD1117-b)
```
Step 1  Add skills · to {list}   [Library | Import]            ... [Review 3 skills]
Step 2  Review 3 skills
        [ ] Select all 3
        [ ] (folder) Airway 1
            [ ] Basic airway management        3 times · Required  v
                                                       [Back] [Add 3 skills]
        ticked: "Moved 2 to Airway."  (status line)  /  [x 2 | Category | Times | Required | trash | close]
```
- No Selected tab and no "For all" strip; batch edits go through selection only. Rows show their own values; no "Use batch settings".
- Library hides skills already on the list behind "Show {n} already in list" / "Hide …".
- The DS BulkSelectionBar's count is drawn neutral (local classes; the DS has no prop); result messages sit in a polite status line right above the bar.

### Amendment 2026-11-17, applied draft (D-ADD1117-d)
```
Add skills to Clinical skills checklist                          x
Step 1 of 2 · Choose
[From: Whole library v][Search or add      ][^ Upload a file]
[-] Select all 24 not in this list            Show 152 already in list
+ New 1                     (folder) Airway 1               Clear
| [x] Suctioning, oral  New skill |  | [x] Basic airway management |
3 selected                                          [Review 3 skills]
```
- Upload or paste: "From: Upload or paste" + Back to library; dashed drop zone ("Drop a file here or Choose a file", CSV, Excel, Word, PDF, text); "Or paste a list". Dragging a file over the panel on step 1: "Drop to read this file".
- Step 2: "**3 skills**: 2 from library · 1 new" + Change; Select all; folder groups; rows with tags then own values; Back and Add; the selection bar as before.
- `from=file` opens upload or paste (alias `addTab=import`).

### Final amendment 2026-11-17 (D-ADD1117-d, draft7 applied)
```
Add skills to Clinical skills checklist                                  x
Step 1 of 2 · Choose
|░ [ Choose skills | Upload or paste ]                                   ░|
|░ Skills from  [(books) Whole library                              v]   ░|
|░ [(search) Search skills                         ]  [+ New skill]      ░|
[-] Select all 24 not in this list                 Show 152 already in list
(seedling) Created here 1
| [+ Skill name................] [Add] [Cancel]  |   <- form, first row, white
| [x] Suctioning, oral                            |   <- success tint, no tag
(folder) Airway 1                                                     Clear
| [x] Basic airway management |
3 selected                                                 [Review 3 skills]
```
- Searching with no exact match: 'Create "{text}" as a new skill' row first; Created here and every group follow the search.
- New skill form: Enter adds (ticked, in Created here), Esc cancels (the panel stays); a library name is refused with "Select it".
- Upload or paste: the band keeps the switch; drop zone, "Or paste a list", Read the list; IM-05/IM-06 choices on read rows.
- Step 2 unchanged. URLs `add=1`, `from=file` (alias `addTab=import`), `source=<listId>`.

### Amendment 2026-11-17: upload triage and decluttered Review applied to H (D-ADD1117-u Decided, D-ADD1117-x)
Reader: `lib/lab/import-triage.ts` replaces `readImport` in H (tables keep name, description and category columns [REQ IM-03, IM-05, IM-07]). Demo mode: any file shows `sample-nursing-skills.xlsx`; paste is read as typed.
```
| (file) sample-nursing-skills.xlsx  31 lines                 Replace |
| (!) This doesn't look like a list of skills ...    <- only when name-like lines < 50% |
| Ready to add [24]                                          Clear all |   ticked unless the verdict shows
|   (folder) Neurological [New category]                 [x] Create   |
|     [x] Glasgow Coma Scale scoring                                   |
|   [x] Basic airway management          [Use library skill v]        |   IM-05/IM-06 choice on library twins
| Needs a look [2]                                            Hide    |   one line (Show) while the verdict shows
|   [ ] and skin check   [Starts mid-line]  Join above (pen) (x)      |   actions on hover/focus; always on a phone
| Not added [1 heading]                                       Show    |   grouped by reason when open, L-numbers, Add anyway
```
Step 2:
```
| 24 skills from sample-nursing-skills.xlsx                   Select  |
| 23 new, 1 from the library · 23 at 1 time, 1 at 3 times · Required |
| Airway [6]                                                          |
|   Basic airway management  From library              3 times   v   |   minority provenance by the name; facts only where they differ
| (<- Back)                                          [Add 24 skills] |
```
Select shows row and group boxes and Select all; ticking shows the selection bar; Done ends it; Esc clears the ticks, then leaves Select. Rows start collapsed whenever Review opens. The open row is an indent and a rule, no fill. "Change" is gone; Back returns.

### Amendment 2026-11-17 (later): plain upload list (D-ADD1117-z supersedes the triage in the amendment above)
```
| (file) sample-nursing-skills.xlsx · 24 lines                 Replace |
| [x] Select all 24                                                    |
| Airway [6]                                                           |
|   [x] Basic airway management             [Use library skill v]     |
|   [x] Suctioning, oral                                   (pen)      |   Edit name on hover/focus, always on a phone
| Neurological [5] [New category]                                     |   created on Save; moved in Review if wanted
| 24 selected                                       [Review 24 skills] |
```
No verdict, no "Not sure" or "Not added" groups, no reason tags. Only formatting lines are dropped. Review step unchanged.

