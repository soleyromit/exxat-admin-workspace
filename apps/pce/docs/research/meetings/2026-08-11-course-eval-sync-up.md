---
type: meeting
date: 2026-08-11
product: pce
participants: [Romit Soley, Monil (PM)]
source: granola
granola_id: 2a204119-7804-444f-b087-32c4817e00b1
---

# PCE — Course Eval Sync Up (Monil) — 2026-08-11

**Date:** 2026-08-11 9:30 AM EDT
**Participants:** Romit (designer, note creator); Monil (PM — "Them" in transcript). David and Vishal referenced as async reviewers; Vishal has separate design feedback to share.

---

## Topics covered

1. Step 2 — Role-level enable/disable UX: single-instructor ambiguity (table for David review)
2. Multi-template per course: KILLED — only one template per course; switch only
3. Step 3 communication flow — new requirements spec walk-through
4. Survey title + survey instructions: new fields introduced
5. Per-course evaluation window override (independent of global survey window)
6. Remove "Share report to faculty" from Step 3 (not needed)
7. Remove "Reminder frequency" section from Step 3 (deprioritized)
8. Remove "Survey release date" from Step 3 (manual release replaces it)
9. Roadmap: steps 2–4 must be finalized before engineering starts frontend; backend built
10. Step 4 — "Reminders already messaging students": remove (redundant — David flagged it)
11. Step 4 — Summary must be a per-course list view, not a generic summary card

---

## Decisions

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_PCE_0811_01 | **Step 2 — Role-level toggle UX ambiguity when single instructor present: table for David review.** The role-level toggle direction (from T149) is confirmed — disable/enable acts on the whole role, not an individual person. However, showing an instructor's name (e.g. "Anita") adjacent to the toggle makes it appear person-specific when there is only one instructor. Monil: "this is sort of confusing for the user... if it is only one instructor, then I feel that this enable disable is on anita's level." Names must still be shown, but differently. Resolution design is tabled: "we haven't tested with David." David to give the call-out. Supplements T149. | pce | T156 |
| D_PCE_0811_02 | **KILL multi-template per course — one template per course, switch only.** The "Add another template" concept (add a second template to a course) is not supported. A course can have only ONE template. Admin can switch the template (which triggers the dialog from T151), but cannot add a second concurrent template. Monil: "we will not be doing this as per the requirement. They can only switch templates here... So what right now we are not supporting multi-template selection for a course, it will only be one template." Remove "Add another template" from any Lovable/Figma design. | pce | T157 |
| D_PCE_0811_03 | **Step 3 — Remove "Reminder frequency" section (deprioritized).** The reminder frequency UI (automated cadence like "send every N days") is deprioritized. Remove the entire section. The invite email and single reminder-date fields remain. Monil: "this item reminder frequency we are deprioritizing it for now. So you can remove this entire section." | pce | T158 |
| D_PCE_0811_04 | **Step 3 — Remove "Share report to faculty" option (not needed in distribution flow).** Sharing results to faculty is NOT configured during survey distribution. Admin shares results manually from the dashboard after the survey closes. Monil: "Then share report to faculty. This is not needed." | pce | T159 |
| D_PCE_0811_05 | **Step 3 — Introduce survey title + survey instructions fields.** Two new fields in the distribution setup Step 3 (communication flow): (1) Survey title — supports merge fields/placeholders (e.g. Course Name + Academic Year) that auto-populate when a course is selected; has a default; admin can override with plain text. (2) Survey instructions — free-form plain text only. Monil: "We are introducing survey title and survey instructor instruction." | pce | T160 |
| D_PCE_0811_06 | **Step 3 — Add per-course evaluation window override.** Within the global survey window (Step 3), admin can set an independent open/close date for each individual course offering. That course-level window runs independently of the term-level window. Monil: "for each course you can change the open and close. Which will run independently of this survey window." Supplements T95 (course-level start/end date override). | pce | T161 |
| D_PCE_0811_07 | **Step 3 — SUPERSEDES T68 — Remove "Survey release date" from distribution flow.** No result release date is configured during distribution setup. After the survey closes, admin manually navigates to each survey and releases results to faculty one by one. Automatic release is not the standard. Monil: "we will not have result release date in the survey distribution all the surveys get closed and sit enclosed status now it is admin's job to go to each survey and then release it to faculties one by one." Supersedes T68 (results release date as required field). | pce | T162 |
| D_PCE_0811_08 | **Step 4 — Remove "Reminders already messaging these students" section.** Romit and David had flagged this as repetitive information. Remove from the Step 4 review/summary screen. Romit: "I would need to remove, so I'll remove that because, it's a repetitive information." | pce | T163 |
| D_PCE_0811_09 | **Step 4 — Redesign from generic summary to per-course offering list view.** Current Step 4 design shows a general summary (e.g. "Evaluating: course instructor, course coordinator") that does not give admin enough information to verify the setup. Must be a scrollable list view where each row = one course offering. Per-row columns: course name, student count, roles being evaluated (listed by name: "Instructor is evaluated, Course Coordinator is evaluated"). Template is NOT shown (not important for admin verification at this step). Monil: "it has to be a list view. Instead of a summary... This definition is per course offering... admin just wants to make sure that I have all the courses that I had in my mind. And write roles are getting evaluated and there are students in the course." | pce | T164 |

---

## Verbatim quotes

> **Monil:** "This is sort of confusing for the user. Confusing is if it is only one instructor, then I feel that this enable disable is on anita's level. As a user. I interpreted like that."

> **Monil:** "No, we need to show names also. But we have to show it in a different way."

> **Monil:** "We will not be doing this as per the requirement. They can only switch templates here. So what right now we are not supporting multi-template selection for a course, it will only be one template."

