# ADMIN-D6a New skill list, step 1: Skills on this list

Parent: ADMIN-D6 Skill lists. Ledger: D-L122, D-L123, D-L124. File: `admin/components/lab/admin-a/lists-new-page.tsx`.

Build scope 2026-11-10 (Romit, screenshot of the add state: "too crowded"; four controls in the add row, two header buttons repeating it, a "No category" select on every row, three button weights, no clear primary, unclear Done).

## Job and journey
- Role: admin. Job: name a list and put skills on it, fast, at 100+ skills. Previous step: Skill lists, New skill list. Next: step 2, how they are judged (receiver cue: the step 2 rows are the skills placed here).
- Hard stops: no shipped skills [REQ SL-01]; nothing decided about ODs; unconfigured skills may sit on a list (they join courses only when configured, IM-09, D-L60).

## Requirements this screen must satisfy
| ID | Text (quoted) | Where on this screen |
|---|---|---|
| SL-02 | "A skill has a name, a description and an active/inactive status." | Name written in the field; description belongs to the Library (not changed here) |
| SL-03 | "A skill belongs to at most one category; a category is optional." | Per-row category on demand, one value |
| SL-05 | "A category or tag can be created at the point it is needed while defining a skill" | Category picker creates inline |
| SL-06 | "Only active categories and tags are available for assignment." | Category picker (unchanged, marks inactive) |
| IM-01 | "create skills in bulk by supplying an existing list" | Paste several lines adds several; Bulk upload stays in Choose from library |
| IM-06 | "possible duplicates identified" | A typed name already in the library goes on as that skill; one already on the list says so |

Known gap, not widened here: Tags in every Add a skill path (D-L5, D-X28). The add row never carried tags; flagged as a proposal.

## Design (single chosen fix)
```
Empty (unchanged, D-L124)                Started
+------------------------------------+   +--------------------------------------------+
| Name [______________________]      |   | Name [______________________________]      |
| Skills on this list                |   | Skills on this list  3  [Choose from library]
|        (drawing)                   |   | [Name of the new skill ...........  (Add)] |
|  No skills on this list yet        |   | Press Enter to add. Paste a list to add several.
|  Write your own, or reuse ...      |   | +----------------------------------------+ |
|  [Write a skill] [Choose from lib] |   | | Wound care       Fundamentals       x  | |
+------------------------------------+   | | IV start         Add category       x  | |
                                         | +----------------------------------------+ |
```
- One write path: the field. Enter adds, field clears, focus stays; paste of several lines adds several. "Add" sits inside the field (InputGroupButton) only while text is typed, for touch and pointer parity.
- One secondary entry point beside the count: Choose from library. No Write a skill button once the field shows; no Done (nothing to close).
- Category is quiet: a ghost text button on rows written here ("Add category" or the category name); a library skill shows its category as muted text (the Library owns it). No select in the add row.
- Newest first: the skill just added appears right under the field, so it is seen without scrolling at 100+.
- Count shown once (heading). A polite live region announces each add.

## States
| State | What shows |
|---|---|
| Empty | FirstRun drawing, title "No skills on this list yet", body "Write your own, or reuse skills from your library.", Write a skill, Choose from library |
| Writing, nothing yet | Field, hint, no list |
| One | One row |
| Many (100+) | Rows newest first, panel body scrolls, rows content-visibility auto |
| Error: Next with none | "Add at least one skill." under the drawing, or under the field when it shows, tied by aria-describedby |
| Error: duplicate | "{name} is already on this list." under the field; text kept |

## DS mapping
InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton (`@exxatdesignux/ui/components/ui/input-group`); Button (outline sm for Choose from library, ghost sm for category, ghost icon-sm for remove); Field, FieldLabel, FieldDescription, FieldError; FloatingSheetPanel parts; FirstRun (lab, D-L124); CategoryPicker (lab, Popover + Command) with a ghost trigger.

## A11y
Every control labelled (field aria-label, remove "Remove {name}", category "Category for {name}"); hint and error via aria-describedby; focus stays in the field after add, moves to the next row (or the field) after remove; live region role=status; rows 44 px.

