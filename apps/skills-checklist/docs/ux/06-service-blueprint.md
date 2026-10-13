# 06 — Service Blueprint (whole lifecycle)

**Hat:** service designer + PM. Companion to `docs/journeys/*` (per-persona) and `docs/strategy/02` (engine). This file shows **who does what, what they see, what the system does behind the scenes, and where it breaks**, across all personas at once.
Tags per `docs/README.md`: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[CALL 03-05]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER. No `OD-*` is treated as decided; where one shapes a step it is shown as a **seam** (`⟂ OD-n`).

## 0. Legend

| Symbol | Meaning |
|---|---|
| P-A | Administrator (program coordinator) `[REQ §8, §11]` |
| P-S | Student |
| P-P | Preceptor, no Prism login `[REQ EV-01]` |
| P-F | Clinical faculty (may use Prism or link) `[REQ §7 intro, EV-02]` |
| P-L | Lab instructor, not a Prism user, name + email only `[REQ SL-08]` |
| P-R | Reviewer (administrator acting on approval queue) `[REQ AR-01..06]` |
| S-xx | Surface (registry: S-01 Overview … S-18 evaluation-request email) |
| F-xx | Flow (F-01 import … F-14 deactivate) |
| ⚑ | Moment of truth · ✖ failure point · ↺ recovery · ⟂ open-decision seam |
| Emotion | `[INFER]` throughout; the requirements define no emotional model. Validate in research plan `ux/12` |

Owner-team lane is shown only where a source names one: **Sankalp** (initiative owner, requirements `[REQ cover]`), **FAST team** (form generation, Q4 technical discussion `[CALL 09-23]`), **LAM team** (migration inputs outstanding `[REQ §14]`), **Ankit** (learning contracts, Q4 `[CALL 09-23]`). "Exxat Prism platform" is `[INFER]`: the team owning cohort/course/placement data is not named in any source.

## 1. Lifecycle at a glance

```
 DEFINE ─▶ IMPORT ─▶ CONFIGURE ─▶ MAP ─▶ SEND ─▶ EVALUATE ─▶ APPROVE ─▶ REVISE / ATTEMPT ─▶ TRACK ─▶ REPORT
 P-A        P-A        P-A         P-A    P-S      P-P/F/L     P-R        P-S               P-S      P-A
 S-04..07   S-08       S-09        S-10   S-12,13  S-18,S-16   S-11       S-14              S-12,14,15  S-01..03,17
 F-02,13    F-01       F-03,04     F-05   F-06     F-07        F-08       F-09,F-10         —        F-11,F-12
 SL         IM         SC          CM     ST       EV          AR         RV                SH       RP        (AE across all)
```
Cross-cutting: **F-14 deactivate** (SL-11) can occur at any time after DEFINE.

## 2. Master blueprint (per stage)

Rows read top-to-bottom: *line of interaction* separates what the person does/sees from what Prism does; *line of visibility* separates frontstage from backstage; *line of internal interaction* separates Prism's own work from other systems/teams.

### Stage 1: DEFINE (library, lists)  F-02, F-13  S-04 S-05 S-06 S-07

| Lane | Content |
|---|---|
| Customer action (P-A) | Create a skill by hand (name, description, status), optionally category and tags; create a category or tag inline `[SL-02..05]`; maintain clinical settings `[SL-07]`; add lab instructors (name + email) `[SL-08]`; adopt a student-named instructor `[SL-09]` |
| Frontstage | S-04 library list with search and filters by name, category, tag, status `[SL-10]`; S-05 categories and tags (tags show "where each tag reaches" `[PROTO]`); S-06 settings with evidence counts `[PROTO]`; S-07 roster plus "Named by students, not on the roster" `[PROTO]` |
| ─ line of interaction ─ | |
| Backstage (Prism) | Persist skill unconfigured; enforce at most one category per skill `[SL-03]`; keep inactive-but-assigned category/tag on skill, flagged inactive `[SL-06]`; collect student-named instructors for adoption `[SL-09]` |
| Systems / data | Skill, Category, Tag, ClinicalSetting, LabInstructor (no account created `[SL-08]`) `[INFER entity names]` |
| Pain points | Empty library on day one; fear that Prism "ships" a list `[REQ SL-01]` so empty-state copy must say the program owns the content |
| Moment of truth ⚑ | "Is this my list, in my words?" |
| Emotion `[INFER]` | Neutral, slightly daunted by blank slate |
| Failure ✖ / recovery ↺ | ✖ Duplicate or misspelt lab instructor accumulates `[SL-09]` ↺ adopt/merge from S-07 · ✖ Deactivated category disappears silently ↺ stays visible as inactive `[SL-06]` |
| Owner | Sankalp (requirements); platform team `[INFER]` |

