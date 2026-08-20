---
type: meeting
date: 2026-08-19
product: pce
participants: [Romit Soley, Vishal]
source: granola
granola_id: 7a175890-a1be-4d20-b276-afb527744b54
---

# Course evaluation dashboard — term states, card cases, and layout structure with Vishal — Aug 19, 2026

Vishal + Romit design session (9:29 AM EDT). Deep-dive on dashboard architecture: five term states, column order, past/future card spec, card case inventory, and per-status metric + action mapping. Pre-demo context: showing prototypes to the internal team before Cohere preparation.

---

## Topics covered

- Five term states and their definitions
- Column order for the 3-column primary view
- Past terms: always-visible table vs. "show more" toggle
- Future term card: simplified data model
- Card case inventory (cases 1–8)
- Per-status metrics and inline actions
- Common vs. complex cases
- Evaluation coverage formula

---

## Decisions

| ID | Decision | Product | Surface |
|---|---|---|---|
| D_PCE_0819A_01 | **Five term states**: current, upcoming, last, past, future. Definition: last = previous term; past = all terms before last; future = all terms after upcoming. Primary display = current + last + upcoming only. | pce | Evaluation dashboard |
| D_PCE_0819A_02 | **3-column order: last → current → upcoming** (time sequence, left to right). Vishal: "Last should be the first card. Current should be the second card. Upcoming should be the last card." ⚠️ CONFLICTS T203 (Aarti Aug 17: Current → Upcoming → Last). Needs alignment before any code. | pce | Evaluation dashboard term cards |
| D_PCE_0819A_03 | **Past terms visible by default as a table** below the 3 columns — no "show more" toggle. Rationale: analytics for past terms is the next action admins take. Vishal: "I'll not even have this view show more, right? So by default, I'll be showing this information too." | pce | Evaluation dashboard — past terms section |
| D_PCE_0819A_04 | **Past term table fields**: academic year, start + end dates, course offerings count, evaluation coverage (% as primary + "N of M" count as subtext), average response rate, program average + course average + faculty average. Actions: view analytics, view survey. | pce | Evaluation dashboard — past term table |
| D_PCE_0819A_05 | **Evaluation coverage formula**: (scheduled + live + closed + published) / total courses. Primary display = percentage; subtext = "5 out of 20." | pce | Evaluation dashboard — coverage metric |
| D_PCE_0819A_06 | **Future term cards**: simplified — only 3 data points (academic year, start/end date, course offerings). Single action: schedule survey. No analytics. | pce | Evaluation dashboard — future term cards |
| D_PCE_0819A_07 | **Status breakdown in term cards**: explicitly show live + scheduled counts. The simple "8 live, 2 in review, 13 total" pattern is insufficient — expand to show live and scheduled individually. Vishal: "We need to show that. Scheduled, we need to show. Live we need to show. And probably remaining." | pce | Evaluation dashboard term cards |
| D_PCE_0819A_08 | **Common cases** = all courses scheduled or above, all courses live or above, all courses closed or above. Design should be optimized for these, not for the complex mixed-status case (case 4). | pce | Evaluation dashboard term cards |
| D_PCE_0819A_09 | **Complex case inline actions**: scheduled = update (primary) + delete (secondary), with message "N evaluations going out in N days" (next-nearest date). Live = show avg response rate + "closing in N days" message + actions: reminder (primary) + extend. | pce | Evaluation dashboard term cards |
| D_PCE_0819A_10 | **Published/closed term card**: surface analytics metrics inline — program average, course average, faculty average + response rate coverage. Primary action: view analytics. | pce | Evaluation dashboard term cards |
| D_PCE_0819A_11 | **Not a true Kanban** — cards are system-determined, not user-movable. Kanban UI would imply drag-to-move; this is a read-only state column layout. | pce | Evaluation dashboard |

---

## ⚠️ Conflicts to resolve

| Conflict | T203 (Aarti Aug 17) | Vishal (Aug 19) | Status |
|---|---|---|---|
| Term card column order | Current → Upcoming → Last | Last → Current → Upcoming | UNRESOLVED — needs Romit + Vishal + Aarti alignment |

Do NOT touch any dashboard code with a left-to-right column order until this is resolved.

---

## Verbatim Vishal quotes

- "Last should be the first card. Current should be the second card. Upcoming should be the last card. So that way we are not only focusing on scheduling a survey, we are also focusing on look the last term evaluation is over. These are the reports. You can click here and view the reports."
- "I'll not even have this view show more, right? So by default, I'll be showing this information too. If you ask me why, it's because we have analytics for the past terms. Right. So the next action which a user can take is view analytics and take decisions."
- "I would actually flip evaluations from count to the coverage. So once a course evaluation for a particular term is done, what is important? I need to know how much of the of how much I was able to cover."
- "We need to show. Scheduled, we need to show. Live we need to show. And probably remaining."
- "We don't need to optimize our solution for these common cases — a solution should be optimized for the common cases."
- "It's not a true Kanban actually. So a true Kanban will have a lot more space in between. So we don't need all of that. You can actually, if we build a true Kanban, what happens is users will feel that they can move a course, a term card from one to another. But it is system determined."

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T209: 5-state term model + column-order alignment | P0 — ALIGNMENT NEEDED | D_PCE_0819A_01, D_PCE_0819A_02. Conflicts T203. Align before any dashboard code. |
| T210: Past terms table always visible below 3 columns | P1 — DESIGN-REVIEW | D_PCE_0819A_03. No "show more." BUT see T216 (Meeting 2 same day) — contradictory feedback. |
| T211: Past term table fields spec | P1 — DESIGN-REVIEW | D_PCE_0819A_04. Fields: academic year, dates, offerings, coverage (%+count), response rate avg, program/course/faculty avg. |
| T212: Future term card spec | P1 — DESIGN-REVIEW | D_PCE_0819A_06. 3 data points + schedule action only. |
| T213: Evaluation coverage formula | P1 — applies at T210/T211 implementation | D_PCE_0819A_05. (scheduled+live+closed+published)/total. |
| T214: Term card status breakdown — live + scheduled explicit | P1 — DESIGN-REVIEW | D_PCE_0819A_07. |
| T215: Complex case inline actions per status | P1 — DESIGN-REVIEW | D_PCE_0819A_09. Scheduled = update primary/delete secondary. Live = reminder+extend+response rate+closing date. |
