# ADMIN-D3 Evaluation settings

Page spec: docs/build/2026-11-04-admin-workflow-map.md#D3

Build scope 2026-11-04: inheritance logic and the impact dialog only (D0 rules 4 to 9). Layout, map step G8, built 2026-11-05 (T7): plain rows, Preview in the header, the program's question set (D-L96). Layout rebuilt 2026-11-05: four named sections left, sticky "What they will see" panel right from 1100 px, Preview dialog below that (map D3, D-L99).

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| Leave with unsaved changes | Any link, panel row or path bar control while the page has edits | Press it, read "Discard your changes?", choose Keep editing or Discard | Keep editing keeps the edits; Discard drops them | Same page, or the page the link named |

## Task test IDs
S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20 S2b S4a S4b S8b S8c S8d S21 S22 S23 S24 S25 S26 S27 S28 S29 S30

## Layout amendment 2026-11-10: Rule, path, forms
Romit chose concept 1 on 2026-11-10 (coordinator relaying): three tiers by weight, Approval as its own step on the path (restores D-L26), no helper lines in the forms tier (partly reverses D-L129), about 20 first-viewport controls accepted. Tier words are Proposed [INFER].

```
Rule sentence (18 semibold, live)                                [Preview] [Save]
THE RULE   model tiles · Levels (name, Counts, row menu) · Times needed · Who can sign off
THE PATH   Student logs > [o] Rates themselves first > Evaluator signs off > [o] Admin approves > Counts
           (a vertical list in a container under 42rem, so at 375 px)
THE FORMS  What the student fills in [Edit fields] · Feedback is required [o] · Faculty can check off a group [o] > level
```

| Requirement | Where it stays |
|---|---|
| SC-02 model chosen explicitly, nothing preselected | Rule tier tiles; tiers 2 and 3 only after a model; group check-off starts off |
| SC-08 program levels, ordered | Rule tier Levels list; order through the row menu (Move up, Move down, Remove) |
| SC-10 total demonstrations | Rule tier Times needed. Minimum at each level is a skill's own part: Configure one skill, Minimums row (`skill-sections.tsx`), not this page |
| SC-11 clinical-setting minimums | Configure one skill, Minimums row; not on this program page (gap reported, not decided) |
| SC-13 what the student supplies | Forms tier, What the student fills in |
| SC-14 feedback mandatory | Forms tier switch |
| SC-15 self-evaluation, admin approval | Path tier switches |
| SC-16 roles that may sign off | Rule tier |
| SC-17 dependency apparent | Rule sentence, then the rule tier in model order |
| SC-18 unsatisfiable not savable | Problems list names the tier; save unchanged |
| SC-19 review before use | Preview, unchanged |

Tasks unchanged (table above). Keyboard task S20 now moves a level through the row menu; focus stays with the moved row's menu button.
Not on the page: helper lines in the forms tier, the Levels and Who can sign off helpers (they restated their labels; anatomy A8), the sentence as a bare line under the title (it is a labelled section; anatomy A1), a divider under every row, the repeated fact grid under the sentence (each fact is now its own control right below), cards.

## Layout redesign 2026-11-10 (replaces the tier layout above)
Romit rejected the tier build ("Very badly designed screen, doesn't look professional by any sense and usable"). Rebuilt after Linear and Stripe settings pages: one column (max 64rem) of DS Cards on one grid; every row is name and at most one help line on the left, control on the card's right edge.

```
Evaluation settings                                            [Preview] [Save changes]
+-- What counts as achieved -------------------------------------------------------+
| [ Your rule: Student needs 1 evaluation at any level. ]   (muted surface, live)   |
| How skills are judged                                                            |
| (o) Independence level | ( ) Approved or not approved | ( ) Questions | ( ) Score |
| Levels  Tick the levels that count toward achieved                               |
|  1 [Needs coaching    ] [x] Counts                                         [...] |
|  Add a level  Use a starting set                                                 |
| Times needed  Evaluations a student needs for each skill · 31 use another   [ 1] |
| Who can sign off                    [x] Preceptor [x] Clinical faculty [ ] Lab    |
+----------------------------------------------------------------------------------+
+-- Steps before it counts ---------------------------------------------------------+
| (1) Student logs the skill                                                 Always |
| (2) Student rates themselves first  Before the evaluator sees it            [o ] |
| (3) Evaluator signs off                                                    Always |
| (4) Approval before it counts  An admin approves each evaluation           [ o] |
| (5) Counted                                                                      |
+----------------------------------------------------------------------------------+
+-- Forms --------------------------------------------------------------------------+
| What the student fills in  Date performed, required                [Edit fields] |
| Feedback is required                                                       [ o] |
| Faculty can check off a group                                              [o ] |
|   [ Level for each student checked off                      [Works alone v] ]   |
+----------------------------------------------------------------------------------+
```
Preview opens beside the column (32rem) and, from 1600 px, on arrival (Proposed, D-X30). Below 1100 px Preview is a dialog. At 375 the stepper stays vertical, switches stay beside their words, a level's Counts box moves under its name.
Requirement table above stands; SC-15 is now the stepper, SC-16 the last row of the first card. Task tests S18/S18b read "What counts as achieved:"; S29 expects one row of tiles at 1440.

## Field widths amendment 2026-11-10 (D-L136)
Inside What counts as achieved every control sits under its name at the card's left edge: the question list and the binary labels span the content width; Times needed, At least n, the pass mark and the scale top share one 5rem width with their unit after them ("[1] evaluations for each skill"; scored: radios, then "At least [3] out of 5"). Who can sign off moves under its name. Switches stay at the right edge in the other two cards. Level names read as text until hovered or focused; Rename joins Move up, Move down and Remove in the row menu, and Counts sits beside the menu at the right edge. Path markers, step names and switches share one 24 px line.

## Layout amendment 2026-11-10: the rule as a statement (D-L140, variant B only)
Romit chose concept A, "The rule as a statement", from three mockups (2026-11-10), with concept C's level track. Replaces the one-column card layout above for variant B; variants A, C and D and Configure one skill are unchanged.

```
Evaluation settings                                  [Preview] [Discard]* [Save changes]
+-- Your rule (tinted band) ------------------------------------------------------------+
| Your rule                                                          Every skill on Default |
| A student achieves a skill with 1 evaluation rated with       31 skills use a different  |
| assistance or works alone, signed off by a preceptor or ...                 number (link)|
+---------------------------------------------------------------------------------------+
+-- What counts as achieved ----------------+  +-- Steps before it counts -------------+
| name (muted)      value (emphasised) Change|  | Student rates themselves first   [o ] |
| How skills are judged  Independence  Change|  |   Before the evaluator sees it        |
| Levels            With assistance... Edit  |  | Approval before it counts        [o ] |
|   open: Does not count | Counts toward ach.|  |   An admin approves each evaluation   |
|         [Needs coaching][With assist][Works]  +---------------------------------------+
|         Lowest                     Highest |  +-- Forms ------------------------------+
|         [Edit levels]               [Done] |  | What the student fills in       Edit  |
| Times needed      1 evaluation ...   Edit  |  |   Date performed (required)           |
|   open: [ 1] evaluations for each skill    |  | Feedback is required             [o ] |
| Who can sign off  Preceptor, Clinical  Edit|  | Faculty can check off a group    [o ] |
|   open: [x] Preceptor [x] Clinical [ ] Lab |  +---------------------------------------+
+-------------------------------------------+
* Discard only while there are unsaved changes.
```

- Every decision in the left card is one row on a shared three-column grid (name, value, action). One row open at a time; an open row edits in place under its value and closes with Done. Closed rows say the value in words.
- Levels: a horizontal track of level names, lowest first, as a radio group (the cut-off, D-L95 threshold, the lowest level may count). Counting segments filled, "Counts toward achieved" over them, "Does not count" over the rest; "Lowest" and "Highest" under the ends; vertical at 375. Names, order, add, remove and starting sets sit behind one "Edit levels" disclosure inside the open row.
- Questions (questions model) and Questions plus Scale and what counts (score model) open a DS FloatingSheetPanel that overlays the page (md): numbered fields with remove, Add a question, Paste a list; Counts when as three option rows; Cancel restores what the panel opened with, Done keeps the edits.
- Path chips are not in the band (they repeated the switches). The "31 skills use a different number" link lives only in the band.
- Before a model is chosen the card shows only "How skills are judged", open, with the four tiles; the band says "Choose how skills are judged to start". With a model but an unfinished rule the band says "Finish the settings below to see the rule here".
- A problem names its row ("Levels: Level 2 has no name."), and pressing it opens that row (or the panel) and focuses the field.
- Two columns from 64rem of content width; one column below that and at 375.

Requirement table above stands, with these places: SC-02 the model row starts open with nothing chosen; SC-03 the Labels row; SC-04 to SC-07 the Questions and Scale panels; SC-08 the Levels row (track and Edit levels); SC-10 Times needed row; SC-13 Forms, What the student fills in; SC-14 Forms switch; SC-15 Steps switches; SC-16 Who can sign off row; SC-17 the rule band; SC-18 problems list names the row; SC-19 Preview in the header. Tasks S1 to S30 are updated to open a row before using its control.

## Layout amendment 2026-11-10: every field on the page (D-L141, variant B only)
Romit chose concept D ("Concept D, make the level counts selection process better"). Replaces the statement layout above (D-L140) for variant B; variants A, C and D and Configure one skill are unchanged. Mockups: scratchpad `settings-fields/d-*.png`; Levels options `levels-opt-{a,b,c}.png` (built: c, refined).

```
Evaluation settings                                   [Preview] [Discard]* [Save changes]
+-- sheet (max 13rem + 40px + 34rem) ------------------------------+  +-- Your rule (17rem, sticky) --+
| How skills are judged   (o) Independence level  ( ) Approved...   |  | 2 unsaved changes*            |
|                         ( ) Questions           ( ) Score...      |  | Your rule                     |
|-------------------------------------------------------------------|  | A student achieves a skill    |
| Levels 3                Level names, highest first  Start from [v]|  | with 1 evaluation rated ...   |
|                         | Level              | Lowest that counts |  | ----------------------------- |
|                         :: [Works alone    ]  ( ) Counts        x |  | Applies to                    |
|                         :: [With assistance]  (o) Counts        x |  | 122 of 153 skills             |
|                         :: [Needs coaching ]  ( ) Does not count x|  +-------------------------------+
|                         + Add a level                             |   errors: "Fix 2 problems" and
|-------------------------------------------------------------------|   one link per problem
| Achieved when           Times needed     31 skills use their own n|
|                         [ 1] evaluation for each skill            |
|                         Who can sign off [x] Preceptor [x] ...    |
|-------------------------------------------------------------------|
| Steps before it counts  1 Student logs the skill           Always |
|                         2 Student rates themselves first   [o ]   |
|                         3 Evaluator signs off              Always |
|                         4 Approval before it counts        [o ]   |
|                         5 Counts toward achieved                  |
|-------------------------------------------------------------------|
| Forms                   What the student fills in (table in place)|
|                         Field name | Type | Required | x          |
|                         + Add a field                             |
|                         Feedback is required               [o ]   |
|                         Faculty can check off a group      [o ]   |
|                           Level given to each student [Works v]   |
+-------------------------------------------------------------------+
* only with unsaved changes.  375: one column, panel first (not sticky), Save in a full-width bottom bar.
```

- Model section per model: Levels (count) for independence; Outcomes for approved or not approved (two name fields as rows with one radio, Counts); Questions and what counts (count) for questions and for score on a scale: the list (no visible label: the section names it), then Scale (scored), then Counts when. A list longer than 8 shows 8 and "Show all n"; a problem in a hidden question opens the list.
- Levels: one list, highest first. Row: drag handle (pointer drag; focused, the arrow keys move the row), name field, a radio "Counts" or "Does not count" (the radio group "Lowest level that counts"), Remove. The counting rows share a tint. Start from: a select of starting sets; replacing named levels asks first.
- Steps: a plain ordered list (number, words, Always or a switch). Forms: the student's fields in place (name, type, Required, Remove; a choice list holds its choices as chips); feedback and group check-off switches, the check-off level or score only while it is on.
- From a 94rem page (1920 px) "What they will see" (the Preview panel, closable) is a third column, so the width is filled by what the settings produce (Proposed, D-L5, D-X30). Below that Preview is the header dialog.
- Rule panel: before a model, "Choose how skills are judged to start."; with a model and gaps, "To finish" and each gap as a link; after a failed Save, "Fix n problems" in the error tone; dirty, "n unsaved changes" above the rule. Each link focuses its field.
- A changed field carries a "Changed" badge beside its label.

Requirement places: SC-01/02 How skills are judged, nothing preselected; SC-03 Outcomes; SC-04 to SC-07 Questions and what counts; SC-08 Levels; SC-10 Times needed; SC-13 What the student fills in; SC-14 Feedback switch; SC-15 Steps switches; SC-16 Who can sign off; SC-17 the rule panel and the section order; SC-18 problems in the panel and beside each field, Save blocked; SC-19 Preview; AE-02 the impact dialog on save (frame, unchanged). Tasks S1 to S30 are updated: no row opens before a control is used.
Not on the page: purpose lines under the section names (D-L34, anatomy A8; the mockup had them), Edit-to-reveal rows, the side panel, the cut-off track, numbered circles and connector on the steps, the Student fields dialog (the fields are in place).

## Amendment 2026-11-11: Levels control, save bar, wording (D-L142, variant B; Proposed)
Amends the D-L141 layout above. Data model unchanged (one threshold, D-L95).

```
| Levels 3                Level names  highest first          Start from [v]  |
|                         +--------------------------------------------------+|
|                         | :: [Works alone      ]   v Counts             x  ||
|                         | :: [With assistance  ]   v Counts             x  ||
|                         | :: [Needs coaching   ]   Does not count       x  ||  <- bg-muted, muted text
|                         +--------------------------------------------------+|
|                         Add a level                                         |
|                         Lowest level that counts                            |
|                         [With assistance        v]                          |
|                         Works alone and with assistance count toward the    |
|                         skill. Needs coaching does not.                     |
| Achieved when           Times needed                                        |
|                         [ 1] evaluation for each skill                      |
|                         Applies to 147 skills. 31 use their own number and  |
|                         are not changed.        (link -> Library ?different=1&from=settings)
| Forms ...               Let faculty check off a group at once        [o ]   |
|                           A group check-off counts as [Works alone v]       |
|                           Faculty do not evaluate each student in a group   |
|                           check-off, so every student gets this level.      |
|                           ! This level does not count toward the skill.     |  <- amber, only below the cut-off
+-----------------------------------------------------------------------------+
| / 1 unsaved change                                  [Discard] [Save changes] |  <- sticky bottom of the content column
+-----------------------------------------------------------------------------+
```

- Levels: status is text, not a control; the select is the one control, with a visible label and a helper sentence generated from the levels (all count: "Every level counts."; one level: "{Name} counts toward the skill."). Before a cut-off is chosen, rows show no status and the select reads "Choose a level". At 375 the status drops under the name. Outcomes: same rows, select "Outcome that counts", helper "{A} counts toward the skill. {B} does not."
- Level errors use place words ("The top level", "The lowest level", "The second level from the top"); the rule panel lists them as "Levels: the second level from the top has no name."
- Model switch dialog: "Keep {current model}" and "Switch", one row from 640 px; stacked full width below.
- Times needed helper: shown once the program is saved; the second sentence only when some skills use their own number; the Library opened from it shows the chip "Number of times needed Own number" and the crumb "Evaluation settings > Library", whose first part returns to this page (also inside the walkthrough). A "came from" filter never reads `from=settings`.
- Save bar (`ProgramSettingsFrame saveBar`, variant B only; A, C and the embedded wizard step keep Save in the header): a labelled region, sticky at the bottom of the content column, last in the tab order. Saved setup with changes: pencil + "n unsaved change(s)", Discard (ghost), Save changes. First setup: "Not saved yet", Save settings. After a failed Save: "n to fix before saving" as a link that focuses the first problem. After saving the bar goes and the existing success banner says "Saved for n skills." The unsaved-changes guard is unchanged.
- Tests: `tests/lab/levels-cutoff.test.tsx`; task scripts S2, S6, S9, S20 updated (`chooseCut`, helper line, back crumb).

