'use client'

/**
 * Standalone-login indicator banner.
 *
 * Aarti's email called out two faculty entry points:
 *   1. Via Prism faculty module (tile/menu) → no banner
 *   2. Standalone exam-management-only login → distinct banner so the user
 *      knows they're in the limited-capability session.
 */

import { SystemBanner } from '@exxatdesignux/ui'
import { useFacultySession } from '@/lib/faculty-session'

export function StandaloneLoginBanner() {
  const { entry, role, hydrated } = useFacultySession()

  if (!hydrated) return null
  if (entry !== 'standalone') return null

  return (
    <SystemBanner
      variant="promo"
      icon="fa-key"
      title="Standalone session"
      dismissible={false}
      aria-label="Standalone exam-management session"
    >
      Signed in via direct exam-management login. Settings access is read-only;
      contact your institution administrator for changes outside this product.
      {' · '}
      <span className="font-semibold uppercase tracking-wider text-[10px]">
        {role === 'faculty' ? 'Faculty' : 'Admin'} — Limited
      </span>
    </SystemBanner>
  )
}
