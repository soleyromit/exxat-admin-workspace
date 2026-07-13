---
type: meeting
date: 2026-07-13
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 8330d724-6bbd-4605-b075-4978c3078b98
---

# Dashboard and analytics design — messaging, KPIs, and multi-survey structure — 2026-07-13

> Monil + Romit design review of the CFE dashboard prototype. Topics: current/last term card CTAs, upcoming card layout, courses table columns, setup survey flow step count, single vs multi-survey analytics split, multi-survey tab structure and mental model walk-through. Next call: bi-weekly with Vishaka and David, Jul 14 — verbiage review for dashboard, templates, and directory.

---

## Topics covered

- Current term dashboard card: KPIs + "Send Evaluation" CTA feedback
- Last term dashboard card: same feedback as current term
- Upcoming card: date label clutter, missing CTA, "term starts" vs "open"
- Courses table: faculty column display, student count column
- Setup survey flow: too many steps (5), start from Course Readiness
- Verbiage: "send evaluation" → "setup evaluations" everywhere
- Single-survey analytics vs multi-survey analytics split — delivery deadline
- Multi-survey analytics: mental model walk-through (by Term, by Faculty, by Course)
- Analytics tab placement: tabs should be at TOP (horizontal), not sidebar
- Tomorrow's call: verbiage review for dashboard, templates, directory

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0713_01 | **Remove "Send Evaluation" CTA from current term dashboard card.** Monil: "we will not need send evaluation here. So you can remove that." | pce | T103 |
| D_PCE_0713_02 | **Remove "Send Evaluation" CTA from last term dashboard card.** Monil: "We will not have send evaluation CTI, same feedback." | pce | T103 |
| D_PCE_0713_03 | **Rename "Send Evaluation" → "Setup Evaluations" throughout prototype.** Monil: "wherever you are calling it as send evaluation. Instead of that rename it to setup. Because it's not actually send." Triggered by Yash's repeated feedback. | pce | T101 |
| D_PCE_0713_04 | **Upcoming card CTA: change from "View Term" → "Setup Evaluations".** Monil: "instead of that we can have set up. Or set up survey for this term or set up evaluations." When "add missing info" is clicked, pre-select courses + instructor. | pce | T102 |
| D_PCE_0713_05 | **Upcoming card date label: "Open" (count) → "term starts".** Monil: "instead of open we can write term starts because that's a term start date." | pce | T102 |
| D_PCE_0713_06 | **Wherever start/end dates appear, distinguish "term start" vs "survey start".** Monil: "there will be two type of dates. One is term start and end date and another is survey start and end date. Wherever we use this start and end let's be clear also whether it's a term start or a survey start." | pce | T102 |
| D_PCE_0713_07 | **Remove student count column from courses table.** Monil: "we can skip students." Student count is already visible in the card header (40, 60, 50 enrolled). No additional column needed. | pce | T103 |
| D_PCE_0713_08 | **Faculty column: show count (or avatars) instead of full names.** Monil: "we can show the count of faculty. Instead of the full names." Romit proposed two avatars. Agreed: avatars if images are available, otherwise count. | pce | T101 |
| D_PCE_0713_09 | **Add "Total courses evaluated" KPI to the current term dashboard card.** Monil: "We can also add in the first card. Things like. Total courses evaluated." Reference: Monil's original prototype KPI set. | pce | T101 |
| D_PCE_0713_10 | **Setup survey flow: remove "Term Details" as step 1. Start from "Course Readiness".** Monil: "I don't want to call this as a five step process... Let's start from course readiness. Whatever term details that you have created, let's call that as a separate configuration process to configure a term calendar." Term is pre-filled from the card the user clicked. | pce | T104 |
| D_PCE_0713_11 | **Single-survey analytics (row 16) due to engineering this week. Multi-survey NOT due this week.** Monil: "we need to hand it over to engineering by end of this week. So by tomorrow end of the day, I will give you feedback only on single server analytics." Multi-survey: "We don't have to freeze this by this week." | pce | T106 |
| D_PCE_0713_12 | **Multi-survey analytics tabs on TOP of page, not sidebar.** Monil: "Imagine these on the top of this screen." Four tabs: Overview, by Faculty, by Course, by Term. | pce | T105, T107 |
| D_PCE_0713_13 | **Multi-survey analytics tab structure: 3 layers per tab — KPIs → trend graph → deep-dive table/navigation.** Monil: "each tab here will have kpis, will have trend graphs and we'll have deep dive table or a navigation. Three things." | pce | T105 |
| D_PCE_0713_14 | **By-Faculty analytics: master leaderboard → click faculty → longitudinal faculty detail → click score card → single-survey results.** Monil: "These are the five faculties who taught and this is the order of the score. I want to more focus on Dr. Sandra and I click on that view inside and then the entire view opens only for Dr. Sandra." By Faculty is the most important tab. | pce | T105 |
| D_PCE_0713_15 | **Tomorrow Jul 14 bi-weekly call with Vishaka and David: full verbiage review for dashboard, templates, and directory tabs.** Monil: "Let's do the entire verbiage review for. Dashboard and templates... And directory also if time permits." | pce | — |
| D_PCE_0713_16 | **Reporting (export to Excel/PDF) is the final leg of the analytics module — deferred.** Romit raised export-per-card. Monil: "whatever we build on screen should also have a reporting angle to it… that's the final leg of the module." Not Phase 1 priority. | pce | — |
| D_PCE_0713_17 | **Multi-survey analytics design: do NOT share the prototype URL with the agent.** Monil: "do not share this URL with the agent. Otherwise your agent will get biased. We should not give solution to the agent." Design independently; use prototype only as reference for intent. | pce | T105 |

