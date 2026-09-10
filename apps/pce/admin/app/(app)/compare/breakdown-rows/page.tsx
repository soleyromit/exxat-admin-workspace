'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/dashboard-cards).
//
// Aug 20 2026 — Romit asked for row-list-only variants after production's
// term-breakdown.tsx (10 same-day passes on Aug 19) still read as "trouble
// going through each row" and was missing a card-footer status distribution.
//
// Round 1 (variant-a..d) — four directions, each changing one thing about
// BreakdownRow's anatomy. Rejected: "same font size... no proper
// illustration... awful flat design, without proper color usage."
//
// Round 2 (variant-e) — a real four-tier type scale on top of round 1's
// structure. Still flat/timid on color; not shown by default below.
//
// Round 3 — before writing more TSX blind, drafted real visual references as
// a hi-fi Claude Design canvas (exact CSS: gradients, tinted surfaces,
// illustrated icon tiles, a vivid KPI-tile grid), grounded in Mobbin
// research (Vapi, Basecamp, Trello) and this app's own DS tokens. Romit
// rejected the fourth "editorial" direction and asked for the other three in
// the real app — variant-f/g/h are literal translations of that canvas.
//
// Round 3a — Romit flagged the first f/g/h pass: "colors aren't matching DS
// colors." True — variant-g's tile gradients used invented oklch literals
// and `color-mix(in oklch` instead of real tokens. Fixed: every color in
// f/g/h now traces to a LIST_HUB_STATUS_TINT_* value or a var(--token), no
// exceptions, grepped clean.
//
// Round 3b — "I need more variants." Two more, each a genuinely different
// axis (not another palette on the same layout):
//
//   ?v=f  TINTED SURFACES  — gradient-tinted hero, warm Setup-group surface,
//                            34px solid state discs, hover-reveal overflow.
//   ?v=g  VIVID TILE GRID  — each present bucket becomes a saturated KPI
//                            tile with a mini progress ring; one detail
//                            panel for the bucket that needs a decision.
//   ?v=h  ILLUSTRATED      — 48-52px two-tone icon tiles, dotted-texture
//                            hero, a celebratory spark on fully-closed.
//   ?v=i  PIPELINE NODES   — the four buckets render as a connected chain of
//                            FIXED-size nodes (never proportional — that
//                            would be the banned segmented-bar pattern),
//                            answering "where is this term right now"
//                            before "what's in each bucket."
//   ?v=j  MONOCHROME       — the opposite bet from g: near-everything in
//                            ink/gray, color spent on exactly one thing —
//                            the row that needs a decision. Quiet-confidence
//                            alternative, not a return to the rejected
//                            editorial prose direction.
//
// variant-a..e stay on disk (not in the tab list) as the round-1/2 record.
// All five current variants apply the same content fix: a fully-closed
// bucket says "All evaluations closed" (the outcome), never "13 of 13
// closed" (a fraction that already resolved to 100%) — and add the
// card-footer status distribution production never had.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import VariantTintedSurfaces from './variant-f-tinted-surfaces'
import VariantVividTiles from './variant-g-vivid-tiles'
import VariantIllustrated from './variant-h-illustrated'
import VariantPipeline from './variant-i-pipeline'
import VariantMonochrome from './variant-j-monochrome'

type VariantKey = 'f' | 'g' | 'h' | 'i' | 'j'

const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: 'f', label: 'F · Tinted surfaces', sub: 'Gradient-tinted hero + warm Setup-group surface, solid state discs, hover-reveal overflow' },
  { key: 'g', label: 'G · Vivid tile grid', sub: 'Saturated KPI tiles per bucket with a mini progress ring; one detail panel for the thing that needs a decision' },
  { key: 'h', label: 'H · Illustrated', sub: '48-52px two-tone icon tiles, dotted-texture hero, a celebratory spark on the fully-closed state' },
  { key: 'i', label: 'I · Pipeline nodes', sub: 'The four buckets as a connected chain of fixed-size nodes — where the term is right now, not just a list' },
  { key: 'j', label: 'J · Monochrome', sub: 'Ink/gray throughout; color spent on exactly one thing — the row that needs a decision' },
]

function CompareInner() {
  const params = useSearchParams()
  const initial = (params?.get('v') as VariantKey | null) ?? 'f'
  const [active, setActive] = useState<VariantKey>(
    VARIANTS.some((v) => v.key === initial) ? initial : 'f',
  )

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Term-card breakdown rows — visual directions</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (Fall 2025 / Spring 2026 / Fall 2026), five visual directions. Pick one to carry
          forward — none of these are wired into the production dashboard.
        </p>
      </div>
      <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
        {VARIANTS.map((v) => (
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
        {VARIANTS.find((v) => v.key === active)?.sub}
      </p>
      <div>
        {active === 'f' && <VariantTintedSurfaces />}
        {active === 'g' && <VariantVividTiles />}
        {active === 'h' && <VariantIllustrated />}
        {active === 'i' && <VariantPipeline />}
        {active === 'j' && <VariantMonochrome />}
      </div>
    </div>
  )
}

export default function BreakdownRowsComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  )
}
