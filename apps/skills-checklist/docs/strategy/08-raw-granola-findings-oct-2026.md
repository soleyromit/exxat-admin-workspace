# 08 - Raw Granola findings, October 2026 (consolidated digest)

**Written:** 2026-10-09 · **Status:** research digest at CALL tier. Nothing here decides an OD, edits the REQ, or lifts a hard stop. Every `OD-*` stays open.
**Built from:** the three raw-review files in `docs/research/meetings/` (`2026-10-09-raw-review-recent-design-meetings.md` = RR-R, `...-implementation-and-config-meetings.md` = RR-I, `...-context-meetings.md` = RR-C), which were themselves written from raw Granola transcripts, never summaries.

## 0. How to read this file

| Item | Rule |
|---|---|
| Precedence | Behaviour: REQ > CALL > PROTO > INFER (unchanged). Everything here is CALL tier and is a stakeholder statement, not a requirement. Where it conflicts with the REQ, the REQ still governs and the conflict is logged in `07-gaps-contradictions-defects.md` (C-9 onward) |
| Speaker attribution | Granola gives only "Microphone" and "System audio". **No diarization.** "Aarti, inferred" means the raw-review file inferred her from the title, the recording time and the definitional tone; it is not confirmed. In the Oct 8 brain dump the raw shows at least two voices (a listener asks questions and sometimes answers), so even "Aarti, inferred" is weakest on the lines that read like a back-and-forth |
| Firmness | **Firm** = stated as fact or repeated, or a hard rule in the speaker's words. **Moderate** = stated once as an expectation or preference. **Weak** = a question, an aside, a relayed opinion, or a garbled passage |
| Quote check | "Raw verified" means the quote was re-read against the Granola raw transcript on 2026-10-09 for this file (see section 16). Others are quoted from the raw-review file only |
| Source tags | New tags are defined in `README.md`: `[CALL 10-08 Aarti]` `[CALL 10-08 Vaibhav]` `[CALL 10-09]` `[CALL 09-25]` `[CALL 09-30..10-02 leaders]` `[CALL 10-05]` `[CALL 10-02]` `[CALL 08-21]` |
| Meeting ids | A1 = Oct 8 brain dump `095fe094` (RR-R M1) · V2 = Oct 8 Vaibhav review `db6dc27e` (RR-R M2) · V3 = Oct 8 Vaibhav kickoff `c4c6d9eb` (RR-R M3) · I1 = Oct 9 implementation call `1d181b10` (RR-I M1) · I2 = Oct 9 config routing call `42543caf` (RR-I M2) · S23 = Sep 23 with Sankalp `eabd5c5d` (existing `[CALL 09-23]`) · P25 = Sep 25 placement session `d2576da6` · D25 = Sep 25 Day 2 `7f00b9b7` · G5 = Oct 5 accreditation interview `1dfa0f00` · R2 = Oct 2 expectations `4e56ee3f` · N8 = Aug 21 navigation `460905f3` · V3d/V4d/V5d = vault Day 3/4/5 transcripts |

The "design implication" in each theme is `[INFER]` unless stated. Hard stops are listed in section 15 with the statements that could pressure them.

---

## 1. One list: skills, competencies, EPAs, procedures, essentials

