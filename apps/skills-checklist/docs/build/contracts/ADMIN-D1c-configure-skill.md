# ADMIN-D1c Configure one skill

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D1c

Written 2026-11-06 from the designer's approved design (D-L115). The map is the spec; nothing here restates it. Density is the acceptance test: the budget table in map D1c is asserted per model by task CFG1, and no number in it is raised silently.

## Task test IDs
CFG1 CFG2 CFG3 CFG4 CFG5 CFG6 CFG7 CFG8 CFG9 CFG9b CFG10 CFG11 CFG12 CFG13 CFG14 CFG15 CFG16 CFG17 CFG18 CFG19 CFG20 CFG21 CFG22 CFG23 CFG24 CFG25 CFG26 CFG27 CFG28 CFG29 CFG30 CFG31

## Primary action
Save changes, filled, top right. It exists only after a change. Under Not configured (a), before a model is chosen, Set how skills are judged is the one filled action.

## Other actions
| Action | Where | Why |
|---|---|---|
| Cancel | Top right, only after a change | Asks "Discard your changes?", then returns to where the admin came from |
| Preview | Header, below 1100 px | Dialog with both forms; closing keeps the draft |
| Edit levels, Edit questions, Choose, Edit fields, Add minimum | Their rows | A Dialog or menu; the result stays in the draft until Save changes |

## States
| State | What shows |
|---|---|
| Loading | Skeleton, under the title |
| Empty | Not configured (a), tiles with none preselected, preview line |
| Error | Sticky problem list, field errors, closed sections read "1 to fix"; a failed save reads "{Skill} was not saved. Try again." and keeps the form |
| Not found | The configure not-found block, naming the link as out of date |
| Inactive | Badge, every field live (D-L93); saves name no students |
| Not configured (b) | No questions yet with Add questions, preview line |

## Not on this page
Status (the panel's header switch); name, description, category and tags (the panel's Details); Used in (the panel); a sticky footer; a Steps panel; a Check table; anchor chips; Start from (D4 only).

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Change a skill's Times needed | Any door | Type the number, Save changes, confirm when named | Saved | Library, same filters and scroll, panel open, banner |
| Give a skill its own settings | Any door | Custom, change in a section, Save changes, confirm when named | Saved, reads Custom | Library, same filters and scroll, panel open, banner |
| Go back to the default | Any door on a Custom skill | Default, Save changes, confirm when named | Saved, reads Default | Library, same filters and scroll, panel open, banner |
| Add questions | Not configured (b) | Add questions, write them, Save, Save changes | Saved, reads Default or Custom | Library, same filters and scroll, panel open, banner |
| Leave without saving | Any door, a change made | Cancel, Discard | Nothing saved | Where the admin came from |

## Layout amendment 2026-11-10: the Evaluation settings cards
Coordinator brief, 2026-11-10: the per-skill page reads as one system with Evaluation settings B (D-L134). The accordion goes; the same three DS Cards, in the same order and names, hold every setting. Recorded as D-L135 (Proposed until Romit tries it).

```
Nasogastric tube care  [badges]                                   [Preview <1100] [Cancel] [Save changes]
Evaluation settings  [ Default | Custom ]          Edit Evaluation settings (link, Default only)
+-- What counts as achieved ---------------------------------- Default / Custom --+   +-- What they will see --+
| [ This skill's rule: Student needs 2 evaluations rated works alone. ]           |   | Student | Evaluator    |
| Default:  How this skill is judged   Independence level        (label | value)  |   | (tray, read only)      |
|           Levels                     Needs coaching, ...                         |   |                        |
|           Counts                     Works alone                                 |   |                        |
|           Questions   This skill only   4 questions          [Edit questions]    |   |                        |
|           Times needed  This skill only  [ 2 ] evaluations                       |   |                        |
|           Minimums      This skill only  None                  [Add minimum]     |   |                        |
|           Who can sign off           Preceptor, Clinical faculty                 |   |                        |
| Custom:   model tiles · Levels (LevelList) · Labels · Scale · Counts when       |   |                        |
|           (radios) · Questions [Edit questions] · Times needed · Minimums ·     |   |                        |
|           Who can sign off (boxes)                                               |   |                        |
+---------------------------------------------------------------------------------+   +------------------------+
+-- Steps before it counts ------------------------------------ Default / Custom --+
| (1) Student logs the skill  Always · (2) Student rates themselves first  On|switch |
| (3) Evaluator signs off  Always · (4) Approval before it counts  Off|switch · (5)  |
+---------------------------------------------------------------------------------+
+-- Forms ------------------------------------------------------ Default / Custom --+
| What the student fills in   value | Edit fields                                  |
| Feedback is required        value | switch                                       |
| Faculty can check off a group  value | switch, then level or score               |
+---------------------------------------------------------------------------------+
```

