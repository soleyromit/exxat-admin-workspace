---
date: 2026-08-17
granola_id: 8ddd2979
participants: [Aarti, Romit]
product: pce
scope: faculty-analytics
---

# Faculty Evaluation Analytics — Aarti Design Review, Aug 17, 2026

**Granola:** `8ddd2979` | **Product:** PCE Admin

---

## Meeting context

Aarti and Romit reviewed the faculty evaluation analytics dashboard design (T73 — new page, not yet built). Seven directives covering: multi-term data aggregation method, language standards, chart kill list, best/needs-attention sizing, cohort analysis navigation, card expansion content, and response rate labeling.

---

## Directives

### D_PCE_0817A_01 — Multi-term aggregation = average of averages, never cumulative merge

When displaying scores across multiple terms, always compute the average of each term's average — do not merge raw response data across terms to derive a combined score.

> "You don't merge the data from multiple terms to derive anything."

**Backlog:** T188 | **Priority:** P1 — applies at T73 faculty analytics implementation

---

### D_PCE_0817A_02 — Language: "Needs attention" not "worst performing" — product-wide

The label for low-ranking or underperforming items must be "Needs attention" everywhere in the product. Never use "worst performing."

> "You shouldn't even call it worst performing. You should call it needs attention."

**Backlog:** T189 | **Priority:** P1 — product-wide language rule

---

### D_PCE_0817A_03 — KILL response submission timeline chart (day-by-day trend during survey window)

Do not show a day-by-day response submission timeline chart in the faculty analytics dashboard. This chart is only relevant while a survey is actively open; it has no meaning post-close. Remove entirely or restrict to active-collection view only.

> "Eliminate those type of graphs and charts or put them only during the time when the survey is open."

**Backlog:** T190 | **Priority:** P1 — kill decision; applies at T73 implementation

---

### D_PCE_0817A_04 — Best / needs-attention section: dynamic size based on percentile, not fixed count

The number of faculty shown in the "best" and "needs attention" sections must be calculated dynamically from the total faculty count (e.g. top/bottom 10th percentile), not fixed at an arbitrary number like 5 best / 10 worst.

> "My hyperfocus is the last term to this term."

**Backlog:** T191 | **Priority:** P1 — DESIGN-REVIEW (PM to confirm percentile threshold)

---

### D_PCE_0817A_05 — Cohort analysis: TAB navigation, not toggle/switch

The cohort analysis view within the faculty analytics dashboard must be implemented as a tab (e.g. alongside summary or by-course tabs), not as a small inline toggle or switch.

> "I wanted to make it like as another tab rather than, like, just being a small switch."

**Backlog:** T192 | **Priority:** P1 — DESIGN-REVIEW

---

### D_PCE_0817A_06 — Card expansion: show term-over-term movers (courses and faculty up/down vs. last term)

When a faculty card or course card is expanded, the expanded view must surface term-over-term movement — which courses or faculty moved up or down since the last term. This is the primary signal Aarti wants to see.

> "My hyperfocus is the last term to this term."

**Backlog:** T193 | **Priority:** P1 — DESIGN-REVIEW (requires T188 aggregation rule)

---

### D_PCE_0817A_07 — Response rate: must be explicitly labeled, not implied

Response rate must always be labeled with the string "Response rate" or equivalent. It cannot be implied by a visual alone (e.g. a percentage shown without a label).

> "Nowhere does it say that that was the response rate."

**Backlog:** T194 | **Priority:** P1 — applies at T73 implementation and any analytics surface

---

## Process / next steps

- **Applies to:** T73 (faculty analytics page — new page, not yet built)
- **Aggregation rule (D_PCE_0817A_01):** Feeds into T193 card expansion and any future cross-term analytics
- **Language rule (D_PCE_0817A_02):** Enforce product-wide at all surfaces where ranking language appears
