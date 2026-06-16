# PRD Watcher Digest — 2026-06-16 09:00 UTC

## Changes applied (1)
- **BUILD-STATUS — Exam Management:** `In Assessment Experience (Student)` updated from 🟡 In Progress → 🟢 Shipped (all 3 sub-items — Exam initiation, Test taking, Post-exam completion — now Completed in Nipun's roadmap). Confirmed milestone block added: P0-Cohere 15-Sep 2026 · P1-Beta 19-Dec 2026 · P2-GA 20-Sep.

## Flagged for your review (8)

### PCE (4 flags)
1. **⚠️ CONFLICT — Course type taxonomy changed in PRD:** `docs/watch/flags/pce.md` — §2 Key Decision #5b now lists "Practice / Classroom / Lab" instead of "Didactic / Clinical" (adds a third option). Conflicts with pce-decision-002 (Clinical Course scope) and pce-decision-008. Analytics page `apps/pce/admin/app/(app)/analytics/page.tsx:508–509` hardcodes "didactic"/"clinical" toggle values. **No auto-apply.** Confirm with Monil before updating code.
2. **New scope decisions #6 and #7:** "Focus on selling CE module independently in Q2, 2027" and "No Student login till Q3, 2027." Extracted as pce-decision-036 and pce-decision-037. Confirms `apps/pce/student/` is deprioritized until Q3 2027.
3. **New sidebar navigation spec:** First explicit sidebar tab structure defined in the PRD — two top-level sections (Surveys: CE + General Surveys; Directory: Program Details, Academic Calendar, Term, Courses, Faculty, Students, Settings, Eval Window). A new "Eval Window" group (Email templates, Reminder cadence, RBAC) is not in the current sidebar.
4. **§13 design feedback fully resolved:** All open items marked (Done). User profile stays bottom-left confirmed — "Since we are referring to new DS, therefore, the user profile remains at the bottom." Closes the §13a.5 ambiguity from 2026-06-09.

### Exam Management (4 flags)
5. **In Assessment Experience → all Completed:** Exam initiation (To be picked → Completed, Bhargav) and Post-exam completion (To be picked → Completed, Bhargav). All 3 sub-items done. BUILD-STATUS updated to 🟢 Shipped.
6. **Milestone dates confirmed (first time):** P0-Cohere: **15-Sep 2026** · P1-Beta: **19-Dec 2026** · P2-GA Launch: **20-Sep** (year TBD). Extracted as exam-decision-015.
7. **Assessment Creation sub-items gained statuses:** Manual question creation → In Refinement; Question flagging/AI + AI variant creation → Completed; Manual assessment creation + configs + AI import → In Review; Import from test banks + Examsoft → To be picked. Also: "View and manage assessment plan" and "View and manage course content" removed from Course Offering capability table.
8. **June 23–25 solution review meetings scheduled:** 23-Jun morning/evening (In Assessments student, Base entities & settings, Assessment creation & distribution, Question creation/import); 24-Jun (Accreditation + Certification brainstorming); 25-Jun (Project planning: P0/P1/GA/Pricing/GTM). Beta contact Laura transferred to Kim.

## FERPA/HIPAA alerts
None today.

## New docs discovered (0)
None

## Auth status
✅ M365 authenticated — 4 docs synced (pce-prd-monil, exam-roadmap-nipun, exam-prd-nipun, exam-management-1779040819474)

## Decisions extracted (3)
- **pce-decision-036:** "Focus on selling this module independently in Q2, 2027."
- **pce-decision-037:** "No Student login till Q3, 2027 for this module."
- **exam-decision-015:** P0-Cohere 15-Sep 2026 · P1-Beta 19-Dec 2026 · P2-GA 20-Sep confirmed milestone targets.
