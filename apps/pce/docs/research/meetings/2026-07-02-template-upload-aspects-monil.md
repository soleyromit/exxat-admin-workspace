---
type: meeting
date: 2026-07-02
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 3c5d6795-f1af-4ae3-81b8-1c9388c44ada
---

# Create template — upload capability and handoff readiness with Monil — 2026-07-02

> Short check-in (~10 min). Monil had 5 minutes before another call. Focus: aspect-level upload
> capability request + handoff readiness gate for Create Template + Create Survey.

## Topics covered

- Aspect-level upload capability (new directive — conflicts with T61)
- Handoff readiness gate for engineering

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0702_01 | Monil wants upload capability at the **individual aspect level** (course material, faculty, general). Rationale: a single top-level document import asks AI to parse all aspects + sections + questions from one doc — AI cannot reliably separate content by aspect. Proposal: let admin upload a separate document per aspect so AI can process each aspect independently. | pce | CONFLICTS with T61 (Jun 9 Vishaka directive: remove per-section PDF upload, top-level only). Needs resolution with Aarti/Vishaka before building. |
| D_PCE_0702_02 | Handoff gate: Monil wants to close both Create Template AND Create Survey before handing to engineering. Romit needs one final review from Monil before signing off. Not yet in handoff-ready state. | pce | T28, T89 |

## Verbatim quotes

> "I want an upload document capability at aspect level. Right now if I'm evaluating three aspects — course material, faculty, and general — and within the faculty I'm evaluating course coordinator and then instructor. AI will not be able to catch all the aspects and then sections and questions; it is difficult to do that. So instead of doing that my proposal was to give upload capability for individual aspects." — Monil

> "Let's try to close create template and create survey. You tell me if we are in a position to hand it over to engineering or not." — Monil

> "I just need one final review from you. Before I can say that, because I feel like there are some feedback that I'm receiving and it might confuse the whole layout." — Romit

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T97 | ⚠️ Resolve T61 vs. Monil Jul 2 conflict — per-aspect upload | P0 — BLOCKER for T60/T89 | T61 (Jun 9, Vishaka): top-level import only, remove per-section upload. Monil (Jul 2): per-aspect upload IS wanted because single-doc AI parsing fails. Cannot proceed with upload UX until Aarti/Vishaka/Monil align. Add to next Aarti review. D_PCE_0702_01. |
