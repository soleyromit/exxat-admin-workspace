---
type: meeting
date: 2026-06-13
product: pce
participants: [Romit Soley, Aarti, Vaibhav (design review)]
source: granola-private-notes
granola_id: ab7e2691-bfaa-4ace-ac8f-29fcb2a3daec
recording: 2026-06-04T14:17:49Z (1h 8m)
---

# Meeting with Aarti on PCE, Exam Management — 2026-06-13

> Granola entry dated Jun 13; content is a verbatim transcript of a June 4 recording (20260604_141749, 1h 8m 20s). Covers two topics: (1) PCE product philosophy and architecture from Aarti, (2) exam-management assessment builder design review with Vaibhav. This file covers the PCE-relevant decisions.

## Topics covered

- Prism + new module coexistence philosophy (Aarti)
- PCE as a standalone product, not a Prism add-on
- Admin role scope for Phase 1 (super admin only)
- Student experience in PCE — anonymous surveys, minimal UI
- Cohere conference user testing booth (Romit + Himanshu)
- Himanshu alignment on new module nav before shipping

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_PCE_J13_01 | PCE must function independently. If no LMS, admin manages student, course, and faculty entities directly in PCE. Saves to Prism entity layer but UI is fully self-contained. "I am not going to be in the situation where you go to Prism, import the students, then you come here. That's not going to happen." | pce |
| D_PCE_J13_02 | Admin role = super admin only for Phase 1. Do not build multiple admin permission tiers for launch. The module will evolve these tiers over time. "We don't want to worry about like, oh, you can do this but not this." | pce |
| D_PCE_J13_03 | Course & Faculty Evaluations is a standalone product. Competitors sell and buy software that only does this. Needs: course dashboard, faculty dashboard, selection screens, historical performance, comparative data. "We have to think about this as a product of its own." Faculty view: comparative performance across terms. Course view: multi-offering aggregation. | pce |
| D_PCE_J13_04 | Student experience in PCE = anonymous and minimal. No student performance dashboard for course/faculty eval because surveys are anonymous. Only optional: a lightweight "pending activities" landing page aggregated by email address showing all pending surveys for that email. "For the course and faculty eval part... the two modules we really need to develop are mostly the admin module and the faculty." | pce |
| D_PCE_J13_05 | Student email has exactly two CTAs: (1) "See all my pending activities" → aggregated pending-activities landing, (2) "Click here to complete this survey" → direct survey link. Aarti: "I don't expect a lot of people to go here. I expect them to barely do this call to action, click done." Confirms T90 / D_PCE14. | pce |
| D_PCE_J13_06 | Cohere conference coordination: Romit + Himanshu to have a shared user-testing booth. 300+ attendees. Activities: current-product issue collection, AB testing on new screens, feedback gathering. Aarti applying for Himanshu US visa. Planning meeting after Aarti returns from India (July). Kunal to coordinate on large screens. | pce |
| D_PCE_J13_07 | New module nav + design decisions must be aligned with Himanshu before any module ships to users. "Before we say this is ready for consumption, Himanshu needs to be included, aligned, and invited to some of these meetings." Coexistence (old Prism + new modules) is the hard part. Confirms D_PCE10 / T88. | pce |

## Verbatim Aarti quotes

> "I am not going to be in the situation, oh, you go to Prism, import the students, then you come here. Oh, you go to Prism, you do that, then you come here. That's not going to happen. This needs to function independently."

> "We have to think about this as a product of its own. Like we need competitive faculty data so I can look at my performance. I can look at comparatively how am I doing compared to other people. Historically, how have I done in this term? People sell and buy this software."

> "The student is really just getting an email to say, click here and finish your survey. So they click there and they go in and they complete the survey and they are done. For the course and faculty eval part, the two modules we really need to develop are mostly the admin module and the faculty."

> "This email should have both buttons. Like, see all my pending activities or click here to complete this survey."

> "Before we say this is ready for consumption, Himanshu needs to be included, aligned, and invited to some of these meetings so that you are not the only one fielding questions around what is the new design philosophy."

> "I do not want it to be a copy paste. I also do not want it to be completely on a different island where it completely ignores every element of today's Prism."

> "We are going to try and get Himanshu a visa for the US. And in Cohere, we want to do some user acceptance testing, some AB testing, some feedback gathering."

## Design tasks generated

- T85 (pce): Cohere conference booth planning — user testing with Romit + Himanshu. Post-India (July) meeting with Aarti to plan. Activities: AB testing, issue collection, feedback. Coordinate screens/iPads with Kunal. D_PCE_J13_06.
