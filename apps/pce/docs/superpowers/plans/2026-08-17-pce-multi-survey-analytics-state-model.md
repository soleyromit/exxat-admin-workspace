# PCE Multi Survey Analytics — Survey Lifecycle / State Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every analytics score column (`FacultyStat.score`, `CourseStat.score`, `CourseStat.facultyScore`) a real three-state model — a computed value, `Pending` (survey still open), or `—` (role doesn't apply) — instead of always showing a number regardless of whether the underlying surveys have actually closed.

**Architecture:** A new `ScoreCell<T>` tri-state type and a single `gatedScore()` helper, in a new `lib/pce-score-cell.ts` file, replace the unconditional `dualMean(...)` calls inside `courseStats()`/`facultyStats()`. Every offering gains a `surveyStatus` field (via the existing `surveyFor()` join in `offeringPoints()` — no new data fetching, no React state reached into). Every consumer of `.score.weighted`/`.score.simple` across the codebase is migrated to unwrap or filter the new tri-state cell via a shared `ScoreCellText` render component.

**Tech Stack:** TypeScript, React 19, Next.js App Router, existing PCE mock-data layer (`lib/pce-mock-data.ts`, `lib/pce-analytics.ts`), Observable Plot (`@observablehq/plot`) for charts, Vitest/Jest for unit tests (confirm test runner in Task 1, Step 2).

**Spec:** `apps/pce/docs/superpowers/specs/2026-08-17-pce-multi-survey-analytics-state-model-design.md`

## Global Constraints

- Pending applies to the **current/live term only**. Historical offerings (no matching live survey — `surveyFor()` returns `undefined`) are always treated as closed. This is `surveyStatus: 'historical'` in the type, never `'pending'`.
- `'archived'` is a new `SurveyStatus` enum value, not a boolean flag. Archived offerings are filtered out before gating runs, as if they never existed.
- `'pending_review'` status does **not** count as closed — it gates a row to Pending, same as `'active'`/`'collecting'`. Only `'closed'`, `'released'`, and `'historical'` are countable.
- Response Rate stays a plain pooled number (`Σresponses / Σenrolled`) on both `FacultyStat`/`CourseStat` — never gated on full closure, but must exclude Archived offerings.
- `facultyCourseStats()` and `courseFacultyStats()` (separate derivations, their own independent `dualMean()` calls) are explicitly **out of scope** for this plan — do not touch them. This creates a known, accepted inconsistency (their score columns stay ungated) — do not "fix" it as a drive-by; it's a deliberate scope boundary from the approved spec.
- Zero backwards-compatibility shims. `FacultyStat.score`/`CourseStat.score`/`CourseStat.facultyScore` change type outright; every consumer is migrated, not adapted around.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/pce-score-cell.ts` (new) | `ScoreCell<T>` type, `gatedScore()` helper, `averageValueCells()` helper. Pure, no React, unit-testable in isolation. |
| `lib/pce-mock-data.ts` (modify) | Add `'archived'` to `SurveyStatus`. |
| `lib/pce-analytics.ts` (modify) | `OfferingPoint.surveyStatus` field; `offeringPoints()` populates it; `FacultyStat`/`CourseStat` interfaces change `score`/`facultyScore` type; `facultyStats()`/`courseStats()` use `gatedScore()`; internal sort comparators, `programSummary()`, `benchmarks()` updated to unwrap `ScoreCell`. |
| `components/pce/score-cell.tsx` (new) | `ScoreCellText` — the one shared render component for a `ScoreCell<number>` (or `ScoreCell<DualMean>`'s `.weighted`/`.simple`). |
| `components/pce/pce-badges.tsx` (modify) | Add `'archived'` badge mapping — existing source-of-truth component for survey status badges. |
| `components/pce/analytics-panels.tsx` (modify) | ~25 call sites reading `.score.weighted`/`.score.simple`/`.facultyScore.weighted`/`.facultyScore.simple`. |
| `components/pce/faculty-leaderboard-section.tsx` (modify) | ~15 call sites. |
| `components/pce/analytics-plots.tsx` (modify) | ~10 call sites — chart marks, must filter to `.state === 'value'` before building Plot data, not just unwrap. |
| `components/pce/analytics-overview-panel.tsx` (modify) | ~15 call sites. Overview's *design* is out of scope for the broader analytics-tabs work, but it shares `facultyStats()`/`courseStats()` — it must be fixed to keep compiling and rendering correctly. |
| `components/pce/faculty-portfolio-charts.tsx` (modify) | ~10 call sites. |
| `components/pce/analytics-survey-details.tsx` (modify) | 2 call sites. |
| `app/(app)/analytics/page.tsx` (modify) | 1 call site. |

Sequencing: Tasks 1-2 are independent and can run in either order. Task 3 depends on Task 1 (uses `ScoreCell`'s status vocabulary conceptually, not its code) and Task 2 (needs `'archived'` to exist). Task 4 depends on 1 and 3. Task 5 depends on 1. Tasks 6-12 each depend on 4 and 5, and are independent of each other (can run in parallel across subagents). Task 13 depends on all prior tasks.

---

### Task 1: `ScoreCell<T>` type and `gatedScore()` helper

**Files:**
- Create: `lib/pce-score-cell.ts`
- Test: `lib/pce-score-cell.test.ts`

**Interfaces:**
- Produces: `ScoreCell<T>` type, `gatedScore<T>(offerings, statusOf, compute): ScoreCell<T>`, `averageValueCells(cells: ScoreCell<number>[]): number | null`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/pce-score-cell.test.ts
import { describe, it, expect } from 'vitest'
import { gatedScore, averageValueCells, type ScoreCell } from './pce-score-cell'

type Row = { status: 'closed' | 'released' | 'historical' | 'active' | 'pending_review' | 'archived' }

describe('gatedScore', () => {
  it('returns na for an empty offering list', () => {
    const cell = gatedScore<number>([], (r: Row) => r.status, () => 42)
    expect(cell).toEqual({ state: 'na' })
  })

  it('returns na when every offering is archived', () => {
    const rows: Row[] = [{ status: 'archived' }, { status: 'archived' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'na' })
  })

  it('returns pending when any non-archived offering is not closed/released/historical', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'active' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'pending' })
  })

  it('returns pending for pending_review — it does not count as closed', () => {
    const rows: Row[] = [{ status: 'pending_review' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'pending' })
  })

  it('returns a computed value when every non-archived offering is closed/released/historical', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'released' }, { status: 'historical' }]
    const cell = gatedScore<number>(rows, (r) => r.status, (closed) => closed.length)
    expect(cell).toEqual({ state: 'value', value: 3 })
  })

  it('excludes archived offerings from the compute call and from the pending check', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'archived' }]
    const cell = gatedScore<number>(rows, (r) => r.status, (closed) => closed.length)
    expect(cell).toEqual({ state: 'value', value: 1 })
  })
})

describe('averageValueCells', () => {
  it('averages only value-state cells, skipping pending/na', () => {
    const cells: ScoreCell<number>[] = [
      { state: 'value', value: 4 },
      { state: 'pending' },
      { state: 'value', value: 6 },
      { state: 'na' },
    ]
    expect(averageValueCells(cells)).toBe(5)
  })

  it('returns null when zero cells have a real value', () => {
    const cells: ScoreCell<number>[] = [{ state: 'pending' }, { state: 'na' }]
    expect(averageValueCells(cells)).toBeNull()
  })
})
```

