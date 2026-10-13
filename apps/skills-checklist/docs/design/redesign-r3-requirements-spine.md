# Redesign R3: requirements as the spine

Date: 2026-10-09 | Mode: `/design-variants` spec (ASCII and rationale, no TSX, nothing built, nothing published) | Scope: the overall product architecture of Prism Skills Tracking, redrawn from the Oct 8-9 evidence
Status: proposal for Romit. Not a contract. Every `OD-*` stays open and is built as a named seam. Hard stops stand.
Tags: `[REQ id]` requirement | `[OD-n]` open decision, never treated as decided | `[CALL 10-08 Aarti]` Aarti, inferred (Granola has no diarization) | `[CALL 10-09]` `[CALL 09-23]` `[CALL 10-05]` `[CALL 09-30..10-02 leaders]` | `[PROTO]` Sankalp prototype | `[MOBBIN name url]` screen viewed | `[BUILD]` read in `admin/` | `[INFER]` my inference, to validate. Precedence for behaviour: REQ > CALL > PROTO > INFER.
Illustrative numbers and item names are placeholders written for this document. Prism ships no skills, categories or taxonomy `[REQ SL-01]`.
Variant R3 brief (from the task): the primary object is the program requirement set. Everything hangs off it: the library, evidence rules per item, who signs, the cohort's compliance against it, and the student's checklist. Nav is Requirements, Cohorts, Evidence. The report is derived from the requirements.

Read for this file: `ARCHITECTURE-INPUTS-2026-10-09.md`, `strategy/08`, the three `2026-10-09-raw-review-*` files, `README.md`, `strategy/05` and `07` (section E), `journeys/01-03`, `ux/03`, `ux/11`, `ux/01` (personas, first 150 lines), `ux/07` (index and S-01 to S-03), `ux/10` (first 135 lines), `brief-v2.md`, `build/ds-shell-anatomy.md`, `mobbin-evidence.md`, both `2026-10-09-mobbin-*` files, the REQ extract in full, the raw 09-23 transcript in full, the heads (first 40 to 70 lines) of variants A, B and C, and `admin/lib/skills-nav.tsx` plus the `admin/` directory listing. Not read line by line: `ux/02, 04, 05, 06, 08, 09, 12`, the bodies of the old variants, and the `admin/` source code.

---

## 1. Thesis, the one question, and what in the new evidence it answers

```
 THESIS    Aarti describes the product as a requirement that is defined once and met by every student:
           "Program requirements is defined once and every student should meet those requirements."
           [CALL 10-08 Aarti] "at a program level, I want the students to fulfill 100 skills" (question
           from a listener, answered "Yeah, program level") [CALL 10-08 Aarti]
           R3 takes that sentence literally. The REQUIREMENT SET is the one object the whole product is
           organised around. A skill, competency, EPA, procedure or essential is an ITEM in the set.
           Each item carries its own rule (count, level, who signs, where evidence comes from).
           The cohort report is the set evaluated across students. The student checklist is the set
           evaluated for one student. Neither is a separate module: they are two views of the same set.

 THE ONE   "What does this program require, and who currently meets it?"
 QUESTION  Admin reads it as: define the requirement once, then watch the cohort meet it.
           Student reads it as: here is what I must still do, and I can start the review from here.

 OPTIMISES  Defining once and applying to everyone; answering "who meets it" without picking a report
            first; a student page and a cohort page that can never disagree (same set, same engine).
 DOES NOT   Object-by-object lookup (that is variant B). Staff queues as the front door (variant C).
 OPTIMISE   A lifecycle tour (variant A). The first hour is shorter than A only if the 80 skills fall
            into a few rule patterns (section 6).
```

### 1.1 What in the new evidence it answers

| New evidence (verified against the docs) | R3 answer | Tag |
|---|---|---|
| "everything becomes one list" (skills, competencies, EPAs, procedures, essentials) | The set holds ITEMS with a program-worded `kind` label. One list inside Requirements. Nav does not say "Skills" or "Competency" | `[CALL 10-08 Aarti]` `[OD-28]` `[OD-02]` |
| "My report should be my launch page" and no separate place to trigger a review | The default page of the product is the cohort report, derived from the set. Every row carries the review trigger | `[CALL 10-08 Aarti]` `[OD-29]` |
| Soft course mapping only; student can do any item | Course becomes an EMPHASIS layer on the set. It never gates, and it cannot change what counts | `[CALL 10-08 Aarti]` `[REQ CM-05]` |
| Program requirements defined once, every student meets them | This is the spine. The set is applied to a cohort, not built per student | `[CALL 10-08 Aarti]` `[OD-30]` |
| All at student level, rotation FYI only | The headline report has no rotation axis. Setting stays in the ledger and in rules | `[CALL 10-08 Aarti]` `[REQ SC-11]` `[REQ SC-12]` |
| Evidence from self, faculty, faculty plus preceptor (sequenced), grades, course pass, assessment scores, standalone forms | "Evidence rule" is a field on every item in the set. v1 live value: student-submitted with a sign-off chain. The rest are named seams | `[CALL 10-08 Aarti]` `[OD-31]` `[OD-33]` |
| Extend the existing competency mapping rather than build new | An item has a nullable competency link; the set can later be fed by or feed competency | `[CALL 10-08 Aarti]` `[OD-28]` |
| Standalone module that can also integrate | The student checklist is an embeddable panel; entitlement is a flag on the set; the label is a copy token | `[CALL 10-08 Vaibhav]` `[OD-34]` |
| Some version targeted for the last week of October | Smallest slice is section 10: a set with one group, student checklist, cohort table, evaluator link | `[CALL 10-08 Vaibhav]` `[INFER]` |
| Accreditation has a separate owner | Out. R3 only guarantees the ledger can feed an export later | `[OD-35]` `[REQ §14]` |

### 1.2 What I kept from the old variants and the built hybrid, and why

| Kept | From | Why the new evidence still supports it |
|---|---|---|
| Student record as a side panel opened from the report row | Variant B, C, hybrid | It is the nearest match to "do this at the student level" `[CALL 10-08 Aarti]` and to RP-06 ("without leaving the report") `[REQ RP-06]` |
| Import review table as the trust moment, unread lines first-class | Variant A, brief-v2 | Untouched by any call `[REQ IM-05]` `[REQ IM-08]` |
| Kits (configure a group once, per-skill exception) | brief-v2 A | In R3 a kit becomes a group's rule. It is the cheapest route to "define once" `[REQ IM-14]` |
| Log sheet, one-page no-shell evaluator | brief-v2 | Nothing in the calls changes them `[REQ EV-01]` |
| Attention rows that carry count, label and a one-line reason, no time words | HY-01 Mobbin note | Still right; they become the "needs a person" line on the report `[MOBBIN Remote]` |
| Setup status derived from data, never ticked | HY-01 | A re-import reopens setup `[REQ IM-10]` `[REQ IM-11]` |
| DS shell: utility bar, flat rail, persona switch in the profile menu | `ds-shell-anatomy.md` | Unchanged |

| Dropped | From | Why |
|---|---|---|
| Home as a setup journey that later turns into a worklist | Variant A, hybrid | The launch page is the report, not a worklist or a journey `[CALL 10-08 Aarti]` |
| Attainment and Reviews as separate rail rows | hybrid | The split Aarti objects to. Review trigger now lives on report rows; sign-off decisions live in Evidence |
| Courses as a full destination | hybrid, variant B | Soft mapping only. Folded into a tab of Requirements as emphasis |
| Lifecycle labels (Set up, Run, Understand) | Variant A | Phases would re-create a separate place for reporting |
| Go live gate as a prerequisite | brief-v2 A | REQ has no go-live step `[OD-15]`. R3 keeps a "publish set to cohort" seam only |
| Matrix as the centre; heat grid | Variant C | No precedent at 150 x 100 and no call asks for it `[MOBBIN gap]` |
| Product switcher as the way in | hybrid | Set aside on Aug 21; module-based landing is the plan `[CALL 09-30..10-02 leaders]` |
| Today queue as the home | brief-v2 B | Needs "behind", which is open `[OD-27]` |

