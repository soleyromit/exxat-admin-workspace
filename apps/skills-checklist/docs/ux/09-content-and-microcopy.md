# 09 — Content and Microcopy

**Hat:** UX writer. Surfaces S-01..S-18, flows F-01..F-14, personas P-A, P-S, P-P, P-F, P-L, P-R (registry in `docs/ux/06-service-blueprint.md`).
Tags per `docs/README.md`. **All strings below are proposals** `[INFER]` unless a REQ/PROTO source is shown. `{braces}` are variables. Copy that depends on an open decision is marked **⚑ OD-n (neutral)**: it avoids stating the undecided behaviour, or offers a flagged alternative.

## 1. Voice and tone rules

| Rule | Detail | Source |
|---|---|---|
| Professional, plain, calm | Clinical education audience; no jokes, no exclamation marks, no colloquialisms | memory: professional microcopy standard |
| Sentence case | Titles, buttons, labels, column headers, tabs. Proper nouns only capitalised (Prism, names of programs) | better-writing; workspace |
| **No em-dashes** in UI copy | Use a full stop, comma or colon. Prototype copy uses em-dashes; do not copy that | memory: professional microcopy standard |
| Text-only action buttons | No icons on action/CTA buttons. Icon-only controls need `aria-label` and a tooltip | memory: no icons on action buttons; CLAUDE.md |
| Verb + object on buttons | "Send for review", "Create skills", not "Submit" or "OK". One filled primary per surface | better-writing |
| No toast | Product feedback uses `LocalBanner`: success, error, info | CLAUDE.md |
| Never render internal notes, stakeholder names or requirement IDs in UI | No "per Sankalp", no "SC-09", no OD text | memory: no internal notes in UI copy |
| **No claims about import accuracy** | Never "AI-powered", "smart", "we understood your list", accuracy figures or percentages. Say what was found and what was not, and that nothing is created until confirmed. **Amended 2026-10-08** (the optional AI reading is built): the word "AI" may appear only to disclose that the list text is sent to an AI service (switch label, its disclosure sentence, the fallback and info notices in `lib/copy/import-ai.ts`), never with "smart", "automatically understood" or "powered by" `[INFER, needs Romit's confirmation]` | `[REQ IM-13]`, `[REQ IM-05]` |
| Neutral on undecided behaviour | Do not state whether a correction clears the evaluator's answers, whether setting is per skill, whether no-evidence and not-qualifying are merged, etc. until the OD is decided | OD-03, 07, 08 |
| Say the rule, not the verdict | A negative outcome always states the rule that was not met and what the student can do | `[REQ SH-03]` |
| Evaluator copy is shorter than student copy | Preceptors are busy; one instruction per screen `[INFER from persona]` | exxat-domain-context P3 |
| Colour is never the only signal | Status copy must stand alone without colour; no red in score or rating text treatments | WCAG 1.4.1; memory: Aarti no red |
| No nursing-specific wording in product strings | The product serves other disciplines `[REQ §1.6]`. Examples in help text use neutral placeholders | `[REQ §1.6]` |
| Do not imply Prism supplies skills | Empty states state that the program defines its skills | `[REQ SL-01, §1.7]` |

## 2. Glossary (use these terms exactly)

| Term | Definition (as used in UI) | **Use** | **Avoid** | Source |
|---|---|---|---|---|
| Skill | A practice-based thing a student can be watched doing; narrower than a competency. Program-defined | skill | task, procedure, checkbox, item, competency | `[REQ §1.1]` |
| Skills library | The program's list of skills | skills library, library | catalogue, taxonomy, standard list | `[REQ SL-01]` |
| Category | Optional grouping; a skill has at most one | category | folder, group, section | `[REQ SL-03]` |
| Tag | Optional cross-cutting label; any number per skill | tag | label, keyword | `[REQ SL-04]` |
| Clinical setting | Where clinical evidence was gathered (for example inpatient, emergency, outpatient) | clinical setting | unit type, department, location (location is a separate field) | `[REQ SL-07]` |
| Location | The specific site where evidence was gathered | location | site (unless the program uses it), facility | `[REQ ST-06]` |
| Lab / simulation | Evidence performed outside a clinical setting | lab or simulation | practice room, skills lab | `[REQ ST-05]` |
| Lab instructor | Person who assesses lab evidence; not a Prism user | lab instructor | technician, TA, proctor | `[REQ SL-08]` |
| Preceptor | Evaluator at the placement site | preceptor | supervisor, mentor, provider | `[REQ EV-02]`, exxat-domain-context |
| Clinical faculty | Program faculty evaluator | clinical faculty | professor, instructor (reserved for lab instructor) | `[REQ EV-02]`; prototype label "Clinical Faculty" |
| Evaluator | Generic term for preceptor, clinical faculty or lab instructor | evaluator | rater, grader, assessor | `[REQ §7]` |
| Reviewer | Administrator who approves or returns an evaluation | reviewer (in context of approval) | approver, moderator | `[REQ §8]` |
| Evaluation model | How a skill is evaluated | evaluation model | form type, template | `[REQ §4.1]` |
| Overall Binary Outcome | One outcome, two program-defined labels (default Met/Unmet) | Overall binary outcome | pass/fail model | `[REQ §4.1, SC-03]` |
| Question-Level Qualitative | Yes or No per program question | Question-level qualitative | checklist model | `[REQ §4.1]` |
| Scored / Likert | Score per question on a program scale | Scored / Likert | rating model | `[REQ §4.1]` |
| Demonstration-Level Outcome | Level of supervision per demonstration | Demonstration-level outcome | independence model | `[REQ §4.1]` |
| Qualification rule | When a single evaluation counts as evidence | when an evaluation qualifies | pass mark, threshold (except where a numeric score threshold is literal) | `[REQ SC-05, SC-07]` |
| Qualifying evaluation | A completed evaluation that satisfies the qualification rule | qualifying evaluation | passing evaluation, successful attempt | `[REQ §4.1, PROTO]` |
| Achievement criteria | What must be true for the skill to be achieved | achievement criteria | requirements (reserved for REQ), completion rules | `[REQ AE-03]` |
| Demonstration | One observed performance in a demonstration model | demonstration | rep, attempt (attempt means a submission) | `[REQ SC-10]` |
| Level | A program-defined supervision level | level | rating, grade | `[REQ SC-08]` |
| Mandatory / non-mandatory | Requirement level of a skill in an offering | mandatory, non-mandatory | required/optional, recommended (call word), core | `[REQ CM-03]`; C-3 in `strategy/07` |
| Course offering | A course in a term, year and cohort | offering | section, class | `[REQ CM-01]` |
| Evidence | A completed evaluation recorded against a skill | evidence | proof, record entry | `[REQ AE-01]` |
| Submission | What a student sends for review | submission, request (to evaluator) | ticket, form | `[REQ §6]` |
| Attempt | A separate submission after a completed evaluation did not meet criteria | attempt | try, retake | `[REQ RV-03, SH-01]` |
| Revision | A correction of the same submission | revision, revise and resend | edit, resubmit | `[REQ RV-01, RV-02]` |
| Counted | Evidence that counts toward achievement | counted | accepted, approved (approved is reserved for reviewer action) | `[REQ SH-02]` |
| Did not meet criteria | Outcome of ONE completed evaluation that does not qualify (per-submission outcome only). The skill-record status for the same situation is "Evidence does not qualify" | did not meet criteria | failed, rejected, unsuccessful; never use it as a skill-record status | `[REQ SH-02]` |
| Evidence does not qualify | Skill-record status (AE-04 state 2): evidence exists but none qualifies under the current rule | evidence does not qualify | did not meet criteria (reserved for a submission), failed | `[REQ AE-04]` `[INFER label]` |
| Returned | Sent back by a reviewer for correction | returned | rejected, denied | `[REQ SH-02, AR-05]` |
| Waiting | Not yet assessed, or awaiting approval; always say with whom | waiting with {name} | pending, in limbo | `[REQ SH-02]` |
| Needs configuration | Skill created but not yet configured | needs configuration | draft, incomplete, inactive | `[REQ IM-09, IM-10]` |
| Self-evaluation | Student's own assessment against the same criteria | self-evaluation | self-rating, self-assessment | `[REQ ST-11]` |
| No evidence yet / Evidence does not qualify / In progress / Achieved | The four skill-record states of AE-04; prototype uses Not started / In progress / Achieved and merges the first two into "Not met" (OD-03 OPEN, one display flag) | see §4 | colour-only status | `[REQ AE-04]`, `[PROTO]` |

## 3. Shared patterns

### 3.1 Buttons (text only)

| Context | Label |
|---|---|
| Primary create | Create skill · Create {n} skills · Save skill · Send for review · Send request · Submit evaluation · Approve · Add to roster |
| Secondary | Cancel · Back · Continue · Dismiss · Clear · Clear filters · Show these only |
| Return | Return for correction ⚑ OD-16 (recipient undecided; prototype says "Return to preceptor", do not copy) |
| Destructive/irreversible | None in v1 except deactivate: Deactivate skill (confirm dialog, see S-04) |
| Revise | Revise and resend (action on a returned or unassessed item) · Resend (the single filled primary inside the revise sheet) |
| Further attempt | Make a further attempt |

### 3.2 Banners (LocalBanner, not toast)

| Variant | Pattern |
|---|---|
| Success | "{Object} {past tense verb}." One sentence, optional next action link |
| Error | "{What failed}. {What to do}." |
| Info | "{Fact}. {Consequence}." |

### 3.3 Validation message template

`{Field} {problem}. {How to fix}.` Sentence case, no blame, placed under the field, `aria-describedby`. A summary banner appears when several errors exist (workspace state catalogue).

## 4. Skill status and four-state labels

REQ requires four distinguishable states `[REQ AE-04]`. Whether reports merge the first two is **⚑ OD-03**; labels below exist in both a four-state and a collapsed form so either can ship.

| State `[REQ AE-04]` | Label (four-state) | Label if merged ⚑ OD-03 | Helper text |
|---|---|---|---|
| No evidence yet | No evidence yet | Not met | You have no completed evaluations for this skill. |
| Evidence exists, none qualifies | Evidence does not qualify | Not met | You have completed evaluations, but none qualify under this skill's current rule. |
| Some qualifying evidence, criteria not yet met | In progress | In progress | {n} of {N} qualifying evaluations so far. |
| Achieved | Achieved | Achieved | All criteria for this skill are met. |

Status is always text, never colour alone. Prototype uses "Not started / In progress / Achieved" `[PROTO]`; this pack uses "No evidence yet" for state 1 so it is not confused with a skill that was never mapped.

## 5. Microcopy by surface

Format: **Element** → copy. Source tags show what the copy implements.

### S-01 Overview (P-A)