- [ ] **Step 2: Confirm the test runner and run the tests to verify they fail**

Check `package.json` for the test script (likely `vitest` or `jest` — this repo is Next.js + Vitest per typical PCE admin setup; if unsure, run `cat package.json | grep -A2 '"scripts"'` first).

Run: `pnpm test lib/pce-score-cell.test.ts` (or `pnpm vitest run lib/pce-score-cell.test.ts`)
Expected: FAIL — `Cannot find module './pce-score-cell'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/pce-score-cell.ts
import type { SurveyStatus } from '@/lib/pce-mock-data'

/**
 * A score that may not be computable yet. `state: 'pending'` means the underlying
 * survey(s) haven't all closed; `state: 'na'` means the role/component this cell
 * represents doesn't exist for this row at all (including: every offering behind it
 * was Archived, which is treated as if the offering never existed).
 */
export type ScoreCell<T> =
  | { state: 'value'; value: T }
  | { state: 'pending' }
  | { state: 'na' }

const COUNTABLE: ReadonlySet<SurveyStatus | 'historical'> = new Set(['closed', 'released', 'historical'])

/**
 * The PRD's "wait for all offerings closed" rule, in one place.
 *
 * `'pending_review'` is deliberately NOT in COUNTABLE — data collection may be done, but
 * moderation isn't, and the source PRD only names "Closed/Results-Available" as countable.
 */
export function gatedScore<T>(
  offerings: readonly unknown[],
  statusOf: (o: any) => SurveyStatus | 'historical',
  compute: (closedOfferings: any[]) => T,
): ScoreCell<T> {
  const live = offerings.filter((o) => statusOf(o) !== 'archived')
  if (live.length === 0) return { state: 'na' }
  if (live.some((o) => !COUNTABLE.has(statusOf(o)))) return { state: 'pending' }
  return { state: 'value', value: compute(live) }
}

/** Averages across rows with a real number, skipping Pending/—. Null (not 0) if none do. */
export function averageValueCells(cells: ScoreCell<number>[]): number | null {
  const values = cells.filter((c): c is { state: 'value'; value: number } => c.state === 'value').map((c) => c.value)
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test lib/pce-score-cell.test.ts`
Expected: PASS, all 8 tests

- [ ] **Step 5: Commit**

```bash
git add lib/pce-score-cell.ts lib/pce-score-cell.test.ts
git commit -m "feat(pce): add ScoreCell tri-state type and gatedScore helper"
```

---

### Task 2: Add `'archived'` to `SurveyStatus`, wire the badge, audit other consumers

**Files:**
- Modify: `lib/pce-mock-data.ts:1`
- Modify: `components/pce/pce-badges.tsx` (exact location found in Step 1)

**Interfaces:**
- Produces: `SurveyStatus` now includes `'archived'`.

- [ ] **Step 1: Find the current badge mapping**

```bash
grep -n "SurveyStatus\|'closed'\|'released'" components/pce/pce-badges.tsx
```

Read the surrounding switch/map to see the exact pattern used for existing statuses (label, color/variant) before adding a new case.

- [ ] **Step 2: Add the enum value**

```ts
// lib/pce-mock-data.ts:1
export type SurveyStatus = 'draft' | 'active' | 'collecting' | 'scheduled' | 'pending_review' | 'released' | 'closed' | 'archived'
```

- [ ] **Step 3: Add the badge case in `pce-badges.tsx`**

