'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (variant 5 of 5) — "columns": Course / Faculty /
// General side by side as board lanes — the most literal "three tabs on one
// page". Section cards are the standard builder cards.
export default function TemplateColumnsComparePage() {
  return <TemplateEditor variant="columns" />
}
