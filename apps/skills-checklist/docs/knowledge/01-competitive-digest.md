# Competitive digest: Skills Checklist (22 products, Oct 19 2026)

**Source:** `Skills checklist competitive analysis.md` (Romit, Oct 19 2026; ratings from public documentation only, "?" = not publicly documented and scores zero, it does not mean "absent"). Every figure below is copied from that file. Tag `[COMP]`. "Prism planned" is a specification, not shipped software.
**Use:** read before any screen decision that could be argued from "what do others do". Companion: `00-design-brief.md`.

## 1. Scorecard takeaways

- Prism as specified would fully cover 33 of 35 capabilities. Prism today (the Evaluations workaround, REQ section 1.7) scores 41%, mid-pack.
- Best documented competitors: Platinum Planner 63% (EMS, allied health), Elentra 61%, Trajecsys 59%, HealthTasks 50% (strongest of the five added later). Others rated: Fisdap 51%, New Innovations 43%, CALIPSO 39%, Portico 39%, SimCapture for Skills 34%, AxialProgress 30%, Surgical Counts 29%, OASIS 26%, TracPrac 24%, eMedley 21% (thin docs).
- Leaders by section: Platinum Planner on review and revision (AR, RV); Elentra on the achievement engine (AE); Trajecsys on configuration and evaluation (SC, EV). Import (IM) and course mapping (CM) are weakest across the field, which is where Prism's plan is strongest.
- Each discipline has its own dominant tool: CALIPSO in SLP, Tevera in social work, Fisdap and Platinum Planner in EMS, New Innovations in GME. Programs that span disciplines run several side by side. Cleveland State's RFP lists Exxat, CALIPSO, Typhon, Blackboard and spreadsheets and asks for a single system (RFP 5034ME Q&A).
- Caveat: Typhon, CORE, Medtrics and eMedley publish mostly marketing pages, so real coverage is probably higher.

## 2. Where Prism is unique, rare, or table stakes

| Tier | Capability | Who else |
|---|---|---|
| Unique (no competitor fully documents) | Categories with tags [REQ SL-03, SL-04]; retire a skill but keep its evidence [REQ SL-11]; AI import with human review [REQ IM-13] | none fully (HealthTasks drafts skills for review; Elentra partial on retire) |
| Rare (one to three niche products) | One record across courses [REQ CM-07] | CALIPSO only (SLP) |
| Rare | Show a student why a submission did not count [REQ SH-03] | SimCapture only |
| Rare | Binary outcome with custom labels [REQ SC-03] | HealthTasks only |
| Rare | Correction versus new attempt [REQ RV-02, RV-03] | Platinum Planner, AxialProgress, HealthTasks |
| Table stakes | Program-defined library; participation level; student-initiated request; no-login sign-off; several evaluator types; progress view; export | most competitors. Prism today lacks a progress view, the gap students feel most |

**Design implication:** lead the experience with the rare four (one record across courses, correction versus new attempt, "why it did not count", and the progress view) and make the table stakes frictionless, not novel.

## 3. Models to study