---

## Verbatim quotes (Monil)

> "we will not need send evaluation here. So you can remove that."

> "We will not have send evaluation CTI, same feedback. Rest look same."

> "instead of open we can write term starts because that's a term start date."

> "there will be two type of dates. One is term start and end date and another is survey start and end date. Wherever we use this start and end let's be clear also whether it's a term start or a survey start."

> "we can skip students."

> "we can show the count of faculty. Instead of the full names."

> "We can also add in the first card. Things like. Total courses evaluated."

> "I don't want to call this as a five step process."

> "Let's start from course readiness. Whatever term details that you have created, let's call that as a separate configuration process to configure a term calendar."

> "wherever you are calling it as send evaluation. Instead of that rename it to setup. Because it's not actually send."

> "we need to hand it over to engineering by end of this week. So by tomorrow end of the day, I will give you feedback only on single server analytics."

> "Imagine these on the top of this screen." (on multi-survey analytics tabs)

> "each tab here will have kpis, will have trend graphs and we'll have deep dive table or a navigation. Three things."

> "These are the five faculties who taught and this is the order of the score. I want to more focus on Dr. Sandra and I click on that view inside and then the entire view opens only for Dr. Sandra."

> "by faculty is the most important."

> "I am currently writing the prd. So this task, the analytics design phase, we will have to both build in parallel."

> "do not share this URL with the agent. Otherwise your agent will create whatever is here."

> "whatever we build on screen should also have a reporting angle to it… that's the final leg of the module."

> "Let's do the entire verbiage review for. Dashboard and templates."

---

## Design tasks generated

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T101 | Dashboard current + last term card updates: remove "Send Evaluation" CTA, add "Total courses evaluated" KPI, rename any remaining "send" language to "Setup Evaluations" | Admin | Dashboard prototype (current term card, last term card) | P1 — DESIGN-REVIEW | D_PCE_0713_01, D_PCE_0713_02, D_PCE_0713_03, D_PCE_0713_09. Apply in Figma/Lovable prototype before Jul 14 call. No matching screen in code yet (dashboard is prototype-only). |
| T102 | Dashboard upcoming card: CTA "Setup Evaluations", date label "term starts", term vs survey date disambiguation, "add missing info" pre-selects courses + instructor | Admin | Dashboard prototype (upcoming card) | P1 — DESIGN-REVIEW | D_PCE_0713_04, D_PCE_0713_05, D_PCE_0713_06. Apply in prototype before Jul 14 call. |
| T103 | Courses table: remove student count column; faculty column shows avatar or count (not full name) | Admin | Dashboard prototype (course list table) | P1 — DESIGN-REVIEW | D_PCE_0713_07, D_PCE_0713_08. Apply in prototype before Jul 14 call. |
| T104 | Setup survey flow: remove "Term Details" as step 1. Start from "Course Readiness". Term details becomes a standalone term calendar configuration. | Admin | Dashboard prototype (setup survey flow) | P1 — DESIGN-REVIEW | D_PCE_0713_10. Structural change to the 5-step prototype flow — needs Romit design direction before touching code. No code equivalent yet. |
| T105 | NEW PAGE NEEDED — multi-survey analytics: 4 top tabs (Overview, by Faculty, by Course, by Term), tabs on top of page (not sidebar), 3-layer structure per tab (KPIs + trend graph + deep-dive table). By-Faculty has leaderboard → faculty detail → single survey result drill. | Admin | `/analytics` (new multi-survey overlay or new route) | P1 — BLOCKED (PRD in progress) | D_PCE_0713_12, D_PCE_0713_13, D_PCE_0713_14. Not due this week. Monil building PRD in parallel — design starts once PRD sections land. Do NOT build until Romit designs it. Do NOT share prototype URL with agent (D_PCE_0713_17). |
| T106 | T100 update — Monil to provide single-survey analytics feedback by Jul 14 EOD. Handoff to engineering by end of week (Jul 18). | Admin | Survey analytics (single-survey, row 16) | P0 — BLOCKED on Monil review | D_PCE_0713_11. Unblocks engineering frontend for row 16. |
| T107 | Analytics layout: remove max-w-4xl from analytics page content container | Admin | `analytics/page.tsx:478` | P0 — ✅ APPLIED Jul 13 | Missed from T98 (Jul 9 layout fix). Removed `max-w-4xl` from content div. Analytics content now uses full screen width. D_PCE_0709_04. |
