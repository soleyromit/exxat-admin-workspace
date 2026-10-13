# Redesign R2: student record first

Date: 2026-10-09 · Mode: `/design-variants` spec (ASCII and rationale, no TSX, nothing built, nothing published) · Scope: the OVERALL product architecture of Prism Skills Tracking, redrawn from the Oct 8 and 9 evidence
Status: **proposal for Romit.** Not a contract. Every `OD-*` stays OPEN and is built as its named seam. Hard stops stand.
Tags: `[REQ x]` requirement · `[OD-n]` open decision, never treated as decided · `[CALL 10-08 Aarti]` raw call, speaker "Aarti, inferred" (Granola has no diarization) · `[CALL 09-23]` raw Sankalp call, speaker unattributed · `[CALL 10-09]` `[CALL 10-05]` `[CALL 09-25]` `[CALL 09-30..10-02 leaders]` context calls · `[PROTO]` Sankalp's prototype · `[BUILD]` read in `admin/lib/skills-nav.tsx` and `admin/lib/skills-routes.ts` on 2026-10-09 (nothing else under `admin/` was re-read) · `[MOBBIN name]` a Mobbin screen whose image was viewed · `[INFER]` my inference, to validate.
Precedence for behaviour: REQ > CALL > PROTO > INFER. For visual layout inside the DS shell: PROTO, per Romit 2026-10-08 `[docs/README.md]`.
Illustrative numbers and names (counts, "Foley catheter insertion", "NURS 350") are placeholders written for this document. Prism ships no skills `[REQ SL-01]`.
This is variant **R2** of a set of redesigns. It is written to be read alone.

---

## 0. What I kept from the earlier work, what I dropped, and why

The variants A, B, C (`design/product-architecture-variant-*.md`) and the built hybrid IA (Home, Skills with tabs, Courses, Attainment, Reviews `[BUILD]`) were drawn before the Oct 8 and 9 calls `[docs/design/ARCHITECTURE-INPUTS-2026-10-09.md]`. I did not copy them. I reused only what the new evidence supports.

| Earlier element | Decision | Why (evidence) |
|---|---|---|
| Entity page for the student (variant B) | **Kept, promoted to the centre** | The inputs file calls it "the best match to constraint 1" `[ARCHITECTURE-INPUTS §3]`. Aarti: "I have to be able to do this at the student level." `[CALL 10-08 Aarti]` |
| Home as a setup journey, then a worklist (hybrid, variant A) | **Dropped** | "My report should be my launch page." `[CALL 10-08 Aarti]` The launch page is the report, not a journey or a worklist. Setup state becomes a derived banner on the launch page `[MOBBIN Pipedrive, Remote, from design/mobbin-evidence and research/meetings/2026-10-09-mobbin-home-setup-analogies]` |
| Attainment and Reviews as separate rail rows (hybrid) | **Merged for seeing and triggering; Sign-offs kept as a narrow third row for acting on submitted evidence** | "I don't want a separate place where they go to see the what I have met and run a report, and then a separate place where they have to go to trigger." `[CALL 10-08 Aarti]` Triggering a review lives on the record row. Approving or signing an item that already arrived is a different job `[INFER]`; flagged as a risk in section 11 |
| Courses as a full destination (hybrid, variant B) | **Dropped to a tab, then to an overlay** | "every course can only have a soft mapping." `[CALL 10-08 Aarti]` Course becomes a highlight on the one list, edited in one tab of Checklist |
| Kits (group configure), import, per-skill configure (variant A, hybrid Skills page) | **Kept** | 80 to 200 items by hand is the largest adoption obstacle `[REQ §3]` `[CALL 09-23]`. Nothing in the new calls challenges setup by import `[ARCHITECTURE-INPUTS §4]` |
| Cohort matrix as the home (variant C) | **Dropped** | No precedent at 150 x 100 `[docs/design/mobbin-evidence.md, gap row]`; Aarti centres the student, not a grid `[CALL 10-08 Aarti]`. The "By requirement" lens in this variant is a table of items, not a matrix |
| Log sheet with recent evaluators, no-shell evaluator page, side-panel drill-down | **Kept** | `[docs/design/brief-v2.md §3.2, 3.3]`; unchallenged by any call |
| Product switcher as the way in | **Not relied on** | Single module-based landing; switcher set aside on Aug 21 `[CALL 08-21, per research/meetings/2026-10-09-raw-review-context-meetings §7]`. The DS utility bar still carries it `[docs/build/ds-shell-anatomy.md]` |
| Four skill states, no scores by default, no red, no progress bars as primary viz | **Kept** | `[REQ AE-04]` `[docs/strategy/07 §D]` |

---

## 1. Thesis, the one question, and what in the new evidence it answers

**Thesis.** The product is a set of **student records**. Each student has exactly one record: the program's one list of skills, competencies, EPAs, procedures and essentials, shown against what the program requires of every student, with the evidence and sign-off chain behind each item and the action to request a review on the same row. Everything else is a view of those records. The program report is the same records side by side (a cohort table whose row opens the record). The student's home is their own record. An advisor reads the record. Courses only highlight rows of it. Setup exists to make the records exist.

**The one question this architecture optimises:**

> **"Where does this student stand against what every student must meet, and what is the next thing that moves it?"**

It does not optimise for "what is the state of my setup" (a journey) or "what is waiting on me" (a worklist) `[INFER]`. Those become a banner and a lens.

### 1.1 What in the new evidence it answers

