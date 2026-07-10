# Course Evaluation — Dashboard/Insights IA decision brief

> **SUPERSEDED (same day, Jul 8 2026):** Romit approved and shipped a fuller rebuild —
> effectively Option A's spirit on two surfaces. The dashboard is now term-scoped
> (switcher scopes KPIs/AI/trend/surveys table; Vercel-Usage pattern) on DS OS
> organisms (stale `charts-overview` shells, StatusRing, term cards, DashboardMonitor,
> LiveCollectionCard removed), and results live at role-scoped `/results` +
> `/results/[id]` per Flow 4 ST-14/ST-15 (E1: term-desc sort + pagination; E2: option B;
> E3: option B). The interim "Results section on home" described below shipped and was
> replaced the next day. Remaining Aarti items: rating-weighting methodology; whether
> `/analytics` tabs also consolidate.

**Status:** DECISION NEEDED — Romit + Aarti (Monil informed)
**Date:** 2026-07-08
**Trigger:** UX audit of `/course-evaluation/dashboard` (2026-07-08): the landing surface is 100% operational (response rates, statuses, nudges) with 0% outcome content (ratings, themes). The clickable course → Evaluation Card drill exists only in `/analytics`, one nav hop away behind tabs + Select pickers.
**Depends on:** `2026-06-22-evaluations-dashboard-consolidation.md` (still `PROPOSAL — needs sign-off`; this brief supersedes its framing by widening the question to the dashboard home).

---

## The question

Where does the admin *read results*? Today the answer is "not where they land." Two architectures can fix that:

## Option A — Consolidate: one dashboard, filter bar + Group by

Adopt the Jun 22 proposal and extend it to absorb the dashboard home. One surface at `/course-evaluation/dashboard`:

```
┌──────────────────────────────────────────────────────────────┐
│ Dashboard                    [Term ▾] [Cohort ▾] [Faculty ▾] │
│                                        Group by: [Course ▾]  │
├──────────────────────────────────────────────────────────────┤
│ KPI band (scope-aware)                                       │
│ ✨ AI themes (scope-aware)                                   │
│ Ops zone (live collection + nudge) — only while collecting   │
│ Results table (grouped per Group-by) → row click → Eval Card │
└──────────────────────────────────────────────────────────────┘
```

- **Pro:** any question ("Patel × Spring 2026") reachable without tab gymnastics; one surface to maintain; ops zone self-collapses after the collection window, so the same page naturally becomes an insights page as the term matures.
- **Con:** bigger build (retires `/analytics` + 3 panels); the Jun 10 brief's "three doors" mental model (By Term / By Faculty / By Course) becomes implicit rather than navigational — needs Aarti to re-confirm; risk of a crowded page during live collection.

## Option B — Keep two surfaces, give the home an insights layer *(shipped 2026-07-08 as the interim state)*

Dashboard home keeps the Jul 7 ops framing but gains an outcome layer; `/analytics` stays the deep-dive.

```
Dashboard home                        /analytics (unchanged)
├─ Monitor (KPIs · trend · ring)      ├─ By Term   → courses table → Eval Card
├─ Live collection (rows → Eval Card) ├─ By Faculty → offerings   → Eval Card
├─ ✨ AI themes (cross-course, term)  └─ By Course  → terms       → Eval Card
├─ Results — <term> (rows → Eval Card)
└─ Terms band / past terms
```

- **Pro:** small delta (already built, see "What shipped" below); preserves the three-doors model Aarti specced Jun 10; landing surface now answers both "who do I nudge" *and* "what did students say".
- **Con:** term-scope duplication between home Results list and Analytics By Term; two surfaces to keep consistent; the Jun 22 filter-bar question stays open.

## Recommendation

**B now (done), A as the north star pending Aarti.** B fixes the audit blockers without pre-empting the consolidation decision. Take A to Aarti alongside the open **rating-weighting question** (enrollment-weighted vs simple mean — Jun 22 §4), since A's grouped results table needs that answer anyway.

## What shipped 2026-07-08 (compatible with both options)

1. `lib/pce-themes.ts` — shared AI theme derivation (+ `deriveTermThemes` cross-course aggregation); de-duplicated from `surveys/[id]` + `my-surveys/[id]/results`.
2. `components/pce/term-themes-insight.tsx` — term-level AI theme card (Aarti D14; "N courses mentioned X"); mounted on the dashboard home and Analytics ▸ By Term. Registered in `docs/governance/ds-adoption.md`.
3. Dashboard home: new **Results — {term}** section (drillable rows: status badge, avg score, responses → Evaluation Card) + `EvaluationCardSheet` mounted.
4. `LiveCollectionCard`: course names now open the Evaluation Card (was nudge-only dead end).

## Still open (blocked on this decision)

- Jun 22 consolidation (filter bar + Group by) — Aarti sign-off.
- Rating weighting methodology (Jun 22 §4) — Aarti.
- Outcome viz on the home beyond the AI card (avg-rating trend / top-bottom strip; replace or demote the status ring) — build after A/B is decided.
- Fresh Mobbin pass for "evaluation insights dashboard" (Explorance Blue / Watermark class) — no saved reference exists for the home-as-insights surface.
