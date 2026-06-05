---
type: meeting
date: 2026-06-04
product: exam-management
participants: [Romit, Vishal, Nipun]
source: granola
granola_id: e97078d1-8ac5-4c39-b6c0-4a90cd5dfaf4
---

# Exam Management — Course Landing Pages, Assessments, and Design Alignment with Vishal

## Topics covered

- Course offerings landing page structure and navigation
- Course detail tabs and information hierarchy
- ExamSoft parity as design baseline
- Question banks as separate dedicated space (confirmed)
- Setup / Course Catalog → Prism-base pages (navigation, not rebuild)
- Assessment list information architecture
- LMS integration — deferred for current sprint
- Prism terminology alignment (faculty roles, column labels)

## Decisions

| # | Decision | Product | Quote |
|---|---|---|---|
| D_EM70 | Course offerings list is the default landing when entering Exam Management. Default filter = Ongoing | exam-management | "the default can be ongoing, because that is the most likely thing that they would want to look at" — Vishal |
| D_EM71 | Card view for course offerings deferred — list view only for now | exam-management | "I'll check this ID of CardView for now. If it comes back, Nava will figure it out. But we'll have a list view." — Vishal |
| D_EM72 | "Primary Faculty" is not a Prism term — replaced with "Course Coordinator" in all labels | exam-management | "primary faculty is not a term we are using in Prism. For course faculty, there are different rules that have been defined. So you should just use those." — Vishal |
| D_EM73 | Course Catalog and Terms / Setup items navigate to Prism-based pages — not rebuilt inside Exam Management | exam-management | "we can remove one tab altogether. That's a lot of space … add offering should not even be in the main courses screens … should we also move course catalog to the present base and have only course offerings here?" — Vishal |
| D_EM74 | Mapping tab in course detail deferred — "We'll not have this right now" | exam-management | "Mapping is what? Tagging? Yeah. It's tagging. It'll come later. Yes. We'll not have this right now." — Vishal |
| D_EM75 | Accommodations tab in course detail is a placeholder — build when accommodations module ships | exam-management | "Accommodations also It's a placeholder. Whenever we build accommodations, you know, we will build this." — Vishal |
| D_EM76 | ExamSoft parity is the baseline floor — every addition or removal needs explicit rationale | exam-management | "our designs should consider what ExamSoft has and with a strong rationale add or subtract from." — Vishal |
| D_EM77 | LMS integration features (chip indicator, link enforcement) deferred for current sprint | exam-management | "LMS integration is not something we have planned for right now. The team is working on it, but they're working on some entities which are not what we need." — Nipun |
| D_EM78 | Course detail tab order confirmed: Assessments (default) · Questions · Students · Accommodations · Mapping · Faculty | exam-management | "Let's agree on the tabs we need to show … Landing is assessments because that's the meat of the product." — Vishal |
| D_EM79 | Faculty "assign questions to section" button → hidden for Phase 1 | exam-management | "You can like, hide that right now? Because for, like, the immediate rollout, we won't be able to accommodate that." — Aarti |
| D_EM80 | Difficulty distribution (Easy / Medium / Hard) always visible during assessment building — persistent, not on-hover | exam-management | "I like idea of always showing. This is good." — Aarti |
| D_EM81 | Publish / distribution is a separate step from assessment creation — not inside the build flow | exam-management | "I don't think … when I'm thinking about delivery, I'm thinking about how am I publishing it, when, how much time am I giving them." — Aarti |

## Verbatim quotes

> "the default can be ongoing, because that is the most likely thing that they would want to look at." — Vishal, 2026-06-04

> "primary faculty is not a term we are using in Prism. For course faculty, there are different rules that have been defined. So you should just use those." — Vishal, 2026-06-04

> "our designs should consider what ExamSoft has and with a strong rationale add or subtract from." — Vishal, 2026-06-04

> "Mapping is what? Tagging? Yeah. It's tagging. It'll come later. Yes. We'll not have this right now." — Vishal, 2026-06-04

> "I like idea of always showing." [difficulty distribution in assessment builder] — Aarti, 2026-06-04

> "Accommodations also It's a placeholder. Whenever we build accommodations, you know, we will build this." — Vishal, 2026-06-04

> "we can remove one tab altogether. That's a lot of space." — Vishal, 2026-06-04

## Design tasks generated

| Task | Type | Notes |
|---|---|---|
| ✅ APPLIED today | "Primary Faculty" → "Course Coordinator" label in `courses-client.tsx` AddOfferingSheet | D_EM72 |
| T85 | Admin Courses — Setup tab + Course Catalog → link to Prism-base pages (DESIGN-REVIEW — structural) | D_EM73 |
| T86 | Mapping tab in course detail — confirm with Aarti before removing; add to backlog | D_EM74 |
| T87 | Course landing analytics — analytics section on course offerings landing (NEW DESIGN NEEDED) | per Vishal |
