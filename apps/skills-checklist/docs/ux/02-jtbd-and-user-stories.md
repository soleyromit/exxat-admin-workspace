# UX 02 — Jobs-to-be-done and User Stories

> **OD numbering:** OD-01..OD-13 come from the requirements document §13. OD-14..OD-24 and OD-P1 are PROPOSALS by this documentation pack (see `docs/source/proposed-ids.txt`), not requirements-document decisions.

Sources and tags follow `docs/README.md` (REQ > CALL > PROTO > INFER). Personas are in `01-personas-and-roles.md`. Surface (S-nn), flow (F-nn) and state-machine (SM-nn) IDs are the shared pack IDs. Waves are the proposed W1–W5 from `docs/build/01-build-plan.md` `[INFER]`.

**Rule for stories that touch an open decision:** the story names the OD and the *seam* (the shape that fits either answer). It never picks an answer. Seams come from `docs/strategy/05-open-decisions.md`.

## 1. Jobs-to-be-done (When / I want / So I can)

| Persona | JTBD | Source |
|---|---|---|
| P-A | When my program already holds a skills list in a document, I want to bring it in without re-typing, so I can see value in minutes instead of days. | `[REQ §3]` |
| P-A | When a skill exists in the library, I want to say how it is evaluated and what achievement requires, so I can be sure the definition can actually be met. | `[REQ §1.5, §4]` |
| P-A | When a course runs across many terms, I want to mark which skills are mandatory for each offering, so students know what is expected on a rotation. | `[REQ §5]` |
| P-A | When I need to know who is behind, I want to move from an aggregate to the individual evidence, so I can act without searching again. | `[REQ §11 intro, RP-05, RP-06]` |
| P-S | When I start a rotation, I want to see the skills expected and my progress, so I know what to work on. | `[REQ ST-01]` |
| P-S | When I have performed skills, I want to send several for evaluation in one go with the right setting and evaluator, so I can get sign-off quickly. | `[REQ ST-04..ST-10]` |
| P-S | When a submission did not count, I want to know which rule failed and what to do next, so I can recover without a remediation workflow. | `[REQ SH-02, SH-03, §14]` |
| P-P | When I receive an evaluation request, I want to complete it from the email without an account, so I can finish in one sitting. | `[REQ EV-01, EV-05]` |
| P-F | When I assess a student, I want to record an outcome against criteria the program set, so I never decide how a skill is evaluated. | `[REQ §7 intro, EV-03]` |
| P-L | When I sign off a lab skill, I want to use only my name and email, so I do not need to become a Prism user. | `[REQ SL-08]` |
| P-R | When evidence awaits approval, I want everything needed to decide on one card, so I can approve or return confidently. | `[REQ AR-01..AR-05]` |

## 2. User stories

Format: **US-group-NN** · persona · wave · surfaces/flows · REQ cited · ODs. Acceptance criteria are Given/When/Then.

### 2.1 Skills library (SL) — wave W1

**US-SL-01** · P-A · W1 · S-04, S-09, F-02 · `SL-01`, `SL-02`
- Given an empty library, When I open the Library, Then no skills, categories or taxonomy are pre-supplied and I can add my own.
- Given I define a skill, When I save, Then it has a name, a description and an active/inactive status.

**US-SL-02** · P-A · W1 · S-04, S-05, S-09 · `SL-03`, `SL-04`, `SL-05`
- Given a skill, When I assign a category, Then at most one is allowed and it is optional.
- Given a skill, When I add tags, Then any number is allowed and a tag may span categories.
- Given I am defining a skill and need a category or tag that does not exist, When I create it inline, Then it is available immediately without leaving the flow.

**US-SL-03** · P-A · W1 · S-04, S-05, F-14 · `SL-06`
- Given a category or tag was deactivated after assignment, When I open a skill that carries it, Then it is still shown, marked inactive, and I can remove it deliberately.
- Given I assign a category or tag, When I open the picker, Then only active ones are offered.

