---
date: 2026-08-12
granola_id: d6d6e961
participants: [Romit, stakeholders]
product: pce
scope: admin-setup-wizard
---

# Survey Design — Aspects, Templates, and Response Rates, Aug 12, 2026

**Granola:** `d6d6e961` | **Product:** PCE Admin

---

## Meeting context

Design session covering setup wizard UX patterns: accordion vs. drawer pattern choice, response rate scope, recipients card removal (reconfirmed), indicator for previously-evaluated instructors, and per-faculty add/remove within an aspect.

---

## Directives

### D_PCE_0812_16 — Inline accordion expand → Drawer pattern (consistent with exam management)

Any inline accordion expand/collapse pattern in the survey setup wizard should be replaced with a Drawer. This is consistent with how exam management handles the same interaction pattern.

> "Use a drawer, like exam management — consistent pattern across products."

**Backlog:** T180 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_17 — Per-faculty add/remove within an aspect in setup wizard

Within each aspect's evaluatee list, an admin can add or remove a specific faculty member. This is a granular affordance at the individual-person level within a single aspect section.

Extends and supplements T134 (add/remove within setup workflow). T134 was role/group level; this directive is per-person within an aspect.

> "You should be able to add or remove a specific faculty from within an aspect."

**Backlog:** T181 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_18 — Previously-evaluated instructor: indicator in setup wizard evaluatee list

When an instructor in the setup wizard's evaluatee list has already been evaluated for this course, show a clear visual indicator (chip, label, or state) communicating that re-evaluation is not permitted.

> "Show some indicator that this instructor has already been evaluated — they can't be evaluated again."

**Backlog:** T182 | **Priority:** P1 — DESIGN-REVIEW

---

## Killed / confirmed removed

### D_PCE_0812_19 — Recipients card in Step 4: removed (reconfirmed)

The recipients card that was in the Step 4 review screen is confirmed removed. This is a reconfirmation of a prior decision. Do not build it.

> "The recipients card is confusing and redundant — remove it."

**Applies at:** T129 Step 4 implementation (T164 spec reference). No separate task needed — existing T164 covers it.

---

## Scope clarification

**80% response rate target = survey-level only.** The "80% design rule" discussed in Aug 6 (Mona meeting) applies to the survey as a whole. It is NOT a per-aspect breakdown — do not show per-aspect response rate meters.

> "80% is for the whole survey — not broken down by aspect."

No separate backlog task; clarifies scope of T153.