| Before (accordion, D-L115) | After (cards) |
|---|---|
| Evaluation settings Default / Custom | Same segmented control, top of the form column |
| How this skill is judged (tiles, rebuild on change) | Card 1 first row; Default reads the model as a value |
| Levels: table with Counts + Edit levels dialog | Card 1: LevelList (names inline, Counts, row menu), same as Evaluation settings |
| Labels, Which one qualifies | Card 1, fields span the card |
| Scale, Counts when (Select) | Card 1: Scale, Counts when as radios, same as Evaluation settings; named questions keep Choose |
| Questions (Edit questions dialog), Questions that must be Yes | Card 1, unchanged controls |
| Times needed | Card 1, number with its unit, always editable |
| Minimums | Card 1, always editable |
| Who can sign off | Card 1 |
| Student fills in, Student rates first | Card 3 row; card 2 step 2 |
| Feedback, Group check-off and its level or score | Card 3 |
| Approval before it counts | Card 2 step 4 |
| Default read-out "From Evaluation settings" | Values in place in each card; each card's header says Default or Custom; the skill's own rows say "This skill only"; one link "Edit Evaluation settings" |

Inherit or override, without opening anything: each card's header carries Default (muted) or Custom (badge); under Default the rows the skill keeps for itself carry "This skill only" and stay live controls.
Density: the D-L115 budget (Custom 9 fields, 900 px fit) cannot hold with every card open; CFG1 now checks no repeats, no filled button on arrival, one form column and the tray in view, and records the counts. Raised for Romit, not silently.
Tasks unchanged. Save, Cancel, the unsaved guard, the impact dialog, a failed save and validation work as before; a problem names its card and focuses its field (no section to open).

## Amendment 2026-11-11: one rule for number fields (D-L142; Proposed)
Every small number on Evaluation settings and Configure one or several skills uses one width (`NUMBER_WIDTH`, 5rem) and one line component (`configure/number-field.tsx` `NumberWithUnit`): gap-2 between the input and its words, the words muted 14 px (`TYPE.helper`) on every row, selected or not. A standalone field has its label above the control: Times needed ("[ 1 ] evaluation for each skill"), Scale ("1 to [ 6 ]"), minimums. A radio option that carries a number (Counts when for scores and for questions) is the one inline case: the option's label, then the same input and words, the inputs left-aligned in one column. Covered: `cfg-need` (Evaluation settings B, Configure one skill, Configure several), `cfg-scale`, `cfg-srule-value` (and its two siblings), `cfg-qrule-n`, level, setting and evaluator minimums (`RuleNumber`), the Evaluation settings times table. Not covered: the Library table's Times needed cell (a table cell, 56 px), the question range inputs inside "Only the questions you choose".

## Amendment 2026-11-11 (question label; D-L142 item 9, Proposed)
Replaces the "Accepted" head (and, on Configure one skill, the "Accepted" word beside each box).

```
| Which levels move a student toward achieving the skill?  highest first   Start from [v] |
| :: [Works alone      ]  [x]  x |
| :: [With assistance  ]  [x]  x |
| :: [Needs coaching   ]  [ ]  x |
```

- The question is the list's one label line and names the checkbox group; rows carry no word. Each box: "{level} moves a student toward achieving the skill". Linked as D-L74; the live region says "{level} now also moves a student toward achieving the skill." or "{level} no longer does."
- Outcomes: "Which outcome moves a student toward achieving the skill?" labels the radio group; each radio named the same way.
- Nothing chosen: "Choose at least one level." (shared by every variant).
- On Configure one skill the card row's label is the question (it was "Levels"); the box column has no word.


## Amendment 2026-11-11 (column heads over the level checkboxes; D-L145, Proposed)
Romit: "I can't tell what does the checkbox offer". The Levels row's label is "Levels" again (the question moved off screen); the list carries column heads "Level" and "Moves student toward achieving the skill" on the rows' own grid (muted 12 px, `aria-hidden`; each box keeps the name "{level} moves a student toward achieving the skill"; the question stays the fieldset's legend for screen readers). The box sits in its own column at every width; below a 28rem list the row number is hidden so a name like "Needs coaching" keeps its room. The Levels dialog (names only) has no heads.