| Element | Copy |
|---|---|
| Page title | Overview |
| Subtitle | Skills attainment by student, by skill and by tag |
| Filter summary (none applied) | Showing all students and skills in scope |
| Filter summary (applied) | Showing {n} students in {cohort}, {group}, {course} |
| Chip | {Filter label}: {value} with accessible name "Remove filter {label} {value}" `[RP-01]` |
| Tabs | By student · By skill · By tag |
| KPI labels (prototype choices, not REQ) | Students in view · Average skills achieved · Students achieving all skills in scope · Skills needing attention |
| Search placeholder | Search students |
| Sort | Highest attainment · Lowest attainment · Name (A to Z) |
| Column headers (student) ⚑ OPEN OD-03, one display flag | A four: Student · Cohort and group · Achieved · In progress · Evidence does not qualify · No evidence yet · Attainment. B merged: Student · Cohort and group · Achieved · In progress · Not met · Attainment |
| Tag-report note | Counts are student-skill records. A skill with several tags is counted under each tag, so these rows overlap. `[RP-04]` |
| Skill-report note | The percentage counts every student in view. Filter by clinical course to limit it to students whose course expects the skill. `[PROTO]` |
| Load more | Show 25 more |
| Empty (no students) | No students match these filters. Clear filters to see everyone in scope. |
| Empty (no skills configured) | No configured skills yet. Configure skills in the library to see attainment here. |
| Error | Attainment could not be loaded. Try again. |
| Impossible filter `[RP-09]` | No evidence can match this combination. {Location} does not offer {setting}. Choose a different setting or location. |
| Location/setting filter helper `[RP-08]` | Filtering by location or setting counts only evidence gathered there, and recalculates progress. |

### S-02 Student drill-down (P-A)

| Element | Copy |
|---|---|
| Heading | {Student name} |
| Subline | {Cohort}, {group}. {n} of {N} skills achieved |
| Counters ⚑ OPEN OD-03 (same flag) | A: Achieved · In progress · Evidence does not qualify · No evidence yet. B: Achieved · In progress · Not met. Each with link "Show these only" |
| Skill row | {Skill}. {Model}. Needs {criteria summary}. {x} of {y} {unit} |
| Close | Close |
| Empty | No skills are in scope for this student with the current filters. |

### S-03 Evidence ledger and evaluation detail (P-A, P-S)

| Element | Copy |
|---|---|
| Ledger heading | Evidence for {skill} |
| Level breakdown | {Level}: {have} of {min} |
| Columns | Date · Setting · Location · Evaluator · Recorded · Result |
| Result values | Counted · Did not meet criteria · Waiting for approval · Returned (same words as the student-facing SH-02 outcomes; one vocabulary for the same meaning) |
| Row action | View evaluation |
| Detail heading | {Skill}, {student} |
| Detail subline | {Date}. {Clinical (setting) or Lab or simulation}. {Location}. {Course} |
| Sections | Supplied by the student · {Evaluator role} responses · Comment · Self-evaluation · Review note |
| No comment | No comment was recorded. |
| Close | Close |

### S-04 Library: skills list (P-A)

| Element | Copy |
|---|---|
| Page title | Skills library |
| Subtitle | The program's skills, plus the categories, tags and settings that organise them `[PROTO]` |
| Tabs | Skills ({n}) · Categories ({n}) · Tags ({n}) · Clinical settings ({n}) · Lab instructors ({n}) |
| Search | Search skills |
| Filters | All categories · No category · All tags · All statuses · Active · Needs configuration · Inactive · Import batch (All imports · Import {n}, {date}) `[IM-11]` |
| Import batch tag on a row | From import {n} `[IM-11]` |
| Buttons | Import · Add skill |
| Columns | Skill · Category · Evaluation model · Achievement criteria · Courses · Status |
| Row action | Edit · Configure (when unconfigured) |
| Unconfigured row | Not configured. This skill cannot be mapped to a course or submitted until it is configured. `[IM-09]` |
| Unconfigured count banner | {n} skills need configuration, so they are not available for mapping or submission. Show them `[IM-10]` |
| Empty (library) | Your library is empty. Skills are defined by your program. Import a list you already have, or add a skill. `[SL-01, IM-12]` |
| Empty (filtered) | No skills match these filters. Clear filters. |
| Deactivate action | Deactivate skill |
| Deactivate confirm (F-14) | **Deactivate {skill}?** It will no longer be available for course mapping, student selection or reporting scope. Evidence already recorded is kept. Buttons: Deactivate skill · Cancel `[SL-11]` |

### S-05 Categories and tags (P-A): two library tabs, S-05a Categories and S-05b Tags `[INFER]`

| Element | Copy |
|---|---|
| Categories intro | Categories are defined by your program. A skill belongs to at most one category. `[SL-03]` |
| Tags intro | Tags are optional and cut across categories. A skill can have any number of tags. `[SL-04]` |
| Buttons (one filled primary per tab) | S-05a: Add category · S-05b: Add tag · Edit |
| Columns | Name · Description · Skills · Status |
| Inactive on a skill | {Name} (inactive). It stays on this skill until you remove it. `[SL-06]` |
| Remove inactive | Remove from skill |
| Tag reach card | {n} skills across {m} categories |
| Inline create (from S-09) | Create "{typed text}" as a new category · Create "{typed text}" as a new tag `[SL-05]` |
| Duplicate name | A category named "{name}" already exists. Use a different name. |
| Empty | No categories yet. Add one, or leave skills without a category. |

### S-06 Clinical settings (P-A)

| Element | Copy |
|---|---|
| Intro | Students choose from these when they record clinical evidence. Lab and simulation evidence is recorded as lab and never satisfies a clinical setting minimum. `[SL-07, SC-12]` |
| Button | Add setting |
| Columns | Setting · Evidence recorded · Status |
| Empty | No clinical settings yet. Add the settings your program tracks, for example inpatient or outpatient. |
| Blocked deactivation ⚑ proposed OD-26 `[INFER]` | **{Setting} cannot be deactivated yet.** These skills require evidence from it: {skill names}. Remove the setting minimum from those skills first. Button: Close |
| Deactivate confirm (no minimum references it) | **Deactivate {setting}?** Students will no longer be offered it. Evidence already recorded is kept. Buttons: Deactivate setting · Cancel |

### S-07 Lab instructors roster (P-A)

| Element | Copy |
|---|---|
| Intro | Lab instructors are not Prism users. Only a name and email are stored, and no account is created. The email is where evaluation requests are sent. `[SL-08, PROTO]` |
| Button | Add instructor |
| Columns | Name · Email · Evaluations · Status |
| Student-named section | Named by students and not on the roster. Add them to keep one spelling in your records. `[SL-09]` |
| Row action | Add to roster · Merge into another instructor |
| Adopt success (F-13) `[SL-09]` | {Name} was added to your lab instructors. Evaluations that named them now use this entry. |
| Merge dialog `[INFER]; merge is not in REQ` | **Merge {name} into {other}?** Evaluations recorded under {name} are shown under {other}. Buttons: Merge · Cancel |
| Validation | Enter a name. · Enter a valid email address. |
| Empty | No lab instructors yet. Students can also name an instructor when they send a skill for review. |

### S-08 Import (P-A) F-01

| Element | Copy |
|---|---|
| Dialog title | Import skills |
| Intro | Bring in a list you already hold instead of entering skills one at a time. |
| Rule note | Skills are created as needing configuration. A list says what skills are called, not how each is evaluated or what achievement requires. `[IM-09]` |
| Upload card | Upload a file. Spreadsheet, document or PDF. No particular template or column order is needed. `[IM-02, IM-03]` |
| Paste card | Or paste the list. One skill per line. A description and a grouping are used if present. |
| Buttons | Cancel · Read the list |
| Review title | Review {n} skills found in {source} |
| Review subline | Nothing is added until you confirm. Edit, exclude or rename anything first. `[IM-05, IM-13]` |
| Counters | Found: rows read from the source · Will be created: {n} · Excluded: {m} · Possible duplicates: already in the library · Not read: {k} lines `[IM-05, IM-06, IM-08]` |
| Unsaved import prompt `[INFER]` | **Discard this import?** Nothing has been added to your library yet. Buttons: Discard import · Keep editing |
| Category checkbox | Create {n} new categories from the groupings in this list: {names} `[IM-07]` |
| Row controls | Include · Skill name · Description · Category |
| Row actions (to be built) | Merge · Split · Add skill `[IM-05]` |
| Duplicate row | "{Name}" is already in your library. Choose: Skip · Replace · Keep both `[IM-06]` ⚑ OD-13 (do not state replace behaviour for skills that hold evidence) |
| Unread section title | {n} lines were not read as skills |
| Unread section body | These are shown so nothing is lost. Add any of them by hand if they should have been included. `[IM-08]` |
| Unread row | Line {n}: {original text}. {Reason, for example: Looks like a section heading} |
| Confirm | Create {n} skills |
| Back | Back |
| Success banner | Added {n} skills to the library. They cannot be used until each one is configured. Configure them now · Dismiss |
| Error: unreadable | This file could not be read. Try another file, paste the list, or add skills one at a time. |
| Error: nothing found | No skills were found in this source. Check the file, or paste the list. |
| Prohibited | "smart", "automatically understood", "powered by", any accuracy claim or figure `[IM-13]`. "AI" only in the disclosure copy below (amended 2026-10-08) |
| AI reading: switch | Use AI to help read this list |
| AI reading: disclosure | The text of this list is sent to TypeSafe, an AI service, to help tell skills from headings and notes. Nothing else from Prism is sent. Nothing is added until you confirm. |
| AI reading: busy | Reading the list |
| AI reading: info (review) | AI helped read this list. Rows marked "Check this row" were less clear; look at those first. / AI helped read this list. No rows were marked to check; review it as usual. |
| AI reading: fallback | AI reading was not available, so the list was read with the standard reader. Review it as usual. |
| Row cue | Check this row, with a visible reason: This line may not be a skill. / This line may belong to the skill above it. / The category for this skill is less clear. / The heading and the content below it did not agree. |
| Filter | Show only rows to check |
| Not read reason | Not clearly a skill |
| File errors | This file type cannot be read. Save it as .xlsx, .docx or .pdf, or paste the list. / This file is too large to read. Try a smaller file or paste the list. / No text could be read from this file. A scanned page has no text to read. Try another file or paste the list. / This file could not be read here. Try a .csv or .txt file, or paste the list. |

### S-09 Skill configure (P-A) F-03, F-04

