# Redesign R1, "Report-first": the report is the front door

Date: 2026-10-09 · Mode: `/design-variants` spec (ASCII and rationale, no TSX, nothing built, nothing published) · Scope: the OVERALL product architecture of Prism Skills Tracking
Status: **proposal for Romit.** Not a confirmed contract. Every `OD-*` stays OPEN and is built as its named seam. Hard stops stand.
Tags: `[REQ id]` requirement · `[OD-n]` open decision, never treated as decided · `[CALL 10-08 Aarti]` Aarti, inferred (no diarization, at least two voices on the raw) · `[CALL 10-09]` · `[CALL 09-23]` · `[CALL 09-30..10-02 leaders]` · `[PROTO]` Sankalp's prototype · `[MOBBIN name]` a Mobbin screen whose image I viewed on 2026-10-09 · `[BUILD]` read in `admin/` (file names and sizes only, not line by line) · `[INFER]` my inference, to validate.
Precedence for behaviour: REQ > CALL > PROTO > INFER. Illustrative names and counts ("Foley catheter insertion", "87 items") are placeholders made up for this document. Prism ships no skills `[REQ SL-01]`.
No em-dashes, sentence case, no icons on action buttons, no progress bars as the primary visualisation, no red in any score or status visualisation.

Read for this file (in the order the brief set): `design/ARCHITECTURE-INPUTS-2026-10-09.md`, `strategy/08`, the three `research/meetings/2026-10-09-raw-review-*.md`, `README.md`, `strategy/05` and `07` (new rows), `journeys/01-03`, `ux/01, 03, 11` in full, `ux/07` (S-01, S-02) and `ux/10` (export table and component matrix), `design/brief-v2.md`, `build/ds-shell-anatomy.md`, `design/mobbin-evidence.md`, `research/meetings/2026-10-09-mobbin-*.md`, the three old variant files (first 60 lines each), the full REQ extract, `admin/lib/skills-nav.tsx` and `admin/lib/skills-routes.ts`, and the vault copy of the 2026-09-23 transcript (grep for the reporting passages only, lines 70 to 108). I did not re-read the 45 to 70 KB variant bodies, `ux/02, 04 to 06, 08, 09, 12`, or the Oct 5 interview in full (the raw-review file states it was read in part).

---

## 0. Evidence check: what the new calls say, and how firm

I verified each constraint against `strategy/08` and the raw-review files before designing. Quotes below are `[CALL 10-08 Aarti]` unless stated. I did not re-fetch Granola for this file; "raw verified" is the 2026-10-09 check recorded in `strategy/08` section 16.

