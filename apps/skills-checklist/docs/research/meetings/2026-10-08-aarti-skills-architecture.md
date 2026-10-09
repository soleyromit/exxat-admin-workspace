---
type: meeting
date: 2026-10-08
product: skills-checklist
participants: [Aarti Vaishnav, Romit Soley]
source: granola
granola_id: 095fe094-141b-447d-b5a2-c8c0472ec60e
---

# Skills Checklist — Aarti Architecture Dump — 2026-10-08

**Date:** 2026-10-08 4:30 PM EDT
**Participants:** Aarti Vaishnav (CPO), Romit (Design)
**Topic:** Aarti's knowledge dump on skills checklist — architecture, placement, completion logic, multi-discipline configurations

---

## Summary

Aarti walked through the full conceptual model for skills checklist. This is the definitive architecture session for the product. Key outcomes: skills live at the student/program level (not course level); course mapping is soft visual highlighting only; skills and competencies are the same thing and should be one module; the student's report page and launch page are unified; the product lives under "student success" / "program requirements."

---

## Topics covered

1. Completion criteria configurations (count, threshold, self-attestation, faculty/preceptor sign-off, multi-approver)
2. Soft vs. hard course mapping — Aarti's definitive position
3. Skills = competencies = EPAs = essentials = procedures — one unified module
4. Report = launch page for student
5. 5 input sources for skill completion
6. Product placement: "student success" / "program requirements"
7. Hours tracking explicitly out of scope
8. Extend existing competency module rather than build from scratch
9. Multi-discipline requirements (nursing, SLP, PA, pharmacy, nutrition, radiation therapy)

---

## Decisions

| # | Decision | Product | Quote |
|---|---|---|---|
| D1 | **Report = Launch page (student).** The student's skills completion dashboard IS the same view from which they trigger new skill evaluations. No separate "reports" tab and separate "do it" tab. | skills-checklist | "My report should be my launch page. I don't want a separate place where they go to see what I have met and run a report, and then a separate place where they have to go to trigger." |
| D2 | **Soft course mapping only.** Skills are at the student/program level. A course can visually highlight its relevant skills (bold, star, different color) but there is no hard mandatory/recommended enforcement per course. Students always access skills from the main skills checklist — not from inside a course. | skills-checklist | "skills is agnostic of course as much as possible… You either put them bold or put a star in front of them or make them in a different color or something… But they should still go to the main skills checklist." |
| D3 | **One unified module: skills = competencies = EPAs = essentials = procedures.** Don't build separate modules per terminology. One list, programs name it however they want. Align with Yash before building. | skills-checklist | "should we just design it as one?… I'm going to say these 40 things a student must know and call it whatever I want to call it." |
| D4 | **Program-level list, activated at student level.** The skills list is defined at program level. Each enrolled student has the list activated for them. | skills-checklist | "are we going to say that at a program level, I want the students to fulfill 100 skills? Which I'll activate at student level." |
| D5 | **Lives under "student success" / "program requirements."** Skills checklist is NOT a standalone product — it is a module inside student success. Sent as part of student success, not separately. | skills-checklist | "We will put this under program requirements… This will be modularized, right? Only part of student success. Today we're not going to send it separately." |
| D6 | **Hours tracking is explicitly separate.** Clinical hours belong to a separate module, not skills checklist. | skills-checklist | "we are not going to do hours in here. That way we'll keep it separate. Separate, okay." |
| D7 | **5 input sources for skill completion evidence.** A skill can be completed via: (1) a question in an end-of-rotation eval form, (2) a question in an exam/assessment, (3) passing an entire assessment (minimum score), (4) a course grade (pass course = check off mapped skills), (5) a standalone FAST form sent to a preceptor/faculty. | skills-checklist | "They can get it from a question in an end of rotation form. They can get it from a question in an assessment. They can get it from passing that assessment… Or I can get it from a grade of a class… Or they can get from a unique FAST form that is used to assess that particular thing." |
| D8 | **Extend existing competency module rather than building from scratch.** Exxat already has competency mapping implementations. Build on top of that infrastructure. Talk to Ankit about existing setups across nutrition, PA, SLP, pharmacy, nursing, radiation therapy. | skills-checklist | "we already have a lot of competency mapping figured out. So maybe we don't develop something completely from scratch and we just figure out how to extend the competency." |
| D9 | **Multi-discipline completion criteria must all be configurable.** Met/not-met logic can be: count-based ("do 3 times = good"), threshold/score-based ("reach level 4"), self-attestation, faculty sign-off, preceptor sign-off, multi-approver (faculty then preceptor). Any combination must be configurable per skill per program. | skills-checklist | "Met, not met, yes, no. Thing can be based on count. Thing can be based on reaching a certain threshold. It can be self. It can be faculty-based, it can be faculty plus preceptor-based." |

---

## Conflict with existing backlog (requires resolution)

**T_SC_07 vs D2:** T_SC_07 (from 2026-09-23 Sankalp session) says "mandatory vs. recommended" course mapping. Aarti (Oct 8) says soft visual mapping only — no hard mandatory/recommended enforcement. These conflict. Need to align Aarti + Sankalp.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T_SC_17 | Resolve T_SC_07 conflict: Sankalp said mandatory/recommended course mapping; Aarti says soft visual only. Get alignment. | P0 | Blocker for any course-mapping design work. |
| T_SC_18 | Design unified student launch + report page. Status (what I've done) and trigger (initiate new eval) must be the same view. | P0 | New from Aarti D1. |
| T_SC_19 | Strategic: design as one module for skills/competencies/EPAs. Align with Yash (PM/Tech) before any module-level architecture decisions. | P0 | New from Aarti D3. |
| T_SC_20 | Product placement: "program requirements" inside student success. Define where skills checklist nav entry lives. | P1 | New from Aarti D5. |
| T_SC_21 | Design 5 completion input sources into the student/admin data model. Each skill can be satisfied by: EoR form question, assessment question, assessment pass, course grade, standalone FAST form. | P0 | New from Aarti D7. |
| T_SC_22 | Confirm hours tracking is NOT in skills checklist scope — update T_SC_01 brief accordingly. | P0 | New from Aarti D6. |
| T_SC_23 | Research: consult Ankit on existing competency module implementations (nutrition, PA, SLP, pharmacy, nursing, radiation therapy). Identify what can be extended vs. rebuilt. | P0 | New from Aarti D8. Romit action item. |
| T_SC_24 | Ensure admin config supports all 9 completion criteria variants: count, score-threshold, self-attestation, faculty only, preceptor only, faculty+preceptor, multi-step approver chains. | P0 | New from Aarti D9. Refines T_SC_03/T_SC_04. |

---

## Verbatim Aarti quotes

> "My report should be my launch page. I don't want a separate place where they go to see the what I have met and run a report, and then a separate place where they have to go to trigger."

> "skills is agnostic of course as much as possible… you put them bold or put a star in front of them or make them in a different color or something. A soft mapping that tells the student these are the ones you're more likely to do through this course. But they should still go to the main skills checklist."

> "should we just design it as one?… I'm going to say these 40 things a student must know and call it whatever I want to call it."

> "We will put this under program requirements. This will be modularized, right? Only part of student success. Student success. Today we're not going to send it separately."

> "we are not going to do hours in here. That way we'll keep it separate."

> "So I say we don't develop something brand new, we just figure out how to extend the competency."

> "Talk to Ankit. Morning tomorrow. And find out, ask him to point you to the different unique setups that we've done for the nutrition. You can tell them that I'm working about skills and competency. So variation tech, PA, SIP, nutrition, wherever you have examples, you can come with those."
