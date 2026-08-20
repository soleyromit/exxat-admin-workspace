'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route — "tabs": Monil's Jul 21 horizontal proposal. One
// aspect on stage at a time, worked left to right; each faculty role set is
// a first-class tab; empty aspects gate on upload-or-manual. Section cards
// are the standard builder cards.
export default function TemplateTabsComparePage() {
  return <TemplateEditor variant="tabs" />
}
