# UX 04 — User Flows F-01 to F-14 and the end-to-end swimlane

Tags per `docs/README.md`. Precedence REQ > CALL > PROTO > INFER. EC-n refers to `docs/strategy/06-states-and-edge-cases.md` section 2. Surface IDs S-01..S-18 and personas P-A, P-S, P-P, P-F, P-L, P-R are defined in `docs/ux/03-information-architecture.md`.
No flow decides an open decision. Where one is touched, both branches or the seam from `docs/strategy/05-open-decisions.md` are shown. Everything in REQ section 14 stays out.

Legend for diagrams: rectangles are steps, diamonds are decisions, rounded nodes are exits. Requirement IDs sit in the node text or in each flow's table.

---

## F-01 Seed library by import

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-04 → S-08 → S-04 |
| Trigger | Program holds a list in a spreadsheet, document or PDF `[REQ §3]` |
| Preconditions | Admin has library access; categories optional |
| Happy path | Upload or paste → read → review proposed list → confirm → skills created unconfigured → banner with count → Show them |
| Decision points | Edit, rename, merge, split, discard, add before creating `[REQ IM-05]`; duplicates: skip, replace or keep both `[REQ IM-06]`; accept proposed categories from headings `[REQ IM-07]` |
| Edge / error | Unreadable lines shown with original text `[REQ IM-08]`; zero skills found; all excluded; re-import of existing skill with evidence (EC-27, OD-13); unsupported file; parse failure |
| Exit states | Skills exist as unconfigured, not mappable or submittable `[REQ IM-09]`; or cancelled with nothing created `[REQ IM-13]` |
| Open decisions | OD-12 (interpretation proposes model/criteria; seam: optional `proposedQuestions`), OD-13 (duplicate with evidence) |
| Not shown in prototype | File parsing, merge/split, duplicate resolution UI, per-import traceability `[PROTO]` |

```mermaid
flowchart TD
    A["Admin opens Import S-08"] --> B{"Source type"}
    B -->|"File"| C["Upload spreadsheet, document or PDF IM-02"]
    B -->|"Pasted list"| D["Paste one skill per line IM-01"]
    C --> E["System reads the content, no template needed IM-03"]
    D --> E
    E --> F{"Readable"}
    F -->|"No"| G["Explain what failed and offer paste or retry EC-27"]
    G --> B
    F -->|"Yes"| H["Review screen: found, will be created, possible duplicates IM-05"]
    H --> I["Show unread lines with original text IM-08"]
    H --> J["Propose categories from headings IM-07"]
    H --> K{"Duplicates found"}
    K -->|"Yes"| L["Admin chooses skip, replace or keep both IM-06 OD-13"]
    K -->|"No"| M["Admin edits, merges, splits, discards, adds IM-05"]
    L --> M
    M --> N{"Confirm creation IM-13"}
    N -->|"Back or cancel"| X(["Exit: nothing created"])
    N -->|"Confirm"| O["Create skills as unconfigured and tag the import batch IM-09 IM-11"]
    O --> P["Banner: N skills cannot be used until configured IM-10"]
    P --> Q{"Next step"}
    Q -->|"Configure them now"| R(["Exit: F-03 or F-04"])
    Q -->|"Dismiss"| S(["Exit: library with Needs configuration filter available"])
```

---

## F-02 Create skill manually

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-04 → S-09 step 1 |
| Trigger | Admin chooses Add skill `[REQ IM-12]` |
| Preconditions | None |
| Happy path | Name, description, optional category, tags, status → save → skill exists unconfigured, or continue straight into F-03 |
| Decision points | Create category or tag inline `[REQ SL-05]`; leave unconfigured vs configure now `[REQ SC-01]` |
| Edge / error | Duplicate name; deactivated category or tag not assignable `[REQ SL-06]`; name missing |
| Exit states | Skill saved unconfigured; or configured and ready (F-03) |
| Open decisions | None blocking |

```mermaid
flowchart TD
    A["Admin selects Add skill IM-12"] --> B["Enter name and description SL-02"]
    B --> C{"Category"}
    C -->|"None"| D["Continue, category is optional SL-03"]
    C -->|"Pick active"| D
    C -->|"New"| C1["Create category inline SL-05"] --> D
    D --> E["Add any number of tags, only active offered SL-04 SL-06"]
    E --> F{"New tag needed"}
    F -->|"Yes"| F1["Create tag inline SL-05"] --> G
    F -->|"No"| G["Set status active or inactive SL-02"]
    G --> H{"Name valid and not a duplicate"}
    H -->|"No"| H1["Inline validation message"] --> B
    H -->|"Yes"| I["Save skill as unconfigured SC-01"]
    I --> J{"Configure now"}
    J -->|"Yes"| K(["Exit: F-03"])
    J -->|"Later"| L(["Exit: skill listed with Needs configuration IM-10"])
```