**US-SL-04** · P-A · W1 · S-06 · `SL-07`
- Given the clinical settings list, When I add, rename or deactivate a setting (for example inpatient, emergency, outpatient), Then it is the list used to describe where clinical evidence was gathered.

**US-SL-05** · P-A · W1 · S-07, F-13 · `SL-08`, `SL-09`
- Given a lab instructor, When I record a name and email, Then no Prism account is created and the email is what requests go to.
- Given a student named an instructor who is not recorded, When I open the roster, Then I see that name and can adopt it so the same person does not accumulate several spellings.

**US-SL-06** · P-A · W1 · S-04 · `SL-10`
- Given a large library, When I search or filter by name, category, tag and status, Then the table narrows accordingly and the applied filters are visible.

**US-SL-07** · P-A · W1 · S-04, F-14 · `SL-11`
- Given a skill with recorded evidence, When I deactivate it, Then it is withdrawn from course mapping, student selection and reporting scope, and the evidence already recorded is retained.

### 2.2 Import (IM) — wave W2

**US-IM-01** · P-A · W2 · S-08, F-01 · `IM-01`, `IM-02`, `IM-03`
- Given an existing list in a spreadsheet, document or PDF, When I supply it, Then skills are proposed in bulk without any prescribed template or column order.

**US-IM-02** · P-A · W2 · S-08, F-01 · `IM-04`, `IM-07`
- Given the source includes descriptions, headings or written evaluation questions, When it is interpreted, Then those are proposed as description, category (for headings) and questions, all subject to review.

**US-IM-03** · P-A · W2 · S-08, SM-04 · `IM-05`, `IM-13`
- Given a proposed list, When I review it, Then I can edit, rename, merge, split, discard and add entries before anything is created.
- Given I have not confirmed, When I leave the review, Then no skill, category or configuration exists.

**US-IM-04** · P-A · W2 · S-08 · `IM-06` · **OD-13** (seam: duplicate resolver returns a per-row decision)
- Given a proposed skill matches one in the library, When I review, Then I decide skip, replace or keep both for that row.
- Given the matched skill has evidence, Then the product does not decide the outcome for me (OD-13 open).

**US-IM-05** · P-A · W2 · S-08 · `IM-08`
- Given part of the source could not be interpreted, When I review, Then it is listed with its original text and is never silently dropped.

**US-IM-06** · P-A · W2 · S-04, F-01 · `IM-09`, `IM-10`
- Given skills were imported, When they are created, Then they are marked unconfigured and distinguishable.
- Given an unconfigured skill, When someone tries to map it to an offering or submit against it, Then that is not possible.
- Given a part-configured library, When I open the Library, Then I see how many skills still need configuration and can work through them.

**US-IM-07** · P-A · W2 · S-04, S-08, SM-04 · `IM-11`
- Given I import a second list, When I confirm, Then it is added to the existing library rather than replacing it, and I can tell which skills arrived in which import.

**US-IM-08** · P-A · W2 · S-04, S-09, F-02 · `IM-12`
- Given I do not want to import, When I choose Add skill, Then I can create and configure a single skill by hand.

**US-IM-09** · P-A · W2 · S-09, F-04 · `IM-14`
- Given a configured skill, When I copy its configuration to another skill or apply it to several selected skills, Then the targets carry that configuration and remain editable.

**US-IM-10** · P-A · W2 · S-08 · `IM-15` · **OD-12** (seam: import schema carries an optional proposed-questions list)
- Given interpretation, When it proposes anything beyond name, description and grouping, Then that proposal is presented only as a draft; whether it should propose an evaluation model and criteria at all is open (OD-12).

### 2.3 Skill configuration (SC) — wave W1

**US-SC-01** · P-A · W1 · S-09, SM-01, F-03 · `SC-01`, `SC-02`
- Given a created skill, When I leave it without configuring, Then it exists in the library as unconfigured.
- Given I configure it, When I choose a model, Then exactly one of the four models is chosen explicitly and no model is preselected; the skill cannot be put into use without one.

