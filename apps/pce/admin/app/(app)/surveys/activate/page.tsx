import { redirect } from 'next/navigation'

// Activate wizard retired (Romit, Jun 2026) — Push is the single survey-scheduling
// flow (scope · distribution · communication, Settings-aware). Its old dates/email
// steps now live in Push. Kept as a redirect so existing links still resolve.
export default function ActivatePage() {
  redirect('/surveys/push')
}
