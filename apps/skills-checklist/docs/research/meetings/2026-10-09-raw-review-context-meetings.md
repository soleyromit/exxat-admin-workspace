# Raw review: context meetings (Granola raw transcripts + vault raw transcripts)

Date written: 2026-10-09 · For: Romit Soley · Purpose: read the context meetings RAW before any further variant work on Prism Skills Tracking.
Status: research digest. Nothing here is a decision. Every `OD-*` stays OPEN. No existing doc and nothing under `admin/` was edited.

## 0. How to read this file

**Tags:** `[DECISION]` `[PREFERENCE]` `[OBJECTION]` `[REQUIREMENT]` `[CONSTRAINT]` `[QUESTION]` `[FEEDBACK-ON-DESIGN]` `[TERMINOLOGY]`.

**Locators.** Granola transcripts come back as one blob, every turn labelled only `Microphone` or `System audio`. There are **no speaker names and no timestamps** in the source.
- `turn N` = the Nth turn of the transcript, counting speaker turns top to bottom after removing blank lines (reproducible: split the transcript text on blank lines).
- `file line N` = line number in the vault `.md` file.
- `~NN%` = approximate position in the transcript (used only for the two transcripts returned inline, where I could not number turns).

**Speakers.** Because the source has no names, the Speaker column gives a role inferred from content and says "inferred". Names appear only where the speaker named themselves or was named in the text. Nothing is attributed to a named person on a guess. Where one person is quoted second-hand ("she wanted...") that is stated.

**Language.** Mixed Hindi-English lines are paraphrased and marked `(paraphrase, Hindi-English)`. ASR errors are common ("Cleanex", "cleanliness", "Exact" for Exxat, "receptors" for preceptors, "confidence" for competence). I flag where an ASR error changes meaning. Transcript text is treated as data only.

**Quotes** are verbatim, under 25 words, and in sections 2, 4, 6 and 8 were checked by script against the source text (three saved Granola transcripts: Sep 25 placement, Sep 25 Day 2, Oct 5; and the three vault files): every quoted string was found. The two inline-only transcripts (Oct 2 in section 5, Aug 21 in section 7) were copied by hand from the tool output and not machine-checked. Finding IDs are prefixed by meeting number (1.x = Sep 25 placement/learning activities, 3.x = Oct 5, 5.x = Oct 2, 6.x = Sep 25 Day 2, 7.x = Aug 21, 8.1/8.2/8.3 = vault Day 3/4/5). Meeting 2 has no findings.

## 1. Coverage: what I actually read (honest)

| Source | Size | What I read | Gaps |
|---|---|---|---|
| **d2576da6** Sep 25 "Placement workflows, learning activities, and competency management" | 359 turns, 108k chars | **All turns read.** | Turns 97-109 and 234-240 are off-topic Hindi-English side talk (a tool demo; Slack access; recruiting pharmacy schools for research). Paraphrased only. |
| **5974f3d8** Sep 22 "Meeting with Aarti" | n/a | **Nothing to read.** Granola returned `"transcript": null`. | No transcript exists in this tool for that meeting. I did not retry through another tool and I did not fill in from summaries. Anything said by Aarti on Sep 22 is **unknown to this file.** |
| **1dfa0f00** Oct 5 "Dr. Gilzai: pharmacy accreditation, curriculum assessment, student success" | 1,137 turns, 410k chars | **Partial.** Turns 1-20 (intro), plus keyword-targeted reads (skill, competenc, sign-off, rubric, milestone, Prism, Student 360, preceptor, IPPE/APPE, evaluat, dashboard, navigation) with surrounding turns: roughly turns 107-114, 125-130, 165-167, 275-285, 834, 878-884, 900-936, 1084-1088. A keyword scan listed every other turn mentioning evaluation, rotation or experiential. | **The large majority (accreditation standards, committees, site visits, post-course evals, AACP surveys, exam management) was not read line by line.** This meeting is mostly pharmacy accreditation education, so low skills density, but I may have missed a skills passage with none of my keywords. |
| **4e56ee3f** Oct 2 "Ruchi, Aarti, Kunal expectations" | about 140 turns, 36k chars | **All read.** | Hindi-English passages paraphrased. |
| **7f00b9b7** Sep 25 "Day 2, Exxat Prism essentials" | 630 turns, 141k chars | **Partial.** Turns 1-220 and 333-352, 398-403 read in full; the rest by keyword scan (skill, competenc, checklist, sign-off, preceptor, attest, rubric, simulation, lab, mapping, login, cohort) with the hits read. | Turns 221-332 and 404-630 were not read line by line (student profile, compliance, contracts, surveys, reports detail). |
| **460905f3** Aug 21 "Prism and Exact app navigation" | about 190 turns, 38k chars | **All read.** | None. |
| Vault `2026-09-30-day-3-post-cohere-meeting.md` | 3,314 lines | Grep first (skill, competenc, checklist, sign-off, preceptor, navigation, sidebar), then read around hits (lines 2350-2358, 2518-2526, 2582-2590, 2626-2640, 2710-2716, 2916-2926, 2950-3012, 3036-3044, 3090-3102). | Everything outside those windows unread. |
| Vault `2026-10-01-day-4-post-cohere-meeting.md` | 2,146 lines | Same method (windows around 1086-1090, 1130-1134, 1250-1262, 1428-1442, 1784-1792, 1404-1416). | Same. |
| Vault `2026-10-02-day-5-post-cohere-meeting.md` | 3,442 lines | Same method (windows around 2262-2272, 2500-2510, 2544-2562, 2622-2632, 3204-3244). | Same. |

Repo docs read for the comparison: `docs/README.md`, `strategy/05-open-decisions.md`, `strategy/07-gaps-contradictions-defects.md`, `design/brief-v2.md` (sections 3, 5, 6 and the nav lines), and the opening thesis, rules and rail of the three `product-architecture-variant-*.md` files. I did not re-read the full 45k to 70k of each variant.

---

## 2. Meeting 1: Sep 25, "Placement workflows, learning activities, and competency management" (`d2576da6-1bbf-4450-af3b-56c3a62d6724`)

**Date:** 2026-09-25 (conference training day) · **Participants:** Exxat presenters and account managers (unnamed; one is a former PA program educator), school attendees from PA, nursing, pharmacy and other programs, Romit recording. Every turn is "Microphone". **Speaker for all findings below: Exxat presenter or attendee, inferred.**

