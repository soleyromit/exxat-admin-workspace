# V2-05d Group check-off (course offering, Skills section)

**Status:** Lab contract, 2026-10-28, rework approved by Romit (replaces the earlier lab-batch-grid variant C, which is retired). Narrows
`00-cross-cutting.md`. Tags: `[REQ]`, `[CALL 10-28]`, `[PROTO]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.
**Sources:** PROTO `~/Downloads/prism-skills-prototype_10282026.html` (Sankalp, 2026-10-28): `GS` (screen), `lt` (eligibility),
`MS` (defaults), `md` (what a tick records), `dd` (why not), `qS` (response written), Configure "Group check-off", evaluation detail
"Recorded by check-off". CALL Granola 655e2cbd-681d-4da7-8b9d-be80cc3a1e76 (Sankalp and Romit, 2026-10-28, Vishakha's use case).
For the stakeholder call with Aarti on 2026-10-29. Updated 2026-10-30 for D-L8d (Romit: "switch").

```
Surface:              Course offering, Skills section: Group check-off. Lab route /lab/course-faculty/offering-checkoff
                      (variants A, B), ?offering=; persona landing /lab/course-faculty. Flow "Record a lab session" =
                      this one step (set 1 Grid = A, set 2 One skill at a time = B); it ends on the grid's own Recorded / In
                      review state and banner (the evaluator Submitted page is not part of it). Staff shell, signed in.
Persona(s) & role:    Course faculty (persona "course-faculty", Romit 2026-10-28; CALL 10-28 Sankalp 27:40: course faculty
                      open their course, Learning Activities, check off). Nav: one row, "My courses", landing on Group
                      check-off for their course. "Recorded by" defaults to Course faculty (lib/lab/terms.ts COURSE_FACULTY);
                      Lab instructor stays only as a "Recorded by" choice [PROTO]. Admin keeps setup (Configure, Course
                      mapping) and Approvals; Course mapping no longer links here.
Open for Aarti:       Whether an administrator can record a check-off on behalf of faculty (in screens.json, not in the UI).
Lab batch grid:       lab-batch-grid A and B (V2-05c, cohort-scoped) are re-homed to the course-faculty persona and taken out of
                      every flow; files and registry entries kept until Romit decides.
Scope / data seen:    One course offering in the current term with students registered (its cohort) and skills mapped (any level,
                      active only). Offerings without both are not offered [PROTO].
Job-to-be-done:       "When I run a skills lab for my course, let me tick off who showed each skill, for the whole group, in one
                      sitting, without students sending me requests." [CALL 10-28]
Why -> So what:       Some programs (Samuel Merritt) do not want students choosing skills in didactic labs. Without this, the
                      work stays on paper and the record misses it.
