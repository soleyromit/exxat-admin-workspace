# Skills Checklist v2: glossary, nav naming and rename map

Status: proposal for Romit's review. Nothing in app code was changed. Written 2026-10-26 from a read-only pass over `admin/components/v2`, `admin/lib/v2`, `admin/app/(v2)` and `admin/tests`.

Evidence tags: `[REQ id]` requirements document (its own words win), `[CALL]` raw call transcripts, `[COMP]` competitive analysis, `[PROTO]` Sankalp prototype or build prompt, `[V1]` the shipped non-v2 copy in `admin/lib/copy` (already decided and tested), `[INFER]` this document's reasoning. Nothing here decides an `OD-*`. Anything that rests on one is marked `(OD-n)`.

Sources read: REQ (`/tmp/sc-audit/requirements.txt`), the two calls, build prompt section 2.6 and screen table, `docs/ux/09-content-and-microcopy.md`, `docs/strategy/05-open-decisions.md`, `docs/v2/audit/T3` and `T4`, the competitive analysis, and the v2 source.

---

## 1. What the audit found (read this first)

1. **"Item" is never a REQ word.** REQ says skill, submission, evaluation, evidence. "Item" is the build prompt's internal generic for "whatever the program calls its thing" (`itemNoun`, build prompt 2.6) `[PROTO]`. The user is meant to see the program's noun (Skill, Competency, EPA, Essential, Procedure), never "item". v2 leaks it in about 20 user-visible strings, nearly all on the review queue (section 4, rows 1 to 16). `[INFER]`
2. **v2 has no configurable noun at all.** There is no `itemNoun` anywhere in `components/v2` or `lib/v2`. "skill" and "skills" are hard-coded in about 580 user-visible strings. Build prompt rule 6 forbids this. OD-28 (one list or two) is open and the calls drift toward one umbrella list `[CALL 10-08, 10-09]`, so the noun must stay swappable. `[PROTO]`
3. **One thing, three names.** The object a student sends is called "request" in student and queue copy, `Submission` in code and in REQ, and "item" on the review queue. REQ uses "submission" for the record and "evaluation request" only for the message that reaches the evaluator `[REQ ST-10, EV-01]`. `[V1]` copy already says "submission" to students and "evaluation" to staff.
4. **"Records" means four different things:** the student's own history (student nav "Record"), a director's verification worklist (staff nav "Records"), a "program record", and a "verified record". Only "skill record" (the per-student, per-skill state) is a REQ term `[REQ AE-04]`. "Verified record" and "program director verification" are not in REQ, not in either call, and not in the build prompt's meaning. In the prototype, "Unverified" means an **evaluator whose name has not been adopted** `[PROTO]`. So v2's "Verified / Not verified" collides with a prototype term that means something else. `[INFER]`
5. **"Outcomes" is the wrong word for what the page holds.** REQ outcome = the result of one evaluation (Met, Did not meet criteria) `[REQ SH-02]`. The nav row "Outcomes" opens a list of evaluations plus remediation plans.
6. **Outcome wording is inconsistent for the same value:** "Did not meet the criteria" (`outcomes.ts:10`), "Did not meet" (`tokens.ts:16`), "Not met" (`config.ts:27`), "Not yet met" (`tokens.ts:17`), "Not met yet" (`reports.ts:97`), "Not yet" (`outcomes-page.tsx:27`), "Not yet, feedback only" (`outcomes.ts:10`). REQ and `[V1]` (tested, DEC-003) say **Did not meet criteria** for one submission, and **Evidence does not qualify** / "criteria not yet met" for the skill record `[REQ SH-02, AE-04]`. REQ's default binary labels are **Met / Unmet**, not Met / Not met `[REQ section 4.1]`.
7. **Two review verbs on one product:** "Review and approve" (queue) and "Review and publish" (skill wizard last step, `rules.ts:12`, `home.ts:303`, `v2-titles.ts:21`). Different jobs, same first words.
8. **Out-of-scope vocabulary is in the nav.** "Remediation" is REQ section 14 (not covered) and strategy 07 says do not design it `[REQ 14]`. v2 has remediation plans, plan pages, "Open remediation plans" KPIs and a breadcrumb. Flagged, not decided here.
9. **"Starter libraries"** (`starter-library-page.tsx:33`, route `/v2/admin/starter-library`, `starter-libraries.ts`) sits against the hard stop "Prism ships no skills or taxonomy" `[REQ SL-01, section 1.7]`. The build prompt has "starter template" (AACN, ARRT and others) `[PROTO]`. Conflict is flagged, not resolved.

### 1.1 Term usage counts (user-visible strings only)

Counted with a grep over quoted strings and JSX text in `components/v2`, `lib/v2`, `app/(v2)`, excluding tests, `seed.ts` and `scenario.ts`. The pattern is permissive, so treat as +/-10%. Identifier hits (`item.id`, `items.map`) are excluded as far as a regex can; the real user-visible "item" count is lower than the raw figure (see 1.2).

| Term | Count | Verdict |
|---|---|---|
| skill / skills | ~580 | Correct noun by default; must become `{itemNoun}` |
| evaluation(s) | ~202 | Core REQ noun. Keep |
| outcome(s) | ~151 | Keep for the result of one evaluation only. Retire as a page/nav name |
| review (all forms) | ~151 | Keep as the reviewer's act. Never name a thing "review item" |
| counted / counts | ~148 | Keep. REQ "counted" `[REQ SH-02]` |
| verification / verified / verify | ~143 | Not in REQ. Keep only for the director act, flagged |
| record(s) | ~132 | Overloaded. Fix per glossary |
| request(s) | ~102 | Keep only for the outbound message and the evaluator inbox |
| approve / approval | ~78 | Keep. REQ "administrator approval" `[REQ SC-15, AR]` |
| mandatory | ~73 | Keep. Pair with "non-mandatory" `[REQ CM-03]` |
| waiting | ~69 | Keep, always with whom `[REQ SH-02]` |
| attempt(s) | ~55 | Keep for a further submission after a did-not-meet `[REQ RV-03]` |
| log / logged | ~58 | Student act. Keep (see rename 40) |
| awaiting | ~47 | Keep for "awaiting approval" only |
| sign-off / sign off | ~39 | Keep as verb and as the student's ask `[CALL]`; avoid as the name of a record |
| remediation | ~46 | Out of scope `[REQ 14]`. Flag |
| optional | ~35 | Since 2026-10-26 a per-course level in its own right (see **mandatory / recommended / optional**); do not use it for a skill that is merely not required elsewhere `[CALL 10-26]` |
| evidence | ~35 | Keep, staff and report side `[REQ AE-01]` |
| pending | ~23 | Retire in UI. Use waiting or awaiting approval |
| submission(s) | ~23 | Under-used. Should be the main noun (see glossary) |
| revision(s) | ~11 | Keep for a correction of the same submission `[REQ RV-01]` |
| item(s) | ~20 real | Retire everywhere. Replace by the precise noun |
| attainment | 1 | REQ reporting noun `[REQ RP]`; v1 nav uses it. Under-used in v2 |