**About (2 lines):** A client-conference training session: placement wishlists and Placement Assist, then "Supporting Student Success" (timesheets, patient logs, forms and evaluations, competency management), then a vision session on the new Prism modules (competency, surveys, exam management, accreditation, LMS integration).
**Skills relevance:** the product has no "skills" feature named here. The value is what already exists next to it (logs, forms, multi-stakeholder evaluations, competency) and the habits schools already have. Placement content (turns 1-96) has no skills content and is not tabled except where it touches evidence integrity.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 1.1 | Existing learning activities are logs, timesheets, forms and evaluations; the same thing is named differently by school. Skills must pick a label and tolerate others. | "patient logs, case logs, clock hours" | Exxat presenter (inferred) | turn 111 | [TERMINOLOGY] |
| 1.2 | "Competency encounters" is an existing name for a log. Students record every exposure first, then initiate a form to the educator when they feel competent. Exposure list is kept separate from the evaluation. | "once they feel that they're competent, then they go into the form and they initiate it" | Exxat presenter (inferred) | turn 153 | [REQUIREMENT] |
| 1.3 | Instance-based (as needed) forms include a competency form the student triggers to the preceptor. This is the platform's existing student-initiated pattern; it matches REQ student-initiated submission. | "when that student feels that they're competent in something, that they can then trigger that form to go to their preceptor" | Exxat presenter (inferred) | turn 176 | [REQUIREMENT] |
| 1.4 | Multi-stakeholder forms: student self-evaluation goes to the preceptor, who may change responses but the student's original is kept. Visibility per response is configurable ("decide who should see which response"). | "still maintain the records that were listed, what the student gave themselves for their review" | Exxat presenter (inferred) | turn 178 | [REQUIREMENT] |
| 1.5 | The platform sells evaluator and site comparison as a benefit of keeping evaluations in one system. | "this one preceptor always grades the students a little bit more harshly" | Exxat presenter (inferred) | turn 185 | [REQUIREMENT] (positioning claim, not a Skills requirement) |
| 1.6 | Config edits do not create new versions: hide or disable a question going forward, optionally keep it visible to students or only in reports. | "you can actually hide the questions so you don't have to create a whole new log" | Exxat presenter (inferred) | turn 154 | [FEEDBACK-ON-DESIGN] |
| 1.7 | Setup is by scanning a document and having the system recommend a log, then the admin edits. Needs the AI feature switched on (see 6.10, 6.11). | "or you can scan it document to have our system recommend building the log for you" | Exxat presenter (inferred) | turn 154 | [REQUIREMENT] |
| 1.8 | Review: preceptor can attest; a log can be disapproved and goes back to the student; students can delete unsubmitted logs; a history of deleted logs is kept. | "You can disapprove a log also, so it goes back to the student to ask them to make a change." | Exxat presenter (inferred) | turn 161 | [REQUIREMENT] |
| 1.9 | Deleted-log history exists as an audit trail. | "there's a history that shows you the logs that have been deleted" | Exxat presenter (inferred) | turn 172 | [REQUIREMENT] |
| 1.10 | Aggregate log reports are meant for accreditation, certification and licensure. | "within your accreditation or for certification and licensure requirements" | Exxat presenter (inferred) | turn 173 | [REQUIREMENT] |
| 1.11 | Reminders were fixed to go only to people who have not completed; distribution is by anchor points (for example 7 days before rotation end) so copying a course forward keeps the schedule; reminders have an end date. | "it only goes to the people who haven't filled the form out yet" | Exxat presenter (inferred) | turns 185-187 | [REQUIREMENT] |
| 1.12 | Competency management connects evaluation scores to a program-chosen threshold, shown by domain with colour coding, either per item or averaged per domain. This is score-and-threshold based. | "you're choosing what the threshold is. So like anything at 3 or above is fine" | Exxat presenter (inferred) | turn 200 | [CONSTRAINT] |
| 1.13 | Students can see their result against the class average only if responses are published; there is bulk review and publish. | "if you publish the responses to your students, they can see how they're performing against their class average" | Exxat presenter (inferred) | turns 201-202 | [REQUIREMENT] |
| 1.14 | Midterm-to-final evaluations can copy the midterm answers forward so the preceptor edits rather than retypes. Called a "big ask" for speech and social work. Identical questions only. | "start with what they typed in at the midterm" | Exxat presenter (inferred) | turn 229 | [PREFERENCE] |
| 1.15 | Preceptors get a link and need no login for intake forms. | "They just get a link, they don't need a login." | Exxat presenter (inferred) | turn 309 | [CONSTRAINT] |
| 1.16 | Students add preceptors themselves; admins must link duplicates so they are not two entities and clean up the list. | "You can link them together so they're not 2 different entities." | Exxat presenter (inferred) | turns 94-95 | [REQUIREMENT] |
| 1.17 | Placement edits can destroy activity history: change dates instead of cancelling. A placement marked on hold or unsuccessful stops the student entering more learning activities. | "It's going to delete all the learning activities that they've already done." | Exxat presenter (inferred) | turns 92, 89 | [CONSTRAINT] |
| 1.18 | Activities without a placement are an acknowledged gap. | "have those learning activities without a placement, we're kind of figuring that out too" | Exxat presenter (inferred) | turn 42 | [CONSTRAINT] |
| 1.19 | Courses can be grouped (Fall 2026, Academic Year 26-27) purely to report across them. | "By having the groups together, it's an easy way to run reports off of that collection of courses" | Exxat presenter (inferred) | turn 1 | [REQUIREMENT] |
| 1.20 | Overview dashboards are rarely used: presenter asks who stops on the placement dashboard; answer: few. | "Not very many usually." | Attendee reply (inferred) | turns 76-78 | [FEEDBACK-ON-DESIGN] |
| 1.21 | Competency module was built from nursing feedback on the AACN Essentials and is being extended to other disciplines. | "especially nursing, the essentials due to the new changes is a big thing" | Exxat product speaker (inferred) | turn 246 | [CONSTRAINT] |
| 1.22 | Poll on whether competencies use custom questions each or the same questions. The answer is not in the transcript (hands raised). | "how many of you have custom questions for each competency" | Exxat product speaker (inferred) | turn 250 | [QUESTION] |
| 1.23 | Product team admits competency is new and asks schools to try it and report needs. | "I think it's very new, that is why please like explore that module and let us know" | Exxat product speaker (inferred) | turn 251 | [QUESTION] |
| 1.24 | Programs juggle many logins; the stated goal is one system. | "We know some of the programs have 6 or 7 logins" | Exxat product speaker (inferred) | turn 252 | [REQUIREMENT] |
| 1.25 | Skills checklist is **not** named in the module roadmap talk (competency, surveys, post-course evals, exam management, accreditation, LMS integration are). | n/a (absence) | n/a | turns 244-347 | [QUESTION] |

