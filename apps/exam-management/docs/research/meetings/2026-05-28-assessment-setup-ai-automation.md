---
type: meeting
date: 2026-05-28
product: exam-management
participants: [Romit, Nipun, Vishal, Harish, Darshan]
source: granola
granola_id: 925fa644-6723-446d-b820-fb2134ddc56f
---

# Assessment Setup and AI Automation Features for Exam Management

**Date:** 2026-05-28 · **Time:** 10:33 AM EDT
**Context:** Weekly PRD review call. Nipun leading. Romit attending. Topics: section navigation restrictions, timers, offline mode, document upload formats, assessment setup page design, AI feature planning for post-launch.

## Topics covered

1. Section-level back-navigation restriction — ExamSoft-style lock vs. free navigation
2. Section-level timer — necessity vs. phase 2 deferral
3. Question-level timer — visible config vs. background-only tracking
4. Offline download mode — reiteration of Q1 position (not December launch)
5. Document upload formats for question import — PDF only vs. PDF + Word
6. Assessment setup page structure — comprehensive single view
7. AI automation features for assessment creation — scoping discussion
8. Question tagging to standards/competencies — Phase 1 must-have
9. Curricular assessment loop (via course-objective mapping) — post-launch
10. ExamSoft parity review: red = explicitly not building, green = differentiator, yellow = parity-alternate

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM62 | **Section back-navigation: no restriction. Allow free navigation between sections.** ExamSoft has a section-level lock (no navigating back to previous sections). Exxat will NOT replicate this. "I don't see any value unless you have a strong rationale for why we should put that limit on there. No, there's no strong rationale." — Nipun. If we later add it: configurable setting, default = allow. | Admin / Faculty / Student | — |
| D_EM63 | **Section-level timer → Phase 2. Remove from Phase 1 scope.** "Section level timer, if you have to pick, it can be pushed to a later stage." — Nipun. Used almost exclusively in licensure standardized exams (FPGEC, etc.), not typical midterm/final use cases. | Admin / Faculty | — |
| D_EM64 | **Question-level timer (visible, user-facing config) → Phase 2. Background tracking = Phase 1.** The per-question time-limit configuration ("answer within N seconds") is Phase 2. HOWEVER: background tracking of time-per-question (rendered → navigated-away) must be captured as a system analytics layer from day one, invisibly. "Question level timer like, setting up the background chat. That is a background analysis system handle. Correct." — Nipun. | Eng / Admin | — |
| D_EM65 | **Offline mode reiteration — Q1 deliverable, browser-only for December.** Reconfirms D_EM45 from 2026-05-27. Aditi (Aarti): "It's okay if we — it's too difficult to build. We will launch it without that, and later we will introduce it." Browser-based launch with preload safety net for December 2026. Offline download (Exemplify-style) = Q1 2027. | Admin / Faculty / Student | — |
| D_EM66 | **Document upload for question import: support PDF AND Word (.doc/.docx). Not PDF only.** Current Romit design shows only PDF. This must be updated. "I don't see any technical constraint... We can support doc and PDF both." — Darshan (confirmed). Faculty create questions in Word; they convert to PDF only for printing. Both formats must be accepted. | Admin / Faculty | — |
| D_EM67 | **Assessment setup: comprehensive single-page view. No splitting config before/after question selection.** "All setup related things on one page, let's not break up the setup into collecting some setup related things at the beginning. Before building the questions and some after. Let's try to give a comprehensive view of all the assessment related setup that they are doing in one view." — Nipun. Reference: ExamSoft setup page as a starting baseline (not to copy — to exceed). | Admin / Faculty | — |
| D_EM68 | **Question tagging to standards/competencies (direct mapping) = Phase 1 must-have.** ExamSoft parity. "Direct way for them to map their questions to standards and competencies. That's a parity item with ExamSoft." — Nipun. This is T10 in the backlog — reconfirmed. Enables assessment gap analytics and coverage reporting. | Admin / Faculty | — |
| D_EM69 | **Curricular assessment loop (via course objective + LMS/Prism mapping pathway) → post-launch.** The second pathway (connecting QB questions to course objectives through curriculum mapping) requires prereq data from LMS or Prism curriculum module. Not feasible for Phase 1 due to data availability. Post-launch iteration. "Can come after the launch if you ask." — Nipun. Does not affect D_EM68 (direct tagging is Phase 1). | Eng | — |
| D_EM70 | **AI features for assessment creation = nice to have, post-launch. Phase 1 = manual with basic AI question search.** Three AI capability buckets discussed: (1) fully automated creation, (2) AI modification of prior assessments, (3) advanced assessment gap analysis. All are post-launch "nice to haves." For launch: basic keyword/tag-based AI question search from QB is the ceiling. "Let's start with basic setup. Let them assign points. Let's get the basic right." — Nipun. | Admin / Faculty | — |

---

## Verbatim quotes

> "I don't see any value unless you have a strong rationale for why we should put that limit on there. No, there's no strong rationale." — Nipun (re: section back-navigation restriction)

> "Section level timer, if you have to pick, it can be pushed to a later stage." — Nipun

> "Question level timer like, setting up the background chat. That is a background analysis system handle. The another one which you are talking about is — the moment the user renders that question, until the moment user is navigating to next question. So we have even we are capturing it behind the scene automatically, but the question level timer configuration — in which we are asking user to give the response within the given time frame — is something where we are debating whether we should have it or not." — Nipun

> "It's okay if we — it's too difficult to build. We will launch it without that, and later, we will introduce it." — Aditi (re: offline mode)

> "We can support doc and PDF both." — Darshan

> "All setup related things on one page, let's not break up the setup into collecting some setup related things at the beginning. Before building the questions and some after. Let's try to give a comprehensive view of all the assessment related setup that they are doing in one view." — Nipun

> "Direct way for them to map their questions to standards and competencies. That's a parity item with ExamSoft." — Nipun

> "What we can focus on is providing them with assessment gaps based on their direct mapping questions to competencies. We can give them really good analytics and dashboards based on that." — Nipun

> "No software, to my knowledge today, covers the entire curricular assessment loop. And that could be our value proposition." — Aarti (reference, from earlier meeting)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| Assessment builder / taker | No section back-navigation restriction found in code. | ✅ Correct — D_EM62 means don't build one. |
| Assessment builder / taker | No section-level or question-level timer config UI found. | ✅ Correct — D_EM63 + D_EM64 mean don't build visible timer config. Background tracking is a backend/analytics concern. |
| Upload component (question import) | Not yet built in admin. When built, must accept both `.pdf` and `.doc/.docx`. | ⚠️ Note for T51 (create assessment → copy/import path): accept both formats. D_EM66. |
| `components/question-editor/question-editor.tsx` | Question editor exists — check for direct standards/competency tagging field. | ⚠️ T10 reconfirmed as P1. D_EM68. |
| `docs/workflows/_backlog.md` T58 | Offline mode note already revised to Q1 by T69 from May 27. | ✅ No change needed. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T73 | P1 | Assessment setup: comprehensive single-page config view. All setup items visible together. Reference ExamSoft setup page as baseline (not copy). D_EM67. DESIGN-REVIEW — structural. |
| T74 | P1 | Document upload: accept PDF AND Word (.doc/.docx) in question import. Update upload accept attribute when upload component is built. D_EM66. |
| T75 | P1 | Confirm no section back-navigation lock exists in assessment taker. Default = allow. If configurable setting added later, default must be "allow." D_EM62. |
