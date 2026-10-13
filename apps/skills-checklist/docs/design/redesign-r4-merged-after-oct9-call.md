# Redesign R4, "Merged after the Oct 9 call": report-first, list-based, group-level rules

Date: 2026-10-09 | Mode: `/design-variants` spec (ASCII and rationale, no TSX, nothing built, nothing published) | Scope: the overall product architecture of Prism Skills Tracking, merged from R1, R2 and R3 and reworked for the Oct 9 4 pm follow-up call
Status: proposal for Romit. Not a contract. Every `OD-*` stays open and is built as its named seam. Hard stops stand (no shipped skills or taxonomy, no default evaluation model, unconfigured items cannot be mapped or submitted against, completed evaluations immutable, mapping is not eligibility, preceptors have no login, lab never satisfies a clinical-setting minimum, REQ section 14 out of scope).
Tags: `[REQ id]` requirement | `[OD-n]` open decision, never treated as decided | `[CALL 10-09 Aarti-followup Fn]` the Oct 9 4 pm call, finding Fn of `research/meetings/2026-10-09-aarti-followup-raw-review.md` | `[CALL 10-08 Aarti]` the Oct 8 brain dump | `[CALL 10-08 Romit]` a statement the quote re-verification found to be Romit's, not Vaibhav's | `[PROTO]` Sankalp's prototype | `[INFER]` my inference, to validate.
Precedence for behaviour: REQ > CALL > PROTO > INFER. Where a call contradicts a REQ, this file draws a seam and names an escalation. It never picks.
Placeholders: every list name, item name, count and person in a wireframe is made up for this document. Prism ships no skills `[REQ SL-01]`.
House style: sentence case, no em-dashes, no icons on action buttons, no progress bars as a primary visualisation, no red in any score or status visualisation.

Read for this file, in full: `docs/README.md`, R1, R2 and R3 (`design/redesign-r*.md`), `research/meetings/2026-10-09-aarti-followup-raw-review.md`, `research/meetings/2026-10-09-quote-reverification.md`, `strategy/05-open-decisions.md`, `strategy/07-gaps-contradictions-defects.md`, `build/ds-shell-anatomy.md`, plus the `skills-module-context` gate. Not re-fetched: the Granola raw transcript of the Oct 9 call (I rely on the raw-review file, which states it read the transcript in full). Not read: `strategy/08`, `journeys/`, `ux/`, the built `admin/` code. See section 15.

---

## 0. Evidence quality, and the corrections R4 applies

### 0.1 How much weight the Oct 9 call can carry

The Oct 9 call is one `Microphone` channel with at least two voices and no speaker labels `[CALL 10-09 Aarti-followup, section 0]`. Every "Aarti" below is inferred from content. The call is mostly a read-aloud review of REQ text with reactions, it shows no screen, and it never mentions R1, R2 or R3. Two stretches (about 0 to 10 percent and 56 to 62 percent) are another conversation bleeding into the recording and are not used. The digest also says its verdicts on R1 to R3 rest on only part of each file (R1 to line 573, R2 to 609, R3 to 615).

I rate each Oct 9 finding that R4 builds on:

| Finding | What it says | My weight | Why |
|---|---|---|---|
| F4 several lists, never mixed | "each list is one report, one tab, one thing" | Firm in tone, moderate evidence | Said at about 71 percent and again at about 75 percent ("majority of the time I'll only have one list applicable for one cohort"). She also says to validate with the account managers (about 44 percent). The line "I don't want to create versions of that list" (about 41 percent) sits close to "create a new list" (about 70 percent). See 0.3 |
| F12 list attached to cohorts, default, no clone | "I hate to set something up per cohort" | Firm | Repeated four times between about 68 and 73 percent |
| F14 student group, not only cohort | "we'll allow them to define what is a group of students" | Moderate | She tells Romit to ask Yash. The first "cohort level" in the quote is probably a transcription slip. Not decided |
| F10 preload discipline lists | "we could load it up with the known competencies ... then let them customize it" | Moderate to firm, stated twice | Conflicts with `[REQ SL-01]`. Not resolved here |
| F5 do not enforce model vs criteria | "I like to not put too many restrictions" | Moderate | Conflicts with the REQ's own core principle `[REQ SC-09]` `[REQ SC-18]`. She says restrictions can come later |
| F9 tree grouping | "make it nice. A tree structure." | Weak to moderate | The tree conclusion is probably Romit's, with Aarti not objecting. Depth is explicitly undecided |
| F17 deactivation | "Don't delete the data, but don't show the list." | Firm for Aarti, contested | Romit raised accreditation history in the same exchange and asked to validate |
| F15 send to anyone | "They should be able to send it to anyone they want" | Firm | The ICU reason is concrete |
| F7 launch page | "that and the launch page has to be there 100%" | Firm | Reads as the student's launch page; the admin side is my extension (R1 K1) |
| F13 snippet on other entities | "snippet ... shown at other entities" | Weak | One partial phrase at about 77 percent. I draw one small frame, no more |
| F22 class-average comparison | "This is your score and this is the class score" | Weak, not used | About the competency spiderweb, speaker unclear. R4 keeps "students never see other students or a class average" and escalates the question |
| F19 aggregate criteria | average, minimum, maximum | Moderate | Repeated from Oct 8. "We don't know all of the permutation combination" |
| F21 licensure exams | "with a link. But it is not going to give a whole workflow around it" | Moderate to firm | Romit asks, Aarti answers |

### 0.2 Quote-reverification corrections applied in R4

From `research/meetings/2026-10-09-quote-reverification.md`. R1 to R3 still carry these errors because this task forbids editing existing files; R4 does not repeat them.

| Where R1 to R3 went wrong | R4 does this instead |
|---|---|
| "Then skills, competencies, EPS, everything becomes one list" is shown as Aarti's recommendation (R1:19, R2:44, R3:41, R3:531). The surrounding turns ("right?", "Yeah, that is clear", "So what you mean is...") look like Romit summarising and the other voice confirming | R4 says "one list" may be Romit's synthesis confirmed by the other voice. The Oct 9 call separately has Aarti challenging REQ 1.4 `[CALL 10-09 Aarti-followup F3]`, so the direction has support, but "one list" is never called her recommendation. Seam OD-28 stays |
| "Standalone module that can also integrate", "some version by the last week of October" and "accreditation has a separate owner" are tagged `[CALL 10-08 Vaibhav]` | They are Romit's statements on the Oct 8 review call. The last-week-of-October line is a Sanket target, relayed by Romit as "at least some version". R4 tags them `[CALL 10-08 Romit]`. OD-34 and OD-35 therefore have no call evidence from Vaibhav and are `[INFER]` until Sankalp or Vaibhav confirms |
| "lab never satisfies a clinical minimum" carries a call tag (R1:340) | R4 tags it `[REQ SC-12]` only. The raw says the opposite direction ("It doesn't matter whether they learn in classroom, labs, clinics") |
| "Different programs have a set per cohort and per year" tagged to the call (R3:673) | Treated as `[INFER]`. Note the Oct 9 call now independently says lists change "every 7-10 years" `[CALL 10-09 Aarti-followup F12]`, which cuts against the per-year premise |
| "at least 5, 5, 5, 5, 5 of each" shortened in some places to drop "at least" | R4 keeps "at least" because a minimum is what the raw says |
| "program level, 100 skills" is a listener's question (R3:18) | R4 keeps the program total as a reserved slot only (OD-30) |
| "A faculty one signs off, then Faculty 2 also has to sign" is a listener's question (R2:413) | R4 cites the verified opening line "Faculty has to approve, then a preceptor has to approve" `[CALL 10-08 Aarti]` for chains |

### 0.3 One thing the brief asked for that the raw only half supports: "versioned list"

The brief calls a list "a versioned object". The raw says two different things: "I don't want to create versions of that list" (about 41 percent) and "if something changes, you create a new list and then you start attaching your new cohorts to that new list" (about 70 percent), plus "it changes every 7-10 years" and "I don't want to do clone in here" `[CALL 10-09 Aarti-followup F4, F12]`. The consistent reading is: no version-management feature, a new list when the program really changes. R4 therefore models a version as a new list that records which list it replaces, with a visible version label, and no edit history, no branching and no clone of attachments. If Aarti did mean a versioning feature, section 8.7 shows what changes. This is the first question in section 13.

---

## 1. Thesis, the one question, and what changed

### 1.1 Thesis

```
 THESIS    A program keeps one or more LISTS. Each list is its own report, its own tab, its own thing, and
           is never merged with another [CALL 10-09 Aarti-followup F4]. A list is a tree of items with the
           rules that make an item "met", and it is attached once to the GROUPS of students who must meet it,
           with a default flag so new groups pick it up. The report is the launch page: pick a list, pick a
           group, see who has met what, and act on any row in place. Opening a student shows the same list
           for that one student, with the evidence behind every number. Setup is rules applied to branches of
           the tree, once, then attached to groups. Nothing is configured per cohort.

 ONE       "For this list and this group of students, who has met what, and what can I do about this row
 QUESTION   without leaving the page?"

 OPTIMISES The weekly coordinator and the student, each reading one list at a time. Defining a list once and
           attaching it to many groups. Showing progress, where to go next, and done versus not done on the
           first screen.
 DOES NOT  A blended "overall" across lists. A first hour that needs no decision about starter content (that
 OPTIMISE  is the open escalation in section 6.3). Per-student exceptions.
```

### 1.2 What changed against R1, R2 and R3, and why

R4 takes R1 as the base (report is the launch page, two-row rail, in-place panel), R3's group-level rule setup (a rule applied to a branch of the tree once), and R2's student record as the drill-down (one page per student, chain line on each row).

| # | Change | Against | Evidence | Why |
|---|---|---|---|---|
| 1 | **List is the first-class object**, with a tab per list in the report, the student record, the setup and the student home | R1 and R2 had one list and a `kind` label. R3 had one "requirement set" with a selector | `[CALL 10-09 Aarti-followup F4]` | Contradicted R1 and R2 by omission. R3's selector is closest but its groups "may mix kinds", which the call does not support |
| 2 | **A list is attached to groups with a Default flag.** "Apply set to cohort" is gone. No per-cohort setup. No clone | R3 "Apply set to cohort" (a per-cohort act) | `[CALL 10-09 Aarti-followup F12]` | The call dislikes any per-cohort configuration and says no clone. The attach step is a checklist of groups plus a default switch |
| 3 | **The unit of assignment and reporting is a student group** (a cohort is one kind of group) | R3 used cohort as the primary axis. R1 and R2 had cohort plus a loose "Group" filter | `[CALL 10-09 Aarti-followup F14]` | Flagged "to validate with Yash", not decided. R4 builds the seam so cohort-only is one setting away |
| 4 | **Rules are set per branch of the tree and per list**, not per item and not via a separate "set" | R3's flat group layer next to category | `[CALL 10-09 Aarti-followup F4, F9]` | "everything is defined for the list" and grouping is "a tree". One structure now does the job R3's group and category did separately, which also answers R3's own risk "category versus group duplication" |
| 5 | **Grouping is a tree of unknown depth**, not a flat category (0 or 1 per item) | R1, R2: category 0..1. R3: category plus flat group | `[CALL 10-09 Aarti-followup F9]` | Depth is open (2, 3 or 4). Conflicts with `[REQ SL-03]`; seam in 8.6 |
| 6 | **Configure warns, it does not block, as a seam**; the REQ default (block) is kept until Sankalp rules | R1, R2, R3 all enforced satisfiability | `[CALL 10-09 Aarti-followup F5]` | The REQ itself says enforce `[REQ SC-09]` `[REQ SC-18]`. See 8.5 |
| 7 | **Deactivated items vanish from reports and student pages; data is kept; a real change is a new list; delete is allowed only while no evidence exists.** R3's "1 item withdrawn" line is dropped | R3 7.1 | `[CALL 10-09 Aarti-followup F17]` | "I don't want deactivated things in the report." Romit's accreditation-history worry is kept as an export option in 8.7 |
| 8 | **A student can type a name and an email** beside recent-evaluator chips; role stays constrained by setting | R1, R2 had chips and a constrained roster | `[CALL 10-09 Aarti-followup F15]` | "A lot of times in ICU, they are with whoever they are with." `[REQ ST-08]` stays for the role; see 8.8 |
| 9 | **A launch page that always answers three questions: progress, where to go next, done versus not done**, with soft course cues (bold, underline, star plus the words) | R1 had the report; R2 a banner | `[CALL 10-09 Aarti-followup F7, F6]` | "the launch page has to be there 100%". Same mandate for admin (Report) and student (My checklist) |
| 10 | **A cohort or group summary leads to student detail**, modelled on the Prism compliance dashboard, plus a skills snippet frame for other entity pages | R1 to R3 had it but never drew the snippet | `[CALL 10-09 Aarti-followup F13]` | "compliance is a good reference". The snippet evidence is one phrase, so one small frame only |
| 11 | **An evidence export screen is drawn** | None of R1 to R3 drew one | `[REQ RP-10]` `[REQ RP-11]` | The screen is an evidence pull, not an accreditation form (REQ section 14, OD-35) |
| 12 | **New needs are seams only**: aggregate criteria, licensure exam as a link-only line, a hierarchy visual for sub-competencies and 140 items | None | `[CALL 10-09 Aarti-followup F19, F21, F22]` | Moderate evidence, no REQ, no screen asked for |

