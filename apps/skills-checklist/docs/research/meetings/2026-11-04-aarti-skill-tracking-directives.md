---
type: meeting
date: 2026-11-04
product: skills-checklist
participants: [Aarti, Romit Soley, Sankalp]
source: granola
granola_id: 205da2dd
---

# Skill Tracking Discussion 2 — Aarti Directives — 2026-11-04

**Date:** 2026-11-04
**Participants:** Aarti (Product), Romit (Design), Sankalp (Engineering)
**Topic:** Aarti reviews skills checklist design direction and issues explicit product directives

---

## Summary

Aarti reviewed the current design direction for skills checklist and issued a series of explicit directives that override or clarify earlier assumptions. Key themes: assignment is always the whole skill list to a whole student group (never sub-selected); multiple checklists per program are OK and needed; course cloning must carry skills; two distinct reporting views (course-based, student-based); skills and competencies stay separate. Several UI patterns were explicitly killed.

---

## Topics covered

1. Assignment model: assign ENTIRE skill list to student group in one action — no per-skill sub-selection
2. Multiple skill lists per program explicitly confirmed and expected
3. Course cloning requirement: when a course is cloned in Prism, skill-to-course mappings MUST be preserved
4. Reporting views: two separate views required — course-based and student-based
5. QR code per skill for student-initiated preceptor evaluation (confirmed)
6. Skills and Competencies confirmed as separate modules — not merged
7. Patient-log integration with skills tracking explicitly deferred
8. Killed: approval workflow after preceptor evaluation (needs more thought)

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D25 | Assignment is ENTIRE skill list → student group in one action. Sub-selecting individual skills per cohort is explicitly killed. | skills-checklist | Admin assignment |
| D26 | Multiple skill lists per program are expected and correct. One is designated default. | skills-checklist | Admin setup |
| D27 | Course cloning in Prism MUST carry over skill-to-course mappings. This is a hard requirement. | skills-checklist | Admin / Engineering |
| D28 | Reporting must include two separate views: (1) course-based view (skills completion within a course), (2) student-based view (individual student progress against full assigned list) | skills-checklist | Reporting |
| D29 | QR code per skill for student → preceptor eval request is confirmed | skills-checklist | Student |
| D30 | Skills module and Competencies module are SEPARATE. Skills can optionally map to competencies but are not the same entity. | skills-checklist | Architecture |
| D31 | Patient-log integration with skills tracking is explicitly DEFERRED unless a new use case is established | skills-checklist / patient-log | Deferred |
| D32 | Approval workflow after preceptor evaluation is DEFERRED — needs more thought | skills-checklist | Deferred |
| D33 | Skills module scope covers all 8 known program domain variations (not just nursing) | skills-checklist | Architecture |
| D34 | No edit option on existing skill lists — when changes are needed, create a new version of the checklist | skills-checklist | Admin setup |

---

## Verbatim quotes (from transcript)

> "You can't start thinking about this in abstraction of that [course cloning]." — Aarti, on course cloning carrying skills

> "That's bullshit. Why would you sub-select skills per cohort?" — Aarti, killing per-skill sub-selection

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_25 through T_SC_34
