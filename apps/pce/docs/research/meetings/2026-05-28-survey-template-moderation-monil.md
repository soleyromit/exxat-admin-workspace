---
type: meeting
date: 2026-05-28
product: pce
participants: [Romit, Monil]
source: granola
granola_id: 81beffd7-663c-4326-bda1-6c7b7d814c25
---

# Survey and Template Design — Layout, Moderation, and Report Access with Monil

**Date:** 2026-05-28 · **Time:** 9:30 AM EDT
**Context:** Romit walkthrough of survey list design and create-survey flow with Monil (PCE PM). First detailed review of moderation placement, navigation structure, survey list layout, and report access table design.

## Topics covered

1. Navigation structure — Post Course Evaluation vs. Programmatic Survey as two top-level nav entries (not tabs)
2. Moderation — remove from left sidebar nav; integrate into survey list as status-action
3. Survey list horizontal status grouping — remove, replace with status filter dropdown
4. Survey table columns — merge details+deadline, add Action column
5. Create template flow — inline title edit, question bank option replaced by template selection
6. Report access step — cross-table showing which roles can see which roles' responses
7. Distribution recipients — faculty + students included by default per course, can exclude

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_PCE33 | **Navigation: Post Course Evaluation and Programmatic Survey are two separate top-level left nav entries. Not tabs, not merged.** "Tabs are your day to day action capabilities. Tabs are not products. On the sidebar." — Monil. Both get the same sub-sections (surveys list, templates). Analytics = skip for now. Setup = course eval only (skip for now). General surveys should be called "Programmatic Survey" not "Other Surveys". | Admin | — |
| D_PCE34 | **Moderation: remove from left sidebar nav. Integrate into survey list as an action on "pending_review" status rows.** "Ideally, it should be removed because subset. It is not an action that user takes every day." — Monil. Romit agreed. Replace with: (1) attention banner above the survey table when pending_review surveys exist ("X courses need your review — click to filter"), (2) "Review & Release" action available on pending_review rows via action column. APPLIED: removed from ADMIN_NAV in `app-sidebar.tsx`. | Admin | — |
| D_PCE35 | **Survey list: remove horizontal status grouping. Replace with status filter dropdown.** "We don't need this. There is already a status column. We just have to add a filter, status filter, where you select what is draft, what is scheduled. We don't need those horizontal extra rows." — Monil. Attention direction (pending_review) handled by banner above the table + filter, not by grouping. APPLIED: removed `defaultGroupBy="status"`, `groupLabels`, `groupOrder` from DataTable in `surveys/page.tsx`; added status filter Select; added pending-review attention banner. | Admin | — |
| D_PCE36 | **Survey table: merge details+deadline into one column; add Action column with role-appropriate CTAs.** "Details and deadline can be merged into one. You should introduce one column called action. In action, you'll have CTAs like preview, pending result, published, something like that. That gives you the control to merge moderation inside surveys." — Monil. DESIGN-REVIEW — requires column redesign (T52). | Admin | — |
| D_PCE37 | **Report access step: cross-table UI. Left = roles being evaluated. Right = roles who can see their responses.** "The first column are the role types that I am evaluating in a survey. And for each role type, I want to assign which roles can see the responses." — Monil. Prototype example: teaching assistant row → admin can see, TA can see, faculty cannot, guest lecturer cannot. Phase 1 roles: Left column (evaluated): Instructor, Course Coordinator. Right columns (viewers): Instructor, Coordinator, Program Admin, Program Director, Department Chair. DESIGN-REVIEW — new step in create survey flow (T53). | Admin | — |
| D_PCE38 | **Report access placement: in create survey flow for now. May move to Settings later.** "For now, you keep it inside report access the step that you have created in the create survey flow. If we need to move it, we will move it outside and keep it in settings." — Monil. Treat as on-the-go step until there is evidence to make it a standing setting. | Admin | — |
| D_PCE39 | **Analytics section: skip for now. Monil has not started product thinking on it.** "I haven't started product thinking on it." — Monil. No design tasks for analytics until Monil provides requirements. | Admin | — |
| D_PCE40 | **Setup subsection: relevant for course evaluation only, NOT for programmatic survey.** "Setup would be relevant for course evaluation, not for general service." — Monil. Later: "Setup is not that important. You were saying that you had questions — fine. Setup, we'll discuss later." Both products share: surveys list, templates, analytics (future). | Admin | — |
| D_PCE41 | **Create template: inline title edit (edit icon → inline field). Template creation reuses assessment-builder-style UI.** Romit showed template creation that has edit icon for title — Monil liked it. Template question bank option removed, replaced by template selection (copy from existing). | Admin | — |

