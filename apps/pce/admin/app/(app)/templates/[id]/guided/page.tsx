'use client'

import { TemplateEditor } from '@/components/pce/template-editor'

// Design-compare route — "guided": the same sequential stops as /tabs, carried
// in a left checklist rail (Mercury onboarding pattern) so no chrome sits
// above the content. Section cards are the standard builder cards.
export default function TemplateGuidedComparePage() {
  return <TemplateEditor variant="guided" />
}