### 1.3 What R4 keeps and drops from each

| From | Kept | Dropped |
|---|---|---|
| R1 | Report is the launch page. Two-row rail. In-place panel. "Needs a decision" strip. Setup state derived from data, never ticked. Four-state vocabulary, counts first, no bars. Kits as an action on selected rows. Waiting on me lens. Import then configure. Sign-off chain drawn as text | A single flat list. Flat categories. "Cohort" as the only group |
| R2 | The student record as a full page with a row anatomy (star, name, standing word, count, needs line, chain line, source line, request action). Evidence chain panel. Source filter hidden until a second source exists. Chain line on each row | R2's third rail row "Sign-offs" (R1's Waiting on me lens stays). A separate "Program requirements" tab (now a reserved slot on the list) |
| R3 | A rule applied once to a branch (group editor with the right-hand rule pane). Setup status line "n usable, n need a rule". Impact line before save | The "Requirement set" as one object per program. "Apply set to cohort". "Groups may mix kinds". Cohorts as nav. The 1 item withdrawn line |

### 1.4 The tension to name again

`DEC-017` says layout, IA and containers follow the prototype. Romit's Oct 8 instruction was to build the exact mockup. R1 departed on purpose and R4 departs further: lists, groups and a tree are not in the prototype. The Oct 9 call post-dates the instruction and the call did not look at the prototype. Romit needs to confirm that this request supersedes DEC-017 for IA and containers `[INFER]`. Behaviour still follows the REQ.

---

## 2. Architecture map per role

### 2.0 Legend and rules

```
 ROW     primary rail row (level 1)                PAGE    its own URL
 TAB     horizontal Tabs variant="line"            PANEL   non-modal FloatingSheetPanel, lg, resizable
 LENS    a view of the same report, switched by a segmented control (not navigation)
 SHEET   modal Sheet                               DLG     modal Dialog (short, decisive)
 LISTTAB a tab whose label is a list name; one tab per list, never merged
 Depth   max 2: ROW -> (TAB or LISTTAB). Panels, sheets and dialogs are not levels.
```

Rules `[INFER]` unless tagged:

| # | Rule | Why |
|---|---|---|
| Q1 | One list is one report. No number, chart or export ever combines two lists. A student in two lists appears in both tabs, with each tab's own counts | `[CALL 10-09 Aarti-followup F4]` |
| Q2 | List tabs appear only when the school has more than one list that applies to the current group. With one list the tab strip is replaced by the list name as a plain title | Majority case is one list `[CALL 10-09 Aarti-followup F4]` |
| Q3 | Every report row has the same verbs in place: Open, Ask for review (or Approve), Set up, Export. Which ones show depends on role and row state | R1 R2 |
| Q4 | Setup state is derived from data and cannot be dismissed | `[REQ IM-10]` `[REQ IM-11]` |
| Q5 | Numerals and words first. Every state has a text label. Colour and glyph only support | `[REQ SH-03]` |
| Q6 | No time words: no due, overdue, behind, remind, expire | `[REQ section 14]` `[OD-27]` |
| Q7 | One filled primary per surface. The report has none | R1 R6 |
| Q8 | The list owns its evaluation workflow; the group owns nothing | `[CALL 10-09 Aarti-followup F4, F12]` |
| Q9 | Evidence is requested inside a list tab and counts toward that list. Whether it also counts toward the same item in another list is a seam (8.2) | `[INFER]` |
| Q10 | Hidden means hidden: deactivated items do not appear in reports or student pages, and there is no "withdrawn" line | `[CALL 10-09 Aarti-followup F17]` |

### 2.1 Administrator and coordinator (and reviewer: the same person wearing the approval hat `[REQ AR-01]`)

```
UTILITY BAR   [toggle] [(E) Prism v] <page title> ... Search Cmd+K | Notifications | Help | Ask Leo | Sample University v | RS v
              profile menu: Switch to student view | Switch to evaluator view | Appearance | Sample data           [ds-shell-anatomy]

RAIL (2 rows, expanded by default)
 Report                          PAGE    the launch page; badge = decisions waiting on me (a task count, never a score)
   list tabs (LISTTAB)           one per list that applies to the picked group; hidden when only one
   group picker                  Cohort or custom group; step one of the report (compliance dashboard model)
   strip above the lens          Where to go next (counts that filter this same report)
   lenses (segmented)            By student | By item | By tag | Waiting on me (n)
   panel (opens in place)        Student view (same component as the full record page) > Item evidence > Evaluation detail
                                 Item panel (the item, its rule, who has met it)
                                 Compare and decide panel (Waiting on me)
                                 Set up panel (configure one or many selected rows or a branch)
   sub-page                      Report > Export (section 4.8)
 Set up                          PAGE    low frequency; tabs
   Lists                         TAB     index of lists; create, new version, delete; opens List detail
   List detail                   SUBPAGE tabs: Contents (tree + rules) | Used by (groups + Default) | Course emphasis
   Items                         TAB     the school's item pool; Import (dlg + full-width review), Add item (dlg)
   Student groups                TAB     cohorts and custom groups                                           [OD-new, validate with Yash]
   Evaluators                    TAB     roster, "Named by students" adopt list                              [SL-08 SL-09 OD-05]
   Settings                      TAB     clinical settings, tags, submission details                          [SL-04 SL-07 OD-04]
   Kits                          TAB     saved rule sets applied to selected branches or rows                 [IM-14]
UTILITY BAR is not nav. The command palette indexes students, items, lists, groups, and the actions Import, Add item, New list, Export.
```

Why Report keeps list tabs in the page and not in the rail: a rail row per list would put "which list" at the same level as "report or setup", and with five lists it stops being a two-row rail. Tabs scale; the rail does not `[INFER]`.

Routes (module base `{base}` unresolved, OD-P1) `[INFER]`:

```
{base}/report?list={listId}&group={groupId}&lens={student|item|tag|waiting}&highlight={offeringId}
{base}/report?list=..&student={id}&item={id}&evaluation={id}       panel state, shareable
{base}/report/students/{id}?list={listId}                          the full record page (drill-down)
{base}/report/export?list=..&group=..&item=..                      the evidence export (4.8)
{base}/set-up/lists | lists/{id}/contents | lists/{id}/used-by | lists/{id}/course-emphasis
{base}/set-up/items | student-groups | evaluators | settings | kits
{base}/set-up/items/import/{batch}/review
```

### 2.2 Advisor and faculty (Prism login)

```
RAIL   Report                     the same page, scoped to the students the person may read             [OD-25, FERPA]
       (no Set up row)
In "Waiting on me": requests where this person is a configured signer; Open = the evaluator form inside the Prism shell [REQ §7 intro, EV-02]
```

Advisor read of the student-level report is a read-scope question, not a v1 feature `[OD-25]`. R4 builds the scope hook, not the grant. A faculty member who is also a preceptor is one person with two roles; the role belongs to the evidence row `[CALL 10-05]` `[OD-05]`.

### 2.3 Student (own login)

```
RAIL   none on a phone; bottom bar. On desktop a one-row rail: My checklist
 My checklist                     PAGE    the student's own report; the launch page                      [CALL 10-09 Aarti-followup F7]
   list tabs                      one per list attached to any of the student's groups; hidden when only one
   controls                       Needs action | All (segmented) | Highlight for course [v] | Search
   top block                      Where you stand, what to do next, done versus not done (section 4.5)
   rows                           the list as a tree; each row = item, count against target, state, who it waits on
   panel / sheet                  Item history (bottom sheet on a phone) | Ask for review (the log sheet)
```

The page is one component with the admin's per-student view. It can be embedded elsewhere in Prism (OD-34 seam), which the skills snippet (4.9) uses.

### 2.4 Preceptor, lab instructor, faculty by link: no shell, no login

```
Email link ---> /e/{token}   ONE page. No nav, no account, nothing else reachable.                       [REQ EV-01]
   shows: student, list name, supplied details, self-evaluation if configured, the program's own questions [EV-03 EV-04]
   end:   "Counts now" | "Held for administrator approval" | "Goes to the next sign-off"                   [EV-07, OD-33 seam]
Never shown: the student's achievement status, progress counts, other items, other lists                 [OD-17 default off]
New in R4: the signer may have been typed by the student (name and email only). They get the same link.   [OD-05, F15]
```

### 2.5 Counts

| Type | Items |
|---|---|
| Pages | Report, Set up, My checklist, Evaluator page, Report > Export, Student record (full page) |
| List tabs | in Report, Student record, My checklist, Set up (as an index) |
| Lenses of Report | By student, By item, By tag, Waiting on me |
| Tabs of Set up | Lists, Items, Student groups, Evaluators, Settings, Kits |
| Tabs of List detail | Contents, Used by, Course emphasis |
| Panels | Student view, Item panel, Compare and decide, Set up panel, Item history, Evidence chain |
| Sheets | Ask for review (student), wide configure editor |
| Dialogs | Create list, New version, Import input, Add item, Add or edit group, Confirm attach, Confirm apply to N, Delete item |

---

## 3. Object model as the user sees it

Names are `[INFER]`. Each relationship is backed by a REQ id, a call or a seam.

```
 PROGRAM / SCHOOL (OU level)
  |
  |-- ITEM POOL        name, description, kind label (program text), tags*, nullable competency link
  |      |             one record per student x item holds the evidence ledger          [REQ CM-07 AE-05] [OD-28]
  |      |
  |-- LIST  (a log; "one report, one tab, one thing")                                  [F4]
  |      name, version label, replaces (nullable pointer to the list it supersedes), default for ..., status
  |      |-- TREE of NODES, depth open (2 / 3 / 4)    a node = a branch of the school's own grouping  [F9] [OD-20]
  |      |       node rules: a rule set (model, criteria, chain, student details) applied to the branch
  |      |       members: items placed in a node (an item may sit in one node per list)
  |      |-- EVALUATION WORKFLOW     defined for the list; items inherit it unless the node overrides   [F4]
  |      |-- PROGRAM REQUIREMENT     reserved slot, hidden until OD-30 is answered                       [OD-30]
  |      +-- COURSE EMPHASIS         per offering, soft only                                             [REQ CM-03 CM-05]
  |
  |-- STUDENT GROUP     cohort (lockstep programs) | custom (tracks, sub-tracks)    [F14]  validate with Yash
  |      +-- USES LISTS      0..n lists; each use can carry the Default flag on the list's side
  |
  +-- STUDENT x LIST x ITEM  standing, derived (4 states [REQ AE-04])
         EVIDENCE ROW   immutable once complete [REQ RV-03]: source, who and role, when, course, setting,
                        location, result, counted?, and the list it was requested under
         * tags are cross-cutting, not grouping [CALL 10-09 Aarti-followup F9]
```

How the user's words map:

| User says | In the model | Source |
|---|---|---|
| "My log of skills" | A list | `[F4]` |
| "How I organise it" | The tree of the list. Tags are separate and cross-cutting | `[F9]` |
| "Which students have to meet it" | The list's Used by: groups, with a Default flag | `[F12]` |
| "What every student in that group has to meet" | Every active, set-up item of the list; the same for every student in the list | `[CALL 10-09 Aarti-followup F11]` `[CALL 10-08 Aarti]` |
| "Something changed" | A new list (a new version) that replaces the old; the old keeps its data and its groups until you move them | `[F12]` |
| "I made a mistake" | Deactivate (hidden, data kept) or Delete (only while no evidence exists) | `[F17]` |

Three consequences, all `[INFER]`:

1. **Where the rule lives.** The call says "the workflows and forms and evaluation criteria, everything is defined for the list" `[F4]`. The REQ configures a skill once and says its configuration "will not vary from course to course" (`strategy/07 C-6`). These differ if the same item sits in two lists with different rules. R4 puts the rule on the list membership and flags this as seam 8.2. The evidence ledger stays on the student x item, so the "one record per skill" rule `[REQ CM-07]` survives; only standing is derived per list.
2. **Evidence counts toward the list it was requested under.** A request is made inside a list tab. Default: it does not also count toward the same item in another list, which keeps Q1 true. Seam 8.2 shows the alternative.
3. **Students cannot add tracked items.** "a student can't say that, hey, I want to learn this skill at all" `[F11]`. R3's "Other items (not in the set), evidence here still counts to your record" is removed. What a student does beyond the list is not tracked. This is consistent with the Oct 9 wording and slightly different from R3's; the nuance (can a student submit evidence for an item that is in the pool but not in any of their lists) is a question for Sankalp because `[REQ CM-05]` says a student can submit an unmapped skill, and mapping to a course is a different thing from membership of a list.

