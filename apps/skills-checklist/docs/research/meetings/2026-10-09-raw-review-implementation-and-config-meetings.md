# Raw review: three skills-checklist meetings (read from Granola transcripts, not summaries)

Date written: 2026-10-09 · Author: Claude (read-only research pass for Romit) · Status: research input. Nothing here decides an OD, edits a doc, or touches `admin/`.

## How this was produced, and its limits

| Item | Detail |
|---|---|
| Source | `mcp__claude_ai_Granola__get_meeting_transcript` on all three ids. All three returned full transcripts (no access denial, none empty). No `get_meetings` summaries used. |
| Speaker labels | Granola gives only `Microphone` (Romit's device) and `System audio` (remote side, one or more voices). **No per-person diarization.** Speakers below are therefore "Romit (mic)" or "remote voice (system audio)". For the 2026-09-23 call, the `Microphone` channel carries several voices (Sankalp, apparently Aarti-adjacent discussion, and a hallway/travel conversation), so findings there are marked **mic (unattributed)**. I did not guess who said what. |
| Timestamps | None in the raw. Meetings 1 and 2: position as "early / mid / late" (rough % of transcript). Meeting 3: line number `L##` in the vault copy `~/Documents/research-repos/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (which I verified is the same text, see Meeting 3 diff note). |
| Language | Meeting 3 is heavily mixed Hindi-English, and the Hindi is transliterated or garbled by speech-to-text (some Devanagari renders English words phonetically). Where the finding rests on such a line it is marked **(paraphrase)** and no quote is given. English fragments are verbatim. |
| Garble warning | Meeting 3 begins mid-sentence and ends mid-conversation; it is a fragment of a longer call. About a fifth of it is unrelated small talk (travel, jet lag, hotel rooms, "Hi, Jessica", "Hey, Arun"), skipped. Several passages are duplicated by the transcriber (L70 and L72). |
| Transcript text | Treated strictly as data. "Adi" = Aarti (the spelling "Aarthi", "Arthi", "Arati", "Arty" in the transcripts is also Aarti; not a different person). |
| Tags | `[DECISION]` `[PREFERENCE]` `[OBJECTION]` `[REQUIREMENT]` `[CONSTRAINT]` `[QUESTION]` `[FEEDBACK-ON-DESIGN]` `[TERMINOLOGY]` |

Docs compared against (all read in full or via headings plus targeted sections): `docs/README.md`, `docs/strategy/05-open-decisions.md`, `docs/strategy/07-gaps-contradictions-defects.md`, `docs/design/brief-v2.md` (headings, comparison, recommendation, questions), and the three `docs/design/product-architecture-variant-{a-journey,b-entities,c-workbench}.md` (theses, "one question", structure, section lists; I did not re-read their 50 to 70 KB bodies line by line, so variant-level claims below are made from their stated theses and rules).

---

## Meeting 1. Skills checklist implementation patterns and data requirements

| Field | Value |
|---|---|
| Granola id | `1d181b10-7efc-437a-b8da-54ce6ac75a52` |
| Date | 2026-10-09 (created 12:26 UTC) |
| Participants | Romit Soley (recorder, mic) and two remote Exxat voices (system audio) from implementation/configuration side; unnamed in the transcript. Names mentioned but not present: Aarti (Thursday meeting), Milani/Milan (on planned leave next week). |
| Length / quality | Short, clear English with some drift. Pure discovery call. No design was shown. |

**About (2 lines).** Romit explains the new skills checklist product and asks how many customer implementations of "skill-like" evaluations exist per domain and what shapes they take. The remote side describes the common set-up variants from memory and says the real answer needs a database query, which becomes an Excel hand-off and weekly check-ins.

### Findings

| # | Finding | Quote (verbatim) | Speaker | Position | Tag |
|---|---|---|---|---|---|
| 1.1 | Today, schools "hack" skills tracking with large sets of ordinary evaluation forms; the new product replaces that pattern. | "here are like 140 forms that the preceptors and faculty are going to evaluate a student." | Romit (mic) | mid, ~35% | [REQUIREMENT] |
| 1.2 | Existing domains where this has been done: SLP (transcribed "PASLP"), nutrition, radiation therapy. | "In like PASLP, nutrition, radiation therapy." | Romit (mic) | early, ~12% | [REQUIREMENT] |
| 1.3 | Romit frames the umbrella as broader than skills: competencies, EPAs, procedures all evaluated. | "skills checklist, competency, EPAs, procedures, like they are all evaluated." | Romit (mic) | early, ~25% | [TERMINOLOGY] |
| 1.4 | Remote voice probes scope: CLO/SLO too? Romit says yes, and adds course mapping and the CASA form. | "course mapping is also going to be part of it. And also I think the CASA form." | Romit (mic) | early, ~30% | [REQUIREMENT] |
| 1.5 | Customer set-ups differ: one template per domain; forms split by skill, by rotation, or by course, depending on how the school builds its curriculum. | "those forms are separated by skills, okay, or by rotation or by course as well." | remote voice | mid, ~40% | [REQUIREMENT] |
| 1.6 | Schools that do not split courses by skill keep a few courses and split inside one form. | "they keep just a number of courses and then they bifurcate it inside the form." | remote voice | mid, ~42% | [REQUIREMENT] |
| 1.7 | **Multi-response form pattern**: one form, student submits many records, each tied to one skill picked from a dropdown or radio list, over days. | "student can submit multiple records. Okay, like each record can be associated with a particular skill." | remote voice | mid, ~45% | [REQUIREMENT] |
| 1.8 | Romit confirms the model he heard: one form, many responses, each response linked to a skill. | "there'll be multiple responses and every response will connect to the skills that the student wants to associate." | Romit (mic) | mid, ~47% | [TERMINOLOGY] |
| 1.9 | The remote voice calls this "ideal" for nutrition and expects different ideal formats for SLP and radiology. Domain variation is real. | "there might be a different ideal format for SLP and radiology and yeah, other domains" | remote voice | mid, ~55% | [CONSTRAINT] |
| 1.10 | Romit's product intent: enabled by default; students see which skills to work on or have passed; each skill has its own evaluation criteria. | "it will be enabled by default. And the students will be able to see that, okay, these are the skills that I need to work on" | Romit (mic) | mid, ~58% | [REQUIREMENT] |
| 1.11 | Romit says the existing FAST (Exxat forms engine) formats stay the same; what changes is the landing page / insights. **This is a materially different scope statement than the docs' "standardised, config-generated form".** | "all of the FAST formats that We already have, it's going to be the same." | Romit (mic) | mid, ~59% | [REQUIREMENT] |
| 1.12 | Data wanted per domain and per university, as an Excel sheet: evaluation types, grading processes, entry points (course vs placement), whether grading is at placement level only, whether skills attach to end-of-rotation, an exam question, or an assessment. | "What are the different types of grading processes that are being used per domain? What's their like entry point, like whether for courses and like for placements?" | Romit (mic) | mid-late, ~65% | [QUESTION] |
| 1.13 | Other questions Romit wants counted: how many universities use self-attestation; document upload; scoring versus sign-off. | "how many universities are actually doing self-attestation as a part of skills" | Romit (mic) | late, ~78% | [QUESTION] |
| 1.14 | Remote voice: self-attestation details (signature vs open text vs checkbox) are "deeper level" and need form-by-form inspection, not a high-level query. | "we would go inside each format, okay, and we'll see whether self-attestation is there or not" | remote voice | late, ~80% | [CONSTRAINT] |
| 1.15 | A high-level inventory of main scenarios should cover most of the evaluations but even that needs time to design the queries. | "Okay, so in high level, we can just simply put major scenarios. Okay. That covers our 70 to 80% evaluations." | remote voice | late, ~75% | [CONSTRAINT] |
| 1.16 | Design decisions are explicitly waiting on this data. | "based on that, like, we need to make certain design decisions also." | Romit (mic) | late, ~90% | [CONSTRAINT] |
| 1.17 | Process: Romit emails the scenario list; remote team replies what they can share before next Thursday's meeting with Aarti; then weekly syncs "2 to 3 more times". | "I have a meeting on Thursday with Aarti." | Romit (mic) | late, ~72% | [DECISION] (logistics only) |

### Open questions raised
- How many implementations per domain, per university, and which of the permutation types (1.5 to 1.7) dominate. Unanswered; needs a query.
- What fraction use self-attestation and what form it takes (1.13, 1.14). Unanswered.

### Small talk skipped
Audio check at start, thanks and goodbyes, leave schedules.

---

## Meeting 2. Skill checklist product configurations and evaluation approaches

| Field | Value |
|---|---|
| Granola id | `42543caf-025d-4b53-98bf-26633068c8b2` |
| Date | 2026-10-09 (created 11:55 UTC; Romit is in New Jersey, ~8 AM) |
| Participants | Romit Soley (mic) and one senior remote Exxat voice (system audio), unnamed. Named but not present: Milan Kund (senior, "great experience of configurations"), Ankit Kavra (product owner), Shabir (spelled "Shapit"/"Shabir"), Aarti (Romit meets her that evening). |
| Length / quality | Very short (about 4 minutes of content). A routing call, almost no design content. |

**About (2 lines).** Romit asks who can explain how Exxat has configured skill-style evaluations for customers. The remote voice declines an urgent data pull because the team is on client delivery, offers a timeline later, and creates a chat group with Milan and Shabir.

### Findings

| # | Finding | Quote (verbatim) | Speaker | Position | Tag |
|---|---|---|---|---|---|
| 2.1 | Romit's definition of the product: it formalises what nursing and other domains already do through evaluations. | "in nursing and like other domains, we are evaluating student skills based on evaluations." | Romit (mic) | early, ~25% | [TERMINOLOGY] |
| 2.2 | Romit's research aim: which approaches Exxat has taken and which universities asked for something called skills checklist. | "which university have like asked us to do something like that." | Romit (mic) | early, ~30% | [QUESTION] |
| 2.3 | Remote voice's interpretation of the product: integrate with Competency and EPA for domains such as SLP and nutrition. This is the delivery team's mental model. | "which we are planning to integrate with Competency, EPA, etc." | remote voice | early, ~12% | [TERMINOLOGY] |
| 2.4 | Configuration knowledge sits with Milan (configurations) and Ankit (product owner); a data-based list is the route. | "We can try figuring out from the data which we have." | remote voice | mid, ~45% | [CONSTRAINT] |
| 2.5 | Data is not available on an emergency basis; delivery work takes priority; a timeline will be given. | "it is not possible on the emergency basis because right now our team is delivering the client's delivery." | remote voice | mid-late, ~60% | [CONSTRAINT] |
| 2.6 | Romit accepts the wait. Evidence for design: no hard configuration inventory exists yet to design from. | "Yeah, no problem. Not a problem." | Romit (mic) | late, ~65% | [DECISION] (logistics) |

### Open questions raised
- Who owns the answer, and by when (timeline promised, no date given).

### Small talk skipped
Greetings, time zones, goodbyes.

---

## Meeting 3. Skills checklist with Sankalp (2026-09-23)

| Field | Value |
|---|---|
| Granola id | `eabd5c5d-1b74-487e-b3fb-82c8e55a924e` |
| Date | 2026-09-23 (created 16:12 UTC) |
| Participants | Romit Soley (recorder). The microphone channel holds several voices; from content: Sankalp (product, the config and requirements owner), a nursing-side contributor, and at least one hallway/travel conversation. Named in speech: Sarah (nursing SME; "talk to Sarah"), Aarti, Ankit (Q4 learning-contract build), Vishakha, Jessica, Darshan (used as an example), "cash team" (probably FAST team, mis-transcribed). Attribution of any single line is **unreliable**. |
| Length / quality | Long, fragmentary, ~40% mixed Hindi-English, begins and ends mid-sentence. |
| Diff vs vault copy | See "Diff against the vault copy" below. |

**About (2 lines).** Sankalp walks Romit through the four ways a school can define "skill achieved" (independence level, met/unmet, met/unmet plus questions, score-based), how skills map to courses, categories and tags, reporting wants, upload-and-configure, and how a social work learning contract could consume skills. It ends with a plan to prototype quickly, get Aarti and Sarah's feedback, and talk to the FAST team in Q4.

### Findings

Position = vault line number (`L##`). Quote is verbatim English; **(paraphrase)** = Hindi-English line summarised, no quote.

| # | Finding | Quote (verbatim) or paraphrase | Speaker | Pos | Tag |
|---|---|---|---|---|---|
| 3.1 | Achievement by independence: counts of attempts do not equal skilled unless the independent-count is reached. | "the student would still not be considered as skillful in that particular skill because they haven't done it 3 times independently" | mic (unattributed) | L10 | [REQUIREMENT] |
| 3.2 | Met/unmet plus yes/no questions: the school defines the logic; baseline is all-yes. | "Even if one question is no, it means we'll not consider that as successful demonstration of that skill" | mic (unattributed) | L10 | [REQUIREMENT] |
| 3.3 | Admin must also choose whether all questions or only specific ones must be "yes". | Paraphrase of L12: whether all questions, or specific questions, must be marked yes is a school setting. | mic (unattributed) | L12 | [REQUIREMENT] |
| 3.4 | Score-based is the rare fourth option; skills are not normally scored. | "typically skills are not scored" | mic (unattributed) | L12 | [PREFERENCE] |
| 3.5 | Skills versus competencies distinction. | "Skills are demonstrated, they are not like as complicated as competencies" | mic (unattributed) | L12 | [TERMINOLOGY] |
| 3.6 | Frequency (count of demonstrations) always exists; open question whether it can be scoped to rotation or academic year. | "can that be rotation as well as like academic year based" | mic (unattributed) | L16 | [QUESTION] |
| 3.7 | Skills must be mapped to courses; the school sets what "met" means per skill. | "Skills have to be mapped to courses" | mic (unattributed) | L18 | [REQUIREMENT] |
| 3.8 | A skill can sit in many clinical courses and be mandatory in just one. | "So a skill could be part of all 6 clinical courses but could be mandated in one" | mic (unattributed) | L24 | [REQUIREMENT] |
| 3.9 | **Student selector has two sections**: mandatory and recommended for this course. | "it must have 2 sections, either like mandatory for this course or recommended for this course" | mic (unattributed) | L28 | [FEEDBACK-ON-DESIGN] |
| 3.10 | Students can still submit skills not mapped to the course. | "they can still apply for it and get a, you know, evaluation done for that" | mic (unattributed) | L28 | [REQUIREMENT] |
| 3.11 | Mapping is guidance, not eligibility. | "it's more like a recommendation" | mic (unattributed) | L30 | [DECISION] (consistent with REQ CM-05) |
| 3.12 | Terminology wobble: "mandatory / non-mandatory" is also said and described as fine. | Paraphrase of L30: mandatory vs non-mandatory is also acceptable wording. | mic (unattributed) | L30 | [TERMINOLOGY] |
| 3.13 | Key design principle: do not let schools create many form templates. | "we don't want schools to like have like a lot of different templates and types of forms" | mic (unattributed) | L40 | [PREFERENCE] |
| 3.14 | Evaluator sees only the question(s) the configuration implies. | "the only question the preceptor needs to answer is whether the student met that skill or not" | mic (unattributed) | L42 | [REQUIREMENT] |
| 3.15 | Goal: standardise the whole experience. | "we're basically trying to standardize the entire experience" | mic (unattributed) | L46 | [DECISION] (stated direction) |
| 3.16 | Student flow: open the clinical course, see the skill list, select a skill, send for preceptor review. | Paraphrase of L46: coursework, then clinical course, then listed skills (mandated or recommended), then select and send for review. | mic (unattributed) | L46 | [FEEDBACK-ON-DESIGN] |
| 3.17 | Categories: each skill belongs to one category, used for reporting. | "usually like a skill would be part of one category only" | mic (unattributed) | L70 | [REQUIREMENT] |
| 3.18 | Tags are proposed for cross-cutting reports (easy/hard, complicated) because a skill can be in only one category. | "since a skill can be only part of one category" | mic (unattributed) | L70, L72 | [REQUIREMENT] |
| 3.19 | Reporting wants: where is the cohort lagging per skill; and per student, the bottom slice behind on completion. | "Bottom 20% that are like lagging behind in terms of completion of skills" | mic (unattributed) | L72 | [REQUIREMENT] |
| 3.20 | Past-tool heat maps exist; to be verified with Sarah. | "Heatmap reports and all, where that we need to talk to Sarah" | mic (unattributed) | L74 | [QUESTION] |
| 3.21 | Evaluator-consistency view (which preceptor scores low) is explicitly deferred. | "That could be phase 2, could be later. Like, not every school might want it" | mic (unattributed) | L76 | [DECISION] (deferral, one speaker) |
| 3.22 | Interpretation risk of 3.21: low scores can mean weak students or a harsh rater. | "none of the students are actually good in that skill" | mic (unattributed) | L76 | [OBJECTION] |
| 3.23 | Some skills need "advanced" set-up; others the simple one. Configuration is per skill. | "there would be skills where they need a little bit more advanced setup versus some of them like which is a simple setup" | mic (unattributed) | L78 | [REQUIREMENT] |
| 3.24 | Configuration does not vary by course. | "That configuration will remain for the skill irrespective of whether it is mapped to 1 clinical course or 5 clinical courses" | mic (unattributed) | L78 | [DECISION] (consistent with REQ) |
| 3.25 | Admins review the preceptor's score before it counts; may send back for re-scoring; then the final score is captured. | "the admins of the facility would want to first see what the preceptor has scored" | mic (unattributed) | L80 | [REQUIREMENT] |
| 3.26 | Return path ambiguity: who it goes back to is not clear from the words. | "they might want to return it back to them saying" | mic (unattributed) | L80 | [QUESTION] (bears on OD-16) |
| 3.27 | Keep forms restricted to the configuration; do not let schools build multiple form types (mixed lines). | "I would say we should keep it restricted to the configuration and not allow schools to do multiple" | mic (unattributed) | L86 | [PREFERENCE] |
| 3.28 | Evaluator links are unique per request. | "delegator links are always unique" | mic (unattributed) | L86 | [CONSTRAINT] |
| 3.29 | **Technical unknown**: can a FAST form be generated from configuration at runtime, or must the school pre-create templates? "It will be both ways" was floated. | "I don't know whether like basis some configuration can dynamically generate a fast form" | mic (unattributed) | L86 | [QUESTION] |
| 3.30 | QR-code idea: raised in garbled passage about returning responses to the platform. Speaker's intent unclear. | Paraphrase of L82: mentions QR codes for the delegated forms and a response being fed back to the main platform; asks who would scan. | mic (unattributed) | L82 | [QUESTION] |
| 3.31 | Remediation: Exxat currently enables evaluation and reports, but has no remediation plans. | "remediation plans built in our system" | mic (unattributed) | L102 | [CONSTRAINT] |
| 3.32 | Open question whether remediation belongs in phase 1. | "Do we need to do it in phase 1?" | mic (unattributed) | L104 | [QUESTION] |
| 3.33 | Accreditation asks for improvement planning, not specific skill lists. | "continuous, uh, Improvement plan for students" | mic (unattributed) | L100 | [REQUIREMENT] (context only) |
| 3.34 | The four-state evaluation model shown to Aarti is a reference, not a commitment. | "This is more like a reference document, like not necessary that we will build this only" | mic (unattributed) | L108 | [PREFERENCE] |
| 3.35 | Lab/simulation is not a captured location today; schools work around it. | "So we don't capture even like lab as a separate location" | mic (unattributed) | L110 | [REQUIREMENT] |
| 3.36 | Workaround: lab technician added as placement faculty. Proposal: free-email evaluators. | "They add a lab technician as a placement faculty for some courses" | mic (unattributed) | L110 | [REQUIREMENT] |
| 3.37 | Schools hold 40 to 50 skills in Word/Excel/PDF; asking them to configure each by hand is a burden; so allow upload. | "we'll have to even use AI to scan through because we don't want to restrict them to specific document types" | mic (unattributed) | L112 | [REQUIREMENT] |
| 3.38 | Uploads will usually carry only name and description, not the evaluation model. | "They might just have a skill description" | mic (unattributed) | L114 | [CONSTRAINT] |
| 3.39 | Therefore: separate adding from configuring; imported skills cannot be activated until configured, then saved, then activated. | Paraphrase of L114: skills cannot be activated until configured; a separate activation flow is needed. | mic (unattributed) | L114 | [REQUIREMENT] (bears on OD-15) |
| 3.40 | Template-system worry: mapping school workflow into Exxat's could itself be a challenge. | Paraphrase of L114: updating their workflow with ours is also going to be a challenge if there is a template system. | mic (unattributed) | L114 | [OBJECTION] |
| 3.41 | Nursing stakeholders called out: course-level mandatory/non-mandatory, and setting-specific minimums. | "you have to complete this skill in this setting at least once" | mic (unattributed) | L116 | [REQUIREMENT] |
| 3.42 | Minimums can nest: setting-based, rotation-based, regional; and licensure-exam prep checklists are a wish. | "it's like a wish list also" | mic (unattributed) | L118 | [QUESTION] |
| 3.43 | Order of work: library, then per-skill configuration, then thresholds at various levels, then the student/evaluator workflow. | Paraphrase of L118 to L120: build the library, configure ways to meet skills, set minimum thresholds, then decide student rating/self-eval workflow per skill. | mic (unattributed) | L118 to 120 | [DECISION] (informal sequence) |
| 3.44 | Self-evaluation is part of per-skill workflow: student rates self then sends to instructor. | Paraphrase of L120. | mic (unattributed) | L120 | [REQUIREMENT] |
| 3.45 | Where skills live for the student: a "Skills" section within course activities, alongside forms, evaluations, patient log. | Paraphrase of L122. | mic (unattributed) | L122 | [FEEDBACK-ON-DESIGN] |
| 3.46 | Open: how the self-eval form is rendered and behaves is a FAST-team topic for Q4, so build starts Q1. | Paraphrase of L122 to L124: technical conversation with FAST team in Q4, direct build in Q1. | mic (unattributed) | L122 to 124 | [CONSTRAINT] |
| 3.47 | Demand by domain: nursing is the biggest; PA also; others vary in naming. | "Biggest domain that is asking for it, but skills are also used in, I think, PA" | mic (unattributed) | L124 | [REQUIREMENT] |
| 3.48 | PT and similar domains often fold skills into competencies. | Paraphrase of L126. | mic (unattributed) | L126 | [TERMINOLOGY] |
| 3.49 | Learning contract is a social-work artefact that precedes skills; students pre-define which skills they will achieve. | "learning contract is again like something very specific to social work skills" | mic (unattributed) | L166 | [REQUIREMENT] |
| 3.50 | Skills library stays a separate entity; the contract pulls skills from it. | Paraphrase of L152: the skills library would be separate; what was configured there would also be pulled in. | mic (unattributed) | L152 | [DECISION] (informal agreement) |
| 3.51 | Skill checklist and learning contract should work together rather than as separate flows. | "have skill checklist and learning contract working together" | mic (unattributed) | L154 | [PREFERENCE] |
| 3.52 | The contract should select from skills that exist. | "you should be able to pick from skills that are available and then bring it in" | mic (unattributed) | L158 | [REQUIREMENT] |
| 3.53 | Plan: quick, non-exhaustive prototype to get Aarti's feedback; sit with Vishakha and Sarah for nursing. | Paraphrase of L172 to L174. | mic (unattributed) | L172 to 174 | [DECISION] (process) |
| 3.54 | Skills and competencies should be connected across disciplines. | "I really see Skills and all of this should be all connected, um, in every discipline" | mic (unattributed) | L174 | [PREFERENCE] |
| 3.55 | Generic solution; no shipped skills list; the school defines its own. | "we have to build like a generic solution" | mic (unattributed) | L176 | [DECISION] (consistent with REQ SL-01) |
| 3.56 | Same point, from the prototype maker's side. | "I am not giving them any predefined skill list" | mic (unattributed) | L176 | [DECISION] |
| 3.57 | Parallel research is under way on emerging domains. | "I'm researching four domains emerging domains pharmacy, NDDO, dentistry" | mic (unattributed) | L180 | [REQUIREMENT] (scope context) |

### Open questions raised
- Frequency scoped by rotation or academic year (3.6). Not answered.
- Who the administrator return goes to (3.26). Not answered.
- Whether FAST can generate forms from config (3.29), owned by the FAST team, Q4.
- Remediation in phase 1 (3.32). Not answered.
- Whether setting/rotation/regional minimums and licensure checklists are wanted beyond per-setting (3.42).
- Heat-map usefulness (3.20): to ask Sarah.

### Diff against the vault copy

I compared the Granola raw against `Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (186 lines, 48,763 bytes).
- Same start (mid-sentence "Right, and 10 times with minimal assistance") and same end ("But yeah, you want to meet with him?").
- About 50 distinctive phrases spot-checked from beginning, middle and end all match, including every English quote in this file, which I grepped with exact-match against the vault copy before writing.
- Vault file adds only a front-matter header and a title and splits long paragraphs by line break.
- **Conclusion: no substantive difference found.** Limits: this is a phrase-level check, not a byte-level diff; I could not pipe the tool output to `diff`. If byte-exactness matters, re-export from Granola and run `diff`.

---

# What this changes or contradicts

Basis: `docs/README.md`, `strategy/05`, `strategy/07`, `design/brief-v2.md`, three variants. "Firmness" is how firmly the speaker stated it; none of this decides an OD.

## (a) Contradicts or supersedes a doc claim or hard stop

| # | Item | Source here | Doc claim | Verdict |
|---|---|---|---|---|
| a1 | **Existing FAST formats stay "the same"; only landing page/insights differ.** | Meeting 1, finding 1.11 (Romit, plain statement) | README fact 10 and §14 put migration from Evaluations out of scope; REQ SC/ST imply one standard configured form; Meeting 3 3.13 and 3.46 say standardise and possibly generate forms | Not a hard contradiction, but two incompatible readings of the form layer: reuse FAST forms as-is, versus a config-driven standardised form. **Needs a decision from Romit/Sankalp/FAST team.** Docs do not name the question. |
| a2 | **Scope umbrella: competencies, EPAs, procedures, CLO/SLO, CASA form all inside "skills checklist".** | Meeting 1, 1.3, 1.4, 2.3 (Romit and the delivery lead) | README fact 3: a skill is narrower than a competency and must not inherit competency scoring/reporting `[REQ §1.4]`; OD-02 keeps competency separate in v1 | Direct tension. Either the delivery team's mental model is wider than the REQ, or Romit is describing the long-term umbrella. The REQ still governs; flag it to Aarti on Thursday. Never expand scope on one call. |
| a3 | "Enabled by default." | Meeting 1, 1.10 | README fact 2: Prism ships no skills; nothing pre-filled | Compatible if "enabled" means the module is on and the library is empty. Wording risk only; make it explicit. |
| a4 | Return-to-whom language. | Meeting 3, 3.26 | DEFECT-03 and OD-16 | Not resolved. The transcript's "return it back to them... you rescore it" leans toward the evaluator but the pronoun is ambiguous. Treat as weak signal. |
| a5 | `do-not-assume #12` (no heat maps, preceptor-consistency, learning-contract linkage in v1) | Meeting 3, 3.21, 3.50 to 3.52 | Held | **Confirmed, not contradicted.** Speakers themselves call evaluator consistency "phase 2" and the learning contract a separate Q4 build. QR codes (3.30) remain unclear: possibly a mis-transcription of delegated links. |
| a6 | `do-not-assume #10` (no scores by default) | 3.4 | Held | Confirmed: "typically skills are not scored". |
| a7 | Conflict C-3 (mandatory/recommended vs mandatory/non-mandatory) | 3.9, 3.12 | Doc says use REQ terms | Confirmed that the speakers used both; no new information. |

## (b) Resolves or sharpens an open decision (none marked decided)

| OD | What the transcripts add | Who, how firm | Effect |
|---|---|---|---|
| OD-12 (interpretation proposes model or stops at name/description) | Uploaded lists "might just have a skill description"; AI scan wanted so as not to restrict document types (3.37, 3.38) | Mic (unattributed), stated as expectation, moderately firm | Supports the doc's recommendation (stop at description). Open. |
| OD-15 (activation as separate state) | Paraphrased: skills cannot be activated until configured; a separate activation flow needed (3.39) | Mic (unattributed), a proposal ("will have to") | Sharpens the question: the call explicitly wants an activation step. Still open. |
| OD-11 (expose evaluator/site dimension) | Evaluator-consistency view called phase 2, "not every school might want it"; interpretation risk articulated (3.21, 3.22) | Mic (unattributed), moderately firm | Matches the doc's "capture now, expose later". Open. |
| OD-22 (frequency by rotation or academic year) | Asked as a question, no answer (3.6) | Question only | No progress. Remains open. |
| OD-21 (setting/rotation/regional minimums, licensure checklists) | "wish list" framing (3.42); setting-specific "at least once" confirmed as a stakeholder ask (3.41) | Mic (unattributed), speculative for regional; firmer for setting | Setting minimum is covered by REQ SC-11; the nested levels stay a wish. Open. |
| OD-23 (learning contract) | Skills library separate; contract pulls from it; Q4 build; "working together" (3.50 to 3.52) | Mic (unattributed), consensual in the room | Sharpens the shape (consumer of the library, separate entity) but not the timing. Open. Relates to OD-05 (see below). |
| OD-05 (external evaluator record: Skills-only vs Prism-wide) | Lab technician currently added as placement faculty; free-email evaluator idea (3.35, 3.36) | Mic (unattributed), floated | Shows the need for a lightweight evaluator record outside placement faculty; does not say Prism-wide. Open. |
| OD-16 (return target) | Ambiguous pronoun (3.26) | Weak | Nothing decided. |
| OD-27 (what "behind" means) | "Bottom 20%... lagging behind in terms of completion of skills" (3.19) is a candidate definition (rank-based, not threshold-based) | Mic (unattributed), an example, not a rule | Adds a rank-based option to the doc's open question. Open. |
| OD-09 (self-eval form identical to evaluator's) | Self-eval is a per-skill workflow choice (3.44); a design for another product had students and preceptors evaluate with the same configuration | Mic (unattributed) | Mild support for "one form, two respondents". Open. |
| OD-02 (skill vs competency) | "Skills ... should be all connected ... in every discipline" (3.54); PT folds skills into competency (3.48); Meeting 1 umbrella (1.3) | Mixed | Pressure toward connection; docs' nullable M:N seam is the right shape. Open. |
| OD-01, 03, 04, 06, 07, 08, 10, 13, 14, 17, 18 | Nothing relevant said | n/a | No change. |

## (c) Things the docs miss entirely (or I could not find in the five docs read)

1. **Multi-response form pattern** (one form, many records, each tied to a skill) and the three curriculum splits (by skill, rotation, course) as customer reality (1.5 to 1.7). Relevant to how existing data would map onto the new model. Not in the docs I read.
2. **Entry points beyond placements**: skills attached to end-of-rotation, exam questions, assessments (1.12). Relevant to what feeds evidence. Possibly out of REQ scope; needs a ruling.
3. **Data not yet in hand**: no per-domain, per-university inventory exists; counts will arrive as an Excel. Any claim about "the common set-up" is currently unevidenced beyond what Sankalp described.
4. **FAST dependency**: whether forms can be generated from configuration is explicitly unknown, to be settled with the FAST team in Q4 so Q1 can build (3.29, 3.46). Docs treat the form as given.
5. **Where skills live for students**: a "Skills" section inside the clinical course's activities, next to forms, evaluations and patient log (3.45). Docs have a student log sheet; the course-activity placement is a nav/IA constraint worth carrying.
6. **Self-attestation and document-upload questions** (1.13) as a research item.
7. **Accreditation asks for improvement plans, not skill lists** (3.33), a reason remediation keeps coming up although §14 excludes it.
8. **Thursday review with Aarti** (the Excel, high-level scenarios) as the next design checkpoint; and the stated stakeholders for follow-up (Milan, Ankit, Shabir, Sarah, Vishakha).

## (d) Feedback bearing on architecture variants

Nothing in the three transcripts is feedback on the variants or on any screen (they predate them or did not show them). The following is structural evidence only, inference, not a vote.

| Variant | Evidence for | Evidence against / neutral |
|---|---|---|
| **A (lifecycle)** | Admin set-up order is stated as a sequence: library, then per-skill config, then thresholds, then workflow (3.43); upload, configure, activate (3.39). Supports a guided "Set up" spine. | The weekly experience (review, lagging cohort) is not served by a journey view alone. |
| **B (entities)** | Skills library is a separate entity consumed by other things (learning contract, 3.50 to 3.52); category/tag structure is an object property (3.17, 3.18); configuration is per skill, independent of course (3.24). Supports a Skill detail page as the noun. | Nothing said about students, courses or evaluators as directories. |
| **C (workbench)** | Admin review before score finalises (3.25) supports an inbox of items to review; "bottom 20%" cohort view (3.19) supports a cohort board. | Heat-map and evaluator views are called phase 2 (3.21); the matrix as the central canvas is not supported by any statement. Deferring the matrix, as the hybrid does, is consistent. |
| **Hybrid (brief-v2 recommendation)** | Student-side placement inside course activities (3.45) and the two-section selector (3.9) fit the hybrid's student log sheet. A-then-B Home is consistent with set-up first, weekly worklist after. | No contradiction found. |

**Net.** The evidence does not kill any variant. It mildly favours the hybrid ordering (set-up spine first, review worklist, matrix last) and supports the entity view for the Skill object.

---

## Top-line caveats for Romit

1. Attribution on 2026-09-23 is unreliable; do not cite any line to "Sankalp" or "Aarti" from this transcript without checking.
2. The two 2026-10-09 calls are discovery and routing; they add scope questions (a1, a2) rather than design direction.
3. The data that would settle "what is common" has not arrived. Re-read this file after the Excel lands.
