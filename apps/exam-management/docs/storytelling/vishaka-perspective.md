# Vishaka's Perspective — Exam Management

> Vishaka is the **domain expert** for the medical/health-sciences customer space. Aarti drives strategy; Vishaka brings the workflow realism that makes designs feasible. She also gatekeeps adoption — her opinions on UX and parity carry weight.

Captured primarily from 2026-05-05 3:29 PM Vishaka↔Romit dashboard review (Vishaka-led) plus references in 2026-05-06 roadmap planning.

---

## Who Vishaka is in the org

| Role | Detail |
|---|---|
| **Domain expert** | Deep knowledge of PT, PA, nursing, pharmacy program workflows |
| **Customer-relationship voice** | Closes deals; brings real customer pain into product discussions |
| **Aarti's litmus test** | Aarti defers terminology and feature feasibility to Vishaka ("what we show her is not going to be final anyway") |
| **Pre-publication chair approval champion** | This feature exists because Vishaka pushed for it — Aarti accepted it as secondary |
| **Phase-1 sequencing voice** | "Main course before dessert" — bread and butter first |

## Recurring mental models

### 1. "Main course before dessert"

> "Romit I think what is happening is I know we want to be innovative and you're thinking about all use cases but we cannot build futuristic use cases without giving our users the bread and butter."
> — 2026-05-05

> "The main crux of it is exam[s] creating an assessment and we didn't even get to discuss that."
> — 2026-05-05

> "So we will come to the desert and appetizer but first we will take care of the main course."
> — 2026-05-05

### 2. Why faculty come to a course

> "Typically in a course why would a faculty come to a course inside of an exam management product. To create assessments to administer assessments and to review the results? Simple."
> — 2026-05-05

This is the load-bearing IA insight. It rejects the "Questions tab inside a course" (because the QB is where authoring happens) and rejects the global Assessment Builder menu (because assessments belong inside courses in Phase 1).

### 3. ExamSoft is the benchmark

> "Go through the exams[oft] recording and see the workflow that they have built and we don't want to reinvent the wheel so we should do everything that exam[soft] can and then think can we make this better?"
> — 2026-05-05

> "In examsoft they don't have courses as a section. All they have is assessments... they have gone minimalistic and there is a reason for this because you don't want to confuse by giving a lot of things to the users if their primary purpose is to get their exams done."
> — 2026-05-05

### 4. One way to do a thing

> "Every time we give them multiple ways to do something we have to think whether it's going to help them or whether it is going to add to their cognitive confusion whether they should go in the question bank to add questions and create questions or whether they should come to a course to do that."
> — 2026-05-05

This aligns with Aarti's "one mechanism per concept" but Vishaka frames it from a user-cognition angle.

### 5. Workflow realism

Vishaka's mental model of how faculty actually work, surfaced repeatedly:

| Reality | Implication |
|---|---|
| Faculty teaches in 5 courses, **manages** (coordinates) 1 | Coordinator vs Instructor distinction is the pivot for permissions and live-monitoring visibility |
| Faculty creates assessments a few days before the exam, not months in advance | Dashboard expects "create the shells first, work on the imminent one" |
| Course planning rhythm: 5 quizzes, 2 midterms, 1 final → create empty shells first | List view must accommodate empty-shell rows |
| When assessment is live, faculty is in the classroom proctoring or lecturing | Most of the time, no live assessments are visible from the dashboard |
| Student Services is a university-level office | Accommodations are admin-determined; faculty see read-only |
| Faculty review before publishing is **optional** | Pending-review widgets must not assume universal use |
| Faculty search by course number first ("301 tox" → toxicology) | Course code is primary search key |
| Didactic faculty use exam software; clinical faculty don't | Wrong faculty type = wrong user-test pool |

### 6. Validation discipline (don't waste customer time)

> "We should not go to them with very initial screens so once we have taken care of all our use cases and we are very confident about how we want to build it is when, Romit, we should take their feedback otherwise all our calls will be inefficient."
> — 2026-05-05

Implication: paid consultants if champions are too busy; don't bring half-baked screens to faculty.

## Specific feature opinions

### Pro

| Feature | Vishaka's reasoning |
|---|---|
| Live progress monitoring (no proctoring) | "ExamSoft parity item." Required Phase 1. |
| Live monitoring restricted to Course Coordinator | Generic instructor has no real association with assessment ownership today |
| Student Accommodations as a global menu | "One time done deal" — propagates to every course they register for |
| Course-level accommodations view (read-only) | Coordinator needs to plan rooms, proctors, printed exams |
| Conditional widgets (only show pending-review when used) | Programs vary in workflow adoption |
| Course code on cards | Faculty search by code first (Prism convention) |
| Card-list adaptive view | Cards for small sets, list when ~5–6+ |
| Filter dropdown (active/past/all) | Default = active courses by start/end date |
| AI as a direction (eventually) | Once core works |
| Grade push to LMS | "From exam management point of view, pushing the grade data back is important." |
| Anonymous reporting realism (≥5 response gating + hide-columns + more) | OHSU sticking point on Prism today |
| Faculty post-course action items (Phase 2 differentiator) | From Professor Modi conversation |

