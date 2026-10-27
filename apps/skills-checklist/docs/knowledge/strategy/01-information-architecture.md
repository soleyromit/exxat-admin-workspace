# 01 Information architecture: what the user is looking at, where it lives, how roles hand work to each other

**Written:** 2026-10-26 · **Status:** proposal for Romit. No app code was changed. No `OD-*` is treated as decided.
**Siblings:** `02-content-strategy.md` (words), `03-ux-and-interaction.md`, `04-ui-and-visual.md`, `05-data-viz-and-charts.md` (written in parallel by other writers; read them for interaction, visual and chart decisions this file only points to). Inputs: `../00-design-brief.md`, `../01-competitive-digest.md`, `../02-decisions-ledger.md`, `../glossary.md`, `../dataset-spec.md`.
**Tags:** `[REQ id]` · `[CALL]` Oct 8/9 transcripts · `[COMP name]` competitive digest · `[BUILD-PROMPT §n]` · `[AUDIT Tn]` v2 audits · `[LEDGER D-x/Q-n]` · `[GLOSSARY]` · `[UX-03]` `docs/ux/03-information-architecture.md` · `[RESEARCH-v2]` `docs/build/research/v2-ia-and-content-strategy.md` · `[INFER]` my reasoning. `PENDING-ROMIT` = needs his call; both options written out. Precedence REQ > CALL > PROTO > INFER.

## Why this doc exists

1. Romit said the navigation is too big and the roles do not connect ("dots must connect per role") [LEDGER D-A, D-C]. This doc turns that into a structure that can be built and reviewed, so he never has to re-explain it.
2. Every structural statement here carries its reason, the alternative we rejected and a review test. If a reason stops being true, the structure should change, not just the label.
3. It reconciles the existing v2 IA research with the 10-26 decisions: where the earlier "confirmed nav holds" conclusion is now overruled, it says so and says why (section 12).

## Reading guide: the 8 decisions that shape everything

| # | Decision (recommended) | Status |
|---|---|---|
| IA-1 | Six first-class object types; everything else is a lens (filter, tab or linked drill-down), not a nav row | Recommended [INFER] |
| IA-2 | 11 sidebar rows + 1 evaluator inbox page = 12 destinations (admin 4, reviewer 2, director 2, student 3, evaluator 0 rows) | Row list proposed by audit, not approved [LEDGER D-A] |
| IA-3 | Role is a permission, not a path: one staff route tree, one URL per record for every staff role | Recommended [INFER] |
| IA-4 | Every record name is a link built by one `linkTo`; the record rides in the URL | Settled intent [BUILD-PROMPT §8.1, §8.4] |
| IA-5 | Each handoff leaves a visible cue at the receiver's entry point | Settled intent [LEDGER D-C] |
| IA-6 | Three shells: staff, student, evaluator (no chrome) | Recommended; evaluator part is a hard stop [REQ EV-01] |
| IA-7 | Scale rule: search first, group by section, filter chips, saved views; designed at 123 students and 150+ skills | Settled intent [LEDGER D-D] |
| IA-8 | Open: student noun, director verification, web vs phone first, Courses as tab | PENDING-ROMIT (section 13) |

---

## 1. Goals this IA must serve (the test every choice is held against)

| Goal | Evidence | What it demands of the IA |
|---|---|---|
| A student sees what is left and asks for a sign-off in seconds | [REQ SH-04] [CALL] [COMP: students cannot see what is left, about 3 mentions; table stakes] | The landing is progress plus the next action, never a settings or sync screen |
| An evaluator signs with no login in under 2 minutes | [REQ EV-01, EV-05] [COMP: 22 s to 2.7 min] | No app chrome; one link; all open requests reachable from it |
| A reviewer clears the queue and knows why each record is held | [REQ AR-01, AR-02] [AUDIT T3 gap 3] | Queue row states cause; item page links to student, skill, evaluator |
| A program traces any figure to its evidence | [REQ RP-05, RP-06, RP-07] | Every number is a link; drill-down keeps filters |
| An admin gets 150+ skills live without retyping | [REQ IM-01, IM-10, IM-14] | Library is searchable, grouped, bulk-configurable; backlog is visible from the Dashboard |
| Fewer rows, less chrome | [LEDGER D-A] | Row count is a budget, not an outcome |

---

## 2. Object model: what the user is looking at

The REQ gives capability, not a schema, so entity names are [INFER] [UX-03 section 1]. The question this section answers is different: **which objects deserve a place to live (a route and a way to reach it), and which are only ways of looking at other objects.**

### 2.1 The objects

