---
type: meeting
date: 2026-06-29
product: pce
participants: [Romit Soley, Monel, Vishal]
source: granola
granola_id: 253f8e5f-b918-45c0-9e4f-09a444890628
---

# Course evaluation design — template, survey, and navigation structure — 2026-06-29

> Engineering handoff alignment. Vishal (product/engineering lead) + Monel + Romit. Engineering (Vinay's team) starts building front end of create template as early as next week. Romit must finalize designs first. Focus is on pushing to engineering, not preparing Aarti review.

## Topics covered

- Left nav structure for course evaluation
- Priority order: create template → create survey → settings
- Engineering grooming has begun; designs must be production-ready
- Romit's status: ~50% of Thursday feedback incorporated, still in progress
- "Dashboard" label under course evaluation was flagged as wrong

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_629_01 | Left nav: "nail down the structure." Course evaluation section must be expanded by default. Sub-items: Templates, Setup (Setup at bottom). "Analytics" should NOT be the primary entry from the course eval nav — it's a secondary surface. | pce | T80 |
| D_PCE_629_02 | "Dashboard" is the wrong label for the main course eval landing. The landing is NOT an analytics dashboard. It should be the operational/term view — survey list + term cards. Rename or revisit the label. | pce | T46 |
| D_PCE_629_03 | Designs must be production-ready for engineering handoff, not just "good enough for Aarti review." Think: "If we handed this to a developer tomorrow, could they build it in production?" | pce | — |
| D_PCE_629_04 | Scope cap: design only up to the "yellow line" (rows up to ~41 in the tracker). Analytics is deferred. Priority order: create template → create survey → settings. | pce | T33, T80 |
| D_PCE_629_05 | More frequent design review cadence between Romit + Monel. Next sync: tomorrow 7PM IST (Jun 30). | pce | — |

## Verbatim quotes

> "If there is one thing which you need to nail down, nail down the structure, the left nav structure." — Vishal

> "Right now, course evaluation needs to be expanded. Right? So what is the primary entity? Right? So and then we are calling dashboard. Right? So but is this dashboard or is it something else? It should not be showing analytics here. Right? So templates. Then we have setup." — Vishal

> "Think of your output [as] if we hand it over to one of the developers tomorrow. Are we confident to tell them that go build it in production?" — Vishal

> "We don't have to prepare for Wednesday's call. We have to actually prepare ourselves to hand it over to engineering. Because that will move the needle." — Vishal

> "Focus on course evaluations. Complete as much as you can till the yellow line this week." — Vishal

## Design tasks generated

See `_backlog.md` entries T91 (left nav expanded, P0 URGENT) and D_PCE_629_02 (dashboard label wrong).