| Model | What it does | Design implication for a screen |
|---|---|---|
| Elentra | Most complete rules engine; plans versioned by curriculum, older evidence moves to an "Archived" view; each requirement shown incomplete, in progress or complete; leaders can approve an EPA to override; can require a minimum number of distinct assessors; PIN typed on student's phone for no-login | Admin change-impact screen (admimpact): show students achieved before and after a rule change; design the "version by cohort" option behind a toggle (decision 2 option B); rule row can include "N different evaluators" |
| Fisdap | Requirement = age, setting, live or sim, team role and a count; threshold is a success rate (e.g. 4 of 5); preceptors sign on student's phone, offline | Rule builder (admconfig) allows context inside a requirement and a success-rate criterion; evaluator screen works offline |
| Platinum Planner | "Audit Skills" checks course minimums the classes cannot meet; lifecycle Returned, Submitted, Approved, Rejected; only approved counts; preceptor app averages 1.4 of 5 on iOS | Coverage matrix (required skills by course) with an "unreachable minimum" warning; keep the evaluator experience out of a heavy app |
| ACEMAPP | Status model: Incomplete, Pending, Active, Needs Info, Completed, Denied; approval passes preceptor, faculty, coordinator in turn; fills site and preceptor from the rotation | Status vocabulary reference for multi-step sign-off (OD-33 still open); prefill setting from placement [REQ ST-06] |
| Medtrics | Approval hub on operations: batch approve, late flags, median turnaround, supervisors with backlogs | Review queue: batch approve, ageing, per-evaluator backlog; do not invent metrics beyond what data supports |
| CALIPSO | One cumulative record per skill area across courses weighted by clock hours; self and supervisor use the same instrument | Student record screen is per skill, across courses, with a course filter [REQ SH-06]; self-evaluation uses the same criteria [REQ ST-11] |
| SimCapture for Skills | Student sees each item Done, Partial or Missed; scorer role set per evaluation; AI drafts checklists from objectives; only one restricting which roles may sign off | "Why this did not count" panel lists the failed rule item by item [REQ SH-03]; per-skill allowed evaluator roles [REQ SC-16] |
| Trajecsys | Yes/No checklist with a qualification rule; "Times Before Pass" practice count; several assessment sets per skill; flags an evaluator approval that conflicts with failure criteria; competencies built by vendor and not editable by coordinators | Keep the rule: engine decides, not the evaluator; position editable specialty starter libraries against it |
| Portico (CourseKey + Trajecsys, Nov 2025) | Suite; approval queue requires a reason to reject; per-item auto-approve threshold; config locks once published | Position against the suite, not Trajecsys alone; require a reason on return [REQ AR-04, RV-02] |
| New Innovations | Targets per supervision level; meeting them auto-privileges; confirm up to 50 logs at once | Bulk sign-off path for high-volume evaluators |
| Typhon | Monthly bulk sign-off ("Change ALL to"); locks after 72 hours; requires preceptor login | Bulk path exists, but avoid time-based locking; lock by state [REQ RV-05] |

## 4. Where competitors do it differently on sign-off without login

Four forms: email link (CORE), SMS or email link (Medtrics), PIN on the student's phone (Elentra), student's logged-in device handed over (one45); axiUm uses a faculty approval code at the workstation. The walkthrough's QR option is not documented anywhere. Typhon and ACEMAPP require preceptors to log in. [REQ EV-01 requires email link, no account.] QR and hand-over are v2 proposals, not REQ [AUDIT T2].

## 5. What users say (about 95 public reviews and posts; Reddit not reached; skews negative)

| Pain point | Mentions | Design implication |
|---|---|---|
| Login fails or forced update that does not exist (Exxat Student, MedHub, Fisdap, ACGME Case Logs) | about 22 | Logging and sign-off must work when sign-in or update fails; evaluator needs no sign-in |
| Crash or lost entry while logging (Exxat Student, Fisdap, MedHub, Platinum Planner) | about 14 | Save draft on device first; queued, synced, conflict states visible |
| Settings scattered, reporting weak (CORE ELMS, Sonia, Tevera) | about 12 | Reports reachable in one click from home; configuration in one place |
| Slow logging, no bulk (Typhon, MedHub, New Innovations, Platinum Planner) | about 10 | Multi-skill request [REQ ST-04]; bulk approve |
| App cannot do what the website does | about 9 | Parity of core actions on small screens |
| Cost per student | about 8 | Not a design matter |
| Sign-off on honor system; logs edited after approval (Typhon; 16.9% of logged diagnoses not found in charts, study) | about 7 | Lock on sign-off; immutable counted evidence [REQ RV-03] |
| Backdating limits block real entries | about 4 | Program-set backdating window `[INFER]` |
| Logs kept for credentialing and interviews | about 4 | Verified graduate record (rec 11) |
| Students cannot see what is left | about 3 | Progress view first release [REQ SH-04] |

Exxat Student on iOS: 1.4 of 5 from 52 ratings; all ten visible reviews about login, forced updates or crashes. Program directors on CSWE Spark praise Prism web. No G2 or Capterra reviews of Exxat. **The design risk is mobile reliability, not the web screens.** No first-hand preceptor feedback found anywhere; a short intercept study is a stated next step.

## 6. What the research says