---

## 4. Key screens (full ASCII wireframes in the DS shell)

Conventions: `[ Button ]` is a DS `Button`, outline unless marked FILLED. `( )` is a chip, tab or badge. `v` is a select caret. `>` collapsed, `v` expanded. One filled primary per surface. No icons on action buttons. State is always a word. No red. Counts are placeholders.

### 4.1 The launch screen: Report (admin, program live, two lists)

```
┌ ☰ (E) Prism v │ Report                                   Search Cmd+K   Bell   ?   Ask Leo │ Sample University v │ RS v ┐
├────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Report 16  │ Report                                                                                 [ Export ]           │
│ Set up     │ Pick a group, read one list, act on any row.                                                                │
│            │                                                                                                             │
│            │ Group  [ BSN 2027 (cohort) v ]    29 students                                                               │
│            │ ( Clinical skills v3 )( Competency log v1 )          <- one tab per list that applies to this group         │
│            │ ─────────────────────────────────────────────────────────────────────────────────────────────────────────  │
│            │ Where to go next                                                       (counts filter the report below)     │
│            │ Waiting on me 12   Items to set up 0   Items with a warning 2   Lab instructors to adopt 2   Not read 0     │
│            │                                                                                                             │
│            │ Clinical skills v3 · default for BSN 2027 · 87 items · all evidence counted, any course, any setting         │
│            │ ┌ Met every item ┬ Items with no evidence yet ┬ Students with open items ┬ Waiting on me ┐  (KeyMetrics flat) │
│            │ │ 3 of 29        │ 9 of 87                    │ 26 of 29                 │ 12            │                    │
│            │ └────────────────┴────────────────────────────┴──────────────────────────┴───────────────┘                    │
│            │ Highlight for course [None v]   [Cohort: BSN 2027 x] [+ Add filter] Clear all                                │
│            │ ( By student )( By item )( By tag )( Waiting on me 12 )        [Search students] [Sort: fewest met v]        │
│            │ ─────────────────────────────────────────────────────────────────────────────────────────────────────────  │
│            │ Student          Met        In progress  Does not qualify  No evidence yet  Waiting                          │
│            │ > Priya Tran     12 of 87   20           3                 52               2         [ Open ]               │
│            │ v Noah Zeller    61 of 87   14           1                 11               0         [ Open ]               │
│            │     v Procedures                                  21 of 40 met                                              │
│            │         v Cardiovascular                           5 of 8 met                                                │
│            │             IV insertion         7 of at least 5 demonstrations   Achieved       *  NURS 350                │
│            │             Foley catheter       2 of 3 qualifying                In progress    *  NURS 350  [ Ask for review ]│
│            │             Wound care           4 of 4 demonstrations            Evidence does not qualify                 │
│            │                                  Needs 1 in Inpatient, 1 in Emergency                       [ Open ]        │
│            │         > Respiratory                              7 of 9 met                                                │
│            │     > Essentials                                  32 of 47 met                                              │
│            │ > Olivia Martin  58 of 87   18           0                 11               1         [ Open ]               │
│            │ ...                                            Showing 25 of 29      [ Show 25 more ]                        │
│            │ Counts are student-item records for this list only. They are never added to another list.                   │
└────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Notes:

- **Group picker is step one** `[CALL 10-09 Aarti-followup F13]`: "when I'm doing a review, I'm going to want to pick a cohort and all the students who are in that cohort", "29 students in this cohort, who's meeting the criteria, who's not". This is the Prism compliance dashboard model she names. The picker offers cohorts and custom groups (section 4.7c); with only cohorts today it reads like R1's cohort filter.
- **List tabs** are `LISTTAB`. Switching a tab changes the title line, the KeyMetrics, the tree, the lens counts and the "Waiting on me" count. Nothing carries across. The Report badge in the rail counts decisions waiting on me across lists, because it is a task count and not a report. That is an `[INFER]` and could read as mixing; see 8.1 and the question in section 13.
- **Where to go next** replaces R1's "Needs a decision" label, because the Oct 9 mandate is "where they need to go, what's done, what's not done" `[F7]`. Same behaviour: counted chips that filter this report, zero chips hidden, "Nothing waiting" when all are zero, no time words. A new chip, "Items with a warning", appears only in warn mode (8.5).
- **Done versus not done** is read from the strip (what needs me) plus the "Met" and "No evidence yet" columns, plus the "Met every item 3 of 29" card. No bar. The student side states it in plain sentences (4.5).
- **Tree rows**: `Procedures > Cardiovascular > IV insertion` is three levels. Depth is a seam (8.6). Each branch shows "n of N met" computed from the items under it. The student row's top-level counts are the same numbers. A row at depth beyond four collapses its ancestors to a path in the row (`Procedures / Cardiovascular / Peripheral / ...`) `[INFER]`.
- **Course highlight** is a star plus the course name. With a course picked, the scope sentence adds "In NURS 350: 4 of 6 · overall 61 of 87" `[CALL 10-08 Aarti]`. Bold and underline cues are drawn on the student side (4.5) where they matter most. Highlight never hides or locks a row `[REQ CM-05]`.
- **No rotation or setting column.** A setting minimum shows in the row text where it blocks "Achieved" (Wound care) so `[REQ SC-12]` is never a surprise `[REQ SH-05]`.
- **Group with two lists attached and neither default**: the first tab is the list with the lowest sort order, which the admin sets in Lists. With one list attached, no tabs `[Q2]`.
- **Empty states**: no list yet shows 4.7e. A group with no list attached says so and links to Used by. A list with no set-up items says "Nothing to report yet" with "Show items that need set up".

**Second state, By item lens (a tree of items, one row per item)**

```
│ ( By student )( By item )( By tag )( Waiting on me 12 )     [Search items] [Group by: tree v] [Kind v] [Tag v]            │
│ Item                          Kind        Target                                 Met by   In progress  No evidence yet   │
│ v Procedures (40 items)                                                                                                    │
│     v Cardiovascular (8 items)                                                                                             │
│         IV insertion          Procedure   at least 5 demonstrations, 3 independent   24 of 29   4           1              │
│         Wound care            Procedure   at least 4, 1 per setting                  10 of 29   12          7              │
│ Tag figures overlap because an item may carry several tags.                                       [REQ RP-04]               │
```

A branch row in this lens shows only the number of items under it. It shows no average across items or students; that would be a new calculation nobody asked for. Aggregate criteria such as average, minimum and maximum of one item's results are a seam (8.9), not a lens.

### 4.2 The drill-down: Student record (full page; the same component also opens as a panel from the report)

Route `{base}/report/students/{id}?list=..`. The report row's "Open" shows this component in a non-modal panel for a quick look (the "Needs action" rows first). "Open full page" in the panel header goes to this page. One component, two hosts `[INFER]`. R2's reason for a page stands: 100 to 200 rows do not read well in a 40 percent panel.

```
┌ ☰ (E) Prism v │ Student record                           Search Cmd+K   Bell   ?   Ask Leo │ Sample University v │ RS v ┐
├────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Report 12  │ Report > BSN 2027 > Noah Zeller                                                                          │
│ Set up     │ Noah Zeller                BSN 2027 · Track B · Group: clinical rotation 2     [ Export record ]         │
│            │ ( Clinical skills v3 )( Competency log v1 )      <- the student's lists; each is its own record view     │
│            │ 61 of 87 items met · 14 in progress · 1 does not qualify · 11 no evidence yet · 0 waiting                │
│            │ Program requirement: not set (reserved)                                                                  │
│            │                                                                                                          │
│            │ Highlight for [ NURS 350 v ]  ( Needs action 26 )( All 87 )( Met 61 )   [Search items]  Source [All v]   │
│            │                                                                                                          │
│            │ v Procedures                                                                      21 of 40 met           │
│            │   v Cardiovascular                                                                 5 of 8 met            │
│            │ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│            │ │ [ ] *  Foley catheter       Procedure   In progress        2 of 3 qualifying       [ Ask for review ]│   │
│            │ │          Needs 1 more qualifying evaluation                                                        │   │
│            │ │          Sign-off: faculty done, preceptor waiting (J. Delgado)                    [ Evidence > ]  │   │
│            │ │ [ ] *  Wound care           Procedure   Evidence does not qualify   4 of 4 demonstrations          │   │
│            │ │          Needs 1 in Emergency (you have 0 of 1). Lab evidence does not count toward clinical.     │   │
│            │ │ [ ]    IV insertion         Procedure   Achieved           7 of at least 5         [ Evidence > ]   │   │
│            │ │          Counted from: student request, faculty then preceptor                                     │   │
│            │ │ [ ]    Tracheostomy care    Procedure   No evidence yet    0 of 3                  [ Ask for review ]│   │
│            │ └────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│            │   > Respiratory                                                                    7 of 9 met            │
│            │ > Essentials                                                                       32 of 47 met          │
│            │ * = highlighted for NURS 350. Every item can be asked for, highlighted or not.        [REQ CM-05]       │
│            │ 2 selected                                                  [ Clear ]   [ Ask for review ] (sticky)      │
└────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Row anatomy is R2's `[R2 section 4.2]`, kept: checkbox, star, name and kind chip, standing word, count "n of N" (over-achievement allowed `[REQ AE-03]`), needs line only where something is missing `[REQ SH-03]` `[REQ SH-05]`, chain line `[OD-33]`, source line shown only when it is not a student request `[OD-31]`, row action, "Evidence >".

**Evidence chain panel** (non-modal, opens beside the list; same as R2 4.2 with one added line):

```
┌ IV insertion · Noah Zeller · list: Clinical skills v3 ─────────────────────────────────────────── x ┐
│ Procedure · Procedures > Cardiovascular · highlighted for NURS 350                                    │
│ Achieved · 7 of at least 5 demonstrations · independent 3 of at least 3                               │
│ Rule from this list: every completed demonstration counts. Needs at least 5, at least 3 independent.  │
│ Chain: 1 Self-evaluation -> 2 Faculty -> 3 Preceptor                                                  │
│ ───────────────────────────────────────────────────────────────────────────────────────────────────  │
│ Entry 7 · 05-11 · Clinical · Inpatient · Harbor FP · NURS 350 · requested under: Clinical skills v3   │
│   Step 1  Self-evaluation  Noah        done 05-11  Independent                                        │
│   Step 2  Faculty          A. Rao      done 05-12  Independent                                        │
│   Step 3  Preceptor        J. Delgado  done 05-13  Independent        Counted     [ View form ]       │
│ Entry 6 · 05-02 · Lab · simulation · NURS 340                                                         │
│   Step 1  Faculty          S. Nakamura done 05-02  With assistance                                    │
│   Counted. Lab evidence does not count toward a clinical setting minimum.            [REQ SC-12]      │
│ ...                                                       [ Ask for review ]   [ Export ]             │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Where the student has evidence only under another list for the same item, this list's ledger does not show it and a single line says "1 entry for this item was requested under another list" with no counts. Seam 8.2 decides whether that line exists.

### 4.3 Reviewer sign-off: Waiting on me (admin, a lens of the Report)

```
┌ Report ─────────────────────────────────────────┬ Rina Okonkwo · IV insertion · NURS 350 ──────────── x ┐
│ Group [BSN 2027 v] ( Clinical skills v3 )( Competency log v1 )   <- the queue is per list tab            │
│ ( By student )( By item )( By tag )( Waiting on me 12 )                                                  │
│ Waiting on me: Clinical skills 12 · Competency log 4          [ Show: this list | both lists ]            │
│ Agree 9             [x] select all agree                       Student rated: Independent                │
│ [x] Rina O.  IV insertion  NURS 350  step 3 of 3, preceptor    Evaluator: Independent                    │
│ [x] Noah Z.  Foley         NURS 350  step 2 of 2, faculty      Agree. If approved this counts as 5 of    │
│ ...                                                           at least 5 demonstrations.                │
│ Differ 3                                                       Supplied by the student: 05-11, 4 West    │
│ [ ] Jonah N.  IV insertion NURS 350  student and evaluator     Evaluator comment: "..."                  │
│        differ                         [ Open ]                 > See all responses                        │
│ [ Approve 9 selected ]                                         Review note (optional) [____________]      │
│                                                                Chain: faculty done > preceptor done > you │
│                                                                [ Return for correction ]   [ Approve ]    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- The decision queue is a task list. It may show both lists at once because it is not a report `[INFER]`; it defaults to this list so Q1 stays true, and the label states which list each row belongs to. If Aarti reads even this as mixing, "both lists" is removed and nothing else moves.
- Column set `[REQ AR-01]`: student, item, course, setting, location, evaluator, role. "If approved this counts as ..." states the consequence before the button `[MOBBIN Deputy, prior file]`. The return wording stays neutral until OD-16.
- Nothing in the Oct 9 call touches sign-off ordering, approval or return wording `[CALL 10-09 Aarti-followup section 2 end]`, so this frame is R1's with list context added.

