---
type: meeting
date: 2026-05-14
product: exam-management
participants: [Romit, Vishaka, Nipun]
source: granola
granola_id: af529725-f08b-4a9e-9e6e-c4968b540338
---

# Assessment Builder — Base Entities, Student Experience, and PRD Workflow

**Date:** 2026-05-14  **Time:** 10:30 AM EDT

## Topics covered

1. Base entity scope (students, faculty, courses) for exam management
2. Student profile — what exam management should and shouldn't show
3. Faculty-to-student association model
4. Section creation and collaborative assessment building workflow
5. Pre-exam instruction page and accessibility setup page
6. Assessment review workflow (chair approval)
7. PRD-first process alignment

---

## Decisions

| # | Decision | Scope | Quote |
|---|---|---|---|
| D_AB1 | Section-level review NOT required — assessment-level review is the unit | Admin/Faculty | "Section level review to answer your question, Rohit, is not required. Just assessment level review is enough." — Vishaka |
| D_AB2 | Faculty-to-student associations NOT needed in exam management. Faculty are associated with assessments/courses, not students directly. | Admin | "Faculty to student associations are not going to be here. Faculty are going to be associated with assessments." — Vishaka |
| D_AB3 | Assessment review: can be sent to multiple reviewers (but typically one — chair or supervisor) | Admin | "We should not limit. But in real life, like, typically, it is always reviewed by chair." — Vishaka |
| D_AB4 | Pre-exam instruction page: faculty uploads free text, configurable timer (admin can decide whether it eats into total exam time), optional student attestation/acknowledgment | Student | "And typically, it is like the ethics and the cheating code and everything that they put language in there." — Vishaka |
| D_AB5 | Pre-exam accessibility setup page: Phase 1 = extra time + font size only (NOT speech-to-text, hardware connections, custom keyboards) | Student | "Higher font size and extra time are the most common accommodations. The third one — separate room — we cannot cater to via product." — Vishaka |
| D_AB6 | Section creation + free text title = MUST-HAVE for assessment builder Phase 1 | Faculty/Admin | "We should allow the course coordinator to create sections. Bare minimum." — Vishaka |
| D_AB7 | Faculty can see each other's sections in collaborative assessments but CANNOT edit other faculty's questions | Faculty | "They can see each other's questions. That's fine. They are not able to edit someone else's question." — Vishaka |
| D_AB8 | Performance statistics (from previous use) + difficulty tags visible both while BUILDING and while REVIEWING an assessment | Faculty/Admin | "While building the assessment and while reviewing the assessment, those performance statistics and questions can be important." — Vishaka |
| D_AB9 | Process: PRDs must be published, reviewed, and aligned BEFORE design work starts. Alignment call = review a finalized PRD, not an open-ended discussion. | Process | "Can we have PRDs with use cases keeping user journey in mind beforehand and then base our discussion on that PRD." — Vishaka |

---

## Collaborative assessment creation user journey (from Vishaka)

1. Course coordinator creates the assessment shell + section structure (one section per instructor).
2. Each instructor is notified/invited to contribute questions to their section by a deadline.
3. Instructors add questions from their question bank or write new ones, then signal they're done.
4. Course coordinator reviews the full exam (can query mix: easy/medium/hard, check tags).
5. Coordinator sends to chair for final review + approval.
6. Chair approves → coordinator publishes for download.

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| Assessment builder — section creation UI | P1 | Free text title, add/remove sections, assign instructor per section |
| Pre-exam instruction page | P1 | Timer config, attestation toggle, free-text input. FLAG for new screen. |
| Assessment review workflow UI | P1 | Send to reviewer(s), track status (pending/approved/changes-requested). FLAG — needs new data model. |
| Performance stats in builder view | P2 | Show historical usage stats + difficulty tags while question-browsing in builder |
