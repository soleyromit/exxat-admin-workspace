'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route (Jul 21) — same editor, Builder step lays Course /
// Faculty / General on one scrollable canvas with an outline rail. Compare
// against the aspect-switcher default at /templates/[id].
export default function TemplateCanvasComparePage() {
  return <TemplateEditor variant="canvas" />
}
