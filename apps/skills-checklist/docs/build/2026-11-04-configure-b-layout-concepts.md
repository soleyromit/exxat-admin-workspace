# Configure the skill, variant B: layout concepts for sections 3 and 4 plus Approval

Date: 2026-11-04. Status: proposal, nothing built. Requested by Romit: "can you update a better ui layout, illustration, etc.?"

Consulted: worktree copy (`sc-scale`) of brief, glossary, ledger (D-L26, D-L27, D-L28, D-L34, D-L36, D-L37, D-L43, D-L47, D-L48, D-X30, D-X39, D-X47), REQ SC-01 to SC-19. Code: `admin-configure-skill-b.tsx`, `configure/fields.tsx`, `configure/many-page.tsx`, `configure/program-preview.tsx`, `configure/live-panel.tsx`, `layout/wizard-page.tsx`. Live page probed with Playwright at 1920, 1440, 1280, 1024.

## 1. Direct answer

Build concept A: settings on the left, a sticky panel on the right holding a live vertical "Steps" illustration, with the Evaluator and Student previews one segment away. Take the role headers from concept B. Move only group check-off and "Counts when". Nothing required is lost.

## 2. The diagnosis, checked

| # | Your diagnosis | Verdict | Evidence |
|---|---|---|---|
| 1 | Flat stack, about 60% empty at 1440 | Right, with a cause you did not list | Content width is 1087 px. Groups cap at 672 px (`max-w-2xl`), radio rows end near 352 px, so 37% to 67% of each row is empty. Cause: B passes `aside` only while Check is in view (`admin-configure-skill-b.tsx:178`). D-X39 says full width "is met by the preview aside", and the file header still promises that panel. |
| 2 | Groups do not match headings | Half right | Group check-off is misplaced: Evaluation settings D already files it under Evaluator (D-L43). "Counts when" is misplaced too, see below. Conditions belong with the count (SC-10, SC-11 are counts). Student, Evaluator, Approval by subject is Sankalp's own direction (D-L26): keep it. Only the title "Who signs" is wrong. |
| 3 | Nothing shows the consequence | Right, and worse than it looks | At 1280 and up the rule sentence is `display: none` and the footer Preview button is hidden (`RuleFooterSummary asideWide`), and no aside replaces them. Above 1280 the admin sees no rule sentence and no preview until Check. Measured at 1440. |
| 4 | Every setting looks equally important | Right, but do not hide what looks rare | Conditions are already behind "Add a condition". Self-rating and approval are the two optional steps of SC-15: they shape the flow, so they stay visible. Group check-off defaults on for Approved or not approved and for Independence level (`fields.tsx:933`) and writes evidence with no student submission: hide it and an admin misses a consequential default. |

New finding: the four models ask "what counts" in two different places. Approved or not approved and Independence level ask it in section 2 ("What counts as achieved"); questions and scored ask it in section 3 ("How many evaluations"). Moving "Counts when" to section 2 fixes the heading mismatch and the inconsistency together.

## 3. References (Mobbin, images read)

Searches naming Ramp, Brex and Rippling returned no screens from those products, and Asana returned no approval settings. Linear returned settings only. Stated rather than stretched.