| New evidence | Where R2 answers it | Tag |
|---|---|---|
| "Skills, competencies, EPS, everything becomes one list." | One list, items carry a program-typed `kind` label (free text, never shipped). Nav label is a copy token. Seam for OD-28 shown in section 8 | `[CALL 10-08 Aarti]` `[OD-28]` `[OD-02]` |
| "My report should be my launch page." | The admin's first screen is **Students**: the cohort of records. The student's first screen is **My record**. Both open on the report | `[CALL 10-08 Aarti]` `[OD-29]` |
| One place to see met and to trigger | Every record row carries "Request review" | `[CALL 10-08 Aarti]` `[OD-29]` |
| "5, 5, 5, 5, 5 of each. I've done 2 of these, 4 of these, 6 of these." | Every row states "n of N" in text, over-achievement allowed (7 of 5) | `[CALL 10-08 Aarti]` `[REQ AE-03]` |
| Soft course mapping only; bold, star or colour | A course lens chip adds a star and sorts highlighted rows first; nothing is hidden or blocked | `[CALL 10-08 Aarti]` `[REQ CM-05]` |
| Program requirements defined once; every student meets them | A reserved "Program requirements" tab and a standing slot on every record header | `[CALL 10-08 Aarti]` `[OD-30]` |
| All at student level; rotation FYI only | No rotation or setting column on the headline list; setting and location live in each evidence entry; per-setting needs appear only where a skill has them | `[CALL 10-08 Aarti]` `[REQ SC-11, SC-12]` |
| Evidence from self, faculty, faculty plus preceptor in sequence, grade, course pass, assessment, standalone form | One evidence chain per item with a source on every entry; only student-submitted is live | `[CALL 10-08 Aarti]` `[OD-31]` `[OD-33]` `[OD-37]` |
| Extend the existing competency mapping | Nullable competency link on the item; no competency scoring inherited | `[CALL 10-08 Aarti]` `[REQ §1.4]` `[OD-28]` |
| Standalone module that can also integrate | The record page is an embeddable component; entitlement flag per program | `[CALL 10-08 Vaibhav]` `[OD-34]` |
| Some version by the last week of October | R2's smallest cut is in section 10 (reuse), but the date is a target, not a commitment | `[CALL 10-08 Vaibhav]` |
| Accreditation has a separate owner | Only an export of record evidence; no accreditation UI | `[CALL 10-08 Vaibhav]` `[OD-35]` `[REQ §14]` |
| Advisors may read the student report | Advisor role sees Students and the record, read only, scoped. Scope is a seam | `[CALL 10-08 Aarti]` (a listener's question) `[OD-25]` |

### 1.2 Seven architecture rules

| # | Rule | Why | Tag |
|---|---|---|---|
| R1 | **One record per student, one row per item.** Never a second place that shows "what I have met". | One record per skill across courses | `[REQ CM-07, AE-05]` |
| R2 | **The cohort report is a table of records, not a different data set.** Counts in the table equal the counts on the record, and each count links to the rows behind it. | Every number is a door | `[REQ RP-05]` `[docs/ux/11 DP-10]` |
| R3 | **Trigger on the row.** "Request review" is on the record row for the student, and on the cohort row opens the same sheet. | One surface for seeing and triggering | `[CALL 10-08 Aarti]` `[OD-29]` |
| R4 | **Highlight, never gate.** Course emphasis changes sort and a star only. Unconfigured items never appear on a record. | Expectation, not eligibility; configuration gates | `[REQ CM-05, IM-09]` |
| R5 | **Counts and words, not bars.** State is a word plus "n of N". No percent ring, no progress bar as primary viz, no red. | Workspace rule; Aarti dislikes red in score viz | `[docs/ux/11 DP-9]` `[docs/strategy/07 §D 11]` |
| R6 | **Requirements are defined once and read, not copied.** A program requirement is one definition; the record header reads it. It is never stored per student. | "Program requirements is defined once and every student should meet those requirements." | `[CALL 10-08 Aarti]` `[OD-30]` |
| R7 | **The evidence ledger is the only truth; the standing is a view.** Completed evaluations are never edited. Automatic sources add entries, they never overwrite. | Immutability | `[REQ RV-03, AE-02]` |

---

## 2. Architecture map per role

DS shell for all signed-in surfaces: full-width utility bar, one flat list of rail rows per view, persona switching in the profile menu with a bar chip, scope switcher for school and program `[docs/build/ds-shell-anatomy.md §3, §4]`. Page chrome: serif page title, one-line description, one filled primary at the top right. Depth is counted as rail row (1) then tab or record page (2). Dialogs, sheets and side panels are not depth.

### 2.1 Administrator and coordinator

```
RAIL (expanded by default, 3 rows)            TYPE                     DEPTH   NOTES
 Students   <- the launch page                page, 2 tabs                1
   tab: Records                               DataTable of records        2    one row per student [REQ RP-02]
   tab: By requirement                        DataTable of items          2    one row per item, who has met it [REQ RP-03, RP-04]
   Student record  (/students/{id})           full page, not a dialog     2    breadcrumb: Students > {name}
     panel: Evidence chain                    FloatingSheetPanel          -    opens in place, keeps list [REQ RP-06]
     sheet: Request review                    Sheet                       -    one sheet for row and cohort entry
     action: Export record                    file download               -    [REQ RP-10]
 Checklist                                    page, 5 tabs                1
   tab: Items                                 DataTable                   2    library [REQ SL-10]
     dialog: Import                           dialog, then review         -    [REQ IM-01..IM-13]
     dialog: Add item                         dialog                      -    [REQ IM-12]
     dialog: Configure item                   wizard dialog               -    [REQ SC-01..SC-19]
   tab: Kits                                  list + apply dialog         2    group configure [REQ IM-14]
   tab: Program requirements                  form page section           2    reserved, empty by default [OD-30]
   tab: Course highlights                     two-pane editor             2    offering x item soft flag [REQ CM-01..CM-08]
   tab: Settings                              four lists                  2    categories, tags, clinical settings, lab instructors, evaluator roles
 Sign-offs (n)                                page, 2 tabs                1    shown only when some step is administrator or in-app faculty [REQ SC-15]
   tab: Waiting for me                        DataTable + detail panel    2    [REQ AR-01..AR-06]
   tab: Waiting on others                     DataTable, display only     2    awareness, no resend [OD-18] [REQ §14]
UTILITY BAR (not nav): Search and command menu (jump to a student or an item) · scope switcher · profile (Switch view, Appearance)
```

Exact labels: **Students**, **Records**, **By requirement**, **Checklist**, **Items**, **Kits**, **Program requirements**, **Course highlights**, **Settings**, **Sign-offs**, **Waiting for me**, **Waiting on others**. "Checklist" is a copy token, not a decision `[OD-28]` `[OD-34]`. The market also says "skills checkoff" `[CALL 09-30..10-02 leaders]`.

Rules for badges `[INFER]`: the Sign-offs badge counts only items the viewer can decide. "Waiting on others" is excluded. No badge on Students.

### 2.2 Advisor and faculty

```
RAIL (2 rows)
 Students        same page and record, scope = the viewer's advisees or cohorts, read only for advisors
 Sign-offs (n)   only for faculty who sign in-app; the preceptor-style link works too [REQ §7 intro]
(no Checklist row; item definitions are readable from the record row)
```
Advisor read scope is a seam, not a feature: who may read, which fields, FERPA `[OD-25]` `[docs/strategy/07 G-14]`. R2 builds the scoped read because the record is the product, but ships it off until Sankalp answers `[INFER]`.

### 2.3 Student

```
RAIL (1 row; no rail on a phone, a bottom action bar instead)
 My record       the launch page for the student
   chip:    Course  (All | NURS 350 ...)      soft highlight overlay, default All
   section: Needs your attention (returned, waiting)
   list:    the one checklist, grouped by category
   sheet:   Log evidence / Request review     the log sheet [docs/design/brief-v2.md §3.3]
   panel:   Item history                      the student's own evidence chain
```
Students with one app land in it, no landing page `[CALL 08-21]`. The page is built as an embeddable component for Student Success `[OD-34]`.

### 2.4 Evaluator, no login

```
/e/{token}   one page, no shell, no rail, no account                         [REQ EV-01]
   header: student, items, "You are step 2 of 2 in this sign-off, after Faculty"   [OD-33]
   one card per item: criteria as configured, answers only                        [REQ EV-03]
   footer: what happens next per item ("counts now" or "goes to administrator")   [REQ EV-07]
```
Faculty may open the same form inside Prism `[REQ §7 intro]`. The page never shows the student's standing `[OD-17]` `[docs/ux/11 AP-12]`.

### 2.5 Reviewer

The reviewer is the administrator acting in the approval role `[REQ §8]`. Entry is **Sign-offs > Waiting for me**, or the pending step inside the record's evidence panel. Both write the same decision.

### 2.6 Depth and count check

| Role | Rail rows | Deepest path | Max depth |
|---|---|---|---|
| Admin | 3 | Students > Student record | 2 |
| Advisor or faculty | 2 | Students > Student record | 2 |
| Student | 1 | My record (panels only) | 1 |
| Evaluator | 0 | one page | 0 |

---

## 3. Object model as the user sees it

The nouns, in the program's own words. The user never sees "evidence ledger" as a database; they see the **chain** on a row.

```
PROGRAM
 |
 |-- CHECKLIST  (the one list)                             [CALL 10-08 Aarti] [OD-28]
 |     |-- ITEM   name, description, kind label*, category (0..1), tags     [REQ SL-02..SL-04]
 |     |     |-- how it is met      model + criteria (counts, levels, setting minimums)   [REQ SC-02, SC-09..SC-12]
 |     |     |-- sign-off chain     ordered steps: self | faculty | preceptor | administrator | automatic**   [OD-33]
 |     |     |-- evidence source    student-submitted (live) | assessment | grade | course pass | form**   [OD-31]
 |     |     `-- competency link    nullable, no scoring inherited          [REQ §1.4] [OD-02]
 |     `-- * kind label is program-typed text ("Skill", "EPA", "Procedure"); Prism ships none [REQ SL-01]
 |
 |-- PROGRAM REQUIREMENTS  (defined once, read by every record)   total, category quotas, two thresholds**   [OD-30] [OD-27]
 |
 |-- COURSE HIGHLIGHT  (offering x item)   mandatory | non-mandatory, soft only   [REQ CM-03, CM-05, CM-06]
 |
 `-- STUDENT
       `-- RECORD  (exactly one)
             `-- ROW  one per active, configured item   [REQ CM-07, AE-05, IM-09]
                   |-- STANDING   4 states from AE-04 (display flag for OD-03)
                   |-- COUNT      "n of N" plus what is still needed
                   `-- EVIDENCE CHAIN   immutable entries, newest first
                         `-- ENTRY   when, source, setting+location (if any), signer steps and their state, outcome, comment
 ** = seam, nothing live in v1
```

How the three things relate, in plain words `[INFER]`:

| Relationship | Rule |
|---|---|
| Checklist -> Record | Activating and configuring an item creates a row on every enrolled student's record. Unconfigured items create none `[REQ IM-09]`. |
| Program requirements -> Record | The record header and the cohort columns read the program requirement. It is one definition. If it is empty the slot says so and the counts show no denominator beyond "items on the checklist". |
| Course highlight -> Record | Highlights are read when the course lens is on. They change order and add a star. They never remove a row or block a request `[REQ CM-05]`. |
| Evidence -> Standing | Standing is derived from entries by the item's current rule, so a rule change re-applies to evidence already held `[REQ AE-02]`. |
| Evidence entry -> Chain | A student-submitted entry carries a chain of steps. Step 2 does not start until step 1 completes. The entry counts only when the last step completes (or is held for administrator approval) `[REQ AE-01, AR-06]` `[OD-33]`. |

---

## 4. Key screens, full wireframes in the DS shell

Conventions: `[ ]` is a DS `Button` (outline unless marked FILLED), `( )` a chip or badge, `v` a select caret. One filled primary per surface. No icons on action buttons. State is always a word. Numbers are placeholders.

### 4.1 Admin launch screen: **Students** (the report is the launch page)

Route `{base}/students` `[INFER]`. Lands here after sign-in. Setup state is a derived banner, never a ticked step `[MOBBIN Pipedrive "setup complete" banner, research/meetings/2026-10-09-mobbin-home-setup-analogies row 2]`.

```
+- Utility bar -------------------------------------------------------------------------------------------+
| [Toggle] [Prism v] Students                         [Search Cmd+K] [Notifications] [Help] [Ask Leo] [Sample University / Nursing v] [AD v] |
+--------------+---------------------------------------------------------------------------------------------+
| Students  *  | Students                                                         [ Export ]                      |
| Checklist    | Every student's record against the checklist. Open a record to see evidence or request a    |
| Sign-offs 9  | review.                                                                                     |
|              |                                                                                             |
|              | +- Banner (derived, appears only when true) ----------------------------------------------+ |
|              | | 68 of 80 checklist items are not configured yet, so students cannot see them.             | |
|              | |                                                          [ Configure items ]  (outline)| |
|              | +-------------------------------------------------------------------------------------------+ |
|              | KPI (compact, text): Students in view 40 · Items on the checklist 12 · Waiting for sign-off 9 |
|              |                                                                                             |
|              | (Records) (By requirement)                                                                    |
|              | [Search students]  [Cohort: BSN 2027 x] [Group v] [Course highlight v] [State v]   Sort: Achieved, fewest |
|              |                                                                                             |
|              | Student        Cohort     Achieved  In progress  Does not qualify  No evidence  Waiting   Program   |
|              |                           (of 12)                                              for sign-off requirements |
|              | ----------------------------------------------------------------------------------------------- |
|              | Priya Tran     BSN 2027    3         2            1                6            2          Not set   |
|              | Milo Whitfield BSN 2027    5         4            0                3            0          Not set   |
|              | Noah Zeller    BSN 2027    9         1            0                2            1          Not set   |
|              | ... (40 rows, DataTable, row opens the record, row menu: Open record, Request review, Export record) |
|              | Footnote: Counts are items. "Not met" is shown as one column if the program turns on the merged |
|              | display (OD-03). Program requirements column is empty until they are set (OD-30).            |
+--------------+---------------------------------------------------------------------------------------------+
```

Behaviour:

| Element | Rule | Tag |
|---|---|---|
| Landing | Opens here for admin, coordinator, advisor, faculty. No Home. | `[CALL 10-08 Aarti]` `[CALL 09-30..10-02 leaders]` ("make it actionable") |
| Count cells | Each count is a link that opens the record filtered to that state. In the footer lens (By requirement) the same counts link to students. | `[REQ RP-05]` |
| "Waiting for sign-off" column | Items with a chain step that has not completed. This is an awareness count, the action is in the record or in Sign-offs. | `[INFER]` |
| Sort and filter | Sort by Achieved ascending shows who has met least. This is **not** "behind": no threshold is defined | `[OD-27]` `[CALL 09-23]` ("bottom 20%", mic unattributed) |
| Course highlight filter | Restricts the counts to items highlighted for that course: "how many things did they check off in this course". | `[CALL 10-08 Aarti]` |
| Program requirements column | "Not set" until OD-30 is answered. When set, shows "74 of 100" style text. Never red. Two thresholds, if confirmed, are two words ("Meets program", "Meets accreditor") not two colours. | `[OD-30]` `[CALL 10-05]` `[docs/strategy/07 C-19]` |
| Request review (row menu) | Opens the Request review sheet scoped to that student, with their unmet items pre-ticked. Who may trigger on a student's behalf is open. | `[OD-29]` |
| Setup banner | Count is derived from library data and returns after a re-import. It has no dismiss. | `[REQ IM-10, IM-11]` `[MOBBIN Hootsuite, Fabric: counter-examples with dismiss]` |
| Empty program | Before any item exists the table is replaced by one sentence and one filled primary: "Import your checklist". | `[INFER]` |
| No bar chart, no heat map | Per R5. | `[REQ §14 / docs/strategy/07 §D 12]` |

Lens **By requirement** (same page, second tab): one row per item.

```
| (Records) (By requirement)                                                                         |
| [Search items] [Category v] [Tag v] [Kind v] [Course highlight v]                                  |
| Item                         Kind        Achieved   In progress   Does not qualify   No evidence   |
| Foley catheter insertion     Skill        31 of 40      6             1                 2          |
| IV insertion                 Skill        35 of 40      4             0                 1          |
| Wound care                   Procedure    10 of 40     12             8                10          |
| Tag figures overlap because an item may carry several tags.                          [REQ RP-04]   |
```
This is the "where is the cohort lagging per item" question `[CALL 09-23]` (mic unattributed). A count opens the list of students for that item. It is a table of items, not a student by item grid.

### 4.2 Drill-down: the **student record** page

Route `{base}/students/{studentId}`. A full page, not a dialog stack `[docs/design/brief-v2.md §2 principle 4]`. This is the centre of R2.

```
+- Utility bar ... ---------------------------------------------------------------------------------------+
+--------------+---------------------------------------------------------------------------------------------+
| Students  *  | Students > Priya Tran                                                                        |
| Checklist    | Priya Tran                         BSN 2027 · Group A         [ Request review ] (FILLED)  [ Export record ] |
| Sign-offs 9  | Items achieved 3 of 12 · In progress 2 · Does not qualify 1 · No evidence 6 · Waiting for sign-off 2 |
|              | Program requirements: not set. [Set program requirements] (link, admin only)                |
|              |                                                                                             |
|              | Course highlight: (All) (NURS 350 *) (NURS 360)        [x] Highlighted first                  |
|              | Show: (Needs attention 9) (All 12) (Achieved 3)       [Search items]    Source: (All v)        |
|              |                                                                                             |
|              | v Clinical procedures                                              3 of 5 items achieved       |
|              | +--------------------------------------------------------------------------------------------+ |
|              | | [ ] * IV insertion        Procedure   In progress      3 of 5 demonstrations     [Request review]| |
|              | |       Needs 2 more · 1 independent                                                          | |
|              | |       Sign-off: Faculty done, Preceptor waiting (K. Larsen, since 10-05)         [Evidence >]| |
|              | | [ ] * Wound care          Procedure   Does not qualify 4 of 4 demonstrations    [Request review]| |
|              | |       Needs 1 in Emergency (you have 0 of 1) · Lab evidence does not count toward clinical  | |
|              | | [ ]   Foley catheter      Skill       Achieved         5 of 3 qualifying                      | |
|              | |       Counted from: student request, Faculty then Preceptor                       [Evidence >]| |
|              | | [ ]   Tracheostomy care   Procedure   No evidence yet  0 of 3                    [Request review]| |
|              | +--------------------------------------------------------------------------------------------+ |
|              | > Assessment and communication                                      1 of 4 items achieved   |
|              | > Professional behaviours (EPA)                                     0 of 3 items achieved   |
|              | * = highlighted for NURS 350. Every item can be requested, highlighted or not.   [REQ CM-05] |
|              |                                                                                             |
|              | 2 selected                                                  [ Clear ]   [ Request review ] (sticky) |
+--------------+---------------------------------------------------------------------------------------------+
```

Row anatomy (the heart of the design) `[INFER]` with sources:

| Part | Content | Source |
|---|---|---|
| Checkbox | Multi-select for batch request | `[REQ ST-04]` |
| Star | Highlighted for the chosen course; blank when the course lens is All | `[CALL 10-08 Aarti]` ("bold ... a star ... a different color") |
| Name and kind | Item name; program-typed kind chip ("Procedure") | `[OD-28]` |
| Standing word | Achieved, In progress, Does not qualify, No evidence yet (or "Not met" when merged) | `[REQ AE-04]` `[OD-03]` |
| Count | "n of N" with unit; "5 of 3" allowed | `[CALL 10-08 Aarti]` `[REQ AE-03]` |
| Needs line | Only what is still missing: per-level, per-setting. Shown only if there is something missing | `[REQ SH-03, SH-05, SC-11, SC-12]` `[docs/strategy/07 DEFECT-07]` |
| Chain line | The sign-off chain in order with each step's state and who it waits on | `[OD-33]` `[REQ SH-02]` |
| Source line | "Counted from: student request" now; "course grade", "assessment" later | `[OD-31]` |
| Request review | Row action, text only | `[OD-29]` |
| Evidence > | Opens the evidence chain panel without leaving the page | `[REQ RP-06]` |

Evidence chain panel (opens beside the list, non-modal `FloatingSheetPanel`):

```
+- IV insertion · Priya Tran ------------------------------------------------------------- [x] -+
| Procedure · Clinical procedures · highlighted for NURS 350                                      |
| In progress · 3 of 5 demonstrations · Independent 1 of 3 · With assistance 1 of 1               |
| Rule: every completed demonstration counts. Needs 5, at least 3 independent.                     |
|                                                                                                |
| Chain for this item:  1 Self-evaluation -> 2 Faculty -> 3 Preceptor            (item setting)   |
| ------------------------------------------------------------------------------------------------|
| Entry 4 · requested 10-02 · Clinical · Outpatient · Harbor Family Practice                       |
|   Step 1  Self-evaluation   Priya        done 10-02   Independent                               |
|   Step 2  Faculty           J. Delgado   done 10-03   Independent                               |
|   Step 3  Preceptor         K. Larsen    waiting since 10-05            (link sent, no login)    |
|   Does not count yet. [View form]                                          [REQ AE-01, SH-02]    |
| Entry 3 · 09-21 · Lab · Simulation suite                                                         |
|   Step 1  Faculty           S. Nakamura  done 09-21   With assistance                             |
|   Counted. Lab evidence does not count toward clinical settings.                  [REQ SC-12]    |
| Entry 2 · 09-02 · counted from: course grade (example of a later source)           [OD-31] seam   |
| Entry 1 · 08-14 · Clinical · Inpatient · counted                                                  |
|                                                                [ Request review ]   [ Export ]  |
+------------------------------------------------------------------------------------------------+
```

Notes: entries are immutable; a returned step shows the reason `[REQ RV-02, RV-03]`. The panel states the setting and location because "rotation is FYI" applies to the headline list, not to the ledger `[CALL 10-08 Aarti]` `[REQ RP-07]`. "Request review" in the panel starts a further attempt or a correction as the REQ separates them `[REQ RV-01, RV-03]`.

### 4.3 Student home: **My record** (phone first)

Same component as 4.2, student scope. Mobile `[INFER]`; the persona works from a phone between tasks `[docs/ux/01 P-S]`.

```
Phone                                            Desktop adds a right column: this-course summary
+----------------------------------+
| My record                        |
| 3 of 12 items achieved           |
| Program requirements: not set    |
| Course: (All) (NURS 350 *)       |
+----------------------------------+
| Needs your attention (2)         |
| IV insertion · Returned          |
|   Reason: completion date missing|
|   [ Revise and resend ]          |
| Foley · Waiting for K. Larsen    |
|   since 10-05, Preceptor, step 2 |
+----------------------------------+
| Clinical procedures    3 of 5    |
| * IV insertion                   |
|   In progress · 3 of 5           |
|   Needs 2 more, 1 independent    |
|   [ Request review ]             |
| * Wound care                     |
|   Does not qualify · 4 of 4      |
|   Needs 1 in Emergency           |
|   [ Request review ]             |
|   Foley catheter                 |
|   Achieved · 5 of 3              |
| Assessment and communication  >  |
+----------------------------------+
| 2 selected    [ Request review ] |  sticky above safe area, FILLED
+----------------------------------+
```

| Rule | Tag |
|---|---|
| The home is the whole checklist at student level. The course chip only highlights. "they should be able to, um, do any, any of it." | `[CALL 10-08 Aarti]` `[REQ ST-02]` |
| Two standings side by side: this course and overall. The program requirement feeds "overall where do they stand" when it exists. | `[CALL 10-08 Aarti]` ("this course ... overall where do they stand") `[OD-30]` |
| The Request review sheet is the log sheet: setting inferred from placement, evaluator role constrained, recent evaluators as chips, self-evaluation inside before send. A placement may also host the trigger, but the result lands here. | `[docs/design/brief-v2.md §3.3]` `[REQ ST-06, ST-08, ST-11]` `[CALL 10-08 Aarti]` |
| A returned or did-not-count row states the failed rule and the next step. | `[REQ SH-03]` |
| Students never see other students or a class average. | `[docs/journeys/02 closing note]` `[INFER]` |
| Items credited by an automatic source show "Counted from: ..." and no Request review, because the student did nothing. | `[OD-31]` `[docs/journeys/02 new evidence]` |
| Drafts: save and return is allowed by seam. | `[OD-14]` |

### 4.4 Evaluator mobile view (no login)

```
+- Prism -----------------------+     Single column, no rail, no account.
| Sign off 2 items              |     Large targets, at least 44px.
| Priya Tran · NURS 350         |
| You are K. Larsen, Preceptor  |
| Step 3 of 3. Faculty and the  |     <- the sequence is shown so the signer knows nobody is skipped [OD-33]
| student have already answered.|
| ----------------------------- |
| 1  IV insertion               |
|    Supplied by the student    |
|    Date 10-02 · Unit 4B       |
|    Outcome per demonstration  |
|    [Observed]                 |
|    [With assistance]          |
|    [Independent]              |
|    Comment *  [ ____________ ]|
|    After you submit: counts   |
|    now.                       |
| 2  Foley catheter             |
|    Q1 Prepared correctly?     |
|    [ Yes ]  [ No ]           |
|    After you submit: goes to  |
|    the administrator.         |
| ----------------------------- |
| 1 of 2 answered               |
| [ Submit evaluation ] FILLED  |
+-------------------------------+
After submit: "Recorded. IV insertion counts now. Foley is waiting for administrator approval."
No student standing is shown.                                                [REQ EV-01..EV-07] [OD-17]
```
The only new element against `docs/ux/07 S-16` is the "Step n of m" line, which exists because chains are real `[CALL 10-08 Aarti]` ("a faculty One signs off, then Faculty 2 also has to sign"). A step the signer cannot yet act on shows "Waiting for step 2" with no form `[OD-33]`. Link lifecycle, expiry and resend stay open `[OD-18]`.

### 4.5 Setup path for 80 skills

The path exists to make records exist. It is a path of tabs inside **Checklist**, with no gating `[REQ SC-01, IM-09]`, and the launch page shows the derived count.

Step A. Import, then review. Reused as built `[docs/ux/07 S-08]`. Items arrive unconfigured.

Step B. **Checklist > Items** in the setup state:

```
| Checklist                                               [ Import ]  [ Add item ] (outline)   |
| (Items 80) (Kits 3) (Program requirements) (Course highlights) (Settings)                    |
| 80 items · 12 configured · 68 need configuration     [Show items that need configuration]    |
| [Search] [Category v] [Kind v] [Status: Needs configuration x]                                |
| [ ] Item                      Kind       Category           Status                           |
| [x] Foley catheter insertion  Skill      Clinical proc.     Needs configuration              |
| [x] IV insertion              Skill      Clinical proc.     Needs configuration              |
| [ ] Hand hygiene              Essential  Professional       Needs configuration              |
| 24 selected                         [ Configure selected together ] (FILLED)  [ Clear ]       |
```

Step C. Group configure (Kits). The admin chooses the model explicitly for the group, never a default `[REQ SC-02]`. Apply shows a summary, the target list, and "Keep each item's own value" as the default for anything already set `[MOBBIN Jira Bulk Operation, Pipedrive bulk edit, from research/meetings/2026-10-09-mobbin-kits-bulk-configure-analogies]`.

```
| Configure 24 items together                                                       [x] |
| Evaluation model   ( ) Overall outcome  ( ) Questions  ( ) Scored  ( ) Demonstration level |
|                    (none selected: choose one to continue)                           |
| Levels (ordered)   1 Observed · 2 With assistance · 3 Independent                    |
| Sign-off chain     Step 1 [Faculty v]  Step 2 [Preceptor v]   [Add step]  Signers: 1 each |
|                    (chain of length one is a single sign-off)                        |
| Needs              5 demonstrations · at least 3 independent                         |
| Student supplies   Date* · Unit* · Notes                                              |
| Preview            [Student view] [Evaluator view]                                    |
| Impact: 24 items become usable. 0 held evidence changes.                              |
|                                              [ Cancel ]   [ Apply to 24 items ] FILLED |
```

Step D. **Checklist > Program requirements** (reserved, may stay empty):

```
| Program requirements                                                                    |
| Defined once. Every student record reads these. Hours are not tracked here.             |
| Not set.                                           [ Define a requirement ]             |
| (When set) Total items 100 · Category quotas · Program threshold · Accreditor threshold |
```
Hours are out `[CALL 10-08 Aarti]` ("we are not going to do hours in here") `[REQ §14]`.

Step E. **Checklist > Course highlights**: pick an offering, tick items or a whole category, mark mandatory or non-mandatory. Newly highlighted items default to non-mandatory, never silent mandatory `[INFER]` (the prototype defaulted to Mandatory `[PROTO]` `[docs/ux/11 DEC-022]`; flag below).

Nothing in steps A to E is a gate. The first record exists the moment one item is configured and active `[REQ SL-11, SC-02]`.

---

## 5. How each source of evidence appears

All five shapes sit in the same chain on the same row. Only the first is live in v1 `[REQ ST, EV, RV]` `[OD-31]`. The others are named seams so the ledger needs no redesign.

| Source `[CALL 10-08 Aarti]` | Record row | Evidence panel entry | Request review? | Hard stop to hold |
|---|---|---|---|---|
| **Self** (self-evaluation before an evaluator, or self-attestation alone) | Chain line starts "Self-evaluation". If it is the only step: "Self-attested" | One step, signer is the student | Yes, student completes it | Self-attestation alone is a selectable model, never a default, never hidden `[REQ SC-02]` `[OD-37]` `[OD-09]` |
| **Faculty** | "Faculty done" or "waiting for J. Delgado" | One step, in Prism or by link | Yes | Role validity by setting `[REQ ST-08, SC-16]` |
| **Faculty plus preceptor, in sequence** (or faculty 1 then faculty 2, or N distinct preceptors) | One chain line: each step, who, state, since when | Steps in order with owner and status, like a lifecycle table `[MOBBIN Employment Hero reference check lifecycle]` | Yes, and step 2 link is issued after step 1 | Preceptor has no login, per-signer link `[REQ EV-01]` `[OD-33]` |
| **Grade, course pass, assessment question, whole assessment score** (automatic) | "Counted from: course grade" or "assessment, minimum score" | Entry with source and date; the original is kept if a grade later changes | No (nothing to request) | Course pass is evidence, not a gate; no auto-grant on unconfigured items `[REQ CM-05, IM-09]` `[OD-32]` `[docs/strategy/07 C-12]` |
| **Standalone form** (existing FAST form or a configured form) | "Form response" with a link | Entry linking the form response, student original kept | Depends on form entry point | Original response is immutable `[REQ RV-03]` `[OD-36]` `[CALL 09-25]` |

Rules common to all `[INFER]`:

1. Every entry has `sourceType`. The row shows it only when it is not "student request", so the v1 screen is not noisier.
2. A source filter ("Source: All v") on the record lets an advisor ask "what is faculty-signed versus self-attested". The filter is hidden until a second source exists, which is the 15Five self, manager, peer filter idea without scores `[MOBBIN 15Five Competency results]`.
3. Counts by role in the activity ("I observed 10, I assisted in 2, and I performed 5") are per-level counts on a demonstration item, which `[REQ SC-10]` already covers. Distinct-signer counts ("3 signatures from 3 preceptors") are a chain with `count = 3, distinctPeople = true` `[OD-33]`.
4. A patient log is not designed. It is flagged as possibly the section 14 feature `[CALL 10-08 Aarti]` `[docs/strategy/07 C-10]`.

---

## 6. Three journeys with click counts

Counts are `[INFER]` estimates from the wireframes, counting every click or key press that changes state, excluding typing and scrolling. They are for comparison with `docs/design/friction-baseline.md` and `brief-v2` (about 180 for Direction A setup), not measurements.

### 6.1 First hour: set up 80 items (admin)

Assumes 80 items, 4 natural groups, 10 exceptions, 6 course offerings.

| Step | Path | Clicks |
|---|---|---|
| Open import, choose file or paste | Checklist > Items > Import > file | 3 |
| Review proposal (accept all, fix 4 names by editing inline) | edit 4, Confirm | 6 |
| Land on 80 unconfigured items; filter "needs configuration" | Show items that need configuration | 1 |
| Group configure x4: select group (category filter plus select all 2), choose model 1, set rule about 4, chain 2, Apply 2 | 4 x 11 | 44 |
| 10 exceptions: open item, change one field, save | 10 x 4 | 40 |
| Course highlights: 6 offerings x (open 1, tick category 1, set level 1, save 1) | 6 x 4 | 24 |
| Program requirements (optional) | tab, define, save | 4 |
| Check the result: Students page shows records | 1 | 1 |
| **Total** | | **about 123** |

Against about 180 for A and about 2,000 today `[docs/design/friction-baseline.md via brief-v2 §1.2]`. The saving over A comes from soft highlights replacing a mapping step and from no go-live gate. A skipped highlight step costs nothing `[REQ CM-05]`.

### 6.2 Weekly: who has met least, and a sign-off

Case 1, one student who needs a review (admin or advisor).

| Step | Path | Clicks |
|---|---|---|
| Land on Students (already there after sign-in) | 0 | 0 |
| Sort Achieved ascending | header | 1 |
| Open the first record | row | 1 |
| Filter "Needs attention" is default | 0 | 0 |
| Tick two unmet items, Request review | tick 2, button 1 | 3 |
| In the sheet confirm derived setting, role, person | 2 | 2 |
| **Total** | | **7** |

Case 2, administrator sign-offs for 16 waiting, 12 agreeing.

| Step | Path | Clicks |
|---|---|---|
| Sign-offs > Waiting for me | 1 | 1 |
| Select all agreeing | 1 | 1 |
| Approve selected | 1 | 1 |
| Open each differing item and decide: 4 x 3 | 12 | 12 |
| **Total** | | **15** |

Or, from a record, approve the single pending step in the evidence panel: open record 1, Evidence 1, Approve 1 = 3 `[REQ AR-01..AR-05]`. Case 3, student: open the app (My record), tick one item, Request review, confirm = 3 to 4 `[INFER]`.

### 6.3 Accreditation evidence pull

Out of scope as an output `[REQ §14]` `[OD-35]`; this is the evidence-pull a program can do today so the separate owner can consume it `[CALL 10-08 Vaibhav]`.

| Task | Path | Clicks |
|---|---|---|
| One item across the cohort, aggregate | Students > cohort filter 2 > By requirement 1 > Export 1 | 4 |
| Same, with row-per-evaluation detail | + Export evidence detail 1 | 5 |
| One student's full record | Students > row 1 > Export record 1 | 2 |
| Show the evaluation behind one number | By requirement > count 1 > student 1 > Evidence 1 > View form 1 | 4 |

The export format is open `[OD-10]` `[REQ RP-10, RP-11]`. Filters are written into the file header `[REQ RP-10]`.

---

## 7. Requirement coverage

Every REQ area, where it lives in R2, and anything R2 weakens. Status: **Native** = fits the structure with no change, **Moved** = lives somewhere different from the built hybrid, **Seam** = reserved, nothing live.

| Area | IDs | Where in R2 | Status | Note |
|---|---|---|---|---|
| SL library | SL-01..SL-11 | Checklist > Items, Settings | Moved | Library is called Checklist; deactivation withdraws from records and reporting `[REQ SL-11]` |
| IM import | IM-01..IM-15 | Checklist > Items > Import; Kits for IM-14; banner for IM-10 | Native | Manual path must work with AI off `[CALL 10-02]` `[docs/strategy/07 G-20]` |
| SC configure | SC-01..SC-19 | Configure dialog, Kits | Native | SC-15 admin approval becomes one step in the chain `[OD-33]` |
| CM mapping | CM-01..CM-08 | Checklist > Course highlights; course lens on record | **Moved and softened** | CM-05 is the design rule. CM-08 carry-forward stays open `[OD-01]`; copy from last term is explicit |
| ST student submission | ST-01..ST-14 | My record, Request review sheet | Moved | ST-01 "what the course expects" is the course chip; ST-02 is the default list |
| EV evaluator | EV-01..EV-08 | `/e/{token}` | Native | Adds "Step n of m" `[OD-33]` |
| AR review | AR-01..AR-06 | Sign-offs; pending step in the evidence panel | Moved | Two entry points, one decision |
| RV revision | RV-01..RV-06 | Evidence panel: revise or further attempt | Native | |
| SH history | SH-01..SH-07 | Student evidence panel; chain line; needs line | Native | SH-06 cross-course is the default view, not a toggle |
| RP reporting | RP-01..RP-11 | Students (Records, By requirement), record, Export | **Moved** | RP-02 is Records, RP-03 and RP-04 are By requirement, RP-05 and RP-06 are record and panel |
| AE engine | AE-01..AE-08 | Behind every standing word | Native | OD-03 flag drives column set |
| OD | OD-01..OD-13 | See section 8 for the ones that change the UI | Seams | |

**Homeless or awkward items** (said plainly):

| Item | Problem | Where it goes `[INFER]` |
|---|---|---|
| Clinical settings, lab instructors, categories, tags | Supporting lists with no student-level meaning | Checklist > Settings tab |
| Evaluator roster merge story | A person may be faculty and preceptor; students add preceptors; admins merge | Settings > Evaluator roles and people, with a merge action. Prism-wide or Skills-only is open `[OD-05]` `[CALL 09-25]` |
| "Waiting on evaluators" awareness | Neither a record nor a decision | Sign-offs > Waiting on others, and the chain line on each row |
| Program requirements | No home in the REQ | Reserved tab, `[OD-30]` |
| Advisor and student-success consumption | REQ silent | Scoped read of the same page `[OD-25]` |
| Entitlement ("Skills not enabled for this program") | REQ silent | A page state with a no-data example and no school data `[CALL 09-30..10-02 leaders]` `[OD-34]` |
| Learning contract, remediation, reminders, hours, accreditation form, patient log | Out of scope | Not designed `[REQ §14]` `[OD-23]` `[OD-35]` |
| Evaluator-consistency and heat maps | Deferred on the call | Not designed `[CALL 09-23]` `[docs/strategy/07 §D 12]` |
| Configuration lineage and form preview (SC-17, SC-19) | They belong to the item, not the student | Kept inside the Configure dialog |
| Import traceability per batch (IM-11) | A batch filter | Items tab filter "Import" |
| Per-offering mandatory counts (CM-04) | Needs an offering context | Course highlights pane header |

**What R2 weakens** `[INFER]`: (1) CM-04 and CM-02 volume tooling becomes less prominent because mapping is softer. (2) Setup is no longer a guided journey, so a first-time admin leans on empty states and the banner. (3) A single admin pass over many students for one item (OD-19 batch grid) is not offered; the By requirement lens answers "who" but not "sign many at once". (4) Evaluator-level approvals are split between the record and a queue.

---

## 8. Seams: what the UI does under each answer

All three required seams first, then the others that change the shape of the page.

### 8.1 OD-28 and OD-02: one list, or skills separate from competencies `[OD-28]` `[OD-02]`

| | If the answer is **one list** | If the answer is **two modules with a link** |
|---|---|---|
| Checklist nav row | Label stays a token; Items tab lists every kind | Row lists items of kind "skill" only; a second row, **Competencies**, appears and reads the existing competency mapping |
| Kind chip | Free-text filter ("Skill", "EPA"); kind is just a facet | Kind is fixed per module; the chip is hidden |
| Record row | Competencies and skills sit in one list under their categories | Competency link shows as a small "Supports: Competency X" line; no competency score is shown `[REQ §1.4]` |
| Record header | One "items achieved" count | Two counts, one per module |
| Evidence and chain | Same | Same |
| What does not change | Rows, chain, request button, cohort table | Rows, chain, request button, cohort table |

Today's choice: model `kind` as a label and `competencyId` as nullable. Build no competency scoring. Do not rename nav beyond the token `[docs/strategy/08 §1]`. This contradicts `[REQ §1.4]` only if scoring is inherited; the seam inherits none. **Needs Sankalp with Yash and Aarti.** Aarti herself says "we will have to get alignment" `[CALL 10-08 Aarti]`.

### 8.2 OD-31, OD-32, OD-37: evidence-source set `[OD-31]`

| | If **student-submitted only** (v1, REQ) | If **automatic sources are in** (grade, course pass, assessment, form) | If **self-attestation alone** is a model |
|---|---|---|---|
| Record row | No source line | "Counted from: ..." line; no Request review on credited items | Chain shows one step, "Self-attested"; Request review is a single confirm |
| Evidence panel | Entries with steps | Entries with a source and a date; an entry for an automatic credit has no steps | One-step entries |
| Item configuration | Model and chain only | Adds a "Where evidence comes from" section; an auto rule is stored **on the item**, never on the mapping `[OD-32]` | Self-attestation is one of the selectable models and never preselected `[REQ SC-02]` |
| Cohort and By requirement | Unchanged | Source facet appears | Source facet appears |
| Guard | | No auto-grant on unconfigured items `[REQ IM-09]`; a grade that changes later adds a new entry, the original is kept `[REQ RV-03]` | Never default; counts of universities using it are unknown `[CALL 10-09]` |

### 8.3 Hard versus soft course mapping `[CM-05]` `[OD-32]`

Aarti and the REQ agree that mapping is soft. The tension is Aarti's separate statement "If you pass the course, you pass this competency." `[CALL 10-08 Aarti]` That is evidence, not mapping `[docs/strategy/07 C-12]`.

| | If mapping stays **soft** (REQ, Aarti) | If a course pass may **confer** an item |
|---|---|---|
| Course highlights tab | As drawn: mandatory or non-mandatory | Unchanged. The mapping does nothing new |
| Item configuration | No course field | A course-pass rule on the item names the offering and the minimum result, stored on the item `[OD-32]` |
| Record row | Star only | Star plus "Counted from: course pass" |
| Student | Can request any item | Can still request any item; a course-pass credit never blocks a request `[REQ CM-05]` |
| If the answer were **hard (eligibility)** | Not allowed: it contradicts `[REQ CM-05]` and Aarti's own "do any, any of it". R2 does not build it. Flag for Sankalp if anyone asks. | |

### 8.4 Other seams that change the shape of this variant

| OD | Seam in R2 | Under each answer |
|---|---|---|
| **OD-29** trigger | "Request review" on the row, the sheet, and the cohort row menu | Remove an entry point or add one without moving the page. Who may trigger for a student is open |
| **OD-30, OD-27** program requirements, "behind" | Header slot and cohort column, default "Not set" | Filled slot with a count; "behind" may become a filter chip. No red; two thresholds as two words `[docs/strategy/07 C-19]` |
| **OD-33** chains | Chain line and panel render a list of steps `{role, count, distinctPeople}` | A single approval is a chain of length one `[REQ SC-15]` |
| **OD-34** module relationship | Entitlement flag, label token, embeddable record | Move the host or relabel without redoing content |
| **OD-25** advisor scope | Role scope on Students and record | Turn the advisor read on or off; FERPA fields |
| **OD-36** forms | Evaluator surface rendered from `EvaluationConfig` with an adapter point | FAST form adapter swaps the renderer `[CALL 10-09]` `[CALL 09-23]` |
| **OD-03** states | One display flag | Four columns or one "Not met" column; record row word set |
| **OD-01** carry-forward | Explicit "copy highlights from last term" | Automatic carry-forward later, no page change |
| **OD-14** drafts | Draft row in "Needs your attention" | Absent unless accepted |
| **OD-18** link lifecycle | "Waiting" shows since when | Resend and expiry controls appear in the panel |
| **OD-22** rotation-scoped frequency | Not in the headline list; ledger keeps rotation | A scoped count may appear in the panel only |
| **OD-35** accreditation | Export only | Export format and owner change, UI does not |

---

## 9. Mobbin

Run 2026-10-09 with the Mobbin MCP (`claude_ai_Mobbin`, web and iOS, deep mode, 7 screen searches). Every image below was viewed, not only its metadata. **None of these products is clinical education, an accreditation tool, or a skills sign-off product.** Fit is `[INFER]`: **Strong** = answers a named part of this variant, **Partial** = one idea transfers, **Weak** = kept so nobody re-finds it. Earlier Mobbin docs `docs/design/mobbin-evidence.md` and `research/meetings/2026-10-09-mobbin-*.md` are not repeated.

| # | Product (what the image shows) | URL | Idea for R2 | What transfers | What does NOT transfer (nursing program, 40 to 200 items per person, per-student sign-off chains, no-login evaluators) | Fit |
|---|---|---|---|---|---|---|
| 1 | Codecademy "Skills tracking" (skill sets as rows of skill chips with a "Subskills / Builds toward" side panel) | https://mobbin.com/screens/d5c43b15-4d4b-4c10-9eaf-33d1e9533e44 | One list of skills grouped under requirement sets, detail in a side panel | Items belong to named groups; an item can build toward several sets (category plus tag idea); side panel keeps the list | Percent chips are the primary viz; one learner, self-paced; no evaluator, no chain | Partial |
| 2 | Twenty (records table with a right-hand record panel, tabs Home, Timeline, Tasks) | https://mobbin.com/screens/86a114d8-1a8e-4795-a639-c8dda8ee916a | Cohort table whose row opens the record in a panel with a Timeline | Table to record without losing place; Timeline tab is the evidence chain | CRM objects; no requirement set; panel is too narrow for 100 rows, so R2 uses a full page for the record and a panel for the chain | Partial |
| 3 | Navattic "Visitors" (table of people, right panel with Activity and Details) | https://mobbin.com/screens/a99e7d4b-d709-4f0c-94b8-8ff2eb174f65 | Row opens an Activity feed | Activity as an ordered feed per person | No target to measure progress against | Weak to Partial |
| 4 | Kajabi "Customer progress" (admin sees one learner's modules with "Completed 1 of 2" and item rows) | https://mobbin.com/screens/1227af09-4d68-457a-a7ea-a5596e2c3e4f | The admin and advisor view of one person's progress, with item rows and completion dates | "n of N" per group in text; the admin sees the learner's page | Linear course, no sign-off, no evidence; progress ring at top | Partial |
| 5 | Teachable (course page with sections "0 / 3 complete" and a row action on each item) | https://mobbin.com/screens/be865fb9-7894-4e03-8262-c14a16d810e3 | Group counts "n / N" plus a row-level action | Per-group text count; the action sits on the row not in a separate place | Lessons are sequential; a percent figure at the side | Partial |
| 6 | 15Five "Competency results" (competency rows with Self, Manager, Peer toggles) | https://mobbin.com/screens/e99a8704-df37-4c4b-8047-fb770aaf5b47 | Evidence by source as a filter on the same list | A source filter (Self, Manager, Peer) over one list of competencies | Scores in cells; peer rating; a coloured grid | Partial |
| 7 | Employment Hero "Reference check" (lifecycle table: step, owner, status Completed, In progress, Not started) | https://mobbin.com/screens/4852a8e5-f3d8-44fc-97ac-f94fd950b7f4 | The sign-off chain as steps with an owner and a status | Step number, owner, status word, start time per step: exactly the chain line | A hiring workflow with a purple stepper; one case, not 100 rows | Strong (chain) |
| 8 | Workable "Select signers, decide the order" and Airwallex "Approval workflow" | https://mobbin.com/screens/b1cbd5f3-62ba-4e9f-b0dd-c41b3d769580 and https://mobbin.com/screens/493224d8-0ebe-4088-8cb2-3c3472958092 | Configuring an ordered chain | Ordered signers with an add-step control | Neither has a count of distinct signers; Airwallex's condition is an amount | Partial |
| 9 | CVS Health "Visit checklist" (iOS rows with status chips "Action needed", "Completed", "Available on ...") and Zocdoc "Well Guide" (rows with "Due" and a row button "Book") | https://mobbin.com/screens/5367bf1b-68be-434d-825e-33fa368bfd42 and https://mobbin.com/screens/86529650-4ea4-42ec-ad0e-a1d14a9c9fb0 | The student phone list: status word on each row, a button on the row | Text chips, not colour; a request button on the row | Short lists (4 to 6 rows); Zocdoc has a bar over 0/4 | Strong (phone row), Partial overall |
| 10 | Docusign (web signing page with a "Viewing as" device switch) | https://mobbin.com/screens/7f9aa712-c2e6-427d-939f-cc8ca96b0332 | A signer arrives from a link, no account, and an admin can preview the signer view | Preview as the signer on three device sizes; no login | A document with fields, not a skill form; no sequencing display | Partial |
| 11 | Aboard People profile (person record with Skills, Forms, Tasks cards; left rail with "Profile completion") | https://mobbin.com/screens/9a96c03d-c1ca-44b6-830d-e27446658f34 and https://mobbin.com/screens/552a6186-b251-4ae8-a4ae-58eca698f432 | A person record that holds skills and forms beside each other | Cards for sources on one person's page (skills and forms together) | Star ratings for skills; profile completion as a bar | Weak to Partial |
| 12 | SchoolAI "Mission Control" (class list with an outcomes cell per student and an average score gauge) | https://mobbin.com/screens/14950322-bbc7-4cea-90ed-66e9909b8468 | Student rows with outcome cells | Rows are students, columns are outcomes | A mastery gauge, red and green dots, AI headlines about a student's mood: the exact things this product must not show | Weak (anti-reference) |

**Where none exists.** No search returned (a) a person's record checked against a program-wide requirement set that is defined once and read by every record, (b) 40 to 200 items per person with evidence from five source types on one row, (c) a guest sign-off by link inside a health-professions program, or (d) an advisor reading a student's competency record with intervention-free context. The student record page with the chain on each row is ours and untested. Mobbin does not cover clinical education.

**Not verified:** screenshots are single frames; no interaction, timing or keyboard behaviour was observed. Fit ratings are my judgment.

---

## 10. Reuse versus rebuild of the current admin build

Sizes are S (hours), M (days), L (a week or more) `[INFER]`. Basis: I read `admin/lib/skills-nav.tsx` and `admin/lib/skills-routes.ts` `[BUILD]` and the build notes in `docs/build/ds-shell-anatomy.md` and `docs/design/brief-v2.md §5 build cost`. I did **not** re-read components, selectors or the store, so each size is an estimate from the documented seams (domain, engine, store and seed "reused as is" per `brief-v2` Direction A build cost).

| Current piece | R2 | Size | What must change |
|---|---|---|---|
| Domain, engine, store, seed (applyConfiguration, copyMappings, proposeImport, selectors) | Reused | S | New selectors: record rows per student with chain state; cohort rollup by state; "waiting for sign-off" count |
| Shell, utility bar, scope switcher, profile view switch | Reused | S | Rail from 5 rows to 3; student rail to 1 |
| `skills-nav.tsx` (Home, Skills, Courses, Attainment, Reviews) | Rewritten | S | Students, Checklist, Sign-offs |
| Home (HY-01) | **Deleted** | S | Setup banner moves to Students; the attention list becomes the Waiting for sign-off column and Sign-offs |
| Skills library page, tabs, Import, Add, Configure wizard, Kits tab | Renamed and kept | S | Rename route and nav label; Kits tab stays; add Program requirements (empty) and Course highlights tabs |
| Courses page (offering list and mapping panel) | Moved into a tab | M | Becomes Checklist > Course highlights; default non-mandatory |
| Attainment page (by student, by skill, by tag, side-panel drill-down, S-02, S-03 dialogs) | **Reshaped** | M | Records tab = By student table plus row trigger; By requirement tab = by skill and by tag; dialogs S-02 and S-03 become one full record page |
| Student record page (new) | **New** | **L** | The core: header summary, grouped list, row anatomy, chain line, evidence panel, request sheet, course chip. No equivalent exists |
| Reviews page and queue | Renamed | S | Sign-offs; add a "Waiting on others" tab; add chain step awareness |
| Student view (course-first, S-12, S-13, S-14) | Reshaped | M | Becomes My record: the one list with a course chip; the send sheet and history stay |
| Evaluator `/e/[token]` | Kept | S | Add "Step n of m" line and a waiting-step state |
| Chain data model (list of steps instead of boolean) | New | M | `SignOffStep[]` per item; step ordering; second link issued after first completes `[OD-33]` |
| Program requirements | Reserved | S | Empty tab and a nullable entity; no logic |
| Advisor scope | Reserved | S | Role flag, off |

**Smallest cut for a "some version" by the last week of October** `[CALL 10-08 Vaibhav]` (a target, not a commitment; the Q1 build date conflicts, `docs/strategy/07 C-18`): rail rewrite (S), Attainment reshape (M), the record page without the chain beyond a single step (L, reduced), My record (M). I would not promise it. `[INFER]`

**What must change in the DS shell** (`docs/build/ds-shell-anatomy.md`):

| Area | Change | Tag |
|---|---|---|
| Detail page chrome | A hub-detail page with breadcrumb "Students > name", a sticky summary header and a sticky filter bar. The shell has detail breadcrumbs for hubs, not a sticky summary pattern | `[PCE hub detail, ds-shell-anatomy §3]` `[INFER]` |
| Grouped checklist rows | The DS has `Accordion`, `Collapsible`, `Badge` and `DataTable`, but no "checklist row with standing word and count". Compose on DS primitives with tokens only; one file; register in `docs/governance/ds-adoption.md` | `[docs/ux/10 §5]` `[not verified against tools/ds/source.mjs]` |
| Count cell | `ProgressCell` draws a bar; do not use it. Use a text cell with tabular numerals | `[docs/ux/11 DP-9]` |
| Side panel | `FloatingSheetPanel` for the evidence chain | `[docs/design/brief-v2.md §3]` |
| Persona switch | Stays in the profile menu with a chip | `[DEC-023]` |
| Product switcher | Not required for entry; listed but not relied on | `[CALL 08-21]` |
| Embeddability | Record component must render in a host that is not this app (Student Success) | `[OD-34]` |

---

## 11. Risks, what would make it fail, and the cheapest test

### 11.1 Risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| 1 | **A record of 100 to 200 rows is long.** The page becomes a scroll of items. | Scale is the REQ's own premise `[REQ §3]` | Default to "Needs attention", group by category with counts, collapse achieved groups, sticky filter bar. Test with 40 and 120 items |
| 2 | **The coordinator thinks in cohorts and per item, not per student.** "Who has not done Foley" takes a lens, not the main view. | Sankalp asked "where is the cohort lagging per skill" `[CALL 09-23]` | The By requirement tab is one click and linked from every count. If coordinators live there, R2 is wrong and the launch page should be it |
| 3 | **Sign-offs as a third row recreates "separate place to act".** | Aarti objects to a split between seeing and triggering `[CALL 10-08 Aarti]` | The record carries the pending step and approve action. If testing shows nobody uses the queue, delete the row |
| 4 | **Program requirements are empty at launch.** The header slot reads "Not set", which looks unfinished. | The OD is open `[OD-30]` | Honest empty state with one link; no invented denominator |
| 5 | **Advisor read is a FERPA question.** | `[OD-25]` | Ships off; scope is a role seam |
| 6 | **One-list naming.** "Checklist" may be wrong for doctoral programs ("competency") or PA ("procedures"). | Five names for one idea `[CALL 10-08 Aarti]` | Label token; kind chip carries the program's own word |
| 7 | **Per-signer chain with no login and no reminders.** Step 2 can stall forever. | Reminders are out of scope `[REQ §14]` `[OD-18]` | "Waiting since" visible to admin and student; resend is an OD-18 answer, not built |
| 8 | **The student record repeats the standing in three places** (header, group header, row). | Redundancy `[feedback: question structural redundancy]` | Group header shows only "n of N items"; header shows the five counts once; row shows only its own |
| 9 | **Course highlight default.** The prototype defaulted new mappings to Mandatory `[PROTO]` and `docs/ux/11 DEC-022` accepted it. I propose non-mandatory. | A silent mandatory contradicts "recommended" and `[REQ CM-03]` | Flag for Sankalp |
| 10 | **R2 is the highest build cost of the record pages.** The record page is new and large. | Date pressure `[CALL 10-08 Vaibhav]` | Smallest cut in section 10 |

### 11.2 What would make R2 fail

1. Coordinators say they never open a single record, only the By requirement view. Then the primary object is the item, not the student.
2. Aarti says the launch page should be the student's own dashboard for admins too, with the cohort one click away. Then swap the launch and the lens, which is cheap.
3. Sankalp rules that the REQ model stays "skills only, competency separate" and that the one-list kind label confuses users. Then the nav label and kind chip change, not the architecture.
4. Records longer than about 150 rows are unusable even with grouping.

### 11.3 Cheapest 5-user test

Clickable ASCII or a static Figma of 4.1 and 4.2, no build. 5 users: 2 coordinators, 1 advisor, 2 students (one on a phone). Tasks, timed, think aloud:

| Task | Pass when |
|---|---|
| Coordinator: "Find who has met the least and request a review of two items." | Finds the Students sort and the row Request review in 7 clicks or fewer without help |
| Coordinator: "Which students have not yet done Foley?" | Uses By requirement or the count link within 30 seconds; note which they choose first |
| Advisor: "How is Priya doing overall?" | Reads the header counts and says what "Program requirements: not set" means |
| Student: "What do you still need for NURS 350, and ask for a review of one item." | Uses the course chip and the row button; understands "3 of 5" |
| Any: "Why is Wound care not achieved?" | Reads the needs line aloud correctly |

Run the same record at 40 items and at 120 items. Success is 4 of 5 completing the first two tasks unaided and no one asking where to "run the report".

---

## 12. Open questions and what to ask on Thursday

### 12.1 Questions by owner

| For | Question | OD | Why R2 needs it |
|---|---|---|---|
| **Sankalp** | Does REQ section 1.4 still stand, or is one list the direction? Is a nullable competency link and a `kind` label acceptable for v1? | OD-28, OD-02 | Nav label, record header counts |
| Sankalp | Are automatic sources (grade, course pass, assessment, form) in v1 scope? | OD-31, OD-32 | Whether the source line and "no request" rows exist |
| Sankalp | Is a general ordered chain with a signer count in v1, or only the existing three roles plus optional approval? | OD-33, OD-06 | Chain line complexity |
| Sankalp | Is "patient log" the section 14 feature? | none | Scope |
| Sankalp | Where does the program define "behind", and is a program total (for example 100) an object? | OD-27, OD-30 | The standing slot and cohort column |
| Sankalp | May the advisor read the record, and which fields? | OD-25 | Advisor scope |
| Sankalp | New course highlights default to mandatory or non-mandatory? | OD-01, REQ CM-03 | Risk 9 |
| **Aarti** | Draw the record page for you (4.2). Is this "my report is my launch page"? For you as admin, is it a cohort table or a single student? | OD-29 | The core bet |
| Aarti | Who triggers a review, student, admin on the student's behalf, or both? | OD-29 | Row action permissions |
| Aarti | When a chain has two steps, must step 2 wait for step 1? Can one person fill two steps? | OD-33 | Link issue order |
| Aarti | Is "n of N" per item enough, or do programs also want a program total per student? | OD-30 | Header |
| Aarti | Is a "Sign-offs" queue acceptable next to the record, or should approving live only on the record? | OD-29 | Risk 3 |
| Aarti | "Skills checklist" or "skills checkoff" on the nav? | OD-34 | Label token |
| **Vaibhav** | Does the module host in a module-based landing, and what does a program without it see? | OD-34 | Entitlement state |
| Vaibhav | Is the record page expected to embed in Student Success? What data contract? | OD-34 | Embeddable component |
| Vaibhav | Which design system version is final for the Prism front end (Angular)? | none | This is a design and behaviour reference only `[CALL 09-30..10-02 leaders]` |
| **Ankit(a) and the delivery team** | Excel of real set-ups per domain: how many use self-attestation, a form per skill, a shared form? | OD-36, OD-37 | Which chain shapes to draw first `[CALL 10-09]` |

### 12.2 Agenda for the next Thursday session with Aarti (45 minutes) `[INFER]`

| Min | Item | Show | Ask |
|---|---|---|---|
| 0 to 5 | Frame | Her own words: "My report should be my launch page" | Did we hear it right? |
| 5 to 20 | Record page | 4.1 then 4.2 on a laptop; then 4.3 on a phone | Is this the page? What is missing on the row? Admin lands on cohort or on a student? |
| 20 to 30 | Chain | The chain line and evidence panel; 4.4 | Real chains from her programs; "3 signatures from 3 preceptors"; faculty then preceptor |
| 30 to 38 | One list and sources | Section 5 table and 8.1 | Names per discipline; which sources matter first |
| 38 to 45 | Program requirements | The empty tab and the header slot | Where does "overall where do they stand" come from? |

Bring the Excel if it has landed. Re-read `docs/strategy/08-raw-granola-findings-oct-2026.md` after it does `[CALL 10-09]`. Do not quote any Oct 8 or 9 line to a named person except "Aarti, inferred" or "Romit".

---

## 13. What I could not verify

| Item | Limit |
|---|---|
| Granola raw transcripts for Oct 8 and 9 | **Not re-fetched.** I read the three raw-review files and `strategy/08` (which records that about 30 quotes were verified against raw on 2026-10-09). Speaker attribution is "Aarti, inferred" everywhere |
| Raw 2026-09-23 transcript | Read in full from the vault copy (186 lines, mixed Hindi and English, begins and ends mid-sentence). Speakers are unattributed `mic`; no line is attributed to Sankalp or Aarti here |
| Oct 5 accreditation interview, Sep 25 sessions | Read through the raw-review digest only; the digest says the Oct 5 interview was only partly read |
| Sep 22 meeting with Aarti | No transcript exists in Granola `[docs/strategy/07 G-23]` |
| The current admin build | I read `skills-nav.tsx` and `skills-routes.ts` only. Reuse sizes in section 10 are estimates |
| DS components and props | **Not checked** with `node tools/ds/source.mjs` and not compared to `localhost:4000`. Component names come from `docs/ux/10` and `docs/design/brief-v2.md` |
| Wireframes | ASCII only; never rendered, never tested with a user |
| Click counts | `[INFER]` from the wireframes |
| Mobbin | Previews of single frames; no interaction observed; no clinical education reference exists |
| `docs/ux/07`, `10` | I read S-02, S-12 and S-16 in `07` and the headings of `10`, not both in full |

Hard stops checked against this design: no shipped taxonomy (kind labels are program text) `[REQ SL-01]`; no default model (group configure shows four unselected tiles) `[REQ SC-02]`; unconfigured items never appear on a record or in a student selector `[REQ IM-09]`; mapping is a highlight, never eligibility `[REQ CM-05]`; completed evaluations immutable, automatic sources add entries `[REQ RV-03]`; preceptors have no login, per-signer links `[REQ EV-01]`; lab never satisfies a clinical setting minimum, shown in the needs line `[REQ SC-12]`; section 14 not designed (hours, remediation, reminders, patient log, accreditation form, advisor interventions) `[REQ §14]`; no OD treated as decided.
