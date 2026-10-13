# Product architecture, Variant B: "Entity-first" (the Exxat entity layout pattern)

**Date:** 2026-10-09 · **Mode:** `/design-variants` spec (ASCII and rationale, no TSX, nothing published) · **Scope:** the OVERALL product architecture of Prism Skills Tracking (navigation model, roles, object model, where every requirement area lives), not one page.
**Status:** proposal for Romit. Not a confirmed contract. No `docs/build/contracts/` file covers it. Every `OD-*` stays OPEN and is built as a seam.
**Tags:** `[REQ id]` requirement · `[OD-n]` open decision, never treated as decided · `[PROTO]` prototype · `[CALL 09-23]` raw call transcript · `[CALL 03-05]` vault note · `[MOBBIN name]` Mobbin screen viewed 2026-10-09 · `[BASE-ENT]` `/Users/romitsoley/Work/docs/BASE-ENTITIES.md` · `[VAULT]` `~/Documents/research-repos/Memory/project_entity_layout_pattern.md` and `project_base_entity_decisions.md` · `[BRIEF-V2]` `docs/design/brief-v2.md` · `[INFER]` my inference, must be validated. Precedence REQ > CALL > PROTO > INFER.
**Sources read in full for this file:** `docs/README.md`, `strategy/01, 02, 05, 07`, `journeys/01, 02, 03`, `ux/01, 03, 07 (index and S-01 wireframe; the rest via ux/03), 10, 11`, `design/brief-v2.md`, `design/mobbin-evidence.md`, `design/kits-variants-2026-10-09.md` (header), `build/ds-shell-anatomy.md`, `admin/lib/skills-nav.tsx`, `admin/lib/skills-routes.ts`, the raw 2026-09-23 transcript (186 lines), `BASE-ENTITIES.md`, the two vault entity notes.

---

## 1. Thesis and the one question

```
 THESIS    A nursing program does not think in "pages of a module". It thinks in NOUNS: this skill,
           this student, this course, this preceptor. Make those four nouns the whole navigation. Each is a
           directory (find it) plus a detail page with the same tab shell (understand it, act on it).
           Review, configure and map are VERBS that happen on a noun page. Home is a thin queue of
           counts, not a place to work.

 THE ONE   "I am thinking about ONE skill, student, course or evaluator. Show me where it stands, the
 QUESTION   evidence behind that, and what I can do about it, without me choosing a report first."
           (examples: "open Olivia, see her skills" · "open IV insertion, see who has it, which courses
            map it, how it is configured, and the evidence")

 OPTIMISES  Lookup, drill-down, audit ("show me the evaluation behind this number"), and consistency
 FOR        with the other Exxat products (Student, Faculty, Course Offering pages already work this way
            [BASE-ENT] [VAULT]).
 DOES NOT   The first hour for an empty program. Entity-first has no spine for "bring in 80 skills,
 OPTIMISE   then configure, then map". Section 5 journey 1 shows it is no faster than a guided path.
```

**Relationship to `brief-v2`.** `[BRIEF-V2]` offers Direction A (guided setup), B (action-first command center) and C (student x skill matrix), then recommends a hybrid: Home that is a setup journey then a Today list, Skills with a secondary panel, Courses, Attainment, Reviews. Those are page-level homes inside one role menu. This variant is an architecture-level departure:

| Brief-v2 element | This variant |
|---|---|
| Direction A guided setup as the Home spine | **Departs.** Home is counts only. Setup guidance shrinks to an empty-state card |
| Direction B "Today" worklist | **Builds on, then thins it.** Counts are links into filtered entity lists. No list or detail pane on Home |
| Direction C matrix as home | **Departs.** No matrix. A "Progress" view of each directory carries the same numbers |
| Hybrid nav: Home, Skills, Courses, Attainment, Reviews | **Departs.** Attainment and Reviews stop being destinations. Students and Evaluators become destinations. Course mapping stops being a page |
| Side-panel drill-down, floating sheet, log sheet, one-screen preceptor form | **Keeps** (student and evaluator surfaces are shared across all variants) |

---

## 2. Architecture map

### 2.1 Legend and rules

```
 ROW     primary rail row (level 1)              PAGE   its own URL
 DETAIL  entity detail page (level 2)            TAB    horizontal DS Tabs (variant="line") inside a detail page
 PANEL   non-modal FloatingSheetPanel            DLG    modal Dialog (only for short, decisive tasks)
 [n]     badge/counter                           Depth  max 2 levels: ROW -> DETAIL(+tabs). Panels and dialogs are not levels.
```
Same-shell rule `[BASE-ENT]`: the tab shell is identical on every entity; products include or exclude tabs by configuration, never by rebuilding the shell. Header strip (identity, status, key metadata), tab bar with counters `[VAULT: tab counter badges]`, actions top right, fallback link "View full profile in Prism". The Exam Management student detail already composes this from `Tabs` / `TabsList variant="line"` / `TabsTrigger` / `TabsContent` of `@exxatdesignux/ui` (`apps/exam-management/admin/app/(app)/students/[id]/student-detail-client.tsx:1053`).

### 2.2 Admin and reviewer (inside the DS shell)

Reviewer is the same person wearing the approval hat `[REQ §8]`; whether approve rights are a separate admin sub-role is unspecified (gap G-8, `strategy/07`). In this IA approving is a verb on an evidence record, so no separate reviewer navigation exists.

```
UTILITY BAR   ☰ │ (E) Prism ▾ │ <page title> │ ... 🔍 ⌘K · 🔔 · ? · ✦ Ask Leo │ Sample University ▾ │ RS ▾
              (anatomy per docs/build/ds-shell-anatomy.md; profile menu keeps "Switch to student view")

RAIL (flat, one list, expanded with labels)
  Home [5]            PAGE   thin queue of counts + one search + recents
  Skills              ROW -> directory PAGE
  │                     DETAIL  /skills/{id}    TABS: Overview · Configuration · Courses (n) · Students (n) · Evidence (n)
  │                     DLG     Add skill · Import skills (input), full-width review step · Copy configuration
  │                     PANEL   Student x skill (opened from the Students tab)
  Students            ROW -> directory PAGE     [view: People | Progress]
  │                     DETAIL  /students/{id}   TABS: Overview · Skills · Courses (n) · Evidence (n)
  │                     PANEL   Evaluation detail (shared sheet, see 2.5)
  Courses             ROW -> directory PAGE     (course offerings, same list shape as the other Exxat products)
  │                     DETAIL  /courses/{id}    TABS: Overview · Skills (n) · Students (n) · Evidence (n)
  Evaluators          ROW -> directory PAGE     chips: Preceptor · Clinical faculty · Lab instructor
  │                     DETAIL  /evaluators/{id} TABS: Overview · Requests (n) · Evidence (n)
  ───────────────
  Program settings    ROW (footer, not an entity) PAGE with TABS: Categories · Tags · Clinical settings · Imports
                        (OD-04 submission-field defaults and OD-25 role-by-evidence map reserve a tab each as seams, hidden until decided)

NOT IN THE RAIL (reachable, but not destinations)
  /evidence?...        cross-entity evidence ledger = the same Evidence tab with no entity chosen.
                       Entered from Home counts, ⌘K, or a breadcrumb. Breadcrumb: "Home > Approvals waiting".
```

