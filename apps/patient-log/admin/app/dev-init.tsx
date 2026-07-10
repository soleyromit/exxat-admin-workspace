'use client'
import { DevReviewHUD } from './dev-review-hud'
// Local-only live review overlay (WCAG + DS). Mounted behind the NODE_ENV gate
// in layout.tsx; the isLocalHost guard inside keeps it off any deployed origin.
export function DevInit() {
  return <DevReviewHUD product="apps/patient-log/admin" />
}
