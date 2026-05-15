---
type: meeting
date: 2026-05-14
product: exam-management
participants: [Romit, Vishaka, Aarti]
source: granola
granola_id: 81c06a04-e3dc-499c-8f5a-c935e55d8d31
---

# Exam Management — Student Login Experience

**Date:** 2026-05-14  **Time:** 2:02 PM EDT  **Duration:** ~2 hrs

## Topics covered

1. Student combined login (one app, not two)
2. Student dashboard layout and phase 1 must-haves
3. Download section requirements
4. Exam-taking UI: header, navigation, submission flow
5. Exam engine: checkbox position, reference material, skipped/flagged model
6. Student, faculty, course profile — which tabs belong in exam management
7. Accommodations phase 1 scope
8. FERPA rules for role-based data access
9. Entity directory pages: global search philosophy

---

## Decisions

| # | Decision | Scope | Quote |
|---|---|---|---|
| D_SL1 | Student experience = ONE combined login (not two separate ExamSoft-style apps) | Student | "We just want to have a combined experience for students" — Vishaka |
| D_SL2 | Student dashboard Phase 1 must-haves: My Courses, My Accommodations, Open Action Items, Recently Published Results | Student | "These four have to be there in the product" — Vishaka |
| D_SL3 | Download section must show: course name + assessment name + instructions + download window + exam date/time + download button | Student | "ExamSoft doesn't show course name in the download section. It's a big gap." — Vishaka |
| D_SL4 | Exam header = sacred space: BOTH course name AND assessment name mandatory | Student | "I don't want that course name to be replaced by assessment… I cannot see that reference is not okay" — Vishaka |
| D_SL5 | Submit button → TOP panel ONLY (not bottom panel) | Student | "Submit should not be at the bottom. Submit should only be at the top. It's like an interruption to my workflow." — Vishaka |
| D_SL6 | Next + Flag buttons → bottom panel. Improve bottom panel prominence (not removal). | Student | "I really don't like this… I am having difficulty trying to understand that that bottom section is my navigation panel" — Vishaka |
| D_SL7 | Answer selection checkbox/radio → LEFT of option text (before A B C D) | Student | "The checkbox should be towards the left because they see the text and then they are selecting" — Vishaka |
| D_SL8 | KILL: Jump to specific question number dropdown | Student | "I still don't like that drop down at all. There is an absolute no reason in my head when I've just started that I want to go to question 23." — Vishaka |
| D_SL9 | Pre-submission: show "Skipped + Flagged" summary. "Skipped" = any unanswered question before the student's current progress position. | Student | "Don't even call it unanswered. Call it skipped and flagged." — Vishaka |
| D_SL10 | Exam submission: lock on submit → background async sync → "uploaded successfully" notification when synced | Student | "Under no circumstances should a submitted exam be lost." — Vishaka |
| D_SL11 | Section title appears ABOVE the section's questions in the exam — NOT in the top header | Student | "The top panel has to be, like, sacred space." — Vishaka |
| D_SL12 | Student profile tabs in exam management: Courses + Accommodations ONLY. All other Prism tabs (compliance, learning activities, competency dashboard, intervention) are not needed here. | Admin/Faculty | "When they are in exam module, it's just exams." — Vishaka |
| D_SL13 | Faculty profile tabs in exam management: Course associations (coordinator vs instructor role) ONLY. NOT teaching/scholarship/service, placements, compliance, advisees. | Admin | "We should not even design it as teaching scholarship service. All of none of that is needed here." — Vishaka |
| D_SL14 | Course profile tabs: student registration + announcements/email notifications + course measures + resources (syllabi). NOT placements, NOT learning activities. | Admin/Faculty | (derived from Vishaka's walkthrough of relevant vs. irrelevant tabs) |
| D_SL15 | KILL for exam management: compliance (student + faculty), intervention/communication tab, academic standing, competency dashboard (Prism handles this), learning activities | Admin/Faculty | "Competency dashboard: No point in showing because this is mainly going to be used for didactic exams." — Vishaka |
| D_SL16 | DEFER post-January: Overarching student insights, Review calendar, Communication feature between student and faculty | Student | "Sequencing wise, it will have to come later… it's not less important." — Vishaka |
| D_SL17 | Auto-email to students when download window is ending (student hasn't downloaded yet) + audit log of all system-sent notifications | Student/Admin | "Auto notification for students when they download window is ending and student has still not downloaded — that is very important." — Vishaka |
| D_SL18 | FERPA: 4 legitimate access paths for student performance data: (1) direct instructor, (2) course director, (3) official adviser, (4) senior admin. No others. | All | "It's as simple as that. So those are our guidelines." — Vishaka |
| D_SL19 | Entity directory pages use global search (Google-style, one box) — NOT field-by-field text boxes | Admin | "The way we should do search in these new modules is like a Google search." — Aarti |
| D_SL20 | Reference material: available globally via a button (like calculator) throughout the exam. Question-specific reference = shown as tabs adjacent to the question+options. | Student | "Just like they can open the calculator for any question, they can open that resource document." — Vishaka |
| D_SL21 | Phase 1 accommodations: extra time + font size increase ONLY. Separate room = not product-controllable. | Student/Admin | "Higher font size and extra time are the most common accommodations." — Vishaka |
| D_SL22 | Accommodations default: applied to all courses the student is registered in. Faculty can override per assessment. | Admin/Faculty | "Our default can be that when they enter accommodations for the student, the default is applied to all the courses." — Vishaka |
| D_SL23 | In-progress counter: show "X of Y answered" during the exam | Student | "You could also be showing them 20 out of 50 answered as they are going through it." — Vishaka |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| Student dashboard — 4-section layout | P1 | My Courses, My Accommodations, Open Action Items, Recently Published Results |
| Download section UI | P1 | course name + assessment name + instructions + window + exam date + download button |
| Exam header redesign | P1 | Add course name + assessment name (both mandatory). Needs new props. FLAG — requires data model. |
| Submit button relocation | P1 | Move to top panel. FLAG — structural change across exam engine. |
| Bottom panel redesign | P1 | More prominent Next + Flag. Improve visual weight. |
| Checkbox/radio position | P1 | Move selection control to LEFT of option text |
| QuestionJumpPopover | DESIGN-REVIEW | Already shows flagged/unanswered/answered groups (correct). QuestionNavigatorPopover (grid of numbers) should be removed or replaced. FLAG — arch decision. |
| Pre-submission summary | P1 | Skipped + Flagged popup before submit |
| Async submission + success state | P1 | Background sync, "uploaded successfully" notification |
| Entity directory pages (8 screens) | P1 | Romit working on these. Global search philosophy. |
| Faculty profile — trim tabs | P1 | Course associations only. Flag for implementation. |
| Student profile — trim tabs | P1 | Courses + Accommodations only. |

---

## Verbatim Aarti/Vishaka quotes

> "On the student section, if there is a list of all notifications or whatever that they have been sent through the system. Then there is no debate. I didn't get it." — Vishaka

> "Under no circumstances should a submitted exam be lost somewhere." — Vishaka

> "The top panel has to be, like, sacred space." — Vishaka

> "I never want to see all students. I never want to see all courses." — Aarti (on admin landing page philosophy)

> "See, even for an admin, when they log in, let's say my job is to look at if all courses are going well. I would still want a view that says all students registered for a course in this semester." — Aarti
