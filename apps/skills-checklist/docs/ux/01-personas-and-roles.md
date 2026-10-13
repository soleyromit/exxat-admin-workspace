# UX 01 — Proto-personas and Roles

**These are proto-personas.** They are built from the requirements, two calls and the prototype, not from interviews. No names, ages or demographics are invented; each is a role label. Every statement carries a source tag (`[REQ id]` `[CALL 09-23]` `[CALL 03-05]` `[PROTO]` `[INFER]`); precedence REQ > CALL > PROTO > INFER. Anything tagged `[INFER]` is a hypothesis to validate (see each persona's last line). Open decisions are never treated as decided.

Role map (who authenticates, who does not):

| ID | Persona | Prism login | Surfaces | Source |
|---|---|---|---|---|
| P-A | Program administrator / coordinator | Yes | S-01–S-11, S-17 | `[REQ §2–5, 8, 11]` |
| P-S | Student | Yes | S-12–S-15, S-13 | `[REQ §6, 10]` |
| P-P | Preceptor | **No** (email link) | S-16, S-18 | `[REQ EV-01]` |
| P-F | Clinical faculty | May use Prism **or** link | S-16, S-18 | `[REQ §7 intro, EV-02]` |
| P-L | Lab instructor | **Not a Prism user**; name + email only | S-16, S-18 | `[REQ SL-08, EV-02]` |
| P-R | Admin reviewer (P-A wearing the approval hat) | Yes | S-11 | `[REQ §8]` |

Note: the requirements name only "administrator". The workspace persona closest to P-A is the DCE / Placement Coordinator `[INFER]`. Whether approval is a separate admin sub-role is unspecified (gap G-8 in `strategy/07`).

---

## P-A — Program administrator / coordinator

| Facet | Detail |
|---|---|
| Context & environment | Sets up and runs the program's skills record: library, configuration, course mapping, approvals, reporting `[REQ §2–5, 8, 11]`. Holds an existing skills list in Word, Excel or PDF, 40 to 200 items `[REQ §3]` `[CALL 09-23]`. |
| Device / modality | Desktop, dense grids, bulk operations, filters above the fold `[INFER from workspace DCE persona]`. |
| Frequency | Heavy at set-up (days of configuration avoided by import `[REQ §3]`), then recurring: approvals per submission, reporting per term `[INFER]`. |
| Expertise | Domain expert in the program's own skills and evaluation approach; not a form designer `[CALL 09-23: schools must not build 20 form types]`. |
| Goals | Establish practice readiness `[REQ §1.2]`; see attainment across cohorts, groups, courses `[REQ RP-01..06]`; keep evidence behind every outcome `[REQ §1.2 Evidence of outcomes]`. |
| Pains | Re-keying a list one skill at a time `[REQ §3]`; evidence scattered across forms and spreadsheets `[REQ §1.2]`; Evaluations module "does not report as a skills record" `[REQ §1.7]`; repetitive configuration of a large library `[REQ IM-14]`; lab skills forced into placements via lab technician as placement faculty `[CALL 09-23]`. |
| Motivations | Accreditation and licensure evidence `[REQ §1.3]`; early sight of lagging students (bottom 20% by completion) `[CALL 09-23]`. |
| Must never see | Nothing beyond program scope. Student data is program-scoped; no cross-tenant data `[INFER, workspace RBAC]`. |

**Day-in-the-life moment** `[INFER]`: Opens the Skills library after a term closes. A banner says 8 skills are unconfigured `[REQ IM-10]`. She works through them, picks "Question-Level Qualitative" for one, sees the qualification rule options and a preview of what student and evaluator will see `[REQ SC-05, SC-19]`, saves. Then filters attainment by cohort and clicks a low "% achieved" into one student's evidence `[REQ RP-05, RP-06]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "I already have this list." `[INFER, REQ §3]` | "Will it read my list correctly?" `[INFER]` | Uploads or pastes, edits the proposal, confirms `[REQ IM-05]` | Relief, then wary `[INFER]` |
| "Which students are behind on this skill?" `[CALL 09-23]` | "Can I show an accreditor the evaluation behind this number?" `[INFER, REQ RP-07]` | Filters, drills to evidence, exports `[REQ RP-10]` | Concentrated; fatigue around skill 30 `[INFER]` |

**Emotion curve** (hypothesis `[INFER]`)

```
 high │            ●Import review shows 8 found        ●Report → evidence
      │          ╱                         ╲          ╱
      │   ●Has a list              ●Configure skill #1 ╲___●Approval queue
  mid │ ╱                      ╲╱                ╲___╱
      │                         ●Configure skill #30 (fatigue)
  low │
      └──────────────────────────────────────────────────────────────
        Seed      Review    Configure   Map      Review/approve   Report
```

**Design implications**
- Import review is the trust moment; show what could not be read with original text `[REQ IM-08]`.
- Make the model → criteria dependency visible while configuring `[REQ SC-17]`; show impact on held evidence before saving a rule change `[INFER, REQ AE-02]`.
- Visible count of unconfigured skills; copy and bulk apply configuration `[REQ IM-10, IM-14]`.
- Dense tables with filter chips, each removable `[REQ RP-01]`.

**How we'd validate**: 45-minute sessions with 4 to 6 coordinators across at least two disciplines, using their real skills list in the import step; Sarah (nursing SME) and Aarti review the first pass `[CALL 09-23]`.

---

## P-S — Student

| Facet | Detail |
|---|---|
| Context & environment | Works from their own login, in clinical shifts and labs; needs to know what the course expects, record what they performed, and route it to an assessor `[REQ §6 intro]`. |
| Device / modality | Likely mobile or tablet between tasks; single-tap actions; auto-save `[INFER from workspace persona P2]`. The requirements do not state mobile; the prototype is desktop only `[PROTO]`. |
| Frequency | Several submissions per rotation; batches after a shift or a week `[REQ ST-04, OD-07 context]` `[INFER]`. |
| Expertise | Learner; knows what they did, not how the program configured the skill `[INFER]`. |
| Goals | Know expectations per course, mandatory or not `[REQ ST-01]`; submit several skills at once `[REQ ST-04]`; see which submissions counted and what to do about those that did not `[REQ §10 intro, SH-02, SH-03]`. |
| Pains | No overall view of progress toward graduation requirements `[CALL 03-05]`; skills trapped in one placement `[CALL 03-05]`; no remediation workflow, so the explanation of a failed rule is the only help `[REQ §14, SH-03]` `[INFER]`. |
| Motivations | Graduate and sit licensure `[INFER]`; own the record across placements and labs `[CALL 03-05]`. |
| Must never see | Other students' records `[INFER, FERPA scoping; REQ silent]`; evaluator contact details beyond name `[INFER, workspace RBAC]`. |

**Day-in-the-life moment** `[INFER]`: End of shift. Opens the course skills list, ticks two skills, picks Clinical, the setting is offered from their placements `[REQ ST-06]`, chooses a preceptor, fills date and unit, sends `[REQ ST-04, ST-10]`. Later sees "Awaiting preceptor evaluation" with the person's name `[REQ SH-02]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "What do I still need on this rotation?" `[REQ ST-01]` | "Why did this not count?" `[REQ SH-03]` | Sends, tracks, revises or makes a further attempt `[REQ RV-01, RV-03]` | Pressured, then relieved on confirmation `[INFER]` |

**Emotion curve** `[INFER]`

```
 high │                         ●Confirmation          ●"Counted"
      │               ●Clear expectations     ╲        ╱
  mid │ ●Open course  ╱           ╲___●Waiting____╲____╱
      │                                            ╲●"Did not count" + rule shown (SH-03)
  low │                                  ●"Returned" ╱ (recovers if next step is clear)
      └──────────────────────────────────────────────────────────
        Expect   Select   Send   Wait   Result   Revise / further attempt
```

**Design implications**
- First screen answers "what do I need here" `[REQ ST-01]`; mapped then other skills `[REQ ST-02, CM-05]`.
- Derive setting and role from placement and skill config rather than free choice; explain dead ends `[REQ ST-06, ST-08]`.
- Four explicit outcomes with who it is waiting on, and the failed rule stated in actionable terms `[REQ SH-02, SH-03]`.
- Progress against each named clinical setting, since lab never satisfies it `[REQ SH-05, SC-12]`.
- Saving partial submissions is an unresolved need, tracked as OD-14 (proposed, `[INFER]`); build the seam, do not decide.

**How we'd validate**: task tests on a phone-sized viewport with 5 to 8 nursing students sending a mixed batch (clinical + lab); measure send time and ask them to explain why a seeded 4/4 skill is not achieved.

---

## P-P — Preceptor (no login)

| Facet | Detail |
|---|---|
| Context & environment | Works at the placement site; assesses a student's performance of a skill; has no Prism account `[REQ EV-01, §7 intro]`. |
| Device / modality | Opens an emailed link, completes a one-page form; may be on a phone `[REQ EV-01]` `[INFER on device]`. |
| Frequency | Occasional, per student request; may receive several requests `[INFER]`. |
| Expertise | Clinical expert; knows nothing of Prism configuration and must not need to `[REQ EV-03]`. |
| Goals | Record an outcome against the program's criteria, quickly `[REQ §7 intro]`; complete several skills in one sitting `[REQ EV-05]`. |
| Pains | Anything behind a login or multi-layer navigation `[INFER, workspace persona P3]`; being unsure whether the evaluation counts `[REQ EV-07]`. |
| Motivations | Supporting the student; low admin burden `[INFER]`. |
| Must never see | Anything except the one request: no other students, no cohort analytics, no evaluation configuration controls, no student achievement status (prototype shows it, see OD-17 proposed) `[REQ EV-03]` `[PROTO]` `[INFER]`. |

**Day-in-the-life moment** `[INFER]`: Receives an email, taps the link, sees the student's supplied details and, where configured, their self-evaluation `[REQ EV-04]`. Selects an outcome for each of two skills, writes a mandatory comment on one `[REQ EV-05, EV-06]`, submits, and is told whether it counts now or goes to review `[REQ EV-07]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "Just tell me what to answer." `[INFER]` | "Do I need an account?" `[REQ EV-01]` | Opens link, answers, submits | Hurried; reassured by immediate result `[INFER]` |

**Emotion curve** `[INFER]`

```
 high │                                                   ●"Counts now / held for review"
      │                          ●Form renders at once  ╱
  mid │ ●Email arrives ──────────╱        ╲___●Answering___╱
      │                                      
  low │                ●"Sign in?" would be here (must not exist)
      └───────────────────────────────────────────────────
        Email   Open   Read context   Answer   Submit   Result
```

**Design implications**
- No shell, no sidebar, no account `[REQ EV-01]`; one page, large targets `[INFER]`.
- Show only what the program configured; no ability to change method `[REQ EV-03]`.
- Disable submit until mandatory feedback present `[REQ EV-06]`; tell them the outcome of submission `[REQ EV-07]`.
- Link lifecycle (expiry, reuse, revoke) is unspecified: OD-18 proposed `[INFER]`.

**How we'd validate**: usability test from an email on a phone with 5 preceptors; time-to-submit; ask what they think happens next.

---

## P-F — Clinical faculty

| Facet | Detail |
|---|---|
| Context & environment | Program faculty acting as an evaluator; "may already work inside Prism" `[REQ §7 intro]`. |
| Device / modality | Desktop in Prism or the same emailed link `[REQ §7 intro]` `[PROTO: "Faculty and lab instructors can open the same form in Prism"]`. |
| Frequency | Per student request, plus lab/sim sessions `[INFER]`. |
| Expertise | Knows the program's criteria; may help define them `[INFER]`. |
| Goals | Assess against criteria the program set; never decide how a skill is evaluated `[REQ §7 intro, EV-03]`. |
| Pains | Roles valid only for some settings and skills `[REQ EV-02, SC-16]`; evaluations needing return and correction `[REQ RV-01]` `[INFER]`. |
| Motivations | Teaching quality, cohort readiness `[INFER]`. |
| Must never see | Other evaluators' forms, student records outside the request, configuration controls `[REQ EV-03]` `[INFER]`. |

**Day-in-the-life moment** `[INFER]`: Opens a lab-simulation request from Prism, reads the student's note, answers the Yes/No questions and comment, submits; told it is held for approval `[REQ EV-04, EV-07]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "Which criteria apply here?" `[INFER]` | "Is my role even allowed for this skill?" `[REQ SC-16]` | Completes the form | Neutral, efficient `[INFER]` |

**Emotion curve** `[INFER]`

```
 high │                                    ●Submitted, told what happens
  mid │ ●Request ──●Read context ──●Answer ╱
  low │
      └──────────────────────────────────
        Receive   Read   Answer   Submit
```

**Design implications**
- Same form as the preceptor, with the option to open it inside Prism `[REQ §7 intro]`.
- Whether evaluator roles are fixed or program-defined is OD-06; model roles as data, three seeded rows `[INFER seam]`.

**How we'd validate**: ask 3 to 4 faculty to complete a lab request from each entry (link, in-app); confirm they expect no sign-in from the link.

---

## P-L — Lab instructor (not a Prism user)

| Facet | Detail |
|---|---|
| Context & environment | Signs off skills performed in lab or simulation; recorded by name and email only, no account `[REQ SL-08]`. Today schools add a lab technician as placement faculty to get an evaluation form `[CALL 09-23]`. |
| Device / modality | Emailed link `[REQ EV-01]`. |
| Frequency | Often high volume in lab blocks `[INFER]`; the prototype roster shows hundreds of evaluations per instructor, but that is placeholder data `[PROTO]`. |
| Expertise | Skill demonstrator; no Prism knowledge `[INFER]`. |
| Goals | Assess lab evidence without being enrolled in the system `[REQ SL-08, EV-01]`. |
| Pains | Being misspelled in several variants across records `[REQ SL-09]`. |
| Motivations | Smooth lab sign-off `[INFER]`. |
| Must never see | Anything beyond the request; the roster of other instructors `[INFER]`. |

**Day-in-the-life moment** `[INFER]`: Receives a request from a student who typed their name and email because they were not on the roster `[REQ ST-09]`; completes it; later the program adopts them into the roster `[REQ SL-09]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "I only need to sign this off." `[INFER]` | "Why does the system know me by a typo?" `[REQ SL-09]` | Opens link, answers | Indifferent to the system `[INFER]` |

**Emotion curve** `[INFER]`

```
 mid │ ●Request ──●Open ──●Answer ──●Submit
      └────────────────────────────
```

**Design implications**
- Student-named instructors are visible to admin and adoptable to avoid duplicate spellings `[REQ SL-09]`; flow F-13.
- Whether external evaluators are stored per-module or Prism-wide is OD-05; keep a standalone person-lite record `[INFER seam]`.

**How we'd validate**: interview 2 to 3 lab instructors on how they sign off today and what email address they use for it.

---

## P-R — Admin reviewer (approval hat)

| Facet | Detail |
|---|---|
| Context & environment | Reviews evaluations for skills where the program turned on approval; evidence waits until approved `[REQ §8, SC-15, AR-06]`. |
| Device / modality | Desktop queue `[INFER]`. |
| Frequency | Per submission awaiting approval; batches `[INFER]`. |
| Expertise | Understands the program's criteria and evaluator behaviour `[INFER]`. |
| Goals | Decide without opening several tabs: see student, skill, course, setting, location, evaluator and role `[REQ AR-01]`; compare self-evaluation with the evaluator `[REQ AR-02]`; examine full responses `[REQ AR-03]`. |
| Pains | Disagreeing assessments needing a conversation `[PROTO]`; unclear who a return goes to (AR-05 vs prototype label, OD-16 proposed) `[INFER]`. |
| Motivations | Quality assurance of evidence `[REQ §8 intro]`. |
| Must never see | Nothing beyond the program's students `[INFER]`. |

**Day-in-the-life moment** `[PROTO]`: Opens a card where the student rated themselves "With Assistance" and the preceptor "Independent"; the card notes the disagreement; she expands full responses, writes a review note, approves or returns `[REQ AR-02..05]`.

**Empathy map**

| Says | Thinks | Does | Feels |
|---|---|---|---|
| "Do these agree?" `[REQ AR-02]` | "If I return it, who fixes it?" `[REQ AR-05]` `[INFER]` | Reads, notes, decides | Careful `[INFER]` |

**Emotion curve** `[INFER]`

```
 high │                                  ●Decision made, queue shorter
  mid │ ●Open queue ──●Read ──●Compare ─╱
  low │                         ●Disagreement / unclear return target
      └───────────────────────────────
        Open   Read   Compare   Note   Decide
```

**Design implications**
- All inputs to the decision on one card with the full responses one step away `[REQ AR-01..03]`.
- Return and approve are distinct, with the return target stated (resolve OD-16 before building) `[REQ AR-05]`.
- Pending evidence is excluded from achievement `[REQ AR-06, AE-01]`.

**How we'd validate**: card-sort and think-aloud with 3 to 4 reviewers on 10 seeded evaluations including disagreements; ask "what happens to this after you click Return?"