---

## F-03 Configure skill

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-09 steps 2 and 3 plus preview |
| Trigger | Configure on an unconfigured row, or Edit on an existing skill |
| Preconditions | Skill exists `[REQ SC-01]` |
| Happy path | Choose model explicitly → model editor → qualification rule → student submission fields → evaluator comment setting → self-evaluation and approval toggles → allowed evaluator roles → achievement criteria incl. setting minimums → preview everything → save |
| Decision points | Model choice, no default `[REQ SC-02]`; question rule all / at least N of M / named subset `[REQ SC-05]`; scored rule average / minimum per question / total `[REQ SC-07]`; levels and minimums `[REQ SC-10]`; setting minimums `[REQ SC-11]` |
| Edge / error | Changing model rebuilds criteria after confirmation `[REQ SC-09]`; unsatisfiable config not savable `[REQ SC-18]` (EC-2, EC-3, EC-4); empty subset `[REQ SC-06]` (EC-1); editing a skill with evidence re-applies rule `[REQ AE-02]` (EC-6); renaming never changes outcomes `[REQ AE-06]` (EC-7); removing a level or question cascades `[REQ AE-07]` (EC-8) |
| Exit states | Configured and active (usable); configured but inactive; unchanged (cancel) |
| Open decisions | OD-04 (submission fields per skill vs program default; seam: field set referenced by skill), OD-06 (roles as rows), OD-09 (self-evaluation form identical) |

```mermaid
flowchart TD
    A["Open S-09 for a skill"] --> B["Step 1 definition confirmed or edited SL-02"]
    B --> C["Step 2: choose evaluation model explicitly SC-02"]
    C --> D{"Model"}
    D -->|"Overall Binary Outcome"| E1["Set two labels that differ and mark the qualifying one SC-03"]
    D -->|"Question-Level Qualitative"| E2["Define questions, then rule: all, at least N of M, or named subset SC-04 SC-05"]
    D -->|"Scored or Likert"| E3["Define scale and questions, then average, minimum per question or total SC-07"]
    D -->|"Demonstration-Level Outcome"| E4["Define ordered supervision levels SC-08"]
    E1 --> F["Define student submission fields: label, type, mandatory SC-13 OD-04"]
    E2 --> F
    E3 --> F
    E4 --> F
    F --> G["Set evaluator comment optional or mandatory SC-14"]
    G --> H["Toggle student self-evaluation and administrator approval SC-15"]
    H --> I["Choose allowed evaluator roles SC-16 OD-06"]
    I --> J["Step 3: achievement criteria limited to what the model produces SC-09"]
    J --> K{"Demonstration model"}
    K -->|"Yes"| K1["Total demonstrations and minimum per level SC-10"]
    K -->|"No"| K2["Number of qualifying evaluations"]
    K1 --> L["Optional minimum per named clinical setting, lab never counts SC-11 SC-12"]
    K2 --> L
    L --> M["Preview what student and evaluator will see together SC-19"]
    M --> N{"Satisfiable and complete SC-18"}
    N -->|"No"| N1["Block save and name the broken rule EC-2 EC-3 EC-4"] --> C
    N -->|"Yes"| O{"Skill already has evidence"}
    O -->|"Yes"| O1["Show impact notice: rule re-applies to held evidence AE-02 EC-6"] --> P
    O -->|"No"| P["Save"]
    P --> Q(["Exit: skill configured, mappable and submittable"])
    C -. "Model changed on a configured skill" .-> R["Confirm rebuild of criteria SC-09"]
    R --> J
```

---

## F-04 Bulk configure or copy configuration

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-04 (selection) → S-09 |
| Trigger | Many imported skills share a setup `[REQ IM-14]` |
| Preconditions | At least one configured skill (source) and one or more unconfigured or configured targets |
| Happy path | Select source skill → choose targets (single or multi-select) → choose what to copy → review per-target differences (questions, levels) → apply → each target is individually validated |
| Decision points | Copy whole configuration vs selected parts; overwrite configured targets or only unconfigured |
| Edge / error | A copied rule that references items absent on the target is blocked `[REQ SC-18]`; overwriting a target that has evidence triggers the rule re-application notice `[REQ AE-02]` (EC-6) |
| Exit states | Targets configured (and counted down in the unconfigured total `[REQ IM-10]`) or unchanged |
| Open decisions | OD-04 (a program default field set would reduce repetition). Not observed in prototype `[PROTO]`; this flow is REQ-driven only |

