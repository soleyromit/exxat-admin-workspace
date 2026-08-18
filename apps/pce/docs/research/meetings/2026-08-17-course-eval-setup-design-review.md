---
date: 2026-08-17
granola_id: be0b0a3c
participants: [Aarti, Romit]
product: pce
scope: course-eval-setup
---

# Course Evaluation Setup — Aarti Design Review, Aug 17, 2026

**Granola:** `be0b0a3c` | **Product:** PCE Admin

---

## Meeting context

Aarti and Romit reviewed the 4-step course evaluation setup wizard (T129 — not yet built). Eight directives covering: rows-per-page default, course inclusion logic, scheduling vs. student lock-in messaging, term selector display, course date display, row height density, email subject labeling, and CTA wording for per-course date overrides. Additionally: dashboard term card ordering.

---

## Directives

### D_PCE_0817B_01 — Rows per page default = 25, not 10 — product-wide

The default rows-per-page for all paginated tables is 25. The existing default of 10 was not a deliberate product decision.

> "Rows per page is 10. Who made that decision? 25 is what we want to do."

**Backlog:** T195 | **Priority:** P1 — **APPLIED**: `apps/pce/admin/components/data-table/pagination.tsx:177` changed `?? 10` → `?? 25`

---

### D_PCE_0817B_02 — Step 1 course list: exclude already-scheduled courses entirely

In Step 1 of the setup wizard, the course list must only show courses that have not yet been scheduled. Do not show already-scheduled courses pre-checked or in any greyed state — omit them entirely.

> "Only bring in the 10 that are not scheduled."

**Backlog:** T196 | **Priority:** P1 — DESIGN-REVIEW; applies at T129 Step 1

---

### D_PCE_0817B_03 — Scheduling ≠ student lock-in: add informational messaging in setup flow

The setup wizard must clearly communicate that scheduling an evaluation does not immediately affect students. Add informational messaging at the appropriate step to prevent admin confusion about when students are impacted.

**Backlog:** T197 | **Priority:** P1 — DESIGN-REVIEW (copy TBD)

---

### D_PCE_0817B_04 — Term selector: include start and end dates in label

The term selector dropdown must display term start and end dates alongside the term name (e.g. "Fall 2026 · Aug 25 – Dec 15").

**Backlog:** T198 | **Priority:** P1 — DESIGN-REVIEW; applies at T129 term selector and any other term dropdown

---

### D_PCE_0817B_05 — Course dates in table: show only when different from term-level dates

In the course list table, per-course start/end dates should be displayed only when they differ from the term's dates. If the course dates match the term, show no date — do not repeat redundant information.

**Backlog:** T199 | **Priority:** P1 — DESIGN-REVIEW; applies at T129 Step 1 table

---

### D_PCE_0817B_06 — Row height: needs-attention rows slightly taller, ready-state rows compact

Row height in the course list should be variable: courses in a "needs attention" or flagged state render slightly taller to accommodate additional context; courses in the ready/complete state render at compact density.

**Backlog:** T200 | **Priority:** P2 — DESIGN-REVIEW

---

### D_PCE_0817B_07 — Email subject: require "Sample:" label or [placeholder] brackets

The email subject field in the setup wizard must either pre-fill with a "Sample:" prefix or wrap the suggested text in [placeholder] brackets so admins understand it is editable sample text, not a finalized subject line.

**Backlog:** T201 | **Priority:** P1 — DESIGN-REVIEW (copy + UX pattern TBD)

---

### D_PCE_0817B_08 — Per-course date override CTA: "Edit" not "Add a custom rule"

The action that opens a per-course date override must be labeled "Edit," not "Add a custom rule" or similar verbose phrasing.

**Backlog:** T202 | **Priority:** P1 — DESIGN-REVIEW; applies at T129 date override interaction

---

### D_PCE_0817B_09 — Dashboard term card order: Current → Upcoming → Last (not chronological)

The term cards on the evaluation dashboard must be ordered: Current term first, Upcoming term second, Last term third. Do not display them in strict chronological (date) order.

> "The order needs to be current upcoming and last, not in the chronological order of last current and upcoming."

**Backlog:** T203 | **Priority:** P1 — supplements T46 (which did not specify left-to-right card order)

---

## Process / next steps

- **Applies to:** T129 (4-step course eval setup wizard — not yet built) and dashboard term cards
- **D_PCE_0817B_01 code change:** Already applied to `pagination.tsx`; T195 added to backlog for tracking
- **D_PCE_0817B_09:** Supplements T46 — if T46 is implemented, this ordering constraint must be added before shipping
