# f59cfbe4 — Assessment creation workflows and question bank design — May 19, 2026

**Participants:** Vishaka, Romit, team
**Product area:** exam-management

---

## User Flows

- **Question bank ownership:** All questions belong to the base course QB, shared across all course offerings of that course. When a faculty creates or edits a question during assessment building, the question is saved to the base course QB — never to the assessment or offering.
  > "Course five ninety one is a baseline course. This course is offered every spring and every fall. They are not going to have separate question banks of their own. They're all going to refer to the same question bank of this course. They may each have their own midterm exam, their own final exam, and they may pick and choose different questions."

- **Copy assessment from prior offering:** Faculty takes last year's exam, recycles 5–15% of questions, potentially reorganizes questions between sections (sections from prior exam are copied), then edits.
  > "The majority use case: I'm going to take last year's exam when the same midterm was offered for the same course, and I will make some tweaks to it."

---

## Design Decisions

- **Question bank: base course level, never offering level.** This is non-negotiable and was explicitly stressed multiple times.
  > "This cannot be mistaken Romit. And we've discussed this many times. I don't want any confusion here whatsoever. Adding a question — you are adding a question to the question bank. Not with my assessment and not with my offering."

- **Question versioning:** A question can have versions (v1, v2 with edits). Versioning is a SEPARATE concept from assessments or offerings. When a faculty wants to tweak an existing question without losing the original, they create a new version.
  > "If I want to create version one of this question and version two of this question and version one had some different text, and version two, you have edited some of the text. The main question is still the same. That's versioning."

- **Offline download — mandatory for Phase 1:** The download window must be supported. Admin also keeps printed backup copies (2–3) for device emergencies in the classroom.
  > "Admin, we used to always keep two or three copies of printed exam. Because in the class of 100 students, some didn't have a charger. So they're not able to take the exam on the device. So then we would give them a manual copy."

- **Curriculum mapping stays in Prism, not re-created in EM:** Course-level or objective-level mapping to standards belongs in the curriculum mapping module. Don't duplicate it in exam management.
  > "Don't create curriculum mapping here. It's so much confusion. But like, we can let them see curriculum data here."

- **AI gap analysis context:** AI needs the curriculum content to give meaningful gap analysis. Without LMS integration or uploaded content, AI gap analysis is generic (based on published standards blueprints like NAPLEX/NCLEX), not course-specific.
  > "Without their curriculum data in our system, we can only give them gaps based on published standards (like NAPLEX blueprint), not course-specific gaps."

- **Labels/tags for questions:** Use a single consistent concept — "labels" — not "categories" or "standards" as the UI term. Allows direct standard mapping AND custom free-form tags under one system.

- **Sections copy with structure when cloning assessment:** When copying a prior assessment, sections are copied. Questions can be moved between sections. The section → faculty assignment may need to be redone (faculty may differ from prior year).
  > "The sections is what you will need to copy. But which section gets assigned to which faculty or which faculty those questions belong to — all of that may change."

---

## Review & Approval Workflows

*(See also af529725 for full detail)*

- Assessment-level review only
- Soft gate: admin/faculty can publish without approval but system warns
- Reviewers: chair primarily, multiple allowed
- What they check: quality of questions/distractors, difficulty mix, prior performance stats

---

## Scope Constraints

- **IN (Phase 1):** Question bank at base course level; versioning concept
- **IN (Phase 1):** Copy assessment from prior offering (structure + questions)
- **IN (Phase 1):** Download window (configurable period)
- **IN (Phase 1):** Printed backup (admin workflow knowledge, not necessarily a product feature)
- **DEFERRED:** Full LMS integration for AI content-based question generation
- **DEFERRED:** Question bank gap analysis (lower ROI than assessment gap analysis)
  > "Finding gaps in assessment is more important than finding gaps in your question bank."

---

## Data / Entity Rules

- **Question → QB (base course), not offering:** 1 QB per base course; many offerings share it
- **Assessment → course offering:** Each assessment belongs to a specific course offering instance
- **Section → assessment:** Many sections per assessment; section has title + optional pre-read
- **Question → section (via assessment):** Questions are linked from QB into assessment sections; the original QB question is not modified

---

## Open Questions

- [ ] How is question versioning surfaced in UI? Does faculty explicitly "create new version" or is it tracked automatically on edit?
- [ ] Are prior offering assessments searchable when using "copy from previous"?

---

## Implementation Gaps (vs. current code)

- [ ] **Question bank ownership model:** Need to verify QB is linked to base course, not assessment or offering
- [ ] **Copy from previous assessment:** Currently `MOCK_COPY_SOURCES` exists but no section structure copy
- [ ] **Section copy preserves structure but clears faculty assignment:** Not implemented
- [ ] **Question versioning:** No version tracking UI or concept in current question editor
- [ ] **Download window configuration in assessment setup:** Not confirmed to be in current builder
