---
date: 2026-08-10
granola_id: 9b24d8d1
participants: [Aarti, Romit]
product: design-system
scope: ds-level
---

# DS Utility Bar + Home Page Redesign — Aug 10, 2026

**Granola:** `9b24d8d1` | **Product scope:** Design system (Admin DS) + Portal home page

---

## Meeting context

Design session with Aarti reviewing: (1) the design system utility bar concept and tab architecture, (2) the admin home page redesign for the Exxat platform. Three home design approaches presented — storefront, spotlight, and focused.

---

## Directives

### D_DS_0810_01 — Tab bar: line variant only (no primary/secondary distinction)

All tabs in the admin DS use the "line variant." Do not use a primary tab vs. secondary tab hierarchy. Every tab at every level = line style.

> "All tabs should be line variant — there is no primary or secondary tab in our design system."

**Code target:** DS-level — `exxat-ds` submodule (READ ONLY). No PCE product code change.

---

### D_DS_0810_02 — Layout: compact/concise, no card-sort approach

The home layout should be compact and concise. Do not use a card-sort pattern (evenly sized cards in a grid that all look the same regardless of importance).

> "Keep it compact. Don't use a card-sort approach — everything shouldn't look equally weighted."

**Code target:** Portal home — separate product. Not PCE.

---

### D_DS_0810_03 — Sticky navigation + sticky section headers

As the page scrolls: the top navigation bar is sticky. Section headers within the page content are also sticky as their content scrolls beneath them.

> "Sticky nav and sticky section headers — as you scroll, those headers stay."

**Code target:** DS-level layout behavior. Romit awareness for future components.

---

### D_DS_0810_04 — Resizable sheet/drawer

The sheet/drawer component should support resizing by the user (drag to expand/collapse). Relates to the information density pattern discussed.

> "The drawer or sheet should be resizable."

**Code target:** DS-level component. `exxat-ds` — READ ONLY. DS team owns.

---

## Summary: Code impact

All four directives are DS-level design decisions. The `exxat-ds` submodule is READ ONLY — no edits can be made to it from this product repo. These are Romit awareness items:

- DS team tracks tab variant standardization
- Portal home layout (compact, no card-sort) = portal product, not PCE
- Sticky behavior + resizable drawer = DS component improvements

No backlog tasks added to PCE from this meeting. No code changes to `apps/pce/`.