| Quote | Source | Firmness | Note |
|---|---|---|---|
| "Then skills, competencies, EPS, everything becomes one list." (raw verified) | A1, Aarti inferred | Moderate: a recommendation | Raw shows an exchange of two voices around it |
| "No, I'm saying we should just design it as one." / "that's the conversation you need to have with Yash and say he's recommending that as we design this, should we just design it as one?" (raw verified) | A1 | Moderate | Hands the call to Yash; "he's recommending" is ambiguous (whose recommendation is relayed) |
| "So that's the one thing we will have to get alignment on, is how is this different from competence?" (raw verified, wording "how is this different from competence") | A1 | Firm that it is unresolved | Aarti herself says alignment is needed |
| "skills is lower level activities, competency is higher level." (raw verified) | A1 | Firm as a terminology observation | Entry-level programs say skills, doctorate programs say competency |
| "the words that we have seen people use is skills, competencies, essentials, EPS. Competencies. ... And procedures." (raw verified; "5 things we have got") | A1 | Firm | Five names, one idea; PA says procedures |
| "we don't develop something completely from scratch and we just abstract out that" / "we just figure out ... How to extend? The competency." (raw verified) | A1 | Moderate | Reuse the existing competency mapping |
| "my competency can be connected to skills or it can be independent." (raw verified in substance) | A1 | Moderate | A flexible link, not forced coupling |
| "skills checklist, competency, EPAs, procedures, like they are all evaluated." (raw verified) | I1, Romit | Moderate | Romit uses the umbrella framing on the Oct 9 call |
| "which we are planning to integrate with Competency, EPA, etc." | I2, remote voice (RR-I 2.3) | Weak, delivery team mental model | |
| "they want to see which standards they are checking off" / "we should see if one workflow can accommodate all these different types" | V3d, leaders (RR-C 8.1.15, 8.1.16) | Moderate, unnamed leaders | Convergence direction; "it will be general purpose" |
| "I really see Skills and all of this should be all connected, um, in every discipline" | S23 (RR-I 3.54) | Weak, unattributed | Already in `[CALL 09-23]` |

**Contradiction:** README fact 3 / REQ 1.4 say a skill is narrower than a competency and must not inherit competency scoring or reporting. See `07` C-9 and OD-02, OD-28. **Needs Sankalp** (with Yash and Aarti).
**Implication `[INFER]`:** keep the nullable skill-to-competency seam and design the checklist object so it could be one entity with a `kind` attribute later. Do not rename navigation or merge the data model until OD-28 is answered. Do not read the Sep 23 "connected later" as consensus on one list.

## 2. The report is the launch page

| Quote | Source | Firmness |
|---|---|---|
| "My report should be my launch page." (raw verified) | A1, Aarti inferred | Firm, repeated |
| "I don't want a separate place where they go to see the what I have met and run a report, and then a separate place where they have to go to trigger." (raw verified) | A1 | Firm |
| "I know that I have to do at least 5, 5, 5, 5, 5 of each. I know I've done 2 of these, 4 of these, 6 of these." (raw verified) | A1 | Firm: per-skill counts visible against the target |
| "the report is the same as the launch page. Or the completion page, and I have to be able to do this at the student level." (raw verified) | A1 | Firm |
| "I may be able to trigger it from inside of a particular placement, that's okay, but I trigger it, I still go there." (raw verified) | A1 | Moderate: a placement may host a trigger but the result lands on the one checklist |
| "I can have the view in this course, how many things did they check off, and overall where do they stand." (raw verified) | A1 | Moderate: the student dashboard |

**Implication `[INFER]`:** the Attainment destination and the Reviews/trigger destination are one surface at student level. Direction A (lifecycle: Understand after Run), the brief-v2 hybrid (Attainment and Reviews as separate rail rows) and a staff-queue-only workbench all conflict. See `07` C-14, OD-29, `design/ARCHITECTURE-INPUTS-2026-10-09.md`.
Note the term "trigger a review": in the REQ the student sends for review and the evaluator signs off. "Trigger" in Aarti's usage is the student (or admin on behalf of) requesting evaluation; who may trigger for whom is not stated.

## 3. Program requirements as a defined-once entity

| Quote | Source | Firmness |
|---|---|---|
| "Program requirements is defined once and every student should meet those requirements." (raw verified) | A1 | Moderate: a requirement |
| "at a program level, I want the students to fulfill 100 skills?" answered "Yeah, program level." and "Which I'll activate at student level." (raw verified) | A1: question from a listener, answer from another voice | Weak to moderate |
| "we are not going to do hours in here." (raw verified) | A1 | Firm: hours are out of this module, but "we will put this under program requirements" |
| "we have to start capturing these things at the program level. What is it that is expected through accreditation?" | G5 (RR-C 3.1) | Moderate, Exxat product leader |
| "What is the level that is being set by the accrediting body and what is the level that you are programmatically setting for yourself?" | G5 (RR-C 3.2) | Moderate: two thresholds |
| "graduation requirements has to be built out for PRISM and it needs to sit in here" | G5 (RR-C 3.10) | Moderate: Student 360 area |

