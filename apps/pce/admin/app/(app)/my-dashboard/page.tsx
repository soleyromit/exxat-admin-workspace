'use client'

import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { FacultyProfileDashboard } from '@/components/pce/faculty-profile-dashboard'

// Faculty self-view of the admin "By Faculty" profile + dashboard, scoped to the
// logged-in faculty (user.facultyId). Reuses FacultyProfileDashboard, but NOT identically:
// `lens="self"` withholds the peer-comparison content that §7.3 bans for faculty
// ("any peer-comparison metric — 'you're at the 60th percentile' included — reverse-encodes
// peer rank"). This prop is the guardrail; do not drop it.
export default function MyDashboardPage() {
  const { user } = usePce()
  const facultyId = user.facultyId ?? ''

  return (
    <>
      <h1 className="sr-only">My Dashboard</h1>
      <SiteHeader title="My Dashboard" />
      <FacultyProfileDashboard facultyId={facultyId} lens="self" />
    </>
  )
}
