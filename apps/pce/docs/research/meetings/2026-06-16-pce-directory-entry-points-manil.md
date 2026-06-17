---
type: meeting
date: 2026-06-16
product: pce
participants: [Romit Soley, Manil]
source: granola
granola_id: 9a5f3e06-7139-49ea-8a4c-c2ae1ed56c07
---

# PCE directory structure and analytics entry points — Manil — 2026-06-16

> Manil is a PM. Covers PCE directory tab structure, analytics confirmation, faculty profile pattern, student directory read-only status, and multi-select push-survey affordance. Romit walking through design concepts; Manil providing alignment.

## Topics covered

- PCE directory four-view structure (term, course, faculty, student)
- Entry points within each directory view: create template, create survey, analytics
- Student directory scope: read-only in PCE, no add/edit activities
- Multi-select courses in directory → targeted push survey flow
- Faculty directory: past course evaluations in tabular format
- Analytics tab structure: by term, by faculty, by course (confirmed correct)
- Faculty analytics drill-down: reuse same analytics UI inside faculty profile
- Sequencing: Manil to meet Thursday; first four items due by then

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_PCE_MN01 | PCE directory = four views: term view, course view, faculty view, student view. Each view must have entry points for: (1) create template, (2) create survey, (3) analytics. Aarti emphasized this "a lot" during the whiteboarding session. | pce |
| D_PCE_MN02 | Student directory in PCE = READ-ONLY. "It is just a view data activity. Adding new student and all will eventually figure out. That you can ignore. Addition of data activities you can ignore." Focus: entry points for create template, create survey, analytics — not student data management. | pce |
| D_PCE_MN03 | Multi-select courses in directory → "Push survey" CTA appears. Creates a survey scoped to only the selected courses, jumping directly to step 2 of the push survey flow (scope is pre-filled). "The scope is only for two courses. So you directly jump in your design to maybe step two." | pce |
| D_PCE_MN04 | Analytics tab structure confirmed correct: "by term", "by faculty", "by course" as three named analytics dimensions in the left nav. Manil: "Oh, this is correct." Same structure Aarti whiteboarded (three screens Romit replicated in analytics). | pce |
| D_PCE_MN05 | Faculty directory entry: clicking a faculty row → show past course evaluations in tabular format. Columns include: course taught, term, survey type (didactic, etc.), evaluation sheet status (live / closed). Same course can appear multiple times across terms. | pce |
| D_PCE_MN06 | Faculty analytics UI is reused inside the faculty profile entry point. "You can also reuse that UI here. Or you can create one different entry point and then show that screen. It will be same only." No need to build a separate deep Prism-style faculty profile. | pce |
| D_PCE_MN07 | Column schema for directory views: refer to Vishal's Excel sheet for exact column names (not yet in PRD). Columns follow the tabular structure Vishal already captured. Manil: "I don't want you to wait till then. You can refer to these column names and you can create a same tabular structure." | pce |

## Verbatim Manil quotes

> "Inside directory, you will have term view, course view, faculty view, and student view. And for each of view, we need to create entry points for create survey. As well as eventually for analytics."

> "Inside students, you don't need an interview. It is just a view data activity. It is a read only data. Adding new student and all will eventually figure out. That you can ignore. Addition of data activities you can ignore. But what you should focus on is how we can create entry points within the directory."

> "Let's say I am an admin. I go to faculty view. Now inside this faculty, I want to see doctor Sara's performance."

> "Now you see that she has taught one course in the past. But not necessary that this course might only have one line item. This line item, he's showing for a survey instance. There is a live survey for this course for this term. But maybe there can be a repeat same column for the same course for 2025, type didactic, and evaluation sheet is as closed view result."

> "She has asked for it [directory entry points]. Because she has emphasized on that a lot in that call. When she was whiteboarding. So you might be seeing in the camera as well, she was writing a lot on the the whiteboard. She created three screens."

> "Oh, this is correct. Go ahead. Complete." [Manil confirming Romit's by-term / by-faculty / by-course analytics left-nav structure]

> "Let's connect on Thursday again. Try to get the first four items completed by then."

## Design tasks generated

- T86 (pce): Multi-select courses in directory → "Push survey" CTA. Scope = only selected courses; flow jumps to step 2 (scope pre-filled). New affordance — not currently in push survey flow. D_PCE_MN03.
- T87 (pce): Directory four-view tabs — per-view entry points spec. Each of the four views (term, course, faculty, student) needs entry points for create template, create survey, and analytics. Supplements T47, T78, T79. D_PCE_MN01.
- Update T78: Student directory confirmed read-only by Manil. No add/edit of student records in PCE directory. Entry points only. D_PCE_MN02.
- Update T79: Faculty directory — clicking a faculty row shows past course evaluations in tabular format (course, term, type, evaluation status). Reuse existing analytics UI. D_PCE_MN05, D_PCE_MN06.
