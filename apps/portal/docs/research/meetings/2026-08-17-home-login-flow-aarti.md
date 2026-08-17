---
type: meeting
date: 2026-08-17
product: portal
participants: [Romit Soley, Aarti, Arun, Himanshu]
source: granola
granola_id: c9fa0219-7455-4720-81dd-208ec6f8efe0
---

# Home Page Design & Login Flow — Storefront, Spotlight, and Focused Approaches

**Date:** Aug 17, 2026, 7:29 AM EDT  
**Participants:** Romit (designer), Aarti (CPO), Arun, Himanshu

---

## Topics Covered

- Exxat home page information architecture (launchpad → common entity/directory → what's new → catalog)
- Three layout approaches: Storefront, Spotlight, Focused
- Login flow change proposal: username/password → Exxat Home (not individual product)
- Tenant/OU code and program switching UX
- Common Prism layer framing (directory vs. intelligent dashboards)
- What's new section strategy
- Design system tracker + status
- Next meeting agenda (Aug 24)

---

## Decisions

| ID | Decision | Scope | ADR |
|---|---|---|---|
| D1 | Focused approach rejected — removing upsell capability is not acceptable | Portal home | — |
| D2 | All 6 modules visible above fold in two rows; purchased = colored/highlighted with more detail; unpurchased = grayed with "Request Demo" CTA | Portal home | — |
| D3 | "More from Exxat" / upsell catalog must be visible before scroll — not hidden below fold | Portal home | — |
| D4 | Common Prism layer must convey intelligent dashboards + cross-module data insights, not just a directory link list | Portal home | — |
| D5 | Login flow: post-auth lands on Exxat Home (not individual product) | Auth flow | — |
| D6 | Tenant/OU code switching removed from within individual modules — moved to home-level only | All products | — |
| D7 | Program (PT/OT/PA) switching removed from within individual modules — moved to home-level only | All products | — |
| D8 | Jarring "what's new" popup → permanent CX-controlled home page section per release | Portal home | — |
| D9 | Two-column layout: "what's new" + "other modules" both visible before scroll | Portal home | — |
| D10 | Not-subscribed module CTA: "Express Interest" → "Request Demo" | product-card-connector | Applied |
| D11 | Design system tracker needed: component list + sign-off (Romit + technical) + React implementation status | DS process | — |
| D12 | Design system priority: exam and survey apps first | DS work | — |
| D13 | Next meeting Aug 24: (1) DS status presentation, (2) updated home page with confirmed app list from Vinay | Process | — |
| D14 | Designs must be backed by real usage data from live clients, not assumptions | All design | — |

---

## Verbatim Aarti Quotes

> "It becomes like a centralized platform where users can see like what's new or they are able to sort of discover new apps basically to sell cross sell right and becomes like one sort of connected space that is like missing right now."

> "I'm not too thrilled about [the focused approach]. We are taking away our ability to kind of market our modules and products to them."

> "What if all of those modules got... like if your landing screen without any scrolling etc showed me all of the six modules maybe in two rows — this is your modules, these are other modules. Or maybe in the same bucket but the modules that they have purchased are of a different color and the modules that they have not yet purchased are of a different color."

> "Anything that is below the scroll is anyways the likelihood of it being seen or reached is very little."

> "We also take away the ability to make that transition within modules. You have to come back to the launch page if you want to select a different module or a different program."

> "The need day to day basis the need for me to casually swap between different OU codes doesn't exist."

> "That's not doing it justice. So that would be my quick comment on this." [re: common Prism layer shown as just a directory]

> "Today you cannot act as ignorant about the client's real usage as you would have a few years back when you joined. I expect that knowledge and information to be baked into your design recommendation."

> "When you say request demo it's very clear that you don't have this module."

> "Block an hour next Monday — first present the design system details that everyone is asking you to present and then you can present a version of this to get us to align on how the screen needs to look on January 1."

---

## Design Tasks Generated

See `_backlog.md` for full task list from this meeting.

- PORTAL-001: Home layout — 6 modules above fold, two-row grid, purchased vs. unpurchased visual treatment (P0)
- PORTAL-002: Upsell section prominence — above fold or two-column with what's new (P1)
- PORTAL-003: Intelligent Prism layer — replace directory links with cross-module insight panel (P1)
- PORTAL-004: What's new permanent section — CX-controlled per release (P1)
- PORTAL-005: Login flow change — post-auth → Exxat Home (P0, dev + design)
- PORTAL-006: Tenant/program switching at home level — remove from individual modules (P0, dev)
- PORTAL-007: Welcome back + school/discipline selector at home level (P1)
- PORTAL-008: Prepare Aug 24 meeting — DS tracker + updated home design with Vinay's app list (P0, process)
- DS-TRACKER-001: Build DS component tracker (sign-off + React delivery status) (P1)