---

## 3. Meeting 2: Sep 22, "Meeting with Aarti" (`5974f3d8-7aa1-426d-9657-adc27143f91e`)

**Date:** 2026-09-22 · **Participants:** Romit and Aarti per the title only.
**Result:** Granola returned the record with `"transcript": null`. There is **no raw transcript to read**, so there are no findings from this meeting in this file. Nothing was inferred or taken from summaries. If Romit holds notes or a recording of this Aarti meeting elsewhere, it is an unread source and may carry decisions that bear on the open decisions below.

---

## 4. Meeting 3: Oct 5, "Dr. Gilzai: pharmacy accreditation, curriculum assessment, student success" (`1dfa0f00-428f-40e2-b506-a11664df7645`)

**Date:** 2026-10-05 · **Participants (inferred from content):** Dr. Gilzai (transcribed variously Kilzai, Gilzai, Tilak; pharmacy accreditation expert, ACPE site-team evaluator), a second pharmacy educator (Dr. Bobby/Bhavi), Vishal (Exxat PM), Bhargav (virtual, accreditation module), an Exxat product leader who frames "Student 360", Romit recording. Speaker labels are all "Microphone". The leader notes "we are recording this so Sankalp can listen into this".
**About (2 lines):** A pharmacy-education interview for the accreditation module, post-course evaluations and exam management. Only the student-success segment (turns 878-936) touches Skills, via a "Student 360" cohort dashboard prototype and program-level thresholds.
**Coverage warning:** partial read (section 1). The findings below are what the targeted reads found.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 3.1 | The platform cannot say how far a student is toward an accreditor-mandated minimum; this must be captured at program level. | "we have to start capturing these things at the program level. What is it that is expected through accreditation?" | Exxat product leader (inferred) | turn 125 | [REQUIREMENT] |
| 3.2 | Two thresholds are needed: the accreditor's and the program's own, which can be higher. | "What is the level that is being set by the accrediting body and what is the level that you are programmatically setting for yourself?" | Exxat product leader (inferred) | turn 129 | [REQUIREMENT] |
| 3.3 | Programs routinely exceed the minimum to absorb absences. | "you can always raise the bar on what it is that the accrediting body is asking for" | Pharmacy educator (inferred) | turn 129 | [CONSTRAINT] |
| 3.4 | Proposed status vocabulary: red for failing the accreditor requirement, orange for failing only the program requirement. | "a student can be in red if they're not meeting the accrediting body requirements" | Exxat product leader (inferred) | turn 130 | [FEEDBACK-ON-DESIGN] |
| 3.5 | (same turn, second half) | "the student could be in orange if they're not meeting the program requirements" | Exxat product leader (inferred) | turn 130 | [FEEDBACK-ON-DESIGN] |
| 3.6 | Pharmacy experiential minimums are by hours (1,440 advanced, 300 introductory) and by required rotation types, which is a setting-style minimum, not nursing-specific. | "So 4 required, that includes 1 ambulatory care in hospital, 1 in acute care is also in hospital" | Pharmacy educator (inferred) | turn 111 | [REQUIREMENT] |
| 3.7 | The platform does not capture those hour totals today. | "we are not capturing the fact that you need 1,440 hours" | Exxat product leader (inferred) | turn 125 | [CONSTRAINT] |
| 3.8 | Student 360 prototype is a cohort-per-row dashboard with columns for at risk, watchlist, grades, didactic competencies, experiential competencies, program requirements and interventions (mock data, "not built"). | "they may have passed the courses, but they may still be struggling in some of the competencies that are needed" | Exxat product leader (inferred) | turn 933 | [REQUIREMENT] |
| 3.9 | Two-tier "behind": watchlist is already off track; at risk is on the border. Leader says they need further grooming. | "watchlist is they are already doomed or on the red path, whereas at risk are there on the border or very close to it" | Exxat product leader (inferred) | turn 932 | [FEEDBACK-ON-DESIGN] |
| 3.10 | Graduation requirements (hours, required rotation types, OSCE minimums) are to be built into Prism and sit in the Student 360 area, discipline-specific, with school additions. | "graduation requirements has to be built out for PRISM and it needs to sit in here" | Exxat product leader (inferred) | turn 915 | [REQUIREMENT] |
| 3.11 | Discipline-specific lists must be configurable. | "will have to be very much discipline-specific" | Exxat product leader (inferred) | turn 909 | [REQUIREMENT] |
| 3.12 | Student performance data must be importable from outside sources (exam-prep scores, OSCE-type assessments). | "a way for them to bring in student performance data from outside sources" | Exxat product leader (inferred) | turn 902 | [REQUIREMENT] |
| 3.13 | "Profile" today, "portfolio" is the stated goal (rotation info and other material). | "eventually our goal is to help students build their portfolio" | Exxat product leader (inferred) | turn 924 | [TERMINOLOGY] |
| 3.14 | Pharmacy faculty are often preceptors too; one site serves students from several programs. A person is not one role. | "will take students from 3 pharmacy programs that are in that region" | Pharmacy educator (inferred) | turns 281-283 | [CONSTRAINT] |
| 3.15 | Academic improvement plans currently need a placeholder course to be documented in Prism (workaround pattern again). | "they have to be created as part of a placeholder course" | Exxat product leader (inferred) | turn 900 | [CONSTRAINT] |
| 3.16 | The accreditor's competency labels moved to "domain" (ASR garbled: "area to domain"). | "they call it competencies earlier, but now they've changed to area to domain" | Pharmacy educator (inferred) | turn 165 | [TERMINOLOGY] |
| 3.17 | The leader states Sankalp (Skills owner) is a listener on this recording. | "we are recording this so Sankalp can listen into this" | Exxat product leader (inferred) | turn 902 | [QUESTION] (confirms awareness of Student 360 at Sankalp's level) |

---

## 5. Meeting 4: Oct 2, "Ruchi, Aarti, Kunal expectations" (`4e56ee3f-98f0-4d16-a138-3aafefa486b6`)

**Date:** 2026-10-02 · **Participants:** Romit (recorder), Ruchi, Aarti, Kunal per the title, plus junior researchers who run MD/DO/pharmacy discovery. Speaker for most turns is an Exxat senior leader (unattributed, inferred).
**About (2 lines):** Expectations and scope for a month of domain research (medical school, DO, pharmacy), student interviews, competitor learning and a sales demo instance. It is not a Skills meeting, but it sets scope, a "do not over-generalise from one school" rule, and an AI-optional rule.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 5.1 | AI must not be the only path; schools are not ready. Another participant repeats Aarti's point ("Adi" = Aarti). | "schools aren't like ready to use AI" | Aarti, relayed by a participant (inferred) | ~8% | [PREFERENCE] |
| 5.2 | Follow-up: non-AI versions of features must always be available, with an opt-in switch. | "we would need to have all those non-AI availability" | Unattributed participant | ~8% | [REQUIREMENT] |
| 5.3 | Do not generalise one school's workflow. At least 7 or 8 points of view, ideally on different software. | "interviewing one person, we may think that what their school does is what every school does." | Senior leader (inferred) | ~15% | [REQUIREMENT] |
| 5.4 | (same stance) | "we want at least 7 or 8 different points of view" | Senior leader (inferred) | ~15% | [REQUIREMENT] |
| 5.5 | Research scope is held to four categories; everything else is a "pointer". Skills / competency checklists are **not** in the four. The ASR renders clinical education as "cleanliness/cleanex"; this is my reading. | "Let's keep the discovery focused to these 4 categories." | Senior leader (inferred) | ~28% | [DECISION] (firm, for this research effort) |
| 5.6 | Do not build an LMS; learn only where students touch other systems. | "I'm not building an LMS right now" | Senior leader (inferred) | ~35% | [CONSTRAINT] |
| 5.7 | Work style: keep activities focused, avoid hypothetical prototypes. The addressee is unclear and may not be Romit. | "things get too hypothetical. So for this project, I want it very, very focused." | Senior leader (inferred) | ~32% | [PREFERENCE] |
| 5.8 | Medical students (Kriti, a consulting student) will share her evaluations, patient logs and spreadsheets; every interviewee should be asked for a copy of their evaluations. | "everyone we interview, we want to get a copy of their evaluations" | Senior leader (inferred) | ~45% | [REQUIREMENT] |
| 5.9 | A blank Prism instance will be filled with realistic fake data so the whole system can be navigated; used for sales demos. | "without any data it's not possible to navigate. You need courses, you need students registered to their courses." | Senior leader (inferred) | ~50% | [REQUIREMENT] |
| 5.10 | Undergraduate versus graduate medical education must be separated; graduate is "where the big money is" (ASR "GM"). | "where the big money is, it's in GM" | Senior leader (inferred) | ~55% | [TERMINOLOGY] |
| 5.11 | Student-journey mapping asks how many logins and systems a student uses. | "how many logins does she have" | Participant (inferred) | ~5% | [REQUIREMENT] |
| 5.12 | A rotation calendar export to Google is a wish. | "I wish the calendar could be exported into Google" | Participant (inferred) | ~3% | [PREFERENCE] |
| 5.13 | (paraphrase, Hindi-English) Pharmacy has essentially one incumbent, so deep competitor analysis there is not worth the time. | n/a (paraphrase) | Senior leader (inferred) | ~80% | [DECISION] (soft) |

---

## 6. Meeting 5: Sep 25, "Day 2, Exxat Prism essentials" (`7f00b9b7-ad30-43f2-9146-b72f0f94b40b`)

**Date:** 2026-09-25 · **Participants:** Exxat account managers (one self-introduced as Jessica Hall, turn 9; a second is named Joanna), Romit and another colleague at the back of the room, school attendees. All turns "Microphone". **Speaker: Exxat account manager (inferred) unless noted.**
**About (2 lines):** A client "essentials" session: dashboard and calendar, Ask Leo and the AI Hub, student profile, course and curriculum building blocks, sections and terms, contracts and sites, reports.
**Coverage warning:** partial read (section 1).

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 6.1 | Everything in the platform starts from a course, except surveys. | "for everything other than surveys, you still have to start with your building block of a course" | Account manager | turn 335 | [CONSTRAINT] |
| 6.2 | Evaluations, timesheets, time off and patient logs need a placement. Workaround for lab or class activity: create a site for the university and place every student in it. Forms can be marked as not needing a placement. | "Having a placement is actually required for you to be able to use your learning activities for your evaluations" | Account manager | turn 337 | [CONSTRAINT] |
| 6.3 | (same turn) | "You can create evaluation forms and say that this form does not require a placement" | Account manager | turn 337 | [CONSTRAINT] |
| 6.4 | Lockstep versus non-lockstep programs; lockstep adds students to new courses by cohort, with a prompt. | "Lockstep Programs, meaning your students move forward in a cohort." | Account manager | turn 333 | [TERMINOLOGY] |
| 6.5 | Sections split one course into groups that need different requirements. | "If you add a section, you can build out those course requirements separately." | Account manager | turn 350 | [REQUIREMENT] |
| 6.6 | Every offering belongs to a term and an academic year. | "every one of your course offerings should be connected to a term and an academic year" | Account manager | turn 351 | [REQUIREMENT] |
| 6.7 | Year-over-year practice is clone forward (course, curriculum grid; mapping copy requested from the support team). | "then next year clone it forward" | Account manager | turn 401 | [PREFERENCE] |
| 6.8 | Syllabus scan proposes what it will create; the admin unchecks what they do not want. Needs the AI feature switched on. | "You can uncheck boxes to say, actually, don't import that." | Account manager | turn 403 | [REQUIREMENT] |
| 6.9 | Same hide/disable rule for logs and evaluations. | "You can disable the question, you can hide the question." | Account manager | turn 172 | [FEEDBACK-ON-DESIGN] |
| 6.10 | The AI Hub is per program and opt-in; the program decides everything and sees the model used. | "You get to decide everything for your program." | Account manager | turn 154 | [CONSTRAINT] |
| 6.11 | Some AI features additionally need an explicit toggle (document upload). | "You do have to turn on this upload under your Ask Leo or your AI Hub" | Account manager | turn 402 | [CONSTRAINT] |
| 6.12 | A shared mock student account (and mock faculty) per program lets staff experience the student view. | "Yes, the mock student can be used by all of your faculty." | Account manager | turn 126 | [REQUIREMENT] |
| 6.13 | Contract expiry notifications can go to people with no login by listing their email. | "you also don't have to have a login to Exact to see that notification" | Account manager | turn 462 | [CONSTRAINT] |
| 6.14 | Report labels can be renamed; the original name stays in small print. | "it's still going to have in the smaller print below it the name that we gave it" | Account manager | turn 151 | [FEEDBACK-ON-DESIGN] |
| 6.15 | Nursing competency view: 10 domains with class average shown for students if published. | "there's 10 domains in there, and you're seeing the class average in blue on the left" | Account manager | turn 198 | [REQUIREMENT] |
| 6.16 | Course setup by scanning a syllabus (grading schemes, prerequisites) then editing, then clone. | "scan your syllabus to build your course offering" | Account manager | turn 400 | [REQUIREMENT] |

---

## 7. Meeting 6: Aug 21, "Prism and Exact app navigation: roles, reports, cross-selling with design feedback" (`460905f3-a1bd-418e-b48d-2f261f0f2945`)

**Date:** 2026-08-21 · **Participants:** two designers working on the Prism launcher/landing (Romit is the recorder, so "Microphone" is likely Romit and "System audio" the colleague; inferred). Others are discussed, not present: Aarti (transcribed "ati", "RTO"), Kunal ("connal"), Vinay GV (new product leader, "vinai gb"), Arun. Names of Aarti in ASR are my reading.
**About (2 lines):** A design sync on the Prism landing page, roles per app, whether reports move out of apps, and cross-selling unowned modules. Pre-dates the Skills call (Sep 23).

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 7.1 | Program becomes a common entity across all apps, like course and people (faculty, student). | "That will also be a common entity." | Colleague designer (inferred) | ~12% | [CONSTRAINT] |
| 7.2 | Leadership (Vinay GV) floated reports outside apps so an admin creates reports from any app. Unresolved; data-source and cross-app data issues acknowledged. | "I should be able to let's say create reports from any of the apps." | Colleague designer relaying Vinay GV (inferred) | ~18% | [QUESTION] |
| 7.3 | AI report generation ("describe the report") is being built but limited to each app's own data sources. | "very limited to like all the data source like the backend that we have" | Colleague designer (inferred) | ~20% | [CONSTRAINT] |
| 7.4 | Pin-to-home action on any table or report so the user marks what they care about and it lands on Home. | "okay show me it at home page" | Recorder (inferred Romit) | ~25% | [PREFERENCE] |
| 7.5 | Students with one app land directly in that app; no landing page for them. | "they directly lands on the app they have access to because there is no point bringing that user here" | Colleague designer (inferred) | ~38% | [DECISION] (prototype-level) |
| 7.6 | Students cannot change school or program, including students with admin access. | "student can't change the school or the program" | Colleague designer (inferred) | ~40% | [CONSTRAINT] |
| 7.7 | Aarti (second-hand) wanted the program/school switching outside the apps because users do not switch. | "she wanted this to be outside since users are not going to shift between programs or school" | Colleague relaying Aarti (inferred) | ~55% | [PREFERENCE] |
| 7.8 | Data on how many users hold multiple apps and how often they switch programs is still being requested. | "what percentage of users do have access to multiple programs" | Colleague designer (inferred) | ~28% | [QUESTION] |
| 7.9 | Aarti wanted "More from Exxat" on top or visible without scrolling. | "she wanted right on the top or without scroll" | Colleague relaying Aarti (inferred) | ~55% | [FEEDBACK-ON-DESIGN] |
| 7.10 | Illustration-heavy cards hurt readability; compare Microsoft 365 / Adobe app lists. | "illustrations were occupying the ratio between basically the illustration and the text" | Recorder (inferred) | ~58% | [FEEDBACK-ON-DESIGN] |
| 7.11 | Contradictory feedback on the same page. | "it is looking too plain and then if we add some things here then I got a feedback that no it's too much" | Colleague designer (inferred) | ~58% | [FEEDBACK-ON-DESIGN] |
| 7.12 | Aarti, second-hand: a plain list is fine. | "okay this list is fine for me" | Colleague relaying Aarti (inferred) | ~62% | [PREFERENCE] |
| 7.13 | Kunal suggested embedding product videos with an "express interest" call to action for modules a school lacks. | "why can't we include videos like that?" | Recorder relaying Kunal (inferred) | ~65% | [PREFERENCE] |
| 7.14 | Product names must match market language and show the intent of the product. | "the name of the product needs to match the market and the second is the intent of that product" | Recorder (inferred) | ~68% | [TERMINOLOGY] |
| 7.15 | Compress the module list into chips or themes to avoid scrolling. | "we just create like a small chips small chips of products" | Recorder (inferred) | ~80% | [FEEDBACK-ON-DESIGN] |
| 7.16 | Second half of the page is for sales to fill; design provides structure, two or three options. | "let sales team do this we can just provide a structure to the page" | Colleague designer (inferred) | ~82% | [DECISION] (soft) |
| 7.17 | Adobe-style top-bar app switcher considered; only useful if users switch often. | "really useful when you are shifting between the apps quite frequently" | Colleague designer (inferred) | ~90% | [OBJECTION] |
| 7.18 | The recorder concedes the top switcher would break the current nav structure; it was an early exploration only. | "it will bring a lot of ux issues basically like between the modules and the products" | Recorder (inferred) | ~92% | [OBJECTION] |
| 7.19 | Color logos, not icons, to distinguish products. | n/a (paraphrase of ~88% turn about color logos instead of icons Exxat does not own) | Recorder (inferred) | ~88% | [PREFERENCE] |

---

## 8. Vault raw transcripts (grep first, read around hits)

### 8.1 Day 3, 2026-09-30 (`2026-09-30-day-3-post-cohere-meeting.md`)

**About:** Internal post-conference planning: modular Prism, a module-based landing page, discipline priorities, Q1/Q2 2027 roadmap. Speakers unlabelled (internal leaders, product, account managers); roles inferred.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 8.1.1 | Modules are independently sellable; schools can buy one without the others. | "most of them are independently sellable as well" | Exxat leader (inferred) | file line 2354 | [DECISION] |
| 8.1.2 | Unsubscribed modules appear as a gray button, not hidden. | "If they haven't subscribed to those additional modules, show them it with a gray button." | Exxat leader (inferred) | line 2714 | [PREFERENCE] |
| 8.1.3 | Gray modules should open an example, with no school data. | "if they click on it, it shows example of what it looked like. It doesn't use their data." | Exxat leader (inferred) | line 2714 | [PREFERENCE] |
| 8.1.4 | Modules are bought per program (PT may not own curriculum; OT does). | "when they go into PT, they may have not bought curriculum" | Exxat leader (inferred) | line 2584 | [CONSTRAINT] |
| 8.1.5 | Open question where competency sits in the module layout. | "Where does competency sit here?" | Exxat leader (inferred) | line 2586 | [QUESTION] |
| 8.1.6 | Access trap: curriculum roles may not see student performance. | "Curriculum chair doesn't necessarily have access to student performance at all" | Exxat leader (inferred) | line 2586 | [CONSTRAINT] |
| 8.1.7 | Shared across modules: students, faculty, courses, and "points about competency". | "The only thing that's really going to connect everything are these students-faculty courses that are shared across them" | Exxat leader (inferred) | line 2636 | [REQUIREMENT] |
| 8.1.8 | Competency is fed from clinical education and exam management. | "you can do competency management by pulling data from ClinEd and exam management" | Exxat leader (inferred) | line 2636 | [REQUIREMENT] |
| 8.1.9 | New-joiner critique of the landing page being only navigation. | "the initial landing, like right after you log in, is almost completely navigational" | New attendee (inferred) | line 2628 | [FEEDBACK-ON-DESIGN] |
| 8.1.10 | Leader's reply: make the landing area actionable (students who need attention). | "it is very good to make it actionable. These are all your students who need attention." | Exxat leader (inferred) | line 2640 | [PREFERENCE] |
| 8.1.11 | Social work could not adopt competency tracking because of a final faculty check. Leader: workflow must not compromise data. | "The workflow should not compromise the data." | Exxat leader (inferred) | line 2920 | [REQUIREMENT] |
| 8.1.12 | Learning contracts must play well with competency. (paraphrase of "we will check off learning contract and that learning contract should play well with confidence", ASR "confidence" = competence) | n/a (paraphrase) | Exxat leader (inferred) | line 2926 | [REQUIREMENT] |
| 8.1.13 | Competency mapping today is quantitative only; a qualitative checkoff that accrues across courses fits competency tracking. (garbled phrase "personal license" in the source; I read it as persona or workflow; uncertain) | "They accrue over courses, so it fits more with that competency tracking, which is longitudinal across courses." | Exxat leader (inferred) | line 2958 | [PREFERENCE] |
| 8.1.14 | (same turn) | "our competency mapping model today is only quantitative, correct?" | Exxat leader (inferred) | line 2958 | [QUESTION] |
| 8.1.15 | SLP accreditor review wants to see which standards are being checked off; today only met / not met. The ID is tagged SLP but "it will be general purpose". | "they want to see which standards they are checking off" | Account manager (inferred) | line 2954 | [REQUIREMENT] |
| 8.1.16 | Prefer one workflow for CASA, competency and similar checkoffs. | "we should see if one workflow can accommodate all these different types" | Exxat leader (inferred) | line 2956 | [PREFERENCE] |
| 8.1.17 | General-purpose definition. | "the way we will define it, it will be general purpose" | Exxat leader (inferred) | line 2950 | [DECISION] (soft) |
| 8.1.18 | Preceptors only get one email; they need to see all forms due. Called a top priority parity item (TK20). | "the preceptor cannot see what forms are due. They are only getting that one email." | Exxat leader (inferred) | line 2974 | [REQUIREMENT] |
| 8.1.19 | Preceptor experience may become an app or QR flow, so people need not remember a login (Q2 discussion). | "not remembering their login but they are able to still see what they need to do" | Exxat leader (inferred) | line 3010 | [PREFERENCE] |
| 8.1.20 | Skills checklist is wanted; design help "has not been set up"; target is Q1. Soft. | "Skills checklist is another thing we want to do." | Exxat leader (inferred) | line 2996 | [DECISION] (soft) |
| 8.1.21 | (same turn) | "we'll see if that goes as planned for the Q1 part of it" | Exxat leader (inferred) | line 2996 | [DECISION] (soft) |
| 8.1.22 | Q1 shortlist includes social work learning contracts, teacher education dashboard, skills checklist and tenant-level work. | "skills checklist and tenant" | Exxat leader (inferred) | line 3094 | [DECISION] (soft) |
| 8.1.23 | Nursing needs to assign simulation or skills lab without inventing a site. | "I don't want to create Endicott College as a site and then have to assign the student there for simulation lab" | Account manager (inferred) | line 3042 | [REQUIREMENT] |
| 8.1.24 | Landing page sign-off is the immediate highest priority. (paraphrase) | n/a (paraphrase of lines 3096-3102) | Exxat leader (inferred) | lines 3096-3102 | [DECISION] |

### 8.2 Day 4, 2026-10-01 (`2026-10-01-day-4-post-cohere-meeting.md`)

**About:** Account-manager and product session on Prism positioning, exam management, Student 360, consistency, and training.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 8.2.1 | One entry point for students, faculty and admins into Prism. | "Students, faculty, administrators, all of them will have a single entry point into Prism" | Exxat leader (inferred) | line 1434 | [DECISION] |
| 8.2.2 | A student sees all modules on login (open exam, survey, rotation). | "when a student logs in, they will see access to all modules" | Exxat leader (inferred) | line 1432 | [REQUIREMENT] |
| 8.2.3 | Nursing and teacher-ed schools need a term-level view across places and open evaluations. | "I want to be able to see it at the term level" | Account manager (inferred) | line 1438 | [REQUIREMENT] |
| 8.2.4 | A competency grid (10 nursing domains by student) already exists; the same pattern could flip to terms or courses. | "if you take the 10 domains for nursing, you have a nice grid that shows where they're at each competency" | Account manager (inferred) | line 1438 | [FEEDBACK-ON-DESIGN] |
| 8.2.5 | Reply: GPA-style views should not be a grid. | "Not a grid, but like a bar chart, like a line chart." | Exxat leader (inferred) | line 1440 | [PREFERENCE] |
| 8.2.6 | Competency gap view helps coordinators make placement decisions. | "so that they can take that into their placement decisions, that my student needs a little more mentorship" | Account manager (inferred) | line 1088 | [REQUIREMENT] |
| 8.2.7 | Student 360 competency tag is mainly clinical today. | "Today, the Student 360, there is a tag on competency tracking, but it's mainly from clinic." | Exxat leader (inferred) | line 1086 | [CONSTRAINT] |
| 8.2.8 | About 60 customers use competency mapping. | "about 60 are using them" | Account manager (inferred) | line 1258 | [QUESTION] (adoption number only) |
| 8.2.9 | New modules must look consistent with Prism. | "We have to make sure that Prism has that consistent look and feel." | Exxat leader (inferred) | line 1406 | [PREFERENCE] |
| 8.2.10 | Prism front end is Angular. | "the front end of Prism is built on a technology called Angular" | Exxat engineer or leader (inferred) | line 1416 | [CONSTRAINT] |

### 8.3 Day 5, 2026-10-02 (`2026-10-02-day-5-post-cohere-meeting.md`)

**About:** Discipline prioritisation, revenue goals, persona and role model, Prism modules and One.

| # | Finding | Quote | Speaker | Where | Tag |
|---|---|---|---|---|---|
| 8.3.1 | Undergraduate nursing does not log patients or time. | "undergraduate nursing does not ask their students to log patients" | Account manager (inferred) | line 2504 | [REQUIREMENT] |
| 8.3.2 | The skills checkoff list is a must-have for them (term "skills checkoff"). | "the skills checkoff list is very, very important for them" | Account manager (inferred) | line 2506 | [REQUIREMENT] |
| 8.3.3 | Big in undergraduate nursing and all allied health. | "skill checkoff list is big in nursing undergrad, it's big in all allied health" | Exxat leader (inferred) | line 2546 | [REQUIREMENT] |
| 8.3.4 | For PA, the skills module has no competitor; one 360 screen would sell. | "the skills module is the only thing that there's no competitor that gives them that view" | Sales or account lead (inferred) | line 2628 | [REQUIREMENT] |
| 8.3.5 | (same turn) | "Showing that one screen of a 360 of that would sell to so many PA programs." | Sales or account lead (inferred) | line 2628 | [FEEDBACK-ON-DESIGN] |
| 8.3.6 | Assurance it will be built. | "Skills checklist will get done. Skills checklist is important here." | Exxat leader (inferred) | line 2628 | [DECISION] (firm intent) |
| 8.3.7 | Timing answer is vague. | "Q1, early Q1, late Q1." | Exxat leader (inferred) | line 2630 | [DECISION] (soft) |
| 8.3.8 | Company admits it does not know nursing competency support. | "we as a company don't really know and understand what it means to support the nursing competency because today nobody is doing it" | Exxat leader (inferred) | line 2268 | [QUESTION] |
| 8.3.9 | Personas are suite-wide shared language, with a finite set. | "roles or the personas are part of that shared language" | Exxat engineer (inferred) | line 3208 | [CONSTRAINT] |
| 8.3.10 | Top-level personas: school user, faculty, student, site admin. | "you are either a school user or you are a school faculty or you are a school student" | Exxat engineer (inferred) | line 3228 | [CONSTRAINT] |
| 8.3.11 | Within a module, any user can be given a module-level admin role. | "you can make somebody an administrator for exam management" | Exxat leader (inferred) | line 3240 | [REQUIREMENT] |

---

## 9. What this changes or contradicts

Basis: the docs as they stand (`README.md`, `strategy/05`, `strategy/07`, `design/brief-v2.md`, the three variants). "Who said it / how firm" is given for every OD item. **No OD is marked decided.**

### (a) Contradicts or supersedes a doc claim or hard stop

1. **No hard stop is contradicted.** Checked against `strategy/07 section D`: "Preceptors have no login" is *reinforced* (1.15, 6.13, 8.1.19); "no QR in v1" is consistent (QR is a Q2 preceptor-module idea, 8.1.19); "not nursing-specific" is reinforced (8.1.17, 5.3, 3.6).
2. **Tension with the "Skills is separate from competency" framing.** The docs (OD-02 and README fact 3) recommend staying separate in v1. Leaders on Sep 30 describe the qualitative checkoff as something that "fits more with that competency tracking" and ask for "one workflow" for similar checkoffs (8.1.13, 8.1.16), while competency itself is quantitative (1.12, 8.1.14). That is a direction of travel toward convergence, voiced by unnamed speakers, in a discussion about an SLP parity item, not about this module by name. The nullable seam in OD-02 stays correct; the "stay separate" wording should not be read as organisational consensus.
3. **Timing conflict to verify.** `strategy/05` OD-05 says Learning Contracts ships "Ankit, Q4". Sep 30 lists social work learning contracts and the skills checklist together as Q1 2027 candidates (8.1.22). If "Q4" means Q4 2026, the plans disagree. I cannot tell which quarter system the call used; ask Sankalp or Ankit.
4. **Placement coupling.** `strategy/07` and the REQ treat submission as free of courses (CM-05). The platform on Sep 25 says evaluations, logs and time off need a placement, with a workaround of a "university site" (6.2). Forms can be placement-free (6.3). This is a platform constraint the docs do not state; nothing in the docs is contradicted, but "submit an unmapped skill outside any course" has no home in the platform's own model yet.
5. **Product switcher.** `brief-v2` section 3.1 puts a "Prism product switcher" in the utility bar. On Aug 21 a top-bar app switcher was explored and set aside by the recorder, and Aarti (second-hand) wanted switching outside the apps (7.7, 7.17, 7.18). By Oct 1 the plan is a single module-based entry point per persona (8.2.1) and the landing-page sign-off is the highest priority (8.1.24). Not a contradiction of a stated decision, but the DS shell's switcher is not the whole answer for how people reach Skills.

### (b) Resolves or sharpens an open decision (never marks one decided)

| OD | What the transcripts add | Who, how firm |
|---|---|---|
| **01** carry-forward | Platform habit is *clone forward* (curriculum grid, course, syllabus-built offering), with mapping copy done by support (6.7). Sections can carry their own requirements (6.5). Leans toward `brief-v2` Q6 explicit copy over automatic carry-forward. Does not touch the catalogue-level default idea. | Account manager describing existing features. Descriptive, low. |
| **02** competency boundary | See (a)2. Competency = score + program threshold + domain averages (1.12, 6.15). Leaders hint qualitative checkoff could live with competency tracking (8.1.13). Open, not narrowed. | Unnamed leaders, exploratory. |
| **05** external evaluator record | The platform already has a Preceptor entity, students add preceptors, and admins merge duplicates (1.16). One person often has several roles and serves several programs (3.14). A Prism-wide person record is the likelier path; OD-05 must reconcile with the existing Preceptor entity and add a merge story. | Exxat presenter plus pharmacy educator; medium. A "preceptor module as independent" idea is Q2 and soft (8.1.19). |
| **06 and 25** roles | A faculty member is routinely also a preceptor (3.14). Role is contextual to the evidence, not a person attribute. Persona + module-level admin roles are the platform model (8.3.9-8.3.11). | Pharmacy educator; engineer. Medium. |
| **08** returned-evaluation prefill | Midterm answers copied forward for the preceptor is a "big ask" (1.14); evaluator edits keep the original (1.4). Supports prefill with an immutable original. | Presenter; medium. |
| **09** self-evaluation form | Existing multi-stakeholder form uses one form with per-response visibility (1.4). Supports identical form. | Presenter; medium. |
| **11** evaluator and site dimension | Exxat positions "this preceptor grades harsher" as a feature (1.5). Demand exists on the sales side; the interpretation risk from the Sep 23 call is untouched. | Presenter's pitch; not a Skills requirement. |
| **12** interpretation scope | Product family precedent is "scan, propose, user edits or unchecks" for logs and syllabi (1.7, 6.8). Both are behind the AI opt-in (6.10, 6.11). Does not settle whether Skills should propose evaluation criteria. | Presenter; descriptive. |
| **14** save and return | Timesheets and forms already allow saving partial work (turns 134, 224, Sep 25 placement). Supports allowing drafts. | Presenter; medium. |
| **16** who gets a return | Logs: "goes back to the student" (1.8). That is a log, not a skills evaluation. Weak lean toward student ownership. | Presenter; low. |
| **18** link lifecycle | Platform already has non-completer reminders with end dates (1.11). Preceptors want a list of what is due (8.1.18). REQ section 14 puts reminders out of scope for Skills; whether Skills can reuse the platform engine is a question for Sankalp. | Leader, "number one issue" for teacher ed forms (8.1.18); firm about the need, silent on Skills. |
| **21** thresholds | Accreditor level and program level are distinct (3.2); pharmacy adds rotation-type minimums (3.6). Sharpens the boundary: these are Student-360 "program requirements" (3.10) versus per-skill minimums (SC-11). | Product leader; medium. |
| **22** time scoping | Terms, academic years, course groups and a requested term-level view all exist or are requested (1.19, 6.6, 8.2.3). | Account managers; descriptive. |
| **23** learning contracts | Learning contracts must "play well" with competency (8.1.12) and are on the Q1 list (8.1.22). | Leader; soft. |
| **27** "behind" | Two tiers (at risk, watchlist) in the Student 360 prototype (3.9); red versus orange tied to accreditor versus program (3.4-3.5). Prototype, mock data, "needs grooming". **Tension:** the red token conflicts with the workspace rule that Aarti dislikes red in score and rating viz. | Product leader; soft. |

### (c) Things the docs miss entirely

1. **Market name.** The field says "skills checkoff / skills checklist" (8.3.2, 8.3.3, 8.1.20); the docs say "Skills Tracking" (`grep checkoff` in docs: 0 hits). Aug 21 says names must match market language (7.14). Needs a glossary decision.
2. **Where Skills sits in Prism.** Skills is not named among the modules described on Sep 25 (1.25), and "where does competency sit" is open (8.1.5). No doc says which module or card hosts Skills.
3. **Entitlement and upsell state.** Unsubscribed modules show gray with a no-data example (8.1.2, 8.1.3), and modules are bought per program (8.1.4). The docs have no "Skills not enabled for this program" state (`grep upsell`: 0).
4. **Placement coupling** (see (a)4), the "university site" workaround (6.2), and nursing's ask for lab or simulation assignment without a fake site (8.1.23). Directly touches how lab evidence gets a location without satisfying clinical minimums.
5. **Evidence integrity under placement edits**: cancelling a placement deletes learning activities; on-hold stops entry (1.17). Skills evidence must not hang off a placement lifecycle it does not control.
6. **Merge of student-typed evaluators** (1.16). OD-05 has no merge story.
7. **Publish-to-student gating** and bulk publish exist for competency (1.13). The docs do not say whether student-visible skills results need a publish step.
8. **AI is per-program opt-in** (6.10, 6.11, 5.1, 5.2). Docs C-5 covers copy claims only; the manual path for import and configure must work with AI off.
9. **Prism front end is Angular** (8.2.10). The Next/React build is a design and behaviour reference; the docs do not state the hand-off implication (`grep Angular`: 0).
10. **Student 360** cohort-per-row dashboard with competency and program-requirement columns (3.8). Skills attainment is a natural input; the docs have no roll-up contract (`grep "Student 360"`: 0).
11. **Mock student and mock faculty** accounts exist per program (6.12). `brief-v2` proposes a profile-menu "View as"; the platform already trains staff on a different mechanism.
12. **Persona and module-role model** (8.3.9-8.3.11) and "program" as a shared entity (7.1). Gap G-8 (admin sub-roles) now has a likely answer shape: a persona plus a module-level admin role.
13. **Real evaluation samples are coming** from a medical-student consultant (5.8). They would test the model assumptions in the docs with a non-nursing discipline.
14. **Demo or sales instance** will be populated with fake data (5.9). Skills in such an instance must be program-created sample content, not a shipped taxonomy (SL-01).
15. **Priority signals.** PA has no competitor for skills; undergrad nursing and allied health depend on it; "one screen of a 360" sells (8.3.3-8.3.5); research scope on Oct 2 excluded it (5.5).

### (d) Feedback favouring or killing a variant

No transcript names or kills a variant. The signals are indirect and mostly second-hand, so treat them as nudges.

| Variant | Signal for | Signal against | Net |
|---|---|---|---|
| **A lifecycle** | The platform's own form lifecycle is configure, distribute at anchor points, review, publish, report (1.11, 1.13). | Nothing explicit. | Neutral. |
| **B entities** | The selling view is "one screen of a 360" per student (8.3.5); Student 360 and Placement 360 already treat the student and placement as the unit (3.8, turn 89). | Overview dashboards are rarely visited (1.20); B's Home is counts only. | **Mild support** for the Student entity page. |
| **C workbench** | "Make it actionable" Home (8.1.10) matches the inbox idea; a 10-column competency grid exists (8.2.4); cohort-per-row Student 360 (3.8); term-level views (8.2.3). | No precedent shown at skills scale (150 x 100); the grid-versus-chart preference (8.2.5); red/orange status (3.4) conflicts with the no-red rule; leader dislikes hypothetical prototypes (5.7). | **Mild support** for an actionable home and a cohort view, **not** for a matrix at scale. |
| **Current hybrid (HY-01 Home, five rail rows)** | Actionable Home with attention items and no status counts is exactly what 8.1.10 and 1.20 point to; consistent look and feel (8.2.9). | The product switcher assumption (see (a)5). | **Mild support.** |

---

## 10. Open questions this review leaves for Romit

1. Is there any other record of the Sep 22 Aarti meeting? This file has nothing from it.
2. The Oct 5 transcript is 90 percent unread. Do you want a full pass? Low expected skills density, but I cannot rule out a missed passage.
3. Ask Sankalp: does Skills reuse the platform's reminder engine (OD-18), the Preceptor entity (OD-05), and a publish-to-student step (c)7?
4. Decide the market label before more copy work (c)1.
5. Which module hosts Skills in the Prism landing, and what does a program without the module see (c)2, (c)3?
