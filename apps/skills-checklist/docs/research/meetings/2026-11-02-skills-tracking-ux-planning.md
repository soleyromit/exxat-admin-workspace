---
type: meeting
date: 2026-11-02
product: skills-checklist
participants: [Romit Soley, Sankalp]
source: granola
granola_id: e72ea925
---

# Skills Tracking UX — Planning Session — 2026-11-02

**Date:** 2026-11-02
**Participants:** Romit (Design), Sankalp (Engineering)
**Topic:** Skills module information architecture, navigation structure, eval flows, assignment model

---

## Summary

Romit and Sankalp planned the information architecture for the skills checklist admin module. Covered where skills lives in the admin navigation, how the assignment model works (skill lists → student groups), two separate evaluation flows (student-initiated vs. faculty group checkoff), program-level eval config with per-skill overrides, and the student QR-code-based eval request flow.

---

## Topics covered

1. Navigation placement: Skills sits in "Skills and Competencies" section or as separate tab under Standards
2. Admin flow: library of skills → create checklist (named list) → assign checklist to cohort/student group
3. Multiple skill lists per program allowed — one designated as default
4. New cohorts automatically receive the default skill list
5. Two evaluation initiation flows: student-initiated (request eval) AND faculty-initiated (group checkoff matrix)
6. Student QR code flow: student shows QR code per skill → preceptor scans → preceptor fills evaluation form
7. Program-level eval configuration with per-skill override capability
8. Skills separate from Competencies — can optionally map skills TO competencies, but not merged entities

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | Admin navigation: Skills lives under "Skills and Competencies" section or as separate tab in Standards | skills-checklist | Admin nav |
| D18 | Admin flow model: skills library → create named checklist → assign checklist to student group (3-step model) | skills-checklist | Admin setup |
| D19 | Multiple skill lists per program are allowed; one is designated the default | skills-checklist | Admin setup |
| D20 | New cohorts automatically receive the default skill list | skills-checklist | Admin setup |
| D21 | Two evaluation initiation flows required: (1) student-initiated eval request to preceptor, (2) faculty-initiated group checkoff matrix | skills-checklist | Admin / Student / Faculty |
| D22 | Student-initiated eval flow uses QR code per skill: student displays QR → preceptor scans → preceptor completes form | skills-checklist | Student |
| D23 | Program-level eval configuration applies globally; per-skill override allowed | skills-checklist | Admin config |
| D24 | Skills and Competencies are separate entity types; skills can optionally be mapped to competencies, but they are NOT merged | skills-checklist | Architecture |

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_24