---

## Verbatim quotes

> "Before that, let's discuss on the layout first. That is more important. So right now, you mentioned that somewhere in the profile, you can switch between course evaluation and general surveys. With Aarti's feedback, this will not be a good deliberate option. We need to specify somewhere outside." — Monil

> "Tabs are your day to day action capabilities. Tabs are not products. On the sidebar." — Monil (re: why PCE and programmatic surveys are separate nav entries, not tabs)

> "Ideally, it should be removed because subset. It is not an action that user takes every day." — Monil (re: moderation in left nav)

> "We don't need this. There is already a status column. We just have to add a filter, status filter, where you select what is draft, what is scheduled. We don't need those horizontal extra rows." — Monil (re: survey list grouping)

> "See, my opinion is we should not do the grouping. If you want to attract users' attention on what actions to be taken. You can have a separate tab or an information above. It just says we need your review in three courses. Click here." — Monil

> "The first column are the role types that I am evaluating in a survey. And for each role type, I want to assign the report access... In front of instructor, you will uncheck course coordinator role." — Monil (re: report access table)

> "For now, you keep it inside report access the step that you have created in the create survey flow. If we need to move it, we will move it outside and keep it in settings." — Monil

> "Try to come up with the layout that separates post course evaluation and surveys. And within that, as we decided, we will have two, three sections. One section can be called surveys, other will be called template library, and would be called analytics." — Monil

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/pce/admin/components/app-sidebar.tsx:148` | 'moderation' nav item exists in ADMIN_NAV with title 'Review & Moderation', href '/moderation'. | ✅ APPLIED: removed from ADMIN_NAV. D_PCE34. |
| `apps/pce/admin/app/(app)/surveys/page.tsx:26–34` | `GROUP_ORDER` and `GROUP_LABELS` drive `defaultGroupBy="status"` horizontal grouping in DataTable. | ✅ APPLIED: removed grouping constants + DataTable props. Added status filter + pending-review banner. D_PCE35. |
| `apps/pce/admin/app/(app)/surveys/page.tsx` | No Action column exists in the survey table. Actions are in a row-level kebab menu. | 🔴 DESIGN-REVIEW (T52). New Action column with CTAs needed. D_PCE36. |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` | Current push flow has 3 steps. No report access step exists. | 🔴 DESIGN-REVIEW (T53). New cross-table step needed. D_PCE37. |
| `apps/pce/admin/app/(app)/moderation/page.tsx` | Moderation route still exists as a page. Route accessible via URL. | ℹ️ Page left in place for now. Sidebar entry removed. Engineering to deprecate route when Action column (T52) ships. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T50 | P1 — ✅ APPLIED | Remove 'moderation' from ADMIN_NAV in `app-sidebar.tsx`. Moderation integrated into survey list as action on pending_review rows. D_PCE34. |
| T51 | P1 — ✅ APPLIED | Remove survey list horizontal status grouping; add status filter dropdown + pending-review banner. `surveys/page.tsx`. D_PCE35. |
| T52 | P1 — DESIGN-REVIEW | Survey table Action column: role-appropriate CTAs (preview, pending result, published, review & release). Replaces kebab-only row actions. D_PCE36. |
| T53 | P1 — DESIGN-REVIEW | Report access step in create survey flow. Cross-table: left = roles evaluated (Instructor, Course Coordinator), right = who can see (Instructor, Coordinator, Program Admin, Program Director, Department Chair). D_PCE37. |
| T54 | P1 — DESIGN-REVIEW | PCE nav: add top-level "Programmatic Survey" nav entry separate from Post Course Evaluation. Both share sub-nav: surveys, templates, analytics (future). D_PCE33. Structural sidebar change — needs Romit direction. |