Landing tab per entity (product-configured, never assumed `[BASE-ENT]`): Skill = Overview (an unconfigured skill lands on **Configuration** and the other tabs show a reason, `[REQ IM-09]`). Student = **Skills** (primary for Skills Checklist `[BASE-ENT]`). Course = **Skills**. Evaluator = **Requests**.

Counters and badges: only Home carries a badge (the total of its rows, Gorgias-style counted views `[MOBBIN Gorgias via mobbin-evidence]`). Tabs carry counts. No badge on Reviews because there is no Reviews row.

### 2.3 Student (separate login, student shell, mobile first) `[REQ §6]`

Nouns are the student's own: a Course and a Skill record. One skill record spans courses `[REQ CM-07, AE-05]`.

```
BOTTOM TABS (<768px) / RAIL (desktop)
  Home                PAGE   three counts: Returned · Waiting (with whom) · Still needed
  Courses             ROW -> list of my courses
  │                     DETAIL  /courses/{id}   TABS: Skills · Activity
  │                       Skills: Mandatory (n) · Non-mandatory (n) · Other skills (collapsed, search)  [REQ ST-01..03, CM-05]
  │                       Activity: waiting / returned / counted for this course
  │                     PANEL   Send for review (bottom sheet on phone, right sheet on desktop)   [REQ ST-04..13]
  My skills           ROW -> one record per skill, all courses
  │                     DETAIL  /my-skills/{skillId}  (no tabs; attempts newest first; toggle "All courses | this course" [REQ SH-06])
  │                       actions: Revise and resend (returned / not yet assessed) · Make a further attempt [REQ RV-01..05]
```

### 2.4 Evaluator (no login, no shell) `[REQ EV-01]`

```
 email (S-18) ──link──▶  /evaluate/{token}      PAGE  one request, one or many skills [REQ EV-05]
                          ├ student context + self-evaluation (if configured)   [REQ EV-04]
                          ├ answers per skill, mandatory comment enforced        [REQ EV-06, SC-14]
                          └ submit ▶ receipt: "counts now" or "held for administrator approval"  [REQ EV-07]
 nothing else is reachable: no rail, no breadcrumb, no account, no other student.
 Clinical faculty may use the same form inside Prism [REQ §7 intro]: in this IA they use the link in v1 (homeless: see section 6).
```
The evaluator's only noun is the **Request**. It is not a directory or an entity page for them.

### 2.5 Shared patterns that make it one architecture

```
 EVIDENCE SHEET (one component, four entry points)           ENTITY HEADER STRIP
 Skill > Evidence tab ─┐                                      ┌ Olivia Martin  ·  BSN 2027  ·  Student ID 20418 ┐
 Student > Evidence ───┤   row ▶ PANEL: evaluation detail     │ Skills achieved 7 of 9 · 1 awaiting approval     │
 Course > Evidence ────┤   (full responses, student details,  │ [ Actions ▾ ]      View full profile in Prism ↗  │
 Evaluator > Evidence ─┘    self-eval, comment, review note,   └──────────────────────────────────────────────────┘
 Home > Approvals ──────────  Approve / Return verb here)      (identity fields only; no standing badge: not ours to derive)
 Completed evaluations are never editable [REQ RV-03]: the sheet has no Edit.
```

---

## 3. Object model as the user sees it

```
 FIRST-CLASS (directory + detail page)           SECOND-CLASS (lives inside a noun page)     VOCABULARY (Program settings)
 ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐   Evidence (a submission and its         Category  [REQ SL-03]
 │ SKILL  │ │ STUDENT │ │ COURSE │ │ EVALUATOR│   evaluation): tab + shared sheet         Tag       [REQ SL-04]
 └───┬────┘ └────┬────┘ └───┬────┘ └────┬─────┘   Configuration: a TAB of Skill           Clinical setting [REQ SL-07]
     │ mapped    │ holds one │ registers │ evaluates  Mapping: a RELATIONSHIP edited         Import batch [REQ IM-11]
     └──to───────┘ record per└──students  └─submissions from both ends (Skill > Courses
       Course       skill       (other      (no login)  and Course > Skills), never a page
                    [CM-07]     modules)                Skill record: a view, "Student x Skill"
 Cohort: a filter, not a noun (no REQ entity; comes from other Prism modules, gap G-10)
 Kit: not in REQ. Seam only (section 8). Not a noun in this IA.
```

| Noun | Why first-class | Source |
|---|---|---|
| Skill | Program-defined root of the library; has configuration, mapping, evidence | `[REQ SL-01..11, SC-01..19]` |
| Student | Owns exactly one record per skill across courses; the audit unit | `[REQ CM-07, AE-05, RP-05]` |
| Course (offering) | Expectation lives here; same entity as in the other Exxat products | `[REQ CM-01]` `[BASE-ENT]` |
| Evaluator | Roster of people who sign off, mostly without a login; lab roster is a named REQ list | `[REQ SL-08, SL-09, EV-01]` |
| Evidence | The ledger. Opened from every noun. Not a destination because nobody thinks "I want Evidence" without a person or skill | `[REQ §1.2, RV-03, RP-07]` `[INFER]` |
| Mapping | A relationship. `BASE-ENTITIES` makes Course Registration a relationship, not a page; mapping follows suit | `[BASE-ENT]` `[REQ CM-03]` |

Honest tension: Skills Checklist has **three co-equal nouns** (skill, student, course). Every HRIS analogue (section 7) has one dominant noun, the person. See risks.

---

## 4. Key screens (ASCII, inside the DS shell)

Text-only buttons. One filled primary per surface. No progress bars. No red. Sentence case. Rail icons are Font Awesome light (omitted here).

### 4.1 Admin landing: Home (populated program)

