---
type: meeting
date: 2026-10-15
product: skills-checklist
participants: [Aarti Vaishnav, Sankalp Panda, Romit Soley, Vishakha Bhave, Yash Shah, Kunal Vaishnav, Mansi Parikh, Prabir Sarkar]
source: granola
granola_id: 2954523d-552e-4b0f-a71e-bf65e1389a7c
---

# Discussion on skills tracking in Prism — 2026-10-15

**Date:** 2026-10-15 7:00 AM EDT
**Participants:** Aarti Vaishnav, Sankalp Panda, Romit Soley, Vishakha Bhave, Yash Shah, Kunal Vaishnav, Mansi Parikh, Prabir Sarkar
**Topic:** Architecture alignment for unified skills + competencies module in Prism

---

## Summary

Aarti called this meeting to align on the overall architecture for skills tracking in Prism before Q4 pre-work begins. The meeting was strategic: no screens reviewed. Key outcome — competencies and skills checklist must be one unified configurable module, not two separate products. Also clarified student groups, no-cloning policy, course mapping being soft by default, the Q4/Q1 timeline, and reporting requirements. Romit assigned competitor analysis. Next meeting: October 29.

---

## Topics covered

1. Unified module decision — competencies + skills = one configurable module
2. Multiple lists — backend supports many; UX optimized for one
3. Student groups — extend beyond cohort-only for list assignment
4. No-cloning policy — replace with one list assigned to any group
5. Course mapping — soft by default; hard mapping is a configuration option
6. Q4 vs. Q1 scope — Q4 = POC + requirements; Q1 = full delivery
7. Data sources for skills — ClinEd, exams, or unique form; student can trigger
8. Reporting — student-wise and skills-wise; course-of-completion drill-down
9. Competitor analysis — Romit to own deep-dive (TrajectSys, Portico, Registries, TrackTrack)
10. Setup ease — Priority 2 after user experience (Priority 1)
11. Next stakeholder meetings — Sarah (nursing), Sai + Jessica (PA), new TrajectSys hire incoming

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | Competencies and skills checklist must be **one unified module**, not separate products. Configurable per use case (faculty sign-off only, student self-rating, form-based, etc.) | skills-checklist | Architecture |
| D18 | Backend must support **multiple lists** per institution. UI does not need to be optimized for multiple today — can show as tabs. 95% of clients will use one list. | skills-checklist | Architecture |
| D19 | Lists are assigned to **student groups** (not cohorts only). A student group is flexible — lockstep programs create one group = cohort; non-lockstep create groups by track, specialty, etc. | skills-checklist | Admin config |
| D20 | **No cloning** — eliminate the copy/paste-per-cohort pattern from Compliance. One list is reusable across groups via assignment, not duplication. | skills-checklist | Architecture |
| D21 | **Course mapping is soft by default** — optional, not mandatory. A config toggle can make it hard (mandatory/limiting). Soft = recommended; hard = only mapped skills visible for that course. | skills-checklist | Admin config |
| D22 | **Timeline: Q4 = POC + requirements** (freeze requirements, pre-work, design); **Q1 = end-to-end delivery** of full module | skills-checklist | Project |
| D23 | Two report types required: **(1) student-wise** (per-student progress across skills) and **(2) skills-wise** (which skills students lag on). Drill-down on a student shows which courses they completed each skill through (if course mapping configured). | skills-checklist | Reporting |
| D24 | **UX is Priority 1; setup ease is Priority 2.** Making configuration ergonomic matters but cannot come at cost of the student/faculty experience. | skills-checklist | Guiding principle |
| D25 | **Romit owns competitor analysis** — deep-dive on TrajectSys, Portico, Registries, TrackTrack. Sankalp consolidates existing client use cases. | skills-checklist | Design task |
| D26 | Default/template lists per domain may be offered to ease setup. Schools can import via Excel. Future: Ankit to document all use cases across nutrition, SLP, nursing, radiation tech, PA by Friday 2026-10-17. | skills-checklist | Admin setup |

---

## Verbatim quotes (Aarti)

> "I'm convinced that we need to build it as one module that can be catering to both types of needs."

> "Our screens and everything don't have to be optimized for multiple lists today, but our backend should support multiple lists."

> "I want to get rid of this concept of cloning and other things that we have done in Compliance. There should be a list and that list is assigned to a group."

> "The course-level mapping is a soft mapping. A lot of these people are like, it doesn't matter where you do it. But by the time you graduate, you need to do it."

> "Making setup easy is priority 2. The user experience better is priority 1."

> "Let Romit drive that competitor analysis. Deep dives, Sankalp, so that you are able to make progress on everything."

> "So can we, if we are not going to do any build out in Q4, I at least want to start having weekly meetings for this so we can review progress and get alignment."

## Verbatim quotes (Sankalp)

> "In general, in Prism, we need to come up with the concept of a student group similar to how we have created for placements."

> "That is exactly how we had thought of: we wanted to show progress and we wanted to show which all students have met, which all students are behind in."

> "If you drill down into a specific student, you see which all — through which courses or clinical courses they were able to achieve those skills."

---

## Next steps / follow-up

- **Oct 29**: Sankalp + Romit present first draft to Aarti + Vishakha. Aarti to set up weekly Thursday meetings from Oct 29 onward.
- **Romit**: Begin competitor analysis — TrajectSys, Portico, Registries, TrackTrack. Meeting with Sarah (nursing) early next week.
- **Sankalp**: Share existing requirements doc with Vishakha. Meet Sai + Jessica (PA). Consolidate use cases.
- **Ankit**: Deliver use case doc (nutrition, SLP, nursing, radiation tech, PA) by Oct 17.
- **Aarti**: Introduce Sankalp to 3–4 additional stakeholders (PA, MD/DO, OT). New TrajectSys hire joining team — will support product side.

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_20
