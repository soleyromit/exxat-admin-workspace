# 12 — Research Plan and Validation

> **OD numbering:** OD-01..OD-13 come from the requirements document §13. OD-14..OD-24 and OD-P1 are PROPOSALS by this documentation pack (see `docs/source/proposed-ids.txt`), not requirements-document decisions.

**Hat:** UX researcher + PM. Purpose: replace each `[INFER]` in the doc pack with evidence, in the order that unblocks the most build work.
Inputs: `docs/strategy/05-open-decisions.md`, `07-gaps-contradictions-defects.md`, `01-problem-and-why.md §7`, `ux/06-service-blueprint.md`, `ux/09-content-and-microcopy.md`.
Tags per `docs/README.md`. Surfaces S-01..S-18, flows F-01..F-14, personas P-A, P-S, P-P, P-F, P-L, P-R. **No `OD-*` is treated as decided anywhere in this plan.**

## 1. What we still do not know

### 1.1 Open decisions from the requirements `[REQ §13]`

| OD | Unknown | Blocks | Evidence that would settle it |
|---|---|---|---|
| 01 | Mapping carry-forward vs catalogue-level default | W2 mapping volume work | Count of offerings per course in a real program; how coordinators set up a new term today |
| 02 | Skill ↔ AACN sub-competency link; boundary skill vs competency | Reporting story | Nursing SME (Sarah) workshop; Competency Management owner input |
| 03 | Report no evidence and not-qualifying separately? | Every attainment table, student status wording | Coordinator card-sort: which interventions follow each state |
| 04 | Submission details per skill vs program default + additions | Config effort over 200 skills | Time-to-configure test; real field lists from a program |
| 05 | External evaluator record scope (Skills only vs Prism-wide) | Data model | Learning Contracts / Evaluations owners (Ankit, Q4 `[CALL 09-23]`) |
| 06 | Three evaluator roles enough | Roles as data vs enum | Non-nursing program interviews |
| 07 | Setting/location per submission or per skill | S-13 data model | Retrospective week-log scenarios with students |
| 08 | Correction clears evaluator answers or retains | S-16, S-14 | Preceptor usability test of both variants |
| 09 | Self-evaluation form may differ from evaluator's | AR-02 comparison | Nursing SME review |
| 10 | CSV sufficient or Excel workbook | Export | Coordinator interview: what they do with exports |
| 11 | Expose evaluator and site dimension | Reporting scope | Stakeholder risk discussion (consistency vs harshness reading) `[CALL 09-23]` |
| 12 | Import proposes model and criteria? | Import scope | Sample real lists; measure how often questions/criteria are written down |
| 13 | Re-import of skill that holds evidence | Duplicate resolver | Coordinator scenarios |

### 1.2 Proposed decisions from the doc pack `[INFER]`

OD-14 partial save for send flow · OD-15 activation as a distinct state · OD-16 who an administrator-returned evaluation goes to · OD-17 whether evaluators see student status · OD-18 delegator-link lifecycle · OD-19 batch evaluation view · OD-20 hierarchical skills · OD-21 setting/rotation/regional thresholds · OD-22 frequency scoped by rotation or academic year · OD-23 learning-contract integration. (Definitions in `strategy/05`. OD-19..23 originate from calls, not REQ.)

### 1.3 Gaps in the source material `[strategy/07 §C]`

G-1 missing §15 · G-2 no success metrics or named personas · G-3 batch evaluation · G-4 hierarchy · G-5 link lifecycle · G-6 drafts · G-7 reminders out of scope but waiting state required · G-8 admin sub-roles · G-9 config audit trail · G-10 cohort/group/term entities assumed · G-11 a11y/perf/localisation unstated · G-12 competency boundary.
Additional unknowns surfaced by `ux/06`: behaviour when a skill is deactivated while a student is mid-submission; who owns cohort/group/placement/offering data; who owns the interpretation component (IM-02, IM-04).

## 2. Prioritised research questions

Priority = how many build waves the answer unblocks (P0 blocks W1/W2, P1 blocks W3/W4, P2 blocks W5 or later).

### 2.1 Sankalp (initiative owner, requirements author)