**US-SC-02** · P-A · W1 · S-09 · `SC-03`
- Given the binary model, When I define two outcome labels, Then both are required and must differ, and I record which label qualifies (Met/Unmet by default for the labels, not for the model).

**US-SC-03** · P-A · W1 · S-09 · `SC-04`, `SC-05`, `SC-06`
- Given the question model, When I define questions, Then I choose whether qualification needs all Yes, at least N of M Yes, or a named subset Yes.
- Given a named subset, When it is empty, Then I cannot save; and with a large question set the picker remains usable.

**US-SC-04** · P-A · W1 · S-09 · `SC-07`
- Given the scored model, When I configure the scale and rule, Then qualification is by average across questions, a minimum on every question, or a total.

**US-SC-05** · P-A · W1 · S-09 · `SC-08`, `SC-10`
- Given the demonstration model, When I define levels, Then they are program-defined and ordered with no fixed three-point scale.
- Given I set criteria, When I enter a total number of demonstrations and a minimum at each level, Then both are saved.

**US-SC-06** · P-A · W1 · S-09 · `SC-09`
- Given a skill already configured, When I change its model, Then the criteria are rebuilt rather than left contradictory, and I am told what changed.

**US-SC-07** · P-A · W1 · S-09 · `SC-11`, `SC-12`
- Given any model, When I require evidence from named clinical settings, Then each setting carries its own minimum and is counted per setting, not as one clinical total.
- Given lab or simulation evidence, Then it never satisfies a clinical setting requirement.

**US-SC-08** · P-A · W1 · S-09 · `SC-13` · **OD-04** (seam: reusable submission-field set referenced by a skill)
- Given a skill, When I define what the student supplies, Then each field has a label, a data type (date, short text, long text, number, choice list) and a mandatory flag, separate from the model and the evaluator's responses.

**US-SC-09** · P-A · W1 · S-09 · `SC-14`
- Given a skill, When I set evaluator narrative feedback, Then it is capturable on every evaluation and I choose per skill whether it is mandatory.

**US-SC-10** · P-A · W1 · S-09 · `SC-15`, `SC-16` · **OD-06** (seam: roles stored as data, three seeded)
- Given a skill, When I enable student self-evaluation and/or administrator approval, Then each applies to that skill only.
- Given a lab-only skill, When I restrict which evaluator roles may sign off, Then students can only send it to an allowed role.

**US-SC-11** · P-A · W1 · S-09 · `SC-17`, `SC-18`, `SC-19`
- Given I configure a skill, When I move through model, evidence, rule and criteria, Then the dependency between them is apparent.
- Given an unsatisfiable configuration (unlabelled or duplicated questions or levels, an empty subset rule, minimums exceeding the total), When I try to save, Then I cannot, and I am told why.
- Given a complete configuration, When I review before use, Then I see everything it will ask of the student and the evaluator, together.

### 2.4 Course mapping (CM) — wave W2

**US-CM-01** · P-A · W2 · S-10, F-05 · `CM-01`, `CM-02`
- Given course offerings identified by code, name, term, academic year, professional year and cohorts, When I search or filter by cohort, term, academic year and professional year, Then I locate the offering.

**US-CM-02** · P-A · W2 · S-10, F-05 · `CM-03`, `CM-04`, `CM-06`
- Given an offering, When I map a skill, Then I mark it mandatory or non-mandatory for that offering, and the same skill may differ between offerings.
- Given any offering, Then I see how many skills are mapped and how many are mandatory.

**US-CM-03** · P-A, P-S · W2 · S-10, S-12 · `CM-05`, `CM-07`
- Given a skill not mapped to a student's course, When the student submits it, Then it is accepted and counts toward their record.
- Given a student's one record per skill, Then evidence gathered on any course counts toward it.

**US-CM-04** · P-A · W2 · S-10 · `CM-08` · **OD-01** (seam: map keyed by offering with an optional catalogue-level default layer)
- Given a new term, When I open its offerings, Then I can map per offering; whether mappings carry forward is open (OD-01).

### 2.5 Student submission (ST) — wave W3

