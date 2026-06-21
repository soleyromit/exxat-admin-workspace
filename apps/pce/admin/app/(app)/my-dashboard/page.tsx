'use client'

import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { FacultyProfileDashboard } from '@/components/pce/faculty-profile-dashboard'

// Faculty self-view of the admin "By Faculty" profile + dashboard, scoped to the
// logged-in faculty (user.facultyId). Reuses FacultyProfileDashboard so it stays
// identical to /admin/faculty/[id]; no Prism affordance for self-view.
export default function MyDashboardPage() {
  const { user } = usePce()
  const facultyId = user.facultyId ?? ''

  return (
    <>
      <h1 className="sr-only">My Dashboard</h1>
      <SiteHeader title="My Dashboard" />
      <FacultyProfileDashboard facultyId={facultyId} />
    </>
  )
}
