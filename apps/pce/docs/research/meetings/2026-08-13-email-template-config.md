---
date: 2026-08-13
granola_id: 7aeae56b
participants: [Romit, stakeholders]
product: pce
scope: admin-setup-wizard
---

# Survey Design — Email Template + Config Scoping, Aug 13, 2026

**Granola:** `7aeae56b` | **Product:** PCE Admin

---

## Meeting context

Design session scoping what goes into the setup wizard vs. Settings: email template redesign deferred to Settings; three display variants for faculty names in the evaluate column to be explored; priority narrowed to survey distribution + view survey only; reminder card consolidation considered.

---

## Directives

### D_PCE_0813_01 — Faculty names in evaluate column: explore three display variants for Monil review

Three possible approaches for showing faculty names in the evaluate column of the setup wizard Step 2 table. Romit to design all three and present to Monil for selection before any code.

- **(A) Aspects only** — no faculty names inline; role label only (e.g. "Instructor")
- **(B) Aspects + faculty on hover** — role label shown; hover reveals individual faculty names in tooltip or popover
- **(C) Both always visible** — role label AND faculty names shown inline at all times

> "There are three ways to show faculty names in the evaluate column — we need to explore all three options before picking one."

**Backlog:** T183 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0813_02 — Reminder cards: explore merging anchor-date-related config (deferred, low priority)

Within Step 3 of the wizard, reminder configuration cards that share an anchor date could potentially be merged into a single consolidated card. Explore the pattern but this is low priority — do not block Step 3 implementation on it.

> "Consider merging reminder cards that are related to the same anchor date."

**Backlog:** T184 | **Priority:** P2 — deferred exploration

---

## Killed / deferred this meeting

### D_PCE_0813_03 — Email template redesign: deferred to Settings (not wizard scope)

The redesign of the survey invitation and reminder email templates is NOT part of the setup wizard. It lives in the Settings area. Do not build email template configuration inside any wizard step.

> "Email template config goes in Settings — not in the distribution wizard."

**Carries forward as Settings backlog item when Settings phase begins.** No PCE wizard tasks added.

---

## Priority narrowing (confirmed)

The current implementation priority is limited to:
1. **Survey distribution flow** (T129 wizard, Steps 1–4)
2. **View survey** screens (list + detail pages)

All other screens (analytics, dashboard, reports, notifications center) are deferred. Do not build or refine anything outside this scope until distribution is shipped and frozen.

> "Priority is survey distribution and view survey only — everything else is deferred for now."
