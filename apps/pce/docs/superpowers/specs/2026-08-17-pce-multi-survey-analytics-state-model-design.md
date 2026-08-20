# PCE Multi Survey Analytics — Survey Lifecycle / State Model (Piece 1 of 3)

**Status:** Approved by Romit, ready for implementation planning
**Scope:** The foundational `ScoreCell` tri-state model and closed/pending/archived gating that every score column in the Multi Survey Analytics PRD depends on. Does NOT include Flow 1 (By Course) or Flow 2 (By Faculty) restructuring — those are separate specs, sequenced after this one.
**Source PRD:** "Multi Survey Analytics (View Responses)" — Post Course Evaluation module, pasted by Romit 2026-08-17. Wireframes: `survey-course-eval.vercel.app/prism/analytics`.
**Author:** Claude (brainstorming session), approved by Romit, 2026-08-17

## Why

Romit pasted a detailed PRD for two drill-down analytics flows (By Course: All Courses → One Course; By Faculty: All Faculty → Single Faculty → Single Faculty per Course), both bottoming out in the existing single-survey view. A code-verification pass (not a proposal review — direct evidence against `main`) found the PRD's entire *lifecycle/state model* — Pending vs. — (Not Applicable) vs. a real number, "wait for all offerings closed before showing a number," Archived surveys excluded from every calculation — does not exist anywhere in the aggregation layer:

- `MOCK_FACULTY_OFFERINGS` rows (the base data `courseStats()`/`facultyStats()` aggregate over) carry no status field at all.
- `courseStats()`/`facultyStats()` average unconditionally over every offering, with zero awareness of survey open/closed state.
- `SurveyStatus` has no `'archived'` value.
- Zero occurrences of a "Pending" cell state anywhere in the analytics code.

This is foundational: the PRD states the state model "applies to every score, KPI, and row across ST-01–ST-05." Building Flow 1's or Flow 2's UI before this exists means building score displays that can't show what the PRD specifies. This spec covers only this foundation.

## Decomposition (confirmed with Romit)

1. **This spec** — the state model itself.
2. Flow 1 (By Course) restructure — All Courses landing level, three-score model with General, breadcrumbs. Separate spec, after this one ships.
3. Flow 2 (By Faculty) restructure — Instructor/Coordinator column split, missing ST-05 level, breadcrumbs. Separate spec, after this one ships.

Piece 1 blocks 2 and 3 in the sense that their score displays are meaningless without it; 2 and 3 are otherwise independent of each other.

## Key scoping decision: live term only

Pending only applies to the **current/in-progress term's live data** (the `surveys` array in `usePce`, which carries real `SurveyStatus`). Historical `MOCK_FACULTY_OFFERINGS` rows — which `ByTermPanel` already treats as a distinct "fallback for terms with no live surveys" data source — have no live-survey backing and are treated as **implicitly closed**. A past term is, by definition, done; Pending only makes sense for a term still in progress. This is a deliberate scope-narrowing choice: it means the gating logic touches the live surveys array, not a retrofit of every historical fixture row. If a future term's real backend data doesn't cleanly separate "historical" from "live" the way the mock fixtures do, this assumption needs revisiting — flagged as an open item below.

## Section 1 — Data model & gating logic

```ts
// lib/pce-analytics.ts
export type ScoreCell<T> =
  | { state: 'value'; value: T }
  | { state: 'pending' }
  | { state: 'na' }
```

**New `SurveyStatus` value:** `'archived'`, added as a real enum value (not a separate boolean flag) — Archived is a lifecycle stage a survey moves into, and this keeps the survey's state in one place rather than two fields that can disagree. Archived offerings are filtered out before gating runs, as if they never existed — not shown as Pending, not frozen as stale history, matching the PRD's "archived is indistinguishable from never-existed" rule.

**Gating helper**, one function, used everywhere a score column exists:

```ts
function gatedScore<T>(
  offerings: OfferingLike[],
  statusOf: (o: OfferingLike) => SurveyStatus | 'historical',
  compute: (closedOfferings: OfferingLike[]) => T,
): ScoreCell<T> {
  const live = offerings.filter(o => statusOf(o) !== 'archived')
  if (live.length === 0) return { state: 'na' }
  if (live.some(o => !['closed', 'released', 'historical'].includes(statusOf(o))))
    return { state: 'pending' }
  return { state: 'value', value: compute(live) }
}
```

Called once per score column inside `courseStats()`/`facultyStats()`, replacing today's unconditional `dualMean(...)` calls. This is the actual "wait for all offerings closed" rule, defined in one place rather than re-derived per caller — the same discipline that prevents this file's existing redundant-computation pattern (flagged earlier this session: `offeringPoints()` and friends already get recomputed from scratch on every call with no cross-caller memoization) from getting a second instance.

