'use client'

// COMPARE ROUTE (throwaway — delete once a variant is picked, same lifecycle
// as /compare/push-step2-simplify and its siblings).
//
// Aug 19 2026 — after 11 same-day live-feedback rounds on the term-card
// row-action affordance (see term-breakdown.tsx's own header comment),
// Romit asked for a step back: not another incremental pass on the same
// row shape, but genuinely different visual/UI/UX paradigms for the whole
// Last/Current/Upcoming triptych, each grounded in the real storytelling
// job of its card (retrospective / active-monitoring / readiness) and each
// reusing the SAME real data + business logic (pce-term-metrics.ts) rather
// than inventing numbers. Four directions, each built independently by an
// Opus-model agent:
//
//   ?v=a  NARRATIVE      — one composed sentence per card is the headline;
//                          numbers are evidence inside the sentence, not a
//                          separate stat block. Leans on this app's own
//                          liveNarrative/closedNarrative sentence-composers.
//   ?v=b  WIDGET-DENSE   — pushes the Vanta/HubSpot compliance-widget
//                          language further than production: bold leading
//                          numbers, muted footer counts, real DS
//                          CardSection modules. Deliberately keeps the
//                          "no bar on a checklist metric" rule — only the
//                          one genuine in-flight metric (response rate)
//                          gets a progress bar.
//   ?v=c  MINIMAL        — radical reduction: one dominant number, one
//                          primary action per card, everything else
//                          deferred to the term workspace page. The most
//                          direct answer to "buttons are asking for too
//                          much attention" — fewer objects, not quieter ones.
//   ?v=d  AI-FORWARD     — a Leo-style recommendation (computed from real
//                          at-risk/coverage data, never fabricated) leads
//                          the card; raw facts become supporting evidence
//                          in a visually distinct "data lane" (ADR-005).
//
// All four pull the SAME real fixture data via usePce(), mirror
// dashboard-home.tsx's own classifyTermWindow-based term-slot selection
// exactly, and reuse pce-term-metrics.ts for every number — only the card
// anatomy differs. Each variant is fully self-contained — no shared state
// between tabs, no production file touched.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import VariantNarrative from './variant-a-narrative'
import VariantWidgetDense from './variant-b-widget-dense'
import VariantMinimal from './variant-c-minimal'
import VariantAiForward from './variant-d-ai-forward'

type VariantKey = 'a' | 'b' | 'c' | 'd'

const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: 'a', label: 'A · Narrative', sub: 'One composed sentence leads each card; numbers are evidence inside it' },
  { key: 'b', label: 'B · Widget-dense', sub: 'Vanta/HubSpot-style modules — bold numbers, muted footer counts' },
  { key: 'c', label: 'C · Minimal', sub: 'One dominant number, one action — everything else deferred to the workspace' },
  { key: 'd', label: 'D · AI-forward', sub: 'A Leo-style recommendation leads; raw facts sit in a distinct data lane' },
]

function CompareInner() {
  const params = useSearchParams()
  const initial = (params?.get('v') as VariantKey | null) ?? 'a'
  const [active, setActive] = useState<VariantKey>(
    VARIANTS.some((v) => v.key === initial) ? initial : 'a',
  )

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Dashboard term cards — four variants</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (Fall 2025 / Spring 2026 / Fall 2026), four different visual/UX paradigms. Pick one to carry forward — none of these are wired into the production dashboard.
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
        {active === 'a' && <VariantNarrative />}
        {active === 'b' && <VariantWidgetDense />}
        {active === 'c' && <VariantMinimal />}
        {active === 'd' && <VariantAiForward />}
      </div>
    </div>
  )
}

export default function DashboardCardsComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  )
}