## Amendment 2026-11-11: one rule for number fields (D-L142; Proposed)
Every small number on Evaluation settings and Configure one or several skills uses one width (`NUMBER_WIDTH`, 5rem) and one line component (`configure/number-field.tsx` `NumberWithUnit`): gap-2 between the input and its words, the words muted 14 px (`TYPE.helper`) on every row, selected or not. A standalone field has its label above the control: Times needed ("[ 1 ] evaluation for each skill"), Scale ("1 to [ 6 ]"), minimums. A radio option that carries a number (Counts when for scores and for questions) is the one inline case: the option's label, then the same input and words, the inputs left-aligned in one column. Covered: `cfg-need` (Evaluation settings B, Configure one skill, Configure several), `cfg-scale`, `cfg-srule-value` (and its two siblings), `cfg-qrule-n`, level, setting and evaluator minimums (`RuleNumber`), the Evaluation settings times table. Not covered: the Library table's Times needed cell (a table cell, 56 px), the question range inputs inside "Only the questions you choose".

## Amendment 2026-11-11 (later): wording without "Counts", no sentence under the select (D-L142 item 7; Proposed)
Supersedes the Levels and Outcomes words in the first 2026-11-11 amendment.

```
|                         | :: [Works alone      ]   v Reaches it         x  |
|                         | :: [With assistance  ]   v Reaches it         x  |
|                         | :: [Needs coaching   ]   Below it             x  |   <- muted words, no row tint
|                         Level a student must reach                          |
|                         [With assistance        v]                          |   <- no sentence under it
```

- Lowest level chosen: no row shows a status; the select alone says it. Before a choice: no statuses, the select reads "Choose a level".
- Outcomes: "Outcome a student must get"; rows "Adds to times needed" / "Does not add" (muted). No sentence.
- Times needed line: "Of the {n} skills on these settings, {m} use their own number and are not changed." n is the rule panel's base (all minus Custom); m counts Default skills on their own number, and its link opens the Library with `different=1&config=default&from=settings`. With m = 0: "Applies to all {n} skills on these settings."
- Group check-off note (amber, below the cut-off only): "This level is below the level a student must reach, so a group check-off will not add to the times needed."

## Amendment 2026-11-11 (last): D-L74 checkboxes restored on B (D-L142 item 8)
Supersedes the select and the row statuses in the two earlier 2026-11-11 amendments.

```
|                         +--------------------------------------------------+|
|                         |                                  Accepted        ||
|                         | :: [Works alone      ]             [x]        x  ||
|                         | :: [With assistance  ]             [x]        x  ||
|                         | :: [Needs coaching   ]             [ ]        x  ||
|                         +--------------------------------------------------+|
|                         Add a level                                         |
```

- Each box: DS Checkbox, accessible name "Accept {level}". Linked via `withLevelTicked` (D-L74): check one, every level above is checked; clear one, every level below is cleared. One stored threshold (D-L95); all checked is "at any level". A linked change to other rows is announced in the live region.
- Nothing accepted: "Choose the levels you accept." inline and in the rule panel ("Levels: choose the levels you accept."); the link focuses the list.
- Outcomes: one radio per row under the same head, "Accept {outcome}", group "Accepted outcome". No select below either list, no sentence, no tint.
- Configure one skill (`settings-rows.tsx` `LevelList`): the box word reads "Accepted" and the box is named "Accept {level}"; nothing else changed.
- Group check-off note: "This level is not accepted, so a group check-off will not add to the times needed." Start from dialog: "The accepted levels are cleared." Move announcement: "{level} is now accepted" / "is no longer accepted".

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


## Amendment 2026-11-11 (column heads over the checkboxes; D-L142 item 10, Proposed)
Romit: "I can't tell what does the checkbox offer". The question above the list did not attach to the checkbox column. Replaces the visible question line of item 9.

```
|                                                     [Changed]   Start from [v] |
| +----------------------------------------------------------------------------+ |
| |     Level, highest first                    Moves student toward           | |
| |                                             achieving the skill            | |
| | :: [Works alone      ]                            [x]                  x   | |
| | :: [With assistance  ]                            [x]                  x   | |
| | :: [Needs coaching   ]                            [ ]                  x   | |
| +----------------------------------------------------------------------------+ |
```

- Column heads on the rows' own grid, muted 12 px, as the New list page's "Skill | Times needed" row: "Level, highest first" over the names, "Moves student toward achieving the skill" over the checkbox column (6rem below a 28rem list, 9rem from it; the head wraps to two or three lines). Outcomes: "Outcome" and the same head. The heads are `aria-hidden`; each control keeps its full name ("{level} moves a student toward achieving the skill").
- The question ("Which levels move a student toward achieving the skill?", "Which outcome moves...") stays as the group's accessible name, screen reader only. With it gone from view, Changed and Start from share one line at every width.
- Remove carries the DS Tooltip "Remove level" and the name "Remove level {name}"; the grip carries "Reorder level" and the name "Reorder level {name}".
- Configure one skill (`LevelList`): the same heads ("Level", the moves head); its card row is "Levels" again; the box sits in its own column at every width (it used to drop under the name in a narrow card). The Levels dialog (names only) has no heads.

## Amendment 2026-11-11 ("Your rule" as a path; D-L145, Proposed, Romit chose concept A)
Replaces the sentence panel. Built in `RulePanel` (`configure/settings-sheet.tsx`), data in `lib/lab/rule-path.ts`. Only Evaluation settings B renders it.

```
Beside the sheet (page 60rem and up)          Above the sheet (1024, 375)
+-------------------------------+             +------------------------------------------+
| Your rule             2 to fix|             | Your rule                                |
| (o) Student logs the skill    |             |  (o)----(o)----(o)----(o)----(o)          |
|  |                            |             |  Logs  Rates   Signs  2     Achieved     |
| (o) Rates themselves first    |             |        self    off    times              |
|  |                            |             | A student achieves a skill with 2 ...    |
| (o) Preceptor or clinical     |             | ---------------------------------------- |
|  |  faculty signs off         |             | [=] Applies to 166 of 178 skills         |
|  |  [/ With assistance or     |             |     12 skills on Custom keep their own   |
|  |     works alone]           |             +------------------------------------------+
| (o) Needed 2 times            |
|  |  == ==                     |
| (o) Skill achieved            |
| ----------------------------- |
| [=] Applies to 166 of 178     |
|     12 skills on Custom ...   |
+-------------------------------+
```

- An ordered list, one node per step: Student logs the skill; Rates themselves first (only with self rating on); {Who} signs off with a chip of what moves a student toward achieving the skill; An admin approves it (only with approval on); Needed {n} times ("Needed 1 time"); Skill achieved. Tally marks under the number up to 5, the number only above.
- Chip per model, from its own data: levels "With assistance or works alone", "Works alone", "Any level", "{Lowest} or above"; approved "Approved" (the outcome chosen); questions "All 5 questions answered Yes", "At least 4 of 5 answered Yes", "Questions 1 and 3 answered Yes"; score "Average 4 or more out of 5", "At least 3 on every question", "Total 12 or more out of 15".
- First run (no model): Student logs the skill, "Choose how skills are judged" (a link to the model cards), Who signs off, Times needed, Skill achieved; dashed nodes for what is not set. No "Applies to".
- Still filling in: a step with a gap has a dashed node and the gap as a link under it. After a failed Save: the node turns into an error glyph, the problem is a link that focuses its field, "n to fix" heads the panel, and the save bar keeps "n to fix before saving". Below 60rem the problems are one list under the row ("Times needed: enter 1 to 50.").
- End node: a neutral outline, never filled, so it never competes with Save. Panel: card surface with a hairline border, no brand tint.
- Applies to: "{n} of {total} skills" and "{n} skills on Custom keep their own settings", a link to the Library filtered to Custom (`config=edited`, back crumb Evaluation settings).
- Narrow: the five icons in a row with one or two words under each, the rule sentence as one muted line under the row. Screen readers get the full step text in both layouts.
- The levels tile example no longer skips a blank end ("Needs coaching to with assistance"): a blank lowest or top level reads "3 levels, 1 without a name" (`levelRangeExample`).

## Amendment 2026-11-11 (four follow-ups; D-L145 items 2 to 5, Proposed, approved by Romit)
1. Tally marks under "Needed n times" only for 2 to 5; "Needed 1 time" and 6 or more are words only (one mark read as a stray dash). `tallyFor` in `lib/lab/rule-path.ts`.
2. No "counts" in the Questions and Score on a scale models: the section title is "Questions" (was "Questions and what counts"); the answer rule's label is "Moves student toward achieving the skill when" (was "Counts when"), the Levels head plus "when" (`movesWhen` in `lib/lab/terms.ts`). The same label on the shared fields (`QuestionRuleField`, `ScoredRuleField` legends and group names), Configure one skill's rows, the problem prefix ("Moves student toward achieving the skill when: enter a value from 1 to 5.") and the model-switch list of what is cleared. It fits on one line at 1440 and 375.
3. Score on a scale with no scale: one problem, "Choose a scale first.", on the Scale select (`cfg-scale`); the value is not checked against a missing top, so "1 to NaN" never shows. Check summaries read "Scale: Not chosen".
4. Times needed helper: "27 of these skills use their own number and are not changed." (singular "1 of these skills uses its own number and is not changed."), the link on "27 of these skills use their own number" (Library, Different number, Default, back crumb). Hidden when none do. The rule panel's "Applies to 166 of 178 skills" is now the page's only 166 (anatomy A5 clear).
5. "Changed" always follows the visible name of what changed, gap-2, centred on the line, never alone (Romit: "looks inconsistent"). List sections (Levels, Outcomes, Questions) carry it on the section heading in the left column ("Levels 3 [Changed]"), at every width; the label line above the list holds only Start from, right-aligned. The model cards carry it on "How skills are judged" when the model changed (it showed nowhere before). Fields with a visible label (Times needed, Who can sign off, Scale, Moves student toward achieving the skill when, What the student fills in) and the switches (Student rates themselves first, Approval before it counts, Feedback is required, Let faculty check off a group at once) already put it right after their label; unchanged. `FieldBlock` drops the mark when its label is screen reader only. Start from is 12rem (levels) or 14rem (outcomes), so "AACN developmental" and "Approved / Not approved" show whole; no overflow at 375.

## Amendment 2026-11-11: the Apply dialog, concept A (D-L146, Proposed, Romit chose concept A)
The confirmation before Evaluation settings reach any skill [REQ IM-13, AE-02, SC-18]. One component for every layout: `ApplyDialog` (`components/lab/configure/program-parts.tsx`), reached from `useProgramSave` (variants A, B, C through `ProgramSettingsFrame`) and from `ScopeApplyDialog` (variants D, E, F through `ContextSettingsFrame`). Words and arithmetic: `lib/lab/apply-summary.ts` (pure, `tests/lab/apply-summary.test.ts`).

```
Apply to 139 skills?                                              [x]
+-[!]-------------------------------------------------------------+   amber callout, never red
| 123 students go from Achieved to In progress on some skills      |   one line per direction
| Their evaluations are kept. Each of these skills needs 1 more.   |   reason only when the number alone changed
| Show the 123 students                                            |   -> list in the callout, A to Z, "54 skills"
+-----------------------------------------------------------------+      on the right, scrolls after about 6 rows,
What changes                                                            search from 21 names, link reads Hide
 [pen] 139 skills on Default need 2 evaluations instead of 1          one line per part of the settings
What stays the same
 [#]   27 skills keep their own number
 [=]   12 skills on Custom keep their own settings
                                          [Cancel] [Apply to 139 skills]
```