---

## 2. Architecture map per role

Shell: Exxat Design OS compact shell. One flat rail per view; persona is switched from the profile menu with a bar chip, never as sibling groups `[BUILD ds-shell-anatomy.md]`. Depth maximum 2: a rail row (level 1) and a tab or a panel on it (level 2). Records open as side panels and do not count as a level.

### 2.1 Administrator and coordinator, reviewer is the same person wearing the approval hat

```
RAIL (3 rows, expanded)                 TYPE                    DEPTH-2 CONTENT
 Cohorts        <- default landing       page (the report)       lens control, not tabs: Students | Requirements | Tags
                                                                  [REQ RP-02, RP-03, RP-04]
                                                                 panel: Student record (opens in place)
                                                                 dialog: Request review, Export
 Requirements                            page with 4 tabs         tab Set        the requirement set: groups, targets, thresholds
                                                                 tab Items      the one list; Import, Add item, Configure (dialog / wizard)
                                                                 tab Course emphasis   offerings -> items to emphasise (soft)
                                                                 tab Lists      categories, tags, clinical settings, submission details
 Evidence (n)                            page with 3 tabs         tab Waiting    sign-off decisions; n = items a person can decide
                                                                 tab Ledger     all evidence, searchable, full evaluation view [REQ RP-07]
                                                                 tab Evaluators roster: faculty, preceptors, lab instructors; adopt names
UTILITY BAR (not nav)  Search (jump to a student or an item) | scope switcher | profile (Switch view, Appearance)
```

| Thing | Container | Why | Tag |
|---|---|---|---|
| Cohorts | page | One question, one place. Also the launch page | `[CALL 10-08 Aarti]` |
| Lens control (Students / Requirements / Tags) | `ViewSegmentedControl` inside the page | Three evaluations of the same set. Not navigation | `[REQ RP-02]` `[REQ RP-03]` `[REQ RP-04]` |
| Student record | non-modal side panel (`FloatingSheetPanel`) | List stays visible; replaces stacked dialogs | `[REQ RP-06]` `[BUILD brief-v2]` |
| Request review | dialog over the panel | One decision, one confirm | `[OD-29]` |
| Set editor | page tab with a left group list and right editor | Edit while the pool stays visible | `[MOBBIN Vanta c4f8f036]` |
| Configure one item | wizard dialog (kept from the build) or the right-hand editor in Set | The prototype layout survives `[PROTO]` | `[REQ SC-01]` |
| Import | dialog for input, full-width review step | Trust moment | `[REQ IM-05]` |
| Evidence Waiting | list of cards grouped Agree / Differ, one bulk primary | 16 waiting should not mean 16 primaries | `[BUILD brief-v2 A]` `[REQ AR-02]` |

Counter rule: the Evidence badge counts only decisions a person can make. "Waiting on evaluators" is shown as awareness text, never counted, because reminders and escalation are out of scope `[REQ §14]` `[OD-18]`.

### 2.2 Advisor and faculty (inside Prism, may also be evaluators)

```
RAIL (view: Faculty)                    TYPE
 My students                             the same Cohorts page, scoped to students this person advises or teaches, read only
 Sign-offs (n)                           the same Evidence > Waiting list, scoped to requests addressed to this person
(no Requirements row, no edit)
```

Seams: advisor read-scope of the student-level report is a role and FERPA question, not a v1 feature `[OD-25]` `[CALL 10-08 Aarti]` (a listener asked; Aarti did not answer). A faculty member is routinely also a preceptor `[CALL 10-05]`, so "Sign-offs" must merge both roles for one person `[OD-05]`.

### 2.3 Student

```
RAIL (view: Student; bottom tab bar under 768px)
 My requirements   <- landing          page: the set for me, at student level (section 4.3)
                                        panel: Log evidence (right sheet on desktop, bottom sheet on phone)
                                        panel: Item history (all courses by default) [REQ SH-06]
 History                               page: every submission, newest first, outcome and who it is with [REQ SH-01, SH-02]
```

One page is the home; course is a segmented filter on it (Overall | this course), not a different page `[CALL 10-08 Aarti]`. "Log evidence" is the single filled primary and is an action, not a nav row.

### 2.4 Evaluator, no login

```
EMAIL LINK (one per signer)  ->  /e/[token]   no shell, no sidebar, no account, nothing else reachable [REQ EV-01]
   page: one request, one or several items, per-item outcome and comment, then Submit [REQ EV-05]
```

### 2.5 Reviewer

Not a separate role. An administrator opens Evidence > Waiting `[REQ AR-01]`. If sub-roles for who may approve are specified later, the Evidence row is the only thing that changes `[REQ §8]`.

---

## 3. Object model as the user sees it

```
 PROGRAM
   |
   |-- ITEM  (the one list)            name, description, kind label (program-worded), active/inactive
   |     |    category 0..1, tags 0..n, nullable competency link            [REQ SL-02..SL-04] [OD-28]
   |     |
   |     +-- RULE (one per item, set when configured, never defaulted)
   |           evaluation model (one of four)                                [REQ SC-02]
   |           achievement criteria (counts, levels, per-setting minimums)   [REQ SC-09..SC-11]
   |           evidence comes from: student-submitted (live) | seams         [OD-31]
   |           sign-off chain: ordered steps {role, count, distinct people}  [OD-33] [REQ SC-15, SC-16]
   |
   |-- REQUIREMENT SET  (defined once; versioned)                            [OD-30] [CALL 10-08 Aarti]
   |     |
   |     |-- GROUP  (a program-named bucket of items; default proposed from category / import heading)
   |     |     rule: all items | at least N of M items | per-group quota
   |     |
   |     |-- SET RULE  total: "at least 100 items met"; optional second level
   |     |             program level vs accreditor level                       [OD-30] [CALL 10-05]
   |     |
   |     +-- applies to COHORT(s)  (every student in it meets the set)
   |
   |-- COURSE OFFERING -- EMPHASIS (item marked mandatory / non-mandatory for this offering)  [REQ CM-03]
   |                      soft: highlights, never gates, never grants                       [REQ CM-05]
   |
   +-- STUDENT -- STANDING (derived)   per item: 4 states [REQ AE-04]; per group; per set
                  EVIDENCE LEDGER      immutable evaluations, each with a source line [REQ RV-03] [OD-31]
```

How the three things relate, in one table:

| User asks | Object that answers | Derived from |
|---|---|---|
| "What does the program require?" | Requirement set | Authored once in Requirements > Set |
| "How is each thing met and who signs it?" | Rule on the item | Authored in Requirements > Items `[REQ SC-01]` |
| "Does this student meet it?" | Standing | Ledger evaluated against the item rules, then the group rules, then the set rule `[REQ AE-02]` `[REQ AE-03]` |
| "Which course expects it?" | Emphasis | Course emphasis tab; changes display only |
| "Show me the proof" | Ledger row | Immutable evaluation `[REQ RP-07]` |

Set grammar, so "100 skills" and "5, 5, 5, 5, 5 of each" sit in different places:

```
 Item rule     "5 performed, at least 3 independent, at least 1 in Inpatient"    <- item (REQ SC-10, SC-11)
 Group rule    "all 40 items" or "at least 30 of 40 items"                         <- group
 Set rule      "at least 100 items met across all groups"                          <- set (OD-30)
 Levels        program level 100; accreditor level 80 (both optional)              <- set (OD-30)
 Evidence      student-submitted, signed by faculty then one preceptor             <- item (OD-31, OD-33)
```

Consequences stated plainly `[INFER]`:
1. An item outside the set may still be submitted and its evidence counts toward the student's record `[REQ CM-05]` `[REQ CM-07]`. It does not count toward set standing. The student page says so in a sentence under "Other items".
2. An item without a rule is unconfigured. It may sit in the set as a draft member, is excluded from every student's checklist and every denominator, and is counted in a visible line: "96 usable, 4 need a rule" `[REQ IM-09]` `[REQ IM-10]`.
3. Changing the set or an item rule re-applies to held evidence `[REQ AE-02]`. The editor shows the impact before save: "12 students move from Meets to Open items".
4. Hours are not an item type and the set editor offers no hours field `[CALL 10-08 Aarti]` `[REQ §14]`.