| P | Question |
|---|---|
| P0 | Is the prototype's collapse of "no evidence" and "not qualifying" into "Not met" intentional, or should the four states of AE-04 be reported? (OD-03) |
| P0 | Is activation a state distinct from configured + active? (OD-15) |
| P0 | Who does an administrator-returned evaluation go back to, student or evaluator? (OD-16, DEFECT-03) |
| P1 | Is the missing §15 "Sources and external context" available? (G-1) |
| P1 | Does the evaluator see the student's achievement after submitting, as the prototype shows? (OD-17, DEFECT-05) |
| P1 | What is the intended in-Prism surface for faculty evaluators vs the emailed link? (REQ §7 intro) |
| P2 | Which accrediting references should appear in program-facing reporting? |

### 2.2 Aarti (product review, "take her feedback" `[CALL 09-23]`)

| P | Question |
|---|---|
| P0 | Walk the four states, skills-vs-competency boundary and the unconfigured gate. Does the model-constrains-criteria principle hold? |
| P1 | Is learning-contract linkage a phase after v1? `[CALL 09-23]` |
| P1 | Priority of heat-map and preceptor-consistency reporting (OD-11) |
| P2 | Does she accept text-forward status without red in attainment views? (memory: dislikes red) |

### 2.3 Vishaka

| P | Question |
|---|---|
| P1 | Skills and competencies "all connected" in every discipline `[CALL 09-23]`: what is the first connection to build, and what stays separate in v1? (OD-02) |
| P1 | Which non-nursing disciplines should shape the first design (PA, OT, allied)? |

### 2.4 Sarah (nursing SME)

| P | Question |
|---|---|
| P0 | Review sample attainment views and heat-map reports from the earlier tool `[CALL 09-23]`. Which cuts do coordinators actually use? |
| P0 | Setting/location capture: once per submission or per skill when a student logs a week retrospectively? (OD-07) |
| P1 | Is a skill ever measured per rotation or per academic year instead of whole-program? (OD-22) |
| P1 | Real skill lists: are skills hierarchical (parent with sub-activities)? How many per program? (OD-20) |
| P1 | Is a batch sign-off grid (students as rows, skills as columns) used in lab? (OD-19) |
| P2 | Licensure-preparation checklists and regional or setting-based thresholds (OD-21) |

### 2.5 Ankit (learning contracts, Q4 `[CALL 09-23]`)

| P | Question |
|---|---|
| P1 | What does the learning-contract build assume about skills and external evaluators? (OD-05, OD-23) |
| P2 | Can a person-lite external evaluator record be shared? |

### 2.6 FAST team

| P | Question |
|---|---|
| P0 | Can a configured skill generate the evaluator form at runtime, or must templates exist in FAST? `[CALL 09-23]` |
| P0 | What do delegator links do today: expiry, single-use, reopen, forwarding, resend, bounce handling? (OD-18) |
| P1 | Can the form be mobile-first and shell-free? |
| P1 | Does the form tool support per-field save and a "counts now vs held" result message? (EV-07) |

### 2.7 LAM team

| P | Question |
|---|---|
| P2 | Their outstanding inputs on migrating clients that use Evaluations for skills `[REQ §14]`. Out of scope for v1 but shapes data model decisions |

### 2.8 Real users (not yet named in any source)

| Persona | P | Question |
|---|---|---|
| P-A coordinator | P0 | How do you hold your skills list today, and how large is it? How long does configuring one skill take you? |
| P-A | P0 | When a student has no evidence versus has evidence that does not qualify, what do you do differently? (OD-03) |
| P-A | P1 | What do you do with an export once you have it? (OD-10) |
| P-A | P1 | How do you set up a new term's course offerings and their skills today? (OD-01) |
| P-S | P0 | When you finish a clinical shift, where and when do you submit skills, and on what device? (OD-14, mobile) |
| P-S | P1 | How do you decide which person to send an evaluation to, and what role is that person? |
| P-S | P1 | If an evaluation does not count, what do you need to see to know what to do? (SH-03) |
| P-P preceptor | P0 | What do you do when an evaluation link arrives by email? What would make you ignore it? |
| P-P | P1 | Would you expect to see the student's earlier answers when you re-evaluate? (OD-08) |
| P-F faculty | P1 | Would you evaluate in Prism or from the link? |
| P-L lab instructor | P1 | How are lab sign-offs recorded today, and by whom? The current workaround adds a lab technician as placement faculty `[CALL 09-23]` |
| P-R reviewer | P1 | How many evaluations do you expect to review a week, and what makes you return one? |

## 3. Stakeholder question list (plain text, forwardable, recommendation first)

Each question states a recommendation `[INFER]` so the recipient can reply "agree". Nothing here is decided until they reply.

