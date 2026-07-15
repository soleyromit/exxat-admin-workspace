import { redirect } from 'next/navigation'

export default function RootPage() {
  // Home = Course Evaluation Dashboard (the Evaluations list nav was removed; the
  // dashboard now hosts the evaluations table + push/activate actions).
  redirect('/analytics')
}

