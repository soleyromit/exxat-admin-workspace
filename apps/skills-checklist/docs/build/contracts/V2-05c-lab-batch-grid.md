# V2-05c Lab batch grid (scenario step 14)

**Status:** Stage 5 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Lab batch grid. Route /v2/preceptor/lab-batch-grid (R. Whitmore, no account; the preceptor role in the
                      switcher, opened as the lab instructor). One screen: session details, the grid (students down, skills
                      across), a confirm dialog, and the batches already saved.                    Wave: V2 Stage 5
Persona(s) & role:    R. Whitmore (lab instructor). A preceptor who opens it (?as=pre-delgado) is told lab sessions are
                      recorded by a lab instructor and sees nothing editable.
Scope / data seen:    The cohort roster and the lab-assessable skills (published, with the lab instructor role allowed).
Job-to-be-done:       Record a lab session for twelve students in minutes, with absences handled, so the results appear in
                      each student's record and in reports without re-entry.
Why -> So what:       Lab sign-off is the biggest source of evidence the program controls. If it takes twelve forms, it gets
                      done late or in bulk from memory. A grid makes it a two-minute task at the end of the session. Keeping
                      lab evidence out of the clinical-setting count stops lab volume masking a gap in real placements.
Requirements:         EV-02 (a lab instructor evaluates skills assessed in the lab), EV-05 (several skills recorded in one
                      sitting, each with its own outcome), SC-12 (lab and simulation evidence never satisfies a named
                      clinical setting), ST-05 (the setting of the evidence is recorded), AR-06 (a skill that holds evidence
                      for approval holds the lab result too), AE-01
Open decisions hit:   OD-06 (evaluator roles fixed or program-defined) is not decided: only the existing lab instructor role is
                      used. Whether a lab result needs feedback is the skill's own setting (SC-14), not decided here.
[PROPOSED]:           The grid itself (cells cycle Met, Not met, Not yet, Not recorded); marking a student absent; "Set column to
                      Met"; one save per batch; a saved batch is read-only (completed evaluations are immutable); the lab
                      check-off a Met result adds for skills that require one.
Prototype reference:  None for v2.
Pattern:              Table of buttons: each cell is a DS Button that names its student, skill and state and cycles on press.
                      Absent is a checkbox in the student's row; an absent row is disabled. A count line above the save button
                      says how many results will be saved and how many cells are blank.
DS mapping:           PageFrame/PageSection, Table, Button, Checkbox, Field, Input, RadioGroup, Dialog, LocalBanner, StatusBadge
                      -> IMPORT. Composition: cycle cell (new-components-needed.md).
States:               L  Seed first. E  No lab-assessable skill: "No skill is open for lab sign-off yet" with the reason. Er
                      Save refused (no result recorded; every present student blank): banner names the fix. V  Session name
                      required and at most 80 characters; date required. S  Saved banner with the counts and a link to the
                      students' records. D  Save disabled with the reason while nothing is recorded. P  Blank cells are not
                      saved and are counted in the confirmation. Bl  A non-lab-instructor sees the reason and a read-only
                      list of saved batches.
Edge cases:           Absent students get no evaluation and are listed on the batch as "Absent, not assessed". A student
                      already holding a lab Met for a skill from this batch cannot be saved twice (save is once per batch).
                      A skill that requires approval saves results as "awaiting approval" and says so. Results are stored as
                      lab (or simulation, if the session is chosen as simulation) and carry no clinical setting, so they
                      never count toward a setting minimum; the simulation cap still applies to simulation sessions.
Copy:                 Cell states "Met", "Not met", "Not yet", "Not recorded"; absent "Absent". Button "Save lab session for
                      12 students"; dialog "Save 18 results for 11 students? 3 cells are blank and are not saved. 1 student is
                      absent and gets no result." Status after save: "Saved. 18 results are on the students' records."
A11y:                 Real table with row and column headers; each cell button has a full accessible name ("Priya Raman, Vital
                      signs and early warning score: Not recorded. Press to change to Met."); state is text plus symbol, no
                      colour alone; no red; 44 px targets; at 390 px the grid scrolls inside a labelled region.
Out of scope:         Editing a saved batch (use the evaluation reopen flow), per-cell feedback text and levels, importing a
                      roster, QR check-in, attendance reports, multi-instructor sessions.
Acceptance tests:     tests/v2/lab.test.ts (only a lab instructor saves; absent students get nothing; blank cells are not
                      saved; evaluations are lab and carry no clinical setting; a Met never raises a setting count; approval
                      required skills save awaiting approval; lab check-off added; refused when nothing recorded; progress
                      and reports move). Browser: docs/v2/verify/stage5.e2e.mjs.
Risks / unknowns:     A grid invites quick tapping; the confirm dialog repeats the counts for that reason.
Vault notes consulted:Same as V2-02a.
```
