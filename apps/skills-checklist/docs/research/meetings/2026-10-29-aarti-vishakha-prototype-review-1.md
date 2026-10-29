---
type: meeting
date: 2026-10-29
product: skills-checklist
participants: [Romit Soley, Sankalp Panda, Aarti Vaishnav, Vishakha Bhave, Yash Shah, Mansi Parikh, Kunal Vaishnav, Prabir Sarkar]
source: granola
granola_id: 9341ec74-7b73-4922-a2da-5f2407fe2d74
---

# Skills Tracking Prototype Review & Discussion — 1 (Aarti) — 2026-10-29

**Date:** 2026-10-29 7:00 AM EDT  
**Participants:** Aarti Vaishnav (CPO), Vishakha Bhave (PM), Yash Shah (Eng lead), Sankalp Panda (Eng), Romit (Design), Mansi Parikh, Kunal Vaishnav, Prabir Sarkar  
**Topic:** Architecture and planning for skills tracking — quick alignment before Nov 4 deep dive. Not a prototype review (Aarti deferred deep dive to November 4th call).

---

## Summary

Quick half-hour alignment. Aarti confirmed the high-level architecture direction: skills and competencies must NOT be independent parallel modules — they must be connected through a base competency entity with optional mappings. Skills tracking is an extension of the existing Program Requirements section, not a new isolated module. Multiple skill lists are supported but product is optimized for the single-list case (tabs, not left-nav). Deep dive on prototype prototypes scheduled for November 4.

---

## Topics covered

1. Skills vs. competency architecture — Aarti confirmed: NOT separate modules; one base competency entity with optional mappings to skills
2. Skills list placement: at the program requirement level (student/cohort), not only within courses
3. Multiple skill lists: possible (edge case), supported via tabs, not left-nav
4. Entry points for student: from My Placement, from course, and independently
5. Competency spider graph: needs sub-competency drilldown (currently one level only)
6. Parent-child hierarchy for competency list
7. ICD-10 → required clinical experience mapping (MD program edge case — not for phase 1)
8. Rotation passport use case (PA programs) — Vishakha: get sample from OHSU PA call
9. Standards vs. competency entity — DEFERRED to Yash / Arun (tech decision)
10. Learning contracts future mapping to competencies — noted, not in scope now

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | Skills and competencies are NOT separate parallel modules. Skills map to a base competency entity (one-on-one or many-to-many), but some skills may stand independently with no competency mapping — that is valid. | skills-checklist | Architecture |
| D18 | Skills tracking is an extension of the Program Requirements section of Prism — not a new standalone module. The skill list lives at the student/program level. "Think about this as something that we are evolving the program requirement section in our product." — Aarti | skills-checklist | Architecture / IA |
| D19 | Multiple skill lists (2 or 3) are supported as an edge case, rendered as tabs. Product is optimized for the one-list case (90%). Left-hand navigation is NOT used for skill lists. | skills-checklist | Admin / Student — layout |
| D20 | Skills can be triggered by students via three entry points: (1) independently from their student profile, (2) from the My Placement section, (3) from within a course. All three entry points are required. | skills-checklist | Student |
| D21 | Competency spider graph must support sub-competency drilldown. Clicking a competency creates a subgraph showing its sub-competencies. Current single-level spider graph is not sufficient. | skills-checklist | Reporting / Competency |
| D22 | Skills/competency list must support a parent-child hierarchy (sub-competencies). | skills-checklist | Data model / Admin |
| D23 | Whether the skills library sits as a dedicated section or within the existing Standards section — DEFERRED. Yash and Arun to decide the technical model. Aarti recommendation: separate base entity for competency; but "it's a Yash and Arun discussion." | skills-checklist | Architecture — DEFERRED |
| D24 | Learning contracts may eventually want competency mapping (programs design learning contracts around competencies). Not in scope now — future integration. | skills-checklist / learning-contracts | Future — DEFERRED |

---

## Verbatim Aarti quotes

> "I'm not aligned with doing skills and competency separately. So much of what we are going to have to build is going to be the same for both of these." — Aarti

> "You create a base entity called competency and then you map it — to some standards if needed, you map it to skills if needed, you map it to whatever it is that you want to do with it." — Aarti

> "Some skills may have no mapping to competencies and that's fine. No mapping. It's an end in itself that they want to track." — Aarti

> "We have to think about this as something that we are evolving the program requirement section in our product." — Aarti

> "Because we know 90% of the time it is only going to be one list, we would not create a left-hand side menu and dedicate space for it. If it's 2 lists, you have to flip back and forth on 2 tabs." — Aarti

> "Today our spider web is one level of competency. We have to expand it so that if you click on a particular competency, then you create the subgraph based on the sub-competencies of that." — Aarti

> "You will have to make sure that this list is a parent-child hierarchy if possible." — Aarti

> "It's a Yash and Arun discussion and they need to come back with it. But I just need to know, FYI, I need information of how they are going to do this." — Aarti (on standards vs. competency entity decision)

---

## Vishakha guidance

> "Ask her about the rotation passport. A lot of PA programs have it printed and then they get signatures from their preceptors as and when they check off those skills. So ask about it and also try and get a sample of that because you want to include that also as you're thinking through the design." — Vishakha (re: OHSU PA call)

---

## Next steps

- November 4 call: full prototype deep dive with Aarti (Sankalp + Romit to prepare end-to-end happy path)
- Sankalp to follow up with Ankit on current Prism skills setup document
- Monday: Sankalp + Yash internal prototype review
- Next week: Sankalp meeting Sarah (Akunal) on Monday, PA client calls with OHSU PA — invite Romit if available
- Romit to add lab checkoff view to prototype before Nov 4

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_22 through T_SC_26
