import { redirect } from 'next/navigation'

/**
 * /my-analytics → /my-dashboard.
 *
 * The faculty IA is two surfaces (2026-07-16): My Surveys answers "what needs me now",
 * My Dashboard answers "how am I doing" — and its Trends section is where longitudinal
 * analytics lands when it ships (15Five's pattern: reporting inside the one personal
 * dashboard, not a third nav slot). A coming-soon page holding primary navigation paid
 * rent with nothing in it; the route survives only so old links land somewhere true.
 */
export default function MyAnalyticsRedirect() {
  redirect('/my-dashboard')
}
