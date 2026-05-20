---
type: decision
date: 2026-05-08
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# Exam Management ADR-015 — Faculty role hierarchy: Course Coordinator vs. Course Instructor with section-scoped collaboration

## Status

Accepted (Aarti, 2026-05-08) — Data model implemented; collaboration workflow not yet built

## Context

A course can involve multiple faculty: one manages the course (the Course Coordinator) and others contribute content (Course Instructors). Early designs used a generic "editor/viewer" access model without defining what coordinators and instructors can actually do differently.

Aarti gave the canonical user journey:

> "I'm a course coordinator of pharmacology. I create the assessment shell, name three sections (one per instructor), and ask each instructor to fill in their 10 questions by a specific date. Once they're done, I review the full exam and send it to the chair for approval."

> "Instructors can see each other's questions — that's fine. They are not able to edit someone else's question. That would be built in anyway with role-based access."

> "Faculty are going to be associated with assessments. Where is faculty-to-student association coming from? In Phase 1, there is no direct faculty-to-student relationship outside of assessments." (Vishaka, May 14)

## Decision

Two faculty roles exist in Exam Management (distinct from admin):

**Course Coordinator (editor access):**
- Creates and manages course offerings
- Creates the assessment shell, names sections, assigns sections to instructors
- Can edit any question in the assessment, including other instructors' sections
- Sends the assessment for chair review; publishes results
- Sees the live monitor for exams they coordinate
- Manages accommodations at the course level

**Course Instructor (viewer/contributor access):**
- Contributes questions to their assigned section only
- Can view (but not edit) questions in other sections
- Cannot create assessments or change assessment settings
- Does not see the live monitor (no proctoring role in Phase 1)
- No direct student management access

Faculty-to-student associations are mediated entirely through course offerings and assessments — not through direct relationships. Phase 1 has no direct faculty advisor → student links.

## Alternatives considered

- **Single faculty role (all editors)** — rejected. Instructors should not be able to publish results or send assessments for chair review; that is the coordinator's responsibility.
- **Three roles (coordinator / instructor / teaching assistant)** — deferred. TA access may be needed for rubric-based assessments in Phase 2; not required for Phase 1.
- **Faculty-to-student advising relationships** — rejected for Phase 1. Per Vishaka: faculty associations are assessment-scoped, not advising-scoped in Exam Management.

## Consequences

- Positive: Coordinators have clear ownership of the assessment lifecycle; instructors have a bounded, safe contribution surface.
- Positive: Consistent with ExamSoft's model (which has coordinator vs. contributor), so migration from ExamSoft is familiar.
- Data model implemented: `FacultyAdminPosition` type includes `'Course Coordinator' | 'Instructor'`; `accessLevel` distinguishes `'editor' | 'viewer'` on faculty course cards.
- **Not yet built:** The collaboration invitation flow (coordinator assigns a section to an instructor; instructor receives in-app notification to contribute questions). This is the outstanding implementation gap for this ADR.
- Follow-up: Assessment builder UI must implement section-level authoring access and the instructor notification/contribution workflow.
