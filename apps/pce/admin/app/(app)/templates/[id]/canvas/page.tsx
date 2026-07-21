'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (variant 1 of 3, iteration 2) — "worksheet": the
// template as one dense numbered sheet with sticky aspect band headers and
// inline type labels; upload lives in the band header as "Generate from
// document". Compare against /templates/[id] and its /document + /focus
// siblings. (Route path kept stable across iterations.)
export default function TemplateWorksheetComparePage() {
  return <TemplateEditor variant="worksheet" />
}
