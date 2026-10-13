# Product architecture, Variant C: "Workbench" (inbox first, one cohort board, thin configuration)

Date: 2026-10-09 · Author: design worker (spec mode, variant C) · Status: proposal for Romit's decision. Nothing built, nothing tested with users.
Scope: the OVERALL product architecture of Prism Skills Tracking (navigation, sections, roles, object model, where each requirement lives). It is not a single-page redesign.
Tags: `[REQ id]` requirement · `[OD-n]` open decision (never decided here, each is a seam) · `[PROTO]` Sankalp's prototype · `[CALL 09-23]` raw transcript · `[MOBBIN name]` viewed Mobbin screen · `[BUILD]` read in `admin/` · `[INFER]` my inference.
Precedence unchanged: behaviour REQ > CALL > PROTO > INFER. This file changes structure and navigation only. Reading done: docs/README, strategy 01, 02, 05, 07, journeys 01 to 03, ux 01, 03, 07, 10, 11, design/brief-v2, design/mobbin-evidence, build/ds-shell-anatomy, `admin/lib/skills-nav.tsx`, `admin/lib/home/derive.ts`, the 2026-09-23 raw transcript.

---

## 1. Thesis and the one question

**Thesis.** After the first week, a skills program is run by exceptions: a handful of things need a person (an approval, an unconfigured skill, an unrecognised lab instructor, an offering with nothing mapped), and one question about the cohort needs a fast answer (who has what). So the product is **three work surfaces**: an **Inbox** where every human decision lives, a **Cohort board** where student x skill is the working canvas, and a thin **Configuration** area visited rarely. One **Record view** panel (student > skill > evidence > evaluation) opens from all of them, so nothing is a separate report. Students and evaluators get purpose-built focused flows, never the admin shell `[REQ EV-01]`.

**The one question this architecture optimises for:** *"What is waiting on me, and can I clear it without leaving this page?"* It optimises for the **weekly user**, and knowingly gives the **setup user** (once per program) a queue instead of a guided path.

Relationship to `brief-v2`:
| brief-v2 | Variant C |
|---|---|
| Direction A guided setup | **Departs.** No journey page, no go-live gate. Setup is the first thing the Inbox shows, worked as a queue. Borrows A's kit idea (group configure) as a batch action inside the queue `[IM-14]` |
| Direction B action-first (Today) | **Builds on.** The Inbox is B's Today, but it is the whole home, not a tab of one |
| Direction C matrix | **Builds on, and promotes.** brief-v2 puts the matrix last as an Attainment view pending a density test. Variant C makes it the central canvas, so it **consciously accepts the highest design risk** (no precedent at scale, see section 7 gap and section 9 risks) and adds a scoping rule to contain it |
| Hybrid recommendation | Variant C is a rival to the hybrid: the hybrid keeps a Home with two states and five nav rows; C deletes Home and has three rows |

---

## 2. Architecture map

DS shell for all admin surfaces `[BUILD docs/build/ds-shell-anatomy.md]`: utility bar (full width), flat primary rail rows, optional `SecondaryPanel`, page header. Persona switching stays in the profile menu, not in the rail.

### 2.1 Administrator and reviewer (one Prism login, reviewer = admin acting in the approval role `[REQ AR-01]`)

```
PRIMARY RAIL (3 rows, expanded by default)        TYPE        BADGE
 Inbox                                            page        total of actionable items (see rule below)
   secondary panel = queues (depth 2)
   ├ All                                          queue view  n
   ├ Approvals                                    queue       n   hidden unless any skill has approval on [SC-15]
   ├ Skills to configure                          queue       n   [IM-10]
   ├ Import lines not read                        queue       n   [IM-08]
   ├ Offerings with no skills                     queue       n   [INFER]
   ├ Lab instructors to adopt                     queue       n   [SL-09]
   └ Waiting on evaluators (awareness, not counted)  view     n   display only, no resend [REQ §14] [OD-18]
 Cohort board                                     page
   lens control (ViewSegmentedControl, not nav):  Matrix | Students | Skills | Tags   [RP-02 RP-03 RP-04]
   Record view                                    panel       opens in place, never a route change
 Configuration                                    page with secondary panel (depth 2)
   ├ Skills            (library list, search, filters)      [SL-10]
   │    Import · Add skill                        dialogs     [IM-01 IM-12]
   │    Configure one skill                       sheet       [SC-01 to SC-19]
   ├ Kits                                         tab/list    saved configurations to apply to many [IM-14]
   ├ Categories                                   list+dialog [SL-03 SL-05 SL-06]
   ├ Tags                                         list+dialog [SL-04 SL-05 SL-06]
   ├ Clinical settings                            list+dialog [SL-07]
   ├ Lab instructors                              list+dialog [SL-08 SL-09]
   └ Course mapping                               list + offering editor panel [CM-01 to CM-08]
UTILITY BAR (not nav): Search/command menu (jump to a student or a skill) · scope switcher · profile (Switch view, Appearance)
```

Rules for counters `[INFER]`:
- The Inbox badge counts only items a person can decide. "Waiting on evaluators" is excluded: the admin cannot act on it, because reminders and escalation are out of scope `[REQ §14]` and resend is `[OD-18]`.
- Counts are numbers, never a progress bar. A library that is 80 skills unconfigured shows "80", and the number falling is the progress.
- Open point (section 10): one summed badge lets 80 unconfigured skills drown 3 approvals. Test before deciding (section 9).

