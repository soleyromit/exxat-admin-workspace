'use client'

/**
 * Standalone-login indicator banner.
 *
 * Aarti's email called out two faculty entry points:
 *   1. Via Prism faculty module (tile/menu) → no banner
 *   2. Standalone exam-management-only login → distinct banner so the user
 *      knows they're in the limited-capability session.
 */

import { useFacultySession } from '@/lib/faculty-session'

export function StandaloneLoginBanner() {
  const { entry, role, hydrated } = useFacultySession()

  if (!hydrated) return null
  if (entry !== 'standalone') return null

  return (
    <div
      role="status"
      aria-label="Standalone exam-management session"
      className="flex items-center gap-3 px-4 py-2 border-b text-xs text-brand-dark bg-brand-tint border-brand-tint-subtle"
    >
      <i className="fa-light fa-key text-brand text-sm" aria-hidden="true" />
      <span className="font-semibold">Standalone session</span>
      <span className="opacity-80">
        Signed in via direct exam-management login. Settings access is read-only;
        contact your institution administrator for changes outside this product.
      </span>
      <span className="ms-auto opacity-70 text-[10px] uppercase tracking-wider font-bold">
        {role === 'faculty' ? 'Faculty' : 'Admin'} · Limited
      </span>
    </div>
  )
}
