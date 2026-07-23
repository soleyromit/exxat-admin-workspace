'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (variant 4 of 5) — "minimal": bare essentials. One
// narrow centered column, plain headings, text-only actions, no chips or
// rails or dashed panels. Section cards are the standard builder cards.
export default function TemplateMinimalComparePage() {
  return <TemplateEditor variant="minimal" />
}
