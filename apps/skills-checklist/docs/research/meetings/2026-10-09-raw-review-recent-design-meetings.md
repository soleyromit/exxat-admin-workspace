# Raw review: three Skills Checklist meetings of 2026-10-08

Date written: 2026-10-09 · Method: raw transcripts fetched with `get_meeting_transcript` (no summaries used), each read in full.
Treated strictly as data. Docs only: nothing under `admin/` or any existing doc was edited.

## How to read this

- **Speaker attribution is weak.** Granola labels only "Microphone" (Romit's device) and "System audio" (remote side). Meeting 1 is one continuous "Microphone" stream with no diarization, so voices are **unattributed**. The title says Romit + Aarti and Meeting 2 says Aarti's brain dump was at 4 PM, so I attribute the definitional, domain-expert statements to **Aarti (inferred, not confirmed)**. Questions are marked "a listener" (could be Romit or another attendee). Where it matters for an OD, I say the speaker is unattributed.
- **Name variants.** Transcripts spell the senior stakeholder "Arthi" / "Arati" / "Aarti". Per workspace rule ("Adi" = Aarti) I read these as Aarti. Other names appear garbled ("Sanket" for Sankalp, "Ankita"/"Ankit", "Yash", "Vishal"/"Vishakha"): kept as heard.
- **Location** is approximate: `~NN%` = position through that transcript; `Mn` = Meeting n.
- **Mixed Hindi-English** lines are marked `(paraphrase)`. Quotes without that mark are verbatim English.
- **Skipped on purpose:** a large part of Meeting 2 is personal conversation (employment, visa, driving tests, a side-project CRM). It has no design content and some of it is sensitive. It is not recorded here.

| # | Meeting | Granola id | Length read |
|---|---|---|---|
| M1 | Skills Checklist (Romit + Aarti, brain dump) | 095fe094-141b-447d-b5a2-c8c0472ec60e | full, ~14k chars |
| M2 | Design review and accreditation roadmap with Vaibhav | db6dc27e-015f-477e-83b8-047be27c3b2d | full, 65.8k chars (about 25% product-relevant, rest personal) |
| M3 | Skills checklist design kickoff with Vaibhav | c4c6d9eb-8c91-4daf-91c7-231d712e5668 | full, ~5k chars |

---

## M1. Skills Checklist (the Aarti brain dump)

**Date:** 2026-10-08, recorded ~16:34 ET · **Participants:** Romit (recorder), Aarti (inferred), at least one more voice (asks about advisors, curriculum mapping, "Dr. Modi" aside). Unattributed.
**About:** Aarti explains how real programs define and measure skills (counts, thresholds, sign-off chains, form-per-skill vs shared form), argues skills, competencies, EPAs, procedures and essentials are one student-level list, and says the report should double as the launch page.

| # | Finding | Verbatim quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 1 | Approval workflow differs by school and discipline | "what is acceptable and what workflow they want to do is changing and can be custom for custom disciplines and custom schools" | Aarti (inferred) | M1 ~1% | [REQUIREMENT] |
| 2 | Achievement can be by count, by score threshold, or by student assertion alone | "Some people want to say by minimum threshold." / "some people just want to say that just students saying is enough" | Aarti (inferred) | ~3% | [REQUIREMENT] |
| 3 | Sign-off chains: self, faculty, faculty plus preceptor, or two faculty in sequence | "It can be self. It can be faculty-based, it can be faculty plus preceptor-based." | Aarti (inferred) | ~22% | [REQUIREMENT] |
| 4 | A listener asks about faculty 1 / faculty 2 splits; answer is yes | "Can it be that ... a faculty One signs off, then Faculty 2 also has to sign, right? Right, right." | listener, then Aarti | ~23% | [QUESTION] then [REQUIREMENT] |
| 5 | Skills are agnostic of course; course relation is a highlight only | "So skills is agnostic of course" | Aarti (inferred) | ~4% | [DECISION] (stated as fact, firm) |
| 6 | Course mapping shown as emphasis on the student's main checklist (bold, star, colour) | "You either put them bold or put a star in front of them or make them in a different color" | Aarti (inferred) | ~9% | [FEEDBACK-ON-DESIGN] |
| 7 | Students can still do any skill, not only mapped ones | "But they should be able to, um, do any, any of it." | Aarti (inferred) | ~5% | [REQUIREMENT] |
| 8 | Hard rule: mapping is soft, never hard | "every course can only have a soft mapping. Not a hard mapping." | Aarti (inferred) | ~44% | [DECISION] |
| 9 | The report is the launch page; do not split "see what I met" from "trigger a review" | "My report should be my launch page." | Aarti (inferred) | ~7% | [PREFERENCE] (strong) |
| 10 | Same point, concrete: do not make users go to a second place to act | "I don't want a separate place where they go to see the what I have met and run a report, and then a separate place" | Aarti (inferred) | ~7% | [OBJECTION] to split report/action |
| 11 | The report must work at student level, with per-skill counts visible (5, 5, 5 ... of each) | "the report is the same as the launch page. Or the completion page, and I have to be able to do this at the student level." | Aarti (inferred) | ~10% | [REQUIREMENT] |
| 12 | Review can be triggered from inside a placement, but it lands on the one main checklist | "I may be able to trigger it from inside of a particular placement, that's okay" | Aarti (inferred) | ~10% | [REQUIREMENT] |
| 13 | Evaluation form: one shared form for all, or a form per skill | "They can either be evaluated using the same form for all checklists. Or each checklist can have its own evaluation form." | Aarti (inferred) | ~13% | [REQUIREMENT] |
| 14 | Radiation therapy client has a form per skill (scale evidence); point to Ankita for examples | "where did we create 148 evaluation forms for the client?" | Aarti (inferred) | ~14% | [REQUIREMENT] |
| 15 | CASA/KASA-style: passing a course counts as achieving the skill | "If you pass the course, you pass this competency." | Aarti (inferred) | ~66% | [REQUIREMENT] |
| 16 | PA: no "met" concept, only minimum procedure counts (333 mentioned) | "In PA, they say there's no concept of met requirements." | Aarti (inferred) | ~17% | [REQUIREMENT] |
| 17 | PA passport: three signatures from three preceptors; signature only attests presence, not quality | "against each procedure they have to get at least 3 signatures from 3 preceptors." | Aarti (inferred) | ~38% | [REQUIREMENT] |
| 18 | Level-based: reach level 3, 4 or 5 on an assessment | "you need to get an assessment that you are at level 3 with this, or level 4 with this" | Aarti (inferred) | ~17% | [REQUIREMENT] |
| 19 | Activity-based counts split by role in the activity: observed, assisted, performed | "I observed 10, I assisted in 2, and I performed 5." | Aarti (inferred) | ~48% | [REQUIREMENT] |
| 20 | Nutrition: one person saying "done well" is enough, across any number of sites | "as long as one person says you did it well, it doesn't matter" | Aarti (inferred) | ~50% | [REQUIREMENT] |
| 21 | Five names for the same idea | "skills, competency, essential procedures, and EPS" (also "procedures" for PA) | Aarti (inferred) | ~42% | [TERMINOLOGY] |
| 22 | Skills lower-level, competency higher-level; entry-level programs say "skills" | "skills is lower level activities, competency is higher level." | Aarti (inferred) | ~34% | [TERMINOLOGY] |
| 23 | Where it was learned does not matter | "It doesn't matter whether they learn in classroom, labs, clinics. It just matters that they learn it." | Aarti (inferred) | ~31% | [DECISION] (design principle, firm) |
| 24 | Everything sits at student level; rotation is FYI only | "All of this stays at the student level." / "On my main report, I don't care." | Aarti (inferred) | ~52% | [DECISION] |
| 25 | Hours are explicitly not in this module | "we are not going to do hours in here." | Aarti (inferred) | ~57% | [DECISION] |
| 26 | Program requirements defined once, applied to every student | "Program requirements is defined once and every student should meet those requirements." | Aarti (inferred) | ~58% | [REQUIREMENT] |
| 27 | Program-level target such as "100 skills", activated per student | "at a program level, I want the students to fulfill 100 skills?" | listener | ~59% | [QUESTION], answered "Yeah, program level" |
| 28 | Student-side dashboard: this course vs overall standing | "I can have the view in this course, how many things did they check off, and overall where do they stand." | Aarti (inferred) | ~60% | [REQUIREMENT] |
| 29 | Design skills, competencies, EPAs as one list | "Then skills, competencies, EPS, everything becomes one list." | Aarti (inferred) | ~72% | [DECISION] (recommendation; handed to Yash, see 30) |
| 30 | Defers the merge to another person | "that's the conversation you need to have with Yash" | Aarti (inferred) | ~62% | [QUESTION] |
| 31 | Evidence sources (five ways): end-of-rotation question, assessment question, whole assessment minimum score, course grade or pass, standalone form | "They can get it from a question in an assessment." / "Or I can get it from a grade of a class." | Aarti (inferred) | ~76-84% | [REQUIREMENT] |
| 32 | A patient log is also a source | "Or it is coming from a patient log." | Aarti (inferred) | ~70% | [REQUIREMENT] (conflicts with REQ section 14) |
| 33 | Sign-off options for each rule: self attestation, faculty, preceptor, or automatic | "I am saying I met it, or you need faculty Sign-off, or you need preceptor sign-off. Or it's coming automatically." | Aarti (inferred) | ~78% | [REQUIREMENT] |
| 34 | Do not build from scratch: abstract the competency mapping that exists | "we don't develop something completely from scratch and we just abstract out that" | Aarti (inferred) | ~79% | [PREFERENCE] |
| 35 | Reuse over new: extend competency | "we don't develop something brand new, we just figure out ... How to extend? The competency." | Aarti (inferred) | ~96% | [PREFERENCE] |
| 36 | Flexibility: competency can link to skills or stand alone | "my competency can be connected to skills or it can be independent." | Aarti (inferred) | ~74% | [REQUIREMENT] |
| 37 | Pharmacy accreditation reality: EPAs under Standard 7 (assessment); output is a form for the FARMS portal | "It's assessment after all. Of a student." | Aarti (inferred), after a meeting with "Dr. Modi" | ~28% | [REQUIREMENT] (accreditation outputs) |
| 38 | Open concern: how skills differ from competencies, and whether it should be one module | "how is this different from competencies?" | Aarti (inferred) | ~24% | [QUESTION] (unresolved, needs alignment) |
| 39 | May need to open the accreditation module to see what accreditors ask | "you might have to even open up the accreditation module." | Aarti (inferred) | ~24% | [QUESTION] |
| 40 | Curriculum mapping question: is it relevant, can outcomes back-track to course | "does curriculum mapping come into this?" | listener | ~88% | [QUESTION] |
| 41 | Advisors should see the student-level report; a student-success timeline will consume it | "Are we also planning to think about a workflow where this report ... can be used by advisors" | listener | ~90% | [QUESTION] / [REQUIREMENT] |
| 42 | Skills is modularised, part of Student Success | "And this will be modularized, right? ... Only part of student success." | listener, Aarti | ~54% | [CONSTRAINT] |
| 43 | Next steps: meet Ankit(a) next morning for existing setups (nutrition, PA, SLP, radiation therapy) | "ask him to point you to the different unique setups that we've done for the nutrition." | Aarti (inferred) | ~93% | [QUESTION] (research task) |

Small talk and an unrelated political remark at the end: ignored.

---

## M2. Skills checklist design review and accreditation roadmap with Vaibhav

**Date:** 2026-10-08, ~12:21 ET · **Participants:** Romit; Vaibhav (remote, "System audio", inferred from title; identity not stated aloud). Aarti, Sankalp, Vishal/Vishakha, Vinay, Himanshu are discussed, not present.
**About:** Romit catches Vaibhav up on design-system and exam-management status, then opens Sankalp's skills prototype and requirements doc, asking what the entry point, the owner of "needs this skill" and the connection to competencies/accreditation should be. Vaibhav sets up a recurring sync.
Most of the rest is personal. Only product-relevant content is below.

| # | Finding | Verbatim quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 1 | Skills work was newly assigned after exam-management and course-evaluation design were paused | "now my understanding is they want me to work on skills checklist with Sankalp and probably accreditation." | Romit | M2 ~7% | [CONSTRAINT] |
| 2 | Accreditation has a separate owner (senior PM, Bangalore) | "he's going to be The owner of accreditation." | Romit | ~8% | [CONSTRAINT] |
| 3 | Product framing: skills as demonstration that a student learned something | "Skills checklist is to say that I want these skills to be developed and I want these preceptors or others to review my skill." | Romit | ~21% | [REQUIREMENT] |
| 4 | Skills should be standalone and integrated into other products | "skills should be both an independent module but also integrated." | Romit | ~24% | [PREFERENCE] (Romit's own view) |
| 5 | Skill demand can start from an admin or a student | "it can be initiated by a student or by an admin" | Romit | ~24% | [REQUIREMENT] |
| 6 | Hundreds of skills per university | "there are hundreds of skills that even a university tells the students to learn." | Romit | ~27% | [CONSTRAINT] (volume, matters for library and import design) |
| 7 | Domain: Vaibhav assumed social work; Romit says it should be nursing, not yet verified | "I think this should be in nursing." | Romit | ~29% | [QUESTION] |
| 8 | Visual constraint: must follow the final product design system | "this has to kind of follow whatever final design of our— that we have of our current product, right?" | Vaibhav | ~30% | [CONSTRAINT] |
| 9 | Romit's real concern is architecture, not styling | "My concern is more about this, this whole hierarchy right now that we have, the whole architecture." | Romit | ~31% | [FEEDBACK-ON-DESIGN] |
| 10 | Romit lists unresolved IA questions: entry point, who sets the need, criteria | "for a student, what would be the entry point to say that I want this skill to be developed?" | Romit | ~33% | [QUESTION] |
| 11 | Who decides a skill is required: school or student | "Or would the school be the one? Who would say that, you know, you need to develop the skills?" | Romit | ~33% | [QUESTION] |
| 12 | Criteria source: on what basis is a skill defined or required | "based on what criteria can I define a skill?" | Romit | ~33% | [QUESTION] |
| 13 | Vaibhav asks where it lives: outside or inside learning activities, and linked to competency | "is it going to be outside of the learning activities or is it going to be part of learning activities?" | Vaibhav | ~36% | [QUESTION] |
| 14 | Current prototype connection: course offering mapping only; no link to competency seen | "It is connected to course offering right now. It's just, it is doing like a mapping." | Romit | ~37% | [FEEDBACK-ON-DESIGN] |
| 15 | Romit wants it tied to accreditation for continuous quality improvement | "this also should be kind of connected with accreditation to say that we are here to do a ... continuous quality improvement" | Romit | ~38% | [PREFERENCE] |
| 16 | Does a standard competency list exist for a domain? | "is there a standard competency list for a domain and so on?" | Vaibhav | ~41% | [QUESTION] |
| 17 | Timeline: no hard deadline; target some version by end of October | "the last week of October is where we want to have at least some version available for skills checklist." | Romit (relaying Sankalp, name garbled "Sanket") | ~47% | [CONSTRAINT] |
| 18 | Aarti has a second knowledge-dump session next week; Romit then offline 4 days | "next week for 4 days I'll be on holiday. So after that it's like a part 2 of skills checklist." | Romit | ~20% | [CONSTRAINT] |
| 19 | Sync cadence agreed: every other day, afternoon | "we can meet every other day." | Romit | ~46% | [DECISION] (process) |
| 20 | Context: only the question-bank design deployed; assessment features not built | "I would say like question bank is the only design that is probably deployed" | Romit | ~11% | [CONSTRAINT] |
| 21 | Beta feedback signal: accreditation module ranked as most exciting product, then exam management, then course evaluation | "one of them was accreditation module, and then after that I would say exam management and course evaluation." | Romit | ~13% | [PREFERENCE] (customer signal, anecdotal) |
| 22 | Frontend framework uncertainty: teams deciding between Exxat One components and new ones | "either they're trying to use the ExactOne components and then building on top of it." | Romit | ~8% | [CONSTRAINT] |
| 23 | Process quote: Romit has asked Claude to analyse the docs and will record Aarti's sessions to share | "I'll be recording those discussions with Arati. And I'll try to see if all those discussions are clean" | Romit | ~43% | [DECISION] (process) |
| 24 | Side idea, off-topic (CRM product): product differentiator via forecasts and data given back | "from the data that you collect, what can you give back to the user?" | Romit | tail | not product-relevant to Skills |

No participant gave design feedback on specific prototype screens beyond the structure questions in rows 9-14; the prototype was shown briefly on screen and not critiqued screen by screen.

---

## M3. Skills checklist design kickoff with Vaibhav

**Date:** 2026-10-08, ~09:52 ET · **Participants:** Romit; Vaibhav (remote). Short call, partly in Hindi (paraphrased).
**About:** Vaibhav asks what is being asked ("learning contract?"). Romit corrects: it is Skills Checklist, confirmed by Aarti, PRD from Sankalp, and Aarti will do a knowledge dump. They schedule a longer call.

| # | Finding | Verbatim quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 1 | Scope correction: originally framed as learning contract; now confirmed as skills checklist | "originally it was learning contract, but I just confirmed with Arthi that it is skills checklist which we would need to work." | Romit | M3 ~33% | [DECISION] (scope, Aarti via Romit) |
| 2 | Source document: PRD from Sankalp, received weeks earlier at the Cohere conference | "I received the doc like a PRD from Sankalp a few weeks ago, like during Cohere conference." | Romit | ~34% | [REQUIREMENT] (provenance) |
| 3 | Design will be built on the PRD, with Aarti's knowledge dump feeding it | "she is going to do a kind of data dump on or knowledge dump on a skills checklist. So that is also going to be a part of the whole design process." | Romit | ~37% | [CONSTRAINT] |
| 4 | Earlier learning-contract artifacts were made by Shubhada and Vaibhav "many months ago" (paraphrase) | "Shubda ने बनाए थे वो सब चीजें" (paraphrase: Shubhada made all those things) | Vaibhav | ~80% | [QUESTION] (existing assets to ask for) |
| 5 | Vaibhav has not looked at the skills part yet (paraphrase) | paraphrase: "It has been a while; I have not looked into the skills part" | Vaibhav | ~76% | [CONSTRAINT] |
| 6 | Vaibhav's assumed domain is social work; "a lot of domains need this" (paraphrase for the Hindi part) | "I think a lot of domains need this." | Vaibhav | ~92% | [QUESTION] (domain confusion repeated from M2) |
| 7 | Romit expects broad usefulness | "based on the application, I feel like it's going to be so much helpful to a lot of people" | Romit | ~93% | [PREFERENCE] |
| 8 | Logistics: Romit needs 1 to 1.5 hours; mornings preferred | "I would require at least 1, 1.5 hours." | Romit | ~62% | [CONSTRAINT] (process) |

No design content beyond scope confirmation.

---

## Three-line summaries

- **M1:** Skills, competencies, EPAs, procedures and essentials are one student-level list, met by counts, thresholds, grades, course pass or sign-off from self, faculty or preceptor. Courses can only softly highlight skills. The report should be the launch page, and extend the existing competency mapping rather than build new.
- **M2:** Romit is unsure of the architecture: entry point, who requires a skill, connection to competency and accreditation. Accreditation has a separate owner. Target is some version by end of October, with a sync every other day.
- **M3:** Scope confirmed as Skills Checklist (not learning contract), based on Sankalp's PRD plus Aarti's coming knowledge dump. No design content.

---

## What this changes or contradicts

Compared against `docs/README.md`, `strategy/05-open-decisions.md`, `strategy/07-gaps-contradictions-defects.md`, `design/brief-v2.md`, and variants A, B, C. All attributions below are Aarti-inferred from M1 unless stated. Nothing here marks an OD decided.

### (a) Contradicts or supersedes a doc claim or hard stop

| # | Doc claim | What the raw call says | Strength | Action |
|---|---|---|---|---|
| a1 | README fact 3: "A skill is narrower than a competency, and must not inherit competency scoring/reporting. [REQ 1.4]" | Skills, competencies, EPAs, procedures, essentials should be "one list" with one set of attributes; "extend the competency" rather than build new (M1 rows 29, 34, 35) | Firm preference from Aarti; she herself hands the decision to Yash and says "we will have to get alignment" (row 30, 38). Not a decision. | Raise with Sankalp: REQ and Aarti disagree on skill vs competency boundary. Do not change nav naming or data model until resolved (this is OD-02). |
| a2 | Do-not-assume #9 / REQ section 14: patient-encounter linkage out of scope | Patient log named as an input source (M1 row 32) | Passing mention in a list of sources, not a requirement from her | Flag as scope tension. Keep out of v1; ask whether "patient log" here is the section 14 feature. |
| a3 | README fact 7 and REQ model: evidence = student submission evaluated by an evaluator | Evidence also arrives automatically from an assessment question, a whole-assessment minimum score, a course grade or course pass, a standalone form (M1 rows 15, 31, 33) | Stated as how real programs work (KASA, nutrition), described as "five ways" | Docs miss this (see c1). Contradicts the assumption that every achievement starts with a student submission. |
| a4 | Hard stop: "completed evaluations immutable", "no default evaluation model" | Not contradicted. Self-attestation as sole sufficient evidence (M1 row 2, 33) is a model option, not a default | n/a | No change. But "just students saying is enough" must be a selectable model, not hidden. |
| a5 | Do-not-assume #10: "Do not show scores/Likert by default" | Consistent. Aarti lists level-based and threshold models as options, not defaults | n/a | No change. |
| a6 | brief-v2 and variants A/B/C treat **Understand/Attainment as a destination separate from Run/Reviews** | "My report should be my launch page" and objection to a separate place to see and trigger (M1 rows 9-12) | Strong, repeated, her own words | See (d). |

### (b) Resolves or sharpens an open decision

| OD | Question | What the calls add | Who / how firm | Status |
|---|---|---|---|---|
| OD-01 | Mapping carry-forward vs catalogue default | Nothing on carry-forward. Sharpens the nature of mapping: "soft mapping" only, shown as emphasis (rows 6, 8) | Aarti-inferred, firm on soft, silent on carry-forward | Still OPEN. Consistent with CM-05. |
| OD-02 | Skills vs competencies/Standards boundary | Pushes toward one unified list with shared attributes; but explicitly deferred to Yash and "alignment" (rows 29, 30, 35, 38) | Aarti-inferred; preference, not a decision | Sharpened, still OPEN. The docs' "separate in v1 with a nullable seam" now conflicts with the stated direction. Needs Sankalp + Yash. |
| OD-06 | Three evaluator roles or program-defined | Adds chains: faculty + preceptor, faculty 1 then faculty 2, self-only (rows 3, 4, 33) | Aarti-inferred, firm as real-world need | Sharpened toward program-defined roles and ordered chains. Model roles as data (already the seam) and add sequencing. Still OPEN. |
| OD-09 | Self-evaluation vs evaluator form identical | Adds "student saying is enough" as a terminal model, which is a different thing from self-evaluation compared against an evaluator | Aarti-inferred | Not resolved; new variant to log. |
| OD-11 | Evaluator/site dimension in reports | Nutrition rule "one person says well, any site" suggests evaluator/site is not a driver for achievement (row 20) | Weak | No change. |
| OD-21 | Setting/rotation/regional minimums | PA minimum procedure counts (333) and per-role activity counts (observe/assist/perform) (rows 16, 19) | Aarti-inferred | Sharpens: counts may need role-in-activity buckets. Still deferred. |
| OD-22 | Frequency scoped by rotation or year | Rotation is "just FYI"; main report ignores it (row 24) | Aarti-inferred, firm | Leans against rotation-scoped frequency in the headline view. Still OPEN, not decided. |
| OD-23 | Learning-contract integration | M3 confirms the original learning-contract framing was replaced by skills checklist | Romit via Aarti | Context only; stays deferred. |
| OD-27 | What is "behind" | Program-level requirement (e.g. 100 skills) and "how many checked off, overall where do they stand" (rows 26-28) | Aarti-inferred | Gives a candidate basis for "behind" but no threshold. OPEN. |
| OD-03, 04, 05, 07, 08, 10, 12-20, 24-26 | | Not discussed | | Unchanged. |

### (c) Docs miss entirely

1. **Evidence from outside skill submissions:** course grade, course pass, whole-assessment minimum score, assessment question, end-of-rotation form question (M1 rows 15, 31). Neither README nor OD list has it.
2. **Program requirements entity** ("defined once and every student should meet", program-level count such as 100 skills, M1 rows 26-27). Docs have per-skill configuration and per-offering mapping, but no program-level requirement rollup or "program requirements" place.
3. **Sign-off chain with sequence** (faculty 1 then faculty 2; faculty plus preceptor) and **"no review needed" self-attestation** as a first-class model.
4. **Observe / assist / perform count buckets** and **three signatures from three different preceptors** (PA passport) as criteria shapes.
5. **Form strategy:** one shared form for all skills vs one form per skill (the 148-form radiation therapy example). Could affect S-09 and OD-04.
6. **Advisors / student-success timeline** consuming the student-level report (M1 row 41).
7. **Accreditation coupling:** accreditation has its own owner (Vishal) and a possible FARMS-portal output tied to pharmacy Standard 7 (M1 row 37, M2 rows 2, 15). Docs say accreditation outputs are out of scope (brief-v2 line 35, REQ section 14); the calls say it is the strategic reason this matters and the beta-customer signal favours accreditation. Not contradicting scope for v1 but the dependency is undocumented.
8. **Module relationship:** both "independent module" and "integrated into other products" (M2 row 4, M1 row 42 "part of student success"). Docs describe Skills only as a standalone product with an Admin and Student app.
9. **Schedule:** "some version" by the last week of October (M2 row 17). Not in docs.
10. **Domain ambiguity:** collaborators still assume social work or nursing interchangeably (M2 row 7, M3 row 6). Docs say nursing first. Worth confirming explicitly.
11. **Existing precedents to inspect:** nutrition, PA, SLP, radiation therapy setups (ask Ankit/Ankita); possible reuse of existing competency mapping.

### (d) Feedback that favours or kills an architecture variant

The only direct design-structure statement is Aarti's "report = launch page = completion page, at student level" (M1 rows 9-12). Romit's own M2 concern (entry point, hierarchy) is a question, not a preference. Nothing in the calls is a verdict on A, B, C or the hybrid by name; the reading below is mine and should be tested.

| Option | Reading | Why |
|---|---|---|
| **A (lifecycle: Set up / Run / Understand)** | **Weakened.** | Puts reporting in "Understand" as a phase after "Run". Aarti objects to a separate place to see what is met and a different place to trigger review. A could still work if Understand rows also carry the trigger action, but this is not how A is drawn. |
| **B (entities: skill / student / course / preceptor)** | **Favoured on this point.** | A student detail page shows counts per skill and triggers review in the same place, which is what she describes ("do this at the student level"). Course detail only showing soft emphasis fits "course is a lens, not a gate". Risk: B has no top-level "program requirements" place (c2). |
| **C (workbench: inbox + cohort board)** | **Mixed.** | A cohort board is a report that can also host actions (matches "report is the launch page"). But C is built around staff queues; Aarti's model centres the student-level checklist, and she wants the student's own dashboard (row 28). C also deletes Home, while the calls never discuss staff queues. |
| **Current hybrid (Home, Skills, Courses, Attainment, Reviews)** | **Partly in conflict.** | Attainment and Reviews as separate nav destinations is the "separate place to see, separate place to trigger" she objects to. Keeping the hybrid means Attainment rows must carry the review trigger, or the two merge. Courses as a destination is fine if it only edits soft mapping. |

Suggested next test (not a decision): before choosing, draw the student-level page of whichever variant survives as "launch page with report, counts per skill, soft course highlights, and the review trigger", and show it to Aarti.

---

## Open questions to bring to the next conversations

1. Skill vs competency: one list or two (OD-02)? Owner of the call: Sankalp with Yash and Aarti. Does Sankalp's REQ section 1.4 still stand?
2. Are automatic achievements from grades, course pass or assessment scores in v1 scope, given the REQ is silent?
3. Is "patient log" the REQ section 14 feature or something lighter?
4. Is there a program-requirements object (e.g. "100 skills") and where does the admin set it?
5. Who owns accreditation output for Skills and when? (Vishal.)
6. Is the domain nursing only, or any program (M2 and M3 show confusion)?
7. Ask Ankit(a) for the nutrition, PA, SLP and radiation therapy setups as real examples.
8. What is the recurring sync with Vaibhav's cadence (every other day) used for, and does he get raw notes of Aarti's sessions?