> **Monil:** "You can remove this additional template. That would work."

> **Monil:** "We are introducing survey title and survey instructor instruction."

> **Monil:** "For each course you can change the open and close. Which will run independently of this survey window."

> **Monil:** "Then share report to faculty. This is not needed."

> **Monil:** "This item reminder frequency we are deprioritizing it for now. So you can remove this entire section."

> **Monil:** "We will not have result release date in the survey distribution all the surveys get closed and sit enclosed status now it is admin's job to go to each survey and then release it to faculties one by one."

> **Romit:** "I would need to remove, so I'll remove that because, it's a repetitive information." [re: "Reminders already messaging these students" in Step 4]

> **Monil:** "It has to be a list view. Instead of a summary."

> **Monil:** "For screen four... this does not give a right summary to the admin. This definition is per course offering."

> **Monil:** "Admin just wants to make sure that I have all the courses that I had in my mind. And write roles are getting evaluated and there are students in the course."

---

## Roadmap status (from transcript)

- Template creation flow: ✅ Done. Engineering grooming complete, front-end built.
- Create survey steps 1–4 (survey distribution): Backend built. **Steps 2, 3, 4 front-end NOT YET STARTED.** Engineering waiting on finalized designs before starting frontend. Steps 2–4 must be updated with today's directives before handoff.
- Upcoming: Single-survey analytics (Monil reviewing spec with Vishal). View result flow designs may go straight to developer if no changes.
- Manage surveys: Blocked — design dependency. Must cover admin editing of survey post-creation (change template, add person, edit steps, bulk actions across courses). Next design priority after distribution flow is frozen.

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0811_01: Role-level toggle UX (single instructor) | ❌ Not built | T129 wizard not yet in code. Old `surveys/push/page.tsx` is pre-T129 flow. Table for David. T156 added. |
| D_PCE_0811_02: Kill "Add another template" | ❌ Feature never built | Not in `surveys/push/page.tsx` or any other file. Directive prevents it from being built in new wizard. T157 added. |
| D_PCE_0811_03: Remove "Reminder frequency" | ❌ Not built | No reminder frequency section exists in production code. Directive prevents it from being built. T158 added. |
| D_PCE_0811_04: Remove "Share report to faculty" | ❌ Not built | No such field in production code. Directive prevents it from being built in Step 3. T159 added. |
| D_PCE_0811_05: Survey title + instructions | ❌ Not built | New fields not in current code. DESIGN-REVIEW. T160 added. |
| D_PCE_0811_06: Per-course window override | ❌ Not built | Not in `surveys/push/page.tsx`. T161 added; supplements T95. |
| D_PCE_0811_07: Remove survey release date | ❌ Not built | Not in current code. Supersedes T68. T162 added. |
| D_PCE_0811_08: Remove "Reminders already messaging students" | ❌ Not built | Not in production code. Directive prevents it from being built in Step 4. T163 added. |
| D_PCE_0811_09: Step 4 per-course list view | ❌ Not built | Step 4 not yet in code. DESIGN-REVIEW structural redesign. T164 added. |

**Pass 5 verdict:** No immediate code changes required. All directives apply to the not-yet-built T129 setup wizard Steps 2–4. The existing `surveys/push/page.tsx` is the legacy 3-step flow and does not contain any of the features being killed. Tasks T156–T164 added to backlog.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T156 | Step 2 — Role-level toggle: resolve UX ambiguity when single instructor present; table for David review | P1 — DESIGN-REVIEW | When only one instructor exists for a course, showing their name adjacent to the role-level toggle makes it look person-specific. Names must still be shown but differently. David to give call-out before design is updated. Supplements T149. D_PCE_0811_01. |
| T157 | KILL "Add another template" — one template per course, switch only | P1 — applies at T129 implementation | Remove any "Add another template" concept from Lovable/Figma. Only one template per course. Admin can switch (triggers T151 dialog). Monil: "we are not supporting multi-template selection for a course, it will only be one template." D_PCE_0811_02. |
| T158 | Step 3 — Remove "Reminder frequency" section (deprioritized) | P1 — applies at T129 implementation | Remove the reminder frequency/cadence UI from Step 3. Invite email + single reminder-date fields remain. D_PCE_0811_03. |
| T159 | Step 3 — Remove "Share report to faculty" from distribution flow | P1 — applies at T129 implementation | Not configured during distribution. Sharing is handled post-close from the dashboard. D_PCE_0811_04. |
| T160 | Step 3 — Add survey title + survey instructions fields | P1 — DESIGN-REVIEW | Two new fields: (1) Survey title with merge field/placeholder support + default; (2) Survey instructions (plain text). Requires design for merge field UX pattern and default state. D_PCE_0811_05. |
| T161 | Step 3 — Per-course evaluation window override | P1 — DESIGN-REVIEW | Within the global window config in Step 3, expose a per-course open/close date override that runs independently. Design the override affordance in the course list. Supplements T95. D_PCE_0811_06. |
| T162 | Step 3 — SUPERSEDES T68 — Remove survey release date from distribution flow | P1 — applies at T129 implementation | No result release date configured during distribution. Admin manually releases per survey from dashboard after close. Supersedes T68. D_PCE_0811_07. |
| T163 | Step 4 — Remove "Reminders already messaging these students" section | P1 — applies at T129 implementation | Redundant info in Step 4 review; David + Romit flagged. Do not build this section. D_PCE_0811_08. |
| T164 | Step 4 — Redesign from generic summary to per-course list view | P1 — DESIGN-REVIEW | Each row = one course offering. Columns: course name, student count, roles being evaluated (named). Template column NOT included. Current proposed generic summary ("Evaluating: instructor, course coordinator") is wrong — it doesn't help admin verify correctness. D_PCE_0811_09. |