Page, tab, panel, dialog:
| Thing | Container | Why |
|---|---|---|
| Inbox, Cohort board, Configuration | page | The three places a person works |
| Queue (Approvals, Skills to configure ...) | secondary-panel item that filters one list | Klaviyo-style rail plus list `[MOBBIN Plane]` |
| Record view | non-modal side panel (`FloatingSheetPanel`) | List or board stays visible; replaces stacked dialogs `[REQ RP-06]` ("without leaving the report") |
| Batch configure editor | right-side panel inside the queue | Edit N skills while the pool stays visible `[REQ IM-14]` |
| Configure one skill | sheet (exception path) | Heavy form with live preview `[REQ SC-19]` |
| Import input and review | dialog | Matches prototype parity `[PROTO]`; its output is a queue, not a page |
| Add/edit category, tag, setting, instructor | dialog | Small entity forms `[PROTO]` |
| Matrix lens vs Students/Skills/Tags | segmented control on one page | Four lenses of one dataset share filters `[REQ RP-01]` |

### 2.2 Student (own login, own shell, mobile-first `[INFER]`)

```
PRIMARY RAIL / BOTTOM TAB BAR (2 rows)             TYPE
 My skills                                         page: worklist on top, whole record below     badge = returned count
   ├ Skill record (history)                        panel    [SH-01 to SH-07] student-scoped Record view
   └ Log evidence                                  sheet    [ST-04 to ST-13], floating primary, also reachable from a course
 Courses                                           page: list of the student's courses
   └ Course skills                                 page     mapped Mandatory / Non-mandatory, then Other skills [ST-01 to ST-03]
```
Courses also appears as a "Skills" section inside the existing Prism course page `[CALL 09-23]`, placement `[OD-P1]` open.

### 2.3 Evaluator (no login for preceptor and lab instructor `[REQ EV-01]`)

```
Email (S-18) ──token link──▶ Evaluation form (S-16), one page, no shell, no nav, nothing else reachable
                              student context + self-evaluation ▸ one block per skill ▸ comment ▸ Submit ▸ "counts now" or "held for approval" [EV-07]
Clinical faculty already in Prism [REQ §7 intro]: same form inside the shell, entered from the same email link.
  Seam only [INFER]: a faculty "Requests" list is NOT specified by REQ and is not designed here.
```

---

## 3. Object model as the user sees it

Nouns the user meets, and which are first-class pages (own URL) versus things that appear inside others.

