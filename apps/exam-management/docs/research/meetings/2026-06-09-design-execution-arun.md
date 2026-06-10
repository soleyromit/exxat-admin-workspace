---
type: meeting
date: 2026-06-09
product: exam-management
participants: [Romit Soley, Arun]
source: granola
granola_id: a4a0e1db-c406-497d-a4c9-27751648f3d1
---

# Design and product execution — prioritizing speed and alignment with Arun — 2026-06-09

> Covers both exam-management AND pce. Filed under exam-management; process decisions apply to both products.

## Topics covered

- Project delays on exam management and course evaluation (designs done, stuck in approval cycles)
- Root cause: conflicting priorities between Aarti and PM requests; unclear role boundaries
- New operating framework: critical path first, PMs own UX decisions, Romit fills visual + UX gaps
- Design system priority de-escalation
- Role boundaries and escalation protocol

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_PROC01 | Critical path prioritization is mandatory. Focus exclusively on features needed for immediate product delivery. Aarti aligned on this. | cross-product |
| D_PROC02 | Aarti aligned on letting PMs drive immediate priorities. Romit escalates conflicts (when Aarti and PMs are misaligned) to Arun, not directly back to Aarti. | cross-product |
| D_PROC03 | Role boundary: PMs own UX/functionality decisions (with Aarti approval). Romit owns visual design and fills in UX elements PMs and Aarti miss. Not overlapping work. | cross-product |
| D_PROC04 | All requests from Aarti must flow through PMs first before reaching Romit. If Aarti gives Romit a direct request that conflicts with PM priorities, Romit surfaces the conflict: "Aarti, Arun told me to focus on what PMs are doing. What should I do?" | cross-product |
| D_PROC05 | Design system deprioritized temporarily. Speed of execution takes precedence. If DS alignment would block a delivery, drop it and move forward. Return to DS consistency once delivery machine is running. | cross-product |
| D_PROC06 | "Management by exception" model: Romit operates normally within PM direction. Only pulls Arun in when the normal process breaks down (any stakeholder, any direction). | cross-product |
| D_PROC07 | "Done" is defined by the NEXT party in the chain, not the producing party. Design is done when the developer says they understand what to build. Spec is done when Romit says they understand what to design. | cross-product |
| D_PROC08 | Course evaluation designs (12–16 screens) were completed; feedback received today. Romit iterates and targets engineering handoff for create-template and create-survey flows. | pce |
| D_PROC09 | Assessment creation design: first draft completed; awaiting PM feedback. Romit will review design against documentation nuances. Monel's call scheduled. | exam-management |

## Verbatim quotes

> "For now, I want speed of execution as a priority. You can align the design system, great. But if you have to say, you know, because of that, we got delayed — drop it. Let's just move forward." — Arun

> "There is a critical path for the product delivery... It is always this critical path that must take precedence over anything else. And Aarti is also fundamentally aligned with this." — Arun

> "The only thing that really counts is the finished product being used by the end user. Unless that happens, all the effort put by all the people is basically almost a waste." — Arun

> "The 'done' is determined by next person in chain, not task owner. The PMs cannot say design is done. Only you can say that." — Arun

> "I have literally, like, stack of papers right here. It says that when I'm back, in one month, I want to see these screens." — Romit (relaying Aarti giving out-of-scope requests)

> "Next time, if she gives you a request, you say: 'Aarti, Arun is telling me to work on what the PMs are doing. You're giving me this. What should I do?' You should tell her." — Arun

## Design tasks generated

None — this is a process alignment meeting. No screen changes. Follow PROC01–PROC09 in day-to-day operations.