```
┌ UtilityBar ────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ☰  (E) Prism ▾   Home                                          🔍 ⌘K   🔔   ?   ✦ Ask Leo   Sample University ▾   RS ▾ │
├────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Home    [5]│ Home                                                                                          │
│ Skills     │ Find a skill, student, course or evaluator                                                    │
│ Students   │ ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│ Courses    │ │ 🔍  Search everything …                                                                  │ │
│ Evaluators │ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│            │ Recent   Olivia Martin · IV insertion · NURS 350 · J. Delgado, RN                             │
│            │                                                                                               │
│            │ Waiting on you                                                                                │
│            │ ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│            │ │ Approvals waiting                                   16   Agree 12 · Differ 4      [Open] │ │
│            │ │ Skills that need configuration                       2                            [Open] │ │
│            │ │ Evaluators named by students, not on the roster      3                            [Open] │ │
│            │ │ Requests waiting 7 days or more with an evaluator    7   visibility only          [Open] │ │
│            │ │ Configured skills mapped to no course                5                            [Open] │ │
│            │ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│            │ ✓ Nothing waiting in: Imports                                                                 │
│ ────────── │                                                                                               │
│ Program    │                                                                                               │
│ settings   │                                                                                               │
└────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘
 [Open] = DS Button variant="outline" size="sm". No filled primary on this surface (it is a read surface).
 Each [Open] lands on a FILTERED directory or the Evidence ledger, never on a report.
```
Rules:
- Approvals row exists only when some skill has administrator approval on `[REQ SC-15, AR-01]`. The Agree/Differ split is the agreement flag from `[REQ AR-02]`.
- "Skills that need configuration" is the visible count `[REQ IM-10]`. It opens Skills filtered to "Needs configuration".
- "Evaluators named by students, not on the roster" opens Evaluators filtered, with "Add to roster" `[REQ SL-09]`.
- "Requests waiting 7 days or more" is **visibility only**. The 7-day figure is a proposed display default `[INFER]`. No reminders, no escalation `[REQ §14]`. Resend is OD-18, not built.
- **No "students behind" row.** How a program defines behind is unresolved `[OD-27]` `[CALL 09-23 "bottom 20%"]`. The answer lives in the Progress view of Skills and Students (journey 2) with counts by state, no judgement.
- **No setup percentage bar.** A new program sees the empty state below instead.

```
Home, new program (0 skills)                     Skills, new program
┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────────────────────┐
│ Bring in your skills                     │    │ Skills                                                   │
│ Prism has no skills of its own. Upload or │    │ No skills yet. Prism ships none: your program defines     │
│ paste the list you already use.           │    │ every skill.                                              │
│   [ Import skills ]  (filled primary)     │    │   [ Import skills ]  [ Add one skill ] (outline)          │
│ 0 skills · 0 configured · 0 mapped        │    └──────────────────────────────────────────────────────────┘
└──────────────────────────────────────────┘      `[REQ SL-01, IM-01]` no template, no pre-fill
```

### 4.2 Admin core working screen: Skill detail, Students tab (open IV insertion, see who has it)

```
┌ UtilityBar ... ✦ Ask Leo   Sample University ▾   RS ▾ ┐
├────────────┬───────────────────────────────────────────────────────────────────────┬──────────────────────────────┤
│ Home    [5]│ Skills > IV insertion                                       [ Actions ▾ ]│ Olivia Martin × IV insertion │
│▸Skills     │ ┌ Header strip ─────────────────────────────────────────────────────────┐│ ✕                            │
│ Students   │ │ IV insertion   Active · Configured · Category: Procedures · Tag: complex││ Achieved                     │
│ Courses    │ │ Demonstration-level outcome · 5 demonstrations · 1 observed · 3 indep. ││ Rule: every completed        │
│ Evaluators │ └───────────────────────────────────────────────────────────────────────┘│ demonstration counts         │
│            │ Overview · Configuration · Courses (3) · [Students (40)] · Evidence (212)│                              │
│            │ ─────────────────────────────────────────────────────────────────────────│ Observed        2 of 1       │
│            │ [Cohort: BSN 2027 ✕] [Course: NURS 350 ✕]  + Add filter       Clear      │ With assistance 1 of 1       │
│            │ 40 students · BSN 2027 · counting evidence from every course             │ Independent     4 of 3       │
│            │ ┌ Achieved ┬ In progress ┬ Evidence does not qualify ┬ No evidence yet ┐ │ Total           7 of 5       │
│            │ │   31     │      6      │            1              │       2         │ │ Inpatient 1 of 1             │
│            │ └──────────┴─────────────┴───────────────────────────┴─────────────────┘ │ Emergency 1 of 1             │
│            │ [🔍 Search students]                                  Sort ▾   Export ▾  │ Lab: counted separately      │
│            │ Student          Cohort    Status        Observed  Assisted  Indep.  Total│                              │
│            │ Olivia Martin    BSN 2027  Achieved      2 of 1    1 of 1    4 of 3  7 of 5│ Evidence (7)                │
│            │ Priya Tran       BSN 2027  No evidence   0 of 1    0 of 1    0 of 3  0 of 5│ 07-04 Clinical · Inpatient  │
│            │ Noah Zeller      BSN 2027  In progress   1 of 1    1 of 1    1 of 3  3 of 5│   Harbor FP · J. Delgado    │
│            │ Milo Whitfield   BSN 2027  Evidence does 2 of 1    0 of 1    0 of 3  2 of 5│   Independent · counted     │
│            │                            not qualify                                    │ [ View form ]  [Open student]│
│            │ Showing 25 of 40                                  [ Show 25 more ]        │                              │
└────────────┴───────────────────────────────────────────────────────────────────────────┴──────────────────────────────┘
 Tabs = DS Tabs variant="line" with counters. Panel = FloatingSheetPanel (non-modal; the row stays visible).
 Status column is TEXT; the four states are the [REQ AE-04] enum. One display flag can merge the first two
 into "Not met" (OD-03 seam, neither committed). Level columns change with the skill's model (Binary: qualifying
 evaluations n of N; Question-level: n of N plus rule; Scored: n of N; Demonstration: per level, as above).
 Per-setting rows show lab evidence separately: it never satisfies a clinical setting minimum [REQ SC-12].
 The Students tab answers "who has it". Courses tab answers "which courses map it" (and is where mapping is edited, skill-centric).
 Configuration tab answers "how is it configured" (the three S-09 sections as anchored sections, lineage panel, live preview [REQ SC-17, SC-19]).
 Evidence tab answers "the proof". Impossible filter combinations get the explainer, not an empty table [REQ RP-09].
 Primary actions: none filled on this tab. "Actions ▾" holds Copy configuration [REQ IM-14], Deactivate [REQ SL-11], Export.
```

### 4.3 Admin: Students directory and Student detail, Skills tab (open Olivia) - compact