### Stage 2: IMPORT  F-01  S-08

| Lane | Content |
|---|---|
| Customer action (P-A) | Supply an existing list (spreadsheet, document, PDF) or paste it `[IM-01..03]`; review proposed skills; edit, rename, merge, split, discard, add `[IM-05]`; choose per duplicate: skip, replace, keep both `[IM-06]`; accept or decline proposed categories `[IM-07]`; read unread lines `[IM-08]`; confirm `[IM-13]` |
| Frontstage | S-08 input → review table (found / will be created / possible duplicates counters `[PROTO]`) → unread-lines panel → confirm; banner: skills created but unconfigured `[IM-09, PROTO]`; S-04 filter "Needs configuration" and count `[IM-10]` |
| ─ line of interaction ─ | |
| Backstage (Prism) | Interpret content without a template `[IM-03]`; propose skills, descriptions, groupings, any written questions/criteria `[IM-04]`; match against existing library `[IM-06]`; hold all output as a **draft**, create nothing before confirmation `[IM-05, IM-13]`; tag each created skill with its import batch `[IM-11]` |
| Systems / data | Document interpretation service (**mechanism unspecified in REQ**; call says AI scanning `[CALL 09-23]`); Import batch record; duplicate matcher ⟂ OD-13; proposal scope ⟂ OD-12 |
| Pain points | Mis-parsed headings read as skills; silent drops; fear of overwriting skills that already hold evidence ⟂ OD-13 |
| Moment of truth ⚑ | Review table: "Did it understand my list, and did it show me what it could not read?" |
| Emotion `[INFER]` | Hopeful then wary, relief when unread lines are shown |
| Failure ✖ / recovery ↺ | ✖ File unreadable or empty result ↺ error plus manual add `[IM-12]` · ✖ Everything excluded ↺ back to input, nothing created · ✖ Re-import duplicates ↺ resolver, never silent replace ⟂ OD-13 |
| Owner | Sankalp; interpretation component owner not named in any source |

### Stage 3: CONFIGURE  F-03, F-04  S-09 (S-04 entry)

