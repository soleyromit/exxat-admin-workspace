---
date: 2026-08-12
granola_id: 0ef80c33
participants: [Romit, stakeholders]
product: pce
scope: admin-survey-list
---

# Course Eval — Roles, Status Tracking, and Response Rate Thresholds, Aug 12, 2026

**Granola:** `0ef80c33` | **Product:** PCE Admin

---

## Meeting context

Design session covering: configurable response rate threshold system (two-tier, three-color), extension indicators in the deadline column, proximity-based close date display, status vocabulary consistency across views, and faculty display patterns in the survey table.

---

## Directives

### D_PCE_0812_10 — Two configurable response rate thresholds per school

Each school has two configurable response rate thresholds stored in settings:
1. **Minimum validity threshold** — below this, the evaluation is considered statistically invalid (red zone)
2. **Desired target** — the goal the school wants to reach (green zone above this)

Schools configure both in Settings. Recommended defaults to be specified by PM.

> "Two thresholds: one for minimum validity, one for desired target — both configurable per school."

**Backlog:** T174 | **Priority:** P0 — DESIGN-REVIEW (blocks NR-11 / T175)

---

### D_PCE_0812_11 — Three-color response rate coding (red / orange / green)

Based on the two thresholds (T174):
- **Red** — below minimum validity threshold (statistically invalid)
- **Orange** — at or above minimum, but below desired target (acceptable, not ideal)
- **Green** — at or above desired target

Affects `ResponseGauge` bar color in `apps/pce/admin/components/pce/response-gauge.tsx`. Cannot be coded until PM specifies threshold values.

> "Red means invalid, orange means okay but not great, green means you hit the target."

**Backlog:** T175 | **Priority:** P1 — DESIGN-REVIEW (blocked on T174)

---

### D_PCE_0812_12 — Extension indicator: badge/star when course close date differs from term close date

When a course has a close date that differs from the term-level close date (i.e. an extension was granted), show a visual indicator (star or badge) on the deadline cell in the survey table row.

> "Show that this course has an extension — different from the term date."

**Backlog:** T176 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_13 — Proximity indicator: "Closes today" / "Closes in X days"

The deadline column should display human-readable proximity text when a deadline is imminent: "Closes today" (styled distinctively) or "Closes in 3 days" for courses within the threshold window.

> "Show 'closes today' or 'closes in X days' so admin can act quickly."

**Backlog:** T177 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_14 — Status vocabulary: consistent between table view and kanban/board view

The status labels used in the survey list table (e.g. "Ongoing," "Scheduled," "Draft") must exactly match the column headers in any kanban/board view built for the same product. No synonyms between views.

> "Status names must be the same in both views — table and kanban."

**Backlog:** T178 | **Priority:** P1 — carry-forward at kanban implementation

---

### D_PCE_0812_15 — Faculty display: stacked profile icons, color-coded by role

In the survey table's instructor column, faculty avatars are displayed as a stacked set of initials icons. The icon border or background is color-coded by role type (e.g. program director vs. affiliation faculty).

> "Stack the faculty icons and color them by role — program director vs. affiliation."

**Backlog:** T179 | **Priority:** P1 — DESIGN-REVIEW