### 4.4 Setup: lists, versions, attach to groups, first run

**4.4a Set up > Lists (index)**

```
┌ Set up ────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ( Lists )( Items )( Student groups )( Evaluators )( Settings )( Kits )                                      │
│ Your lists. Each list is its own report and has its own rules.                          [ New list ] (FILLED when none) │
│ [Search lists]  [Status: Live v]                                                                            │
│ Name                 Version  Replaces   Items  Set up   Used by                        Default for         Status   │
│ Clinical skills      v3       v2         87     85       BSN 2027, BSN 2028, Track B    BSN 2028            Live     │
│ Competency log       v1       none       24     24       BSN 2027                       none                Live     │
│ Clinical skills      v2       v1         81     81       BSN 2026                       none                Live     │
│ Clinical skills      v1       none       79     79       none                           none                Unused   │
│ 4 lists · 1 item with a warning · The old versions stay readable; they are not edited.                       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Row opens List detail (4.4b). A version is a list that points at the one it replaces; "Replaces" is a column, not a history view `[INFER]`.
- The word "Version" is a label the school types or accepts (v3). There is no compare screen and no revert; the call does not ask for one `[CALL 10-09 Aarti-followup F12]`.

**4.4b List detail > Contents: the tree and a rule applied to a branch (R3's group editor on R1's host)**

```
┌ Set up > Lists > Clinical skills v3 ───────────────────────────────────────── ( Contents )( Used by )( Course emphasis ) ┐
│ Status (derived): 87 items · 85 set up · 2 need a rule · 2 with a warning.        [ Import into this list ] [ Add item ]   │
├ Tree ─────────────────────────────────┬ Branch: Procedures > Cardiovascular (8 items) ───────────────────────────────────┤
│ v Procedures (40)                     │ Rule for this branch                                                              │
│   v Cardiovascular (8)  *             │ Items in this branch  [x] select all 8   Overrides on 1 item                       │
│     IV insertion        set up        │                                                                                   │
│     Foley catheter      set up        │ ┌ Nothing is chosen for you ───────────────────────────────────────────────────┐ │
│     Wound care          warning       │ │ Evaluation model   ( Binary )( Questions )( Scored )( Demonstration )        │ │
│     ...                               │ │   (four unselected tiles; no default)                                [SC-02]  │ │
│   > Respiratory (9)                   │ │ Levels   1 Observed · 2 With assistance · 3 Independent                       │ │
│   > Medication safety (8)             │ │ Qualifies when   every completed demonstration                                │ │
│ > Essentials (47)                     │ │ Needs   at least 5 demonstrations · at least 3 independent                    │ │
│ + Add branch    Depth: 3 of 4 shown   │ │ Aggregate (average, minimum, maximum)   [ not available yet ]   <- seam 8.9   │ │
│                                       │ │ Student supplies   Date* · Unit* · Notes                                      │ │
│ Move: drag a branch or an item        │ │ Sign-off   Step 1 [Faculty v]  Step 2 [Preceptor v]   [ Add step ]            │ │
│                                       │ │ Form   rendered by the existing form engine (not designed here)  [OD-36]       │ │
│                                       │ │ Preview: ( Student view )( Evaluator view )                          [SC-19]   │ │
│                                       │ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                       │ Impact: 0 students have evidence yet.   [ Apply to 8 items ] (FILLED)             │
└───────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

- Selecting any node applies the rule to every item under it. "Keep each item's own value" is the default for anything already set `[MOBBIN Pipedrive Bulk edit, prior file]`. The model is chosen explicitly for the branch, never preselected `[REQ SC-02]`.
- The tree is proposed from import headings, and the school may reshape it freely: "they can decide how they want to organize that list. We need not dictate that." `[CALL 10-09 Aarti-followup F9]`. Prism proposes nothing from a taxonomy `[REQ SL-01]`.
- The branch rule pane is the unit that answers R3's "80 items stop being 80 decisions" `[REQ IM-14]` and also holds at deeper trees.
- Editing a rule on a list with data shows the impact line before save, "12 students move from Achieved to In progress" `[REQ AE-02]`. R4 does not add a lock. "If you are on purpose making a change to the list, that's a new list" `[F17]` is guidance in the impact line: "To keep results as they are, make a new version" with a link to 4.4e.

**4.4c List detail > Used by: attaching a list to groups, with a Default flag (replaces "Apply set to cohort")**

```
┌ Set up > Lists > Clinical skills v3 ──────────────────────────────────────── ( Contents )( Used by )( Course emphasis ) ┐
│ Which students must meet this list.  Nothing is set up per group.                                                        │
│ Default for new groups   [ off v ]    When on, any group added later is attached to this list automatically.            │
│ Used by         [Search groups]                                                          (made-up groups)                │
│ [x] BSN 2027      cohort   29 students      Also uses: Competency log v1                                                │
│ [x] BSN 2028      cohort   31 students                                                                                   │
│ [x] Track B       custom   14 students      Overlaps BSN 2027 by 6 students                                              │
│ [ ] Accelerated   custom   18 students                                                                                   │
│ 3 groups · 74 students (6 counted once)                          [ Save changes ] (FILLED when changes exist)            │
│ A student who is in two groups of this list appears once in the report.                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- One checkbox per group, one Default switch. No per-group rule, no clone, no "apply" button per group `[CALL 10-09 Aarti-followup F12]`.
- "Default for new groups" is on the list. A group created later in Student groups takes every list marked Default. If two lists are Default, both attach and the report shows two tabs for that group.
- Detaching a list from a group that has data does not delete anything; the list simply stops appearing for that group. The Save confirm says so `[INFER]`.
- Per-group different criteria for "few students I want to evaluate with different evaluation criteria" `[CALL 10-09 Aarti-followup F14]` is answered by attaching a different list to a small custom group. No per-student exception exists. Whether that is enough for the real case is a question for Aarti.

**4.4d Create list (dialog), including the starter seam**

```
┌ New list ────────────────────────────────────────────────────────────────────────────────── x ┐
│ Name  [ Clinical skills                              ]    Version  [ v1 ]                       │
│ Start with                                                                                    │
│ ( ) An empty list                                                                             │
│ ( ) Import a file         Spreadsheet, Word or PDF. Nothing is created until you confirm.       │
│ ( ) The items of another list     [ Clinical skills v2 v ]   items only, rules are not copied │
│ ( ) A starter list for a discipline   <- SEAM B only (4.4f). Hidden unless the product ships one │
│ Attach to groups later in Used by.                                                           │
│                                                    [ Cancel ]   [ Create list ] (FILLED)      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

"The items of another list" is the only clone-adjacent choice. It copies membership and the tree, not rules, not groups, not data. Whether Aarti reads it as a clone is open ("I don't want to do clone in here"); it is easy to remove, and without it a new version must be rebuilt by import, which is the cost of her position `[INFER]`. Escalation in section 13.

**4.4e New version (dialog opened from a live list)**

```
┌ New version of Clinical skills v3 ───────────────────────────────────────────────────────── x ┐
│ A new version is a new list. The current list and its results stay exactly as they are.         │
│ Name  [ Clinical skills ]  Version [ v4 ]    Replaces: v3                                       │
│ Start with ( ) An empty list ( ) Import a file ( ) The items of v3                               │
│ Then: in Used by, move your new groups to v4. Groups on v3 keep v3 until you move them.          │
│ Deleting v3 is only possible if no evidence was ever recorded against it.                         │
│                                                    [ Cancel ]   [ Create version ] (FILLED)      │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**4.4f First run, shown both ways. This is a seam, not a choice** (`[REQ SL-01]` vs `[CALL 10-09 Aarti-followup F10]`)

```
SEAM A  Empty library (REQ today)                                SEAM B  Optional starter list (call; conflicts with SL-01)
┌ Report ────────────────────────────────────────────┐          ┌ Report ───────────────────────────────────────────────┐
│ Nothing to report yet. Bring in the list your      │          │ Nothing to report yet. Start your first list.           │
│ program already has.                                │          │ ┌ Items 0 · Students 150 · Evidence 0 ───────────────┐ │
│ ┌ Items 0 · Students 150 · Evidence 0 ─────────┐   │          │ │ [ Bring in your list ]    Add one item by hand      │ │
│ │ [ Bring in your list ]   (FILLED)             │   │          │ │ Or start from a list for your discipline            │ │
│ │ Add one item by hand                          │   │          │ │ Nursing (accrediting body list)   [ Preview ]       │ │
│ │ Ask Leo to read a document (AI is off)        │   │          │ │ Physician assistant               [ Preview ]       │ │
│ └───────────────────────────────────────────────┘   │          │ └─────────────────────────────────────────────────────┘ │
│ Prism ships no items. The manual path works with    │          │ Nothing is added until you choose Adopt. After you adopt, │
│ AI off.                                              │          │ the list is yours: a copy you can edit, never a live link. │
└─────────────────────────────────────────────────────┘          └───────────────────────────────────────────────────────┘
  [REQ SL-01 IM-12 IM-13] [CALL 10-02]                              [Preview] opens a read-only list; [ Adopt as my list ] copies it
                                                                    Placeholder names; whether any content exists, and who owns it,
                                                                    is the escalation in section 13.
