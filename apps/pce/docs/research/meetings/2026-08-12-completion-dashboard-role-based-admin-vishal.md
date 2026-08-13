---
type: meeting
date: 2026-08-12
product: pce
participants: [Romit Soley, Vishal (PM)]
source: granola
granola_id: 611feaa6-7e53-4ace-a0c6-f9e2ec00586c
---

# PCE — Survey Completion Dashboard and Role-Based Admin Design (Vishal) — 2026-08-12

**Date:** 2026-08-12 2:32 PM EDT
**Participants:** Romit (designer, note creator); Vishal (PM — "Them" in transcript, meeting title confirms). Also references to Monila and another PM.

---

## Topics covered

1. Completion data vs. content data — should be on separate pages for role-based clarity
2. Admin (setup) role during live phase: only worries about collection (completion %, reminders, extend dates)
3. Program director role during live phase: only worries about content/results
4. What actions belong on a live-phase completion dashboard
5. Reminder action: context data needed (% completion + student count)
6. Extend date action: context data needed (current date + "N days to go")
7. Overall rating and performance metrics: NOT for admin completion view
8. AI recommendations for extend date
9. Theme-level distribution visualization for analytics
10. Likert scale: must support different scales per question, not assume uniform scale
11. Program average comparison: use previous offering trend, not delta notation

---

## Decisions

| ID | Decision | Product | Notes |
|---|---|---|---|
| D_PCE_0812C_01 | **Admin completion dashboard: separate page from results/content view.** During the live collection phase, admin role should have a dedicated completion dashboard that shows ONLY collection activities. Content (results, ratings, themes, AI insights) belongs on a separate page. "I would really keep collection data out of content data." "So in alignment with the roles we want to separate these two pages out. We want to give them separate landing pages." | pce | T172 |
| D_PCE_0812C_02 | **Admin completion view must NOT show performance or overall rating.** Performance metrics and overall rating scores belong in the results/content view and should not appear on the admin's live-phase completion dashboard. Vishal: "Performance will take away okay and everything overall rating makes everything." Admin role = administer the survey, not review content. | pce | T174 |
| D_PCE_0812C_03 | **Completion dashboard admin actions: send reminders + extend dates + preview form only.** Admin during live phase has exactly three relevant action types: (1) Send reminders to non-completers; (2) Extend close date; (3) Preview the survey form. No results content visible. Vishal: "Preview, extend dates, view completion, send reminders. These are all administrative activities on the survey that will be done by a different person like a secretary or an assistant." | pce | T172 (supplements) |
| D_PCE_0812C_04 | **Reminder action: display % completion + student count contextually beside button.** When admin sees the "Send Reminder" button, adjacent context must show: percentage completion and count of non-completing students. This is the decision-making data for that action. "Send reminder should have percentage completion and count of students next to it because it helps me to make my decision." | pce | T175 |
| D_PCE_0812C_05 | **Extend date action: display current close date + "closes in N days" countdown contextually.** When admin sees the "Extend Date" button/control, adjacent context must show: current close date and relative countdown ("3 days to go", "5 days to go", etc.). "The extend date should have the current start date end date next to it with some calculation that says three days to go five days to go 10 days to go whatever so that it's a decision." | pce | T176 |
| D_PCE_0812C_06 | **Admin cannot see content during live collection phase.** "When the survey is live, what do you care about... I am not going to spend that much time looking at response data and analyzing that and making your decisions until I'm like this is complete." Results and content should not be shown until admin releases them. Admin needs to focus only on driving completion. | pce | T172 (supplements) |
| D_PCE_0812C_07 | **"View Results" is permanently accessible but separate.** Admin can always access results via a chart icon or dashboard widget click, but results should NOT be integrated into the completion dashboard. "I would just put the chat icon there or a dashboard icon next to percentage completion and let them do all of that." Results review is its own task, not mixed with completion monitoring. | pce | T172 (supplements) |
| D_PCE_0812C_08 | **Program average comparison: use "above/below average" label, not delta notation.** When comparing a course's avg rating to program average, DO NOT show "0.15 versus program" as a delta number. Use text label: "This course is above program average" or "below program average." Delta notation (like +0.15) is conventionally read as a trend vs. prior period, not vs. a separate benchmark. Vishal: "I've never seen it display like that. Because these are two different numbers you're showing the comparison of the two numbers the way I've seen that 0.15 shown with a small arrow up or down is with context to the previous time this course was." | pce | T177 |
| D_PCE_0812C_09 | **Trend arrow: compare to previous offering, not program average.** The trend indicator (arrow up/down with delta) must compare this offering to the same course's previous offering. "Compared to previous is the best example." Program average comparison stays as a label, not a delta number. | pce | T177 (supplements) |
| D_PCE_0812C_10 | **Likert scale: must support different scales per question group.** Not all questions in a survey will use the same Likert scale (3/4/5/7/10). Different question groups may use different scales. The design must group questions by scale for visualization. "You have to account for the fact that the scale could be different... you will only group questions that are of the same like scale. If there is a different like at scale you will make a different grouping for it." | pce | T178 |

