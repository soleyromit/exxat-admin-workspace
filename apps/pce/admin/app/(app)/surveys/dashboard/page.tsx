import { redirect } from 'next/navigation'

// The course-evaluation Dashboard moved to a coherent path under the nav group.
// Keep the old /surveys/dashboard URL (and the live pce-three URL) working.
export default function LegacyDashboardRedirect() {
  redirect('/course-evaluation/dashboard')
}
