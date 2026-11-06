# Set up skills, step 1 "Skills": concepts (2026-11-04)

Status: proposal for Romit. Nothing built. No code changed.

Consulted (worktree copy `/Users/romitsoley/Work/.claude/worktrees/sc-scale/apps/skills-checklist`): `docs/knowledge/subagent-standing-brief.md`, `00-design-brief.md`, `02-decisions-ledger.md` (D-L5, D-L34, D-L36, D-L42, D-L44, D-L45, D-X15, D-X28, D-X30), `docs/source/requirements.extracted.txt` (SL-01 to SL-11, IM-01 to IM-15), `admin/components/lab/setup/skills-add-step.tsx`, `admin/components/lab/library/add-several-sheet.tsx`, `admin/components/lab/library/use-library.tsx`, `admin/lib/lab/library.ts`, the current screenshot `v3-1-skills-added-1440-v3.png`, DS types (`@exxatdesignux/ui@1.5.1`: DataTable, InputGroup, Input, InlineInputEdit, InlineSelectEdit, Command, Table, Checkbox), Mobbin (4 searches, web).

Applies: D-L44 (focus workflow, step 1 starts from an empty program), D-L34 and D-L36 (no subtext), D-L5 / D-X30 (full width, no white space), D-X28 (Category one, Tags many, in every add path), D-X15 (delete only while nothing is tracked: true for every skill in step 1), D-L45 (no Evaluations column), Oct 26 call (upload and AI reading are Later).

## 1. What is wrong today (Romit's critique, made specific)

| Problem | Why it hurts | Law |
|---|---|---|
| Three outline buttons sit alone on a row, each opening a sheet | The job (type or paste 150 names) happens off the page; the page itself is a waiting room | Fitts (action far from its object), Jakob |
| "Added (N)" is a read-only table at the bottom | You cannot rename, remove or fix a duplicate where you see the mistake; you leave the wizard for the Library | Nielsen recovery, Tesler |
| Duplicates are only caught inside the paste sheet, before adding | Once in, a duplicate is invisible on this step | IM-06 |
| Category and Tags read "None" on every row | Two columns of the same value on every row (DS review rubric: drop or make it act) | Occam |
| Upload "Later" is one of three equal buttons | A Phase 2 control has the same weight as the two that work | Pareto |
| The canvas below 5 rows is empty to 900 px | Leadership D-L5: no white space on wizard pages | D-L5 |

Root cause: the step was designed as "ways to add" plus "a result". The job is "build and fix one list". The list should be the page, and adding should happen in the list.

## 2. Requirements this step must satisfy (every concept)

| ID | Quoted requirement (short) | How the step must show it |
|---|---|---|
| SL-01 | "Prism does not supply a standard skills library or taxonomy." | Empty start, no starter list, no suggested names |
| SL-02 | "A skill has a name, a description and an active/inactive status." | Name inline; description reachable per row (row menu, "Add description") |
| SL-03 | "A skill belongs to at most one category; a category is optional." | One category per row, empty allowed |
| SL-04 | "A skill may carry any number [of tags]" | Tags per row and in bulk |
| SL-05 | "A category or tag can be created at the point it is needed" | Create inside the category and tag pickers |
| SL-10 | "searchable and filterable by name, category, tag and status" | Search by name on the step (full filters stay on Library) |
| IM-01 | "create skills in bulk by supplying an existing list" | Multi-line paste |
| IM-05 | "edit, rename, merge, split, discard and add entries before anything is created" | Inline rename, remove, add on the same surface |
| IM-06 | "possible duplicates identified, with the program deciding whether to skip, replace or keep both" | Duplicate flag with the three choices |
| IM-07 | "headings or groupings... may be proposed as categories" | Heading lines in a paste propose a category |
| IM-08 | "could not be interpreted must be reported alongside its original text" | Lines not added listed with their text |
| IM-09 | "created unconfigured and are distinguishable as such" | All are unconfigured; shown on step 3 and Library (no column here: same value on every row) |
| IM-12 | "Creating... a single skill by hand remains available" | Type one name, Enter |
| IM-13 | "No skill... may be created without explicit human confirmation" | Paste shows what it will add before it adds (see concept A step 2) |

Upload (IM-02, IM-03, IM-04) is Phase 2 [CALL 10-26]: present as "Later", never a working path in step 1.

## 3. Research

### Mobbin references (looked at, web)

