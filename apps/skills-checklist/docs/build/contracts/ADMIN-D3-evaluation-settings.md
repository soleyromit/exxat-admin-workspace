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
