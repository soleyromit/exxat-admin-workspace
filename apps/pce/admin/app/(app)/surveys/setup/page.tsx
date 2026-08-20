import { redirect } from 'next/navigation'

// /surveys/setup (the prototype's URL) redirects to the canonical Push flow — the
// single survey-scheduling wizard (term-flow reconciliation). The redesigned
// "Courses & Evaluatees" step now lives in Push step 1, not on a separate route.
export default function SurveySetupPage() {
  redirect('/surveys/push')
}
