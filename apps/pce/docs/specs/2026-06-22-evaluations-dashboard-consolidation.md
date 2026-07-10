# Design Brief — Evaluations Dashboard Consolidation

**Date:** 2026-06-22
**Author:** Romit (with Claude)
**Status:** 🟡 PROPOSAL — needs Romit + Aarti sign-off before build
**Trigger:** Screen-7 annotation — *"Why do we have these [tabs] when they are all filters? Wouldn't it be better to have one dashboard, and be able to filter on that one screen by term, cohort, faculty, and course?"*

---

## 1. The problem

The Evaluations **Dashboard** (`/analytics`) currently has four sibling tabs:

```
[ Overview ]  [ By Term ]  [ By Faculty ]  [ By Course ]
```

Each tab is **the same underlying dataset (CE survey results) seen through a different lens** — and each carries its *own* scope control:

| Tab | Scope control it owns | What it shows |
|---|---|---|
| Overview | (none — current cycle) | At-risk callout · response-rate trend · live evaluations table |
| By Term | Term / Cohort toggle + picker | Completion KPIs · program trend · course & faculty rankings · courses table |
| By Faculty | Faculty picker | Faculty KPIs · comparative bars · offerings table |
| By Course | Course picker | Course KPIs · rating trend · offerings table |

**Why this is awkward:**

- **Scope is fragmented.** To answer *"how did Dr. Patel do in Spring 2026?"* you pick the **By Faculty** tab, pick the faculty — but you **can't also constrain to a term**; By Faculty is all-time. The term lives on a different tab.
- **"Tab" implies different content; here it's the same content re-sliced.** Tabs are the wrong mental model for what are really *grouping/filter choices*.
- **Filters are inconsistent.** Term/Cohort is an inline toggle on one tab; Faculty and Course are inline pickers on others; Overview has no scope at all.

This is the classic *"tabs that are actually filters"* anti-pattern.

---

## 2. Proposal — one dashboard, persistent filters, "Group by"

Replace the four tabs with **one dashboard surface** that has:

1. A **persistent filter bar** at the top: `Term · Cohort · Faculty · Course` (each optional; empty = all).
2. A **"Group by"** control that re-slices the *same* filtered dataset: `Overview · Term · Faculty · Course`.

The filter bar and the grouping are **independent** — so any combination is reachable (e.g. *Faculty = Patel, Term = Spring 2026, Group by = Course*), which the tab model can't express today.

### Proposed layout (ASCII)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                          [ Export ]  [ Send Evals ]│
├────────────────────────────────────────────────────────────────────────────┤
│  Term ▾  Cohort ▾  Faculty ▾  Course ▾            Group by: ( Overview ▾ )    │  ← filter bar (sticky)
│  Spring 2026   All      All       All                                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ▢ KPI strip  (re-computed from the active filter set)                      │
│   ▢ Primary viz  (depends on Group by — see §3)                              │
│   ▢ Detail table (the filtered courses / offerings, click → Evaluation Card) │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

### How "Group by" maps to today's tabs

| Group by | ≈ today's tab | Primary viz | Detail table |
|---|---|---|---|
| **Overview** | Overview | At-risk callout + response-rate-over-time | Live evaluations |
| **Term** | By Term | Program trend + course/faculty rankings | Courses in scope |
| **Faculty** | By Faculty | Comparative bars (faculty vs dept vs school) | Offerings |
| **Course** | By Course | Rating trend per term | Offerings |

Nothing is lost — every existing view survives as a grouping. What's **gained** is cross-filtering: the filter bar narrows *whatever* grouping is active.

---

## 3. What changes / what stays

**Stays (reused as-is):**
- `DashboardMonitor`, `ByTermPanel`, `ByFacultyPanel`, `ByCoursePanel` — the panel bodies become "group renderers", largely unchanged.
- The `EvaluationCardSheet` drill-in and the Remind (ex-Nudge) confirmation.

**Changes:**
- `app/(app)/analytics/page.tsx` — replace `<Tabs>` with a filter bar + a `groupBy` Select; the four `<TabsContent>` become a switch on `groupBy`.
- Each panel gains optional `term` / `cohort` / `faculty` / `course` props and filters its dataset by the **intersection** of active filters (today they each take a single scope).
- Move the Term/Cohort control out of `ByTermPanel`'s body into the shared filter bar (resolves screen-5 *"why is the cohort filter here and not at the top?"*).

**Net:** mostly a rewiring of `analytics/page.tsx` + threading filter props. The expensive viz/table code is reused.

---

## 4. Open decision — rating methodology (for Aarti)

Screens 6 & 7 raised a **methodology** question that is **out of scope for the IA change** but must be resolved with Aarti, because it changes what every rating number *means*:

> *"So a course with 100 students is weighted more than one with 10 students? Not sure if we want this — further discussions needed."*

Today all rankings/averages are **enrollment-weighted** (Σ rating×enrolled ÷ Σ enrolled). Options:

| Option | Behavior | Trade-off |
|---|---|---|
| **A. Enrollment-weighted** (current) | Big classes dominate the average | Reflects *student-experience* totals; can mask small-class outliers |
| **B. Simple mean** | Every course/section counts equally | Fair to small classes; a 4-student section sways the mean |
| **C. Show both** | Weighted headline + simple mean on hover/secondary | Most transparent; more UI |

**Recommendation:** decide with Aarti before the rankings work. Until then, copy now reads *"weighted by class size"* (was the jargon *"enrollment-weighted"*) so at least the current behavior is legible.

**Related sub-questions to close:**
- Rankings are currently **all-time**; consolidation gives them the term filter, resolving *"why all time / are there filters?"*.
- **Tiers** (the green/blue/amber bar colors): keep as a performance signal, or drop (a ranked list already encodes order)? Recommend dropping decorative tiers or coloring only below-target bars.

---

## 5. Build plan (only if approved)

1. **Filter bar component** — `Term · Cohort · Faculty · Course`, URL-synced (`?term=&faculty=…`) so views are shareable.
2. **`groupBy` switch** — replace `<Tabs>`; render the matching panel.
3. **Thread filters into panels** — each panel filters by the active intersection; empty filter = all.
4. **Lift Term/Cohort** out of `ByTermPanel` into the bar.
5. **Rankings term-scope** — wire rankings to the term filter (kills "all time" ambiguity).
6. **(Pending Aarti)** apply the chosen weighting methodology + tier decision.

Estimated: **L** (1 focused pass for steps 1–5; step 6 gated on the methodology call).

---

## 6. Decisions needed before build

- [ ] **Romit:** approve the one-dashboard + filter-bar + Group-by direction (replaces the 4 tabs)?
- [ ] **Aarti:** rating methodology — A (weighted), B (simple mean), or C (both)?
- [ ] **Romit/Aarti:** keep or drop the ranking **tier** colors?
- [ ] Confirm filters should be **URL-synced** (shareable dashboard states).

> Per workspace rule *"never consolidate distinct workflows without approval"*: this brief is the approval gate. No tab-removal code ships until the first box is checked.
