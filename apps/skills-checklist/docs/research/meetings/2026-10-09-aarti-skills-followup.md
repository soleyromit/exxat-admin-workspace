---
type: meeting
date: 2026-10-09
product: skills-checklist
participants: [Romit Soley, Aarti Vaishnav]
source: granola
granola_id: 24cf2e12-df52-4d83-8ecf-4400037840fd
---

# Skill Checklist Follow Up Meeting with Aarti — 2026-10-09

**Date:** 2026-10-09 4:00 PM EDT
**Participants:** Aarti Vaishnav (Product), Romit (Design)
**Topic:** Architecture alignment on the Skills Checklist product — unified module, skill list model, cohort grouping, visualization, deactivation behavior, evaluation models, and course mapping.

---

## Summary

Aarti and Romit reviewed an early skills checklist document together. Major decisions: collapse competencies/EPAs/skills/essentials into one unified module; support multiple skill lists per OU code attached to cohorts; keep course-skill mapping soft; free-email for evaluator sign-off; spider web visualization with class comparison; deactivation removes from reports but retains data; delete allowed only if no data exists.

---

## Topics covered

1. Unified module: competencies, EPAs, skills, essentials, procedures all under one student-level area
2. Multiple skill lists (logs) per OU code — each attachable to one or more cohorts; default list auto-applies to new cohorts
3. Cohort concept challenged for non-lockstep nursing programs — future: custom student group as activation unit
4. Skill list at OU code level — pre-loadable from accrediting body, then fully editable by school
5. Course-skill mapping is soft — show all skills, highlight course-relevant ones, let student submit for any
6. Spider web / radar visualization — individual student score vs. class average benchmark
7. Deactivation behavior — removes from reports, course mapping, and student view; data retained
8. No delete with existing data — delete only when zero submissions against a skill
9. Free-email sign-off — any evaluator by name + email, not restricted to assigned system users
10. Multi-level hierarchy — tree structure for skill categories, N levels deep (flexible, not hard-coded to 2)
11. Evaluation models — Aarti confirmed 4: binary (met/not met), question-level qualitative, scored/scale, demonstration-level
12. Pre-population from accrediting body lists — offer at OU setup, editable after

---

## Decisions table

| # | Decision | Product | Applies to | ADR |
|---|---|---|---|---|
| D1 | One unified module for competencies, EPAs, skills, essentials, procedures — terminology per discipline, same underlying model | skills-checklist | Architecture | — |
| D2 | Multiple skill lists (logs) per OU code — each list attaches to 1+ cohorts; default list auto-applies to new cohorts; reports never merge across lists — each is a separate tab | skills-checklist | Admin config / Reporting | — |
| D3 | Student grouping challenge: cohort concept does not work for non-lockstep programs (nursing); future: "student group" as activation unit — flag for Yash discussion | skills-checklist | Admin config | — |
| D4 | Skill list is at OU code level — discipline data used only to offer pre-population defaults; after loading the list belongs to the school and is fully editable | skills-checklist | Admin setup | — |
| D5 | Accrediting body pre-load — when OU code is set up, offer to pre-populate skill list from the relevant accrediting body's standard; editable after | skills-checklist | Admin setup | — |
| D6 | Course-skill mapping is soft — all skills shown to students at all times; course-mapped skills highlighted (bold/underscored) as likely for that course; students may submit for any skill regardless of mapping | skills-checklist | Admin config / Student | — |
| D7 | Spider web / radar visualization — student's skill scores shown vs. class average benchmark on a radar chart; two data series: individual + class | skills-checklist | Student / Reporting | — |
| D8 | Deactivating a skill removes it from: course mapping, student skill selection, and all reporting; previously recorded data is retained but hidden from reports | skills-checklist | Admin config | — |
| D9 | No delete when data exists — skills with any evaluation submission cannot be deleted; only deactivated. Skills with zero submissions may be deleted | skills-checklist | Admin config | — |
| D10 | Free-email sign-off — student types evaluator name + email; any person, no system restriction; prior-used contacts offered as suggestions. Resolves T_SC_13. | skills-checklist | Student / Evaluator | — |
| D11 | Multi-level hierarchy — skill categories support N levels (tree structure); do not hard-code to 2 levels; design must accommodate sub-categories and sub-sub-categories | skills-checklist | Admin / Student | — |
| D12 | 4 evaluation models confirmed by Aarti — (1) overall binary: met/not met, (2) question-level qualitative: yes/no per program-defined question, (3) scored/scale: numeric or Likert meets threshold, (4) demonstration-level outcome. Aligns with T_SC_03 from Sankalp. | skills-checklist | Admin config | — |
| D13 | Board exam references — a program may add a board exam requirement to a checklist (e.g. "must complete MPJE"), but no full workflow built around it; just a note/link. Unlikely path, not impossible, not Phase 1 workflow. | skills-checklist | Admin config | DEFERRED |
| D14 | No strict enforcement of evaluation model ↔ achievement criteria consistency — system should not block mismatched configurations at this stage; add guardrails later once domain is better understood | skills-checklist | Admin config | — |
| D15 | Skills checklist product is enabled by default for all applicable OU codes | skills-checklist | Product setup | — |

---

## Verbatim Aarti quotes

> "Can we make it one and the same. I also am thinking that this should be one."
(on merging competencies, EPAs, skills, essentials into a single unified module)

> "No skills, no categories, no taxonomy. Programs define their own skills, their own grouping, their own evaluation questions, their own response labels, and their own achievement thresholds."

> "We can pre-populate it with the discipline list, but we have to make that list editable and manageable. By the school. At each OU code level."

> "Mapping it to a course is an optional thing, so it could or could not be associated with a course."

> "We should still show them all of the skills and let them click on any skill that they care to get a sign-off on."

> "This is your score and this is the class score."
(on the spider web visualization — two data series)

> "If you are on purpose making a change to the list, then that's a new list. Then create a new list."

> "I don't want deactivated things in the report."

> "We'll let them put in the name, email. If they've already put in the name, email previously, that we can show that as easy access. But they should be able to send it to anyone they want."

> "I hate to set something up per cohort because that is a bad setup that we have done in Prism today."

> "You'll have to have the concept of multiple lists."

> "Competencies and skills are just a list. It's not one inside of the other. Skills are lower level, competencies are higher level behaviors."

> "I think we should validate that so that if we have this one list that should work, but I don't want to create versions of that list."

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_27
