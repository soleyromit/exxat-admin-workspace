'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (Jul 21, variant 3 of 3) — master-detail builder: the
// whole template structure stays visible in a tree while one aspect overview
// or section is edited in the center. Compare against /templates/[id] and its
// /canvas + /document siblings.
export default function TemplateFocusComparePage() {
  return <TemplateEditor variant="focus" />
}
