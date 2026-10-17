'use client'
import { useEffect } from 'react'
import { DevReviewHUD } from './dev-review-hud'
export function DevInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    import('./dev-updates').then(m => m.initDevUpdates())
  }, [])
  // Local-only live review overlay (WCAG + DS) — same shared component the
  // assessment-taker uses. Stripped from prod via the NODE_ENV gate in layout.tsx.
  return <DevReviewHUD product="apps/exam-management/admin" />
}