**`'pending_review'` is explicitly NOT countable.** `SurveyStatus` has a `'pending_review'` value (data collection finished, awaiting moderator review before release) that the source PRD doesn't name — it only says "Closed/Results-Available." Read literally: a survey sitting in moderation hasn't reached either named state, so it gates the row to Pending, same as `'collecting'` or `'active'`. This is a deliberate reading of an otherwise-ambiguous spec, not an oversight — flagged here so it's a stated decision, not silent behavior discovered later.

**Response Rate stays a plain pooled number, not a `ScoreCell`.** The PRD explicitly treats it differently from the score columns — it pools from whatever's already closed and is never gated on full closure. The current formula (`Σresponses / Σenrolled`, verified against the live code) is already correct; it only needs to start excluding Archived offerings, which it can't today since Archived doesn't exist.

## Section 2 — Consumption: rendering and charts

**Shared render component** (`components/pce/score-cell.tsx`), used everywhere a `ScoreCell` needs to show as text — KPI tiles, table cells, and the `ScoreTile` hero-value slot from the earlier analytics-tabs interaction plan:

```tsx
function ScoreCellText({ cell, format }: { cell: ScoreCell<number>; format: (v: number) => string }) {
  if (cell.state === 'value') return <span className="tabular-nums">{format(cell.value)}</span>
  if (cell.state === 'pending') return <span className="text-muted-foreground italic">Pending</span>
  return <span className="text-muted-foreground">—</span>
}
```

One component, reused everywhere — not three ad-hoc renderings scattered across the codebase.

**Charts:** Observable Plot marks need raw numeric arrays, not tri-state wrappers. Every chart-consuming site filters to `.filter(r => r.score.state === 'value')` before building plot data. This is not new special-casing — it matches an established pattern already in the real code: `DriftDumbbell`/`KpiSpark` already filter out null values rather than plotting them as 0, with the documented principle "a fake flat line is worse than absence." Pending/na rows simply don't appear as a mark.

**Below-Benchmark and empty-average KPIs:** both PRD rules ("Pending/— sit out of benchmark comparisons," "average skips Pending/—, shows — if zero rows have a real number") become a single check against `.state === 'value'` — one small `averageValueCells()` helper, not bespoke logic per KPI.

## Section 3 — Scope boundaries and verification

**In scope:**
- `ScoreCell<T>` type, `gatedScore()` helper, `'archived'` added to `SurveyStatus`
- Gating wired into `courseStats()`/`facultyStats()` for the score fields that exist today (course content score, faculty score); Response Rate updated to exclude Archived, stays pooled/ungated
- `ScoreCellText` render component; existing KPI tiles, table columns, leaderboard rows, and charts updated to consume it without regressing what's currently shown
- `'archived'` badge support in `pce-badges.tsx` (existing source-of-truth convention for survey status badges)

**Explicitly deferred (Piece 2/3, not this spec):**
- Flow 1's General score dimension, All-Courses landing level
- Flow 2's Instructor/Coordinator column split, ST-05 level
- Breadcrumb navigation
- Auditing the other ~24 non-analytics `SurveyStatus` consumers (survey lists, moderation, push validation, term metrics, etc.) for exhaustive-switch handling of `'archived'` — necessary and mechanical, not designed here. Adding the enum value is deliberately chosen over a boolean flag specifically so TypeScript surfaces every switch that needs a new case, rather than this list being hand-maintained and incomplete.

**Verification plan:**
- `tsc --noEmit` immediately after adding the `'archived'` enum value — compiler-driven audit of every non-exhaustive `SurveyStatus` switch across the ~26 consumer files; fix what it flags
- Live-browser check: an in-progress term's course/faculty rows show real Pending states where an underlying survey is still open; a fully-closed historical term shows only real numbers or — (never Pending)
- `state-review` gate on the three cell states (value/pending/na), per this workspace's governance
- Grep-verify every chart-consuming site was updated to filter `.state === 'value'` before plotting (Pattern G)
- Two-tier verdict (GREENLIGHT static vs. runtime) per this workspace's standard

## Open items (deliberately left open, per the source PRD's own convention)

- **Historical/live boundary in a real backend.** This spec's "live term only" scoping assumes a clean split between historical (always-closed) and live (real status) data, mirroring the mock fixtures' existing `ByTermPanel` fallback pattern. If the real backend doesn't preserve that split as cleanly, the gating helper's `'historical'` status branch needs revisiting. Owner: Engineering, once backend integration is scoped.
- **Response-weighting for the "wait for all" gate itself.** The PRD's Program Avg KPIs (unweighted per-row vs. response-count-weighted) is called out as undecided in the source PRD across ST-01/02/03/04 — this spec doesn't resolve it, `gatedScore()`'s `compute` callback is agnostic to whichever averaging method Piece 2/3 eventually choose. Owner: Product (per source PRD).
- **Template-version heterogeneity, Likert scale-size changes, question meaning drift, Template ID mismatches.** All four are explicitly flagged as open in the source PRD, common to every story. This spec's gating logic doesn't address any of them — they're orthogonal to closed/pending/archived status and would need their own design pass if Product decides to act on them. Owner: Product/Engineering (per source PRD).
