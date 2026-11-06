---
type: meeting
date: 2026-11-06
product: skills-checklist
participants: [Romit Soley, Sankalp Panda]
source: granola
granola_id: 741d1f1c-9862-4c5e-b7ce-8494f6e231f4
---

# Skills Tracking UX Discussion — 3 — 2026-11-06

**Date:** 2026-11-06 7:00 AM EST
**Participants:** Sankalp (Engineering), Romit (Design)
**Topic:** Restructuring the skills checklist setup flow based on Aarti's feedback; course mapping clarifications; assignment UX

---

## Summary

Sankalp recapped Aarti's feedback from a prior call and walked through the revised approach for the skills checklist setup flow. The core change: flip the creation order so users start by naming a "skills checklist" first (creating the container), then add skills into it — rather than building a flat skills library first and then grouping. Discussion also covered course mapping UI (remove the matrix/grid view), assignment options (assign to all students vs. cohort-select), and the editing restriction (no edit on existing checklists — create a new one).

Also discussed: OHSU PA call learnings (skills tracked via "clinical passport" concept), cohort-transfer edge cases, and mobile considerations from comparative analysis.

---

## Topics covered

1. Aarti's feedback: restructure the flow to "Create Skill Checklist first, then add skills within it"
2. Assignment UX: "assign to all students" as the primary option; cohort filter available for specific selection
3. No editing existing checklists: if requirements change, create a new checklist
4. Course offering matrix view: Aarti said this is impractical — replace with filter-and-select
5. Multiple checklists per program: each can be assigned to different cohort groups
6. OHSU PA "clinical passport" model: skills tagged to courses within rotations
7. Mobile consideration: students carry skills forms to simulation labs — mobile approach needed
8. Skills dashboard / cohort performance view deferred to later discussion
9. November 23rd Arthi review call (90 min) — target 60–70% alignment; mid-December final design deadline

---

## Decisions table

| # | Decision | Product | Applies to |
|---|---|---|---|
| D17 | **Flow order change**: Admin setup entry point becomes "Create Skill Checklist" (give it a name first), then add skills within that named container. The skills library still exists but the user journey starts from the checklist, not the flat list. | skills-checklist | Admin setup flow |
| D18 | **Assign to all students as primary option**: When assigning a skills checklist, the primary CTA is "assign to all students" (all present and future students get it automatically). Cohort/group filter available for targeted assignment. Per-student or per-skill individual assignment is NOT the design — assign the whole checklist. | skills-checklist | Admin assignment |
| D19 | **No edit on existing checklists**: Once a skills checklist is created and in use, it cannot be edited. If requirements change, the admin creates a new checklist. This prevents retroactively changing what past students were assessed on. | skills-checklist | Admin setup |
| D20 | **Remove course offering matrix view**: The grid/matrix where you map each skill to individual course offerings (a table with skills × offerings) is not the design. Replace with filter-and-select: select a skill → filter by term/academic year → select multiple courses → save. Skills can still be mapped to multiple courses, just not via a matrix table. | skills-checklist | Course mapping |
| D21 | **Multiple checklists per program**: A program can have more than one skills checklist (e.g., "Skills Passport 1", "Skills Passport 2"). Each checklist is assigned independently to a cohort/student group. At any point in time, one checklist is applicable per student. | skills-checklist | Admin setup / Reporting |
| D22 | **Skills dashboard / cohort view deferred**: The skills completion dashboard and cohort performance view are not in scope for the current design sprint. Flagged for a future discussion. | skills-checklist | Reporting |
| D23 | **Reporting segmented by checklist**: When multiple checklists exist, reporting must allow filtering/segmenting by checklist (not aggregate across all). | skills-checklist | Reporting |
| D24 | **Mobile experience needed for students**: Students carry skills to simulation labs without laptops. The student experience needs a mobile-friendly path (QR code / mobile form for evaluator sign-off is already in earlier designs — confirm it covers this need). | skills-checklist | Student |

---

## Verbatim quotes (Sankalp relaying Aarti's feedback)

> "Important to create student group and apply skill to those, but not this way. Similar to how we do standard mapping, map entire list to students." — Sankalp (Aarti's words)

> "Edit नहीं करो existing skills को... एक अलग list बनाओ, कुछ भी change करना है." — Sankalp (Aarti's direction)

> "The first step should be create a skill checklist. And within that shell, I'm adding all my skills." — Sankalp

> "We don't need a view like that [the matrix]. We just need a view: skill select करो, courses select करो, save कर लो." — Sankalp

> "It's primarily navigation-related inputs that we got. Logically everything was fine. It's just how can we streamline and make it less clicks." — Sankalp

> "One skills checklist would be applicable [to a student at any time]. There will not be any overlap." — Sankalp

---

## Design tasks generated

See `apps/skills-checklist/docs/workflows/_backlog.md` — T_SC_17 through T_SC_22
