---
type: meeting
date: 2026-07-23
product: exam-management
participants: [Romit Soley, Aarti, Bhargav, Vishal, Nipun, David]
source: granola
granola_id: 0261fe62-676a-4943-b452-d1a47422f86f
---

# Exam management weekly call — 2026-07-23

**Date:** 2026-07-23 10:30 AM EDT
**Participants:** Romit (Microphone), Aarti (Speaker, domain expert), Bhargav, Vishal, Nipun, David

---

## Topics covered

1. Faculty grading journey walkthrough (Aarti) — from student submission to score release
2. Assessment types in scope: quizzes, assignments, graded exams (didactic phase)
3. Grade book: structure, access tiers, course-level ownership
4. Manual score override and curving capability requirements
5. Point-biserial calculation scope — assessment-instance level confirmed
6. Cronbach's alpha metric — new ExamSoft parity item flagged
7. LMS integration for grade push (Canvas/Blackboard)
8. Download capability timeline reconfirmed: NOT in Jan MVP
9. Cohere conference: screens needed for day 1 leadership + day 2 sessions
10. MVP and limited availability timelines

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_EM_0723_01 | **Faculty must be able to manually override scores** — at class level (remove/bonus a question for everyone) AND at individual student level. "There should always be a way for a faculty to review and say yeah publish this." Cannot lock grade book at any point — must always allow manual change. | exam-management | T7, backlog item T108 |
| D_EM_0723_02 | **Point-biserial is per-assessment-instance, not historical.** "for that particular class… it's at assessment level." Historical p-bis is also important but secondary. The per-exam instance p-bis is the primary. Analytics screen already shows per-question p-bis within the current assessment — confirmed correct approach. | exam-management | T8, T71 — already implemented |
| D_EM_0723_03 | **Cronbach's alpha metric: research task for Vishal + Nipun.** New ExamSoft metric measuring internal consistency of questions. "That has come into picture." Aarti: "look into it Vishal and Nipun and see what it measures and whether we also want to introduce that in our exam management. It will definitely be a parity item with examsoft." | exam-management | T107 |
| D_EM_0723_04 | **Grade book is NOT in scope.** "Grade book is not part of our current plan." Scores are pushed to LMS (Canvas/Blackboard) per assessment; exam management does not own a full grade book. | exam-management | Already aligned with existing plan |
| D_EM_0723_05 | **Download capability NOT in Jan MVP.** Reconfirmed: "we have decided that the download capability will not be part of Jan." March (limited availability) is the target for download. | exam-management | T69 — already documented |
| D_EM_0723_06 | **MVP scope confirmed: Jan 20.** Question bank + assessment creation + student experience + post-assessment evaluation workflows + basic reporting + AI/agentic features. Limited availability = March. | exam-management | Phasing doc §3 |
| D_EM_0723_07 | **Cohere presentation: Aarti wants finalized screens.** "should we also show any prototypes? We should because the whole idea is if we are launching it in Jan we also want to build excitement." She wants screens for day 1 leadership session AND day 2 demo. "Invite David and Kanti" to review calls going forward. | exam-management | T98 |
| D_EM_0723_08 | **Pop quizzes / climate gauging: NOT in exam management scope.** Faculty use Kahoot, Mentimeter, or LMS for in-lecture gauging. "Leaving that aside." Our exam management targets graded quizzes, assignments, and exams that are part of the assessment plan. | exam-management | Taxonomy alignment |
| D_EM_0723_09 | **LMS is the official grade source of truth.** "LMS is always the official channel. And the source of truth." Exam management feeds INTO the LMS via integration — exam management grade book is supplementary. | exam-management | Integration scope |
| D_EM_0723_10 | **Exam review session scheduling: Phase 1 keep simple.** "I would say we don't have to worry about it at the beginning… give the course coordinator an option to schedule and do the review." Do NOT design complex per-faculty-section review workflows in Phase 1. | exam-management | Phase 2 deferred |

---

## Verbatim Aarti quotes

> "There should always be a way for a faculty to review and say yeah publish this. And faculty could also mark let's say if the student has scored 80 out of 100 faculty could increase it or decrease it — the total score."

> "We cannot give them an exam management grading screen or grade book screen where they are not able to manually make any changes that would not be a good design."

> "Grade book is not part of our current plan."

> "We have decided that the download capability will not be part of Jan."

> "I just came back from the AACP annual conference which is the pharmacy conference — a lot of deans and associate deans came to me and asked, is your exam management ready? Because they showed interest in signing up. So there's a lot of curiosity so I think we should use Cohere to build on that curiosity and show them some good screens."

> "Please invite David and Kanti [to the review calls]."

> "Look into it Vishal and Nipun and see what it measures and whether we also want to introduce that in our exam management. It will definitely be a parity item with ExamSoft." (on Cronbach's alpha)

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T107 | Cronbach's alpha research task — Vishal + Nipun | P1 | Engineering research, not design yet. Once investigated, design implications may follow. |
| T108 | Faculty post-exam score override — per-student manual override in curving/adjustment surface | P1 — DESIGN-REVIEW | Vishaka: must support both (a) class-wide question adjustment (remove/bonus) and (b) per-student score override. Current curving tab handles question-level; per-student row override not yet designed. |

See backlog update below for full task entries.
