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
