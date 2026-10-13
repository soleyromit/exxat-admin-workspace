# UX 07 — Screen Inventory & Low-Fidelity Wireframes

> **Superseded for visuals (2026-10-08):** Romit instructed that the app be built to Sankalp's prototype inside the DS base shell. `docs/build/prototype-parity.md` (cards P-01..P-12, with screenshots in `docs/source/parity/`) is now the **visual source of truth**. The ASCII wireframes below are superseded wherever they differ: S-02 and S-03 are 1024px dialogs (not a rail), S-04..S-07 are tabs on one library page with 672px entity dialogs, S-08 and S-09 are dialogs (S-09 is a 3-step Wizard, not a full page), S-11 is a card list, S-12..S-14 are one Student View page with dialogs, S-16 also exists as the in-shell demo `/preceptor`, S-17 is a two-item popover. Requirement IDs, states and acceptance tests in this file remain valid. Each contract's final section 'Build alignment (2026-10-08)' lists the exact differences.

**What this is:** one entry per surface (S-01…S-18) with purpose, persona, requirement IDs, open-decision seams, layout regions, an ASCII wireframe, hierarchy, actions, data, behaviour, the prototype screen to keep/avoid, and proposed improvements. **It is a layout argument, not a visual design.** Wireframes carry no colour, type scale or spacing values; those come from the DS (`10-component-inventory-and-ds-map.md`).
**Tags:** `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only; Sankalp's call: don't design from it) · `[CALL 09-23]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER. OD items are **never** treated as decided; each shows the **seam** that keeps both answers open (`docs/strategy/05-open-decisions.md`).
**Prototype screen numbers** (`docs/source/screens/NN-*.png`): 01 overview · 02 drill-down · 03 by skill · 04 by tag · 05 filters · 06 ledger · 07 evaluation detail · 08 library · 09 lab instructors · 10 settings · 11 tags · 12 import review · 13 import banner · 14 config step 2 (demonstration) · 15 config step 2 (question) · 16 config step 3 · 17 mapping · 18 review · 19 student view · 20 history · 21 send dialog · 22 sent · 23 preceptor form · 24 submitted · 25 export.
**Patterns** `P-01…P-18` are defined in `08-interaction-specs.md`. **States** are in `docs/strategy/06-states-and-edge-cases.md` (table §1 by surface; edge cases EC-n §2). **Copy** lives in `09-content-and-microcopy.md` §5 per surface.
**Global layout rules:** one filled primary CTA per surface · text-only action buttons · `LocalBanner` for product feedback (no toast) · status = text + (optional) icon, never colour alone · no uppercase-tracking labels as a default style (prototype's habit) · numbers are `tabular-nums`.
**Mobile `[INFER]`:** the requirements say nothing about devices. The student persona is "mobile/tablet during clinic shifts" and the preceptor "single-page, large radios, one URL in an email" (workspace domain context). Compact wireframes are therefore **proposals** for S-12, S-13, S-14, S-16 only. Admin surfaces are desktop-first, dense (coordinator persona).

## Surface index

| ID | Surface | Persona | Journey stage | Flows |
|---|---|---|---|---|
| S-01 | Overview (attainment) | P-A | Admin F–G | F-11, F-12 |
| S-02 | Student drill-down | P-A | Admin F–G | F-11 |
| S-03 | Evidence ledger + evaluation detail | P-A, P-R, P-S (own) | Admin F–G, Student 7 | F-11 |
| S-04 | Library: skills list | P-A | Admin A–B | F-02, F-04, F-14 |
| S-05 | Library: categories and tags | P-A | Admin A | F-02 |
| S-06 | Library: clinical settings | P-A | Admin A | — |
| S-07 | Library: lab instructors | P-A | Admin A | F-13 |
| S-08 | Import | P-A | Admin A | F-01 |
| S-09 | Skill configure | P-A | Admin B | F-03, F-04 |
| S-10 | Course mapping | P-A | Admin C | F-05 |
| S-11 | Review and approve | P-R | Admin E | F-08 |
| S-12 | Student: course skills | P-S | Student 1–2 | F-06 |
| S-13 | Student: send for review | P-S | Student 3–6 | F-06, F-09, F-10 |
| S-14 | Student: skill history | P-S | Student 7–8 | F-09, F-10 |
| S-15 | Student: my skills (all courses) | P-S | Student 7 | — |
| S-16 | Evaluator form (tokenised) | P-P, P-F, P-L | Evaluator | F-07 |
| S-17 | Export | P-A | Admin G | F-12 |
| S-18 | Evaluation-request email | P-P, P-F, P-L | Evaluator 1 | F-06→F-07 |

---

## S-01 Overview (attainment)

**Purpose:** show attainment across a population and make every number a door to the evidence behind it `[REQ §11]`. **Persona:** P-A. **REQ:** RP-01…RP-06, RP-08, RP-09, RP-10, AE-03, AE-04, AE-05. **Seams:** OD-03 (four states vs merged "Not met"), OD-10 (CSV vs Excel), OD-11 (evaluator/site dimension: capture always, expose later).
**Regions:** page header · filter rail · scope sentence · KPI strip (≤4) · view tabs (By student / By skill / By tag) · table toolbar (search, sort, Export) · table · footer (paging).
```
┌ Skills › Overview ─────────────────────────────────────────────────────────────┐
│ Overview                                         [ Export ▾ ]  (outline)       │
│ ┌ Applied filters ──────────────────────────────────────────────────────────┐  │
│ │ [Cohort: BSN 2026 ✕] [Course: NURS 350 ✕] [Setting: Inpatient ✕] +Add  Clear│ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│ 150 students · BSN 2026 · NURS 350 · counting evidence recorded in Inpatient   │
│ ┌ Students ─┬ Avg achieved ─┬ Achieved all in scope ─┬ Skills needing attention ┐│
│ │ 150       │ 3.2 of 9      │ 0 (0%)                 │ 6 below 50% achieved     ││
│ └───────────┴───────────────┴────────────────────────┴──────────────────────────┘│
│ ( By student | By skill | By tag )           [🔍 Search students] [Sort ▾]      │
│ ⚑ OPEN OD-03: ONE display flag `skillStatusDisplay` = "four" | "merged". Both renderings shown, neither committed │
│ A "four": Student ▲  Cohort · Group  Achieved  In progress  Evidence does not qualify  No evidence yet  Attainment │
│           Noah Zeller   BSN 2027 · A    7         0               1                        1             7 of 9  ›│
│ B "merged": Student ▲ Cohort · Group  Achieved  In progress  Not met (no evidence + does not qualify)  Attainment │
│           Noah Zeller   BSN 2027 · A    7         0               2                                      7 of 9  ›│
│ …                                                                              │
│ Showing 25 of 150                                          [ Show 25 more ]    │
└────────────────────────────────────────────────────────────────────────────────┘
```
**Hierarchy:** (1) scope (filters + sentence) → (2) 4 headline numbers → (3) table. **Primary action:** none filled (read surface); Export is `outline`. **Secondary:** Add filter, view tabs, search, sort, row open.
**Data:** per student achieved / in progress / evidence does not qualify / no evidence yet (or merged "Not met", flag OD-03) + n of N; per skill (model, students in view, state counts, % achieved, courses); per tag (skills, categories spanned, state counts, % achieved, students achieving all) with overlap note `[REQ RP-04]`.
**Behaviour:** default sort Highest attainment desc `[PROTO]`; default scope all cohorts, no filters; By-tag footnote "Counts are student-skill records. A skill with two tags appears under both, so rows overlap." **Drill:** any row → P-07. By-skill and by-tag rows must also reach **individuals** `[REQ RP-05]` (the prototype only did this for students).
**Seam OD-03:** table columns come from the AE-04 state enum with four values (No evidence yet · Evidence does not qualify · In progress · Achieved); ONE display flag merges the first two into one "Not met" column. The wireframe above and `09` §4 show the same two renderings (A four, B merged); neither is committed. `[PROTO]` merged them ("Not met includes skills with no qualifying evidence yet") which is **DEFECT-04** relative to AE-04.
**States:** `strategy/06` §1 "Reports"; EC-21 to EC-24.
**Keep `[PROTO 01, 03, 04]`:** KPI strip, three tabs, caveat footnotes under By-skill (denominator includes students whose courses do not recommend the skill) and By-tag (overlap), Export beside tabs. **Do NOT copy:** attainment progress bars as the main visual; "Not met" lumping; uppercase column headers; identical names without an identifier (two "Owen Ashford", DEFECT-09).
**Improvements `[INFER]`:** show an identifier or cohort under duplicate names; put a "Compare against: all students in scope" baseline in KPI descriptions; remember last view and filters per admin; "Needs attention" KPI deep-links to By skill sorted ascending.

**Before / after: impossible filter combination `[REQ RP-09]`** (P-06)
```
BEFORE (empty result, no explanation)          AFTER (explained)
┌ Overview ─────────────────────────────┐      ┌ Overview ─────────────────────────────────┐
│ [Location: Mercy Home Health ✕]       │      │ [Location: Mercy Home Health ✕][Setting: Emergency ✕] │
│ [Setting: Emergency ✕]                │      │ ┌ info ─────────────────────────────────────┐ │
│ Students 0 · Avg 0 · …                │      │ │ No evidence can exist for this combination.│ │
│ (empty table)                         │      │ │ Mercy Home Health does not offer Emergency.│ │
└───────────────────────────────────────┘      │ │ [Remove Emergency] [Remove Mercy Home Health]│ │
                                               │ └───────────────────────────────────────────┘ │
                                               │ KPIs show — (not 0); table not rendered       │
                                               └───────────────────────────────────────────────┘
```

---

## S-02 Student drill-down

**Purpose:** one student's record across all skills in scope, reachable from any aggregate row without losing the table behind `[REQ RP-05, RP-06]`. **Persona:** P-A. **REQ:** RP-05, RP-06, AE-03, AE-05, SH-05 (admin sees the same per-setting truth `[INFER]`). **Seams:** OD-03.
**Regions (rail `FloatingSheetPanel`, `lg`):** header (name, cohort · group, close) · summary counters with "Show these only" · skill list (each expandable to S-03 ledger).
```
 ┌ Student ─────────────────────────── ✕ ┐
 │ Noah Zeller · BSN 2027 · Group A      │
 │ 7 of 9 skills achieved                │
 │ ⚑ OPEN OD-03 (same flag as S-01):                                                   │
 │ A: Achieved 7 [Show only] · In progress 0 · Evidence does not qualify 1 · No evidence yet 1 │
 │ B: Achieved 7 [Show only] · In progress 0 · Not met 2 [Show only]                     │
 │ ─────────────────────────────────────  │
 │ IV Insertion                Achieved   │
 │   Demonstration · 7 of 5 demonstrations│
 │   Observed 2/1 · With assistance 1/1 · Independent 4/3                [View evidence] │
 │ Foley Catheter Insertion    Achieved   │
 │   Question-level · 5 of 3 qualifying evaluations              [View evidence] │
 │ Wound Care                  No evidence yet│
 │   Needs 4 demonstrations · 1 in Inpatient · 1 in Emergency · 2 independent    │
 │   Have 0                                              [View evidence] │
 └────────────────────────────────────────┘
```
**Primary action:** none (inspector). **Secondary:** Show only, View evidence, close. **Behaviour:** counts `7 of 5` shown as "7 of 5" (over-achievement is allowed, `[PROTO 02]` shows "7 / 5"); rows sort by status then name; rail swaps when another table row is chosen; P-07 for back/Esc.
**Keep `[PROTO 02]`:** counters with filter-in-place; criteria text under each skill. **Do NOT copy:** "Not Started" for Vital Signs counted inside "Not met" (DEFECT-04). **Improvements `[INFER]`:** show the *reason* a skill is not achieved using the skill-level reasons table in `09` §7.2 (same generator the student sees), so admins and students read the same sentence.

---

## S-03 Evidence ledger and evaluation detail

**Purpose:** the evidence behind a figure, in full, not "9 of 12 answered Yes" `[REQ RP-07]`. **Persona:** P-A, P-R; P-S for own submissions (S-14 links here). **REQ:** RP-06, RP-07, RP-08, AR-03, SH-07, RV-03, RV-05. **Seams:** OD-17 (what an evaluator is shown is S-16, not here); OD-11.
**Regions (rail level 3 → level 4):** skill header with per-level strip and setting strip · ledger table · evaluation detail (read-only).
```
 ┌ Noah Zeller › IV Insertion ───────────────────────────────── ✕ ┐
 │ Achieved · 7 of 5 demonstrations                                │
 │ Observed 2 of 1 · With assistance 1 of 1 · Independent 4 of 3   │
 │ Counting evidence from: all settings  [ ] Only the current filter │
 │ Date        Where                 Evaluator             Recorded      Result            │
 │ 2026-03-17  Clinical · Periop ·   J. Delgado, RN        Independent   Counts            [View] │
 │             Riverside Medical     (Preceptor)                                              │
 │ 2026-04-15  Lab / Simulation      T. Ferreira           Observed      Counts            [View] │
 │             (Lab instructor)                                                              │
 │ …                                                                                         │
 │ ─── Evaluation · 2026-03-17 ─── Completed · Counts · J. Delgado, RN (Preceptor) ───────── │
 │ Supplied by the student:  Completion date 2026-03-07 · Unit 3 West                       │
 │ Responses:  Demonstration outcome  ○ Observed  ○ With assistance  ● Independent         │
 │ Comment: None recorded.                                                                  │
 └──────────────────────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** none; read-only record (P-11, immutable `[REQ RV-03]`). **Data:** every question and answer (Yes/No, score per question, level), evaluator comment, student note, student-supplied fields, self-evaluation if any, review note if any `[REQ RP-07, AR-04]`. Result column reads from the skill's **current** rule `[REQ AE-02]` ("Counts" / "Does not count: …" with the S-14 failed-rule sentence).
**Behaviour:** default sort date desc; if the table behind is location/setting-filtered, the ledger says so and offers "Show all evidence" `[REQ RP-08]` (P-07). Evidence in an *approval-pending* state is listed with "Waiting for approval" and does not count `[REQ AR-06]`.
**Keep `[PROTO 06, 07]`:** ledger columns (date, setting, location, evaluator + role, recorded, result), per-level strip, "View form". **Do NOT copy:** "View form" opening a dialog over the rail (stack level instead); location printed under the setting in the same cell (separate column so it can be sorted).
**Improvements `[INFER]`:** deep-linkable evaluation URL; "Download this evaluation" is **not** proposed (outside RP-10 scope).

---

## S-04 Library: skills list

**Purpose:** find, create, configure, import, activate/deactivate skills; see how much of the library is still unconfigured `[REQ SL-10, SL-11, IM-10]`. **Persona:** P-A. **REQ:** SL-01…SL-06, SL-10, SL-11, IM-09…IM-12, IM-14, SC-01. **Seams:** OD-04 (submission field defaults), OD-15 (is "activation" distinct from configured + active).
**Regions:** header (Import = outline; **Add skill = filled primary**) · unconfigured banner · tabs (Skills | Categories | Tags | Clinical settings | Lab instructors) · filters · DataTable · bulk bar when rows selected.
```
┌ Skills › Library ───────────────────────────── [ Import ] [ Add skill ]──┐
│ ⓘ 8 skills have not been configured, so they cannot be mapped or used.   │
│   [Show them]                                                            │
│ ( Skills 17 | Categories 6 | Tags 3 | Clinical settings 5 | Lab instructors 2 )│
│ [🔍 Search skills] Category ▾  Tag ▾  Status ▾  Import batch ▾           │
│ ☐ Skill               Category    Model              Achieves when                    Courses Status        │
│ ☐ IV Insertion        Category A  Demonstration      5 demonstrations · 1 obs…            4   Active    [Configure/Edit] │
│ ☐ Nasogastric Tube…   Category D  Not configured     —                                    0   Needs configuration [Configure] │
└──────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** Add skill. **Secondary:** Import, per-row Configure/Edit, bulk Apply configuration (P-05), bulk Deactivate. **Data:** name + description + tags, category, model badge, criteria summary (text), mapped-course count (link to S-10), status (`StatusBadge` semantic). **Filter values:** category incl. "No category", tag, status incl. "Needs configuration", import batch `[REQ IM-11]`, search by name `[REQ SL-10]`.
**Behaviour:** default sort name asc; "Needs configuration" rows sit with their status in text; deactivated rows hidden by default under Status filter `[INFER]`. Deactivation uses P-15. Unconfigured skills are **not** selectable for mapping (S-10) or student submission (S-12) `[REQ IM-09]`.
**Keep `[PROTO 08, 13]`:** criteria summary column; banner with count and "Show them"; row-level Configure for unconfigured. **Do NOT copy:** icons on Import / Add skill buttons; two filled blues in the toolbar if Import ever becomes filled.
**Improvements `[INFER]`:** progress line "9 of 17 configured" with the banner; keyboard-reachable bulk bar; "Configure next" action in S-09 that moves to the next unconfigured skill so a 200-skill library is a worklist, not 200 returns to the list.

---

## S-05 Library: categories and tags

**Purpose:** program-defined grouping (≤1 category per skill, optional) and cross-cutting tags (any number) `[REQ SL-03, SL-04, SL-05, SL-06]`. **Persona:** P-A. **REQ:** SL-01, SL-03…SL-06. **Seams:** none.
```
S-05a  ┌ Library › Categories (its own tab) ───────────────────── [ Add category ]┐
│ Each skill belongs to at most one. Programs define their own.            │
│ Category      Description              Skills  Status              │
│ Category A    …                           3    Active   [Edit]      │
│ Category D    from import 2026-10-08      2    Inactive [Edit]      │
└──────────────────────────────────────────────────────────────────────────┘
S-05b  ┌ Library › Tags (its own tab) ─────────────────────────── [ Add tag ]──┐
│ Tag A  4 skills across 3 categories   ▸ IV Insertion · Foley …         │
└──────────────────────────────────────────────────────────────────────────┘
```
**Tabs `[INFER]`:** S-05 is a PAIR of library tabs, S-05a Categories and S-05b Tags (matches the five-tab library nav in S-04 and `03`). Each tab has exactly ONE filled primary: [Add category] on S-05a, [Add tag] on S-05b. They are never shown on one page together. **Primary action:** Add category (S-05a) / Add tag (S-05b), single filled per tab. **Data:** name, description, skill count, status, "where each tag reaches" (skills, categories spanned) `[PROTO 11]`. **Behaviour:** can also be created inline during skill definition (S-09) `[REQ SL-05]`; **deactivated entries remain on skills that carry them, shown as inactive, removable deliberately** `[REQ SL-06]`; only active ones appear in pickers. Merge categories is not in REQ; do not add.
**Keep `[PROTO 11]`:** "where each tag reaches" showing why tags exist next to categories. **Do NOT copy:** placeholder names as ship content (nothing pre-seeded `[REQ SL-01]`). **Improvement `[INFER]`:** empty state for a new program explains category vs tag in two lines and links to Import (since IM-07 can create categories).

---

## S-06 Library: clinical settings

**Purpose:** program-defined list of clinical settings (inpatient, emergency, outpatient…) used for evidence and for setting minimums `[REQ SL-07, SC-11]`. **Persona:** P-A. **Seams:** none. Applies to **clinical evidence only; lab is separate** `[REQ SC-12]`.
```
┌ Library › Clinical settings ─────────────────────────── [ Add setting ]┐
│ Lab and simulation are always recorded as lab, not as a clinical setting. │
│ Setting            Evidence recorded   Status           │
│ Inpatient               496            Active  [Edit]   │
└─────────────────────────────────────────────────────────────────────────┘
```
**Behaviour:** deactivating a setting that a skill's minimum references blocks with an explanation (needs REQ confirmation `[INFER]`); `Evidence recorded` counts help the admin judge impact. **Keep `[PROTO 10]`:** the explanatory paragraph. **Do NOT copy:** nothing notable.

---

## S-07 Library: lab instructors roster

**Purpose:** people who sign off lab evidence but are **not Prism users**; name + email only `[REQ SL-08]`; adopt names students typed `[REQ SL-09]`. **Persona:** P-A. **REQ:** SL-08, SL-09, ST-09. **Seams:** OD-05 (record lives in Skills vs Prism-wide): keep a standalone `ExternalEvaluator` record.
```
┌ Library › Lab instructors ─────────────────────────── [ Add instructor ]┐
│ Nobody here can sign in, and no account is created.                       │
│ Name           Email                    Evaluations  Status            │
│ T. Ferreira    t.ferreira@example.edu       454      Active  [Edit]    │
│ ┌ Named by students, not on the roster ───────────────────────────────┐ │
│ │ R. Whitmore · r.whitmore@example.edu · named 3 times  [Add to roster]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** Add instructor. **Behaviour:** "Add to roster" adopts and merges spelling variants (name similarity suggestion `[INFER]`) so the same person does not accumulate as several spellings `[REQ SL-09]`. Email validated; duplicates by email warn. **Keep `[PROTO 09]`:** the adoption block directly under the list. **Improvement `[INFER]`:** show *how many requests* used each spelling to justify merging; PII note: emails visible to admins only (strategy/06 §4).

---

## S-08 Import

**Purpose:** bulk-create skills from the list the program already holds, as a **proposal to confirm** `[REQ §3]`. **Persona:** P-A. **REQ:** IM-01…IM-13, SL-05. **Seams:** OD-12 (do not propose model/criteria), OD-13 (re-import of a skill that has evidence).
**Regions:** step 1 input → step 2 review → result. Dialog for input; full page (or large sheet) for review (500-row lists do not fit a modal `[INFER]`).
```
STEP 1  Import skills                                          STEP 2  Review 8 skills found
┌ Upload a file ──────────────────────┐                        Nothing is added until you confirm.
│ Spreadsheet, document or PDF.       │                        Found 8 · Will be created 8 · Excluded 0 · Possible duplicates 0 · Not read 1
│ No template or column order needed. │                        [x] Create 3 new categories from the groupings (D, E, F)
│ [ Choose a file ]                   │                        ☑ Skill name              Description           Category    Match
├ Or paste the list ──────────────────┤                        ☑ Nasogastric Tube…       Placement and conf…   Category D  New
│ One skill per line…                 │                        ☑ Peripheral IV Removal   Documentation of…     Category F  New
│                                     │                        ▸ Not read (1)  Line 9: SECTION 2 — ADVANCED PROCEDURES · Looks like a section heading
└─────────────────────────────────────┘                        [Add as skill] [Add as category] [Ignore]
[ Cancel ]            [ Read the list ]  (primary)             [ Back ]                 [ Create 8 skills ] (primary)
```
**Primary action:** Read the list (step 1) → Create N skills (step 2): exactly one filled primary per step. **Data:** per row name, description, category, source reference, match status. **Behaviour:** P-04 in full (edit, exclude, rename, merge, split, add, duplicates skip / replace / keep both, unread lines with original text). "Imported skills arrive unconfigured" is stated before confirm `[REQ IM-09]`. Import is repeatable and each batch is labelled `[REQ IM-11]`. **No claim that AI reads the file correctly**; the page says the list is a draft `[REQ IM-13]`.
**States:** `strategy/06` §1 import rows; EC-27, EC-28.
**Keep `[PROTO 12, 13]`:** counters, "create categories" opt-in, unread lines with reason, post-create banner with Configure now / Show them. **Do NOT copy:** only-paste input (upload is REQ IM-02); counters that show 0 duplicates without any resolution UI; the review living in a modal.
**Improvements `[INFER]`:** show source row/page number beside each skill; allow dropping a second file into the same batch; remember category mapping choices within the batch.

---

## S-09 Skill configure

**Purpose:** settle three things per skill: what it is, how it is evaluated, what achievement requires; with the dependency visible and the whole student+evaluator experience previewable `[REQ §4, SC-01…SC-19]`. **Persona:** P-A. **REQ:** SL-02…SL-05, SC-01…SC-19, AE-02, AE-06, AE-07, IM-14. **Seams:** OD-04 (submission-field defaults), OD-06 (roles as data), OD-09 (self-eval form identical), OD-12.
**Recommendation (not in REQ): a full page** with in-page section navigation, a **persistent lineage panel** and a **live preview** instead of the prototype's 3-step modal `[PROTO 14–16]`.
**Why not the modal (justification):** (1) configuration is the product's heaviest, most repeated task (200 skills `[REQ §3]`); a modal caps width and height, so the form, lineage panel and preview cannot coexist. (2) The model→criteria dependency (SC-17, SC-09) is the core design principle `[REQ §1.5]`; a 3-step flow hides step 2 while editing step 3, whereas SC-17 asks that the dependency "be apparent to whoever is configuring". (3) Deep links and the browser Back button matter for a worklist ("Configure next"). (4) Sheet `xl` is 40rem and the DS says past `xl` prefer a route `[verified in Sheet d.ts]`. **Cost:** a page is more navigation than a modal; mitigated by returning to the same list scroll position.
```
┌ Library › IV Insertion › Configure ───────────────── [ Cancel ] [ Save skill ]┐
│ ● Unsaved changes                              Configure next unconfigured ›   │
│ ┌ Sections ┐ ┌ 1 Skill ────────────────────────────┐ ┌ LINEAGE (sticky) ─────────┐│
│ │ 1 Skill  │ │ Name* [IV Insertion              ]  │ │ Model: Demonstration       ││
│ │ 2 Model  │ │ Description [                    ]  │ │ Evidence: Observed / With  ││
│ │ 3 Rule   │ │ Category [Category A ▾][+ New]      │ │   assistance / Independent ││
│ │ 4 Criteria││ │ Tags [Tag A ✕][Tag B ✕][+ New tag] │ │ Counts when: each completed││
│ │ 5 Student│ │ Status (•) Active ( ) Inactive      │ │   demonstration            ││
│ │   details│ ├ 2 How it is evaluated ──────────────┤ │ Requires: 5 demonstrations ││
│ │ 6 Evaluator│ │ ┌tile┐┌tile┐┌tile┐┌tile┐  (no default)│ │  ≥1 obs · ≥1 assist · ≥3 ind││
│ │ 7 Workflow││ │ Binary Question Scored Demonstration │ │ Status: no evidence →     ││
│ │ 8 Preview│ │ │ Levels (ordered, most supervised first)│ │   some qualifying → achieved││
│ └──────────┘ │ │  1 [Observed] 2 [With assistance] 3 [Independent] [Add level] │ ├ PREVIEW ───────────────────┤│
│              │ ├ 3 When one evaluation counts ───────┤ │ Student sees / Evaluator   ││
│              │ │ Every completed demonstration counts│ │ sees  (tabs)               ││
│              │ ├ 4 Achievement criteria ─────────────┤ │ …                          ││
│              │ │ Total [5]  Min each: Obs [1] Ass [1] Ind [3]  ✓ 5 ≥ 1+1+3          │ └────────────────────────────┘│
│              │ │ Minimums by clinical setting [Choose…] Inpatient [1]                │                               │
│              │ ├ 5 Student supplies on submission ───┤                                │
│              │ │ [Completion date][date][Required]… [Add field]                       │                               │
│              │ ├ 6 Evaluator ────────────────────────┤                                │
│              │ │ Comment ( ) Optional (•) Required   Who can evaluate ☑ Preceptor ☑ Clinical faculty ☐ Lab instructor │
│              │ ├ 7 Workflow ─────────────────────────┤                                │
│              │ │ Student self-evaluates first [off]  Administrator approves first [on]  │
│              └─┴────────────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
**Hierarchy:** section 2 (model) gates 3 and 4; until a model is chosen sections 3–4 are disabled with reason text (`[REQ SC-02]` no default). **Primary action:** **Save skill** (single filled primary). **Secondary:** Cancel, Copy configuration from… and Apply to other skills (P-05), Configure next. **Data:** everything in SC-02…SC-16. **Behaviour:** model change = P-01; validation = P-02; saving a skill with evidence = P-03; renaming labels/questions never changes outcomes `[REQ AE-06]` (state this next to the label inputs); removing a level/question removes it from rules and says "Removed from N rules" `[REQ AE-07]`; qualification-rule editors per model (all / at least N of M / named subset; average / min per question / total; binary label + which one qualifies) `[REQ SC-03, SC-05, SC-07]`.
**Alternative A (closest to prototype): modal stepper in a `Dialog`.** Sections 1→2→3 with Back/Continue and the lineage in a right column. Acceptable for **creating** a skill (short path) but not for editing a configured one. If chosen, keep lineage visible on every step and show Preview as a last step; footer: Cancel / Back / Continue, and Save skill only on the last step so there is one filled primary at a time.
**Alternative B: `Sheet` `xl` with section anchors.** Keeps the list visible behind; lineage collapses into a top summary row; preview opens a second sheet. Works for light edits (rename, change one minimum) from S-04.
**States:** `strategy/06` §1 "Skill configure" and EC-1…EC-10; unsaved-changes dialog (P-17); save conflicts (P-17).
**Keep `[PROTO 14–16]`:** lineage panel, form preview with both views, evaluator-roles checklist, "Route: Student selects → Student self-evaluates → Evaluator completes → Administrator approves → Counts as evidence". **Do NOT copy:** three modal steps; "Add level" with the explanatory sentence only inside the editor; the long scrolling step 2 without anchors; uppercase tracking labels.
**Improvements `[INFER]`:** section completion ticks; dirty-section indicator; "Configure next" to turn the 200-skill worklist into one flow; show the **sum check** live ("5 ≥ 1 + 1 + 3 ✓").

---

## S-10 Course mapping

**Purpose:** tell students what each offering expects: mandatory or non-mandatory, per offering `[REQ §5]`. **Persona:** P-A. **REQ:** CM-01…CM-07, IM-09. **Seams:** **OD-01** (carry-forward / catalogue inheritance): do not build carry-forward UI; store mapping per offering with an optional `catalogueCourseId` default layer.
```
┌ Course mapping ──────────────────────────────────────────────────────────────┐
│ Mapping sets expectations. It never stops a student submitting other skills. │
│ ┌ Offerings (14 of 42 match) ────────┐ ┌ Skills mapped · NURS 301 Fall 2026 · Year 1 ┐│
│ │ [🔍 course code or name]           │ │ 3 mandatory · 1 non-mandatory          [ ... ]││
│ │ Cohort ▾ Year ▾ Term ▾ Prof year ▾ [Clear] │ [🔍 skills]                              ││
│ │ NURS 301 Fall 2026 · Y1 · BSN 2027, ABSN 2026  3/4 │ ☑ IV Insertion       (• Mandatory)( ) Non-mandatory ││
│ │ NURS 301 Spring 2027 · No cohort   0/0│ │ Also mapped in NURS 350 Fall 2025, …        ││
│ │ …                                   │ │ ☐ Wound Care (not mapped)                   ││
│ └─────────────────────────────────────┘ └──────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** none (changes apply immediately, each with an inline "Saved" note; avoids a global Save in a master-detail). If batch save is chosen, Save is the single filled primary `[INFER]`. **Data:** offering = code + name + term + academic year + professional year + cohorts `[REQ CM-01]`; counts mandatory/total `[REQ CM-04]`; per skill requirement. **Behaviour:** locatable by search and cohort/term/academic year/professional year `[REQ CM-02]`; requirement may differ per offering `[REQ CM-06]`; mapping is **expectation, not eligibility** (banner) `[REQ CM-05]`; unconfigured and inactive skills are not offered `[REQ IM-09, SL-11]`; "Also mapped in …" reinforces one record across courses `[REQ CM-07]`. **Newly mapped default requirement:** `[PROTO]` used Mandatory; REQ silent; propose **no default selected** so the admin states intent `[INFER]`.
**Keep `[PROTO 17]`:** master-detail, mandatory/total pills, cross-reference text, filter + Clear. **Do NOT copy:** hiding Mandatory/Non-mandatory controls until a skill is ticked is fine, but the mandatory default; 42 flat offerings with no grouping (group by course code and term `[INFER]`).
**Improvements `[INFER]`:** **bulk map** (copy mapping from another offering; apply a skill set to selected offerings), the volume problem the REQ names ("the volume of offerings is significant") but doesn't specify; defer until OD-01 is answered. Show "no cohort enrolled" offerings collapsed.

---

## S-11 Review and approve

**Purpose:** internal check before an evaluation counts, only for skills where it is turned on `[REQ §8]`. **Persona:** P-R. **REQ:** AR-01…AR-06, SC-15, EV-07. **Seams:** OD-16 (who an admin-returned evaluation goes back to; default student per RV-01), OD-09.
```
QUEUE (DataTable; rows carry NO filled buttons, only "Review" as a text link/ghost)
┌ Review and approve ─────────────────────────────  3 waiting · they do not count yet ┐
│ Student        Skill           Course   Setting · Location        Evaluator (role)   Agreement │
│ Rina Okonkwo   IV Insertion    NURS 350 Outpatient · Lakeside    J. Delgado (Prec.) Differs   [Review] │
│ Jonah Nakamura IV Insertion    NURS 350 Lab / Simulation         R. Whitmore (Lab)  Same      [Review] │
└──────────────────────────────────────────────────────────────────────────────────────┘
DETAIL (Sheet, right, opens from a row; the ONE filled primary lives here)
┌ Rina Okonkwo · IV Insertion ───────────────────────────────────────────────── ✕ ┐
│ NURS 350 · Clinical · Outpatient Clinic · Lakeside Community Clinic · 2026-08-26 │
│ Evaluator: J. Delgado, RN (Preceptor)                                            │
│ ┌ Student self-evaluation ────────┬ Evaluator ──────────────────────────────────┐ │
│ │ With assistance                 │ Independent                                 │ │
│ │ Note: Felt I needed a prompt…   │ Comment: Sound technique throughout…        │ │
│ └─────────────────────────────────┴─────────────────────────────────────────────┘ │
│ Differs: student and evaluator recorded different outcomes.  [See full responses] │
│ Review note [ optional, kept with the evaluation                                ] │
│                                   [ Return for correction ] (outline)  [ Approve ] (the only filled) │
└──────────────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** Approve (filled), only inside the detail Sheet; queue rows have no filled buttons so the surface has exactly one filled primary at a time `[INFER]`. **Secondary:** Return for correction (outline), See full responses, note. **Data:** student, skill, course, setting, location, evaluator, role `[REQ AR-01]`; self vs evaluator side by side with agree/differ `[REQ AR-02]`; all responses `[REQ AR-03]`; note `[REQ AR-04]`. **Behaviour:** P-12; queue empty state explains the queue only appears for skills with approval on; pending evidence excluded from achievement `[REQ AR-06]`.
**Keep `[PROTO 18]`:** agreement sentence, note, two decisions on one card. **Do NOT copy:** the label "Return to preceptor" (contradicts REQ RV-01 and the student's history, DEFECT-03); a banner that says "to the preceptor". **Improvements `[INFER]`:** filter by course/evaluator; "N differ" count at top. (Queue-as-DataTable + detail Sheet is now the default, replacing the prototype card stack.)

---

## S-12 Student: course skills

**Purpose:** what this course expects, how far along I am, and a way to send evidence for several skills at once `[REQ ST-01…ST-04]`. **Persona:** P-S. **REQ:** ST-01, ST-02, ST-03, ST-04, SH-04, SH-05, IM-09. **Seams:** OD-14 (partial drafts), OD-07.
**Regions:** course header (course select if several; cohort; placements) · "Waiting" strip · filter ("Show only skills I have sent for review") · Mapped section (mandatory then non-mandatory) · Other skills (collapsed, searchable) · sticky selection bar.
```
DESKTOP
┌ NURS 350 — Clinical Practicum ▾ ─────────────────────────────────────────────┐
│ BSN 2026 · Group A · Placed at Harbor Family Practice, Northgate Surgical      │
│ ┌ Waiting for an evaluator (1) ─────────────────────────────────────────────┐  │
│ │ Medication Reconciliation · S. Nakamura, RN (Preceptor)                    │  │
│ └────────────────────────────────────────────────────────────────────────────┘  │
│ [ ] Show only skills I have sent for review          7 of 9 sent · 2 not mapped │
│ Expected on this course                                                        │
│ ☐ IV Insertion  Mandatory  In progress                         View history (5)│
│     4 of 5 demonstrations · Independent 1 of 3 · With assistance 1 of 1…      │
│ ☐ Wound Care    Mandatory  In progress                         View history (4)│
│     4 of 4 demonstrations  ·  Still needed: 1 in Emergency · Inpatient 1 of 1 │
│ ☐ Medication Reconciliation  Not required  Achieved            View history (3)│
│     You can still ask for another evaluation if your program wants more evidence│
│ ▸ Other skills (not on this course)  2 sent    Evidence still counts toward your record│
│ ┌ 2 skills selected   [Clear]                           [ Send for review ] ┐ │
└────────────────────────────────────────────────────────────────────────────────┘

MOBILE [INFER]
┌────────────────────────────┐
│ NURS 350 ▾                 │
│ Waiting (1) ▸              │
│ ☐ IV Insertion             │
│   Mandatory · In progress  │
│   4 of 5 demonstrations    │
│   Independent 1 of 3 …     │
│   History (5) ›            │
│ ☐ Wound Care …             │
│ ▸ Other skills             │
├────────────────────────────┤
│ 2 selected  [Send for review]│  sticky, above safe area
└────────────────────────────┘
```
**Conditional element (exists ONLY if OD-14 is accepted) `[INFER]`:** a draft row in the Waiting strip "Draft · Foley Catheter Insertion · [Continue self-evaluation]". Not shown by default.
**Primary action:** Send for review (sticky bar, filled; becomes `outline` once S-13 is open so S-13's Send is the single primary, P-08). **Data:** mandatory flag, status (four states in `09` §4), n of N with unit, per-level strip for demonstration skills, **per-setting progress** (P-18) `[REQ SH-05]`, waiting requests with the person `[REQ SH-02]`. **Behaviour:** order: mandatory before non-mandatory `[CALL 09-23: two sections]`, each by name; unconfigured/inactive skills never shown `[REQ IM-09, SL-11]`; "Other skills" search over the whole active library `[REQ ST-02]`; "Show only skills I have sent" isolates earlier submissions `[REQ ST-03]`.
**Before / after: DEFECT-07 (4 of 4 but not achieved) `[REQ SH-05, SH-03]`**
```
BEFORE [PROTO 19]                                  AFTER
Wound Care  Mandatory  In progress                 Wound Care  Mandatory  In progress
████████████████ 4 / 4 demonstrations              4 of 4 demonstrations
(no reason it is not achieved)                     Still needed
                                                   · 1 in Emergency (you have 0 of 1)
                                                   · 2 performed independently (you have 1 of 2)
                                                   Inpatient 1 of 1 ✓   Lab evidence does not count toward clinical settings
```
**Keep `[PROTO 19]`:** waiting strip, mandatory / non-mandatory chips, history link per skill, "Other skills" collapsed row, sticky bar. **Do NOT copy:** progress bar as the only progress cue; "In Progress" for a skill that cannot progress further without a missing setting (say what is missing); two stacked blue primaries (bar + dialog).
**Improvements `[INFER]`:** keep selection when navigating to history and back; "Send again" shortcut on a skill whose last attempt did not meet criteria (P-10).

---

## S-13 Student: send for review

**Purpose:** record where the evidence came from, pick a valid evaluator, supply the program's details, send `[REQ ST-05…ST-13]`. **Persona:** P-S. **REQ:** ST-05…ST-13, SC-13, SC-15, SC-16, EV-02. **Seams:** OD-07 (setting once per submission; data per item), OD-06, OD-14, OD-09.
**Pattern:** `Sheet` (right `lg` on desktop; bottom sheet `size="full"` on mobile `[INFER]`), because it is a task with a single outcome that references the list behind it.
```
DESKTOP SHEET                                              MOBILE [INFER]
┌ Send for review · 2 skills · NURS 350 ───── ✕ ┐          ┌ Send for review ─────── ✕ ┐
│ Where did you perform this?                    │          │ ( ) Clinical (•) Lab      │
│ (•) Clinical   ( ) Lab / Simulation            │          │ Setting ▾                 │
│ Clinical setting                               │          │ Outpatient — Harbor Family│
│ [Outpatient Clinic — Harbor Family Practice ▾] │          │ Send to ▾ Preceptor       │
│  From your 2 placements for this course.       │          │ Preceptor ▾ A. Whitfield  │
│ Send to  [Preceptor ▾]   Person [A. Whitfield ▾]│         │ ── Foley Catheter ────    │
│  Roles that sign off clinical evidence.        │          │ Completion date *         │
│ ── Foley Catheter Insertion ── Incomplete      │          │ [dd/mm/yyyy]              │
│  Completion date * [date]   Notes [          ] │          │ Notes [               ]   │
│ ── Medication Administration ── Incomplete     │          │ ── Med Administration ──  │
│  Completion date * [date]   Notes [          ] │          ├──────────────────────────┤
│ Evaluate yourself first (only where the skill  │          │ Evaluate yourself first * │
│  is configured; same criteria; evaluator sees) │          │ (same criteria)           │
│ The evaluator completes the form your program  │          │ [Cancel]  [Send request] │
│ configured. They cannot change how it is judged│          └──────────────────────────┘
│                    [ Cancel ]  [ Send request ] │
└────────────────────────────────────────────────┘
```
**Self-evaluation timing `[INFER]`, resolves critic B1:** self-evaluation is completed BEFORE send, inside this sheet, for skills configured for it `[REQ SC-15, ST-11]`; Send stays disabled with a reason until it is complete. There is therefore no post-send "self-evaluation pending" state unless OD-14 (save partial) is accepted; then S-12/S-14 show a conditional "Continue self-evaluation" affordance. **Single-choice controls:** Clinical / Lab uses `RadioGroup`, not a multi-select ToggleGroup `[INFER]`. **Primary action:** Send request (only filled primary; disabled **with a stated reason**, never silently: "Complete the 2 required fields"). **Secondary:** Cancel; Save draft is `[INFER]` pending OD-14. **Data:** performed-in; setting (+location); role; person (or name + email for an unlisted lab instructor `[REQ ST-09]`); program-defined fields per skill (label, type, mandatory) `[REQ SC-13, ST-10]`; one student note per submission item, distinct from evaluator comment `[REQ ST-12]`; self-evaluation block when the skill is configured for it `[REQ ST-11, SC-15]`.
**Behaviour:** P-09 decision table (setting inferred if one placement; chosen with location if several; full list if none; lab path hides clinical setting). Changing performed-in / setting / role **resets** the person (fixes DEFECT-01). On send: P-14 non-optimistic; confirmation lists what, to whom, role, setting, location `[REQ ST-13]` (fixes DEFECT-02).
**Before / after: no valid evaluator combination `[REQ ST-08]`**
```
BEFORE [PROTO: stale person kept]                  AFTER
Lab / Simulation ▸ Preceptor A. Whitfield (kept)   Lab / Simulation
Sent to A. Whitfield, RN (clinical faculty)        ┌ warning ───────────────────────────────────┐
(an invalid role was sent)                         │ Foley Catheter Insertion cannot be signed off │
                                                   │ in a lab. Only a preceptor or clinical faculty │
                                                   │ can sign it off, and they assess clinical      │
                                                   │ evidence. [Switch to Clinical]                 │
                                                   └────────────────────────────────────────────────┘
                                                   Send request  (disabled; reason is the banner above)
```
**States:** `strategy/06` §1 "Student: send dialog"; EC-11…EC-17. **Keep `[PROTO 21]`:** Clinical/Lab toggle, helper text for placements, per-skill "Incomplete" chips, evaluator explainer line. **Do NOT copy:** one date-field layout for every skill with no grouping of identical details (offer "Apply to all selected" when the same fields repeat `[INFER]`, relates OD-04); stale evaluator; setting/location missing from the confirmation.

---

## S-14 Student: skill history

**Purpose:** every submission for a skill, in order, with an explicit outcome, who has it, and what to do next `[REQ §10]`. **Persona:** P-S. **REQ:** SH-01…SH-07, RV-01…RV-05, ST-13. **Seams:** OD-08, OD-16, OD-14.
**Pattern:** `Sheet` right `lg` (mobile: full screen with back).
```
DESKTOP                                                     MOBILE [INFER]
┌ IV Insertion · history ──────────────────── ✕ ┐          ┌ ‹ IV Insertion ────────┐
│ Counted 4 · In progress 1 · Returned 1         │          │ Counted 4 · In progress 1│
│ [All courses (5)] [NURS 350 only (1)]          │          │ Returned 1              │
│ Needs 5 demonstrations · 1 obs · 1 assist · 3 ind │       │ [All courses|NURS 350]  │
│ Progress: 4 of 5 · Independent 2 of 3          │          │ ┌ Attempt 5 · Returned ┐│
│ ┌ Attempt 5 · 2026-08-11 ─ Returned ─────────┐ │          │ │ NURS 350 · Outpatient││
│ │ Clinical · Outpatient · Harbor Family · NURS 350│        │ │ Reviewer note: date  ││
│ │ With M. Okonkwo, RN (Preceptor) · not recorded │        │ │ and unit do not match││
│ │ You rated yourself: Independent                │        │ │ [Revise and resend]  ││
│ │ Reviewer note: The date and unit do not match… │        │ └──────────────────────┘│
│ │ Revised and resent 1 time                      │        │ ┌ Attempt 4 · Counted ─┐│
│ │ [View form]            [ Revise and resend ]   │        │ …                       │
│ └────────────────────────────────────────────────┘        └─────────────────────────┘
│ ┌ Attempt 4 · 2026-07-04 ─ Counted ──── [View form]┐
└────────────────────────────────────────────────┘
```
**Primary action:** the one state-appropriate action on the **latest** attempt: "Revise and resend" (returned or unassessed `[REQ RV-01]`) or "Make a further attempt" (completed, did not meet criteria `[REQ RV-03]`); never both, never on counted/pending (P-10, P-11). **Conditional element (only if OD-14 is accepted) `[INFER]`:** a "Draft" attempt card with [Continue self-evaluation]. Not shown by default.
**Header counters `[REQ SH-04]`:** Counted · In progress (outstanding) · Returned. **Data:** outcome in the student's four terms `[REQ SH-02]`: **counted, did not meet criteria, returned, waiting (with whom)** (these four are PER-SUBMISSION outcomes; the skill-record status is a different thing, see `09` §4); attempt number; context (setting, location, course); evaluator + role; recorded answer; feedback; reviewer note; revision count and reason `[REQ RV-02]`; "View form" opens S-03 detail read-only `[REQ SH-07]`. Skill header shows progress incl. **per setting** `[REQ SH-05]`. Scope toggle: all courses by default, narrowable to one `[REQ SH-06]`.
**Before / after: failed rule `[REQ SH-03]`**
```
BEFORE (outcome without reason)                    AFTER
Attempt 3 · 2026-05-02                             Attempt 3 · 2026-05-02 · Did not meet criteria
Did not meet criteria                              ┌ warning ────────────────────────────────────┐
                                                   │ These required questions were not answered  │
                                                   │ Yes: Maintains appropriate technique.       │
                                                   │ You can make a further attempt.             │
                                                   └─────────────────────────────────────────────┘
                                                   Sentence generated per model: 09 §7.1; skill-level: 09 §7.2
```
**Keep `[PROTO 20]`:** the three counters, scope toggle, attempt cards, "Revised and resent n times". **Do NOT copy:** outcomes without the failed rule (none seeded in the prototype student); order by newest only with no way to see in chronological order (REQ says "in order, identified by attempt"; keep newest-first with attempt numbers, offer oldest-first toggle `[INFER]`).
**States:** `strategy/06` §1 "Student: history"; EC-17…EC-20.

---

## S-15 Student: my skills (all courses)

**Purpose:** one record per skill across every course `[REQ SH-06, AE-05, CM-07]`. **Persona:** P-S. **REQ:** SH-04, SH-06, ST-03, CM-07. **Seams:** OD-03.
```
┌ My skills ───────────────────────────────────────────────────────────────┐
│ ⚑ OPEN OD-03 (same flag): A: Achieved 5 of 9 · In progress 2 · Evidence does not qualify 0 · No evidence yet 2 │
│                           B: Achieved 5 of 9 · In progress 2 · Not met 2 │
│ [🔍] Course ▾ Category ▾ Status ▾                                       │
│ Skill                 Status        Progress                   Courses     │
│ IV Insertion          In progress   4 of 5 · Independent 2 of 3  NURS 350, 410 [History]│
└──────────────────────────────────────────────────────────────────────────┘
```
**Primary action:** none filled (navigation + History). **Data:** status in four terms (OD-03 flag decides whether two are merged on screen), n of N + level and setting strips, courses where evidence was gathered. **Behaviour:** narrow to one course via the filter (SH-06); a skill not mapped to any of the student's courses still appears if it has evidence `[REQ CM-05]`. Not in `[PROTO]` as a separate page (prototype only has per-course view + "all courses" toggle in history), so this is `[INFER]` from SH-06 and CM-07; confirm that REQ wants a cross-course overview and not only the per-skill toggle.
**Improvements `[INFER]`:** print/save-friendly view for advising.

---

## S-16 Evaluator form (tokenised; no shell)

**Purpose:** complete the program's form for one request, in one sitting, with no account `[REQ EV-01…EV-07]`. **Persona:** P-P (no login), P-F (may use Prism or link), P-L (not a Prism user). **REQ:** EV-01…EV-07, SC-14, SC-15, ST-12. **Seams:** OD-17 (do **not** show student achievement status), OD-18 (link lifecycle), OD-06, OD-08.
**Shell-free:** no sidebar, no top navigation, no Exxat chrome beyond a wordmark and the request context; one URL from an email, one column, large targets `[workspace persona P3; REQ EV-01]`. `[PROTO 23]` renders this inside the admin shell: **demo device, do not copy** (DEFECT-06).
```
DESKTOP (single column, max ~720px)                    MOBILE [INFER]
┌ Exxat Prism                                          ┌ Evaluate skills ───────┐
│ Evaluate student skills                              │ Jonah Okonkwo          │
│ Jonah Okonkwo · NURS 350 — Clinical Practicum        │ NURS 350 · 2 skills    │
│ Requested 2026-08-24 · You are completing this as            │ 1 of 2 answered ▮▯     │
│ A. Whitfield, RN (Preceptor)                         │ ───────────────────── │
│ ─────────────────────────────────────────────────    │ 1  IV Insertion        │
│ 1  IV Insertion                  Goes to review       │ Clinical · Outpatient  │
│    Clinical · Outpatient Clinic · Lakeside Clinic    │ Student supplied ▸     │
│    Student supplied: Completion date, Unit, Notes    │ Demonstration outcome  │
│    Demonstration outcome                              │ [Observed]             │
│    [ Observed ] [ With assistance ] [ Independent ]   │ [With assistance]      │
│    Comment * (required by this program) [          ] │ [Independent]          │
│ 2  Foley Catheter Insertion                          │ Comment *  [        ]  │
│    Q1 Performs appropriate preparation  (Yes)(No)    │ ───────────────────── │
│    Q2 …                                              │ 2  Foley Catheter …    │
│    Comment (optional) [                           ]  │ …                      │
│ Submitting records each answer as evidence.          ├────────────────────────┤
│                              [ Submit evaluation ]   │ [Submit evaluation]    │
└──────────────────────────────────────────────────────┴────────────────────────┘
```
**Primary action:** Submit evaluation (only filled primary; disabled until every skill is answered and mandatory comments are present, with a visible count "1 of 2 answered" and the specific missing item on press, `[REQ EV-06]`). **Data shown:** exactly the request's context, student-supplied details `[REQ EV-04]`, student self-evaluation where one exists `[REQ EV-04]`, the skill's configured questions/levels; **never** other students, history, or achievement status (DEFECT-05, OD-17). The evaluator "cannot alter how the skill is evaluated" `[REQ EV-03]`: controls are answers only.
**Behaviour:** each skill states **before** submit whether it "Counts when you submit" or "Goes to administrator review" `[REQ EV-07]`; after submit a confirmation page repeats it per skill. Answer controls are radio groups (large, ≥44px `[INFER]`); per-field draft autosave `[INFER; REQ silent]`. Link problems (invalid, expired, already used) show a standalone page (P-17; lifetime = OD-18). Faculty using Prism reuse the same form inside the Prism shell `[REQ §7 intro]`.
**After submit (before / after for what the evaluator sees)**
```
BEFORE [PROTO 24]                                     AFTER
Skill | Recorded | Qualifies? | Progress | Status     Thank you. Your evaluation was recorded.
IV Insertion  Independent  Qualifies  Held for review  IV Insertion: recorded as Independent. Waiting for administrator approval; it does not count yet.
Foley         3 of 3 Yes   Qualifies  4/3 · Achieved  Foley Catheter Insertion: recorded. It counts now.
(student's achievement status exposed)                No student achievement status shown.
```
**States:** `strategy/06` §1 "Evaluator form"; EC-17, EC-19.
**Keep `[PROTO 23, 24]`:** per-skill numbered cards, "Goes to review" badge, "Supplied by the student" block, Submit disabled until valid. **Do NOT copy:** the admin shell; the status exposure; a mailbox-style "Evaluations sent" list as part of this surface (that is a demo of the inbox).

---

## S-17 Export

**Purpose:** take the report out as an aggregate or one row per evaluation, covering the **full filtered scope** and recording the filters used `[REQ RP-10]`. **Persona:** P-A. **REQ:** RP-10, RP-11. **Seams:** OD-10 (CSV vs native Excel): the UI picks a format list from config; ship CSV only.
```
┌ Export ▾ (menu, from S-01 toolbar) ──────────────────┐
│ Attainment summary: the table as currently filtered   │
│   What you see now, with filters applied              │
│ Evidence detail          One row per evaluation:      │
│   feedback, settings, locations, self-evaluations,    │
│   review notes                                        │
│ The filters in use are written to the file header.    │
└───────────────────────────────────────────────────────┘
```
**Primary action:** none filled on the page; inside the menu the two choices are items. If the export becomes a Sheet (scope preview + format), "Export" is the single filled primary. **Behaviour:** covers the whole filtered result, not the 25 visible rows `[REQ RP-10]`; confirmation says rows and filters; large exports show "Preparing…" then the download (P-14); failure → retry with filters preserved (P-17). **Keep `[PROTO 25]`:** two choices; filter header. **Do NOT copy:** wording "CSV, opens in Excel" as the only description; naming files without scope (name = `skills-{view}-{date}-{filter hash}`) `[INFER]`. **Not shown:** the actual downloaded file (not exercised in the walkthrough); verify column set against RP-10 before building.

---

## S-18 Evaluation-request email (text layout)

**Purpose:** reach the evaluator with one link that opens S-16 directly and creates no account `[REQ EV-01]`. **Persona:** P-P, P-F, P-L. **REQ:** EV-01, EV-02, ST-09, SL-08. **Seams:** OD-18 (link lifecycle), OD-17. **Out of scope:** reminders and escalation `[REQ §14]`; QR codes `[CALL 09-23, not in REQ]`.
```
From:    Prism · {Program name} <no-reply@…>
To:      {evaluator email}
Subject: {Student name} has asked you to evaluate {n} skill(s)

Hello {Evaluator name},

{Student name} ({course code}, {program name}) has asked you to evaluate
{n} skill(s) they performed:

  - {Skill 1}
  - {Skill 2}

Where: {Clinical (setting) at location | Lab or simulation}
You are asked to complete this as: {Preceptor | Clinical faculty | Lab instructor}

Open the evaluation:
[ Open evaluation ]      (one link; plain-text URL repeated below)
{full URL}

What to expect
- The link opens the evaluation directly. You do not need to sign in
  and no account is created.
- The form shows what {Program name} has set up for each skill. You
  only record your assessment.

After you submit
- Your answers are recorded for {Student name}.
- {Program name} may review an evaluation before it counts.

If you are not the right person to evaluate {Student name}, please let
them know so they can send the request to someone else.
{OD-18: link validity text, omitted until decided}

Thank you,
{Program name} via Prism
```
**Content rules:** no student data beyond name + course + skills + setting; no scores or progress; plain-text alternative; the link is the only action; no attachments; neutral sender text (preceptors are volunteers, high-stress `[workspace persona P3]`). Mobile-first rendering is the default for email. **Keep `[PROTO 23]` idea:** one request lists several skills. **Improvement `[INFER]`:** subject line shows the count so a multi-skill request is not mistaken for several.

---

## Cross-surface notes

- **Requirement coverage here:** every S-xx cites its REQ IDs; the full matrix is `docs/strategy/04-requirements-traceability.md`. Surfaces with ❌/⚪ prototype status that need first-time design: IM-14 (P-05, S-04/S-09), SH-05 (P-18 on S-12/S-14/S-02), SH-03 (S-14), RP-09 (S-01), ST-07/ST-08 (S-13), RV-03/RV-05 (S-14).
- **Net-new vs prototype:** S-15 (cross-course page), bulk configure/map, import upload and merge/split, rule-change impact preview (P-03), setting-minimum progress for students, shell-free evaluator, evaluation-request email.
- **Contradictions surfaced:** DEFECT-01 (stale evaluator), DEFECT-02 (confirmation omits setting/location), DEFECT-03 (return target), DEFECT-04 (three states), DEFECT-05 (evaluator sees achievement), DEFECT-06 (shell on evaluator), DEFECT-07 (4/4 not achieved), DEFECT-09 (duplicate names). IDs in `docs/strategy/07-gaps-contradictions-defects.md`.
- **Not designed (REQ §14):** remediation, notifications/reminders, skill expiry, patient-encounter linkage, Evaluations migration, accreditation outputs beyond RP-10. **Not designed (call-only, not REQ):** QR codes, heatmaps/preceptor consistency, learning-contract linkage, batch students×skills grid (OD-19), hierarchical skills (OD-20).
- **Verification status:** static document review only. Nothing here was rendered or axe-tested.
