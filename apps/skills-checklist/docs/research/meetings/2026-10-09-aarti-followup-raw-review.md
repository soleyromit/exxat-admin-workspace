# Raw review: "Skill Checklist Follow Up Meeting with Aarti" (2026-10-09, 4:00 PM EDT)

Source: Granola `get_meeting_transcript`, meeting id `24cf2e12-df52-4d83-8ecf-4400037840fd`, raw transcript only (no summary used). Read in full: 548 paragraph lines, about 48 KB. Positions below are approximate `~NN%` of the transcript by line number.
Tags: `[DECISION]` `[PREFERENCE]` `[OBJECTION]` `[REQUIREMENT]` `[CONSTRAINT]` `[QUESTION]` `[FEEDBACK-ON-DESIGN]` `[TERMINOLOGY]`. Variant verdicts: CONFIRMS / CONTRADICTS / NEW / NEUTRAL against R1 (report-first), R2 (student-record-first), R3 (requirements-spine).

## 0. Evidence quality (read this first)

- **One channel only.** Every paragraph is `Microphone:`. There is no `System audio` channel, so there is no channel-based way to separate speakers. Two or more people are clearly in the room or on the mic (Romit and Aarti per the invite). **Every attribution to Aarti below is INFERRED from content** (the product-owner voice that says "I hate to set something up per cohort", "that is a bad setup that we have done in Prism today"). Aarti is never named. Romit is addressed once as "Ramit" (~89%: "No, Ramit, I don't want to see unnecessary garbage data"), which supports that the answering voice there is the other participant.
- **Noisy speech-to-text.** Garbled lines are marked and not used: ~0-10% (opening chatter), ~16-27% in part, ~56-62% (travel, Phoenix, "CPC" keywords, a fragment about "work allowance... paid out each Monday"). Treat as unrelated or corrupted.
- **Off-topic block, skipped:** ~0-10% (lab and pathology sciences landing page, "framework page", pharmacy, respiratory, MLS/IBS; "Clinical education... placement management", "Also compliance", "We don't have IP yet") and ~56-62% (travel, flights). This is not Skills Checklist design. I did not use it. It looks like another conversation bleeding into the recording.
- **No Hindi** appears in this transcript; it is English with speech-to-text errors. Nothing is marked `(paraphrase)` except where a line is garbled and I summarise it, and each such case says so.
- **A third and fourth party are mentioned, not present:** Sankalp (back "next week", ~12%), Ankit (to supply examples "by Wednesday", ~14%), Yash (to be consulted on groups and one list, ~81%), Shubhda and Vaibhav (early prototypes, ~15%), EAMs (account managers) to be asked about one list vs several (~44%).
- **Content mostly walks REQ section 1 and SL/IM/SC lines aloud** ("1.4", "1.6", "SLO 6", "IM 10", the "core design principle" paragraph). The call is a review of the requirements document; many quotes are one speaker reading REQ text and the other reacting. Where text is a read-aloud of the REQ I say so.
- **Thin on screens.** No screen, wireframe or variant is shown or named. The only design-shaped statements are about IA objects (list, cohort/group, launch page, soft course highlight). The call does not mention R1/R2/R3, the report/student record split, or the prototype layout.

## 1. Findings (chronological)

### F1. Merge competencies, EPAs, skills, essentials into one student-level area [REQUIREMENT, tentative] [QUESTION] ~14%
Quote: "Find out if it is going to be possible to merge competencies, EPS. Skills and essentials. All these 4 are the words that we keep hearing. So can you just create one student-level area that covers all of it?"
Also (~14%): "to me, I'm keeping it as a thing that I want the team to validate."
Attribution: Aarti, inferred. Firmness: moderate, explicitly "to validate", not decided.
- R1 CONFIRMS (one list, `kind` label, S1). R2 CONFIRMS (one Checklist list, kind label, OD-28 seam). R3 CONFIRMS (one list inside Requirements, neutral spine label).
- Wireframes touched: none structurally. Reinforces the `kind` filter in R1 4.6, R2 4.1 "By requirement" Kind filter, R3 Items tab chips.

