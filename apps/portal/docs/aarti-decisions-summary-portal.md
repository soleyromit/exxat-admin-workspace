# Aarti Decisions Summary — Workspace Portal

> Living document. Consolidates stakeholder decisions for the Exxat Portal (home page, login flow, cross-product navigation, module launcher).
>
> **Source meetings:** see `docs/research/meetings/`

**Maintainer:** Romit Soley (Designer II)  
**Last revision:** 2026-08-17

---

## 1. North Star

**Transform the current per-product login into a unified Exxat Home — a centralized platform that serves as the launchpad for all modules, a cross-sell channel, and a place for users to discover the full Exxat product suite.**

> "It becomes like a centralized platform where users can see like what's new or they are able to sort of discover new apps basically to sell cross sell right and becomes like one sort of connected space that is like missing right now." — Aarti, 2026-08-17

---

## 2. Strategic anchors

| Anchor | Detail | Source |
|---|---|---|
| **Modular sellability** | Each product independently sellable; Exxat Home is the launch surface. Stated in exam-management summary and reaffirmed here. | 2026-05-08, 2026-08-17 |
| **No below-fold hiding** | Any content (catalog, upsell, module grid) that goes below the fold is effectively invisible. Design must keep purchase CTA above fold. | 2026-08-17 |
| **Intelligence over directory** | The common Prism layer is cross-module dashboards + data intelligence, not a simple navigation link list. | 2026-08-17 |
| **Real usage data in designs** | As of 2026, real client usage data exists. Designs must be informed by it, not assumptions. | 2026-08-17 |
| **Focused approach rejected** | Showing only subscribed modules with no upsell is not acceptable — removes cross-sell capability. | 2026-08-17 |

---

## 3. Portal IA (current working model, Aug 2026)

```
Exxat Home
├── Module grid (all 6 modules, above fold)
│   ├── Purchased: highlighted/colored, more info, Open Admin
│   └── Unpurchased: grayed, "Request Demo" CTA
├── What's New (CX-controlled per release)
├── Catalog / More from Exxat (above fold or two-column with What's New)
└── Common Prism layer (intelligent dashboards, cross-module data)
```

**Login flow:** username → password → Exxat Home (not individual product)

---

## 4. Module display rules

| State | Visual | CTA |
|---|---|---|
| Active (subscribed) | Colored gradient, full opacity, name + detail info | Open Admin |
| Trial | Amber accent, full opacity | Open Admin + Trial badge |
| Not subscribed | Grayed / muted, reduced opacity | Request Demo |
| Coming Soon | Grayed, reduced opacity | — / Coming Soon badge |

---

## 5. Navigation scope decisions

### §5.1 — Tenant/OU code switching (2026-08-17)

Tenant and OU code switching is a very rare use case (one EIM-type client). Remove from within individual modules. Home-level selection only.

> "The need day to day basis the need for me to casually swap between different OU codes doesn't exist." — Aarti

### §5.2 — Program switching (2026-08-17)

Switching between PT/OT/PA and nursing is also rare. Move to home-level only; remove from within individual modules.

> "We also take away the ability to make that transition within modules. You have to come back to the launch page if you want to select a different module or a different program." — Aarti

### §5.3 — School/discipline selector (2026-08-17)

Welcome greeting + school/discipline selection at the top of Exxat Home. Module selection below. "Welcome back Alex" + selector pattern proposed by Aarti.

---

## 6. Design approach history

| Approach | Verdict | Reason |
|---|---|---|
| Storefront | In consideration | Scrolling hides catalog — needs layout adjustment |
| Spotlight | In consideration | Two-column is promising; needs evolution |
| Focused | **Rejected** (Aarti, 2026-08-17) | Removes ability to market non-subscribed modules |

---

## 7. Process

| Item | Owner | Due |
|---|---|---|
| Get confirmed app list from Vinay | Romit | Before Aug 24 |
| DS tracker (component + sign-off + React delivery) | Romit + Himanshu | Before Aug 24 |
| Updated home design (Jan 1 state) | Romit | Aug 24 meeting |
| DS status presentation | Romit | Aug 24 meeting |

---

## Appendix — Source meetings

| Date | Meeting | Granola ID |
|---|---|---|
| 2026-08-17 | Home page design and login flow — storefront, spotlight, and focused approaches with Aarti | c9fa0219-7455-4720-81dd-208ec6f8efe0 |