---

## 4. Key screens as ASCII wireframes in the DS shell

Rules applied to every wireframe: one filled primary per surface; action buttons are text only; counts and words carry status, colour never alone; no progress bars as the primary visual; no red in standing; status vocabulary stays neutral, amber for "open".

### 4.1 Admin launch screen: Cohorts (the report)

```
┌ Utility bar ─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [toggle] [Prism v]  Cohorts                         [Search] [Bell] [Help] [Ask Leo] | [Sample Univ > Nursing v] [RS v] │
├ Rail ────────────┬ Page ────────────────────────────────────────────────────────────────────────────────┤
│ Cohorts          │ Cohorts                                                                              │
│ Requirements     │ Who meets the program requirements, and what is still open.                           │
│ Evidence  (16)   │                                                                                      │
│                  │ Requirement set  [Nursing BSN requirements, version 3 v]      Cohort [BSN 2027 v]     │
│                  │ [Cohort: BSN 2027 x] [Group: all x] [+ Add filter]                          Clear all │
│                  │                                                                                      │
│                  │ 150 students. The set has 100 items: 96 are usable, 4 need a rule (Requirements).      │
│                  │ Program level: 100 of 100 items.   Accreditor level: 80 of 100 items.   (OD-30 seam)   │
│                  │                                                                                      │
│                  │ ┌ Meets all ──────┬ Meets accreditor level only ┬ Has open items ─┬ Waiting for sign-off ┐
│                  │ │ 12 students     │ 31 students                 │ 107 students    │ 16 (see Evidence)    │
│                  │ └─────────────────┴─────────────────────────────┴─────────────────┴──────────────────────┘
│                  │   each count is a link into the filtered table below; "open items" is not "behind" (OD-27) │
│                  │                                                                                      │
│                  │ ( Students | Requirements | Tags )   [Search students]  [Sort: Most open items v] [Export] │
│                  │ Student        Items met   Open items by group (met of required)              Waiting  │
│                  │ Priya Tran     62 of 100   Procedures 21 of 40 · Assessments 9 of 10 · Essentials 32 of 50   2   [Request review] │
│                  │ Noah Zeller    97 of 100   Procedures 38 of 40 · Assessments 10 of 10 · Essentials 49 of 50  0   [Request review] │
│                  │ Amara Obi      100 of 100  All groups met                                              0   [Open record] │
│                  │ ...                                                                    Showing 25 of 150  [Show 25 more]  │
│                  │ Rotation and setting are not columns here. They stay in each student's evidence ledger. │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

Design notes:
- The page answers its question above the fold: set standing in words, four counts that are links, then the table `[CALL 09-30..10-02 leaders]` ("make it actionable"). Counts-only home pages are rarely visited `[CALL 09-25]`; this one is the working surface, so the table is on it.
- "Request review" on a row opens the student panel with the unmet items listed and ticked. Who may trigger, student or admin on behalf of a student, is `[OD-29]`; the control exists for both entry points and can be removed from either without moving the page `[ARCHITECTURE-INPUTS 2]`.
- "Meets accreditor level only" appears only if the set carries two levels `[OD-30]`. With one level the card is absent, not zero.
- Lens "Requirements" flips the table to one row per item: items met by n of 150 students, with the same links `[REQ RP-03]`. Lens "Tags" states that figures overlap `[REQ RP-04]`.
- Empty states: no set yet says "No requirements defined. Define the set in Requirements." with one filled primary. No cohort says why `[REQ RP-09]`.
- Export carries the filters that produced it `[REQ RP-10]`.

### 4.2 One drill-down: student record panel (admin view of one student)

```
┌ Cohorts table stays visible ──────────────────────────┬ Priya Tran · BSN 2027 · Group A ─────────── Close ┐
│ Priya Tran    62 of 100  ...  <- selected row          │ Meets 62 of 100 items. Program level 100. Accreditor level 80 (18 more). │
│ Noah Zeller   97 of 100  ...                           │ View  ( Overall | NURS 350 )                      │
│                                                        │                                                   │
│                                                        │ Procedures   21 of 40 items met                    │
│                                                        │ [ ] IV insertion        3 of 5 performed · 2 signed of 3 needed     In progress  │
│                                                        │       Signed: faculty (A. Rao), preceptor (J. Delgado). Needs: 1 more preceptor.  │
│                                                        │       Counts so far: Observed 1 of 1 · With assistance 1 of 1 · Independent 1 of 3│
│                                                        │ [x] Wound care  (Emphasised in NURS 350)  4 of 4 performed · Inpatient 1 of 1 · Emergency 0 of 1   │
│                                                        │       Not yet met: needs 1 in Emergency. Lab evidence does not count here.         │
│                                                        │ [ ] Tracheostomy care   No evidence yet                                           │
│                                                        │ ... 37 more                                                                        │
│                                                        │ Assessments  9 of 10 items met                                                     │
│                                                        │ [ ] Level 3 skills assessment   Score 71 of 75 needed  Source: assessment (seam)  │
│                                                        │ Essentials   32 of 50 items met                                                    │
│                                                        │                                                   │
│                                                        │ 3 items ticked                       [ Request review ]  (the one filled primary)│
│                                                        │ [View evidence ledger]  (outline)                  │
└────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

Notes:
- Counts against targets, per item, at student level: the "5, 5, 5, 5, 5 of each. I have done 2 of these, 4 of these" view `[CALL 10-08 Aarti]` `[REQ SH-05]`. The per-setting line is kept because lab never satisfies a clinical-setting minimum and the student must not be surprised `[REQ SC-12]`. Only the headline hides setting, not the rules.
- The sentence under an unmet item states the failed rule in words `[REQ SH-03]`.
- "Emphasised in NURS 350" is text plus bold, not colour alone `[CALL 10-08 Aarti]` ("bold ... a star ... a different colour").
- The "Source" line appears on any item whose evidence is not a student submission. In v1 it never shows `[OD-31]`.
- The same panel, with first-person copy and no ledger button, is what the student sees as their home (4.3). One component, two audiences `[INFER]`.

### 4.3 Student home: My requirements (phone)

```
┌ My requirements ───────────────┐
│ 62 of 100 items met            │
│ ( Overall )( NURS 350 )        │
│ This course: 8 of 12 items met │
│                                │
│ Procedures         21 of 40  v │
│ ┌────────────────────────────┐ │
│ │ IV insertion (Emphasised   │ │
│ │ in this course)            │ │
│ │ 3 of 5 performed           │ │
│ │ Waiting: J. Delgado, 2 days│ │
│ │ Needs: 1 more preceptor    │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Wound care                 │ │
│ │ 4 of 4 performed           │ │
│ │ Not met: needs 1 in        │ │
│ │ Emergency (not lab)        │ │
│ └────────────────────────────┘ │
│ Assessments        9 of 10   > │
│ Essentials        32 of 50   > │
│ Other items (not in the set)   │
│  Evidence here still counts to │
│  your record.              >   │
│                [ Log evidence ]│
├────────────────────────────────┤
│  My requirements      History  │
└────────────────────────────────┘
```

- The home is the whole set at student level; the course is a filter. "They should be able to do any of it" holds: every item is tappable and loggable `[CALL 10-08 Aarti]` `[REQ ST-02]`.
- Multi-select and batch log remain `[REQ ST-04]`. A student may log a record on one item today and another two days later `[CALL 10-09]` `[OD-14]`.
- "Waiting: J. Delgado" names who it is with `[REQ SH-02]`. "Needs: 1 more preceptor" reads the chain `[OD-33]`.
- Progress is counts and sentences. No ring, no bar `[ux/11 DP-9]`.
- Student self-attestation, if a program chooses it, shows no waiting state. Never a default `[OD-37]` `[REQ SC-02]`.
- Peers' counts and class averages are not shown `[REQ]` silent; existing "never see other students" rule stands `[journeys/02]`.

### 4.4 Evaluator mobile view (no shell, no login)

