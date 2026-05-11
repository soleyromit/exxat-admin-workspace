---
type: meeting
date: 2026-05-05
product: exam-management
participants: [Vishaka, Romit]
source: granola
granola_id: 1b317110
---

# 2026-05-05 — Vishaka design review (Exam Management)

## Decisions confirmed

### Questions tab removed from course detail
- Course detail was designed with 5 tabs: Overview, **Questions**, Assessments, Students, Accommodations
- Vishaka: "Remove the Questions tab. Don't give them another tab for questions. They already have a question bank."
- Rationale: two entry points to create/manage questions = cognitive confusion
- **Applied:** `courses/[id]/course-detail-client.tsx` — tab trigger removed; `QuestionsTab` component preserved in `tabs/questions-tab.tsx` but not rendered

### Assessment Builder removed from top-level sidebar nav
- Assessment Builder was a direct nav link alongside Courses, Question Bank, etc.
- Vishaka: workflow should flow through the course detail (create assessment from within a course context)
- **Applied:** `components/app-sidebar.tsx` — `NAV_ITEMS_BASE` no longer includes Assessment Builder

### Access level labels in course context
- `AccessLevelChip` shows "editor" / "viewer" text
- Vishaka preference: display human-readable role names ("Course Coordinator" / "Course Instructor") rather than permission levels
- **Status:** flagged for review — current chip uses `level` prop ('editor'|'viewer'); renaming requires checking all callsites

## Open questions from this meeting
- [ ] Rename AccessLevelChip labels to role names vs. permission levels (align with Aarti's role vocabulary first)