| Noun (user's word) | What it is | First-class page? | Lives in |
|---|---|---|---|
| Skill | Program-defined item, configured or not `[REQ SL-01 SC-01]` | No: row in Configuration > Skills, or queue item | Configuration, Inbox, board column |
| Kit | Saved configuration you apply to several skills `[REQ IM-14]` `[INFER]` name | No: list in Configuration > Kits, applied from a queue | Configuration, Inbox |
| Category, Tag | Grouping, cross-cutting `[REQ SL-03 SL-04]` | No | Configuration; board column groups and filters |
| Clinical setting, Lab instructor | Program lists `[REQ SL-07 SL-08]` | No | Configuration; instructor adoption in Inbox |
| Course offering | Code, term, cohorts `[REQ CM-01]` | Editor panel, URL-addressable | Configuration > Course mapping; Inbox queue |
| Cohort | Group of students | No: a scope control | Cohort board header |
| Student | Person with one record per skill `[REQ CM-07]` | **Record view, level 1** | Board row header, Inbox item |
| Student x skill record | Status derived from evidence `[REQ AE-04]` | **Record view, level 2: the unit of the product** | Board cell, Inbox item, student's own My skills |
| Submission / evaluation | One attempt and its immutable result `[REQ RV-03]` | **Record view, level 3** | Inside the record |
| Review decision | Approve or Return with note `[REQ AR-05]` | No: footer of the Record view when item is pending | Inbox > Approvals |
| Evaluation request | Token link to an evaluator `[REQ EV-01]` | The evaluator page (outside shell) | Email |

**The Record view is the "unified record".** One panel, three levels, one breadcrumb `Priya Tran > Foley catheter insertion > 05-11 evaluation`. It carries: derived status (four states, `[OD-03]` flag), the rule in words (needs vs has, per level, per named setting `[REQ SH-05]`), the evidence ledger `[REQ RP-06]`, the full evaluation `[REQ RP-07]`, and, only when the item is awaiting approval, the decision footer `[REQ AR-01 to AR-05]`. Approving an item from the Inbox and inspecting a cell from the board are the same panel with the same data. The student's Skill record is the same component scoped to one person `[REQ SH-06 SH-07]`.

---

## 4. Wireframes

Conventions: `[Text]` = button, text only (no icons on CTAs). One filled primary per surface, marked `(filled)`. Status carries text, never colour alone. No red in status viz.

### 4.1 Admin landing: Inbox (all queues, an approval open in the Record view)

```
┌ Utility bar ─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] [(E) Clinical Education ▾]  Inbox                       [Search ⌘K] [Bell] [?] [Ask Leo]  [Sample Univ. ▾] [RS ▾] │
├─────────────┬──────────────────────┬─────────────────────────────────────────────┬─────────────────────────────────┤
│ Rail        │ Queues (secondary)   │ Inbox                                       │ Record view (non-modal)      ✕  │
│             │                      │ 21 decisions waiting                        │ Rina Okonkwo > IV insertion     │
│ ● Inbox  21 │ ● All            21  │ ┌ filter: course ▾ skill ▾ differs only ☐ ┐ │ NURS 350 · Clinical · Outpatient │
│   Cohort    │   Approvals      16  │                                             │ Evaluator J. Delgado (Preceptor) │
│   board     │   Skills to       2  │ Approvals (16)               ☐ select agreeing (12) │                           │
│   Configu-  │     configure       │ ☑ Noah Zeller   Foley          Agree  NURS 350 │ Status: In progress             │
│   ration    │   Offerings with     │ ☑ Mei Tanaka    Wound care     Agree  NURS 350 │ Needs 5 demonstrations; has 4   │
│             │     no skills     1  │ ☑ ...           (12 agree)                      │ Independent 4 of 3 · With assist.│
│             │   Lab instructors    │ ☐ Rina Okonkwo  IV insertion   Differs NURS 350 │ 1 of 1 · Observed 2 of 1        │
│             │     to adopt      2  │ ☐ Jonah Nakamura IV insertion  Differs NURS 350 │                                 │
│             │   Import lines       │                                             │ Student rated: With assistance  │
│             │     not read      0  │ Skills to configure (2)                     │ Evaluator rated: Independent    │
│             │                      │ ○ Sterile dressing change   unconfigured    │ Differs. Both retained.         │
│             │ Awareness            │ ○ Nasogastric tube care     unconfigured    │ ▸ See the full responses        │
│             │   Waiting on         │                                             │ ▸ Evidence ledger (5)           │
│             │   evaluators      7  │ Offerings with no skills (1)                │ Review note [optional_________] │
│             │                      │ ○ NURS 420 Fall 2026        0 mapped        │ [Return for correction] [Approve]│
│             │                      │                                             │                       (filled) │
│             │                      │ [Approve 12 selected]  (filled)             │                                 │
└─────────────┴──────────────────────┴─────────────────────────────────────────────┴─────────────────────────────────┘
```
Notes:
- Two filled primaries appear (bulk Approve, and Approve in the panel). Rule: when the Record view is open, the bulk button drops to outline `[INFER, brief-v2 P-08 pattern]`.
- Agreement grouping and "approve agreeing" come from `[REQ AR-02]` and brief-v2 screen 5. "Return for correction" is neutral wording until `[OD-16]`.
- Empty state per queue is positive and specific: "Nothing waiting in Approvals" `[MOBBIN Oyster, brief-v2]`.
- Nothing here says a student is "behind" `[OD-27]`.

### 4.2 Core working screen: Cohort board with the Record view open

```
┌ Utility bar ─────────────────────────────────────────────────────────────────────────────────────────────────────┐
├─────────────┬────────────────────────────────────────────────────────────────────┬────────────────────────────────┤
│   Inbox  21 │ Cohort board                                       [Export ▾]      │ Record view                 ✕  │
│ ● Cohort    │ Cohort [BSN 2027 ▾]  Scope [Course: NURS 350 ▾]                    │ Priya Tran > Foley catheter     │
│   board     │ ( Matrix | Students | Skills | Tags )          [Filters ▾]         │                                 │
│   Configu-  │ Applied: Cohort BSN 2027 ✕   Course NURS 350 ✕   Setting any       │ ▲ Evidence does not qualify     │
│   ration    │ 40 students · 9 skills in scope · evidence from all settings       │ 2 evaluations, 0 qualify        │
│             │ ┌ Students ┬ Skills in scope ┬ All achieved ┬ Under half achieved ┐ │ Rule: all 3 questions Yes.      │
│             │ │ 40       │ 9               │ 0            │ 6 skills            │ │ Needed: 3 qualifying.           │
│             │ └──────────┴─────────────────┴──────────────┴─────────────────────┘ │                                 │
│             │              Procedures (4)            │ Assessment (3)  │ ...       │ Evidence ledger                 │
│             │ Student ▲     Foley  IV   Wound Trach  │ Vitals Pain  .. │           │ 05-11 Clinical · Outpatient     │
│             │ Noah Zeller   ✓ 5/3  ✓ 5/5 ◐ 4/4 ✓ 3/3│ ✓      ✓    ..  │           │   J. Delgado: 2 of 3 Yes        │
│             │ Priya Tran    ▲ 0/3 ◐ 2/5 ○    ○      │ ○      ○    ..  │ ◄ selected │ 05-02 Lab · Simulation          │
│             │ Milo Whitfield○ 0/3 ✓ 5/5 ◐ 4/4 ○      │ ✓      ◐    ..  │           │   K. Larsen: 1 of 3 Yes         │
│             │  ...  (rows sortable: fewest achieved first)               │           │ [Open 05-11 evaluation]         │
│             │ Achieved      31 of 40  35 of 40 ... (footer count per skill)          │                                 │
│             │ Legend: ✓ Achieved  ◐ In progress  ▲ Evidence does not qualify  ○ No evidence yet   • waiting approval │
└─────────────┴────────────────────────────────────────────────────────────────────┴────────────────────────────────┘
```
Rules:
- **Scoping rule `[INFER]`:** the board never draws cohort x whole library. It is always one cohort x one scope (a course, or a category) so the grid is about 40 x 15, not 150 x 100. "All skills" shows category column groups collapsed to a count (for example "Procedures 4: 31 of 40 achieved all four") that expand in place. Full scale has no precedent (section 7).
- Cells are glyph plus count text (`5/3` = qualifying over required for the headline criterion) and always carry an accessible label; glyph set is the four states of `[REQ AE-04]` and collapses to three under the `[OD-03]` flag. Amber/neutral, never red `[feedback_aarti_no_red]`.
- Footers use counts ("31 of 40"), not percentages `[workspace rule: frequency counts]`.
- Location and setting filters recalculate and explain impossible combinations in place `[REQ RP-08 RP-09]`. No evaluator or site columns `[OD-11]`.
- Export: popover with "Aggregate" and "Evidence detail", exports the full filtered scope and records the filters `[REQ RP-10]`; format `[OD-10]` open.
- Lens "Students" and "Skills" are the existing table views reused (counts per student, counts per skill) `[REQ RP-02 RP-03]`; "Tags" states that figures overlap `[REQ RP-04]`.

### 4.3 Student landing: My skills (mobile)

```
┌───────────────────────────────┐
│ My skills                     │
│ Counted 7 · Waiting 2 · Returned 1  [REQ SH-04]
│ ─ Returned (1) ─────────────  │
│ IV insertion · NURS 350       │
│ Reviewer asked for a correction│
│ [Revise and resend]           │
│ ─ Waiting (2) ──────────────  │
│ Foley · J. Delgado, 2 days    │
│ Wound care · lab · K. Larsen  │
│ ─ Still needed now (3) ─────  │
│ Foley       1 more qualifying │
│ Wound care  4 of 4, not yet:  │
│   1 in Emergency, 1 in Inpat. │
│ Trach care  none yet          │
│ ▸ Whole record (10 skills)    │
│                    [ Log ]    │  floating, filled
├───────────────────────────────┤
│ My skills            Courses  │
└───────────────────────────────┘
```
`[REQ ST-01 SH-02 SH-03 SH-05 RV-01]`. Waiting names the person `[REQ SH-02]`. Failed rule stated, not just a bar `[REQ SH-03]`.

### 4.4 Evaluator (mobile, no shell)

```
┌───────────────────────────────┐
│ Sign off 3 skills             │
│ Olivia Martin · NURS 350      │
│ You are J. Delgado (Preceptor)│
│ Student supplied: 05-11, Unit 4│
│ ─ 1. Foley catheter ────────  │
│ Performs preparation?         │
│ [   Yes   ]  [   No   ]       │
│ Comment (required)            │
│ [___________________________] │
│ ─ 2. IV insertion ──────────  │
│ ...                           │
│ After you submit: Foley counts│
│ now; IV goes to the           │
│ administrator.        [EV-07] │
│ [   Submit 3 skills   ]       │
└───────────────────────────────┘
```
`[REQ EV-01 EV-03 EV-04 EV-05 EV-06 EV-07]`. The evaluator is not shown the student's achievement status `[OD-17]` (the prototype does, `[DEFECT-05]`). Link lifecycle `[OD-18]` is a seam.

### 4.5 Supporting wireframe: first-run and batch configure inside the Inbox (the setup path)

```
FIRST RUN (empty library)                        AFTER IMPORT (80 skills, Skills to configure queue)
┌ Inbox ───────────────────────────┐            ┌ Skills to configure (80) ─────┬ Configure 22 selected skills ──────┐
│ Your program has no skills yet.  │            │ ▾ Procedures (22)     ☑ all   │ Evaluation model (choose one)       │
│ Prism does not supply any.       │            │   ☑ IV insertion              │ [Binary][Question][Scored][Demonstr.]│
│ [Import a list]  (filled)        │            │   ☑ Foley catheter  ...       │ no default is pre-selected [SC-02]  │
│ [Add a skill]                    │            │ ▸ Assessment (30)             │ Levels  1 Observed 2 Assisted 3 Indep│
│                                  │            │ ▸ Communication (28)          │ Needs   5 total · 1 obs · 3 indep.  │
│ Then in this order, as queues:   │            │                               │ Student supplies  Date* Unit*       │
│  Skills to configure             │            │ [Save as kit]                 │ Preview: student | evaluator        │
│  Offerings with no skills        │            │                               │ Impact: 0 students affected         │
└──────────────────────────────────┘            │                               │ [Apply to 22 skills]  (filled)      │
                                                └───────────────────────────────┴─────────────────────────────────────┘
```
Hard stops visible here: no list is pre-filled `[REQ SL-01]`, model never defaulted `[REQ SC-02]`, creation separate from configuration `[REQ SC-01]`, import output is a draft confirmed by a person `[REQ IM-13]`, Import never proposes models `[OD-12]`.

---

## 5. Three journeys through the IA

Counting convention `[INFER]`: one interaction = one click, one selection, or one field entry. Estimates, not measured. Baseline from `friction-baseline.md`: about 2,000 interactions to set up 100 skills in the current build.

### 5.1 First hour: set up 80 skills

| # | Step | Where | Interactions |
|---|---|---|---|
| 1 | Land on first-run Inbox, click "Import a list" | Inbox | 1 |
| 2 | Choose file, upload | Import dialog `[REQ IM-02]` | 2 |
| 3 | Review: fix about 5 rows, resolve duplicates, read "lines not read" | Import review `[REQ IM-05 to IM-08]` | about 10 |
| 4 | Confirm "Create 80 skills" | Import review | 1 |
| 5 | Land in Skills to configure (80), grouped by detected category | Inbox queue `[REQ IM-10]` | 0 |
| 6 | Per kit (4 kits of about 20): tick group, choose model tile, enter levels and criteria, student fields, Apply | Queue + batch editor `[REQ IM-14]` | about 20 each = 80 |
| 7 | Exceptions: about 8 skills differ, each edited in the sheet | Configure sheet | about 6 each = 48 |
| 8 | Open "Offerings with no skills" (6 courses), per offering: pick skills by category or kit, set Mandatory, save | Queue + offering panel `[REQ CM-01 CM-03]` | about 7 each = 42 |
| | **Total** | | **about 185** (about 90 percent below the 2,000 baseline) |

Honest comparison: this is the same order of effort as Direction A (about 180). C does not make setup cheaper. It makes the **end state** (empty queue) clear and reuses the weekly surface. What it loses is A's explicit path: nothing says "you are 60 percent done" except falling counts, and the first-time buyer may open the Inbox, see 80 items and not know what to do first (risk R1).

### 5.2 Weekly review and who is behind (the optimised path)

| # | Step | Where | Interactions |
|---|---|---|---|
| 1 | Open the product: lands on Inbox, All | Inbox | 0 |
| 2 | Open Approvals | Queue | 1 |
| 3 | Select the 12 that agree, Approve selected, confirm | Approvals | 3 |
| 4 | 4 that differ: open, read compare, optional note, Approve or Return | Record view | 3 each = 12 |
| 5 | Open Cohort board; cohort and course are remembered | Board | 1 |
| 6 | Sort by fewest achieved, filter "No evidence yet" | Board | 2 |
| 7 | Click the student, then the cell, read the rule and ledger | Record view | 2 |
| | **Total** | | **about 24** (about 16 to clear 16 approvals; 5 to find a student and their evidence) |

"Behind" is not defined: the board sorts and filters, it does not label anyone `[OD-27]`.

### 5.3 Accreditation visit: pull evidence for a cohort and skill

| # | Step | Where | Interactions |
|---|---|---|---|
| 1 | Cohort board, choose cohort | Board | 2 |
| 2 | Scope: category "Procedures" | Board | 1 |
| 3 | Lens "Skills": counts achieved per skill | Board `[REQ RP-03]` | 1 |
| 4 | Click a skill, then a student, then the evaluation: full responses and feedback | Record view `[REQ RP-05 to RP-07]` | 3 |
| 5 | Export "Evidence detail": rows per evaluation, filters recorded in the header | Export popover `[REQ RP-10]` | 2 |
| | **Total** | | **about 9** |

Boundary: Prism offers filtered exports with provenance, not accreditation-ready outputs `[REQ §14]`. Format `[OD-10]`.

---

## 6. Inventory: every surface S-01 to S-18, plus Home and Kits

| ID | Surface | Placement in Variant C | Change vs current build |
|---|---|---|---|
| S-01 | Overview (attainment) | **Cohort board**, lenses Students, Skills, Tags | Rename; tables reused; Matrix lens new |
| S-02 | Student drill-down | Record view, level 1 (student) | Dialog becomes a side panel |
| S-03 | Evidence ledger and evaluation detail | Record view, levels 2 and 3 | Dialog on dialog becomes one panel with breadcrumb |
| S-04 | Library skills list | Configuration > Skills | Moved from the Skills tab |
| S-05a, S-05b | Categories, Tags | Configuration > Categories, Tags | Tabs become secondary-panel items |
| S-06 | Clinical settings | Configuration > Clinical settings | Same |
| S-07 | Lab instructors roster | Configuration > Lab instructors, plus Inbox "Lab instructors to adopt" `[REQ SL-09]` | Adoption surfaces as a queue |
| S-08 | Import | Dialog from first-run Inbox and Configuration > Skills; output is a queue | Same dialog, new entry and exit |
| S-09 | Skill configure | Batch editor in the Skills to configure queue (new) plus single-skill sheet (reused) | Batch mode new, departs from prototype parity |
| S-10 | Course mapping | Configuration > Course mapping, and Inbox queue "Offerings with no skills" opens the same editor | Reached from two places |
| S-11 | Review and approve | Inbox > Approvals, decision in Record view footer | Cards become list plus panel |
| S-12 | Student course skills | Student > Courses > course | Reused, re-parented |
| S-13 | Student send for review | Log evidence sheet (floating primary on My skills and Course skills) | Reused |
| S-14 | Student skill history | Skill record panel from My skills | Dialog becomes panel |
| S-15 | Student my skills | **Student landing**, worklist added above the record | Rebuilt as worklist |
| S-16 | Evaluator form | Outside the shell `[REQ EV-01]` | Reused |
| S-17 | Export | Popover on the Cohort board (no route) | Reused |
| S-18 | Request email | System, carries the S-16 link | Unchanged |
| HY-01 | Home (setup card + attention list) | **Cut as a page.** Its attention list is the Inbox; its setup card is the first-run Inbox state | Replaced |
| Kits | Kits tab on Skills | Configuration > Kits; applied from the queue | Moved |
| (current) Reviews nav row | Cut as a top-level row; Approvals queue | Replaced |
| (current) Courses nav row | Configuration > Course mapping | Demoted |

Cut with a reason: only the **Home page** and the **Reviews and Courses top-level rows**. Home is cut because with three rows its content is the Inbox. Reviews and Courses are cut as rows because they are worked from the Inbox and revisited rarely. Nothing in S-01 to S-18 is cut.

---

## 7. Mobbin analogies (viewed 2026-10-09, web unless stated)

Honest statement: none is clinical education, none has a no-login external evaluator, and none has a people x requirements grid at 40 x 15 with an evidence panel and approvals in one product. Fit is judged on **product-level structure** and against 40 to 200 skills and cohorts of about 40.

| Product (link) | IA seen in the image | What transfers | What does NOT transfer | Fit |
|---|---|---|---|---|
| Workable inbox (https://mobbin.com/screens/7b975936-c6ee-4718-a116-64fe2e0f7ffa) | Top nav Jobs, Candidates, Employees, Reports; Inbox with Inbox 6 / Important 6 / To-dos 3 filters, one row per item with inline decision icons | Inbox as a counted work list with typed items and inline actions, among a thin set of top-level areas | Row actions are icon-only; items are notifications (calls, time-off), not evidence decisions. Top-bar nav, not the DS rail | **Strong** (for the Inbox concept), Partial for the shell |
| Plane inbox (https://mobbin.com/screens/9159d945-51d0-48d9-9aac-6d13e0d86538) | Rail, secondary list (Home, Inbox, Your work), inbox list left, empty "Select to view details" pane right | List plus detail pane inside a secondary-nav shell, the same shape as Inbox plus Record view | Issue tracker, tiny list, no bulk | **Partial** |
| Vanta Controls (https://mobbin.com/screens/0e24849e-96f6-4350-8e77-727f29293b4c) and Frameworks (https://mobbin.com/screens/81eef2c5-a55a-481a-adb0-f6f0ab257226) | Compliance group with Frameworks, Controls, Policies, Documents, Audits; KPI cards above a table; per-control "Evidence readiness 2/2, 1/3" | Requirement rows with n of N evidence readiness, drill to evidence, audit as a nav item; supports the accreditation pull | Control-centric, not person-centric; no per-person grid; its nav is a long list (opposite of three rows); donut (we avoid) | **Partial** (strong for evidence, weak for IA depth) |
| Elicit screening table (https://mobbin.com/screens/b0a2439c-e5a4-4a07-a176-6222138fe763) | Rows x criteria columns with Yes / Maybe / No chips, right panel for columns | A rows x criteria matrix with text chips plus a side panel is a working pattern | 3 columns, tens of rows, one user; no counts per cell | **Partial** |
| SchoolAI session view (https://mobbin.com/screens/7e71261b-469e-4bb4-bf36-68ff9d4aa7a9) | Students grouped by level (Beginning, Developing, Proficient, Excelling, Not started), outcome dots per student, insights panel right | Grouping people by derived state as an alternative to a heat grid; side insights panel; textual state names | One class activity, 3 students; AI-written insights (not allowed to invent here); dots are colour-led | **Partial** (alternative lens, not the canvas) |
| Slite knowledge management (https://mobbin.com/screens/784fd37d-3429-4f47-b58c-0b6fc0ffed07) | Quick-filter tiles (Outdated, Verification expired, Verification requested, Empty) above a list; select rows, bulk bar "Change status / owner" | Tiles that double as queue filters with counts; selection bar for bulk action | Documents, not people; tile colours are pastel-coded | **Partial** |
| Twenty tasks (https://mobbin.com/screens/ededb987-eca2-4c04-b352-545c2b874c02) | CRM rail, table, record panel opens on the right with fields | Table row opens one record panel, same shape as the Record view | Generic record, no derived status | **Partial** |
| Homerun / Wellfound / folk / Deputy applicants (https://mobbin.com/screens/80dfe542-7c1b-4303-a449-b4f465d615fe, https://mobbin.com/screens/a73951e3-5683-46ac-99bf-2b13b79343c5) | Kanban stages, a To-dos item beside Candidates in the rail (Homerun) | Rail with a separate To-dos entry beside the main object | Kanban stages do not fit skills (no linear pipeline; Prism skills have a derived 4-state status, not stages) | **Weak** |
| Asana inbox (https://mobbin.com/screens/c7bcaf87-9928-407c-823a-bc1491fe566d) | Home, My tasks, Inbox in the rail; Inbox is a notification feed with Activity, Bookmarks, Archive | Inbox as a named rail row | A feed of events, not a work queue with decisions; read/unread blue dots are the wrong model for "needs a decision" | **Weak** |
| Employment Hero compliance report (https://mobbin.com/screens/8ed3e501-b10d-4d8e-8efd-19796a230e12) | Compliance report: donut chart, filter row, personnel table with "Overdue" and a Remind action | Filterable personnel x document status table | Remind is reminders (out of scope `[REQ §14]`); donut chart; icon-rail nav | **Weak** |
| External form via email link, mobile (iOS: IKEA https://mobbin.com/screens/6d051fb2-125f-40ae-8155-8838dcf5200f, Superpower https://mobbin.com/screens/e77d607a-8d5a-43f2-b07b-107cba8c178f) | Single-question mobile form, one primary at the bottom | Large single primary and one concern per screen | These are in-app flows after sign-in, not guest forms | **Weak**; **no reference exists** for a tokenised, no-login evaluator entry (same gap as `docs/design/mobbin-evidence.md` job type 7) |
| **Gap** | | | No product found with approvals, a cohort x skill grid and student self-service as one product. No grid shown at 40 x 15 with counts in cells | Design is ours; test it (section 9) |

Net: the **Inbox + record panel** half is well supported; the **matrix as central canvas** half is not. That asymmetry is the main reason the variant is risky.

---

## 8. Requirement coverage

Reminder: `SH` in the requirements is **student history and tracking** (section 10 of the REQ), not "sharing".

| REQ area | IDs | Where it lives in Variant C |
|---|---|---|
| SL skills library | SL-01 to SL-11 | Configuration > Skills, Categories, Tags, Clinical settings, Lab instructors. SL-09 adoption also as Inbox queue. SL-11 deactivation: removes from mapping, student selection, board scope; evidence kept |
| IM import | IM-01 to IM-15 | Import dialog; result is the "Skills to configure" and "Import lines not read" queues; IM-14 as the batch editor and Kits; IM-15 stays `[OD-12]` (no model proposals) |
| SC configure | SC-01 to SC-19 | Batch editor (queue) and single-skill sheet; lineage and live preview `[REQ SC-17 SC-19]` stay in both |
| CM course mapping | CM-01 to CM-08 | Configuration > Course mapping; Inbox "Offerings with no skills". CM-08 carry-forward is `[OD-01]`: only an explicit copy action, never automatic |
| ST student | ST-01 to ST-14 | Student Courses > Course skills, Log evidence sheet; ST-14 `[OD-07]` seam on the sheet |
| EV evaluator | EV-01 to EV-08 | Evaluator page outside the shell; EV-08 `[OD-06]` roles as data |
| AR approval | AR-01 to AR-06 | Inbox > Approvals plus Record view footer |
| RV revision | RV-01 to RV-06 | Student My skills (Returned) and Skill record; RV-03 immutability enforced in Record view (no edit controls); RV-06 `[OD-08]` seam |
| SH student history | SH-01 to SH-07 | Student My skills and Skill record panel; counted, waiting, returned, did not meet `[REQ SH-02 SH-04]`; setting progress `[REQ SH-05]`; all-courses toggle `[REQ SH-06]` |
| RP reporting | RP-01 to RP-11 | Cohort board (lenses, filters, drill, export); RP-09 explanation in place; RP-11 `[OD-10]` |
| AE achievement engine | AE-01 to AE-08 | Not a surface: it is the derivation behind every status glyph and Record view rule text; AE-08 `[OD-03]` flag |

**Homeless:** none. **Weakly homed (to resolve before build):**
1. A student's cross-course toggle (`[REQ SH-06]`) fits My skills, but the course page Courses > Course skills must also link into it.
2. The faculty-in-Prism entry (`[REQ §7 intro]`) has no list surface here (section 2.3).
3. `[OD-19]` batch sign-off (students x skills grid for lab instructors): the Cohort board is the natural home but it is not in the REQ, so it is a seam only, not a feature.

Open decisions held as seams (none decided): OD-01 explicit copy only · OD-03 glyph flag · OD-11 no evaluator or site columns · OD-12 no model proposals · OD-15 no separate activation step designed (configured + active) · OD-27 no "behind" label, sort and filter only. OD-02 (competency link), OD-05, OD-06 unaffected; OD-18 no resend.

---

## 9. DS implications, reuse versus rebuild, strengths, risks, test

### 9.1 DS components
| Need | Component | Note |
|---|---|---|
| Rail, secondary panel, page header | `AppSidebar`, `SecondaryPanel`, `PageHeader` `[BUILD ds-shell-anatomy]` | Inbox and Configuration use `NavLinkItem.secondaryPanel`; nav badge exists in `skills-nav.tsx` |
| Inbox list, bulk bar | `DataTable` with selection, `Checkbox`, `Badge`/`BadgeCount` (selection tallies only) | Rows carry no filled buttons |
| Record view | `FloatingSheetPanel`, `Breadcrumb`, `Accordion`, `StatusBadge` | Skill-status tones: neutral, warning, info, success; no red `[ux/10]` |
| Lens control | `ViewSegmentedControl`, `FilterBar`, `KeyMetrics` (max 4) | |
| Model picker | `SelectionTileGrid interaction="radio"` | No default selected |
| Feedback | `LocalBanner` (never toast) | |
| Matrix | **Hand-roll** virtualised ARIA grid: roving tabindex, cell labels | Not a DS component; highest hand-roll cost |
| Not exported (do not assume) | `Stepper`, `Progress`, `MultiSelect`, `Combobox`, `FileUpload`, `EmptyState` | Reuse `SkillsMultiPick`, `SkillsFileUpload`, vendored empty state per `ux/10` |

### 9.2 What from the current build is reused or rebuilt `[BUILD]`
| Part | Verdict | Cost | Why |
|---|---|---|---|
| Shell (utility bar, switchers, profile menu, view chip) | Reuse | S | Nav config is one function `buildSkillsNav` |
| Engine, store, selectors, seed | Reuse | S | `homeSummary` already derives unconfigured, unread lines, approvals, named instructors, offerings without skills `[BUILD lib/home/derive.ts]`; the Inbox is mostly a new view over these |
| Home (setup card, attention list) | Rebuild into the Inbox | M | Logic reusable, layout is a list plus panel |
| Skills page tabs, Kits | Re-parent to Configuration | S | Components in `components/library/*` move behind a secondary panel |
| Configure wizard sections and previews | Reuse, add a batch editor | M | `components/configure/*` has apply and copy dialogs `[BUILD]`; a right-side batch editor with an impact list is new |
| Courses mapping workspace | Reuse in Configuration, add panel entry from Inbox | S | |
| Attainment tables, filters, KPI, export | Reuse as the Students, Skills, Tags lenses | S | |
| **Matrix grid** | New | **L** | Hand-rolled, virtualised, ARIA grid, keyboard, density test |
| **Record view** (S-02, S-03, S-14, review detail unified) | Rebuild from `report-dialogs` (722 lines), `history-dialog`, `review-card` | **M to L** | The unification is the core idea; today these are three separate dialogs |
| Reviews list and compare card | Reuse compare card and responses list, rebuild queue | M | |
| Student views, send dialog | Reuse, add the worklist header and bottom bar | M | |
| Evaluator form | Reuse | S | |
| Overall | | **Medium to large**, dominated by the matrix and the Record view | Direction B alone is Medium (brief-v2) |

### 9.3 Strengths
- Fewest top-level places (3 admin rows, 2 student rows, 1 evaluator page): a new admin learns the product in one sentence.
- Everything that needs a person is in one place with one count, which matches the weekly job and the `[CALL 09-23]` need to see who lags.
- One Record view removes stacked dialogs and gives the student, admin and reviewer the same truth about a skill `[REQ CM-07]`.
- No requirement is weakened; hard stops are visible in the wireframes (no pre-fill, no default model, immutable evaluations, no login for evaluators).
- Most of the engine and selectors already exist.

### 9.4 Risks and what would make it fail
| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| R1 | First-time admin lands on 80 unconfigured items with no sequence | Adoption is decided in the first hour `[brief-v2 A]` | First-run state orders the three queues; order is visible, not a gate. Test it first |
| R2 | The matrix at scale is unproven | No precedent found `[MOBBIN gap]`; screen-reader navigation of thousands of cells | Scoping rule (about 40 x 15), category column groups, "Students" lens as the always-available table fallback |
| R3 | A grid reads as ranking students | Aarti's no-red and fairness cautions; `[OD-27]` unanswered | Counts and glyph text, no thresholds, no colour bands, no "behind" label |
| R4 | One summed badge hides approvals under unconfigured counts | A wrong number is worse than none | Test one badge vs per-queue counts |
| R5 | "Offerings with no skills" nags | Mapping is expectation, not eligibility `[REQ CM-05]` | Show as information, no urgency styling, dismissible per offering `[INFER]` |
| R6 | Configuration demoted: admins who do heavy mapping every term (42 offerings) find it buried | Rarely visited is an assumption | Inbox queue gives a direct entry; reassess after a term |
| R7 | Kits imply identical behaviour `[brief-v2]` | Over-application | Impact list before Apply; one-click exception |

**It fails if:** (a) coordinators cannot find their next action in the first 10 seconds in the Inbox, (b) the scoped matrix still takes more than a few seconds to scan for one student, or (c) the first-time setup feels unguided enough that users abandon at step 6.

### 9.5 Cheapest test with real users (5 users)
Method `[INFER]`: a click-through of the ASCII flows in Figma or static HTML over seeded data (no build; a throwaway page outside `admin/` if needed), 45 minutes each, think-aloud.
| # | Participant | Why |
|---|---|---|
| 3 | Program coordinators (at least one non-nursing, PA or OT, because the product must stay generic `[REQ SL-01]`) | Setup and weekly tasks |
| 1 | Clinical faculty or lab instructor | Evaluator view and batch need `[OD-19]` |
| 1 | Student (phone viewport) | Worklist and Log sheet |

Tasks and pass criteria (thresholds are proposals):
1. Cold start: "Here is a list of 80 skills. Get it ready for students." Pass: reaches batch editor unaided, picks a model without a default being offered, can say what is left.
2. Weekly: 16 approvals seeded (12 agree, 4 differ), 2 unconfigured, 1 empty offering. "Clear what needs you." Pass: finds the queue in under 10 seconds, explains Return's consequence.
3. "Which students are behind on Foley and why?" on the scoped matrix. Pass: names a student and the missing evidence in under 60 seconds; note whether the participant calls anyone "behind" from the glyphs alone.
4. Accreditation: "Show evidence for the cohort on IV insertion." Pass: reaches a full evaluation and an export with recorded filters.
5. Badge test: A/B single summed badge versus per-queue counts.
Add: a screen-reader and keyboard pass on the matrix prototype before any build commitment.

---

## 10. Open questions

**Sankalp**
1. `[OD-27]` How does a program define "behind" (threshold, date, per course)? The board only sorts and filters until this is answered `[CALL 09-23]` mentions "bottom 20 percent".
2. `[OD-15]` Is activation a state distinct from configured + active? The Inbox "Skills to configure" count assumes it is not.
3. `[OD-18]` Is read-only visibility of requests waiting on evaluators acceptable, with no resend and no reminders `[REQ §14]`?
4. Is an Inbox item for an offering with no mapped skills acceptable, given `[REQ CM-05]` says mapping never gates anything?
5. Is applying one explicit model to a group of skills consistent with `[REQ SC-01 SC-02]` (admin picks the model for the group, can override per skill)?
6. `[OD-P1]` Standalone app or section of Prism admin and student? It decides the rail, the product switcher and where Courses lives for students.

**Aarti**
7. Is a cohort heat grid acceptable at all, given the no-red and fairness cautions? Would a "Skills" lens count list (no per-student grid) satisfy her instead?
8. Are the four glyph states with text counts enough, or should the grid default to three states while `[OD-03]` is open?

**Vishaka**
9. How should the module sit in the Prism shell (product switcher, scope switcher) and may an admin-only product have an Inbox as its first row?

**Sarah (nursing SME)**
10. Do lab instructors need students x one skill batch sign-off `[OD-19]`? That would make the board a data-entry surface, not only a reading one.
11. Does a weekly approval load of about 16 match a real program, and do coordinators or faculty hold the approval role `[REQ §8]`?

## 11. What I could not verify
- Nothing was rendered, built or tested; click counts and effort sizes are estimates `[INFER]`.
- Mobbin images were viewed, but all are generic SaaS; none is clinical education, none shows a guest approval form from an email link, none shows a 40 x 15 status grid with evidence drill-down.
- The raw transcript is partly garbled Hindi and English; `[CALL 09-23]` statements used here ("bottom 20 percent", skills mapped to courses, student sends to preceptor) were read in the English passages only.
- Vault Decisions and Meetings notes were skimmed through `_Insights.md` lines, not opened one by one.
- DS prop-level API drift (1.5.1 vs 1.6.5) not re-checked; `docs/ux/10` carries a version warning.
- Whether `FloatingSheetPanel` supports a persistent right pane beside a `DataTable` at this width was not confirmed with `node tools/ds/source.mjs`.
