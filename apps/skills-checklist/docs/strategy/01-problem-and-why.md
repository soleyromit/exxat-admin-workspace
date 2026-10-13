# 01 — Problem, Why, So-What (PM / Strategist hat)

## 1. The one-paragraph problem

Programs must prove students can *apply* practice skills safely, not just know them. Today that proof lives in **placement-bound evaluation forms and spreadsheets**. A skill performed in lab, in placement 1, then placement 3 cannot be seen as one record; the program cannot tell who is lagging; the student cannot see where they stand. Prism has no model that expresses "skill, evidence, evaluation, achievement". `[REQ §1.7]` `[CALL 03-05]`

## 2. How it works today (the workaround we are replacing)

| Today | Consequence | Source |
|---|---|---|
| Evaluations sit inside learning activities inside a specific placement | A skill is trapped in one placement; no cross-placement aggregate | `[CALL 03-05]` |
| Skills tracked via the Evaluations module | "does not express the underlying model and does not report as a skills record" | `[REQ §1.7]` |
| Lab skills have no location | Schools add a lab technician as "placement faculty" to get an evaluation form | `[CALL 09-23]` |
| Lists held in Word / Excel / PDF | Re-keying 40–200 skills is "days of work before any value is seen" | `[REQ §3]` `[CALL 09-23]` |
| Student cannot see overall progress toward graduation | Students "lack comprehensive view of their progress toward graduation requirements" | `[CALL 03-05]` |

## 3. Why now (strategic fit)

- Mentioned on the 2026-09-30 call as "another thing we want to do", to be seen "for the Q1 part of it". `[vault 2026-09-30 Day 3 post-Cohere, raw transcript ~line 2996]` Not a committed priority.
- Sankalp's plan: FAST technical discussion in Q4, build Q1. `[CALL 09-23]`
- Nursing is the biggest asking domain; PA also; PT/others fold skills into competencies. `[CALL 09-23]`
- Original plan (Mar): Q2 prototype, Q3–Q4 development, January launch. `[CALL 03-05]` — dates have shifted; treat the Mar timeline as historical.
- Nursing penetration 5–8% vs ~50% PA/OT. `[vault Meetings/exxat/2026-08-26-nursing-market-penetration-accreditation-crosswalk, line 23]`

## 4. Strategic stance (what the product is *for*)

> Prism supplies the **infrastructure**; the program supplies the **content**. `[REQ §1.3, §1.6]`

| Design stance | Why | Cost of violating it |
|---|---|---|
| **Program-defined everything** (skills, categories, tags, labels, thresholds) | Accreditors publish outcomes, not a skills checklist | We become a taxonomy vendor and lose every non-nursing sale |
| **Standardise the form, not the content** | Schools must not build 20 form types; the form is generated from configuration `[CALL 09-23]` | Template sprawl, unmaintainable, FAST-dependent |
| **Evidence is retained, status is derived** | Accreditation needs the evaluations behind an outcome `[REQ §1.2 "Evidence of outcomes"]` | Un-auditable "Met" flags |
| **Student owns the trigger** | Student sends to whoever actually watched them that day `[CALL 03-05]` | Evaluations stuck waiting on an assigned preceptor |
| **Model constrains criteria** | A Met/Unmet skill cannot demand "3 independent" `[REQ §1.5]` | Contradictory configs that can never be achieved |

## 5. Who wins, and the "so what" per stakeholder