```
┌ Prism ─────────────────────────┐
│ Sign off 2 items               │
│ Priya Tran · NURS 350          │
│ You are J. Delgado, Preceptor  │
│ ──────────────────────────────  │
│ IV insertion                   │
│ Supplied by the student:       │
│ Date 2026-10-07 · Unit 3 West  │
│ Student's own rating: Independent│
│                                │
│ Level performed                │
│ ( ) Observed                   │
│ ( ) With assistance            │
│ ( ) Independent                │
│ Comment (required)             │
│ [____________________________] │
│ ──────────────────────────────  │
│ Wound care                     │
│ Did the student perform the    │
│ procedure correctly?           │
│ [   Yes   ]  [    No    ]      │
│ Comment (optional)             │
│ [____________________________] │
│                                │
│ After you submit: your sign-off│
│ is recorded. The program then  │
│ decides when the item counts.  │
│ [      Submit 2 sign-offs    ] │
└────────────────────────────────┘
```

- Per-signer link: each signer in a chain gets their own link and no account `[REQ EV-01]` `[OD-33]`. A three-signature rule means three links to three different people; "distinct" is enforced by the program, not by this page.
- The evaluator is not shown the student's standing, the chain length or how many signatures are still needed. That is over-disclosure `[OD-17]` `[ux/11 AP-12]`. The line "The program then decides when the item counts" replaces "counts now / held for approval" only when the chain has more steps; for a one-step item the EV-07 wording stands `[REQ EV-07]`.
- The evaluator cannot change how an item is evaluated `[REQ EV-03]`.
- Link lifecycle (expiry, reuse, revoke) is open `[OD-18]`. No QR flow in v1 `[CALL 09-30..10-02 leaders]`.

### 4.5 Setup path for 80 items: Requirements > Set

State 1, first run, after Import (80 items arrived unconfigured, grouped by the headings the list contained `[REQ IM-07]`):

```
┌ Requirements ───────────────────── ( Set | Items | Course emphasis | Lists )                           ┐
│ Define what every student must meet.                                      [ Import items ] (outline)   │
│ Setup status (derived): 80 items, 0 have a rule. 0 usable.  4 proposed groups from your headings.       │
├ Groups ──────────────────┬ Group: Procedures (25 items) ───────────────────────────────────────────────┤
│ Procedures        25  *  │ Group rule   ( ) All items   (x) At least [20] of 25 items                    │
│ Assessments       10     │ Items in this group  [Search] [ ] select all 25                                │
│ Essentials        35     │  [x] IV insertion         needs a rule                                          │
│ Clinical judgment 10     │  [x] Wound care           needs a rule                                          │
│ + Add group              │  ...                                                                            │
│                          │ ┌ Rule for the 25 selected items (nothing is chosen for you) ───────────────┐ │
│ Set rule                 │ │ Evaluation model   [ Binary ] [ Questions ] [ Scored ] [ Demonstration ]   │ │
│ At least [100] of 120    │ │ (four unselected tiles; no default)                                [REQ SC-02]│ │
│ items met                │ │ Levels, counts and minimums appear after the model is chosen        [REQ SC-09]│ │
│ Program level  [100]     │ │ Evidence comes from   [ Student-submitted ]      (other sources: not available yet) │
│ Accreditor level [ 80]   │ │ Sign-off chain        Step 1 [Faculty v] x [1] signer                       │ │
│                          │ │                       Step 2 [Preceptor v] x [1] signer  [+ Add step]       │ │
│                          │ │ Student supplies      Date* · Unit* · Notes   (program default set) [OD-04] │ │
│                          │ │ Preview: [ Student view ] [ Evaluator view ]                      [REQ SC-19]│ │
│                          │ └─────────────────────────────────────────────────────────────────────────────┘ │
│                          │ Impact: nothing is held yet.        [ Apply to 25 items ] (the one filled primary)│
└──────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

State 2, steady state, same page: the status line becomes "120 items, 116 usable, 4 need a rule". Editing an item rule shows "12 students move from Meets to Open items" before Save `[REQ AE-02]`.

- Groups are proposed from import headings and from categories, then accepted or edited. A group is the unit at which a rule is applied once, which is how 80 items stop being 80 decisions `[REQ IM-14]`.
- "Apply to 25 items" keeps each section defaulting to "Keep each item's own value" if some items are already configured `[MOBBIN Pipedrive "keep current value", docs/research mobbin-kits]`.
- The "Set rule" and "Levels" fields write the seam in `[OD-30]`. If Sankalp answers that there is no program-level object, these fields are hidden and the set equals "every active usable item" (section 8.4).
- Nothing is published to a cohort until the admin picks "Apply set to cohort". That button is the activation seam `[OD-15]`; it can be removed without changing the page.
- Manual path with AI off: import and every control above work without any AI feature `[CALL 10-02]` `[REQ IM-13]`.

### 4.6 Evidence > Waiting (kept short; the decision surface)

```
┌ Evidence ───────────────────── ( Waiting | Ledger | Evaluators ) ──────────────────────────────────────┐
│ Agree (12)  [ ] select all                                   Differ (4)                                 │
│ [x] Rina O.  IV insertion · step 2 of 2, preceptor           [ ] Jonah N. IV insertion  student and   │
│ [x] Noah Z.  Wound care  · step 1 of 1, faculty                  evaluator differ     [Open detail]    │
│ ...                                                                                                    │
│                                    [ Approve 12 selected ]  (the one filled primary)                   │
│ Waiting on evaluators (not counted): 7 requests                                                        │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Return wording stays neutral until `[OD-16]` is answered: "Return for correction". Completed evaluations are never edited `[REQ RV-03]`.

---

## 5. How each source of evidence appears

Everything below is one ledger with a `source` column. v1 builds the first row only. The others are visible in the model, not in the UI `[OD-31]` `[REQ SL-01]`.

| Evidence source | In the rule editor (Requirements) | In the ledger (Evidence) | On the student page | Live in v1 |
|---|---|---|---|---|
| Self (student only, no evaluator) | Sign-off chain step role "Student (self)"; selectable, never default `[REQ SC-02]` | Row with source "Self-attested" and no evaluator | "Recorded by you". No waiting state | No. Gate on the count of programs using it `[OD-37]` `[CALL 10-09]` |
| Faculty | Step role "Faculty" | Evaluator and role columns | "Waiting: A. Rao" | Yes, chain of length 1 `[REQ EV-02]` |
| Faculty plus preceptor, sequenced | Step 1 Faculty, step 2 Preceptor; step 2 link is released when step 1 signs | Two rows linked to one submission, "step 1 of 2" | "Waiting: J. Delgado. Needs: 1 more" | Yes as chain of length 2 if Sankalp confirms `[OD-33]` (REQ today has one evaluator plus optional admin approval `[REQ SC-15]`) |
| Distinct preceptors (PA passport: 3 from 3) | One step: role Preceptor, count 3, distinct people on | Three rows, each a different person; the same person cannot satisfy twice | "2 signed of 3 needed" | No. Seam `[OD-33]` `[CALL 10-08 Aarti]` |
| Counts split by role in the activity (observed, assisted, performed) | Demonstration model levels with minimums per level | "Recorded" column shows the level | "Observed 10 of 10, assisted 2 of 2, performed 5 of 5" | Yes: per-level minimums `[REQ SC-08]` `[REQ SC-10]` |
| Course grade or course pass | Rule field "Evidence comes from: course pass, course X". Lives on the item, not on the emphasis | Source "Course pass" with the grade rule, no evaluator | "Counted from: course pass" | No `[OD-32]` `[REQ CM-05]` |
| Assessment question, whole assessment minimum score | Source "Assessment", with threshold | Source "Assessment, 71 of 75", no evaluator | "Counted from: assessment" | No `[OD-31]` |
| Standalone form (FAST) | Source "Form" with an adapter to the existing form | The form's responses behind View | "Counted from: form" | No `[OD-36]` |
| Patient log | Not offered | Not offered | Not offered | No. Possibly the section 14 feature; ask Sankalp `[REQ §14]` `[OD-31]` |