## Task test IDs
T1 T14 T16 T18 T28 (labels updated to Write a skill, Choose from library; T28 new: Enter, focus, newest first, duplicate, paste)

## Amendment 2026-11-11 (D-L144; Proposed)

```
| Skills on this list                                  [Choose from library] |
| Name of a new skill                                                       |
| [ Wound irrigation                                   ] [Add skill]        |  <- outline, off while empty
| Paste a list to add several.                                              |
```

- "Add skill" (the program's noun) is a DS Button, outline, beside the field, same height; Enter adds too. After adding, the field clears, keeps focus, and the live region says "Added {name}." The ghost Add inside the field is removed. "Press Enter to add" is removed (the button says it). At 375 the field and the button stay on one row.
- Step 2 rows: `{name} [Default]  ...  [ 3 ]` under one caption row "Skill | Times needed". The number is the skill's Times needed (`TimesNeededCell`, shared with the Library): bold with "This skill's own number" when it differs from Evaluation settings. Long names wrap the badge under the name; the number keeps its column.


## Amendment 2026-11-15 (new skill's category stays editable; [INFER], Proposed)

Bug (Romit): "I am not able to change the category of a newly added skill in the add skills feature." Cause: the category control existed only on step 2 of New skill list and only while that step stayed open; the list panel (preview and Edit skills picker) printed the category as text, blank when none.

- A skill added in this program (by hand, pasted, imported) or with no category shows its category as an editable control wherever a list screen shows it: step 2 rows, the list panel preview, the panel's skills rows and Edit skills picker. A program-list skill that already has a category keeps it as text; the Library changes it. [INFER: the existing step 2 rule "settable" made persistent by the skill's own `addedByHand` flag, not by local state.]
- The control is the DS Popover plus Command picker already used on the Library (`CategoryPicker`, ghost, sm): choose an existing category, or create one by typing (same behaviour as the Library edit panel [REQ SL-05]). No new pattern.
- An unassigned category reads "No category", never blank, in the control and the text.
- A change writes the skill in the shared store, so the Library table, the edit panel and the Categories and tags counts show it at once.
- Set up skills step 1 "Added" table (`skills-add-step.tsx`) takes the same control in its Category column.
- Tests: `tests/lab/new-skill-category.test.tsx`.

## Amendment 2026-11-15b (New skill list steps 1 to 4: one find-or-add field, Copy from a list, fewer lines, category dropdown, search on Configure; Proposed, for Romit)

Romit, 2026-11-15, in order: (1) on step 2 at 152 cloned skills, "can the UI be improved? I see a lot of content written."; (2) "check Sankalp's feedback and see if the add skills steps are matching; I can't see a way where I can pick from existing checklist."; (3) "remove unnecessary sub titles"; (4) "show a dropdown instead of 'No category'"; (5) on step 3 at 153 skills, the user must scroll a long list to change Times needed.