| App | Screen | Pattern | Take | Do not copy |
|---|---|---|---|---|
| Airwallex | [Transfer approvals](https://mobbin.com/screens/a7e18c31-967c-455f-ba66-3f9e825abfca) | Vertical node path reading back the config, one line per node, icon list of extra settings | The illustration: nodes, line, one data line each | Explanatory prose in the left column (D-L34) |
| Melio | [Approval workflows](https://mobbin.com/screens/666442e6-97c0-498c-800d-8455d17c051a) | "When" then "Then" as a plain read-back card | Rule as a sentence beside its parts | Read-only card needing a separate edit mode |
| Acctual | [Add approval rule](https://mobbin.com/screens/80e77954-dc68-49ce-912f-11d1845bf9d5) | Sentence with inline controls, "Require 1 approval" | Confirms our inline number sentence | Narrow column with the rest of the page empty |
| Chatbase | [Chat widget style](https://mobbin.com/screens/6985aef6-bd94-40a3-84af-8a32ec272e26) | Settings left, live preview right, updates on change | Preview beside the control that drives it | Dotted canvas, decorative chrome |
| Linear | [Team estimates](https://mobbin.com/screens/f3134ca3-b7e5-47ab-a283-92ce2db403db) | One control reveals its dependants; label left, control right in a bounded surface | Reveal "Level recorded" only when check-off is on | Description under every toggle (D-L34) |
| Mercury | [Card spend policy](https://mobbin.com/screens/98e61b35-61a0-4490-b1a9-15a7188767ce) | Each policy is a row with an icon; off rows are one line, on rows show their value | Concept B card weight | Red Disable button |
| Productboard | [Automation When, If, Then](https://mobbin.com/screens/a8765305-a9c0-429c-85c7-425063f1f068) | Numbered vertical spine, controls inside each stage | Concept C | Long helper line under each stage |
| Homerun | [Login policy](https://mobbin.com/screens/9b4c8549-7a84-4f8e-b869-2088887940af) | Three columns: label, control, consequence on the same row | Concept C consequence column | Paragraph-length consequence |
| KAYAK | [Approvals settings](https://mobbin.com/screens/b566c956-58d7-400e-9ff4-6d45a6c23163) | Label column, control column, aligned across rows | The label gutter in the recommended layout | Fixed narrow card at wide widths |

Outside SaaS: a parcel tracking page, read before the parcel ships. It lists the stops it will pass, and a stop that does not apply is simply not there. That is the Steps panel.

## 4. Concepts

| Concept | Mental model | Primary job | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|
| A. Settings + Steps panel | A form with a live receipt | Change a setting, see who does what | `FormPage` aside (`PreviewColumns`), `ViewSegmentedControl`, `Separator`, `StatusBadge`, `ToggleSwitch`, `Checkbox`, `RadioGroup` | Cards around groups; a separate sentence block | Panel reads as subtext | Does a persistent picture of the path make consequences clear? |
| B. Role swimlanes | Three people, three columns | See each person's job at a glance | `Card`, `Separator`, `Collapsible`, `StatusBadge`, `Popover` | Side panel, section number for 4 | Sankalp's D-L26 objection to side-by-side | Do people read a role row faster than a list? |
| C. Journey spine | The page is the path | Walk the path once, top to bottom | `Separator`, `ToggleSwitch`, real preview screens | Sticky panel, sections 3 and 4 as separate sections | Biggest change, longest page | Does editing inside the stage beat editing beside a picture? |

### A. Two columns with a Steps panel (recommended)

```
1440 x 900: content 1087 px, left 693, gap 24, panel 370                              one filled button
+----------------------------------------------------------------------+-----------------------------------+
| [How skills are judged][What counts as achieved][How many][Who...]   | sticky                            |
|                                                                      | [ Steps | Evaluator | Student ]   |
| 2 What counts as achieved  (tail)                                    |                                   |
|   1 [ Maintains aseptic technique                      ] x           |  (o) Student logs                 |
|   Add a question   Paste a list                                      |   |   Adds date performed         |
|   Counts when        ( ) Every question is answered Yes              |   |                               |
|                      ( ) At least [ ] of 3 questions are answered Yes|  (o) Evaluator signs off          |
|                      ( ) These questions are answered Yes            |   |   Answers 3 questions           |
| -------------------------------------------------------------------- |   |   Preceptor by emailed link     |
| 3 How many evaluations                                               |   |   Clinical faculty in Prism     |
|   The student needs [ 3 ] evaluations that count                     |   |                               |
|   Add a condition                                                    |  (o) Approval before it counts    |
| -------------------------------------------------------------------- |   |                               |
| 4 Who does what                                                      |  [v Achieved]                     |
|                                                                      |   Get 3 evaluations with every    |
|  [icon] Student     What the student adds                            |   question answered Yes.          |
|                     +----------------------------------------------+ |                                   |
|                     | Date performed   Date  Required    Edit  x   | |                                   |
|                     +----------------------------------------------+ |                                   |
|                     Add a field                                      |                                   |
|                     (o ) Student rates themselves first              |                                   |
| -------------------------------------------------------------------- |                                   |
|  [icon] Evaluator   Who can sign off                                 |                                   |
|                     [x] Preceptor  [x] Clinical faculty  [ ] Lab ins.|                                   |
|                     ( o) Feedback is required                        |                                   |
|                     ( o) Allow group check-off                       |                                   |
| -------------------------------------------------------------------- |                                   |
|  [icon] Approval    (o ) Approval before it counts                   |                                   |
+----------------------------------------------------------------------+-----------------------------------+
|  Fix 3 things first.                                      [Save draft] [Save configuration]               |
+-----------------------------------------------------------------------------------------------------------+
```

Regrouping:

| Setting | Today | New home |
|---|---|---|
| Counts when (question, scored) | 3 | 2, under the questions, like "Which levels count" (D-L27) |
| The student needs N | 3 | 3 |
| Conditions (setting minimums, level minimums, different evaluators, SC-12 note) | 3 | 3, unchanged behind "Add a condition"; set rows always show |
| Group check-off | 3, own subsection | 4, Evaluator, with "Level recorded" or "Score recorded" revealed when on |
| What the student adds | 4 Student | 4 Student |
| Student rates themselves first | 4 Student | 4 Student |
| Who can sign off | 4 Evaluator | 4 Evaluator |
| Feedback is required | 4 Evaluator | 4 Evaluator |
| Approval before it counts | 4 Approval | 4 Approval, same block style as the other two |

- Illustration: section 5, in the panel, from the rule. Segments "Evaluator" and "Student" show the real `program-preview` screens for this skill, in a scroll region under 100+ question sets.
- 1280: left 583, panel 320; the label gutter stays, the field list wraps through its existing container query.
- 1024: panel hidden. The same steps become one horizontal row (icon and label, no value lines) above section 4; the existing footer sentence and Preview popover return by themselves.
- Check in view: the panel swaps to `DecisionPanel`, as today.
- Bulk: section 6.
- Risks: panel values read as subtext (mitigated by short data values, D-L36 keeps "data values"); at 1920 toggle rows still leave space to their right (proposal 4).

### B. Role swimlanes

```
1440: content 1087 px, full width, no side panel
+---------------------------------------------------------------------------------------------------+
| 3 How many evaluations     The student needs [ 3 ] evaluations that count       Add a condition     |
+---------------------------------------------------------------------------------------------------+
| 4 Who does what                                                                                     |
|   (Student) -----------------------> (Evaluator) ----------------------> (Approval) ---> [Achieved] |
| +-------------------------------+ +-------------------------------+ +-----------------------------+ |
| | [icon] Student      Preview   | | [icon] Evaluator    Preview   | | [icon] Approval             | |
| | What the student adds         | | Who can sign off              | | (o ) Approval before it     | |
| | Date performed  Date  Req.  x | | [x] Preceptor                 | |      counts                 | |
| | Add a field                   | | [x] Clinical faculty          | |                             | |
| | (o ) Rates themselves first   | | [ ] Lab instructor            | |                             | |
| |                               | | ( o) Feedback is required     | |                             | |
| |                               | | > More: Group check-off, On   | |                             | |
| +-------------------------------+ +-------------------------------+ +-----------------------------+ |
+---------------------------------------------------------------------------------------------------+
```

- Regroup: as A, except group check-off sits in a `Collapsible` whose trigger names its state ("Group check-off, On").
- Illustration: the node row is the column header; the Approval node and its card drop when off. Built from `Separator` (horizontal) and marker circles.
- 1280: three columns at 295 px, field rows wrap. 1024: one column, the node row stays above.
- Bulk: `Mixed` fits card rows, but the node row needs a dashed Approval node when Approval is Mixed, and a Mixed card cannot drop.
- Risks: D-L26 (Sankalp, "What student adds position looks wrong") came from a side-by-side layout. Approval card is mostly empty. No sticky read-out for sections 1 and 2. Three cards on a page that is otherwise flat.

### C. Journey spine

```
1440: content 1087 px. Sections 3 and 4 merge into one section.
+---------------------------------------------------------------------------------------------------+
| 3 How it works                                                                                      |
|  (o) Student logs                                 |  [ Student screen, real component        ]      |
|   |  What the student adds  ...  Add a field      |  [ Date performed        Ask for sign-off ]     |
|   |  (o ) Rates themselves first                  |                                                 |
|   |                                                                                                 |
|  (o) Evaluator signs off                          |  [ Evaluator screen, real component      ]      |
|   |  Who can sign off  [x] [x] [ ]                |  [ Criteria, Yes or No ...   Feedback    ]      |
|   |  ( o) Feedback   ( o) Allow group check-off   |  [ Submit 1 skill                        ]      |
|   |                                                                                                 |
|  ( ) Approval                  (o ) Before it counts  (off: hollow node, one line, no right column) |
|   |                                                                                                 |
|  [v] Achieved                                     |  You need 3 evaluations with every question     |
|      The student needs [ 3 ] evaluations          |  answered Yes.                                  |
|      Add a condition                              |                                                 |
+---------------------------------------------------------------------------------------------------+
```

- Regroup: every setting moves into its stage; the count moves after approval, which is the real order.
- Illustration: the page itself; each node sits in a left spine, its consequence on the same row (Homerun).
- 1280: the right column narrows to 300 px. 1024: previews drop below each stage and the page gets very long.
- Bulk: a Mixed stage has no single preview to show, so the right column empties on most stages.
- Risks: changes section order and count (`CONFIGURE_STEPS`, anchors, the Check list, D-X39 order, D-L37 one vocabulary across Evaluation settings, `many-page`). A 100-question skill makes stage 2 enormous unless clipped. Nothing stays on screen while editing sections 1 and 2.

## 5. The illustration, exactly

Draw a vertical ordered list of nodes, from the rule, in the panel. Only real settings; no decoration. Until a model is chosen the panel does not exist (D-L43, SC-02).

| Node | Shown when | Glyph (`fa-light`) | Label | Value lines (data, each only when set) |
|---|---|---|---|---|
| Student | Always, once a model is set | `fa-user-graduate` | Student logs | "Adds date performed" or "Adds 4 details"; labels through `inSentence` |
| Self-rating | `selfEvaluation` on | `fa-pen-to-square` | Student rates themselves | None |
| Evaluator | Always | `fa-signature` | Evaluator signs off | Evidence: "Picks met or unmet" / "Answers 3 questions" / "Scores 3 questions, 1 to 5" / "Picks 1 of 3 levels". Who: `whoLine()` as in `program-preview.tsx`. "Feedback required" when on. "Group check-off allowed" when on |
| Approval | `approvalRequired` on | `fa-stamp` | Approval before it counts | None |
| Achieved | Always | Glyph from the badge | `RecordStateBadge` achieved | `ruleSentence(rule)`, or its "Not set yet." |

- Skin: 32 px circle with `wizardMarkerClass("upcoming", "icons")` (`border-border bg-muted/30 text-muted-foreground`), so nodes match DS steppers. Connector: DS `Separator orientation="vertical"` (`--border`). Label `TYPE.label`, value `TYPE.meta`.
- Tokens: `--border`, `--muted`, `--muted-foreground`, `--foreground`, badge success tone only on Achieved. Missing value after a save attempt: `StatusBadge` tone warning, `--status-badge-warning-fill` and `--status-badge-warning-fg`, glyph plus word. Never red, never brand on nodes (brand is only the primary and selected nav).
- A dropped step disappears with no gap and no animation; the live region states the new path. Text is real text in `<ol>`, not `aria-hidden`; one `aria-live="polite"` copy of the sentence moves here from the footer, which is `display: none` at this width.
- SC-17: the Evaluator evidence line plus the Achieved sentence show model, then evidence, then rule, then achievement, in one column.
- Deliberately not drawn: a "repeats 3 times" loop bracket, because it would draw the number a second time beside the sentence. No progress bar, no percentages.

DS check (`node tools/ds/source.mjs`, 1.5.1): `Stepper`, `Timeline`, `StatusPath`, `Steps` are not exported. `WizardNav` needs `Wizard` context, renders focusable step buttons and means "where you are in editing", so it is wrong for a read-out. `Marker` is an inline conversation status. Only `wizardMarkerClass` reuses cleanly. The list itself is a small lab component (`configure/steps-panel.tsx`), allowed as indicator layer (brief section 6); ask `ds-adoption-reviewer` before creating it.

## 6. Bulk configure (D-L48, `many-page.tsx`)

| Element | One skill | Several skills |
|---|---|---|
| Rows | Controls | `MixedGate` and `MixedYesNo` inside the same label gutter; the gutter label replaces the label `MixedGate` repeats today |
| Optional node | Present or dropped | Mixed: node stays with an outline `Badge` "Mixed", because some skills have the step |
| Evaluator values | From the rule | Mixed value: outline `Badge` "Mixed" instead of the line |
| Achieved line | `ruleSentence` | Need or criteria Mixed: outline `Badge` "Mixed", never "Not set yet.", which is what `ruleSentence` returns today for a blank need |
| Previews | This skill | Example picker limited to the selected skills, with this draft resolved on each |

`many-page.tsx` composes sections 3 and 4 by hand, so the build needs one shared `ConfigRow` (gutter label plus control) and the moved rows in both files. Otherwise the two pages drift.

## 7. Recommendation and why

Concept A with B's role headers.

1. It fixes the real cause. `PreviewColumns` already gives a sticky 34% column at 1280 and up; the left column then equals the 672 px field width, so the empty space is used by something the admin reads.
2. Consequence stays visible across all sections, including a long question list. B and C lose it above and below their section.
3. It respects decided structure: four sections and their anchors (D-L37), one column by subject (D-L26, D-X39), the Check swap, the concept Romit kept on Evaluation settings (D-L43).
4. Bulk stays simple: rows are unchanged, the panel only adds a Mixed state.
5. It should also remove a likely bug: `aside` going from undefined to set changes the `PreviewColumns` tree, which appears to remount the form when Check enters view [INFER, read from code, not reproduced]. An always-set aside avoids it.

C is the most expressive and worth a new variant later if Romit wants to test it, not as the update to B.

## 8. Requirement effects

Nothing required moves out of the page. Every field keeps its `cfg-*` id, so error focus keeps working.

| ID | Requirement (short) | Effect in A | Status after build |
|---|---|---|---|
| SC-02 | Model chosen explicitly | Panel absent until chosen; no node implies a choice | MET, unchanged |
| SC-04 | Program defines question set | Section 2 untouched | MET, unchanged |
| SC-05 | Question qualification rule | Moves from 3 to 2; `validateRule` issues change section `rule` to `outcomes` for `cfg-qrule*`, `cfg-srule*` | MET, needs test updates |
| SC-07 | Scored qualification | Moves with it | MET |
| SC-10 | Total and minimum at each level | "Add a condition", section 3 | MET, unchanged |
| SC-11 | Setting minimums | Same | MET, unchanged |
| SC-12 | Lab never meets a clinical minimum | Note stays under the last setting row, once; not repeated in the panel | MET, unchanged |
| SC-13 | What the student supplies | `StudentFieldsField` intact, label, type, mandatory, choices; narrower at 1280, wraps | MET |
| SC-14 | Feedback mandatory per skill | Evaluator; preview shows required or optional | MET |
| SC-15 | Self-evaluation and approval | Both visible; now also shown as optional steps | MET, stronger |
| SC-16 | Which roles sign off | Evaluator | MET, unchanged |
| SC-17 | Dependency apparent | Today hidden above 1280; restored by the panel | MET, was PARTIAL at 1280 and up |
| SC-18 | Unsatisfiable config blocked | Save blocking unchanged | MET, unchanged |
| SC-19 | Review everything together, before use | Panel per person while editing; both together at Check (`PeopleSee`) | MET, stronger |

Group check-off is PROTO and CALL 10-28, not REQ; it keeps its controls.

## 9. Open points

Not decided here, no OD touched. Delegated defaults, flag if wrong:

1. Rename section 4 "Who signs" to "Who does what". It is shared vocabulary (D-L37, `configure.ts:683,722`, Check, Evaluation settings), so it changes everywhere. Tests read it.
2. Move "Counts when" to section 2 in the shared `SECTION_BODY`, so A follows; C keeps its sentence. If rejected, it stays as the first row of section 3.

## 10. Critique and proposals

- Weakest part: the panel adds about 33 words. The density script appears to measure the page's default start, and on an unconfigured skill the panel does not exist there, so the gate may not catch it [INFER, script not run]. Judge a configured skill by eye at 1440. If it reads as text, drop the Student value line first.
- `PeopleSee` at Check uses the older `live-panel` previews while the panel uses `program-preview`: two looks for one thing.

Proposals:

1. Use the `program-preview` screens at Check too, side by side, so SC-19 "together" shows the real form.
2. Add the evaluator's receipt to the Evaluator preview ("Counts now" or "Held for approval"), so the approval toggle changes something visible in that view.
3. Replicate the panel on variant A only if A stays registered for comparison; it is no longer recommended (D-L47).
4. At 1920 the left column reaches about 990 px. Check by screenshot; if toggle rows look empty, put Student and Evaluator side by side from a 60rem container, each with its own switches. Sankalp's objection was switches under one column only, so that is arguable, not settled.

## 11. Verification

Read only. No app code changed, no gates run because nothing was built. Runtime facts in section 2 measured against the worktree's page on :3017 while another worker was editing it, so line numbers may move.

Not verified: panel height at 1440 x 900 under a long preview; that `fa-signature`, `fa-stamp`, `fa-pen-to-square` render in the kit (each is used elsewhere in the lab, not checked at runtime); the exact `wizardMarkerClass` base classes; the remount in section 7; how the bulk preview resolves a draft per skill.

Screenshot looked at: 1440 with the question model. 1920, 1280 and 1024 were measured, not viewed. No screenshots of the concepts exist.
