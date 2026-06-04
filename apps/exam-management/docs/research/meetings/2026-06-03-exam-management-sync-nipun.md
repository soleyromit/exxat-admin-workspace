---
type: meeting
date: 2026-06-03
product: exam-management
participants: [Nipun, Romit]
source: granola
granola_id: d4f85e99-c2b6-48b7-9890-eea260447055
---

# Exam Management Sync Up — 2026-06-03

## Topics covered

- Assessment creation scope and priorities
- Pre-exam flow: system compatibility check
- Reference attachments (question-level and assessment-level) for exam taker
- Question navigation panel design in exam taker
- Assessment config types (question-level, assessment-level, hybrid)
- AI features in assessment creation
- PRD color coding (green/yellow/red): scope tiers

---

## Decisions

| # | Decision | ADR |
|---|---|---|
| D_AT11 | System compatibility check → background only, never a visible step | NEW |
| D_AT12 | Reference attachments — question-level: unlimited count (200MB total size limit), assessment-level: ONE global doc, section-level: NOT supported | Extends T48 |
| D_AT13 | Question navigation panel toggle → simple chevron preferred over complex icon (detail on T79) | Extends T79 |
| D_EM91 | PRD color coding: green = exceeds ExamSoft, yellow = similar but different approach, red = not doing at all. Items under each heading further clarify exact scope. | |
| D_EM92 | Assessment config types — three distinct kinds: (1) question-level (per question, e.g. option locking), (2) assessment-level (overall, e.g. password, time limit), (3) hybrid (may apply at section level too, e.g. accommodation override, question randomization) | |
| D_EM93 | AI features in assessment creation: include in design for future-proofing. PRD's AI content takes a backseat to the video Nipun shared. If PRD and video conflict on AI features, video wins. Automatic blueprint creation explicitly deferred. | Confirms §5.54 |

---

## Nipun verbatim directives

> "That [system compatibility check] can be a background check and surface only when there is an issue. You don't have to have it in the main flow is what I'm trying to tell you."

> "Reference documents — assessment level, 100%, we will have [one global doc]. Section level, I feel we'll have, but that I can confirm... assessment level and not go into section level."

> "We know that we have assessment level documents. Like, it could be some kind of reference table talking about some values."

> "There's no limit on the number of attachments. The only limit is the size of the attachments."

> "A simple chevron would actually do the job. So you don't even have to worry about having a complete icon over there."

> "If it is red, it is clearly out of scope."

---

## Screen changes applied

| File | Change | Decision |
|---|---|---|
| `assessment-taker/src/pages/PreExamFlow.tsx` | Removed System Check as visible step (step 1); flow is now 4 steps: Password → Instructions → Accommodation → Ready. System check runs in background. | D_AT11 |

---

## Design tasks generated

- T83: System compatibility check — removed from visible pre-exam flow. Applied. (D_AT11)
- T84: Reference attachments scope update — T48 extended with new rules: question-level unlimited count (200MB total), assessment-level ONE global doc only, section-level explicitly NOT supported. Update T48 design when building that surface. (D_AT12)
