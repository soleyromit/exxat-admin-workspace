---
type: meeting
date: 2026-06-09
product: exam-management
participants: [Romit, Arun]
source: granola
granola_id: a4a0e1db-c406-497d-a4c9-27751648f3d1
---

# Design and Product Execution — Prioritizing Speed and Alignment

**Date:** 2026-06-09 · **Time:** 7:32 AM EDT
**Context:** 1:1 between Romit (designer) and Arun (engineering leadership). Alignment on delivery velocity, design system priority, team sync process, and critical path for exam-management and course evaluation products.

## Topics covered

1. Current design status — course evaluation (done, under review), assessment creation (first draft, waiting PM feedback), question bank (done), student experience (minor tweaks)
2. Delivery velocity — projects are "quite significantly delayed" in product spec + design steps; developers need to start building
3. Design system — confirmed as "nice to have, not a blocker" for current sprint
4. Team sync process — Romit should pull Arun in when normal process breaks down (PM ↔ Aarti alignment not happening)
5. Critical path ownership — Romit prioritizes PM-aligned specs over Aarti ad-hoc requests when bandwidth conflicts arise

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_EM_PROCESS01 | **Design system alignment is nice-to-have. Do not let it block delivery.** "You take it as a nice to have ticket for now. I want speed of execution as priority. You can align the design system, great. But if you have to say, you know, because of that, we got delayed that, I will say drop it." — Arun. Process note — no immediate code change. | All | — |
| D_EM_PROCESS02 | **Romit prioritizes what is on the critical path of PM-agreed deliverables.** "Give priority to what is on the critical path of these deliverables. Aarti will be okay with that." — Arun. If Aarti requests work outside the critical path, Romit should flag to Arun rather than silently absorbing it. Process note — no code change. | All | — |
| D_EM_PROCESS03 | **The next party decides when a task is done.** "The thumb rule is the next party decides. Whether the previous task is finished or not, not that party, not the doing party." — Arun. Applied to: PMs decide when product spec is done for design; Romit decides when design is done for engineering; engineers decide when design + spec fully address their needs. Process note. | All | — |
| D_EM_PROCESS04 | **June 10 all-day product meeting with Aarti + PMs to align on product sequence.** "Tomorrow we have a whole day meeting with Aarti... we'll try to make some progress in alignment between PMs and Aarti. Either I or the PMs will update you on that." — Arun. Romit should expect updated scope + task priorities following that meeting. Watch for follow-up. | All | — |

---

## Status updates (not directives — for reference)

- **Course evaluation designs:** done and completed, shared with Monil for review. Monil gave first feedback today (Jun 9). Romit will iterate.
- **Assessment creation:** first draft done (shown to Aarti before she left). Waiting for PM feedback. Romit reviewing against documentation in parallel.
- **Question bank:** done.
- **Base entities:** done, not yet moving — incomplete PRD blocking eng handoff.
- **Student experience:** minor tweaks ongoing.
- **Course evaluation analytics:** no analytics PRD yet — Romit waiting on details.

---

## Verbatim quotes (Arun)

> "It cannot be that, you know, because we are trying to do a good job, we are just not able to do anything at all. The only thing that really counts is the finished product being used by the end user."

> "You take it as a nice to have ticket for now. I want speed of execution as priority. If it becomes a blocker, drop it. Let's just move forward."

> "Give priority to what is on the critical path of these deliverables. Aarti will be okay with that."

> "The thumb rule is the next party decides. Whether the previous task is finished or not, not that party, not the doing party."

> "Wherever you have clarity on, okay, this is needs to be designed — you design. If you feel this is not even agreed, this is too tentative — you pull me in."

> "I want to launch the product. We have a lot of assumptions about it'll happen this way, that way. We we don't know. We will know after our customers start using it really."

---

## Design tasks generated

None — this meeting produced process/alignment guidance, not screen-level directives.