**US-ST-01** · P-S · W3 · S-12 · `ST-01`, `ST-03`
- Given I open a course, When the page loads, Then I see the skills expected, which are mandatory, and my progress on each.
- Given many skills, When I isolate those I have already submitted, Then earlier submissions remain findable.

**US-ST-02** · P-S · W3 · S-12 · `ST-02`
- Given a skill not mapped to my course, When I choose it, Then I can submit it.

**US-ST-03** · P-S · W3 · S-12, S-13, F-06 · `ST-04`
- Given several skills, When I select them, Then I can submit them together in one request.

**US-ST-04** · P-S · W3 · S-13 · `ST-05`, `ST-06`, `ST-07`
- Given a submission, When I send it, Then it records clinical, or lab or simulation.
- Given clinical, When my placement offers a single setting, Then it is inferred; when it offers several, I choose among them and the location is recorded alongside.
- Given no placement is recorded for the course, Then I can still submit, drawing on the program's full list of settings.

**US-ST-05** · P-S · W3 · S-13 · `ST-08`, `ST-09`
- Given a setting and the roles a skill permits, When I choose an evaluator role, Then only valid roles are offered.
- Given no valid combination exists, Then I am told why rather than left with no options.
- Given a lab instructor who is not recorded, When I name them with an email, Then the request can reach them.

**US-ST-06** · P-S · W3 · S-13 · `ST-10`, `ST-11`, `ST-12`
- Given required submission details, When any mandatory one is missing, Then I cannot send.
- Given a skill configured for self-evaluation, When I send, Then I first record my self-evaluation against the same criteria the evaluator will use.
- Given I add a note, Then at most one narrative note is kept per submission, distinct from the evaluator's comment.

**US-ST-07** · P-S · W3 · S-13 · `ST-13`
- Given I send, When it succeeds, Then I get confirmation of what was submitted, to whom, in what role, and in which setting and location.

**US-ST-08** · P-S · W3 · S-13 · `ST-14` · **OD-07** (seam: setting and location on each submission item with a default copied from the submission)
- Given a batch spanning several settings, When I submit, Then the capture level (per submission or per skill) is open (OD-07).

### 2.6 Evaluator (EV) — wave W3

**US-EV-01** · P-P, P-F, P-L · W3 · S-16, S-18, F-07 · `EV-01`, `EV-02`
- Given a request, When the evaluator opens the emailed link, Then the form opens directly with no login and no account is created.
- Given where the skill was performed, Then the valid evaluator kinds are preceptor, program faculty, lab instructor.

**US-EV-02** · P-P, P-F, P-L · W3 · S-16 · `EV-03`, `EV-04`
- Given the form, When it opens, Then the evaluator sees what the program configured and cannot alter how the skill is evaluated.
- Given the student supplied details, and a self-evaluation where one exists, Then they are shown as context.

**US-EV-03** · P-P, P-F, P-L · W3 · S-16 · `EV-05`, `EV-06`
- Given several skills sent together, When the evaluator completes them in one sitting, Then each has its own outcome and feedback.
- Given feedback is mandatory for a skill, When it is blank, Then the evaluation cannot be submitted.

**US-EV-04** · P-P, P-F, P-L · W3 · S-16 · `EV-07`
- Given the evaluator submits, When the skill's configuration is evidence-counts-immediately or held-for-approval, Then the evaluator is told which applies.

**US-EV-05** · P-A · W3 · S-16, S-09 · `EV-08` · **OD-06** (seam: roles as data rows)
- Given the three evaluator kinds, Then whether roles are a fixed set or program-defined is open (OD-06).

### 2.7 Administrator review (AR) — wave W4

**US-AR-01** · P-R · W4 · S-11, F-08 · `AR-01`, `AR-02`, `AR-03`
- Given evaluations awaiting approval, When I open the queue, Then I see student, skill, course, setting, location, evaluator and role.
- Given a self-evaluation exists, Then the student's and the evaluator's assessments are side by side with whether they agreed.
- Given an evaluation, Then I can examine the full set of responses, not only a summary.