### F2. Terminology: the words differ by discipline but mean the same thing [TERMINOLOGY] ~21%
Quote: "So there you can just add competencies, EPAs, as essentials, etc. So it's all— nurse words are different, but it means the same thing."
Also ~21%: "I think the workflow would be the same regardless of ... The discipline, yes."
Attribution: Aarti, inferred. Moderate.
- R1/R2/R3 CONFIRM the program-worded `kind` label (copy token, nothing shipped). CONFIRMS OD-38 direction (workflow is discipline-independent) but does not decide the demo domain.

### F3. One umbrella, and the REQ 1.4 text "complement ... rather than replace" is challenged [OBJECTION to REQ 1.4] [DECISION candidate] ~37-41%
Quotes: "So this skills sit within the broader competency management module and are intended to complement competency tracking rather than replace it. This is what I want to challenge, is can we Make it one and the same. I also am thinking that this should be one." (first sentence is REQ 1.4 read aloud; the challenge is the speaker's, ~37%)
"Which that umbrella term we would need to come up with" (~37%)
"in general, competency and skills are one and the same. Skills are lower level, competencies are higher level behaviors. Yes. And a program is ideally not going to want to use both." (~41%)
Counter-voice (~38-39%): "Competencies and skills are just a list. It's not one, it's not inside of the other." This is a list-vs-hierarchy point (JD analogy: tasks you do to meet a competency, ~39-40%).
Attribution: the challenger is Aarti, inferred; the counter-voice (competency and skills are two parallel lists, not nested) is probably Romit, inferred. Firmness: moderate; the same speaker then says "I think we should validate that."
- R1 CONFIRMS (E1 one list). R2 CONFIRMS. R3 CONFIRMS (it explicitly says REQ 1.4 governs until Sankalp rules).
- All three still keep a nullable competency link. The call says "lower level / higher level": a hierarchy between competency and skill is mentioned, then "just a list". NEW nuance: nobody wants two nav modules; the umbrella label is an open naming task ("we would need to come up with").
- Wireframes touched: nav label for the whole product (all roles), library list header, setup.
- Touches OD-28, OD-02, OD-34. Candidate answer for OD-28: lean to one list, direction firm-ish, final answer explicitly deferred to validation.

### F4. Several lists must be possible, but never mixed in one report [REQUIREMENT] [CONSTRAINT] ~42-47% and ~75%
Quotes: "I don't want to create versions of that list." (~41%) ... "What if they have a second log of competencies/skills? Will we allow that? Will we not allow that?" (~42%)
"I think just to keep things flexible, we might design them. That can support multiple lists." (~44-45%)
"But the workflows and forms and evaluation criteria, everything is defined for the list" (~45%) ... "For the other list, an evaluation form is required." (~46%)
"each list is one report, one tab, one thing. You're never mixing and merging this, but you may create like 2 tabs on the top so I can see log 1 and log 2." (~71%)
"Majority of the time I'll only have one list applicable for one cohort, so not going to run into these issues." (~75%)
Attribution: Aarti for the "design to support multiple lists" and "never mix" lines, inferred.
- R1 CONTRADICTS by omission (one list, one report; "kind" is a label inside it; no tab per list). R2 CONTRADICTS by omission (one Checklist, one record per student; "kind" facet). R3 PARTIALLY CONFIRMS (a requirement set can differ per cohort, set selector at top of Cohorts) but R3 says "Groups may mix kinds" in one list, which the call does not support if the lists are separate logs.
- NEW object for all three: a **List (also called log)** that owns its own evaluation workflow, forms and criteria, is versioned, and is attached to cohorts or groups. Each list renders as its own tab in the report and the student record.
- Wireframes touched: admin report (add list tabs or a list selector), student record (tab per list), setup (lists as the container for items), student home (tabs). Contradicts the "one record per student, one row per item" rule R2 R1 only if a student gets two lists; the one-list default still works.
- Touches OD-28 (shape of "one list"), OD-06 and OD-33 (evaluation per list). Candidate answer, moderate.

### F5. Do not enforce evaluation-model vs criteria compatibility yet [PREFERENCE] [OBJECTION to REQ core design principle] ~47-48%
Quote (REQ read aloud, ~47%): "Skill evaluated as a single met/unmet outcome cannot also require 3 independent demonstrations and 1 observed because the evaluation never captured a level of independence. The capability must enforce this independency rather than allow 2 to be configured independently."
Reaction (~47%): "But in the beginning, I like to not put too many restrictions because then it is difficult to understand where we should set boundaries and what becomes a hurdle versus what becomes a good validation."
Also: "I'm just going to assume that whatever question from that fast form you map to this kind of is in line with it." (~49%)
Attribution: Aarti, inferred. Romit pushes back with a question ("won't ... criteria ... takes place") at ~48%. Firmness: moderate; she says restrictions can be added later.
- R1 CONTRADICTS (explicit "none is preselected", model chosen first, plus satisfiability/"unachievable not savable" per REQ SC-18). R2 CONTRADICTS (same). R3 CONTRADICTS (model before criteria, "no default", unsatisfiable not savable).
- This contradicts the REQ's own principle and the hard-stop "unconfigured skills can't be mapped". It does NOT say the model choice is optional; it says do not build the compatibility guard first. Flag for Sankalp. Wireframes touched: setup (Configure wizard/Set up panel), sign-off (none).
- Touches no OD directly; closest is SC-18/SC-19 behaviour and OD-36.

### F6. Soft course mapping, restated with a concrete rendering [DECISION] [FEEDBACK-ON-DESIGN] ~52-53%
Quotes: "if you learn something outside of that, I don't want to take away your right to get that validated." / "Either we bold it, we highlight it, we underscore it, we do something to indicate to them that under this course these are the likely skills, but we still show them all of the skills and let them click on any skill that they care to get a sign-off on."
Also (~11%): "mapping it to a course is an optional thing, so it could or could not be associated with a course."
Attribution: Aarti, inferred. Firm (same as the 10-08 call).
- R1 CONFIRMS (star plus bold, "Highlight for course", never gates). R2 CONFIRMS (star, sort first, never hides). R3 CONFIRMS ("Emphasised in <course>", bold). All three CONFIRM. New small detail: "underscore" and bold, in addition to star/colour.
- Wireframes touched: student home, admin report row, setup (course emphasis tab). Touches OD-32 (soft only; no course-pass conferral mentioned here).

### F7. The launch page must show progress, to-do and done; FAST-sourced parts need no design [REQUIREMENT] ~54-55%
Quote: "But how we want to present that data, how we want to show the current progress, where they need to go, what's done, what's not done, that and the launch page has to be there 100%."
Preceded (~54%): "Anything that's coming from fast, we don't really have to spend a lot of design thinking there. It is what it is. It will open up a browser, they'll fill it up, and we'll collect that data."
And (~54%): "it's just the, like, the higher layer about, like the layer above the fast layer. That's what ... we have to build."
Attribution: Aarti, inferred. Firm ("100%").
- R1 CONFIRMS (report is the launch page). R2 CONFIRMS. R3 CONFIRMS. For the **student**, this reads as a launch page showing "what's done, what's not done, where they need to go". R1 4.3 and R2 4.3 and R3 4.3 all match.
- CONFIRMS the evaluator form is FAST-rendered and not designed here: aligns with OD-36 seam (adapter point). Candidate answer for OD-36: reuse FAST as-is, moderate to firm; do not mark decided.
- Wireframes touched: student home, admin report, evaluator page (do not redesign the form body).

### F8. Design to 6 to 8 real examples, not all combinations [CONSTRAINT] [PREFERENCE] ~54%
Quotes: "we'll start with 6 examples of what we have seen." / "We don't have to design it for all possible 8,000 combinations". Plus (~53%): "show me the design for—" each REQ line.
- NEUTRAL to all three. Process constraint: the variants' click counts assume 4 groups of items; the call says examples are coming from Ankit. Supports R3's own caveat that group counts are unevidenced. Wireframe: setup click counts.

### F9. Grouping is the school's own; hierarchy depth is open and a tree [REQUIREMENT] [QUESTION] ~51-52% and ~63-66%
Quotes: "The university can say, I want to group it into— these are my procedures that I'm going to check ... they can decide how they want to organize that list. We need not dictate that." (~51%)
"Category was like grouping. And tagging is just saying these are all related to invasives" (~63%) ... "So it could be like a hierarchical table basically. Yes, but are we going to only do 2 levels or 3 levels or 4 levels? That we have to decide." (~64%) ... "whatever is their hierarchy, we will fix their hierarchy, make it nice. A tree structure." (~65-66%)
Also (~63%): "if there are 2 lists, then they'll just introduce 2 categories." (probably Romit's design reading, inferred; the other side moves to a tree.)
Attribution: mixed, inferred; the tree conclusion is voiced by whoever says "make it nice, a tree structure", likely Romit, with Aarti not objecting.
- R1 CONTRADICTS (category 0..1 per item, flat, REQ SL-03). R2 CONTRADICTS (category 0..1). R3 CONTRADICTS partially (category plus a separate "group" layer, flat). NEW: a **tree of arbitrary depth** for grouping inside a list, with active/inactive on tree nodes.
- Wireframes touched: library list (setup), admin report grouping rows (R1 category rows, R2 section headers, R3 group rows), student home category groups. Touches OD-20 (hierarchical skills) and REQ SL-03.

### F10. Preload discipline and accreditor lists, always editable by the school [REQUIREMENT] [CONSTRAINT] [OBJECTION to hard stop] ~31-34% and ~50%
Quotes: "we can preload it with the accrediting body lists. But we will have to make it flexible and changeable so that if they want to add more skills, Whatever they are able to do that." (~31%)
"We can pre-populate it with the discipline list, but we have to make that list editable and manageable. By the school" (~32%) ... "there is no need for us to keep anything at the discipline level. We can only use the discipline level information to give them defaults and to load them. But other than that, it's their document, their list." (~34%)
After the REQ line "ships. No skills, no categories, no taxonomy..." (~50%): "Yeah, but we could load it up with the known competencies or skills or essentials for that discipline and then let them customize it."
Attribution: Aarti, inferred; stated twice. Firmness: moderate to firm as a preference. The scope is "at each OU code level" (~33%), i.e. the list lives at the school or program (org unit) level.
- **R1, R2, R3 CONTRADICT** their empty-state premise ("Prism ships no items", `[REQ SL-01]`). The workspace hard stop is "no shipped skills/taxonomy". This is a direct tension to raise with Sankalp, not to resolve. Candidate shape: optional starter list per discipline, loaded once, then wholly owned and editable by the school (a copy, never a live link).
- Wireframes touched: setup first-run empty state (R1 Frame 1, R2 Step A, R3 State 1): add "Start from a discipline list" beside Import. New OD proposal (see section 4). Hours/accreditor schedules stay out.

### F11. Students can't add tracked skills; the program list is what is required of every student [CONSTRAINT] ~35-36%
Quotes: "a student can't say that, hey, like I want to learn this skill at all." / "Whatever they are going to update and edit to the list is Then they have to give proof to the accrediting body." / "Student by student, this does not change." / "So, okay, students can do whatever they want on top of it, but that's not going to be tracked." (~36%)
Attribution: Aarti, inferred. Moderate to firm.
- R1 CONFIRMS (same denominator for all students). R2 CONFIRMS (R6, defined once). R3 CONFIRMS (set applies to every student; its "Other items (not in the set)" line is consistent with "do whatever on top, not tracked").
- NEUTRAL on whether the extra work counts toward the record: the call says it is not tracked, R3 4.3 says evidence still counts to the record. R3 slightly CONTRADICTS "not going to be tracked" (wording to check). Touches OD-30 weakly: "what is the program going to say that you need to have these things before you can graduate" (~36%).

### F12. Lists attach to cohorts, with a default, no cloning, no per-cohort setup [REQUIREMENT] [PREFERENCE] [DECISION candidate] ~68-76%
Quotes: "I hate to set something up per cohort because That is a bad setup that we have done in Prism today" (~68%)
"you have a log of the skills categories, whatever, and you attach it to the cohort that you want it to be." (~69%)
"Then if something changes, you create a new list and then you start attaching your new cohorts to that new list." (~70%)
"it changes every 7-10 years" (~70%)
"I don't want to do clone in here." (~71%)
"if you mark that list as default, then anytime a new cohort is added, that list is automatically added to that cohort." (~73%)
Attribution: Aarti, inferred. Firm in tone and repeated.
- R1 NEW (no list-to-cohort model; "Cohort" is only a report filter). R2 NEW (same). R3 CONFIRMS most closely: "Requirement set [version 3 v]" plus "applies to COHORT(s)" and "Apply set to cohort" seam; but R3 has one set, not several, and the "apply" button is a per-cohort act, which the call dislikes if it implies per-cohort configuration. The call prefers "checking off which cohort will use this list" and a default flag.
- Wireframes touched: setup (list detail page with "used by" cohorts or groups and a Default switch), admin report header (which list), student record (which lists apply). Also touches the compare-and-clone ("copy from last term") idea: for lists, clone is explicitly unwanted. Touches OD-01 (carry-forward) only for lists, not for course mappings; course mapping is not discussed. Candidate answer for "no clone, version the list": moderate.

### F13. Reporting entry points: cohort summary and student detail; compliance dashboard is the reference [REQUIREMENT] [FEEDBACK-ON-DESIGN] ~75-77%
Quotes: "when I'm doing a review, I'm going to want to pick a cohort and all the students who are in that cohort." / "there are 29 students in this cohort, who's meeting the criteria, who's not meeting, etc. So some high-level report at the cohort level will be necessary." / "compliance is a good reference for you to use. So when I do compliance dashboard, I go pick a cohort and I look at what's going on with this cohort. But then when I've selected a particular student ... I also see, okay, the student was supposed to upload 10 documents. What happened? What is the status?"
Attribution: Aarti, inferred (the "29 students" summary and the compliance reference); Romit relays the "one inside the student" idea. Firm.
- R1 CONFIRMS (cohort report plus student panel). R2 CONFIRMS (Students page plus record page). R3 CONFIRMS (Cohorts page plus panel). The call also asks for a **snippet of the skills data on the student profile elsewhere in Prism** (the "snippet ... shown at other entities", ~77%). NEW: embeddable snippet on the existing student profile. R2 and R1 mention embeddability (OD-34); R3 too; none draws the snippet.
- The call names the Prism **compliance dashboard** as the model for the cohort-pick-then-summary pattern. NEW visual reference. Wireframes touched: admin report (add explicit group/cohort picker as step one), student record, reports.

### F14. Group students by custom "student group", not only cohort [REQUIREMENT] [OBJECTION to cohort-only] ~78-84%
Quotes: "We're only going to do it at student level and cohort level. And we'll not do it at a cohort level, we'll do it at a student group level because the whole cohort idea ... is something that is getting challenged" (~78%; the first "cohort level" is likely a transcription slip)
"nursing schools are not able to use cohort effectively. They like to do tracks, and then within tracks they like to do other things." (~78%)
"instead of just defining the group of students with one criteria called cohort, we'll allow them to define what is a group of students, then let them apply it to that group of students." (~80%)
"it's worth asking Yash if we are ready to think about applying competencies to a group of students rather than a cohort." (~80%)
"For lockstep programs, cohort works just fine." (~81%) / "like a toggle ... two types of groups. One is a cohort and one is just custom" (~82%, Romit relay)
Also: placements already use "define a placement group" (~84%).
Attribution: Aarti, inferred. Firmness: moderate; she tells Romit to confirm with Yash, so not decided.
- R1 shows "Cohort: BSN 2027" plus a separate "Group: any" filter, so PARTIALLY CONFIRMS. R2 uses "Cohort: BSN 2027" plus a "Group" select, PARTIALLY CONFIRMS. R3 uses "Cohort" as the primary axis and the set applies "to cohort(s)", CONTRADICTS (cohort is the primary unit).
- NEW: the unit of assignment and reporting is a user-defined **student group** (cohort is one kind of group). Wireframes touched: admin report filters and page title ("Cohorts" nav in R3 becomes wrong), setup (apply list to groups), reports/export header. Also: "few students I want to evaluate [with] different evaluation criteria" (~79-80%): per-group criteria override, NEW.
- Touches OD-34 only loosely; propose a new OD.

### F15. Students can send to anyone, by typing name and email; show recent [REQUIREMENT] [DECISION candidate] ~85-86%
Quotes: "we don't need them to be coming from a dropdown list or only preceptors they can send it to or whatever. We'll let them put in the name, email. If they've already put in the name, email previously, that we can show that as easy access. But they should be able to send it to anyone they want to send it to. A lot of times in ICU, they are with whoever they are with."
Attribution: Aarti, inferred. Firm (the ICU reason). Romit links it to a known coordinator bug ("not able to add a preceptor which was not part of the evaluation", ~86%) which "this SLO ... would solve".
- R1 CONFIRMS (recent evaluators as chips, Named by students). R2 CONFIRMS. R3 CONFIRMS. However the variants also keep "evaluator role constrained" (REQ ST-08) and an adopt/roster tab; the call says anyone, any role. R1/R2 PARTIALLY CONTRADICT (role constrained by setting). OD-05 candidate answer (person-lite record by name and email), moderate.
- Wireframes touched: log sheet/Ask for review sheet (student), setup evaluators tab.

### F16. Library requirements: searchable, filter by name/category [REQUIREMENT, REQ read aloud] ~87%
Quote: "Library must be searchable and filterable by name category." Read-aloud REQ. NEUTRAL; all variants already search and filter. Skip detail.

### F17. Deactivation: remove from reports and student pages, never delete data; use a new list for real changes; allow delete only before any tracking [DECISION candidate] [CONSTRAINT] ~88-93%
Quotes: "I don't want deactivated things in the report. If you are on purpose making a change to the list, Then you— that's a new list, then create a new list." (~89%)
"Don't delete the data, but don't show the list." (~90%)
"Inactive just means I made a mistake and I want to like not worry about it. Or I was doing it but now I don't want to do it." (~88%)
"Only when there is data that you started tracking against that you should prevent them from deleting. Exactly" (~93%)
Counter (probably Romit): "I'm more concerned about the reporting side where Again, like it's a part of accreditation." / "can we at least validate when we say deactivate?" (~89%)
Attribution: Aarti for the decision, inferred, firm; Romit raises the accreditation-history concern.
- R1 CONFIRMS (REQ SL-11, deactivation withdraws from reporting) but the exact semantics for old cohorts are now "use a new list". R2 CONFIRMS (R2 section 7 SL row). R3 PARTIALLY CONTRADICTS: R3 7.1 says "Show '1 item withdrawn' in the set status line and keep evidence", which the call would reject as "unnecessary garbage data".
- NEW: delete is allowed until evidence exists; deactivate is the fallback; real changes create a new (versioned) list. Wireframes touched: library list (add Delete when no evidence), setup, admin report status line (R3). Touches REQ SL-11 and OD-24 (in-flight not addressed).

### F18. Import: bulk first, then configure; AI clean-up on import [REQUIREMENT, REQ read aloud] ~93-96%
Quotes (REQ read aloud, ~93%): "Programs do not arrive without a skills list... requiring it to be re-entered one skill at a time is the largest single obstacle".
"allow for easy upload of the list." / "So AI generated. Cleanup should happen and should import." (~94-95%, garbled).
Concern (~96%): "This IM 10-point would be like a pain if We still asked like the admin to like, you know, go through the configuration again and just complete it." (probably Romit; IM-10 derived "not set up" state)
- R1/R2/R3 CONFIRM import first, configure after. The IM-10 pain point is a mild flag: R1 Frame 3 and R2 banner both make admins go through configuration for all unconfigured items; kits mitigate it. NEUTRAL, small support for kits/group configure.

### F19. Evidence variety and aggregate criteria shapes [REQUIREMENT] ~17-19%
Quotes: "skills can be either signed off by a preceptor, like procedure log, right? Like all they are doing is getting a sign-off from the preceptor through a PA passport." (~16%) / "So it can either be a just a simple sign-off by a preceptor or the faculty, or could be a student themselves." (~17%)
"Some schools care about like a number. Have you done at least 3 of these, at least 5 of those? ... is the average high? If you did it 10 times, what's the minimum? What's the maximum? So there we don't know all of the permutation combination, but it could be score-based ... or it could be like a completely feedback form that you have to fill for each skill" (~17-18%)
"I am completing an end-of-rotation exam and evaluation form, and question 1 is asking about competency 1, and question 3 is asking about competency 2" (~18%)
Attribution: Aarti, inferred. Moderate; repeated from 10-08.
- R1/R2/R3 CONFIRM the seam list (self, faculty, assessment question). NEW: **aggregate criteria** (average, minimum, maximum across repeated evaluations) are not in any variant; today criteria are counts and levels. Wireframes touched: setup criteria editor, student/admin counts line ("n of N"). Touches OD-31, OD-37, OD-33 (no chain order discussed here), AE criteria.

### F20. Tracking turns evaluations into skills; no curriculum mapping [CONSTRAINT] ~18-19%
Quotes: "So the curriculum mapping as such is not part of it. Like you are not trying to say, what am I going to teach here? ... But what, how am I assessing it is what we are mapping." / "it's not necessary feedback, it's evaluations, right? The end of the rotation evaluation." (~19%)
- CONFIRMS the exclusion of curriculum mapping in all three (course mapping is soft emphasis). NEUTRAL.

### F21. Exams as proof: unlikely; at most a note with a link [DECISION candidate] [PREFERENCE] ~23-29%
Quotes: "a standardized exam or an assessment exam may not give you that. Like, if you have OSCEs, if you have clinical things, that may be more likely" / "it's unlikely, not impossible." / "Like the USME exam is something that, or MPJE exam the student has to give, and that's it, like with a link. But it is not going to give a whole workflow around it." (~29%)
Attribution: Aarti answers, Romit asks, inferred. Moderate to firm.
- R1/R2/R3 CONFIRM that automatic sources are seams, off in v1. R1 row "Question or whole assessment" and "Outside performance data" CONFIRM "not v1". NEW: a program may list a **licensure exam as a plain checklist line with a link and no workflow**. Wireframes touched: setup (item kind "external requirement, link only"), student home (a row with a link, no Ask for review). Touches OD-31 (candidate: exams not an evidence source in v1, firm-ish).

### F22. Visualization for sub-competencies and 140 skills [QUESTION] [REQUIREMENT] ~14% and ~19-20%
Quotes: "if you have 2-level competency, 3-level competency, then how are we going to show it? So we need some visualization for like sub-competencies and sub-sub-competencies" / "if you're going to have 140 skills, how are we going to envision it?" (~14%)
"This is your score and this is the class score." (~20%, about the spiderweb) in reply to "are we expecting like any kind of comparison ... an average" (~19%)
Attribution: Aarti, inferred, for the viz need. The class-average line is probably Aarti or Romit; unclear. Firmness: question, not a decision.
- R1 CONTRADICTS-by-silence (numerals, text, no chart). R2 CONTRADICTS-by-silence. R3 CONTRADICTS-by-silence. NEW: a **hierarchical visual** for multi-level competency and a way to read 140 items. R2 4.3 and R3 4.3 hold the explicit rule "Students never see other students or a class average"; the call mentions a class-score comparison on the spiderweb (competency product). That is a possible CONTRADICTION of R2 R3 (and R1 journeys), but it is about the competency spiderweb, not the checklist. Needs a question, not a change. Wireframes touched: admin report (summary visual), student home (overall view).

### F23. Process items, no design effect
~12% Sankalp back next week, use cases then; ~14% Ankit to supply examples by Wednesday, follow up on Wednesday; Shubhda's early prototypes available as reference; ~44% ask EAMs whether one list is enough; ~80% ask Yash on groups.

## 2. Comparison summary table

| # | Finding | R1 | R2 | R3 | Wireframe/section that changes |
|---|---|---|---|---|---|
| F1 | One list for competency, EPA, skill, essential | CONFIRMS | CONFIRMS | CONFIRMS | nav label, library |
| F3 | Challenge REQ 1.4, umbrella term | CONFIRMS | CONFIRMS | CONFIRMS | nav label (all roles) |
| F4 | Multiple lists, each its own report/tab, never mixed | CONTRADICTS | CONTRADICTS | PARTIAL (set selector) | admin report, student record, setup |
| F5 | Do not enforce model-vs-criteria yet | CONTRADICTS | CONTRADICTS | CONTRADICTS | setup/Configure |
| F6 | Soft course highlight, show all | CONFIRMS | CONFIRMS | CONFIRMS | student home, report row |
| F7 | Launch page shows done/not done/where next | CONFIRMS | CONFIRMS | CONFIRMS | student home, report |
| F9 | Own grouping, tree of unknown depth | CONTRADICTS (flat category) | CONTRADICTS | CONTRADICTS (flat group) | library, report grouping, student groups |
| F10 | Preload discipline/accreditor lists, editable | CONTRADICTS | CONTRADICTS | CONTRADICTS | setup first run |
| F11 | Students cannot add tracked skills | CONFIRMS | CONFIRMS | CONFIRMS (wording check "Other items") | student home |
| F12 | List attached to cohorts, default flag, no clone | NEW | NEW | PARTIAL CONFIRMS | setup, report header |
| F13 | Cohort summary plus student detail, compliance dashboard model, snippet elsewhere | CONFIRMS | CONFIRMS | CONFIRMS | report, student record, embedded snippet |
| F14 | Custom student group, not only cohort | PARTIAL | PARTIAL | CONTRADICTS | report filters, nav, apply-list |
| F15 | Send to anyone by name/email | CONFIRMS (role constraint conflicts) | CONFIRMS (same) | CONFIRMS | log sheet, evaluators tab |
| F17 | Deactivate off reports, delete if no data, new list for change | CONFIRMS | CONFIRMS | PARTIAL CONTRADICTS (withdrawn line) | library, report status line |
| F19 | Aggregate criteria (average/min/max) | NEW | NEW | NEW | setup criteria, counts line |
| F21 | Exams only as link-only line | CONFIRMS | CONFIRMS | CONFIRMS | setup item kind |
| F22 | Hierarchy visual for sub-competencies, 140 items | NEW | NEW | NEW | admin report, student home |

Wireframe areas not touched by this call: sign-off (approval queue), preceptor page, reports/export beyond the header (group name, list name should appear in the file header). The call says nothing on sign-off chains, "waiting on me", or the evaluator page.

## 3. ODs touched (all remain OPEN)

| OD | What the call says | Candidate answer | Firmness |
|---|---|---|---|
| OD-28 / OD-02 (one list vs separate) | F1, F3: challenge REQ 1.4, "should be one", umbrella term needed; but several lists must be supported and "validate" | One list is the direction; separate lists are still possible as multiple logs | Moderate; Aarti herself says validate with EAMs and Yash |
| OD-29 (report is launch page; who triggers) | F7: launch page "has to be there 100%"; F13: cohort pick, summary, student detail | Launch page candidate; who triggers a review is not discussed | Firm for launch page; silent on trigger |
| OD-30 (program requirement) | F11: program says what students need before graduating; same for every student | Weak support for a defined-once program requirement; no totals, no hours | Weak |
| OD-31 (evidence sources) | F19, F21: preceptor/faculty/self sign-off, counts, scores, feedback/evaluation question; exams unlikely | v1 student-submitted plus question-level evaluation; exams link-only | Moderate |
| OD-32 (course soft mapping) | F6 | Soft only; no conferral mentioned | Firm |
| OD-36 (FAST reuse) | F7, F5: FAST is "what it is", build the layer above it | Reuse FAST, build the layer above | Moderate to firm |
| OD-37 (self-attestation) | F19: "could be a student themselves" | Self-attestation exists as one option | Moderate |
| OD-05 (evaluator record) | F15: name and email, send to anyone | Person-lite by name and email | Moderate |
| OD-01 (carry-forward) | F12: attach list to new cohorts, default flag, no clone | Applies to lists (not course mappings), no clone | Moderate |
| OD-20 (hierarchy) | F9: tree of unspecified depth | Tree, depth open | Weak |
| OD-24 / SL-11 | F17: deactivation semantics | Deactivated items leave reports; delete if no evidence | Moderate; in-flight not addressed |
| OD-38 (domain) | F2: workflow same across disciplines | Does not pick the demo domain | Weak |

## 4. New questions this call raises (proposals, not decided; not added to `source/proposed-ids.txt`)

1. **List (log) as a first-class, versioned object** attached to cohorts/groups with a default flag, multiple lists per group, one tab per list (F4, F12). Blocks IA for setup and report header.
2. **Student group vs cohort** as the unit of assignment and reporting (F14). Ask Yash.
3. **Starter content vs REQ SL-01 "ships no skills"** (F10). Ask Sankalp; hard-stop conflict.
4. **Enforcement of model-vs-criteria compatibility in v1** (F5). Conflicts with REQ's own design principle.
5. **Grouping tree depth** (F9) and its relation to REQ SL-03 (category 0..1).
6. **Aggregate criteria** (average, min, max) (F19).
7. **Link-only external requirement lines** (licensure exams) (F21).
8. **Class-average comparison** on a student view (F22): the spiderweb shows it; the Skills variants forbid it. Confirm scope.

## 5. What this call does not give

- No reaction to any wireframe, screen, variant or the prototype.
- Nothing on sign-off chains order, administrator approval, return wording, evaluator link lifecycle, thresholds for "behind", or reminders.
- No quote that is cleanly attributable to Aarti by name; all attribution is inferred from content on a single mic channel.
- I read R1 lines 1-573, R2 lines 1-609 and R3 lines 1-615 only. Their later sections (risks, remaining seams, smallest slice, sections 8 to 12) were not read, so verdicts rest on the sections listed above.
