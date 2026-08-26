# Post-Course Survey Cadence

**Date:** 2026-08-25
**Participants:** Vishaka (product), David (stakeholder), Kanti, Monal (product/analytics)
**Granola ID:** `970c20a2`
**Context:** Analytics scope and KPI structure for post-course survey analytics dashboard. Key outcomes: two separate KPI cards (course rating vs. faculty rating), evaluation coverage reformatted as count, group-by toggle removed, term filter removed from trend charts, "less is more" directive for launch scope, and nav subtext for Surveys entry.

---

## Key directives

### 1. Analytics KPI cards — two cards, not one

The overview KPIs must be split into two distinct cards:
1. Average **course** rating
2. Average **faculty** rating

These must NOT be combined into a single "average rating" card.

> David: "I almost envision two cards, one for course reading, one for faculty rating"

**No code change yet.** The current `analytics/page.tsx` `KeyMetrics` block does not reflect this split. Added as T232.

### 2. Evaluation coverage KPI — count format "N of M", not percentage

The evaluation coverage metric should display as a count ("19 course offerings") rather than a percentage. The subtext should indicate what the denominator is.

> Monal: "showing it as 19 course offerings across 3 courses"

Additional constraints:
- Remove the trend line from this KPI card (no sparkline for coverage)
- Format: large number = N (coverage count), subtext = "out of [total] course offerings"

**No code change yet.** Current KeyMetrics block shows this as a percentage. Added as T233.

### 3. Remove group-by toggle from analytics trend charts

The academic year / term group-by toggle on trend charts should be removed. Trend charts always show term-over-term data by default.

> Vishaka: "remove this group by and by default show term over term Trend"

**No code change needed.** A group-by toggle does not exist in the current `analytics/page.tsx`. Added as T234 as a "do not build" guard.

### 4. Term filter does not apply to trend charts — always show full history

The term selector filter (used on other analytics views) must not filter trend charts. Trend charts always display the full time-series across all terms.

> Vishaka: "I would even say that for the trend is a truly, you cannot have a snapshot when it comes to trend is always all data across all terms"

**No code change needed.** Trend charts are not currently built; this is a forward-looking architectural constraint. Added as T235.

### 5. "Less is more" — remove advanced analytics scope for launch

The initial launch analytics should be minimal and known-useful. Advanced analytics (detailed breakdowns, advanced filtering, multi-dimensional views) are deferred post-beta.

> Vishaka: "less is more. Let's give them clean, clear analytics that we know for sure they need and they will use"

**No code change.** Directional scope constraint — any advanced analytics additions should be deferred unless confirmed by Vishaka/David. Added as T236.

### 6. Nav label — "Surveys" with programmatic + course subtext

The "Surveys" sidebar nav item should carry a subtext descriptor to clarify it covers both programmatic surveys and course surveys.

> David: "maybe we can add programmatic and course surveys in the subtype, the subtext of the descriptor"

Proposed nav entry:
- Label: **Surveys**
- Subtext: "Programmatic and Course Surveys"

**No code change yet.** Current `app-sidebar.tsx` `ADMIN_NAV` shows a flat label with no subtext. Added as T237. Note: SidebarMenuButton tooltip and accessible label will also need updating.

---

## Not addressed / deferred

- Programmatic survey scope and timeline: not resolved in this session (previously parked, D_PCE_0819B_04).
- Analytics "by faculty" vs. "by course" drill-down spec: not finalized.