**To Sankalp**
1. Recommendation: report the four states from AE-04 separately, because unstarted students need a nudge and unqualified students need coaching. The prototype shows "Not met" for both. Is that intentional? (OD-03)
2. Recommendation: an administrator return goes back to the student, who corrects and resends (REQ AR-05 and RV-01), and the button should say "Return for correction". The prototype says "Return to preceptor". Which is intended? (OD-16)
3. Recommendation: treat a skill as usable when it is configured and active, with no separate activation step. The call mentioned activation. Is a separate state wanted? (OD-15)
4. Recommendation: do not show the student's achievement status to the evaluator after they submit. The prototype does. Is that intended? (OD-17)
5. The contents list section 15, "Sources and external context", but the document body ends at section 14. Can you share it?

**To Aarti**
1. Recommendation: per-program default submission fields with per-skill additions, so a common field is not configured on 200 skills. Agree? (OD-04)
2. Recommendation: mapping default at the catalogue course with per-offering override, subject to whether Prism has a catalogue course entity. Agree? (OD-01)
3. Recommendation: skills link to competencies later through an unused seam, and stay separate in v1. Agree? (OD-02)

**To Sarah (nursing SME)**
1. Recommendation: one setting and location per submission, with an override per skill if students log a week retrospectively. Does a retrospective log happen? (OD-07)
2. Which attainment views and heat-map cuts from the earlier tool were used weekly, and which never opened?
3. Are skills in your programs flat lists, or parent skills with sub-activities (for example one exam with ten parts)? (OD-20)
4. Is any skill measured by rotation or academic year instead of across the whole program? (OD-22)

**To the FAST team**
1. Can a skill configuration generate the evaluator form at runtime, or must someone build a template per skill?
2. What do delegator links do today for expiry, single use, reopening, forwarding, resend and bounce? Recommendation: reuse whatever Evaluations does today rather than invent a new lifecycle. (OD-18)
3. Can the form run without any app shell and be usable on a phone?