**Docs gap:** the REQ has per-skill criteria and per-offering mapping but no program-wide total (for example 100 skills). It is a candidate answer to OD-27 ("behind"). See OD-30. Hours stay out; do not design them (REQ section 14 and Aarti agree).
**Implication `[INFER]`:** leave a seam for a `ProgramRequirement` (count of skills, optional category quota, optional accreditor threshold vs program threshold). Do not build a UI until OD-30 is answered.

## 4. Evidence sources beyond a student submission

| Quote | Source | Firmness |
|---|---|---|
| "They can get it from a question in an assessment." / "Or I can get it from a grade of a class." (raw verified) | A1 | Moderate: "five ways" |
| "These are the 5 ways in which we talk." (raw verified) | A1 | The five: end-of-rotation form question, assessment question, a whole assessment (minimum score), a course grade or pass, a standalone FAST form |
| "If you pass the course, you pass this competency." (raw verified) | A1 | Moderate: KASA/SLP and nutrition |
| "Or it is coming from a patient log." (raw verified: "Or it is coming from a patient log.") | A1 | Weak: one item in a list of inputs |
| "And it can be self-assessment or via faculty sign-off or via preceptor sign-off." (raw verified) | A1 | Moderate |
| "In PA, they say there's no concept of met requirements." / "you have to do 333 of this, of all of this minimum procedures." (raw verified) | A1 | Moderate |
| "you need to get an assessment that you are at level 3 with this, or level 4 with this, or level 5 with this." (raw verified) | A1 | Moderate |
| "I observed 10, I assisted in 2, and I performed 5." (raw verified) | A1 | Moderate: counts split by role in the activity |
| "as long as one person says you did it well, it doesn't matter." (raw verified in substance) | A1 | Moderate: nutrition |
| "they have to be created as part of a placeholder course" | G5 (RR-C 3.15) | Weak: workaround pattern |
| "a way for them to bring in student performance data from outside sources" | G5 (RR-C 3.12) | Moderate: exam-prep and OSCE scores |

**Contradictions:** evidence arriving without a student submission, a patient log, and a course-pass grant each conflict with something in the docs. See `07` C-10, C-11, C-12, and OD-31, OD-32, OD-37.
**Implication `[INFER]`:** model "how evidence arrives" as a per-skill attribute with `student-submitted` as the only source built in v1; the others are named seams. Nothing here makes course-pass evidence or patient-log linkage in scope for v1.

## 5. Sign-off chains

| Quote | Source | Firmness |
|---|---|---|
| "It can be self. It can be faculty-based, it can be faculty plus preceptor-based." (raw verified) | A1 | Moderate: real-world variety |
| "Can it be that ... a faculty One signs off, then Faculty 2 also has to sign, right? Right, right." (raw verified) | A1: question by a listener, affirmed | Moderate |
| "Faculty has to approve, then a preceptor has to approve. Somebody will say only a faculty will sign off on it, and that's okay." (raw verified: opening of the transcript) | A1 | Moderate |
| "against each procedure they have to get at least 3 signatures from 3 preceptors." (raw verified) | A1 | Moderate: PA passport; the signature means "you were here", not quality |
| "I am saying I met it, or you need faculty Sign-off, or you need preceptor sign-off. Or it's coming automatically." (raw verified) | A1 | Moderate |
| "what is acceptable and what workflow they want to do is changing and can be custom for custom disciplines and custom schools" (raw verified) | A1 | Firm |
| "a faculty member is routinely also a preceptor" (RR-C 3.14, quote: "will take students from 3 pharmacy programs that are in that region") | G5 | Medium, pharmacy educator |

**Implication `[INFER]`:** extends OD-06 (roles as data, already the seam) with order (sequence), count of distinct signers, and a no-evaluator path. SC-15 (admin approval) is one fixed extra step today; a general chain would generalise it. See OD-33. Preceptors still need no login (a link per signer).