| # | App, screen | Pattern it shows | Take | Do not copy |
|---|---|---|---|---|
| 1 | [AirOps, Review your initial prompts](https://mobbin.com/screens/b8ee990e-2ada-41b0-9e96-4018c045aebd) | Onboarding step whose whole body is the list: each row an editable text input, a Topic select beside it, a delete icon at the end; count "Prompt (25/25)" in the column header; Continue at the end | List as the page; category select per row; delete beside its row; count in the header | 25 always-open inputs: at 150 rows it is a wall of boxes |
| 2 | [Searchable, Review Prompts](https://mobbin.com/screens/0a34374e-6e9e-4c31-b6b7-dbe94fdc1936) | Rows read as text; clicking one turns it into an input with a tick and a cross; rows grouped by topic with a count per group ("22/22"); total "50/50" | Click-to-edit (read state by default, edit state on demand), grouping with counts | Centered 500 px column (fails D-L5) |
| 3 | [Jira, How do you track work?](https://mobbin.com/screens/977d51bc-a257-40c3-9a87-ea779181aeb0) | Setup list of inputs, each with a remove cross, and one empty input at the end that becomes the next row | The always-present empty row: no "Add" button needed | Only works for 5 rows |
| 4 | [Maze, Add in bulk](https://mobbin.com/screens/32e38369-8577-48a2-8efa-90292560f63b) | Paste box "separated by a comma or new line" with a live button "Add 0 cards" | Live count on the commit button: confirmation that says what it will do | A modal on top of the list hides the list you are adding to |
| 5 | [Cloaked, Review and import identities](https://mobbin.com/screens/6bda4a8f-7556-4cec-800a-cba28fff6f3c) | Review table with tabs "All 3 / Needs review 1 / Duplicates 0 / No issue 2", an amber "Needs review" pill per row, a pencil to edit in place | Duplicates as a filter tab with a count, not a separate screen; state pill per row | Separate import wizard step; we do this on the list itself |
| 6 | [Remote, Review your team's time off data](https://mobbin.com/screens/d04c9f64-c644-4b9c-8e43-93de5b2fdbc0) | "Show only rows with errors" switch, problem cell marked, "Continue with 1 record" | One control to narrow to the rows that need you | Paragraph of instructions above the table (D-L34) |
| 7 | [Square, Bulk edit items](https://mobbin.com/screens/c3ca94ec-1b61-480c-9e36-688ebeec51d6) | Spreadsheet grid, every cell an input, category column, one "Update n" action | The grid model for concept C | Every cell boxed; heavy at 150 x 3 |
| 8 | [AirOps, New Grid](https://mobbin.com/screens/2fa3c847-5d9c-4b58-ae6b-bb748a8d137e) | Grid with row numbers, "Add Row" and "Add 10 Rows" in the footer, "20 Rows" count | Row count in the footer, add at the end | Generic column builder; we have fixed columns |

Also seen and set aside: Fresha "To be imported (1) / Errors (2)" tabs (same lesson as Cloaked), Attio import "Needs review 3" group with inline fix popover (good for Phase 2 upload review), Asana Import tasks (file plus "Paste text instead" link: the Phase 2 upload entry).

No reference found for one thing: proposing categories from heading lines in a pasted list (IM-07) inside a list editor. The closest is Searchable's grouped list. Concept B's heading rule is our own; say so if it is shown to Sankalp.

### Analogy outside SaaS

A shopping list on the fridge: you write the next line at the bottom without opening anything, you cross out a line where it is, you fix a misspelling in place, and when someone hands you their list you copy it in one go and strike the ones you already have. Nobody writes the list on a separate sheet and staples it under a read-only copy, which is what the current step does.

## 4. Concepts

Shared across all concepts (so they compare on structure, not on details):

- Frame: focus workflow (D-L44): h1 "Set up skills", Save and exit (outline) top right, horizontal WizardNav, footer with Next (the one filled button).
- Remove: immediate, because nothing is tracked yet (D-X15); a LocalBanner "3 skills removed" with Undo (undo for low-impact changes, interaction rules). No confirm dialog.
- No helper lines (D-L34). Placeholders are labels, not instructions.
- Every pasted line that could not be read (blank after trimming is ignored; over 120 characters, or a heading with nothing under it) appears in a "Not added (n)" disclosure with its original text (IM-08).
- Words from `lib/lab/terms.ts` (`skillNoun`, `skillNounPlural`), never "items".
- Same writer as the hub Library (`useLibrary`: `add`, `addMany`, `edit`, `remove`) and the same parser (`parseSeveral`, `normName`, `duplicateChoices`), so nothing about adding is forked.

### Concept A. The list is the page (add row on top, edit in place)

Mental model: a shopping list. One always-present input at the top; Enter adds one, pasting several lines adds many after a one-line check; every row is editable where it sits.

Empty state (1440):

```
+----------------------------------------------------------------------------------------------------------------+
| Set up skills                                                                                  [Save and exit] |
|  (1) Skills --- (2) Categories and tags (optional) --- (3) Evaluation settings --- (4) ... --- (6) Review      |
|----------------------------------------------------------------------------------------------------------------|
| Skills                                                                                                         |
|                                                                                                                |
| +------------------------------------------------------------------------------------+  [Upload a file  Later] |
| | Add a skill, or paste a list                                                    ⏎  |                         |
| +------------------------------------------------------------------------------------+                         |
|                                                                                                                |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │ Name                                       │ Category                     │ Tags                          │  |
|  ├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤  |
|  │                         No skills yet                                                                     │  |
|  └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘  |
|                                                                                                                |
|----------------------------------------------------------------------------------------------------------------|
|                                                                                   [ Next ] (filled, enabled;   |
|                                                                                    pressed empty, it shows     |
|                                                                                    "Add at least one skill.")  |
+----------------------------------------------------------------------------------------------------------------+
```

After pasting 152 lines (the paste check, inline under the input, not a modal):

```
| +------------------------------------------------------------------------------------+  [Upload a file  Later] |
| | Hand hygiene⏎Vital signs⏎IV catheter insertion⏎ ... (152 lines)                     |                        |
| +------------------------------------------------------------------------------------+                         |
|   148 new · 3 repeated in your list · 1 not read      [Add 148 skills]  [Cancel]   (outline, outline)          |
```

`Add 148 skills` is the explicit confirmation (IM-13). Repeated lines are not silently dropped: they arrive flagged (below) unless removed here.

With 150 skills:

```
| Skills (150)                                                                                                   |
| +------------------------------------------------------------------------------------+  [Upload a file  Later] |
| | Add a skill, or paste a list                                                    ⏎  |                         |
| +------------------------------------------------------------------------------------+                         |
|                                                                                                                |
|  [Search skills         ]   [All 150] [Possible duplicates 3]                          ← DataTable toolbar      |
|  ┌───┬────────────────────────────────────────┬───────────────────────────┬─────────────────────────────┬───┐  |
|  │ ☐ │ Name                                   │ Category                  │ Tags                        │   │  |
|  ├───┼────────────────────────────────────────┼───────────────────────────┼─────────────────────────────┼───┤  |
|  │ ☐ │ Hand hygiene                       ✎   │ Infection control     ▾   │ Safety ×  + Add             │ ⋯ │  |
|  │ ☐ │ Vital signs                        ✎   │ Assessment            ▾   │ + Add                       │ ⋯ │  |
|  │ ☐ │ ▲ Possible duplicate  Vital Signs  ✎   │ Assessment            ▾   │ + Add                       │ ⋯ │  |
|  │   │   [Keep both] [Remove]                 │                           │                             │   │  |
|  │ ☐ │ IV catheter insertion              ✎   │ —                     ▾   │ + Add                       │ ⋯ │  |
|  │ ...                                                                                   (scrolls in the     │  |
|  │                                                                                        page; header sticky│  |
|  └───┴────────────────────────────────────────┴───────────────────────────┴─────────────────────────────┴───┘  |
|----------------------------------------------------------------------------------------------------------------|
|  150 skills                                                                                          [ Next ]  |
```

With 4 selected, the DataTable bulk bar replaces the toolbar:

```
|  4 selected   [Set category ▾]  [Add tags]  [Remove]                                         [Clear selection] |
```

Row menu `⋯`: Add description (opens the existing `SkillSheet`, SL-02), Remove.

| Aspect | How it works |
|---|---|
| Add one | Type in the add row, Enter. The row appears at the top of the table, highlighted for 2 s, focus stays in the add row (Jira pattern) |
| Add many | Paste multi-line text in the add row. The inline check counts new, repeated and not read; `Add n skills` commits. Tab-separated paste from a spreadsheet keeps its Category and Tags cells (`parseSeveral` already does this) |
| Edit | Name: DS `InlineInputEdit` (read state, click or Enter to edit, Enter saves, Escape cancels; Searchable pattern). Category: DS `InlineSelectEdit` with "Create {typed}" (SL-05). Tags: the existing `TagsPicker` chip box in a Popover |
| Remove | Row menu Remove, or select and Remove. Immediate, banner with Undo |
| Bulk | Checkbox selection (DataTable `selectable`, `bulkActionsSlot`): Set category, Add tags, Remove |
| 150 skills | Page scroll with sticky table header; search by name; count in the h2 "Skills (150)" and the footer. Newest first while adding, sortable by Name or Category |
| Duplicates | Exact match after `normName` (case, spaces) against the list. Amber `StatusBadge` "Possible duplicate" with glyph, plus Keep both / Remove on the row; a toolbar tab "Possible duplicates (n)" filters to them (Cloaked). In an empty program "replace" has no target; once the program has skills (hub Library), the three choices of `duplicateChoices` apply |
| Empty state | The add row is focused on arrival; table empty state title "No skills yet" (no body line) |
| Upload (Later) | One outline button beside the add row with the Later badge; opens the existing one-line popover "Upload comes in a later release." with "Paste a list instead", which focuses the add row |
| Next | Always enabled; with no skills it shows "Add at least one skill." and focuses the add row; with possible duplicates still open, Next still works (they are flagged, not blocking) [INFER] |

DS components: `InputGroup` + `InputGroupTextarea` (auto-grows on paste) + `InputGroupAddon` (Kbd ⏎), `Button` (outline, size default/sm), `DataTable` (`selectable`, `bulkActionsSlot`, `emptyState`, search), `InlineInputEdit`, `InlineSelectEdit`, `Popover` + existing `TagsPicker`, `StatusBadge` via `StatusPill`, `DropdownMenu` (row menu), `LocalBanner` (removed, with Undo), `Kbd`.

First viewport (wizard budget: 4 regions, 1 figure, 7 controls, 30 words, 1 primary): regions 3 (add row, table, footer); figure 1 (count); controls 6 (add row, Upload, search, duplicate tabs = 1, Next, Save and exit; row controls are inside the table region); words about 12; primary 1. Within budget.

Not on the page: status column (all unconfigured, IM-09 is shown on step 3 and Library), how it is judged, times needed, courses, evaluations (D-L45), any helper line.

Risks:
- Inline editing in DataTable cells: `InlineInputEdit` is a DS primitive meant for "detail rows and table cells" (its own doc), but focus handling inside DataTable rows with 150 rows needs checking (keyboard: Enter to edit, Tab out).
- Paste in a single-line field: the add row must be a textarea that looks like an input (InputGroupTextarea, 1 row, grows on paste). Users who do not know that paste works will add one by one; the placeholder "Add a skill, or paste a list" is the only cue (no helper line, D-L34).
- Rows added newest-first change positions while you work; sorting by Name is one click.

Question it tests: is one surface (add, see, fix) clearer than ways-to-add plus a result?

### Concept B. Paste first, then the list (two panes, text on the left, rows on the right)

Mental model: a document you are cleaning up. The left pane is the raw list as text (what they copied from Word or Excel); the right pane is what Prism reads from it, live. Editing the text edits the list. Headings become categories (IM-07).

```
+----------------------------------------------------------------------------------------------------------------+
| Set up skills                                                                                  [Save and exit] |
|  (1) Skills --- (2) Categories and tags (optional) --- (3) ... --- (6) Review                                   |
|----------------------------------------------------------------------------------------------------------------|
| Skills                                                                                                         |
|  ┌─ Your list ───────────────────────────────────┐  ┌─ Skills (148) ─────────────────────────────────────────┐ |
|  │ Infection control:                            │  │ [Search skills      ]  [All 148] [Possible dup. 3]     │ |
|  │ Hand hygiene                                  │  │ ── Infection control (12) ────────────────────────────  │ |
|  │ Sterile gloving                               │  │   Hand hygiene                                     ⋯    │ |
|  │ PPE donning and doffing                       │  │   Sterile gloving                                  ⋯    │ |
|  │                                               │  │ ── Assessment (18) ───────────────────────────────────  │ |
|  │ Assessment:                                   │  │   Vital signs                                      ⋯    │ |
|  │ Vital signs                                   │  │   ▲ Possible duplicate  Vital Signs  [Keep both][Remove]│ |
|  │ Vital Signs                                   │  │ ── No category (6) ───────────────────────────────────  │ |
|  │ ...                                           │  │   IV catheter insertion                            ⋯    │ |
|  │                                               │  │ ▸ Not added (1)                                         │ |
|  │ (Textarea, full height, monospace off)        │  │                                                         │ |
|  └───────────────────────────────────────────────┘  └─────────────────────────────────────────────────────────┘ |
|  [Upload a file  Later]                                                                                        |
|----------------------------------------------------------------------------------------------------------------|
|  148 skills                                                                                 [ Add and continue ]|
```

| Aspect | How it works |
|---|---|
| Add one | Type a new line in the text |
| Add many | Paste into the text; the right pane fills live (debounced 300 ms, Doherty) |
| Edit | Edit the line in the text. Clicking a row on the right selects its line on the left (the existing `editPastedLine` helper maps line numbers) |
| Remove | Delete the line, or `⋯` Remove on the right (removes the line on the left) |
| Bulk | Select lines in the text and delete; recategorise by moving lines under another heading |
| 150 skills | Both panes scroll on their own; right pane grouped by category with counts (10 groups for the reference set) |
| Duplicates | Flagged on the right with Keep both / Remove; Remove deletes the repeated line on the left |
| Empty state | Left: an empty textarea, placeholder "Paste or type your skills, one per line"; right: "No skills yet" |
| Upload (Later) | Outline button under the text pane |
| Commit | Nothing is created until the footer primary "Add and continue" (the wizard's one filled button), which satisfies IM-13 literally; after that the step shows the list as in concept A when reopened |

DS components: `Textarea` (or `InputGroupTextarea`), `ResizablePanelGroup` (DS `resizable`) for the two panes, `DataTable` grouped or DS `Table` with group rows, `StatusBadge`, `Collapsible` (Not added), `DropdownMenu`, `Button`.

First viewport: regions 3 (text pane, rows pane, footer); figure 1; controls 6; words about 14. Within budget. Full width by structure, not stretched fields (D-L5).

Not on the page: inline category picker per row (category comes from headings); tags (moved to step 2, which already exists for them).

Risks:
- Tags drop out of step 1. D-X28 says Category and Tags in every add path; tags would need the row menu or step 2. Partial on SL-04 for this step.
- Two sources of truth while editing (text and rows); the mapping breaks if a user edits a row on the right and the text on the left at the same time. Rows on the right must be read-only except Remove.
- After commit, the text model no longer applies (reopening the step shows rows, not text). Two modes for one step.
- The heading rule ("a line ending in a colon is a category") is our invention; no reference found. Users with numbered lists ("1. Hand hygiene") need numbering stripped [INFER].

Question it tests: do admins think of their list as a document they paste and clean, rather than rows they manage?

### Concept C. Spreadsheet grid (Name, Category, Tags as cells)

Mental model: Excel, where the list already lives. Arrow keys move, typing overwrites, pasting a block from Excel fills rows and columns.

```
+----------------------------------------------------------------------------------------------------------------+
| Set up skills                                                                                  [Save and exit] |
|  (1) Skills --- (2) ... --- (6) Review                                                                         |
|----------------------------------------------------------------------------------------------------------------|
| Skills (150)                    [Search skills       ]  [Possible duplicates 3]          [Upload a file Later]  |
|  ┌────┬─────────────────────────────────────────┬──────────────────────────────┬──────────────────────────┬──┐ |
|  │ #  │ Name                                    │ Category                     │ Tags                     │  │ |
|  ├────┼─────────────────────────────────────────┼──────────────────────────────┼──────────────────────────┼──┤ |
|  │ 1  │ Hand hygiene                            │ Infection control            │ Safety                   │ ×│ |
|  │ 2  │ Vital signs                             │ Assessment                   │                          │ ×│ |
|  │ 3  │▲Vital Signs                             │ Assessment                   │                          │ ×│ |
|  │ 4  │[IV catheter insertion|]  ← active cell  │                              │                          │ ×│ |
|  │ ...│                                         │                              │                          │  │ |
|  │151 │ (empty row: type to add)                │                              │                          │  │ |
|  └────┴─────────────────────────────────────────┴──────────────────────────────┴──────────────────────────┴──┘ |
|----------------------------------------------------------------------------------------------------------------|
|  150 skills                                                                                          [ Next ]  |
```

| Aspect | How it works |
|---|---|
| Add | Type in the last empty row (AirOps grid, Jira); paste a block from Excel into any cell to fill rows and columns |
| Edit | Every cell is an input; arrow keys and Tab move; Enter commits |
| Remove | `×` per row; select row numbers (Shift-click) and Delete |
| Bulk | Fill-down a category (copy a cell, select a range, paste) |
| 150 skills | Grid scrolls in its own region with a sticky header; row numbers orient |
| Duplicates | Amber glyph in the row-number cell plus "Possible duplicate" in the cell tooltip; the toolbar filter narrows |
| Empty state | 10 empty rows ready to type in |
| Upload (Later) | Outline button in the toolbar |

DS components: DS has no editable data grid. This needs DS `Table` with `Input` in every cell plus hand-written keyboard navigation, range selection and block paste. That is a new interaction component (needs `ds-adoption-reviewer`), or a vendored grid outside the DS.

First viewport: regions 3, figure 1, controls 5 plus the grid; words about 10.

Risks:
- Hand-rolls the hardest part (grid keyboard model, range paste) outside the DS. Against the DS-only rule unless the DS team adds a grid.
- Tags as free text in a cell break the chip model (D-L5: "Tags shouldn't use dropdown components... chip text box").
- 450 always-editable cells: accessibility (one tab stop per cell, screen reader noise) and accidental overwrite.
- Strong at Excel-literate admins, weaker for those copying from a PDF checklist.

Question it tests: does matching Excel beat a cleaner list for the 150-row case?

### Concept D. Outline by category (categories on the left, skills of one category on the right)

Mental model: folders. Many programs already group their checklist by heading (IM-07). You pick or create a category, then add its skills.

```
+----------------------------------------------------------------------------------------------------------------+
| Set up skills                                                                                  [Save and exit] |
|  (1) Skills --- ... --- (6) Review                                                                             |
|----------------------------------------------------------------------------------------------------------------|
| Skills (150)                                                                                                   |
|  ┌─ Categories ────────────────┐  ┌─ Assessment (18) ──────────────────────────────────────────────────────┐   |
|  │ All skills            150   │  │ [ Add a skill to Assessment, or paste a list                        ⏎ ] │   |
|  │ No category             6   │  │  ☐ Vital signs                                    Tags: + Add      ⋯   │   |
|  │ Infection control      12   │  │  ☐ ▲ Possible duplicate  Vital Signs        [Keep both] [Remove]       │   |
|  │ ▸ Assessment           18   │  │  ☐ Head-to-toe assessment                         Tags: Adult ×    ⋯   │   |
|  │ Medication             22   │  │  ...                                                                   │   |
|  │ ...                         │  │                                                                         │   |
|  │ [+ New category]            │  │                                                                         │   |
|  └─────────────────────────────┘  └─────────────────────────────────────────────────────────────────────────┘   |
|  [Upload a file  Later]                                                                                        |
|----------------------------------------------------------------------------------------------------------------|
|  150 skills                                                                                          [ Next ]  |
```

| Aspect | How it works |
|---|---|
| Add | Add row at the top of the selected category; skills land in that category (or "No category") |
| Edit | `InlineInputEdit` on the name; drag or "Move to" in the row menu to change category |
| Remove | Row menu or selection; banner with Undo |
| 150 skills | Never more than one category's skills in view (about 15 to 25); counts per category on the left |
| Duplicates | Checked across all categories; flagged on the row; "Possible duplicates (n)" as a rail row |
| Empty state | Rail shows only "No category 0" and New category; right pane is the add row |
| Upload (Later) | Under the rail |

DS components: `InputGroup`, `DataTable` or DS `Table` per category, DS secondary list for the rail (`SidebarDrillIn` is too heavy; a `ToggleGroup` vertical or a simple `Button` ghost list), `InlineInputEdit`, `DropdownMenu`, `StatusBadge`, `LocalBanner`.

Risks:
- Category is optional (SL-03) but this layout makes it the first decision; programs without categories see a two-pane page with one row on the left.
- Overlaps step 2 (Categories and tags). The wizard would ask about categories twice.
- Pasting a flat list of 150 puts everything in one category; the rail adds nothing until the user sorts.

Question it tests: do programs think category-first? (The Oct 26 call and SL-03 say categories are optional, so likely not for most.)

## 4b. Scenarios: how each concept handles adding one or more skills

Romit's list (2026-11-04), one row per situation, for every concept. "Existing skill" means one already in the new program's list (the step starts empty, D-L44); against the seeded hub Library the same rows apply with `duplicateChoices` offering Skip, Replace or Keep both (IM-06). Leave and resume relies on what D-L44 already stores: wizard progress in localStorage and the new program's skills in its own store (`lib/lab/new-program.ts`), so anything written with `useLibrary` survives Save and exit.

### Shared ASCII states (used by A, C and D; B's versions follow its table)

Duplicate flag on a row:

```
│ ☐ │ Vital signs                                  │ Assessment  ▾ │ + Add │ ⋯ │
│ ☐ │ ▲ Possible duplicate   Vital Signs           │ Assessment  ▾ │ + Add │ ⋯ │
│   │   [Keep both]  [Remove]                      │               │       │   │
```

Add row with an empty name (Enter pressed on nothing):

```
+------------------------------------------------------------------------------+
| (empty)                                                                    ⏎ |
+------------------------------------------------------------------------------+
  ⚠ Enter a skill name.                       ← FieldError, shown only after Enter
```

Typing a name that already exists (before Enter):

```
+------------------------------------------------------------------------------+
| vital signs                                                                ⏎ |
+------------------------------------------------------------------------------+
  ▲ Vital signs is already in the list.   [Add anyway]  [Go to it]
```

Remove and undo:

```
┌ LocalBanner ─────────────────────────────────────────────────────────────────┐
│ ✓ 3 skills removed.                                                  [Undo]  │
└──────────────────────────────────────────────────────────────────────────────┘
  (stays until the next change or Next; Undo puts the rows back where they were)
```

Paste check (A and D):

```
| Hand hygiene⏎  ⏎Vital signs⏎Vital Signs⏎Hand hygiene ⏎ ...                   |
  5 new · 2 repeated in your list · 1 already added · 1 not read
  [Add 5 skills]  [Cancel]                         ▸ Not read (1)
```

### Concept A. The list is the page

| Situation | What happens |
|---|---|
| Empty step, Next | Next is enabled (no disabled controls above the fold). Pressing it shows FieldError under the add row "Add at least one skill." and focuses the add row; nothing advances (the gate in D-L44: a skill in the library) |
| Add one, name only | Type, Enter. The row appears at the top, highlighted 2 s; Category shows "—", Tags "+ Add"; count goes 0 → 1; focus stays in the add row for the next name |
| Add one, with category and tag | Enter the name, then set it on the row: Category `InlineSelectEdit` (type to search, "Create {typed}", SL-05); Tags "+ Add" opens the chip `TagsPicker` (create inline). A tab-separated line from a spreadsheet ("IV insertion⇥Procedures⇥Adult") sets both at once |
| Empty name | Enter on an empty row does nothing visible except the FieldError "Enter a skill name." (state above); spaces only count as empty |
| Duplicate of an existing skill | Inline warning under the add row before Enter (state above): "Add anyway" adds it flagged as Possible duplicate; "Go to it" scrolls to and highlights the existing row. Case and spacing are ignored (`normName`) |
| Paste 5 | Paste check line: "5 new" and "Add 5 skills". After adding: 5 rows at the top, banner-free (the count changing is the outcome), focus back in the add row |
| Paste with duplicates (in paste and against existing) | Check line separates them: "5 new · 2 repeated in your list · 1 already added". "Add 5 skills" adds the new ones and the first of each repeated pair; the second of each pair and the already-added line arrive flagged as Possible duplicate rows (not dropped silently, IM-06). The "Possible duplicates (3)" tab filters to them |
| Paste with blank lines and spaces | Blank lines are ignored and not counted; leading, trailing and double spaces are trimmed; bullets and numbering ("•", "1.", "-") are stripped [INFER, extends `parseSeveral`]. Lines over 120 characters go to "Not read (n)" with their original text (IM-08) |
| 150 skills: find, scroll, count | Count in the heading "Skills (150)" and the footer; search filters by name as you type (shows "12 of 150"); page scroll with a sticky table header; sort by Name or Category from the header |
| Edit in place | Click the name (or Enter on a focused row): `InlineInputEdit` opens; Enter saves, Escape cancels. Renaming into a duplicate flags the row. Category and tags edit in their cells. Description through the row menu "Add description" (SkillSheet, SL-02) |
| Remove one | Row menu `⋯` → Remove. Row goes immediately; banner "Hand hygiene removed. [Undo]" |
| Remove several | Select with checkboxes (header checkbox selects the filtered set, for example all possible duplicates); bulk bar "4 selected [Set category] [Add tags] [Remove]"; Remove → banner "4 skills removed. [Undo]" |
| Undo a removal | Undo in the banner restores the rows with their category, tags and position; the banner closes. One level of undo (the last removal) |
| Upload (Later) | Outline "Upload a file  Later" beside the add row; opens the popover "Upload comes in a later release." with "Paste a list instead", which closes it and focuses the add row |
| Leave and resume | Save and exit at any time; every added skill is already written. Reopening ("Continue setup" on Library) lands on step 1 with the list as left, sorted by entry order; an unsent paste in the add row is kept in the session as a draft [INFER] |

### Concept B. Paste first, two panes

States specific to B:

```
┌─ Your list ───────────────────────┐  ┌─ Skills (5) ───────────────────────────────────┐
│ Hand hygiene                      │  │   Hand hygiene                             ⋯   │
│ Vital signs                       │  │   Vital signs                              ⋯   │
│ Vital Signs              ← line 3 │  │   ▲ Possible duplicate  Vital Signs  line 3    │
│                                   │  │     [Keep both]  [Remove line]                 │
│ Hand hygiene                      │  │   ▲ Possible duplicate  Hand hygiene line 5    │
└───────────────────────────────────┘  └────────────────────────────────────────────────┘
```

| Situation | What happens |
|---|---|
| Empty step, Next | The primary reads "Add and continue"; pressed with an empty text, FieldError under the text "Add at least one skill." and focus moves to the text |
| Add one, name only | Type a line; the right pane shows it within 300 ms; nothing is created until "Add and continue" |
| Add one, with category and tag | Category: put the line under a heading line ("Procedures:"); tags: not possible in the text. Only after adding, via the row menu or step 2. Partial on D-X28 and SL-04 for this step |
| Empty name | An empty line is just a blank line; ignored, never an error |
| Duplicate of an existing skill | Flagged on the right with Keep both / Remove line (state above); Remove line deletes it from the text |
| Paste 5 | Paste into the text; right pane "Skills (5)" fills live |
| Paste with duplicates (in paste and against existing) | Both flagged on the right with their line number; against already-added skills (on reopen) the flag reads "Already added" with Skip line / Keep both |
| Paste with blank lines and spaces | Ignored and trimmed on the right; the text keeps exactly what was pasted, so the left pane can look messier than the result |
| 150 skills: find, scroll, count | Each pane scrolls on its own; count in the right pane title; search on the right only (browser find for the text); right pane grouped by category with counts |
| Edit in place | Edit the line in the text; clicking a row on the right selects its line. Rows on the right are not editable (one source of truth) |
| Remove one | Delete the line, or `⋯` → Remove line on the right |
| Remove several | Select lines in the text and delete; no checkbox selection on the right |
| Undo a removal | Text undo (Cmd+Z) in the text area; the right pane follows. No banner, so undo is invisible to people who do not know the shortcut |
| Upload (Later) | Outline button under the text pane, same popover; "Paste a list instead" focuses the text |
| Leave and resume | Before "Add and continue", the text is a draft (must be stored, or it is lost on Save and exit). After adding, reopening shows the added skills as a list, not as text: the step changes model on reopen |

### Concept C. Spreadsheet grid

| Situation | What happens |
|---|---|
| Empty step, Next | Ten empty rows; Next shows "Add at least one skill." above the grid and focuses row 1 Name |
| Add one, name only | Type in the first empty Name cell, Enter or Down; the row is created when the Name cell commits |
| Add one, with category and tag | Tab to Category (type to search, create on Enter); Tags cell is free text separated by commas, turned into chips on blur (breaks the chip text box rule, D-L5) |
| Empty name | A row with Category or Tags but no Name shows the amber glyph in the row number and "Name needed" on hover; it is not created |
| Duplicate of an existing skill | ▲ in the row-number cell, cell tooltip "Possible duplicate of row 2"; resolve by editing or `×` |
| Paste 5 | Paste a column of 5 into a Name cell: fills 5 rows downward |
| Paste with duplicates (in paste and against existing) | Rows fill, repeated ones get ▲; filter "Possible duplicates (n)" in the toolbar |
| Paste with blank lines and spaces | Blank lines become empty rows that are not created (dropped on blur); spaces trimmed. Multi-column paste from Excel maps by position (Name, Category, Tags) |
| 150 skills: find, scroll, count | Grid scrolls in its own region with row numbers; count in the heading and footer; search in the toolbar highlights matching rows |
| Edit in place | Every cell is always editable; type to overwrite, F2 or Enter to edit |
| Remove one | `×` at the row end, or select the row number and Delete |
| Remove several | Shift-click row numbers, Delete; banner with Undo |
| Undo a removal | Banner Undo plus Cmd+Z in the grid |
| Upload (Later) | Outline button in the toolbar, same popover |
| Leave and resume | Created rows persist; half-filled rows (no Name) are lost on exit |

### Concept D. Outline by category

| Situation | What happens |
|---|---|
| Empty step, Next | Rail shows "No category 0"; Next shows "Add at least one skill." under the add row |
| Add one, name only | With "No category" selected, type and Enter; the rail count updates |
| Add one, with category and tag | Select or create the category in the rail first, then add; tags through "+ Add" on the row |
| Empty name | FieldError "Enter a skill name." under the add row |
| Duplicate of an existing skill | Checked across all categories: "Vital signs is already in Assessment. [Add anyway] [Go to it]"; Go to it switches the rail selection |
| Paste 5 | Paste into the add row of the selected category; all 5 land there |
| Paste with duplicates (in paste and against existing) | Same check line as A; the rail gains a row "Possible duplicates (n)" across categories |
| Paste with blank lines and spaces | As A; heading lines in the paste create or match categories in the rail |
| 150 skills: find, scroll, count | Counts per category in the rail and total in the heading; "All skills 150" shows the flat list; search across all categories from the right pane |
| Edit in place | `InlineInputEdit` on the name; "Move to" in the row menu changes category |
| Remove one | Row menu, banner with Undo |
| Remove several | Checkboxes within one category, or select across categories in "All skills"; bulk bar with Remove |
| Undo a removal | Banner Undo restores the rows into their categories |
| Upload (Later) | Under the rail, same popover |
| Leave and resume | Persists; resumes on the last selected category [INFER] |

### What the scenarios show

| Situation | A | B | C | D |
|---|---|---|---|---|
| Add one with category and tag | Yes, on the row | Category only, through a heading | Yes, tags as text | Yes, category first |
| Duplicates visible after adding | Yes, flag and tab | Yes, until added; then as A | Yes, glyph | Yes, flag and rail row |
| Paste noise (blanks, spaces, bullets) | Cleaned, "Not read" listed | Cleaned on the right, left stays messy | Blank rows left in the grid | Cleaned |
| Remove several | Checkboxes and bulk bar | Select text | Row numbers | Within a category |
| Visible undo | Banner | Keyboard only | Banner and keyboard | Banner |
| Same model on resume | Yes | No | Yes | Yes |

A handles every situation on one surface with a visible undo. B fails on tags and invisible undo; C fails on tags-as-text and leftover blank rows; D makes every add a category decision first.

## 5. Comparison

| Concept | Mental model | Primary job | First viewport (regions/budget) | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|---|
| A. List is the page | Shopping list | Add and fix in one place | 3 / 4, 6 controls / 7 | InputGroup, DataTable (selectable, bulk), InlineInputEdit, InlineSelectEdit, TagsPicker, StatusBadge, LocalBanner | Status, config, courses | Paste discoverability; inline edit focus in DataTable | One surface vs ways-to-add plus result |
| B. Paste first | Document clean-up | Paste and clean a list | 3 / 4, 6 / 7 | Textarea, Resizable, DataTable grouped, Collapsible | Tags, per-row category picker | Two sources of truth; tags missing; heading rule unproven | Is the list a document? |
| C. Grid | Excel | Type and paste cells | 3 / 4, 5 / 7 | Table + Input per cell (no DS grid) | Chips | Hand-rolled grid; a11y; tags as text | Does matching Excel win? |
| D. Outline | Folders | Group as you add | 4 / 4, 6 / 7 | InputGroup, Table, ghost Button list | Flat view by default | Category forced first; overlaps step 2 | Do programs think category-first? |

## 6. Recommendation: concept A, with B's paste rules folded in

Why A:
1. It answers each part of Romit's critique directly: no row of buttons (the add row is the action, beside its object), no read-only table at the bottom (the table is the page and is editable), remove in step 1 (row and bulk), and a better workflow (type, Enter, next; paste, check, add).
2. It is the pattern most references converge on for onboarding lists (AirOps, Searchable, Jira, Cloaked), and it stays DS-only: `InlineInputEdit`, `InlineSelectEdit` and DataTable `selectable` / `bulkActionsSlot` all exist in `@exxatdesignux/ui@1.5.1`.
3. Same surface on day 1 and on reopen (B switches models after commit), and it carries Category and Tags in the add path (D-X28), which B does not.
4. It scales: search, a duplicates tab with a count, sticky header, bulk bar.

Fold in from B: heading lines in a paste ("Infection control:" or a line followed by indented lines) propose a category for the lines under them, shown in the paste check line ("148 new in 10 categories") and editable after adding (IM-07). Mark this rule as Proposed in lab notes; no reference found.

Not chosen: C needs a grid the DS does not have; D forces an optional field first and repeats step 2.

## 7. What changes in the hub Library

| Item | Change | Why |
|---|---|---|
| Library A and B table | No change to columns (D-L45 already removed Evaluations) | The Library manages configured state; step 1 builds the list |
| "Add several" sheet | Keep as is for now; later it could become the same add row above the Library table, so there is one add pattern in the product | Consistency (one way to paste) without touching a decided page now |
| Duplicate rule | One shared function for both: the step's "Possible duplicate" badge and the sheet's skip reasons use `normName` and `duplicateChoices` from `lib/lab/library.ts` | Same words, same result everywhere |
| Inline rename | Proposed for Library later, not now | Library has a row menu and side panel; adding inline edit there is a separate change for Romit |

## 8. Build notes for when Romit says go (not started)

- Replace the body of `admin/components/lab/setup/skills-add-step.tsx`; keep `useLibrary` as the writer. Needs a `removeMany` (or a loop over `remove`) and an `undo` that re-adds the removed rows with their ids.
- New helper in `lib/lab/library.ts`: `duplicateGroups(rows)` (pairs by `normName`), reused by the step and the sheet; unit tests beside `tests/lab/setup-wizard.test.ts`.
- Paste check copy: "{n} new · {n} repeated in your list · {n} not read", button "Add {n} skills" (outline), Cancel (outline). Next stays the only filled button.
- Contract in `docs/build/contracts/` before JSX (skill `skills-surface-contract`). Gates and screenshots at 1920, 1440 and 1024.

## 9. Open questions for Romit

1. Paste confirmation: one-line check with "Add n skills" (proposed, satisfies IM-13), or add straight away with Undo (faster, weaker on IM-13)?
2. Should possible duplicates block Next, or only be flagged? Proposed: flagged, not blocking.
3. Near-duplicates ("IV insertion" vs "IV catheter insertion"): exact match only (proposed), or also fuzzy matches? Fuzzy is an interpretation and would need its own review wording.
4. Keep Tags on step 1 (proposed, D-X28) or leave tags to step 2 only?

## 10. Self-critique

- The add row is a textarea dressed as an input; if people never discover paste, A degrades into one-at-a-time typing. A placeholder is the only cue allowed by D-L34. Mitigation to test: the Upload "Later" popover offers "Paste a list instead", which focuses the add row.
- Newest-first ordering during entry and alphabetical on reopen could feel inconsistent; consider keeping entry order always, with sort on demand.
- Inline edit in 150 DataTable rows is unproven for keyboard and screen reader in this DS version; this needs a spike before the full build.
- The duplicates tab makes a third control in the toolbar row with search; at 1024 width it may wrap.
- 375 is out of scope for an admin focus workflow, but at 1024 the Tags column should collapse into the row menu.