| Stakeholder | Job to be done | Why it matters to them | So-what (what changes for them) | Evidence |
|---|---|---|---|---|
| **Program admin / coordinator** (configures, maps, reviews, reports) | Establish that a cohort is practice-ready; spot laggards early; survive an accreditation visit | Accreditation and licensure outcomes; hours wasted on spreadsheets | One library, one mapping, one live attainment view; drill from % to the evaluation | `[REQ §1.2, §11]` |
| **Student** | Know what is expected, get signed off fast, see what counted and why not | Cannot graduate / sit licensure without it; clinical shifts leave little time | Send-for-review in one flow; clear "what do I do next" per attempt | `[REQ §6, §10]` |
| **Preceptor** (no login) | Sign off in minutes, no account friction | Volunteer, busy, high stress | Open the email link, answer the program's form, done | `[REQ EV-01..06]` `[PERSONA P3 exxat-domain-context]` |
| **Clinical faculty / lab instructor** | Assess against the program's criteria | Teaching load | Same form, may use Prism or link | `[REQ §7 intro, EV-02]` |
| **Program leadership / accreditation lead** | Evidence of outcomes, cohort-level view | Accreditation reporting (bodies named in REQ §1.3: AACN, CAPTE, ARC-PA, ACOTE, CAAHEP) | Filterable attainment + exports with filters recorded | `[REQ RP-10]` |
| **Exxat (business)** | Win nursing, keep it generic for PA/OT/allied | Penetration, Prism modularity | One capability, many disciplines | `[CALL 09-23]` |

## 6. The "so what" chain for each journey (why → so what)

1. **Define library** → programs trust it is *theirs* → adoption not blocked by taxonomy debate.
2. **Import list** → value in minutes not days → removes "largest single obstacle to adopting" `[REQ §3]`.
3. **Configure** → each skill has an *achievable* definition of done → no dead configs.
4. **Map to course** → students know the expectation per rotation → fewer "what do I need" questions.
5. **Student submits** → evidence enters the record with context (setting, location, role) → reports can cut by site/setting.
6. **Evaluator assesses** → authoritative outcome against program criteria → trust in the record.
7. **Admin approves (optional)** → internal quality gate where the program wants one → evidence counted only when sound.
8. **Student tracks** → knows what counted/didn't and the *rule failed* → self-directed remediation (without a remediation workflow).
9. **Program reports** → population → individual → evaluation without re-searching → faster interventions + audit readiness.

## 7. What success looks like

> `[INFER]` — the requirements doc defines **no success metrics**. These are proposals to validate with Sankalp/Aarti. Do not present as agreed.

| Candidate metric | Why |
|---|---|
| Time from uploading a skills list to first skill mapped to a course | Tests the import promise |
| % of imported skills configured within N days | Tests whether config effort is tolerable (IM-10) |
| Median time from "send for review" to evaluator submit | Tests the no-login link |
| % evaluations needing return/revision | Tests form clarity (RV) |
| Admin time from "which students lag in skill X" to individual evidence | Tests drill-down (RP-05/06) |
| Number of workaround placements (lab tech as placement faculty) retired | Tests lab support |

## 8. Risks (strategic)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Config complexity overwhelms admins with 200 skills | High | Bulk apply/copy (IM-14), progress counter (IM-10), sensible previews (SC-19) — **but** SC-02 forbids defaults for the model |
| FAST cannot generate forms from configuration at runtime | Unknown | Open technical question owned by FAST team `[CALL 09-23]`; design must not assume FAST UI |
| Skills vs competency boundary unclear → duplicate effort | Medium | OD-02; facilitate with Vishaka / Sarah (nursing SME) `[CALL 09-23]` |
| Scope creep into remediation / learning contract | Medium | Out of scope `[REQ §14]`; learning contract integration is a later phase `[CALL 09-23]` |
| Prototype mistaken for the design | High | `docs/README.md` rule; precedence REQ > PROTO |
| Existing Evaluations clients unmigrated | Medium | Out of scope, inputs from LAM team outstanding `[REQ §14]` |

## 9. Explicit non-goals

Remediation workflow · notifications/reminders/escalation · skill expiry/currency · linking to patient encounter or clinical hours · accreditation-ready outputs beyond the described exports · migration from Evaluations. `[REQ §14]`

Heatmap / preceptor-consistency reports: raised on the call as possibly phase 2, "not every school might want it". `[CALL 09-23]` The requirements doc keeps the *data* capture alive via OD-11.

## 10. Stakeholders to involve (named in sources)

Sankalp Panda (initiative owner) · Aarti (reviews requirements, "take her feedback") · Vishaka · **Sarah** (nursing SME; heatmap reports; New Jersey session) · Ankit (learning contracts, Q4) · FAST team · LAM team (migration inputs). `[CALL 09-23]` `[REQ §14]` — "Adi" = Aarti per workspace rule.