| Lane | Content |
|---|---|
| Customer action (P-A) | Per skill: choose exactly one model, explicitly `[SC-02]`; define labels, questions, scale or levels `[SC-03..08]`; set qualification rule `[SC-05, SC-07]`; set criteria and per-level and per-setting minimums `[SC-10, SC-11]`; define student submission fields `[SC-13]`; comment mandatory or optional `[SC-14]`; toggle self-evaluation and administrator approval `[SC-15]`; choose allowed evaluator roles `[SC-16]`; preview the whole thing `[SC-19]`; copy/bulk-apply `[IM-14]` |
| Frontstage | S-09 sections for model, rule, criteria, fields, comment, workflow, roles, preview, plus a visible model → evidence → rule → criteria dependency `[SC-17]` (prototype shows a "lineage" panel `[PROTO]`; bulk copy not shown `[PROTO]`) |
| ─ line of interaction ─ | |
| Backstage (Prism) | Rebuild criteria when model changes `[SC-09]`; refuse unsatisfiable saves `[SC-06, SC-18]`; cascade removal of a question/level into rules `[AE-07]`; **re-apply the current rule to evidence already held** `[AE-02]`; labels presentation-only `[AE-06]` |
| Systems / data | EvaluationConfig, QualificationRule, AchievementCriteria; derived-state recompute job (AE-02) `[INFER mechanism]`; form generation for the evaluator ⟂ FAST question below; submission field set ⟂ OD-04; roles as data ⟂ OD-06 |
| Pain points | 40–200 skills each needing the same choices `[CALL 09-23]`; fear that editing a live rule changes students' status; contradiction between model and criteria |
| Moment of truth ⚑ | **Save**: "Can this ever be achieved, and what will it change for students who already have evidence?" |
| Emotion `[INFER]` | Concentrated, then fatigued by skill #30; anxious about live changes |
| Failure ✖ / recovery ↺ | ✖ Empty named subset, duplicate or unlabelled question/level, minimums exceeding total `[SC-18]` ↺ save blocked with reason · ✖ Model changed after criteria set ↺ criteria rebuilt, explained `[SC-09]` · ✖ Rule edit moves students backwards ↺ impact preview before save `[INFER]` (REQ AE-02 implies the effect, requires no preview) |
| Owner | Sankalp; FAST team for how forms are produced `[CALL 09-23]` |

### Stage 4: MAP  F-05  S-10

| Lane | Content |
|---|---|
| Customer action (P-A) | Find an offering by code/name, term, academic year, professional year, cohort `[CM-01, CM-02]`; map skills; mark mandatory or non-mandatory `[CM-03]`; read mapped and mandatory counts `[CM-04]` |
| Frontstage | S-10 offering list with counts; mapping panel; "also mapped in …" cross-reference `[PROTO]`; only configured, active skills offered `[IM-09, SL-11]` |
| ─ line of interaction ─ | |
| Backstage (Prism) | Store requirement per offering `[CM-06]`; one student record per skill regardless of mapping `[CM-07, AE-05]`; **mapping never gates submission** `[CM-05]`; carry-forward ⟂ OD-01 |
| Systems / data | OfferingSkillMap; course-offering, term, cohort data from other Prism modules (§3 below) |
| Pain points | Same course across many terms/years means high volume `[REQ §5 intro]`; offerings with no cohort show 0/0 `[PROTO]` |
| Moment of truth ⚑ | "Will students on this rotation know what is expected of them?" |
| Emotion `[INFER]` | Routine, repetitive |
| Failure ✖ / recovery ↺ | ✖ Mapping repeated across terms ⟂ OD-01 (no bulk or carry-forward specified) ↺ seam only · ✖ Admin believes mapping restricts students ↺ banner states it does not `[CM-05, PROTO copy]` |
| Owner | Sankalp; course-offering data owner not named |

### Stage 5: SEND  F-06  S-12 S-13 (S-15 for cross-course view)

| Lane | Content |
|---|---|
| Customer action (P-S) | See expected skills, which are mandatory, progress `[ST-01]`; select one or several `[ST-04]`; submit unmapped skills `[ST-02]`; isolate already-submitted `[ST-03]`; say clinical or lab/simulation `[ST-05]`; pick setting and location from placement `[ST-06]`; pick role then evaluator, or name a new lab instructor with email `[ST-08, ST-09]`; fill required details `[ST-10]`; self-evaluate where configured `[ST-11]`; one note `[ST-12]` |
| Frontstage | S-12 expected-skills list with sticky action bar `[PROTO]`; S-13 send dialog; confirmation of what, to whom, role, setting, location `[ST-13]`; setting/location once vs per skill ⟂ OD-07 |
| ─ line of interaction ─ | |
| Backstage (Prism) | Derive setting options from the student's placement for this course `[ST-06]`; fall back to the program's full list when no placement `[ST-07]`; constrain evaluator role by setting **and** skill-allowed roles, explain if none `[ST-08]`; create submission and a **tokenised request** for the evaluator; record attempt number `[SH-01]` |
| Systems / data | Placement data (other module); Submission, SubmissionItem; token generation (unspecified in REQ; "delegator links are always unique" `[CALL 09-23]`); email dispatch (S-18); roster of lab instructors |
| Pain points | Mixed units across skills (demonstrations vs evaluations); no placement on record; stale evaluator after switching clinical/lab (**prototype defect DEFECT-01**); student on shift, possibly on a phone `[INFER]`; partial save ⟂ OD-14 |
| Moment of truth ⚑ | Send dialog: "Did I record the right place, person and role with the fewest decisions?" |
| Emotion `[INFER]` | Hurried, mildly anxious about choosing the right evaluator |
| Failure ✖ / recovery ↺ | ✖ No valid setting × role combination ↺ explain why `[ST-08]` · ✖ No placement ↺ full list `[ST-07]` · ✖ Mandatory detail missing ↺ send blocked `[ST-10]` · ✖ Evaluator left clinic ↺ later resend to another `[RV-04]` |
| Owner | Sankalp; placement data owner not named |

