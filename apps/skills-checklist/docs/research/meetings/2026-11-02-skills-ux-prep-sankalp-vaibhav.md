---
type: meeting
date: 2026-11-02
product: skills-checklist
participants: [Romit Soley, Sankalp Panda, Vaibhav Bora]
source: granola
granola_id: e72ea925-2b53-4167-9fc9-bcd61e9b612b
---

# Skills Tracking UX — Prep Session with Sankalp & Vaibhav — 2026-11-02

**Date:** 2026-11-02 10:00 AM EST  
**Participants:** Romit Soley (Design), Sankalp Panda (PM), Vaibhav Bora (Engineering)  
**Topic:** Pre-Aarti review prep — navigation IA, skill configuration model, course mapping, student view, group checkoff  
**Context:** Aarti review meeting scheduled for Wednesday 2026-11-04. This session is to align on what to show and what decisions are still open before that call.

---

## Summary

Sankalp and Vaibhav reviewed the skills tracking UX with Romit in preparation for the Wednesday Aarti review. The session covered: where skills should sit in Prism navigation (Vishaka's directive → Standards section), how program-level configuration simplifies per-skill setup, the group checkoff faculty flow, two-direction course mapping, and the new requirement that skills must also be assigned to student cohorts (not just courses) for graduation tracking. Technical constraint surfaced: existing Prism is Angular, new skills pages are React — navigation architecture must be decided before implementation starts. Reporting and student-facing screens deferred to subsequent Aarti calls.

---

## Topics covered

1. Navigation placement for skills in Prism (Vishaka directive: Standards section as new tab)
2. Skills and Competencies module naming/restructuring
3. Program-level configuration model (evaluation criteria centrally; frequency per-skill)
4. Configurable independence-level labels (AACN: underdeveloped/developing/developed; others: observed/assistance/independent)
5. "Success" label definition — admin must define which label(s) count as met
6. 4 ways to add skills: manual, paste-delimited, bulk upload, starter library
7. Group checkoff flow — faculty matrix view for mass skill sign-off
8. Course mapping: two directions supported; skills can be mandatory/recommended/available
9. Skills → student cohort assignment for graduation requirement tracking (new concept)
10. Student view: all skills visible at all times in course (divided into mandatory/recommended/other)
11. FaaS (Fast-as-a-Service) form integration for skill evaluation submissions
12. Faculty mobile app as a key delivery channel for checkoffs
13. Tech constraint: existing Prism = Angular; skills screens = React — IA alignment needed first
14. Scope for Wednesday: setup + configuration + grouping + cohort assignment (not reporting, not full student screens)

---

## Decisions table

| # | Decision | Product | Applies to | Status |
|---|---|---|---|---|
| D1 | **Navigation: Skills list sits in Standards section as a new "Skills" tab** (Vishaka directive). Central location alongside existing standards so schools train in one place. | skills-checklist | Admin IA | Vishaka confirmed |
| D2 | **Skills and Competencies module**: Either rename "Competency Management" to "Skills and Competencies" with sub-sections (competency management + skill management), or create a new top-level module. Open — to align with Aarti. | skills-checklist | Admin IA | OPEN |
| D3 | **Program-level default configuration**: Evaluation criteria (independence levels, labels, what counts as "success") set once at program level and applied to all skills by default. Individual skills can override only the frequency count. | skills-checklist | Admin config | Confirmed |
| D4 | **Admin must define which label = success**: System cannot auto-determine. If admin uses "observed/assistance/independent" and independent = success, admin must explicitly mark "independent" as the success criterion. | skills-checklist | Admin config | Confirmed |
| D5 | **4 ways to add skills**: (1) manual one-by-one, (2) paste delimited list (10 skills at once; metadata added per-skill afterward), (3) bulk upload (AI-parsed from document), (4) copy from Exxat starter library for that domain. | skills-checklist | Admin setup | Confirmed |
| D6 | **Starter library**: Exxat provides domain-specific starter skill lists (e.g., nursing undergrad). Schools can adopt as a starting point and then edit. Analogous to how Exxat provides accreditation standards today. | skills-checklist | Admin setup | Confirmed |
| D7 | **Group checkoff flow**: Faculty can open a matrix view (rows = students, columns = skills) and check off multiple students on multiple skills at once. Used in simulation labs; runs in parallel with student-initiated submission flow. | skills-checklist | Faculty | Confirmed |
| D8 | **Skills → student cohort assignment (graduation tracking)**: Separate from course mapping. Admin assigns a set of skills (named "skill requirements" or similar) to a student cohort/group (e.g., "Class of 2027 must complete these 20 skills"). This enables longitudinal progress tracking. | skills-checklist | Admin / Reporting | Confirmed |
| D9 | **Student sees ALL skills at all times within a course**: Not just skills mapped to that course. Skills are divided into sections: mandatory for this course, recommended for this course, all other available skills. Student can submit for any skill they have opportunity to demonstrate. | skills-checklist | Student | Confirmed |
| D10 | **Matrix/grid view for program-level configuration**: After program-level defaults are set, admin sees a table of all skills with their frequency counts pre-filled. Admin can edit individual cells directly without opening skill-by-skill drawers. | skills-checklist | Admin config | Confirmed |
| D11 | **Reporting deferred from Wednesday meeting**: Sankalp explicitly said focus Wednesday on setup, configuration, grouping, cohort assignment. Reporting will be discussed in subsequent calls. | skills-checklist | Scope | Confirmed |
| D12 | **Student screens not shown Wednesday**: Only admin-side setup flows shown to Aarti on Nov 4. Student screens to be reviewed in follow-up. | skills-checklist | Scope | Confirmed |
| D13 | **Tech IA decision before implementation**: Existing Prism = Angular; new skills pages = React. Navigation architecture (where skills live in Prism) must be decided before Romit can prototype. This is the key discussion topic for the Aarti meeting. | skills-checklist | Tech / IA | OPEN |

---

## Verbatim quotes

> "Vishaka's opinion was that similar to how we have standards and competencies listed here within our standards section, we can probably have a central repository where we have the standards listed, we have the competencies listed, and any list — any category or something that we are creating — it can come and sit here." — Sankalp

> "Instead of asking them to do this again and again for every single skill, we give them a way to kind of define it at a program level that this is how I want to track my skills." — Sankalp

> "The evaluation criteria usually remains the same across the entire skill list. The thing that typically changes from skill to skill is their frequency count." — Sankalp (paraphrased from context)

> "So basically this is the admin saying like, who do they want the student to be able to send out the review form to and who do you want to be able to kind of like review the students' skill list." — Sankalp

> "This is basically, if you allow this, the course faculty of that course will have ability to open this group checkoff section. It will be like a matrix grid kind of a view. And they can say student 1, this skill is done." — Sankalp

> "There needs to be 2 types of mapping. One is once you've defined the skills, you map it to courses… but courses is only telling you about the schedule in which you can do the skills. For [graduation tracking], we also need to map the skill — a set of skills to a group of students." — Sankalp

> "Once a student opens that course, goes to the skills section, they will see the skills divided into sections like, okay, these are the mandatory skills that are there, these are the skills that are recommended, and these are all the other skills that are available." — Sankalp

> "All the new design systems are on React. All these new worlds are being built on React. But the competency management, all the existing Prism pages are on Angular. So I don't know even if we can like fit this or should we just keep it separate." — Sankalp

> "Let's keep it more into discussion-focused. So that once the alignment is there, like you know how the navigation and architecture is going to be, then it is much easier to decide." — Romit

---

## Design tasks generated

See updated `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_24
