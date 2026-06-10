---
type: meeting
date: 2026-06-09
product: exam-management
participants: [Romit Soley, Mohit]
source: granola
granola_id: 70d6511f-8172-4093-8c45-e45d04ae7929
---

# Exam Management Sync up — 2026-06-09

## Topics covered

- Assessment creation design walkthrough (8-part flow + AI concept)
- Base entity scope clarification: current-state only vs. future-state mockups
- Arthi + Kurat design review feedback
- Priority order for Romit this week
- HTML file delivery plan (URL migration issues)

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_EM_M01 | Base entity mockups scope = current information availability ONLY. No performance data, accommodations, interventions. These are introduced per feature build, not in the base entity landing pages. | exam-management |
| D_EM_M02 | Assessment creation entry point = from a course offering. NOT from the left-side "Assessment" menu item. Entry point was incorrectly demoed from left-nav; Mohit confirmed course is the true entry. | exam-management |
| D_EM_M03 | Assessment creation flow = 8 core parts. Expands to 10–12 parts when analytics are added (future). Design scope for now = 8 parts. | exam-management |
| D_EM_M04 | Arthi + Kurat review was brief (5–10 min). Only feedback: "questions should be visually emphasized more." Not a detailed review — Mohit will review HTML and give per-section comments on all 8 parts. | exam-management |
| D_EM_M05 | Migration to design URL has issues. Share assessment creation as an HTML file instead. Mohit accepts the HTML temporarily. Romit can continue work on Monel's task after delivering HTML. | exam-management |

## Verbatim quotes

> "But my document is strictly limited to what we will have, the information we'll have. We are building course offering landing page. Performance will come later. We will introduce that information as in the respective entities or sub entities. Whenever we build that particular feature." — Mohit

> "They just said that, like, oh, like, know, when I'm here, I feel like the question should be emphasized a bit more. So it was this was, like, hardly, I would say, five to ten minutes like, of review that happened, it wasn't, a detailed review." — Romit (relaying Arthi/Kurat feedback)

> "So try to send me this HTML today. For each component, and then I'm around eight parts of this whole flow. Like, other than the extra things, like, if we add a few extra things that you put like, the analytics, then becomes, like, 10 or 12. So we'll focus give you comments for each part. We'll focus part by part." — Mohit

## Design tasks generated

- T96 (exam-management): Revise base entity mockups — remove future-state data (performance metrics, accommodations, interventions). Scope strictly to current information availability. Deadline: Thursday (2026-06-12). DESIGN-REVIEW — Mohit to provide per-section comments on HTML.
