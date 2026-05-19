---
type: meeting
date: 2026-05-19
product: pce
participants: [Romit, Vishaka, Monil, David]
source: granola
granola_id: 02304883-2ad7-4311-8797-ce8fecc15c3f
---

# PCE Course Evaluation — Template Subject Architecture

**Date:** 2026-05-19 · **Time:** 8:45 AM EDT

## Topics covered

1. Step 1 (template creation) and Step 2 (distribution) alignment before engineering kickoff
2. Subject list source — Prism course-level associations vs. hardcoded vs. program-level ranks
3. Per-course subject additions vs. template-level binding
4. Conditional subject display in the student survey
5. Default "out-of-the-box" subjects for faster adoption
6. Terminology review — "subject" is too ambiguous
7. Guest lecturer feedback flow scope
8. Role-based access for template creation (deferred)

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_CE10 | Subject list must come from **course-level Prism associations** — NOT hardcoded, NOT program-level faculty ranks/admin positions | PCE Admin | — |
| D_CE11 | Subjects are **attached at the template level** — you cannot add an extra subject for an individual course; you must create a new template | PCE Admin | — |
| D_CE12 | **Conditional subject display for students** — if a course offering has no role matching a template subject, that subject section is hidden from the student survey. Engineering writes this logic at distribution time | PCE Student | — |
| D_CE13 | **Out-of-the-box default subjects** to be provided — common cases (didactic courses, experiential learning) should be pre-populated to reduce setup friction | PCE Admin | — |
| D_CE14 | **Terminology review required** — "subject" is too ambiguous; a better word must be chosen before design finalizes | PCE Admin | — |
| D_CE15 | **New Prism role additions must sync** to the course evaluation subject list — Sankalp needs to build the add-capability so the two lists stay in sync | PCE Eng | — |
| D_CE16 | **Guest lecturer feedback flow → Phase 2** — not in scope for Phase 1. Today, schools handle this via student-initiated forms | PCE | — |
| D_CE17 | **Role-based access for template creation → deferred** — who gets access will be defined in a separate requirements discussion, not during this call | PCE Admin | — |

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/pce/admin/lib/pce-mock-data.ts:2` | `TemplateSection` hardcoded as 3 types (`course_content`, `faculty_performance`, `course_director`) | Conflicts with D_CE10 — must become data-driven from Prism. Backlog T35. |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx:32` | `ALL_SECTIONS` hardcoded array | Same issue — T35. |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx:26-29` | `SECTION_LABELS` — 3 fixed display labels | Will need to be dynamic once subject list is Prism-driven — T35. |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx:190` | Sidebar header label = "Sections" | Subject to terminology review — T34. |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` | No conditional subject filtering at push time | D_CE12 not yet implemented — T36. |

---

## Verbatim quotes

> "We shouldn't have... See, we shouldn't hard code. I think the course level associated associations, we should offer them. But not the program level faculty rank and administrative positions because those not relevant here." — Vishaka

> "We'll have to come up with something better than subject. Subject can have many meanings." — Vishaka

> "I'm aligned with giving them a few of the basic out of the box... for didactic courses, for your experiential learning because the less barriers you put between them and actually launching these, the more likely they are to adopt it." — David

> "We are attaching subject to a template. At this stage, you can only use that template. So to answer your question, no. You cannot add an additional subject for a course. You will have to go and create that template with a new subject." — Vishaka

> "If I am adding a subject as faculty and while in distribution phase, a course does not have a faculty. You will not see the faculty section. From the student experience. So we'll write that logic." — Monil

> "I think it's okay in phase one if we don't about that workflow." — Monil (re: guest lecturer feedback)

> "For now, let's keep role based access requirement as separate." — Monil

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T34 — Terminology review: find better word than "subject" | P1 | Vishaka raised. Candidates: Evaluatees, Roles, Categories. |
| T35 — Subject list data-driven from Prism course-level associations | P1 | Currently hardcoded. Requires backend + Sankalp discussion. Conflicts with D_CE10. |
| T36 — Conditional subject display in student survey | P1 | Engineering logic at distribution time. Missing role → hidden section. D_CE12. |
| T37 — Out-of-the-box default subjects for new templates | P2 | David UX rationale: reduce barriers → higher adoption. D_CE13. |
| T38 — Subject/role sync mechanism with Prism | P1 | Involves Sankalp. New Prism role must surface in course eval subject list. D_CE15. |