```
Students (directory)         [View: People | Progress]                    Search only, in the People view
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍  Search students …  (name, ID, email, cohort)                                                 │
│ Name              Email              Cohort     Status                                           │
│ Olivia Martin     omartin@…          BSN 2027   Active                                           │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
 Progress view (same list) adds [REQ RP-01] filter chips and columns: Achieved · In progress · Evidence does not qualify · No evidence yet · n of N.
 Why a view toggle: [BASE-ENT] records Aarti (May 13): "I don't want filters and grid and everything. Needs to be a single line like Google search."
 REQ RP-01 needs removable filters (cohort, group, course, category, tag, location, setting). The toggle satisfies both. OPEN QUESTION Q1.

Student detail
┌ Students > Olivia Martin ────────────────────────────────────────────────────────── [ Actions ▾ ]─┐
│ Olivia Martin · Student ID 20418 · BSN 2027 (Nursing)     View full profile in Prism ↗             │
│ Overview · [Skills (9)] · Courses (5) · Evidence (24)                                              │
│ Skill              Status            Needs                              Courses     Last evidence │
│ IV insertion       Achieved          7 of 5 · each level met            NURS 350 +2  07-04        │
│ Wound care         In progress       4 of 4 · needs 1 Emergency         NURS 350     06-28        │
│ Foley catheter     Evidence does not 2 of 3 qualifying                  NURS 301     05-11        │
│                    qualify                                                                         │
│ Vital signs        No evidence yet   0 of 3                             none mapped  none         │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
 One row per skill, across courses [REQ CM-07, AE-05]. "Needs" states what is left per criterion, not a bar [REQ AE-03, SH-05].
 Row opens the same Student x Skill PANEL as 4.2. This is the journey-2 "who is behind" endpoint, read per student.
```

### 4.4 Student landing (mobile, student login) - compact

```
┌ Prism Skills ─────────────┐   ┌ Courses > NURS 350 ───────┐   ┌ Log evidence ────── ✕ ┐
│ Home                      │   │ Skills · Activity         │   │ IV insertion           │
│ Returned (1)              │   │ Mandatory (3)             │   │ Where (● Clinical ○ Lab)│
│  IV insertion: fix date   │   │ ☐ Foley catheter  2 of 3  │   │ Setting  Outpatient ▾  │
│  [ Revise and resend ]    │   │   In progress             │   │ Who  [J. Delgado][+]   │
│ Waiting (2)               │   │ ☐ Wound care      4 of 4  │   │ Date  today ▾          │
│  Foley · J. Delgado, 2 d  │   │   Needs 1 Inpatient,      │   │ ▸ Self-evaluation      │
│  Wound · lab, K. Larsen   │   │   1 Emergency             │   │ [  Send request  ]     │
│ Still needed (3)          │   │ Non-mandatory (2)         │   └────────────────────────┘
│  Foley · Wound · Trach.   │   │ Other skills ▾            │   (bottom sheet, scroll-safe,
│  [ Open courses ]         │   │ [ Send 2 for review ]     │    same log sheet as brief-v2 3.3)
├───────────────────────────┤   ├───────────────────────────┤
│  Home   Courses  My skills│   │  Home   Courses  My skills│
└───────────────────────────┘   └───────────────────────────┘
 Home is counts that link into My skills or a Course. Mapped, then other skills; unmapped skills stay submittable [REQ ST-02, CM-05].
 Waiting names who it is with [REQ SH-02]. Failed rule stated on the skill page [REQ SH-03].
 "Still needed" counts criteria not yet met against the student's own record, not the course mapping alone [INFER].
```

### 4.5 Evaluator mobile (no shell) - compact

```
┌ Prism ────────────────────┐
│ Sign off 3 skills         │
│ Olivia Martin · NURS 350  │
│ You are J. Delgado, RN    │
│ Supplied by the student:  │
│  07-04 · Inpatient · Unit 4│
│ ─ Foley catheter ───────  │
│ Performed preparation?    │
│ [   Yes   ] [    No    ]  │
│ Comment (required)        │
│ [______________________]  │
│ ─ IV insertion ─────────  │
│ Supervision level         │
│ [Observed][Assisted][Indep.]│
│ After you submit: Foley   │
│ counts now; IV goes to    │
│ the administrator.        │
│ [   Submit 3 skills   ]   │
└───────────────────────────┘
 No rail, no sign-in, large targets [REQ EV-01]. Shows only the configured form [REQ EV-03]. Receipt tells counts-now or held [REQ EV-07].
 The receipt does NOT show the student's achievement status (PROTO did; OD-17 open, DEFECT-05).
```

---

## 5. Three journeys walked through the IA

Click counts are `[INFER]` estimates, counted as one click or tap per control, assuming no errors. They are for comparison with `friction-baseline.md` (current build about 2,000 interactions for setup, brief-v2 A about 180), not measurements. The 160 below is **not better** than A's 180: entity-first is not a setup architecture.

### Journey 1: first-hour setup of 80 skills (program admin, empty program)

```
 Home (new) ─▶ Skills ─▶ Import ─▶ Review ─▶ Directory ─▶ Configure in groups ─▶ Map in groups ─▶ students can submit
  [Import skills]  (empty state)   (dialog,    (80 "needs    (select N, one model     (select N, Map to
                                    full-width  configuration") per group, Apply)      courses, requirement)
                                    review)
```

| Step | Where (entity pages) | Clicks `[INFER]` |
|---|---|---|
| Import: Home primary "Import skills", paste or upload, fix 4 rows, discard 2 unread lines, confirm "Create 80" `[REQ IM-01..08]` | Skills empty state, import dialog | ~15 |
| Land on Skills with a banner "80 skills need configuration" and the filter set `[REQ IM-10]` | Skills directory | 0 (system) |
| Configure 5 groups: filter category (2), select all (1), "Configure selected" (1), choose model explicitly (1), rule and criteria (~5), preview (1), Apply with impact list (2) = ~13 per group `[REQ SC-02, IM-14, SC-19]` | Skills directory bulk action opening the Configuration workspace for the selection | ~65 |
| 6 per-skill exceptions: open skill (1), Configuration tab (auto for unconfigured), edit (3), save (1), back (1) | Skill detail > Configuration | ~36 |
| Map: select a category's skills (3), "Map to courses" (1), pick offerings (3), requirement mandatory or non-mandatory (2), confirm (1) = ~10 per batch, 5 batches `[REQ CM-01..04]` | Skills directory bulk, or Course > Skills > Add skills | ~45 |
| **Total** | | **~160** |

What the architecture adds: every skill is reachable by a URL from the first minute; the first fully configured skill is at about click 35 (open one skill, configure it alone), so a student could submit sooner than in a gated flow. What it costs: no visible path. The admin must discover "Configure selected" and "Map to courses" as bulk verbs on a directory. Mitigation: Home empty state, the Needs configuration banner, and a 3-line status card ("80 skills · 12 configured · 0 mapped") that is a count, not a journey `[INFER]`. Seams held: OD-01 (copy mapping is an explicit "Copy from offering" action on Course > Skills, no automatic carry-forward), OD-12 (import never proposes a model), OD-15 (no separate activation step), kits stay a seam.

### Journey 2: weekly review, then who is behind (coordinator / reviewer)