Rules that hold for every row:
- A source with no per-evaluation record cannot be mapped to REQ AE-01 without an explicit rule; the ledger row for automatic evidence carries the rule that produced it `[REQ AE-01]` `[OD-31]`.
- No auto-credit on an unconfigured item `[REQ IM-09]`.
- If an automatic source later changes (a grade is corrected), the original row stays and a new row is added; the old one is never edited `[REQ RV-03]` `[OD-08]`.
- Where evidence happened does not change the headline, but a per-setting minimum still counts only evidence from that setting and lab never satisfies a clinical minimum `[CALL 10-08 Aarti]` vs `[REQ SC-12]`. Flagged for Sankalp (section 8.5).

---

## 6. Three journeys with click counts

Click counts are estimates for a prepared user on desktop `[INFER]`. A click is a press, a selection or a tap; typing is not counted. The comparison with brief-v2 A (about 180 for 100 items) is only fair if the items fall into a small number of rule patterns, which is unevidenced until the implementation Excel lands `[CALL 10-09]`.

### 6.1 First-hour setup of an 80-item list

| Step | Clicks | Notes |
|---|---|---|
| Open Requirements (empty state) | 1 | One filled primary: "Import items" |
| Import: choose file, upload, confirm | 3 | State limits first; per-line problems with original text `[REQ IM-08]` |
| Review the proposal: accept proposed groups, fix about 3 rows | 8 | Merge, rename, discard, add allowed `[REQ IM-05]` |
| Create 80 items | 1 | They arrive unconfigured `[REQ IM-09]` |
| Group 1: model tile, rule fields (about 3), chain (about 3), target (2), Apply (2) | 12 | First group is the full cost |
| Groups 2 to 4: copy rule from group 1, edit about 2 fields, Apply | 18 | 6 each |
| Spot-check one item per group in student and evaluator preview | 4 | `[REQ SC-19]` |
| Set rule and levels (total 100, program 100, accreditor 80) | 3 | Seam `[OD-30]` |
| Apply set to cohort | 2 | Seam `[OD-15]`; 0 if no activation step |
| **Total** | **52** | Plus about 3 per exception item. 20 exceptions add about 60, giving about 110 |

Time to the first value: the cohort report shows live standing after about 10 clicks (once the first group has a rule), because configured items count immediately and unconfigured ones are named, not hidden `[REQ IM-10]`. Course emphasis is optional and adds 0 clicks, since it is soft `[CALL 10-08 Aarti]`.

### 6.2 Weekly: who is behind, and sign-off

| Step | Clicks | Notes |
|---|---|---|
| Open the product | 0 | Lands on Cohorts, the report |
| Read set standing and counts | 0 | Above the fold |
| Filter to one cohort | 1 | |
| Sort by most open items | 1 | The word "behind" is not used `[OD-27]` |
| Open a student row | 1 | Panel opens in place |
| Tick unmet items and Request review | 3 | Two ticks plus one press, then confirm. Who may trigger is `[OD-29]` |
| **"Who is behind and start the review"** | **6** | One surface, as asked `[CALL 10-08 Aarti]` |
| Open Evidence | 1 | |
| Select all that agree, Approve selected | 2 | |
| Open one differing item, decide | 3 | Open, add note optional, Approve or Return |
| **Clearing 16 waiting** | **6** | Compare about 25 in the current build `[BUILD brief-v2 1.2]` |

### 6.3 Accreditation evidence pull for one requirement

| Step | Clicks | Notes |
|---|---|---|
| Cohorts, set filters (cohort, year) | 2 | |
| Switch lens to Requirements, open the item | 2 | "Item 044: met by 140 of 150" |
| Open one student from that item | 1 | |
| Open the ledger, then the full evaluation | 2 | Questions, scores, feedback, details `[REQ RP-07]` |
| Export the filtered view | 2 | Filters written into the file `[REQ RP-10]` |
| **Total** | **9** | This is an evidence export, not an accreditation form. Accreditation outputs are out of scope and have another owner `[REQ §14]` `[OD-35]` |

---

## 7. Requirement coverage

Status: **Full** = lives in a named place under R3 with no change to the requirement. **Reframed** = same requirement, new home. **Seam** = built as a named seam. **Out** = out of scope.

| REQ area | Where it lives under R3 | Status | Note |
|---|---|---|---|
| SL-01 to SL-11 library | Requirements > Items, Lists | Reframed | Library becomes the Items tab. Categories and tags are in Lists. Deactivation withdraws an item from the set and from reporting scope `[REQ SL-11]` |
| IM-01 to IM-15 import | Requirements > Items > Import; Set shows derived setup status | Full | Proposed groups come from headings `[REQ IM-07]`. Copy and apply to many is the group rule `[REQ IM-14]` |
| SC-01 to SC-19 configuration | Rule on the item, edited in Items (wizard) or Set (group editor) | Full | Model before criteria, no default model, unsatisfiable not savable, preview before use |
| CM-01 to CM-08 course mapping | Requirements > Course emphasis | Reframed | Mandatory and non-mandatory kept as emphasis; never gates `[REQ CM-05]`. Carry-forward stays `[OD-01]` |
| ST-01 to ST-14 student submission | Student > My requirements, Log evidence | Reframed | One checklist at student level; course is a filter. Unmapped items still loggable `[REQ ST-02]` |
| EV-01 to EV-08 evaluator | `/e/[token]`, no shell; Evidence > Evaluators roster | Full | Per-signer links for chains `[OD-33]`; roles as rows `[OD-06]` |
| AR-01 to AR-06 administrator review | Evidence > Waiting | Full | Agree / Differ grouping, compare, note, Approve or Return |
| RV-01 to RV-06 revision | Student History and item history; Evidence ledger | Full | Correction continues the record; further attempt is separate; completed is immutable |
| SH-01 to SH-07 student record | Student > History, item rows with counts and failed-rule sentence | Full | Per-setting progress shown on the item `[REQ SH-05]` |
| RP-01 to RP-11 reporting | Cohorts (report), Evidence > Ledger | Full | By student, by requirement item, by tag lenses. Filters removable. Impossible combinations explained `[REQ RP-09]` |
| AE-01 to AE-08 engine | Under every page; standing is derived | Full | Four states kept behind the display flag `[OD-03]` `[REQ AE-08]` |
| OD-01 to OD-13 | Seams listed in section 8 plus existing ones | Seam | None treated as decided |
| REQ section 14 | Not designed | Out | Remediation, notifications, expiry, patient-encounter linkage, accreditation outputs, Evaluations migration |

### 7.1 Homeless or awkward items under R3

| Item | Problem | Proposal `[INFER]` |
|---|---|---|
| Category and requirement group | Two parallel hierarchies: category (library, 0 or 1 per item `[REQ SL-03]`) and group (set). They will drift | Default group = category on import; user may differ. Test whether coordinators see two things (section 11) |
| Tags and the overlap caveat | Tags are cross-cutting, not groups `[REQ SL-04]` | Cohorts lens "Tags" with the overlap sentence `[REQ RP-04]` |
| Deactivated item in a set | Standing denominators change silently | Show "1 item withdrawn" in the set status line and keep evidence `[REQ SL-11]` |
| Lab instructor roster and adopting student-named names | Not a requirement concept | Evidence > Evaluators `[REQ SL-08]` `[REQ SL-09]` |
| Per-import traceability | Not on any R3 page | Items tab filter "Arrived in import" `[REQ IM-11]` |
| Submission details default `[OD-04]` | Needs a home above items | Lists > Submission details (program default plus per-item additions) |
| Export format `[OD-10]` | Not a page concern | Dialog on Cohorts and Ledger |
| Course emphasis volume (42 offerings) | Mapping effort | Soft emphasis lowers the stakes; explicit "copy from last term" stays `[OD-01]` |
| Student-level "this course" count | Needs the offering to be known | Course filter on the student page uses enrolment |
| Program-level threshold for "behind" | Not defined `[OD-27]` | Report says "open items", sorts by count, never labels students |

---

## 8. Seams, each with "if the answer is X, the UI does Y"