**US-AR-02** · P-R · W4 · S-11, F-08 · `AR-04`, `AR-05`, `AR-06` · **OD-16** (proposed; seam: return target recorded on the return event)
- Given an evaluation, When I write a note, Then it is retained with the evaluation.
- Given I approve, Then it counts; given I return, Then it goes back for correction and does not count. Who corrects after a return is open (OD-16, proposed).
- Given evidence awaiting approval, Then it is excluded from achievement calculations until approved.

### 2.8 Revision (RV) — wave W4

**US-RV-01** · P-S · W4 · S-14, F-09, SM-02 · `RV-01`, `RV-02`
- Given a submission returned to me or not yet assessed, When I correct and resend, Then it continues the same record and keeps an auditable revision count and the reason it was returned.

**US-RV-02** · P-S · W4 · S-14, F-10 · `RV-03`
- Given a completed evaluation, When it did not meet criteria, Then it cannot be edited; I make a further attempt, recorded separately, and the original stays intact.

**US-RV-03** · P-S · W4 · S-14, F-09, F-10 · `RV-04`, `RV-05`
- Given either path, When the original evaluator is no longer available, Then I can send it to a different evaluator.
- Given an evaluation that has counted or awaits approval, Then it cannot be edited or resent.

**US-RV-04** · P-S, P-P · W4 · S-14, S-16 · `RV-06` · **OD-08** (seam: prior evaluation kept as an immutable snapshot)
- Given a corrected submission, Then whether the evaluator starts afresh or sees previous answers is open (OD-08).

### 2.9 Student history (SH) — wave W3

**US-SH-01** · P-S · W3 · S-14 · `SH-01`, `SH-02`
- Given a skill, When I open its history, Then every submission is shown in order, identified by attempt, each with an explicit outcome: counted, did not meet the criteria, returned, or waiting (naming who it is with).

**US-SH-02** · P-S · W3 · S-14 · `SH-03`
- Given a submission that did not meet the criteria, Then the rule it failed is stated in terms I can act on.

**US-SH-03** · P-S · W3 · S-12, S-14 · `SH-04`, `SH-05`
- Given a skill, Then I see how many submissions counted, are outstanding and were returned.
- Given a skill requiring evidence from named settings, Then I see my progress against each.

**US-SH-04** · P-S · W3 · S-14, S-15 · `SH-06`, `SH-07`
- Given evidence counts across courses, When I open a skill, Then the record covers every course with the ability to narrow to one.
- Given a completed evaluation, Then I can see the evaluator's responses and feedback in full.

### 2.10 Reporting (RP) — wave W5

**US-RP-01** · P-A · W5 · S-01, F-11 · `RP-01`
- Given reporting, When I filter by cohort, group, clinical course, category, tag, location and setting, Then what is applied is evident and each filter can be removed on its own.

**US-RP-02** · P-A · W5 · S-01 · `RP-02`, `RP-03`, `RP-04`
- Given attainment by student, Then I see achieved, in progress, not met and overall attainment.
- Given attainment by skill, Then I see how the population performs and, when scoped to a course, whether the skill is mandatory.
- Given attainment by tag, Then the report states that figures overlap because a skill may carry several tags.

**US-RP-03** · P-A · W5 · S-01, S-02, S-03, F-11 · `RP-05`, `RP-06`, `RP-07`
- Given any aggregate figure, When I select it, Then I reach the individuals behind it.
- Given a student or a skill, Then I reach the underlying evidence without leaving the report.
- Given a recorded evaluation, Then I can view it in full: which questions were Yes, scores, feedback and student-supplied details, not a summary such as "9 of 12".

**US-RP-04** · P-A · W5 · S-01 · `RP-08`, `RP-09`
- Given a location or setting filter, Then only evidence gathered there counts and progress is recalculated.
- Given a combination that cannot produce evidence (a location that does not offer the chosen setting), Then I am told why instead of seeing an empty result.

**US-RP-05** · P-A · W5 · S-17, F-12 · `RP-10`
- Given reports, When I export, Then I can export the aggregate view and a row-per-evaluation detail carrying feedback, settings, locations, self-evaluations and review notes.
- Given a filtered view, Then the export covers the full filtered scope and records the filters that produced it.