```
 A  Approvals:  Home ─[Open] Approvals 16─▶ Evidence ledger (status: awaiting approval, grouped Agree 12 · Differ 4)
                   select Agree group ─▶ Approve selected ─▶ confirm        differ rows ─▶ sheet ─▶ Approve | Return + note
 B  Behind:     Skills ─▶ [Progress] ─▶ sort lowest achieved ─▶ open skill ─▶ Students tab ─▶ filter "No evidence yet" ─▶ student panel
```

| Part | Clicks `[INFER]` |
|---|---|
| A. Home to Approvals (1), select Agree group (1), Approve selected (1), confirm (1), then 4 differing rows at ~3 each (open, decide, optional note) `[REQ AR-01..06]` | ~16 |
| B. Skills (1), Progress view (1), sort (1), open skill (1), Students tab (1), status filter (2), open student panel (1) `[REQ RP-02, RP-03, RP-05]` | ~8 |
| B alt, by person: Students (1), Progress (1), course filter (2), sort by "not achieved" (1), open student (1) | ~6 |

"Behind" is a **view of counts by the four states**, never a computed verdict, because `OD-27` (how a program defines behind) is open. "Return" wording stays neutral: who corrects is `OD-16`, DEFECT-03. There is no reminder action `[REQ §14]`.

### Journey 3: accreditation visit evidence pull

```
 ⌘K "IV" ─▶ Skill: IV insertion ─▶ Students tab ─▶ [Cohort: BSN 2027] ─▶ Export aggregate (filters in file header)
                                        └─ student panel ─▶ ledger row ─▶ View form (full evaluation, retained evidence)
 Courses ─▶ NURS 350 ─▶ Evidence tab ─▶ Export evidence detail (one row per evaluation) [REQ RP-10]
```

| Question from the visitor | Path | Clicks `[INFER]` |
|---|---|---|
| "Show me the evaluation behind 78% on IV insertion for BSN 2027" `[REQ RP-05..07]` | ⌘K IV (3), Students tab (1), cohort filter (2), open row (1), View form (1) | ~8 |
| "Every evaluation in NURS 350 this term" | Courses (1), open NURS 350 (1), Evidence tab (1), Export evidence detail (2) | ~5 |
| "Everything for one student" | ⌘K name (3), Evidence tab (1), Export (2) | ~6 |
| "Counts by tag" `[REQ RP-04]` | Skills (1), Progress (1), Group by tag (1), read the overlap note | ~3 |

Auditor read-only mode is a seam, not a requirement. `[MOBBIN Vanta evidence]` shows an "Auditor view" with an Evidence list and a read-only sheet. It is not in REQ and is raised in section 10.

---

## 6. Inventory: every surface S-01..S-18 plus Home and Kits

| ID | Surface | Placement in this IA | Container | Cut? |
|---|---|---|---|---|
| Home | HY-01 Home | Home row: search, recents, count queue | PAGE | Thinned. Setup journey and attention list collapse to counts |
| S-01 | Overview (attainment) | **Dissolved.** By student = Students > Progress view. By skill = Skills > Progress view. By tag = Skills > Progress > Group by tag. KPI strip kept as a 4-number band on those views | views of 2 PAGEs | **Cut as a destination.** Reason: entity-first has no population report page; costs a single cross-cohort overview (risk R2) |
| S-02 | Student drill-down | Student detail > Skills tab; or PANEL from Skill > Students | DETAIL tab + PANEL | No |
| S-03 | Evidence ledger and evaluation detail | Evidence tab on all four entities; shared evaluation PANEL | TAB + PANEL | No |
| S-04 | Library: skills list | Skills directory | PAGE | No |
| S-05a/b | Categories, Tags | Program settings > Categories, Tags; created inline from a skill `[REQ SL-05]` | TAB | Moved out of Skills |
| S-06 | Clinical settings | Program settings > Clinical settings | TAB | Moved |
| S-07 | Lab instructors roster | Evaluators directory, chip "Lab instructor"; "Named by students" is a filter `[REQ SL-08, SL-09]` | PAGE | Moved: a roster of people is an entity directory |
| S-08 | Import | Dialog from Skills; history in Program settings > Imports `[REQ IM-11]` | DLG + TAB | No |
| S-09 | Skill configure | Skill detail > Configuration tab (single skill) and a bulk workspace for a selection | TAB | Container departs from PROTO (dialog) and from `prototype-parity.md` |
| S-10 | Course mapping | **Split into two entity tabs:** Course > Skills (offering-centric) and Skill > Courses (skill-centric), plus bulk "Map to courses" on Skills | TABs | **Cut as a page** |
| S-11 | Review and approve | Verb on the evaluation PANEL; queue = Evidence ledger filtered to awaiting approval, entered from Home | PANEL + view | **Cut as a destination** (no Reviews row) |
| S-12 | Student course skills | Student > Courses > {course} > Skills | DETAIL tab | No |
| S-13 | Student send for review | Sheet from S-12 or My skills | PANEL | No |
| S-14 | Student skill history | Student > My skills > {skill} | DETAIL | No |
| S-15 | Student my skills | Student > My skills | PAGE | No |
| S-16 | Evaluator form | `/evaluate/{token}`, no shell | PAGE | No |
| S-17 | Export | Action on every directory, Progress view and Evidence tab | menu | No (is no longer one place) |
| S-18 | Evaluation-request email | System; contains the S-16 link | email | No |
| HY-02 | Kits | Not a noun. Seam: multi-select "Configure selected" on Skills (journey 1). Persistence of named kits stays open in `kits-variants-2026-10-09.md`; not decided here | n/a | Deferred (not in REQ; `[CALL 09-23]` Sankalp does not want template sprawl) |

---

## 7. Requirement coverage

REQ areas and where each lives. `SH` in the REQ numbering is student-facing outcome visibility ("status history"), not sharing; it lives on student surfaces `[REQ SH-01..07]`.