**To Vishaka / Ankit**
1. Recommendation: build skills first as a standalone library that Learning Contracts can pick from later (the call's direction), keeping external evaluators as a shared record. Confirm. (OD-05, OD-23)

**To the LAM team**
1. When can you share the inputs on clients using Evaluations for skills? We are not designing migration in v1, but the answers affect how we shape evidence data.

## 4. Test plans

### 4.1 Concept test of Sankalp's prototype (now, before any build)

**Goal:** learn whether the model → criteria → status story works for real coordinators, students and evaluators. **Not** to evaluate its visual design (Sankalp: not the design `[CALL 09-23]`).
Method: moderated, 45 minutes, think-aloud, desktop for P-A/P-R, phone-width resize for P-S and evaluator tasks, 5 participants per persona minimum (`[INFER]` convention).

| # | Persona | Task | Flow / Surface | Success criterion | Signals to record |
|---|---|---|---|---|---|
| T1 | P-A | "Bring in your skills list and tell me what you expect to happen." | F-01 / S-08 | Participant states that nothing is created until confirmed and finds the unread line | Misread of unread lines; trust comments |
| T2 | P-A | Configure one skill so a student must do it three times, once observed | F-03 / S-09 | Reaches Save with a satisfiable configuration | Time; hesitation on the dependency panel; errors |
| T3 | P-A | Change the rule on a skill that already has evidence | F-03 / S-09 | Predicts effect on students correctly | Whether they expect re-qualification (AE-02) |
| T4 | P-A | Map two skills to an offering, one mandatory | F-05 / S-10 | Completed; understands mapping does not restrict students | Misbelief that mapping gates submission |
| T5 | P-S | Send two skills from this course for review to a preceptor | F-06 / S-13 | Sent with correct setting, role, person | Defect hit: stale evaluator (DEFECT-01) |
| T6 | P-S | Find why Wound Care shows 4 of 4 and is not achieved | S-12 / S-14 | Names the missing setting minimum | Unmet SH-03/SH-05 |
| T7 | P-S | Correct a returned submission | F-09 / S-14 | Uses Revise and resend; understands difference from further attempt | Confusion between revise and attempt |
| T8 | P-P | Open an evaluation and complete two skills | F-07 / S-16 | Submitted; correctly states whether each counts | Time; hesitation; mobile use |
| T9 | P-P | Re-evaluate after a correction | F-09 / S-16 | n/a (preference probe for OD-08) | Preference: prefilled vs blank |
| T10 | P-R | Decide on a disagreement case | F-08 / S-11 | Decides without leaving the card | Where they look for help; what "return" means to them (OD-16) |
| T11 | P-A | Find which students lag on one skill and open a piece of evidence | F-11 / S-01 → S-03 | Reaches evaluation without re-searching | Dead ends; skill → individuals gap |
| T12 | P-A | Explain what "Not met" means | S-01 | Distinguishes or fails to distinguish no evidence vs not qualifying | Evidence for OD-03 |

### 4.2 Usability test of the future build (after W3, W5 respectively)

Same task list T1..T12 re-run against the real build, plus:

| # | Persona | Task | Success criterion |
|---|---|---|---|
| U1 | P-P | Open a link on a phone with no prior account | Opens with no sign-in; completes unaided |
| U2 | P-P | Open an already-used link | Understands state; not stuck (OD-18) |
| U3 | P-S | Send a skill with no placement recorded | Completes via full settings list (ST-07) |
| U4 | P-S | Send a skill requiring a role not valid for the chosen setting | Reads the reason and recovers (ST-08) |
| U5 | P-A | Apply a configuration to five selected skills | Completes (IM-14) |
| U6 | P-A | Filter by a location and setting that do not combine | Reads explanation (RP-09) |
| U7 | P-A | Export filtered evidence | File contains full scope and filters (RP-10) |
| U8 | Any | Complete the primary task with keyboard only | No traps; focus managed (a11y) |
| U9 | P-A | Deactivate a skill used in mapping | Understands consequences (SL-11) |

Accessibility: run `axe` for every surface in default plus each interaction state before any done claim; test status text without colour; targets ≥ 24px on S-16 `[strategy/06 §3]`.

### 4.3 Success metrics `[INFER]` (tie to `strategy/01 §7`, none agreed)

| Metric (from 01 §7) | Instrument | Target | Test |
|---|---|---|---|
| Time from list upload to first skill mapped | Task timing T1 → T4, then telemetry | Baseline first, no target until measured | Concept + usability |
| % imported skills configured within N days | Telemetry on IM-10 counter | Baseline first | Pilot |
| Median time from send to evaluator submit | Telemetry S-13 → S-16 | Baseline first | Pilot |
| % evaluations returned or revised | Telemetry | Baseline first | Pilot |
| Time from "who lags in skill X" to individual evidence | Task timing T11 | Baseline first | Concept + usability |
| Workaround placements (lab technician as placement faculty) retired | Interview + data check | Count | Pilot |
| Added (this plan) task success with no moderator help | T1..T12 | Baseline first | Concept |
| Added: evaluator opens link and completes without account prompt | U1 | 100% | Usability |

No numeric target is proposed where no baseline exists.

## 5. Design-assumption register

| # | Assumption | Source | Risk if wrong | Test | Owner |
|---|---|---|---|---|---|
| A-1 | Coordinators understand "model → criteria" from a visible dependency panel | `[PROTO]`, SC-17 | Config errors, abandoned setup | T2, T3 | UX |
| A-2 | A 3-step modal is too cramped for configuration; a full page works better | `[INFER]` | Rework | T2 on both layouts | UX |
| A-3 | Unread import lines build trust more than they alarm | `[PROTO]`, IM-08 | Distrust of import | T1 | UX |
| A-4 | Students know which evaluator role applies | `[INFER]` | Wrong role sends (ST-08) | T5, U4 | UX |
| A-5 | Students use phones between shifts | persona `[INFER]` | Desktop-only design fails | Student interviews | Research |
| A-6 | Preceptors open emailed links on phones | persona `[INFER]` | Shell or table layouts fail | T8, U1 | Research |
| A-7 | Evaluators do not need to see the student's status | `[INFER]`, OD-17 | Missing context | Preceptor interviews | PM |
| A-8 | "Return for correction" going to the student is the expected flow | REQ AR-05, RV-01 | Wrong owner of fix | T10; Sankalp answer | PM |
| A-9 | Four distinct states are meaningful to coordinators | REQ AE-04 | Over-detailed reports | T12; card-sort | Research |
| A-10 | Failed-rule text lets students self-correct without remediation tooling | REQ SH-03, §14 | Support burden | T6 | UX |
| A-11 | Per-setting progress on the student card is understood | REQ SH-05 | Persistent "why not achieved" | T6 | UX |
| A-12 | Coordinators can configure ~200 skills with bulk tools in a tolerable time | `[CALL 09-23]`, IM-14 | Adoption failure | Time test (U5) | PM |
| A-13 | A single link per request is enough for multi-skill evaluation | EV-05 `[INFER]` | Partial completions | FAST + T8 | FAST team |
| A-14 | Faculty prefer in-Prism evaluation over link | REQ §7 intro | Unnecessary surface | Faculty interviews | PM |
| A-15 | CSV opens correctly in Excel for coordinators | `[PROTO]`, OD-10 | Re-work for Excel | Coordinator test | PM |
| A-16 | Attainment can be communicated without red or bar-only visualisation | memory (Aarti, no progress-bar-only) | Rework | Aarti review | UX |
| A-17 | The 150-student table with duplicate names is disambiguated by cohort and group | `[PROTO DEFECT-09]` | Wrong student opened | T11 | UX |
| A-18 | Students will send already-achieved skills when programs want more evidence | `[PROTO copy]` | Noise | Coordinator interviews | PM |
| A-19 | Behaviour when a skill is deactivated mid-submission is rare enough to defer | `[INFER]` | Broken request | Data-model review | Tech |
| A-20 | The platform provides placement settings and locations per student per course | REQ ST-06 | Core send flow blocked | Platform team check (not named) | Tech |

## 6. Mobbin and pattern-research brief (to run once the Mobbin MCP is authenticated)

**Status (updated 2026-10-08):** All twelve queries (M-1 to M-12) have been run. S-09: `docs/research/meetings/2026-10-08-mobbin-s09-configure-patterns.md`. The rest: `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md`. Weak matches (M-4, M-7, M-8) and the remaining gaps are listed there. Original note: Mobbin was not authenticated when this plan was written. Do not cite Mobbin screens or invent references until the queries below have been run and each result carries a `mobbin_url`. Search job types, not domains (per `exxat-module-brief`).

| # | Job type to search | Maps to | Why | Query (web) |
|---|---|---|---|---|
| M-1 | Bulk import with a review-before-create step and unmatched-rows list | S-08 | IM-05, IM-08 | "import preview review table unmatched rows confirm" |
| M-2 | Configuration builder with dependent sections and live preview | S-09 | SC-17, SC-19 | "rule builder with preview dependent settings" |
| M-3 | Rule/criteria builder (at least N of M, named subset) | S-09 | SC-05 | "conditional rules builder at least N of" |
| M-4 | Master-detail list with counts and bulk toggles | S-10 | CM-01..04 | "master detail list with counts and toggles" |
| M-5 | Approval queue with side-by-side comparison | S-11 | AR-02, AR-05 | "approval queue compare two responses approve return" |
| M-6 | Multi-select action bar with a dialog that derives defaults | S-12, S-13 | ST-04, ST-06 | "multi select sticky action bar then dialog" |
| M-7 | Attempt history timeline with outcomes and next action | S-14 | SH-01..03 | "attempt history timeline status reason next step" |
| M-8 | Tokenised external form, no account, mobile single page | S-16 | EV-01 | "external guest feedback form no login mobile" |
| M-9 | Attainment table with drill to evidence and applied-filter chips | S-01..S-03 | RP-01, RP-05, RP-06 | "report table filters chips drill down" |
| M-10 | Empty state explaining why a filter returns nothing | S-01 | RP-09 | "empty state explain no results filter combination" |
| M-11 | Blocked-with-reason inline messaging in forms | S-13 | ST-08 | "disabled option with explanation inline form" |
| M-12 | Export menu with scope and applied-filters note | S-17 | RP-10 | "export dialog scope filters included" |

Procedure when authenticated: 3 or more searches minimum per major flow, pick 1 to 2 per query, record the `mobbin_url`, extract IA patterns only (no pixel copying), then log them in `docs/research/meetings/` and the surface contract's reference line. Also consult `apps/web/docs/modern-saas-patterns.md` and any repo reference hub before external references.

## 7. Sequencing

```
Week 0   Send §3 questions (Sankalp, Aarti, FAST first). Authenticate Mobbin; run §6.
Week 1   Concept test T1..T12 with 5 coordinators/students/preceptors each, nursing SME review (Sarah).
Week 2   Decide OD-03, OD-16, OD-04, OD-01, OD-07 (the five that unblock the most per strategy/05).
Wave W1  Engine + library + configure. Usability U5, T2, T3 on the build.
Wave W3  Student + evaluator. Usability T5..T8, U1..U4.
Wave W5  Reporting. Usability T11, T12, U6, U7. Pilot metrics (§4.3).
```
Each answer is written into `docs/strategy/05-open-decisions.md` with date and who decided, and the vault gets a decision note (`skills-req-trace`).