**US-RP-06** · P-A · W5 · S-17 · `RP-11` · **OD-10** (seam: tabular rows plus a format adapter)
- Given export, Then whether CSV suffices or a native Excel workbook is required is open (OD-10).

### 2.11 Achievement engine (AE) — wave W1 (cross-cutting)

**US-AE-01** · system · W1 · SM-03 · `AE-01`, `AE-03`
- Given a student's evidence, Then only completed evidence counts; anything awaiting self-evaluation, evaluator or approval does not.
- Given a skill, Then it is achieved only when every criterion is met: required qualifying counts or demonstrations, per-level minimums, and clinical setting minimums.

**US-AE-02** · system · W1 · SM-03 · `AE-02`
- Given an evaluation already recorded, When the skill's rule changes, Then whether it qualifies is determined by the current rule, so the change re-applies to evidence already held.

**US-AE-03** · system · W1 · SM-03 · `AE-04`, `AE-08` · **OD-03** (seam: four-state enum stored; display collapsed or expanded)
- Given a skill record, Then four states are distinguished: no evidence yet; evidence exists but none qualifies; some qualifying evidence with criteria not yet met; achieved.
- Given reporting, Then whether the first two are shown separately is open (OD-03).

**US-AE-04** · system · W1 · SM-03 · `AE-05`
- Given a student, Then there is one record per skill, shared across courses.

**US-AE-05** · system · W1 · S-09 · `AE-06`, `AE-07`
- Given I rename a response label, level or question text, Then what was recorded and whether existing evidence counts do not change.
- Given I remove a question or level, Then it is removed from any rule that referenced it so no requirement points at something that no longer exists.

## 3. Stories by wave

| Wave | Stories |
|---|---|
| W1 Engine + library + configure | US-SL-01..07, US-SC-01..11, US-AE-01..05 |
| W2 Import + mapping | US-IM-01..10, US-CM-01..04 |
| W3 Student + evaluator | US-ST-01..08, US-EV-01..05, US-SH-01..04 |
| W4 Review + revision | US-AR-01..02, US-RV-01..04 |
| W5 Reporting + export | US-RP-01..06 |

## 4. Stories that depend on an open decision

| Story | OD | Seam |
|---|---|---|
| US-IM-04 | OD-13 | duplicate resolver returns a per-row decision |
| US-IM-10 | OD-12 | import schema carries an optional proposed-questions list |
| US-SC-08 | OD-04 | reusable submission-field set referenced by a skill |
| US-SC-10, US-EV-05 | OD-06 | roles as data rows |
| US-CM-04 | OD-01 | map keyed by offering plus optional catalogue default |
| US-ST-08 | OD-07 | setting and location on item with default from submission |
| US-AR-02 | OD-16 (proposed) | return target recorded on the event |
| US-RV-04 | OD-08 | prior evaluation kept as immutable snapshot |
| US-AE-03 | OD-03 | four-state enum stored; display configurable |
| US-RP-06 | OD-10 | tabular rows plus format adapter |

OD-02, OD-05, OD-09, OD-11 do not gate a story here; they are seams in `05-open-decisions.md`.


## 5. Coverage proof (generated from the story headers; every non-OD requirement ID)

113 requirement IDs in `docs/source/requirements.extracted.txt`; 113 cited by at least one story; uncovered: none.

