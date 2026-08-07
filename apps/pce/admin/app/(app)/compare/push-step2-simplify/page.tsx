'use client'

// COMPARE ROUTE (throwaway — delete once a variant is picked, same lifecycle
// as /compare/push-survey-design and its siblings).
//
// Aug 3 round — Step 2 ("Survey design") shipped a full rewrite that Gate 2
// passed statically, then a live-browser audit + a follow-up simplification
// pass both landed, and it STILL reads as "too complicated" (Romit, direct).
// Rather than iterate the same row shape again, this round tries six
// structurally different answers, each grounded in a real product analogy
// (two Mobbin passes, Aug 3):
//
//   ?v=a  DETAIL RAIL     — the list stays trivially simple (checkbox · course
//                           · one status indicator · template); every course's
//                           full evaluatee/gap/conflict detail moves into a
//                           side panel revealed on selection. Analogy:
//                           Mixpanel event list + slide-over, Asana task
//                           detail panel.
//   ?v=b  GROUPED STATUS  — courses sorted into Blocked / Needs faculty /
//                           Ready sections; because the section already says
//                           WHY a row is there, each row stays minimal (no
//                           repeated "1 conflict" pill). Ready collapses by
//                           default. Analogy: Linear issue list, Asana/ClickUp
//                           grouped views.
//   ?v=c  TWO-PHASE       — a genuinely simple 5-column confirm table for
//                           every course; only the minority that actually
//                           need a decision get a "Resolve" action opening a
//                           focused per-course Sheet, where the full
//                           complexity lives. Analogy: Deel's "Assign workers
//                           to course" (select, then configure), Toggl
//                           Track's select-rows + bottom bulk-action bar.
//   ?v=d  COVERAGE GRID   — courses × evaluatee-criteria matrix; glyph cells
//                           (check/gap/lock/dash), column headers carry
//                           aggregate counts ("3 unstaffed"), click a cell for
//                           a popover. The only variant that answers "is this
//                           a course problem or a role problem?" without any
//                           interaction. Analogy: StackAI/Workable/Vanta
//                           permissions-matrix admin tables.
//   ?v=e  REAL DATATABLE  — leans fully into this app's canonical, governed
//                           DataTable component (native sort/filter/selection/
//                           bulk-actions) instead of hand-rolled rows; no
//                           built-in row expansion, so detail rows are
//                           injected into the data array and kept adjacent via
//                           a stable sort. Tests whether the real component
//                           beats three rounds of hand-rolled attempts.
//   ?v=f  FLAT + FILTERED — one table, ALWAYS course-code order (never
//                           regrouped), a Luma/Linear-style segmented filter
//                           (All / Needs attention / Blocked) narrows what's
//                           visible without reordering anything, and a
//                           severity-distinct Status badge renders on every
//                           row regardless of filter. Fixes B's "which
//                           section is this course in" and C's "Needs
//                           attention hides whether it's actually blocked."
//
// All six pull the SAME real fixture data (MOCK_COURSE_OFFERINGS, real
// templates/surveys via usePce(), the real expandInstances/
// roleOverlapConflicts engine) scoped to Fall 2026–2027, with one offering
// (DPT-510/co13) locally augmented with a synthetic Live survey so every
// variant can demonstrate all three states (ready/gap/conflict) without
// touching shared fixture data. Each variant is fully self-contained — no
// shared state between tabs.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import VariantDetailRail from './variant-a-detail-rail'
import VariantGroupedStatus from './variant-b-grouped-status'
import VariantTwoPhase from './variant-c-two-phase'
import VariantCoverageGrid from './variant-d-coverage-grid'
import VariantRealDataTable from './variant-e-real-datatable'
import VariantFlatFiltered from './variant-f-flat-filtered'
import VariantQuietTable from './variant-g-quiet-table'

type VariantKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: 'a', label: 'A · Detail rail', sub: 'Minimal list, full detail on select' },
  { key: 'b', label: 'B · Grouped by status', sub: 'Blocked / Needs faculty / Ready' },
  { key: 'c', label: 'C · Two-phase', sub: 'Confirm table, then resolve per-course' },
  { key: 'd', label: 'D · Coverage grid', sub: 'Courses by roles matrix, glyph cells, popover detail' },
  { key: 'e', label: 'E · Real DataTable', sub: 'Governed DataTable: native sort/filter/selection, expandable detail rows' },
  { key: 'f', label: 'F · Flat + filtered', sub: 'One fixed-order table, segmented status filter, always-visible severity badges' },
  { key: 'g', label: 'G · Quiet table', sub: 'Flat + filtered, but rows only open when there’s a gap or conflict to review' },
]

function CompareInner() {
  const params = useSearchParams()
  const initial = (params?.get('v') as VariantKey | null) ?? 'g'
  const [active, setActive] = useState<VariantKey>(
    VARIANTS.some(v => v.key === initial) ? initial : 'g',
  )

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 — six simplification variants</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (Fall 2026–2027), six different structures. Pick one to carry forward — none of these are wired into the production wizard.
        </p>
      </div>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {VARIANTS.map(v => (
          <Button
            key={v.key}
            variant={active === v.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActive(v.key)}
          >
            {v.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        {VARIANTS.find(v => v.key === active)?.sub}
      </p>
      <div>
        {active === 'a' && <VariantDetailRail />}
        {active === 'b' && <VariantGroupedStatus />}
        {active === 'c' && <VariantTwoPhase />}
        {active === 'd' && <VariantCoverageGrid />}
        {active === 'e' && <VariantRealDataTable />}
        {active === 'f' && <VariantFlatFiltered />}
        {active === 'g' && <VariantQuietTable />}
      </div>
    </div>
  )
}

export default function PushStep2SimplifyComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  )
}
