# 02 — Domain Model & Achievement Engine (Architect hat)

> The requirements doc says the achievement engine is "the part most worth agreeing first, since everything else depends on them." `[REQ §12]` This file is that agreement, written so every screen can be checked against it.

## 1. Five architectural principles

**P1 — Program defines, Prism hosts.** No shipped skills/taxonomy; every label is program-owned. `[REQ SL-01, §1.6]`
Governs: empty states (never pre-fill), import (never impose template), reporting labels, response labels.

**P2 — The model determines the evidence; the evidence determines the criteria.** `[REQ §1.5, SC-09, SC-17]`
```
Evaluation model ─▶ evidence per evaluation ─▶ qualification rule ─▶ achievement criteria ─▶ skill status
   (chosen)            (what exists)            (when 1 eval counts)    (what is required)      (derived)
```
Governs: the configuration UI (steps must be visually dependent), save validation (SC-18), changing the model rebuilds criteria (SC-09). `[PROTO]` shows this as a "Configuration lineage" panel — good pattern, not mandated.

**P3 — Evidence is a ledger, status is a view.** Evaluations are immutable records; qualification is recomputed from the skill's *current* rule. `[REQ RV-03, AE-02, AE-06]`
Governs: rule edits re-apply to held evidence; renames never change outcomes; a failed attempt is never edited, a *further attempt* is created.

**P4 — Expectation is not eligibility.** Mapping says "expected here"; it never gates submission. `[REQ CM-05]`
Governs: student selector shows mapped (mandatory/non-mandatory) then "other skills"; evidence from any course counts.

**P5 — One student record per skill, many contexts per piece of evidence.** Each evidence item carries course, setting (clinical vs lab), clinical setting, location, evaluator, role. Reporting slices on these; the record does not fork. `[REQ CM-07, AE-05, ST-05..06]`

## 2. Entities

```
Program ──< Category (0..1 per skill) >── Skill ──< SkillTag >── Tag
   │                                       │
   │                                       ├── EvaluationConfig (exactly one model)
   │                                       │      ├─ labels / questions / scale / levels
   │                                       │      ├─ QualificationRule
   │                                       │      ├─ AchievementCriteria (+ per-setting minimums)
   │                                       │      ├─ SubmissionField[] (student-supplied)
   │                                       │      ├─ evaluatorComment: optional|mandatory
   │                                       │      ├─ workflow: selfEval?, adminApproval?
   │                                       │      └─ allowedEvaluatorRoles[]
   │                                       └── status: active | inactive ; configured | unconfigured
   │
   ├── ClinicalSetting (list)       ├── LabInstructor (name+email, NOT a Prism user)
   └── CourseOffering (code,name,term,acadYear,profYear,cohorts[])
            └──< OfferingSkillMap >── Skill   (requirement: mandatory | non-mandatory)

Student ──1 StudentSkillRecord per Skill (derived: state + counts)
              └──< Submission (attempt n; revisions r; status) ──< SubmissionItem per skill (if batched)
                       ├─ context: course, performedIn: clinical|lab, clinicalSetting?, location?
                       ├─ evaluator: person + role (preceptor | faculty | lab instructor)
                       ├─ studentSupplied[] , studentNote (max 1), selfEvaluation?
                       └─ Evaluation (immutable once complete): responses, comment, outcome
                              └─ ReviewNote? (admin), approval: pending|approved|returned
```
Sources: SL, SC, CM, ST, EV, AR, RV, SH. `[REQ]`  Entity shapes are `[INFER]`; field names are mine, not the doc's.

## 3. The four evaluation models (and what each can ask for)

| Model | Evaluator records | Qualification rule options | Achievement criteria can require | Source |
|---|---|---|---|---|
| **Overall Binary Outcome** | One outcome, two program labels (default Met/Unmet); which one qualifies is stored | Outcome == qualifying label | N qualifying evaluations; setting minimums | SC-03 |
| **Question-Level Qualitative** | Yes/No per program question | All Yes · at least N of M Yes · named subset all Yes (non-empty) | N qualifying evaluations; setting minimums | SC-04..06 |
| **Scored / Likert** | Score per question on program scale | Average · minimum on every question · total | N qualifying evaluations; setting minimums | SC-07 |
| **Demonstration-Level Outcome** | One supervision level per demonstration (program-defined, **ordered**, no fixed 3-pt) | Every completed demonstration is evidence `[INFER; REQ SC-10 sets counts and per-level minimums, not a qualification rule]` | Total demonstrations + minimum at each level; setting minimums | SC-08, SC-10 |