| Object | Plain meaning | Owner | Cardinality that matters for IA | Source |
|---|---|---|---|---|
| **Skill** (program's noun, `{skill}`) | One thing a student must be evaluated on | Program | 1 category, n tags, 1 configuration | [REQ SL-02..04, SC-02] |
| **Skill record** | One student's state on one skill, shared across courses | Student x Skill | Exactly one per pair | [REQ AE-04, AE-05, CM-07] |
| **Submission** | What a student sends for evaluation; moves through waiting, returned, counted | Student | Many per skill record; numbered attempts | [REQ SH-01, SH-02] [GLOSSARY] |
| **Evaluation** | One evaluator's completed assessment of one skill performance; immutable | Evaluator | At most one per submission per skill | [REQ RV-03, RV-05] |
| **Student** (and their record) | The person; "student record" = all their skill records and submissions | Program | 1 cohort | [REQ AE-04] [GLOSSARY] |
| **Course offering** | A course in a term with cohorts; maps skills mandatory or not | Program | Many skills; mapping is expectation, not eligibility | [REQ CM-01..05] |
| **Cohort** | Students enrolled together | Program | Many students | [REQ CM-01] |
| **Evaluator** | Preceptor, clinical faculty or lab instructor; may never have an account | Program roster | Many requests | [REQ EV-02, SL-08, SL-09] |
| **Site** (placement site) | Where clinical evidence was gathered | Program | 2,141 in the reference set (120 in the v2 dataset) | [BUILD-PROMPT §6] [dataset-spec] |
| **Clinical setting** | Inpatient, emergency and so on | Program list | Small list (about 6) | [REQ SL-07] |

### 2.2 First-class destination or lens?

A **destination** has a nav row or a tab, because someone starts a task there. A **lens** is a filter, a context key or a drill-down page you only reach from another object. Rule (IA-1): **an object is a destination only if some role begins a work session with it.** Everything else is reached by link and carries its record in the URL.

| Object | Verdict | Where it lives | Why (evidence) | Rejected alternative and why |
|---|---|---|---|---|
| Skill | **Destination** (admin) | Nav row `{Skills}`, tab Library | Admin starts setup with the library; configuration backlog is the first job [REQ IM-10] [AUDIT T1] | Splitting "Library" and "Configure" into two rows: configuration is a state of a skill, shown as a filter ("Needs configuration"), not a place [UX-03 section 6] |
| Submission | **Destination** (reviewer/admin: Approvals; student: Log) | Approvals queue; student Log and Record | The reviewer's whole job is the queue [CALL: coordinator approves]; the student's job starts by creating one | A "Submissions" row for staff: the only staff task on submissions is approval, so the row is named for the task |
| Evaluation | **Lens** | Sub-page reached from a student record, a submission or a report cell | Nobody starts a session with "all evaluations"; the v2 Outcomes row (a list of evaluations) is the example of a lens promoted to a row [AUDIT T3, T4] | Keep "Outcomes" as a row: it duplicates Students and Attainment for three roles (identical word counts 914 per page) [AUDIT T4] |
| Student / student record | **Destination** (reviewer: Students row) and **lens** (admin, director) | Reviewer row; admin and director reach by link from Attainment or Verification | One per-student page replaces Outcomes plus Records [AUDIT T4] | Separate "Records" row for admin: collides with the student's "Record" and duplicates the page [GLOSSARY section 1 point 4] |
| Course offering | **Tab under `{Skills}`** (admin) and a context key | `{Skills}` > Courses; also filter on Attainment | Mapping is an act on a skill ("Map it to NURS 350 next" is already the publish banner's next step) [AUDIT T4] | Own row: see section 13, Courses question (PENDING-ROMIT) |
| Cohort | **Lens** | Filter and context key `coh` | A cohort is a way to scope reports and queues [REQ RP-01] | Cohort page: no job starts here |
| Evaluator | **Tab under `{Skills}`** (admin) plus linked name everywhere | `{Skills}` > Evaluators (roster, adopt, merge) | Adoption is a library-maintenance job [REQ SL-09] [BUILD-PROMPT admevals]; v2 has no such screen yet [AUDIT T3 P0] | Row "Evaluators": a rarely used admin list does not earn a row |
| Site | **Lens** | Linked name opens a site snapshot page; filter on reports | Used to explain aging and waits [BUILD-PROMPT ccsite]; never a starting point | A Sites row: 2,141 sites would turn nav into a directory |
| Clinical setting | **Lens / settings list** | `{Skills}` > Clinical settings (tab) | Program list used by configuration [REQ SL-07] | Standalone settings area: one list does not justify a section |

**Check:** if a reviewer proposes a new nav row, ask "does a named role begin a work session here?" If not, it is a tab, a filter or a linked page.

---

## 3. Per-role top-level navigation

### 3.1 The proposal (12 destinations)

> **Rename note (2026-10-26):** the admin landing is a **Dashboard**, not a Home [ROMIT 10-26]. Interaction and region rules: `06-dashboard-patterns.md`. The student landing is **My progress** [LEDGER D-L4], replacing the earlier "Home" here and the "Progress" proposal in 06; where this file still says student "Home" (hop table, diagrams), read My progress. A director Dashboard is still open.

Count: admin 4 + reviewer 2 + director 2 + student 3 = **11 sidebar rows**, plus the **evaluator inbox** (a page, not a row) = 12. T4 counted the evaluator as 1; I count the page and not the row, because an evaluator with no account has no sidebar [REQ EV-01] [AUDIT T4 P1-3]. Today: 19 rows [AUDIT T4].

| Role | Row (label from GLOSSARY, `{Skills}` = program noun plural) | The job it serves | Landing |
|---|---|---|---|
| Admin | **Dashboard** | Who is behind, what blocks them, what needs me (a dashboard, not a Home; see 06) | Yes |
| Admin | **{Skills}** | Add, configure, publish, map, maintain the library; tabs Library, Courses, Evaluators, Clinical settings | |
| Admin | **Approvals** (badge) | Decide held evaluations | |
| Admin | **Attainment** | Who has achieved what, with the evidence behind it | |
| Reviewer | **Approvals** (badge) | Clear the queue | Yes |
| Reviewer | **Students** | Look up one student: evaluations, history | |
| Director | **Verification** | Confirm a record can be shared (PENDING-ROMIT: feature not in REQ) | Yes |
| Director | **Attainment** | Cohort readiness; find who is behind | |
| Student | **My progress** | What is left, what is waiting, do this next [LEDGER D-L4] | Yes |
| Student | **Log** | Log a skill and send it for evaluation; unsent badge | |
| Student | **Record** | Every submission, outcome and reason; share | |
| Evaluator | (no rows) **Requests** page | Sign what was asked, in one sitting | Link target |

### 3.2 What is NOT in the nav, and why

| Removed or never added | Where it went | Why |
|---|---|---|
| Outcomes (admin, reviewer, director) | Evaluation sub-pages, Students record, Attainment drill-down | Same 914-word page under three roles; "outcome" is the result of one evaluation, not a page [AUDIT T4] [GLOSSARY] |
| Records (admin, reviewer) | Merged into Students (reviewer) or reached by link (admin) | "Records" meant four things [GLOSSARY section 1 point 4] |
| Courses (admin row) | Tab under `{Skills}` | Same setup job [AUDIT T4] [INFER]; see PENDING-ROMIT in section 13 |
| Lab sessions (preceptor row) | Button "Record a lab session" on the evaluator Requests page | Only one person has this job; a row for one person is chrome [AUDIT T4] |
| Requests (student row) | Second half of Log; unsent badge on Log | "Ask for sign-off" is the last button of the log flow [AUDIT T4] |
| Remediation | No row; linked from a student record only if kept | REQ section 14 says not covered; do not extend [REQ 14] [LEDGER Q5] |
| Starter libraries | A choice inside "Add skills", only if Romit keeps it | Conflicts with the hard stop on shipped skills [REQ SL-01] [LEDGER Q5] |
| Reports tabs for evaluator consistency, tags | Inside Attainment views | See section 4 |
| Notifications, Help, Search as separate nav | Utility bar (DS shell order) | They are not destinations [DEC-023] |

### 3.3 Why 12, and what the row-count arguments really are

Honest accounting, because the numbers can be over-sold:

| Argument | What it actually supports |
|---|---|
| **Romit's decision** [LEDGER D-A] | The primary reason. The cap is a product decision, not a psychology result. |
| Miller's 7 plus or minus 2 | Weak for navigation: it concerns holding items in working memory; a visible sidebar is recognition, not recall. Use only as an upper bound: no role exceeds 7 today (admin had exactly 7) and none now exceeds 4. [INFER] |
| Hick's law | Time to choose grows with the number of equally likely options. Useful where rows compete: admin's old Review / Outcomes / Records / Reports were four near-synonyms for "look at results". Cutting to Approvals and Attainment removes the competition. [INFER] |
| Competitor navs | **The competitive digest records capabilities, not nav row counts; I cannot cite counts for the 22 products [COMP], so I do not.** Analogues from the earlier Mobbin pass: Deel and Workable keep approvals as one badged row; Babbel 3, Strava 5, Speak 5 bottom tabs [RESEARCH-v2 section 4.2]. They support "approvals badged, student 3 to 5 tabs", not the number 12. Reviews say settings are scattered and reports weak across CORE, Sonia, Tevera (about 12 mentions) [COMP section 5], which supports "configuration in one place, reports one click from the Dashboard". |
| Duplicate pages per role | Concrete evidence: Review, Outcomes, Records and Reports render identical components for admin, reviewer and director [AUDIT T4]. |

**Rejected: keep 19 and reduce chrome only.** The audit shows the duplication is in rows, not styling. **Rejected: one 4-row staff nav for all staff roles** ("To do, Students, Skills, Reports" [AUDIT T3 proposal]). It is attractive (one nav, permission differences only), but it shows a reviewer a Skills row they cannot use and a director an Approvals-shaped "To do" they do not own; per-role subsets of one row catalogue give the same single-source benefit (IA-3) without dead rows. **Review check:** each role's rows all open a page that role can act on; no role sees a row that is read-only for them without saying so.

### 3.4 Row catalogue (single source)

One catalogue, per-role subsets, so the three hand-written nav lists in v2 (`lib/v2/roles.ts`, `student-frame.tsx:70-75`, command menu) collapse into one [AUDIT T4] [GLOSSARY section 4.6].

```
catalogue:  dashboard | home | skills | approvals | students | verification | attainment | log | record
admin       dashboard, skills, approvals, attainment
reviewer             approvals, students
director                                    verification, attainment
student     home, (log), (record)   -> student shell, own set
```

Approvals row visibility: **always shown to reviewer; shown to admin always, with an explanatory empty state when no skill requires approval.** The glossary suggested hiding it unless a skill has approval on. I recommend against hiding: a row that appears and disappears breaks the "same place every time" test and the demo story step 8 to 9 cannot show the held branch live if it vanishes [AUDIT T4 P1-5] [INFER]. Alternative: hide when zero skills have approval on [REQ SC-15]; consequence: less chrome for programs that never use approval, but admin loses a stable target. PENDING-ROMIT, low stakes.

---

## 4. Page hierarchy and tabs

Rule (IA-1b): **tabs split one object into views; they never split one task into steps and never hold two objects.** Tabs max 4 per page [INFER]. A sub-page is reached only by a link and shows a breadcrumb once, not a back button as well [UX-03 section 3].

### 4.1 Sitemaps (ASCII)

**Admin (staff shell)**
```
Dashboard
  Needs attention  -> rows link to the exact record (not the list) [AUDIT T4 P2-3]
  Set up           -> configuration backlog, "N skills in use, not in {course}"
  Cohort           -> weakest skills strip + behind-pace dot strip [RESEARCH-v2 G1]
{Skills}
  Library  (search, filter, group by section)  [Add skills] [Import]
    Skill   -> Configure (steps) -> Check and publish
  Courses  (offering list)
    Course  -> coverage matrix, mandatory/non-mandatory
  Evaluators (roster, unverified names, adopt/merge)   [REQ SL-08, SL-09]
  Clinical settings
Approvals (badge)
  Awaiting approval (n) | Stalled (n) | Returned (n)
    Submission -> Student record | Skill | Evaluator   (all links)
Attainment
  Students | {Skills} | Evaluators (only if n >= small-numbers floor)
    Student record -> Skill record -> Evaluation (full responses) -> Version history
    Export (sheet, not a tab)
```

**Reviewer**
```
Approvals (landing)     as admin
Students
  list -> Student record -> Evaluation -> Version history
```

**Director (PENDING-ROMIT on Verification)**
```
Verification (landing)  groups: Ready | Has gaps | Changed since verified | Verified
  Student record (verify action lives here)
Attainment              as admin
```

**Student**
```
My progress  progress, Do this next, waiting (with whom), returned (why)
Log       choose skills -> details -> send for evaluation ; "Your submissions (n)"
Record    by {skill}: submissions, attempts, outcomes, failed-rule reasons ; course filter [REQ SH-06]
  Skill   -> Submission -> Evaluation (full) 
  Share record (only if verification is kept)
```

**Evaluator (no shell chrome)**
```
Email link  -> Requests (all open, grouped by student)
                 Evaluation form (one student, all skills, one sitting)
                   Receipt: "Counted" or "Held for approval"  -> Back to requests
              [Record a lab session] -> Lab batch grid  (lab instructors only)
```

### 4.2 Why these hierarchies

| Choice | Why | Rejected, and why |
|---|---|---|
| Attainment has 3 views Students / Skills / Evaluators, Export as a sheet | The REQ names exactly these cuts [REQ RP-02, RP-03]; the v2 page held 5 tabs plus PDF signing plus PDF check [RESEARCH-v2 G3] | Keeping a Tags tab: tags overlap, so a tag view needs its own caveat [REQ RP-04]; offer tag as a filter and a column group until tags exist (v2 has no tag field [AUDIT T1 SL-04]) |
| Student view is the default in Attainment | The program asks "who is lagging (bottom 20%)" [CALL 09-23 via RESEARCH-v2]; who-has-met-what with counts [CALL 10-08, speaker inferred as Aarti, not labelled in the transcript] | Skills view default: serves accreditation, secondary job |
| `{Skills}` tabs Library, Courses, Evaluators, Clinical settings (4) | Lists the REQ treats as supporting lists [REQ section 2] reduced from [UX-03]'s five (Skills, Categories, Tags, Settings, Lab instructors) | Categories and Tags as tabs: [REQ SL-05] wants inline creation at the point of need; manage them from a sheet on the Library filter |
| Evaluation and Verification as sub-pages with breadcrumbs | They are reached from a record, never a start point | Sheets over the report: fine for peek, but evaluation full responses need a URL to share and to return to [REQ RP-07] |
| Configure as its own route | Heavy form with live preview [REQ SC-19] [UX-03] | A modal: the prototype used one; too small for the dependency chain model -> evidence -> rule [REQ SC-09] |
| One landing per role, named in the catalogue | Reviewer lands on queue (their job); director on Verification (06 proposes a director Dashboard); admin Dashboard; student My progress [LEDGER D-L4] | A shared "Home" for reviewer: no top questions to answer there [RESEARCH-v2 4.1] |

**Review check:** open any page. Can you name its object, its parent in two clicks, and which tab you are on without reading the title?

---

## 5. Record-linked navigation

### 5.1 The rule (IA-4)

Every student, skill, group, site, course, evaluator and count that names a record is a link to where that record is acted on, and it **carries the record in the URL** [BUILD-PROMPT §8.1, §8.4]. Context keys:

| Key | Record | Derived (setting this sets that) [BUILD-PROMPT §8.2] |
|---|---|---|
| `stu` | student | `coh`, `site` (current placement), `course` (current offering) |
| `item` | skill (key name kept from the build prompt; the UI says `{skill}`) | none |
| `coh` | cohort | none |
| `site` | placement site | a student placed there if none set |
| `course` | course offering | none |
| `evaluator` | evaluator | none |
| `list` | skill list | none |

Why a URL and not hidden state: a deep link restores the exact view, so a reviewer can paste a link to a colleague; and the same record must have **one address for every staff role** (IA-3). Today a record opened by a reviewer has a different URL from the same record opened by a director, four links jump roles by accident, and about 40 hrefs are hand-built [AUDIT T4: remediation-page.tsx:108, review-item-page.tsx:84, verification-pages.tsx:226, lab-grid-page.tsx:345].

### 5.2 Link rules

| # | Rule | Why |
|---|---|---|
| L1 | One helper `linkTo(screen, ctx)`; no hand-built URLs | [BUILD-PROMPT §8.4]; kills the 40-href problem [AUDIT T4] |
| L2 | A figure is a link to the people or evidence behind it, carrying current filters | [REQ RP-05, RP-06] |
| L3 | A link never changes role. Role-specific actions are enabled or disabled on the destination | Fixes the four cross-role jumps; supports IA-3 |
| L4 | Where a count does not link (no drill exists), it is plain text and not styled as a link | A link that goes nowhere is worse than none |
| L5 | Link text is the record's name or the figure ("4 waiting"), never "click here" or "view" | Accessibility and scanning (see 02 section 12) |
| L6 | Back from a drill-down restores the previous filter and scroll | [REQ RP-06] "without leaving the report and searching again" |
| L7 | A student name in a table is the first link in the row; the row's other links do not compete with it (one primary link per cell) | Reduces mis-clicks in 123-row tables [INFER] |

Names that are plain text today and must become links [AUDIT T4]: Outcomes table student and skill cells (`outcomes-page.tsx:92-93`); review item header facts (student, course, skill, evaluator); reports heat-grid row labels (`reports-page.tsx:131`); remediation header (`remediation-page.tsx:95`); admin Dashboard stalled row, whose href is the list not the item (`home.ts:94`); preceptor skill names (`evaluation-form.tsx:93`).

### 5.3 "Same record in other views"

A compact panel on every record page (student, skill, submission, evaluator, site) listing the other pages that show the same record, with live counts, e.g. for a student: Home (their view), Record, Approvals items (n), Verification, Attainment row. Purpose: a reviewer moves between roles' views of one record without losing it [BUILD-PROMPT §8.5]. In the staff shell this is a "Related" popover in the page header, not another section, to protect the text budget (02 section 5). **Rejected: a persistent context bar with pickers on every screen** (the prototype's design): right for a prototype to review journeys, heavy for production; keep the pickers on screens whose scope genuinely changes (Attainment, Approvals), show a read-only chip elsewhere. [INFER]

**Review check:** pick any name on any screen; it opens the page where that record is acted on, the URL contains the key, and pasting the URL in a fresh tab restores the view.

---

## 6. Handoff chain between roles

Principle (IA-5, [LEDGER D-C]): **the state already propagates (the v2 store is shared, verified in the browser); what is missing is a signal and an entry point at each hop** [AUDIT T4 summary 1-2]. Each hop below defines who acts, what the receiver sees first, and what the sender is told.

### 6.1 Diagram

```
 ADMIN                STUDENT              EVALUATOR (no login)     REVIEWER / ADMIN        DIRECTOR           REPORTS
   |                     |                        |                      |                    |                  |
 publish + map --1-->  Home: "2 new skills       |                      |                    |                  |
   |                    in NURS 350"             |                      |                    |                  |
   |                     |                        |                      |                    |                  |
   |                  Log -> Send --2--> Email: "Maya asks you to        |                    |                  |
   |                     |                evaluate 2 skills" (1 link,    |                    |                  |
   |                     |                all open requests listed)      |                    |                  |
   |                     |                        |                      |                    |                  |
   |                  Home: "Waiting          Form (one sitting) --3--> counts now? ---------------------------> Attainment
   |                   for J. Delgado" <--4-- Receipt: "Counted" or        |                    |                  (counted only)
   |                     |                  "Held for approval"            |                    |                  |
   |                     |                        |        held --5-----> Approvals row:        |                  |
   |                     |                        |                       why held, self vs      |                  |
   |                     |   <------6------------------------------------ evaluator, Approve/Return              |
   |              Home/Record: "Counted"          |   return -> Student: reason + "Revise and resend" (same evaluator) |
   |              or "Returned: why"              |                      |                    |                  |
   |                     |                        |                      |--7--> Verification: "Ready" / "Changed since verified"
   |              Record: "Verified, v1" <-----8--------------------------------------------- verify         |
   |                     |                        |                      |                    |--9--> Attainment: verified count
```

### 6.2 Hop table: sender, receiver, entry point, cue

| # | From -> to | Receiver's entry point | Cue the receiver must see | Cue the sender must see | Evidence of the gap today |
|---|---|---|---|---|---|
| 1 | Admin publishes and maps -> student | Student My progress | "{n} new {skills} in {course}" on Home, once, dismissible by viewing | Admin banner: "Map it to {course} next" (exists) | Skill appears silently; the old "not open yet" banner just vanishes [AUDIT T4 hop 1] |
| 2 | Student sends -> evaluator | **Email** with one link; link opens the Requests page listing every open request for that evaluator across students, then the form | Subject names the student and the count; body lists skills [BUILD-PROMPT evinvite] | Student: "Sent to {name}" and row "Waiting for {name}, {n} days" | v2 reaches the receiver only by switching role; no email surface [AUDIT T4 hop 3, T3 evinvite] |
| 3 | Evaluator submits -> engine | none (system) | Receipt states "Counted" or "Held for approval" per skill [REQ EV-07] | Receipt has "Back to requests" and the next request if any | Dead end after submit [AUDIT T4 hop 4] |
| 4 | Evaluation -> student | Student My progress, nav badge on Record | "J. Delgado signed 2 skills. 2 counted." (what changed, with whom) | n/a | Student home still said "Fix 1 sync conflict" [AUDIT T4 hop 4, P0-1] |
| 5 | Held evaluation -> reviewer | Approvals badge, queue row | **Why held** column: "Skill requires approval" / "New evaluator name" / "Paper form" [BUILD-PROMPT aprqueue] | Evaluator told at submit that it is held [REQ EV-07] | Status says "Ready to approve" (readiness, not cause) [AUDIT T3 gap 3] |
| 6 | Reviewer approves or returns -> student | Home "Do this next" for returns; badge on Record for approvals | Return: who, why, what to do ("Fix and send again"); approve: "Counted" line | Reviewer lands back on the next queue row, not a dead "Approved" page | Approve gave the student no signal [AUDIT T4 hop 6] |
| 7 | Counted evidence -> director | Verification row | Group "Ready to verify" or "Changed since verified"; nothing is ready by default | n/a | All 12 students sat in one "Has unmet mandatory skills" group [AUDIT T4 hop 8] |
| 8 | Director verifies -> student | Record header chip | "Verified, version {n}" (only if verification is kept) | Director returns to the next ready record | Student My progress had 0 mentions of verification [AUDIT T4 hop 9] |
| 9 | Everything -> reports | Attainment | Figures change; the label states what is counted ("Counted evidence only") | n/a | Verified count absent from reports [AUDIT T4 P2-5] |

**Why "badge plus first-row cue" and not notifications.** REQ section 14 puts notifications out of scope [REQ 14], and the build prompt lists nudges as Recommendation with a digest cap of one per person per day [BUILD-PROMPT §10]. So the cue is **in-product at the entry point the receiver already opens**, and the only outbound message in v1 is the evaluator invitation. If notifications are later added they reuse the same cue text (02 section 9).
**Rejected: a global activity feed.** It would be a 6th destination and answers "what happened" instead of "what do I do now"; each role's landing already carries the cue. **Rejected: toasts.** Workspace rule: product feedback uses `LocalBanner`, not toast.

**Evaluator links (decided by Romit 2026-10-26, ledger D-L2: one link per request).** Each request has its own link that exposes only that request. One email may list several requests, each row carrying its own link [BUILD-PROMPT evinvite]; there is no shared inbox link, so a forwarded link never reveals other students' requests [REQ EV-01]. [REQ EV-05] covers several skills from one student in one sitting, which stays one request. This matches v2's one-request-one-link model. Link lifetime, forwarding and expiry are open [OD-18]: design the states as seams (the page shows "This link is not for you" / "This request is complete") and decide nothing.

**Return path.** A returned submission goes to the **same evaluator** today; reassigning is only possible for stalled requests [AUDIT T3 gap 4, REQ RV-04 says either path may go to a different evaluator]. IA consequence: the student's Returned panel needs a "send to someone else" option; flagged, not decided.

**Review check:** trace one record through hops 1 to 9 on the 123-student dataset; at each hop the receiver sees the cue within one click of landing, and the counts match on every screen (consistency invariant [BUILD-PROMPT §8.9]).

---

## 7. Role switching and shells

### 7.1 Three shells

| Shell | Who | Chrome | Layout | Why |
|---|---|---|---|---|
| **Staff** | Admin, reviewer, director | DS base shell: left nav (rows from section 3), utility bar (product switcher, page title, Search, Notifications, Help, scope switcher, profile) in DS order, page header | 12-col grid at 1440 px; nav collapses to a menu at 375 [BUILD-PROMPT §3.3] [DEC-023] | One shell and one row catalogue; roles differ by permission (the audit's finding) [AUDIT T3, T4] |
| **Student** | Student | Left nav at desktop; bottom tab bar (3 tabs) at 375 | Two columns: progress and next actions left, skill list right [BUILD-PROMPT §3.3] | Same screen adapted, not a separate design (web-first, PENDING-ROMIT) |
| **Evaluator** | Preceptor, clinical faculty, lab instructor | **None.** Light header "Secure evaluation link, no account needed" and program name; centred column max 820 px; no product switcher, role switcher, Demo menu, search or notification bell | Single column; sticky submit bar on phone [BUILD-PROMPT §3.3] | No account exists, so account-shaped chrome is false [REQ EV-01] [AUDIT T4 P1-3] |

### 7.2 Role switching

| Question | Decision | Why |
|---|---|---|
| Where is the switch? | Profile menu, "Switch role", with a role chip in the bar | One flat rail per view; persona is a view switch, not three sibling groups [DEC-023] |
| Who sees it in production? | Only people who hold more than one role (for example an admin who also approves) | A single-role user never needs it [INFER] |
| Who sees it in the demo? | Everyone, but it belongs to a **demo layer** (story player, device toggles, reset), not product chrome | v2 offers role switching three ways (switcher, command menu "Roles", Demo > Walkthrough with 14 links) [AUDIT T4]; keep one |
| Does switching change the URL of a record? | No. The record URL is role-independent; the switch changes which actions are enabled | IA-3 |
| Student fault toggles (offline, signed out, update pending) | Live on the student sync screen, student role only | They simulate the phone, not the program [AUDIT T4] |
| Search | Indexes records (students, skills, evaluators, sites), not only nav rows | v2 search finds only the 2 to 7 nav rows and so adds nothing [AUDIT T4 P2-1] |

**Rejected: separate apps per role.** The store is shared and the audit shows identical components under three roles; separate apps would triple the duplication. **Rejected: hide the staff shell for the director to look "simpler".** The director needs the same record pages; permission already handles the difference.

**Review check:** open the evaluator link in a clean browser. There must be no sidebar, no role switcher, no Demo menu, and no text that implies an account.

---

## 8. Scale behaviours (100+ students, 100+ skills)

Design and test at the reference scale: 123 students (38 / 43 / 42 across cohorts), 153 to 154 skills in 10 sections and 17 to 18 groups, 8,879 evidence records, 403 evaluators, 2,141 sites in the build prompt; the v2 dataset spec scales sites to 120 and evaluators to 180 with 14 unverified [BUILD-PROMPT §6] [dataset-spec]. A seven-skill demo hides every problem in this section [LEDGER D-D].

| Surface | Rule | Why | Rejected |
|---|---|---|---|
| Skill library (154 rows) | Search box first (name, category, tag, status [REQ SL-10]); group by **section** with counts and collapse; the list scrolls inside its panel; "Needs configuration" is a filter chip with a count | A flat table of 154 forces scanning; sections come from the program's own list [BUILD-PROMPT §6]; backlog is the first admin job [REQ IM-10] | Pagination: breaks "group by section" and bulk select across a section |
| Bulk work | Bulk configure and bulk apply, bulk approve with named blockers | [REQ IM-14] [COMP: slow logging, no bulk about 10 mentions] [AUDIT T3: bulk approve present] | Per-row only |
| Student pickers (Log) | Skills: same grouped list with a "likely for this course/placement" starred set first, never restricting [REQ CM-05] [CALL 10-08]; evaluators: type-ahead scoped first to the site's preceptors, then "anyone by name and email" | 403 evaluators cannot be a dropdown; mapping is expectation, not eligibility | Hiding unmapped skills: breaks soft mapping |
| Students (123) in Attainment | Default sort **furthest behind first**; group by cohort; sticky header and first column; heat-grid must hold 123 rows by 10 sections, scrolling in its panel [BUILD-PROMPT §10] | The question is "who is behind" [CALL 09-23] | Alphabetical default |
| Filters | One row of removable chips above the content; each filter removable alone [REQ RP-01]; an impossible combination is explained, not shown empty [REQ RP-09] | Evidence of what is applied is a requirement | Filter modal that hides state |
| Saved views | Named filter sets per user ("My cohort, behind pace"); URL-addressable; four or five per user, no folders [INFER] | Directors and coordinators return to the same few cuts; the filter state already lives in the URL so this is cheap | Dashboards builder: out of scope |
| Search (global) | Command palette indexes records; shows last 5 viewed; type to narrow among 2,141 sites with a count, never lists them | Search is for records [AUDIT T4 P2-1] | Nav-only search |
| Approvals queue | Default sort oldest first; age buckets 0 to 3, 4 to 7, 8 to 14, 15+ days, thresholds at 3 and 8 days as the build prompt, not v2's 7 [BUILD-PROMPT §10 N-04, N-09, N-11] [AUDIT T3] | Waiting time is the queue's quality measure | Newest first |
| Evaluator Requests (a busy evaluator) | List grouped by student, oldest first, each with days waiting; one form per student | [AUDIT T3 multi-student] chips deferred | Student switcher chips: the build prompt shows them; a list is simpler and works at 375 |
| Virtualisation | Lists over about 100 rows render windowed; search and filters run on the full set, not the visible rows | Heat-grid and library are the two largest [INFER] | Render all |

**Review check:** load the 123-student dataset; find one student by name in two keystrokes, one skill by section in two clicks, and the three furthest behind without scrolling.

---

## 9. Route map

Staff and student are persona-prefixed (the build prompt's `/skills/{persona}/{screen}` pattern kept for the three shells); **role is not in the staff path** (IA-3). Route names are proposals [INFER]; the v2 route they replace is in the last column.

| Route | Page | Roles | Query context | Replaces (v2) |
|---|---|---|---|---|
| `/staff` | Dashboard | admin | `coh` | `/v2/admin` |
| `/staff/skills` | Library | admin | `list`, filters | `/v2/admin/starter-library` |
| `/staff/skills/{id}` | Skill detail | admin | | none |
| `/staff/skills/{id}/configure` | Configure | admin | | `/v2/admin/configure-skill` |
| `/staff/skills/{id}/publish` | Check and publish | admin | | `/v2/admin/validate-publish` |
| `/staff/skills/courses` | Courses list | admin | `course` | `/v2/admin/map-courses` |
| `/staff/skills/courses/{id}` | Course coverage | admin | `course` | same |
| `/staff/skills/evaluators` | Evaluator roster, adopt, merge | admin | `evaluator` | none (404 today) |
| `/staff/skills/settings` | Clinical settings | admin | | none (404 today) |
| `/staff/approvals` | Queue (tabs Awaiting, Stalled, Returned) | admin, reviewer | `coh`, filters | `/v2/{admin,reviewer}/review-queue` |
| `/staff/approvals/{submissionId}` | Submission | admin, reviewer | `stu`, `item` | `/v2/*/review-queue/{id}` |
| `/staff/students` | Student list | reviewer (admin, director by link) | `coh` | `/v2/reviewer/verification` |
| `/staff/students/{id}` | Student record | all staff | `stu` | `/v2/*/verification/{id}` |
| `/staff/students/{id}/skills/{skillId}` | Skill record | all staff | `stu`, `item` | none |
| `/staff/evaluations/{id}` | Evaluation (full) | all staff | `stu`, `item` | `/v2/*/evaluation/{id}` |
| `/staff/evaluations/{id}/versions` | Version history | all staff | | version timeline |
| `/staff/verification` | Verification list | director | `coh` | `/v2/director/director-verification` |
| `/staff/attainment` | Students view | admin, director | `coh`, `course`, `site`, filters | `/v2/*/reports` |
| `/staff/attainment/skills` | Skills view | admin, director | same | same |
| `/staff/attainment/evaluators` | Evaluators view | admin, director | same | same |
| `/staff/sites/{id}` | Site snapshot | all staff | `site` | none |
| `/student` | My progress | student | | `/v2/student` |
| `/student/log` | Log | student | `item` | `/v2/student/pick-and-rate`, `/request-signoff` |
| `/student/record` | Record | student | `course` | `/v2/student/history` |
| `/student/record/{skillId}` | Skill record | student | `item` | none |
| `/student/record/share` | Share record (if kept) | student | | `/v2/student/verified-record` |
| `/student/sync` | Sync changes | student | | `/v2/student/offline-sync` |
| `/evaluate/{token}` | Requests (all open) | evaluator | | `/v2/preceptor/preceptor-evaluation` |
| `/evaluate/{token}/{requestId}` | Evaluation form | evaluator | | `?request=sub-maya-1` |
| `/evaluate/{token}/lab` | Lab batch grid | lab instructor | | `/v2/preceptor/lab-batch-grid` |

Rules: filters live in the query string so a view is shareable and each filter is removable alone [UX-03 section 4] [REQ RP-01]; tokenised routes carry no student or skill IDs other than the token [UX-03]; one spelling per page (v2 has two for Records: `director-verification` vs `verification/<id>` [AUDIT T4 P2-6]); `?state=empty` reaches every state [BUILD-PROMPT §7].
**Not decided here:** module base path and standalone-vs-section placement (`{base}`) [UX-03 OD-P1 area].

---

## 10. Alternatives considered at the structural level

| Alternative | Why it was attractive | Why rejected |
|---|---|---|
| Task-first nav ("To do" row across roles) [AUDIT T3] | One mental model: my work | Mixes objects; the badge on Approvals already is the to-do for the one role that has a queue; the Dashboard carries Needs you for admin |
| Object-first nav (Students, Skills, Courses, Evaluators, Sites) | Mirrors the data model | Five rows to look things up that a search and links reach faster; ignores that roles start with tasks |
| Keep a Dashboard row for reviewer | Symmetry | Reviewer's top question is "what is waiting"; landing on the queue answers it with no extra click [RESEARCH-v2 4.2] |
| Context bar with pickers on every screen | Strong demo of connectedness [BUILD-PROMPT §8.3] | Heavy in production; kept only where scope changes |

## 11. Hard stops that constrain the IA

Unconfigured skills do not appear in mapping or student selection [REQ IM-09]; preceptors have no login so the evaluator shell has no account chrome [REQ EV-01]; completed evaluations are immutable so no nav or link says "edit" [REQ RV-05] (v2 "Reopen to edit" is flagged, [LEDGER Q1]); lab never satisfies a clinical-setting minimum [REQ SC-12] so lab sessions are not a clinical path; no shipped skills [REQ SL-01] so "Add skills" never lists Prism content as a default; REQ section 14 items (remediation, notifications, expiry) get no nav row.

## 12. Reconciliation with `docs/build/research/v2-ia-and-content-strategy.md`

| Earlier conclusion | Now | Why it changed |
|---|---|---|
| "Confirmed nav holds up against the analogues; no blocker; admin 7 rows, reviewer 3, director 3, student 4" [RESEARCH-v2 4.2] | **Overruled**: 4 / 2 / 2 / 3 | Romit's 10-26 decision that nav must shrink [LEDGER D-A]; the audit's duplicate-page evidence [AUDIT T4]. The earlier test (analogues) answered "is it conventional", not "is it too much". |
| Reports as three views Students / Skills / Evaluators; Export out of the page | **Kept** | Matches [REQ RP-02, RP-03] |
| Dashboard gains a Cohort block (weakest skills, behind-pace strip) | **Kept** | Answers top question 2 without deciding OD-29 [RESEARCH-v2 G1] [LEDGER OD-29 open] |
| Records list grouped Ready / Has gaps / Changed / Verified (G5) | **Kept**, now the Verification landing | Fixes the flat 12-student list [AUDIT T4 hop 8] |
| Queue gets age and agreement columns (G4) | **Kept**, plus "why held" | New finding [AUDIT T3 gap 3] |
| Outcomes split into Evaluations / Plans / Concerns tabs (G9) | **Dropped as a page** | Outcomes is no longer a row; evaluations live under a student; plans and concerns are REQ section 14 / proposals |
| Preceptor shell "demo shell, nothing changes" | **Changed**: no chrome | Contradicts no-login [AUDIT T4 P1-3] |
| Copy budget (numeric) | **Kept and extended** in `02-content-strategy.md` section 5 | Evidence still holds |

---

## 13. Open questions for Romit

| # | Question | Recommendation | Alternative and its consequence | Marker |
|---|---|---|---|---|
| Q-IA1 | **Courses as a tab under `{Skills}`, or its own admin row?** | Tab: mapping is the next step of publishing and the coverage view reads as "this skill's reach" [AUDIT T4] | Own row: admin has 5 rows (still below the old 7); coverage matrix and the "required skills x courses" check get a stable home; costs one more row and splits a setup flow into two places. Choose own row if coordinators (not admins) do the mapping weekly. | PENDING-ROMIT |
| Q-IA2 | **Student noun: submission or request?** (largest wording change, about 25 strings) | Submission for the record, request only for the outbound message [GLOSSARY 2.3] | Request everywhere: fewer string changes, but then the review queue's "item" has no precise noun and REQ/V1 copy disagree. Affects nav label "Log" tab "Your submissions (n)". | PENDING-ROMIT |
| Q-IA3 | **Director verification: keep or drop?** Not in REQ, calls or build prompt [AUDIT T3] [GLOSSARY] | Keep as a thin feature only if Sankalp or Aarti confirm; until then director = Attainment + Students, no Verification row | Keep: Verification is the landing, "Share record" exists for students, verifying with unmet mandatory skills needs a rule [LEDGER Q3]. Drop: director nav is Attainment and Students (same as reviewer plus reports); student loses "Share record". | PENDING-ROMIT |
| Q-IA4 | **Web-first or phone-first for student and evaluator?** [LEDGER Q2] | Web-first with a faithful 375 adaptation, because the build prompt says so [BUILD-PROMPT §2.1] and v2's phone frame left a third of desktop empty [AUDIT T2]; evaluator stays single column at all widths | Phone-first: matches the pain data (mobile reliability is the main risk [COMP]) and v2's current build; costs wide-screen use by students at a desk and the two-column Home. Reliability work (offline queue) is needed either way. | PENDING-ROMIT |
| Q-IA5 | Should Approvals be hidden when no skill requires approval? | Always show, with an empty state | Hide: less chrome, unstable nav (section 3.4) | Low stakes |
| Q-IA6 | Is one staff route tree (role not in the path) acceptable given the build prompt's `/{persona}/{screen}` pattern? | Yes, persona = shell | Keep five role prefixes: matches the prototype, keeps the duplicate-URL problem | INFER |
| Q-IA7 | Evaluator identity lifecycle (unverified name, adopt, merge) is in scope? The Evaluators tab and the "why held" cue depend on it [LEDGER Q9] | In scope | Out: Approvals "why held" shows only "Skill requires approval" and `/staff/skills/evaluators` is not built | Needs answer |
| Q-IA8 | Remediation: no nav row, kept only as a link on a student record or removed? [REQ 14] [LEDGER Q5] | Remove from nav; decide the page separately | Keep as a row: adds a 5th admin row for out-of-scope work | PENDING-ROMIT |

## 14. How to review a screen against this doc

- [ ] The page's object is one of the section 2 objects, and it is a destination or a lens consistently with the table.
- [ ] If the page adds a nav row, a named role begins a work session there; the role's row count did not rise (admin 4, reviewer 2, director 2, student 3).
- [ ] Tabs: at most 4, they split one object into views, none is a step.
- [ ] Every student, skill, course, site, evaluator and count that names a record is a link built with `linkTo`, carries the context key, and never changes role.
- [ ] The URL contains the record; pasting it in a fresh tab restores the view; the same record has one URL for every staff role.
- [ ] The page names what the previous role did and what the next role will see (hop table, section 6), within one click of landing.
- [ ] Shell is right: evaluator page has no sidebar, role switcher, Demo menu or account language.
- [ ] Tested at 123 students and 150+ skills: search first, grouped by section, filter chips removable alone, impossible filters explained.
- [ ] Counts agree with the same student on every other screen (consistency invariant), and different denominators are labelled.
- [ ] No hard stop in section 11 is touched; anything resting on an `OD-*` is marked and has a seam.