### Stage 6: EVALUATE  F-07  S-18 → S-16

| Lane | Content |
|---|---|
| Customer action (P-P / P-F / P-L) | Open the emailed link `[EV-01]`; read student details and self-evaluation `[EV-04]`; answer each skill's configured form `[EV-03]`; write comment (mandatory where configured `[EV-06]`); complete several skills in one sitting `[EV-05]`; submit and be told whether it counts now or waits for approval `[EV-07]` |
| Frontstage | S-18 request email; S-16 one-page form, **no shell, no account, no login**; confirmation with counts-now vs held message |
| ─ line of interaction ─ | |
| Backstage (Prism) | Resolve token to exactly this request; render configured form, evaluator cannot alter method `[EV-03]`; validate mandatory feedback; write immutable evaluation `[RV-03]`; qualify against **current rule** `[AE-02]`; route to approval queue or count `[SC-15, AR-06]` |
| Systems / data | Token service; email provider; form generation ⟂ **FAST question** (can configuration generate the form at runtime? `[CALL 09-23]`); Evaluation, responses; achievement recompute |
| Pain points | Link never opened; wrong person; must not need password; phone use `[INFER]`; faculty may prefer in-Prism `[REQ §7 intro]` |
| Moment of truth ⚑ | First tap: "Does it open instantly with no sign-in, and is it obvious what to do?" |
| Emotion `[INFER]` | Rushed, low patience, volunteer goodwill |
| Failure ✖ / recovery ↺ | ✖ Link expired, invalid, reused, or already submitted ↺ **undefined in REQ** (see §4) · ✖ Mandatory comment blank ↺ submit blocked `[EV-06]` · ✖ Evaluator unavailable ↺ student resends `[RV-04]` · ✖ Evaluator sees student's achievement status after submit `[PROTO DEFECT-05]` ↺ OD-17 |
| Owner | Sankalp; **FAST team** (form/delegator mechanism) `[CALL 09-23]` |

### Stage 7: APPROVE  F-08  S-11

| Lane | Content |
|---|---|
| Customer action (P-R) | See every evaluation awaiting approval with student, skill, course, setting, location, evaluator, role `[AR-01]`; compare self-evaluation with evaluator, including agreement `[AR-02]`; open the full responses `[AR-03]`; add a note `[AR-04]`; approve or return `[AR-05]` |
| Frontstage | S-11 queue and detail; shown only for skills that require approval `[SC-15, PROTO]` |
| ─ line of interaction ─ | |
| Backstage (Prism) | Hold evidence as pending, excluded from achievement `[AE-01, AR-06]`; on approve → counts; on return → does not count and goes back for correction `[AR-05]`; retain note `[AR-04]` |
| Systems / data | Approval state on Evaluation; notification to student ⟂ out of scope (§14 forbids reminders; in-product state only) |
| Pain points | Deciding without opening several screens; **who does a return go back to** ⟂ OD-16 (REQ AR-05 "goes back for correction", prototype label says "Return to preceptor" `[PROTO DEFECT-03]`) |
| Moment of truth ⚑ | "Can I decide on one card, and does my return reason reach the right person?" |
| Emotion `[INFER]` | Careful, quality-minded |
| Failure ✖ / recovery ↺ | ✖ Self and evaluator disagree ↺ note + decision, both kept `[AR-02, AR-04]` · ✖ Queue grows unattended ↺ reminders are out of scope `[§14]`; surface count only `[INFER]` |
| Owner | Sankalp |