## 6. Soft mapping

| Quote | Source | Firmness |
|---|---|---|
| "every course can only have a soft mapping." / "Not a hard mapping." (raw verified; the two halves are separate turns) | A1 | Firm |
| "You either put them bold or put a star in front of them or make them in a different color or something." (raw verified) | A1 | Moderate: visual emphasis on the student's one checklist |
| "But they should be able to, um, do any, any of it." (raw verified) | A1 | Firm |
| "skills is agnostic of course" (raw verified: "So skills is agnostic of course as much as Some courses may highlight certain skills") | A1 | Firm |
| "it's more like a recommendation" | S23 (RR-I 3.11) | Moderate |
| "it must have 2 sections, either like mandatory for this course or recommended for this course" | S23 (RR-I 3.9) | Moderate |

**Consistent with** REQ CM-05 (mapping is expectation, not eligibility). **Tension inside the same call:** Aarti also describes a course pass as granting the skill, which gives the mapping an effect on achievement (C-12, OD-32). Also a presentation shift: the student's home becomes the one checklist with course emphasis, not a course page with a skill list (see journey 02).

## 7. Student-level scope

| Quote | Source | Firmness |
|---|---|---|
| "All of this stays at the student level." (raw verified) | A1 | Firm |
| "We can track internally that, okay, you achieved it, okay, you achieved it while you were on rotation 1, 2, 3, whatever, but that's just FYI. On my main report, I don't care." (raw verified) | A1 | Firm for the headline report |
| "It doesn't matter whether they learn in classroom, labs, clinics. It just matters that they learn it." (raw verified) | A1 | Firm as a design principle |
| "Doesn't matter they learn it on Clinical 1, Clinical 2, Clinical 3, doesn't matter." (raw verified) | A1 | Firm |
| "Are we also planning to think about a workflow where this report or a part of the report can be used by advisors for like students?" | A1: a listener (RR-R 41) | Weak: a question |
| "we don't have that student success, that, like, what's that called, timeline" | A1: a listener | Weak |

**Pressure on hard stops:** "it doesn't matter where they learn it" collides with REQ SC-12 (lab evidence never satisfies a clinical-setting minimum) and with OD-22 (rotation-scoped frequency). See `07` C-16 and section 15. The REQ governs; the headline report can ignore rotation while the evidence ledger keeps setting and location.
**Implication `[INFER]`:** the headline view is student by skill with no rotation axis; setting, location and rotation stay in the evidence drill-down. Advisors reading the report is a role/scope question (OD-25, FERPA), not a v1 feature.

## 8. Standalone vs integrated module

| Quote | Source | Firmness |
|---|---|---|
| "skills should be both an independent module but also integrated." (raw verified) | V2, Romit's own view | Moderate: Romit's preference, not a stakeholder decision |
| "And this will be modularized, right? ... Only part of student success." | A1: listener, answer | Weak to moderate |
| "most of them are independently sellable as well" | V3d (RR-C 8.1.1) | Firm for Prism as a whole |
| "If they haven't subscribed to those additional modules, show them it with a gray button." | V3d (RR-C 8.1.2) | Moderate: entitlement state |
| "Skills checklist is not named in the module roadmap talk" | P25 (RR-C 1.25, an absence) | Weak |
| "the skills checkoff list is very, very important for them" / "skill checkoff list is big in nursing undergrad, it's big in all allied health" | V5d (RR-C 8.3.2, 8.3.3) | Moderate: market name is "skills checkoff" |
| "Skills checklist will get done. Skills checklist is important here." | V5d (RR-C 8.3.6) | Firm intent, soft timing ("Q1, early Q1, late Q1.") |

**Docs gap:** docs describe Skills as a product with its own Admin and Student apps (ports 3007, 3008) and no "not enabled for this program" state. See OD-34 and `07` C-17. Market label ("checkoff" vs "Skills Tracking") is unresolved.

## 9. Accreditation owner and output

