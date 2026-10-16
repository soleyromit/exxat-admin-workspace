---
type: meeting
date: 2026-10-15
product: skills-checklist
participants: [Aarti Vaishnav, Vishakha Bhave, Sankalp Panda, Romit Soley, Kunal Vaishnav, Yash Shah, Mansi Parikh, Prabir Sarkar]
source: granola
granola_id: 2954523d-552e-4b0f-a71e-bf65e1389a7c
---

# Discussion on skills tracking in Prism — 2026-10-15

**Date:** 2026-10-15 7:00 AM EDT
**Participants:** Aarti (CPO), Vishakha (PM), Sankalp (Engineering), Romit (Design), Kunal (Engineering), Yash Shah, Mansi Parikh, Prabir Sarkar
**Topic:** Module unification (skills + competency), list architecture, student groups, course mapping model, reporting, Q4/Q1 timeline

---

## Summary

Aarti called this meeting to align on the top-level architecture of the skills tracking module before Q4 pre-work begins. Key outcome: skills checklist and compliance competency tracking must be built as **one unified module**, not separate products. Aarti directed the list architecture (multiple lists, assigned via student groups, no cloning), established that course mapping is a soft default, and confirmed Q4 is pre-work/requirements only with Q1 as the delivery target. Romit was assigned competitor analysis ownership.

---

## Topics covered

1. Unified module: skills + competency = one configurable module
2. Multiple list support with single-list-optimized UX
3. Student groups as the assignment mechanism (replaces cohort-only)
4. No cloning of lists — reuse via assignment
5. Course mapping: soft default, hard-mapping as optional config
6. List-level workflow configuration (sign-off, modality)
7. Reporting: student-wise progress + skills-wise performance
8. Q4 / Q1 timeline and bandwidth constraints
9. Competitor analysis: Romit to lead; Trajectsys, Portico, TrackTrack
10. Next milestone: Oct 29 review meeting; then weekly Thursdays

---

## Decisions table

| # | Decision | Product | Applies to | Supersedes |
|---|---|---|---|---|
| D17 | **Unified module.** Skills checklist and compliance competency tracking will be built as ONE configurable module, not two separate products. One school can activate skills tracking, competency tracking, or both — governed by which lists they set up. | skills-checklist | Architecture | Separate-module assumption |
| D18 | **Multiple lists, single-optimized UX.** Backend must support multiple lists. UI optimizes for one list (default experience). When a school has multiple lists, they appear as tabs. "Our screens don't have to be optimized for multiple lists today, but our backend should support multiple lists." | skills-checklist | Admin / Student UI | — |
| D19 | **Student groups replace cohort-only assignment.** Lists are assigned to student groups, not hard-coded to cohorts. For lockstep programs a group = cohort. For non-lockstep programs a group is a flexible custom group. This is a broader Prism-level concept modeled after placement groups — Skills is the first module to introduce it formally. | skills-checklist | Admin config | Cohort-only assumption |
| D20 | **No cloning of lists.** A list is a reusable entity assigned to different student groups. Schools do not copy-paste or clone lists for new cohorts. "I want to get rid of this concept of cloning." | skills-checklist | Admin config | — |
| D21 | **Course mapping is soft by default.** Skills are program-level — a student must complete a skill by graduation regardless of which course they do it in. Course mapping is a recommended overlay, not a hard gate. A hard-mapping config toggle can be added but is not the default. Supersedes D7 (which implied mandatory vs recommended were symmetric choices). | skills-checklist | Admin config | D7 (Sept 23) |
| D22 | **Workflow configuration is at the list level.** How a skill is observed and signed off (faculty sign-off, student self-rating, ClinEd evaluations, exam data, unique standalone form) is configured per list — not per individual skill. Individual skill configuration (evaluation model, frequency) remains at entity level (D2, Sep 23). | skills-checklist | Admin config | — |
| D23 | **Reports: student-wise + skills-wise, with course drill-down.** Two report views: (1) student-wise — per-student progress showing which skills achieved and, if soft course mapping configured, through which courses; (2) skills-wise — across students, which skills are behind. | skills-checklist | Reporting | — |
| D24 | **Timeline: Q4 = pre-work/POC/requirements. Q1 = end-to-end delivery target.** Q4 planning is frozen; no development sprint for this module this quarter. Goal is to have finalized requirements and design ready so Q1 can deliver end-to-end. Weekly Thursday meetings from Oct 29 onwards. | skills-checklist | Project | — |

---

## Verbatim quotes

> "I'm convinced that we need to build it as one module." — Aarti

> "Our screens and everything don't have to be optimized for multiple log— multiple lists today, but our backend should support multiple lists." — Aarti

> "I want to get rid of this concept of cloning… there should be a list and that list is assigned to a group." — Aarti

> "The course-level mapping is a soft mapping. It doesn't matter where you do it — by the time you graduate, you need to do it." — Aarti

> "Everything that you are configuring, you are configuring at the list level." — Aarti

> "Not just showing where the student is at, but also through what courses were they able to check it off if the school has configured soft mapping, hard mapping to courses." — Aarti

> "Q4 planning has completed, frozen. The development — we cannot expect to do grooming and requirement discussion now and then do development in Q4." — Kunal

> "Let Romit drive that competitor analysis. Deep dives, Sankalp, so that you are able to make progress on everything." — Aarti

> "I want to start having weekly meetings for this… October 29th and after that let's set up a Thursday meeting weekly." — Aarti

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_24