### Stage 8: REVISE / FURTHER ATTEMPT  F-09, F-10  S-14

| Lane | Content |
|---|---|
| Customer action (P-S) | **Revise and resend** a returned or not-yet-assessed submission `[RV-01]`; **further attempt** after a completed evaluation did not meet criteria `[RV-03]`; may choose a different evaluator in either path `[RV-04]` |
| Frontstage | S-14 history with per-attempt actions; locked state when counted or awaiting approval `[RV-05]` |
| ─ line of interaction ─ | |
| Backstage (Prism) | Revision continues the **same record**, auditable revision count and reason `[RV-02]`; further attempt creates a **new record**, original untouched `[RV-03]`; prior answers cleared or retained ⟂ OD-08 |
| Systems / data | Submission.revision, Submission.attempt; immutable Evaluation snapshots |
| Pain points | Not knowing which of the two paths applies; confusing correction with re-attempt |
| Moment of truth ⚑ | "Which action am I allowed, and what will it do to my record?" |
| Emotion `[INFER]` | Frustrated or discouraged after a did-not-meet outcome |
| Failure ✖ / recovery ↺ | ✖ Edit attempted on counted/awaiting approval ↺ actions absent, reason stated `[RV-05]` ✖ Student cannot tell why it failed ↺ plain-language failed rule `[SH-03]` (see `ux/09` generator) |
| Owner | Sankalp |

### Stage 9: TRACK  S-12 S-14 S-15

| Lane | Content |
|---|---|
| Customer action (P-S) | Review every submission for a skill in order by attempt `[SH-01]`; read outcome (counted, did not meet criteria, returned, waiting with whom) `[SH-02]`; see the failed rule `[SH-03]`; counts of counted/outstanding/returned `[SH-04]`; progress per named setting `[SH-05]`; all courses, narrowable `[SH-06]`; open completed evaluation in full `[SH-07]` |
| Frontstage | S-12 course list, S-14 history, S-15 my skills across courses |
| ─ line of interaction ─ | |
| Backstage (Prism) | Derive four states `[AE-04]` ⟂ OD-03 (prototype shows three `[PROTO DEFECT-04]`); one record per skill across courses `[AE-05]`; per-setting counting, lab never satisfying clinical `[SC-12]` |
| Systems / data | Derived StudentSkillRecord |
| Pain points | "4 of 4 demonstrations but not achieved" with no reason `[PROTO DEFECT-07]`; lab evidence not counting toward a setting minimum |
| Moment of truth ⚑ | "What counted, what did not, and what do I do next?" |
| Emotion `[INFER]` | Anxious → informed |
| Failure ✖ / recovery ↺ | ✖ Opaque did-not-count ↺ SH-03 text · ✖ Setting progress hidden ↺ show per-setting `[SH-05]` |
| Owner | Sankalp |

### Stage 10: REPORT  F-11, F-12  S-01 S-02 S-03 S-17