```mermaid
flowchart TD
    A["Admin selects a configured source skill IM-14"] --> B["Choose Copy configuration or Apply to selected"]
    B --> C["Select target skills in S-04"]
    C --> D{"Target already configured"}
    D -->|"Yes"| D1["Warn: overwrite replaces model and criteria SC-09"]
    D -->|"No"| E
    D1 --> D2{"Target has evidence"}
    D2 -->|"Yes"| D3["Show AE-02 impact notice EC-6"] --> E
    D2 -->|"No"| E["Pick parts to copy: model, rule, criteria, fields, workflow, roles"]
    E --> F["Review generated configuration per target"]
    F --> G{"Every target satisfiable SC-18"}
    G -->|"No"| G1["List failing targets and reasons, apply to the rest or fix"] --> F
    G -->|"Yes"| H["Apply"]
    H --> I["Update unconfigured counter IM-10"]
    I --> J(["Exit: targets configured"])
```

---

## F-05 Map skills to an offering

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-10 |
| Trigger | A course offering needs its expectations set `[REQ §5]` |
| Preconditions | Skills configured and active (unconfigured and inactive are excluded `[REQ IM-09, SL-11]`) |
| Happy path | Find offering by search or filters → open → select skills → set Mandatory or Non-mandatory per skill → counts update |
| Decision points | Requirement level per skill per offering `[REQ CM-03, CM-06]`; carry-forward between terms is undecided |
| Edge / error | Offering with no cohort (shows 0/0 `[PROTO]`); no offerings match filters; remapping a skill that students already submitted (mapping never invalidates evidence `[REQ CM-05, CM-07]`) |
| Exit states | Offering has N mapped, M mandatory `[REQ CM-04]`; student view for that course reflects the change |
| Open decisions | OD-01 (carry-forward; seam: catalogue-level default layer, not built); bulk mapping across many offerings is implied by volume but not required `[INFER]` |

```mermaid
flowchart TD
    A["Open Course mapping S-10"] --> B["Search or filter by cohort, term, academic year, professional year CM-02"]
    B --> C{"Offerings found"}
    C -->|"No"| C1["Explain no match and offer Clear filters"] --> B
    C -->|"Yes"| D["Open an offering CM-01"]
    D --> E["Search the library, only configured and active skills listed IM-09 SL-11"]
    E --> F["Tick skills to map"]
    F --> G["Set Mandatory or Non-mandatory per skill CM-03 CM-06"]
    G --> H["Counts: mapped and mandatory update CM-04"]
    H --> I["See Also mapped in other offerings, one shared record CM-07"]
    I --> J{"Another offering"}
    J -->|"Yes"| D
    J -->|"No"| K(["Exit: students see expectations in S-12 ST-01"])
    D -. "Carry forward or copy from prior term" .-> L["OPEN: OD-01, not built, seam only CM-08"]
```

---

## F-06 Student sends skills for review

| Item | Detail |
|---|---|
| Persona / surface | P-S · S-12 → S-13 |
| Trigger | Student performed one or more skills and wants evaluation `[REQ §6]` `[CALL 03-05]` (student-initiated) |
| Preconditions | Student has a login; skills configured and active |
| Happy path | Select skills (mapped or other) → Send for review → performed in clinical or lab → setting and location from placement → role and evaluator → submission details → self-evaluation if configured → send → confirmation |
| Decision points | Clinical vs lab `[REQ ST-05]`; setting choice when several `[REQ ST-06]`; evaluator role constrained by setting and skill `[REQ ST-08]`; named lab instructor not on roster `[REQ ST-09]`; setting and location once per submission or per skill `[OD-07]` |
| Edge / error | No placement recorded, use full settings list (EC-13) `[REQ ST-07]`; no valid role and setting combination, explain why (EC-14); mandatory detail missing, block send `[REQ ST-10]`; stale evaluator after switching mode (DEFECT-01, must reset evaluator when mode changes); several locations (EC-12); lab instructor not on roster (EC-15, EC-16); unmapped skill (EC-11) |
| Exit states | Submission is Waiting with a named evaluator `[REQ SH-02]`; student sees confirmation of what, to whom, role, setting, location `[REQ ST-13]` |
| Open decisions | OD-07, OD-09, OD-14 (save a partial submission) |