| Element | Copy |
|---|---|
| Title | Configure {skill} (new skill: Add skill) |
| Subtitle | You define how this skill is evaluated and what achievement requires. |
| Section: definition | Skill name (required) · Description · Category (optional) · Tags · Status |
| Category help | One per skill. Optional. Only active categories are listed. |
| Tags help | Any number per skill. Only active tags are listed. Tags cut across categories and support cross-cutting reports. |
| Status help | Active skills can be mapped to course offerings and requested by students. |
| Section: model | Evaluation model. Choose one. Nothing is selected by default. `[SC-02]` |
| Model tiles | Overall binary outcome: The evaluator records one overall outcome using two labels you define. · Question-level qualitative: The evaluator answers Yes or No to each question you define. · Scored / Likert: The evaluator scores each question on a scale you define. · Demonstration-level outcome: The evaluator records the level of supervision for each demonstration. |
| Binary labels | Qualifying outcome label · Other outcome label. Helper: The two labels must be different. `[SC-03]` |
| Question list | Question {n} · Add question · Remove |
| Rule (question model) | An evaluation qualifies when: All questions are answered Yes · At least {n} of {m} questions are answered Yes · These questions are answered Yes: {picker} `[SC-05]` |
| Rule (scored) | An evaluation qualifies when: The average score is at least {n} · Every question scores at least {n} · The total score is at least {n} `[SC-07]` |
| Scale | Scale: {min} to {max}. Add labels for each point (optional) |
| Levels | Levels of supervision, ordered from most to least supervised. Add level · Move up · Move down `[SC-08]` |
| Demonstration rule note | Every completed demonstration is evidence. The mix of levels is set in the achievement criteria. `[PROTO]` |
| Criteria | Number of qualifying evaluations required · Total demonstrations required · Minimum at each level · Minimum by clinical setting. Helper: Optional. Counted per setting. Lab or simulation evidence never counts toward a clinical setting. `[SC-10..12]` |
| Dependency panel | Model · Evidence per evaluation · An evaluation qualifies when · Achievement criteria · Skill status. Helper: Each step is determined by the one above it. `[SC-17]` |
| Model-change confirm | **Change the evaluation model?** The questions, levels and achievement criteria for the current model will be rebuilt. Evidence already recorded is kept. Buttons: Change model · Cancel `[SC-09]` |
| Submission fields | What the student supplies. Label · Type (Date, Short text, Long text, Number, Choice list) · Required or Optional · Add field. Helper: Setting and location come from the student's placement and are not entered here. `[SC-13]` ⚑ OD-04 (neutral: do not say "applies to all skills") |
| Evaluator comment | Evaluator comment: Optional · Required. Helper when required: The evaluator cannot submit without a comment. `[SC-14]` |
| Workflow | Student self-evaluates first (On/Off). Helper: The student completes the same form before the evaluator sees it. · Administrator reviews before evidence counts (On/Off). Helper: Evidence counts only after a reviewer approves it. `[SC-15]` |
| Roles | Who can evaluate this skill: Preceptor · Clinical faculty · Lab instructor. Helper: Students can only send this skill to a role selected here. `[SC-16]` ⚑ OD-06 (do not describe roles as fixed) |
| Preview | Form preview. What the student and the evaluator will each see. `[SC-19]` |
| Impact notice (proposal) | Changing this rule updates how {n} existing evaluations are counted. {m} students may change status. Review before saving. `[AE-02]` `[INFER]` (REQ requires re-application, not a notice) |
| Buttons | **Full page (recommended in 07):** Save skill (single filled primary) · Cancel · Copy configuration from another skill · Apply to selected skills `[IM-14]`. **Back and Continue exist only in the modal-stepper alternative.** |
| Section names (canonical; same as 07) | 1 Skill · 2 Model (How it is evaluated) · 3 Rule (When one evaluation counts) · 4 Criteria (Achievement criteria) · 5 Student details · 6 Evaluator · 7 Workflow · 8 Preview |
| Success banner | {Skill} saved and ready to be mapped. |
| Save blocked banner | This configuration cannot be saved. Fix {n} issues below. |

**Validation (SC-06, SC-18)**

| Condition | Message |
|---|---|
| Question text empty | Question {n} needs text. |
| Duplicate question text | Question {n} has the same text as question {m}. Each question must be different. |
| Level label empty | Level {n} needs a label. |
| Duplicate level label | Two levels are called "{label}". Each level must have a different label. |
| Binary labels identical | The two outcome labels must be different. |
| Subset rule with none selected | Select at least one question for this rule. |
| At-least-N exceeds M | "At least {n}" cannot be more than the {m} questions you have. |
| Minimum above total | The minimums at each level add up to {x}, which is more than the {y} demonstrations required. Lower a minimum or raise the total. |
| Setting minimum above total | The minimums by setting add up to {x}, which is more than the {y} evaluations required. |
| No model chosen | Choose an evaluation model to continue. |
| No evaluator role chosen | Select at least one role that can evaluate this skill. `[INFER]` |
| Clinical minimum without a clinical-capable role `[INFER]; OD-25` | This skill requires clinical evidence, but none of its allowed evaluator roles can sign off clinical evidence. Allow at least one of: {roles}, or remove the clinical setting minimums. |

### S-10 Course mapping (P-A) F-05

| Element | Copy |
|---|---|
| Page title | Course mapping |
| Subtitle | Set which skills are mandatory for each clinical course offering |
| Rule note | Mapping sets what a course expects. It does not restrict where a skill can be evaluated. Students can still request evaluations for skills outside the mapping, and evidence counts toward one skill record shared across courses. `[CM-05, CM-07]` |
| Offerings header | Clinical course offerings. {n} of {N} match. Count shows mandatory out of total. |
| Filters | Cohort · Academic year · Term · Professional year · Search by course code or name · Clear |
| Panel title | Skills mapped to {course code} |
| Panel subline | {Course name}, {term} {year}, {professional year}. {m} mandatory, {n} non-mandatory |
| Row | Map {skill}. Mandatory · Non-mandatory. Also mapped in {list}. One student skill record is shared across courses. |
| Empty (no skills configured) | No configured skills are available to map. Configure skills in the library first. `[IM-09]` |
| Empty (offering has no cohort) | No cohort is enrolled in this offering yet. You can still map skills. `[INFER]` (prototype shows 0/0 only) |
| Carry-forward ⚑ OD-01 | Do not show any copy about carrying mappings between terms. |

### S-11 Review and approve (P-R) F-08

| Element | Copy |
|---|---|
| Page title | Review and approve |
| Subtitle | Approve submitted evaluations for skills that require it |
| Intro | Evaluations appear here only for skills where the program turned on administrator review. All others count as soon as the evaluator submits. `[SC-15]` |
| Queue columns (DataTable; rows have no filled buttons) | Student · Skill · Course · Setting and location · Evaluator (role) · Agreement · Review |
| Row action | Review |
| Detail Sheet header | {Student}, {skill} |
| Subline | {Course}. {Clinical (setting) at {location}, or Lab or simulation}. Submitted {date} by {evaluator} ({role}) |
| Agree | The student and the evaluator recorded the same outcome. `[AR-02]` |
| Disagree | The student and the evaluator recorded different outcomes. Review the responses before deciding. |
| Expand | See the full responses `[AR-03]` |
| Note label | Review note (optional). Kept with the evaluation. `[AR-04]` |
| Buttons | Approve · Return for correction ⚑ OD-16 |
| Return prompt | Why is this being returned? Your note is shown to {recipient} ⚑ OD-16 (recipient undecided; REQ says "goes back for correction" and the student may "correct and resend" `[REQ AR-05, RV-01]`). Keep neutral: "Your note is kept with the evaluation." |
| Approve banner | {Skill} for {student} approved. It now counts toward their record. |
| Return banner (neutral about who corrects until OD-16 is decided) | {Skill} for {student} returned for correction. It does not count until the correction is complete. |
| Empty | Nothing is waiting for approval. |
| Error | The review queue could not be loaded. Try again. |

### S-12 Student: course skills (P-S)

| Element | Copy |
|---|---|
| Section heading | Skills for {course code} |
| Intro | Mandatory skills are required for this course. Non-mandatory skills are available but not required. `[CM-03]` |
| Row badges | Mandatory for this course · Non-mandatory for this course |
| Progress | {x} of {y} demonstrations · {x} of {y} qualifying evaluations |
| Setting progress `[SH-05]` | {Setting}: {x} of {y} |
| Achieved row | Achieved. You can still request another evaluation if your program wants more evidence. `[PROTO]` |
| Filter | Show only skills I have sent for review `[ST-03]` |
| Selection bar | {n} skills selected · Clear · Send for review |
| Awaiting section | Waiting for evaluation. {n} requests sent. {Skill}, {evaluator} ({role}) |
| Other skills | Other skills. Not mapped to this course. Evidence still counts toward your skill record. `[ST-02, CM-05]` |
| Empty (no mapped skills) | No skills are mapped to this course yet. You can still send other skills for review. |
| Link | View history ({n}) |
| Error | Your skills could not be loaded. Try again. |

### S-13 Student: send for review (P-S) F-06

| Element | Copy |
|---|---|
| Title | Send for review |
| Subline | {n} skills. {Course} |
| Where | Where did you perform this? Clinical · Lab or simulation `[ST-05]` |
| Setting | Which clinical setting? Helper: From your {n} placements for this course. You may move between settings during a placement, so record where this one happened. `[ST-06]` |
| Single setting | Recorded as {setting} at {location}, from your placement. |
| No placement `[ST-07]` | No placement is recorded for this course. Choose from your program's clinical settings. |
| Send to | Send for review to · Role · Person |
| Role helper | Roles that can sign off {clinical or lab} evidence for these skills. `[ST-08]` |
| Blocked: no valid role `[ST-08]` | No evaluator role can sign off {skill} for {clinical setting or lab}. {Skill} allows {roles}, and those roles are not available for this setting. Choose a different setting or remove this skill from the request. |
| Blocked: skill allows no clinical-capable role `[ST-08]; OD-25 [INFER]` | {Skill} can only be signed off by {roles}, who cannot sign off clinical evidence. Choose Lab or simulation, or ask your program administrator. |
| Lab instructor not on list | Evaluator not listed? Enter their name and email so the request can reach them. `[ST-09]` |
| Email validation | Enter a valid email address. The request is sent here. |
| Details card | Details for this submission. {Status: Incomplete or Complete} `[ST-10]` |
| Required field error | {Label} is required. |
| Student note | Your note (optional). Shown with the submission, separate from the evaluator's comment. `[ST-12]` |
| Self-evaluation | Evaluate yourself first. Use the same criteria the evaluator will use. They see your answers while evaluating. `[ST-11, EV-04]` |
| Footer note | The evaluator completes the form your program set up. They do not choose how a skill is evaluated. |
| Buttons | Cancel · Send request |
| Confirmation | Sent {n} skills to {evaluator name}, {role}. {Clinical (setting) at location, or Lab or simulation}. `[ST-13]` |
| Per-skill vs once ⚑ OD-07 | Do not label setting and location as "per submission" or "per skill" until decided. |
| Error: send failed | Your request was not sent. Your answers are kept. Try again. |
| Stale-evaluator guard (DEFECT-01) | If the role changes, clear the selected person and show: Choose an evaluator for the new role. |

### S-14 Student: skill history (P-S) F-09, F-10

| Element | Copy |
|---|---|
| Title | Your submission history for {skill} |
| Subtitle | {Criteria summary} |
| Counters | Counted so far · In progress · Returned. Helper: Sent but not finished · Sent back by a reviewer `[SH-04]` |
| Scope toggle | All courses ({n}) · {Course} only ({n}) `[SH-06]` |
| Note | Evidence counts toward this skill wherever it was gathered, so submissions from other courses are included. |
| Attempt header | Attempt {n}. {Date}. {Clinical (setting) at location, or Lab or simulation}. {Course} |
| Outcome labels `[SH-02]` | Counted · Did not meet criteria · Returned · Waiting with {name} ({role}) · Waiting for approval |
| Revision marker | Revised and resent {n} time(s). `[RV-02]` |
| Reviewer note | Reviewer note: {text} |
| Actions | View evaluation · Revise and resend · Make a further attempt |
| Locked | This submission counted and can no longer be changed. · This submission is waiting for approval and cannot be changed. `[RV-05]` |
| Correction prefill ⚑ OD-08 | Do not state whether the evaluator will see earlier answers. |
| Empty | You have not sent this skill for review yet. |
| **Failed rule text** | See §7 generator `[SH-03]` |

### S-15 Student: my skills (P-S)

| Element | Copy |
|---|---|
| Title | My skills |
| Subtitle | Your record for every skill, across all your courses |
| Filter | All courses · {Course} |
| Row | {Skill}. {Status}. {x} of {y}. Mandatory in {n} of your courses |
| Empty | You have no skills to show yet. Skills appear here once your program maps them to your courses, or you send one for review. |

### S-16 Evaluator form, tokenised (P-P, P-F, P-L) F-07

