'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (variant 1 of 5, iteration 3) — "bands": sticky aspect
// band headers carry identity + actions; upload lives in the band header as
// "Generate from document". Section cards are the standard builder cards.
// (Route path kept stable across iterations.)
export default function TemplateBandsComparePage() {
  return <TemplateEditor variant="bands" />
}