```mermaid
flowchart TD
    A["Student opens S-12 for a course ST-01"] --> B["Select one or several skills, mapped or other ST-02 ST-04"]
    B --> C["Choose Send for review S-13"]
    C --> D{"Performed where ST-05"}
    D -->|"Clinical"| E{"Placement recorded for this course"}
    D -->|"Lab or simulation"| L1["Lab evidence recorded as lab, no clinical setting"]
    E -->|"Yes, one setting"| E1["Infer setting and location ST-06"]
    E -->|"Yes, several"| E2["Student chooses setting, location recorded ST-06 EC-12"]
    E -->|"No placement"| E3["Offer the program's full settings list ST-07 EC-13"]
    E1 --> F
    E2 --> F
    E3 --> F
    L1 --> F["Choose evaluator role, limited by setting and skill roles ST-08"]
    F --> G{"Any valid role and setting combination"}
    G -->|"No"| G1["Tell the student why, no dead end ST-08 EC-14"] --> D
    G -->|"Yes"| H{"Evaluator listed"}
    H -->|"Yes"| I["Pick the evaluator ST-09"]
    H -->|"Lab instructor not on roster"| H1["Student gives name and email ST-09 EC-15"] --> I
    I --> J["Reset evaluator if mode or role changed DEFECT-01"]
    J --> K["Enter submission details, mandatory enforced ST-10 and one optional note ST-12"]
    K --> M{"Self-evaluation configured ST-11"}
    M -->|"Yes"| M1["Student self-evaluates on the same criteria"] --> N
    M -->|"No"| N{"All mandatory complete"}
    N -->|"No"| N1["Send stays disabled with the missing item named"] --> K
    N -->|"Yes"| O["Send request, email goes to evaluator S-18"]
    O --> P["Confirmation: skills, evaluator, role, setting, location ST-13"]
    P --> Q(["Exit: submission Waiting, history updated SH-02"])
    K -. "Leave before sending" .-> R["OPEN: partial save OD-14"]
    D -. "Setting per submission or per skill" .-> S["OPEN: OD-07 seam: setting on each item, default from submission"]
```

---

## F-07 Evaluator completes the evaluation

| Item | Detail |
|---|---|
| Persona / surface | P-P, P-F, P-L · S-18 → S-16 (no shell) |
| Trigger | Email with a link `[REQ EV-01]` |
| Preconditions | A submission was sent to this evaluator; skill configured |
| Happy path | Open link → see student context, details and self-evaluation → answer each skill as configured → write comment where required → submit → told whether it counts now or is held for approval |
| Decision points | Skill configuration decides the form `[REQ EV-03]`; mandatory feedback `[REQ EV-06]`; approval required or not `[REQ EV-07]` |
| Edge / error | Link invalid or expired, already submitted (EC list gap, OD-18); mandatory comment missing (blocks submit); several skills in one request, all completed in one sitting `[REQ EV-05]`; evaluator unavailable, student re-sends (F-09, EC-17); phone use (persona risk) |
| Exit states | Evaluation Completed; evidence Counted or Awaiting approval; evaluator told which `[REQ EV-07]` |
| Open decisions | OD-17 (evaluator seeing achievement status, DEFECT-05), OD-18 (link lifecycle), OD-06 (roles) |

```mermaid
flowchart TD
    A["Evaluator receives request email S-18 EV-01"] --> B["Open link, no login, no account created EV-01"]
    B --> C{"Link valid and unused"}
    C -->|"No"| C1["Show reason and how to ask the student to resend OD-18"]
    C1 --> X1(["Exit: no evidence recorded"])
    C -->|"Yes"| D["Show student, course, skills and student-supplied details EV-04"]
    D --> E{"Self-evaluation exists"}
    E -->|"Yes"| E1["Show it as context EV-04"] --> F
    E -->|"No"| F["Per skill: form exactly as the program configured EV-03"]
    F --> G["Evaluator answers each skill, one sitting EV-05"]
    G --> H{"Comment mandatory for this skill"}
    H -->|"Yes and empty"| H1["Submit disabled until written EV-06 SC-14"] --> G
    H -->|"No or provided"| I{"All skills answered"}
    I -->|"No"| G
    I -->|"Yes"| J["Submit evaluation"]
    J --> K{"Administrator approval required EV-07 SC-15"}
    K -->|"No"| K1["Tell evaluator: counts now"] --> L(["Exit: Counted"])
    K -->|"Yes"| K2["Tell evaluator: held for administrator approval"] --> M(["Exit: Awaiting approval"])
    J -. "What the evaluator sees next" .-> N["OPEN: achievement status shown or hidden OD-17"]
```

---

## F-08 Administrator approves or returns