### Anti

| Feature | Vishaka's reasoning |
|---|---|
| Standalone Questions tab inside a course | Duplicates QB; cognitive confusion |
| Global Assessment Builder menu (Phase 1) | Assessments belong to courses |
| "Awaiting results" status | "Confusing — who is awaiting?" |
| Stats bar with mixed-meaning metrics | Park until logic is defined |
| Multiple ways to do the same thing in Phase 1 | Cognitive load |
| AI question gen / at-risk plan / audit log / competency progress in Phase 1 | "Park — main course first" |
| User testing on raw screens | Burns goodwill |
| Inviting clinical faculty for exam-management feedback | Wrong audience |
| Inventing surfaces not in PRD | "PRD doesn't cover beyond Question Bank — raise this in Thursday call" |
| Live-monitoring widget for instructors | No real association with assessment ownership |
| Pending-review widget when programs don't review | Conditional display required |

## Workflow detail Vishaka brought that Romit's designs were missing

1. **Instructor-to-assessment association is undefined.** Today, contributing questions to a Q-bank doesn't carry forward to assessment ownership. Without this link, "your live assessments" can't be shown to a generic instructor.
2. **Course-shell creation step.** Faculty create assessment shells (quizzes/midterms/final) at the start of a term, not when they're ready to write the questions.
3. **Add-questions has 3 sources.** Default = this course's QB. Secondary = other course QBs. Tertiary = inline new question. Romit's design only showed one.
4. **Tagging happens in the QB, not in the assessment.** Primary tagging at QB authoring time; secondary inline during assessment creation.
5. **Gradebook is the publishing endpoint.** "ExamSoft doesn't have a gradebook... they port the results to gradebook." Phase-1 publishing UI is unclear and should be parked.
6. **Accommodations is one-time-per-student, then propagates.** Course-level edit is wrong; central student-level edit is correct.
7. **Accommodation planning, not approval, is the Phase-1 deliverable.** Coordinators need to reserve rooms, arrange separate proctors, print alternate exams — the data exists; the workflow does not.

## Risks Vishaka flagged

| Risk | Mitigation |
|---|---|
| Designing surfaces (analytics, audit log, AI) before assessment-creation flow exists | Sequence: main course first |
| Active-courses logic relies on Prism date fields nobody fills | Product enforcement required |
| Two places to author questions = cognitive confusion | Remove Questions tab from course detail |
| Live-monitoring shown to instructors with no real association → false promises | Park instructor visibility; talk to Nipun |
| Pending-review widgets when programs don't use review at all | Conditional display |
| Validating designs with wrong faculty (clinical, not didactic) | Restrict user-test pool |
| Validating designs too early — burns champion goodwill | Mature designs first; consider paid consultants |
| Inventing global Assessment Builder when data model says assessments belong to courses | Phase-1 boundary discipline |

## Vishaka's role taxonomy (her words, 2026-05-05)

> "Course coordinator is also a faculty. Let's call that yeah instructor role meaning they are teaching in a limited fashion in that course... they're contributing to the course but they're not managing the course; course coordinator is managing the course has higher authority and more access."

| Role | Capability |
|---|---|
| Admin | Owns master lists; full access |
| Course Coordinator | Manages course; higher authority; sees live assessments |
| Course Instructor | Teaches/contributes in a limited fashion; no live monitoring; no course-level management |

Aarti accepted this on 2026-05-08, expanded to allow 3–4 default role variants with rename-able labels.

## Vishaka's accreditation-cycle insight

Vishaka sourced from Professor Modi:

> Faculty post-course review workflow → action items log → curriculum committee proposal cycle → accreditation report transfer.

Aarti loves this but bumped to Phase 2.

## Cross-product implications Vishaka has raised

- Course-coordinator-vs-instructor distinction is broader than Exam Management — should align with Prism's faculty role model
- Anonymous reporting realism patterns extend to PCE (≥5 gating, true anonymity, hide columns)
- Brand/visual continuity with Prism is a hard requirement across all products

## What we know about Vishaka

- Available days: not Tuesday morning (webinar)
- Communicates feedback through Romit when she can't attend a meeting (e.g., declined Thursday Aarti review on May 5; sent feedback through Romit)
- Has direct customer relationships (cited Professor Modi for action-item workflow)

## What Vishaka hasn't said yet

(Open questions to bring to her in the next 1:1 or alignment meeting.)

- Her read on confidence-based marking (Aarti raising it 2026-05-07; Vishaka is the gatekeeper)
- Whether F2 (adjunct faculty) in PCE rolls into the faculty view or stays email-only
- The exact 3–4 default role variant set within the Faculty tier
- Her view on the pop quiz workflow (separate Lecture surface vs inline?)

## Source provenance

Primary: 2026-05-05 3:29 PM Vishaka↔Romit dashboard review (`e82b0659-a5cf-41ce-8688-2a2b99bcf0b4`).
Secondary references: 2026-05-06 7:29 AM roadmap planning (`a73456ab-a1f6-46d5-99e5-e577a3fd5104`).