The three the brief requires, then the four others R3 depends on.

### 8.1 OD-28 and OD-02: one list or separate from competency

```
 Today's build:   Item has `kind` (a program-worded label) and a nullable competency link. No UI for the link.

 IF ONE LIST (Aarti's recommendation, handed to Yash [CALL 10-08 Aarti]):
   Requirements > Items shows one table. Filter chips come from the kinds the program uses:
   [All] [Skills] [Competencies] [EPAs] [Procedures]. Groups may mix kinds.
   Nav label stays "Requirements". Library copy uses the program's word for its own kind.
   REQ 1.4 is amended by Sankalp; competency scoring is still NOT inherited unless he says so.

 IF SEPARATE (REQ 1.4 stands; competency stays its own module):
   Requirements > Items gets a ViewSegmentedControl: ( Skills | Competencies ). Competencies are read-only here and
   come from the competency module. A requirement group may reference both; the set shows each item with its
   source module. Link shown as a field on the item, using the nullable link that already exists.
   No competency scoring in Skills.

 EITHER WAY: "Requirements" is a neutral spine label, so R3 survives both answers; this is its main advantage
   over a nav that says "Skills" or "Competency". REQ 1.4 governs until Sankalp rules; do not rename on a call. [REQ 1.4]
```

### 8.2 OD-31, OD-32, OD-36, OD-37: which evidence sources, and how

```
 IF STUDENT-SUBMITTED ONLY (REQ today):
   Rule editor shows "Evidence comes from: Student-submitted" as a fixed line; no picker.
   Ledger has no source column. Student page has no "Counted from" line.

 IF AUTOMATIC SOURCES ARE ALLOWED (assessment, course pass, form, grade):
   Rule editor shows a Select "Evidence comes from" before the sign-off chain. Choosing a non-student source
   hides the chain, shows the threshold or rule, and states: "No evaluator. Counts when <rule> is met."
   Ledger gets a Source column. Student page gets "Counted from: <source>". An unconfigured item still cannot
   be auto-credited [REQ IM-09]. A changed grade adds a row; it never edits one [REQ RV-03].

 IF SELF-ATTESTATION IS A MODEL (OD-37):
   Chain step role "Student (self)". Never the default. Student page shows no waiting state.
   Cohort report adds a "Self-attested" count so a program cannot hide it from itself.
```

### 8.3 OD-32 and CM-05: hard versus soft mapping

```
 IF SOFT ONLY (Aarti: "every course can only have a soft mapping"):
   Course emphasis tab sets mandatory / non-mandatory for an offering. Student page: bold plus the words
   "Emphasised in <course>". Nothing about a course ever changes standing.

 IF A COURSE PASS CAN CONFER AN ITEM ("If you pass the course, you pass this competency"):
   The grant lives on the ITEM RULE as "Evidence comes from: course pass", not on the emphasis. Emphasis stays soft.
   Course emphasis tab adds a read-only column "Confers" listing items whose rule names this course. Ledger source
   shows "Course pass". Mapping remains expectation, not eligibility [REQ CM-05]; the rule is the only place
   a course can confer anything.
```

### 8.4 OD-30 and OD-27: the program requirement object (the one R3 bets on)

```
 IF A PROGRAM REQUIREMENT OBJECT EXISTS (Aarti, G5 leader):
   Set rule, group quotas and the two levels (accreditor, program) are fields on the Set tab. Cohorts report shows
   "Program level" and "Accreditor level" counts. "Open items" can later be sharpened into a defined "behind"
   once Sankalp defines it [OD-27]. Vocabulary stays non-red [C-19].

 IF NO PROGRAM-LEVEL OBJECT (only per-item criteria, REQ today):
   The Set tab hides Set rule, quotas and levels. The set is "every active usable item", each at its own
   criteria [REQ AE-03]. Requirements is then a renamed library with a derived cohort report. R3 degrades to the
   hybrid with Attainment folded into the front door. It does not break, but it loses its reason to be called
   the spine. This is R3's single biggest dependency.
```

### 8.5 Other seams R3 carries

| Seam | Question | UI under each answer |
|---|---|---|
| OD-29 who triggers a review | Student, admin on behalf, or both | Row action "Request review" on Cohorts and on the student page; remove either with no layout change `[CALL 10-08 Aarti]` |
| OD-33 chain generality | Ordered steps, N distinct signers, none | Chain editor shows 1 step by default and "Add step". If v1 stays single-step, the "Add step" row and the "count" field are hidden `[OD-33]` |
| OD-34 module relationship | Standalone, part of Student Success, or both | Student panel embeddable; entitlement flag; if not enabled, Requirements shows an example set with no school data and a gray state `[CALL 09-30..10-02 leaders]` |
| SC-12 vs "it doesn't matter where they learn it" | Does the headline hide setting only | Headline has no rotation or setting axis; per-setting minimums still count only that setting. Flag, do not pick `[CALL 10-08 Aarti]` vs `[REQ SC-12]` |

---

## 9. Mobbin analogies

Tool: Mobbin MCP (`claude_ai_Mobbin`), web and iOS, deep mode; 9 screen searches and 1 flow search on 2026-10-09; every image listed below was viewed (previews, not interacted-with products). Earlier searches in `mobbin-evidence.md` and the two `2026-10-09-mobbin-*` files are not repeated. None of these is clinical education, credentialing for clinicians, or an accreditation tool. Fit ratings are `[INFER]`: Strong answers a named need of R3; Partial transfers one idea; Weak does not answer the job.

