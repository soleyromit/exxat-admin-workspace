---
type: meeting
date: 2026-06-13
product: exam-management, pce
participants: [Romit, Aarti]
source: granola
granola_id: ab7e2691-bfaa-4ace-ac8f-29fcb2a3daec
recording_source: 2026-06-04 (Meeting with Romit Soley-20260604_141749-Meeting Recording)
---

# Meeting with Aarti — PCE, Exam Management

## Topics covered

- Prism coexistence and Himanshu alignment (reconfirmed — already D_PCE08–D_PCE10)
- PCE product structure: two sections, student experience, super admin role for launch (reconfirmed — already D_PCE11–D_PCE14)
- Assessment creation workflow: 4 stages, review as Phase 2
- Faculty section question-assignment feature: NOT Phase 1
- Assessment list UI: publish status, date, applicable count, completion count, scored/timed attributes
- Two-track design process: big-picture concept designs + Phase 1 cleaned-up designs
- Cohere conference: user research booth planning with Himanshu

## Decisions

| # | Decision | Product | Quote |
|---|---|---|---|
| D_EM_AA01 | Faculty section question-assignment is NOT Phase 1 — remove the assign button from designs | exam-management | "is this feature going in the first phase? No, not yet. I can just say that just remove the button." — Aarti |
| D_EM_AA02 | Assessment review workflow (chair approval) is Phase 2 — do not build for December launch | exam-management | "Later we can build in review process because review is like a phase two process. So we're not doing that." — Aarti |
| D_EM_AA03 | Assessment list: show publish status + date when published; show "not yet published" + publish CTA when not | exam-management | "If published date has been set, I want to show you the status as published and the date. If published date is not there, then the status next to this can be… not yet published." — Aarti |
| D_EM_AA04 | Assessment list: show applicable student count + completed count per row | exam-management | "it's applicable to how many students and then how many students have completed it" — Aarti |
| D_EM_AA05 | Assessment attributes near title: scored + timed as key attributes | exam-management | "scored and timed are…good attributes" — Aarti |
| D_EM_AA06 | Two-track design: maintain a concept/big-picture version AND a Phase 1 cleaned-up version | exam-management | "there are going to be two different kind of design activities from my side. One is purely concept… And then there is a part of it where we say that… a cleaned up version." — Aarti |

## Reconfirmed decisions (already documented)

| Decision | Source meeting |
|---|---|
| D_PCE08 — Module independence | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE09 — Prism coexistence | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE10 — Himanshu alignment required | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE11 — Super admin only for Phase 1 | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE12 — Two CFE sections | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE13 — Student experience email-driven | 2026-06-04-prism-redesign-aarti-alignment.md |
| D_PCE14 — Two CTAs in survey email | 2026-06-04-prism-redesign-aarti-alignment.md |

## Verbatim Aarti quotes

> "is this feature going in the first phase? No, not yet. Okay. So it's a conceptual. So again, like for me, the easier part is that I can just say that just remove the button." — Aarti, on faculty section assignment

> "Later we can build in review process because review is like a phase two process. So we're not doing that." — Aarti, on chair-approval review workflow

> "If published date has been set, I want to show you the status as published and the date. If published date is not there, then the status next to this can be published... not yet published or whatever." — Aarti, on assessment list columns

> "it's applicable to how many students and then how many students have completed it" — Aarti, on assessment list row data

> "scored and timed are...good attributes" — Aarti, on assessment attributes to show in list

> "there are going to be two different kind of design activities from my side. One is purely concept. This is just our exclusive discussion where everything is possible. And then there is a part of it where we say that... A cleaned up version... that is like for... And you can share both like this is the big picture thinking we are doing and then for phase one we can only focus on these things." — Aarti, on design process

> "I am not okay with the big picture thinking not happening at all. I am okay with the big picture thinking. The big picture thinking has to be done." — Aarti

> "I don't really care whether we do that in the bottom or on the side if we can accommodate it on the side, that's great." — Aarti, on difficulty distribution chart placement

## Design tasks generated

| Task | Type | Notes |
|---|---|---|
| T97 | Remove faculty section question-assignment button from assessment builder designs (Phase 1 scope) | D_EM_AA01 |
| T98 | Assessment list columns — publish status + date, "not yet published" CTA, applicable count, completion count, scored/timed attributes | D_EM_AA03, D_EM_AA04, D_EM_AA05 |
| T99 | Review workflow → Phase 2: update T47, flag WorkflowStepIndicator in assessments-tab.tsx | D_EM_AA02 |
| T100 | Two-track design process: produce both concept doc + Phase 1 cleaned-up designs going forward | D_EM_AA06 |
