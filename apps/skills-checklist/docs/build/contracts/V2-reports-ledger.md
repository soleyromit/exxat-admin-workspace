# V2-reports-ledger Reports: evidence ledger sheet and read-only form view

**Status:** Stage 5 amendment (task B3). Replaces the thin cell sheet (name, skill, count) with the evidence ledger of prototype card P-02. Follows `V2-CONSISTENCY-cross-page-patterns.md`, `V2-reports-filters.md`, `V2-reports-by-tag.md`. Tags: `[REQ]`, `[OD-n]`, `[PROTO]`, `[PROPOSED]`, `[INFER]`, `[BRIEF]` (design brief), `[GLOSSARY]`.

```
Surface:              Reports > Students tab. Opens from a heat-grid cell (student x skill) and from the Open evidence button
                      on a row of the words-only table (a student). Routes /v2/admin/reports and /v2/director/reports.
                                                                                                Wave: V2 Stage 5 (amendment)
Persona(s) & role:    A. Ross (administrator), Dr. K. Brennan (director). Same screen as V2-05a. Reviewers and students never
                      reach Reports.
Scope / data seen:    Counted evaluations only (AE-01, AR-06), after the report's evidence filters (RP-08). Per row: date,
                      setting (and location), evaluator and role, who recorded it and when, result. The submitted form read
                      only (RP-07): answers or scores, level, feedback, attestation.
                      NEVER read or shown: confidential concern flags or counts (D23 unchanged), reviewer notes, return
                      reasons, evaluations awaiting approval, returned or reopened (not counted, AR-06), other students.
Job-to-be-done:       When a figure in the grid looks wrong, open the evidence behind it, check it against the form the
                      evaluator submitted, and go to the student's full record, without leaving the report.
Why -> So what:       A figure nobody can trace is a figure nobody trusts [REQ RP-05, RP-06; BRIEF section 1 Director]. The
                      header says "3 of 4" and the ledger rows that count are exactly 3, so the director sees which
                      evaluations make the number and which were left out and why. [BRIEF section 3 consistency invariant]
Requirements:         RP-05 (from a figure reach the individual), RP-06 (from a student or skill reach the evidence without
                      searching again), RP-07 (any recorded evaluation viewable in full), RP-08 (ledger follows the location,
                      setting and course filters and says so), RP-09 (a combination with no evidence is explained, not
                      empty), RP-01 (filters stay applied), AE-01 and AR-06 (only completed, counted evidence), AE-03 and
                      AE-04 (four states), SC-11 and SC-12 (lab and simulation never satisfy a clinical setting; the ledger
                      says when simulation was left out), RV-03 and RV-05 (a completed evaluation cannot be edited: the form
                      view has no edit control), SH-02 (every row carries an explicit result)
Open decisions hit:   OD-03 (merge or keep four skill-record states): not decided here. The sheet shows the four states as four
                      counters, so it commits to neither the merged nor the four-way rendering of S-01. OD-29 untouched.
                      OD-10 (export) untouched. RV Q1 (reopen on counted evaluations) untouched: the form view offers no
                      reopen. REQ section 14 out of scope: no remediation action, flag, intervention note or peer ranking.
Prototype reference:  P-02 [PROTO]. KEEP: three-plus counters each with Show these only; a ledger table Date, Setting,
                      Evaluator, Recorded, Result; per row View form opening a second, stacked read-only form; the
                      Recorded and Result semantics. NOT COPIED: the centered 1024 px Dialog container (v2 uses a right
                      Sheet for drill-downs, as the tag sheet and the cell sheet do; component-consistency section 6);
                      three counters (the prototype merges Did not meet and Not started; this sheet keeps the four
                      AE-04 states so OD-03 stays open) [INFER]; the "Counts as evidence" blanket result (replaced by a
                      per-row result that says whether the rule used the evaluation, see below).
[PROPOSED]:           Unit of the ledger: one row per counted evaluation of the student on a skill in view, after the
                      evidence filters, newest first. Header figure: counted of need from heatCell (same as the grid).
                      Reconciliation invariant: the number of rows whose result is "counts" equals the header counted
                      figure, for every cell, and every row is a counted evaluation. Row results (SH-02 vocabulary):
                        counts            Met and used by the rule              pill "Counts toward the figure"
                        not used          Met, left out by the rule             pill "Met, not used by the rule" + reason
                        did not meet      outcome not-met                       pill "Did not meet criteria"
                        feedback only     outcome not-yet                       pill "Not yet, feedback only"
                      Counters (skill-record states for the student across the skills in view, AE-04): Achieved, In
                      progress, Did not meet, Not started. Each has Show these only. At most one is on. It filters the
                      ledger to the skills in that state. A skill filter chip (set when a cell opened the sheet) narrows
                      the ledger to that skill and is removable; the two combine. Not started skills have no evaluation
                      rows; with that counter on, the ledger explains it and names the skills.
Pattern:              Right Sheet (size xl) with a header (title, description, state pill), a counters strip, an active
                      filter strip, the ledger table, and an Open record link. Row button View form opens a DS Dialog
                      stacked above the sheet; closing returns focus to that row's button.
                      Why a Dialog for the form: it is a short-lived read-only view above a Sheet, not a form to fill in;
                      component-consistency section 7 restricts Dialog to confirmations and says "Sheet for forms", and
                      this is neither. Romit's brief for B3 and prototype P-02 (stacked form dialog) decide it [PROTO].
DS mapping:           Sheet, SheetContent size xl, SheetHeader, SheetTitle, SheetDescription (existing cell sheet).
                      Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter (form view).
                      Toggle (variant outline, size sm, aria-pressed) for Show these only. V2Grid (DS DataTable) for the
                      ledger. StatusPill (DS StatusBadge) for results and state. Button variant link/outline size sm/lg.
                      LocalBanner info for empty explanations. Link (next) for Open record via linkTo. No new DS-level
                      component: composition file components/v2/reports/evidence-ledger.tsx.
                      Record links: lib/v2/link-to.ts linkTo (BRIEF section 5.3), the one helper, replacing the hand-built
                      link() in reports-page.tsx.
States:               L  Page-level hydration loading is unchanged (LoadingBlocks). The sheet is built from the in-memory
                         store, so it has no spinner of its own; its body renders only after hydration.
                      E  Empty with explanation: a filter combination that leaves a skill with no counted evaluation says
                         which filters are applied ("No counted evidence for this skill with Setting: Lab. Remove the
                         setting filter to see the rest."). With a counter on and no matching skill, the ledger says
                         which counter and why. Not started counter: "No evidence yet for these skills" and the names.
                      NE No evidence yet (the student has never been evaluated on the skill): "No evaluation has been
                         completed for {skill} yet." with the rule line (what is needed).
                      Er Error: a skill, student or evaluation that no longer exists (removed from the library or the
                         filters changed under an open sheet) shows a warning LocalBanner "This evidence is no longer in
                         view" and a Close button; the sheet never renders blank. The form view for a missing
                         evaluation says "This evaluation is no longer available." Nothing throws.
                      V  Validation: none, nothing is entered.
                      S  Success: none to announce; opening and closing are the feedback.
                      D  Disabled: a counter at 0 is disabled and still shows 0. Reason is the 0 itself.
                      P  Permission: administrator and director only (as the page). The Open record link goes to the
                         role's records route (linkTo).
                      Bl Blocked: concern flags and counts omitted by design.
Edge cases:           Awaiting approval, returned and reopened evaluations are not rows (AE-01, AR-06): the figure and the
                      ledger read the same counted set, so they cannot disagree. A seeded evaluation has no stored form
                      detail: the form view says "Only the outcome was recorded for this evaluation." Paper-form evidence
                      says who entered it. An evaluation with several versions shows the newest and says "Version n of m"
                      with a link to all versions. A student with no skills in view: sheet explains. Simulation left out of
                      the rule: row result "Met, not used by the rule" with "simulation can supply only part of the
                      evaluations" and the SC-12 note that lab and simulation never satisfy a clinical setting.
Copy:                 Title "{student}, {skill}" (cell) or "{student}" (student). Description "{n} of {m} counted
                      evaluations" + " . {left}" when not achieved. Student scope: "{n} skills in view". Counters: Achieved,
                      In progress, Did not meet, Not started. Toggle "Show these only". Table caption "Evidence ledger for
                      {scope}". Columns: Date, Skill (student scope only), Setting, Evaluator, Recorded, Result, Form.
                      Row button "View form". Dialog title "{skill}, {student}", description "{date}, {setting}, {location}".
                      Footer "Close". Link "Open record of {student}". Sentence case. No em dashes. Never "items".
A11y:                 Sheet and Dialog are Radix dialogs: focus trapped, Esc closes only the top layer, titles and
                      descriptions linked. Opening the sheet from a cell returns focus to that cell on close; closing the
                      form returns focus to its View form button. Ledger is a real table (DS DataTable) with a caption
                      and column headers. Toggles expose aria-pressed and a name "Show these only: {state}". Pills carry a
                      word and an icon, never colour alone; no red in score encodings (did not meet is amber). 12 px
                      minimum. Icons aria-hidden, icon-only buttons have aria-label. At 390 px the table scrolls inside
                      its region, counters wrap to two columns, targets 44 px (touch) via DS Button.
Out of scope:         REQ section 14 (remediation actions, flags, intervention notes, peer ranking), export (RP-10),
                      confidential concerns, editing or reopening, viz/*, admin-home, wizard files, seed.ts, refactoring other
                      pages to linkTo.
Acceptance tests:     (1) Reconciliation, unit, three different cells (achieved, in progress, did not meet or not started):
                      rows with result counts equal heatCell.counted; header figure equals heatCell; every row is a counted
                      evaluation of that student and skill. (2) Filters: a setting or location filter narrows rows and the
                      figure together and they still reconcile. (3) Counter buckets sum to the skills in view and Show
                      these only (bucket) narrows the student ledger rows to skills of that state. (4) No concern text or
                      count appears in ledger data (unit, with a concern seeded on the student). (5) linkTo: record route per
                      role (director-verification vs verification), skill, evaluation, review, reports; unsupported role
                      throws (unit). (6) Browser at 1280 and 390: open a heat-grid cell, see the ledger, toggle a counter,
                      open View form, close, focus returns to the row button, close the sheet, focus returns to the cell;
                      axe 0; no horizontal page scroll; stage5, stage1, stage4 and alignment e2e 0 fails; shoot.mjs
                      --no-states /v2/admin/reports full Tab walk clean.
Risks / unknowns:     Four counters instead of the prototype's three keeps OD-03 open; if Romit wants three, merge Did not
                      meet and Not started in one place (counterBuckets). Ledger "Recorded" uses the current version's
                      author and time [INFER]. "Awaiting approval" count is deliberately not shown (AE-01 reads counted
                      evidence only). Mobbin not run (not authenticated in this session); the references are P-02 and
                      the existing tag sheet [INFER].
Vault notes consulted:Same as V2-05a, plus design brief section 3 and 5.3 (consistency invariant, one linkTo helper).
```