| Lane | Content |
|---|---|
| Customer action (P-A) | Filter by cohort, group, clinical course, category, tag, location, setting `[RP-01]`; read attainment by student, skill, tag `[RP-02..04]`; drill to individuals and evidence `[RP-05, RP-06]`; open any evaluation in full `[RP-07]`; export aggregate and row-per-evaluation `[RP-10]` |
| Frontstage | S-01 overview; S-02 student drill; S-03 evidence + evaluation detail; S-17 export menu |
| ─ line of interaction ─ | |
| Backstage (Prism) | Recompute progress counting only evidence gathered at the chosen location/setting `[RP-08]`; explain impossible filter combinations `[RP-09]`; state tag overlap `[RP-04]`; export full filtered scope with the filters recorded `[RP-10]`; format ⟂ OD-10; evaluator/site dimensions ⟂ OD-11; no-evidence vs not-qualifying ⟂ OD-03 |
| Systems / data | Aggregation over derived records; export service; student, cohort, group, course data from other modules |
| Pain points | Re-searching after reaching a number `[REQ §11 intro]`; empty results with no reason; overlapping tag totals mistaken for a partition |
| Moment of truth ⚑ | "From this percentage, can I reach the evaluation behind it without starting again?" |
| Emotion `[INFER]` | Analytical; accreditation pressure |
| Failure ✖ / recovery ↺ | ✖ Filter yields nothing ↺ explain `[RP-09]` · ✖ Export partial ↺ must cover full filtered scope `[RP-10]` |
| Owner | Sankalp |

### Cross-cutting: DEACTIVATE  F-14  S-04

| Lane | Content |
|---|---|
| Customer action (P-A) | Mark a skill inactive |
| Backstage (Prism) | Withdraw from course mapping, student selection and reporting scope; **retain evidence** `[SL-11]` |
| Failure ✖ / recovery ↺ | ✖ Student mid-submission on a skill that is deactivated ↺ **unspecified** → add to research plan `[INFER]` |

## 3. Dependencies on other Prism modules

| Dependency | Needed for | Source | Status |
|---|---|---|---|
| **Cohort** | Offering identity, reporting filter `[CM-01, RP-01]` | `[REQ CM-01, RP-01]` | Used as given; ownership `[INFER]` |
| **Group** | Reporting filter; disabled until a cohort chosen in prototype | `[REQ RP-01]`, `[PROTO]` | Entity assumed to exist `[INFER]` (G-10) |
| **Term / academic year / professional year** | Offering identity and filters `[CM-01, CM-02]` | `[REQ CM-01]` | Assumed `[INFER]` (G-10) |
| **Course offering** (clinical course) | Mapping, student view | `[REQ CM-01..08]` | OD-01: catalogue-level course vs per-offering ⟂ |
| **Placement** (settings and locations per student per course) | Derive setting/location `[ST-06]`; no-placement fallback `[ST-07]` | `[REQ ST-06, ST-07]` | Data source and API unconfirmed `[INFER]` |
| **Student** | Own login, one record per skill `[CM-07]` | `[REQ §6]` | Prism student account |
| **Evaluations module** | Current workaround for skills; migration of existing clients | `[REQ §1.7, §14]` | Migration out of scope, **LAM team inputs outstanding** `[REQ §14]` |
| **Competency Management** | Skills complement, do not inherit scoring `[§1.4]`; link to AACN sub-competencies ⟂ OD-02 | `[REQ §1.4, OD-02]` | Shared backend, domain-specific UIs `[CALL 03-05]`; boundary undecided |
| **Learning Contracts** | Future picking of skills into a contract | `[CALL 09-23]` (Ankit, Q4) | Not in REQ; not v1 |
| **FAST (forms / delegator links)** | Evaluator form generation | `[CALL 09-23]` | Technical feasibility open |
| **Patient encounter / clinical hours** | Linking evidence | `[REQ §14]` | Out of scope |

## 4. Blueprint question: delegator-link lifecycle (OD-18 is a proposed decision, not in REQ)

REQ requires only that a request "reaches the evaluator by email and opens directly, creating no account" `[REQ EV-01]`. Reminders, notifications and escalation are out of scope `[REQ §14]`. The call says delegator links "are always unique" and open a form `[CALL 09-23]`. **Everything below is undefined and each cell is a question, not a design.** `[INFER]`

```
 student sends ──▶ token minted ──▶ email sent ──▶ link opened? ──▶ form submitted
                                          │             │               │
                                          │             └─ never opened ────▶ ?  (no reminder allowed by §14; what does P-S see in S-14? "Waiting, with {name}" [SH-02])
                                          └─ bounce / wrong address ──────────▶ ?  (student resend to another evaluator [RV-04]; who learns of bounce?)
```