### 1.2 Where the generic "item" is user-visible, and what it should say

| Location | Current | What the thing actually is | Precise noun |
|---|---|---|---|
| Review queue rows, counts, empty text | "items", "No items match" | One submission (one student, one request) holding 1+ evaluations awaiting approval, or a paper form awaiting an outcome | **submission** (list). The decision itself acts on **evaluations** `[REQ AR-01, V1]` |
| Breadcrumb `v2-titles.ts:22` | "Review item" | The detail page for one such submission | **Submission** (crumb), page title stays "{student}, {skills}" |
| Missing-item banners | "This item is not in the queue" | A submission already decided or never queued | **submission** |
| Bulk approve | "None of the selected items can be approved" | selected submissions | **submissions** |
| Director list `verification-pages.tsx:62,73` | "items to resolve" | Open evaluation requests and evaluations awaiting approval for that student (`r.pending`) | **open requests** (or "evaluations still open") |
| Charts `cumulative-line.tsx:40`, `stacked-bar.tsx:23` | default unit "item" | A skill or an evaluation depending on the chart | no default; caller passes `{itemNoun}` or "evaluation" |
| Sync (`scenario.ts:119`, `sync.ts`) | "conflict items" | A queued change | **change** (the page already says "Changes (n)") |
| Aria `review-item-page.tsx:135` | "Item facts" | Submission details | **Submission details** |

---

## 2. Glossary (controlled vocabulary)

Columns: **Use** is the only word allowed in UI. **Not** lists banned alternatives. **Who sees it:** A admin, S student, P preceptor / lab instructor (evaluator), R reviewer, D director. **Config** = whether the program can rename it. ux/09 section 2 already holds an older glossary; this one supersedes it where they differ, and the differences are called out in section 2.2.

### 2.1 Terms