| # | Product and URL | Pattern seen | What transfers | What does not (nursing and health-professions program, 40 to 200 items, per-student sign-off chains, no-login evaluators) | Fit |
|---|---|---|---|---|---|
| 1 | Vanta, framework page: https://mobbin.com/screens/5dd5ee76-13b5-44b9-9906-411a1ffa4f63 and https://mobbin.com/screens/c4f8f036-e537-453c-a988-0aba632ccb5b | A named requirement set (SOC 2) with a left list of requirement categories, a completion card (19 controls OK of 80), and controls with owner and evidence readiness | The nearest structural match to R3: a defined-once set, category rail, per-requirement owner and evidence, completion counted against a total. Supports "the set is the object" | It evaluates one organisation, not 150 individuals against the set. Completion is a percentage with a bar as the main viz, which our rules forbid. No sign-off chain per item | Strong for structure, Partial overall |
| 2 | Vanta, home: https://mobbin.com/screens/7ed81957-3d99-4745-96c9-b6eed55cd9ab | "Compliance progress: SOC 2, 99%, 103 of 104" card as the first thing on Home; open tasks panel | Report-as-launch-page: standing against the set is the first card. Counts "x of total" | Bar and percent as primary viz. Time words (overdue, due soon) are out of scope `[REQ §14]` | Partial |
| 3 | Deel Engage, assignments table: https://mobbin.com/screens/8fcd1acc-25fd-4d6e-8273-1eac2afe2922 | Assignee table with filters (course, status, assignee), status, assignment date, row "View details", export | Row-per-person against assigned requirements; filter row; export | Status is not started or overdue by date. Not per-item counts against targets. Assign is how requirements reach people; ours is "apply set to cohort" | Partial |
| 4 | Employment Hero, compliance table: https://mobbin.com/screens/47d85c21-a910-407a-b9e3-c85ac7dd6430 | Person by document status with filters and a per-row Remind | Plain-text status ("Overdue by 1 day") in the row; filter bar | Remind is a notification, out of scope `[REQ §14]`. Flat list across 150 students would be noise | Weak |
| 5 | 7shifts, onboarding documents per person: https://mobbin.com/screens/ddb0c7d4-44ab-47c5-946e-a7b13bbaa4ed | One person, list of documents, status "Needs manager review" or "Incomplete" | Per-person list of requirements with review state: the student record panel | Three items, no counts, no chain | Partial |
| 6 | Teachable, course page with groups: https://mobbin.com/screens/be865fb9-7894-4e03-8262-c14a16d810e3 | Sections with "0 / 3 complete", rows with Start | Group header counts the way R3 shows "21 of 40". Plain rows | Binary complete only. A ring at top as primary viz | Partial |
| 7 | Codecademy, path curriculum: https://mobbin.com/screens/63e05256-8dd3-4758-9abd-bc84176be27d | Grouped items inside one path, small progress per item, certification exams as items | Heterogeneous items (lessons, exams) inside one requirement path; supports mixed kinds in one list `[OD-28]` | Per-item rings; sequential learning, not parallel evidence and signatures | Partial |
| 8 | Target iOS checklist: https://mobbin.com/screens/5c2bd4eb-0deb-413f-976c-133844fe32e1 | "0 of 85 items completed", groups with "0/12 complete", collapsible | Phone shape for 40 to 200 items in groups with a count per group; collapse | A progress bar at the top as primary viz. Items are ticked by the user, not signed by someone else | Partial |
| 9 | Airwallex, approval steps: https://mobbin.com/screens/4048e7c4-c32c-4d5b-97df-0eea64c9a305 | Rule with approval steps "from any of Manager, Department head, Location head", Add approval step | Chain editor idiom: ordered steps, a role pool per step, add step | Rule applies to payments by amount, not to a student-by-item pair. Approvers are signed-in users | Partial for the chain editor |
| 10 | Acctual, approvals: https://mobbin.com/api/mcp/short/EMdX61zW (image link as returned; the canonical screen id is in the Mobbin result for query "rule builder defining a requirement with a required count threshold") | "Require 1 approval from team members" with a count field | The "N signers" field is the PA passport rule ("3 from 3") | No "distinct people" control. Signed-in approvers | Partial |
| 11 | Mercury, per-payment approvals: https://mobbin.com/api/mcp/short/6fzeyYSN (image link as returned; same query as row 10) | "Require [approver] / Add another approver" under a threshold rule | Threshold plus approver list in one card; sentence-style rule | Single approver list, no sequencing or distinct count | Weak to Partial |
| 12 | Later, reviewer link without an account: https://mobbin.com/flows/918f406b-21e5-4735-a986-c891e30125fc | "Reviewers can visit the link without a Later account. Link valid for 7 days. Share via email" | The only analogue for a no-login link with a stated lifetime; shows link expiry copy | Content review of posts, not a clinical sign-off. Expiry and reuse are `[OD-18]` for us, not decided | Partial (best available) |
| 13 | Fiverr, accept delivery: https://mobbin.com/flows/c13d8356-55cb-4d11-a87d-06511eacefe0 | A guest or collaborator reviews files and answers Yes or No | Two large answer buttons beside the artefact | Not a no-login flow; accounts required | Weak |
| 14 | Gusto, hire pending: https://mobbin.com/screens/b723bdfb-f882-422d-b49c-7c31365c880a | Vertical sequence: sent, accepts; message explains what is blocked | Sequential steps stated in words with what is blocked and what can still be done: model for "step 2 waits for step 1" copy | One person, two steps, no counts | Partial |

Where none exists, stated plainly:
- **Requirement set evaluated for each person with a count against a target per item, rolled to group and set.** Vanta evaluates an organisation; Deel, Employment Hero and 7shifts list a person against documents without counts. No product shows all three levels together for a population.
- **Per-student, per-item sign-off chains with distinct signers and no-login signers.** The approval-rule screens (9, 10, 11) are signed-in finance workflows; Later (12) is no-login but single-step. No analogue for the combination.
- **People by items heat grid at 150 x 100.** Not found in earlier searches either `[MOBBIN gap, mobbin-evidence.md]`. R3 does not need it.

---

## 10. Reuse versus rebuild of the current admin build, and DS shell changes

Basis: `admin/lib/skills-nav.tsx` read; `admin/` directory listing read; component bodies not read. Size is `[INFER]`: S under 2 days, M 2 to 5 days, L over 5 days for one developer. Domain, engine, store and seed were described as reusable in brief-v2 `[BUILD brief-v2 section 4]`; not re-verified.

| Area (current files) | R3 verdict | Size | Why |
|---|---|---|---|
| Engine and domain (`lib/engine`, `lib/domain`) | Extend | L | New objects: Set, Group, set rule, two levels, chain step with count and distinct people, source on a ledger row. Standing selectors at group and set level. Highest cost of R3 |
| Import (`components/import`, `lib/import-ai`) | Reuse as is, add proposed groups | S | Headings already proposed as categories `[REQ IM-07]` |
| Configure (`components/configure/*`) | Reuse; add chain editor and evidence-source line | M | Wizard dialog, lineage panel, level editor, form preview all stay `[PROTO]` |
| Library (`components/library/*`) | Re-home as Requirements > Items and Lists | M | Tabs rearranged; Kits tab becomes the group rule |
| Mapping (`components/mapping/*`) | Re-home as Course emphasis; remove any gating copy | M | Master-detail stays; meaning changes to soft |
| Home (`components/home/*`) | Remove; setup card moves into Requirements status line; attention list becomes the counts on Cohorts | M | The launch page is now the report |
| Reporting (`components/reporting/*`) | Becomes Cohorts; add set standing, group counts, lens control, row trigger | L | Largest UI change; student panel reused as admin and student component |
| Review (`components/review/*`) | Moves under Evidence > Waiting; add Agree / Differ grouping and bulk Approve | S | Cards and compare already exist |
| Student (`components/student/*`, `student-shell.tsx`) | Rebuild as one checklist at student level with course filter | L | Currently a course-first page `[PROTO]` `[ARCHITECTURE-INPUTS 3]` |
| Evaluator (`components/evaluator/*`, `(evaluator)`) | Reuse; per-signer links; hide achievement | S | Shell-free route already exists |
| Shell and nav (`lib/skills-nav.tsx`, `components/shell/*`) | Replace 5 rows with 3 (Cohorts, Requirements, Evidence) | S | Persona views unchanged; Reviews badge moves to Evidence |

**First slice for a version in the last week of October** `[CALL 10-08 Vaibhav]` `[INFER]`: one group, one chain step, student-submitted only. That is: Requirements > Set (single group, no levels), student checklist, Cohorts table with set standing, evaluator link, Evidence > Waiting. It uses the existing import, configure, evaluator and review components and needs only a minimal Set object in the engine. Whether "some version" means a build or a design version is unconfirmed `[strategy/07 C-18]`.

### What must change in the DS shell

| Change | Detail | Source |
|---|---|---|
| Rail | Three flat rows; no secondary panel (depth max 2 via tabs). If Requirements outgrows tabs, `NavLinkItem.secondaryPanel` is the DS route | `[BUILD ds-shell-anatomy.md]` |
| Product switcher | Stays; not relied on as the way to reach Skills | `[CALL 09-30..10-02 leaders]` |
| Student shell | Bottom tab bar under 768px; two items | `[MOBBIN Binance, mobbin-evidence.md]` |
| New hand-roll compositions (one file each, on DS primitives) | `RequirementGroupRow` (name, "21 of 40", collapse); `ItemStandingRow` (counts, chain state, failed-rule sentence); `ChainEditor` (steps, role, count, distinct); `SetStandingLine` | `[INFER]` register in ds-adoption |
| Existing DS parts | `DataTable`, `KeyMetrics` (variant compact, 4 cells maximum), `FilterBar`, `ViewSegmentedControl`, `Tabs`, `FloatingSheetPanel`, `Sheet`, `LocalBanner`, `StatusBadge` (tones success, warning, info, neutral; no red), `SelectionTileGrid` (radio) | `[ux/10]` version drift not re-verified (section 12) |
| Not available | `Progress`, `Stepper`, `MultiSelect`, `Combobox`, `FileUpload`: `ProgressCell` in table cells only; Popover plus Command for multi-pick | `[ux/10 section 4]` |

---

## 11. Risks, what would make R3 fail, and the cheapest 5-user test

