'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (variant 3 of 3, iteration 2) — "preview": build on
// the left, live student-facing preview on the right rendering real scales,
// choices, and inputs as the student will see them. Compare against
// /templates/[id] and its /canvas + /document siblings. (Route path kept
// stable across iterations.)
export default function TemplatePreviewComparePage() {
  return <TemplateEditor variant="preview" />
}
