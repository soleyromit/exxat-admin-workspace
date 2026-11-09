---
type: meeting
date: 2026-11-06
product: skills-checklist
participants: [Romit Soley, Sankalp]
source: granola
granola_id: 741d1f1c
---

# Skills Tracking UX — 3 — Engineering Translation — 2026-11-06

**Date:** 2026-11-06
**Participants:** Romit (Design), Sankalp (Engineering)
**Topic:** Translating Aarti's Nov 4 directives into concrete UX and engineering decisions

---

## Summary

Romit and Sankalp walked through Aarti's Nov 4 directives and translated them into specific UX flows and engineering constraints. Confirmed navigation entry point, finalized the create-checklist → assign-to-group model, removed matrix view, locked the "no edit" rule on skill lists, and confirmed course clone carries skill mappings. Also aligned on the two reporting views.

---

## Topics covered

1. Admin navigation entry: "Create skills checklist" button — not "Add skill to library"
2. No edit on existing skill lists: create new version instead
3. Assignment UX: assign entire checklist to student group → "all students" option (not individual sub-selection)
4. Matrix view (skill × student or skill × course grid) is removed from scope
5. Course clone must carry skill-to-course mappings (Sankalp confirming engineering feasibility)
6. Reporting: course-based view and student-based view confirmed as two separate surfaces
7. Course mapping UI: skill → select multiple courses (simple multi-select, not a grid/matrix)
8. Skills module navigation hierarchy confirmed: library → checklists → assignments → reporting

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D35 | Admin navigation entry point for skills module is "Create skills checklist" button — primary CTA | skills-checklist | Admin nav / onboarding |
| D36 | No edit on existing skill lists. When changes needed, create a new version (new named checklist). | skills-checklist | Admin setup |
| D37 | Assignment to student group: single action on the whole checklist; "all students" is a valid assignment target | skills-checklist | Admin assignment |
| D38 | Matrix/grid view (skill × student OR skill × course) is removed from scope | skills-checklist | Killed |
| D39 | Course clone in Prism carries skill-to-course mappings; engineering confirmed feasibility | skills-checklist | Engineering |
| D40 | Course mapping UI for skills: select multiple courses via standard multi-select — not a matrix | skills-checklist | Admin setup |
| D41 | Skills admin module navigation: Library → Checklists → Assignments → Reporting (4-section hierarchy) | skills-checklist | Admin nav |
| D42 | Reporting has two separate views as separate surfaces: (1) By course, (2) By student | skills-checklist | Admin reporting |

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_35 through T_SC_42