| Question | Why it matters | Current coverage |
|---|---|---|
| Does a token expire? After how long? | Stale evidence; security | none |
| Single-use, or reopen until submitted? | Evaluator may close the tab mid-form | none |
| May the same link be forwarded to someone else? | Wrong evaluator signs off | none |
| Can a student revoke a request? | RV-01 says student corrects "not yet assessed" submissions; unclear if revoke is part | partial `[RV-01]` |
| Does resend to a different evaluator invalidate the old token? | Two evaluators answering | `[RV-04]` allows different evaluator; token consequence unspecified |
| Multi-skill request: one link or one per skill? | EV-05 says one sitting | `[EV-05]` implies one link per request |
| After submit, what does reopening the link show? | Immutable record `[RV-03]` | none |
| What does the evaluator see after submit? | Prototype exposes student's achievement `[DEFECT-05]` | OD-17 |
| Can faculty and lab instructors open in Prism *and* by link, and are the two the same request? | `[REQ §7 intro]` | none |

Recommendation for research: ask the FAST team what delegator links already do today (existing Evaluations behaviour is the most likely baseline) before designing anything new `[INFER]`.

## 5. Moments-of-truth summary (cross-persona)

| # | Moment | Persona | Surface | Success cue |
|---|---|---|---|---|
| 1 | Import review | P-A | S-08 | Unread lines are visible and nothing is created before confirmation |
| 2 | Save of a configuration | P-A | S-09 | Unachievable configs cannot be saved; impact on held evidence is clear |
| 3 | Send dialog | P-S | S-13 | Setting and role derive from placement and skill config |
| 4 | First tap from email | P-P / P-F / P-L | S-18 → S-16 | Opens with no sign-in; one page |
| 5 | Approval card | P-R | S-11 | Decide without leaving the queue |
| 6 | Did not count card | P-S | S-14 | States the failed rule and the next action |
| 7 | Percentage to evidence | P-A | S-01 → S-03 | No restart of the enquiry |

## 6. Failure and recovery register

| Failure | Where | Recovery path | Source |
|---|---|---|---|
| Unsatisfiable configuration | S-09 | Block save with reason | `[SC-06, SC-18]` |
| Unread import content | S-08 | Show with original text | `[IM-08]` |
| Skill unconfigured but wanted | S-10, S-13 | Not offered; counter on S-04 | `[IM-09, IM-10]` |
| No valid role for setting | S-13 | Explain why | `[ST-08]` |
| No placement recorded | S-13 | Full settings list | `[ST-07]` |
| Evaluator unavailable | S-14 | Resend to different evaluator | `[RV-04]` |
| Returned evaluation | S-14 | Correct and resend, same record | `[RV-01, RV-02]` |
| Did not meet criteria | S-14 | Further attempt, original intact | `[RV-03]` |
| Counted or awaiting approval | S-14 | Locked | `[RV-05]` |
| Impossible filter | S-01 | Explain, not empty | `[RP-09]` |
| Link lifecycle (expiry, reuse, revoke) | S-16 | **Undefined** | §4 |
| Skill deactivated mid-flow | S-13 | **Undefined** | `[INFER]` |

## 7. Gaps and contradictions this blueprint exposed

1. REQ has no requirement for the evaluator-side state when the link is invalid or already used (§4).
2. `[SH-02]` requires "waiting, identifying who it is with" while `[§14]` excludes reminders: students can see who has it but Prism cannot nudge. Design resend, not reminders.
3. `[REQ §7 intro]` says faculty may already work inside Prism, but no requirement defines the in-Prism evaluation surface; S-16 is specified only as a no-login form.
4. Platform team owning cohort, group, placement, offering data is not named in any source (§3).
5. Owner of the document interpretation component (IM-02, IM-04) is not named in any source.
