'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (Jul 21, variant 2 of 3) — the builder reads as the
// questionnaire document: one centered column, sticky aspect chips, no side
// rail. Compare against /templates/[id] and its /canvas + /focus siblings.
export default function TemplateDocumentComparePage() {
  return <TemplateEditor variant="document" />
}