Follow the exact structural pattern found in Step 1 (this file uses `ListHubStatusBadge` per this workspace's convention — match whatever switch/object-map shape the existing `'closed'` case uses, add `'archived'` beside it with muted/neutral styling, since an archived survey is inert, not a state anyone needs to act on).

- [ ] **Step 4: Run `tsc --noEmit` to find every switch that now needs a case**

Run: `pnpm tsc --noEmit 2>&1 | grep -i "archived\|SurveyStatus"`

This is the compiler-driven audit the spec calls for. For each file it flags:
- If it's one of the files this plan already touches in Tasks 6-12, note it and fix it there.
- If it's outside this plan's file list (e.g. `surveys-table.tsx`, `moderation`, `push-validation`), add a minimal fix here: a `default`/fallback case that renders the same as `'closed'` (archived surveys are inert, closed-adjacent) is sufficient — do not redesign those surfaces' status handling, just make them compile and not silently misrender.

- [ ] **Step 5: Verify `tsc --noEmit` is clean of `archived`-related errors**

Run: `pnpm tsc --noEmit 2>&1 | grep -i "archived\|SurveyStatus"`
Expected: no output (all consumers handle it or fall through safely)

- [ ] **Step 6: Commit**

```bash
git add lib/pce-mock-data.ts components/pce/pce-badges.tsx
git commit -m "feat(pce): add archived SurveyStatus, wire badge and audit consumers"
```

---

### Task 3: `OfferingPoint.surveyStatus` — the join, not a new fetch

**Files:**
- Modify: `lib/pce-analytics.ts:103-131` (`OfferingPoint` interface)
- Modify: `lib/pce-analytics.ts:170-193` (`offeringPoints()`)

**Interfaces:**
- Consumes: `SurveyStatus` from `lib/pce-mock-data.ts` (Task 2), `surveyFor()` (existing, `lib/pce-analytics.ts:160-168`, unchanged)
- Produces: `OfferingPoint.surveyStatus: SurveyStatus | 'historical'`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pce-analytics.test.ts (create if it doesn't exist, or add to existing analytics tests)
import { describe, it, expect } from 'vitest'
import { offeringPoints } from './pce-analytics'

describe('offeringPoints surveyStatus', () => {
  it('every offering has a surveyStatus of a real SurveyStatus value or "historical"', () => {
    const points = offeringPoints()
    expect(points.length).toBeGreaterThan(0)
    const valid = new Set(['draft', 'active', 'collecting', 'scheduled', 'pending_review', 'released', 'closed', 'archived', 'historical'])
    for (const p of points) {
      expect(valid.has(p.surveyStatus)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test lib/pce-analytics.test.ts`
Expected: FAIL — `p.surveyStatus` is `undefined`, not in the `valid` set

- [ ] **Step 3: Add the field to `OfferingPoint`**

```ts
// lib/pce-analytics.ts, inside the OfferingPoint interface (currently lines 103-131), add:
  /**
   * This offering's survey status, or 'historical' when no live survey links to it
   * (surveyFor() found nothing — an earlier term the live survey system has no record of).
   * 'historical' is always treated as closed for gating purposes — Pending only applies
   * to the current/in-progress term. See the state-model spec's "live term only" scoping.
   */
  surveyStatus: SurveyStatus | 'historical'
```

Add the `SurveyStatus` type import at the top of the file (`lib/pce-analytics.ts:24`, extend the existing type-only import from `@/lib/pce-mock-data`):

```ts
import type { FacultyOfferingRecord, FacultyEvalRoleId, PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
```

- [ ] **Step 4: Populate it in `offeringPoints()`**

In `lib/pce-analytics.ts:170-193`, the returned object already computes `const survey = surveyFor(o)` (line 175). Add one field to the return:

```ts
    return {
      ...o,
      surveyId: o.surveyId ?? survey?.id,
      evalRole: facultyEvalRole(o.role, f?.position),
      year: termToYear(o.term),
      facultyName: name,
      initials: f?.initials ?? initialsOf(name),
      responded: Math.round((o.enrolled * o.responseRate) / 100),
      minimumThreshold: survey?.minimumThreshold ?? MINIMUM_THRESHOLD,
      surveyStatus: survey?.status ?? 'historical',
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test lib/pce-analytics.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/pce-analytics.ts lib/pce-analytics.test.ts
git commit -m "feat(pce): add surveyStatus to OfferingPoint via the existing survey join"
```

---

### Task 4: Wire `gatedScore()` into `facultyStats()`/`courseStats()`, fix internal consumers

**Files:**
- Modify: `lib/pce-analytics.ts:547-566` (`FacultyStat` interface)
- Modify: `lib/pce-analytics.ts:602-642` (`facultyStats()`)
- Modify: `lib/pce-analytics.ts:849-873` (`CourseStat` interface)
- Modify: `lib/pce-analytics.ts:890-930` (`courseStats()`)
- Modify: `lib/pce-analytics.ts:1174-1216` (`programSummary()`)
- Modify: `lib/pce-analytics.ts:1245-1259` (`benchmarks()`)

**Interfaces:**
- Consumes: `ScoreCell<T>`, `gatedScore()` (Task 1); `OfferingPoint.surveyStatus` (Task 3)
- Produces: `FacultyStat.score: ScoreCell<DualMean>`; `CourseStat.score: ScoreCell<DualMean>`; `CourseStat.facultyScore: ScoreCell<DualMean>`

This task intentionally breaks compilation for every file in Tasks 6-12 — expected, fixed there. Do not attempt to fix consumers in this task.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/pce-analytics.test.ts, add:
import { facultyStats, courseStats } from './pce-analytics'

describe('facultyStats gating', () => {
  it('score is a ScoreCell, not a bare DualMean', () => {
    const stats = facultyStats()
    expect(stats.length).toBeGreaterThan(0)
    for (const s of stats) {
      expect(['value', 'pending', 'na']).toContain(s.score.state)
    }
  })

  it('sorts value-state rows best-first and sinks pending/na to the bottom', () => {
    const stats = facultyStats()
    const valueRows = stats.filter((s) => s.score.state === 'value')
    for (let i = 1; i < valueRows.length; i++) {
      const prev = valueRows[i - 1]!.score
      const cur = valueRows[i]!.score
      if (prev.state === 'value' && cur.state === 'value') {
        expect(prev.value.weighted).toBeGreaterThanOrEqual(cur.value.weighted)
      }
    }
    // every pending/na row comes after every value row
    const firstNonValueIndex = stats.findIndex((s) => s.score.state !== 'value')
    if (firstNonValueIndex !== -1) {
      expect(stats.slice(firstNonValueIndex).every((s) => s.score.state !== 'value')).toBe(true)
    }
  })
})

describe('courseStats gating', () => {
  it('score and facultyScore are both ScoreCells', () => {
    const stats = courseStats()
    expect(stats.length).toBeGreaterThan(0)
    for (const s of stats) {
      expect(['value', 'pending', 'na']).toContain(s.score.state)
      expect(['value', 'pending', 'na']).toContain(s.facultyScore.state)
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test lib/pce-analytics.test.ts`
Expected: FAIL — `s.score.state` is `undefined` (score is still a bare `DualMean`)

- [ ] **Step 3: Import `gatedScore` and `ScoreCell` at the top of `lib/pce-analytics.ts`**

```ts
import { gatedScore, type ScoreCell } from '@/lib/pce-score-cell'
```

- [ ] **Step 4: Update `FacultyStat` (lines 547-566) — change the `score` field type**

```ts
export interface FacultyStat {
  facultyId: string
  name: string
  initials: string
  /** Weighted headline + simple mean, both (D3 option C) — gated: Pending until every
   *  in-scope offering's survey has closed, 'na' if the person has no offerings in scope. */
  score: ScoreCell<DualMean>
  /** Enrollment-weighted response rate, 0–100. Pooled from closed/historical offerings
   *  only — Archived excluded, but NOT gated on full closure (PRD: different rule than score). */
  responseRate: number
  offerings: number
  courses: number
  terms: number
  avg1y: number | null
  avg3y: number | null
  drift: number | null
  ratings: number[]
}
```

- [ ] **Step 5: Rewrite `facultyStats()` (lines 602-642)**

```ts
export function facultyStats(term?: string, cohort?: string, role?: FacultyEvalRoleId): FacultyStat[] {
  const all = offeringPoints()
  const now = latestYear(all)
  const points = all.filter(
    (p) => (!term || p.term === term) && (!cohort || p.cohort === cohort) && (!role || p.evalRole === role),
  )
  const byFaculty = new Map<string, OfferingPoint[]>()
  points.forEach((p) => {
    const list = byFaculty.get(p.facultyId) ?? []
    list.push(p)
    byFaculty.set(p.facultyId, list)
  })

  return [...byFaculty.entries()]
    .map(([facultyId, offs]) => {
      // Response rate pools from closed/historical offerings, excludes Archived,
      // is NOT gated on full closure — a different rule than the score below.
      const countable = offs.filter((o) => o.surveyStatus !== 'archived')
      const enrolled = countable.reduce((s, o) => s + o.enrolled, 0)
      const responded = countable.reduce((s, o) => s + o.responded, 0)
      const own = all.filter((p) => p.facultyId === facultyId && (!role || p.evalRole === role))
      const avg1y = windowMean(own, now - 1, now)
      const avg3y = windowMean(own, now - 3, now)
      const score = gatedScore<DualMean>(
        offs,
        (o: OfferingPoint) => o.surveyStatus,
        (closed) => dualMean(closed.map((o) => o.avgRating), closed.map((o) => o.enrolled)),
      )
      return {
        facultyId,
        name: offs[0]!.facultyName,
        initials: offs[0]!.initials,
        score,
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        offerings: offs.length,
        courses: new Set(offs.map((o) => o.courseCode)).size,
        terms: new Set(offs.map((o) => o.term)).size,
        avg1y,
        avg3y,
        drift: avg1y != null && avg3y != null ? round2(avg1y - avg3y) : null,
        ratings: offs.map((o) => o.avgRating),
      }
    })
    .sort((a, b) => {
      // Pending/na sink to the bottom of a best-first sort — they can't be ranked by score.
      const av = a.score.state === 'value' ? a.score.value.weighted : -Infinity
      const bv = b.score.state === 'value' ? b.score.value.weighted : -Infinity
      return bv - av
    })
}
```

- [ ] **Step 6: Update `CourseStat` (lines 849-873) — `score` and `facultyScore` both become `ScoreCell<DualMean>`**

```ts
export interface CourseStat {
  courseCode: string
  courseName: string
  enrolled: number
  /** The COURSE-CONTENT score — gated: Pending until every in-scope offering's survey
   *  has closed, 'na' if this course has no content-scored offerings in scope. */
  score: ScoreCell<DualMean>
  /** The FACULTY-PERFORMANCE score for the same course — kept separate, same gating rule. */
  facultyScore: ScoreCell<DualMean>
  responseRate: number
  terms: number
  avg1y: number | null
  avg3y: number | null
  drift: number | null
  ratings: number[]
}
```

- [ ] **Step 7: Rewrite `courseStats()` (lines 890-930)**

```ts
export function courseStats(term?: string, cohort?: string): CourseStat[] {
  const all = offeringPoints()
  const now = latestYear(all)
  const points = all.filter((p) => (!term || p.term === term) && (!cohort || p.cohort === cohort))
  const byCourse = new Map<string, OfferingPoint[]>()
  points.forEach((p) => {
    const list = byCourse.get(p.courseCode) ?? []
    list.push(p)
    byCourse.set(p.courseCode, list)
  })

  return [...byCourse.entries()]
    .map(([courseCode, rows]) => {
      const countable = rows.filter((r) => r.surveyStatus !== 'archived')
      const enrolled = countable.reduce((s, r) => s + r.enrolled, 0)
      const responded = countable.reduce((s, r) => s + r.responded, 0)
      const own = all.filter((p) => p.courseCode === courseCode)
      const avg1y = windowMean(own, now - 1, now, 'courseAvg')
      const avg3y = windowMean(own, now - 3, now, 'courseAvg')

      const score = gatedScore<DualMean>(
        rows,
        (r: OfferingPoint) => r.surveyStatus,
        (closed) => {
          const content = closed.map((r) => r.courseAvg).filter((v): v is number => v != null)
          const contentWeights = closed.filter((r) => r.courseAvg != null).map((r) => r.enrolled)
          return content.length
            ? dualMean(content, contentWeights)
            : dualMean(closed.map((r) => r.avgRating), closed.map((r) => r.enrolled))
        },
      )
      const facultyScore = gatedScore<DualMean>(
        rows,
        (r: OfferingPoint) => r.surveyStatus,
        (closed) => dualMean(closed.map((r) => r.avgRating), closed.map((r) => r.enrolled)),
      )
      // ratings stays a plain array (used for min/max spread marks in charts) — pulled
      // from ALL rows' content scores where present, matching the score computation's shape.
      const content = rows.map((r) => r.courseAvg).filter((v): v is number => v != null)

      return {
        courseCode,
        courseName: rows[0]!.courseName,
        score,
        facultyScore,
        responseRate: enrolled > 0 ? Math.round((responded / enrolled) * 100) : 0,
        enrolled,
        terms: new Set(rows.map((r) => r.term)).size,
        avg1y,
        avg3y,
        drift: avg1y != null && avg3y != null ? round2(avg1y - avg3y) : null,
        ratings: content.length ? content : rows.map((r) => r.avgRating),
      }
    })
    .sort((a, b) => {
      const av = a.score.state === 'value' ? a.score.value.weighted : -Infinity
      const bv = b.score.state === 'value' ? b.score.value.weighted : -Infinity
      return bv - av
    })
}
```

- [ ] **Step 8: Fix `programSummary()` (lines 1174-1216) — it reads `fac`/`courses` from the now-changed functions**

```ts
// Replace these two lines (currently 1187-1188):
  const facultyMedian = medianOf(
    fac.map((f) => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map((s) => s.value.weighted),
  )
  const courseMedian = medianOf(
    courses.map((c) => c.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map((s) => s.value.weighted),
  )

// And these two lines (currently 1201-1202) — below-median counts only compare real values, per the spec's "Pending/— sit out" rule:
  facultyBelowThreshold: fac.filter((f) => f.score.state === 'value' && f.score.value.weighted < facultyMedian).length,
  coursesBelowThreshold: courses.filter((c) => c.score.state === 'value' && c.score.value.weighted < courseMedian).length,
```

- [ ] **Step 9: Fix `benchmarks()` (lines 1245-1259)**

```ts
export function benchmarks(departmentOf?: string): Benchmarks {
  const fac = facultyStats()
  const facultyById = new Map(MOCK_FACULTY.map((f) => [f.id, f]))

  const ownDept = departmentOf ? facultyById.get(departmentOf)?.department : undefined
  const deptPool = ownDept
    ? fac.filter((f) => facultyById.get(f.facultyId)?.department === ownDept)
    : fac

  // Benchmarks are a distribution of real scores — Pending/na faculty have nothing to
  // contribute to "where does the pack sit", same "sit out" rule as Below-Benchmark.
  const deptValues = deptPool.map((f) => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map((s) => s.value.weighted)
  const allValues = fac.map((f) => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map((s) => s.value.weighted)

  return {
    distribution: deptValues,
    department: deptValues.length ? round2(mean(deptValues)) : 0,
    university: allValues.length ? round2(mean(allValues)) : 0,
  }
}
```

- [ ] **Step 10: Run the Task 4 tests to verify they pass**

Run: `pnpm test lib/pce-analytics.test.ts`
Expected: PASS

- [ ] **Step 11: Confirm the rest of the codebase is now broken as expected (not a surprise later)**

Run: `pnpm tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: a large number (this is the ~90-call-site blast radius from Tasks 6-12) — this step is a checkpoint, not a fix. Do not attempt to fix any of these errors in this task.

- [ ] **Step 12: Commit**

```bash
git add lib/pce-analytics.ts lib/pce-analytics.test.ts
git commit -m "feat(pce): gate FacultyStat/CourseStat score with ScoreCell (breaks consumers, fixed in follow-up tasks)"
```

---

### Task 5: `ScoreCellText` — the shared render component

**Files:**
- Create: `components/pce/score-cell.tsx`
- Test: `components/pce/score-cell.test.tsx`

**Interfaces:**
- Consumes: `ScoreCell<T>` (Task 1)
- Produces: `ScoreCellText({ cell, format }): JSX.Element`

- [ ] **Step 1: Write the failing test**

```tsx
// components/pce/score-cell.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreCellText } from './score-cell'

describe('ScoreCellText', () => {
  it('renders the formatted value when state is value', () => {
    render(<ScoreCellText cell={{ state: 'value', value: 4.19 }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('4.19')).toBeInTheDocument()
  })

  it('renders "Pending" when state is pending', () => {
    render(<ScoreCellText cell={{ state: 'pending' }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders an em dash when state is na', () => {
    render(<ScoreCellText cell={{ state: 'na' }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test components/pce/score-cell.test.tsx`
Expected: FAIL — `Cannot find module './score-cell'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/pce/score-cell.tsx
'use client'

import type { ScoreCell } from '@/lib/pce-score-cell'

export function ScoreCellText({
  cell,
  format,
}: {
  cell: ScoreCell<number>
  format: (value: number) => string
}) {
  if (cell.state === 'value') return <span className="tabular-nums">{format(cell.value)}</span>
  if (cell.state === 'pending') return <span className="italic text-muted-foreground">Pending</span>
  return <span className="text-muted-foreground">—</span>
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test components/pce/score-cell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/pce/score-cell.tsx components/pce/score-cell.test.tsx
git commit -m "feat(pce): add ScoreCellText shared render component"
```

---

### Task 6: Migrate `components/pce/analytics-panels.tsx`

**Files:**
- Modify: `components/pce/analytics-panels.tsx`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` on `FacultyStat.score`/`CourseStat.score`/`CourseStat.facultyScore` (Task 4), `ScoreCellText` (Task 5)

Every line below reads `.score.weighted`/`.score.simple`/`.facultyScore.weighted` and needs one of two transformations. Apply the matching one at each line:

**Pattern A — median/comparison calculations** (feed `medianOf`, filter below-median, compute a spread): use only `state === 'value'` rows, matching the "Pending/— sit out" rule.

```ts
// Before (line 432-433):
    course: medianOf(courseStats().map(c => c.score.weighted)),
    faculty: medianOf(facultyStats().map(f => f.score.weighted)),
// After:
    course: medianOf(courseStats().map(c => c.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
    faculty: medianOf(facultyStats().map(f => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
```

Apply this same "filter to `state === 'value'`, then `.value.weighted`" pattern at lines: 552-553, 1477, 1550 (median/comparison calculations feeding `medianOf`).

Import `DualMean` type at the top of the file if not already present: `import type { DualMean } from '@/lib/pce-analytics'`.

**Pattern B — direct display in a KPI tile, table cell, or Leo insight string**: render via `ScoreCellText`, or when the surrounding context is a plain string template (Leo insight `headline`/`explanation`/`bullets`), unwrap explicitly with a `state === 'value'` guard and write "Pending" or "—" into the string by hand (Leo insights are plain strings, not JSX — `ScoreCellText` doesn't apply there).

For the JSX table-cell/KPI sites (lines 1007, 1026, 1057, 1076, 1355, 1567, 1742-1743, 1766-1767, 1786-1787):

```tsx
// Before (e.g. line 1742):
                      {f.score.weighted.toFixed(2)}
                      {f.score.weighted < courseFacultyMedian && (
// After:
                      <ScoreCellText cell={f.score.state === 'value' ? { state: 'value', value: f.score.value.weighted } : f.score} format={(v) => v.toFixed(2)} />
                      {f.score.state === 'value' && f.score.value.weighted < courseFacultyMedian && (
```

Add the import: `import { ScoreCellText } from '@/components/pce/score-cell'`.

For the Leo-insight string sites (lines 1506, 1518-1519 — `courseFacultyLeo`'s spread calculation and bullets): guard with `.state === 'value'` before computing the spread; if either `best` or `worst` faculty in that comparison has a non-value score, skip them from the ranked list feeding `courseFacultyLeo` entirely (the insight already only names the extremes of a sorted-by-value list — Pending/na rows sorted to the bottom via Task 4's comparator won't be `best`, but could be `worst`; explicitly filter the list to `state === 'value'` rows before computing `best`/`worst`).

- [ ] **Step 1: Make each transformation above, matching the line numbers from the grep at the start of this session**

- [ ] **Step 2: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "analytics-panels.tsx"`
Expected: no output

- [ ] **Step 3: Visual check — By Faculty, By Course, By Term tabs still render their KPI tiles, tables, and leaderboards with real numbers (mock data has no live Pending state by default, so this is a no-regression check, not a Pending-rendering check)**

Start the dev server (`pnpm dev` in `apps/pce/admin`), navigate to `/analytics`, click through all three tabs, confirm no console errors and all numbers render as before.

- [ ] **Step 4: Commit**

```bash
git add components/pce/analytics-panels.tsx
git commit -m "feat(pce): migrate analytics-panels.tsx to ScoreCell"
```

---

### Task 7: Migrate `components/pce/faculty-leaderboard-section.tsx`

**Files:**
- Modify: `components/pce/faculty-leaderboard-section.tsx`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4), `ScoreCellText` (Task 5)

Same two patterns as Task 6, applied at:

- Line 95 (`medianOf(faculty.map((f) => f.score.weighted))`) — Pattern A.
- Line 159 (`faculty.filter((f) => f.score.weighted < median)`) — Pattern A (filter to `state === 'value'` first).
- Lines 176, 181, 183, 187 (Leo insight strings for `leaderLeo`) — Pattern B's string-guard variant. Line 162-169's `widest` calculation (spread across `.ratings`, unrelated to `.score`) is unaffected — do not touch.
- Line 245 (`leaderAnchor` — `{ x: lowest.score.weighted, y: lowest.name }`) — guard: if `lowest.score.state !== 'value'`, the anchor should be `undefined` (no anchor to draw), matching the existing `lowest ? {...} : undefined` ternary's own null-handling style.
- Lines 374-375, 422-423, 436-437 (table cells) — Pattern B's JSX variant with `ScoreCellText`.
- Lines 496-497 (`EntityTrendExplorer` entity list — `value`/`sortValue`) — `value` becomes a `ScoreCellText`-rendered string is wrong here since `EntityTrendExplorer` expects a plain string; instead compute `value: f.score.state === 'value' ? fmt2(f.score.value.weighted) : f.score.state === 'pending' ? 'Pending' : '—'` inline, and `sortValue: f.score.state === 'value' ? f.score.value.weighted : -Infinity` (matching Task 4's sort-sink convention, so Pending/na entities sort to the bottom of the explorer's list too).

- [ ] **Step 1: Make each transformation above**

- [ ] **Step 2: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "faculty-leaderboard-section.tsx"`
Expected: no output

- [ ] **Step 3: Visual check — By Faculty tab's leaderboard, "Scores over time" card, and Expand dialogs still render correctly**

- [ ] **Step 4: Commit**

```bash
git add components/pce/faculty-leaderboard-section.tsx
git commit -m "feat(pce): migrate faculty-leaderboard-section.tsx to ScoreCell"
```

---

### Task 8: Migrate `components/pce/analytics-plots.tsx`

**Files:**
- Modify: `components/pce/analytics-plots.tsx`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4)

Chart marks need raw numbers, not `ScoreCell`s — per the spec, Pending/na rows are **filtered out before the mark data is built**, not plotted as 0 (matching this file's own existing principle for null `drift` values in `DriftDumbbell`).

- Lines 140, 145, 149-150, 175 (`FacultyLeaderboardDots`, takes `FacultyStat[]` directly as `faculty` prop): the component receives `FacultyStat[]` from its caller — filter to `state === 'value'` **at the call site** (in `faculty-leaderboard-section.tsx`/`analytics-panels.tsx`, already being migrated in Tasks 6-7) before passing to `FacultyLeaderboardDots`, so this component's own internals barely change: update the four accessor lines to read `.score.value.weighted`/`.score.value.simple` (safe post-filter) instead of `.score.weighted`/`.score.simple`. Do NOT filter inside this file — it has no knowledge of the tri-state cell's meaning, callers do.

Actually — simpler and more contained: keep `FacultyLeaderboardDots`'s prop type as `FacultyStat[]` unchanged, and inside this file, filter+map to a local `{ ...FacultyStat, score: DualMean }[]` shape at the top of the component body, before the `spec` callback:

```ts
// Inside FacultyLeaderboardDots, before the `spec` useCallback:
const plottable = React.useMemo(
  () => faculty.filter((f): f is typeof f & { score: { state: 'value'; value: DualMean } } => f.score.state === 'value'),
  [faculty],
)
```

Then replace every `d.score.weighted`/`d.score.simple` inside this component's marks (lines 140, 145, 149-150, 175) with `d.score.value.weighted`/`d.score.value.simple`, and replace the component's data source (wherever `faculty`/`rows` is passed into `Plot.dot(...)` etc.) with `plottable`.

- Line 743 (`faculty.map((f) => ({ name: f.name, score: f.score.weighted }))`, inside `FacultyScoreStrip`): same filter-then-map approach — `faculty.filter(f => f.score.state === 'value').map(f => ({ name: f.name, score: f.score.value.weighted }))`.

- Line 1888 (`[...courses].sort((a, b) => a.score.weighted - b.score.weighted).slice(0, limit)`, inside `CourseRankDots`): filter first, then sort — `courses.filter(c => c.score.state === 'value').sort((a, b) => a.score.value.weighted - b.score.value.weighted).slice(0, limit)`.
- Lines 1914, 1917, 1922-1923, 1937 (same `CourseRankDots`, now operating on the filtered+sorted `ranked` array from the line above): change `d.score.weighted`/`d.score.simple` to `d.score.value.weighted`/`d.score.value.simple` — safe, since `ranked` is now guaranteed all-`value`-state after the Step above's filter.

- [ ] **Step 1: Make each transformation above**

- [ ] **Step 2: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "analytics-plots.tsx"`
Expected: no output

- [ ] **Step 3: Visual check — the faculty leaderboard dot plot, faculty score strip, and "Courses scoring lowest" dot plot on Overview all render with the same marks as before (mock data has no Pending rows, so counts/positions should be identical to pre-change)**

- [ ] **Step 4: Commit**

```bash
git add components/pce/analytics-plots.tsx
git commit -m "feat(pce): migrate analytics-plots.tsx chart marks to filter ScoreCell before plotting"
```

---

### Task 9: Migrate `components/pce/analytics-overview-panel.tsx`

**Files:**
- Modify: `components/pce/analytics-overview-panel.tsx`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4), `ScoreCellText` (Task 5)

Same two patterns as Task 6, applied at:

- Line 111 (`[...courses].sort(...).slice(0, COURSE_RANK_LIMIT)`) — filter to `state === 'value'` before sort, same as Task 8's `CourseRankDots` fix.
- Line 115 (`medianOf(courses.map((c) => c.score.weighted))`) — Pattern A.
- Lines 307, 314, 318, 320, 323 (Leo insight strings) — Pattern B string-guard variant; the `courses` array feeding this is already the filtered-and-sorted `ranked`-equivalent from line 111's fix, so `worst`/`below` derived from it are already guaranteed `state === 'value'` — no extra guard needed at these specific lines once line 111 is fixed first.
- Lines 353, 357, 370, 374 (`summary.facultyScore` — this is `ProgramSummary.facultyScore`, which is a **plain `DualMean`, not a `ScoreCell`** per Task 4 Step 8/9's fix to `programSummary()` — confirm `programSummary()`'s `facultyScore`/`courseScore` fields were left as plain `DualMean` in Task 4, computed directly from `offeringPoints()` via `dualMean()`, NOT derived from `facultyStats()`/`courseStats()`'s gated score. If so, **these lines need no change** — verify against Task 4's actual `programSummary()` diff before touching this file.)
- Line 400 (`courses.map((c) => [...fmt2(c.score.weighted)...])`) — this `courses` is the same filtered array from line 111's fix if in the same scope; otherwise apply Pattern A/B as appropriate — read the surrounding code to confirm which `courses` variable is in scope at this line before editing.
- Lines 588-589, 602-603 (table cells) — Pattern B JSX variant.

- [ ] **Step 1: Read lines 100-120 and 340-410 fully first, to confirm which `courses`/`faculty` variable is in scope at each site before making changes (this file has multiple derived arrays with similar names — do not guess from line number alone)**

- [ ] **Step 2: Make each transformation, using the confirmed scope from Step 1**

- [ ] **Step 3: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "analytics-overview-panel.tsx"`
Expected: no output

- [ ] **Step 4: Visual check — Overview tab's KPI cards, "Courses scoring lowest," and course/faculty tables render unchanged**

- [ ] **Step 5: Commit**

```bash
git add components/pce/analytics-overview-panel.tsx
git commit -m "feat(pce): migrate analytics-overview-panel.tsx to ScoreCell"
```

---

### Task 10: Migrate `components/pce/faculty-portfolio-charts.tsx`

**Files:**
- Modify: `components/pce/faculty-portfolio-charts.tsx`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4), `ScoreCellText` (Task 5)

- [ ] **Step 1: Read lines 1-110 to confirm what `courseRank` is (its source — `courseFacultyStats()` or `courseStats()`?)**

This matters: if `courseRank` comes from `facultyCourseStats()` (out of scope per Global Constraints — untouched, still plain `DualMean`), lines 55, 92, 96-97, 101, 105 need **no changes**. If it comes from `courseStats()` (in scope), apply Pattern A/B as in Task 6. Confirm before editing — do not assume from this plan's earlier grep output alone.

- [ ] **Step 2: Apply the confirmed transformation to lines 55, 92, 96-97, 101, 105, 235, 259-260, 273-274**

- [ ] **Step 3: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "faculty-portfolio-charts.tsx"`
Expected: no output

- [ ] **Step 4: Visual check — By Faculty's selected-person portfolio charts (course rank, benchmark distribution) render unchanged**

- [ ] **Step 5: Commit**

```bash
git add components/pce/faculty-portfolio-charts.tsx
git commit -m "feat(pce): migrate faculty-portfolio-charts.tsx to ScoreCell (or confirm no change needed)"
```

---

### Task 11: Migrate `components/pce/analytics-survey-details.tsx`

**Files:**
- Modify: `components/pce/analytics-survey-details.tsx:153-154`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4)

```ts
// Before:
      medianOf(courseStats().map(c => c.score.weighted)),
      medianOf(facultyStats().map(f => f.score.weighted)),
// After (Pattern A):
      medianOf(courseStats().map(c => c.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
      medianOf(facultyStats().map(f => f.score).filter((s): s is { state: 'value'; value: DualMean } => s.state === 'value').map(s => s.value.weighted)),
```

- [ ] **Step 1: Make the change, import `DualMean` type if not already present**

- [ ] **Step 2: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "analytics-survey-details.tsx"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add components/pce/analytics-survey-details.tsx
git commit -m "feat(pce): migrate analytics-survey-details.tsx to ScoreCell"
```

---

### Task 12: Migrate `app/(app)/analytics/page.tsx`

**Files:**
- Modify: `app/(app)/analytics/page.tsx:201`

**Interfaces:**
- Consumes: `ScoreCell<DualMean>` (Task 4)

```ts
// Before (selectedFacultyAvg, line ~200-202):
  const selectedFacultyAvg = useMemo(() => {
    const stat = facultyStats().find(f => f.facultyId === selectedFacultyId)
    return stat ? stat.score.weighted : null
  }, [selectedFacultyId])
// After — selectedFacultyAvg's consumer (FacultyPortfolioCharts' avgRating prop) already accepts `number | null`, so Pending/na naturally becomes null, same as "no stat found":
  const selectedFacultyAvg = useMemo(() => {
    const stat = facultyStats().find(f => f.facultyId === selectedFacultyId)
    return stat && stat.score.state === 'value' ? stat.score.value.weighted : null
  }, [selectedFacultyId])
```

- [ ] **Step 1: Make the change**

- [ ] **Step 2: Run `tsc --noEmit` scoped to this file**

Run: `pnpm tsc --noEmit 2>&1 | grep "app/(app)/analytics/page.tsx"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/analytics/page.tsx"
git commit -m "feat(pce): migrate analytics/page.tsx to ScoreCell"
```

---

### Task 13: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `pnpm tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: all pass, including every test written in Tasks 1, 3, 4, 5

- [ ] **Step 3: Clear `.next` cache and start the dev server clean** (per this workspace's own known-issue pattern — stale Turbopack cache after a large type change can produce phantom 500s)

```bash
rm -rf apps/pce/admin/.next
cd apps/pce/admin && pnpm dev
```

- [ ] **Step 4: Live-browser check — all three analytics tabs, no console errors, no visual regression**

Navigate to `/analytics`, click through Overview, By Faculty, By Course, By Term. Confirm: every score that previously showed a number still shows the same number (mock data has no in-progress-term Pending rows by default, so this is purely a no-regression check); no "Pending"/"—" appears where a number used to (would indicate a gating bug, since the mock fixture's default state has nothing genuinely pending).

- [ ] **Step 5: Grep-verify no stray `.score.weighted`/`.score.simple`/`.facultyScore.weighted` reads remain outside the explicitly-out-of-scope files**

```bash
grep -rn "\.score\.weighted\|\.score\.simple\|\.facultyScore\.weighted\|\.facultyScore\.simple" --include="*.tsx" --include="*.ts" . | grep -v ".next" | grep -v node_modules
```

Expected: every remaining hit is inside `facultyCourseStats()`/`courseFacultyStats()` themselves (`lib/pce-analytics.ts` lines ~686, 1020) or their consumers reading `FacultyCourseStat`/`CourseFacultyStat` (out of scope, untouched) — cross-check each hit's surrounding type before treating any as a miss.

- [ ] **Step 6: `state-review` gate — confirm the three cell states (value/pending/na) are each reachable and render distinctly**

Per this workspace's governance, spawn the `state-review` subagent (or manually verify) against `components/pce/score-cell.tsx` and its call sites in Tasks 6-12, confirming the empty/pending/value states match `docs/governance/component-state-catalog.md`'s conventions.

- [ ] **Step 7: Final commit (if Steps 5-6 required any fixes) or confirm nothing further to commit**

```bash
git status
# if clean, this task is done; if Step 5/6 required fixes, commit them here
```