| Element | Copy |
|---|---|
| Header | Evaluate {student name} |
| Subline | {Course}. Requested {date}. You are completing this as {role}. |
| Per skill | {n}. {Skill} |
| Setting line | {Clinical (setting) at location, or Lab or simulation} |
| Student details | Supplied by the student |
| Self-evaluation block | The student's self-evaluation: {answer} `[EV-04]` |
| Question control | Yes · No (large targets) |
| Level control | {Level labels from the skill} |
| Comment | Your comment (required) · Your comment (optional). Helper: What the student did well and what to work on next. |
| Comment error `[EV-06]` | Add a comment for {skill} before you submit. The program requires one. |
| Incomplete answers | Answer every question for {skill} to submit. |
| Routing badge `[EV-07]` | This skill counts as soon as you submit. · This skill is held for administrator approval after you submit. |
| Submit | Submit evaluation |
| Footer | Submitting records your answers. You will not be asked to sign in. |
| Result banner | Evaluation submitted for {student}. {n} skills recorded. |
| Counts now `[EV-07]` | {Skill}: recorded. It counts toward the student's record now. |
| Held `[EV-07]` | {Skill}: recorded. It is held for administrator approval and does not count until approved. |
| Error | Your evaluation was not submitted. Your answers are kept. Try again. |
| Invalid/expired/used link ⚑ OD-18 | Neutral: This link cannot be used. Contact the student or program that sent it. (Do not state expiry rules.) |
| Already submitted ⚑ OD-18 | An evaluation has already been submitted for this request. |
| Student achievement exposure ⚑ OD-17 | Do not show the student's achievement status or counts to the evaluator until decided. Prototype shows them (DEFECT-05); do not copy. |
| Shell | None: no navigation, no sidebar, no sign-in prompt `[EV-01]` |

### S-17 Export (P-A) F-12

| Element | Copy |
|---|---|
| Button | Export |
| Menu items | Attainment summary: the table as currently filtered · Evidence detail: one row per evaluation, with comments, setting, location and review notes `[RP-10]` |
| Helper | The filters you have applied are recorded in the file. Exports cover everything that matches, not only the rows shown. |
| Format label ⚑ OD-10 | Export as CSV (opens in Excel) if the decision is CSV; do not claim Excel workbook support until decided. |
| Progress | Preparing your export |
| Success banner | Your export is ready. |
| Error | The export could not be created. Try again. |
| Empty | There is nothing to export for these filters. |

### S-18 Evaluation-request email (P-P, P-F, P-L) F-06 → F-07

Constraints: plain, short, no account creation, no login `[EV-01]`, one link per request `[EV-05]` ⟂ OD-18 (link lifetime unstated). No reminders copy (out of scope `[§14]`).

```
Subject: {Student name} has asked you to evaluate {n} skill(s)

Hello {Evaluator name},

{Student name} ({course code}, {program name}) has asked you to evaluate
{n} skill(s) they performed:

  - {Skill 1}
  - {Skill 2}

Where: {Clinical (setting) at location | Lab or simulation}
You are asked to complete this as: {Preceptor | Clinical faculty | Lab instructor}

Open the evaluation:
{Link button label: Open evaluation}

What to expect
- The link opens the evaluation directly. You do not need to sign in
  and no account is created.
- The form shows what {Program name} has set up for each skill. You
  only record your assessment.
- Completing it takes about {estimate} minutes. {omit unless validated}

After you submit
- Your answers are recorded for {Student name}.
- {Program name} may review an evaluation before it counts.

If you are not the right person to evaluate {Student name}, please let
them know so they can send the request to someone else.

Thank you,
{Program name} via Prism
```

Notes: do not include the student's progress or status (see OD-17). "About {estimate} minutes" is omitted until measured in research (`ux/12`). The line "let them know" reflects that the student may resend `[RV-04]`; no promise of a decline link is made.

## 6. Held for approval versus counts now `[EV-07]`

| Audience | Moment | Counts now | Held for approval |
|---|---|---|---|
| P-P / P-F / P-L | Before submit (per skill) | This skill counts as soon as you submit. | This skill is held for administrator approval after you submit. |
| P-P / P-F / P-L | After submit | Recorded. It counts toward the student's record now. | Recorded. It is held for administrator approval and does not count until approved. |
| P-S | S-12 / S-14 | Counted | Waiting for approval |
| P-S | S-14 helper | Your evaluator submitted this. It counts toward {skill}. | Your evaluator submitted this. A reviewer must approve it before it counts. |
| P-R | S-11 | Not shown (counts immediately) | Waiting for your decision |
| All | Achievement | Counted evidence only `[AE-01, AR-06]` | Excluded until approved `[AR-06]` |

## 7. Failed-rule explanation generator `[SH-03]`

Used on S-14 for every **did not meet criteria** evaluation and in S-03 detail. Pattern: **"This evaluation did not meet the criteria because {reason}. {Next step}."** Variables come from the skill's *current* rule `[AE-02]`, so text must be generated at read time, not stored. Labels, question text and level names are presentation `[AE-06]` and are read live.

### 7.1 Evaluation-level reasons (why one evaluation did not qualify)

| Model | Rule type | Plain-language text | Variables |
|---|---|---|---|
| Overall binary outcome | Outcome equals qualifying label | The outcome recorded was {recorded label}. The outcome needed is {qualifying label}. | recorded label, qualifying label `[SC-03]` |
| Question-level | All questions Yes | {k} question(s) were answered No: {question list}. Every question needed a Yes. | k, questions `[SC-05]` |
| Question-level | At least N of M Yes | {y} of {m} questions were answered Yes. At least {n} were needed. | y, m, n `[SC-05]` |
| Question-level | Named subset all Yes | These required questions were not answered Yes: {question list}. | questions `[SC-05]` |
| Scored / Likert | Average at least T | The average score was {avg}. At least {t} was needed. | avg, t `[SC-07]` |
| Scored / Likert | Minimum on every question | {k} question(s) scored below {t}: {question: score list}. | k, t, list `[SC-07]` |
| Scored / Likert | Total at least T | The total score was {total}. At least {t} was needed. | total, t `[SC-07]` |
| Demonstration-level | Every completed demonstration counts | Not applicable: each completed demonstration counts as evidence, so no single demonstration "does not meet". Explain via skill-level reasons below. `[PROTO]` `[INFER]` | none |

### 7.2 Skill-level reasons (why the skill is not yet achieved even though evidence counts)

| Criterion | Plain-language text | Variables |
|---|---|---|
| Qualifying evaluations count `[AE-03]` | You have {x} of {n} qualifying evaluations. {n minus x} more needed. | x, n |
| Total demonstrations `[SC-10]` | You have {x} of {n} demonstrations. | x, n |
| Minimum at a level `[SC-10]` | You need {min} at "{level}" and have {x}. {min minus x} more needed. | level, min, x |
| Minimum in a clinical setting `[SC-11]` | You need {min} in {setting} and have {x}. | setting, min, x |
| Lab evidence for a clinical setting `[SC-12]` | Lab or simulation evidence does not count toward {setting}. You need clinical evidence there. | setting |
| Evidence waiting `[AE-01, AR-06]` | {n} submission(s) are waiting and do not count yet: {with whom}. | n, names |
| Evidence returned `[AR-05]` | {n} submission(s) were returned. Revise and resend them to count. | n |
| All criteria met `[AE-03]` | Not shown. | none |

Rules for composition: list at most three unmet criteria, most actionable first (settings, then levels, then totals); always end with a next action from §3.1 (Revise and resend, Make a further attempt, Send for review). Never show the word "failed". Never colour-code the text red.

Worked example (from prototype data `[PROTO]`): *Wound Care, 4 of 4 demonstrations, not achieved.* → "You have 4 of 4 demonstrations. You need 1 in Inpatient and 1 in Emergency and have 0 recorded there. Send this skill for review again from those settings." (Resolves DEFECT-07.)

## 8. Empty, error and blocked-with-reason index

| Case | Surface | Copy source |
|---|---|---|
| Unconfigured skill cannot be mapped or submitted `[IM-09]` | S-04, S-10, S-12 | S-04 row copy; S-10 empty; excluded from S-12 selector |
| No valid setting-role combination `[ST-08]` | S-13 | S-13 blocked |
| Impossible filter `[RP-09]` | S-01 | S-01 impossible filter |
| No placement `[ST-07]` | S-13 | S-13 no placement |
| Locked after counted or awaiting approval `[RV-05]` | S-14 | S-14 locked |
| Deactivated skill (in-flight submissions) | S-13 | **No copy: behaviour undefined** `[INFER]`, add to `ux/12` |
| Invalid evaluator link ⚑ OD-18 | S-16 | S-16 neutral copy |
| Mandatory comment `[EV-06]` | S-16 | S-16 comment error |

## 9. Copy that must not ship

| Copy | Why |
|---|---|
| "Return to preceptor" | Prototype label; conflicts with REQ `AR-05`/`RV-01`; recipient is OD-16 |
| "(clinical faculty)" appended to a preceptor name | DEFECT-01 |
| "Not met" for both no-evidence and failed | DEFECT-04; OD-03 |
| "Powered by AI", "smart import", accuracy percentages | IM-13 |
| Progress shown to evaluator after submit | DEFECT-05; OD-17 |
| Em-dashes, exclamation marks, "Oops", "Uh oh" | Voice rules |
| "Recommended" for non-mandatory | Call wording; REQ uses non-mandatory (C-3) |
| Any nursing-specific wording as default text | `[REQ §1.6]` |

---

## Strings added during build (2026-10-08)

Source of truth in code: `apps/skills-checklist/admin/lib/copy/<module>.ts`. Every string below was written during the build because this document had no entry for it. **All are `[INFER]` proposals** until the copy owner adopts or replaces them; they follow the voice rules in section 1 (professional, sentence case, no em-dashes, no exclamation marks), which `tests/copy/copy.test.ts` enforces for every static string. Function entries are templates that take the arguments shown. A value such as `common.name`, `buttons.cancel`, `term.lab` or `statusLabel(...)` points to a shared definition elsewhere in `lib/copy`.

**Wording changes made while moving the strings (all listed):**

- S-08 review page subtitle: "Nothing is added until you confirm. Edit, exclude or rename anything first." became "Edit, exclude or rename anything first." The draft framing line ("Nothing is added until you confirm. The list below is a draft and may be incomplete.") is the one the S-08 contract specifies, so the sentence now appears once.
- S-01 and S-02 empty-value marker: the em dash became a hyphen, because the voice rules ban em-dashes. Cell placeholder only, not prose.
- Repeated words now reference one definition (`common.ts`, `buttons`, `term`, `statusLabel`) with the same visible text, so no other wording changed.


### S-04 to S-07 (library) `[INFER]`

Module: `lib/copy/library.ts` (114 entries)