Rules that cut across models:
- Exactly one model per skill, chosen explicitly, **no default** `[SC-02]`. (Binary's *labels* default to Met/Unmet; the *model* does not.)
- Setting minimums are **per named clinical setting, counted per setting**; **lab/sim evidence never satisfies a clinical setting minimum** `[SC-11, SC-12]`.
- Student-supplied submission fields (label, type∈{date, short text, long text, number, choice list}, mandatory?) are independent of the model `[SC-13]`.
- Evaluator narrative: always capturable; mandatory per skill `[SC-14]`.
- Optional per skill: student self-evaluation first; admin approval before counting `[SC-15]`.
- Allowed evaluator roles per skill `[SC-16]`.
- Unsavable configs: unlabelled/duplicate questions or levels; empty subset; minimums exceeding totals `[SC-18]`.
- Removing a question/level removes it from every rule that referenced it `[AE-07]`; renaming is presentation only `[AE-06]`.

`[CALL 09-23]` adds intent not in the doc: "frequency or the count of demonstrations will always be there" — i.e. even Met/Unmet skills usually need N occurrences. REQ models this as "N qualifying evaluations".

## 4. Submission / evidence lifecycle

```
                 ┌──────────── student corrects & resends (same record, revision+1) ───────────┐
                 ▼                                                                              │
 Draft/Sent ─▶ [Self-eval?] ─▶ Awaiting evaluator ─▶ Completed ─▶ [Admin approval?] ─▶ Counts
                                   │                    │               │
                                   │                    │               └─ Return ─▶ Returned (to student) ─┘
                                   │                    └─ does not qualify ─▶ Did not meet criteria
                                   └─ not yet assessed: student may correct & resend
 Did not meet criteria ─▶ student makes a *further attempt* (new record; original untouched)   [RV-03]
 Counted OR awaiting approval ─▶ cannot be edited or resent                                    [RV-05]
```
Student-visible outcomes (SH-02): **counted · did not meet criteria · returned · waiting (with whom)**.
Excluded from achievement until complete: anything awaiting self-eval, evaluator, or approval `[AE-01, AR-06]`.

## 5. Skill status (derived)

REQ distinguishes **four** states `[AE-04]`:

| # | State | Meaning |
|---|---|---|
| 1 | No evidence yet | No completed evidence |
| 2 | Evidence exists, none qualifies | Evidence present, all fail the rule |
| 3 | Some qualifying evidence, criteria not met | Partial progress |
| 4 | Achieved | **Every** criterion met: counts + per-level mins + setting mins `[AE-03]` |

`[PROTO]` collapses to **Not Started → In Progress → Achieved** and the Overview lumps 1 and 2 into **Not met** ("Not met includes skills with no qualifying evidence yet"). That is a de-facto answer to **OD-03** that the doc has *not* approved. See `05-open-decisions.md`.

Worked example (prototype data) — **IV Insertion**, Demonstration model, criteria "5 demonstrations · 1 observed · 1 with assistance · 3 independent":
Student has 7 demonstrations: Observed 2/1, With Assistance 1/1, Independent 4/3 → total 7/5, every minimum met → **Achieved**. Removing an Independent would leave 3/3 — still achieved; removing the With-Assistance one fails the per-level min even though total is 6 ≥ 5. This per-level logic is the thing to unit-test first.

## 6. Computation invariants (write these as tests before UI)

1. `count(skill) = |{e ∈ evidence : complete(e) ∧ approvedIfRequired(e) ∧ qualifies(e, currentRule)}|`
2. `achieved(skill) ⇔ count ≥ N ∧ ∀level: perLevel ≥ min ∧ ∀setting: perSetting ≥ min` (setting counts only clinical evidence with that setting)
3. Editing a rule changes `qualifies`, never stored responses `[AE-02, AE-06]`.
4. Deleting a level/question cascades into rules `[AE-07]`; evidence tagged with a removed level stops counting toward that level but is retained `[PROTO note]` — REQ AE-07 only mandates rule cascade; retention text is from the prototype; confirm.
5. Deactivating a skill: withdrawn from mapping, selection, reporting scope; evidence retained `[SL-11]`.
6. Filtering reports by location/setting recomputes progress counting only evidence gathered there `[RP-08]`.
7. A filter combination that cannot produce evidence must be *explained* `[RP-09]`.
8. Same student, same skill, many courses → one record `[CM-07]`.

## 7. Roles & data scope

| Role | Auth | Can | Cannot | Source |
|---|---|---|---|---|
| Administrator | Prism login | Library, config, import, mapping, approval, reporting, export | — | REQ §2–5, 8, 11 |
| Student | Prism login | See expectations, submit, self-evaluate, revise, view own record | See other students' records `[INFER from FERPA scoping; REQ silent]` | REQ §6, 10 |
| Preceptor | **None** (email link) | Complete a form for that request | Alter evaluation method; see anything else | REQ EV-01, EV-03 |
| Clinical faculty | May use Prism *or* link | Same | Same | REQ EV-02 |
| Lab instructor | **Not a Prism user**; name+email | Same | Same | REQ SL-08 |

FERPA/RBAC reminders from workspace domain context apply: student data scoped to student; evaluator link exposes only that request. `[exxat-domain-context]`