- Each skill sits in exactly one group: the skills that change (the title's number), the skills that become not configured (amber lines under What changes) or one What stays the same line. They add up to the program's skills every time (unit tested for a number edit, a rename, a model switch, a mixed edit, a lab instructor only edit, a score model and a switch).
- Skills that keep their own number take any other change, so they are said inside the change line ("166 skills on Default show the level name Assisted instead of With assistance, including 27 that keep their own number") and not under What stays the same. On a number edit they are untouched and are a stays line.
- Several settings changed at once: one What changes line each, each with the skills it reaches ("166 ... level name ...", "139 ... need 2 evaluations instead of 1").
- Students: the headline names the count and the direction from the engine's own before and after (`progressChanges`, `programImpact`): "go from Achieved to {state}", "reach Achieved", "lose progress on the skills that become not configured", "see their progress change". Nobody moves: a neutral line with a check, "No student's progress changes". No skills at all: no callout, the one line "New skills take these settings when they are added."
- The callout's headline and reason are the dialog's description. Opening the list announces "123 students listed below, A to Z." Focus stays on the Show or Hide link. The list is a focusable scroll area; the dialog body scrolls inside the dialog when tall; no horizontal scroll at 375.
- Buttons unchanged: Cancel (outline) and "Apply to {n} skills" (verb and scope, Romit's choice; not "Apply change"). With no skills: "Apply settings".
- Data attributes for tests: `data-apply-change` (skills that change), `data-apply-total`, `data-apply-line`, `data-apply-part` (skills a partition line holds), `data-apply-students` ("moves" or "zero"), `data-apply-names`.

Old row to new line:

| Old row (before 2026-11-11) | New line | Group |
|---|---|---|
| Default: "{n} will change" / "{n} show the new names" | One line per changed part: "{n} skills on Default need 2 evaluations instead of 1", "... show the level name X instead of Y", "... are judged by X instead of Y", "... need {criterion} instead of {criterion}", "... can be signed off by X instead of Y", "... no longer ask the student to rate themselves first", and so on | What changes |
| Questions on this page: "{n} use them" | "{n} skills on Default use the questions on this page" | What changes |
| Own questions: "{n} keep their own" | Untouched: "{n} skills keep their own questions". Taking another change: "..., including {n} that keep their own questions" | What stays the same, or inside a What changes line |
| Already on these settings: "{n} already match" | "{n} skills on Default are already on these settings" | What stays the same |
| Custom: "{n} keep their settings and number" | "{n} skills on Custom keep their own settings" | What stays the same |
| Not configured: "{n} stay not configured" | "{n} skills stay not configured" (amber glyph) | What stays the same |
| Default with their own number: "{n} keep their number" | Number edit: "{n} skills keep their own number". Other edits: "..., including {n} that keep their own number" | What stays the same, or inside a What changes line |
| {reason}: "{n} become not configured" | "{n} skills become not configured because {reason in plain words}" (amber) | What changes |
| Level minimums: "Cleared on {n}" | "Level minimums are cleared on {n} skills" (amber) | What changes |
| Let faculty check off a group at once: "Turns off" / "Turns on" | "Group check-off turns off on {n} skills" (amber) / "Group check-off turns on for {n} skills" | What changes |
| Cleared: "{fields}" | "These settings are cleared: {fields}" (amber); "A group check-off counts as" is named "What a group check-off records" | What changes |
| Students whose progress changes: {n} [Show names] | The amber callout above the groups, with direction and per-student skills | First, above the groups |

## Amendment 2026-11-11: the Apply dialog as change cards (D-L147, Proposed, Romit chose V1 of three visual mockups)
Supersedes the callout, the two sentence groups and the in-callout names list of the D-L146 amendment. Arithmetic and words stay in `lib/lab/apply-summary.ts` (unit tested); the partition is unchanged (each skill in exactly one group).

```
Apply to 166 skills?                                              [x]
(o) 123  students  [Achieved] -> [In progress]  on some skills
    Their evaluations are kept.  Show the 123 students
-------------------------------------------------------------------
What changes
(=) Levels that move a student forward
    166 skills, including 27 that keep their own number
    [Any level] -> [With assistance or works alone]
(r) Times needed             139 skills                 [1] -> [2]
(v) Group check-off          166 skills          [On] -> [! Off]   amber
Not changed:  [Custom] 12 skills keep their own settings
-------------------------------------------------------------------
                                   [Cancel]  [Apply to 166 skills]
```

| Part | Rule |
|---|---|
| Students hero | 36px tile (`fa-users`): amber when anyone leaves Achieved or loses progress, neutral when students only gain or move without crossing Achieved. Figure (TYPE.figure), "students", the record states as DS StatusBadges with an arrow; one line per direction when there are several. "Their evaluations are kept." and the reason, then the link "Show the n students". Nobody moves: neutral tile with a check, "No student's progress changes". The dialog description (`aria-describedby`) is the hero's sentence(s), sr-only; the drawn hero is `aria-hidden`. |
| Change row | One per changed setting: 36px tile with the setting's icon (the "Your rule" path's own: stairs, repeat, signature, stamp, star-half, user-pen; check-off `fa-check-double`, never the hero's `fa-users`), name, scope (skills it reaches, own-number clause on the scope), before (DS Badge secondary) -> after (DS Badge outline). A row that takes something away (check-off off, minimums or settings cleared) has an amber tile and an amber DS StatusBadge with a glyph as its after value; skills that become not configured read [Default] -> [Not configured] with the reason as the scope. Values longer than 30 characters sit under the name. Each row's sentence is its sr-only text. |
| Names | "Levels that move a student forward" / "Outcome that moves a student forward" / "What moves a student forward"; never counts, Accepted or items. |
| Not changed | One line: "Not changed:" then each stays group, with the Library's Custom or Not configured badge where it has one. |
| Names view | "Show the n students" swaps the body: "Back to the summary", the hero line as an h3 that takes focus, search above 20 names, A to Z with skills per student. Back returns focus to the link. The footer stays. |
| Phone | Amber rows come first (CSS order below 640px), the body scrolls between the title and the footer so Not changed is reachable; footer stacks with the primary on top (DS). |
| Width | 36rem from 640px. |
| Data attributes | `data-apply-dialog`, `data-apply-change`, `data-apply-total`, `data-apply-view` (summary, names), `data-apply-students` (moves, zero), `data-apply-loss`, `data-apply-group` (apply-changes, apply-stays), `data-apply-line`, `data-apply-part`, `data-attention`, `data-apply-names` (the names body). |

## Amendment 2026-11-12: change cards r1 (D-L147 items r1 to r4, Proposed, approved by Romit)
| Fix | Rule |
|---|---|
| r1 Phone fit | At 375 x 812 the mixed state (three changed rows) shows Not changed without scrolling (measured: Not changed ends at 663 px, footer starts at 683 px). Chip pairs up to 12 characters ("1 -> 2", "On -> Off") sit beside the row name at every width, 13 to 30 from 640 px, longer under the name. The footer buttons sit side by side at every width (equal halves on a phone). The dialog may use the viewport less 1rem on a phone. |
| r2 Direction | The hero always states a direction. A move that crosses no state word reads by its evaluations: "15 students stay [Achieved] on some skills, with more evaluations moving them forward" (neutral), or "with fewer" (amber). A state move with no single state reads "move forward" or "move back"; only a genuine mix reads "see their progress change". Engine: `ProgressChange` carries `haveFrom` and `haveTo`, `StudentImpact` carries `forward` and `back`, `ProgramImpact` carries `otherStays`. |
| r3 Own number | A row says only the skills it reaches. The own-number fact is said once: on the Times needed row ("139 skills, not the 27 with their own number") when Times needed changed and those skills take other changes, or on the Not changed line when they take nothing. Own questions likewise, on the Questions row. A levels row never mentions the number. |
| r4 Focus | Focus starts on Cancel (`onOpenAutoFocus`). Back from the names view returns focus to "Show the n students"; Escape closes and returns focus to where it was (Save). |

## Amendment 2026-11-12 (later): the Apply dialog as C2 "hero figure" (D-L148, Proposed, Romit chose C2 of three rendered concepts)

Supersedes the change-cards layout (D-L147); its words for students, the partition, the button and r1 (own number said once, focus on Cancel, Escape returns focus, names A to Z with search above 20) stand.

| Part | Rule |
|---|---|
| Students move | DS Card hero: people icon, "{n} students" in `TYPE.hero` (30 / 36), one line per direction (its own count when two or more), "Their evaluations are kept." (plus "Each of these skills needs n more." when only the number changed), "See who". Amber (`--status-badge-warning-*`) when anyone loses progress, `bg-muted` otherwise. A stay reads "stay [Achieved] on some skills" with "More evaluations now move them forward." on its own line. |
| Accessible name | The header is `sr-only` while the hero shows: title = the hero sentence(s), description = the reason. Hero visuals are `aria-hidden`; See who keeps `aria-expanded` and `aria-controls="apply-names"`. |
| Names | Inside the hero card, A to Z, each with its skill count; search above 20 names; the table hides while names show; "Hide names" closes them and keeps focus on the toggle. |
| Nobody moves | Visible title = `actionTitle` (Turn on/off ..., Change ..., Rename ..., Reorder the levels?, Clear ..., Apply n changes?); description "No student's progress changes." with a check. One brief change (both values together 16 characters or fewer, no configuration badge) is `ApplyFigure`: the setting's icon and "before -> after" in `TYPE.hero`. Otherwise `ApplyTable`. |
| Table | Setting / Now / After from 640 px; under it, name then "before -> after". One note per row (own number on Times needed; reason on a not configured row). Not configured rows show the Library badges and come first on a phone. Each row keeps its full sentence as `sr-only` text and `data-apply-line`, `data-apply-part`. |
| Not changed | One `TYPE.meta` footnote of sentences ("12 skills on Custom keep their own settings."), each with `data-apply-line` and `data-apply-part`. |
| Colour | Amber only when students lose progress. Group check-off off, cleared settings and cleared minimums are neutral. |
| Number | The scope number appears once, on the button ("Apply to 166 skills"). |

## Amendment 2026-11-12 (H1): the Apply dialog hero as a "figure card" (D-L149, Proposed, Romit chose H1 of three rendered treatments)

Replaces the C2 hero card (D-L148). The partition, the table, the footnote's sentences, `actionTitle`, `TYPE.hero`, the button and r1 behaviours stand.

| Part | Rule |
|---|---|
| Title | Visible in every state: `actionTitle` ("Apply 3 changes?", "Change the levels that move a student forward?", "Turn off group check-off?"); first save keeps "Apply to n skills?". This is the dialog's accessible name. |
| Description | Students move: the hero sentence(s) and "No evaluation is deleted." (`sr-only`; the card shows the same). Nobody moves with a figure: "No student's progress changes." (`sr-only`; the card shows it). Nobody moves with a table: shown under the title with a check. |
| Students card | Neutral DS Card, no icon. "{n} students" in `TYPE.hero`, amber (`--status-badge-warning-fg`) only when students leave a state. One line per direction; with two or more, each line starts with its own count. A losing line starts with an amber down arrow. Separator, then "See who" (DS Button `variant="link"`, `aria-expanded`, `aria-controls="apply-names"`, min 24 px, 44 px under 640 px). |
| Stay | One line: "stay [Achieved] on fewer evaluations" or "on more evaluations"; neutral either way. |
| Names | Inside the card under See who: search above 20 names, A to Z, skills per student (muted), scrolling list (max 14rem), inset focus ring; "Hide names" closes them and keeps focus on the toggle; the table hides while names show. |
| Nobody moves, one brief change | The same card: "before -> after" at `TYPE.hero`, the setting's name, separator, a check and "No student's progress changes". |
| Footnote | Not changed sentences, then "No evaluation is deleted." when students move (said once). |
| Wrapping | The badge pair never splits at the arrow; phrases of 24 characters or fewer wrap as one unit; longer phrases wrap normally. |

Principles check (short; full table in the work report):

| Principle | Decision it drove |
|---|---|
| Jakob's law, Nielsen consistency | Visible action title in every state, so the top of the dialog is never an empty band |
| Von Restorff (won over Fitts) | See who has no fill; the figure is the one thing that stands out; the target still meets 24 px (44 px on a phone) |
| Gestalt proximity (won over right-aligned counts) | Each direction line starts with its own count; no orphan "On some skills." line |
| Nielsen minimalism | "No evaluation is deleted." once, in the footnote; the needs-n-more sentence removed (the table says it) |
| Pragnanz, hierarchy | Stay case on one line; no "=" glyph; no people icon |
| Colour rule, WCAG 1.4.1 | Amber only when a student leaves a state, always with a down arrow and the state badges |
| WCAG 4.1.2, 2.5.8, 1.4.10 | Name = title, description = card sentence; targets measured; reflow units at 320 |


## Amendment 2026-11-16 (G): Evaluation settings as named evaluation methods (Proposed, D-EM1116)

Romit, 2026-11-16: "can you update evaluation settings based on the prototype understanding of evaluation methods that he has created? We are not copying exactly, but i need you to understand the context, before you design this screen. Ensure that its not crowded, but easier for the user to navigate and work on the screen." Source idea: `docs/knowledge/prototype-2026-11-16.md` F6 and (h). Variant G, set as the walkthrough's Evaluation settings step; variant B (D-L141) stays reachable as a lab variant for comparison.

**Job.** The admin sees how the program judges its skills as a short list of named methods, opens one, changes it, saves, and comes back. One method open at a time; nothing else competes.

**Requirements this screen must satisfy (quoted from REQ).**

| ID | Text (short) | Where in G |
|---|---|---|
| 4.1 | "Four models are required initially ... allow further models" | Type tiles on the method page (four); methods are named instances, more can be added |
| SC-01 | "Creating a skill and configuring how it is evaluated are separate actions" | Methods are configured here, apart from creating skills |
| SC-02 | "exactly one model ... chosen explicitly; no default is assumed" | A new program lists no method; a new method has no type selected; nothing preselected |
| SC-03 | Binary: both labels program-defined, which qualifies explicit, both required, differ | Approved or not: Outcomes field (existing `OutcomesField`) |
| SC-04, SC-05, SC-06 | Question set maintained; all / at least N of M / named subset; satisfiable | Questions: `QuestionsField` + `QuestionCountsWhen` (the question-level model; the prototype's Checklist is its nearest equivalent) |
| SC-07 | Scored: scale, average / minimum each / total | `ScaleField` + `ScoredCountsWhen` |
| SC-08 | Demonstration: levels program-defined, ordered | `LevelsField` |
| SC-13 | Student-supplied fields, label, type, mandatory | "What the student fills in", behind a disclosure on the method page |
| SC-14 | Feedback capturable; mandatory decided | "Feedback is required" switch |
| SC-15 | Self-evaluation first; admin approval | Steps before it counts (two switches) |
| SC-16 | Evaluator roles per skill | Not on this page since Romit's 2026-11-16 removal of "Achieved when"; carried as every role on a new program [INFER, open]; still editable on Configure one skill |
| SC-17 | Dependency apparent | "Moves a student forward" column in the table, and the method page order type, then what counts |
| SC-18 | Unsatisfiable not savable | Save with problems: count in the save bar, first field focused, messages under fields |
| SC-19 | Review everything before use | Preview dialog on the method page |
| AE-04 | Four states | No state words on this page; nothing says Not Started or Not Met |

**Layout.**
```
List view (1440)                                            Method page (1440)
┌ ← Evaluation settings                 [New method] ┐      ┌ ← Independence levels          [Preview] [Rename] ┐
│ Method               Type          Moves forward  │      │ How skills are judged   ( 2 x 2 type tiles )      │
│ Independence levels  Independence  With ass...    │      │ Levels 3                (list, lowest that counts) │ ┌ Used by ─────────┐
│   New skills (badge)                 166 skills ⋯ │      │ ─────────────────────────────────────────────────  │ │ 166 skills  link │
│ Approved or not      Approved      Met     2   ⋯  │      │ Steps before it counts  (self rating, approval)    │ └──────────────────┘
│ ...                                               │      │ Forms  feedback, group check-off, ▸ student fields │
└───────────────────────────────────────────────────┘      └ [n unsaved changes]           [Discard] [Save]   ┘
```
- One filled primary per view: New method on the list; Save on the method page (the save bar, only with something to save).
- The way back is the icon before the title (Romit 2026-11-16 "Back to Skills list, should be an icon besides the title").
- No sticky rule panel and no wide preview column (the crowding Romit named); Preview is a dialog.

**Data (Proposed minimum).** `V2State.methodEdits` (lab overlay): `{ programName?, methods: [{ id, name, rule, skillIds }] }`. The program's saved rule stays the method new skills and Default skills use; its save is the existing first-save / Apply flow. Other methods are written to their skills as their own (Custom) settings, each keeping its own Times needed. With no overlay, methods are read from the seed: the program rule, plus one per distinct Custom rule.

**States.** Loading (skeleton), new program (empty: "No evaluation methods yet." + New method), method not found (message + back), validation (save bar count, messages, focus), delete blocked (in use or the program's method: reason in the menu), delete confirm, rename errors (empty, duplicate), unsaved guard on every link.

**Acceptance.** Create, rename, delete a method; save with an error focuses the field; back icon with unsaved work asks first; 1440 and 375 without page scroll sideways.


## Amendment 2026-11-16 (G, later): a clean method page, program-wide details, vocabulary descriptions (Proposed, D-EM1116-b, -c, -d)

Romit, 2026-11-16: "inside every evalution settings per evaluation method, we need to make the ui clean where wwe don't add extra sub titles, or bold unnecessary. I want you to conciously use ui and ux principles." He also approved two moves toward the 16 Nov prototype: program-wide details (F6) and Description on Categories and Tags.

**D-EM1116-b, the method page.** Principles and what each changes:

| Principle | Before | After |
|---|---|---|
| One emphasis per region (hierarchy) | Bold section titles in a 13rem left column; bold "Used by"; bold switch labels | Only the page title is bold. Field and switch labels are plain body text; groups are separated by a hairline and 32 px, not by headings |
| Proximity and alignment instead of headings | "How skills are judged", "Levels 3", "Steps before it counts", "Forms" | No visible section headings. Each group keeps a programmatic name (`role="group"` + `aria-label`, or the radiogroup's name) |
| Progressive disclosure, Hick | Four type tiles always shown, each with a subtitle | Saved method: one line "Independence level · Change"; Change opens the tiles (name only). New method: the tiles show until a type is chosen. Changing type keeps the existing switch dialog [REQ SC-09] |
| Helper only when it changes what the user does | A helper under every step and switch | No helper under steps or switches. Kept: the group check-off note when the level does not move a student forward, and errors |
| Shorter column heads | "Level, highest first" / "Moves student toward achieving the skill" | "Level" / "Moves forward"; each checkbox keeps its full name ("{level} moves a student toward achieving the skill"); the list keeps "Levels, highest first" as its accessible name |
| Fewer controls | "Start from" select on every list | Shown only while the method is not saved yet, after Add a level (presets stay, CALL 10-26) |
| Occam (fixed steps carry no decision) | Numbered steps with "Always" rows | One group of four switches in evaluation order: Student rates themselves first; An admin approves before it counts; Feedback is required; Let faculty check off a group at once [REQ SC-14, SC-15] |
| Used by | Side block with a bold heading and a name list | Meta line under the title: "Used by 166 skills" (a link); another method's skill names open from that count in a popover |
| 8 pt rhythm, DS type scale only | Mixed gaps | `gap-2` inside a field, `gap-4` between fields, `gap-8` between groups; every size from `TYPE` |

```
Method page (1440)
┌ ← Supervised levels                                   [Preview] [⋯] ┐
│ Independence level · Change      Used by 166 skills                  │
│ ──────────────────────────────────────────────────────────────────── │
│ Level                                  Moves forward                 │
│ ⠿ [Works alone          ]                   ☑            ×           │
│ ⠿ [With assistance      ]                   ☑            ×           │
│ ⠿ [Needs coaching       ]                   ☐            ×           │
│ Add a level                                                           │
│ ──────────────────────────────────────────────────────────────────── │
│ Student rates themselves first                              (o )     │
│ An admin approves before it counts                          ( o)     │
│ Feedback is required                                        ( o)     │
│ Let faculty check off a group at once                       (o )     │
└ [n unsaved changes]                               [Discard] [Save]   ┘
```

Seed method names (Proposed, one honest short name each, derived from the rule): Supervised levels (the program's levels method), Approved, with review; Questions, self-rated; Levels, self-rated, reviewed; Levels, self-rated; then the pass words only when two would collide.

**D-EM1116-c, program-wide details.** The list page gets two tabs, Methods and Details (the calmer option: one table and one filled action per view; a section below would put two primaries and two tables in one viewport). Details: one DataTable, Detail | Type | Required | menu; "Filled in by" shows only when it differs between rows. Built-in rows are locked and carry a "Built in" badge: Date performed, Graded or practice, On a patient or simulated, Clinical site. Program rows: Add detail (dialog: Name, Type, Filled in by, Required), Edit, Move up, Move down, Stop collecting (past values kept; Resume), Delete (only when never used; otherwise the menu says why). The per-method "What the student fills in" section leaves the method page; the method's stored `studentFields` are not edited from G and still feed the existing forms until the engine reads the program table [INFER, flagged]. Graded or practice is listed as a collected detail only: whether practice ever counts is new behaviour for Sankalp, not decided here.

| ID | Text (short) | Where |
|---|---|---|
| SC-13 | Student-supplied fields: label, type, mandatory | Details tab (program-wide), every row: name, type, Required |
| SC-14 | Feedback capturable; mandatory decided | Method page switch "Feedback is required" |
| SC-15 | Self-evaluation first; admin approval | Method page switches |
| SC-09 | Changing the model rebuilds what depends on it | "Change" opens the tiles; a switch that loses data asks first (existing dialog) |

**D-EM1116-d, Categories and Tags.** Both tabs on `/admin/lists` get a Description column (one line, truncated with the full text on hover; an empty cell reads "Add a description" as a link that opens the edit dialog). Descriptions are optional, stored on the vocabulary entry. "Where each tag reaches" (prototype 27) is not built: the Tags table already shows Categories per tag, and listing every skill per tag does not hold at 150+ skills; proposed to Romit as a popover on the Categories count instead.

**States.** Details: loading (skeleton), empty program rows (built-ins still show, so the table is never empty), add/edit validation (name required, unique, 60 characters), delete blocked (reason in the menu), delete confirm, stopped rows (badge "Stopped", Resume). Method page: as before, plus the type line's Change toggle (`aria-expanded`).

**Acceptance.** Method page has no visible heading but the title, no helper under a switch, and every control keeps an accessible name; tiles keep the radiogroup name "How skills are judged"; Details add, move, stop, delete; Description shows on both vocabulary tabs; 1440 and 375 without sideways scroll.

**Same day, Sankalp [CALL 11-16] via the coordinator.** (1) "Who can sign off" is part of the method again, first in the "How evaluations happen" group, never carried silently [REQ SC-16]; (2) New method dialog asks Type first (four choices, none preselected [REQ SC-02]), then Name, and the page opens with that type; (3) zero state is one line and New method; (4) Times needed stays per skill on the list. Seed top level "Independent" not applied: it moves the seed fingerprint (data owner's SEED_VERSION).

**Round 2, same day (Romit: "this page for every evaluation method doesn't have a simple layout, and looks complicated", relayed by the coordinator).** One 40rem column, left-aligned under the title (also the 96rem preview grid's first column). Two quiet groups, each with one plain heading in muted body size (not bold): the type's list ("Levels", "Outcomes", "Questions") and "How evaluations happen"; whitespace between groups (40 px), no dividers. Levels and Outcomes in G are a light list: no outer border or row rules, the name input 20rem, the "Moves forward" box right beside it, ghost Remove, ghost Add a level; the name column has no head (the group heading says it). The type line is muted. Switch rows 32 px min height. Applies to all four types and to a new method. "Counts" as the column head was not used: Romit rejected "Counts" on 2026-11-11 (D-L142 item 7).

## Amendment 2026-11-16 (G, round 4): the method editor, designed from the job (Proposed, D-EM1116-e)

Romit, 2026-11-16, on the dialog that followed the prototype closely: "see editing an evaluation method, you just copy pasted instead of using any ui, ux principle or best practices." Earlier the same day: "make the ui clean where we don't add extra sub titles, or bold unnecessary. I want you to conciously use ui and ux principles." The prototype says what the screen must do; it is not the layout. This amendment replaces the editor of the "later" amendment above (the list, the Details tab, the data model and the deep link stay).

**Job [CALL 11-16].** 95 to 98 percent of programs use one method for every skill. So a method is created once or twice, opened mostly to check how it works, and edited rarely: a level or question renamed or reordered, which answers move a student forward, who can evaluate, self-evaluation, comment, approval, group check-off. Changing the type is the rarest edit and the only one that rebuilds the method [REQ SC-09].

**Diagnosis (principle, problem in the prototype and in our copy, fix).**

| Principle | Problem | Fix |
|---|---|---|
| Task frequency sets prominence | Four type tiles with descriptions take the top third of the edit view; the type is the rarest edit | Edit shows the type as one fact line under the title; "Change type" is a quiet control at the end of that line |
| Hick's law | Editing a level meant scanning four tiles, a list, a card of seven controls and three footer buttons | Edit shows only what this type needs: one list, two short groups, one primary |
| Error prevention | The destructive choice (type) is one stray click away, same size as everything else | Behind "Change type"; a switch that removes levels or questions asks first (SC-09 dialog, kept); Save names the students whose progress changes (AE-02, kept) |
| Progressive disclosure | New method shows every setting, most disabled, before the one decision that shapes them | New shows Name and the four types only; the rest appears once a type is chosen. Description is behind "Add a description", as in the New skill list dialog |
| Recognition over recall | Type names alone do not say what the evaluator sees | In New (and when changing type) each tile carries one line; in Edit the list itself shows it |
| Gestalt proximity | Description sat under the list, far from Name; "Moves forward" head floated over a boxed table | Name and description together; the list's label and its column head share one line, directly over the rows |
| Common region, said once | A card inside a dialog, with a card title over a field label ("How evaluations happen" over "Who can evaluate") | No card: one hairline between two columns. Each group has one label |
| Affordance and consistency | Roles were chips (read as filters or tags) beside checkboxes for the same kind of on or off choice; the page before used switches | Checkboxes for every on or off choice. A dialog that saves on a button uses checkboxes; switches are for settings that apply at once |
| One primary, Fitts's law | Preview, Cancel and Save sat as three equal neighbours; the error count sat at the far left, away from the button just pressed | Preview alone at the footer's start; Cancel and Save at the end; "n to fix" beside them |
| F pattern | Eye path: name, 2 x 2 tiles, list, back up to the right card | Top to bottom on the left (name, what the evaluator picks), then the right column once (who, what each evaluation needs) |
| Consistency | Title repeated the name above a Name field ("Edit Supervised levels", "Supervised levels") | Title "Edit method" or "New method"; the name is said once, in its field |
| Calm (Romit) | Bordered rows inside a bordered table inside a dialog; amber "Changed" on every touched control | Rows without rules or frame; "Changed" only on the type, the one change that rebuilds |

**Three concepts.**

```
A  Summary first                      B  Focused editor (chosen)             C  Guided create, tabbed edit
┌ Supervised levels            x ┐    ┌ Edit method                    x ┐    ┌ New method      1 Type 2 Answers 3 Steps ┐
│ Independence level · 166 skills │    │ Independence level · Used by 166 │    │  ( four types, one line each )           │
│ Levels                    Edit │    │ skills                Change type │    │                          [Back] [Next]   │
│  Works alone       moves fwd   │    ├──────────────────────┬───────────┤    └──────────────────────────────────────────┘
│  With assistance   moves fwd   │    │ Name [............]  │ Who can   │    ┌ Supervised levels                      x ┐
│  Needs coaching    no          │    │ Add a description    │ evaluate  │    │ [Answers] [Evaluation] [Used by 166]     │
│ Who can evaluate          Edit │    │ Levels   Moves fwd   │ [x] ...   │    │  Levels ...                               │
│  Preceptor, clinical faculty   │    │ :: [Works alone] [x] │ Each eval │    │                                           │
│ Each evaluation needs     Edit │    │ :: [With assist] [x] │ needs     │    │                        [Cancel] [Save]   │
│  Self-evaluation first         │    │ Add a level          │ [x] ...   │    └──────────────────────────────────────────┘
│                        [Close] │    │ Preview     [Cancel] [Save method]│
└────────────────────────────────┘    └──────────────────────┴───────────┘
```

| Concept | Mental model | Good | Cost | Question it tests |
|---|---|---|---|---|
| A Summary first | A spec sheet; Edit per section | Matches "open to check"; nothing changes by accident | Every field is drawn twice (read and edit); three save points; a click before the commonest edit; the list already is the summary | Do admins want a read mode? |
| B Focused editor | One surface; the type is a fact, not a choice | Every value is visible and editable in place; one Save; the same surface for New once a type is chosen; fewest controls | A stray edit is possible (answered by Save staying off until something changes, the discard question and the save confirm) | Is hiding the type choice enough to make edit feel simple? |
| C Guided create, tabbed edit | A wizard to create, tabs to edit | One decision per step | Three steps for six fields, done once per program; tabs hide half the method from the "check how it works" job (recall); most chrome | Does create need hand-holding? |

**Choice: B**, with A's good part kept where it is free (the list's columns answer "how does it work" without opening) and C's good part kept without its chrome (New is staged: type first, then the editor). Reasons: frequency sets prominence (the commonest edits are one click from the list), Hick (fewest choices on screen), recognition (values in place), one primary, and one learned surface for New and Edit (Jakob, consistency).

**Layout (dialog, `sm:max-w-5xl`; full screen under 640 px).**

```
Edit, 1440                                                         New, before a type is chosen
┌───────────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────────────────────┐
│ Edit method                                                 x │  │ New method                                         x │
│ Independence level · Used by 166 skills · Change type         │  ├──────────────────────────────────────────────────────┤
├───────────────────────────────────────┬───────────────────────┤  │ Name                                                 │
│ Name                                  │ Who can evaluate      │  │ [For example, Supervised levels ]                    │
│ [Supervised levels              ]     │ [x] Preceptor         │  │ Add a description                                    │
│ Add a description                     │ [x] Clinical faculty  │  │ Type                                                 │
│                                       │ [ ] Lab instructor    │  │ ( ) Independence  ( ) Approved or  ( ) Questions ( ) │
│ Levels highest first    Moves forward │                       │  │     level             not approved               Score│
│ :: [Works alone        ]     [x]    x │ Each evaluation needs │  │     one line          one line       one line    ...  │
│ :: [With assistance    ]     [x]    x │ [x] Student self-eval │  ├──────────────────────────────────────────────────────┤
│ :: [Needs coaching     ]     [ ]    x │ [ ] Evaluator comment │  │                         [Cancel] [Create method]     │
│ Add a level                           │ [ ] Admin approval    │  └──────────────────────────────────────────────────────┘
│                                       │                       │  After a type is chosen the two columns appear under the
│                                       │ [x] Let faculty check │  tiles (the tiles stay: creating is choosing, and a radio
│                                       │     off a group ...   │  group must not vanish under an arrow key).
├───────────────────────────────────────┴───────────────────────┤
│ Preview                      2 to fix   [Cancel] [Save method] │  375: one column in the same order; footer fixed.
└───────────────────────────────────────────────────────────────┘
```

- Type weight: only the dialog title is semibold. Labels are the DS label weight; nothing else is bold.
- Left column per type: Independence level, the levels (highest first; checking a level checks those above it); Approved or not approved, the two outcomes with one radio; Questions, the questions then "Moves forward when"; Score on a scale, the questions, the scale, then "Moves forward when". Order follows the dependency [REQ SC-17].
- Long and short labels: the name inputs take the column's width, the group check-off select grows to its longest level up to the column, table cells wrap. Checked with "Independent" and "Performed with assistance".
- Change type (Edit): opens the four tiles above the columns (`aria-expanded`); choosing one that would remove levels or questions asks first; the type line then reads the new type with "Changed". Nothing is written until Save.
- List: Method (name; the description under it only when the admin wrote one), Type (plain text, no badge: it is not a state), Moves forward when, Each evaluation needs, Skills (a link), row menu. One emphasis per row: the name.
- Kept: `?method=<id|new>` pushed on open so Back closes; Cancel, Escape, the close button and a click outside ask "Discard your changes?" when there is unsaved work; Save with problems focuses the first field and says "n to fix"; the save confirm names students [REQ AE-02]; nothing preselected in New [REQ SC-02].

**Requirements (every state of the editor carries the same list).**

| ID | REQ text (short) | Where |
|---|---|---|
| 4.1 | "Four models are required initially" | Four type tiles: New, and Edit behind Change type |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | New: no tile selected, no roles checked; Create without a type is refused with a message |
| SC-03 | "both outcome labels are program-defined ... Which of the two qualifies must be recorded explicitly" | Outcomes list: two inputs, one radio each |
| SC-04, SC-05, SC-06 | "the program defines and maintains the question set"; all, at least N of M, named subset; satisfiable | Questions list; Moves forward when |
| SC-07 | "the response scale is program-configured ... average, minimum on every question, or a total" | Scale; Moves forward when |
| SC-08 | "levels of supervision are program-defined and ordered" | Levels list: rename, reorder, add, remove |
| SC-09 | "Changing the model must rebuild the criteria" | Change type, with the switch question |
| SC-14 | "feedback ... the program decides per skill whether it is mandatory" | "Evaluator comment" |
| SC-15 | "student self-evaluates ... administrator must approve" | "Student self-evaluation first", "Admin approval before it counts" |
| SC-16 | "which evaluator roles may sign off" | Who can evaluate |
| SC-17 | "The dependency ... must be apparent" | Type line, then the list, then what moves forward; the list page column |
| SC-18 | "A configuration that cannot be satisfied must not be savable" | Save refused, "n to fix", messages under fields |
| SC-19 | "review everything it will ask of the student and the evaluator" | Preview |
| AE-02 | "a change to the rule re-applies to evidence already held" | Save confirm names the students whose progress changes |
| SC-13 | Student-supplied fields | Details tab (unchanged, D-EM1116-c) |

**Not on the editor, on purpose.** Times needed (per skill on the list [CALL 11-16]); the details collected (Details tab); a read-only summary mode; per-field "Changed" marks; helper lines under checkboxes; the "Used by" sentence about what Save will show (said once, by the confirm).

**Acceptance.** Edit opens with no type tiles and no card; one semibold element (the title); Tab order follows the reading order; at 1440 the levels and approved methods fit without scrolling; at 375 nothing scrolls sideways; New shows no setting but Name and Type until a type is chosen; axe clean at 1440 and 375.

**Round 4, what was walked and what was not (2026-11-16).** Walked in a headless browser at 1440 and 375: new method (nothing chosen, type error, type chosen, name and rule errors, saved), edit of all four types by deep link, save through the confirm on a method in use, change type with the switch question (Keep and Switch), duplicate name, a problem in a question past the first eight, a link to a method that no longer exists, the leave guard. At 1440 only: Preview over unsaved changes, the guard by outside press and close button, Back. Not walked this round: the program's method saved through the Apply dialog, and a program method named but never saved (a new program). No unit test covers the editor. A hydration warning shows on some loads; it also shows on Course mapping, which this round did not touch.

## Amendment 2026-11-16 (round 5 variants): three editors that are not a popup, H, I and J (Proposed, D-EM1116-f)

Romit, 2026-11-16, on G's dialog editor: "is this the best ui you got, where you are showing a popup? you don't have any other alternatives/variants?" Standing from the same day: the method page "looks complicated", "better ui" than the prototype without copying it, "conciously use ui and ux principles", no extra subtitles, no unnecessary bold. G is unchanged and stays "recommended" until Romit chooses. H, I and J are lab variants of the same screen with the same data (`lib/lab/methods.ts`, `lib/lab/details.ts`) and the same fields (`components/lab/configure/*`); what differs is the mental model of opening and changing a method.

**Job [CALL 11-16], unchanged from round 4.** One method serves 95 to 98 percent of programs. A method is opened mostly to check how it works; sometimes one thing changes (level names, what moves forward, who evaluates, self-evaluation, comment, approval, group check-off). A type change is rare and rebuilds the method [REQ SC-09].

**Why not a popup (what G costs).** A dialog covers the list it came from, caps the width at 64rem whatever the screen, cannot show what the settings produce without a second dialog on top (Preview), and puts a discard question over a dialog over a page. It is the right tool for a decision, less so for a record with a URL (playbook 3.5: "route for anything with a URL").

**References looked at (Mobbin, web).** Stripe "Customize your page" (settings column left, the live page right; teaches: the preview is the proof, the settings stay short; not copied: Edit links that open further panels) https://mobbin.com/screens/dc59eb23-8342-468a-92c7-db04999541d2 · incident.io "Create custom field" (fields left, a small Preview right, Cancel and Save in a footer; teaches: the preview can be small when it is literal) https://mobbin.com/screens/2f0a19d1-ffdc-4f31-b79f-9341aac268de · Sprig study settings (preview pane that can be closed; not copied: a floating preview over content) https://mobbin.com/screens/398d4fdf-1c46-442d-8ff0-1078a8c47916 · Canva "Your account" and Spellbook profile (label, value, Edit per row; teaches: a read row costs one line; not copied: a button per row at full weight) https://mobbin.com/screens/ca3a7736-f836-4395-84cf-0c3449c65a09 https://mobbin.com/screens/6e336587-d69a-4b5a-a66f-d63a0da408e0 · Replit settings (list of sections left, the chosen one right) https://mobbin.com/screens/d21f986c-cfeb-4f32-b59c-2d202647bb4e. No close reference was found for a master-detail of fewer than ten reusable records; the nearest everyday model is a mail client. Outside software: H is a tailor's mirror (change the cloth, see the fit), I is a ring binder with tabs down the side, J is a printed specification sheet with pencil corrections.

**H. Live preview editor.**

```
List (?variant=H)                                    Method page (?variant=H&method=m-program), 1440
┌ <- Evaluation settings          [New method] ┐     ┌ <- Supervised levels                                             ┐
│ Methods 6 | Details 4                        │     │ Independence level · Used by 166 skills · Change type            │
│ Method      Type     Moves fwd  Needs  Skills│     ├───────────────────────────────────────┬──────────────────────────┤
│ Supervised  Indep.   Any level  Self   166 … │     │ Name [Supervised levels            ]  │ (Evaluator | Student)    │
│ Approved…   Approved Met        Admin    2 … │     │ Add a description                     │ Example: IV insertion v  │
└──────────────────────────────────────────────┘     │ Levels highest first    Moves forward │ ┌ evaluator form ───────┐│
A row opens the page; Back returns to the list.      │ :: [Works alone       ]   [x]   x     │ │ What the student sent ││
                                                     │ :: [With assistance   ]   [x]   x     │ │ ( ) Works alone       ││
New (?method=new): the four types only, then the     │ Add a level                           │ │ ( ) With assistance   ││
same page with the preview appearing beside it.      │ Who can evaluate   Each evaluation    │ │ ( ) Needs coaching    ││
                                                     │ [x] Preceptor      needs              │ │ [ Submit 1 skill ]    ││
375: (Settings | Preview) switch under the title,    │ [x] Clinical fac.  [x] Self-eval      │ └───────────────────────┘│
one pane at a time; save bar fixed at the bottom.    │ [x] Let faculty check off a group     │   sticky, read only      │
                                                     ├───────────────────────────────────────┴──────────────────────────┤
                                                     │ (only after a change)        2 to fix   [Cancel] [Save method]   │
                                                     └──────────────────────────────────────────────────────────────────┘
```

**I. Master-detail.**

```
1440 (?variant=I, the first method is open; ?method= picks another)          375
┌ <- Evaluation settings                                    [New method] ┐   ┌ <- Evaluation settings ┐   ┌ <- Supervised levels ┐
│ Methods 6 | Details 4                                                  │   │ Methods 6 | Details 4  │   │ Independence level · │
├──────────────────────┬─────────────────────────────────────────────────┤   │ Supervised levels  166 │   │ Used by 166 skills   │
│ Supervised levels 166│ Independence level · Used by 166 · Change type …│   │ Independence level     │   │ Name [............]  │
│ Independence level   │ Name [Supervised levels      ] │ Who can evaluate│  │ Approved, with rev.  2 │   │ Levels ...           │
│──────────────────────│ Add a description              │ [x] Preceptor   │  │ Approved or not ...    │   │ Who can evaluate ... │
│ Approved, with rev. 2│ Levels highest first  Moves fwd│ [x] Clinical fac│  │ ...                    │   │ [Cancel][Save method]│
│ Approved or not appr.│ :: [Works alone    ] [x]  x    │ Each evaluation │  └────────────────────────┘   └──────────────────────┘
│ Questions, self-rat 2│ :: [With assist.   ] [x]  x    │ needs ...       │   list first, a row opens the detail, the back icon
│ ...                  │ Add a level                    │ [x] Group check │   returns to the list
│                      ├────────────────────────────────┴─────────────────┤
│                      │ Preview   (after a change) [Cancel] [Save method]│
└──────────────────────┴──────────────────────────────────────────────────┘
Choosing another method with unsaved changes asks "Discard your changes?" first; the draft is kept on Keep editing.
```

**J. Summary first, edit one block in place.**

```
Method page (?variant=J&method=m-program), reading                 One block being edited
┌ <- Supervised levels                              [Preview] ┐    │ Levels, highest first        Moves forward │
│ Name                          Edit │ Who can evaluate   Edit │    │ :: [Works alone        ]        [x]    x   │
│ Supervised levels                  │ Preceptor, clinical     │    │ :: [With assistance    ]        [x]    x   │
│────────────────────────────────────│ faculty                 │    │ :: [Needs coaching     ]        [ ]    x   │
│ Type                   Change type │─────────────────────────│    │ Add a level                                │
│ Independence level                 │ Each evaluation    Edit │    │ [Save] [Cancel]                 1 to fix   │
│ Used by 166 skills                 │ needs                   │    The other blocks stay as text. Edit on another
│────────────────────────────────────│ Student self-evaluation │    block with unsaved work asks to discard first.
│ Levels                        Edit │ first                   │
│ Works alone        moves forward   │─────────────────────────│    New (?method=new): the four types, then every
│ With assistance    moves forward   │ Group check-off    Edit │    block open as fields with one Create method
│ Needs coaching     does not        │ On. Counts as works     │    (there is nothing to summarise yet).
│                                    │ alone                   │
└────────────────────────────────────┴─────────────────────────┘
List: the same table as G and H; a row opens this page.
```

**Concept table.**

| Concept | Mental model | Primary job | First viewport at 1440 (regions of 4) | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|---|
| G (current) | A form in a dialog over the list | Change a field and close | Dialog counts alone: 1 | Dialog, Checkbox, Input, AlertDialog | Any picture of the result (second dialog) | Popup over a page; width capped | Is hiding the type choice enough? |
| H Live preview | "Change it and watch the form change" | See exactly what evaluator and student get | 3: header with type line, settings, preview | PageHeader, Input, Checkbox, ViewSegmentedControl, Popover + Command (example), AlertDialog, DataTable (list) | Type tiles (behind Change type), a Preview button, Times needed | Preview pulls the eye from the fields; long question sets scroll the settings past a sticky preview | Does seeing the result remove the need to "check how it works" by reading settings? |
| I Master-detail | "All my methods on one desk" | Compare and hop between methods | 4: header, tabs, list, detail | PageHeader, Tabs, Button (list rows as links), Input, Checkbox, DropdownMenu, AlertDialog | The table columns (type sits under each name; the rest is in the detail) | One method (95 percent of programs) leaves a one-row list beside the editor; the detail column is narrower | Is switching worth a permanent column? |
| J Summary first | "A spec sheet I can correct" | Check, then fix one thing | 3: header, left blocks, right blocks | PageHeader, Button (link), Input, Checkbox, AlertDialog, DataTable (list) | Fields, until asked for; a page-level Save | One more click before any edit; values are drawn twice (text and field); several small saves | Do admins want to read before they edit? |

**Principle trade-offs.**

| Principle | G dialog | H live preview | I master-detail | J summary first |
|---|---|---|---|---|
| Recognition over recall | Values in fields; result behind Preview | Best: the result is on screen | Values in fields; type under each name in the list | Good: plain sentences, but fields hidden |
| Immediate feedback (Nielsen 1) | None until Preview | Best: every keystroke redraws the form | None until Preview | Summary updates on Save only |
| Error prevention | Stray edit possible, guarded by Save and discard | Same as G | Same, plus the switch guard | Best: nothing is editable until Edit; one block at a time |
| Task frequency (check often, edit rarely) | One click to open, all editable | One click, check by looking at the form | Zero clicks for the first method | Best for checking; worst for a run of edits |
| Hick (choices in view) | About 12 controls | About 12, plus a passive picture | About 12, plus the list | Fewest: 6 Edit links |
| Spatial memory, comparison | Lost: the list is covered | Lost: one method per page | Best: the list never moves | Lost: one method per page |
| Fitts | Save in the dialog footer | Save bar at the bottom edge, full width | Save bar at the bottom of the detail | Save beside the block edited (shortest travel) |
| Use of 1440 width | 64rem cap | Filled by the preview | Filled by list and detail | Two columns of text; lightest |
| 375 | Full-screen dialog | Settings or Preview, one at a time | List, then detail | Stacks naturally; best |
| Doherty, cost to build | Built | Preview renders on each edit (cheap, local) | Cheap | Cheap |

**Shared rules for H, I and J.** Title is the page (the method's name on a method page; "New method" for a new one). No subtitle: in H the type is a field among the fields (label Type, then type, skills count, Change type); in I it opens the detail pane; in J it is a block. J's title is the method's name, so its first block reads the description and opens both fields (the name is said once). Bold only on the title (the DS h1); group labels are DS label weight. One filled primary per view: New method on a list; Save method or Create method while there is something to save (the bar appears only after a change, so nothing disabled sits above the fold); in J, Save inside the block. Checkboxes for on or off, since every change waits for Save. Kept from G in all three: the back icon beside the title, the leave guard (links, browser Back, reload), validation focus with "n to fix", the type-change question [REQ SC-09], the save confirm naming students [REQ AE-02] (the Apply dialog for the program's method), the Details tab on the list view, `?method=<id|new>` deep links, the missing-method banner, Duplicate and Delete. Nothing preselected in New [REQ SC-02].

**Requirements (H, I and J carry G's list, every state).**

| ID | REQ text (short) | H | I | J |
|---|---|---|---|---|
| 4.1 | "Four models are required initially" | Four type tiles in New and behind Change type | same | Tiles in New and in the Type block's Change type |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | New: nothing selected, Create refused without a type | same | same |
| SC-03 | Outcome labels program-defined; which qualifies explicit | Outcomes list | same | Outcomes block, read and edit |
| SC-04, SC-05, SC-06 | Question set; all, N of M, named subset | Questions, Moves forward when | same | Questions block |
| SC-07 | Scale; average, minimum on every question, total | Scale, Moves forward when | same | Questions block |
| SC-08 | Levels program-defined and ordered | Levels list | same | Levels block |
| SC-09 | "Changing the model must rebuild the criteria" | Change type, switch question | same | Change type opens tiles and the criteria fields together |
| SC-14, SC-15, SC-16 | Feedback, self-evaluation, approval, roles | Who can evaluate, Each evaluation needs | same | Two blocks |
| SC-17 | "The dependency ... must be apparent" | Type line, list, moves forward, and the preview | Type line, list | Blocks in dependency order |
| SC-18 | Unsatisfiable configuration not savable | Save refused, "n to fix" | same | Save in the block refused, "n to fix" |
| SC-19 | Review what student and evaluator will be asked | The live preview (both forms) | Preview button | Preview button |
| AE-02 | Rule change re-applies to evidence held | Save confirm names students | same | same, from the block's Save |
| SC-13 | Student-supplied fields | Details tab | Details tab | Details tab |

**Registry.** `admin/evaluation-settings` keeps B and G and gains H, I and J (five variants; the registry test allows six on a tier 1 screen). A, D, E and F are unregistered (never chosen; their files stay). G stays `recommended`.

**Acceptance.** No dialog holds the editor in H, I or J (confirms only). Each fits its fields for the levels method in 900 px at 1440 without page scroll in the settings; at 375 nothing scrolls sideways. One semibold element per view (the h1). Each walked: new (empty, error, saved), edit of the four types, change type, the leave guard. axe clean at 1440 and 375.

**Changed during the build (the sketches above show the first draft).** H: the type line moved from under the title to the field "Type" below Name, because a line of facts under an h1 reads as a subtitle (anatomy rule A1). J: the first block is "Name and description" and reads the description ("No description" when there is none), because the title already says the name (anatomy rule A6).

**Round 5, what was walked and what was not (2026-11-16).** Headless browser, 1440 and 375, each of H, I and J: the list; edit of Independence level, Approved or not approved and Questions by deep link; New with nothing chosen, Create with no type, a type chosen, Create with an empty name, no qualifying outcome and no role ("3 to fix", focus on the name), the leave guard from the back icon, then created; Change type with the switch question; a save through the confirm on a method in use; a link to a method that no longer exists; the fields of Score on a scale in New. I at 1440: another method, and the Details tab, with unsaved changes (asked, Keep editing kept the draft, Discard switched). J: Edit on a second block with unsaved work (asked), Save in a block through the confirm, an empty name, a type change saved with no levels ("3 to fix"), leaving with unsaved work. Not walked: an existing Score on a scale method (the sample data has none), the program's method saved through the Apply dialog, a new program with no method, the browser's Back button, reload with unsaved work, Duplicate and Delete from I's detail menu, 1024 and 1920 widths, a screen reader. No unit test covers these three screens.

## Amendment 2026-11-16 (round 6 variants): adding and editing as separate jobs, K, L, M and N (Proposed, D-EM1116-g)

Romit, 2026-11-16, after choosing G over H, I and J (D-EM1116-f): "is that all the options you have considered?" G stays the decided design and is not edited. K, L, M and N are four more patterns for the same screen, data (`lib/lab/methods.ts`, `lib/lab/details.ts`) and fields (`components/lab/methods/method-parts.tsx`, `components/lab/configure/*`). None repeats G (dialog), H (page with live preview), I (master-detail) or J (summary blocks on a page).

**The two jobs are not the same job [CALL 11-16] [INFER].** Adding is rare (once or twice per program) and hard: the admin must decide a type before knowing what a type looks like [REQ SC-02]. Editing is mostly "open, check, change one thing": a name, which answers move a student forward, who can evaluate, self-evaluation, feedback, approval, group check-off. A type change is the rarest edit and rebuilds the method [REQ SC-09]. So a variant may use one pattern for both (K) or a different pattern for each (L, M, N).

**References (Mobbin, looked at).** incident.io "Edit follow-up" (a right panel over a task table, Cancel and Save in its footer; teaches: one Save at the panel's foot, the list stays as context; not copied: the dimmed page, K keeps the table readable) https://mobbin.com/screens/7fd6497d-a992-4570-870a-f304715aec0e · Givingli contacts (row, then a panel of that record) https://mobbin.com/screens/ebc35a6b-d145-477a-8a0b-b99985a8490f · Wix "Add a new service" (describe it, or start from a template, or "Start from scratch"; "You'll review them before they're added"; teaches: examples and blank are peers, review is promised up front; not copied: stock photos, AI wording) https://mobbin.com/screens/82347748-d312-4748-a3a9-0dfeca13b569 · Spellbook workflows (cards of a name and one line; teaches: a starting point is chosen from what it does) https://mobbin.com/screens/a99b0b45-3700-4e6b-b87e-7d0ba8cc8563 · Remote expenses approval (a rule row opened in place with its own Cancel and "Add rule"; teaches: the row is the editor, the page never changes) https://mobbin.com/screens/5b8c1fc5-a2a0-4064-9eec-3e22ee6b6596 · Remote "Describe the report you'd like to create" (one text box, "or Create with template, Create manually"; teaches: the manual way is always one click away; not copied: sending the text anywhere) https://mobbin.com/screens/ec130832-d63d-4f43-9023-a5fe34e03a58 · Meetup create a group (short steps, one decision each, review before submit) https://mobbin.com/screens/6b488d48-bc04-44b2-b8f0-d8849f90188a. No reference was found for editing a rule through a popover on a table cell (M's edit); the nearest everyday model is a spreadsheet cell. Outside software: K is a clipboard held beside the register, L is a printed form picked from a rack of filled-in samples, M is a counter clerk asking one question at a time, N is dictating to a clerk who fills the form and hands it back to be checked.

**K. Side panel (one pattern for both).**

```
1440 (?variant=K&method=m-program)                                          375
┌ <- Evaluation settings                     [New method] ┬───────────────┐  panel is full width; the list is
│ Methods 6 | Details 4                                   │ Edit method  x│  behind it; footer fixed
│ Method            Type            Moves forward when    │ Independence  │
│ Supervised lev.   Independence l. Works alone or ...    │ level · Used  │
│ Approved, with …  Approved or …   Approved              │ by 166 skills │
│ ...                                                     │ · Change type │
│ (the page narrows beside the panel; the open row is     │ Name [......] │
│  marked; another row swaps the panel, asking first      │ Levels  Moves │
│  when there is unsaved work)                            │ :: [....] [x] │
│                                                         │ Who can eval. │
│                                                         │ Each eval.    │
│                                                         │ needs         │
│                                                         ├───────────────┤
│                                                         │Preview  [Save]│
└─────────────────────────────────────────────────────────┴───────────────┘
New: the same panel, the four types first, nothing chosen; the fields appear once a type is.
```

DS `FloatingSheetPanel` (non-modal, 32rem), not a dialog: the table stays readable and clickable. Panel title "Edit method" or "New method", the type line in the DS subtitle slot, one column in reading order, footer Preview at the start, "n to fix", Cancel and the one Save. Cancel and Save show only with something to save.

**L. Start from an example, edit in the row.**

```
New (?variant=L&method=new), 1440                              Edit (?variant=L&method=m-program): the row opens in place
┌ <- New method                                             ┐  ┌ <- Evaluation settings                    [New method] ┐
│ Independence level  Approved or not  Questions   Score    │  │ Methods 6 | Details 4                                  │
│ ( ) Supervision     ( ) Met or unmet ( ) Every   ( ) 1 to │  │ v Supervised levels  Independence level  Works al… 166 │
│     levels              Met ✓            question    5,   │  │   Name [.........]            │ Who can evaluate       │
│     Independent ✓       Unmet            Yes         avg 4│  │   Levels      Moves forward   │ [x] Preceptor ...      │
│     With assistance ( ) Approved,                         │  │   :: [Works alone   ] [x]     │ Each evaluation needs  │
│     Observed            with review                       │  │   Add a level                 │ [x] Self-evaluation    │
│ ( ) Developmental                                         │  │   Preview            1 to fix [Cancel] [Save method]   │
│     levels, self-rated                                    │  │ > Approved, with review  Approved or not …  Approved 2 │
│ ( ) Start blank                                           │  │ > Questions, self-rated  Questions  All 5 answered… 2  │
├───────────────────────────────────────────────────────────┤  └────────────────────────────────────────────────────────┘
│                                    [Cancel] [Continue]    │  One row open at a time; another row with unsaved work asks.
└───────────────────────────────────────────────────────────┘
Then the same page shows the editor filled from the example, "Create method", Back to the starting points.
```

Six ready-made examples across the four types plus "Start blank"; radios, none checked, Continue refused until one is [REQ SC-02]. Each tile shows what the evaluator would pick and what moves a student forward (recognition over recall). An example fills names and the choices its tile states; it never fills who can evaluate or any question text, so Create cannot be pressed straight through [REQ SC-16, SC-04] [INFER]. Edit: DS `Accordion` rows; the closed row carries the table's facts, the open row is the editor with its own Save. No navigation, no overlay.

**M. Guided steps to add, edit a value in the table.**

```
New (?variant=M&method=new), 1440                                   Edit (?variant=M&method=m-program): the table, one value open
┌ <- New method                                                 ┐   ┌ Method        Type          Moves forward when   Who can evaluate  Each evaluation needs  Skills ┐
│ (1 Type)──(2 Levels)──(3 Evaluation)──(4 Review)              │   │ Supervised v  Independence  [Works alone or … v] [Preceptor, … v]  [Self-evaluation … v]   166 … │
│ How is the skill judged?                │ So far              │   │               level         ┌──────────────────────────┐                                        │
│ ( ) Independence level  one line        │ Independence level  │   │                             │ Levels     Moves forward │                                        │
│ ( ) Approved or not     one line        │ 3 levels ...        │   │                             │ :: [Works alone ]  [x]   │                                        │
│ ( ) Questions           one line        │                     │   │                             │ Add a level              │                                        │
│ ( ) Score on a scale    one line        │                     │   │                             │ 1 to fix [Cancel] [Save] │                                        │
├─────────────────────────────────────────┴─────────────────────┤   │                             └──────────────────────────┘                                        │
│ [Back]                                           [Continue]   │   └──────────────────────────────────────────────────────────────────────────────────────────────────┘
└───────────────────────────────────────────────────────────────┘   Change type (row menu) opens the same steps for that method.
Step 4 reads the method in plain sentences, each with a Change link to its step, then Name and Create method; the forms preview sits beside it.
```

Add: DS `Wizard` (compact, horizontal) through the lab `WizardPage`; one decision per step, checked on Continue; step 2 is named for the type (Levels, Outcomes, Questions). Edit: each value in the table is a button that opens a DS `Popover` holding only that group, with Save and Cancel. Chosen over a sheet because the commonest edit touches one group: one press to the field, one to save, and the table (the summary) never leaves. A type change rebuilds the method, so it reuses the guided steps.

**N. Describe in words (spike).**

```
New or Edit (?variant=N&method=new | m-program), 1440
┌ <- New method                                                                                         ┐
│ In words                                   │ Type  ( ) Independence ( ) Approved ( ) Questions ( ) Score │
│ ┌────────────────────────────────────────┐ │ Name [..............]             │ Who can evaluate       │
│ │ 3 levels, preceptor or faculty,        │ │ Levels          Moves forward     │ [x] Preceptor          │
│ │ self-evaluation first                  │ │ :: [          ]  [ ]              │ [x] Clinical faculty   │
│ └────────────────────────────────────────┘ │ :: [          ]  [ ]              │ Each evaluation needs  │
│ [Fill in the form]                         │ :: [          ]  [ ]              │ [x] Self-evaluation    │
│ Filled in: Independence level · 3 levels · │                                                           │
│ Preceptor, clinical faculty · Self-eval.   │                                                           │
│ Not used: "twice a year"                   │                                                           │
├────────────────────────────────────────────┴───────────────────────────────────────────────────────────┤
│                                                    2 to fix   [Cancel] [Create method]                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

A local, deterministic reader (`lib/lab/method-words.ts`); no network, no model. It fills only what the words state and lists it under "Filled in"; words it could not use are listed under "Not used" (Postel: accept, show the guess, let it be undone). It never guesses names, which answers move a student forward or who evaluates [REQ SC-02, SC-03]. The structured form is always on the page, filled or not, and is the only thing Save reads: the description is a way to fill it, the form is the review. Edit: the box holds the saved method in words (`describeMethod`), the same words the reader understands, so a tweak is typed or ticked. Filling again over hand edits asks first.

**Concept table.**

| Concept | Mental model | Primary job | First viewport at 1440 (regions of budget) | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|---|
| K Side panel | An inspector beside the list | Edit while seeing the other methods | List 3 of 4 (header, tabs, table) plus the panel | FloatingSheetPanel, DataTable, Input, Checkbox, AlertDialog | Two columns (the panel is one), a second Save | 32rem is narrow for long questions; the panel hides the table's last columns below 1100 px | Does keeping the list in view beat a centred dialog? |
| L Example, then row | Pick a filled-in sample; the row is the editor | Add by recognition; edit without moving | New 3 of 4 (header, tiles, footer); list 3 of 4 | RadioGroup, Accordion, Input, Checkbox, AlertDialog, StickyFooter | Abstract type tiles before an example is seen; a table header | Examples anchor the program on our wording; an open row pushes the others down | Do examples make the first method faster and less wrong? |
| M Steps, then cell | A short interview; then a spreadsheet | Add one decision at a time; tweak one value | New 4 of 4 (header, stepper, step, footer); list 3 of 4 | Wizard, DataTable, Popover, Input, Checkbox, AlertDialog | Every field at once; an editor surface for edit | Four steps for a job done once; a popover is small for 10 questions; two edit surfaces (cell, steps) | Does create need hand-holding, and is one value at a time enough for edit? |
| N In words | Dictate, then check the form | Add or change by describing | 4 of 4 (header, words, form, footer) | Textarea, RadioGroup, Input, Checkbox, AlertDialog, StickyFooter | Any hidden interpretation; a mode switch between words and form | A reader that understands less than the admin expects; two ways to say one thing | Is describing faster than ticking for an admin who knows what they want? |

**Principles check (what each law demands here, and how each variant answers).**

| Principle | Demand | K | L | M | N |
|---|---|---|---|---|---|
| Progressive disclosure | Type first, fields after; rare things later | Tiles, then fields; Change type behind a link | Examples, then editor; closed rows are summaries | One step at a time; one group per popover | Words first; the form fills as it is understood |
| Recognition over recall | Show what a method looks like | Table beside the panel | Best: filled examples with what moves forward | Plain-language "So far" and Review | The method read back in words |
| One primary per view | One filled button | Save in the panel; New method goes quiet while it is open | Continue, then Create; Save in the open row | Continue, then Create; Save in the popover | Fill in the form until filled, then Create or Save |
| Error prevention | No stray or blind change | Asks before swapping rows, closing or leaving | Nothing preselected; roles and questions never prefilled; one row at a time | Each step checked on Continue; SC-09 question on type | Never guesses; lists what was not used; asks before refilling |
| Fitts | Action beside its object | Save at the panel foot | Save inside the open row | Save inside the popover, beside the cell | Fill under the box; Save in the footer |
| Hick | Few choices in view | About 12 controls | 7 tiles, then about 12 | 4, then one group | 1 box, then about 12 |
| Task frequency | Check often, edit rarely, add once | One press to check and edit | Zero to check (row), one to edit | Zero to check, one per value | One press, read the words |
| WCAG 2.1 AA | Name, role, focus, 24 px targets, no colour alone | Focus to the panel, back to the row; Esc asks | Radios; accordion buttons with `aria-expanded` | Stepper named; popover focus returns to its cell | Label on the box; results in a polite live region |

**Shared rules (all four).** Kept from G: the back icon beside the title (`ReturnTitle`, `BackTitle`), the leave guard, validation with focus on the first problem and "n to fix", the type-change question [REQ SC-09], the save confirm naming students [REQ AE-02] (the Apply dialog for the program's method), the Details tab, `?method=<id|new>` deep links, the missing-method banner, Duplicate and Delete, four types with nothing preselected in New [REQ SC-02]. No subtitle, bold only on the title, sentence case, no icon on a text button, no internal notes. Checkboxes for on or off (every change waits for Save).

**Requirements (K, L, M and N carry G's list, every state).**

| ID | REQ text (short) | K | L | M | N |
|---|---|---|---|---|---|
| 4.1 | "Four models are required initially" | Tiles in New and behind Change type | Examples for all four, Start blank opens the tiles; Change type in the row | Step 1; Change type reopens it | Tiles always on the form |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | Nothing chosen; Create refused | No tile checked; Continue refused | No type checked; Continue refused | The reader sets a type only when the words name one |
| SC-03 | Outcome labels program-defined; which qualifies explicit | Outcomes list | same; an example's choice is stated on its tile | Step 2 | Only when the words say which |
| SC-04, SC-05, SC-06 | Question set; all, N of M, named subset | Questions, Moves forward when | same; questions never prefilled | Step 2 | Form; the reader sets count and rule, never text |
| SC-07 | Scale; average, minimum, total | Scale, Moves forward when | same | Step 2 | Form; "1 to 5", "average 4" |
| SC-08 | Levels program-defined and ordered | Levels list | same | Step 2; popover | Form; "levels: a, b, c" |
| SC-09 | "Changing the model must rebuild the criteria" | Change type, switch question | Change type in the open row | Change type reopens the steps, switch question | Tiles; a description that names another type asks first |
| SC-14, SC-15, SC-16 | Feedback, self-evaluation, approval, roles | Two groups | Two groups | Step 3; two popovers | Form; words |
| SC-17 | "The dependency ... must be apparent" | Type line, list, moves forward | Tile shows it; then the same | Step order | Form order |
| SC-18 | Unsatisfiable configuration not savable | Save refused, "n to fix" | same | Continue and Save refused | same |
| SC-19 | Review what student and evaluator will be asked | Preview in the footer | Preview in the row | Preview beside Review; Preview in the popover | Preview |
| AE-02 | Rule change re-applies to evidence held | Save confirm names students | same | same, from a popover | same |
| SC-13 | Student-supplied fields | Details tab | Details tab | Details tab | Details tab |

**Registry.** `admin/evaluation-settings` holds G (recommended), H, K, L, M, N: six, the tier 1 limit. B, I and J are unregistered (files kept).

**Acceptance.** Each walked at 1440 and 375: edit of Independence level, Approved or not approved and Questions by deep link; New empty, with errors, created; change type; the leave guard. One semibold element per view. Nothing scrolls sideways at 375. axe clean at 1440 and 375. No network call from N.

## Amendment 2026-11-16 (round 7 variants): the wizard, done better, O and P (Proposed, D-EM1116-h)

Romit, 2026-11-16, on M: he wants to try the wizard approach for adding and editing a method, "but can you do it better". G stays the decided design and is not edited; K, L and M stay as built. O and P are two wizards for the same screen, data (`lib/lab/methods.ts`) and fields (`components/lab/methods/method-parts.tsx`, `components/lab/configure/*`), with their shared pieces in `components/lab/methods/method-wizard.tsx`.

**What is wrong with M (seen in its round 6 screenshots, and the UX critic's notes).**

| Problem in M | Principle it breaks | Answer in O and P |
|---|---|---|
| Four steps for a job done once or twice a year; the last one only repeats the first three | Occam; Pareto | O: two questions and a summary. P: five short questions on one page, the page itself is the summary |
| Step names "Type", "Answers", "Evaluation" say nothing | Recognition over recall; plain language | Every step is headed by the question the admin answers; the second question is worded for the chosen type |
| On steps 2 and 3 the earlier choices are gone; only Review shows the whole | Context; Zeigarnik | O: the evaluator's form is drawn beside every step from the first choice, and one line under the heading says what is chosen. P: answered questions stay on the page as one line each |
| Half the page is empty on every step (dead canvas) | D-L5, D-X30; hierarchy | O and P: the preview column holds the real evaluator and student forms from 1280 px |
| The name is asked last, under four sentences | Serial position | O: the name leads the summary. P: "What is this method called?" is its own short question |
| Edit is a different surface (a popover on a table cell); a chevron in every cell | One mental model; Gestalt (one mark, one meaning); Hick | Edit opens the same wizard on its summary; "Change" opens one question and returns. The table is the calm one (no cell controls) |
| The popover is tight for ten questions | Fitts; readable width | Every question is edited on the full page |

**References (Mobbin, looked at).** The New York Times checkout (answered steps fold to one line with "Edit", the open step below them; teaches P's stack; not copied: the numbers before each line) https://mobbin.com/screens/ad5678f4-2c93-4bed-864b-cab066fd150e · Stripe "Review and submit" (a summary in named groups, each with its own Edit; teaches O's summary and that edit can start from it; not copied: a card per group) https://mobbin.com/screens/d8b29b26-595c-487b-af8c-04b9762468ef · Quo "Give your inbox a name and icon" (one question, suggestions as chips, the result drawn live on the right; teaches the starting sets and the preview column; not copied: "1 of 4") https://mobbin.com/screens/da0341da-f6b1-48e4-8ccb-78b963a2e2fa · Upwork job post (answered sections with a pencil, optional ones closed; not copied: icon-only edit) https://mobbin.com/screens/bfde8a78-6885-4127-b877-9f960848e1ae · Wix marketing plan setup (a step with its example beside it) https://mobbin.com/screens/ddfb785e-ecc6-4840-a497-64f959fe7eb0. Outside SaaS: a paper form with the carbon copy beside it (O), and a checkout where each finished part folds into a receipt line (P).

**O. Two questions and a summary, the evaluator's form always beside.**

```
New (?variant=O&method=new), 1440                                         Summary: step 3 of New, and where Edit opens (?variant=O&method=m-program)
┌ <- New method                                                      ┐    ┌ <- Supervised levels                                                ┐
│ (1 Rating)──(2 Evaluators)──(3 Summary)                            │    │ (✓ Rating)──(✓ Evaluators)──(● Summary)                             │
│ How does the evaluator rate a skill?        │ Evaluator | Student  │    │ Name [Supervised levels      ]          │ Evaluator | Student      │
│ ( ) Independence level  ( ) Approved or not │ ┌──────────────────┐ │    │ Add a description                       │ ┌──────────────────────┐ │
│ ( ) Questions           ( ) Score on a scale│ │ IV catheter ...  │ │    │ Rating                           Change │ │ IV catheter ...      │ │
│  (once one is chosen, under the tiles)      │ │ Level observed   │ │    │ Independence level                      │ │ Level observed       │ │
│ Start from [Independent, With assistance, …]│ │ [Independent   ] │ │    │ The evaluator picks one of 3 levels ... │ │ [Works alone       ] │ │
│ Levels  Highest first        Moves forward  │ │ [With assistance]│ │    │ A student moves forward on: any level.  │ │ ...                  │ │
│ :: [Independent      ]            [ ]   x   │ │ [Observed      ] │ │    │ ─────────────────────────────────────── │ │                      │ │
│ :: [With assistance  ]            [ ]   x   │ │ Feedback         │ │    │ Evaluators                       Change │ │                      │ │
│ Add a level                                 │ └──────────────────┘ │    │ Preceptor or clinical faculty can ...   │ └──────────────────────┘ │
├─────────────────────────────────────────────┴──────────────────────┤    ├─────────────────────────────────────────┴──────────────────────────┤
│                                      1 to fix  [Cancel] [Continue] │    │                                                           [Close]  │
└────────────────────────────────────────────────────────────────────┘    └────────────────────────────────────────────────────────────────────┘
375: the stepper is one line ("Rating, 1 of 3"), one column, Preview opens from the footer, the buttons stack full width.
```

DS `Wizard` (compact, horizontal) through the lab `WizardPage` with its `stepTitle` (the question, the page's one 18 px heading) and `aside` (the live `ProgramPreview`). Three steps: Rating (the type, then what the evaluator picks and what moves a student forward, which appear under the tiles once a type is chosen: one decision, and the dependency of SC-17 is on one screen), Evaluators (who can evaluate, what each evaluation needs, group check-off), Summary (the name first, then the method in plain sentences in two named groups, each with Change). Change opens that step with "Done" as its primary, which checks the step and returns to the summary. Edit opens the same wizard on its summary: nothing to save shows Close only; a change shows Cancel and Save method. In Edit the type is a fact line with "Change type" behind it (the rarest edit, SC-09 question kept).

**P. One question at a time, answers stay on the page.**

```
New (?variant=P&method=new), 1440, third question open                    Edit (?variant=P&method=m-program): every question answered
┌ <- New method                                                      ┐    ┌ <- Supervised levels                                                ┐
│ How does the evaluator rate a skill?        │ Evaluator | Student  │    │ How does the evaluator rate a skill?    │ Evaluator | Student      │
│ Independence level                   Change │ ┌──────────────────┐ │    │ Independence level               Change │ ┌──────────────────────┐ │
│ ─────────────────────────────────────────── │ │ IV catheter ...  │ │    │ ─────────────────────────────────────── │ │ ...                  │ │
│ What are the levels, and which move a       │ │ Level observed   │ │    │ What are the levels, and which move ... │ │                      │ │
│ student forward?                            │ │ ...              │ │    │ Works alone, with assistance, needs     │ │                      │ │
│ Independent, with assistance, observed.     │ │                  │ │    │ coaching. Any level moves forward Change│ │                      │ │
│ Independent moves a student forward  Change │ │                  │ │    │ ─────────────────────────────────────── │ │                      │ │
│ ─────────────────────────────────────────── │ │                  │ │    │ Who can evaluate?                       │ │                      │ │
│ Who can evaluate?            (18 semibold)  │ │                  │ │    │ Preceptor, clinical faculty      Change │ │                      │ │
│ [ ] Preceptor [ ] Clinical faculty [ ] Lab… │ │                  │ │    │ What else does each evaluation need?    │ │                      │ │
│ ─────────────────────────────────────────── │ │                  │ │    │ Self-evaluation first            Change │ │                      │ │
│ What else does each evaluation need?        │ │                  │ │    │ What is this method called?             │ │                      │ │
│ What is this method called?                 │ └──────────────────┘ │    │ Supervised levels                Change │ └──────────────────────┘ │
├─────────────────────────────────────────────┴──────────────────────┤    ├─────────────────────────────────────────┴──────────────────────────┤
│ [Back]                                         [Cancel] [Continue] │    │                                                           [Close]  │
└────────────────────────────────────────────────────────────────────┘    └────────────────────────────────────────────────────────────────────┘
```

No stepper. Five questions in one readable column (44rem): how a skill is rated, the levels (or outcomes, or questions, worded for the type), who can evaluate, what else each evaluation needs, what the method is called. One question is open at a time, as the page's one heading with its fields; an answered question is two lines (the question, muted, and the answer in plain words) with Change; a question still to come is its text only, muted, so the admin sees what is left without a counter. Continue (in the lab's sticky footer, like every wizard) checks the open question and opens the next; after the last, the page is the summary and the footer's primary becomes Create method. Edit opens that same page, every question answered; Change opens one, Done folds it back, Save method shows once something changed. Composed from DS `Button`, `Field`, `RadioGroup`, `Checkbox`, `Input`; the disclosure is a `Button` with `aria-expanded` and `aria-controls` (DS `Accordion` puts the whole row in one trigger with a chevron, which cannot hold "Change" as its own control or a row that is not yet reachable).

**Considered and not built.** A left rail of steps with each answer under its step (the lab's `WizardPage layout="rail"`): it keeps context, but beside the app rail and the Skills panel it is a third column of navigation before the first field, and at 1440 the fields fall under 28rem. A page of example tiles as step 1 (L): seven tiles before the first question, and its examples tick what moves a student forward; the same recognition is given here by the type tiles' wording, the starting sets and the live form.

**Starting sets (both).** Under a chosen type that has common wording (levels, outcomes), "Start from" offers the sets of `LABEL_PRESETS` as visible buttons that read as what the evaluator would see ("Independent, With assistance, Observed"). A set fills names only: which levels or which outcome moves a student forward is never ticked by a set, so the step cannot be passed until the admin ticks it [REQ SC-02, SC-03]. A set over names the admin typed asks first. Nothing is preselected in New; Continue is refused with "Choose how skills are rated." until a type is chosen.

**Concept table.**

| Concept | Mental model | Primary job | First viewport at 1440 (regions of budget) | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|---|
| O Steps with the form beside | Fill a form, watch the carbon copy | Add in two decisions; edit from the summary | 4 of 4 (header, stepper, step with its preview, footer) | Wizard, RadioGroup, Input, Checkbox, Button, AlertDialog, ViewSegmentedControl | A review that repeats the steps; a "so far" list; cell editors | The first step is long for Questions (tiles, questions, the rule); earlier steps are reachable from the stepper only when they come before the open one (DS Wizard) | Do fewer, larger steps with a live picture beat four small ones? |
| P Answers stay on the page | A checkout: each finished part folds into a line | Add one small question at a time; edit any line | 3 of 4 (header, the questions with their preview, footer) | Button, RadioGroup, Input, Checkbox, Field, AlertDialog | A stepper; a separate review; a second edit surface | Five Continue presses; a long page once a question with ten questions is open; no DS stepper to say "wizard" | Is one page that grows into its own summary calmer than steps? |
| (not built) Left rail | A table of contents | Jump between steps | 5 of 4 | Wizard vertical | n/a | A third navigation column | n/a |

**Principles check.**

| Principle | Demand here | O | P |
|---|---|---|---|
| Hick | Few choices in view | 4 tiles, then one list | One question's controls only |
| Miller, chunking | 5 to 7 per cluster | 3 steps; 2 summary groups | 5 questions |
| Progressive disclosure, two levels | Type first, its fields after | Fields appear under the chosen tile; Change type behind a link in Edit | A question opens when the one before is answered |
| Recognition over recall | See what a method looks like before committing | Live evaluator form beside every step; sets read as the evaluator's choices | Same form beside the stack; answers read back in plain words |
| Zeigarnik, goal gradient | Show what is left | Stepper | Unanswered questions listed, muted |
| Serial position | First and last carry the weight | Question heading first; the name leads the summary | The open question is the one heading; Create method ends it |
| Fitts | Action beside its object, 24 px targets | Change beside each group; footer primary full width at 375 | Change at the end of each answer; same footer |
| Error prevention | No blind or stray change | Nothing preselected; sets never tick; step checked on Continue; SC-09 question; AE-02 confirm | Same, per question |
| Recovery | Say what failed and where | "n to fix" beside the primary, focus to the first problem; a problem in another step opens that step | Same; a problem in a folded question opens it |
| One primary per view | One filled button | Continue, Done, Create method or Save method | Same |
| Peak-end | End on an outcome | "Created {name}." on the list | Same |
| Jakob | Behave like the lab's other wizards | DS Wizard, sticky footer, Back at the left | Sticky footer, Back at the left |
| WCAG 2.1 AA | 1.3.1, 2.4.3, 2.4.6, 2.5.8, 3.3.1, 3.3.3, 4.1.2, 4.1.3 | Headed steps, focus to the step heading, errors tied with aria-describedby, live "n to fix" | Sections named by their question, `aria-expanded` on Change, focus to the opened heading and back to Change |

**Shared rules.** Kept from G: the back icon beside the title (`BackTitle`, `ReturnTitle`), the leave guard, the SC-09 type-change question, the AE-02 save confirm (the Apply dialog for the program's method), the Details tab, `?method=<id|new>` deep links plus `&step=` (O: `rating`, `who`, `summary`; P: `rating`, `answers`, `who`, `needs`, `name`), the missing-method banner, Duplicate and Delete, four types. The list is the shared `MethodsTable`: a row opens the method, no control in a cell. Back never loses input (one draft for the whole wizard). No subtitle, one 18 px heading per view, sentence case, no icon on a text button, no internal notes.

**Requirements (O and P, every state; quoted from `docs/source/requirements.extracted.txt`).**

| ID | REQ text | O | P |
|---|---|---|---|
| 4.1 | "Four models are required initially" | Four tiles, step 1; behind Change type in Edit | First question |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | No tile checked; Continue refused | Same |
| SC-03 | "Which of the two qualifies must be recorded explicitly. Both labels are required and must differ." | Outcomes list; a set never chooses | Second question |
| SC-04, SC-05, SC-06 | "the program defines and maintains the question set"; "all questions answered Yes; at least N of M answered Yes; or a named subset"; "A qualification rule must be satisfiable" | Step 1, Questions | Second question |
| SC-07 | "the response scale is program-configured. Qualification is by average across questions, a minimum on every question, or a total" | Step 1, Score on a scale | Second question |
| SC-08 | "the levels of supervision are program-defined and ordered. No fixed three-point scale is assumed" | Step 1, Levels | Second question |
| SC-09 | "Changing the model must rebuild the criteria rather than leave contradictory settings in place" | Tiles ask before removing levels or questions | Same, first question |
| SC-14, SC-15, SC-16 | feedback mandatory per skill; self-evaluation and approval; "which evaluator roles may sign off" | Step 2 | Third and fourth questions |
| SC-17 | "The dependency from evaluation model ... to the achievement criteria must be apparent" | Type, what is picked and what moves forward on one step, in that order | Question order; the answers read in that order |
| SC-18 | "A configuration that cannot be satisfied must not be savable" | Continue, Done and Save refused, "n to fix" | Same |
| SC-19 | "review everything it will ask of the student and the evaluator, together" | Preview column (Evaluator, Student); Preview in the footer below 1280 | Same |
| AE-02 | "a change to the rule re-applies to evidence already held" | Save confirm names students | Same |
| SC-13 | Student-supplied fields | Details tab | Details tab |

**Registry.** `admin/evaluation-settings` holds G (recommended), K, L, M, O, P: six, the tier 1 limit. H and N are unregistered (files kept).

**Acceptance.** Each walked at 1440 and 375: New for the four types (nothing chosen refused, a starting set, errors, created); edit of the three seeded methods from the summary through Change and back, saved through the AE-02 confirm; change type; the leave guard; Back keeps input. One 18 px heading per view. Nothing scrolls sideways at 375. axe clean at 1440 and 375.

**After review (same day; these replace the lines above where they differ).** The UX critic ranked O first for adding and P first for editing, and blocked on two things. Applied: (1) P asks four questions, not five: who can evaluate and what each evaluation needs are one question ("Who can evaluate, and what does each evaluation need?", two columns), so adding is three Continue presses and Create method; `&step=needs` opens that question. (2) No empty framed preview: before a type is chosen there is no preview column in O or P (the sentence "The evaluator's form appears here once you choose." is gone); the column appears with the first form. (3) A step or question opened by Change keeps Cancel beside Done (it asks before discarding). (4) Below 1280 px, Preview sits under the fields, not in the footer, so the phone footer holds only the primary, Cancel and Back. Not applied, open for Romit: asking the name first; opening any unanswered question out of order in P; the preview listing levels lowest first while the editor says "Highest first" (shared `ProgramPreview`, used by G and others, not changed here).

## Amendment 2026-11-17 (round 8 variant): Q, templates and side panel (Proposed, D-EM1117-q)

Source: Romit's handoff spec `evaluation-methods-handoff.md` ("Variant 1: Templates and side panel", 2026-11-17). Built inside our hard rules; each deviation from the spec is listed below and in the build report.

```
List (?variant=Q), 1440                                       Gallery (?variant=Q&method=new), 1440
┌ Evaluation settings                       [New method] ┐    ┌ <- New method                                    [Cancel] ┐
│ Methods 4 | Details 6                                  │    │ Choose a starting point                (18 semibold)       │
│ ┌ banner: Created Supervised levels. [Assign to skills]│    │ ┌──────────────────────────┐ ┌──────────────────────────┐ │
│ Method              Type        Moves forward  Skills  │    │ │ [Approved][Not approved] │ │ Works alone      ✓       │ │
│ Supervised levels New  Indep... With assist...   0  ⋯  │    │ │ Approved or not approved │ │ With assistance  ✓       │ │
│ Program method  New skills ...                 166  ⋯  │    │ │ One decision by the ...  │ │ Independence levels      │ │
│ ...                                                    │    │ └──────────────────────────┘ └──────────────────────────┘ │
└────────────────────────────────────────────────────────┘    │ ┌ Step checklist ─────────┐ ┌ Scored criteria ─────────┐ │
                                                              └────────────────────────────────────────────────────────────┘
Panel over the list (?variant=Q&method=new&template=tpl-levels | ?variant=Q&method=<id>)
                                   ┌ New method                          [x] ┐
                                   │ From Independence levels                │
                                   │ Name [Independence levels          ]    │
                                   │ Levels (shared LevelsField)             │
                                   │ Who can evaluate  [ ] [ ] [ ]           │
                                   │ Each evaluation needs [ ] [ ] [ ]       │
                                   │ Group check-off [ ]                     │
                                   ├─────────────────────────────────────────┤
                                   │ Change template    [Preview] [Create]   │
                                   └─────────────────────────────────────────┘
```

**Flow.** List, New method, a full-width gallery of four template cards (nothing selected, a card is a link), the DS `FloatingSheetPanel` (right, `md`) over the list, prefilled from the card; Create method closes it and the list shows a `LocalBanner` (lab `ResultBanner`) with "Assign to skills" (links to the Library) and the new row first with a "New" badge until the page is left. A row opens the same panel with saved values; Save on a method used by skills shows the AE-02 confirm in the spec's words ("Update n skills?", "Keep editing", "Update n skills", "Evaluations already recorded keep their results.") over the student names whose progress changes; the program's method keeps G's Apply dialog.

**Templates onto our four types [REQ 4.1].** Approved or not approved = Approved or not approved (binary, "Approved" / "Not approved", "Approved" qualifies); Independence levels = Independence level (Works alone, With assistance, Needs coaching; With assistance and above move forward); Step checklist = Questions (every question must be Yes; four empty questions to write); Scored criteria = Score on a scale (1 to 4, a total of 12, four empty criteria). Templates never fill who can evaluate [REQ SC-16] or the text of a question [REQ SC-04], as L's examples.

**Deviations from the spec.** Toast to `LocalBanner`; spec colours and fonts to DS tokens and type; the DS panel is non-modal (no scrim, no focus trap); Checklist has no N/A, group headings or prefilled step text, Scored has no "from" on the scale (1 is fixed) and no N/A; no "Default"/"Make default" (SC-02, open decision 2), the program's method keeps the "New skills" tag; the list keeps the shared columns ("Moves forward when", "Each evaluation needs"); roles are checkboxes, not toggle chips; levels reorder by Move up / Move down (no DS drag primitive); type lock by the SC-09 question (no lock on recorded evaluations exists); group check-off offered for every type, as every other variant; validation copy is the lab's shared copy; no change count in the Edit footer; no submitting spinner (local save is synchronous).

**Requirements.** 4.1, SC-02, SC-03, SC-04 to SC-08, SC-09, SC-14, SC-15, SC-16, SC-17, SC-18, SC-19, AE-02, SC-13 (Details tab), as round 7.

**Registry.** `admin/evaluation-settings` holds Q (recommended; Romit 2026-11-17, "Q is the default", D-EM1117-q Decided), G, K, M, O, P. L is unregistered (file kept). `/admin/settings` and the walkthrough render Q.

### Q panel, 2026-11-17 (later): type select, description area, Preview tab, two-level hierarchy (Romit, Proposed)

Romit: type as a dropdown, description as a textarea, icons so the panel reads at a glance, Preview as a tab. Then, on the first build: "too many icons, no UI and UX hierarchy". Built as the second direction.

```
Panel, 1440 (md, right)                      375: same column, primary full width at the bottom
┌ New method                            [x] ┐
│ From Independence levels    (meta)        │   title: 18 semibold (one step above sections)
│ Settings | Preview          (sticky tabs) │
│ Name         [Independence levels      ]  │   identity block: no heading, no icons
│ Description  [                         ]  │   DS Textarea, always shown, optional
│ Type         [⌂ Independence level   v]   │   DS Select; icon per type in items and trigger
│ ───────────────────────────────────────── │   DS Separator, 24px between sections
│ (i) What the evaluator picks  (16 semibold)│
│ Levels / Outcomes / Questions (field label)│
│ ───────────────────────────────────────── │
│ (i) Who can evaluate         [ ] [ ] [ ]  │   options plain, no icons
│ ───────────────────────────────────────── │
│ (i) Each evaluation needs    [ ] [ ] [ ]  │
│ ───────────────────────────────────────── │
│ (i) Group check-off          [ ]          │
├───────────────────────────────────────────┤
│ Change template      [n to fix] [Create]  │   edit: Cancel + Save method once dirty, else Close
└───────────────────────────────────────────┘
```

- **Type** is a DS `Select` (`TypeSelect`), in create and edit. Its value is only the template the admin picked or the method's saved type; with neither it shows "Choose a type" [REQ SC-02]. A change that would remove levels, questions, minimums or the counting rule asks first, in the tiles' words ("Switch to …?", "Keep …", "Switch") [REQ SC-09]. "Changed" sits after the label when the saved type was changed. Order and icons follow the gallery: Approved or not approved `fa-circle-half-stroke`, Independence level `fa-stairs`, Questions `fa-list-check`, Score on a scale `fa-star-half-stroke` (the tile icons); muted, brand only on the chosen one.
- **Description** is a DS `Textarea` under Name, always visible, 160 characters, optional.
- **Hierarchy.** Two levels. The identity block (Name, Description, Type) has no heading and no icons. Four sections follow, each a 16 semibold heading (`TYPE.card`, one step above the 14 medium field label) with one plain muted Font Awesome light icon, split by a DS `Separator`: What the evaluator picks `fa-hand-pointer`, Who can evaluate `fa-user-check`, Each evaluation needs `fa-clipboard-list`, Group check-off `fa-users`. A plain glyph, not a tinted chip: four chips down a narrow panel read as four more objects. No icon on field labels or options. No helper text, subtitle or description added. The panel title moves to 18 semibold so it stays above the sections.
- **Preview** is a DS `Tabs` pair, Settings and Preview, at the top of the panel body (sticky while the body scrolls). Preview shows, inline, the forms the Preview dialog showed: the evaluator's first, then the student's, on a library skill picked with "Example" [REQ SC-19]. The footer Preview button is gone. The footer primary (Create method / Save method) shows on both tabs. Settings stays mounted while Preview shows; a failed save, or "n to fix", brings Settings back and focuses the first problem (the type select when there is no type).
- The edit caption no longer repeats the type (it is in the select): "New skills" where it applies, then the skill count.
- Gallery mini previews: the tick icons are `text-xs` (the 16px tick box grew from 14px to hold them), nothing under 12px.

Opt-in props in `components/lab/methods/method-parts.tsx` (default off, G, H, J, K, M, O and P pass none): `NameFields descriptionArea`, `RolesField section`, `NeedsField section`, `CheckOffField section`. New exports used by Q only: `TypeSelect`, `MethodPreview`, `SectionHeading`, `TYPE_ICON`, `SECTION_ICON`, `PICKS_LABEL`, `CHECKOFF_HEADING`.

### Q, 2026-11-17 (last): no gallery, the panel opens on New method; Q is the default (Romit, Decided)

Romit: "when I click on New method, open the same panel instead of starting points"; then Q made the default (`screens.json` recommended G to Q). This replaces the gallery, the "From {template}" caption and "Change template" above; the panel layout above stands.

```
List ── New method ──> Panel over the list (?variant=Q&method=new)
                       ┌ New method                            [x] ┐
                       │ Settings | Preview                        │
                       │ Name         [                         ]  │
                       │ Description  [                         ]  │
                       │ Type         [Choose a type          v]   │  nothing chosen [REQ SC-02]
                       │ ───────────────────────────────────────── │
                       │ (once a type is chosen)                   │
                       │ (i) What the evaluator picks              │  the type's starting values
                       │ ───────────────────────────────────────── │
                       │ (i) Who can evaluate     (from the start) │
                       │ ───────────────────────────────────────── │
                       │ (i) Each evaluation needs (from the start)│
                       │ ───────────────────────────────────────── │
                       │ (i) Group check-off  (once a type)        │
                       │     [x] Let faculty check off a group     │
                       │         A group check-off counts as [v]   │  one row, nested to the label text
                       ├───────────────────────────────────────────┤
                       │                   [1 to fix] [Create]     │
                       └───────────────────────────────────────────┘
```

- **No gallery.** `&method=new` opens the panel over the list. No "From {template}" caption, no "Change template". The `?template=` parameter is ignored.
- **Type** starts on "Choose a type". Picking one fills that type's starting values, the old template's (`METHOD_TEMPLATES` in `lib/lab/method-examples.ts`): Independence level gets Works alone, With assistance, Needs coaching with the top two moving forward; Approved or not approved gets Approved / Not approved with Approved moving forward; Questions gets four empty questions, every one Yes; Score on a scale gets four empty criteria, 1 to 4, total 12. Who can evaluate, what each evaluation needs, group check-off and student fields the admin already set are kept [REQ SC-16]. Switching after that still asks the SC-09 question when levels or questions would go.
- **Create with no type** shows "Choose how skills are judged." under Type (`aria-invalid` on the select), "1 to fix" beside Create, and brings back the Settings tab with focus on the select.
- **Sections before a type:** Who can evaluate and Each evaluation needs show from the start; What the evaluator picks and Group check-off wait for the type, because both depend on it (the check-off value is a level or score of that type).
- **Preview with no type** shows one line, "Choose a type to see the evaluator's form." The tab stays enabled: a disabled tab says nothing about why, and the empty state tells the admin the one thing to do.
- **Group check-off**, ticked: "A group check-off counts as" and its select on one row, indented to the checkbox's label text, the label muted and normal weight (quieter than the checkbox's). No helper line under it ("Faculty do not evaluate each student…" removed in Q). The amber note for a level below the cut-off stays, since it is a consequence and not a hint. For Approved or not approved and Questions, nothing is nested (the sentence "A group check-off counts as …" is no longer shown in Q).
- No helper or hint text under any field in Q's panel; only validation errors.
- Opt-in props in `method-parts.tsx` (default off; G, H, J, K, M, O and P pass none): `NameFields descriptionArea`, `RolesField section`, `NeedsField section`, `CheckOffField section` (the heading, the nested one-row select, no helper), `TypeSelect prefill`.

### Q Preview tab, 2026-11-17: one person's screen at a time (Romit: "it's unclear to see the difference between evaluator and student")

```
Preview tab
[ Student | Evaluator ]                    [Example: IV catheter insertion v]
┌ (icon) Preceptor ─────────────────────────────────────────┐  slim header: who sees it
│ Harbor University BSN               No account needed     │
│ IV catheter insertion / From the student / Level observed │
│ Feedback / [Submit 1 skill]                               │
└───────────────────────────────────────────────────────────┘
```

- DS `ViewSegmentedControl` ("Whose screen"), Student then Evaluator: the student always acts first (asks for sign-off, rating themselves first when self-evaluation is on). Evaluator is open by default, since it is the form the method shapes.
- One frame per view (DS border and radius) with a slim muted header naming who sees it: the first ticked role in Who can evaluate (Preceptor `fa-user-doctor`, Clinical faculty `fa-chalkboard-user`, Lab instructor `fa-flask`), or "Evaluator" (`fa-user-check`) when none is ticked; "Student" (`fa-user-graduate`). The forms' own inner border is dropped inside the frame, so there is one frame, not a frame in a frame. No other text added.
- The evaluator form's "Told after submit: …" line is hidden in Q: it describes what happens after the screen, it is not on the evaluator's screen.

### Details tab framing, 2026-11-17 (Romit: "In the Details tab, if you check the prototype it gives some idea of what it's about, which I don't see here.")

Amends D-EM1116-c (above). The tab now carries the prototype's own framing [PROTO 11-16, section "Details collected with every evaluation"] and nothing more. Shared by every variant through `SettingsHome`; only `components/lab/configure/details-table.tsx` changed.

```
Methods 6 | Details 4                                              [Add detail]
Details collected with every evaluation                      (TYPE.section, h2)
Set up once for the program. Every skill, every method and every evaluation asks for these.   (TYPE.helper)
┌ Detail                         │ Type        │ Filled in by │ Required │ ⋯ ┐
│ Date performed  (Built in)     │ Date        │ Student      │ Yes      │   │
│ Shift                          │ Choice      │ Student      │ No       │ ⋯ │
│ Day · Evening · Night  (meta)  │             │              │          │   │
└──────────────────────────────────────────────────────────────────────────┘
A student sending several skills fills these in once. On the check-off grid they are entered once
for the session. To see them in place, [open any method] and choose Preview.          (TYPE.helper)
```

- "Filled in by" is always a column (replaces "shows only when it differs"): who fills each detail in is what the table is for, as in the prototype. "Required" is a column (Yes / No), replacing the inline "Optional" word.
- A program dropdown lists its choices under its name in meta type; a built-in's name already states its choices, so no second line.
- The closing link opens the first method (`?method=<id>`, variant and return context kept, `tab` dropped). Q keeps its panel's Settings / Preview tab in component state, so the link cannot land on Preview itself; it reads "open any method and choose Preview". With no method, the line ends "Once a method exists, its Preview shows them in place." (no link).
- Known gap, not fixed here: the method Preview's "From the student" block still reads the method's own fields (Course, where it was done, Date performed), not this table [INFER, flagged in D-EM1116-c], so the closing line's promise holds only partly until Preview reads `detailsOf`.
- Test: `admin/tests/lab/details-table.test.tsx`.