Concepts weighed for step 2 (ASCII in the design lead's report): A one find-or-add field (chosen); B split pane, library left and list right (rejected: needs an xl panel, and in D-L123 Romit moved the library to its own level in the panel); C one table with a toolbar (search, category, an Add menu) and an inline add row (rejected: a menu hides the main way in; two text fields compete again).

```
Step 1 of 4  New skill list         Step 2 of 4 · {name}  Add skills
[Name ________________]             [ Find or add a skill ......... ] [Choose from library] [Copy from a list v]
                       [Next]         while typing:  + Add "wound" as a new skill      <- highlighted, Enter
                                                       Pressure injury risk assessment   Wound care
                                                     Paste a list to add several.
                                      Skills on this list  153        (while typing: "1 of 153")
                                      | (NG/GT) feeding               [Nutrition      v]  x |
                                      Empty: drawing + "No skills on this list yet" (the ways in sit above)

Step 3 of 4 · Optional · {name}  Configure skills
"All 153 skills are configured."  or  "{n} of {m} skills are not configured."  [Configure skills (n)]
Evaluation settings card
| [Search skills .................. x]  12 of 153 skills |   <- sticky, with the column heads
| Skill                                     Times needed |
| rows ...                                               |
```

### Step 1: name only [INFER]
"Start from" leaves step 1. Copying a list is done on step 2 with Copy from a list, the one place it happens, so the two never disagree and step 1 carries no hint lines.

### Step 2: one field finds or adds [INFER]
- Typing narrows the rows on the list (name or category), offers up to 5 library skills not on the list, and offers to add it as a new skill. The first option is the library skill of that exact name, else the new name, so Enter does what it did before. Arrow keys move to the library matches.
- A name already on the list offers neither, and Enter says "{name} is already on this list." with the text kept [INFER: extends IM-06, which is about duplicates against the library, to the list being built].
- The D-L144 "Add skill" button is replaced by the option row "Add "{name}" as a new {skill}", which says what will happen [INFER; D-L144 was Proposed words].
- "Paste a list to add several." shows only inside the suggestions box, while typing; a pasted list still adds each line (IM-01).
- No visible label above the field: placeholder "Find or add a skill" and the same accessible name [INFER; flag for Romit].
- The field, Choose from library and Copy from a list sit on top in every state (amends D-L124 for this step: the drawing keeps one line, no buttons).
- Esc with text clears the field first; Enter never reaches the panel's Next.

### Step 2: Copy from a list (Sankalp point 3) [CALL: Sankalp, "For new list they can clone the earlier list"]
- An outline menu button "Copy from a list" beside Choose from library, shown when another list holds skills. Each menu row: list name and its skill count.
- Choosing one opens a level in the same panel, "Copy from {list}", with that list's active skills all ticked, search, Filters, Select all and the count "n of N skills selected". Untick what is not wanted. The footer adds: "Add {n} skills" (only new ones counted), or "Update the list" when a skill already on this list is unticked.
- Merge [INFER]: copying adds to what is on the list, never removes what is not on the source, and never repeats a skill. Copying the same list again offers nothing new ("Add" off).
- Only the skills come across. Who has the source list, its default flag, required marks and minimum total do not [INFER, as amendment b of ADMIN-D6]. This is not written on the screen: the new list is assigned on step 4, which makes it plain; Romit asked that subtitles go.
- The library level no longer repeats "Copy from another list" under More ways to add (Bulk upload stays there).

### Step 3: search the rows (Romit, item 5)
- An InputGroup search ("Search skills", accessible name "Search skills on {list}", magnifier, a clear button while text is in it, Esc clears) sits in the table's own toolbar above the column heads. The toolbar and heads are sticky in the panel body, so they stay in view while rows scroll. Name match only.
- Filtered: "{n} of {N} skills" beside the field, polite. No match: one line "No skills match." with "Clear search".
- Which rows are editable is unchanged.
- "All {m} skills are configured." stays: the header does not state the count.

### Category dropdown (Romit, item 4)
Wherever a skill's category can be set (step 2 rows, the list panel's rows and picker, Set up skills "Added" table), the control is the DS outline trigger with a chevron, reading "Select category" (muted) when empty and the category's name once chosen; same Popover plus Command search and create-by-typing [REQ SL-03, SL-05, SL-06]. The clear option keeps "No category". Library-owned categories stay text; read-only places (Library table) keep "No category".