| # | Risk | Likelihood and effect `[INFER]` | Mitigation |
|---|---|---|---|
| 1 | **OD-30 answered "no program-level object".** The spine has nothing to hold | Medium. R3 degrades to a renamed library plus report | Ask Sankalp first (section 12). Section 8.4 shows the degraded state; it is not a dead end |
| 2 | **Category versus group duplication.** Coordinators see two hierarchies | High, cheap to find | Default group = category; test comprehension |
| 3 | **Programs where the "requirement" is not a count of items** (PA "no concept of met requirements", only minimum counts) | Medium. "Meets" is the wrong word | The set can be counts only: group and item targets without a "Meets" label. Copy token for the verb `[CALL 10-08 Aarti]` |
| 4 | **Different programs have a set per cohort and per year** | Medium. Versioning and cohort assignment become heavy | Version label plus "applies to" cohorts; no per-student sets `[CALL 10-08 Aarti]` |
| 5 | **Rule patterns are not few.** The 52-click setup assumes 4 rule patterns | Unknown until the Excel arrives `[CALL 10-09]` | Re-run the count with real set-ups; if exceptions dominate, group editing loses its advantage |
| 6 | **Student sees "62 of 100" as a judgement** | Medium. Anxiety, FERPA tone | Counts and a next step in each row; no ranking; no class average `[REQ]` silent |
| 7 | **Hides the setting axis too well.** A student meets 100 items and still lacks a per-setting minimum | Low-medium; trust failure | Per-setting lines stay on the item; the set standing sentence names "open items" including setting minimums `[REQ SC-12]` |
| 8 | **Report as launch page overloads the first screen** | Medium | Four counts, one table, nothing else; test with 5 coordinators |
| 9 | **Hard stop pressure by wording.** "Meets" and "requirements" invite a default model or auto-credit | Low if enforced | No default model, no auto-credit, no shipped items `[REQ SL-01]` `[REQ SC-02]` `[REQ IM-09]` |
| 10 | **Entitlement and label.** "Requirements" may not match the market word ("skills checkoff") | Medium | Copy token; "checkoff" is the field's word `[CALL 09-30..10-02 leaders]` `[OD-34]` |

What would make R3 fail outright: Sankalp rules that program requirements are out of scope and rule shapes are per skill only (risk 1), or the Excel shows most programs have one set of rules per item with no groups, so the set adds a layer nobody needs.

### Cheapest 5-user test (paper, about 45 minutes each, no build)

```
 WHO     5 coordinators or program directors across at least 2 disciplines (for example nursing, PA, nutrition).
         Ask each to bring their own requirement list (a checklist, a passport, a spreadsheet).
 TASKS   1. Show only the Requirements > Set wireframe (4.5) and ask: "Where would you put your program's
            requirement?" Observe: do they say "Set" or "Items"? Do they find group versus category?
         2. Ask them to write one of their real rules in the editor (a count, a level, 3 signatures from 3 people).
         3. Show the Cohorts wireframe (4.1) cold and ask: "Who needs attention, and what would you do next?"
            Success: names a student and says "request review" without being told it exists.
         4. Show the student panel (4.2) and ask: "What does this student still need?" Success: reads the
            per-setting line correctly.
 PASS    4 of 5 place the requirement in Requirements, 4 of 5 find the review trigger on the report,
         and at most 1 of 5 treats group and category as the same thing without being told.
 KILL    3 of 5 look for the report in a separate place, or cannot say what "open items" means.
```
This is a design test with wireframes, not usability evidence. It cannot show whether R3 is faster than a guided setup.

---

## 12. Open questions, and what to ask in the next Thursday session with Aarti

### 12.1 For Sankalp (requirements owner)

| # | Question | Blocks |
|---|---|---|
| 1 | Is there a defined-once program requirement object (total, group quotas, accreditor level and program level)? Where does the program set it? `[OD-30]` `[OD-27]` | R3's spine (8.4) |
| 2 | Do skills, competencies, EPAs, procedures and essentials become one list, and does REQ 1.4 stand? `[OD-28]` `[OD-02]` | Nav label, Items tab (8.1) |
| 3 | Are automatic evidence sources (assessment, grade, course pass, form) in scope, and is "patient log" the section 14 feature? `[OD-31]` `[OD-32]` | Rule editor (8.2) |
| 4 | Are sign-off chains (ordered, N distinct signers, self) in scope for the first version? Is the admin approval step one more step in the chain? `[OD-33]` `[REQ SC-15]` | Chain editor |
| 5 | Who may trigger a review: student, admin on behalf of a student, or both? `[OD-29]` | Row action |
| 6 | Reuse existing FAST forms or generate from configuration? `[OD-36]` | Evaluator surface |
| 7 | Does "some version by the last week of October" mean a design or a build? `[strategy/07 C-18]` | Slice |
| 8 | Does Skills reuse the platform reminder engine and the Preceptor entity? `[OD-18]` `[OD-05]` | Evidence |

### 12.2 For Aarti (next Thursday session; Excel of real set-ups is due before it `[CALL 10-09]`)

Lead with the acceptance test, not a trust question `[memory]`: show wireframes 4.1 and 4.2 and watch.

1. "Here is the report that is also the launch page. Where would you click to ask a student to do the 3 items they have not met?" Do not point.
2. "Here is one program requirement written as a set: 100 items, 4 groups, two levels. Does this describe how a program defines it, or is the unit different?" Bring her PA passport (3 from 3), nutrition (one person says well) and observe, assist, perform examples as rows.
3. "Is there ever a requirement that is not a count of items? How is it met in PA, where there is 'no concept of met requirements'?"
4. "When you said one list, did you mean one table in the product, one object in the database, or one word for students?"
5. "If a course pass confers the item, is that a rule on the item, or a property of the course?" (decides 8.3).
6. "Does the accreditor level and the program level both appear on the same report, and who sets each?"
7. "Where did you expect advisors to read this, and what may they see?" `[OD-25]`
8. Ask for the two or three real set-ups (nutrition, PA, SLP, radiation therapy) from the Excel and run the section 6.1 click count on them.

### 12.3 For Vaibhav (design lead for the Prism landing)

| # | Question |
|---|---|
| 1 | Where does Skills sit in the module-based landing, and what does a program without it see? `[OD-34]` |
| 2 | Market label: "skills checkoff", "skills checklist", "Skills Tracking" or "Requirements"? `[CALL 09-30..10-02 leaders]` |
| 3 | Is the student panel embeddable in the Prism student shell, and in Student 360? `[CALL 10-05]` |
| 4 | Hand-off: the Prism front end is Angular, so is this Next build a behaviour and design reference only? `[CALL 09-30..10-02 leaders]` |
| 5 | Are the DS shell pieces used here (utility bar, flat rail, `FloatingSheetPanel`) the same as the final Prism ones? |

---

## 13. What I could not verify

| Item | Status |
|---|---|
| Aarti attribution | Granola has no diarization; "Aarti, inferred" throughout. The Oct 8 brain dump has at least two voices; "program requirements" and "100 skills" came partly as a listener's question answered by another voice `[strategy/08 section 0]` |
| The Sep 22 meeting with Aarti | No transcript exists in Granola `[strategy/08 section 16]` |
| The implementation Excel | Not yet delivered; all counts of "common set-ups" and the 4-pattern assumption in 6.1 are unevidenced `[CALL 10-09]` |
| Mobbin | Previews only; no interaction, timing or keyboard behaviour. Fit ratings are mine. Rows 10 and 11 cite the short image links the tool returned (these expire after 30 days); the canonical `mobbin.com/screens/<id>` links for them were not transcribed and must be recovered by re-running the query. All other URLs were copied from tool output |
| `admin/` code | Directory listing and the nav file only; component bodies and the engine not read. S/M/L sizes are estimates |
| DS exports | Not re-run with `node tools/ds/source.mjs`; ux/10 itself warns of version drift (1.5.1 vs 1.6.5). Exports named in section 10 must be re-verified before any build |
| Click counts | Estimates by a prepared user; no timing study |
| Documents not read line by line | `ux/02, 04, 05, 06, 08, 09, 12`; old variant bodies; `ux/01` beyond line 150; `ux/07` beyond S-03; `ux/10` beyond line 135 |
| Visual rendering | Nothing here was rendered or axe-checked. No GREENLIGHT of any kind is claimed |