| # | Statement the design must honour | Firmness (per `08`) | What I did with it |
|---|---|---|---|
| E1 | "Then skills, competencies, EPS, everything becomes one list." Aarti also says "how is this different from competence?" needs alignment and hands the merge to another person | Moderate, and unresolved by her own words | One list in the UI, `kind` label, no competency scoring inherited. Section 8 seam S1 |
| E2 | "My report should be my launch page." / no "separate place where they go to see ... and then a separate place where they have to go to trigger" | Firm, repeated | This variant's whole thesis. **Caution:** the quote is about the student-level report ("I have to be able to do this at the student level"). That an admin cohort report is also the launch page is my extension `[INFER]`, supported by leaders asking for an actionable landing ("These are all your students who need attention", `[CALL 09-30..10-02 leaders]`). Flagged in section 11 and 12 |
| E3 | Counts against targets per item: "at least 5, 5, 5, 5, 5 of each ... I've done 2 of these, 4 of these, 6 of these" | Firm | Per-item numerals are the report's primary reading, not a bar |
| E4 | "every course can only have a soft mapping. Not a hard mapping." / bold, star or colour / "they should be able to do any of it" | Firm | Course is a highlight overlay, never a gate or a destination |
| E5 | "Program requirements is defined once and every student should meet those requirements." / "we are not going to do hours in here." | Moderate / Firm on hours | v1 denominator is "every active configured item", the same for every student; a reserved program-requirement slot (OD-30). No hours |
| E6 | "All of this stays at the student level." / rotation is "just FYI. On my main report, I don't care." | Firm for the headline | No rotation or setting axis on the report; setting stays in the evidence panel and the minimum rules |
| E7 | Evidence from self, faculty, faculty then preceptor (sequenced), N signatures from distinct preceptors, a question or whole assessment, a course grade or pass, a standalone form | Moderate; REQ silent beyond student-submitted | Evidence rows carry a source label; only student-submitted is live (OD-31, OD-33, OD-37) |
| E8 | "we don't develop something completely from scratch and we just abstract out that" / extend the competency | Moderate | Reuse of the built engine, ledger, configure parts and the DS competency vocabulary; no competency scoring copied |
| E9 | "skills should be both an independent module but also integrated" | Moderate (Romit's own view) | Report and student checklist are embeddable surfaces (OD-34 seam) |
| E10 | "the last week of October ... at least some version" | Moderate target | Section 10 names a thin slice; a target, not a commitment (`07` C-18) |
| E11 | Accreditation has a separate owner | Moderate | Export of evidence only (RP-10); no accreditation output (REQ section 14, OD-35) |

If a statement of Aarti conflicts with a REQ, I design the seam and flag it for Sankalp. I do not pick. Open conflicts carried into this file: C-9 (one list vs REQ 1.4), C-11 (automatic evidence), C-12 (mapping soft vs course pass grants), C-16 (where it was learned vs SC-12), C-14 (report vs separate review destination, design only).

---

## 1. Thesis, the one question, what in the new evidence it answers

### 1.1 Thesis

```
 THESIS    A program does not want a report AND a place to act. It wants ONE live list of every student
           against every item the program expects, where any row can be opened in place to read the
           evidence, ask for or give a sign-off, or fix how the item is set up. The report is the
           launch page. Setup is not a separate product: it is a mode the report offers whenever it
           finds items that are not set up, and it works on the same rows.

 ONE       "Who has met what, and what can I do about this row, without leaving this page?"
 QUESTION

 OPTIMISES The weekly coordinator and the student: both open a report of their own list. Reading, asking
           for review, approving and configuring are verbs on a row.
 DOES NOT  The very first minutes of an empty program. The report has nothing to report, so its empty
 OPTIMISE  state has to carry the whole beginning (section 4.5 and 6). That is this variant's biggest bet.
```

### 1.2 What in the new evidence it answers (and what it does not)

| New evidence | R1 answer | Section |
|---|---|---|
| One student-level list of skills, competencies, EPAs, procedures, essentials | One list. Rows have a quiet `kind` text label. One nav noun, "Checklist", pending the label decision (OD-34) | 3, 8 (S1) |
| "My report should be my launch page" | Admin lands on the Report; student lands on "My checklist", which is their own report | 2, 4 |
| No separate place to see what is met and another to run the report/trigger | "Ask for review" lives on the unmet row; "Waiting on me" lens lives in the report; setup lives on the Not set up rows | 4, 6 |
| Soft course mapping only | Course emphasis tab plus a "Highlight for course" control; counts "this course" and "overall" together | 2, 4.3 |
| Program requirements defined once, every student meets them | Same denominator for every student; reserved Program requirements slot | 3, 8 (S5) |
| All at student level, rotation FYI | Report has no setting or rotation column; the student panel keeps them | 4.2 |
| Evidence from self, faculty, faculty plus preceptor, grades, course pass, assessment scores, standalone forms | Source chip on every evidence row; sequenced chain steps; only student-submitted is live | 5, 8 |
| Extend the competency mapping, do not build new | `kind` label and nullable competency link; reuse of built parts | 3, 10 |
| Standalone and also integrated | Report and checklist are embeddable pages; entitlement state reserved | 8 (S7) |
| Version by the last week of October | Thin slice in section 10 | 10 |
| Accreditation has a separate owner | Evidence export only | 7 |

What R1 deliberately does **not** answer: who may trigger a review and for whom (OD-29 is built as a seam), what "behind" means (OD-27, no threshold, no "behind" label anywhere), whether advisors may read the report (OD-25, FERPA).

### 1.3 What I kept from the old variants and the built hybrid, and what I dropped

| Item | Kept or dropped | Why (evidence) |
|---|---|---|
| Variant B student detail as an anchor | **Kept, as a panel** instead of a destination | Counts per item and the review trigger sit together, which is exactly E2/E3 (`ARCHITECTURE-INPUTS` section 3) |
| Variant A "Set up" sequence (import, configure, map) | **Kept as report states**, not a rail group | The sequence still matches the 09-23 order (library, configuration, thresholds, workflow); the weekly report is not "Understand", it is the home |
| Variant C inbox | **Kept as the "Needs a decision" strip and the "Waiting on me" lens** | Leaders asked for an actionable landing; Aarti did not ask for a queue-only home |
| Variant C cohort matrix | **Dropped** | No call supports a matrix at 150 x 100; Mobbin has no precedent at that scale `[MOBBIN gap]`; red status conflicts with the no-red rule (`07` C-19) |
| Hybrid Home as its own page | **Dropped** | The report is the home; "Home = setup journey" is replaced by the report's own states |
| Hybrid Attainment and Reviews as two rail rows | **Dropped, merged** | This is the split Aarti objects to (`07` C-14) |
| Hybrid Courses as a destination | **Dropped to a tab** under Set up | Mapping is a soft highlight (E4) |
| Locked "Go live" gate, step progress bar | **Stays dropped** | REQ has no go-live step (OD-15), bars are banned as primary viz |
| DS shell, profile-menu view switch, utility bar | **Kept** | `build/ds-shell-anatomy.md`, DEC-023 |
| Side-panel drill-down instead of stacked dialogs | **Kept and widened** | `brief-v2` principle 4; applies to review and configure too |
| Kits (group configure with impact list) | **Kept, as an action on selected rows** | IM-14, Jira bulk pattern `[MOBBIN Jira Bulk Operation, prior file]` |
| Log sheet and preceptor one-screen page | **Kept** | Nothing in the Oct 8 to 9 calls challenges them (`ARCHITECTURE-INPUTS` section 4) |
| Course-first student view | **Dropped** | Whole checklist is the home; the course is an overlay (`journeys/02` new evidence) |

**Tension to name, not hide:** `DEC-017` says layout, IA and containers follow the prototype (Overview, Library, Course mapping, Review as tabs and 1024px dialogs). Romit's 2026-10-08 instruction was to build the exact mockup. The Oct 8 to 9 evidence post-dates it and `brief-v2` already departed from the prototype's structure. R1 departs from the prototype's IA on purpose. **Romit needs to confirm that this redesign request supersedes DEC-017 for IA and containers** `[INFER]`. Behaviour still follows the REQ.

---

## 2. Architecture map

### 2.0 Legend and rules

```
 ROW     primary rail row (level 1)              PAGE    its own URL
 LENS    a view of the SAME report, switched by Tabs or a segmented control (not navigation)
 TAB     horizontal Tabs variant="line" inside a page            PANEL  non-modal FloatingSheetPanel, lg, resizable
 SHEET   modal Sheet (only where a panel would hide the thing being edited)    DLG   modal Dialog (short, decisive)
 Depth   max 2: ROW -> (LENS or TAB). Panels, sheets and dialogs are not levels.
```

Rules (R1-R7) `[INFER]`:

| # | Rule | Why |
|---|---|---|
| R1 | The report is the only list a user needs to start from. No rail row duplicates a lens of it | E2 |
| R2 | Every report row has the same four verbs available in place: Open, Ask for review (or Approve), Set up, Export. Which ones show depends on role and row state | E2, E3 |
| R3 | Setup state is **derived from data**, never ticked and never dismissed. A re-import can reopen it | `[REQ IM-10, IM-11]` `[MOBBIN Pipedrive, home-setup file]` |
| R4 | Numerals first. Every state has a text label. Colour and glyph only support | `[ux/11 DP-9]` `[REQ SH-03]` |
| R5 | No time words on the report: no due, overdue, behind, remind, expire | REQ section 14, OD-27 open |
| R6 | One filled primary per surface. The report has none. Panels carry one ("Ask for review", "Approve", "Apply") | `ux/11` heuristic 14 |
| R7 | Nothing from the hard-stop list sits behind a label | `07` D |

### 2.1 Administrator and coordinator (and the reviewer, same person with the approval hat `[REQ AR-01]`)

```
UTILITY BAR   [toggle] [(E) Prism v] <page title>  ...  Search ⌘K · Notifications · Help · Ask Leo | Sample University v | RS v
              profile menu: Switch to student view · Switch to evaluator view · Appearance · Sample data      [ds-shell-anatomy]

RAIL (2 rows, expanded by default)
 Report                            PAGE   the launch page, badge = items waiting on me when any
   lens control (Tabs):            By student | By requirement | By tag | Waiting on me (n)        [RP-02 RP-03 RP-04 AR-01]
   strip above the lens:           Needs a decision (counts that filter the report)
   panel (opens in place):         Student panel > Item evidence > Evaluation detail  (stacked views, breadcrumb inside)
                                   Requirement panel (the item, its target, who has met it)
                                   Compare and decide panel (Waiting on me)
                                   Set up panel (configure one or many selected rows)
 Set up                            PAGE   low frequency; tabs
   Items                           TAB    the library list; Import (dlg + full-width review), Add item (dlg)   [SL-02 SL-10 IM-01..15]
   Kits                            TAB    saved configurations applied to selected rows                         [IM-14]
   Categories                      TAB    list + dlg                                                            [SL-03 SL-05 SL-06]
   Tags                            TAB    list + dlg                                                            [SL-04 SL-05 SL-06]
   Clinical settings               TAB    list + dlg                                                            [SL-07]
   Evaluators                      TAB    roster, "Named by students" adopt list                                [SL-08 SL-09]
   Course emphasis                 TAB    offering list + emphasis editor (soft)                                [CM-01..08]
   Program requirements            TAB    RESERVED, hidden until OD-30 is answered
UTILITY BAR is not nav. Command palette indexes students, items, and the actions Import, Add item, Export.
```

Why two rows: Aarti's own words say the see place and the act place should be one `[CALL 10-08 Aarti]`. The built hybrid had five rows (Home, Skills, Courses, Attainment, Reviews). R1 keeps the only part that is not part of the weekly loop (definition work) behind a second row, and deletes the rest. `[INFER]` A two-row rail is a DS shell edge case, see section 10.

Routes (module base `{base}` unresolved, OD-P1) `[INFER]`:

```
{base}/report?lens={student|requirement|tag|waiting}&{filters}&highlight={offeringId}
{base}/report?student={id}&item={id}&evaluation={id}          panel state in the query string, shareable
{base}/report?setup=1&ids=...                                  set up panel for the selection
{base}/set-up/items | kits | categories | tags | settings | evaluators | course-emphasis
{base}/set-up/items/import/{batch}/review
```

### 2.2 Advisor and faculty (Prism login)

```
RAIL   Report                      the same page, scoped to the students the person may read      [OD-25, FERPA]
       (no Set up row)
In "Waiting on me": requests where THIS person is a configured signer. Open = the evaluator form inside the Prism shell [REQ §7 intro, EV-02]
```

Whether an advisor may read the student-level report at all is a read-scope question, not a v1 feature `[CALL 10-08 Aarti]` (a listener's question, Weak) `[OD-25]`. R1 builds the scope hook, not the grant. A faculty member who is also a preceptor is one person with two roles `[CALL 10-05]`: the role belongs to the evidence row, not the person.

### 2.3 Student (own login)

```
RAIL   My checklist                PAGE   the student's own report, the launch page                  [CALL 10-08 Aarti]
        controls:  Needed | All (segmented) · Highlight for course [v] · Search
        rows:      grouped by category; each row = item, count against target, state, who it waits on
        panel:     Item history (bottom sheet on a phone, right panel on desktop)                      [SH-01..07]
        sheet:     Ask for review (the log sheet; one or many selected items)                          [ST-04 ST-05..ST-13]
```

One row in the rail is a DS shell edge case. Proposal `[INFER]`: the student shell hides the rail and uses the utility bar plus a bottom bar on phones (`brief-v2` 3.2). The student **page is the same component** as the admin's per-student list, so it can be embedded in Student Success or a Prism student home (OD-34 seam).

### 2.4 Evaluator (preceptor, lab instructor, faculty by link): no shell, no login

```
Email link ---> /e/{token}      ONE page. No nav, no account, nothing else reachable.             [EV-01]
                  shows: student context, supplied details, self-evaluation if configured          [EV-04]
                  per item: the program's own questions, never editable                            [EV-03]
                  end: "Counts now" | "Held for administrator approval" | "Goes to the next sign-off"  [EV-07, OD-33 seam]
Never shown: the student's achievement status, progress counts, or other items on the report         [OD-17 default off]
```

### 2.5 Page, tab, panel and dialog inventory

| Type | Items |
|---|---|
| Pages | Report, Set up, My checklist, Evaluator page |
| Lenses of Report | By student, By requirement, By tag, Waiting on me |
| Tabs of Set up | Items, Kits, Categories, Tags, Clinical settings, Evaluators, Course emphasis (+ reserved Program requirements) |
| Panels (non-modal) | Student panel, Requirement panel, Compare and decide panel, Set up panel, Item history (student) |
| Sheets | Ask for review (student), Configure wide editor if the panel is too narrow (resizable to xl; past xl use a route) |
| Dialogs | Import input, Add item, entity add/edit (category, tag, setting, evaluator), Confirm apply to N, Export |

---

## 3. Object model as the user sees it

Nouns the user sees, in their own words. Entity names are `[INFER]`; every relationship is backed by a REQ id or a call.

```
                               ┌──────────── PROGRAM ────────────┐
                               │ defines                         │ runs
                        ┌──────▼───────┐                  ┌──────▼──────┐
   ONE LIST ──────────► │    ITEM      │◄── emphasised by─┤  COURSE     │  soft highlight only [CM-05, CALL 10-08 Aarti]
 (skill, competency,    │ name, descr. │   (mandatory or  │  (offering) │
  EPA, procedure,       │ kind (label) │    non-mandatory)└─────────────┘
  essential)            │ category?    │
 [OD-28, OD-02]         │ tags*        │
                        └──┬───────┬───┘
            has one when   │       │ nullable link, unused in v1 [OD-02, OD-28]
            set up         │       └──────────────► COMPETENCY (existing Prism record)
                    ┌──────▼─────────────────────────────────────┐
                    │ TARGET (what "met" means, set up once)     │  [SC-01..SC-19]
                    │  how evidence arrives  [OD-31]             │  student-submitted only is live
                    │  evaluation model + qualification rule     │  chosen explicitly, no default [SC-02]
                    │  count, level minimums, setting minimums   │  [SC-10 SC-11 SC-12]
                    │  SIGN-OFF CHAIN: step[ role, count,        │  [OD-33, OD-06, SC-15, SC-16]
                    │                       distinct people ]    │  v1 = chain of length one or two
                    └──────┬─────────────────────────────────────┘
                           │ every student meets the same targets
                    ┌──────▼──────┐    reserved                    ┌─────────────────────────┐
                    │ STUDENT     │    ┌─ PROGRAM REQUIREMENT ─┐   │ REVIEW REQUEST          │
                    │ RECORD      │    │ total, category quota,│   │ the "trigger"; from the │
                    │ one per     │    │ accreditor vs program │   │ row, a placement, or    │
                    │ student x   │    │ level (no hours)      │   │ the cohort row [OD-29]  │
                    │ item        │    └── [OD-30, OD-27] ─────┘   └────────────┬────────────┘
                    └──────┬──────┘                                              │ creates
                           │ holds                                        ┌──────▼──────┐
                    ┌──────▼──────────────────────────────────────────────┤  EVIDENCE   │ ledger, immutable once complete [RV-03]
                    │ state: No evidence yet · Evidence does not qualify ·│  row        │
                    │        In progress · Achieved   [AE-04, OD-03 flag] │  sourceType │ student-submitted | self | system (seams)
                    └─────────────────────────────────────────────────────┤  who + role │ person-lite, no login [EV-01, SL-08]
                                                                          │  when, course, setting, location, result, counted?
                                                                          └─────────────┘
```

How the one list, requirements and evidence relate, in the user's words:

| User says | In the model | Source |
|---|---|---|
| "Everything on the checklist" | The Item list, one table, `kind` is a text label | `[CALL 10-08 Aarti]` `[OD-28]` |
| "What every student has to meet" | The Target of each active, set-up item, applied to all students; plus the reserved Program requirement for totals | `[CALL 10-08 Aarti]` `[OD-30]` |
| "What has this student done toward it" | Evidence rows on that student's one record for that item, across all courses | `[REQ CM-07, AE-05, SH-06]` |
| "This course highlights these" | Emphasis, per offering, mandatory or non-mandatory, never a gate | `[REQ CM-03, CM-05]` |
| "Ask for a review of this" | A Review request attached to the student record, sent to the chain's first signer | `[REQ ST-04]` `[OD-29]` |

Terms: the UI says **item** where a program has not chosen a word, and the program's own word where it has (a copy token: Skill, Competency, Procedure, Essential) `[INFER]` `[REQ SL-01]`. The report lens "By requirement" lists one row per item with its target. I use "requirement" for "the item plus its target"; "program requirement" is the reserved total. This is a naming risk (section 11).

---

## 4. Key screens (full ASCII wireframes in the DS shell)

Numbers are placeholders. Buttons are text-only. State columns show the **four-state rendering** (OD-03); the merged "Not met" rendering stays one display flag away `[ux/11 DEC-002]`.

### 4.1 The launch screen: Report, By student lens (admin, program live)

```
┌ ☰  (E) Prism ▾ │ Report                                    🔍 ⌘K   🔔   ?   ✦ Ask Leo │ Sample University ▾ │ RS ▾ ┐
├────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Report 16  │ Report                                                                              [ Export ▾ ]       │
│ Set up     │ Who has met what across the program, and what needs a decision.                                       │
│            │                                                                                                        │
│            │ Needs a decision                                                                                       │
│            │ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│            │ │ Waiting on me 16  [Show]   Lab instructors to adopt 2  [Show]   Items to set up 0   Lines not read 0│ │
│            │ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│            │ [Cohort: BSN 2027 ✕] [Group: any] [+ Add filter] Clear all              Highlight for course [None ▾]   │
│            │ 150 students · 87 items · all evidence counted, any course, any setting                                │
│            │ ┌ Students ──┬ Met every item ──┬ Items with no evidence yet ──┬ Waiting on me ┐                       │
│            │ │ 150        │ 11 of 150        │ 9 of 87                      │ 16            │   (KeyMetrics, flat)  │
│            │ └────────────┴──────────────────┴──────────────────────────────┴───────────────┘                       │
│            │ ( By student )( By requirement )( By tag )( Waiting on me 16 )        [🔍 Search students] [Sort: fewest met ▾]│
│            │ ─────────────────────────────────────────────────────────────────────────────────────────────────────  │
│            │ Student           Cohort  Met        In progress  Does not qualify  No evidence yet  Waiting  │          │
│            │ ▸ Priya Tran      BSN 27  12 of 87      20            3                 52             2     [Open]    │
│            │ ▾ Noah Zeller     BSN 27  61 of 87      14            1                 11             0     [Open]    │
│            │     Respiratory           7 of 9 met                                                                    │
│            │     ▾ Cardiovascular      5 of 8 met                                                                    │
│            │         IV insertion            7 of 5 demonstrations     Achieved       ★ NURS 350                     │
│            │         Foley catheter          2 of 3 qualifying         In progress    ★ NURS 350    [Ask for review] │
│            │         Wound care              4 of 4 demonstrations     Evidence does not qualify                     │
│            │                                 Needs 1 in Inpatient, 1 in Emergency        [Open]                      │
│            │     ▸ Medication safety   6 of 8 met                                                                    │
│            │ ▸ Olivia Martin   BSN 27  58 of 87      18            0                 11             1     [Open]    │
│            │   ...                                                                                                   │
│            │ Counts are student-item records. One item belongs to one category. Showing 25 of 150  [ Show 25 more ] │
└────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Notes on this screen:

- **No filled primary.** Read surface; "Export" is outline `[ux/11 heuristic 14]`. "Ask for review" on a row is a text-only outline button (ghost on dense rows), visible to the roles that may trigger (OD-29 seam, default student only; section 8).
- **The row expands in place** to the student's one list, grouped by category with a count per category (`7 of 9 met`). This is the "5, 5, 5, 5, 5 of each, I've done 2, 4, 6" reading `[CALL 10-08 Aarti]`, rendered as numerals with a text state, not bars. "Open" opens the Student panel (4.2).
- **Course highlight** is a star on rows the chosen course emphasises, plus the course name. It never hides or locks a row `[REQ CM-05]`. With a course chosen the scope sentence adds "In NURS 350: 4 of 6 · overall 61 of 87", which is Aarti's "in this course ... and overall where do they stand" `[CALL 10-08 Aarti]` (Moderate).
- **Scope sentence** says what is counted: all evidence, any course, any setting. Setting and rotation are not columns `[CALL 10-08 Aarti]` (Firm for the headline). A setting minimum still shows in the row text where it blocks "Achieved" (Wound care above) so SC-12 is never a surprise `[REQ SH-05, SC-12]`.
- **Status vocabulary:** No evidence yet, Evidence does not qualify, In progress, Achieved `[REQ AE-04]` as `StatusBadge` tones neutral, warning, info, success. No red. "Evidence does not qualify" is a statement of fact plus the failed rule, never "failed" or "behind" `[REQ SH-03]`.
- **"Needs a decision"** is a strip of counted chips that filter this same report. Zero-count chips are hidden and the strip says "Nothing waiting" when all are zero `[MOBBIN Oyster, prior file]`. No dates, no age, no "overdue" `[REQ §14]`.
- **KeyMetrics** is a flat band, max four, with denominators `[MOBBIN Deel compliance documents]`. No "needs attention below 50 percent" tile: that is a threshold judgement about students (OD-27) `[brief-v2 risks]`.
- **Impossible filter** combinations show the explanation, not an empty table, with remove buttons `[REQ RP-09]` (S-01 P-06 pattern, reused).

### 4.2 One drill-down: the Student panel (open in place; the report stays visible and clickable)

```
┌ Report ─────────────────────────────────────┬ Noah Zeller · BSN 2027 · Group A ───────────────────── ✕ ┐
│ ▾ Noah Zeller   61 of 87   ...   [Open]      │ Report > Noah Zeller                                      │
│   ...                                        │ 61 of 87 items met · 14 in progress · 1 does not qualify  │
│ ▸ Olivia Martin 58 of 87   ...               │ · 11 no evidence yet            Highlight for [NURS 350 ▾]│
│                                              │ ( All 87 )( Needs action 26 )( Waiting 0 )                │
│                                              │ ────────────────────────────────────────────────────────  │
│                                              │ Wound care                       Evidence does not qualify│
│                                              │   Demonstration · 4 of 4 demonstrations                   │
│                                              │   Observed 1 of 1 · Assisted 1 of 1 · Independent 2 of 2  │
│                                              │   Setting: Inpatient 1 of 1 · Emergency 0 of 1            │
│                                              │   Why: needs 1 more demonstration in Emergency            │
│                                              │   Counts toward it: from the student, signed by faculty   │
│                                              │   then a preceptor                                        │
│                                              │   Sign-off: faculty ✓ then preceptor ✓  (chain, 2 steps)  │
│                                              │   [ Ask for review ]   [ View evidence ]   [ Set up ]     │
│                                              │ Foley catheter                   In progress              │
│                                              │   2 of 3 qualifying evaluations     ★ highlighted NURS 350│
│                                              │   [ Ask for review ]   [ View evidence ]                  │
│                                              │ ▸ Evidence for Wound care (4)  ───────────── source ──────│
│                                              │   05-11  Clinical · Inpatient · Harbor FP · NURS 350       │
│                                              │          Student submitted · J. Delgado, RN (preceptor)    │
│                                              │          Independent · Counted                [ View form ]│
│                                              │   05-02  Lab · simulation · NURS 340                       │
│                                              │          Student submitted · K. Larsen (lab instructor)    │
│                                              │          With assistance · Counted (not toward a clinical  │
│                                              │          setting minimum)                                  │
└──────────────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

- **Stacked views, never dialog on dialog:** Student panel, then Item evidence, then Evaluation detail, with a breadcrumb inside the panel (`Report > Noah Zeller > Wound care > Evaluation 05-11`). Esc steps back one view `[brief-v2 principle 4]` `[REQ RP-05, RP-06, RP-07]`. This replaces the three stacked 1024px dialogs the parity build uses (DEC-019) `[BUILD]`.
- **The evidence row is where soft mapping, setting and rotation live**: course and setting are written on each ledger row, so "where it was learned does not matter to the headline" stays true while "lab never satisfies a clinical minimum" stays enforced `[CALL 10-08 Aarti]` `[REQ SC-12]`.
- **Sign-off chain** is drawn beside the item (a text stepper, `faculty, then preceptor`), the Aboard pattern `[MOBBIN Aboard approval flow, prior file]`. A chain of length one is one word.
- **Actions in place:** Ask for review (the trigger), View evidence, Set up (admin only). The same panel is the student's own history on the student side (4.3).

**Second state of the same panel, "Waiting on me" (reviewer)**

```
┌ Report ───────────────────────────────────┬ Rina Okonkwo · IV insertion · NURS 350 ───────────── ✕ ┐
│ ( By student )( ... )( Waiting on me 16 )  │ Report > Waiting on me > Rina Okonkwo                  │
│ Agree 12            [x] select all agree   │ Student rated: Independent     Evaluator: Independent   │
│ [x] Rina O. IV insertion    NURS 350       │ Agree.  If approved this counts as 5 of 5 demonstrations│
│ [x] Noah Z. Foley           NURS 350       │ Supplied by the student: date 05-11, unit 4 West, ...   │
│ ...                                        │ Evaluator comment: "..."                                 │
│ Differ 4                                   │ ▸ See all responses                                      │
│ [ ] Jonah N. IV insertion   NURS 350       │ Review note (optional) [______________________]          │
│ [ Approve 12 selected ]                    │ Sign-off chain: faculty ✓ → preceptor ✓ → you (approval) │
│                                            │            [ Return for correction ]   [ Approve ]       │
└────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

AR-01 columns (student, skill, course, setting, location, evaluator, role) are the table columns of this lens. "If approved this counts as ..." states the consequence before the button `[MOBBIN Deputy, prior file]`. The return wording stays neutral until OD-16.

### 4.3 The student home: My checklist (phone first)

```
┌──────────────────────────────┐
│ My checklist                 │
│ Overall   42 of 87 items met │      <- "of 100 required" appears here when OD-30 is answered
│ This course  3 of 6 · NURS 350│
│ ( Needed 45 )( All 87 )      │
│ Highlight for [ NURS 350 ▾ ] │
│ 🔍 Search                    │
│ ───────────────────────────  │
│ Cardiovascular       5 of 8  │
│ ☐ ★ Foley catheter           │
│     2 of 3 qualifying        │
│     In progress              │
│ ☐ ★ Wound care               │
│     4 of 4 demonstrations    │
│     Evidence does not qualify│
│     Needs 1 in Inpatient,    │
│     1 in Emergency           │
│ ☐   Tracheostomy care        │
│     No evidence yet          │
│ ☐   Central line dressing    │
│     Waiting on J. Delgado    │
│ ▸ Respiratory        7 of 9  │
│ ▸ Medication safety  6 of 8  │
├──────────────────────────────┤
│ [ Ask for review (2) ]       │      <- appears when rows are ticked; the only filled primary
└──────────────────────────────┘
```

- **The whole checklist is the home, course is the overlay:** star and bold mark what the course emphasises; every other row is still tickable `[CALL 10-08 Aarti]` `[REQ ST-02, CM-05]`. "Needed" is a segmented filter over the same list, not a second page `[MOBBIN Public, prior file]`.
- **Counts, then state, then the failed rule in words** (SH-02, SH-03, SH-05). "Waiting" names who it is with `[REQ SH-02]`.
- **Category counts first** (`5 of 8`): `[MOBBIN Walmart registry checklist]` shows the category rail with counts and an "Essential | recommended" label per row, which is the same grammar as mapping emphasis.
- Tap a row: **Item history** opens as a bottom sheet (attempts in order, outcome, who, feedback, "View form", "Revise and resend" for returned) `[REQ SH-01..07, RV-01]`.
- **Ask for review** opens the log sheet already built (setting inferred from placement, recent evaluators as chips, self-evaluation inside the sheet when configured) `[brief-v2 3.3, ST-06, ST-08, ST-11]`. With a program that credits an item automatically (seam S2), that row shows "See how this counts" instead of the button (section 8).
- Mobile targets at least 44px; every state has a text label; no bar anywhere.

### 4.4 The evaluator, mobile, no shell

```
┌──────────────────────────────┐
│ Prism                        │
│ Sign off 2 items             │
│ Olivia Martin · NURS 350     │
│ You are J. Delgado, RN       │
│ ─ Foley catheter ──────────  │
│ Supplied by the student      │
│ Date 05-11 · Unit 4 West     │
│ Student self-evaluation: ... │
│ Performed preparation?       │
│ ( Yes )          ( No )      │
│ Performed procedure?         │
│ ( Yes )          ( No )      │
│ Comment (required)           │
│ [__________________________] │
│ ─ IV insertion ─────────────  │
│ ...                          │
│ After you submit: Foley      │
│ counts now. IV insertion     │
│ goes to the next sign-off.   │
│ [ Submit 2 items ]           │
└──────────────────────────────┘
```

- Unchanged in shape from the built page `[BUILD components/evaluator]` and the earlier variants: one page, large single-choice (RadioGroup), mandatory comment blocks submit `[REQ EV-01..EV-07]`.
- **Chain-aware only in the outcome line.** The evaluator is told what happens next ("counts now", "held for administrator approval", "goes to the next sign-off"). They are never shown the student's achievement, other signers' names, or progress counts `[OD-17 default off]` `[ux/11 AP-12]`. Showing "signature 2 of 3" would leak progress, so R1 does not (PA passport shape, OD-33).
- Sequenced chains (faculty, then preceptor) release each link to the next signer only after the previous step completes; a link per signer, no login, so `[REQ EV-01]` holds `[OD-33]` `[INFER]`.
- Honest gap: no Mobbin reference exists for a no-account guest approval page (section 9).

### 4.5 The setup path for 80 skills, inside the report

The report's own states carry setup. Five frames of one page.

```
FRAME 1  Empty program: the report with real zeros and one next action
┌ Report ─────────────────────────────────────────────────────────────────────────────────────────┐
│ Report                                                                                          │
│ Nothing to report yet. Bring in the list your program already has.                              │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────┐    │
│ │ Items 0 · Students 150 · Evidence 0                                                       │    │
│ │ [ Bring in your list ]    Add one item by hand    Ask Leo to read a document (AI is off) │    │
│ │ Spreadsheets, Word documents and PDFs. No template needed. Nothing is created until you   │    │
│ │ confirm it. Limits: ...                                                                   │    │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
   (Prism ships no items. The manual path works with AI off.)  [REQ SL-01, IM-12, IM-13] [CALL 10-02]

FRAME 2  Import review (full-width, the trust moment; reuses the built review)
┌ Set up > Items > Import review ───────────────────────────────────────────────────────────────┐
│ 80 items found · 3 possible duplicates · 2 lines could not be read · 6 headings proposed as categories│
│ [x] Include  Name                   Description               Category (proposed)    Duplicate?     │
│ ...                                                                                              │
│ Not read: "SECTION 2 - ADVANCED PROCEDURES" (original text kept)                                  │
│                                                  [ Cancel ]   [ Create 80 items ]                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
   [REQ IM-04..IM-08, IM-13]

FRAME 3  After import: the report lands on By requirement, filtered to what is not set up
┌ Report ─────────────────────────────────────────────────────────────────────────────────────────┐
│ Needs a decision:  Items to set up 80  [Show]                                                   │
│ ( By student )( By requirement )( By tag )     [Filter: Not set up ✕]   Group by [Category ▾]   │
│ [ ] Item                         Category        Students who have met it     Status            │
│ [x] Wound care                   Procedures      not tracked yet              Not set up        │
│ [x] IV insertion                 Procedures      not tracked yet              Not set up        │
│ ...                                                                                              │
│ Not set up items cannot be mapped or submitted against.            [ Set up 3 selected ]         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
   [REQ IM-09, IM-10]. The count "80" is derived and falls as rows are set up. There is no dismiss.

FRAME 4  The Set up panel on a selection (group by category, choose the model ONCE for the group)
┌ Report ──────────────────────────┬ Set up 25 items · Procedures ─────────────────── ✕ ┐
│ ... 25 rows ticked               │ Evaluation model (choose one; none is preselected)  │
│                                  │ ( Binary )( Questions )( Scored )( Demonstration )  │
│                                  │ Levels: 1 Observed · 2 With assistance · 3 Indep.   │
│                                  │ Qualifies when: every completed demonstration       │
│                                  │ Needs: 5 demonstrations · 1 observed · 3 independent │
│                                  │ Student supplies: Date* · Unit* · Notes             │
│                                  │ Sign-off: [ Faculty ▾ ] then [ Preceptor ▾ ] (optional)│
│                                  │ ▸ What the student and evaluator will see (preview) │
│                                  │ Will apply to 25 items. 0 are already set up.        │
│                                  │ [ Apply to 25 items ]    Keep each item's own value  │
└──────────────────────────────────┴─────────────────────────────────────────────────────┘
   Apply shows a summary, then the list of the 25 items, then one confirm.   [REQ IM-14, SC-02, SC-18, SC-19]
   Default for any item already set up: "keep current value"                  [MOBBIN Pipedrive Bulk edit, prior file]

FRAME 5  The report again: the rows have turned into real report rows
│ Needs a decision:  Items to set up 55  [Show]      <- derived, decreased by 25                      │
│ By requirement:  Wound care · Procedures · Met by 0 of 150 · No evidence yet 150                    │
```

The built `apply-config-dialog.tsx`, `copy-config-dialog.tsx`, wizard parts and import review `[BUILD]` are reusable inside Frames 2 and 4; what changes is the host (a panel on a report row) and the landing (the report, not a library list).

### 4.6 Set up > Items (the secondary mode, low frequency)

```
┌ Set up ─────────────────────────────────────────────────────────────────────────────────────────┐
│ ( Items )( Kits )( Categories )( Tags )( Clinical settings )( Evaluators )( Course emphasis )     │
│ [🔍 Search items]  [Category ▾] [Tag ▾] [Status: Active ▾]  [Import batch ▾]    [ Import ] [ Add item ]│
│ 87 items · 80 set up · 7 need set up  [Show them in the report]                                  │
│ Name              Kind        Category      Set up   Tags        Courses highlighting   Status    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Two filled primaries are not allowed (AP-18): "Import" is filled when the library is empty, "Add item" outline; once populated both are outline and the filled primary is "Show them in the report" only when items need set up `[INFER]`. Kind appears as a column only when the program uses more than one kind (section 8 S1).

---

## 5. How each source of evidence appears

All sources land in the same ledger. A row always shows: **source, who, role, when, course, setting, location, result, counted or not**. The headline report never shows the source; the panel always does.

| Source | v1 status | In the report row | In the panel ledger | On the student checklist | Hard stop and seam |
|---|---|---|---|---|---|
| **Student-submitted, evaluated by one evaluator** (faculty, preceptor, lab instructor) | Live | Counts only | "Student submitted · Name (role) · result · Counted" | Row state and "Waiting on Name" | EV-01, RV-03; the only live source `[REQ ST, EV]` |
| **Self-evaluation as input** (compared with the evaluator) | Live where configured | Counts only | Both outcomes shown, agreement line | Inside the log sheet before Send | `[REQ ST-11, AR-02]` `[DEC-001]` |
| **Self-attestation alone** (no evaluator) | Seam, off | Counts only | "Student attested · no evaluator · Counted" | Row has "Mark as met" in place of "Ask for review" | A selectable model, never a default, never hidden `[SC-02]` `[OD-37]` |
| **Faculty only** | Live (chain of one) | Counts only | One chain step | One "Waiting on" | `[OD-06, SC-16]` |
| **Faculty then preceptor, sequenced** | Seam on top of the live chain of two | Counts only | Chain text: "faculty ✓ then preceptor ✓" with each step's signer | "Waiting on J. Delgado" names the current step | `[OD-33]`; link per signer, no login `[EV-01]` |
| **N signatures from distinct preceptors** (PA passport) | Seam | Counts only | Each signature is its own row; "3 of 3 distinct" appears only to the admin/student, never to the evaluator | "2 of 3 signatures" is a count against target | `[OD-33]` `[CALL 10-08 Aarti]`; a signature means "was there", not quality |
| **Question or whole assessment, end-of-rotation form question** | Seam, off | Counts only | "Counted from: Assessment NURS 350 midterm, question 7" (system row, no evaluator) | "See how this counts"; no trigger | No auto-credit on unconfigured items `[IM-09]`; `[OD-31]` |
| **Course grade or course pass** | Seam, off | Counts only | "Counted from: course pass NURS 350" | Same | Evidence, not a gate `[CM-05]`; owned by the item, not the mapping `[OD-32]`; changed grade needs an explicit rule or it breaches RV-03 `[OD-31]` |
| **Standalone FAST form** | Seam, adapter | Counts only | Form shown through the same "View form" | Same as student-submitted | `EvaluationConfig` adapter point `[OD-36]` |
| **Outside performance data** (exam prep, OSCE scores) | Not in v1 | n/a | n/a | n/a | `[CALL 10-05]` (Moderate); import is an unspecified feature, not designed |
| **Patient log** | Not designed | n/a | n/a | n/a | REQ section 14 and `07` C-10; ask whether this is the section 14 feature |

Rules that follow from this:

1. **A system-sourced row is never editable and never says "evaluated".** It says what it was counted from. The "counted?" column is re-derived from the item's current rule `[REQ AE-02]`.
2. **The evaluator link never exposes the chain beyond the next step.**
3. **Where a setting minimum exists, the ledger still writes the setting on the row**, so the report can ignore it without the rule ignoring it `[REQ SC-11, SC-12]`.
4. **Preceptors who are also faculty** appear once per role on the evidence row (the person is one record, the role is context) `[CALL 10-05]` `[OD-05]`.

---

## 6. Three journeys with click counts

Counts are click or tap estimates by me, not measured. They are `[INFER]`; the baseline for comparison is `design/friction-baseline.md` as quoted in `brief-v2` (setup about 2,000 interactions for 100 skills today; the hybrid claims about 180 including about 80 for mapping).

### 6.1 First-hour setup (admin, 80 items, four groups of similar items)

| # | Step | Where | Clicks |
|---|---|---|---|
| 1 | Open the app, land on the empty Report, click "Bring in your list" | Report (Frame 1) | 1 |
| 2 | Choose the file, read it | Import dialog | 2 |
| 3 | Scan the review: edit 3 names, resolve 3 duplicates (skip, keep both, replace) | Import review (Frame 2) | 9 |
| 4 | Create 80 items | Import review | 1 |
| 5 | Land on the Report, By requirement, filtered "Not set up" (80) | Report (Frame 3) | 0 |
| 6 | For each of 4 category groups: filter by category (2), select all (1), "Set up N selected" (1), choose the model tile (1), set labels or levels (about 4), set the rule and target (about 2), student fields default (0), open preview once (1), Apply (1), confirm the list (1) | Set up panel (Frame 4) | about 14 x 4 = 56 |
| 7 | Report shows "Items to set up 0"; click the first student to see their list | Report (Frame 5) | 2 |
| **Total** | | | **about 70 (range 60 to 80)** |

What this assumes: 4 genuinely distinct groups; mapping is skipped because mapping is soft and optional (a "Course emphasis" pass is extra and can wait) `[CALL 10-08 Aarti]` `[REQ CM-05]`. If the 80 items fall into 10 groups the count is about 160. **First value arrives at click 5**, when the report already lists the items and students can already see them as "Not set up"; students cannot submit until set up `[REQ IM-09]`.

### 6.2 Weekly: who is behind, and sign-off

| # | Step | Clicks |
|---|---|---|
| 1 | Open the app: the Report is the landing | 0 |
| 2 | "Waiting on me 16": click Show | 1 |
| 3 | Approve the 12 that agree: tick select-all (1), "Approve 12 selected" (1), confirm (1) | 3 |
| 4 | The 4 that differ: open (1), read, decide (1) each | 8 |
| 5 | Back to By student: sort "fewest met" (1), expand the first student (1), open the panel (1) | 3 |
| 6 | Ask the student, or read their chain: panel "Ask for review" only if the program turned on admin-may-trigger (OD-29); otherwise read the unmet list and tell the student (no reminder feature, REQ section 14) | 0 to 2 |
| **Total** | | **about 15 to 17** |

Approval and "who is behind" happen without leaving one URL. Compared with the hybrid's two rows (Reviews about 25 interactions for 16, plus Attainment about 6 across 3 stacked dialogs) this is about a quarter fewer and removes the page change `[INFER]`. "Behind" is read as "fewest met" or "no evidence yet", never as a labelled status (OD-27 open).

### 6.3 Accreditation evidence pull

| # | Step | Clicks |
|---|---|---|
| 1 | Report; set Cohort filter (2) | 2 |
| 2 | Lens "By requirement"; open the one item the site visitor asked about (1) | 2 |
| 3 | Requirement panel: read how many students met it, the target, the sign-off chain; open one student's evaluation (2) | 2 |
| 4 | Export menu (1), "Evidence detail, row per evaluation" (1), confirm; filters are written into the file header (1) | 3 |
| **Total** | | **about 9** |

The accreditation form itself (pharmacy Standard 7, FARMS) is out of scope (REQ section 14, OD-35). R1 only guarantees the export returns the full filtered scope and records its filters `[REQ RP-10]`.

---

## 7. Requirement coverage (every REQ area) and homeless items

`Home` = where the requirement lives in R1. `Moved` = same behaviour, new container. All REQ behaviour is unchanged; only containers change.

| REQ area | IDs | Home in R1 | Change from the built hybrid |
|---|---|---|---|
| Library | SL-01..SL-11 | Set up > Items, Categories, Tags, Clinical settings, Evaluators | Moved: the library is a second rail row's tabs. SL-11 deactivation: items drop out of the report scope, evidence is retained |
| Import | IM-01..IM-15 | Report empty state, Import dialog, full-width review, then Report filtered "Not set up"; Set up > Items filters by import batch | Moved: setup card and attention list on Home become the Frame 1 and Frame 3 states of the report |
| Configuration | SC-01..SC-19 | Set up panel from a report row, or from Set up > Items; lineage panel and preview in the panel | Moved: dialog wizard becomes a panel or sheet |
| Course mapping | CM-01..CM-08 | Set up > Course emphasis; "Highlight for course" in the report and student page | Reduced: soft highlight only; CM-04 counts shown in the editor; OD-01 stays open |
| Student submission | ST-01..ST-14 | My checklist, Ask for review sheet | Changed: course-first page becomes one checklist with a course overlay (ST-01 "what my course expects" is the highlighted subset; ST-02 stays true, nothing is hidden) |
| Evaluator | EV-01..EV-08 | Evaluator page; in-shell for faculty | Same, plus an outcome line for chains |
| Admin review | AR-01..AR-06 | Report > Waiting on me, Compare and decide panel | Moved: Reviews rail row removed |
| Revision | RV-01..RV-06 | Student Item history; Waiting on me for returned items | Same |
| Student history | SH-01..SH-07 | Item history panel; checklist row states | Same, now the default view across courses (SH-06) |
| Reporting | RP-01..RP-11 | The Report itself; Export menu | Promoted: from a rail row to the launch page |
| Achievement engine | AE-01..AE-08 | Engine unchanged; four states in every row and the display flag | Same |
| Open decisions | OD-01..OD-13 | See section 8 and the seams list | OD-01, OD-03, OD-08, OD-10, OD-12, OD-13 untouched; OD-02 sharpened by OD-28 |
| Out of scope | REQ section 14 | Not designed: remediation, reminders, expiry, patient-encounter linkage, accreditation outputs, Evaluations migration | n/a |

**Homeless items** (no natural home in a report-first IA, and what I propose) `[INFER]`:

| Item | Why it is homeless | Proposed home | Risk |
|---|---|---|---|
| Lab instructor adoption (SL-09) | An evaluator list, not a student or item row | Set up > Evaluators, surfaced as a count chip in "Needs a decision" | Chip may be missed |
| Rule-change impact preview ("12 students move from Achieved to In progress", AE-02) | It is an effect on the report from a Set up action | Inside the Set up panel before Save, with a link "Show them in the report" | Heavy query on a live report |
| Deactivated category or tag still on an item (SL-06) | A list-hygiene state | Set up > Items filter "Has an inactive category or tag" | Low |
| Stalled evaluator requests (OD-18) | Needs a resend control; REQ section 14 excludes reminders | Row text only ("Waiting on J. Delgado"); no age, no resend; ask Sankalp | Students and coordinators will ask for resend |
| Per-import traceability (IM-11) | An item attribute | Items filter "Import batch" | Low |
| Program requirements (OD-30), accreditor vs program level | No object exists | Reserved tab and a reserved line in the student summary | Aarti may expect it on day one |
| Entitlement / "not enabled for this program" (OD-34) | A product state, not a row | A full-page state in place of the Report, with an example that uses no school data | Needs the landing-page owner |
| Student-facing "view as" for staff (mock student account on the platform) | Not a report item | Profile menu "Switch to student view" (built) | None |

---

## 8. Seams, with "if answer X the UI does Y"

Every seam is a labelled shape that fits either answer. None is decided here.

### S1. OD-28 / OD-02: one list vs separate from competency `[CALL 10-08 Aarti]` `[OD-28]`

| Answer | What the UI does |
|---|---|
| **Today (undecided)** | One table, one nav noun ("Checklist" or the program's own word via a copy token). `kind` is a plain text label on the row, shown only if the program uses more than one kind. No competency scoring, level averages or radar are inherited `[REQ 1.4]`. A nullable competency link exists in the data and not in the UI |
| **One list** (Aarti's recommendation) | `kind` becomes a filter chip and a column. The competency link appears in the Item editor and in the Requirement panel ("Linked to Essentials domain 3"). Competency-style quantitative scoring stays a separate evaluation model, never a default `[SC-02]`. REQ 1.4 must be amended by Sankalp first |
| **Two modules with a link** | `kind` becomes a scope control above the lenses (like Course), Report shows one module at a time, and the link renders as a chip that opens the other module's record. The Report's launch role is unchanged |

### S2. OD-31 / OD-32 / OD-37: evidence sources `[CALL 10-08 Aarti]`

| Answer | What the UI does |
|---|---|
| **Today** | Student-submitted only. The ledger row has `sourceType`; the configure panel does not show a "how evidence arrives" question; the student checklist always shows "Ask for review" on a configured row |
| **Add automatic sources** (assessment, course pass, FAST form) | Configure's first step becomes **How does evidence arrive**, as selection tiles (no default). A system-sourced row is labelled "Counted from ..." and cannot be edited. On the student checklist an automatic-only item shows "See how this counts" instead of "Ask for review". Unconfigured items still never receive evidence `[IM-09]` |
| **Add self-attestation only** | A selectable model in the same tile step. The row action becomes "Mark as met". The report shows "Attested by student" in the panel ledger. Never preselected `[SC-02]` |
| **No on any** | The tile step never appears; nothing else changes |

### S3. OD-32 / CM-05: hard vs soft mapping, and what a course pass does

| Answer | What the UI does |
|---|---|
| **Soft only (current REQ, Aarti's firm statement)** | Course emphasis is a star and bold plus "Highlight for course". No row is hidden or disabled. Submitting an unmapped item is always allowed `[REQ ST-02, CM-05]` |
| **A course pass may confer an item** | The rule lives on the **item**: "Counts when course NURS 350 is passed" appears in the Set up panel under evidence arrival (S2). The mapping tab does not change. The ledger row says "Counted from course pass". Mapping stays an expectation `[OD-32]` |
| **Mapping gates eligibility** (not requested by anyone) | Conflicts with CM-05 and Aarti's "they should be able to do any of it". R1 would not build it; if Sankalp insists, the student checklist would gain a disabled state with a stated reason (DP-4), which I advise against |

### S4. OD-29: who triggers, from where

| Answer | What the UI does |
|---|---|
| **Student only (REQ, default)** | "Ask for review" is on the student's own row and in the log sheet. The admin panel shows the same row with no trigger |
| **Admin on behalf of the student** | The admin Student panel and the report row show "Ask for review for Noah". The sheet opens prefilled with the student's identity and records who triggered `[INFER]` |
| **From a placement** | The placement page (outside this product) deep-links to My checklist filtered to that placement's course; the result still lands on the one checklist `[CALL 10-08 Aarti]` ("I may be able to trigger it from inside of a particular placement, that's okay") |
| **Removed** | The button disappears; the layout does not move |

### S5. OD-30 / OD-27: program requirements and "behind"

| Answer | What the UI does |
|---|---|
| **Today** | The denominator is "every active, set-up item". The student summary says "42 of 87 items met". The Program requirements tab is hidden. No "behind", "at risk" or "watchlist" label exists anywhere |
| **A program total exists** (for example 100) | The student summary becomes "42 of 100 required"; the report KeyMetrics adds "Met the program total 11 of 150"; a quota by category appears as the category count in the list (`7 of 9` becomes `7 of 10 required`). Hours remain out `[CALL 10-08 Aarti]` |
| **Two thresholds** (accreditor vs program) | A second line "Accreditor level" under the summary. Status vocabulary stays non-red: "Meets program level", "Meets accreditor level only", "Below accreditor level" as text and neutral, info and warning tones. Proposed in `[CALL 10-05]` as red and orange; not adopted (`07` C-19) |
| **"Behind" is rank-based** (bottom 20 percent, `[CALL 09-23]`) | A sort and a filter chip "Fewest met" on By student; still no label. FERPA and fairness cautions in `brief-v2` apply |

### S6. OD-33: the sign-off chain

| Answer | What the UI does |
|---|---|
| **Single approval step (current)** | A chain of one or two steps drawn as text. Admin approval (SC-15) is step N |
| **Ordered general chain** | The Set up panel gains an ordered step list (role, count, distinct people). The panel and the Waiting lens draw the chain; evaluator links are issued per step |
| **N distinct signers** | The ledger lists each signature; the student sees "2 of 3 signatures"; the evaluator sees nothing of the count |

### S7. OD-34: standalone vs integrated, label, entitlement

| Answer | What the UI does |
|---|---|
| **Standalone** | As drawn; the product switcher lists the module. The label is a copy token |
| **Part of Student Success** | The student's My checklist is embedded in the student profile or timeline as a section; the Report is one tile of the program dashboard. Pages are components, so nothing is redrawn |
| **Not enabled for this program** | The Report route renders a full-page state: what the module does, an example with no school data, an "Express interest" action `[CALL 09-30..10-02 leaders]`. Rail is unchanged |

### S8. OD-36: forms

| Answer | What the UI does |
|---|---|
| **Existing FAST forms reused** | The evaluator page is rendered by an adapter over the existing form; "View form" in the panel opens the same form; the configure panel shows "Uses form: NURS 350 skills form" in place of the model editor for those items |
| **Generated from configuration** | The evaluator page is rendered from `EvaluationConfig` (built) |
| **One shared form vs a form per item** | The multi-response pattern (one form, many records, each tied to an item) is supported in the data model; the student sheet already submits several items at once `[CALL 10-09]` |

### S9. Display flag OD-03 and evidence scope OD-22

The four-state rendering stays one flag from merged. Rotation and setting remain evidence attributes, not report axes (OD-22 leans against rotation-scoped frequency on the headline, not decided).

---

## 9. Mobbin: analogies for this variant's core idea

Tool: Mobbin MCP (`claude_ai_Mobbin`), web and iOS, 7 screen searches on 2026-10-09; every returned image was viewed. The searches were for: progress against a requirement set in a report-first home, skills and competency matrices and portfolios, requirement checklists grouped with counts, entity records with an evidence list, report lenses with a side panel, mobile counted checklists, and no-login external confirmation. Earlier-pack evidence (`mobbin-evidence.md`, the two 2026-10-09 Mobbin files) is cited where it already answers part of this. **No product below is clinical education, credentialing for clinicians, or an accreditation tool.** Fit is my judgement `[INFER]`: **Strong** answers a requirement of the job, **Partial** one idea transfers, **Weak** does not answer the job.

The target: a nursing or health-professions program, 40 to 200 items, 100 to 200 students, per-student sign-off chains, no-login evaluators.

| # | Product | URL | What it does | What transfers | What does not transfer | Fit |
|---|---|---|---|---|---|---|
| 1 | Vanta, "Controls" | https://mobbin.com/screens/0e24849e-96f6-4350-8e77-727f29293b4c | A page that opens on two summary cards (Assignment 4 percent, Completion 99 percent) above a filterable table of controls, each row with a per-control count (2/2, 3/3) | The report-as-front-door shape: summary on top, one filterable list under it, counts per row against a target | A donut and a green completion bar are the primary visual; rows are controls, not people x controls; no sign-off chain per person | Strong (structure), Partial overall |
| 2 | Deel, "Compliance documents" | https://mobbin.com/screens/9feb7477-a0de-46c4-8e31-a3117eb1162c | Three count cards with denominators ("155 / 249 workers", Not submitted, Incomplete, Completed) above a worker table with status and a row action | Counts with denominators as the headline; the cards act as filters of the table; closest domain match (people against a document requirement) | Row action is "Send message", a reminder, which is out of scope (REQ section 14); statuses use red for overdue | Strong (counts), Partial overall |
| 3 | Codecademy, "Skills tracking" | https://mobbin.com/screens/d5c43b15-4d4b-4c10-9eaf-33d1e9533e44 | A page of skill sets with a grid of skills and a right-hand panel of sub-skills with a "Learn" and an "Evaluate" button | The one place where seeing a skill list and starting an evaluation of it sit on the same page; a panel opens from a cell | Percentages per skill; one learner, not a cohort; the evaluate action is self-serve, no sign-off chain | Partial |
| 4 | 15Five, "Competency results" | https://mobbin.com/screens/e99a8704-df37-4c4b-8047-fb770aaf5b47 | Competency rows against a rating range with checkboxes to include Self, Manager and Peer ratings | Evidence by source (self, manager, peer) as a toggle; maps to our source chips | A scored distribution grid; ratings, not counts; ranking flavour (fairness caution) | Partial |
| 5 | Uxcel, "Competency analysis" | https://mobbin.com/screens/077b681c-46f4-4b0a-a63b-bd0f1e10e1c3 | Radar chart of competencies with score and peer ranking | None. Named so nobody re-finds it | Radar, score, global ranking; ranking students is a risk (`brief-v2` fairness) and scores are not default | Weak |
| 6 | Charma, "Engagement scorecard" | https://mobbin.com/screens/ec30f1b5-302a-4747-af47-8c224486bd98 | Person rows against activity columns with coloured dots | A people x items glance exists as a pattern | Red, amber, green dots, which breach the no-red rule; dense matrix with no precedent at 150 x 100 | Weak |
| 7 | Fresha, "Consultation form" | https://mobbin.com/screens/d59eca09-4329-4287-a79b-7abacf974d54 | Four count cards (Sent, Completed, To be completed, Not completed) with a client table of status | Counts first, a person table with text status pills | Percent bars under each count; one form, not a list of items per person | Partial |
| 8 | Walmart, "Registry checklist" (web) | https://mobbin.com/screens/bac2077b-1190-4960-a382-510d4c214fcb | A category rail with counts (0/8, 0/7), rows with checkboxes | Category counts first, one list below; closest match to the student checklist grouped by category | Retail; no states beyond a checkbox; no sign-off | Strong (student list shape), Partial overall |
| 9 | Walmart, "Registry checklist" (iOS) | https://mobbin.com/screens/5386a11c-1fb9-4dd5-aabf-7d36dd5a6652 | Category chips with counts (Feeding 0/11) over rows labelled "Essential" or "3 recommended" | The "Essential | recommended" per-row label is the same grammar as mandatory and non-mandatory emphasis | The label is a shop hint; no state or count per row | Strong (emphasis label), Partial overall |
| 10 | Target, "Checklist" (iOS) | https://mobbin.com/screens/5c2bd4eb-0deb-413f-976c-133844fe32e1 | "0 of 85 items completed" with a category list showing 0/12 complete | A single overall numeral plus per-category counts at phone width | A progress bar at the top (banned as the primary viz); no per-row state | Partial |
| 11 | Navattic, "Visitors" | https://mobbin.com/screens/79a31934-4ca2-4700-86a5-c180fa735404 | A people table with filter chips and a right-hand record panel (tabs Activity and Details, summary counts, an event list) | List stays visible, a non-modal record opens beside it, with tabs and event rows | Product analytics; no actions on rows | Strong (row to panel) |
| 12 | Dovetail, "Contacts" | https://mobbin.com/screens/aac9827e-b12f-4fe5-908a-2efd0acfcc11 | A table with a panel of one record opening on the right | The same row-to-panel pattern, with the selected row staying highlighted | Research CRM | Partial |
| 13 | ElevenLabs, "User conversations" | https://mobbin.com/screens/e5619492-dfcd-4ad4-9fc9-d4c0cdd58c6d | A user list with a panel holding a timeline of events, each with a status (Successful, Failed) | An evidence ledger in a panel: dated entries with a result chip and metadata | Failed in red; AI conversations, not human sign-offs | Partial |
| 14 | Klaviyo, "Profile" | https://mobbin.com/screens/7a9377d8-6bc4-4746-bcde-a55418e9f376 | A person record with tabs (Details, Metrics, Lists) and an event timeline on the right | Record page with a summary header, tabs and an event list; our evidence ledger shape | Marketing consent states; no counts against a target | Partial |
| 15 | Workable, "Edit candidates widget" | https://mobbin.com/screens/4ea0a96c-5f9b-446a-bdd3-52bcf15b069f | A report with a choice between "Table breakdown" and "Summary view" and report filters applied to the widget | The report is switchable between a detail view and a summary of the same data; filters are shared | A report builder; we have fixed lenses | Partial |
| 16 | Airtable, "Grid view filter" | https://mobbin.com/screens/20e00ec3-d817-4539-b61e-d6fd4c64629b | Grid with Filter, Group, Sort and Colour in one toolbar and saved views at the left | Group by category and filter in one toolbar; saved views as lenses | A general database; no states or counts | Partial |
| 17 | Visible, "Review responses" (iOS) | https://mobbin.com/screens/14c7efb9-6786-499d-a3a1-f889205f5d6e | "Before you submit ... they can no longer be changed", a Review responses row and one primary | The warning that a submitted answer is immutable (RV-03) in the exact place of the commit | Single user; no evaluator | Partial |
| 18 | Cash App, "Is everything correct?" (iOS) | https://mobbin.com/screens/e6ef5ad1-449f-4382-9610-717ea4be9c29 | Two buttons, "This info isn't correct" and "Looks good" | A two-outcome footer with both outcomes visible | A tax form | Partial |
| 19 | IKEA Home smart, "The host needs to approve your request" (iOS) | https://mobbin.com/screens/4e1809da-0014-47c9-9a91-ffa82abef9ef | A numbered "what happens next" over a send button | The "what happens next" line before Submit for an evaluator (EV-07); the email-based confirmation flow | The approver is a signed-in host, not a no-account guest | Partial |
| 20 | Prior file: Remote "Things to do" and Zendesk "requiring attention", Oyster empty state, Squarespace "Show all" per-group counts, Pipedrive setup complete, Jira Bulk Operation, Pipedrive "Keep current value", Aboard approval flow, Deputy balance impact, Public "Needed / All" segment | in `design/mobbin-evidence.md` and `research/meetings/2026-10-09-mobbin-*.md` | Counted attention strips, setup as the first row of the same list, derived completion, bulk apply with a summary, approval chain beside an item, consequence before approve | Each is used where cited above | Each carries the "does not transfer" noted in those files | Strong to Partial per file |

**Where no reference exists (stated plainly):**

1. A report whose rows are student x requirement at 150 x 100 with four states and a per-student sign-off chain. The nearest (Vanta, Deel) are per-control or per-document, not per-person-per-item. The Charma matrix is the only people x items screen found and it uses red.
2. A report whose empty and half-configured states are the setup entrance with a **live decreasing count**. Pipedrive, Wix and Squarespace show setup lists that are ticked or dismissed.
3. A no-login, no-account evaluator page that is part of a sequenced chain. All approver screens found assume a signed-in approver (this repeats the gap in `mobbin-evidence.md` job type 7).
4. A student list where an overlay highlights items without hiding or gating the rest (the Walmart "Essential" label is the nearest).
5. Immutable evidence ledgers with per-row source and a role per row (Visible gives only the "cannot be changed" copy).

**Not verified:** Mobbin shows single frames; no interaction, timing or keyboard behaviour was observed. I cannot say whether any of these products keeps a list visible while a panel opens, or what its keyboard model is, beyond the frame.

---

## 10. Reuse vs rebuild of the current admin build, and what must change in the DS shell

`[BUILD]` Observed from file names and line counts only (`admin/components/**`, 11,067 lines in the folders I counted; `lib/skills-nav.tsx`, `lib/skills-routes.ts`). I did not read the component bodies. Size S, M, L = small, medium, large by my estimate of change, not of file size.

| Area | Built today | R1 change | Size |
|---|---|---|---|
| Engine, store, domain, seed, selectors (`lib/domain, engine, store, seed`) | Four states, ledger, rules, `applyConfiguration`, `copyMappings`, `proposeImport`, `unconfiguredCount`, `reviewQueue`, `reportBySkill` | Add `kind` to Item, `sourceType` to evidence, `SignOffStep[]` per item, nullable `ProgramRequirement`, `reportByRequirement` selector, a "Waiting on me" selector merging reviewQueue | M |
| Nav (`skills-nav.tsx`, `skills-routes.ts`, `redirects.ts`) | Home, Skills, Courses, Attainment, Reviews | Two rows: Report, Set up. Redirects: `/home`, `/attainment`, `/reviews` to `/report`, `/skills/library` and `/courses` to `/set-up/...` | S |
| Home (`components/home/*`, 5 files) | Setup card, attention list, glance | Becomes Frame 1 and the "Needs a decision" strip; `home/derive.ts` reused | S |
| Attainment (`reporting/overview-*`, `report-tables`, `report-filters`, `kpi-strip`, `export-menu`) | Overview with By student, By skill, By tag | The launch page. Add inline row expansion by category, "Highlight for course", a fourth lens, the strip, inline row actions | M |
| Drill-down (`reporting/report-dialogs.tsx`, 722 lines) | Three stacked 1024px dialogs (DEC-019) | A single non-modal panel with stacked views | M to L |
| Reviews (`components/review/*`) | Card list with Approve and Return | Lens "Waiting on me", compare and decide panel, select-all-agree | M |
| Configure (`components/configure/*`, wizard 431 lines) | A 3-step wizard in a 1024px dialog (DEC-016) | Host in a Set up panel or xl sheet; keep sections, lineage panel, preview, apply and copy dialogs | M |
| Import (`components/import/*`) | Input dialog and a 647-line review | Reuse; landing target changes to the Report filtered "Not set up" | S |
| Library (`components/library/*`) | Skills tab, Taxon tab, Settings, Lab tabs | Reuse as Set up tabs; add Kits and Course emphasis tabs | S |
| Mapping (`components/mapping/mapping-workspace.tsx`, 400 lines) | Offering list and skill panel | Becomes the Course emphasis tab; emphasis wording, no gating (CM-05 already) | S to M |
| Student (`components/student/*`: course-skills-view 407, my-skills-view 246, send-dialog 478, history-view 322, history-dialog 256) | Course-first page, My skills, a send dialog, history | One checklist component for student and admin per-student list; send dialog becomes the log sheet; history becomes a bottom sheet or panel | **L** |
| Evaluator (`components/evaluator/*`, `app/(evaluator)/e/[token]`) | One page, no shell | Outcome line for chains | S |
| Shell (`components/shell/*`) | Utility bar, product and scope switchers, profile view switch | Unchanged | none |

Overall: **M to L**. The biggest cost is the student checklist (a new combined list) and the conversion of three dialogs to a panel. The cheapest value is the nav change and the strip.

**A thin slice for the last-week-of-October target** `[INFER]`, only if the target means "a version a person can click" rather than a build (it may not, `07` C-18):
1. Nav to Report and Set up (S).
2. Report with By student expansion, "Highlight for course" and the Not set up filter on By requirement (M).
3. Student checklist as one list with the existing send dialog behind "Ask for review" (M).
4. Everything else as built and reachable through Set up.

**What must change in or be confirmed about the DS shell** (`build/ds-shell-anatomy.md`):

| Need | Question for the shell | Note |
|---|---|---|
| A two-row admin rail and a one-row or no-rail student shell | Does `AppSidebar` degrade cleanly with 1 to 2 rows, and can the rail be hidden per persona? | The starter and PCE have 4+ rows; verify against localhost:4000 (`not run here`) |
| A non-modal right panel taking about 40 percent width beside a long table | `FloatingSheetPanel` is non-modal, no focus trap, single rail, `exclusive` | Verify at 1280px that the table remains usable; check keyboard return to the opening row `[INFER]` |
| Row expansion inside `DataTable` (a student row opening its list) | Does `DataTable` support nested rows with their own state column, or does this need a custom composition? | If not, expand opens the panel instead and the inline list moves to the panel; cost M |
| KeyMetrics flat band, max four | Supported (`exxat-kpi-flat-band`) | Fine |
| A segmented Tabs bar with a count on one tab ("Waiting on me 16") | Tabs support badges? | `BadgeCount` is a red chip per `ux/10`; use a neutral count in the label instead of `BadgeCount` (no red) |
| Embeddable pages (OD-34) | The pages must not assume the Prism shell | The built shell wiring is app-level `[BUILD components/app-shell-wiring.tsx]` |

---

## 11. Risks, what would make it fail, and the cheapest 5-user test

### 11.1 Risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| K1 | **Overreach on the launch quote.** Aarti said the student report is the launch page. The coordinator's report as launch page is my extension `[INFER]` | If wrong, the admin front door is a Home with a worklist, not a report | Show both frames to Aarti on Thursday; the student half stands either way |
| K2 | **An empty report carries first-time setup.** A new admin sees zeros | Setup is where adoption is decided (`journeys/01`, REQ section 3) | Frame 1 gives one next action; test with 5 first-time admins (11.3) |
| K3 | **Scale.** 150 students x 87 items in one table with inline expansion | No Mobbin precedent at that scale; screen-reader and keyboard cost | Category counts first, items on expansion; virtualised rows; open in the panel as the fallback |
| K4 | **Naming collision.** "By requirement" vs "program requirement" | Aarti uses "requirements" for the program total; the lens lists items | Test the label with coordinators; the copy token can become "By item" without a layout change |
| K5 | **Mixed target shapes** in one list (counts, levels, pass/fail, N signatures) | A "Target" column that says "5 demonstrations" next to "pass the course" is hard to scan | A generic Target text column, never a number column; test with the PA passport and the nutrition case |
| K6 | **Acting on the wrong row.** Row actions on a dense list | Mis-triggered review or set up | One filled primary only inside the panel; confirm lists; undo not possible on submit, so confirm text states what happens |
| K7 | **Red creeping back** through the two-threshold proposal (G5) | No-red rule | Non-red vocabulary in S5; confirm with Aarti |
| K8 | **Advisor read scope** (OD-25, FERPA) | The report names students | Role-scoped data; no grant built |
| K9 | **Hard-stop pressure** from "doesn't matter where they learn it" | SC-12 | Report hides setting; panel and the rule keep it |
| K10 | **Staleness.** The implementation Excel lands Thursday; real set-ups may favour automatic evidence or a different list shape | `strategy/08` 13 | Section 5 is already a seam; re-read when it lands |

### 11.2 What would make R1 fail

1. Coordinators say they open the product to do one job, **not** to read a report (for example they open to approve and nothing else). Then the launch page is the wrong first screen and the strip must become a queue (variant C Inbox).
2. First-time admins cannot find Import in the empty state within 20 seconds.
3. The By student list with inline expansion is not scannable at 150 students (they ask for a matrix or a "worst first" list).
4. Aarti's "launch page" meant only the student's page.
5. The one-list decision lands as "two modules" and the report must be per module, which makes "one page for everything" untrue.
6. The program-requirement total is the first thing Aarti asks for, and the report does not show it.

### 11.3 Cheapest 5-user test (half a day, no build)

Print three frames: 4.1 (admin launch), 4.3 (student phone), 4.5 Frame 1 (empty). Five coordinators or program directors (at least one nursing, one PA, one nutrition or SLP), the same session also with Aarti if she is free on Thursday.

| Task | Pass if |
|---|---|
| "You open the product on Monday. Show me what you do first." (4.1) | 4 of 5 say or point to the strip or the report without being asked to find a menu |
| "A student asks whether they have met Foley catheter." (4.1) | 4 of 5 find the row and read the count and state without leaving the page |
| "Approve what you can." (4.2 second state) | 0 of 5 look for another menu; 4 of 5 name the consequence line |
| "You have a new program and a Word file of 80 items." (Frame 1) | 4 of 5 find "Bring in your list" in under 20 seconds |
| "What does 'By requirement' show you?" (4.1) | 3 of 5 answer "each item and who has met it" without help |
| Student phone (4.3), 5 students: "What do you still need and how do you ask for it?" | 4 of 5 point to Needed and the row, and read the reason on an "Evidence does not qualify" row |

A failed 4.1 first task kills R1 and sends the team to the hybrid with the strip kept.

---

## 12. Open questions and the next Thursday meeting with Aarti

Aarti sessions are Thursday; the implementation Excel is due before it (`strategy/08` 11, 13). I could not see the Sep 22 Aarti call (null transcript).

### 12.1 For Sankalp (requirements owner)

1. **OD-28 and REQ 1.4:** do skills, competencies, EPAs, procedures and essentials become one list, and does the "must not inherit competency scoring" rule stand?
2. **OD-31:** is v1 student-submitted evidence only, or do assessment, grade, course pass and standalone forms count in v1? Is "patient log" the REQ section 14 feature?
3. **OD-30 and OD-27:** is there a program requirement (a total, quotas), where is it set, and what does "behind" mean? (R1 shows neither.)
4. **OD-29:** may an admin trigger a review for a student? May a placement trigger it?
5. **OD-33:** is a chain of ordered signers or N distinct signers in scope, or only the current one or two steps?
6. Does R1's departure from the prototype IA (DEC-017) fit your expectation, given your instruction is behaviour-first?
7. May Skills reuse the platform's Preceptor entity, merge story and reminder engine (OD-05, OD-18)?

### 12.2 For Aarti (Thursday)

Show the three printed frames. Ask, in this order (the cheapest and most blocking first):

1. **"When you said my report should be my launch page, did you mean the student's own page, the coordinator's, or both?"** (K1; the whole variant hangs on it.)
2. "Looking at this report, what is the first thing you would click, and what would you expect to happen?"
3. "Should a coordinator be able to ask for a review on behalf of a student, or only the student?" (OD-29)
4. "What would 'behind' mean to a program director, in the words they use?" (OD-27; no threshold proposed.)
5. "Is a program total (for example 100) the thing that tells you where a student stands overall, and is it per category as well?" (OD-30)
6. "In the Excel, which evidence sources and chains do most programs actually use?" (OD-31, OD-33)
7. "Does a course pass ever make an item met on its own?" (OD-32)
8. "What is the word programs use for the list: skills, competencies, essentials, procedures, or checkoff?" (OD-34, label)

### 12.3 For Vaibhav (landing, DS shell)

1. Is a two-row admin rail, and a rail-less student shell, acceptable in the DS shell?
2. Which Prism landing card hosts the Report, and what does a program without the module see (OD-34)?
3. Is a non-modal right panel a supported pattern at 40 percent width, with a keyboard contract?
4. The Prism front end is Angular; confirm the handoff expectation for a Next build as a design and behaviour reference (`07` G-21).

### 12.4 What I could not verify

- No transcript was re-fetched from Granola for this file; quote firmness is from `strategy/08`, and speaker attribution is weak throughout.
- The Sep 22 Aarti meeting is unavailable; the Oct 5 interview was read only in part in the raw-review file.
- The built `admin/` was read only by file name and line count, not by content; the S, M, L sizes are estimates.
- No part of this was rendered, user-tested, axe-checked or compared with localhost:4000. Every ASCII frame is unvalidated.
- Click counts are my estimates, not measurements.
- DS shell behaviours in section 10 (rail with two rows, panel width, nested rows in `DataTable`, tab badges) are questions, not confirmations.
- The Mobbin ratings are single-frame judgements.
- The thin slice for the last week of October assumes the target means "something clickable"; the Q1 build date in other sources may be what is meant.