### Lines removed and kept (Romit, item 3: keep only what the user cannot act without, or what prevents a destructive mistake)
| Where | Line | Decision | Reason |
|---|---|---|---|
| Step 1 | "Copies its skills, not who has it." / "Or copy the skills of a list you already have." / "The skills added so far are replaced." | Removed | Start from left step 1; the replace case no longer exists (copy adds) |
| Step 2 | "Name of a new skill" (label) | Removed | Placeholder and accessible name carry it |
| Step 2 | "Paste a list to add several." (standing) | Moved | Shown only inside the suggestions while typing |
| Step 2 | "Copied from {list}. Who has it is not copied." | Removed | Said nowhere now; step 4 assigns |
| Step 2 | "Write your own, or reuse skills from your library." (empty body) | Removed | The ways in sit above |
| Step 2 library level | Subtitle "{list name}" | Removed | The user just came from that list |
| Step 3 | "They stay on the list. They cannot be mapped to a course or submitted against until configured. You can do this later." | Removed | "Optional" in the step label says it can wait; the count and Configure skills remain |
| Step 3 | "{n} of {m} skills are not configured." / "All {m} skills are configured." | Kept | The only place the count of what still needs work shows |
| Step 3 | "Step 3 of 4 · Optional · {name}" | Kept | Says the step can be skipped |
| Step 4 | ", {n} skills" after the list name in the subtitle | Removed | Count is on the table row and step 2 |
| Step 4 | "{n} now, and anyone who joins later" under All students | Kept | Prevents assigning to future students by mistake |
| Skill lists table empty | "Put together the skills students must achieve, then choose who it applies to." | Removed | Title and New skill list say it |
| Row menu | Delete blocked reason "New student groups get this list. Make another list the default first." | Kept | Without it the user cannot act |
| Delete dialog | "It holds no skills." | Removed | Nothing to warn about |
| Delete dialog | "It holds {n} skills. They stay in the library." and who has the list, "Evaluations are kept." | Kept | Destructive action: says what goes and what stays |
| Discard dialogs | "This list has not been saved." etc. | Kept | Destructive discard |

Visible words (whole panel, header and footer, placeholder counted; 1440): step 1 25 to 11; step 2 at 152 to 153 skills 44 to 29; step 2 empty 37 to 30; step 3 unchanged at 43 when all configured (the not-configured sentence drops 21 words); step 4 32 to 30.

### Sankalp's points against the final flow
| Point | Where | How it is found |
|---|---|---|
| 2 Name first, then add skills | Step 1 (name only), step 2 | New skill list opens on Name; Next goes to Add skills |
| 3 Clone an earlier list | Step 2, "Copy from a list" | Outline button beside Choose from library, in view on arrival |
| 4 Delete a list | Row menu and the panel menu, "Delete" | The row's actions button; Delete always listed, the default one with its reason |
| 5 Select all when adding | Choose from library and Copy from a list levels | Checkbox "Select all" over the rows with "n of N skills selected" |
| 6 Adding and configuring separate | Step 3 "Configure skills", Optional | After Next on step 2; Next goes on without configuring |

States: empty (drawing, one line); typing; no list match ("None on this list match."); duplicate; Next with none ("Add at least one skill." under the field); library empty (no Choose from library, no library suggestions [INFER]); no other list with skills (no Copy from a list [INFER]); step 3 no match ("No skills match." and Clear search).

DS: Input, Command, CommandList, CommandItem, DropdownMenu, Button, Field, FieldError, InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton, FloatingSheetPanel parts; FirstRun (body, actions optional); CategoryPicker (new `placeholder` prop). Tokens only.

Tests: `tests/lab/lists-new-steps.test.tsx` (step 1 name only; Copy from a list; six find-or-add cases; step 3 search), `tests/lab/new-skill-category.test.tsx` (Select category dropdown, chosen name, clear option); task scripts T1, T2, T14, T16, T18, T28.


## Amendment 2026-11-15c (Sankalp's 7 points walked end to end; Proposed, for Romit)

Source: Sankalp's Teams message to Romit, 2026-11-15 (preamble and points 1 to 7; audit at the design lead's scratchpad `research/sankalp-audit.md`). Romit: "ensure everything Sankalp has asked is done."