| Key | Value |
|---|---|
| `libraryChrome.navLabel` | `"Library sections"` |
| `skillsExtra.loading` | `"Loading skills"` |
| `skillsExtra.resultCount` | `(n: number) => '${plural(n, "skill", "skills")} shown'` |
| `skillsExtra.progress` | `(configured: number, total: number) => '${configured} of ${total} configured'` |
| `skillsExtra.inactiveHidden` | `(n: number) => '${plural(n, "inactive skill is", "inactive skills are")} hidden.'` |
| `skillsExtra.showInactive` | `"Show inactive"` |
| `skillsExtra.filterLabels` | `{ category: "Category", tag: "Tag", status: "Status", batch: "Import", setting: "Required in setting" }` |
| `skillsExtra.searchLabel` | `common.searchSkills` |
| `skillsExtra.addFilter` | `"Add filter"` |
| `skillsExtra.clearAll` | `"Clear all"` |
| `skillsExtra.removeFilter` | `(label: string, value: string) => 'Remove filter ${label} ${value}'` |
| `skillsExtra.inactiveCategory` | `(name: string) => '${name} (inactive)'` |
| `skillsExtra.inactiveTag` | `(name: string) => '${name} (inactive)'` |
| `skillsExtra.notConfiguredModel` | `term.notConfigured` |
| `skillsExtra.noCriteria` | `"No criteria set"` |
| `skillsExtra.coursesLink` | `(n: number) => '${n} ${n === 1 ? "course" : "courses"}'` |
| `skillsExtra.tableLabel` | `"Skills"` |
| `skillsExtra.rowMenu` | `(name: string) => 'Actions for ${name}'` |
| `skillsExtra.selectRow` | `(name: string) => name` |
| `skillsExtra.reactivate` | `"Reactivate skill"` |
| `skillsExtra.deactivated` | `(name: string) => '${name} deactivated. Evidence already recorded is kept.'` |
| `skillsExtra.deactivatedMany` | `(n: number) => '${plural(n, "skill", "skills")} deactivated. Evidence already recorded is kept.'` |
| `skillsExtra.reactivated` | `(name: string) => '${name} reactivated.'` |
| `skillsExtra.deactivateManyTitle` | `(n: number) => 'Deactivate ${plural(n, "skill", "skills")}?'` |
| `skillsExtra.mappedWarning` | `(n: number) => 'Mapped to ${plural(n, "course offering", "course offerings")}. It will be removed from ${n ...` |
| `skillsExtra.bulkNone` | `"Select at least one active skill to deactivate."` |
| `skillsExtra.actionFailed` | `(what: string) => '${what} could not be completed.'` |
| `skillsExtra.retryHint` | `"Nothing was changed."` |
| `skillsExtra.confirmDeactivate` | `buttons.deactivateSkill` |
| `skillsExtra.cancel` | `buttons.cancel` |
| `skillsExtra.importBatchOption` | `(n: number) => 'Import ${n}'` |
| `skillsExtra.statusOptionAll` | `"All statuses"` |
| `taxonExtra.dialogTitle` | `(kind: "category" \| "tag", edit: boolean) => '${edit ? "Edit" : "Add"} ${kind}'` |
| `taxonExtra.nameLabel` | `common.name` |
| `taxonExtra.descriptionLabel` | `common.description` |
| `taxonExtra.optional` | `"optional"` |
| `taxonExtra.save` | `(kind: "category" \| "tag") => 'Save ${kind}'` |
| `taxonExtra.added` | `(name: string) => '${name} added.'` |
| `taxonExtra.updated` | `(name: string) => '${name} updated.'` |
| `taxonExtra.deactivated` | `(name: string) => '${name} deactivated. Skills that carry it keep it, labelled inactive.'` |
| `taxonExtra.reactivated` | `(name: string) => '${name} reactivated.'` |
| `taxonExtra.nameRequired` | `validation.name` |
| `taxonExtra.deactivate` | `common.deactivate` |
| `taxonExtra.reactivate` | `common.reactivate` |
| `taxonExtra.edit` | `buttons.edit` |
| `taxonExtra.inactiveCarried` | `(n: number) => '${plural(n, "skill still carries", "skills still carry")} it.'` |
| `taxonExtra.statusActive` | `common.active` |
| `taxonExtra.statusInactive` | `common.inactive` |
| `taxonExtra.emptyHint` | `"You can also create one while defining a skill."` |
| `taxonExtra.importHint` | `"An import can propose categories from the headings in your list. Nothing is created until you confirm."` |
| `taxonExtra.reachHeading` | `"Where each tag reaches"` |
| `taxonExtra.reachNote` | `"A tag that spans several categories does a job a category cannot."` |
| `taxonExtra.skillsLink` | `(n: number) => '${n}'` |
| `taxonExtra.skillsLinkLabel` | `(kind: "category" \| "tag", name: string, n: number) => '${plural(n, "skill", "skills")} with ${kind} ${name}'` |
| `taxonExtra.reachIncludesInactive` | `"Includes inactive skills."` |
| `taxonExtra.saving` | `"Saving"` |
| `taxonExtra.failed` | `(kind: "category" \| "tag") => 'The ${kind} could not be saved. Your entries are kept.'` |
| `taxonExtra.summaryTitle` | `common.checkEntries` |
| `taxonExtra.loading` | `(kind: "categories" \| "tags") => 'Loading ${kind}'` |
| `settingsExtra.dialogTitle` | `(edit: boolean) => '${edit ? "Edit" : "Add"} setting'` |
| `settingsExtra.nameLabel` | `common.name` |
| `settingsExtra.save` | `"Save setting"` |
| `settingsExtra.added` | `(name: string) => '${name} added.'` |
| `settingsExtra.renamed` | `(name: string) => '${name} updated.'` |
| `settingsExtra.deactivated` | `(name: string) => '${name} deactivated. Evidence already recorded is kept.'` |
| `settingsExtra.reactivated` | `(name: string) => '${name} reactivated.'` |
| `settingsExtra.reserved` | `"Lab and simulation are recorded separately and are not clinical settings."` |
| `settingsExtra.nameRequired` | `validation.name` |
| `settingsExtra.deactivate` | `common.deactivate` |
| `settingsExtra.reactivate` | `common.reactivate` |
| `settingsExtra.edit` | `buttons.edit` |
| `settingsExtra.columns` | `["Setting", "Evidence recorded", "Required by", "Status"]` |
| `settingsExtra.requiredBy` | `(n: number) => (n === 0 ? "No skills" : plural(n, "skill", "skills"))` |
| `settingsExtra.noStudents` | `"Students cannot record clinical evidence until at least one setting exists."` |
| `settingsExtra.evidenceCount` | `(n: number) => '${n}'` |
| `settingsExtra.statusActive` | `common.active` |
| `settingsExtra.statusInactive` | `common.inactive` |
| `settingsExtra.close` | `buttons.close` |
| `settingsExtra.blockedLinks` | `"Open each skill to change its setting minimum."` |
| `settingsExtra.loading` | `"Loading clinical settings"` |
| `settingsExtra.failed` | `"The setting could not be saved. Your entry is kept."` |
| `labExtra.dialogTitle` | `(edit: boolean) => '${edit ? "Edit" : "Add"} instructor'` |
| `labExtra.nameLabel` | `common.name` |
| `labExtra.emailLabel` | `common.email` |
| `labExtra.save` | `"Save instructor"` |
| `labExtra.added` | `(name: string) => '${name} added to the roster.'` |
| `labExtra.updated` | `(name: string) => '${name} updated.'` |
| `labExtra.deactivated` | `(name: string) => '${name} deactivated. Students no longer see them. Completed evaluations stay attributed.'` |
| `labExtra.reactivated` | `(name: string) => '${name} reactivated.'` |
| `labExtra.deactivate` | `common.deactivate` |
| `labExtra.reactivate` | `common.reactivate` |
| `labExtra.edit` | `buttons.edit` |
| `labExtra.statusActive` | `common.active` |
| `labExtra.statusInactive` | `common.inactive` |
| `labExtra.emailExists` | `"An instructor with this email is already on the roster."` |
| `labExtra.openExisting` | `"Open existing"` |
| `labExtra.summaryTitle` | `common.checkEntries` |
| `labExtra.namedHeading` | `"Named by students, not on the roster"` |
| `labExtra.namedTimes` | `(n: number) => 'named ${n} ${n === 1 ? "time" : "times"}'` |
| `labExtra.looksLike` | `(name: string) => 'Looks like ${name}'` |
| `labExtra.mergeInto` | `"Merge into"` |
| `labExtra.mergeTitle` | `(name: string) => 'Merge ${name} into an existing instructor'` |
| `labExtra.mergeBody` | `"Requests that name this person will point to the instructor you choose. Completed evaluations keep the nam...` |
| `labExtra.mergeTarget` | `"Instructor to keep"` |
| `labExtra.mergeConfirm` | `"Merge"` |
| `labExtra.mergeImpact` | `(n: number, name: string) => '${n} ${n === 1 ? "open request" : "open requests"} will point to ${name}.'` |
| `labExtra.merged` | `(n: number, name: string) => '${n} ${n === 1 ? "request now points" : "requests now point"} to ${name}.'` |
| `labExtra.noAccount` | `"No account is created."` |
| `labExtra.rosterEmpty` | `"No lab instructors yet. Students can also name an instructor when they send a skill for review."` |
| `labExtra.loading` | `"Loading lab instructors"` |
| `labExtra.failed` | `"The instructor could not be saved. Your entries are kept."` |
| `labExtra.rosterLabel` | `"Lab instructors"` |
| `labExtra.namedLabel` | `"Named by students"` |
| `labExtra.chooseTarget` | `"Choose an instructor"` |

### S-12 to S-15 (student) `[INFER]`

Module: `lib/copy/student.ts` (48 entries)

| Key | Value |
|---|---|
| `studentLocal.noMatch` | `"No skills match."` |
| `studentLocal.stillNeeded` | `"Still needed"` |
| `studentLocal.labNotCounted` | `(n: number) => 'Lab or simulation: ${n} recorded, not counted toward clinical settings.'` |
| `studentLocal.settingMet` | `"met"` |
| `studentLocal.waitingHeading` | `"Waiting for an evaluator"` |
| `studentLocal.expectedHeading` | `"Expected on this course"` |
| `studentLocal.loading` | `"Loading your skills"` |
| `studentLocal.notFoundCourse` | `"This course could not be found."` |
| `studentLocal.searchOther` | `"Search other skills"` |
| `studentLocal.details` | `{ incomplete: "Incomplete", complete: "Complete" }` |
| `studentLocal.switchTo` | `{ clinical: "Switch to Clinical", lab: "Switch to Lab or simulation" }` |
| `studentLocal.sendSeparately` | `"Send these separately"` |
| `studentLocal.sendSeparatelyNote` | `"Only the first skill is in this request. Send the others in a separate request."` |
| `studentLocal.discard` | `{ title: "Discard this request?", body: "Your answers have not been sent.", keep: "Keep editing", confirm: ...` |
| `studentLocal.reviseNote` | `"Your earlier answers are kept. Change what needs correcting, then resend."` |
| `studentLocal.furtherNote` | `"Your previous attempt is kept and still shown in your history."` |
| `studentLocal.reviewerNoteHeading` | `"Reviewer note"` |
| `studentLocal.disabledReason.blocked` | `"Send request is unavailable because no evaluator role can sign off this request."` |
| `studentLocal.disabledReason.fields` | `(n: number) => 'Complete the ${n} required ${n === 1 ? "field" : "fields"} to send this request.'` |
| `studentLocal.disabledReason.setting` | `"Choose where this was performed to send this request."` |
| `studentLocal.disabledReason.person` | `"Choose who should evaluate this to send this request."` |
| `studentLocal.disabledReason.selfEval` | `"Complete your self-evaluation to send this request."` |
| `studentLocal.evaluatorNotListed` | `"Evaluator not listed"` |
| `studentLocal.lab` | `{ name: common.name, email: common.email }` |
| `studentLocal.oldestFirst` | `"Show oldest first"` |
| `studentLocal.newestFirst` | `"Show newest first"` |
| `studentLocal.furtherBlocked` | `"Finish your open submission first."` |
| `studentLocal.furtherPrompt` | `"You can make a further attempt."` |
| `studentLocal.evaluatorChanged` | `"Evaluator changed"` |
| `studentLocal.noComment` | `"No comment recorded."` |
| `studentLocal.youRated` | `"You rated yourself"` |
| `studentLocal.evaluatorAnswer` | `"Evaluator answer"` |
| `studentLocal.feedback` | `"Evaluator feedback"` |
| `studentLocal.yourNote` | `"Your note"` |
| `studentLocal.sentWith` | `"What you sent"` |
| `studentLocal.coursesWithEvidence` | `"Courses with evidence"` |
| `studentLocal.mandatoryIn` | `(n: number, total: number) => 'Mandatory in ${n} of your ${total} ${total === 1 ? "course" : "courses"}'` |
| `studentLocal.noMatchFilters` | `"No skills match these filters."` |
| `studentLocal.noMappings` | `"Your program has not mapped skills to your courses yet."` |
| `studentLocal.sendThisSkill` | `buttons.sendForReview` |
| `studentLocal.inactiveNote` | `"Inactive skills are not counted in the totals above. Your evidence is kept."` |
| `studentLocal.summaryA` | `(achieved: number, total: number, inProgress: number, doesNotQualify: number, noEvidence: number) =>` |
| `studentLocal.summaryB` | `(achieved: number, total: number, inProgress: number, notMet: number) => 'Achieved ${achieved} of ${total}....` |
| `studentLocal.demoStudent` | `"Demo student"` |
| `studentLocal.demoNote` | `"Demo only. A real student signs in and sees only their own record."` |
| `studentLocal.courseListIntro` | `"Choose a course to see the skills it expects."` |
| `studentLocal.backToCourse` | `"Back to course skills"` |
| `studentLocal.backToMySkills` | `"Back to my skills"` |

