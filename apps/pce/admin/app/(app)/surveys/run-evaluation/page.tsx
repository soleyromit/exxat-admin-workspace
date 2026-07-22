import { redirect } from 'next/navigation'

// Was an alias for the retired Activate wizard → now points at Push, the single
// survey-scheduling flow.
export default function RunEvaluationPage() {
  redirect('/surveys/push')
}
