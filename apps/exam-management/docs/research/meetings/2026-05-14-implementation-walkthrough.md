---
type: meeting
date: 2026-05-14
product: exam-management
participants: [Romit, Aarti, Vishaka, Vishal, Darshan, Kunal, Michelle, others]
source: granola
granola_id: d5aa2783-2840-4753-ae4b-5d0dec2bd1aa
---

# Exam Management — Implementation Walkthrough, Question Bank, AI Features

**Date:** 2026-05-14  **Time:** 8:14 AM EDT  **Format:** Full team walkthrough (product, eng, design)

## Topics covered

1. What's been built in the first month (April 13 – May 14): React migration, RBAC, accessibility pipelines, question bank 50% done
2. AI POC status: question import from PDF (paused until roadmap is clearer)
3. Prism integration: course creation auto-creates QB shell folder
4. Student exam-taker app: question rendering, keyboard shortcuts, calculator, submit
5. Question bank landing page: what should be the default view?
6. Product dashboard philosophy: analytics/reporting as primary nav, not afterthought
7. Faculty app point-of-view needed
8. Launch timeline reconfirmed

---

## Decisions

| # | Decision | Scope | Quote |
|---|---|---|---|
| D_IW1 | QB landing page is NOT "all questions" — needs a higher-level folder/dashboard view | Admin | "All questions is not something that should be default." — Aarti |
| D_IW2 | "My questions" = default QB landing for faculty; admin sees permissions/folder management first | Faculty/Admin | Romit proposed; Aarti affirmed |
| D_IW3 | Admin QB role = manage permissions and folder access; admin also likely teaches 1–2 courses and uses "My questions" secondarily | Admin | "The responsibility of the admin is not going to be to go and edit questions. It's going to be to manage that permission and access." — Aarti |
| D_IW4 | Submit button → TOP panel ONLY. Not bottom. | Student | "Submit should not be at the bottom. Submit should only be at the top." — Aarti |
| D_IW5 | Question stem + options always together. Reference material on the left; question+options on right (or together on same side). Never split the stem from its options. | Student | "Question stem, options should always go together." — Aarti/Vishaka |
| D_IW6 | Checkbox/radio for answer selection → LEFT of option text | Student | "The check box should be towards the left because they see the text and then they are selecting." — Vishaka |
| D_IW7 | Three must-have AI features (non-negotiable): AI for adding questions, AI for creating assessment, AI for analyzing results | All | "These three are nonnegotiable. They have to be there." — Aarti |
| D_IW8 | LMS-first: when LMS integration is on, disable manual add/edit controls — LMS = source of truth | Admin | "If the LMS integration is on, I recommend to take away all of these things because the source of truth is LMS." — Aarti |
| D_IW9 | Launch timeline: Jan 20, 2027 (full product launch), Sept 2026 (Cohere demo) | All | "The product needs to be fully functional by January 20 as a rip replacement for assessing and managing exams." — Aarti |
| D_IW10 | Three alignment docs needed ASAP (word doc format): (1) types of questions, (2) configuration at assessment vs. question level, (3) attributes of a question | PM/Design | "Can I get three things by early next week?" — Aarti |
| D_IW11 | Analytics/reporting = first-class design principle; baked into product from day one, not an afterthought | All | "I want the reporting and analytics baked into the design of the product to begin with." — Aarti |
| D_IW12 | Current-term course offerings should be the primary anchor of the product landing page | Admin/Faculty | "The concept of current courses, what is currently being offered should be brought into the entry page." — Aarti |
| D_IW13 | AI in question import from PDF is paused until concrete roadmap integration plan exists | Engineering | "We have taken a pause on this POC, unless we have some concrete roadmap to integrate AI for question import." — Darshan |
| D_IW14 | Question-to-standard mapping should also support "via course objective" pathway when Prism course objectives exist | Faculty | "The question stem has to also go with the options." — Aarti (separate from mapping discussion) |
| D_IW15 | Goal: 50 signed clients using exam management in 2027 | Business | "Our goal is 50 clients in first six months of 2027." — Aarti |

---

## Status updates

- Question bank: ~50% done; 2 devs working full-time through end of month (may need more time)
- Adding 1 more UI dev to accelerate
- Student exam-taker: basic exam flow working; no pre/post exam screens yet
- RBAC: API-level done; UI-level in progress
- Accessibility pipeline: set up and running in CI for both admin and exam-taker
- LMS integration blockers: need course start/end dates (from plan module team), need faculty auto-assignment at course-offering level

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| QB landing page — folder dashboard | P0 | Replace "all questions" default with folder-level dashboard: count, approval status, recent activity |
| Faculty app — point-of-view doc | P1 | Romit to draft persona + landing page + experience for faculty login |
| Admin/Faculty/Student persona docs | P1 | Three point-of-view documents before final dashboard design |
| Product landing page — current-term courses | P1 | Anchor on current term offerings; active courses prominently surfaced |
| Calculator + reference material placement | P1 | Reference = globally accessible button; question-specific reference = tabs |
| Submit button relocation in exam-taker | P1 | Move to top panel — FLAG (requires structural change to exam engine) |
| Checkbox position fix | P1 | LEFT of option text — safe change pending exam engine DS pass |

---

## Verbatim Aarti quotes

> "I want the reporting and analytics baked into the design of the product to begin with. So let's keep that in mind. AI is not an afterthought. Data analytics and reporting is not an afterthought."

> "The product needs to be fully functional by January 20 as a rip replacement for assessing and managing exams."

> "These three are nonnegotiable. They have to be there. AI in adding a question, AI in creating an assessment, and AI in analyzing the results."

> "Today, ExamSoft has all these capabilities. And yet when we talk to the customers of ExamSoft, they're like, 'oh, we hate the product.' So I just want everyone to understand how it is, not just what it is that we're building."
