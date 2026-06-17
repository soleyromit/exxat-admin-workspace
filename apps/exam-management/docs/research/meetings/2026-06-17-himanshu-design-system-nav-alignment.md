---
type: meeting
date: 2026-06-17
product: exam-management
participants: [Romit Soley, Himanshu]
source: granola
granola_id: 1f55db0d-71bf-46a5-b35d-84880a5be41d
---

# Design system and nav alignment — Himanshu — 2026-06-17

> Covers both exam-management AND pce. Filed under exam-management; nav and DS decisions apply to both products. Coordination call between Romit and Himanshu (Engineering). Romit walking Himanshu through concerns and design concepts.

## Topics covered

- Ask Leo placement: left sidebar vs. top-right (CONFLICT with Aarti directive)
- Prism + new module coexistence — Aarti's concerns about visual continuity
- Design system migration approach: new products first, then existing Prism modules
- Module entry point concept (Romit's app-store-style concept shown to Himanshu for first time)
- Student exam experience: keyboard navigation, accessibility features, new component needs
- Product naming + brand colors: who owns this decision
- Component list visibility in design system (tooling issue)
- Next step: Himanshu to talk to Arun + Yash and approach Aarti on nav alignment

## Decisions

| ID | Decision | Product |
|---|---|---|
| D_EM_HIM01 | Ask Leo is in the LEFT SIDEBAR (final Himanshu engineering decision). Moved from top-right because in 400–500 person Zoom sessions it was creating layout problems. "What was happening is when you go into 400, 500 person Zoom. It was creating problem. So that's why I moved it into sidebar. So that it is always present." | cross-product |
| D_EM_HIM02 | ⚠️ UNRESOLVED CONFLICT: Aarti said Ask Leo should NOT be in left nav (D_PCE42, T57, Jun 3). Himanshu has it in left sidebar. Romit raised the conflict. Himanshu's response: "I'll talk to Arun and Yash and we can go together and talk to Adi." No screen changes until resolved. BLOCKS nav design for both exam-management and PCE. | cross-product |
| D_EM_HIM03 | Top bar in new design system: actions in Prism top bar are utility/tertiary only. Primary actions (Ask Leo, global search) moving to sidebar. Himanshu: "The only primary act that I could see is Ask Leo. And your search, like a global search. Otherwise, users don't really interact much on the top." No immediate top-bar change to existing Prism modules. | cross-product |
| D_EM_HIM04 | Design system migration strategy confirmed: apply new DS to new products first (exam management, PCE, etc.), then gradually roll into existing Prism modules. Himanshu: "give whatever new work products are there, at least we can start using this system. Slowly slowly translate existing products to the new experience." | cross-product |
| D_EM_HIM05 | Module entry point concept (Romit's design) shared with Himanshu for the first time. Contracted products visible as a product list (app-store model). Non-contracted → CTA to email sales team. Himanshu to review with team and align with Aarti. Not finalized. | cross-product |
| D_EM_HIM06 | Product naming + brand colors → Himanshu's team + marketing to decide. Not Romit's domain. Himanshu built onboarding in DS with a registry: product name entered → template handles long names by hiding "Exact" prefix. Marketing team should provide naming guidelines. | cross-product |
| D_EM_HIM07 | Student exam experience requires design system to adapt. Custom components needed: keyboard-navigable answer selection, text highlight, text strikethrough/elimination, bookmarks, hotspot questions, accessibility settings (color vision, 400% text size, dark contrast, on-screen keyboard), PDF viewer with zoom, audio/video. Himanshu: "Not immediately, but I'll try to prioritize it." | exam-management |
| D_EM_HIM08 | Renee to help QA component implementation gaps between design system and what's rendered. Himanshu to talk to Renee. | cross-product |
| D_EM_HIM09 | Component list visibility issue in design system (Romit cannot see list of all components — only product-specific layouts now). Himanshu to investigate. Tooling/DS issue, not a screen change. | cross-product |

## Verbatim Himanshu quotes

> "What was happening is when you go into 400, 500 person Zoom. It was creating problem. So that's why I moved it into sidebar. So that it is always present."

> "The top header that we have in prison right now — the actions which are there on the top, they are tertiary. Not even tertiary. Like, a utility."

> "The whole idea was give whatever new work products are there, at least we can start using this system. Slowly slowly translate existing products to the new experience."

> "I'll talk to Arun and and Yash and and, like, we can go together. And talk to Adi. If we want to go ahead and implement this."

> "I hope you I mean, we start using it as intended. Then only we'll see some impact. Otherwise, it's just one other library."

> "I'll I'll talk to Renee also. Renee can help us out here."

## Design tasks generated

- T99 (cross-product): ⚠️ Ask Leo placement conflict escalation. Aarti (Jun 3): NOT in left nav. Himanshu (Jun 17): IN left sidebar. Himanshu to coordinate with Arun + Yash + Aarti. BLOCKING nav design for both products. Do NOT change sidebar code until resolved. D_EM_HIM01, D_EM_HIM02.
- T100 (exam-management): Student exam experience DS adaptation. Design system needs new/adapted components: keyboard answer selection, text highlight/strikethrough, hotspot, accessibility panel (color vision, 400%, dark contrast, on-screen keyboard), PDF viewer. Track with Himanshu. D_EM_HIM07. NEW PAGE / COMPONENT NEEDED — DESIGN-REVIEW.
- T101 (cross-product): Module entry point concept — share link with Himanshu; Himanshu to review with team and align with Aarti before finalizing. D_EM_HIM05. Not a screen change.
