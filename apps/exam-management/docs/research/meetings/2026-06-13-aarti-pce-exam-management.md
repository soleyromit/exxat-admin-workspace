---
type: meeting
date: 2026-06-13
product: exam-management
participants: [Romit Soley, Aarti, Vaibhav (design review)]
source: granola-private-notes
granola_id: ab7e2691-bfaa-4ace-ac8f-29fcb2a3daec
recording: 2026-06-04T14:17:49Z (1h 8m)
---

# Meeting with Aarti on PCE, Exam Management — 2026-06-13

> Granola entry dated Jun 13; content is a verbatim transcript of a June 4 recording (20260604_141749, 1h 8m 20s). Covers two topics: (1) PCE product philosophy from Aarti, (2) exam-management assessment builder design review with Vaibhav showing work-in-progress console. This file covers the exam-management decisions.

## Topics covered

- Assessment builder design review (Vaibhav showing WIP console to Romit + Aarti)
- Two design tracks approach: concept vs. Phase 1
- Assessment lifecycle tabs within a course
- Faculty section assignment scope
- Assessment review workflow scope
- Assessment list columns and status model
- Prism + new module coexistence (applies to both products)
- Cohere conference user testing

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_EM_J13_01 | Assessment review workflow = Phase 2. "Later we can build in review process because review is like a phase two process. So we're not doing that." Supersedes T47's P1 designation — move T47 to Phase 2 deferred. | exam-management |
| D_EM_J13_02 | Faculty section assignment (assign a section to a faculty member to add questions to it) = Phase 2. "Is this feature going in the first phase? No, not yet." Design is fine to think through conceptually; remove the control from the Phase 1 deliverable. | exam-management |
| D_EM_J13_03 | Two parallel design tracks confirmed: (1) Concept — big picture with all features and phases; (2) Phase 1 cleaned-up — only what ships in P1. Both can be shared. "Whether it's a Figma that aligns the big picture, whether it's a document... I don't really have a position there, but we have to have a little bit of product thinking before we do a deep dive into nuances." | exam-management |
| D_EM_J13_04 | Assessment lifecycle within a course has three distinct operational phases: (a) Edit/Build — questions, sections, structure; (b) Publish/Distribute — dates, delivery method, time limits, window; (c) Stats/Monitor — completion tracking, proctoring view. Distribution is SEPARATE from building, not an inline tab inside the builder. "There needs to be a place for that ending of the exam — what's my target, what's my goal." | exam-management |
| D_EM_J13_05 | Assessment list grid: shows name, status ("Not yet published" with publish action / "Published" + date), and key attributes (timed, scored). "If published date is already entered, it will be there. If the published date is not there, the status will say not yet published." Assessment attributes (timed/scored) as inline chips next to assessment name. | exam-management |
| D_EM_J13_06 | During active exam (proctoring), show: started count, submitted count, not-yet-submitted count. Focus is monitoring, not completion-rate tracking. Basic counts are enough; detailed per-student timing data is not a P1 priority. | exam-management |
| D_EM_J13_07 | Prism + new module coexistence: new exam-management and PCE modules must coexist with old Prism. Not a copy-paste, not a completely separate island. Himanshu must be included in nav/design discussions before shipping. "Before we say this is ready for consumption, Himanshu needs to be included, aligned, and invited." Aligns with T88 / D_PCE10. | exam-management |
| D_EM_J13_08 | Cohere conference: Romit + Himanshu booth for user testing. 300+ attendees. User acceptance testing, AB testing, current-product issue collection. Planning meeting post-India (July). Aarti applying for Himanshu US visa. | exam-management |

## Verbatim quotes

> "Is this feature going in the first phase? [Faculty section assignment] No, not yet. Okay. So it's a conceptual. So again, like for me, the easier part is that I can just say that just remove the button so it's not a big problem for me." — Aarti

> "Later we can build in review process because review is like a phase two process. So we're not doing that." — Aarti

> "From this conversation right here, what I have now understood is there are going to be two different kind of design activities from my side. One is purely concept. This is just our exclusive discussion where everything is possible. And then there is a part of it where we say that... a cleaned up version." — Romit (confirmed by Aarti)

> "Whether you want to call it deliver or you want to call it publish, I'm okay with anything, but there needs to be a place for that ending of the exam — what's my target, what's my goal, is what you're setting up in the structure... and then the end of it is, okay, I'm done selecting the questions, I'm done setting up the structure, now I want to tell you when and how the students are going to be able to access it." — Aarti

> "If published date is already entered, it will be there. If the published date is not there, the status next to this can be not yet published or whatever. Yes." — Aarti

> "We are going to try and get Himanshu a visa for the US. And in Cohere, we want to do some user acceptance testing, some AB testing, some feedback gathering. So after I'm back from India, is in July, I want to have a conversation with you and Himanshu together." — Aarti

> "I am very, very clear from day one that this point will come. So regardless of which stage it is, the delivery is there. My problem has been that the communication... And so it's not necessarily an aptitude of any one person that is leading to this. It's the chaotic nature of our setup, but our setup is our setup and I cannot change our setup right away." — Aarti

## Design tasks generated

- T97 (exam-management): Assessment lifecycle tabs within course — design the assessment landing page (after creation) with three distinct tabs/states: Edit/Build, Publish/Distribute (dates, window, delivery method), Stats/Monitor (proctoring view). Each tab has distinct actions and content. D_EM_J13_04.
- T98 (exam-management): Cohere conference booth planning — user testing with Romit + Himanshu. Post-India (July) meeting with Aarti to plan. Activities: AB testing, issue collection, feedback. Coordinate screens/iPads with Kunal. D_EM_J13_08.
- Update T47: Assessment review workflow → Phase 2 confirmed. Remove P1 designation. D_EM_J13_01.
- Update T45: Faculty section assignment → Phase 2 confirmed. Remove from Phase 1 scope. D_EM_J13_02.