---

## Verbatim quotes

> **Vishal:** "I would really keep collection data out of content data. You've created a separate widget. I'm just saying if three things are going to have three different percentages, three different rates, three different things. I'll just put all collection data in one and done and then keep the reminder action here as well."

> **Vishal:** "Yes make it your collection dashboard. So it's your like completion dashboard. It can show them the students have completed, which students have not completed. You can give counts of completion counts like you can show percentage."

> **Vishal:** "Performance will take away okay and everything overall rating makes everything you have to think about an admin role can only administer the surface and nothing else."

> **Vishal:** "Preview extend dates view completion like send reminders. These are all administrative activities on the survey that will be done by a different person like a secretary or an assistant."

> **Vishal:** "Send reminder should have percentage completion and count of students next to it because it helps me to make my decision."

> **Vishal:** "The extend date should have the current start date end date next to it with some calculation that says three days to go five days to go 10 days to go whatever so that it's a decision."

> **Vishal:** "I've never seen it display like that. Because these are two different numbers you're showing the comparison of the two numbers the way I've seen that 0.15 shown with a small arrow up or down is with context to the previous time this course was."

> **Vishal:** "You have to account for the fact that the scale could be different. I don't think you can assume that the entire form has [the same scale]."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0812C_01: Separate completion dashboard | `surveys/[id]/page.tsx` shows completion (response gauge) + content (AI insights + responses) on same page. | Gap — structural rearchitecture. NEW PAGE NEEDED. T172 added. |
| D_PCE_0812C_02: No performance/overall rating in completion view | No "performance" or "overall rating" metric in current admin survey detail page. | No change needed currently (not built). T174 added to prevent it from being added. |
| D_PCE_0812C_04: Reminder action contextual data | `surveys/page.tsx:291–294` shows "Send Reminder" in row actions dropdown with no contextual data beside it. | Gap. T175 added. |
| D_PCE_0812C_05: Extend date contextual data | No extend date action in current production code. | Gap. T176 added. |
| D_PCE_0812C_08: Program average comparison label | Not in production code (analytics not built). | Design direction for T116/T117 analytics work. T177 added. |
| D_PCE_0812C_10: Multi-scale Likert grouping | Not in production code. | Design/engineering requirement for analytics. T178 added. |

**Pass 5 verdict:** No immediate production code changes required. All directives apply to new pages or analytics features not yet in production.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T172 | NEW PAGE NEEDED — Admin completion dashboard: dedicated live-phase page (collection activities only, no content) | P1 — DESIGN-REVIEW | Three admin actions: send reminders, extend dates, preview form. No results/content visible. Separate from results/content page. D_PCE_0812C_01, D_PCE_0812C_03, D_PCE_0812C_06, D_PCE_0812C_07. |
| T174 | Admin completion view: exclude performance and overall rating metrics | P1 — design guard | Do not add performance or overall rating to admin's live-phase view. These belong in results/content view only. D_PCE_0812C_02. |
| T175 | Reminder action: show % completion + student count contextually beside button | P1 — DESIGN-REVIEW | Context data for decision-making shown inline adjacent to the send reminder control. D_PCE_0812C_04. |
| T176 | Extend date action: show current close date + "closes in N days" countdown contextually | P1 — DESIGN-REVIEW | Context data for decision-making shown inline adjacent to the extend date control. D_PCE_0812C_05. |
| T177 | Analytics: program average comparison = text label, not delta notation; trend = vs. previous offering | P1 — DESIGN-REVIEW | "Above program average" / "below program average" label only. Trend arrow (+ delta number) = vs. same course's previous offering. D_PCE_0812C_08, D_PCE_0812C_09. |
| T178 | Analytics: group questions by Likert scale; create separate visualizations per scale type | P1 — DESIGN-REVIEW | Different questions may use 3/4/5/7/10-point scales. Cannot aggregate across different scales. Group by scale first, then visualize. D_PCE_0812C_10. |
