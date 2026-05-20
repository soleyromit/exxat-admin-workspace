---
type: decision
date: 2026-05-14
product: exam-management
status: Accepted
source: granola
session: 4e9c57ba-aa2a-4f03-b509-e78d27121d25
granola_meeting: 81c06a04-e3dc-499c-8f5a-c935e55d8d31
---

# Exam Management ADR-007 — Student dashboard must have a My Courses section as a first-class entry point

## Status

Accepted (Aarti + Vishaka, 2026-05-14) — Phase 1 must-have

## Context

The student-facing assessment taker needs to support two navigation patterns:

1. **Task-first (hero path):** Student opens the app to download or start an exam. They want the active/ready assessment front and centre — zero clicks.
2. **Course-first (browse path):** Student wants to review their performance in a specific course, see all assessments in that course, or check which assessments remain. This is the My Courses path.

Aarti (May 14) gave the explicit must-have list:
> "A student cannot launch without: My Courses, My Accommodations, open action items, and pending review. These four have to be there in the product."

Vishaka (May 14) on the course-first pattern:
> "When they click on courses, all they should see is assessments, because in exam management, courses don't mean anything else for that student."

> "When I come in, they should see my courses. And in the courses, when they click, all they should see is assessments."

The current `AssessmentDashboard` is status-grouped (download queue → active → upcoming → review → past). There is no "My Courses" section where a student can browse by course and see all assessments inside it. This violates the must-have list.

## Decision

The `AssessmentDashboard` must include a **My Courses** section that:

1. Lists every course the student is enrolled in for the current term (course code + course name + course status).
2. Each course card is clickable and navigates to a course-filtered assessment list showing all assessments for that course — regardless of their status.
3. The course-filtered view shows assessment status (draft/upcoming/active/submitted/results) so students understand where each exam is in its lifecycle.
4. The section appears in the dashboard hierarchy **after** the action items (download queue, active exams) but **before** upcoming/review/past — matching the information hierarchy Aarti described.

Dashboard section order per transcript:
1. Download queue (ready to download — most urgent action)
2. Active / in-progress (hero)
3. **My Courses** ← new section
4. Upcoming
5. Recently published / review available
6. My Accommodations
7. Competency summary strip

The My Courses section is **not a replacement** for the status-grouped view — both exist. The status-grouped sections surface the most urgent items; My Courses provides a stable browse path for any course at any time.

## Alternatives considered

- **Status-grouped dashboard only (current)** — rejected. Violates Aarti's explicit must-have list. Students cannot navigate to a specific course to review their history without clicking through multiple sections.
- **Replace status groups with course-first layout entirely** — rejected. Vishaka said "when they come in, they should see their action items" — status-grouped hero remains the primary entry point. My Courses is a second-level browse surface.
- **Separate `/courses` route instead of dashboard section** — possible future refinement. For Phase 1, a collapsible section on the dashboard is sufficient and avoids adding a nav item.

## Consequences

- Positive: Satisfies all four items on Aarti's must-have list (combined with action items, My Accommodations, and pending review already present).
- Positive: Students can find any course and any historical assessment without knowing its current status.
- Positive: Mirrors the admin's course-first mental model, making the cross-persona design coherent.
- Negative: Requires knowing which courses a student is enrolled in — needs `studentCourses` data in the assessment-taker mock data (`data/assessments.ts`).
- Follow-up: Consider a dedicated `/courses` route once the section grows beyond 3–4 courses (infinite scroll concern raised by Vishaka in the May 5 faculty design review).