| Finding | Evidence | Design implication |
|---|---|---|
| Mobile sign-off takes seconds to minutes | 22 s median (Chen 2019); 2.7 min per assessment, 3,568 assessments (Hasan 2021) | Evaluator form finishes under 2 minutes |
| QR is fastest and best liked, but does not raise volume alone | Snyder 2018, 15 sites | If QR exists, pair with nudges |
| Students ask after good days; faculty avoid recording poor ones | Jenkins 2026; Soelling 2026: 25% EPA completion despite 91.5% verbal feedback | "Feedback only, not yet" outcome |
| Counts alone are weak evidence | 50,821 observations, 139 dental students (Dawson 2021) | Rules also allow level, distinct evaluators, settings |
| Reliability needs several assessors | G > 0.7 needed about 12 assessments by 4 supervisors (Tessmann 2024) | "From at least N different evaluators" criterion |
| Prefill and verify beats free entry | 94.8% accurate, 68 s vs 200 s (Owolo 2026); reminders did not raise logging (Pregnall 2021) | Link patient-log entries to requests (decision 4; REQ section 14 out of scope today) |
| Phone logbook raises capture, much still unlogged | 3.6% to 20.5% (Tamblyn 2022) | Treat logged counts as a floor |
| Offline and connectivity matter | Top barrier for 26% of 358 trainees (Harrington 2020) | Queue entries offline |
| Review cadence lifts attainment | aOR 0.41 for less frequent review (Chen 2026) | Scheduled reviews and gap view |

AI that helps people decide, not AI that decides: import with review; comment-quality nudge (Chen 2025: 92% accuracy); reviewer summary; early warning from rating trends with the reason shown (Holmboe 2020); video grading later and only with educator override. HealthTasks is the most advanced AI product but its site carries text written to steer AI tools; treat claims as marketing until a demo.

## 7. The 14 recommendations (Oct 29 review) and the screen each implies

| # | Recommendation | Design implication |
|---|---|---|
| 1 | Position Prism as the cross-discipline record | Student record per skill across courses and disciplines; lead copy and demo with it |
| 2 | Close table stakes: participation role and count on the submission, no-login at the bedside, student progress view in release one | Submission form field for role and count; progress view is the student landing |
| 3 | Broaden achievement rules: distinct evaluators (Elentra, Tessmann), success rate (Fisdap), practice count before a checkoff opens (Trajecsys), context in the requirement (Fisdap, Platinum Planner) | Rule builder rows; the four types are not in REQ SC and need a decision before building |
| 4 | Use Elentra as evidence for decision 2 | Version by curriculum is the Elentra model; keep option B behind a toggle |
| 5 | Add a "feedback only, not yet" outcome | Third outcome on the evaluator form; not REQ |
| 6 | Make import self-serve and fast; test on real checklists from Ankit's discipline set | Import review screen optimised for speed; bulk apply |
| 7 | Make the preceptor mobile experience a selling point | Evaluator form short, with nudges; avoid a heavy app |
| 8 | Fill gaps with direct evidence: demos of Leo, MyEvaluations, eMedley, Competency.AI; confirm "?" cells with the Trajecsys hire and Typhon, CORE, Medtrics clients | Not a screen; unverified cells stay unverified |
| 9 | Never lose an entry | Draft on device, queued, synced, conflict states |
| 10 | Lock on sign-off; edit reopens the item with history visible to faculty; photo of paper signature goes to review | Locked state on counted items; paper-form path to review (conflicts with REQ RV-03; open question) |
| 11 | Verified graduate record: shareable PDF and CLR 2.0 | Export screen; REQ section 14 scope beyond exports is out |
| 12 | Editable specialty starter libraries | Starter libraries, program edits (conflicts with REQ SL-01 hard stop unless framed as a copy the program owns) |
| 13 | Add two open decisions: skill expiry and validator qualifications per skill | Do not design either; log as ODs (expiry is REQ section 14) |
| 14 | Position against the Portico suite | Positioning, not a screen |

## 8. Beyond the requirements (not REQ, use with care)

Skills logged inside a patient encounter with diagnosis codes (Typhon, CORE, MedHub, ACEMAPP, Medtrics); participation role plus count per log; GPS or site-stamped hours; evidence artifact on every observation (CORE, Typhon); competency certificates and ePortfolio; approval analytics (Medtrics); simulation cap against clinical hours (NCSBN 50%, Medtrics, extends REQ SC-12); offline mobile checklists (Competency.AI, marketing only).

## 9. Downstream workforce market

Kahuna, Dossier, Relias, HealthStream, symplr, Medbridge Skills: hospital buys and owns the record. The Joint Commission requires competency assessment at hire and at least every two years. Worth borrowing: portable verified record (PDF and CLR 2.0), self-rating kept apart from validation, who may validate by credential, how validated (direct observation, simulation, written), specialty starter libraries, skills-by-people heatmap. Risks: reversed record owner, overclaiming readiness, differing expiry logic, no employer demand shown.

## 10. Unverified

Every "?" in the source scorecard, the Reddit sentiment, HealthTasks AI claims, Competency.AI capabilities, and TracPrac "no AI" (vendor statement) remain unverified. Do not turn a "?" into "no".