- Point 5, select all on the step itself: a DS Checkbox row "Select all {N} skills in the library" under the add row on step 2 (checked, indeterminate, unchecked). Checking puts every active library skill on the list; unchecking takes them off. Choose from library keeps its own Select all for a filtered pick. [CALL: Sankalp relaying Aarti, 11-06, add 50, select all 50]
- Point 4, delete in view: the list panel ends with an outline "Delete skill list" button; on the default list it is disabled with the reason under it ("New student groups get this list. Make another list the default first."). The row menu keeps Delete; the table pins the Name column left and the menu column right so a row action always shows which list it acts on at 1024. Rules unchanged (ADMIN-D6 amendment c) [INFER, PENDING-SANKALP: may an assigned list be deleted].
- Point 7, exits:
  | Where | Back (arrow, footer, Esc) | X or a press outside |
  |---|---|---|
  | Step 1 Name | Footer Cancel (asks if anything is typed) | Leaves for the table (asks if anything is typed) |
  | Step 2 Add skills | Step 1, name kept | Leaves for the table (asks if unsaved) |
  | Choose from library / Copy from a list | Step 2 (asks if the selection changed) | Leaves for the table (asks if unsaved) |
  | Step 3 Configure | Step 2 on the saved list (Save and continue updates it, never a second list) | Leaves for the table; the list stays saved |
  | Step 4 Assign | Step 3 | Leaves for the table (asks if students are chosen) |
  | Finish (Assign) | | Lands on the table with "{list} assigned to ..." and Undo |
  Esc in a field that holds text clears the text and closes nothing. This replaces map E rule 6 ("X steps back one level") for the New skill list flow only [INFER].
- Point 6: step 2's primary reads "Save and continue", since it saves the list; step 3 stays Optional; assigning is step 4 and the panel's Assign to students.
- Point 3: the copy level's search reads "Search {list}". No Duplicate on the row menu: Sankalp asked for a clone "for a new list", which the flow covers [PENDING-SANKALP].
- Point 1: the PRISM dashboard's Curriculum Management card "Skills checklist" opens Skill lists; the breadcrumb's Dashboard returns to it. No change.
- Point 2: no "Setup" crumb or nav label added: in the 11-04 call Sankalp described Setup and Review as sections of Skills; every page in the Skills panel today is setup, and a crumb must be a page [PENDING-SANKALP].

Tests: `tests/lab/lists-new-steps.test.tsx` (select all on the step; reopen on step 2 updates, not duplicates); task scripts T5 (Delete always offered), T16 and saveNewList (Save and continue; X lands on the table).


## Amendment 2026-11-15d (Step 2 v2: one labelled block of ways in, library first; Proposed, for Romit) [LEDGER D-L154]

Romit, 2026-11-15: "can this step be simplified? Can you make this step look more organized and professional in ui and UX following guidelines and best practices?"; then "step 2 isn't intuitive at the moment." Acceptance test: a first-time admin knows what to do first within 5 seconds.

Before: field, Choose from library and Copy from a list as three equal controls in one row; a lone "Select all 176 skills in the library" checkbox under them; a bordered drawing "No skills on this list yet" filling the panel; suggestions pushing the page down; on a long list the controls scrolled away.

```
Step 2 of 4 · {name}   Add skills
Library        [Choose skills]  [ ] Select all 176        <- first action: the one weighted (secondary) button, focus starts here
Another list   [Copy skills v]                             <- menu: each list with its size; opens "Copy from {list}" level, all ticked
By name        [ Find or add a skill ..................... ]  <- suggestions float over the page; new skill gets "Select category"
Skills on this list  20                                     (empty: dashed box "Skills you add appear here.")
| 12-lead ECG acquisition                  Cardiac   x |   <- rows scroll in their own box
Save with none: "Add at least one skill." under the box     [Back]  [Save and continue]
```