### S-11 (review and approve) `[INFER]`

Module: `lib/copy/review.ts` (37 entries)

| Key | Value |
|---|---|
| `reviewCopy.waiting` | `(n: number) => '${n} ${n === 1 ? "evaluation is" : "evaluations are"} waiting. Waiting evaluations do not c...` |
| `reviewCopy.region` | `"Evaluations waiting for approval"` |
| `reviewCopy.reviewButton` | `"Review"` |
| `reviewCopy.reviewLabel` | `(skill: string, student: string, detail: string) => 'Review ${skill} for ${student}, ${detail}'` |
| `reviewCopy.readOnlyDescription` | `"Read only. No decision is available for this evaluation."` |
| `reviewCopy.loading` | `"Loading the review queue"` |
| `reviewCopy.noSelfEvaluation` | `"No self-evaluation"` |
| `reviewCopy.same` | `"Same"` |
| `reviewCopy.differs` | `"Differs"` |
| `reviewCopy.qualifies` | `"Qualifies"` |
| `reviewCopy.doesNotQualify` | `"Does not qualify"` |
| `reviewCopy.sheetSubline` | `(offering: string, where: string, evaluator: string, role: string, date: string) => '${offering}. ${where}....` |
| `reviewCopy.lab` | `term.lab` |
| `reviewCopy.sections` | `{ agreement: "Agreement", supplied: "Supplied by the student", studentNote: "Student note", comment: "Evalu...` |
| `reviewCopy.studentColumn` | `"Student self-evaluation"` |
| `reviewCopy.evaluatorColumn` | `(role: string) => 'Evaluator (${role})'` |
| `reviewCopy.evaluatorOnly` | `(role: string) => 'Evaluator (${role}). The student did not add a self-evaluation for this skill.'` |
| `reviewCopy.outcome` | `"Outcome"` |
| `reviewCopy.recordedLevel` | `"Demonstration outcome"` |
| `reviewCopy.score` | `(n: number) => 'Score ${n}'` |
| `reviewCopy.yes` | `"Yes"` |
| `reviewCopy.no` | `"No"` |
| `reviewCopy.notAnswered` | `"Not answered"` |
| `reviewCopy.yesOf` | `(yes: number, total: number) => '${yes} of ${total} answered Yes'` |
| `reviewCopy.average` | `(n: number) => 'Average score ${n.toFixed(1)}'` |
| `reviewCopy.none` | `"None recorded."` |
| `reviewCopy.approving` | `"Approving"` |
| `reviewCopy.returning` | `"Returning"` |
| `reviewCopy.notSaved` | `"Your decision was not saved. Try again."` |
| `reviewCopy.alreadyDecided` | `(decision: "approved" \| "returned") => 'This evaluation was already ${decision}. No further decision is ne...` |
| `reviewCopy.notWaiting` | `"This evaluation is not waiting for approval."` |
| `reviewCopy.reviewNoteRead` | `"Review note"` |
| `reviewCopy.keyHint` | `"Press J or K to move to the next or previous evaluation."` |
| `reviewCopy.returnTitle` | `buttons.returnForCorrection` |
| `reviewCopy.returnConfirm` | `buttons.returnForCorrection` |
| `reviewCopy.doesNotCountYet` | `"This evaluation does not count toward the student's record until it is approved."` |
| `reviewCopy.close` | `buttons.close` |

### S-01 to S-03 and S-17 (reporting and export) `[INFER]`

Module: `lib/copy/reporting.ts` (92 entries)

| Key | Value |
|---|---|
| `reportFilterLabels.cohortId` | `"Cohort"` |
| `reportFilterLabels.groupId` | `"Group"` |
| `reportFilterLabels.offeringId` | `"Clinical course"` |
| `reportFilterLabels.categoryId` | `"Category"` |
| `reportFilterLabels.tagId` | `"Tag"` |
| `reportFilterLabels.locationId` | `"Location"` |
| `reportFilterLabels.settingId` | `"Setting"` |
| `reportingCopy.addFilter` | `"Add filter"` |
| `reportingCopy.appliedFilters` | `"Applied filters"` |
| `reportingCopy.selectCohortFirst` | `"Select a cohort first"` |
| `reportingCopy.countingOnly` | `(where: string) => 'Counting evidence recorded in ${where} only'` |
| `reportingCopy.courseScoped` | `"Figures are scoped to the selected clinical course. Evidence from any course still counts toward each skill."` |
| `reportingCopy.showAllEvidence` | `"Show all evidence"` |
| `reportingCopy.unconfigured` | `(n: number) => '${n} ${n === 1 ? "skill needs" : "skills need"} configuration'` |
| `reportingCopy.unconfiguredLink` | `"Open the skills library"` |
| `reportingCopy.mandatory` | `term.mandatory` |
| `reportingCopy.nonMandatory` | `term.nonMandatory` |
| `reportingCopy.loading` | `"Updating results"` |
| `reportingCopy.skillsInScope` | `(n: number) => '${n} ${n === 1 ? "skill" : "skills"} in scope'` |
| `reportingCopy.showing` | `(shown: number, total: number) => 'Showing ${shown} of ${total} students'` |
| `reportingCopy.attainment` | `(a: number, n: number, pct: number) => '${a} of ${n} (${pct}%)'` |
| `reportingCopy.dash` | `"-"` |
| `reportingCopy.noEvidenceForCombination` | `"No evidence recorded for this combination yet."` |
| `reportingCopy.tableCaption` | `{ student: "Attainment by student", skill: "Attainment by skill", tag: "Attainment by tag" }` |
| `reportingCopy.columns.skill` | `"Skill"` |
| `reportingCopy.columns.category` | `"Category"` |
| `reportingCopy.columns.model` | `"Evaluation model"` |
| `reportingCopy.columns.requirement` | `"For this course"` |
| `reportingCopy.columns.studentsInView` | `"Students in view"` |
| `reportingCopy.columns.achieved` | `statusLabel("achieved", "four")` |
| `reportingCopy.columns.inProgress` | `statusLabel("partial", "four")` |
| `reportingCopy.columns.notQualify` | `statusLabel("evidenceDoesNotQualify", "four")` |
| `reportingCopy.columns.noEvidence` | `statusLabel("noEvidence", "four")` |
| `reportingCopy.columns.notMet` | `statusLabel("noEvidence", "merged")` |
| `reportingCopy.columns.percent` | `"Percent achieved"` |
| `reportingCopy.columns.courses` | `"Courses"` |
| `reportingCopy.columns.tag` | `"Tag"` |
| `reportingCopy.columns.skills` | `"Skills"` |
| `reportingCopy.columns.categoriesSpanned` | `"Categories spanned"` |
| `reportingCopy.columns.allAchieved` | `"Students achieving all"` |
| `reportingCopy.models` | `{ binary: "Overall binary outcome", question: "Question-level qualitative", scored: "Scored", demonstration...` |
| `reportingCopy.kpiHelp` | `{ studentsInView: "Match the filters above", average: "Per student, in scope", allSkills: (pct: number) => ...` |
| `reportingCopy.rail.label` | `"Student record"` |
| `reportingCopy.rail.counters` | `"Skill status counts"` |
| `reportingCopy.rail.onlyShowing` | `(label: string) => 'Showing only: ${label}'` |
| `reportingCopy.rail.stillNeeded` | `"Still needed:"` |
| `reportingCopy.rail.waiting` | `(n: number) => '${n} waiting, not counted yet'` |
| `reportingCopy.rail.labNotCounted` | `(n: number) => '${n} lab or simulation ${n === 1 ? "record is" : "records are"} not counted toward a clinic...` |
| `reportingCopy.rail.levelHeading` | `"Per-level progress"` |
| `reportingCopy.rail.settingHeading` | `"Progress by clinical setting"` |
| `reportingCopy.rail.prev` | `"Previous student"` |
| `reportingCopy.rail.next` | `"Next student"` |
| `reportingCopy.rail.breadcrumb` | `"Record level"` |
| `reportingCopy.rail.students` | `"Students"` |
| `reportingCopy.rail.errorStudent` | `"This student's record could not be loaded. Try again."` |
| `reportingCopy.rail.noAccess` | `"You do not have access to this record."` |
| `reportingCopy.rail.skillRow` | `(skill: string, status: string, have: number, needed: number \| null) => '${skill}, ${status}${needed !== n...` |
| `reportingCopy.evidence.empty` | `"No evidence has been recorded for this skill yet."` |
| `reportingCopy.evidence.filteredEmpty` | `"No evidence matches the location or setting filter."` |
| `reportingCopy.evidence.countsFiltered` | `"Counts reflect the location or setting filter applied on the overview."` |
| `reportingCopy.evidence.countedHeader` | `(n: number, total: number) => '${n} counted of ${total} ${total === 1 ? "record" : "records"}'` |
| `reportingCopy.evidence.viewAria` | `(date: string, who: string) => 'View evaluation, ${date}, ${who}'` |
| `reportingCopy.evidence.levelRemoved` | `"level removed"` |
| `reportingCopy.evidence.labSetting` | `term.lab` |
| `reportingCopy.evidence.reasonTitle` | `"Why this evaluation did not count"` |
| `reportingCopy.detail.studentSupplied` | `"Supplied by the student"` |
| `reportingCopy.detail.responses` | `(role: string) => '${role} responses'` |
| `reportingCopy.detail.comment` | `"Comment"` |
| `reportingCopy.detail.selfEval` | `"Self-evaluation"` |
| `reportingCopy.detail.reviewNote` | `"Review note"` |
| `reportingCopy.detail.note` | `"Student note"` |
| `reportingCopy.detail.score` | `(n: number) => 'Score ${n}'` |
| `reportingCopy.detail.average` | `(n: number) => 'Average score ${Number.isInteger(n) ? n : n.toFixed(1)}'` |
| `reportingCopy.detail.total` | `(n: number) => 'Total score ${n}'` |
| `reportingCopy.detail.yesOf` | `(y: number, t: number) => '${y} of ${t} questions answered Yes'` |
| `reportingCopy.detail.returned` | `"Returned for correction"` |
| `reportingCopy.detail.waitingApproval` | `"Waiting for approval. This evaluation is listed but does not count yet."` |
| `reportingCopy.detail.noQuestions` | `"No questions were recorded."` |
| `reportingCopy.exp.sheetTitle` | `(kind: string) => 'Export ${kind}'` |
| `reportingCopy.exp.scope` | `"Scope"` |
| `reportingCopy.exp.rows` | `(n: number) => '${n} ${n === 1 ? "row" : "rows"} will be exported'` |
| `reportingCopy.exp.includes` | `"What is included"` |
| `reportingCopy.exp.includesAggregate` | `"One row per student, skill or tag for the current tab, with state counts and attainment."` |
| `reportingCopy.exp.includesEvidence` | `"One row per evaluation: setting, location, role, recorded answers, comment, student-supplied details, self...` |
| `reportingCopy.exp.notIncluded` | `"Evaluator names and email addresses are not included."` |
| `reportingCopy.exp.format` | `"Format"` |
| `reportingCopy.exp.cancel` | `buttons.cancel` |
| `reportingCopy.exp.download` | `(n: number) => 'Download CSV, ${n} ${n === 1 ? "row" : "rows"}'` |
| `reportingCopy.exp.filtersEchoed` | `(lines: string) => 'Filters recorded in the file: ${lines}'` |
| `reportingCopy.exp.disabledReason` | `"Export is unavailable until the results have loaded and match at least one row."` |
| `reportingCopy.exp.kindNames` | `{ student: "attainment by student", skill: "attainment by skill", tag: "attainment by tag", evidence: "evid...` |
| `reportingCopy.exp.fileName` | `(kind: string) => 'skills-${kind}.csv'` |