| Item | Detail |
|---|---|
| Persona / surface | P-R (administrator) · S-11 → S-03 |
| Trigger | A completed evaluation for a skill with approval on `[REQ §8]` |
| Preconditions | Evaluation completed, held `[REQ AR-06]` |
| Happy path | Open queue → pick item → compare self-evaluation and evaluator, agreement shown → expand full responses → optional review note → Approve → evidence counts |
| Decision points | Approve or Return `[REQ AR-05]` |
| Edge / error | Empty queue; assessments disagree `[REQ AR-02]`; returned evidence does not count; once approved or counted it is locked `[REQ RV-05]` |
| Exit states | Counted (approved) or Returned (does not count, goes back for correction `[REQ AR-05]`) |
| Open decisions | **OPEN OD-16**: does a returned evaluation go back to the student to correct, or to the evaluator to redo? REQ AR-05 says "goes back for correction"; RV-01 gives the student the correct-and-resend path; the prototype labels it "Return to preceptor" while its student view shows "Revise and resend" (DEFECT-03). Both branches shown. Recommendation `[INFER]`: student corrects, because REQ RV-01 and RV-02 define that path and RV-04 lets the student pick a different evaluator. |

```mermaid
flowchart TD
    A["Open Review and approve S-11 AR-01"] --> B{"Queue has items"}
    B -->|"No"| B1(["Exit: empty state"])
    B -->|"Yes"| C["Select an evaluation: student, skill, course, setting, location, evaluator, role AR-01"]
    C --> D{"Self-evaluation exists"}
    D -->|"Yes"| D1["Show side by side with agreement flag AR-02"] --> E
    D -->|"No"| E["Evaluator assessment shown alone"]
    E --> F["Expand full set of responses AR-03"]
    F --> G["Add optional review note, retained AR-04"]
    G --> H{"Decision AR-05"}
    H -->|"Approve"| I["Evidence now counts AE-01 AR-06"]
    I --> J(["Exit: Counted and locked RV-05"])
    H -->|"Return"| K["Evaluation does not count AR-06"]
    K --> L{"OPEN OD-16: who corrects"}
    L -->|"Branch A INFER recommended: student"| M["Returned to student with the review note as the reason RV-02"]
    L -->|"Branch B as labelled in prototype: evaluator"| N["Returned to evaluator to redo"]
    M --> O(["Exit: Returned, continues in F-09"])
    N --> P(["Exit: Waiting on evaluator, F-07 again"])
```

---

## F-09 Student revises and resends

| Item | Detail |
|---|---|
| Persona / surface | P-S · S-14 → S-13 |
| Trigger | Submission was returned, or has not yet been assessed `[REQ RV-01]` |
| Preconditions | Submission is Returned or Waiting; not Counted and not Awaiting approval `[REQ RV-05]` |
| Happy path | Open history → Revise and resend → read reason → correct details or note → optionally pick a different evaluator → resend → same record, revision count +1 |
| Decision points | Keep or change evaluator `[REQ RV-04]`; evaluator answers cleared or prefilled `[OD-08]` |
| Edge / error | Evaluator no longer available (EC-17); attempt to edit a Counted or Awaiting approval item is not offered (EC-20); mandatory detail missing |
| Exit states | Submission Waiting again with "Revised and resent n times" `[REQ RV-02]` |
| Open decisions | OD-16 (this flow is the student branch of F-08), OD-08 (seam: prior evaluation kept as immutable snapshot) |

```mermaid
flowchart TD
    A["Student opens skill history S-14 SH-01"] --> B{"Which submission status"}
    B -->|"Returned"| C["Show reason from reviewer note RV-02 SH-02"]
    B -->|"Waiting and not yet assessed"| C2["Allow correct and resend RV-01"]
    B -->|"Counted or Awaiting approval"| B1(["Exit: no edit or resend offered RV-05 EC-20"])
    C --> D["Choose Revise and resend"]
    C2 --> D
    D --> E["Edit submission details and note ST-10 ST-12"]
    E --> F{"Evaluator still available"}
    F -->|"No"| F1["Choose a different evaluator, role rules apply ST-08 RV-04 EC-17"] --> G
    F -->|"Yes"| G["Keep evaluator"]
    G --> H{"Mandatory details complete"}
    H -->|"No"| E
    H -->|"Yes"| I["Resend on the same record, revision count increases RV-02"]
    I --> J{"Evaluator previous answers"}
    J -->|"Start fresh"| J1["OPEN OD-08 branch A"]
    J -->|"Prefilled for confirmation"| J2["OPEN OD-08 branch B"]
    J1 --> K(["Exit: Waiting, Revised and resent n times"])
    J2 --> K
```

---

## F-10 Student makes a further attempt

