---
type: meeting
date: 2026-09-23
product: skills-checklist
participants: [Sankalp, Romit Soley, Arun (mentioned), Ankur/Ankit (mentioned), Jessica (mentioned, nursing)]
source: granola
granola_id: eabd5c5d-1b74-487e-b3fb-82c8e55a924e
---

# Skills Checklist with Sankalp — Domain Deep Dive — 2026-09-23

**Date:** 2026-09-23 12:12 PM EDT
**Participants:** Sankalp (Engineering), Romit (Design)
**Topic:** Skills checklist domain deep dive — evaluation models, library structure, course mapping, student workflow, deferred items

---

## Summary

Sankalp walked Romit through the full domain model for skills checklist. Covered the 4 evaluation model types, how the skills library is structured, course-skill mapping logic, student submission workflow, the FAST form integration challenge, and what is explicitly out of Phase 1. Also discussed relationship to learning contracts (future integration, not current scope).

---

## Topics covered

1. Four skill evaluation models (binary, independence-based, question-based, score-based)
2. Skill configuration is entity-level, not course-level
3. Frequency tracking: rotation vs. academic-year basis
4. Skills library: admin-defined, bulk upload, add → configure → activate workflow
5. Course-skill mapping: mandatory vs. recommended; student can submit for unmapped skills too
6. Settings/site-based minimum thresholds (nursing: "must be in acute care at least once")
7. Student skill list UI: two sections — mandatory / recommended
8. Categories (one per skill) + tags (cross-cutting)
9. Form standardization: auto-generated from configuration, FAST integration to be resolved Q4
10. Lab technician / non-preceptor evaluator via free email — not yet solved
11. Learning contracts: future integration after skills library built; separate product
12. Deferred: preceptor performance reports, remediation plans, accreditation reporting

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D1 | 4 skill evaluation models: binary, independence-based, question-based, score-based | skills-checklist | Admin config |
| D2 | Skill configuration is at entity level — same model/thresholds apply regardless of course mapping | skills-checklist | Admin config |
| D3 | Frequency tracking can be rotation-based OR academic-year-based (admin-configured per skill) | skills-checklist | Admin config |
| D4 | Skills library is admin-defined (no Exxat predefined list) | skills-checklist | Admin setup |
| D5 | AI-assisted bulk upload for skills list (Word/Excel/PDF import) — then configure each skill before activation | skills-checklist | Admin setup |
| D6 | Add → Configure → Activate workflow; skills cannot be active until fully configured | skills-checklist | Admin setup |
| D7 | Course-skill mapping: mandatory or recommended per course; students can still submit for skills not mapped to current course | skills-checklist | Admin / Student |
| D8 | Settings/site-based minimum thresholds: configurable per skill (e.g., "at least once in acute care") | skills-checklist | Admin config |
| D9 | Student skill list UI: two sections — "Mandatory for this course" and "Recommended for this course" | skills-checklist | Student |
| D10 | Skill categories: one per skill (not multiple); tags for cross-cutting reports | skills-checklist | Admin / Reporting |
| D11 | Standardized form generation: auto-generated from skill configuration; no custom form builder per school | skills-checklist | Student / Preceptor |
| D12 | Preceptor performance reports (which preceptors consistently score low) — Phase 2, not Phase 1 | skills-checklist | Reporting |
| D13 | Remediation plans — not Phase 1 | skills-checklist | Out of scope |
| D14 | Learning contracts integration (pull from skills library) — future; build skills first | skills-checklist / learning-contracts | Future |
| D15 | Lab tech / non-preceptor evaluator via free email — design needed; workaround exists today | skills-checklist | Student / Preceptor |
| D16 | Student self-evaluation before sending to preceptor — configurable toggle per skill | skills-checklist | Admin config / Student |

---

## Verbatim quotes

> "Skills have to be mapped to courses. For each skill, they have to kind of define what they expect, how do they expect the skill to be met." — Sankalp

> "The configuration will remain for the skill irrespective of whether it is mapped to 1 clinical course or 5 clinical courses." — Sankalp

> "When students select from a list of skills, it must have 2 sections, either mandatory for this course or recommended for this course." — Sankalp

> "There could be skills that can be performed across various courses. A skill could be part of all 6 clinical courses but could be mandated in one." — Sankalp

> "One skill is confirmed: setting-related minimum thresholds — this skill in this clinical course, but you have to do it in acute care only at least." — Sankalp

> "So we're basically trying to standardize the entire experience... the system should be able to create a form in FAST based on configurations." — Sankalp

> "I would say we should keep it restricted to the configuration and not allow schools to do multiple [form types]." — Sankalp

> "They had a list [of skills] in a Word doc, in an Excel, in a PDF somewhere. Asking them to manually configure each of the skills will be cumbersome. Can we allow them to upload? Then we'll have to use AI to scan through." — Sankalp

> "Skills cannot be activated until you configure this. Then you configure each skill and do whatever is necessary, and then you can activate it." — Sankalp

> "Learning contract is again something very specific to social work skills. So anyway, we have to build [skills first], and then for social work we have to kind of pull it." — Sankalp

> "Preceptor performance report — who consistently gives poor scores — that could be phase 2, could be later. Not every school might want it." — Sankalp

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_03 through T_SC_16
