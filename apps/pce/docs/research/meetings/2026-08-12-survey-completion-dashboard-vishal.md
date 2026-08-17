---
date: 2026-08-12
granola_id: 611feaa6
participants: [Vishal, Romit]
product: pce
scope: admin-dashboard
---

# Survey Completion Dashboard — Vishal Design Review, Aug 12, 2026

**Granola:** `611feaa6` | **Product:** PCE Admin

---

## Meeting context

Vishal and Romit reviewed the admin-facing survey completion dashboard — the view an admin sees during active collection. Nine directives covering: page structure (separate from results), action visibility, inline contextual data adjacent to actions, analytics display patterns, and a new archive capability.

---

## Directives

### D_PCE_0812_01 — Admin completion dashboard = separate surface from content/results view

The admin collection dashboard shows completion progress and actions only. The content/results view (scores, comments, AI insights) is a separate surface accessible after close. Do not merge these two views.

> "Admin completion dashboard is separate from what the instructors see. Admin sees completion and takes actions; faculty sees content results."

**Backlog:** T165 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_02 — Remove "Overall rating" from collection-phase admin dashboard

During active collection, the overall rating score is meaningless and should not be shown. Show it only post-close when results are final.

> "Remove the overall rating from the collection view."

**Backlog:** T166 | **Priority:** P1 — applies at T129 dashboard implementation

---

### D_PCE_0812_03 — Send Reminder inline context: % completion + student count

The "Send Reminder" action should display inline contextual data: completion percentage and student count (e.g. "62% · 14 / 22 students"). This gives the admin enough information to act without opening a detail view.

> "When you hover on or see the send reminder, show the completion percentage and the student count."

**Backlog:** T167 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_04 — Extend Date inline context: current end date + days remaining

The "Extend Date" action should display the current end date and days remaining before the admin confirms an extension (e.g. "Closes Sep 15 · 3 days left").

> "Show current end date and days remaining when admin extends."

**Backlog:** T168 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_05 — Color-code faculty average numbers by response rate threshold

Faculty average numbers in the analytics view are color-coded based on threshold: red = below minimum validity threshold, green = at or above desired target. Exact threshold values to be specified by PM.

> "Color code the faculty numbers — red for below threshold, green for above."

**Backlog:** T169 | **Priority:** P1 — DESIGN-REVIEW (blocked on PM threshold values)

---

### D_PCE_0812_06 — Program average: label text, not delta trend arrow

Program average comparison must be displayed as a text label ("Below program average" / "Above program average"), NOT as a numeric delta or trend arrow (e.g. +0.15 ↑).

> "Show it as a label — 'below program average' — not as a trend arrow."

**Backlog:** T170 | **Priority:** P1 — applies at dashboard analytics implementation

---

### D_PCE_0812_07 — Likert groupings: same scale only

When grouping questions in the analytics/results view, only group questions that share the same Likert scale. Do not group a 1–5 scale question with a 1–3 or 1–10 question.

> "If scales are different, do not group them together."

**Backlog:** T171 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_08 — All 4 action items directly visible (not behind dots menu)

The four primary actions on a survey row — Send Reminder, Extend Date, View Results, Close — must all be directly visible in the UI. Do not hide them behind a dots / ellipsis menu.

> "All four actions should be directly visible. No hiding behind the dots."

**Backlog:** T172 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0812_09 — Archive/inactive option for mistakenly activated evaluations

Add an archive or inactive action that allows an admin to remove a mistakenly activated evaluation from the active list. Data must be retained; the evaluation is not deleted, only archived.

> "There should be an archive or inactive option for when you activate the wrong course."

**Backlog:** T173 | **Priority:** P1 — DESIGN-REVIEW (blocked on backend API + PM spec)