| Item | Detail |
|---|---|
| Persona / surface | P-S · S-14 → S-13 |
| Trigger | A completed evaluation did not meet the criteria `[REQ RV-03]` |
| Preconditions | Original evaluation is Did not meet criteria and immutable |
| Happy path | History shows the failed rule in plain terms → student performs the skill again → starts a new submission (new attempt) → original left intact |
| Decision points | Different evaluator allowed `[REQ RV-04]`; setting and role rules unchanged |
| Edge / error | Failed rule must be stated in terms the student can act on `[REQ SH-03]`; no failing example exists in the prototype seed, so wording is untested `[PROTO]`; setting-minimum not yet met although counts are met (DEFECT-07) |
| Exit states | New submission Waiting as Attempt n+1; original shows Did not meet the criteria `[REQ SH-02]` |
| Open decisions | None blocking; wording of failed-rule messages needs content design |

```mermaid
flowchart TD
    A["Student opens skill history S-14"] --> B["Attempt shows Did not meet the criteria SH-02"]
    B --> C["Show the rule it failed in actionable terms SH-03"]
    C --> D{"Edit the failed evaluation"}
    D -->|"Attempted"| D1["Not possible, a completed evaluation is a record RV-03"]
    D1 --> E
    D -->|"Make a further attempt"| E["Start new submission, same skill record AE-05"]
    E --> F["Same flow as F-06 for context, evaluator and details ST-05 ST-08 ST-10"]
    F --> G["Evaluator may differ from the original RV-04"]
    G --> H["Send"]
    H --> I(["Exit: new attempt Waiting, original intact RV-03"])
    C -. "Counts met but a setting minimum is not" .-> J["Explain which setting is short, lab does not count SH-05 SC-12 DEFECT-07"]
```

---

## F-11 Report drill-down

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-01 → S-02 → S-03 |
| Trigger | Admin wants attainment across a population `[REQ §11]` |
| Preconditions | Skills configured and some evidence exists |
| Happy path | Open Overview → apply filters → pick view (student, skill, tag) → select a figure or row → reach individuals → open a skill → read the evidence ledger → open full evaluation |
| Decision points | Which view `[REQ RP-02, RP-03, RP-04]`; filters `[REQ RP-01]` |
| Edge / error | Filter combination that cannot produce evidence is explained, not returned empty `[REQ RP-09]` (EC-22); location or setting filter recalculates counting only evidence there `[REQ RP-08]` (EC-23); tags overlap and the report says so `[REQ RP-04]` (EC-21); no students in view; duplicate student names need an identifier (DEFECT-09, EC-26) |
| Exit states | Evaluation detail displayed in full, or return to filtered report with filters intact |
| Open decisions | OD-03 (no evidence vs does not qualify reported separately), OD-11 (evaluator and site dimension exposed) |

```mermaid
flowchart TD
    A["Open Overview S-01"] --> B["Apply filters: cohort, group, course, category, tag, location, setting RP-01"]
    B --> C{"Filter combination can produce evidence"}
    C -->|"No"| C1["Explain why, for example location does not offer that setting RP-09 EC-22"] --> B
    C -->|"Yes"| D{"View RP-02 RP-03 RP-04"}
    D -->|"By student"| E1["Achieved, in progress, not met, attainment per student"]
    D -->|"By skill"| E2["Population performance per skill"]
    D -->|"By tag"| E3["Overlapping figures with an overlap note RP-04 EC-21"]
    E1 --> F["Select a student row RP-05"]
    E2 --> F2["Select a skill row to reach individuals RP-05"]
    E3 --> F3["Select a tag to see its skills and students RP-05"]
    F2 --> F
    F3 --> F
    F --> G["Student drill-down S-02 with progress per skill"]
    G --> H["Open a skill: evidence ledger S-03 RP-06"]
    H --> I["Date, setting, location, evaluator, role, recorded, result"]
    I --> J["Open full evaluation, every response, comment, student details RP-07"]
    J --> K(["Exit: back to the filtered report, filters preserved RP-01"])
    D -. "Not met includes no evidence in prototype" .-> L["OPEN: OD-03 render 4 states AE-04 or collapsed"]
```

---

## F-12 Export

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-17 from S-01 |
| Trigger | Admin needs the data outside Prism `[REQ RP-10]` |
| Preconditions | A filtered view is open |
| Happy path | Export → choose Aggregate or Evidence detail → file for full filtered scope with filters recorded in the header |
| Decision points | Aggregate (current view) vs row-per-evaluation detail `[REQ RP-10]` |
| Edge / error | Large scope; export covers the full filtered scope, not the visible page `[REQ RP-10]` (EC-24); no data; export in progress |
| Exit states | File downloaded; filters recorded |
| Open decisions | OD-10 (CSV or native Excel; seam: tabular rows with a format adapter), OD-11 (evaluator and site columns). Evidence detail carries feedback, settings, locations, self-evaluations and review notes `[REQ RP-10]`. Download contents not exercised `[PROTO]` |

