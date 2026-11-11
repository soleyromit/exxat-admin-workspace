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