### S-16 and S-18 (evaluator form and email) `[INFER]`

Module: `lib/copy/evaluator.ts` (55 entries)

| Key | Value |
|---|---|
| `evaluatorCopy.header` | `(student: string) => 'Evaluate ${student}'` |
| `evaluatorCopy.subline` | `(course: string, requested: string, role: string) => '${course}. Requested ${requested}. You are completing...` |
| `evaluatorCopy.progress` | `(answered: number, total: number) => '${answered} of ${total} answered'` |
| `evaluatorCopy.skipLink` | `"Skip to first unanswered"` |
| `evaluatorCopy.skillHeading` | `(n: number, skill: string) => '${n}. ${skill}'` |
| `evaluatorCopy.settingClinical` | `(setting: string \| null, location: string \| null) =>` |
| `evaluatorCopy.settingLab` | `term.lab` |
| `evaluatorCopy.detailsHeading` | `"Supplied by the student"` |
| `evaluatorCopy.studentNote` | `"Student note"` |
| `evaluatorCopy.noDetails` | `"The student did not supply any details for this skill."` |
| `evaluatorCopy.selfEval` | `(answer: string) => 'The student's self-evaluation: ${answer}'` |
| `evaluatorCopy.selfEvalHeading` | `"The student's self-evaluation"` |
| `evaluatorCopy.yes` | `"Yes"` |
| `evaluatorCopy.no` | `"No"` |
| `evaluatorCopy.outcomeLegend` | `"Overall outcome"` |
| `evaluatorCopy.levelLegend` | `"Demonstration outcome"` |
| `evaluatorCopy.scoreHelper` | `(min: number, max: number) => 'Score from ${min} to ${max}.'` |
| `evaluatorCopy.commentRequired` | `"Your comment (required)"` |
| `evaluatorCopy.commentOptional` | `"Your comment (optional)"` |
| `evaluatorCopy.commentHelper` | `"What the student did well and what to work on next."` |
| `evaluatorCopy.commentError` | `(skill: string) => 'Add a comment for ${skill} before you submit. The program requires one.'` |
| `evaluatorCopy.incompleteQuestions` | `(skill: string) => 'Answer every question for ${skill} to submit.'` |
| `evaluatorCopy.incompleteChoice` | `(skill: string) => 'Choose an answer for ${skill} to submit.'` |
| `evaluatorCopy.submit` | `buttons.submitEvaluation` |
| `evaluatorCopy.submitting` | `"Submitting"` |
| `evaluatorCopy.footer` | `"Submitting records your answers. You will not be asked to sign in."` |
| `evaluatorCopy.notSubmitted` | `(n: number) => 'Not submitted. ${n} ${n === 1 ? "item needs" : "items need"} your attention.'` |
| `evaluatorCopy.stillNeeded` | `(n: number, next: string) => '${n} ${n === 1 ? "item" : "items"} still to complete. Next: ${next}.'` |
| `evaluatorCopy.needAnswers` | `(skill: string) => 'answers for ${skill}'` |
| `evaluatorCopy.needComment` | `(skill: string) => 'a comment for ${skill}'` |
| `evaluatorCopy.submitError` | `"Your evaluation was not submitted. Your answers are kept. Try again."` |
| `evaluatorCopy.resultHeading` | `(student: string, n: number) => 'Evaluation submitted for ${student}. ${n} ${n === 1 ? "skill" : "skills"} ...` |
| `evaluatorCopy.previousReturned` | `"A previous evaluation was returned."` |
| `evaluatorCopy.savedOnDevice` | `"Answers saved on this device."` |
| `evaluatorCopy.notSaved` | `"Not saved."` |
| `evaluatorCopy.retry` | `buttons.retry` |
| `evaluatorCopy.loading` | `"Loading the evaluation"` |
| `evaluatorCopy.wordmark` | `"Prism"` |
| `emailCopy.subject` | `(student: string, n: number) => '${student} has asked you to evaluate ${n} ${n === 1 ? "skill" : "skills"}'` |
| `emailCopy.greeting` | `(name: string) => (name.trim() ? 'Hello ${name.trim()},' : "Hello,")` |
| `emailCopy.intro` | `(student: string, context: string, n: number) =>` |
| `emailCopy.more` | `(k: number) => 'and ${k} more'` |
| `emailCopy.where` | `"Where:"` |
| `emailCopy.role` | `"You are asked to complete this as:"` |
| `emailCopy.openLabel` | `"Open the evaluation:"` |
| `emailCopy.button` | `"Open evaluation"` |
| `emailCopy.expectHeading` | `"What to expect"` |
| `emailCopy.expectLink` | `"The link opens the evaluation directly. You do not need to sign in and no account is created."` |
| `emailCopy.expectForm` | `(program: string) => 'The form shows what ${program} has set up for each skill. You only record your assess...` |
| `emailCopy.afterHeading` | `"After you submit"` |
| `emailCopy.afterRecorded` | `(student: string) => 'Your answers are recorded for ${student}.'` |
| `emailCopy.afterReview` | `(program: string) => '${program} may review an evaluation before it counts.'` |
| `emailCopy.notRight` | `(student: string) => 'If you are not the right person to evaluate ${student}, please let them know so they ...` |
| `emailCopy.thanks` | `"Thank you,"` |
| `emailCopy.signature` | `(program: string) => '${program} via Prism'` |

### S-09 (validation) `[INFER]`

Module: `lib/copy/configure.ts` (19 entries)

| Key | Value |
|---|---|
| `configureExtra.nameRequired` | `"Enter a skill name."` |
| `configureExtra.binaryQualifyingMissing` | `"Choose which outcome qualifies."` |
| `configureExtra.labelRequired` | `(which: string) => '${which} is required.'` |
| `configureExtra.questionsEmpty` | `"Add the first question."` |
| `configureExtra.levelsEmpty` | `"Add the first level."` |
| `configureExtra.atLeastRange` | `(m: number) => (m > 0 ? 'Enter a whole number from 1 to ${m}.' : "Add questions first.")` |
| `configureExtra.subsetUnknown` | `"A selected question no longer exists. Review the selection."` |
| `configureExtra.scaleInvalid` | `"Set a scale where the lowest value is below the highest and the step is above zero."` |
| `configureExtra.thresholdOutOfScale` | `(lo: number, hi: number) => 'Enter a threshold from ${lo} to ${hi}.'` |
| `configureExtra.requiredCount` | `"Enter a whole number of 1 or more."` |
| `configureExtra.levelMinInvalid` | `"Enter a whole number of 0 or more."` |
| `configureExtra.levelMinUnknown` | `"A minimum refers to a level that no longer exists."` |
| `configureExtra.settingMinInvalid` | `"Enter a whole number of 1 or more."` |
| `configureExtra.settingMinTooHigh` | `(setting: string, n: number, total: number) => 'The minimum for ${setting} is ${n}, which is more than the ...` |
| `configureExtra.settingsSumWarning` | `(sum: number, total: number) => 'The setting minimums add up to ${sum}, more than the ${total} required. Ev...` |
| `configureExtra.fieldLabelRequired` | `"Enter a label for this field."` |
| `configureExtra.fieldLabelDuplicate` | `"Another field already has this label. Each field must be different."` |
| `configureExtra.fieldOptionsEmpty` | `"Add at least one option, one per line."` |
| `configureExtra.fieldOptionDuplicate` | `"Two options are the same. Each option must be different."` |

### S-08 (import review) `[INFER]`

Module: `lib/copy/import.ts` (55 entries)

