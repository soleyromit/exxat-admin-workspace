---
date: 2026-08-17
granola_id: c9fa0219
participants: [Aarti, Romit]
product: portal
scope: home-page
---

# Home Page + Login Flow — Aarti Design Review, Aug 17, 2026

**Granola:** `c9fa0219` | **Product:** Portal (home page) | **Note:** Cross-product — filed in PCE docs as source of record; implementation targets portal product

---

## Meeting context

Aarti reviewed three home page design approaches (storefront, spotlight, focused) for the Exxat admin platform home. Feedback on module grid structure, Prism's product positioning, OU code switching, and a call to use real usage data. Next check-in: Aug 24, with DS status tracker + evolved design for Jan 2027 visualization.

---

## Directives

### D_PORTAL_0817_01 — Module grid: all modules above fold; purchased highlighted, unpurchased grayed + "Request demo"

The home page module grid must show ALL modules above the fold. Purchased/active modules are displayed at full color/weight. Unpurchased/inactive modules are grayed out and include a "Request demo" CTA.

> "All modules visible above the fold. Purchased ones highlighted, unpurchased grayed out with a request demo CTA."

**Backlog:** T185 | **Priority:** P1 — DESIGN-REVIEW (portal product)

---

### D_PORTAL_0817_02 — OU code switching: simplify or remove (Aarti feedback)

Per-module OU (Organizational Unit) code switching is not a common use case. Aarti's feedback: evaluate whether it is needed at all at the module level; if not, remove it or simplify significantly.

> "OU code switching is not a common use case — simplify or remove it."

**Backlog:** T186 | **Priority:** P1 — needs engineering alignment before remove vs. simplify decision

---

### D_PORTAL_0817_03 — Prism framing: intelligent dashboards layer, not just a directory

In the home page design, Prism must be framed as an intelligent dashboards product, not merely as a directory or contact list. The "common part of Prism" refers to dashboards and insights that surface across the product.

> "The common part of Prism is more than a directory — it needs to have intelligent dashboards."

**Backlog:** T187 | **Priority:** P1 — DESIGN-REVIEW (portal product, Romit + Aarti alignment)

---

## Process / next steps

- **Next meeting:** Aug 24, 2026
- **Deliverable for Aug 24:** DS status tracker + evolved home design for a Jan 2027 visualization
- **Data requirement:** Use real product usage data to back design decisions (usage data source TBD)

---

## Design approaches reviewed

Three approaches were presented:

| Approach | Description | Aarti feedback |
|---|---|---|
| Storefront | All modules as product cards; marketplace-style | Closest to direction; grid above fold confirmed |
| Spotlight | One featured module prominently, others secondary | Too hierarchical; some modules would feel deprioritized |
| Focused | Minimal chrome; one task surface at a time | Too narrow for a platform home that serves multiple products |

**Direction:** Evolved storefront approach with module grid always above fold, purchased vs. unpurchased distinction, and Prism framed as dashboards.