| REQ ID | Stories |
|---|---|
| SL-01 | US-SL-01 |
| SL-02 | US-SL-01 |
| SL-03 | US-SL-02 |
| SL-04 | US-SL-02 |
| SL-05 | US-SL-02 |
| SL-06 | US-SL-03 |
| SL-07 | US-SL-04 |
| SL-08 | US-SL-05 |
| SL-09 | US-SL-05 |
| SL-10 | US-SL-06 |
| SL-11 | US-SL-07 |
| IM-01 | US-IM-01 |
| IM-02 | US-IM-01 |
| IM-03 | US-IM-01 |
| IM-04 | US-IM-02 |
| IM-05 | US-IM-03 |
| IM-06 | US-IM-04 |
| IM-07 | US-IM-02 |
| IM-08 | US-IM-05 |
| IM-09 | US-IM-06 |
| IM-10 | US-IM-06 |
| IM-11 | US-IM-07 |
| IM-12 | US-IM-08 |
| IM-13 | US-IM-03 |
| IM-14 | US-IM-09 |
| IM-15 | US-IM-10 |
| SC-01 | US-SC-01 |
| SC-02 | US-SC-01 |
| SC-03 | US-SC-02 |
| SC-04 | US-SC-03 |
| SC-05 | US-SC-03 |
| SC-06 | US-SC-03 |
| SC-07 | US-SC-04 |
| SC-08 | US-SC-05 |
| SC-09 | US-SC-06 |
| SC-10 | US-SC-05 |
| SC-11 | US-SC-07 |
| SC-12 | US-SC-07 |
| SC-13 | US-SC-08 |
| SC-14 | US-SC-09 |
| SC-15 | US-SC-10 |
| SC-16 | US-SC-10 |
| SC-17 | US-SC-11 |
| SC-18 | US-SC-11 |
| SC-19 | US-SC-11 |
| CM-01 | US-CM-01 |
| CM-02 | US-CM-01 |
| CM-03 | US-CM-02 |
| CM-04 | US-CM-02 |
| CM-05 | US-CM-03 |
| CM-06 | US-CM-02 |
| CM-07 | US-CM-03 |
| CM-08 | US-CM-04 |
| ST-01 | US-ST-01 |
| ST-02 | US-ST-02 |
| ST-03 | US-ST-01 |
| ST-04 | US-ST-03 |
| ST-05 | US-ST-04 |
| ST-06 | US-ST-04 |
| ST-07 | US-ST-04 |
| ST-08 | US-ST-05 |
| ST-09 | US-ST-05 |
| ST-10 | US-ST-06 |
| ST-11 | US-ST-06 |
| ST-12 | US-ST-06 |
| ST-13 | US-ST-07 |
| ST-14 | US-ST-08 |
| EV-01 | US-EV-01 |
| EV-02 | US-EV-01 |
| EV-03 | US-EV-02 |
| EV-04 | US-EV-02 |
| EV-05 | US-EV-03 |
| EV-06 | US-EV-03 |
| EV-07 | US-EV-04 |
| EV-08 | US-EV-05 |
| AR-01 | US-AR-01 |
| AR-02 | US-AR-01 |
| AR-03 | US-AR-01 |
| AR-04 | US-AR-02 |
| AR-05 | US-AR-02 |
| AR-06 | US-AR-02 |
| RV-01 | US-RV-01 |
| RV-02 | US-RV-01 |
| RV-03 | US-RV-02 |
| RV-04 | US-RV-03 |
| RV-05 | US-RV-03 |
| RV-06 | US-RV-04 |
| SH-01 | US-SH-01 |
| SH-02 | US-SH-01 |
| SH-03 | US-SH-02 |
| SH-04 | US-SH-03 |
| SH-05 | US-SH-03 |
| SH-06 | US-SH-04 |
| SH-07 | US-SH-04 |
| RP-01 | US-RP-01 |
| RP-02 | US-RP-02 |
| RP-03 | US-RP-02 |
| RP-04 | US-RP-02 |
| RP-05 | US-RP-03 |
| RP-06 | US-RP-03 |
| RP-07 | US-RP-03 |
| RP-08 | US-RP-04 |
| RP-09 | US-RP-04 |
| RP-10 | US-RP-05 |
| RP-11 | US-RP-06 |
| AE-01 | US-AE-01 |
| AE-02 | US-AE-02 |
| AE-03 | US-AE-01 |
| AE-04 | US-AE-03 |
| AE-05 | US-AE-04 |
| AE-06 | US-AE-05 |
| AE-07 | US-AE-05 |
| AE-08 | US-AE-03 |