| Area | IDs | Lives in |
|---|---|---|
| SL skills library | SL-01..11 | Skills directory + detail Overview (SL-02, SL-10 filters); Program settings (SL-03..07 vocabulary); Evaluators (SL-08, SL-09); Actions > Deactivate (SL-11); empty state never pre-fills (SL-01) |
| IM import | IM-01..15 | Import dialog on Skills (IM-01..08, 12, 13); Needs configuration filter + Home count (IM-09, IM-10); Program settings > Imports (IM-11); bulk Configure selected and Copy configuration (IM-14). IM-15 interpretation depth stays `[OD-12]` |
| SC configure | SC-01..19 | Skill > Configuration tab. SC-15 workflow toggles and SC-16 allowed roles inside it; SC-19 preview in the same tab; SC-18 save validation |
| CM course mapping | CM-01..08 | Course > Skills (CM-01..03, 06) and Skill > Courses (CM-04); expectation never gates (CM-05); one record (CM-07) on Student > Skills; carry-forward `[OD-01]` seam, CM-08 as explicit copy |
| ST student | ST-01..14 | Student Courses > Skills and Send sheet. ST-14 setting once vs per skill `[OD-07]` seam |
| EV evaluator | EV-01..07 | `/evaluate/{token}`. EV-02 faculty-in-Prism: not covered in v1 (see homeless) |
| AR approval | AR-01..06 | Evidence PANEL verbs (AR-02 compare, AR-03 full responses, AR-04 note, AR-05 decision); queue via Home count; AR-06 exclusion is derived |
| RV review/revise | RV-01..06 | Student My skills > {skill} (RV-01, 02, 04, 05); evaluator form for RV-06 prefill `[OD-08]`; RV-03 immutable (no Edit anywhere) |
| SH sharing/visibility | SH-01..07 | Student Course > Activity, My skills > {skill}. Outcome words: counted · did not meet the criteria · returned · waiting (names who) |
| RP reporting | RP-01..11 | Progress view of Skills and Students (RP-02..04); Evidence tabs (RP-06, 07); filter chips (RP-01, RP-08, RP-09); export on each (RP-10). RP-11 format `[OD-10]` |
| AE achievement engine | AE-01..08 | Not a surface: derived status shown everywhere (Student > Skills, Skill > Students). Four-state enum `[OD-03]`; rule edits re-apply (AE-02) shown as an impact list before save `[INFER]` |

**Homeless or weak in this IA (stated, not hidden)**

| Item | Problem |
|---|---|
| One cross-cohort overview ("how is BSN 2027 doing across all skills") | No single page. Approximated by Students > Progress with a cohort filter or Skills > Progress. Strongest argument against this variant |
| Clinical faculty evaluating inside Prism `[REQ §7 intro]` | No faculty Home or nav. They use the link in v1. Needs a decision |
| Guided setup | Only an empty-state card and counts. See journey 1 |
| "Behind" `[OD-27]` | Not a surface. Counts by state only |
| Link lifecycle `[OD-18]` | Only stalled-request visibility on Home and Evaluator > Requests; no resend or expiry UI |
| Auditor read-only access | Not in REQ; no auditor role in this IA |
| Admin sub-roles (configure vs approve) | Unspecified, gap G-8. Verbs are visible to all admins |
| Kits `[CALL 09-23]` | Not a noun; bulk select only |
| Heatmap, preceptor-consistency reports `[OD-11]` | Not built. The Evaluator detail **must not** show per-evaluator score comparisons (harsh rater vs weak student cannot be told apart, `[CALL 09-23]`) |

---

## 8. Mobbin analogies (product-level; screens viewed 2026-10-09)

Searches run (web, deep mode): person detail with tabs from a directory; Vanta personnel list and sections; learner profile in an LMS; ATS candidate profile and jobs sidebar; skills directory with who holds each; course or training detail with people, requirements, settings; compliance control or requirement detail with linked evidence; training assignment with who is complete or overdue. Images were viewed, not described from metadata. None is clinical education.

| # | Product | What the IA is | What transfers | What does NOT transfer to a program with 40 to 200 skills and cohorts | Fit |
|---|---|---|---|---|---|
| 1 | Vanta, People, Groups, Accounts `[MOBBIN Vanta People https://mobbin.com/screens/c1b82d05-6d17-453c-8beb-bf6e757f24b5]` | Product rail with Personnel group; secondary nav People / Groups / Checklists; directory with status and task-status columns, filters, count banner | The directory shape: search plus status filters plus a task-status column; a banner for exceptions ("4 people could not be matched") like Home counts | Rows are people only; no second noun; no cross-tab like skill by person | **Strong** (directory) |
| 2 | Vanta, Evidence detail (auditor view) `[MOBBIN Vanta evidence https://mobbin.com/screens/b5b7bcfc-0159-42f8-98ca-2de215d7ae4a]` | Evidence list with a right sheet: Details, Related controls, Audit activity, Comments; "Auditor view" label; read-only banner | A shared evidence sheet with tabs and a read-only mode for the accreditation visit | Evidence is system-generated tests; ours is a human evaluation that is immutable (RV-03) and has a mandatory comment | **Strong** (evidence sheet) |
| 3 | Square, Staff > Team members `[MOBBIN Square https://mobbin.com/screens/c2189054-bf67-41c9-98d3-95d887d46cbf]` | Rail with nested Staff > Team members; list with a right panel (Overview, Payroll, Documents) | Opening an entity from a directory into a side panel with tabs, list stays visible (our Student x Skill panel) | Panel hosts settings, not a ledger | **Strong** (panel pattern) |
| 4 | Workable, Employee profile `[MOBBIN Workable https://mobbin.com/screens/e4f77da2-bf4f-4b29-b2fd-f9828734fc89]` | Top nav Jobs, Candidates, Employees; profile header with identity chips, Actions menu, tabs Information / Files / Time off / Time tracking / Performance | Header strip + Actions menu + tabs is the exact `[BASE-ENT]` shell; Back link to the directory | Top navigation, not a left rail; one noun | **Strong** (detail shell) |
| 5 | Aboard, People `[MOBBIN Aboard https://mobbin.com/screens/d28058a3-013e-44a6-9c7f-dcb71856f916]` | Profile with an attribute column left and tabs Profile / Details / Documents / Time-off | Identity attributes in a fixed column while tabs change | A document-heavy profile; ours is ledger-heavy | **Partial** |
| 6 | Employment Hero, Employee profile `[MOBBIN Employment Hero https://mobbin.com/screens/5f5c0c72-2055-461f-97f5-ce1dd7bf61da]` | Left vertical list of about 13 profile sections (Overview, Personal, Employment, Documents, Audit trail …) | Shows what NOT to do with tabs: keep ours to 4 or 5 | Section sprawl; a person with 13 admin sections is not a skills record | **Weak** (cautionary) |
| 7 | Kajabi, Course detail `[MOBBIN Kajabi https://mobbin.com/screens/a94271ec-86d8-463a-a932-acf6c9964f91]` | Rail Products > Courses; course page tabs Outline / Customize / Offers / Customers (5) / Certificates / Settings | Course as a first-class page with a people tab and counter badges; consistent with Course > Students | Course here is a product to sell; our course is a term-specific offering owned by another module | **Partial** |
| 8 | Deel, Learning assignments `[MOBBIN Deel https://mobbin.com/screens/8fcd1acc-25fd-4d6e-8273-1eac2afe2922]` | Assignments tab with filter row (course, status, assignee, manager, due date), export CSV, columns for status and progress | The "who has this and in what state" table with export: Skill > Students | KPI donuts (not allowed as primary viz); due dates and reminders are out of scope (REQ §14) | **Partial** |
| 9 | Remote, Candidate profile `[MOBBIN Remote https://mobbin.com/screens/8c5938e7-a1ea-43f1-af32-19bc356555bf]` | Rail with Team management group; profile with left attribute card, tabs, previous and next arrows to step through candidates | Prev and next arrows on a detail page to walk a queue (review without going back to the list) | Hiring pipeline stages | **Partial** |
| 10 | Homerun, Jobs in the sidebar `[MOBBIN Homerun https://mobbin.com/screens/dc342966-51d1-4029-8e2b-938a4eb37e50]` | Jobs listed in the rail as entities, "7 of 8" stepper on a candidate | Entities as nav rows, counted stepper | A handful of jobs in a rail; we have 200 skills | **Weak** (does not scale) |
| 11 | 7shifts, Employee > Documents `[MOBBIN 7shifts https://mobbin.com/screens/cca48d57-6273-4a9f-aee5-876dea375a71]` | Vertical sub-nav with Certifications that have expiration dates | Certifications as a ledger under a person | Expiry is out of scope `[REQ §14]` | **Weak** |
| 12 | Codecademy My learning, Uxcel profile `[MOBBIN Codecademy https://mobbin.com/screens/013dc0ff-b45a-4f5e-b532-987a8cff0dc7]` | Learner rail Dashboard / My learning / Skills tracking; list with per-item percentage bars | Student side has few nouns and a "my record" page | Progress bars as the main viz (we keep numbers first); gamified | **Weak** |
| 13 | Langdock, Gumloop, Perplexity "Skills" `[MOBBIN Langdock https://mobbin.com/screens/919679dd-521c-4e73-b06e-cb54328627fe]` | Directory of AI agent "skills" with install toggles | Nothing; they are capabilities, not records of who has done them | No person dimension | **Weak** |