```mermaid
flowchart TD
    A["Admin on S-01 with filters applied"] --> B["Choose Export RP-10"]
    B --> C{"Export type"}
    C -->|"Aggregate view"| D["Rows as shown for the current view"]
    C -->|"Evidence detail"| E["One row per evaluation: feedback, settings, locations, self-evaluations, review notes RP-10"]
    D --> F["Cover full filtered scope, not just the visible page EC-24"]
    E --> F
    F --> G["Write the applied filters into the file header RP-10"]
    G --> H{"Format"}
    H -->|"CSV"| I["Produce CSV"]
    H -->|"Excel workbook"| J["OPEN OD-10 not built, adapter seam"]
    I --> K{"Any rows"}
    K -->|"No"| K1["Explain and keep the dialog open"] --> B
    K -->|"Yes"| L(["Exit: file downloaded"])
```

---

## F-13 Adopt student-named lab instructor

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-07 (and student side in F-06) |
| Trigger | A student named a lab instructor not on the roster `[REQ ST-09]` |
| Preconditions | At least one such name exists |
| Happy path | Roster shows "Named by students, not on the roster" → admin reviews name and email → Add to roster → spellings stop accumulating |
| Decision points | Adopt as new, or merge with an existing entry `[REQ SL-09]` |
| Edge / error | Same person spelled differently (EC-16); malformed email; person already on roster as inactive |
| Exit states | Instructor on roster and offered to students for lab sign-off `[REQ SL-07 context, SL-08]` |
| Open decisions | OD-05 (Skills-only record vs Prism-wide external evaluator; seam: standalone external evaluator table). Instructors never get accounts `[REQ SL-08]` |

```mermaid
flowchart TD
    A["Student names a lab instructor in F-06 ST-09"] --> B["System keeps the name and email on the submission"]
    B --> C["Admin opens Lab instructors S-07"]
    C --> D["Section: Named by students, not on the roster SL-09"]
    D --> E{"Is this a known person"}
    E -->|"Same as an existing entry"| F["Merge spelling into the existing instructor EC-16"]
    E -->|"New"| G["Add to roster with name and email, no account created SL-08"]
    E -->|"Not wanted"| H(["Exit: left as one-off, remains visible"])
    F --> I(["Exit: one person, one spelling SL-09"])
    G --> I
    G -. "Where the record lives" .-> J["OPEN: OD-05 seam: standalone external evaluator record"]
```

---

## F-14 Deactivate skill, category or tag

| Item | Detail |
|---|---|
| Persona / surface | P-A · S-04, S-05 |
| Trigger | A skill, category or tag is retired `[REQ SL-06, SL-11]` |
| Preconditions | Item exists |
| Happy path | Set to inactive → no longer assignable or selectable; existing evidence retained |
| Decision points | Skill vs category vs tag behave differently |
| Edge / error | Skill: withdrawn from course mapping, student selection and reporting scope while evidence is retained `[REQ SL-11]` (EC-10); category or tag already assigned stays on the skill, shown as inactive, removable deliberately `[REQ SL-06]` (EC-9); deactivating a mapped skill; reactivation. Behaviour not triggered in the prototype `[PROTO]` |
| Exit states | Inactive item; evidence unchanged |
| Open decisions | OD-24 (proposed: in-flight submission when its skill is deactivated; seam: leave the submission in its current state, no new behaviour until decided) |
| Branch F-14b, clinical setting (S-06) `[INFER]`, proposed **OD-26** (docs/strategy/05) | Deactivating a clinical setting that a skill's per-setting minimum references is blocked with a stated reason naming the skills (SC-11 minimums would become unsatisfiable, SC-18); otherwise the setting becomes inactive, is no longer offered to students, and evidence recorded in it is retained. REQ is silent on setting deactivation, so this is a proposal |

```mermaid
flowchart TD
    A["Admin sets item to inactive"] --> B{"Item type"}
    B -->|"Skill"| C["Withdraw from course mapping, student selection and reporting scope SL-11"]
    C --> C1["Evidence already recorded is retained SL-11 EC-10"]
    B -->|"Clinical setting S-06 (INFER)"| S1{"Referenced by a skill setting minimum SC-11"}
    S1 -->|"Yes"| S2["Blocked with reason naming the skills SC-18"]
    S1 -->|"No"| S3["Inactive: not offered to students, evidence retained"]
    S3 --> F
    S2 --> F
    B -->|"Category or tag"| D["No longer offered for assignment SL-06"]
    D --> D1["Where already assigned: stays on the skill, labelled inactive SL-06 EC-9"]
    D1 --> D2["Admin can remove it deliberately from each skill"]
    C1 --> E{"Skill currently mapped to offerings"}
    E -->|"Yes"| E1["Show which offerings lose it and confirm CM-04"] --> F
    E -->|"No"| F(["Exit: inactive, evidence intact"])
    D2 --> F
    F -. "Reactivate" .-> G["Item becomes assignable or selectable again"]
```