| Use | Definition | Not | Who | Config | Basis |
|---|---|---|---|---|---|
| **skill** (the configurable noun, written `{itemNoun}` in code) | A practice-based thing a student is expected to perform and be evaluated on. The program may name it Skill, Competency, EPA, Essential or Procedure. | item, task, checkbox, checklist line, competency (unless the program chose it) | all | **Yes** via `{itemNoun}` and `{itemNounPlural}` (plus lower-case and article forms) | `[REQ 1.1, SL-01]` `[PROTO 2.6]` |
| **skills library** (`{itemNoun} library`) | The program's own list of skills. Prism supplies none. | catalogue, taxonomy, standard list, starter library (see flag) | A | Yes (follows noun) | `[REQ SL-01, 1.7]` |
| **category** | Optional grouping. A skill has at most one. The program's own list; picked or created while adding a skill ("Create \"{name}\""), no separate setup. In the library and filters it reads "Category"; a skill without one sits under "No category". | folder, section, group | A | No | `[REQ SL-03, SL-05]`; decision D-X28 |
| **tag** | Optional cross-cutting label, any number per skill. Report rows overlap. Picked or created while adding a skill; shown under the skill name with a tag glyph. UI forms: "Tags", "Add tags", "1 tag", "{n} tags", "Tags for all of them". | label, keyword | A | No | `[REQ SL-04, SL-05, RP-04]`; decision D-X28 |
| **evaluation** | One evaluator's completed assessment of one skill performance. Immutable once completed. | review, grade, assessment (use only as a verb), rating | all | No | `[REQ section 7, RV-05]` |
| **evaluator** | Umbrella for the person who evaluates: **preceptor** (placement site), **clinical faculty** (program), **lab instructor** (lab or simulation; may have no Prism account). | rater, grader, assessor, supervisor, signer | all | Role names are program data `[REQ OD-06 area]` | `[REQ EV-02, SL-08]` |
| **submission** | What a student sends to be evaluated: one or more skills performed in a setting, with the details the program requires. It is the record that moves through waiting, returned, counted. | request (for the record), ticket, form, item, entry | S, A, R, D | No | `[REQ section 6, SH-02, RV-01]` |
| **evaluation request** (short: **request**) | The message and link that reaches an evaluator so they can complete an evaluation. A request belongs to a submission. Used only for the outbound message and the evaluator's inbox. | submission (when you mean the message), invite, ticket | P, S (when sending), R (stalled) | No | `[REQ ST-10, EV-01]` |
| **log** (verb, noun "log entry") | A student recording that they performed a skill, before or without sending it. A log entry becomes part of a submission when sent. | record (verb), entry as a stand-alone noun in nav | S | No | `[INFER]`; REQ is silent; student calls use "log" `[CALL]` |
| **sign off** (verb only) | What an evaluator role is allowed to do for a skill. | sign-off as a noun for the record; verify; approve | A (config), S, P | No | `[REQ SL-08, EV]` `[CALL]` |
| **level** | A program-defined, ordered level of supervision on a demonstration. | rating, grade, tier | A, P, S | Labels are program data | `[REQ SC-08]` |
| **achievement rule** (UI: "what achievement requires"; REQ name: achievement criteria) | What must be true for a skill to count as achieved: qualifying evaluations, per-level minimums, setting minimums. | pass mark, threshold, requirements | A | No | `[REQ AE-03, section 4.2]` |
| **qualifies** (verb) / **qualifying evaluation** | An evaluation that satisfies the skill's qualification rule. | passing, successful (as the name of a kind of evaluation) | A, D | No | `[REQ SC-05]` |
| **outcome** | The result an evaluator records on **one evaluation**. Binary skills: the program's two labels (default **Met / Unmet**). Other models: answers or level. Never the name of a page. | result, grade, verdict, status | all | Labels yes | `[REQ SC-03, section 4.1]` |
| **Met** / **Unmet** | Default binary outcome labels. Program may rename (Pass / Fail). | Not met as the shipped default | all | Yes | `[REQ 4.1]` |
| **Did not meet criteria** | Outcome of **one submission/evaluation** that does not qualify. Never a skill-record status. | failed, rejected, unsuccessful, Did not meet the criteria, Did not meet | S, R, D | No | `[REQ SH-02]` `[V1 DEC-003, copy test]` |
| **Evidence does not qualify** | Skill-record state: evidence exists, none qualifies. | Not met, failed | S, A, D | No | `[REQ AE-04]` `[V1]` (OD-03 open on whether to merge it with "no evidence yet") |
| **Not yet met** | Skill-record state: some qualifying evidence, criteria not yet met ("in progress"). | Not met yet, Not yet | S, A, D | No | `[REQ AE-04]` (OD-03) |
| **Achieved** | Skill-record state: every criterion met. | complete, passed, done | all | No | `[REQ AE-04]` |
| **counted** | The evidence counts toward achievement. | accepted, valid, approved (approved is the reviewer's act) | all | No | `[REQ SH-02, AE]` |
| **waiting** (always "waiting with {name}") | Submission sent but no completed evaluation, or evaluation completed and held. Says who holds it. | pending, in limbo, in review | S, R, A | No | `[REQ SH-02]` |
| **awaiting approval** | An evaluation is complete and held for administrator approval; excluded from achievement until approved. Only for skills with approval on. | waiting for review, pending, in the queue | A, R, S | No | `[REQ SC-15, AR-01, AE]` |
| **approve** / **return** (return for correction) | The reviewer's two decisions on an evaluation awaiting approval. Approving counts the evidence. Returning sends it back with a reason. | reject, deny, decline, send back | A, R | No | `[REQ AR-05, SH-02]` (who corrects a returned evaluation: OD-16) |
| **revision** | A correction of the same submission. Continues one record, keeps a count and the return reason. Not allowed once counted or awaiting approval. | resubmit, edit, resend as a noun | S | No | `[REQ RV-01, RV-02]` |
| **further attempt** (noun: attempt) | A new, separate submission after a completed evaluation did not meet criteria. The first stays intact. | retake, try, retry, rep | S | No | `[REQ RV-03, SH-01]` |
| **lab or simulation** / **clinical setting** | Where the skill was performed. Lab or simulation evidence never satisfies a clinical-setting minimum. | practice room, unit type | all | Setting names are program data | `[REQ ST-05, section 4.2]` |
| **mandatory** / **recommended** / **optional** (plus **not mapped**) | Requirement level of a skill in a **course offering**; can differ by offering. Mandatory is the only level "Required this term" and pace read. Recommended marks "Likely here" and the placement-ending nudge. Optional can still be submitted and counts on the record, never toward required. Levels are overrides: the lists assigned to the offering's cohort already apply. Labels: `MAPPING_LEVEL_LABEL` in `lib/v2/labels.ts`; data `MappingRow.level`. | required (alone), core, non-mandatory (retired 2026-10-26) | S, A | No | `[REQ CM-03]`; three values from `[CALL 10-26]` (Sankalp: "mandatory, recommended, optional") |
| **From list** (level source) | A skill's level in a course offering that comes from a live list assigned to the offering's cohort, not from the course mapping (D-X27). Clinical offerings only; Optional unless the list names a level; a level set for the course or changed for the offering replaces it. Shown as a quiet "From list" beside the level. | inherited, default, auto-mapped | A | No | `[CALL 10-26]` D-X27 |
| **valid attempt** | One completed evaluation that the published rule counts on its own answers: the question rule (every question Yes, at least N of M Yes, or named questions Yes), the score rule, else the recorded outcome. "How many times" is how many valid attempts are needed. One engine decides it (`lib/v2/rules.ts runRule`) for student progress, the dashboard and the configure impact. | passing attempt, successful attempt (as a label) | A, S | No | `[REQ SC-05, AE-03]` `[CALL 10-26 B.4]` D-X27 |
| **rule version** | Each Publish of a skill's rule from the configure screens, kept in the shared store's rule history (`ruleChanges`, with the published rule). The live rule is the skill's configuration; the history drives "Changed since verified". | revision (a revision is a submission correction) | A, D | No | `[REQ AE-02]` D-X27 |
| **Clinical only** | Default course set on every course picker and on the population (Course mapping, scope bar Course, dashboards): clinical courses; "Include didactic" adds didactic ones. A default pending the client. Code: `Course.kind`, scope `incl=didactic`. | clinical filter | A | No | `[CALL 10-26]` (question for Arthi) |
| **custom group** | A student group made of filter rules (category, enrollment year, graduation year), for programs without a lockstep cohort. Its value carries the rules (`cg:...`), so the Group filter resolves it anywhere. How it maps to offerings is an open question. | segment, saved filter | A | No | `[CALL 10-26]`; REQ line 303 (group as its own filter) |
| **Required this term** | The mandatory skills of the student's own cohort's course offerings in the term. The only set behind pace, "behind", "required achieved" and student progress read. Code: `requiredSkillsFor` / `requiredThisTerm` in `lib/v2/population.ts`; fact `mandatoryRecords` in `lib/v2/facts.ts`. Never shown in the same figure as "Required to graduate". | required (alone), core | A, S, D | No | `[LEDGER D-X12]` built on `[REQ CM-03]`; Romit: "required means mandatory" |
| **Required to graduate** | The program list's required-before-graduation set (the checklist asterisk). Drives graduation readiness, one short (exactly 1 missing), short (2 to 3), far behind (4 or more, D-X11) and verification. Code: `requiredToComplete`; fact `requiredToGraduate`. | required (alone), graduation requirements | D, A | No | `[LEDGER D-X11, D-X12]` `[INFER]` dataset-spec arc 2 |
| **Graduation bands** (Complete / One skill short / Short / Far behind) | Against "Required to graduate": 0 missing, exactly 1, 2 to 3, 4 or more (`FAR_BEHIND_MISSING`). Code: `population.graduationStageOf`; words `GRADUATION_STAGE_LABEL` in `lib/v2/labels.ts`; director model `graduationStage` / `graduation`. The director's three-column `Stage` still folds 2 to 3 into its last column until the screens show the fourth band (empty in the data: 31 / 4 / 0 / 3). | behind (alone) for graduation | D | No | `[LEDGER D-X11]` |
| **Required set switch** ("Required this term" / "Required to graduate") | Which set an Attainment view reads; one set per view, never mixed. Defaults to "Required to graduate" for the graduating cohort, "Required this term" otherwise. URL `required=graduate` or `required=term` (renamed from `set` on 2026-10-26: `set` is the lab option set). Code: `buildAttainment(..., { basis })`, `REQUIRED_SET_OPTIONS`, `defaultRequiredSet` in `lib/lab/attainment.ts`. | required (alone) | A, D | No | `[LEDGER D-X12]` |
| **deactivate** / **reactivate** (state: Inactive) | Takes a skill out of mapping, student selection and every report figure; evidence is kept; reversible. Written to the shared store as `Skill.active === false` (`admin-actions.setSkillsActive`), so dashboard, attainment, director, drills and facts change together and after reload. | retire, archive, remove | A | No | `[REQ SL-02, SL-11]` `[LEDGER D-X14]` |
| **delete** (a skill) | Allowed only while nothing is tracked against the skill: no evaluation, request, practice log entry or lab check-off (`admin-actions.trackedAgainst`). A course mapping does not block it; the confirmation lists the courses it will be unmapped from, and they are unmapped (`deleteSkill`). | remove (for deactivate) | A | No | `[CALL 10-09]` `[LEDGER D-X15]` |
| **Rule needs approval** (held cause) | An evaluation held because its skill's configuration asks for approval (`config.approvalRequired`, SC-15). Never shown for a skill without that setting; listed after any other cause on the same submission. Code: `approvals.heldByRule`. | waiting for approval, pending | A, R | No | `[REQ SC-15, AR-01]` |
| **Counted / Awaiting approval / Returned / Reopened** (evaluation status) and **Approved / Returned** (review decision) | The words for one evaluation in a record, list or export. Code: `EVALUATION_STATUS_LABEL`, `evaluationStatusLabel`, `REVIEW_DECISION_LABEL` in `lib/v2/labels.ts`. "Did not count" stays the student's result word for an attempt that did not qualify (`lib/lab/student2.ts`). | Waiting for approval, Not met | A, R, S, D | No | `[REQ AR-05]` |
| **mapped course** (UI: "course") | A skill linked to a course offering, mandatory or not. Mapping is not eligibility. | linked, attached | A, S | No | `[REQ CM-01..03]` |
| **course offering** | A course in a term, academic year, professional year, with cohorts. | section, class | A | No | `[REQ CM-01]` |
| **cohort** / **group** | Cohort: students enrolled together in an offering. Group: reporting subdivision (a program group, a track or a custom group); since 2026-10-26 its own filter, no cohort needed, and with a cohort the two intersect. Do not use as synonyms. | class, batch (batch is lab-session only) | A, D | No | `[REQ CM-01, RP]`; `[CALL 10-26]` |
| **skill record** | One student's state on one skill (the four AE-04 states). | status row | A, D, S | No | `[REQ AE-04]` |
| **student record** | All of one student's skill records and submissions, as shown to staff or to the student (as "your record"). Replaces "program record". | program record, profile, file | S, R, D | No | `[INFER]` built on `[REQ AE-04]` |
| **verification** (verb: verify) | A program-director act that confirms a student's record is correct and can be shared outside the program. | Not in REQ. Do not use "verified" for evaluator adoption | D, S | No | `[INFER]` v2 addition; not in REQ, CALL or prototype meaning. Keep only if the feature is kept |
| **verified record** | The shareable output of a verification (PDF or CLR file). | official transcript | S, D | No | `[INFER]` same caveat |
| **remediation** | Not specified. REQ section 14 excludes a remediation workflow. | plan, intervention (until decided) | R, D, S | No | `[REQ 14]` flagged |
| **attainment** | How many skills a student or cohort has achieved, has in progress, has not met. | progress score, completion | A, D | No | `[REQ RP]` |
| **site** (UI: facility and unit, for example "Pine Hollow Medical Center, Neuro 7 North") | One unit of a facility where students are placed or evaluated. Evaluators are linked to a site by record (`Person.homeSiteId`), never by matching title text. Sample sites are fictional (decision D-X23). | location (as a synonym), hospital (for a clinic or lab), agency | A, S, D | No | `[INFER]` dataset spec 13 |
| **Sample data** (badge) | Every screen showing generated people, sites or evidence keeps this label. People, the university, hospitals, clinics and towns are fictional; HGTC skill names and NUR course numbers are real. | demo data, fake data, test data | all | No | `[LEDGER D-X23]` |

### 2.2 Differences from `docs/ux/09` section 2

| ux/09 says | This glossary says | Why |
|---|---|---|
| "Submission, request (to evaluator)" both allowed | One noun for the record (submission); "request" only for the outbound message | v2 uses "request" for both and the queue calls it an item |
| Reviewer "approver, moderator" banned | Same | agrees |
| "Evidence does not qualify" as skill status, "Did not meet criteria" as submission outcome | Same, and v2 must follow it | v2 contradicts it in six places |
| No entry for verification, student record, log, sign off | Added, marked `[INFER]` | v2 introduced them |

### 2.3 Decisions this glossary needs from Romit (not made here)

1. **Is the object a student sends a "submission" or a "request"?** This glossary recommends *submission* for the record and *request* for the message, matching REQ, the V1 copy and the queue's own bulk-approve strings. Student-facing screens currently say "request" everywhere (about 25 strings), so this is the largest wording change. `[INFER]`
2. **OD-28 (one list or two).** If skills, competencies and EPAs become one list, `{itemNoun}` still works. If the nav says "Skills" and the program calls them "Competencies", the nav label must read from the setting. Do not hard-code "Skills" in the nav; use the noun. `(OD-28)`
3. **OD-03 (states).** Whether "No evidence yet" and "Evidence does not qualify" are one display state. Affects the skill-record labels above. `(OD-03)`
4. **Keep or drop Verification, Remediation and Starter libraries** as named features. They are not in REQ. `(REQ 14, hard stop on shipped skills)`

---

## 3. Navigation naming

### 3.1 Current labels (`lib/v2/roles.ts` NAV_ROWS, 19 rows)

| Role | Current labels |
|---|---|
| Admin (7) | Dashboard, Skills library, Courses, Review and approve (badge), Outcomes, Records, Reports |
| Reviewer (3) | Review and approve (badge), Outcomes, Records |
| Director (3) | Outcomes, Records, Reports |
| Preceptor (2) | Requests (badge), Lab sessions |
| Student (4) | Home, Log skills, Requests (badge), Record |

Problems: the same three labels (Review and approve, Outcomes, Records) open the same components for three roles (T4); "Records" means verification for staff and history for students; "Outcomes" is a list of evaluations; "Dashboard" and "Home" are two names for one idea; "Log skills" and "Requests" are the first and last step of one flow; student nav is also duplicated in `student-frame.tsx:70-75` as a second hard-coded list.

### 3.2 Recommended set (12 rows)

> **Rename note (2026-10-26):** Romit decided the staff landing page is a **Dashboard**, not a Home. Admin rows here now say Dashboard. Student "Home" is unchanged here; `strategy/06-dashboard-patterns.md` section 2 proposes "Progress" for the student and a Dashboard for the director (both PENDING-ROMIT).

Count matches the T4 target (admin 4, reviewer 2, director 2, preceptor 0 (no sidebar; link-only entry point) [REQ EV-01], student 3: 11 sidebar rows). Row structure follows T4; labels are from this glossary. `(OD-28)` marks a label that depends on the skill noun.

| Role | Row label | Opens | Page title and tabs | Replaces | Open decision |
|---|---|---|---|---|---|
| Admin | **Dashboard** | Admin dashboard | Dashboard. Regions: hero, KPI strip, diagnose row, Needs you (see strategy/06) | Dashboard (kept) | none |
| Admin | **{Skills}** (plural of `{itemNoun}`) | Library | Title "{Skills}". Tabs: **Library**, **Courses**, **Add**. Sub-pages: Configure, Check and publish | Skills library, Courses | `(OD-28)` noun; the Courses-as-a-tab merge is T4's `[INFER]`, mapping is not eligibility `[REQ CM]` |
| Admin | **Approvals** (badge) | Approval queue | Title "Approvals". Tabs: Awaiting approval (n), Stalled (n), Returned (n). Row opens "Submission" | Review and approve | PENDING-ROMIT (01-IA recommends always shown with an empty state): shown only when a skill has approval on `[REQ SC-15]`. Fallback label "Review and approve" (existing, tested, `shell.test.tsx:40`) |
| Admin | **Attainment** | Reports | Title "Attainment". Tabs: Students, {Skills}, Evaluators. Drill-downs: a student's record, an evaluation's versions | Reports, Outcomes, Records (admin) | "Reports" is an acceptable fallback; v1 nav already says Attainment `[V1]` |
| Reviewer | **Approvals** (badge) | Approval queue | as admin | Review and approve | as admin |
| Reviewer | **Students** | Student list | Title "Students". Opens "Student record" with tabs Evaluations, Verification | Outcomes, Records | The merge is T4's `[INFER]`. Remediation tab only if kept `(REQ 14)` |
| Director | **Verification** | Verification list (landing) | Title "Verification". Groups: Not verified, Changed since verified, Verified. Opens "Student record" | Records | Name rests on keeping the verify feature `[INFER]`; not in REQ |
| Director | **Attainment** | Reports | as admin | Reports, Outcomes | as admin |
| Preceptor | **Requests** (badge) | Evaluator inbox | Title "Requests". Button "Record a lab session" opens the lab grid (a page, not a nav row) | Requests, Lab sessions | Preceptors have no login `[REQ EV-01]`; whether a nav shell shows at all is T4's question |
| Student | **Home** | Student home | Home | Home | none |
| Student | **Log** | Log flow | Title "Log a {skill}". Steps: Choose, Details, Send. Includes "Your submissions (n)" and the unsent badge | Log skills, Requests | Student noun for the sent thing is OD-free but is decision 1 in 2.3 |
| Student | **Record** | History | Title "Your record". Pace, then by-{skill} outcomes and attempts. Sub-page "Share record" | Record | "Verified record" sharing depends on keeping verification `[INFER]` |

Why these words:

- **Approvals** is task-first, one word, matches `[PROTO]` "Approval queue" and `[V1]` copy ("Evaluations awaiting approval"). "Review and approve" mixes two verbs and a second "Review and ..." exists (publish).
- **Attainment** is the REQ noun for what the page shows `[REQ RP]`. "Reports" names a container, not a question.
- **Verification** for the director replaces "Records", which no longer collides with the student's "Record".
- **Students** for the reviewer says what the lookup is keyed on.
- **Log** is the student's verb `[CALL]`; the plural noun is redundant in a nav row.
- Admin "Dashboard" (Romit 10-26: the staff landing is a dashboard, not a Home) and student "Home" end the drift (T4 P3-3); student label proposal in strategy/06.

### 3.3 Landing and breadcrumbs under the new set

| Role | Landing |
|---|---|
| Admin | Dashboard |
| Reviewer | Approvals |
| Director | Verification |
| Preceptor | Requests |
| Student | Home |

Breadcrumb children: Approvals > **Submission**; {Skills} > **Configure** / **Check and publish**; Students > **Student record** > **Evaluation**; Verification > **Student record**; Record > **Share record**.

---

## 4. Rename table

Format: `file:line` | current | proposed | reason. Lines are from the working tree on 2026-10-26 (it was moving while read). Paths relative to `/Users/romitsoley/Work/apps/skills-checklist/admin`. "OD" means gated on an open decision.

### 4.1 Generic "item" (retire)

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 1 | components/v2/v2-titles.ts:22 | "Review item" | "Submission" | One student's request holding evaluations; the page title already names student and skills |
| 2 | components/v2/review/review-item-page.tsx:51 | "Opening the item" (title and label) | "Opening the submission" | item |
| 3 | components/v2/review/review-item-page.tsx:54 | "This item does not exist." | "This submission does not exist." | item |
| 4 | components/v2/review/review-item-page.tsx:56 | "This item is not in the queue" | "This submission is not waiting for approval" | item; "queue" is a UI container, state is what matters |
| 5 | components/v2/review/review-item-page.tsx:54 | "This request is not waiting for review" / "This evaluation is not waiting for review" | "This submission is not waiting for approval" / "This evaluation is not waiting for approval" | REQ verb is approval `[REQ AR]`; request vs submission |
| 6 | components/v2/review/review-item-page.tsx:135 | aria-label "Item facts" | "Submission details" | item |
| 7 | lib/v2/queue.ts:146 | "Open the item to do it." | "Open the submission to do it." | item |
| 8 | lib/v2/queue.ts:217 | label "An item" | "A submission" | item |
| 9 | lib/v2/queue.ts:251 | "This item is not in the queue any more. It may already be approved or returned." | "This submission is no longer waiting for approval. It may already be approved or returned." | item |
| 10 | components/v2/review/review-queue-page.tsx:141 | aria "Items that stayed in the queue" | "Submissions that stayed in the queue" | item |
| 11 | components/v2/review/review-queue-page.tsx:164 | resultNoun="items", "No items match these filters." | resultNoun="submissions", "No submissions match these filters." | item |
| 12 | components/v2/review/review-queue-page.tsx:167 | caption "Items awaiting review" | "Submissions awaiting approval" | item; approval is the REQ state |
| 13 | components/v2/review/review-queue-page.tsx:329 | "None of the selected items can be approved right now." | "None of the selected submissions can be approved right now." | item |
| 14 | components/v2/director/verification-pages.tsx:62 | "Changed since verified or items to resolve" | "Changed since verified or open requests" | item = open request/evaluation |
| 15 | components/v2/director/verification-pages.tsx:73 | plural(r.pending, "item", "items") "to resolve" | "open request" / "open requests" | item |
| 16 | components/v2/viz/cumulative-line.tsx:40, stacked-bar.tsx:23 | default unit "item" | no default; require `unit` ("evaluation" or `{itemNoun}`) | item can leak into a legend or table |
| 17 | lib/v2/scenario.ts:119 | "queued, synced and conflict items" | "queued, synced and conflicting changes" | item; the sync page says "Changes" |

### 4.2 Nav, titles, breadcrumbs

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 18 | lib/v2/roles.ts:50 | admin "Dashboard" | keep "Dashboard" | Romit 10-26: the staff landing is a dashboard (strategy/06) |
| 19 | lib/v2/roles.ts:51 | "Skills library" | "{Skills}" (from `{itemNounPlural}`) with Library as first tab | Shorter; configurable `(OD-28)` |
| 20 | lib/v2/roles.ts:52 | "Courses" | tab "Courses" under {Skills} (admin) | T4 merge `[INFER]` |
| 21 | lib/v2/roles.ts:53, 59 | "Review and approve" | "Approvals" | One verb, task-first `[PROTO]` "Approval queue" |
| 22 | components/v2/review/review-queue-page.tsx:119, 127 | PageFrame title "Review and approve" | "Approvals" | follows nav |
| 23 | lib/v2/roles.ts:54, 60, 64 | "Outcomes" | "Attainment" (admin, director) / merged into "Students" (reviewer) | "Outcome" is the result of one evaluation, not a list of them `[REQ SH-02]` |
| 24 | components/v2/outcomes/outcomes-page.tsx:51, 53 | title "Outcomes" | "Evaluations" | page lists evaluations |
| 25 | components/v2/outcomes/outcomes-page.tsx:55, 59, 63 | "Outcomes summary", "Outcomes by skill" | "Evaluations summary", "Evaluations by {skill}" | as 24 |
| 26 | lib/v2/roles.ts:55, 61 | "Records" (admin, reviewer) | removed from admin; "Students" for reviewer | collision with student "Record" |
| 27 | lib/v2/roles.ts:65 | director "Records" | "Verification" | task name; keeps Records free `[INFER]` |
| 28 | components/v2/director/verification-pages.tsx:54, 56 | title "Records" | "Verification" | follows nav |
| 29 | components/v2/v2-titles.ts:37 | fallback `{ label: "Records" }` | "Verification" (director) / "Students" (reviewer) | follows nav |
| 30 | components/v2/v2-titles.ts:25 | "Program record" | "Student record" | "program record" is not a REQ term |
| 31 | components/v2/director/verification-pages.tsx:140 | "{name}, program record" | "{name}, student record" | as 30 |
| 32 | lib/v2/roles.ts:56 | "Reports" | "Attainment" | REQ noun; fallback "Reports" |
| 33 | components/v2/reports/reports-page.tsx:120, 162 | title "Reports" | "Attainment" | follows nav |
| 34 | lib/v2/roles.ts:68-69 | preceptor "Requests" | keep "Requests" | outbound message, correct usage |
| 35 | lib/v2/roles.ts:70 | "Lab sessions" | remove as a row; button "Record a lab session" on Requests | T4; term itself is fine |
| 36 | lib/v2/roles.ts:74 | "Log skills" | "Log" | verb; plural redundant |
| 37 | components/v2/student/log-flow.tsx:152, 157, 387 | title "Log skills" | "Log a {skill}" | one at a time; configurable |
| 38 | lib/v2/roles.ts:75, components/v2/student/student-frame.tsx:74, 94 | student "Requests" | row removed; unsent badge moves to "Log" | T4; request is not the student's noun (2.3 decision 1) |
| 39 | components/v2/student/request-signoff.tsx:146, 148 | title "Requests" | "Send for evaluation" | task-first |
| 40 | components/v2/student/request-signoff.tsx:151, 253 | "Request created", "Your requests ({n})" | "Submission ready to send", "Your submissions ({n})" | submission is the record |
| 41 | lib/v2/roles.ts:76 | student "Record" | keep "Record"; page title "Your record" | REQ "skill record" |
| 42 | components/v2/student/history-page.tsx:32, 34 | title "Record" | "Your record" | voice |
| 43 | components/v2/v2-titles.ts:21; lib/v2/rules.ts:12; lib/v2/home.ts:303 | "Review and publish" | "Check and publish" | frees "Review" for approvals only |
| 44 | components/v2/v2-titles.ts:30; components/v2/student/record-page.tsx:65, 68, 71 | "Share verified record" / "Share your verified record" | "Share record" / "Share your record" | `[INFER]` hold until verification is confirmed |
| 45 | components/v2/v2-command-menu.tsx:50-54 | group heading "Roles" | "Switch role" | task wording |
| 46 | components/v2/admin/admin-home.tsx:78, 100 | title "Dashboard" | keep "Dashboard" | as 18 |

### 4.3 Outcome and state wording

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 47 | lib/v2/outcomes.ts:10 | OUTCOME_WORD "Did not meet the criteria" | "Did not meet criteria" | `[REQ SH-02]` `[V1 copy.test.ts:77]` |
| 48 | components/v2/outcomes/evaluation-page.tsx:36, 75; version-timeline.tsx:83; preceptor/evaluation-form.tsx:394; student/history-page.tsx:128; review-item-page.tsx:268 | "Did not meet the criteria" | "Did not meet criteria" | as 47 |
| 49 | components/v2/viz/tokens.ts:16 | "Did not meet" | "Did not meet criteria" | one wording (affects aria labels, `viz.test.tsx:21,139`) |
| 50 | components/v2/reports/reports-page.tsx:88, 345; student/history-page.tsx:46; outcomes-page.tsx:26, 78 | "Did not meet" | "Did not meet criteria" | as 47 |
| 51 | components/v2/viz/tokens.ts:18 | "Waiting for review" | "Awaiting approval" | REQ state; also fixes mismatch with "Awaiting approval" in `outcomes-page.tsx:30` (`viz.test.tsx:22,95`) |
| 52 | components/v2/outcomes/outcomes-page.tsx:79 | "Waiting for approval" | "Awaiting approval" | one phrase |
| 53 | components/v2/outcomes/evaluation-page.tsx:29 | "Waiting for approval, not counted yet" | "Awaiting approval, not counted yet" | as 52 |
| 54 | components/v2/review/review-queue-page.tsx:111 | KPI "Awaiting review" | "Awaiting approval" | REQ verb |
| 55 | components/v2/review/review-queue-page.tsx:153 | tab "Awaiting ({n})" | "Awaiting approval ({n})" | tab stands alone in screen readers |
| 56 | components/v2/outcomes/outcomes-page.tsx:30 | STATUS_WORD "Counts" | "Counted" | REQ word |
| 57 | lib/v2/config.ts:27 | default labels ["Met", "Not met"] | ["Met", "Unmet"] | `[REQ section 4.1]` "Met/Unmet by default" |
| 58 | lib/v2/preceptor.ts:114, 117 | fallback "Not met" | "Unmet" | as 57 |
| 59 | lib/v2/reports.ts:97 | "Not met yet" | "Not yet met" | one order, matches `tokens.ts:17` and `[REQ AE-04]` |
| 60 | components/v2/reports/reports-page.tsx:285 | "Not met" | "Not yet met" or "Did not meet criteria", per state shown | two states share one label today |
| 61 | lib/v2/outcomes.ts:10, preceptor.ts:122, student/history-page.tsx:48 | "Not yet, feedback only" | flag only | The evaluator's third answer is not in REQ. REQ has two binary labels; "Not yet" also names a skill-record state. `[INFER]` |
| 62 | components/v2/outcomes/outcomes-page.tsx:27 | filter "Not yet" | "Feedback only" if 61 stays | removes clash with "Not yet met" |
| 63 | components/v2/student/student-home.tsx:107 | "Optional ({n})" | "Non-mandatory ({n})" | `[REQ CM-03]`; ux/09 bans required/optional |
| 64 | lib/v2/types, queue.ts, student-viz.ts, queue-viz.ts, tokens.ts:10-12 | "pending" in user-visible aria text | "waiting with {name}" or "awaiting approval" | pending is not a REQ state |

### 4.4 Request / submission / revision / attempt

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 65 | lib/v2/selectors.ts:27 | "Requests in the review queue" | "Submissions awaiting approval" | record, not message |
| 66 | lib/v2/selectors.ts:29 | "Requests returned to students" | "Submissions returned to students" | as 65 |
| 67 | lib/v2/selectors.ts:30 | "Requests with an evaluator" | "Submissions waiting with an evaluator" | as 65 |
| 68 | lib/v2/selectors.ts:28; review-queue-page.tsx:113, 218, 221 | "Stalled requests" | keep | the evaluator has not answered the request; correct |
| 69 | components/v2/student/returned-panel.tsx:34 | "Your reviewer returned this request." | "Your reviewer returned this submission." | `[REQ SH-02]` |
| 70 | lib/v2/queue.ts:282 | "This request is not returned ... A request that is waiting or counted cannot be sent again." | "This submission is not returned ... A submission that is waiting or counted cannot be revised." | `[REQ RV-01, RV-04]` |
| 71 | lib/v2/queue.ts:303, 304 | "Request sent again (revision n)" | "Submission revised and sent again (revision n)" | revision continues the same record |
| 72 | components/v2/review/review-item-page.tsx:160 | "Sent again n time(s)" | "Revision n" | `[REQ RV-02]` |
| 73 | components/v2/review/review-queue-page.tsx:255 | "n sent again" | "n revisions" | as 72 |
| 74 | lib/v2/home.ts:344 | ariaLabel "Review the request from {who}" | "Review the submission from {who}" | submission |
| 75 | lib/v2/home.ts:355, 367 | "Open record" | "Open student record" | clarity once Records is retired |
| 76 | components/v2/student/history-page.tsx:66 | "Log a skill and ask for sign-off. Each attempt shows here with what counted." | "Log a {skill} and send it for evaluation. Each submission shows here with its outcome." | submission, not attempt, is the unit; attempt is a further submission after did-not-meet |
| 77 | components/v2/student/history-page.tsx:68 | "Log a skill" | "Log a {skill}" | configurable |
| 78 | components/v2/outcomes/remediation-page.tsx:135 | "Log a new attempt" | "Make a further attempt" | `[REQ RV-03]`, ux/09 section 3.1 |
| 79 | components/v2/admin/wizard-steps.tsx:337-339 | "clinical attempt", "Practice trials before a clinical attempt" | "first clinical evaluation", "Practice trials before the first clinical evaluation" | "attempt" is reserved for a further submission; "practice trial" is not a REQ term `[INFER]` |
| 80 | lib/v2/verification.ts:64 | "{n} sign-off request(s) still open" | "{n} evaluation request(s) still open" | sign-off is a verb; test regex follows |
| 81 | lib/v2/student.ts:364, 381, 643, 644 | "Ask for sign-off", "Waiting on sign-off", "Request for sign-off", "Requested sign-off" | "Send for evaluation", "Waiting for {evaluator}", "Sent for evaluation", audit "Sent for evaluation" | name the act and the person, not the form |
| 82 | components/v2/student/log-flow.tsx:416, 419; history-page.tsx:66; request-signoff.tsx:205, 369, 371, 408, 413, 424 | "Ask for sign-off", "sign-off" as noun | "Send for evaluation"; keep "sign off" as verb ("asks X to sign off") | `[CALL]` uses sign off; avoid as the record's name |
| 83 | components/v2/student/request-signoff.tsx:124 | "Request sent to {who}" | keep | outbound message; correct |

### 4.5 Reopen, remediation, verification (scope or REQ conflicts)

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 84 | components/v2/outcomes/evaluation-page.tsx:158 | "Reopen to edit" | "Request a correction" | T3 finding: completed evaluations are immutable `[REQ RV-05]`; label says edit `(OD: D20 per T3)` |
| 85 | outcomes-page.tsx:28, 30, 48; evaluation-page.tsx:31, 115, 146 | "Reopened" | "Correction requested" | as 84 |
| 86 | components/v2/outcomes/outcomes-page.tsx:47, 108-123; remediation-page.tsx:126, 155; v2-titles.ts:26; selectors.ts; home | "Remediation plan", "Open remediation plans" | flag, no rename | `[REQ 14]` out of scope; do not extend |
| 87 | components/v2/admin/starter-library-page.tsx:33; roles / paths `starter-library` | "Starter libraries" | flag, no rename | `[REQ SL-01]` hard stop on shipped skills; `[PROTO]` "starter template" disagrees |
| 88 | components/v2/director/verification-pages.tsx:48 | "Records verified" | "Verified" | with title "Verification" the noun repeats |
| 89 | lib/v2/selectors.ts:37 | "Student records verified" | "Students verified" | as 88 |
| 90 | lib/v2/selectors.ts:26 | "Evaluation versions on record" | "Evaluation versions" | "on record" is filler |

### 4.6 Missing configurable noun

| # | file:line | Current | Proposed | Reason |
|---|---|---|---|---|
| 91 | whole of components/v2, lib/v2 (about 580 strings) | "skill", "skills" literal | `{itemNoun}` / `{itemNounPlural}` from one `lib/v2/terms.ts`, with lower, Capital and plural forms and an article ("a"/"an") | build prompt rule 6; OD-28 open. Highest-count items: nav, wizard, student home, queue. Variable names and route names can stay `skill` |
| 92 | lib/v2/roles.ts (nav titles) | static strings | build titles from the term map; `student-frame.tsx:70-75` should read `NAV_ROWS` instead of its own copy | single source |

### 4.7 Tests that assert current strings (update with the renames above)

| Test | Line | Asserts |
|---|---|---|
| tests/v2/nav.test.ts | 18-23, 29-31, 36-37, 41-42, 57-58, 63-65 | all nav titles: Dashboard, Skills library, Review and approve, Outcomes, Records, Reports, Requests, Lab sessions, Home, Log skills |
| tests/v2/nav.test.ts | 99-100 | crumbs "Skills library", "Dashboard" |
| tests/v2/nav.test.ts | 105-115 | crumb pairs incl. "Review item", "Program record", "Review and publish", "Share verified record", "Remediation plan" |
| tests/v2/nav.test.ts | 127 | `v2CrumbsFor("/v2/director/evaluation/e1")[0].href` = /v2/director/outcomes (URL, not label; keep route stable or update) |
| tests/v2/viz.test.tsx | 21, 22, 95, 139 | aria names "Did not meet", "Waiting for review" |
| tests/v2/verification.test.ts | 48 | regex `/sign-off request is still open/` |
| tests/v2/preceptor.test.ts | 108, 132, 134 | "Not yet records feedback only"; labels `["Met","Not met","Not yet, feedback only"]` |
| tests/v2/student.test.ts | 354 | audit action starts with "Requested sign-off" |
| tests/v2/outcomes.test.ts | 213 | "separates Not yet from Did not meet" (label-free; revisit if 61 changes) |
| tests/shell.test.tsx | 31, 40 | v1 shell labels incl. "Attainment"; "Review and approve" rule (v1, unaffected unless v1 nav renamed) |
| tests/ui/shell-chrome.test.tsx | 31 | v1 nav `["Home","Skills","Courses","Attainment","Reviews"]` |
| tests/copy/copy.test.ts | 75-77 | v1 "Did not meet criteria" (supports rename 47-50) |

---

## 5. Copy rules (apply to every string in section 4)

1. Sentence case everywhere: titles, tabs, buttons, column headers, nav. Capitalise only the first word and proper nouns (Prism, course codes). `[ux/09 section 1]`
2. No em dashes in UI copy, comments, docs or commits. Use a full stop, comma or colon. `[PROTO rule 8]`
3. Plain and active. "Approve" not "Approval action". Verb plus object on buttons ("Send for evaluation", "Make a further attempt"). Name the person who holds the work ("Waiting for J. Delgado").
4. One noun per concept (section 2). Do not use two words for the same thing on adjacent screens. Do not use one word for two things.
5. Never print a requirement ID, OD number, stakeholder name or "per Sankalp" in UI. The T4 audit found none in rendered output; keep it that way. `[ux/09]`
6. Say the rule, not the verdict. A negative outcome states which rule was not met and what the student can do next. `[REQ SH-03]`
7. Do not hard-code the skill noun. Use `{itemNoun}` forms. Do not name Prism as the supplier of skills. `[PROTO 2.6]` `[REQ SL-01]`
8. Status never rests on colour. Every state keeps its glyph and label. `[PROTO rule 7]`
9. Never use "item", "pending", "entry" (alone), "ticket", "record" as a verb, "reject", "fail" or "retake" in UI.
10. Evaluator copy is shorter than student copy. One instruction per screen. `[ux/09]`
11. No colloquialisms ("heads up", "oops"), no exclamation marks, no emoji.

---

## 6. Uncertainties

- Line numbers were taken while other workers were editing (T4 notes the nav label flipped mid-audit). Re-run the grep before applying a batch.
- The user-visible counts in 1.1 come from a pattern match, not a render. They overcount slightly where a quoted string is code (class names, keys).
- Whether the student should see "submission" or keep "request" is Romit's call (2.3). I chose submission because REQ, the V1 copy and the queue's bulk-approve text already use it. It touches about 25 student strings.
- "Approvals" and "Attainment" are recommendations, not REQ labels. Both have fallbacks ("Review and approve", "Reports") that are already in code or tests.
- "Verification" and "Student record" are `[INFER]`. If Sankalp or Aarti do not want a director-verification feature, the director nav loses its first row and the student "Share record" page changes.
- The "Not yet, feedback only" evaluator answer has no REQ source. I could not find it in REQ, either call or the build prompt. It may be an earlier prototype idea.
- I did not check the non-v2 routes or the `docs/v2` decision log beyond T3 and T4.