**Where no reference exists (stated plainly).** (a) A **skill as a first-class directory whose detail page lists who holds it, at what level, with an evidence ledger**: the search returned only AI-agent skill libraries (row 13). (b) **Three co-equal entities** with symmetrical cross-tabs (skill by student by course); every HRIS reference has one dominant noun. (c) The **no-login evaluator** entering from an email: no result, consistent with `mobbin-evidence.md` Gap. (d) Anything at **150 students x 80 skills** scale. (e) Immutable-ledger evidence: Vanta evidence is the nearest and is machine-generated. The HRIS and compliance patterns strongly support the *shell* (directory, header strip, tabs, side panel). They do not validate the *noun choice*.

---

## 9. DS component implications and reuse versus rebuild

DS imports are from `@exxatdesignux/ui`. Verify each with `node tools/ds/source.mjs <Component>` and `localhost:4000/library/<id>` before any JSX; this file is spec only. `[INFER]` unless a path is shown.

| Need | DS component | Note |
|---|---|---|
| Directory lists | `DataTable` (+ `FilterBar`, `DataTablePaginated`) | Students People view: search only, no filter row `[BASE-ENT]` |
| Entity detail shell | `PageHeader`, `Breadcrumb`, `Tabs`/`TabsList variant="line"`/`TabsTrigger`/`TabsContent`, `Badge` | Same composition as `apps/exam-management/admin/app/(app)/students/[id]/student-detail-client.tsx:1053`. A shared `EntityHeader` strip is one new hand-rolled file |
| View toggle People / Progress, Group by | `ViewSegmentedControl` | |
| Student x skill and Evaluation panels | `FloatingSheetPanel` (non-modal) | DS sheets are FloatingSheetPanel, never hand-composed `[memory]` |
| Four-number band | `KeyMetrics` (max four, compact) | No `Progress` component exists; use numbers or `ProgressCell` in rows only |
| Status | `StatusBadge` via a `SkillStatusBadge` wrapper reading the OD-03 flag | Text always, no red |
| Banners and impossible filters | `LocalBanner` | |
| Bulk selection bar | `Checkbox` + hand-rolled sticky bar (C-17 in `ux/10`) | |
| Multi-pick (tags, settings, offerings) | `Popover` + `Command` + `Checkbox` | No `MultiSelect` / `Combobox` in the DS |
| Not exported | `Stepper`, `Progress`, `FileUpload`, `EmptyState` | Vendor `EmptyState` from PCE per `ux/10` |

### Reuse of the current build (`admin/`)

Honest cost: S under a day of wiring, M a few days, L a week or more. `[INFER]`

| Current piece | Path | Verdict | Cost |
|---|---|---|---|
| Domain, engine, store, seed, selectors | `admin/lib/*` | Reused as is. This IA changes no data rule | S |
| Shell: utility bar, product and scope switchers, user menu, command menu | `components/shell/*` | Reused. Command menu gains entity search with recents | S |
| Nav config | `lib/skills-nav.tsx`, `lib/skills-routes.ts` | Rebuilt: rows become Home, Skills, Students, Courses, Evaluators, Program settings; Reviews and Attainment rows removed; routes gain `/students/[id]`, `/courses/[id]`, `/evaluators/[id]`, `/skills/[id]`, `/evidence` | S |
| Home (setup card, attention list, glance) | `components/home/*` | Rebuilt thinner: search, recents, five count rows. Setup card shrinks to the empty-state card | S to M |
| Skills page with six tabs | `components/library/*` | **Split.** `skills-tab` becomes the directory (M). `taxon-tab`, `settings-tab` move to Program settings (S). `lab-tab` moves to the Evaluators directory (M). Kits placeholder tab removed | M |
| Configure wizard (3-step dialog) | `components/configure/*` | Section components (model picker, rule, criteria, lineage, preview, validation) reused; `wizard-dialog` and `dialog-host` replaced by a Configuration tab and a bulk workspace | M to L |
| Reporting (overview, report tables, filters, dialogs, export) | `components/reporting/*` | By-student and By-skill tables reused as the Progress views; the stacked drill-down dialogs replaced by side panels | M |
| Course mapping workspace | `components/mapping/*` | Rebuilt as two tabs (Course > Skills, Skill > Courses) plus bulk Map; two-pane logic partly reusable | M |
| Review cards and agreement compare | `components/review/*` | Card and compare reused inside the evidence panel; list page becomes a grouped, filtered ledger | M |
| Student and evaluator surfaces | `components/student/*`, `components/evaluator/*` | Reused. Student nav gains Home; Courses and My skills exist | S |
| **New** | | Entity header strip, Student detail, Course detail, Evaluator detail, Evidence ledger and shared evaluation panel, entity search with recents | L |

**Overall: L**, mostly because three new entity detail pages and the Evidence ledger do not exist. Engine and store are untouched.

---

## 10. Strengths, risks, failure conditions, and the cheapest test