| Quote | Source | Firmness |
|---|---|---|
| "he's going to be The owner of accreditation." (raw verified in substance: "The owner of accreditation") | V2, Romit (senior PM, Bangalore; Vishal in RR-R) | Moderate: a fact relayed |
| "It's assessment after all. Of a student." (raw verified) | A1, after a meeting with Dr. Modi | Moderate |
| "And ultimately it will be a form that will be built at the end, which will be given to Farms portal." (raw verified) | A1 | Moderate: pharmacy Standard 7 output |
| "you might have to even open up the accreditation module." (raw verified) | A1 | Weak |
| "this also should be kind of connected with accreditation to say that we are here to do a ... continuous quality improvement" | V2, Romit (RR-R M2 row 15) | Weak: a preference |
| "continuous, uh, Improvement plan for students" | S23 (RR-I 3.33) | Moderate: accreditors ask for improvement planning, not skill lists |
| "one of them was accreditation module, and then after that I would say exam management and course evaluation." | V2, Romit (anecdotal customer signal) | Weak |

**Scope:** accreditation outputs are out of scope (REQ section 14). These statements say it is the strategic reason the module matters; they do not authorise an accreditation export. See OD-35.

## 10. Forms-per-skill strategy

| Quote | Source | Firmness |
|---|---|---|
| "They can either be evaluated using the same form for all checklists. Or each checklist can have its own evaluation form." (raw verified) | A1 | Moderate: both exist today |
| "where did we create 148 evaluation forms for the client?" (raw verified) | A1: radiation therapy; ask Ankita | Moderate |
| "here are like 140 forms that the preceptors and faculty are going to evaluate a student." (raw verified) | I1, Romit | Moderate: the hack being replaced |
| "student can submit multiple records. Okay, like each record can be associated with a particular skill." (raw verified) | I1, remote voice | Moderate: multi-response form |
| "those forms are separated by skills, okay, or by rotation or by course as well." (raw verified in substance) | I1, remote voice | Moderate |
| "all of the FAST formats that We already have, it's going to be the same. It's just the landing page." (raw verified) | I1, Romit | Moderate, **materially different from the REQ and the docs** |
| "we don't want schools to like have like a lot of different templates and types of forms" | S23 (RR-I 3.13) | Moderate |
| "I don't know whether like basis some configuration can dynamically generate a fast form" | S23 (RR-I 3.29) | Open technical question, FAST team, Q4 |

**Contradiction:** reuse existing FAST forms as-is (I1) vs a standardised form generated from configuration (S23, `01-problem-and-why.md` section 4) vs migration from Evaluations out of scope (REQ section 14). See `07` C-15, OD-36.

## 11. Timeline

| Quote | Source | Firmness |
|---|---|---|
| "the last week of October is where we want to have at least some version available for skills checklist." (raw verified: "Means the last week of October is where we want to have at least some version available for skills checklist.") | V2, Romit relaying Sankalp (name garbled) | Moderate: a target, no hard deadline |
| "next week for 4 days I'll be on holiday. So after that it's like a part 2 of skills checklist." | V2, Romit (RR-R M2 row 18) | Fact: Aarti's second session follows |
| "I have a meeting on Thursday with Aarti." (raw verified in substance) | I1, Romit | Fact: Excel of scenarios shown on Thursday |
| "we can meet every other day." (raw verified) | V2: sync with Vaibhav | Process |
| "Skills checklist is another thing we want to do." / "we'll see if that goes as planned for the Q1 part of it" | V3d (RR-C 8.1.20, 8.1.21) | Soft: Q1 2027 |

**Conflicts to verify:** "some version by end of October" vs "Q1 build" in `01-problem-and-why.md` section 3 and OD-05's "Ankit, Q4" vs Q1 for learning contracts (C-18). It is plausibly a design-stage "version", not a build; confirm with Sankalp.

## 12. Domain ambiguity

