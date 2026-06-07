---
type: meeting
date: 2026-06-06
product: exam-management
participants: [Romit Soley, Kunal (Eng), Aarti]
source: granola
granola_id: 7729d58c-cd51-49dd-b40d-5ab300286767
---

# Question bank design — filters, AI generation, and answer rationale

## Topics covered

- QB layout: resizable vertical panel between folder sidebar and question list
- Prism-consistent filter pattern for the QB table
- "Not Assigned" virtual folder for questions with no folder association
- Admin filter to find courses with zero QB questions attached
- Question performance panel: usage count + last used date (already built in Sheet)
- Version history in question Sheet: per-version course + avg score (already built)
- Question editor: answer rationale field label and tooltips for complex fields
- AI question generation — scope and design philosophy confirmation
- Assessment builder: section identifier visibility while scrolling
- Readability and contrast feedback on QB and assessment builder screens

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_QB01 | Resizable vertical divider between QB folder sidebar and question list | exam-management |
| D_QB02 | "Not Assigned" virtual filter in QB left sidebar for unassigned questions | exam-management |
| D_QB03 | Admin filter to show courses with zero QB questions | exam-management |
| D_QB04 | AI features must stay in UI designs regardless of engineering timeline | exam-management |
| D_QB05 | QB filter pattern must match Prism filter pattern exactly for consistency | exam-management |
| D_QB06 | Question title in QB table rows must use font-semibold for readability | exam-management |
| D_QB07 | Section identifier must always be visible while scrolling in assessment builder | exam-management |

## Verbatim quotes

> "You should be able to drag that vertical line." — Aarti

> "Show me all of the courses which have zero questions tagged to them." — Aarti

> "Your UI UX should be the end state. Whether Vishal and team pick it up and when do they introduce it and stuff like that is a different question." — Aarti

> "The overall screens are looking a lot more prettier on these Figmas than on the current Prism products." — Aarti

> "When all these tiles are together, like, cards are together, maybe it's a little harder to read and differentiate. So maybe we want to put the question in bold." — Aarti

> "When I'm scrolling the which section am I at? I don't know." — Aarti

> "Some color contrast issues are there. So all of those things, I'll take care of it, Adi. No worries about that." — Romit (in response to Aarti's contrast concerns)

> "So basically, what you should do is same thing as we provide in Prism. Change the layout of the page. Drag up or drag down. Export out what is on this page. Then to filter for an icon. Theme button to consist screen... And you want to closely ensure if you are coming into exam management, they don't have to relearn how to do filtering." — Kunal + Romit

## Design tasks generated

| Task | Type |
|---|---|
| T91 — QB resizable sidebar divider | DESIGN-REVIEW |
| T92 — QB "Not Assigned" virtual folder | Confirm with Kunal on design pattern once implemented |
| T93 — Course list: filter for courses with zero QB questions | DESIGN-REVIEW |
| T94 — Assessment builder: section sticky header during scroll | DESIGN-REVIEW |
| T95 — QB question title font-semibold | ✅ APPLIED (`qb-table.tsx`) |