**Strengths**
1. Consistent with the other Exxat products: Student, Faculty and Course Offering already have this list and detail shell `[BASE-ENT] [VAULT]`. Engineering and users reuse the pattern; the Skills tab is explicitly "PRIMARY" for the student in Skills Checklist `[BASE-ENT]`.
2. Audit and drill-down are native. "Open the entity, see the ledger" is one move from any starting noun `[REQ RP-05..07]`.
3. Mapping stops being a mysterious page. It is visible from both ends, and "which courses map this skill" and "which skills this course expects" are each one tab `[REQ CM-04]`.
4. No role-specific nav hacks. The prototype's three-group sidebar is gone; student and evaluator surfaces are separate by construction `[REQ EV-01]`.
5. Honest about `OD-03`, `OD-27`, `OD-11`: counts of states, no verdicts, no evaluator comparisons.

**Risks**

| # | Risk | Mitigation or note |
|---|---|---|
| R1 | Setup has no spine (journey 1, about 160 clicks, no guidance); the people who decide adoption are in the first hour `[REQ §3]` | Empty-state primary, Needs configuration banner and filter, bulk verbs. If the test (below) shows lost first-timers, import A's Home setup state |
| R2 | No cross-cohort overview page; coordinators who think in "my cohort" must pick a directory and a view | Students > Progress with a cohort filter is the closest. Consider a saved view |
| R3 | Three co-equal nouns make "where do I start" ambiguous; HRIS analogues have one dominant noun | Home search and ⌘K as universal entry; recents |
| R4 | Review is hidden (no Reviews row); a weekly job sits behind a Home count | Home is the default landing and carries the badge. If testing shows missed approvals, restore a conditional Approvals row (Gorgias-style counted view) |
| R5 | Students directory rule (search only) collides with `RP-01` removable filters | People / Progress toggle; Q1 for Aarti |
| R6 | 200-skill directory is long | Group by category, search, saved selections; DataTable virtualisation |
| R7 | Evaluators directory invites ranking preceptors (`OD-11`, `[CALL 09-23]`) | No per-evaluator scores in v1; roster and requests only |
| R8 | "Evidence" is both a tab and a hidden page; confusing which is which | The page is the unfiltered tab; breadcrumb shows its origin |
| R9 | Deactivated or unconfigured skills clutter directories | Status filters `[REQ SL-10, SL-11]` |

**What would make this fail.** (1) First-time admins stall at "I imported 80 skills, now what" in the test. (2) Coordinators repeatedly say "where is the overall report" before opening a directory. (3) Approvals are missed because there is no row. (4) Engineering cost of three new detail pages outweighs value while the engine is already built. If two of the first three occur, prefer the brief-v2 hybrid and borrow only the entity detail shell for Skill and Student.

**Cheapest test with real users (5 admins, about 45 minutes each, moderated, on a clickable low-fi of sections 2 and 4, no build)**

```
 Who:     5 program coordinators or program admins (at least 2 nursing, 1 PA or other allied health,
          at least 1 who has configured a skills or evaluation list before). Ask Sarah / Aarti for names.
 Compare: Variant B vs the brief-v2 hybrid, counterbalanced (3 start with B, 2 with the hybrid).
 Part 1   Tree test, 10 min, 8 tasks on the sitemap text only (2.2): "Find who has not done IV insertion
          in BSN 2027", "Find where to change what counts as achieved for Foley", "Where do you approve
          evaluations", "Add a preceptor named by a student", ...  Metric: first click correct,
          directness, time.
 Part 2   Click-through, 25 min, 3 tasks: (a) first-hour: you have this Word list, get 10 skills ready for
          students (b) review: you have 16 waiting (c) a visitor asks to see the evaluation behind a number.
          Metrics: wrong turns, time, count of "where is the report" utterances, ability to state next step.
 Part 3   Debrief, 10 min: "what would you call each row in the left menu?", "what is missing".
 Pass     Tree test first-click at least 70 percent on every task; no more than 1 of 5 stalls in (a);
          at most 1 of 5 asks for a separate report page; (b) done without a hint by at least 4 of 5.
 Not      Real data scale, keyboard use, mobile, student and evaluator surfaces, accessibility.
 covered  (Run the density and keyboard test from brief-v2 section 6 for any Progress view.)
```

---

## 11. Open questions

**For Sankalp**
1. Is Evidence a hidden page plus tabs acceptable, or does the program expect a destination called Reviews or Approvals when approval is on `[REQ SC-15, AR-01]`?
2. Should clinical faculty evaluating inside Prism (`[REQ §7 intro]`) get a faculty home in v1, or is the link enough?
3. `OD-27`: how should a program define "behind" (threshold, date, per course)? This IA shows counts only until you decide.
4. `OD-01`: is an explicit "Copy from offering" on Course > Skills acceptable instead of automatic carry-forward?
5. `OD-18`: is visibility of requests waiting 7 days or more, without reminders, acceptable `[REQ §14]`? May an admin resend a link?
6. Does an auditor role (read-only) belong in scope, or is Export enough `[REQ RP-10]`?

**For Aarti**
7. Entity lists were "a single line like Google search" with no filters `[BASE-ENT, May 13]`. Is a People / Progress toggle on Students acceptable so `RP-01` filters exist without breaking that rule?
8. Do you accept a Skill directory and detail page as a peer of Student and Course, given the base entities are Student, Faculty, Course Offering, Term and Master Course? Should Skill be added to `BASE-ENTITIES.md`?
9. Is a count-first state band (four numbers, no bars, no red) right for the coordinator audience?

**For Vishaka and Sarah (nursing SME)**
10. When a nursing director thinks about her program, is the first noun a skill, a student, or a cohort? That decides whether Cohort needs to be a directory.
11. Do lab instructors need batch sign-off (students as rows, one skill) `[OD-19]`? Entity-first has no home for it.
12. Is the Evaluators directory useful, or does it invite the ranking of preceptors that `[CALL 09-23]` flagged as ambiguous `[OD-11]`?

---

## What was not verified

- **Nothing was rendered, built or user-tested.** Click counts are hand estimates `[INFER]`, not measurements, and the 160-click setup number is uncalibrated against `friction-baseline.md`.
- Mobbin screens are not clinical education; none validates the noun choice. No reference exists for a skill directory with who-holds-it, three co-equal entities, a no-login evaluator, or 150 x 80 scale (section 8).
- I did not re-read `ux/07` wireframes S-02..S-18 line by line (the index and S-01 only, plus their placement in `ux/03`), `ux/10` beyond sections 4 and 5, or `ux/11` beyond the principles and heuristics head.
- DS component availability is taken from `ux/10` and `brief-v2`; I did not run `node tools/ds/source.mjs` or open `localhost:4000`.
- The vault `_Insights.md` was grepped for entity-layout and skills notes, not read in full. The two vault entity notes were read.
- `docs/ux/12` research plan was not read. The test plan above may overlap it.
