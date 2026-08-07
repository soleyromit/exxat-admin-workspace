'use client'

// COMPARE ROUTE (throwaway — delete once a direction is picked, same
// lifecycle as /compare/push-step2-simplify and its siblings).
//
// Round 2 on Step 2's accordion row (2026-08-04, later same day). The
// table-level structure (accordion rows, segmented filter, 6-column
// collapsed grid) is already shipped in the real wizard. Romit's critique of
// the shipped row's expanded panel: whitespace wasn't used well, no
// secondary actions were surfaced there, no switch-consequence preview, no
// creative layout for evaluatees, and the collapsed row shows nothing about
// which template/faculty are actually selected without opening it.
//
// Four structurally different answers, each grounded in real Mobbin
// screens (not metadata guesses) and built against the SAME shared harness
// (_shared.tsx — same 6 real offerings, same real expandInstances engine,
// same interactive state shape) so the comparison is apples-to-apples:
//
//   ?v=1  CHIP PREVIEW    — collapsed row gets a template Badge chip + a
//                           tight non-overlapping avatar cluster, so state
//                           is readable before expanding. Analogy: ClickUp
//                           task row (label chips + assignee avatar visible
//                           collapsed), Asana flat-list assignee avatars.
//   ?v=2  CARD ROSTER     — evaluatees render as a responsive card grid
//                           (avatar/glyph + name/role + checkbox per card)
//                           instead of a plain list; switching template
//                           stages the choice and shows an inline
//                           consequence diff (reusing the real S2 dialog's
//                           proven copy voice) before committing. Analogy:
//                           Aboard's card-per-item toggle rows.
//   ?v=3  TOOLBAR SPLIT   — a persistent action toolbar (Preview, Reset,
//                           Remove) at the top of the expanded panel, then a
//                           narrow Template rail beside a wide Evaluatees
//                           pane with a real CommandInput filter. Analogy:
//                           Mercury transaction detail (top action row +
//                           structured fields), Airwallex card actions bar.
//   ?v=4  TWO-LINE ROW    — the collapsed row becomes two lines: the
//                           existing triage line, plus a read-only preview
//                           line (template chip + avatar cluster) so
//                           reading needs zero clicks; expanding is only for
//                           editing. Analogy: ClickUp/inbox-style two-line
//                           rows (subject + preview snippet).
//
// All four pull the same 6 offerings from _shared.tsx via
// useStep2RowDetailDemo() — no shared React state between tabs, each mounts
// fresh.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import VariantChipPreview from './variant-1-chip-preview'
import Variant2CardRoster from './variant-2-card-roster'
import Variant3ToolbarSplit from './variant-3-toolbar-split'
import VariantTwoLineRow from './variant-4-two-line-row'

type VariantKey = '1' | '2' | '3' | '4'

const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: '1', label: '1 · Chip preview', sub: 'Template + faculty chips visible before expanding' },
  { key: '2', label: '2 · Card roster', sub: 'Evaluatees as cards; staged template swap shows a consequence diff' },
  { key: '3', label: '3 · Toolbar + split', sub: 'Action toolbar up top, Template rail beside a filterable Evaluatees pane' },
  { key: '4', label: '4 · Two-line row', sub: 'Read-only preview line always visible; expand is edit-only' },
]

function CompareInner() {
  const params = useSearchParams()
  const initial = (params?.get('v') as VariantKey | null) ?? '1'
  const [active, setActive] = useState<VariantKey>(
    VARIANTS.some(v => v.key === initial) ? initial : '1',
  )

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 accordion row — four detail-panel variants</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (6 offerings, Fall 2026–2027), same shipped collapsed-row shape — four different answers for what the expanded panel shows and how. None of these are wired into the production wizard.
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
        {active === '1' && <VariantChipPreview />}
        {active === '2' && <Variant2CardRoster />}
        {active === '3' && <Variant3ToolbarSplit />}
        {active === '4' && <VariantTwoLineRow />}
      </div>
    </div>
  )
}

export default function PushStep2RowDetailComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  )
}