| Key | Value |
|---|---|
| `importReviewCopy.needsAttentionOnly` | `"Show only rows that need attention"` |
| `importReviewCopy.nameConflict` | `"Another included row has the same name."` |
| `importReviewCopy.nameConflictHelp` | `"Two included rows have the same name. Rename, exclude or merge one of them before you create skills."` |
| `importReviewCopy.noRowsIncluded` | `"Include at least one row to create skills."` |
| `importReviewCopy.mergeTitle` | `"Merge rows"` |
| `importReviewCopy.mergeBody` | `"The first row is kept. Descriptions are joined and the other row is removed from this draft."` |
| `importReviewCopy.mergeWith` | `"Merge with"` |
| `importReviewCopy.mergeName` | `"Name after merging"` |
| `importReviewCopy.mergeAction` | `"Merge rows"` |
| `importReviewCopy.splitTitle` | `"Split row"` |
| `importReviewCopy.splitBody` | `"Enter one skill name per line. The first keeps the description."` |
| `importReviewCopy.splitNames` | `"Skill names, one per line"` |
| `importReviewCopy.splitAction` | `"Split row"` |
| `importReviewCopy.addTitle` | `"Add a skill"` |
| `importReviewCopy.addBody` | `"Add a skill the list did not include. It starts as part of this draft only."` |
| `importReviewCopy.addName` | `"Skill name"` |
| `importReviewCopy.addDescription` | `common.description` |
| `importReviewCopy.addAction` | `buttons.addSkill` |
| `importReviewCopy.moveCategory` | `"Set category"` |
| `importReviewCopy.categoryLabel` | `"Category"` |
| `importReviewCopy.noCategory` | `"No category"` |
| `importReviewCopy.noDescription` | `"No description"` |
| `importReviewCopy.statusNew` | `"New"` |
| `importReviewCopy.statusDuplicate` | `"Possible duplicate"` |
| `importReviewCopy.statusSkipped` | `"Will be skipped"` |
| `importReviewCopy.statusExcluded` | `"Excluded"` |
| `importReviewCopy.sourceHeader` | `"Source"` |
| `importReviewCopy.matchHeader` | `"Match"` |
| `importReviewCopy.includeHeader` | `"Include"` |
| `importReviewCopy.nameHeader` | `"Skill name"` |
| `importReviewCopy.descriptionHeader` | `common.description` |
| `importReviewCopy.categoryHeader` | `"Category"` |
| `importReviewCopy.actionsHeader` | `"Actions"` |
| `importReviewCopy.existingNote` | `(name: string) => 'Matches "${name}" in your library.'` |
| `importReviewCopy.unreadAddSkill` | `"Add as skill"` |
| `importReviewCopy.unreadAddCategory` | `"Add as category"` |
| `importReviewCopy.unreadIgnore` | `"Ignore"` |
| `importReviewCopy.unreadCategoryAdded` | `(name: string) => '"${name}" is now available as a category for rows in this draft.'` |
| `importReviewCopy.createDisabledReason` | `"Create skills is unavailable."` |
| `importReviewCopy.createFailed` | `"The skills were not created. Nothing was added to your library."` |
| `importReviewCopy.notFoundTitle` | `"This import is not open for review"` |
| `importReviewCopy.notFoundBody` | `"It may have been discarded or already confirmed. Start a new import to read another list."` |
| `importReviewCopy.confirmedSummary` | `(created: number, categories: number) => '${created} ${created === 1 ? "skill" : "skills"} created${categor...` |
| `importReviewCopy.configureNow` | `"Configure them now"` |
| `importReviewCopy.showThem` | `"Show them"` |
| `importReviewCopy.importAnother` | `"Import another list"` |
| `importReviewCopy.updateSkills` | `(n: number) => 'Update ${n} ${n === 1 ? "skill" : "skills"}'` |
| `importReviewCopy.selectedRows` | `(n: number) => '${n} selected'` |
| `importReviewCopy.include` | `"Include"` |
| `importReviewCopy.exclude` | `"Exclude"` |
| `importReviewCopy.merge` | `"Merge with…"` |
| `importReviewCopy.split` | `"Split…"` |
| `importReviewCopy.addHere` | `"Add a skill here…"` |
| `importReviewCopy.cancelLabel` | `buttons.cancel` |
| `importReviewCopy.nothingRead` | `"No skills were found in this source. Check the file, or paste the list."` |

### S-10 (course mapping) `[INFER]`

Module: `lib/copy/mapping.ts` (21 entries)

| Key | Value |
|---|---|
| `mappingCopy.skillMode` | `(skill: string, n: number) => 'Offerings where ${skill} is mapped (${n})'` |
| `mappingCopy.noMatch` | `"No course offerings match these filters."` |
| `mappingCopy.chooseOffering` | `"Choose a course offering"` |
| `mappingCopy.chooseOfferingBody` | `"Select an offering to see and change the skills it expects."` |
| `mappingCopy.offeringNotFound` | `"This offering was not found"` |
| `mappingCopy.searchSkills` | `common.searchSkills` |
| `mappingCopy.chooseRequirement` | `"Choose mandatory or non-mandatory"` |
| `mappingCopy.notYetSaved` | `"Not yet saved"` |
| `mappingCopy.saved` | `"Saved"` |
| `mappingCopy.notSaved` | `"This change was not saved. Try again."` |
| `mappingCopy.evidenceKept` | `"Evidence already recorded for this skill is kept."` |
| `mappingCopy.requirementFor` | `(skill: string) => 'Requirement for ${skill}'` |
| `mappingCopy.mapSkill` | `(skill: string) => 'Map ${skill}'` |
| `mappingCopy.configureInLibrary` | `"Configure skills in the library"` |
| `mappingCopy.allOptions` | `["All cohorts", "All academic years", "All terms", "All professional years"]` |
| `mappingCopy.panelRegion` | `"Skills mapped to the selected offering"` |
| `mappingCopy.listRegion` | `"Clinical course offerings"` |
| `mappingCopy.matchCount` | `(n: number, total: number) => '${n} of ${total} offerings match'` |
| `mappingCopy.mandatoryOf` | `(m: number, n: number) => '${m} mandatory of ${n}'` |
| `mappingCopy.noCohortShort` | `"No cohort enrolled"` |
| `mappingCopy.alsoMapped` | `(list: string) => s10.alsoMapped(list)` |

### S-04 and S-09 (IM-14 copy and apply configuration) `[INFER]`

Module: `lib/copy/apply-config.ts` (42 entries)

| Key | Value |
|---|---|
| `configParts.model` | `"Evaluation model, rule and criteria"` |
| `configParts.submissionFields` | `"Student submission details"` |
| `configParts.evaluatorComment` | `"Evaluator comment setting"` |
| `configParts.workflow` | `"Self-evaluation and administrator approval"` |
| `configParts.allowedRoles` | `"Allowed evaluator roles"` |
| `configParts.settingMinimums` | `"Minimums by clinical setting"` |
| `applyConfig.copyButton` | `"Copy configuration from another skill"` |
| `applyConfig.copyNoSource` | `"No configured skill exists to copy from yet."` |
| `applyConfig.copyTitle` | `"Copy configuration from another skill"` |
| `applyConfig.copyBody` | `"The copy is added to this form. Nothing is saved until you choose Save skill."` |
| `applyConfig.copyOverwrite` | `"This skill already has a configuration. Copying replaces the parts you select."` |
| `applyConfig.copyConfirm` | `"Copy configuration"` |
| `applyConfig.copyDone` | `(source: string, questions: number, levels: number) =>` |
| `applyConfig.copyDropped` | `"Minimums by clinical setting were not copied because this skill has no model yet."` |
| `applyConfig.applyButton` | `"Apply configuration"` |
| `applyConfig.applyFromHere` | `"Apply to selected skills"` |
| `applyConfig.applySaveFirst` | `"Save your changes first. Applying uses this skill as it is saved."` |
| `applyConfig.applyNoSource` | `"No configured skill exists to apply."` |
| `applyConfig.applyTitle` | `"Apply configuration"` |
| `applyConfig.applyBody` | `"The selected parts are copied to each target as an independent copy. Later edits to one skill never change...` |
| `applyConfig.sourceLabel` | `"Apply from"` |
| `applyConfig.sourcePlaceholder` | `"Choose a configured skill"` |
| `applyConfig.targetsLabel` | `"Apply to"` |
| `applyConfig.targetsNone` | `"Select at least one skill to apply to."` |
| `applyConfig.partsLegend` | `"What to copy"` |
| `applyConfig.planSummary` | `(n: number, overwritten: number) =>` |
| `applyConfig.needsModel` | `(n: number) => 'Also rebuild the model for ${plural(n, "skill", "skills")} that use a different evaluation ...` |
| `applyConfig.needsEvidence` | `(n: number) => 'Also overwrite ${plural(n, "skill", "skills")} that already hold evaluations. Their evaluat...` |
| `applyConfig.willSkip` | `(n: number) => '${plural(n, "skill", "skills")} will be skipped unless you confirm.'` |
| `applyConfig.willBeInvalid` | `(n: number) => '${plural(n, "skill", "skills")} would not be valid with this configuration and will be left...` |
| `applyConfig.confirm` | `"Apply configuration"` |
| `applyConfig.cancel` | `buttons.cancel` |
| `applyConfig.result` | `(applied: number, overwritten: number) => 'Configured ${plural(applied, "skill", "skills")}${overwritten > ...` |
| `applyConfig.resultNone` | `"No skills were changed."` |
| `applyConfig.resultLeft` | `(n: number) => (n === 1 ? "1 skill was left as it was." : '${n} skills were left as they were.')` |
| `applyConfig.status.applied` | `"Applied"` |
| `applyConfig.status.unchanged` | `"Already identical"` |
| `applyConfig.status.needsModelConfirmation` | `"Uses a different model. Not confirmed"` |
| `applyConfig.status.needsEvidenceConfirmation` | `"Holds evaluations. Not confirmed"` |
| `applyConfig.status.invalid` | `"Not valid with this configuration"` |
| `applyConfig.status.notFound` | `"Not found"` |
| `applyConfig.status.sameSkill` | `"This is the source skill"` |

### Shared atoms `[INFER]`

Module: `lib/copy/common.ts` (9 entries)

| Key | Value |
|---|---|
| `common.active` | `"Active"` |
| `common.inactive` | `"Inactive"` |
| `common.deactivate` | `"Deactivate"` |
| `common.reactivate` | `"Reactivate"` |
| `common.name` | `"Name"` |
| `common.email` | `"Email"` |
| `common.description` | `"Description"` |
| `common.searchSkills` | `"Search skills"` |
| `common.checkEntries` | `"Check these entries."` |

---

## Appendix: prototype-verbatim strings and the voice-rule exception (2026-10-08)

Romit's instruction ("build the exact mockup") overrides the workspace voice rule for the strings Sankalp's prototype shows. They are copied
**verbatim, including em-dashes**, into `admin/lib/copy/r1-library.ts`, `r2-configure.ts`, `r2-import.ts`, `r3-mapping-review.ts`,
`r4-reporting.ts` and `r5-student-preceptor.ts`. Those modules are deliberately **not walked** by `tests/copy/copy.test.ts`, and a second test
("voice-rule exception is explicit") makes the exception visible: every other copy module is still checked for em-dashes at the source level.

| Where | Verbatim string (kept) | Notes |
|---|---|---|
| Evaluation dialog title (S-03) | `IV Insertion — Noah Zeller` | R4 had replaced the dash with a comma; restored |
| Export items (S-17) | `By student — this table`, `By skill — this table`, `By tag — this table` | restored |
| Tag footnote (S-01 By tag) | `... so these rows overlap — that is what makes the view cross-cutting rather than a partition.` | restored |
| Offering label (S-10, S-12) | `NURS 350 — Clinical Practicum` | prototype data format |
| Import review (S-08) | `Line 9: SECTION 2 — ADVANCED PROCEDURES`, info bar `... — those are decided per skill afterwards.` | prototype sample + copy |
| Wizard (S-09) | `Edit skill — <name>`, `Step 1 of 3 — Skill definition` | prototype |
| Skill status pill when the display flag is `merged` | `Not Started`, `In Progress`, `Achieved` (title case) | the prototype's per-skill words; the Overview COUNT columns say `Achieved / In progress / Not met` (statusLabel). `Not Started` covers both "no evidence yet" and "evidence does not qualify" [INFER; OD-03 stays open]. With the flag on `four` the pill uses the four AE-04 labels |
| History counter (S-14) | `In progress` + helper `Sent but not finished` | prototype wording; DEC-012 (`Awaiting evaluation`) superseded. The pill/counter clash exists in the prototype too |
| Ledger result | `Counts as evidence` | prototype wording (replaces "Counted") |
| Return action (S-11) | `Return for correction` | NOT the prototype's `Return to preceptor`: kept neutral because OD-16 is open |

Everything else in `lib/copy` (non-prototype strings) still follows the voice rules in section 1.

### Behaviour found only in a real browser (kept for the record)
- Pressing a chip below an empty required field (`Met / Unmet`, `Add question`, `Add level`, `Add field`) first blurred the field; its required error then appeared above and moved the chip before the click landed, so the first click did nothing. The chips now keep focus on press (`onMouseDown` prevent-default).
- Escape inside an inline cell of the Import review closed the whole dialog and discarded the draft. The dialog now cancels only that cell's edit.
- Arrow keys on the model tiles moved focus without selecting on the first press; they now select the tile they land on every time (wrapping).