| Quote | Source | Firmness |
|---|---|---|
| "I think this should be in nursing." (raw verified in substance: "I think this should be in nursing. I mean, it says nursing here, but I need to review the document") | V2, Romit | Weak |
| "So we, uh, this is going to be in social work domain." (raw verified) | V2, Vaibhav | Weak: wrong assumption |
| "I think a lot of domains need this." | V3, Vaibhav (RR-R M3 row 6) | Weak |
| "originally it was learning contract, but I just confirmed with Arthi that it is skills checklist which we would need to work." | V3, Romit (RR-R M3 row 1) | Moderate: scope confirmed via Aarti |
| "Biggest domain that is asking for it, but skills are also used in, I think, PA" | S23 (RR-I 3.47) | Moderate |
| "I'm researching four domains emerging domains pharmacy, NDDO, dentistry" | S23 (RR-I 3.57) | Context |
| "interviewing one person, we may think that what their school does is what every school does." | R2 (RR-C 5.3) | Firm: do not generalise one school |

**Implication:** docs say nursing first and nothing nursing-specific. Collaborators still mix nursing and social work (learning contract is the social-work artefact). Confirm explicitly in OD-38. Evidence of a PA passport, nutrition and SLP shapes in A1 argues for generic.

## 13. Implementation data pull

| Quote | Source | Firmness |
|---|---|---|
| "we need to query the data from the database. Okay, then only we will understand it" (raw verified in substance) | I1, remote voice | Fact |
| "what I'm looking for is like per domain and per university. What are the different implementations that have been done?" (raw verified in substance) | I1, Romit | Plan |
| "That covers our 70 to 80% evaluations." (raw verified) | I1, remote voice | Estimate for a high-level scenario list |
| "how many universities are actually doing self-attestation as a part of skills" (raw verified) | I1, Romit | Open research question |
| "which university have like asked us to do something like that." | I2, Romit (RR-I 2.2) | |
| "it is not possible on the emergency basis because right now our team is delivering the client's delivery." | I2, remote voice (RR-I 2.5) | Constraint |
| "ask him to point you to the different unique setups that we've done for the nutrition." (raw verified) | A1: Ankit(a) next morning | Research task |

**State:** no per-domain, per-university inventory exists yet. Any claim about the "common set-up" is unevidenced beyond what Aarti and Sankalp described. Excel due before the Thursday Aarti session; re-read this file after it lands.

## 14. Other findings that matter to design

| Finding | Quote | Source | Firmness | Effect |
|---|---|---|---|---|
| Criteria shapes (count, score threshold, level, role-bucket counts, distinct-signer count, one-person-says-well) | see sections 4 and 5 | A1 | Moderate | OD-33 and OD-02 criteria shapes; SC-10 already covers per-level minimums |
| Student assertion alone is enough for some programs | "some people just want to say that just students saying is enough" (raw verified in substance: "Some people want to just say that just students saying is enough") | A1 | Moderate | Self-attestation as a terminal model; OD-09 variant, OD-37 |
| Placement coupling in the platform | "Having a placement is actually required for you to be able to use your learning activities for your evaluations" | D25 (RR-C 6.2) | Platform fact | Unmapped lab and class evidence has no home in the platform model yet; the "university site" workaround |
| Placement edits destroy activity history | "It's going to delete all the learning activities that they've already done." | P25 (RR-C 1.17) | Platform fact | Skills evidence must not hang off a placement lifecycle |
| Preceptors add themselves, admins merge | "You can link them together so they're not 2 different entities." | P25 (RR-C 1.16) | Platform fact | OD-05 needs a merge story |
| AI is per-program opt-in | "schools aren't like ready to use AI" / "we would need to have all those non-AI availability" | R2 (RR-C 5.1, 5.2) | Moderate | Manual import and configure must work with AI off |
| Two-tier "behind" and red/orange status | "a student can be in red if they're not meeting the accrediting body requirements" | G5 (RR-C 3.4) | Weak, prototype with mock data | Conflicts with the no-red rule (C-19); OD-27 |
| Prism front end is Angular | "the front end of Prism is built on a technology called Angular" | V4d (RR-C 8.2.10) | Constraint | The Next build is a design and behaviour reference only |
| Competency today is quantitative | "our competency mapping model today is only quantitative, correct?" | V3d (RR-C 8.1.14) | Weak, a question | Relevant to OD-28 |
| Multi-stakeholder form keeps the student original | "still maintain the records that were listed, what the student gave themselves for their review" | P25 (RR-C 1.4) | Moderate | Supports OD-08 and OD-09 |