Requirements:         EV-02 (faculty and lab instructor are evaluators), EV-03 (the program's configuration decides what a tick
                      records), EV-05 (several skills in one sitting), EV-07 (counts now or held for approval, the recorder is
                      told which), AR-01 and AR-06 (held check-offs are in Approvals and excluded until approved), SC-12 (lab and
                      simulation carry no clinical setting), SC-15 (self-evaluation and approval are per-skill steps), SC-16
                      (the skill's roles still apply), ST-05 (setting recorded), CM-01 (offering named), CM-03 (level shown),
                      CM-05 (mapping is expectation: a student may still send a checked-off skill), RV-03 (immutable).
Open decisions hit:   Where this lives (Course > Learning activities, or its own place) [CALL 10-28, not decided]; whether lab
                      or simulation evidence counts the same as rotation evidence beyond SC-12 [CALL 10-28, not decided];
                      OD-06 (evaluator roles fixed or program-defined); D-X27 "Apply to new evidence only" (writes nothing).
Configure (A, B, C):  "Group check-off" group in "Who signs" (components/lab/configure/fields.tsx GroupCheckOffSection): switch
                      "Allow group check-off"; default by model: Met or Unmet ON, levels ON, questions OFF, scores OFF; when on,
                      "A tick records" (levels: a level, default the highest; scores: a score on every item, default the rule's
                      threshold); helper "<Records X>. A check-off writes an ordinary evaluation and is counted by the same
                      achievement rules."; amber notes when the skill has self-evaluation, and for questions or scores ("a tick
                      is a strong claim"). Saved as SkillConfig.checkOff; listed on Check and save and in "What you changed".
Eligibility:          Configured, check-off allowed, simulation allowed for a simulation session, the recorder's role allowed by
                      the skill and qualified (lib/v2/student.ts ineligibleReason, faculty kind mapped to the faculty role).
Grid (A):             Title "{code} {name}, {term}", no subtitle. Date (DatePickerField) and Setting (Select) edited in place
                      (Romit 2026-10-28, "why is this data here?"); Recorded by = the signed-in course faculty member, not
                      shown (on-behalf recording open for Aarti; the data model keeps role and recorder); the course is switched
                      from My courses. One short amber line only when a skill on screen skips the student's self-evaluation.
                      Unavailable skills (D-L8d, 2026-10-30): not grid columns; listed greyed and not selectable, with the
                      reason, in a "Not available (n)" group of the picker (A) and of the skill list (B). Rows: name, then "cohort · group". Search the roster;
                      "Skills shown (6)" searchable picker (Popover + Command; default the first six, mandatory first); legend. Table:
                      students down, chosen available skills across; column head = name, level badge, "Check-offs go to review"
                      in words when the skill needs approval (no clock glyph), and an ⓘ only when a tick records more than a
                      plain Met, whose line names the subject ("A tick marks the student as independent."). Cell (D-L8d): a
                      student who already qualifies shows the status only, glyph + "Already qualifies", no checkbox, and is
                      never written; otherwise one Checkbox, accessible name "Check off {skill} for {student}" plus the flag;
                      the hourglass flag "Evaluation already sent" stays tickable. Legend carries only that flag. 15 rows then
                      "Show 25 more".
One skill (B):        Same session, availability, cells and record bar. Left: searchable list of available skills with "n
                      ticked". Right: the chosen skill's sign-off list; "Already qualifies" in the Tick column in place of a
                      checkbox, "Evaluation already sent" in words per row.
Record:               Sticky bar always present while any skill is available (D-L8d): nothing ticked = quiet line "Tick students
                      to record check-offs" on a disabled Record check-offs; ticked = "N check-offs ready to record" (qualifying
                      cells excluded), the skills that need approval, Clear, Record check-offs. Writes one Evaluation per tick (lib/lab/course-checkoff.ts recordCheckoffs): source
                      "checkoff", sessionId, setting, no clinical setting, outcome met, detail per model (levelIndex, all Yes,
                      scores), status awaiting-approval when the skill requires approval else counted. Cells then read
                      "Recorded" or "In review". Banner "Recorded N check-offs for {name} on {date}. M went to administrator
                      review; the rest count now." [PROTO wording, no em dash]. No confirm dialog [PROTO].
Downstream:           Approvals and review item (all variants): tag "Group check-off", reason "Approval required for {skill}",
                      note, no empty self-evaluation comparison. Student skill detail and record: "Check-off" tag; evaluation
                      sheet: "Recorded in a group check-off on the course offering, not from a student submission...". Student
                      send and log: "Checked off in the skills lab by {name} on {date}. No need to send it." (not a block).
                      Lab-batch-grid A and B (lab instructor, cohort-scoped, V2-05c): the same eligibility rule; their Met or
                      Unmet cells, Absent and feedback stay, because that screen records results, not ticks.
States:               L Skeleton. E "No offering is ready for a check-off..."; nothing available: "No mapped skill can be
                      checked off in this session. An administrator can allow group check-off when configuring a skill." Search
                      empty: "No student matches that search...". S banner. Bl unavailable column greyed with reason.
DS mapping:           PageHeader (PageFrame), Button, Badge, Card, Table, Checkbox, Input, Popover, Command, Collapsible, Dialog,
                      Field, Select, LocalBanner, Skeleton; StickyFooter (lab layout). IMPORT from @exxatdesignux/ui.
A11y:                 Real table, row and column headers; checkbox names say student, skill and flag; glyph + word; no red; 44 px
                      targets under 640 px; the grid scrolls in a labelled region; axe at 1440.
Out of scope:         Editing a recorded check-off (immutable); Unmet ticks; per-skill questions; attendance.
Acceptance:           Browser click-through: Configure C allows group check-off on a question skill -> its column becomes
                      available on the grid -> a qualifying student reads "Already qualifies" with no checkbox -> tick 3+ cells -> Record -> held one in Approvals,
                      labelled -> student skill detail and record show the Check-off tag -> Send shows the done line.
                      Tests: tests/lab/checkoff-approvals.test.ts, tests/lab/checkoff-student.test.tsx, configure-save.
Risks:                D-L8d reverses the prototype's "still tickable": extra evidence for a student who already qualifies goes through Send; a
                      confirm dialog is not in the prototype; the default check-off for levels records the highest level.
```