```

Seam B rules `[INFER]`, so that a starter list can never break a hard stop even if Sankalp allows it:

1. A starter list is not in the product until the school adopts it. Adopting creates a normal list owned by the school. There is no live link to the source, so the school's edits are never overwritten `[CALL 10-09 Aarti-followup F10]`: "it's their document, their list."
2. Adopted items arrive unconfigured. They still cannot be mapped or submitted against until configured `[REQ IM-09]`. No default model is applied `[REQ SC-02]`.
3. Copy never says the starter is endorsed by an accreditor `[REQ §1.7]`. The label says "a starting point you can change".
4. Starter content is scoped at the school or program (the OU level), "at each OU code level" `[F10]`.
5. Where "ships no skills" and "loads known competencies" differ in who owns the content, the UI does not decide. The only difference between A and B is one extra block on the empty state and one extra radio in Create list.

### 4.5 Student phone home: My checklist (list tabs, launch page, soft course cues)

```
┌──────────────────────────────────┐
│ My checklist                     │
│ ( Clinical skills )( Competency log )   <- tabs only when you have more than one list │
│ ───────────────────────────────  │
│ Where you stand                  │
│ 42 of 87 items met               │
│ In NURS 350: 3 of 6              │
│ Done 42 · In progress 14 ·        │
│ Not started 31                   │
│                                  │
│ What to do next                  │
│ 2 items need your action         │
│  Wound care, returned            │
│  Foley catheter, ask for review  │
│ Waiting on someone: 1            │
│  Central line dressing,          │
│  waiting on J. Delgado           │
│                                  │
│ ( Needs action 17 )( All 87 )    │
│ Highlight for [ NURS 350 v ]     │
│ ───────────────────────────────  │
│ v Procedures · Cardiovascular 5 of 8 │
│ [ ] * __Foley catheter__  (bold + underline + star, and the words "Emphasised in NURS 350") │
│       2 of 3 qualifying          │
│       In progress                │
│ [ ] * __Wound care__             │
│       4 of 4 demonstrations      │
│       Evidence does not qualify  │
│       Needs 1 in Inpatient and   │
│       1 in Emergency             │
│ [ ]   Tracheostomy care          │
│       Not started                │
│ > Respiratory              7 of 9│
│ > Medication safety        6 of 8│
├──────────────────────────────────┤
│ [ Ask for review (2) ]           │   <- appears when rows are ticked; the only filled primary
└──────────────────────────────────┘
```

- **Progress, next step and done versus not done are the first block**, in plain sentences with numerals, not a bar `[CALL 10-09 Aarti-followup F7]`. "Done 42, In progress 14, Not started 31" are the Met, In progress and No evidence states with kinder words for the student; "Evidence does not qualify" stays visible in the rows, not folded into "Not started" `[REQ AE-04]` `[OD-03]`.
- **The launch page does not redesign anything that comes from the evaluator form.** "Anything that's coming from fast, we don't really have to spend a lot of design thinking there" `[F7]`. The layer above it is what is built.
- **Soft course cues**: bold, underline, star and the words "Emphasised in NURS 350", never colour alone `[CALL 10-09 Aarti-followup F6]` `[CALL 10-08 Aarti]`. Every row stays tappable. Nothing is hidden or disabled `[REQ CM-05]` `[REQ ST-02]`.
- **List tabs** show one list at a time. The student sees only the lists attached to their groups. Counts never combine.
- **Students never see other students or a class average** `[INFER]`, kept from R2/R3. The Oct 9 class-score line was about the competency spiderweb and is escalated, not adopted (section 13).
- Tap a row: Item history opens as a bottom sheet `[REQ SH-01..SH-07]`. Mobile targets at least 44 px.

**Ask for review sheet (the log sheet, with a typed evaluator)**

```
┌──────────────────────────────────┐
│ Ask for review                   │
│ List: Clinical skills            │
│ 2 items: Foley catheter, Wound care │
│ Setting  Clinical · Inpatient    │  <- inferred from placement; change allowed
│ Location Harbor FP               │
│ Who should review this?          │
│ Recent                           │
│ ( J. Delgado, preceptor )( A. Rao, faculty )( K. Larsen, lab instructor ) │
│ Or type a name and email         │
│ Name   [ Dana Whitfield        ] │
│ Email  [ dana@example.org      ] │  <- made-up address
│ Role   [ Preceptor v ]           │  <- roles valid for this setting only [REQ ST-08]
│ Save this person for next time   │  [x]
│ They get a link by email. They do not need an account.    [REQ EV-01] │
│ Self-evaluation (if configured)  │
│ ...                              │
│ [ Send 2 items ]                 │
└──────────────────────────────────┘
```

- `[CALL 10-09 Aarti-followup F15]`: "we don't need them to be coming from a dropdown list or only preceptors ... We'll let them put in the name, email. If they've already put in the name, email previously, that we can show that as easy access." The ICU case is the reason.
- **What stays constrained:** the role. `[REQ ST-08]` says the role must fit the setting (DEFECT-01 shipped a clinical-faculty label on a preceptor). The person is free; the role list is not. Whether Aarti means "any role too" is unclear from the call; R4 keeps the REQ.
- The typed person becomes a person-lite record by name and email `[OD-05]`. The merge story with the existing Prism Preceptor entity and duplicates is unanswered (`strategy/07 G-18`). Romit linked this to a known coordinator bug ("not able to add a preceptor which was not part of the evaluation") `[CALL 10-09 Aarti-followup F15]`.
- Anti-abuse and address typos are not specified. A confirm line "We will email dana@example.org" is shown after Send `[INFER]`.

### 4.6 Preceptor phone: the evaluator page, no shell, no login

```
┌──────────────────────────────────┐
│ Prism                            │
│ Sign off 2 items                 │
│ Noah Zeller · NURS 350           │
│ List: Clinical skills            │
│ You are Dana Whitfield, Preceptor │
│ ─ Foley catheter ──────────────  │
│ Supplied by the student          │
│ Date 05-11 · Unit 4 West         │
│ Student self-evaluation: ...     │
│ ┌ Form body ───────────────────┐ │
│ │ Rendered by the existing form │ │
│ │ engine. Not designed here.    │ │  <- [CALL 10-09 Aarti-followup F7] [OD-36]
│ └──────────────────────────────┘ │
│ Comment (required)               │
│ [____________________________]   │
│ ─ Wound care ───────────────── │
│ ...                              │
│ After you submit: Foley counts   │
│ now. Wound care goes to the next │
│ sign-off.                        │
│ [ Submit 2 items ]               │
└──────────────────────────────────┘
```

- One page, large single choices, a required comment blocks submit `[REQ EV-01..EV-07]`. The outcome line follows R1: "counts now", "held for administrator approval" or "goes to the next sign-off" `[OD-33]`.
- Never shown: the student's standing, the number of signatures still needed, other signers, other items, other lists `[OD-17]`.
- A student-typed signer sees the same page. The program cannot pre-validate them; the admin sees "Named by students" in Evaluators and can adopt or merge `[REQ SL-08]` `[REQ SL-09]` `[OD-05]`.
- Link lifecycle (expiry, reuse, revoke, resend) stays `[OD-18]`. No QR in v1.
- Honest gap: no Mobbin reference exists for a no-account guest approval inside a chain (R1 section 9).

### 4.7 Supporting setup frames

**4.7a Item row actions: deactivate and delete (Set up > Items, or the Contents tree)**

```
│ Item               List(s)                  Evidence   Status    Actions                          │
│ Wound care         Clinical skills v3       4 records  Active    [ Deactivate ]                   │
│ Tracheostomy care  Clinical skills v3       none       Active    [ Deactivate ]  [ Delete ]       │
│ Old procedure      Clinical skills v3       2 records  Inactive  [ Reactivate ]                   │
│ ( Show inactive items ) is a Set up filter only. It is not offered in reports or on student pages. │
```

- Delete exists only while an item has no evidence anywhere. Once any evidence exists, Delete is removed, with the tooltip text "This item has evidence. You can deactivate it instead." `[CALL 10-09 Aarti-followup F17]`: "Only when there is data that you started tracking against that you should prevent them from deleting."
- Deactivated items do not appear in the Report, the Student record, My checklist or the export by default, and their data is kept: "Don't delete the data, but don't show the list." The call's meaning of Inactive is "I made a mistake and I want to not worry about it" or "I was doing it but now I don't want to"; "if you are on purpose making a change to the list, that's a new list" `[F17]`.
- `[REQ SL-11]` says deactivation withdraws the item from mapping, selection and reporting scope and keeps the evidence already recorded. This matches. The conflict is only R3's "1 item withdrawn" line, which R4 drops.
- In-flight submissions on a deactivated item are not addressed by the call or the REQ `[OD-24]`. Left open.
- Romit's objection in the same exchange ("I'm more concerned about the reporting side where ... it's a part of accreditation"; "can we at least validate when we say deactivate?") is carried as a seam in 8.7: an export option "include deactivated items", off by default.

**4.7b Configure with a warning (seam 8.5): the Set up panel, warn state**

```
┌ Set up panel · Wound care ─────────────────────────────────────────────────────────── x ┐
│ Model  Demonstration · Needs at least 4 demonstrations · 1 in Inpatient · 1 in Emergency  │
│ Evaluator roles allowed in Emergency: none configured                                     │
│ Warning (not a block): this item cannot be met with the roles you have set for Emergency.  │
│ You can save it. It will appear in Where to go next as "Items with a warning".            │
│ Students can still ask for review on it, and it will never reach Achieved until fixed.     │
│                                       [ Fix now ]   [ Save with warning ]   [ Cancel ]    │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Default in the build stays "block" (the right-hand button disappears and the save is disabled with the reason) until Sankalp rules. See 8.5.

**4.7c Set up > Student groups (made up, to validate with Yash)**

```
┌ Set up ───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ( Lists )( Items )( Student groups )( Evaluators )( Settings )( Kits )                                  │
│ Groups of students that lists are attached to.                                          [ New group ]    │
│ Name           Type     Students  Defined by                                  Lists                      │
│ BSN 2027       cohort   29        Cohort from the student system             Clinical skills v3, Competency log v1 │
│ Track B        custom   14        Program BSN and Track B and Year 2         Clinical skills v3         │
│ Accelerated    custom   18        Picked by hand                              none                       │
│ Cohort groups mirror the student system and are read only here. Custom groups are yours to define.      │
│ Placement groups already exist elsewhere in Prism and are not these.                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- `[CALL 10-09 Aarti-followup F14]`: "nursing schools are not able to use cohort effectively. They like to do tracks, and then within tracks they like to do other things", "For lockstep programs, cohort works just fine", "like a toggle ... two types of groups. One is a cohort and one is just custom", and "it's worth asking Yash if we are ready to think about applying competencies to a group of students rather than a cohort." Not decided.
- "Defined by" shows the definition style as one filter or a hand-picked list. How a custom group is defined (rule on student attributes, manual pick, both) is not in the call; this frame is an `[INFER]` and made up. Placement groups exist ("define a placement group", about 84 percent); whether the same group object can be reused is an open question for Yash.

**4.7d Kits (unchanged from R1, now per list)**

Kits are saved rule sets that apply to a branch or to selected rows (`[REQ IM-14]`). In R4 a kit applies inside one list. Same frame as R1 4.5 Frame 4, so not redrawn.

**4.7e Empty report with no list yet**

The empty state is the Seam A or Seam B block in 4.4f. When at least one list exists but no group has one attached: "This group has no list yet. Attach a list in Used by." with the link.

### 4.8 Reports: export and accreditation evidence pull (new; none of R1 to R3 drew one)

`[REQ RP-10]` export carries the applied filters; `[REQ RP-11]` format open (OD-10). Accreditation output is out of scope `[REQ section 14]` `[OD-35]`, owner other `[CALL 10-08 Romit]` `[INFER]`. This screen is an evidence export, not an accreditation form.

Entry points: the Report's Export button, the Item panel ("Export evidence for this item"), and the Student record ("Export record").

```
┌ ☰ (E) Prism v │ Export                                   Search Cmd+K   Bell   ?   Ask Leo │ Sample University v │ RS v ┐
├────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Report 12  │ Report > Export                                                                                        │
│ Set up     │ Export evidence                                                                                        │
│            │ Evidence from one list at a time. This file is not an accreditation form.                              │
│            │                                                                                                        │
│            │ 1  List        ( ) Clinical skills v3     ( ) Competency log v1     <- one list per file               │
│            │ 2  Group       [ BSN 2027 (cohort) v ]  [+ Add group]   Students 29                                     │
│            │ 3  Scope       ( ) Whole list   (x) One item   [ IV insertion v ]   ( ) One student [ choose v ]       │
│            │ 4  Detail      ( ) Summary: one row per student or per item                                             │
│            │                (x) Evidence detail: one row per evaluation                                              │
│            │                ( ) Student record: all items for one student                                            │
│            │ 5  Include     [x] Questions and answers  [x] Scores, if the form has them  [x] Feedback  [x] Details   │
│            │                [ ] Deactivated items (off by default; adds their rows and marks them)       <- seam 8.7 │
│            │                [ ] Link-only lines (licensure exams) listed with their link, no status                   │
│            │ 6  Format      ( ) CSV    ( ) Excel                                                       [OD-10 open]    │
│            │                                                                                                        │
│            │ File header that will be written                                                                        │
│            │ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│            │ │ List: Clinical skills · Version v3 · Replaces v2                                                    │ │
│            │ │ Group: BSN 2027 (cohort) · 29 students                                                              │ │
│            │ │ Scope: item "IV insertion" · Detail: one row per evaluation                                         │ │
│            │ │ Filters: course = any · setting = any · cohort = BSN 2027                                           │ │
│            │ │ Deactivated items: not included · Link-only lines: not included                                    │ │
│            │ │ Generated by: RS · Generated on: <date of export>                                                   │ │
│            │ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│            │ Preview (first 3 of 31 rows)                                                                            │
│            │ Student        Item           Date   Course    Setting   Evaluator (role)            Result       Counted │
│            │ Noah Zeller    IV insertion   05-11  NURS 350  Clinical  J. Delgado (preceptor)      Independent  Yes     │
│            │ Noah Zeller    IV insertion   05-02  NURS 340  Lab       K. Larsen (lab instructor)  With assist. Yes*    │
│            │ Priya Tran     IV insertion   04-28  NURS 350  Clinical  A. Rao (faculty)            Independent  Yes     │
│            │ * counted toward the item, not toward a clinical setting minimum.                                       │
│            │ The file contains student names and evaluator emails. Only people who may read this group can export.    │
│            │                                                          [ Cancel ]   [ Download file ] (FILLED)        │
└────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **One list per file, always.** A visit that needs two lists is two exports. A zip of per-list files is a convenience seam, never a combined sheet `[Q1]`.
- **The header records the list, its version, the group and the filters** so the file stays self-describing `[REQ RP-10]`. R1 noted it as "the group name and list name should appear in the file header" `[CALL 10-09 Aarti-followup section 2 end]`.
- **Evidence detail** carries questions, scores, feedback and details `[REQ RP-07]`, row per evaluation. Setting stays on the row, so lab-versus-clinical remains auditable even though the headline report hides it `[REQ SC-12]`.
- **Link-only lines** (licensure exams) are exported with their link and no status, because there is no workflow behind them `[CALL 10-09 Aarti-followup F21]`.
- **What this screen does not do:** no accreditation form (pharmacy Standard 7, FARMS or any other), no sign-off package, no signed PDF, no standards mapping, no saved export templates, no scheduled export, no history of previous exports. All are either REQ section 14, OD-35, or not asked for.
- **FERPA:** exports are role-scoped to the groups the person may read `[OD-25]`.
- The evidence pull for one item is the same screen prefilled: from By item, open an item, press "Export evidence for this item" and land here at step 4.

### 4.9 Skills snippet on other entity pages (one small frame; thin evidence)

The call asks for "a snippet of the skills data on the student profile elsewhere in Prism" `[CALL 10-09 Aarti-followup F13]` (one partial phrase at about 77 percent). The frame below is a card the existing student profile could host `[OD-34]`.