## 15. Hard stops and statements that could pressure them

All hard stops stand. Nothing in these calls lifts one. Statements to watch:

| Hard stop | Statement that could pressure it | Handling |
|---|---|---|
| No shipped skills or taxonomy `[SL-01]` | "it will be enabled by default" (I1, Romit); a sales demo instance filled with fake data (R2 5.9) | "Enabled" means the module is on and the library is empty. Demo skills must be program-created sample content |
| No default evaluation model `[SC-02]` | "students saying is enough" as the simplest path; "it's very loose" vs "very strict" | Self-attestation must be a selectable model, never a default and never hidden |
| Unconfigured skills cannot be mapped or submitted `[IM-09]` | Course-pass grants a skill; imported lists of 40 to 50 skills | Course-pass or automatic evidence must still require configured skills; no auto-grant on unconfigured skills |
| Completed evaluations are immutable `[RV-03]` | Preceptor edits prefilled midterm answers (P25 1.14); a grade changing after the skill was credited | Keep the original as a snapshot (OD-08); automatic evidence from a changed grade needs an explicit rule (OD-31) |
| Mapping is not eligibility `[CM-05]` | "If you pass the course, you pass this competency." | Course-pass is evidence, not a gate; see C-12 and OD-32 |
| Preceptors have no login `[EV-01]` | PA "3 signatures from 3 preceptors"; faculty then faculty chains; an app or QR flow in Q2 (V3d 8.1.19) | Per-signer links only; a QR flow is out of v1 |
| Lab never satisfies a clinical-setting minimum `[SC-12]` | "It doesn't matter whether they learn in classroom, labs, clinics." and "rotation ... that's just FYI" | The REQ governs; headline view may ignore setting, minimum rules may not |
| REQ section 14 out of scope | Patient log as an input; hours; accreditation form for FARMS; advisor timeline and interventions; platform reminder engine; remediation ("did something for him") | Keep out of v1; ask Sankalp whether "patient log" here means the section 14 feature |
| Never treat an `OD-*` as decided | One list, report as launch page, program requirements | Recorded as preferences with firmness; OD-28 to OD-38 are proposals |
| No scores or Likert by default | "Of a score", level-based assessments | Offered as models, not defaults |
| No red in score or rating viz (Aarti) | Red and orange status for accreditor vs program thresholds (G5 3.4) | Use a non-red vocabulary; log in C-19 |

## 16. What was verified against raw and what was not

Verified on 2026-10-09 with `mcp__claude_ai_Granola__get_meeting_transcript`:
- A1 `095fe094`: full transcript re-read. About 30 quotes in sections 1 to 7 and 14 matched, including the launch-page quotes, soft mapping, one list, "design it as one" and the Yash hand-off, program requirements, "not going to do hours", the five evidence ways, PA passport, nutrition, Dr. Modi/Farms.
- I1 `1d181b10`: full transcript re-read. Matched: the 140 forms, multi-response form, FAST formats "going to be the same", Thursday with Aarti, 70 to 80%, self-attestation count question.
- V2 `db6dc27e`: keyword-checked against the saved raw (69k chars). Matched: last week of October, owner of accreditation, "whole hierarchy", independent and integrated module, hundreds of skills, initiated by student or admin, social work assumption, every other day.
- Not re-checked against Granola (quoted from RR files): V3, I2, S23, P25, D25, G5, R2, N8 and the three vault transcripts. The RR-C file states the machine check it did on its saved transcripts. Aug 21 and Oct 2 quotes were hand-copied there and not machine-checked.
- Not available: Sep 22 "Meeting with Aarti" returned a null transcript; the Oct 5 interview was read only in parts (RR-C section 1).
