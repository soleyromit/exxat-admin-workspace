---
type: meeting
date: 2026-06-03
product: exam-management, pce
participants: [Aarti, Vishaka, Vishal, Nipun, Rohit, Michelle/Yash, Darshan, Romit]
source: granola
granola_id: 7a53688f-a1c3-42b6-b091-31035fd70d7b
---

# Weekly Product Sync | New Initiatives (Prism) — 2026-06-03

## Topics covered

- Exam Management: Question bank status, assessment experience delivery, assessment creation prototypes
- Course Evaluation (PCE): Template and distribution flow design review, navigation structure
- Process: Project management, milestone planning, team accountability, Cohere readiness

---

## Decisions

| # | Decision | Product | Notes |
|---|---|---|---|
| D_EM83 | "Ad hoc assessments" wording — KILL IT | exam-management | Aarti: "I really don't think we should be using the word ad hoc assessments. Like, what does ad hoc versus non ad hoc mean?" Not present in current code. |
| D_EM84 | "View three more assessments" (collapsed past items) — KILL IT | exam-management | Aarti: "I do not also like the idea of hiding the past assessments under view three more assessments. That's just unnecessary. Clicks. It's okay to just make it longer scroll bar." Not present in current code. |
| D_EM85 | "Past" label for completed assessments — WRONG; use "Completed" | exam-management | Aarti: "I also don't know if the word past is the better word for it because it's still part of the current course... grading is something you would do on a completed assessment." Current code already uses "Completed". |
| D_EM86 | "Live in two weeks" phrasing on assessment status is confusing | exam-management | Aarti requested clarity: distinguish "published with date, exam is upcoming" vs "created but not published." Current code uses proper status labels (Scheduled / Not yet scheduled / Ongoing / Completed). No code change needed — confirms existing implementation. |
| D_PCE40 | Academic year: do not collect separately — term picker already includes it | pce | Aarti: "we don't need to collect the academic year twice." Current push/page.tsx shows `{t.name} · {t.academicYear}` combined in SelectItem. Already correct. |
| D_PCE41 | Term missing start/end dates → show reminder/link | pce | Aarti: "some message if they haven't... entered the start date and end date... a reminder to go add start date and date." FLAG — new UI pattern. T58 added to PCE backlog. |
| D_PCE42 | Search and Ask Leo → must stay in Prism TOP PANEL, not left sidebar | pce | Aarti: "search for example, should not be moved into the left hand [side]... And then same thing with Ask Leo. These are things that are on the top panel... we cannot make them into left hand side menus. That's not going to work out." Pending Prism nav alignment discussion with Himanshu + Yash. T57 added to PCE backlog. |
| D_EM_PROC | Design changes to top-level Prism nav require alignment discussion first | exam-management, pce | Aarti: "Just ad hocly changing things is not going to work. Michelle, you and Yash will have to sit down with him and should do have a point of view on this." Any structural nav change needs Himanshu + Yash review. |
| D_EM_PROC2 | Course eval: Cohere demo + November 1 release target | pce | Aarti: November target for PCE release so schools can use for year-end surveys. Cohere demo readiness is a separate, earlier milestone. Process note only. |
| D_EM_PROC3 | Working product definition (reconfirmed) | exam-management | Aarti: "questions, assessments, students, exam taking, grading, sharing results... everything on hold. That is not necessary for a basic assessment to be created, monitored, assigned, and completed." Confirms §5.47 scope. |

---

## Aarti verbatim quotes

> "I really don't think we should be using the word ad hoc assessments. Like, what does ad hoc versus non ad hoc mean?"

> "I do not also like the idea of hiding the past assessments under view three more assessments. That's just unnecessary clicks. It's okay to just make it longer scroll bar."

> "I also don't know if the word past is the better word for it because it's still part of the current course. It's just showing in the bottom section because assessment was completed. Like you see, there is still work that may have to be done for a completed assessment. Past always gives me understanding of it's complete and done and dusted."

> "search for example, should not be moved into the left hand [side]. It should be something that we put on the browser on the top... And then same thing with Ask Leo. These are things that are on the top panel... we cannot make them into left hand side menus. That's not going to work out."

> "Just ad hocly changing things is not going to work. Michelle, you and Yash will have to sit down with him and should do have a point of view on this."

> "We don't need to collect the academic year twice."

> "questions, assessments, students, exam taking, grading, sharing results. Like, let us please write down what are the bare minimum... everything else is bells and whistles."

---

## Design tasks generated

- T57 (PCE): Search and Ask Leo placement — confirm in top panel, not left nav. Pending Prism alignment discussion.
- T58 (PCE): Term missing start/end dates → show reminder/link in PCE. New UI pattern needed.