- Label column 7rem, value column the rest (Bulk upload steps v4); stacked under 640px. Each row is `role="group"` named by its label.
- Order is the expected frequency: most lists are built from the library (Aarti's "add 50, select all 50"), then from an existing list, then one name at a time [INFER].
- Accessible names: "Choose skills", "Copy skills", "Select all {N} skills in the library" (visible "Select all {N}", the rest sr-only), combobox "By name, find or add a skill" (placeholder "Find or add a skill"). Label in name holds for each.
- "Add at least one skill." is the list's error, under the empty box (id `new-list-skills-error`), the box border turns destructive; the field is not marked invalid but is described by it and takes focus. A typed duplicate stays the field's error.
- Unchanged: find-or-add behaviour, paste a list, Copy level merge rules, select all toggling, category dropdown on skills added here, Back / X / Esc rules (amendment c), "Save and continue".

| Sankalp point | Where on step 2 v2 |
|---|---|
| 2 Name, then add skills | Step 1 name; this step |
| 3 Clone an earlier list | Row "Another list", Copy skills, in view on arrival |
| 5 Select all | Row "Library", beside Choose skills; and inside the Choose skills and Copy levels |
| 6 Add and configure separate | Primary "Save and continue"; step 3 Configure stays optional |

Visible words at 1440 empty (header to footer): 23 (was 22). DS: Button (secondary, outline), Checkbox, Label, Field, FieldLabel, FieldError, Input, Command, DropdownMenu, FloatingSheetPanel parts, CategoryPicker. Tests: `tests/lab/lists-new-steps.test.tsx`; task scripts T1, T16.

## Amendment 2026-11-15e (Step 2 v3: the library is the step; Proposed, for Romit) [LEDGER D-L156]

Romit, 2026-11-15, on v2: "this approach isn't intuitive"; then "step 2 isn't looking good, i told you last time as well". Root cause in v1 and v2: the admin was asked to pick a method (Library / Another list / By name) before seeing a single skill; the skills sat behind a drill-in. Acceptance test: a first-time admin's first move (tick, or type) is right within 5 seconds, because the only verb on the page is a checkbox.

```
Add skills
Step 2 of 4 · {name}
[ Search or add a skill ........ ]  [Filters]  [Copy a list v]     <- sticky toolbar
Copied 52 from Core clinical skills.  [Undo]                       <- only after a copy; gone at the next change
[ All 176 ] [ Selected 12 ]                                        <- DS Tabs + TabsCountBadge
Select at least one skill.                                         <- only after Save with none
| [-] Skill                               Category |                <- header box: "Select all 176 skills" / "Select all 9 matching"
| [x] 12-lead ECG acquisition             Cardiac  |
| [ ] Active range of motion              Range of motion |
| ...                                              |
| No skill named "xyz".  [Add "xyz" as a new skill] |              <- search with no exact name match
[Back]                                   [Save and continue]
```

- Focus starts in the search. Enter ticks the skill of that exact name, else adds a new skill by that name; a name already ticked says "{name} is already on this list." under the search and keeps the text. Esc with text clears it.
- A new skill comes in ticked, keeps its name in the search so its row shows, and focus moves to its Select category (CategoryPicker, No category option).
- Copy a list adds the list's active skills, never removes or repeats one; overlap is said ("{n} were already selected."); Undo restores the selection before the copy. Only skills come across, never who has the list.
- Selected tab lists ticked skills newest first; a row unticked there stays until the tab is left.
- 375: toolbar wraps (search full width); the category folds under the name; rows 44px.
- Removed: the label column of ways in, Choose skills and its library level, the Copy from {list} level and its Add button, the Skills on this list box with remove buttons, the empty dashed box.
- Not configured badges are not shown on this step (step 3 Configure counts them) [INFER, to keep 176 rows quiet].

| Sankalp point | Where on step 2 v3 |
|---|---|
| 2 Name, then add skills | Step 1 name; this step ticks |
| 3 Clone an earlier list | Copy a list menu, with Undo |
| 5 Select all | The header box over the rows shown |
| 6 Add and configure separate | Save and continue to the optional step 3 |
| 7 Back / X / Esc | Unchanged (amendment c) |

DS: InputGroup, Button, DropdownMenu, Tabs, TabsList, TabsTrigger, TabsCountBadge, TabsContent, Checkbox, Label, FieldError, CategoryPicker, FiltersControl, AppliedFilterChips, FloatingSheetPanel parts. File: `components/lab/admin-a/lists-add-skills-step.tsx`. Tests: `tests/lab/lists-new-steps.test.tsx`.