```
┌ Skills ────────────────────────────────────────────────── (shown on the existing student profile) ┐
│ Clinical skills v3                     42 of 87 items met · 3 waiting on a reviewer                │
│ Competency log v1                      10 of 24 items met · 0 waiting                              │
│ Next: ask for review on 2 items (Foley catheter, Wound care)                  [ Open in Skills ]   │
│ Each line is its own list. No total across lists. No class average.                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Same data and same component family as the Report row and My checklist top block; role-scoped by the host page (advisors, student success) `[OD-25]`.
- It carries numerals and words only, no chart, no colour state.
- The "Next" line is shown to the student and to staff who may act; for advisors it is hidden unless OD-29 lets them trigger. It names no time words.
- This is not a promise of a build. It exists to prove the Report components do not assume the Prism shell `[OD-34]`.

---

## 5. How each source of evidence appears

Unchanged in substance from R1 and R2 section 5. All sources land in one ledger. A row shows: source, who and role, when, course, setting, location, result, counted or not, and now **the list it was requested under**. The headline never shows the source; the panel always does.

| Source | v1 status | Report row | Panel ledger | Student checklist | Hard stop and seam |
|---|---|---|---|---|---|
| Student-submitted, evaluated by one evaluator (faculty, preceptor, lab instructor, or a person the student typed) | Live | Counts only | "Student submitted · name (role) · result · Counted" | "Waiting on name" | `[REQ EV-01]` `[REQ RV-03]`; typed person `[OD-05]` |
| Self-evaluation as input | Live where configured | Counts only | Both outcomes, agreement line | Inside the sheet | `[REQ ST-11]` `[REQ AR-02]` |
| Self-attestation alone | Seam, off | Counts only | "Student attested · no evaluator" | "Mark as met" instead of "Ask for review" | Never default `[REQ SC-02]` `[OD-37]`. "students saying is enough" is a hard-stop pressure |
| Faculty only | Live (chain of one) | Counts only | One step | One "waiting on" | `[OD-06]` `[REQ SC-16]` |
| Faculty then preceptor, sequenced | Seam over a chain of two | Counts only | "faculty done, preceptor waiting" | "Waiting on J. Delgado" | `[OD-33]` `[CALL 10-08 Aarti]`: "Faculty has to approve, then a preceptor has to approve" |
| N signatures from distinct preceptors | Seam | Counts only | Each signature its own row | "2 of at least 3 signatures" | `[OD-33]` |
| Question, assessment or end-of-rotation form question | Seam, off | Counts only | "Counted from: assessment ..." | "See how this counts" | `[OD-31]` `[REQ IM-09]` |
| Course grade or pass | Seam, off | Counts only | "Counted from: course pass" | Same | Owned by the item, not the mapping `[OD-32]` `[REQ CM-05]` |
| Standalone FAST form | Seam, adapter | Counts only | Form through "View form" | Same as submitted | Adapter `[OD-36]` |
| Licensure exam (link only) | Seam, off | A line with a link and no state | Not applicable | A row with a link, no Ask for review | `[CALL 10-09 Aarti-followup F21]`: "with a link. But it is not going to give a whole workflow around it." Exams as proof "unlikely, not impossible" |
| Patient log | Not designed | n/a | n/a | n/a | `strategy/07 C-10`; ask whether it is the section 14 feature |

Rules that follow: a system-sourced row is never editable and never says "evaluated". Setting is written on every row so the headline can ignore it while the rule cannot `[REQ SC-11]` `[REQ SC-12]`. A person who is both faculty and preceptor appears once per role `[CALL 10-05]`.

---

## 6. Journeys with click counts

All counts are `[INFER]` estimates by a prepared user on desktop. A click is a press, selection or tap; typing is not counted. They are not measured. The baseline is `design/friction-baseline.md` as quoted in `brief-v2` (about 2,000 interactions to set up 100 skills today). Comparison with R1 (about 70), R2 (about 123 including course highlights) and R3 (about 52) is fair only if the 80 items fall into a few rule patterns. The implementation Excel is not in hand, so that is unevidenced `[CALL 10-09 Aarti-followup F8]`: "we'll start with 6 examples of what we have seen", "We don't have to design it for all possible 8,000 combinations."

### 6.1 First-hour setup of 80 items (admin)

Assumes seam A (empty library), 4 genuine branches, 1 list, 2 groups, import from a file.

| # | Step | Where | Clicks |
|---|---|---|---|
| 1 | Open the app, land on the empty Report, press "Bring in your list" | Report (4.4f A) | 1 |
| 2 | Name the list, pick "Import a file", Create | New list (4.4d) | 3 |
| 3 | Choose the file, read it | Import dialog | 2 |
| 4 | Scan the review, edit 3 names, resolve 3 duplicates | Import review | 9 |
| 5 | Create 80 items; branches are proposed from headings, accept | Import review | 2 |
| 6 | For each of 4 branches: select the node (1), choose the model tile (1), set levels or labels (about 4), set the rule and target (about 2), open preview once (1), Apply (1), confirm the list (1) | Contents (4.4b) | about 11 x 4 = 44 |
| 7 | Used by: tick 2 groups (2), Save (1) | 4.4c | 3 |
| 8 | Optionally mark the list Default for new groups | 4.4c | 1 |
| 9 | Open the Report, open the first student to see the list | Report | 2 |
| **Total** | | | **about 67 (range 55 to 80)** |

- First value arrives at click 6, when the Report already lists the items and the students can see them, though they cannot submit until set up `[REQ IM-09]`.
- If the 80 items fall into 10 branches the count is about 150.
- A second list costs about the same minus step 7's group work; with "the items of another list" as the start it saves steps 3 to 5 and not step 6 (rules are not copied).
- A new version (4.4e) costs about 6 clicks plus rebuilding rules (about 44) plus moving groups (about 4); if Aarti rejects "the items of another list" it adds import steps (about 14). A real list change is rare ("every 7-10 years") so this cost is accepted `[F12]`.
- Course emphasis is optional and adds 0 clicks since it is soft `[CALL 10-08 Aarti]`.
- Under seam B the first click opens the Preview of a starter list and Adopt replaces steps 2 to 5 (about 4 clicks), leaving the 44 clicks of rule-setting unchanged. A starter list that already carried rules would break `[REQ SC-02]` and `[REQ IM-09]`; so it cannot.

### 6.2 Weekly review: who has met what, and the sign-off

| # | Step | Clicks |
|---|---|---|
| 1 | Open the app: the Report is the landing, group and list are remembered | 0 |
| 2 | Read "Where to go next" and the four counts | 0 |
| 3 | "Waiting on me 12": click Show | 1 |
| 4 | Approve the 9 that agree: select-all, Approve selected, confirm | 3 |
| 5 | The 3 that differ: open (1), decide (1) each | 6 |
| 6 | Back to By student: sort "fewest met" (1), expand the first student (1), open the panel (1) | 3 |
| 7 | Ask the student or read the chain; a trigger by an admin only if OD-29 allows | 0 to 2 |
| 8 | Switch to the second list tab and repeat 3 to 5 for its 4 waiting | +1 +3 +2 |
| **One list** | | **about 13 to 15** |
| **Two lists** | | **about 19 to 21** |

Compare R1 (15 to 17 for one list). The saving of the group picker defaults is small; the cost of a second list is the tab switch plus its own queue. "Who is behind" is read as "fewest met" or "no evidence yet", never a labelled status `[OD-27]`.

### 6.3 Evidence pull for one item (accreditation visit)

| # | Step | Clicks |
|---|---|---|
| 1 | Report: pick the group (2) | 2 |
| 2 | By item lens, open the item the visitor asked about | 2 |
| 3 | Item panel: read how many students met it, the target, the chain; open one student's evaluation | 2 |
| 4 | "Export evidence for this item": lands on Export at step 4 | 1 |
| 5 | Choose detail, tick includes, choose format | 3 |
| 6 | Download | 1 |
| **Total** | | **about 11** |

For a visit covering both lists: repeat steps 4 to 6 for the second list (about 6 more). That is two files, by design. The accreditation form itself is not produced `[REQ section 14]` `[OD-35]`.

---

## 7. Requirement coverage and homeless items

`Home` = where it lives in R4. All REQ behaviour is unchanged unless a row says otherwise; only containers change.

| REQ area | IDs | Home in R4 | Change from R1, R2, R3 |
|---|---|---|---|
| Library | SL-01..SL-11 | Set up > Items (pool), Lists (membership and tree), Settings (tags, settings) | Categories become tree nodes (conflict with `[REQ SL-03]`, seam 8.6). SL-01 under pressure from starter lists (seam 8.4). SL-11 matches, R3's "withdrawn" line dropped |
| Import | IM-01..IM-15 | Report empty state, New list, Import review, Contents tree | Import now targets a list. IM-07 headings become proposed tree nodes. IM-10 derived status moves to a status line on the list and the strip on Report |
| Configuration | SC-01..SC-19 | Rule pane on a tree node; Set up panel on a report row | Rule lives on the list (seam 8.2). SC-09 and SC-18 enforcement relaxed to warn as a seam (8.5) |
| Course mapping | CM-01..CM-08 | List detail > Course emphasis; "Highlight for course" in Report and My checklist | Soft only, per list. Cues: star, bold, underline, words. OD-01 carry-forward stays open and now applies to lists, not to course mappings |
| Student submission | ST-01..ST-14 | My checklist, Ask for review sheet | Typed evaluator (person-lite). ST-08 kept for the role. Launch block added |
| Evaluator | EV-01..EV-08 | Evaluator page | Adds list name and student-typed signer |
| Admin review | AR-01..AR-06 | Report > Waiting on me, Compare and decide | List-scoped queue |
| Revision | RV-01..RV-06 | Item history, Waiting on me | Same |
| Student history | SH-01..SH-07 | Item history, row states | Same, per list |
| Reporting | RP-01..RP-11 | Report (lists, group picker, three lenses), Student record, Export | Export screen drawn for the first time. RP-10 header now includes list and version |
| Achievement engine | AE-01..AE-08 | Under every page | Standing derived per list. Display flag OD-03 stays |
| Open decisions | OD-01..OD-13 | Section 8 | None treated as decided |
| Out of scope | REQ section 14 | Not designed | Remediation, notifications, expiry, patient-encounter linkage, accreditation outputs, Evaluations migration |

**Homeless or awkward items**:

| Item | Why homeless | Proposed home `[INFER]` | Risk |
|---|---|---|---|
| Lab instructor adoption (SL-09) | An evaluator-list state | Set up > Evaluators; a chip in "Where to go next" | Chip may be missed |
| Rule-change impact preview (AE-02) | Effect on the report from a setup action | Impact line in the rule pane before save | Heavy query on a live report |
| Student-typed evaluators (OD-05) | A new person-lite record with no merge story | Evaluators > Named by students, adopt or merge | Duplicates, address typos |
| Program requirement (OD-30) | No object | Reserved slot on a list | Aarti may expect it on day one |
| Per-import traceability (IM-11) | An item attribute | Items filter "Import batch" | Low |
| Entitlement (OD-34) | A product state | A full-page state in place of the Report | Needs the landing-page owner |
| Group definition for custom groups | Not in the REQ; cohort entities are other modules' (`strategy/07 G-10`) | Student groups tab | Depends on Yash and the student system |
| Placement-origin triggers | Not in the Oct 9 call; Oct 8 allowed "from inside a particular placement" | Deep link into My checklist filtered to that placement's course | None |
| Stalled evaluator requests (OD-18) | Needs a resend control; section 14 excludes reminders | Row text "Waiting on J. Delgado", no age, no resend | Users will ask for resend |
| Multi-list collisions for the same item | New in R4 | Seam 8.2 | See 8.2 |

---

## 8. Seams: if the answer is X, the UI does Y

Nothing below is decided. Each seam names the question, the default R4 builds, the REQ it touches, and what the UI does under each answer.

### 8.1 One list or several (OD-28, OD-02, and the Oct 9 F4)

| Answer | What the UI does |
|---|---|
| **Several lists, never mixed** (R4 default; moderate evidence) | List tabs where more than one list applies (Q2). No cross-list counts anywhere except the decision-queue badge (task count) |
| **Exactly one list per school** (Aarti: "Majority of the time I'll only have one list applicable for one cohort") | Tab strips and "Version" columns disappear. Lists index shows one row. Nothing else moves |
| **One list, with two lists expressed as two top-level tree nodes** (Romit's reading at about 63 percent: "if there are 2 lists, then they'll just introduce 2 categories") | The tab strip is replaced by the top node. This mixes counts in the headline and contradicts "never mixing" `[F4]`. R4 rejects it as the default; it is one render flag away |
| **Skills and competency stay separate modules (REQ 1.4 stands)** | The `kind` label becomes a scope control above the list tabs; competency lists are read-only here and come from the competency module. The nullable link shows as a chip. No competency scoring in Skills |
| **One umbrella, nothing separate** | `kind` becomes a filter chip and a column; the umbrella word replaces the nav noun "Checklist". Naming is open: "which umbrella term we would need to come up with" `[F3]` |

"One list" may be Romit's synthesis (0.2). REQ 1.4 governs until Sankalp rules.

### 8.2 Where the rule lives, and what a second list does to the same item

| Answer | What the UI does |
|---|---|
| **Rule on the list membership** (R4 default; matches "everything is defined for the list") | The rule pane edits the list's own rule. The same item can differ across lists. Evidence counts toward the list it was requested under. A single line in the ledger says an entry exists under another list, with no count |
| **Rule on the item (REQ SC-01)** | The rule pane edits the item and warns "also used in Competency log v1" on Apply. Standing is identical across lists. Evidence is shared across lists |
| **Evidence is shared, rules differ** | Ledger shows entries from all lists. Standing per list is derived from the same evidence by each list's rule. Tabs may then show different states for one piece of evidence |

Hard stops: one ledger per student x item survives in all three (`[REQ CM-07]` `[REQ AE-05]`); completed evaluations immutable `[REQ RV-03]`.

### 8.3 Student group vs cohort (OD new, validate with Yash `[F14]`)

| Answer | What the UI does |
|---|---|
| **Custom groups exist** (R4 default drawing) | Student groups tab as 4.7c. Group picker offers both types. Used by lists both |
| **Cohort only** | The Student groups tab hides custom; "group" becomes "cohort" in copy; Used by lists cohorts |
| **Groups only, cohort is a preset group** | One list of groups; cohort is a filter chip. Same screens |
| **Different criteria for a few students** (`[F14]`) | Attach a different list to a small custom group. If Aarti wants a per-student override, it is a new object and out of this file |

### 8.4 Starter discipline or accreditor lists (REQ SL-01 vs F10)

| Answer | What the UI does |
|---|---|
| **A: Prism ships no items** (REQ today) | First run is 4.4f seam A. Create list offers Empty, Import, items of another list |
| **B: optional starter list the school must adopt and can edit** | First run is 4.4f seam B. Create list gains a fourth radio. Adopt copies; no live link; items arrive unconfigured and cannot be mapped or submitted until configured; no default model; no endorsement language |
| **C: defaults pre-fill configuration too** | Not drawn. It would break `[REQ SC-02]` and `[REQ IM-09]`. Listed to show where B stops |

**Escalate to Sankalp, do not resolve.** It is a direct conflict with `[REQ SL-01]` and the hard stop "no shipped skills or taxonomy". Statements: "we can preload it with the accrediting body lists" (about 31 percent), "We can pre-populate it with the discipline list, but we have to make that list editable and manageable. By the school" (about 32 percent), "other than that, it's their document, their list" (about 34 percent), "we could load it up with the known competencies or skills or essentials for that discipline and then let them customize it" (about 50 percent) `[CALL 10-09 Aarti-followup F10]`. Also README fact 14 ("enabled by default means the module is on and the library is empty") sits between the two.

### 8.5 Enforcing evaluation model vs criteria (REQ SC-09, SC-18 vs F5)

| Answer | What the UI does |
|---|---|
| **Block (REQ default; R4 build default)** | Save is disabled when the criteria cannot be met by the model, with the reason `[REQ SC-18]`. The Set up panel offers no "Save with warning" |
| **Warn, do not block (the call)** | Save with warning is allowed (4.7b). The item shows "Items with a warning" in Where to go next, the row in Set up carries a "Warning" status, and the student side shows the item normally. The item is configured, so it can be asked for. It will not reach Achieved until fixed |
| **Warn and hold from students** | Same as warn, but the item stays out of the student selector until the admin accepts the warning. This is a middle path R4 offers because the plain warn path lets a student ask for review of an item that can never qualify |

What the call says and does not say `[F5]`: "in the beginning, I like to not put too many restrictions because then it is difficult to understand where we should set boundaries and what becomes a hurdle versus what becomes a good validation." It does not say the model choice is optional, and R4 still shows four unselected tiles with no default model `[REQ SC-02]`. The call also assumes "whatever question from that fast form you map to this kind of is in line with it", which hints that compatibility comes from the form mapping, not from a guard; that is weakly supported. The REQ's "core design principle" paragraph, read aloud on the call, says the capability "must enforce this independency", so this needs Sankalp.

### 8.6 Tree grouping depth (REQ SL-03 vs F9)

| Answer | What the UI does |
|---|---|
| **2 levels** | Tree shows two levels. Add branch is offered at the top only |
| **3 levels** | Default drawing (Procedures > Cardiovascular > IV insertion). Indentation of two steps |
| **4 levels** | Same component. Beyond four, ancestors collapse into a path in the row |
| **Flat category (REQ SL-03, category 0..1)** | The tree has one level. Branch rules still work, so group-level setup survives |
| **Depth set per school** | A depth setting on the list (2, 3, 4). Changing it only affects Add branch, never existing nodes |

Tags stay cross-cutting `[REQ SL-04]` `[F9]`: "Category was like grouping. And tagging is just saying these are all related to invasives." Nothing in the call asks for hierarchy depth beyond the grouping tree; OD-20 (hierarchical skills as sub-activities) is related and unresolved.

### 8.7 Deactivation, delete, new list, and history (SL-11, F17, F12)

| Answer | What the UI does |
|---|---|
| **R4 default**: deactivated hidden everywhere; data kept; delete only while no evidence; real change is a new list that replaces the old | 4.7a, 4.4e. No "withdrawn" line. Export excludes deactivated items by default |
| **Accreditation history needs deactivated items** (Romit's worry) | Export step 5 "Include deactivated items" (4.8) is on in the file header as "included". The Report still hides them |
| **A versioning feature is wanted** (if "versioned" meant a history, against "I don't want to create versions") | The Lists index adds a "Compare with previous" action and an edit log. Nothing else in the architecture moves. The cost is the engine (L) |
| **In-flight submission on a deactivated item** | Open (`OD-24`). Default: it continues to completion and the result is recorded under the item; the item stays hidden |

### 8.8 Student-typed evaluators (OD-05, ST-08, F15)

| Answer | What the UI does |
|---|---|
| **Name and email, free; role limited by setting** (R4 default) | 4.5 sheet |
| **Name and email, any role** | The role select shows all roles, with a note when the role does not usually sign this setting. Weakens `[REQ ST-08]`; needs Sankalp |
| **Roster only** (REQ today) | The typed section disappears. Chips remain from the roster. The Named-by-students adopt list becomes the only way in |
| **Merged with the Prism Preceptor entity** | The typed section searches the existing record by email first and offers "Is this J. Delgado?" `[CALL 09-25]` |

### 8.9 Aggregate criteria: average, minimum, maximum (F19)

| Answer | What the UI does |
|---|---|
| **Not in v1** (R4 default) | The rule pane shows a disabled row "Aggregate (average, minimum, maximum)" with "not available yet". Counts and levels remain |
| **Added as a criteria type** | The rule pane lets the admin choose "Average of results at least X", "No result below Y", "Highest result at least Z" over the repeated evaluations of one item. The row count line shows "7 results · average 3.2 · lowest 2" in the student panel. This only fits models that produce a number (Scored or Demonstration levels). No red |
| **Averages across items or students** | Not asked for, not drawn. If asked for, it is a new calculation and probably a competency-style score `[REQ §1.4]` |

Quote: "Have you done at least 3 of these, at least 5 of those? ... is the average high? If you did it 10 times, what's the minimum? What's the maximum? So there we don't know all of the permutation combination" `[F19]`. Tied to OD-31, OD-37, SC-09/SC-10.

### 8.10 Licensure exams as link-only lines (F21)

| Answer | What the UI does |
|---|---|
| **No (R4 default)** | No such item kind |
| **Link-only line** | Item kind "External requirement". Row shows name, link, no standing, no Ask for review. Report shows it in the tree with "Not tracked here". Export lists it with the link when the box is ticked |
| **Exam as evidence** | Out. "A standardized exam ... may not give you that" `[F21]`; OD-31 candidate is no in v1 |

### 8.11 Hierarchy and 140-item visual (F22)

| Answer | What the UI does |
|---|---|
| **Tree table with counts per node** (R4 default, ships with the tree) | At 140 items a collapsed tree of 3 branches reads as three numbers. No chart. This is the answer to "if you're going to have 140 skills, how are we going to envision it?" in the lowest-cost form |
| **A visual summary of the tree** | Reserved slot above the table, drawn as nothing. A candidate shape is a single-line treemap of branch counts, neutral tones, no red `[INFER]`. Not designed |
| **Student vs class comparison** (the spiderweb) | Not adopted. `[CALL 10-09 Aarti-followup F22]` is weak and about the competency spiderweb. Question escalated |

### 8.12 Carried from R1 to R3, compacted

| Seam | Question | UI under each answer |
|---|---|---|
| OD-29 who triggers | Student only, admin on behalf, from a placement, or removed | "Ask for review" on the student's row; admin panel shows it only if the admin may trigger; a placement deep-links to My checklist; removable without moving the page |
| OD-30 program requirement | A total or quotas exist | The student block adds "of 100 required"; a reserved slot on the list header; KeyMetrics adds one card. Hours stay out |
| OD-31 evidence sources | Student-submitted only or more | Section 5 table; Configure's first step gains "how evidence arrives" tiles with no default |
| OD-32 course pass | Soft only or may confer | The rule lives on the item, not on the mapping. Mapping stays expectation |
| OD-33 chains | One step or ordered with distinct signers | Chain drawn as text; the rule pane gains steps with role, count, distinct people |
| OD-34 standalone or integrated | Label, entitlement, embed | Entitlement full-page state; Report and My checklist components embeddable; the snippet in 4.9 |
| OD-36 forms | FAST forms reused or generated | Evaluator page uses an adapter; the form body is not designed here |
| OD-03 states | Merged or four | One display flag |
| OD-25 advisor read | Which fields | Role scope, off until answered |

---

## 9. Mobbin

No new Mobbin search was run for R4. R4 combines patterns already viewed in R1, R2 and R3 (Vanta controls and framework page, Deel compliance documents, Navattic visitors panel, Walmart registry checklist, Target checklist, Employment Hero lifecycle table, Airwallex and Workable approval step editors, Later link review, Docusign preview as signer) and in `design/mobbin-evidence.md` and the two `2026-10-09-mobbin-*` files. Those ratings, URLs and "does not transfer" notes are unchanged and not repeated here.

Where R4 is still without a reference:

1. **A list/tab model where one student appears in several independent reports with a shared evidence ledger.** Nothing found handles "one tab per log, never mixed".
2. **A tree-shaped requirement list with rules applied per branch.** Vanta's category rail and Codecademy's sets are flat.
3. **A guest sign-off page that is part of a sequenced chain with a student-typed signer.** Same gap as R1 section 9.
4. **A first run that offers an optional starter list the school must adopt and can fully edit.** Template galleries exist elsewhere in SaaS; none was viewed for this file, so I make no claim.
5. **Group definition for students as a custom rule or hand-pick.** Not searched.

Not verified: Mobbin shows single frames; no interaction or keyboard behaviour was seen.

---

## 10. Reuse versus rebuild, and DS shell questions

Basis: sizes are `[INFER]` estimates (S under 2 days, M 2 to 5, L over 5 for one developer) taken from R1 section 10, R2 section 10 and R3 section 10, which themselves read only file names, line counts and the nav file in `admin/`. I did not read `admin/` for this file.

| Area | Built today (per R1 to R3) | R4 change | Size |
|---|---|---|---|
| Engine, store, domain | Four states, ledger, rules, applyConfiguration, copyMappings, proposeImport | New objects: List (with `replaces`, version label, default flag), Node (tree, rule pane), StudentGroup, GroupListLink, list on each evidence row, standing per list. Chain steps (OD-33). Warn-versus-block flag. Aggregate criteria slot | **L** |
| Nav (`skills-nav.tsx`, `skills-routes.ts`) | Home, Skills, Courses, Attainment, Reviews | Two rows: Report, Set up. Redirects as in R1 | S |
| Home | Setup card, attention list | Becomes the "Where to go next" strip and empty states | S |
| Reporting | Overview with By student, By skill, By tag, three stacked dialogs | List tabs, group picker, tree rows, strip, panel host with the student view component. Export screen | M to L |
| Student record page | Not built (R2 was **L**) | New page, same component as the report panel and My checklist | **L** |
| Reviews | Card list | Lens "Waiting on me", compare and decide panel, list context | M |
| Configure | 3-step wizard dialog | Rule pane on a tree node, Set up panel on a row; warn path | M |
| Import | Input dialog and 647-line review | Reuse; landing target is the new list and its tree | S |
| Library | Skills, Taxon, Settings, Lab tabs | Reshape into Items, Lists, Student groups, Evaluators, Settings, Kits. Tree editor (drag, add branch) | M to L |
| Mapping | Offering list and skill panel | Becomes List detail > Course emphasis | S to M |
| Student | Course-first page, send dialog, history | One checklist component with list tabs; log sheet with typed evaluator; launch block | **L** |
| Evaluator | One page | List name, student-typed signer, outcome line | S |
| Shell | Utility bar, switchers | Unchanged | none |

Overall **L**: the engine change and the tree editor are the new cost; the student record page and student checklist are shared costs with R1 and R2. The cheapest wins remain the nav change and the strip.

Thin slice for the last-week-of-October target (a Sanket target relayed by Romit `[CALL 10-08 Romit]`; "at least some version"; whether that is a build or a design is unconfirmed `[strategy/07 C-18]`) `[INFER]`:

1. Nav to Report and Set up (S).
2. One list, one group type (cohort), no tabs: Report with By student expansion, the strip and the Not set up filter (M).
3. List as a single object with a rule pane on a tree of depth 2, "Used by" with Default (M).
4. My checklist as one list with the existing send dialog behind "Ask for review" (M).
5. Everything else as built.
6. Defer: custom groups, list tabs, new version dialog, warn mode, starter lists, aggregate criteria, export screen beyond the existing menu.

DS shell questions (all unverified against `localhost:4000`, `not run here`):

| Need | Question |
|---|---|
| A two-row admin rail and a rail-less student shell | Does `AppSidebar` degrade cleanly with two rows, and can the rail be hidden per persona? |
| List tabs and lens segments on one page | Two tab bars in a row (list tabs, then lens segments). Verify Tabs and ViewSegmentedControl together on a phone and at 1280 px |
| Tab label with a count | Tabs support badges? Use a neutral count in the label, not a red `BadgeCount` |
| Non-modal panel at about 40 percent | `FloatingSheetPanel` is non-modal; verify the table remains usable and keyboard return to the opening row |
| Tree rows inside `DataTable` | Does `DataTable` support nested rows with their own state column? If not, expand opens the panel and the tree lives in the panel; cost M |
| A drag-and-drop tree editor | DS has `DragHandleGrip` per the legacy list in CLAUDE.md; no tree editor was verified |
| KeyMetrics flat band, max four | Supported per R1/R3 |
| Embeddable pages | Pages must not assume the Prism shell (`components/app-shell-wiring.tsx` is app-level) |

---

## 11. Risks, what would make R4 fail, and the cheapest 5-user test

### 11.1 Risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| K1 | **Over-reading the call.** The call is a read-aloud of the REQ with reactions, with no screen shown, and its speakers are not labelled | R4 builds two new objects (lists, groups) on that basis | Section 0.1 weights each finding. Confirm list and group with Aarti and Yash before building anything past the thin slice |
| K2 | **Majority of the time there is one list** (Aarti, about 75 percent) | Tabs, Version columns and "Used by" would be mostly empty UI | Q2 hides tabs with one list. The lists index remains |
| K3 | **"Versioned" was the brief's word, not necessarily hers** (0.3) | A version dialog and `replaces` pointer may be unneeded machinery | Smallest form: a new list with a pointer. Build the dialog last |
| K4 | **"Items of another list" reads as clone** | She said "I don't want to do clone in here" | The start option copies items only; removable; rebuild-by-import is the fallback |
| K5 | **Warn-not-block lets a student ask for review on an item that cannot qualify** | Wasted evaluator time; a student sees "Evidence does not qualify" forever | The "warn and hold from students" variant. Default stays block |
| K6 | **Typed evaluators create duplicates and address typos** | Evidence goes to the wrong inbox; FERPA exposure | Confirm line after Send; Named-by-students adopt or merge; OD-05 merge story |
| K7 | **Starter lists break SL-01 by stealth** | A hard stop | Seam B rules 1 to 5 in 4.4f, and the escalation |
| K8 | **Tree depth makes the report unscannable at 150 students** | No Mobbin precedent at that scale | Counts per node first, items on expansion, virtualised rows, panel as fallback |
| K9 | **Two tab bars (list tabs, lens) read as one** | Navigation confusion | List tabs sit above the title block of the report; lens segments below the KeyMetrics; test with 5 users |
| K10 | **The decision-queue badge sums lists** | May read as mixing | It is a task count; labelled per list in the lens; removable |
| K11 | **A student with two lists sees two "overall" numbers** | Confusion about where they stand | Each tab's top block says its own list; no combined line |
| K12 | **Student group definition is invented here** | No source says how a custom group is defined | 4.7c is flagged made up; ask Yash |
| K13 | **Hard-stop pressure** from "it doesn't matter where they learn it", "students saying is enough", course pass | Several hard stops | Same handling as R1 K9 |
| K14 | **Staleness.** The implementation Excel and Ankit's examples were due by Wednesday and the next Aarti session | Real set-ups may favour automatic evidence or flat lists | Re-read section 8 when they land |

### 11.2 What would make R4 fail

1. Aarti or Yash say the unit is cohort and a list is just the program's one list. Then groups, tabs and Used by shrink to R1 plus a Default flag, which is a small simplification.
2. The Excel shows nearly all programs have one flat list with one rule pattern. Then the tree and branch rules are overkill; R3-lite does the job.
3. Sankalp rules that REQ 1.4 stands and lists are separate modules. The list tabs become a module scope control (8.1) and the tab model survives.
4. "Report is my launch page" meant only the student's page `[R1 K1]`. The admin side stays a Report with a strip anyway; the student half stands.
5. Aarti reads "Used by" with a Default flag as per-cohort setup. Then Default-for-new-groups is the only attach and the checklist is removed.

### 11.3 Cheapest 5-user test (half a day, no build)

Print frames 4.1, 4.4c, 4.5 and 4.8. Five coordinators or program directors across at least two disciplines (one with two logs if possible), plus Aarti on Thursday if free.

| Task | Pass if |
|---|---|
| "You open the product on Monday for BSN 2027. What do you do first?" (4.1) | 4 of 5 point at the strip or the table without hunting for a menu |
| "Your program has a second log of competencies. Show me where it lives." (4.1) | 4 of 5 point at the second tab and do not look for a combined view |
| "You have a new cohort starting. How does it get the same skills list?" (4.4c) | 4 of 5 say "tick the group" or "mark it default" without using the word clone |
| "A student asks whether they have met Foley catheter." (4.1) | 4 of 5 find the row and read the count and state without leaving the page |
| Student phone (4.5), 5 students: "What do you still need and how do you ask for it? You are working with a nurse who is not on the list." | 4 of 5 find Needs action, tick a row and use the typed name and email |
| "A visitor asks for proof of IV insertion for the cohort." (4.8) | 4 of 5 reach the export with one item chosen, and say it is not an accreditation form |

A failed first task kills the report-as-launch-page claim and sends the team back to R1 with the strip kept.

---

## 12. Not verified

Stated plainly:

- **Raw Granola was not re-fetched.** Everything about the Oct 9 call is from the raw-review file, which states it read the transcript in full (548 paragraphs). Quotes are carried as written there; their wording was not re-checked. Attribution is "Aarti, inferred" throughout. The only direct re-verification available to me is `2026-10-09-quote-reverification.md`, which covers the Oct 8 calls and the Vaibhav attributions, not the Oct 9 4 pm call.
- **The digest's own verdicts on R1 to R3 rest on partial reads** (R1 to line 573, R2 to 609, R3 to 615). I read all three files in full for this task.
- **`strategy/08`, `journeys/`, `ux/`** and the built `admin/` were not read. Reuse sizes are estimates.
- **DS exports and components** were not checked with `node tools/ds/source.mjs` or compared to `localhost:4000`. Names such as `FloatingSheetPanel`, `ViewSegmentedControl`, `KeyMetrics`, `StatusBadge`, `DataTable`, `DragHandleGrip` come from R1 to R3 and the legacy list in the CLAUDE.md. Nothing was rendered, axe-checked or user-tested.
- **Every ASCII frame is unvalidated.** All names, counts, emails and people are made up.
- **Click counts are my estimates**, not measurements.
- **The Mobbin section reuses earlier ratings**; no new search was run for R4.
- **Student group definition** (4.7c), **Used by** with overlap handling, the **decision-queue badge** summing lists, and the **warn and hold** variant are my inventions, not sourced.
- **The REQ ID validator** (`node .claude/hooks/check-req-ids.mjs`) is run after writing this file; its output is reported in the handoff message, not in this file.
- **Thresholds, reminders, sign-off ordering, evaluator link lifecycle** were not discussed on the Oct 9 call `[CALL 10-09 Aarti-followup section 5]`, so those parts of R4 are R1 unchanged.

---

## 13. Escalations and open questions

### 13.1 For Sankalp (requirements owner)

| # | Question | Touches | Blocks |
|---|---|---|---|
| 1 | **Starter lists vs "Prism ships no skills".** The Oct 9 call twice asks to preload discipline and accrediting-body lists that the school can edit. `[REQ SL-01]` and the hard stop say no shipped taxonomy. Is seam B (optional, adopted by the school, copied not linked) allowed? Who owns the content? | SL-01, SL-06 spirit, OD-38 | First-run screen |
| 2 | **Warn or block** for evaluation model vs criteria? The REQ core principle and `[REQ SC-09]` `[REQ SC-18]` say enforce; the call says not yet | SC-09, SC-18 | Configure |
| 3 | **Grouping depth and `[REQ SL-03]`.** Is category 0..1 still the rule, or is a tree of 2 to 4 levels allowed? | SL-03, OD-20 | Library, report |
| 4 | **Lists.** Is a school allowed several lists, each with its own workflow, forms and criteria? Does rule configuration stay on the item (`[REQ SC-01]`, C-6) or move to the list? | SC-01, CM-07, OD-28 | Rule pane, ledger |
| 5 | **One list vs two modules; REQ 1.4.** Direction, with Yash | OD-28, OD-02 | Nav word, `kind` |
| 6 | **Student-typed evaluator.** Role still constrained by setting? Does a typed person become a Prism-wide record? | ST-08, OD-05 | Log sheet |
| 7 | **May a student submit evidence for an item not on their list?** `[REQ CM-05]` allows unmapped; the Oct 9 call says students cannot add tracked items | CM-05, ST-02 | Student list |
| 8 | **Deactivation**: is "hidden everywhere, keep data, new list for real change" the semantics of `[REQ SL-11]`? In-flight submissions? | SL-11, OD-24 | Library |
| 9 | Aggregate criteria (average, minimum, maximum) and link-only licensure lines: in scope for v1? | OD-31, SC-09 | Rule pane |
| 10 | Is a "patient log" the section 14 feature? Does "some version by the last week of October" mean a design or a build? | section 14, C-18 | Scope |

### 13.2 For Aarti (the next Thursday session; lead with the acceptance test, not a trust question)

| # | Question |
|---|---|
| 1 | "When you said 'I don't want to create versions of that list' and also 'create a new list', which did you mean?" (the 0.3 ambiguity) |
| 2 | "Show me where your second log lives." (4.1 tab strip) "Does this look like one report, one tab, one thing?" |
| 3 | "A new cohort starts. How do they get the list?" (4.4c Used by and Default). "Is 'start a new version from the items of the old one' a clone?" (4.4d) |
| 4 | "Are the lists you have seen all flat, or do they have two, three or four levels?" and "Which discipline had the deepest tree?" (F9) |
| 5 | "Is the 'Waiting on me' queue allowed to show both lists, or must it be one list at a time?" |
| 6 | "When a student works with someone who is not on the list, may the role be anything? Who is that person afterwards?" (4.5) |
| 7 | "The snippet you described on other pages: is this card what you meant?" (4.9; the evidence is one phrase) |
| 8 | "On the competency spiderweb you showed your score and the class score. Is a class comparison wanted anywhere in Skills?" (F22; R4 keeps 'no class average' until she says) |
| 9 | "Does the accreditor ever need deactivated items in a file?" (Romit's concern) (4.8) |
| 10 | Ask for the 6 examples (Ankit, due Wednesday) and run section 6.1 on them. |

### 13.3 For Yash (competency / groups)

| # | Question |
|---|---|
| 1 | "Are we ready to apply competencies and skills to a group of students rather than a cohort?" (verbatim from `[F14]`) |
| 2 | How is a custom group defined today (rule, hand-pick), and can the placement group object be reused? |
| 3 | Does Prism already have the umbrella term for competency, EPA, skill and essential? (F3: "which that umbrella term we would need to come up with") |

### 13.4 For Romit

1. Does the Oct 9 request supersede `DEC-017` for IA and containers (section 1.4)?
2. Should the decision-queue badge sum lists (K10)?
3. Do R1 to R3 get corrections for the quote-reverification items in 0.2 (this task could not edit them)?

### 13.5 For Vaibhav (landing, DS shell)

1. Two-row admin rail and rail-less student shell acceptable?
2. Is a non-modal right panel at 40 percent a supported pattern, with a keyboard contract?
3. Which Prism landing card hosts the Report, and what does a program without the module see (OD-34)?
4. Hand-off: the Prism front end is Angular, so this build is a design and behaviour reference only (`strategy/07 G-21`).
