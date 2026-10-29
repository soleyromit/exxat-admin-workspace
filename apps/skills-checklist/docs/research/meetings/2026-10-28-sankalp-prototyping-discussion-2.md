---
type: meeting
date: 2026-10-28
product: skills-checklist
participants: [Romit Soley, Sankalp Panda]
source: granola
granola_id: 655e2cbd-681d-4da7-8b9d-be80cc3a1e76
---

# Skills Tracking — Prototyping Discussion 2 with Sankalp — 2026-10-28

**Date:** 2026-10-28 9:30 AM EDT  
**Participants:** Sankalp Panda (Engineering), Romit (Design)  
**Topic:** Prototype review — dual mapping model, lab checkoff flow, dashboard scope, student view

---

## Summary

Sankalp and Romit reviewed the current Figma/design lab prototype end-to-end. Key outcomes: dual assignment model (skills → courses AND skills → student groups) confirmed as necessary. Two distinct achievement flows identified: student-initiated and faculty bulk lab checkoff. Dashboard scoped to two simple questions for MVP. Time-based / on-pace logic explicitly deferred.

---

## Topics covered

1. Dual mapping model — skills must be mapped to both courses (scheduling) AND student groups (graduation requirements)
2. Skills library placement — whether to sit within existing standards section or standalone (open question for Aarti tomorrow)
3. Two achievement flows: student self-initiates (distributes to preceptor), and faculty bulk lab checkoff (met/unmet grid)
4. Lab checkoff UI: faculty sees grid of students × skills, marks met/unmet in bulk — no student setup required
5. Dashboard scope: simplified to 2 questions — who is falling behind, which skills have lowest achievement
6. Time-based "on pace" logic: Prism doesn't capture academic calendar milestones well; deferred
7. Student view: per-course skills list (mandatory + recommended) + overall program progress view
8. Prototype navigation: Admin Walkthrough vs Student Walkthrough switcher (top-right buttons in prototype)

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D25 | Dual assignment model — skills must be mapped to BOTH student groups (graduation requirement) AND courses (scheduling/order). Course mapping tells students where a skill can be performed; student group mapping defines what they must achieve to graduate. | skills-checklist | Admin setup |
| D26 | Two distinct achievement flows: (1) student self-initiates — selects a skill, self-evaluates if configured, sends to preceptor/faculty for review; (2) faculty bulk lab checkoff — faculty sees a grid of students × skills and marks met/unmet in bulk without requiring student setup. Both must coexist; a checkoff by faculty should count so the student does not need to re-submit. | skills-checklist | Admin / Student / Faculty |
| D27 | Dashboard MVP scope: two questions only — which students are falling behind on their skill requirements, and which skills have the lowest achievement rate across students. No time-based or on-pace signals in Phase 1. | skills-checklist | Reporting |
| D28 | On-pace / time-based tracking (benchmarking skill progress against a curriculum calendar) is deferred — Prism does not currently capture academic calendar milestones reliably. Phase 1 uses absolute counts only. | skills-checklist | Reporting — DEFERRED |
| D29 | Student skill view shows: (a) per-course skills list (mandatory / recommended for this course), and (b) overall program progress across all requirement groups assigned to the student (e.g., "2 of required 9 skills complete"). Skill entry must show which requirement group it belongs to. | skills-checklist | Student |

---

## Verbatim quotes

> "Mapping a skill to a course basically tells the student which skill, when I say mapping, let's say you map and you mandate it — this is mandatory in course 1, this skill is recommended in course 2. Where those 15 skills, the skills that I had to complete, how do we answer that question? That will only come if I am tagged to a set of skills." — Sankalp

> "You create a requirement group or a group of skills, and then you assign it to a group of students or an individual student or whatever. So that stays against my profile that I am a student, I have to meet these 5 skills." — Sankalp

> "The students, they don't do this — the lab instructors or faculty are doing like a simulation lab or something, and then immediately they're checking off multiple students at once. And they're basically just saying met, unmet." — Sankalp

> "Two questions that I wanted to answer: one was, who are your students that are falling behind? And which are the skills that students are finding the most difficult?" — Sankalp

> "We can probably keep it very simple and say that these are the reports — student wise — and even click on a student and see their history." — Sankalp (on dashboard)

> "If we overburden them with a lot of data, lot of insights, they just feel overwhelmed. Keep it very simple to begin with." — Sankalp (quoting Vishakha's guidance on simplicity)

---

## Open questions raised (for Nov 4 call with Aarti)

1. Where does the skills library sit in the product IA — standalone section, or within existing Standards? (Vishakha: merge with standards. Sankalp: lean separate. Aarti to decide.)
2. Do skills performed in a simulated didactic lab carry the same weight as those performed in actual clinical rotations? (Some programs may want setting-level minimums.)

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_21
