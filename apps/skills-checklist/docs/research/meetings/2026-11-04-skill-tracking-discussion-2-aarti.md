---
type: meeting
date: 2026-11-04
product: skills-checklist
participants: [Romit Soley, Sankalp Panda, Aarti Vaishnav, Vishakha Bhave, Yash Shah, Kunal Vaishnav]
source: granola
granola_id: 205da2dd-a7b1-4b25-b547-031162c25b29
---

# Skill Tracking Discussion 2 — Aarti, Vishaka, Kunal, Sankalp — 2026-11-04

**Date:** 2026-11-04 7:00 AM EST
**Participants:** Romit (Design), Sankalp (Engineering), Aarti Vaishnav (CPO), Vishakha Bhave (PM), Yash Shah, Kunal Vaishnav
**Topic:** Prototype review — skills library, group assignment model, course mapping, evaluation intent, role-based views

---

## Summary

Romit demoed current prototype screens to Aarti and the team. Sankalp presented the conceptual alignment on standards vs. competencies vs. skills. Aarti gave direct corrective feedback on the student-group/skill-assignment model (the sub-selection approach is wrong), course cloning requirements, evaluation intent types, and the need to design for all 8 known domains upfront. Aarti is unavailable until November 20th; a 90-minute review is scheduled for November 23rd at 9 AM ET.

---

## Topics covered

1. Conceptual distinction: standards vs. competencies vs. skills as separate entities
2. Skills library model: entire lists assigned to student groups (not sub-selecting skills per cohort)
3. Default skill list and versioning when skill lists change over time
4. Multiple skill lists per program — reports shown per list, not merged
5. Course mapping at course offering level + course cloning must carry forward skills
6. Skills-to-competencies: separate entities with optional mapping
7. Evaluation intent: count-based (occurrences/signatures) vs. quality assessment (ratings)
8. QR code-based field evaluation request (preceptor scans from student's device)
9. Admin/faculty views: course-based view AND overall student progress view
10. Domain breadth: must account for all 8 known domain variations upfront (not just nursing)
11. November 23rd demo — one clean happy path per screen, all feedback incorporated

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | Assign entire skill LISTS to student groups — no sub-selecting individual skills per cohort | skills-checklist | Admin setup |
| D18 | A program can have one or more skill lists; each list is a versioned entity — when skills change, create a new list version and assign that to new groups going forward | skills-checklist | Admin setup |
| D19 | One list is designated as the program default; any new group is auto-assigned the default list | skills-checklist | Admin setup |
| D20 | Multiple skill lists per program are allowed but kept separate — reports show per list (tabs), not merged across lists | skills-checklist | Admin / Reporting |
| D21 | Course mapping at course OFFERING level (not master course); course cloning must carry forward skill mappings | skills-checklist | Admin / Course setup |
| D22 | Skills and competencies remain separate entities; skills can be optionally mapped to competencies | skills-checklist | Admin config |
| D23 | Two evaluation intent modes: (1) count-based — how many times observed/done/signed off; (2) quality assessment — evaluator rates the skill | skills-checklist | Admin config / Student |
| D24 | QR code-based evaluation request: student shows QR code to preceptor in the field; preceptor scans and fills evaluation | skills-checklist | Student / Preceptor |
| D25 | Email-based evaluation request: student can also email the evaluation link to preceptor | skills-checklist | Student / Preceptor |
| D26 | Multiple evaluation requests per skill allowed (student can request re-evaluation) | skills-checklist | Student |
| D27 | Two views for admin/faculty: course-based view (8 skills for this course, done/not done) AND overall student progress view (all skills for the program) | skills-checklist | Admin / Faculty |
| D28 | Design must account for all 8 known domain variations upfront — not nursing only. Known domains: nursing undergrad, PA, radiation therapy, nutrition, respiratory therapy, and others | skills-checklist | Product scope |
| D29 | Student must be able to access skill evaluation request from within their placement/course section when course-skill mapping exists | skills-checklist | Student |
| D30 | Patient log integration with skills module is DEFERRED — not in initial build | skills-checklist | Out of scope (Phase 1) |

---

## Verbatim Aarti quotes

> "I don't want to take the approach that we are only going to cater to nursing needs and then we will adapt it. What we have done in the past... we should hold ourselves to a higher bar that says we understand these 8 use cases and these 8 use cases will be catered through our design." — Aarti

> "You will have the ability to create one or more lists for skills. And that entire list will be applied to the group... You will be able to create student groups, you'll be able to create skill lists, and you will apply a particular skill list to a particular group in one go and be done with it." — Aarti

> "sub-selection of skills from existing multiple lists— bullshit. This is not how it's going to happen." — Aarti

> "You define something as the default, meaning that's the one that any new group gets defined by definition. That's the one that is the current list, skill list, and you're applying it." — Aarti

> "one program can have just one list of skills or it can have multiple lists of skills, but the reports and everything will be driven around that skill list... we don't want to prevent schools from having more than one skill list." — Aarti

> "If the skills are going to change, you will create another skill list. And going forward, you will start applying that skill list to new groups." — Aarti

> "When I am taking up a course offering I can map that course offering to a particular subset of skills. And then anytime I do course cloning, those skills are also carried forward, so I don't have to do it." — Aarti

> "you will account for course cloning, you will account for course offerings, you will account for groups" — Aarti

> "some schools are interested in knowing counts, like how many times did you do this, and some of them are interested in assessing that skill." — Aarti

> "I can show the QR code for that skill to the preceptor, they can scan that QR code and fill my evaluation for me." — Aarti

> "just think about 2 views, course-based view and student-based" — Aarti (on role-based access complexity)

> "I am not available for the next 2 and a half weeks, so I will let you and Yash and Ramit work through this. But when I come back on November 20th... I want to see the demo... set up some time for November 23rd at 9 AM East Coast time for 90 minutes." — Aarti

> "these screens don't look clean and easy to navigate, and I don't get a very good sense for it. So there is work to be done." — Aarti

---

## Design tasks generated

See new tasks T_SC_17 through T_SC_27 added to `apps/skills-checklist/docs/workflows/_backlog.md`.