---

## End-to-end swimlane: library to report

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin P-A
    actor Student as Student P-S
    actor Evaluator as Evaluator P-P P-F P-L
    participant System as System
    Note over Admin,System: Library and setup
    Admin->>System: Import list or add skill SL-01 IM-01 IM-12
    System-->>Admin: Proposed list for review IM-05
    Admin->>System: Confirm creation IM-13
    System-->>Admin: Skills created unconfigured IM-09 IM-10
    Admin->>System: Configure model, rule, criteria, fields, workflow SC-01 SC-02
    System-->>Admin: Preview and validation SC-18 SC-19
    Admin->>System: Map skills to offering, mandatory or not CM-03
    System-->>Student: Expectations visible in the course ST-01
    Note over Student,System: Evidence
    Student->>System: Select skills, clinical or lab, evaluator, details ST-04 ST-05 ST-09
    opt Self-evaluation configured
        Student->>System: Self-evaluate on the same criteria ST-11
    end
    System-->>Evaluator: Email with tokenised link S-18 EV-01
    System-->>Student: Confirmation of what, to whom, setting, location ST-13
    Evaluator->>System: Open link and complete the form, no login EV-01 EV-03
    System-->>Evaluator: Counts now or held for approval EV-07
    alt Approval required
        System-->>Admin: Evaluation waiting in the queue AR-01
        Admin->>System: Approve or return with note AR-04 AR-05
        opt Returned and OD-16 branch student
            System-->>Student: Returned with reason RV-02
            Student->>System: Revise and resend RV-01
        end
    end
    System->>System: Qualify against current rule and recompute record AE-01 AE-02 AE-03
    alt Did not meet the criteria
        System-->>Student: Outcome with the failed rule SH-02 SH-03
        Student->>System: Further attempt, original intact RV-03
    end
    System-->>Student: Record, history, progress per setting SH-01 SH-04 SH-05
    Note over Admin,System: Reporting
    Admin->>System: Filter by cohort, course, tag, location, setting RP-01
    System-->>Admin: Attainment by student, skill, tag RP-02 RP-03 RP-04
    Admin->>System: Drill to individual and evidence RP-05 RP-06
    System-->>Admin: Full evaluation RP-07
    Admin->>System: Export aggregate or evidence detail RP-10
    System-->>Admin: File with filters recorded RP-10
```

Open decisions that alter this swimlane: OD-07 (setting capture), OD-08 (corrected evaluation), OD-14 (partial save), OD-16 (who corrects a returned evaluation), OD-17 (evaluator-visible status), OD-18 (link lifecycle). Out of scope and absent by design: notifications and reminders, remediation, expiry, encounter linkage, Evaluations migration `[REQ §14]`.

---

## Flow-to-surface-to-requirement index

| Flow | Surfaces | Primary REQ ids | ODs |
|---|---|---|---|
| F-01 | S-08, S-04 | IM-01..IM-13 | OD-12, OD-13 |
| F-02 | S-04, S-09 | SL-02..SL-06, IM-12 | none |
| F-03 | S-09 | SC-01..SC-19, AE-02, AE-06, AE-07 | OD-04, OD-06, OD-09 |
| F-04 | S-04, S-09 | IM-14, SC-18, IM-10 | OD-04 |
| F-05 | S-10 | CM-01..CM-07 | OD-01 |
| F-06 | S-12, S-13, S-18 | ST-01..ST-13 | OD-07, OD-09, OD-14 |
| F-07 | S-16, S-18 | EV-01..EV-07 | OD-06, OD-17, OD-18 |
| F-08 | S-11, S-03 | AR-01..AR-06, RV-05 | OD-16 |
| F-09 | S-14, S-13 | RV-01, RV-02, RV-04, RV-05 | OD-08, OD-16 |
| F-10 | S-14, S-13 | RV-03, SH-02, SH-03, SH-05 | none |
| F-11 | S-01, S-02, S-03 | RP-01..RP-09 | OD-03, OD-11 |
| F-12 | S-17 | RP-10 | OD-10, OD-11 |
| F-13 | S-07 | SL-08, SL-09, ST-09 | OD-05 |
| F-14 | S-04, S-05, S-06 | SL-06, SL-11, SC-11, SC-18 | OD-24 (proposed), OD-26 (proposed: setting deactivation block) |
