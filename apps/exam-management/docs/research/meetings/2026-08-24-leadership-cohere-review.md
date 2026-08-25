---
type: meeting
date: 2026-08-24
product: exam-management
participants: [Romit Soley, Aarti, Vishaka, Vishal, Kanti, David, Wilson]
source: granola
granola_id: 0e389b16-0c78-43eb-bb3b-3873d96ea029
---

# Exam management review with leadership team — 2026-08-24

**Date:** 2026-08-24 9:00 AM EDT
**Participants:** Romit (note-taker), Vishal (Product — presenting), Aarti (CEO/leadership), Vishaka, Kanti, David, Wilson

---

## Topics covered

1. Exam lifecycle overview — all 7 stages (QB → Planning → Build → Configure → Distribute → Evaluate → Analyze)
2. Question bank current state: course shells, folder org, 8 question types, no FAST
3. AI investment scoped to Build stage only; manual lifecycle ships first
4. MVP timeline confirmed: Nov/Dec 2026 for QB+AI MVP; Jan 1 2027 full launch
5. Cohere conference session structure: Vishaka sets context, Vishal presents product
6. Cohere demo focus directive: assessment creation + evaluation + analysis (not question bank depth)
7. ExamSoft differentiators validated: opt-out lockdown browser (UNC Nursing pain point), Prism ecosystem, LMS integration
8. ExamSoft feature comparison table requested (PM task — section by section)
9. Agentic AI teaser option at end of Cohere session (Darshan's proof-of-concept)
10. Four Cohere booths + beta adoption QR code strategy
11. Pricing confirmed: no cost in 2027 to anyone; competitively priced vs. ExamSoft
12. Student exam experience — password entry → instructions → take exam (browser-only for January)
13. No FAST for exam management — confirmed at leadership level

---

## Decisions

| ID | Decision | Product | ADR |
|---|---|---|---|
| D_EM_0824_01 | **Cohere session structure: Vishaka leads first, then Vishal.** Vishaka sets the stage for why Exxat is investing in exam management (~10 min); Vishal presents the product (~30 min). Three core messages: (1) Prism ecosystem fit — courses, faculty, students pre-populated; (2) LMS integration — turnkey adoption; (3) Competitive roadmap — AI differentiators + ExamSoft gaps. | exam-management | — |
| D_EM_0824_02 | **Cohere demo focus = assessment creation + evaluation + analysis.** Question bank is introduced conceptually only. "On its own it doesn't win us any brownie points." Faculty audience cares about building, running, and reviewing an exam — not managing a question library. | exam-management | — |
| D_EM_0824_03 | **UNC Nursing validated differentiator: opt-out lockdown browser for open-book exams.** ExamSoft cannot disable lockdown browser for open-book exams. Exxat can. This becomes differentiator #2 after AI. Sourced from Vishal's UNC meeting email. | exam-management | — |
| D_EM_0824_04 | **ExamSoft feature comparison table — PM task.** Section-by-section parity matrix: what they have, what we have, what we have better, what we defer. Required before Cohere presentation alignment can be finalized. Vishal's PM team to produce. | exam-management | — |
| D_EM_0824_05 | **Agentic AI teaser — optional Cohere closer.** Darshan's conversational QB proof-of-concept (tell AI "select all diabetic questions and move to this folder") shown at the end of the session. 2–3 minutes. OK if it's not polished UI. "If we can set the stage for it properly, we might be able to get people excited." | exam-management | — |
| D_EM_0824_06 | **Four Cohere booth TVs; one for new modules.** Wilson's booth plan: (1) Ask Leo, (2) AI optimizations, (3) ExactOne, (4) New modules (exam management). Beta adoption QR code on decks, standees, and booth. Single QR → one Excel with per-module tabs. | exam-management | — |
| D_EM_0824_07 | **AI investment = Build stage only, confirmed at leadership level.** Manual lifecycle must be fully functional before AI layers are added. AI differentiates but does not replace the manual workflow. Nov/Dec 2026 = QB + AI MVP. Jan 1 2027 = full launch. | exam-management | — |
| D_EM_0824_08 | **No FAST for exam management — confirmed at leadership level.** Exam management needs deep question control, versioning, and per-question analytics. FAST's model does not support this. Engineering decision that stands. | exam-management | — |

---

## Verbatim quotes

> "I recommend that we introduce the concept of question bank. We talk about the ease and the management and how it will have everything, but we don't spend too much time on the question bank. It's important for us to have the question bank capability in the product, but on its own it doesn't win us any brownie points. So we don't, in the demo in the 30 minutes that you have for this focus more of your time on the assessment, the ability to create an assessment, distribute an assessment and evaluate." — Aarti

> "one new finding and I have written it as an email from my meeting with UNC nursing who are using examsoft today… they need ability to opt out of browser lockdown to be able to give open book exams, which today exam soft is not able to do. So that's another differentiator for us." — Vishal

> "I do want to, like, challenge all of us to think that whatever darshan had shown us about agentic AI, if it is possible for us to spend like two, three minutes saying... And it's okay if it doesn't look pretty… if we can set the stage for it properly, we might be able to get people excited." — Aarti

> "A, it's a prism module. So every, all the common things that you have in prison will be here. The courses, the faculty, the students, you don't have to worry about registering them. You don't have to worry about associating your faculty. That's already there. That's one very big important thing I want to make sure we convey." — Aarti

> "please make sure that kanti David vishaka have a very clear understanding of how we are positioning this. Like, can the that September 15 time that you have, maybe we should expand it to the entire us team so that whenever anybody asks any questions of the exact team, they know how to talk about the exam management module properly." — Aarti

> "for exam management, the decision is not to use fast because we need a different level of control over the questions. There is analysis that need to be done for question… This is we very much care what the question is and how it's structured." — Vishal

---

## Coordination tasks generated

| # | Task | Owner | Priority | Notes |
|---|---|---|---|---|
| T113 | Update T98: Cohere session structure confirmed (Vishaka leads, Vishal presents; focus on assessment+evaluation). Daily alignment calls this week with Kanti + Vishaka + Vishal. Sept 15 = broader US team alignment. | Romit / Kanti | P0 — this week | Updates T98. D_EM_0824_01, D_EM_0824_02 |
| T114 | ExamSoft feature comparison table | Vishal PM team | P0 — PM task | Section-by-section parity matrix before Cohere. D_EM_0824_04. Not a design task. |
| T115 | Document UNC Nursing opt-out-lockdown differentiator in product differentiators list | Vishal / Romit | P1 | New validated pain point. Add to ExamSoft comparison and Cohere deck. D_EM_0824_03. |
